const BaseScraper = require("../core/BaseScraper");
const { trySelectors } = require("../core/parser");

/**
 * Servet Scraper
 *
 * Special handling: Backwards naming convention (same as Züber)
 * - .product-price--original = SALE price
 * - .product-price--compare = ORIGINAL price
 */

// Hardcoded selectors for Servet
const SELECTORS = {
  ORIGINAL_PRICE: '.product-price--compare span:first-child',
  DISCOUNT_PRICE: '.product-price--original'
};

class ServetScraper extends BaseScraper {
  constructor() {
    super('Servet');
  }

  async extractPrices($) {
    const originalPriceElement = trySelectors($, SELECTORS.ORIGINAL_PRICE);
    const discountPriceElement = trySelectors($, SELECTORS.DISCOUNT_PRICE);

    // With discount: both elements have prices
    if (originalPriceElement !== null && discountPriceElement !== null) {
      return {
        originalPrice: originalPriceElement,
        discountPrice: discountPriceElement,
        memberPrice: null
      };
    }

    // No discount: use discounted element as original
    if (originalPriceElement === null && discountPriceElement !== null) {
      return {
        originalPrice: discountPriceElement,
        discountPrice: null,
        memberPrice: null
      };
    }

    throw new Error('No prices found on Servet page');
  }
}

module.exports = ServetScraper;
