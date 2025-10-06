import { NextResponse } from 'next/server';
import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { createClient } from '@supabase/supabase-js';

const ESCROW_WALLET_SEED = process.env.ESCROW_WALLET_SEED!;
const USDT_ASSET_ID = 1984;

export async function POST(request: Request) {
  try {
    const { projectId, creatorAddress } = await request.json();

    // Validate inputs
    if (!projectId || !creatorAddress) {
      return NextResponse.json({
        error: 'Missing projectId or creatorAddress'
      }, { status: 400 });
    }

    // Check escrow seed
    if (!ESCROW_WALLET_SEED) {
      console.error('ESCROW_WALLET_SEED not configured');
      return NextResponse.json({
        error: 'Server configuration error'
      }, { status: 500 });
    }

    // 1. Connect to Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 2. Get project and verify conditions
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json({
        error: 'Project not found'
      }, { status: 404 });
    }

    // Verify creator matches
    if (project.creator_address !== creatorAddress) {
      return NextResponse.json({
        error: 'Unauthorized: You are not the project creator'
      }, { status: 403 });
    }

    // Verify project is fully funded
    if (project.current_funding < project.goal_amount) {
      return NextResponse.json({
        error: 'Project must be fully funded before withdrawal'
      }, { status: 400 });
    }

    // Verify project status
    if (project.status !== 'funded') {
      return NextResponse.json({
        error: `Cannot withdraw from project with status: ${project.status}`
      }, { status: 400 });
    }

    // 3. Get project balance
    const { data: balance, error: balanceError } = await supabase
      .from('project_balances')
      .select('available_balance, withdrawn_balance')
      .eq('project_id', projectId)
      .single();

    if (balanceError || !balance || balance.available_balance <= 0) {
      return NextResponse.json({
        error: 'No funds available for withdrawal'
      }, { status: 400 });
    }

    const amount = parseFloat(balance.available_balance);

    console.log(`[WITHDRAWAL] Processing ${amount} USDT for project ${projectId} to ${creatorAddress}`);

    // 4. Connect to Polkadot Asset Hub
    const wsProvider = new WsProvider('wss://polkadot-asset-hub-rpc.polkadot.io');
    const api = await ApiPromise.create({ provider: wsProvider });

    // 5. Load escrow wallet from seed
    const keyring = new Keyring({ type: 'sr25519' });
    const escrowAccount = keyring.addFromUri(ESCROW_WALLET_SEED);

    console.log(`[WITHDRAWAL] Escrow wallet: ${escrowAccount.address}`);

    // 6. Create transfer transaction
    const amountInUnits = Math.floor(amount * 1_000_000).toString(); // USDT has 6 decimals
    const transfer = api.tx.assets.transfer(
      USDT_ASSET_ID,
      creatorAddress,
      amountInUnits
    );

    // 7. Sign and send with escrow wallet
    console.log(`[WITHDRAWAL] Submitting transaction...`);

    const txHash = await new Promise<string>((resolve, reject) => {
      let unsubscribe: () => void;

      transfer.signAndSend(escrowAccount, ({ status, txHash, events }) => {
        console.log(`[WITHDRAWAL] Transaction status: ${status.type}`);

        if (status.isInBlock) {
          console.log(`[WITHDRAWAL] Transaction included in block: ${txHash.toHex()}`);
          resolve(txHash.toHex());
          if (unsubscribe) unsubscribe();
        } else if (status.isFinalized) {
          console.log(`[WITHDRAWAL] Transaction finalized: ${txHash.toHex()}`);
          resolve(txHash.toHex());
          if (unsubscribe) unsubscribe();
        }
      }).then(unsub => {
        unsubscribe = unsub;
      }).catch(reject);

      // Timeout after 60 seconds
      setTimeout(() => {
        if (unsubscribe) unsubscribe();
        reject(new Error('Transaction timeout'));
      }, 60000);
    });

    console.log(`[WITHDRAWAL] Transaction hash: ${txHash}`);

    // 8. Calculate loan details
    const interestAmount = (amount * project.interest_rate) / 100;
    const totalRepayment = amount + interestAmount;
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days from now

    // 9. Create loan record
    const { error: loanError } = await supabase
      .from('loans')
      .insert({
        project_id: projectId,
        borrower_address: creatorAddress,
        amount: amount,
        interest_rate: project.interest_rate,
        interest_amount: interestAmount,
        total_repayment: totalRepayment,
        status: 'active',
        due_date: dueDate.toISOString(),
        blockchain_tx: txHash
      });

    if (loanError) {
      console.error('[WITHDRAWAL] Failed to create loan record:', loanError);
      // Don't fail the withdrawal, just log it
    }

    // 10. Update project balance
    await supabase
      .from('project_balances')
      .update({
        available_balance: '0',
        withdrawn_balance: amount.toString(),
        updated_at: new Date().toISOString()
      })
      .eq('project_id', projectId);

    // 11. Update project status to borrowing
    await supabase
      .from('projects')
      .update({ status: 'borrowing' })
      .eq('id', projectId);

    console.log(`[WITHDRAWAL] Success! ${amount} USDT sent to ${creatorAddress}`);

    return NextResponse.json({
      success: true,
      txHash,
      amount,
      interestRate: project.interest_rate,
      totalRepayment,
      dueDate: dueDate.toISOString()
    });

  } catch (error: any) {
    console.error('[WITHDRAWAL] Error:', error);
    return NextResponse.json({
      error: error.message || 'Withdrawal failed'
    }, { status: 500 });
  }
}
