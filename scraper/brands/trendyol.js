const BaseScraper = require("../core/BaseScraper");

/**
 * Trendyol Scraper
 *
 * Complex logic to handle Plus pricing correctly
 * Scenarios:
 * A. Single price (211 TL)
 * B. Crossed-out + discount (~~649~~ 520 TL)
 * C. Plus pricing (134.42 TL + Plus 120.98 TL)
 * D. All three (~~200~~ 134.42 TL + Plus 120.98 TL)
 */

// Hardcoded selectors for Trendyol
const SELECTORS = {
  CROSSED_OUT_PRICE: 'span.prc-org, .original-price, .price-old, .old-price, .original, span.original, .price-view .original',
  PLUS_ORIGINAL_PRICE: '.ty-plus-price-original-price',
  PLUS_MEMBER_PRICE: '.ty-plus-price-discounted-price',
  REGULAR_DISCOUNT_PRICE: 'span.discounted, .discounted, .price-view .discounted, .prc-dsc, .price-current-price, .new-price'
};

class TrendyolScraper extends BaseScraper {
  constructor() {
    super('Trendyol');
  }

  async extractPrices($) {
    // IMPORTANT: Only search within main product area to avoid recommendation products
    const productDetail = $('.productDetailWrapper, #product-detail-app, .pr-in-w').first();
    const $scope = productDetail.length > 0 ? productDetail : $('body');

    // Helper function to search only within product detail area
    const findPrice = (selectors) => {
      if (!selectors) return null;
      const selectorList = selectors.split(',').map(s => s.trim());
      for (const sel of selectorList) {
        const element = $scope.find(sel).first();
        if (element.length > 0) {
          const text = element.text().trim();
          if (text) {
            const { parsePrice } = require("../core/parser");
            const price = parsePrice(text);
            if (price !== null) return price;
          }
        }
      }
      return null;
    };

    // Check for crossed-out original price
    const crossedOutPrice = findPrice(SELECTORS.CROSSED_OUT_PRICE);

    // Check for Plus pricing elements
    const plusOriginalPrice = findPrice(SELECTORS.PLUS_ORIGINAL_PRICE);
    const plusMemberPrice = findPrice(SELECTORS.PLUS_MEMBER_PRICE);

    // Check for regular discount price
    const regularDiscountPrice = findPrice(SELECTORS.REGULAR_DISCOUNT_PRICE);

    let originalPrice = null;
    let discountPrice = null;
    let memberPrice = null;

    // Validate Plus prices: trust if no regular price, or if prices are similar
    const isPlusValid = plusOriginalPrice && plusMemberPrice && (
      !regularDiscountPrice || // No regular price = trust Plus
      Math.abs(plusOriginalPrice - regularDiscountPrice) / regularDiscountPrice < 0.5 // Prices similar
    );

    // Scenario D: Crossed-out + Plus pricing (~~200~~ 134.42 + Plus 120.98)
    if (crossedOutPrice && plusOriginalPrice && plusMemberPrice && isPlusValid) {
      originalPrice = crossedOutPrice;
      discountPrice = plusOriginalPrice;
      memberPrice = plusMemberPrice;
    }
    // Scenario C: Plus pricing only (219 TL + Plus 208.05 TL "Sepette")
    else if (plusOriginalPrice && plusMemberPrice && !crossedOutPrice && isPlusValid) {
      originalPrice = plusOriginalPrice;
      discountPrice = null;
      memberPrice = plusMemberPrice;
    }
    // Scenario B: Crossed-out + regular discount (~~649~~ 520)
    else if (crossedOutPrice && regularDiscountPrice) {
      originalPrice = crossedOutPrice;
      discountPrice = regularDiscountPrice;
      memberPrice = null;
    }
    // Scenario A: Just one price (211 or 520)
    else if (regularDiscountPrice) {
      originalPrice = regularDiscountPrice;
      discountPrice = null;
      memberPrice = null;
    }
    // Fallback
    else {
      originalPrice = crossedOutPrice || plusOriginalPrice || regularDiscountPrice;
    }

    if (!originalPrice) {
      throw new Error('No price found on Trendyol page');
    }

    return {
      originalPrice,
      discountPrice,
      memberPrice
    };
  }
}

module.exports = TrendyolScraper;
