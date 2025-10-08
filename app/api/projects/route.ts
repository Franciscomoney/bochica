import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// THE ONE AND ONLY ESCROW WALLET - NO MORE COMPLICATIONS!
const ESCROW_SEED = process.env.ESCROW_WALLET_SEED!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, goal_amount, interest_rate, creator_address } = body;

    if (!title || !description || !goal_amount || !creator_address) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const goalAmount = parseFloat(goal_amount);
    const interestRate = parseFloat(interest_rate || '5');

    if (isNaN(goalAmount) || goalAmount <= 0) {
      return NextResponse.json({ error: 'Invalid goal amount' }, { status: 400 });
    }

    if (isNaN(interestRate) || interestRate < 0 || interestRate > 100) {
      return NextResponse.json({ error: 'Interest rate must be between 0% and 100%' }, { status: 400 });
    }

    // Use THE SAME escrow wallet with derivation path //1
    await cryptoWaitReady();
    const keyring = new Keyring({ type: 'sr25519' });
    const baseAccount = keyring.addFromMnemonic(ESCROW_SEED);
    const escrowAccount = baseAccount.derive('//1');

    console.log('Using escrow wallet:', escrowAccount.address);

    // Create project - NO encrypted seed, we use env variable!
    const { data, error: dbError } = await supabase
      .from('projects')
      .insert({
        title,
        description,
        goal_amount: goalAmount,
        interest_rate: interestRate,
        current_funding: 0,
        status: 'active',
        creator_address,
        escrow_wallet_address: escrowAccount.address,
        escrow_seed_encrypted: null, // Don't store it, we use env!
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error(dbError.message);
    }

    return NextResponse.json({
      success: true,
      project: {
        ...data,
        escrow_seed_encrypted: undefined,
      }
    });

  } catch (error: any) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create project' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const sanitizedProjects = data.map(project => ({
      ...project,
      escrow_seed_encrypted: undefined,
    }));

    return NextResponse.json({ projects: sanitizedProjects });
  } catch (error: any) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
