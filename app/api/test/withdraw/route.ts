import { NextRequest, NextResponse } from 'next/server';
import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { cryptoWaitReady, encodeAddress } from '@polkadot/util-crypto';

export async function POST(request: NextRequest) {
  try {
    const { amount, recipientAddress } = await request.json();

    if (!amount || !recipientAddress) {
      return NextResponse.json(
        { success: false, error: 'Missing amount or recipientAddress' },
        { status: 400 }
      );
    }

    // Connect to Paseo
    const wsProvider = new WsProvider('wss://paseo.rpc.amforc.com');
    const api = await ApiPromise.create({ provider: wsProvider });

    // Initialize escrow wallet (//1)
    await cryptoWaitReady();
    const keyring = new Keyring({ type: 'sr25519' });
    const root = keyring.addFromMnemonic(process.env.ESCROW_WALLET_SEED!);
    const escrowWallet = root.derive('//1');

    // Transfer from escrow to recipient
    const amountUnits = amount * 10**10;
    const transfer = api.tx.balances.transferKeepAlive(recipientAddress, amountUnits);

    const txHash = await new Promise<string>((resolve, reject) => {
      transfer.signAndSend(escrowWallet, ({ status, dispatchError }) => {
        if (status.isFinalized) {
          if (dispatchError) {
            if (dispatchError.isModule) {
              const decoded = api.registry.findMetaError(dispatchError.asModule);
              reject(new Error(`${decoded.section}.${decoded.name}`));
            } else {
              reject(new Error(dispatchError.toString()));
            }
          } else {
            resolve(status.asFinalized.toHex());
          }
        }
      }).catch(reject);
    });

    await api.disconnect();

    return NextResponse.json({
      success: true,
      txHash,
      amount,
      from: encodeAddress(escrowWallet.publicKey, 0),
      to: recipientAddress
    });

  } catch (error: any) {
    console.error('Test withdrawal error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
