const { createClient } = require("@supabase/supabase-js");
const { generateEscrowWallet } = require("./src/utils/escrow");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testCreateProject() {
  try {
    console.log("Generating escrow wallet...");
    const escrowWallet = await generateEscrowWallet();
    console.log("Escrow address:", escrowWallet.address);
    console.log("Seed encrypted:", escrowWallet.seedEncrypted.substring(0, 50) + "...");
    
    console.log("\nCreating test project with escrow...");
    const { data, error } = await supabase
      .from("projects")
      .insert([{
        creator_address: "13H5V7W5YHNNXh5bhMxXLEw4boe6R6mxEG5SFAThYyYteFLy",
        title: "Test Project with Escrow - " + new Date().toISOString(),
        description: "Testing escrow wallet generation and storage",
        goal_amount: 1000,
        status: "active",
        escrow_wallet_address: escrowWallet.address,
        escrow_seed_encrypted: escrowWallet.seedEncrypted
      }])
      .select();
    
    if (error) {
      console.error("\n❌ Error creating project:", error);
      process.exit(1);
    } else {
      console.log("\n✅ SUCCESS! Project created with escrow:");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("Project ID:", data[0].id);
      console.log("Title:", data[0].title);
      console.log("Escrow Address:", data[0].escrow_wallet_address);
      console.log("Seed Encrypted:", data[0].escrow_seed_encrypted ? "YES (" + data[0].escrow_seed_encrypted.length + " chars)" : "NO");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("\n🔍 Verify in Supabase:");
      console.log("   https://fvehyzvdffnxrmupwgtv.supabase.co/project/fvehyzvdffnxrmupwgtv/editor");
      console.log("   Table: projects");
      console.log("   Project ID:", data[0].id);
    }
  } catch (err) {
    console.error("\n❌ Unexpected error:", err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

testCreateProject();
