const BaseScraper = require("../core/BaseScraper");
const { trySelectors } = require("../core/parser");

/**
 * Fellas Scraper
 *
 * Uses straightforward ID-based selectors
 */

// Hardcoded selectors for Fellas
const SELECTORS = {
  ORIGINAL_PRICE: '#fiyat .spanFiyat',
  DISCOUNT_PRICE: '#indirimliFiyat .spanFiyat'
};

class FellasScraper extends BaseScraper {
  constructor() {
    super('Fellas');
  }

  async extractPrices($) {
    const originalPrice = trySelectors($, SELECTORS.ORIGINAL_PRICE);
    const discountPrice = trySelectors($, SELECTORS.DISCOUNT_PRICE);

    // If no original price but has discount price, use discount as original
    if (originalPrice === null && discountPrice !== null) {
      return {
        originalPrice: discountPrice,
        discountPrice: null,
        memberPrice: null
      };
    }

    if (originalPrice === null) {
      throw new Error('No price found on Fellas page');
    }

    return {
      originalPrice,
      discountPrice,
      memberPrice: null
    };
  }
}

module.exports = FellasScraper;
