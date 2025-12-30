// Browser utilities for Playwright

/**
 * Create a new page with common settings
 */
async function createPage(browser) {
  const page = await browser.newPage();

  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.setExtraHTTPHeaders({
    'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  });

  return page;
}

/**
 * Navigate to URL with fallback strategies
 * Optimized for speed: uses domcontentloaded by default (much faster than networkidle)
 */
async function navigateToUrl(page, url, timeout = 15000) {
  const startTime = Date.now();

  try {
    // Use domcontentloaded (faster, works for most sites)
    // networkidle can be very slow (waits for ALL network requests including analytics/tracking)
    await page.goto(url, { waitUntil: "domcontentloaded", timeout });
    const loadTime = Date.now() - startTime;
    console.log(`  ⏱️  Page loaded in ${loadTime}ms`);

    // Shorter wait for JavaScript - most sites render prices quickly
    // Reduced from 3000ms to 1000ms for 2x speed improvement
    await page.waitForTimeout(1000);
    console.log(`  ⏱️  Total navigation: ${Date.now() - startTime}ms`);
  } catch (e) {
    const errorTime = Date.now() - startTime;
    console.log(`  ⚠️  Navigation timeout after ${errorTime}ms`);
    throw e;
  }
}

module.exports = {
  createPage,
  navigateToUrl
};
