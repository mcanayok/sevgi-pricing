const { createClient } = require("@supabase/supabase-js");
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

(async () => {
  const { data, error } = await supabase
    .from('brands')
    .update({ 
      price_selector: 'div.price-container, .price-view span.discounted, div.price.normal-price, p.new-price',
      notes: 'Main marketplace - required for all products. Selector targets: (1) price-container, (2) discounted price in price-view (lowest price feature), (3) normal-price, (4) new-price as fallback.'
    })
    .eq('domain', 'trendyol.com')
    .select();
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('✅ Updated Trendyol selector');
  }
})();
