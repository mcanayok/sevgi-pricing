const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanupPriceHistory() {
  console.log('🧹 Starting price history cleanup...\n');

  try {
    // Get all price history entries
    const { data: allPriceHistory, error: fetchError } = await supabase
      .from('price_history')
      .select('id, product_url_id, scraped_at')
      .order('product_url_id', { ascending: true })
      .order('scraped_at', { ascending: true });

    if (fetchError) {
      console.error('❌ Error fetching price history:', fetchError);
      return;
    }

    console.log(`📊 Total price history entries: ${allPriceHistory.length}`);

    // Group by product_url_id
    const grouped = {};
    allPriceHistory.forEach(entry => {
      if (!grouped[entry.product_url_id]) {
        grouped[entry.product_url_id] = [];
      }
      grouped[entry.product_url_id].push(entry);
    });

    console.log(`📦 Product URLs with history: ${Object.keys(grouped).length}\n`);

    // For each product_url_id, keep only the first (oldest) entry
    let totalToDelete = 0;
    const idsToDelete = [];

    for (const [productUrlId, entries] of Object.entries(grouped)) {
      if (entries.length > 1) {
        // Keep the first entry (index 0), delete the rest
        const toDelete = entries.slice(1);
        toDelete.forEach(entry => idsToDelete.push(entry.id));
        totalToDelete += toDelete.length;

        console.log(`  Product URL ${productUrlId}: Keeping 1 of ${entries.length} entries (deleting ${toDelete.length})`);
      }
    }

    console.log(`\n🗑️  Total entries to delete: ${totalToDelete}`);

    if (totalToDelete === 0) {
      console.log('✅ No cleanup needed - all product URLs have only one price entry');
      return;
    }

    // Delete in batches of 1000
    const batchSize = 1000;
    let deleted = 0;

    for (let i = 0; i < idsToDelete.length; i += batchSize) {
      const batch = idsToDelete.slice(i, i + batchSize);

      const { error: deleteError } = await supabase
        .from('price_history')
        .delete()
        .in('id', batch);

      if (deleteError) {
        console.error(`❌ Error deleting batch ${Math.floor(i / batchSize) + 1}:`, deleteError);
      } else {
        deleted += batch.length;
        console.log(`  Deleted batch ${Math.floor(i / batchSize) + 1}: ${batch.length} entries (${deleted}/${totalToDelete})`);
      }
    }

    console.log(`\n✅ Cleanup complete! Deleted ${deleted} price history entries`);
    console.log(`📊 Kept ${allPriceHistory.length - deleted} first entries (one per product URL)`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

cleanupPriceHistory();
