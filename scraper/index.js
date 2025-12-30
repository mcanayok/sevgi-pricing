const { createClient } = require("@supabase/supabase-js");
const { chromium } = require("playwright");
const { getScraperForBrand } = require("./brands");

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const triggeredBy = process.env.TRIGGERED_BY || null;
const productId = process.env.PRODUCT_ID || null;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Scrape a single URL using brand-specific scraper
async function scrapeUrl(browser, url, brand) {
  const scraper = getScraperForBrand(brand.name);
  return await scraper.scrape(browser, url, brand);
}

async function main() {
  console.log("🚀 Starting price scraper...");
  console.log(`📅 Time: ${new Date().toISOString()}`);

  if (productId) {
    console.log(`🎯 Single product mode: ${productId}`);
  }

  // Get all active product URLs with their brand info
  let query = supabase
    .from("product_urls")
    .select(
      `
      id,
      url,
      product_id,
      brand_id,
      brands(id, name, domain)
    `
    )
    .eq("is_active", true);

  // Filter by product ID if specified
  if (productId) {
    query = query.eq("product_id", productId);
  }

  const { data: productUrls, error: fetchError } = await query;

  if (fetchError) {
    console.error("❌ Error fetching product URLs:", fetchError.message);
    process.exit(1);
  }

  if (!productUrls || productUrls.length === 0) {
    console.log("ℹ️ No active product URLs to scrape");
    return;
  }

  console.log(`📦 Found ${productUrls.length} URLs to scrape`);

  // Create scrape job
  const { data: scrapeJob, error: jobError } = await supabase
    .from("scrape_jobs")
    .insert({
      status: "running",
      triggered_by: triggeredBy,
      total_products: productUrls.length,
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (jobError) {
    console.error("❌ Error creating scrape job:", jobError.message);
    // Continue anyway
  }

  const jobId = scrapeJob?.id;
  console.log(`📋 Scrape job ID: ${jobId}`);

  // Launch browser
  const browser = await chromium.launch({ headless: true });

  let scrapedCount = 0;
  let errorCount = 0;

  try {
    // Process URLs in batches for parallel scraping
    // Optimized for free tier: 10 concurrent requests for faster scraping
    const BATCH_SIZE = 10;
    const batches = [];

    for (let i = 0; i < productUrls.length; i += BATCH_SIZE) {
      batches.push(productUrls.slice(i, i + BATCH_SIZE));
    }

    console.log(`📦 Processing ${batches.length} batches of up to ${BATCH_SIZE} URLs each`);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      console.log(`\n📦 Batch ${batchIndex + 1}/${batches.length}`);

      // Process batch concurrently
      const results = await Promise.all(
        batch.map(async (productUrl) => {
          const brand = productUrl.brands;

          if (!brand) {
            console.log(`⚠️ No brand found for product URL ${productUrl.id}`);
            return { productUrl, success: false, error: "No brand found" };
          }

          console.log(`🔍 Scraping: ${productUrl.url.substring(0, 50)}... (${brand.name})`);

          const { originalPrice, discountPrice, memberPrice, error } = await scrapeUrl(
            browser,
            productUrl.url,
            brand
          );

          return { productUrl, brand, originalPrice, discountPrice, memberPrice, error, success: !error };
        })
      );

      // Save results to database
      for (const result of results) {
        if (result.success) {
          const priceStr = [
            result.originalPrice && `Orig: ${result.originalPrice}`,
            result.discountPrice && `Disc: ${result.discountPrice}`,
            result.memberPrice && `Member: ${result.memberPrice}`
          ].filter(Boolean).join(', ');
          console.log(`✅ ${result.brand.name}: ${priceStr} TL`);
          scrapedCount++;
        } else {
          console.log(`❌ ${result.productUrl.url.substring(0, 50)}...: ${result.error}`);
          errorCount++;
        }

        // Insert price history with all price types
        const { error: insertError } = await supabase.from("price_history").insert({
          product_url_id: result.productUrl.id,
          original_price: result.originalPrice || null,
          discount_price: result.discountPrice || null,
          member_price: result.memberPrice || null,
          price: result.originalPrice || null, // Keep for backwards compatibility
          error: result.error || null,
          scraped_at: new Date().toISOString(),
        });

        if (insertError) {
          console.log(`⚠️ Error saving to history: ${insertError.message}`);
        }

        // Update product_url with latest prices
        if (result.originalPrice !== null) {
          await supabase
            .from("product_urls")
            .update({
              original_price: result.originalPrice,
              discount_price: result.discountPrice,
              member_price: result.memberPrice,
              last_price: result.originalPrice, // Keep for backwards compatibility
              last_scraped_at: new Date().toISOString(),
            })
            .eq("id", result.productUrl.id);
        }
      }

      // Delay between batches to be respectful to servers
      if (batchIndex < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  } finally {
    await browser.close();
  }

  // Update scrape job status
  if (jobId) {
    await supabase
      .from("scrape_jobs")
      .update({
        status: errorCount === productUrls.length ? "failed" : "completed",
        scraped_count: scrapedCount,
        error_count: errorCount,
        completed_at: new Date().toISOString(),
      })
      .eq("id", jobId);
  }

  console.log("\n📊 Summary:");
  console.log(`   Total URLs: ${productUrls.length}`);
  console.log(`   Successfully scraped: ${scrapedCount}`);
  console.log(`   Errors: ${errorCount}`);
  console.log("✅ Scraping complete!");
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});

