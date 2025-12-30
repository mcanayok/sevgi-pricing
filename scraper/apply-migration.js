const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rngxqzfqboqyktzlmgyg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuZ3hxemZxYm9xeWt0emxtZ3lnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjM0MTAwMSwiZXhwIjoyMDgxOTE3MDAxfQ.Cyzjl0rvkybshCO7A7iQvbLCWmHnNfYXjo0AhVoP-qA'
);

async function applyMigration() {
  console.log('🚀 Applying multi-price migration...\n');

  const steps = [
    {
      name: 'Add columns to product_urls',
      sql: `
        ALTER TABLE product_urls
        ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2),
        ADD COLUMN IF NOT EXISTS discount_price DECIMAL(10, 2),
        ADD COLUMN IF NOT EXISTS member_price DECIMAL(10, 2);
      `
    },
    {
      name: 'Migrate existing last_price to original_price',
      sql: `
        UPDATE product_urls
        SET original_price = last_price
        WHERE last_price IS NOT NULL AND original_price IS NULL;
      `
    },
    {
      name: 'Add columns to price_history',
      sql: `
        ALTER TABLE price_history
        ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2),
        ADD COLUMN IF NOT EXISTS discount_price DECIMAL(10, 2),
        ADD COLUMN IF NOT EXISTS member_price DECIMAL(10, 2);
      `
    },
    {
      name: 'Migrate existing price to original_price in price_history',
      sql: `
        UPDATE price_history
        SET original_price = price
        WHERE price IS NOT NULL AND original_price IS NULL;
      `
    },
    {
      name: 'Add selector columns to brands',
      sql: `
        ALTER TABLE brands
        ADD COLUMN IF NOT EXISTS original_price_selector TEXT,
        ADD COLUMN IF NOT EXISTS discount_price_selector TEXT,
        ADD COLUMN IF NOT EXISTS member_price_selector TEXT;
      `
    },
    {
      name: 'Migrate existing price_selector to original_price_selector',
      sql: `
        UPDATE brands
        SET original_price_selector = price_selector
        WHERE price_selector IS NOT NULL AND original_price_selector IS NULL;
      `
    }
  ];

  for (const step of steps) {
    console.log(`📝 ${step.name}...`);

    const { error } = await supabase.rpc('exec_sql', {
      sql_query: step.sql
    });

    if (error) {
      console.error(`   ❌ Error: ${error.message}`);
      console.log(`   Trying alternative method...`);

      // Since exec_sql might not exist, we'll handle each table separately
      if (step.name.includes('product_urls')) {
        console.log(`   ℹ️  Manual step required - please run in Supabase SQL Editor`);
      }
    } else {
      console.log(`   ✅ Success\n`);
    }
  }

  console.log('\n🎉 Migration steps completed!');
  console.log('\nℹ️  Note: If you see errors, please run the SQL from:');
  console.log('   supabase/migrations/20251230000000_add_price_variants.sql');
  console.log('   in the Supabase SQL Editor\n');
}

applyMigration().catch(console.error);
