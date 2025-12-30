const BaseScraper = require("../core/BaseScraper");
const { trySelectors } = require("../core/parser");

/**
 * Züber Scraper
 *
 * Special handling: Backwards naming convention
 * - .product-price--original = SALE price (when discounted)
 * - .product-price--compare = ORIGINAL price
 *
 * Two scenarios:
 * 1. With discount: both selectors have values
 * 2. No discount: .product-price--compare is empty, .product-price--original has regular price
 */

// Hardcoded selectors for Züber
const SELECTORS = {
  ORIGINAL_PRICE: '.product-price--compare span',
  DISCOUNT_PRICE: '.product-price--original'
};

class ZuberScraper extends BaseScraper {
  constructor() {
    super('Züber');
  }

  async extractPrices($) {
    const originalPriceElement = trySelectors($, SELECTORS.ORIGINAL_PRICE);
    const discountPriceElement = trySelectors($, SELECTORS.DISCOUNT_PRICE);

    // Scenario 1: Has discount (both elements have prices)
    if (originalPriceElement !== null && discountPriceElement !== null) {
      return {
        originalPrice: originalPriceElement,
        discountPrice: discountPriceElement,
        memberPrice: null
      };
    }

    // Scenario 2: No discount (.product-price--compare is empty)
    if (originalPriceElement === null && discountPriceElement !== null) {
      return {
        originalPrice: discountPriceElement,
        discountPrice: null,
        memberPrice: null
      };
    }

    // No prices found
    throw new Error('No prices found on Züber page');
  }
}

module.exports = ZuberScraper;
