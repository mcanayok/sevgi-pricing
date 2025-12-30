-- Add price variant columns to product_urls
ALTER TABLE product_urls
ADD COLUMN original_price DECIMAL(10, 2),
ADD COLUMN discount_price DECIMAL(10, 2),
ADD COLUMN member_price DECIMAL(10, 2);

-- Migrate existing last_price data to original_price
UPDATE product_urls SET original_price = last_price WHERE last_price IS NOT NULL;

-- Add price variant columns to price_history
ALTER TABLE price_history
ADD COLUMN original_price DECIMAL(10, 2),
ADD COLUMN discount_price DECIMAL(10, 2),
ADD COLUMN member_price DECIMAL(10, 2);

-- Migrate existing price data to original_price in price_history
UPDATE price_history SET original_price = price WHERE price IS NOT NULL;

-- Add selector columns to brands for different price types
ALTER TABLE brands
ADD COLUMN original_price_selector TEXT,
ADD COLUMN discount_price_selector TEXT,
ADD COLUMN member_price_selector TEXT;

-- Migrate existing price_selector to original_price_selector
UPDATE brands SET original_price_selector = price_selector WHERE price_selector IS NOT NULL;

-- Add comment for clarity
COMMENT ON COLUMN product_urls.original_price IS 'Base/list price - always required';
COMMENT ON COLUMN product_urls.discount_price IS 'Discounted/sale price - optional';
COMMENT ON COLUMN product_urls.member_price IS 'Membership/loyalty price (e.g., Trendyol Plus) - optional';
