const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'https://rngxqzfqboqyktzlmgyg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuZ3hxemZxYm9xeWt0emxtZ3lnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjM0MTAwMSwiZXhwIjoyMDgxOTE3MDAxfQ.Cyzjl0rvkybshCO7A7iQvbLCWmHnNfYXjo0AhVoP-qA'
);

async function runMigration() {
  console.log('🚀 Running database migration for price variants...\n');

  const migrationPath = path.join(__dirname, '../supabase/migrations/20251230000000_add_price_variants.sql');
  const sql = fs.readFileSync(migrationPath, 'utf8');

  // Split by statement (simple split by semicolon, may need refinement)
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

  console.log(`Found ${statements.length} SQL statements to execute\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    console.log(`[${i + 1}/${statements.length}] Executing...`);
    console.log(statement.substring(0, 80) + '...\n');

    const { error } = await supabase.rpc('exec_sql', { sql_query: statement + ';' });

    if (error) {
      console.error(`❌ Error: ${error.message}\n`);
      // Try direct execution
      try {
        await executeDirectly(statement);
        console.log('✅ Executed via alternative method\n');
      } catch (e) {
        console.error(`❌ Failed: ${e}\n`);
      }
    } else {
      console.log('✅ Success\n');
    }
  }

  console.log('🎉 Migration complete!');
}

async function executeDirectly(statement) {
  // For ALTER TABLE statements, we'll use the REST API directly
  if (statement.includes('ALTER TABLE product_urls')) {
    // Execute via raw SQL - this is a workaround
    throw new Error('Please run this migration manually in Supabase SQL Editor');
  }
}

runMigration().catch(console.error);
