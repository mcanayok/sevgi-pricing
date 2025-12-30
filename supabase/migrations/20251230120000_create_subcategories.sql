-- Create subcategories table
CREATE TABLE IF NOT EXISTS product_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES product_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category_id, name)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_subcategories_category_id ON product_subcategories(category_id);

-- Migrate existing subcategory strings to new table
-- First, create subcategories from unique subcategory values per category
INSERT INTO product_subcategories (category_id, name)
SELECT DISTINCT category_id, subcategory
FROM products
WHERE subcategory IS NOT NULL
  AND subcategory != ''
  AND category_id IS NOT NULL
ON CONFLICT (category_id, name) DO NOTHING;

-- Add new column for subcategory_id reference
ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES product_subcategories(id) ON DELETE SET NULL;

-- Populate subcategory_id from existing subcategory strings
UPDATE products p
SET subcategory_id = ps.id
FROM product_subcategories ps
WHERE p.category_id = ps.category_id
  AND p.subcategory = ps.name
  AND p.subcategory IS NOT NULL
  AND p.subcategory != '';

-- Keep the old subcategory column for now (can drop later after verification)
-- ALTER TABLE products DROP COLUMN subcategory;
