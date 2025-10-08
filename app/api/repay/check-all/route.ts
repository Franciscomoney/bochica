import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Automated Repayment Checker
 * This endpoint can be called periodically (via cron or external scheduler)
 * to check all active loans for repayment
 *
 * GET /api/repay/check-all
 * Query params: ?apiKey=YOUR_SECRET_KEY (for security)
 *
 * Returns:
 * - totalChecked: number
 * - newlyRepaid: number
 * - stillPending: number
 * - results: array of check results
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('apiKey');

    // Simple API key protection (in production, use a more robust auth system)
    const CHECKER_API_KEY = process.env.REPAYMENT_CHECKER_API_KEY || 'bochica-repayment-checker-2025';

    if (apiKey !== CHECKER_API_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid API key' },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get all projects in "borrowing" status (awaiting repayment)
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, escrow_wallet_address')
      .eq('status', 'borrowing');

    if (projectsError) {
      console.error('[AUTO-CHECKER] Error fetching projects:', projectsError);
      return NextResponse.json(
        { error: 'Failed to fetch projects' },
        { status: 500 }
      );
    }

    if (!projects || projects.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No projects awaiting repayment',
        totalChecked: 0,
        newlyRepaid: 0,
        stillPending: 0,
        results: []
      });
    }

    console.log(`[AUTO-CHECKER] Checking ${projects.length} projects for repayment...`);

    const results = [];
    let newlyRepaid = 0;
    let stillPending = 0;

    // Check each project
    for (const project of projects) {
      try {
        // Call the repayment check API for this project
        const checkResponse = await fetch(
          `${process.env.NEXT_PUBLIC_APP_URL || 'https://51.178.253.51:8100'}/api/repay`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId: project.id,
              checkerType: 'automated'
            })
          }
        );

        const checkResult = await checkResponse.json();

        if (checkResult.success) {
          if (checkResult.repaid) {
            newlyRepaid++;
            console.log(`[AUTO-CHECKER] ✓ Project "${project.name}" is now fully repaid!`);
          } else {
            stillPending++;
            console.log(
              `[AUTO-CHECKER] - Project "${project.name}" still pending: ${checkResult.remaining?.toFixed(2)} USDT remaining`
            );
          }

          results.push({
            projectId: project.id,
            projectName: project.name,
            repaid: checkResult.repaid,
            currentBalance: checkResult.currentBalance,
            expectedAmount: checkResult.expectedAmount,
            remaining: checkResult.remaining,
            percentageRepaid: checkResult.percentageRepaid
          });
        } else {
          console.error(
            `[AUTO-CHECKER] Error checking project "${project.name}":`,
            checkResult.error
          );
          results.push({
            projectId: project.id,
            projectName: project.name,
            error: checkResult.error
          });
        }
      } catch (error: any) {
        console.error(
          `[AUTO-CHECKER] Exception checking project "${project.name}":`,
          error.message
        );
        results.push({
          projectId: project.id,
          projectName: project.name,
          error: error.message
        });
      }

      // Small delay between checks to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const summary = {
      success: true,
      checkedAt: new Date().toISOString(),
      totalChecked: projects.length,
      newlyRepaid,
      stillPending,
      results
    };

    console.log('[AUTO-CHECKER] Summary:', {
      totalChecked: summary.totalChecked,
      newlyRepaid: summary.newlyRepaid,
      stillPending: summary.stillPending
    });

    return NextResponse.json(summary);
  } catch (error: any) {
    console.error('[AUTO-CHECKER] Error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to check repayments',
        details: error.toString()
      },
      { status: 500 }
    );
  }
}
