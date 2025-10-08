const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyProject() {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", "b854093b-c1e1-4c6e-9554-e1c92934cdc9")
    .single();
  
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("\n✅ Project verification:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("ID:", data.id);
    console.log("Title:", data.title);
    console.log("Creator:", data.creator_address);
    console.log("Goal Amount:", data.goal_amount);
    console.log("Status:", data.status);
    console.log("\n🔐 Escrow Details:");
    console.log("Escrow Address:", data.escrow_wallet_address);
    console.log("Seed Encrypted:", data.escrow_seed_encrypted ? "YES" : "NO");
    console.log("Seed Length:", data.escrow_seed_encrypted ? data.escrow_seed_encrypted.length : 0);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  }
}

verifyProject();
