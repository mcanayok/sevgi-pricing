const BaseScraper = require("../core/BaseScraper");
const { trySelectors } = require("../core/parser");

/**
 * Fropie Scraper
 *
 * Handles two scenarios:
 * 1. With discount: .discount-price has 2 spans (original crossed out, then discounted)
 * 2. Without discount: Single price
 */

const SELECTORS = {
  // For discount scenario - grayed out original price
  ORIGINAL_PRICE: '.discount-price span:first-child',
  // For discount scenario - actual discounted price
  DISCOUNT_PRICE: '.discount-price span:last-child',
  // Fallback for single price
  SINGLE_PRICE: '.price-main, .discount-price'
};

class FropieScraper extends BaseScraper {
  constructor() {
    super('Fropie');
  }

  async extractPrices($) {
    // Check if we have discount scenario (two spans in .discount-price)
    const discountPriceSpans = $('.discount-price span');

    if (discountPriceSpans.length >= 2) {
      // Scenario 1: With discount
      const originalPrice = trySelectors($, SELECTORS.ORIGINAL_PRICE);
      const discountPrice = trySelectors($, SELECTORS.DISCOUNT_PRICE);

      if (originalPrice && discountPrice && originalPrice > discountPrice) {
        return {
          originalPrice,
          discountPrice,
          memberPrice: null
        };
      }
    }

    // Scenario 2: Without discount - just get any price
    const singlePrice = trySelectors($, SELECTORS.SINGLE_PRICE);

    if (!singlePrice) {
      throw new Error('No price found on Fropie page');
    }

    return {
      originalPrice: singlePrice,
      discountPrice: null,
      memberPrice: null
    };
  }
}

module.exports = FropieScraper;
