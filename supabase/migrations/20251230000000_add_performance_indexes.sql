-- Add performance indexes for frequently queried columns

-- Index for product_urls.product_id (used in product detail pages)
CREATE INDEX IF NOT EXISTS idx_product_urls_product_id
ON product_urls(product_id);

-- Index for price_history.product_url_id (used in price charts and history)
CREATE INDEX IF NOT EXISTS idx_price_history_product_url_id
ON price_history(product_url_id);

-- Index for price_history.scraped_at (used for ordering price history)
CREATE INDEX IF NOT EXISTS idx_price_history_scraped_at
ON price_history(scraped_at DESC);

-- Index for products.category_id (used in filtering)
CREATE INDEX IF NOT EXISTS idx_products_category_id
ON products(category_id);

-- Index for products.subcategory (used in filtering)
CREATE INDEX IF NOT EXISTS idx_products_subcategory
ON products(subcategory);

-- Composite index for product_urls filtering by product_id and last_scraped_at
CREATE INDEX IF NOT EXISTS idx_product_urls_product_scraped
ON product_urls(product_id, last_scraped_at DESC);

-- Index for brands.is_required (used to filter manufacturer brands)
CREATE INDEX IF NOT EXISTS idx_brands_is_required
ON brands(is_required);

-- Index for product_urls.is_active (used to filter active URLs for scraping)
CREATE INDEX IF NOT EXISTS idx_product_urls_is_active
ON product_urls(is_active);
