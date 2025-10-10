import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const PLATFORM_WALLET = process.env.PLATFORM_WALLET_ADDRESS || '13H5V7W5YHNNXh5bhMxXLEw4boe6R6mxEG5SFAThYyYteFLy';
const ASSET_HUB_RPC = 'wss://polkadot-asset-hub-rpc.polkadot.io';
const USDT_ASSET_ID = 1984;

// THE ONE AND ONLY ESCROW WALLET
const ESCROW_SEED = process.env.ESCROW_WALLET_SEED!;

export async function POST(request: Request) {
  try {
    const { projectId, creatorAddress } = await request.json();

    console.log('[WITHDRAW] Starting withdrawal for project:', projectId);
    console.log('[WITHDRAW] Creator address:', creatorAddress);

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.error('[WITHDRAW] Project not found:', projectError);
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    console.log('[WITHDRAW] Project found:', {
      id: project.id,
      status: project.status,
      currentFunding: project.current_funding,
      goalAmount: project.goal_amount,
      escrowAddress: project.escrow_wallet_address
    });

    if (project.creator_address !== creatorAddress) {
      console.error('[WITHDRAW] Unauthorized: creator address mismatch');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (project.current_funding < project.goal_amount) {
      console.error('[WITHDRAW] Not fully funded');
      return NextResponse.json({ error: 'Project not fully funded' }, { status: 400 });
    }

    // Check if already withdrawn
    if (project.withdrawal_tx_hash) {
      console.log('[WITHDRAW] Already withdrawn');
      return NextResponse.json({
        error: 'Funds already withdrawn',
        txHash: project.withdrawal_tx_hash
      }, { status: 400 });
    }

    // Creator receives 100% of available balance
    // Platform fee was already taken during investment (2% deducted from lenders)
    const totalAmount = project.current_funding;
    const creatorAmount = totalAmount;
    const platformFeeAmount = 0; // No additional fee - already collected

    console.log('[WITHDRAW] Amounts:', {
      total: totalAmount,
      creator: creatorAmount,
      creatorUnits: Math.floor(creatorAmount * 1000000),
      platformFee: platformFeeAmount
    });

    // Get THE escrow account with derivation path //1
    await cryptoWaitReady();
    const keyring = new Keyring({ type: 'sr25519' });
    const baseAccount = keyring.addFromMnemonic(ESCROW_SEED);
    const escrowAccount = baseAccount.derive('//1');

    console.log('[WITHDRAW] Escrow account:', escrowAccount.address);
    console.log('[WITHDRAW] Project escrow:', project.escrow_wallet_address);

    // Verify addresses match
    if (escrowAccount.address !== project.escrow_wallet_address) {
      console.error('[WITHDRAW] Address mismatch:', {
        derived: escrowAccount.address,
        stored: project.escrow_wallet_address
      });
      return NextResponse.json({
        error: 'Escrow account verification failed',
        details: {
          derived: escrowAccount.address,
          expected: project.escrow_wallet_address
        }
      }, { status: 500 });
    }

    console.log('[WITHDRAW] Address verification passed');

    // Connect to Asset Hub
    console.log('[WITHDRAW] Connecting to Asset Hub...');
    const wsProvider = new WsProvider(ASSET_HUB_RPC);
    const api = await ApiPromise.create({ provider: wsProvider });




    // Transfer full amount to creator
    const creatorUnits = Math.floor(creatorAmount * 1000000);
    
    const batchTx = api.tx.assets.transfer(USDT_ASSET_ID, creatorAddress, creatorUnits);

    console.log('[WITHDRAW] Signing and sending transaction...');

    // Sign and send
    const hash = await new Promise<string>((resolve, reject) => {
      batchTx.signAndSend(escrowAccount, ({ status, events, dispatchError }) => {
        console.log('[WITHDRAW] Transaction status:', status.type);

        if (status.isInBlock) {
          console.log('[WITHDRAW] In block:', status.asInBlock.toHex());
        }

        if (status.isFinalized) {
          console.log('[WITHDRAW] Finalized:', status.asFinalized.toHex());

          if (dispatchError) {
            if (dispatchError.isModule) {
              const decoded = api.registry.findMetaError(dispatchError.asModule);
              console.error('[WITHDRAW] Error:', decoded);
              reject(new Error(`${decoded.section}.${decoded.name}: ${decoded.docs}`));
            } else {
              console.error('[WITHDRAW] Error:', dispatchError.toString());
              reject(new Error(dispatchError.toString()));
            }
          } else {
            resolve(status.asFinalized.toHex());
          }
        }
      }).catch(reject);
    });

    console.log('[WITHDRAW] Transaction successful:', hash);

    // Update project status
    const { error: updateError } = await supabase
      .from('projects')
      .update({
        status: 'completed',
        withdrawal_tx_hash: hash,
        withdrawal_date: new Date().toISOString(),
        platform_fee_paid: platformFeeAmount
      })
      .eq('id', projectId)
      .is('withdrawal_tx_hash', null);

    if (updateError) {
      console.error('[WITHDRAW] Failed to update project:', updateError);
    }

    await api.disconnect();

    return NextResponse.json({
      success: true,
      txHash: hash,
      creatorAmount,
      platformFee: platformFeeAmount
    });

  } catch (error: any) {
    console.error('[WITHDRAW] Error:', error);
    return NextResponse.json({
      error: error.message || 'Withdrawal failed'
    }, { status: 500 });
  }
}
