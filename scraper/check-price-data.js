const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rngxqzfqboqyktzlmgyg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuZ3hxemZxYm9xeWt0emxtZ3lnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjM0MTAwMSwiZXhwIjoyMDgxOTE3MDAxfQ.Cyzjl0rvkybshCO7A7iQvbLCWmHnNfYXjo0AhVoP-qA'
);

async function checkPriceData() {
  const { data: products } = await supabase
    .from('product_urls')
    .select('url, brands(name), original_price, discount_price, member_price, last_price')
    .limit(10);

  console.log('Sample product URLs with price data:');
  console.log('='.repeat(80));
  products.forEach(p => {
    console.log(`${p.brands.name}: Orig=${p.original_price}, Disc=${p.discount_price}, Member=${p.member_price}, Last=${p.last_price}`);
  });

  const withNewData = products.filter(p => p.discount_price || p.member_price);
  const onlyMigrated = products.filter(p => p.original_price && !p.discount_price && !p.member_price);

  console.log(`\nSummary:`);
  console.log(`  Products with new multi-price data: ${withNewData.length}`);
  console.log(`  Products with only migrated data: ${onlyMigrated.length}`);
}

checkPriceData().catch(console.error);
