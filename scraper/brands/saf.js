const BaseScraper = require("../core/BaseScraper");
const { trySelectors } = require("../core/parser");

/**
 * SAF Nutrition Scraper
 *
 * Handles two scenarios:
 * 1. With discount: compare-at-price (₺316) → sale-price (₺221)
 * 2. Without discount: Just sale-price (regular price)
 */

// Hardcoded selectors for SAF
const SELECTORS = {
  COMPARE_AT_PRICE: 'compare-at-price',
  SALE_PRICE: 'sale-price'
};

class SafScraper extends BaseScraper {
  constructor() {
    super('SAF');
  }

  async extractPrices($) {
    const compareAtPrice = trySelectors($, SELECTORS.COMPARE_AT_PRICE);
    const salePrice = trySelectors($, SELECTORS.SALE_PRICE);

    // If no prices found, throw error
    if (!salePrice) {
      throw new Error('No price found on SAF page');
    }

    // Scenario 1: With discount (compare-at-price exists)
    if (compareAtPrice && compareAtPrice > salePrice) {
      return {
        originalPrice: compareAtPrice,
        discountPrice: salePrice,
        memberPrice: null
      };
    }

    // Scenario 2: Without discount (only sale-price)
    return {
      originalPrice: salePrice,
      discountPrice: null,
      memberPrice: null
    };
  }
}

module.exports = SafScraper;
