const cheerio = require("cheerio");
const { createPage, navigateToUrl } = require("./browser");
const { trySelectors } = require("./parser");

/**
 * Base scraper class - all brand scrapers extend this
 * Provides common functionality and structure
 */
class BaseScraper {
  constructor(brandName) {
    this.brandName = brandName;
  }

  /**
   * Main scrape method - orchestrates the scraping process
   * Can be overridden for completely custom logic
   */
  async scrape(browser, url, brand) {
    const totalStart = Date.now();
    const page = await createPage(browser);

    try {
      // Navigate to page
      await navigateToUrl(page, url);

      // Get page content
      const parseStart = Date.now();
      const content = await page.content();
      const $ = cheerio.load(content);
      console.log(`  ⏱️  HTML parsing: ${Date.now() - parseStart}ms`);

      // Extract prices - this is where brand-specific logic happens
      const extractStart = Date.now();
      const prices = await this.extractPrices($, brand, page);
      console.log(`  ⏱️  Price extraction: ${Date.now() - extractStart}ms`);
      console.log(`  ✅ TOTAL: ${Date.now() - totalStart}ms\n`);

      return {
        ...prices,
        error: null
      };
    } catch (error) {
      console.log(`  ❌ Error after ${Date.now() - totalStart}ms: ${error.message}\n`);
      return {
        originalPrice: null,
        discountPrice: null,
        memberPrice: null,
        error: error.message
      };
    } finally {
      await page.close();
    }
  }

  /**
   * Extract prices from page - MUST be implemented by each brand
   * @param {CheerioAPI} $ - Cheerio instance with page HTML
   * @param {Object} brand - Brand object from database
   * @param {Page} page - Playwright page (for advanced operations)
   * @returns {Object} { originalPrice, discountPrice, memberPrice }
   */
  async extractPrices($, brand, page) {
    throw new Error(`${this.brandName} must implement extractPrices()`);
  }

  /**
   * Default price extraction using selectors from database
   * Brands can call this as fallback or use it directly
   */
  extractPricesWithSelectors($, brand) {
    const originalPrice = trySelectors($, brand.original_price_selector || brand.price_selector);
    const discountPrice = trySelectors($, brand.discount_price_selector);
    const memberPrice = trySelectors($, brand.member_price_selector);

    // If original_price not found but discount_price exists, use discount as original
    if (originalPrice === null && discountPrice !== null) {
      return {
        originalPrice: discountPrice,
        discountPrice: null,
        memberPrice
      };
    }

    // If no prices found at all
    if (originalPrice === null) {
      throw new Error(`No price found for selectors: ${brand.original_price_selector || brand.price_selector}`);
    }

    return {
      originalPrice,
      discountPrice,
      memberPrice
    };
  }
}

module.exports = BaseScraper;
