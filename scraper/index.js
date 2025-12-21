const { createClient } = require("@supabase/supabase-js");
const puppeteer = require("puppeteer");
const cheerio = require("cheerio");

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const triggeredBy = process.env.TRIGGERED_BY || null;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Parse price from text
function parsePrice(text) {
  if (!text) return null;

  // Remove currency symbols and clean up the text
  const cleaned = text
    .replace(/[₺TL$€]/gi, "")
    .replace(/\s+/g, "")
    .replace(/\./g, "") // Remove thousand separators (Turkish format uses .)
    .replace(",", ".") // Convert decimal separator (Turkish format uses ,)
    .trim();

  const price = parseFloat(cleaned);
  return isNaN(price) ? null : price;
}

// Scrape a single URL using Puppeteer
async function scrapeUrl(browser, url, selector) {
  const page = await browser.newPage();

  try {
    // Set user agent to avoid bot detection
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    );

    // Navigate to the page
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Wait a bit for dynamic content
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Get page content
    const content = await page.content();
    const $ = cheerio.load(content);

    // Try to find price with selector
    const priceElement = $(selector).first();
    const priceText = priceElement.text().trim();

    if (!priceText) {
      return { price: null, error: `No element found for selector: ${selector}` };
    }

    const price = parsePrice(priceText);

    if (price === null) {
      return { price: null, error: `Could not parse price from: "${priceText}"` };
    }

    return { price, error: null };
  } catch (error) {
    return { price: null, error: error.message };
  } finally {
    await page.close();
  }
}

async function main() {
  console.log("🚀 Starting price scraper...");
  console.log(`📅 Time: ${new Date().toISOString()}`);

  // Get all active product URLs with their website selectors
  const { data: productUrls, error: fetchError } = await supabase
    .from("product_urls")
    .select(
      `
      id,
      url,
      product_id,
      website_id,
      websites(id, name, domain, price_selector)
    `
    )
    .eq("is_active", true);

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
  const browser = await puppeteer.launch({
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--disable-gpu",
    ],
  });

  let scrapedCount = 0;
  let errorCount = 0;

  try {
    for (const productUrl of productUrls) {
      const website = productUrl.websites;

      if (!website) {
        console.log(`⚠️ No website found for product URL ${productUrl.id}`);
        errorCount++;
        continue;
      }

      console.log(`\n🔍 Scraping: ${productUrl.url}`);
      console.log(`   Website: ${website.name}`);
      console.log(`   Selector: ${website.price_selector}`);

      const { price, error } = await scrapeUrl(
        browser,
        productUrl.url,
        website.price_selector
      );

      if (error) {
        console.log(`   ❌ Error: ${error}`);
        errorCount++;
      } else {
        console.log(`   ✅ Price: ${price} TL`);
        scrapedCount++;
      }

      // Insert price history
      const { error: insertError } = await supabase.from("price_history").insert({
        product_url_id: productUrl.id,
        price,
        error,
        scraped_at: new Date().toISOString(),
      });

      if (insertError) {
        console.log(`   ⚠️ Error saving to history: ${insertError.message}`);
      }

      // Update product_url with latest price
      if (price !== null) {
        await supabase
          .from("product_urls")
          .update({
            last_price: price,
            last_scraped_at: new Date().toISOString(),
          })
          .eq("id", productUrl.id);
      }

      // Small delay between requests to be nice to servers
      await new Promise((resolve) => setTimeout(resolve, 1000));
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

