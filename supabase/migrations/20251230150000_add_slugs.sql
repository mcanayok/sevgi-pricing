-- Add slug columns to brands and products
ALTER TABLE brands ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS slug TEXT;

-- Create function to generate slug from text
CREATE OR REPLACE FUNCTION generate_slug(text_input TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(text_input, '[^\w\s-]', '', 'g'),  -- Remove special chars
        '\s+', '-', 'g'                                    -- Replace spaces with hyphens
      ),
      '-+', '-', 'g'                                       -- Replace multiple hyphens with single
    )
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Generate slugs for existing brands
UPDATE brands SET slug = generate_slug(name) WHERE slug IS NULL;

-- Generate slugs for existing products
UPDATE products SET slug = generate_slug(name) WHERE slug IS NULL;

-- Make slugs unique and not null
ALTER TABLE brands ALTER COLUMN slug SET NOT NULL;
ALTER TABLE products ALTER COLUMN slug SET NOT NULL;

-- Add unique constraints with conflict resolution
-- For brands: append domain if slug conflicts
CREATE UNIQUE INDEX brands_slug_unique ON brands(slug);

-- For products: we'll handle conflicts in application
CREATE UNIQUE INDEX products_slug_unique ON products(slug);

-- Create trigger to auto-generate slug on insert/update
CREATE OR REPLACE FUNCTION brands_set_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION products_set_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.name);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS brands_slug_trigger ON brands;
CREATE TRIGGER brands_slug_trigger
  BEFORE INSERT OR UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION brands_set_slug();

DROP TRIGGER IF EXISTS products_slug_trigger ON products;
CREATE TRIGGER products_slug_trigger
  BEFORE INSERT OR UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION products_set_slug();
