// Brand scraper registry
// Maps brand names to their scraper classes

const TrendyolScraper = require('./trendyol');
const ZuberScraper = require('./zuber');
const ServetScraper = require('./servet');
const FellasScraper = require('./fellas');
const WefoodScraper = require('./wefood');
const SafScraper = require('./saf');
const FropieScraper = require('./fropie');
const Uniq2goScraper = require('./uniq2go');
const BaseScraper = require('../core/BaseScraper');
const { trySelectors } = require('../core/parser');

// Registry of brand scrapers with custom logic
const SCRAPERS = {
  'Trendyol': new TrendyolScraper(),
  'Züber': new ZuberScraper(),
  'Servet': new ServetScraper(),
  'Fellas': new FellasScraper(),
  'Wefood': new WefoodScraper(),
  'Saf': new SafScraper(),
  'Fropie': new FropieScraper(),
  'uniq2go': new Uniq2goScraper(),
};

// Default selectors for brands without custom scrapers
// These brands use simple selector-based scraping
const DEFAULT_SELECTORS = {
  'Aroha Çikolata': {
    original: '.urun_kdvdahil_fiyati',
    discount: null,
    member: null
  },
  'bahs': {
    original: '.price',
    discount: null,
    member: null
  },
  'Bite & More': {
    original: '.price, .product-price',
    discount: null,
    member: null
  },
  'Corny': {
    original: '.price',
    discount: null,
    member: null
  },
  'Delly': {
    original: '.spanFiyat',
    discount: null,
    member: null
  },
  "Kellog's": {
    original: '.price',
    discount: null,
    member: null
  },
  "Mom's Granola": {
    original: '.text-button-02, .font-medium.text-button-02',
    discount: null,
    member: null
  },
  'Naturiga': {
    original: '.n9-fbt-product-price-final',
    discount: null,
    member: null
  },
  'Patiswiss': {
    original: '.price',
    discount: null,
    member: null
  },
  'Protein Ocean': {
    original: '.font-bold.text-black, div[class*="font-bold"]',
    discount: null,
    member: null
  },
  'Rawsome': {
    original: '.product-price--original',
    discount: null,
    member: null
  },
  "Vegeat's": {
    original: '.price',
    discount: null,
    member: null
  },
  'Waspco': {
    original: '.product-price--original',
    discount: null,
    member: null
  },
  'Yummate': {
    original: '.price',
    discount: null,
    member: null
  }
};

/**
 * Get scraper for a brand
 * Returns custom scraper if available, otherwise returns default BaseScraper with hardcoded selectors
 */
function getScraperForBrand(brandName) {
  // Check if we have a custom scraper with special logic
  if (SCRAPERS[brandName]) {
    return SCRAPERS[brandName];
  }

  // Check if we have default selectors for this brand
  const selectors = DEFAULT_SELECTORS[brandName];
  if (!selectors) {
    throw new Error(`No scraper or selectors configured for brand: ${brandName}`);
  }

  // Return default scraper with hardcoded selectors
  const defaultScraper = new BaseScraper(brandName);
  defaultScraper.extractPrices = function($) {
    const originalPrice = trySelectors($, selectors.original);
    const discountPrice = selectors.discount ? trySelectors($, selectors.discount) : null;
    const memberPrice = selectors.member ? trySelectors($, selectors.member) : null;

    // If no original price, fallback to discount price
    if (originalPrice === null && discountPrice !== null) {
      return {
        originalPrice: discountPrice,
        discountPrice: null,
        memberPrice
      };
    }

    if (originalPrice === null) {
      throw new Error(`No price found for ${brandName} with selectors: ${selectors.original}`);
    }

    return { originalPrice, discountPrice, memberPrice };
  };

  return defaultScraper;
}

module.exports = {
  getScraperForBrand,
  SCRAPERS
};
