const BaseScraper = require("../core/BaseScraper");
const { trySelectors } = require("../core/parser");

const SELECTORS = {
  ORIGINAL_PRICE: '.discount-price span:first-child',
  DISCOUNT_PRICE: '.discount-price span:last-child',
  SINGLE_PRICE: '.price-main, .discount-price'
};

class Uniq2goScraper extends BaseScraper {
  constructor() {
    super('uniq2go');
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
      throw new Error('No price found on uniq2go page');
    }

    return {
      originalPrice: singlePrice,
      discountPrice: null,
      memberPrice: null
    };
  }
}

module.exports = Uniq2goScraper;
