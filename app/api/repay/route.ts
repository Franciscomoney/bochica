import { NextResponse } from 'next/server';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { createClient } from '@supabase/supabase-js';

const ASSET_HUB_RPC = 'wss://polkadot-asset-hub-rpc.polkadot.io';
const USDT_ASSET_ID = 1984;

/**
 * Repayment API Endpoint
 * Checks if a creator has repaid their loan by monitoring the escrow wallet
 *
 * POST /api/repay
 * Body: { projectId: string, checkerType?: 'manual' | 'automated' | 'api' }
 *
 * Returns:
 * - success: boolean
 * - repaid: boolean
 * - expectedAmount: number (capital + interest)
 * - currentBalance: number
 * - remaining: number (if not fully repaid)
 * - message: string
 */
export async function POST(request: Request) {
  try {
    const { projectId, checkerType = 'manual' } = await request.json();

    // 1. Validate input
    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing projectId' },
        { status: 400 }
      );
    }

    // 2. Get project with escrow address
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // 3. Check project has been withdrawn
    if (project.status !== 'borrowing' && project.status !== 'repaid') {
      return NextResponse.json(
        {
          error: 'Project has not been withdrawn yet',
          currentStatus: project.status,
          message: 'Only projects with status "borrowing" can be checked for repayment'
        },
        { status: 400 }
      );
    }

    // 4. Get the associated loan record
    const { data: loan, error: loanError } = await supabase
      .from('loans')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (loanError || !loan) {
      return NextResponse.json(
        { error: 'Loan record not found' },
        { status: 404 }
      );
    }

    // 5. Check if escrow wallet exists
    if (!project.escrow_wallet_address) {
      return NextResponse.json(
        { error: 'No escrow wallet configured for this project' },
        { status: 400 }
      );
    }

    // 6. Connect to Asset Hub and check escrow balance
    console.log('[REPAYMENT] Checking escrow wallet:', project.escrow_wallet_address);
    const wsProvider = new WsProvider(ASSET_HUB_RPC);
    const api = await ApiPromise.create({ provider: wsProvider });

    const balanceData = await api.query.assets.account(
      USDT_ASSET_ID,
      project.escrow_wallet_address
    );

    // 7. Extract balance (convert from micro-units to USDT)
    const balanceOption = balanceData.unwrapOr(null);
    const currentBalance = balanceOption
      ? Number(balanceOption.balance.toString()) / 1_000_000
      : 0;

    console.log('[REPAYMENT] Current escrow balance:', currentBalance, 'USDT');

    // 8. Calculate expected repayment
    const totalRepayment = parseFloat(loan.total_repayment || '0');

    console.log('[REPAYMENT] Expected repayment:', totalRepayment, 'USDT');

    // 9. Record this check in the audit trail
    await supabase.from('repayment_checks').insert({
      project_id: projectId,
      escrow_balance: currentBalance,
      expected_amount: totalRepayment,
      is_fully_repaid: currentBalance >= totalRepayment,
      checker_type: checkerType,
      notes: `Balance: ${currentBalance} USDT, Expected: ${totalRepayment} USDT`
    });

    // 10. Update last check timestamp
    await supabase
      .from('projects')
      .update({ last_repayment_check: new Date().toISOString() })
      .eq('id', projectId);

    // 11. Check if repayment has been received
    if (currentBalance >= totalRepayment) {
      console.log('[REPAYMENT] Full repayment detected!');

      // 12. Mark project as repaid
      await supabase
        .from('projects')
        .update({
          status: 'repaid',
          repayment_date: new Date().toISOString(),
          repayment_amount: currentBalance
        })
        .eq('id', projectId);

      // 13. Update loan record
      await supabase
        .from('loans')
        .update({
          status: 'repaid',
          actual_repayment_date: new Date().toISOString(),
          actual_repayment_amount: currentBalance
        })
        .eq('project_id', projectId);

      await api.disconnect();

      return NextResponse.json({
        success: true,
        repaid: true,
        expectedAmount: totalRepayment,
        receivedAmount: currentBalance,
        overpayment: currentBalance - totalRepayment,
        message: 'Repayment confirmed! Project marked as fully repaid.',
        loanDetails: {
          capital: parseFloat(loan.amount),
          interest: parseFloat(loan.interest_amount),
          totalRepayment: totalRepayment,
          dueDate: loan.due_date
        }
      });
    } else {
      // 14. Repayment not complete yet
      const remaining = totalRepayment - currentBalance;
      console.log('[REPAYMENT] Waiting for repayment. Remaining:', remaining, 'USDT');

      await api.disconnect();

      return NextResponse.json({
        success: true,
        repaid: false,
        expectedAmount: totalRepayment,
        currentBalance: currentBalance,
        remaining: remaining,
        percentageRepaid: (currentBalance / totalRepayment) * 100,
        message: `Waiting for full repayment. ${remaining.toFixed(2)} USDT remaining.`,
        escrowAddress: project.escrow_wallet_address,
        loanDetails: {
          capital: parseFloat(loan.amount),
          interest: parseFloat(loan.interest_amount),
          totalRepayment: totalRepayment,
          dueDate: loan.due_date
        }
      });
    }
  } catch (error: any) {
    console.error('[REPAYMENT] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to check repayment status',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to retrieve repayment status without checking blockchain
 * Useful for quick status checks from cached database values
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing projectId parameter' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get project status
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Get loan details
    const { data: loan } = await supabase
      .from('loans')
      .select('*')
      .eq('project_id', projectId)
      .single();

    // Get recent repayment checks
    const { data: recentChecks } = await supabase
      .from('repayment_checks')
      .select('*')
      .eq('project_id', projectId)
      .order('checked_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      project: {
        id: project.id,
        name: project.name,
        status: project.status,
        escrowAddress: project.escrow_wallet_address,
        repaymentDate: project.repayment_date,
        repaymentAmount: project.repayment_amount,
        lastCheck: project.last_repayment_check
      },
      loan: loan ? {
        amount: parseFloat(loan.amount),
        interestRate: parseFloat(loan.interest_rate),
        interestAmount: parseFloat(loan.interest_amount),
        totalRepayment: parseFloat(loan.total_repayment),
        status: loan.status,
        dueDate: loan.due_date,
        actualRepaymentDate: loan.actual_repayment_date,
        actualRepaymentAmount: loan.actual_repayment_amount
      } : null,
      recentChecks: recentChecks || []
    });
  } catch (error: any) {
    console.error('[REPAYMENT GET] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get repayment status' },
      { status: 500 }
    );
  }
}
