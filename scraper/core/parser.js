// Price parsing utilities

/**
 * Parse price from text (handles Turkish and international formats)
 */
function parsePrice(text) {
  if (!text) return null;

  // Extract all numbers that look like prices
  const priceMatches = text.match(/[\d,.]+/g);
  if (!priceMatches || priceMatches.length === 0) return null;

  // Take the last price (usually the final/discounted price)
  let lastPrice = priceMatches[priceMatches.length - 1];

  // Detect format: if has both comma and dot, determine which is decimal
  // Turkish: 1.234,56 (dot=thousand, comma=decimal)
  // International: 1,234.56 (comma=thousand, dot=decimal)
  if (lastPrice.includes(',') && lastPrice.includes('.')) {
    const lastComma = lastPrice.lastIndexOf(',');
    const lastDot = lastPrice.lastIndexOf('.');
    if (lastComma > lastDot) {
      // Turkish format: remove dots, replace comma with dot
      lastPrice = lastPrice.replace(/\./g, '').replace(',', '.');
    } else {
      // International format: remove commas
      lastPrice = lastPrice.replace(/,/g, '');
    }
  } else if (lastPrice.includes(',')) {
    // Only comma: Turkish decimal
    lastPrice = lastPrice.replace(',', '.');
  } else if (lastPrice.includes('.')) {
    // Only dot: could be thousand separator or decimal
    // If 2 digits after dot, it's decimal; otherwise thousand separator
    const parts = lastPrice.split('.');
    if (parts.length === 2 && parts[1].length === 2) {
      // Keep as decimal
    } else {
      // Remove as thousand separator
      lastPrice = lastPrice.replace(/\./g, '');
    }
  }

  const price = parseFloat(lastPrice.trim());
  return isNaN(price) ? null : price;
}

/**
 * Try multiple selectors and extract price
 */
function trySelectors($, selectorString) {
  if (!selectorString) return null;

  const selectors = selectorString.split(',').map(s => s.trim());

  for (const sel of selectors) {
    const element = $(sel).first();
    if (element.length > 0) {
      const text = element.text().trim();
      if (text) {
        const price = parsePrice(text);
        if (price !== null) return price;
      }
    }
  }

  return null;
}

module.exports = {
  parsePrice,
  trySelectors
};
