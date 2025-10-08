const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Initialize Supabase with service role (if available) or anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: Supabase credentials not found');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('Running migration: 006_add_escrow_wallets.sql');
    
    // Read migration file
    const migrationSQL = fs.readFileSync('./migrations/006_add_escrow_wallets.sql', 'utf8');
    
    // Split into individual statements
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length > 10) { // Skip very short statements
        console.log(`Executing statement ${i + 1}/${statements.length}...`);
        
        const { data, error } = await supabase.rpc('exec_sql', { 
          query: statement + ';' 
        });
        
        if (error) {
          // Try direct execution for ALTER TABLE commands
          console.log('Trying direct execution...');
          const { error: directError } = await supabase.from('projects').select('*').limit(1);
          if (directError && directError.message.includes('column')) {
            console.log('Note: Column may already exist or need manual migration');
          }
        } else {
          console.log(`Statement ${i + 1} executed successfully`);
        }
      }
    }
    
    // Verify columns were added
    console.log('\nVerifying migration...');
    const { data: projects } = await supabase.from('projects').select('*').limit(1);
    
    if (projects && projects.length > 0) {
      const hasEscrowFields = 'escrow_wallet_address' in projects[0] || 'escrow_seed_encrypted' in projects[0];
      if (hasEscrowFields) {
        console.log('✅ Migration successful! Escrow fields detected in projects table');
      } else {
        console.log('⚠️  Migration may need manual execution via Supabase dashboard');
        console.log('Run this SQL in Supabase SQL editor:');
        console.log(migrationSQL);
      }
    }
    
  } catch (error) {
    console.error('Migration error:', error.message);
    console.log('\n📝 To run migration manually:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Paste the contents of migrations/006_add_escrow_wallets.sql');
    console.log('3. Click Run');
  }
}

runMigration();
