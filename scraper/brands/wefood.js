const BaseScraper = require("../core/BaseScraper");
const { trySelectors } = require("../core/parser");

/**
 * Wefood Scraper
 *
 * Handles two scenarios:
 * 1. With discount: "Sepette %40 İndirimli" - shows campaign discount price
 * 2. No discount: Just regular price
 */

// Hardcoded selectors for Wefood
const SELECTORS = {
  ORIGINAL_PRICE: '.price__regular .price-item--regular',
  DISCOUNT_PRICE: '.price-item-discount'
};

class WefoodScraper extends BaseScraper {
  constructor() {
    super('Wefood');
  }

  async extractPrices($) {
    const originalPrice = trySelectors($, SELECTORS.ORIGINAL_PRICE);
    const discountPrice = trySelectors($, SELECTORS.DISCOUNT_PRICE);

    if (originalPrice === null) {
      throw new Error('No price found on Wefood page');
    }

    return {
      originalPrice,
      discountPrice,
      memberPrice: null
    };
  }
}

module.exports = WefoodScraper;
