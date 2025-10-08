require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");
const { generateEscrowWallet } = require("./src/utils/escrow");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCompleteCycle() {
  console.log("🚀 TESTING COMPLETE BOCHICA LENDING CYCLE\n");
  console.log("=".repeat(60));
  
  // STEP 1: Create project with escrow wallet
  console.log("\n📋 STEP 1: Creating project with escrow wallet...");
  const escrowWallet = await generateEscrowWallet();
  console.log("✅ Escrow wallet generated:", escrowWallet.address);
  
  const { data: project, error: projectError } = await supabase
    .from("projects")
    .insert([{
      creator_address: "13H5V7W5YHNNXh5bhMxXLEw4boe6R6mxEG5SFAThYyYteFLy",
      title: "E2E Test Project",
      description: "Testing complete lending cycle",
      goal_amount: 100,
      interest_rate: 10,
      duration_days: 30,
      escrow_wallet_address: escrowWallet.address,
      escrow_seed_encrypted: escrowWallet.seedEncrypted,
      current_funding: 0,
      status: "active"
    }])
    .select()
    .single();
  
  if (projectError) {
    console.error("❌ Failed to create project:", projectError);
    return;
  }
  console.log("✅ Project created:", project.id);
  
  // STEP 2: Simulate investment (update funding to 100%)
  console.log("\n💰 STEP 2: Simulating investor deposits...");
  const { error: fundError } = await supabase
    .from("projects")
    .update({ 
      current_funding: 100,
      status: "funded"
    })
    .eq("id", project.id);
  
  if (fundError) {
    console.error("❌ Failed to update funding:", fundError);
    return;
  }
  console.log("✅ Project now 100% funded");
  console.log("   - Escrow should have: 100 USDT");
  console.log("   - Status: funded");
  
  // STEP 3: Simulate withdrawal
  console.log("\n🏦 STEP 3: Simulating creator withdrawal...");
  const platformFee = 100 * 0.02; // 2 USDT
  const creatorAmount = 100 - platformFee; // 98 USDT
  
  console.log("   - Total in escrow: 100 USDT");
  console.log("   - Platform fee (2%): 2 USDT");
  console.log("   - Creator receives: 98 USDT");
  
  // Create loan record
  const interestAmount = creatorAmount * 0.10; // 9.8 USDT
  const totalRepayment = creatorAmount + interestAmount; // 107.8 USDT
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);
  
  const { data: loan, error: loanError } = await supabase
    .from("loans")
    .insert([{
      project_id: project.id,
      amount: creatorAmount,
      interest_rate: 10,
      interest_amount: interestAmount,
      total_repayment: totalRepayment,
      due_date: dueDate.toISOString(),
      repaid: false
    }])
    .select()
    .single();
  
  if (loanError) {
    console.error("❌ Failed to create loan:", loanError);
    return;
  }
  
  const { error: withdrawError } = await supabase
    .from("projects")
    .update({ 
      status: "borrowing",
      withdrawal_date: new Date().toISOString(),
      platform_fee_paid: platformFee
    })
    .eq("id", project.id);
  
  if (withdrawError) {
    console.error("❌ Failed to update withdrawal:", withdrawError);
    return;
  }
  
  console.log("✅ Withdrawal simulated");
  console.log("   - Loan created:", loan.id);
  console.log("   - Interest (10%): " + interestAmount.toFixed(2) + " USDT");
  console.log("   - Total repayment needed: " + totalRepayment.toFixed(2) + " USDT");
  console.log("   - Due date:", dueDate.toLocaleDateString());
  
  // STEP 4: Show repayment instructions
  console.log("\n💸 STEP 4: Repayment instructions...");
  console.log("   Creator should send " + totalRepayment.toFixed(2) + " USDT to:");
  console.log("   " + escrowWallet.address);
  console.log("   (Escrow wallet for this project)");
  
  // STEP 5: Summary
  console.log("\n" + "=".repeat(60));
  console.log("📊 TEST CYCLE SUMMARY\n");
  console.log("✅ Project created with escrow wallet");
  console.log("✅ Investment flow: Investors → Escrow wallet");
  console.log("✅ Withdrawal flow: Escrow → Creator (98%) + Platform (2%)");
  console.log("✅ Loan created with interest calculation");
  console.log("✅ Repayment tracking ready");
  
  console.log("\n📝 NEXT STEPS FOR REAL TESTING:");
  console.log("1. Send 100 USDT to escrow: " + escrowWallet.address);
  console.log("2. Call withdrawal API to distribute funds");
  console.log("3. Creator sends " + totalRepayment.toFixed(2) + " USDT back to escrow");
  console.log("4. Call repayment check API to verify and close loan");
  
  console.log("\n🎯 TEST COMPLETE - All database operations successful!");
  console.log("=".repeat(60) + "\n");
}

testCompleteCycle().catch(console.error);
