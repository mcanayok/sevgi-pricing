const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://rngxqzfqboqyktzlmgyg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuZ3hxemZxYm9xeWt0emxtZ3lnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjM0MTAwMSwiZXhwIjoyMDgxOTE3MDAxfQ.Cyzjl0rvkybshCO7A7iQvbLCWmHnNfYXjo0AhVoP-qA'
);

async function updateTrendyolSelectors() {
  console.log('Updating Trendyol selectors for multi-price support...\n');

  const { data, error } = await supabase
    .from('brands')
    .update({
      // Original price (base/list price) - try multiple selectors
      original_price_selector: 'span.prc-org, .original-price, .price-old',

      // Discount price (main discounted price, or Plus "original" if Plus available)
      discount_price_selector: 'span.discounted, .ty-plus-price-original-price, .price-current-price-with-lowest-duration, .new-price, .price-current-price, .prc-dsc',

      // Member price (Trendyol Plus price)
      member_price_selector: '.ty-plus-price-discounted-price',

      notes: `Multi-price support:
- original_price: Crossed out base price (span.prc-org)
- discount_price: Main price or Plus regular price (.ty-plus-price-original-price, span.discounted)
- member_price: Trendyol Plus exclusive price (.ty-plus-price-discounted-price)

Selectors try multiple patterns for different Trendyol layouts.`
    })
    .eq('name', 'Trendyol')
    .select();

  if (error) {
    console.error('❌ Error:', error.message);
  } else {
    console.log('✅ Updated Trendyol selectors');
    console.log('\nOriginal price:', data[0].original_price_selector);
    console.log('Discount price:', data[0].discount_price_selector);
    console.log('Member price:', data[0].member_price_selector);
  }
}

updateTrendyolSelectors().catch(console.error);
