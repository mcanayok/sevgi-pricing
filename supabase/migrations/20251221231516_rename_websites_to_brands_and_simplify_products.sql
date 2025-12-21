-- ============================================
-- Rename websites → brands & Simplify products
-- ============================================

-- 1. Drop the view that depends on these tables
DROP VIEW IF EXISTS public.products_with_prices;

-- 2. Drop triggers on tables we'll modify
DROP TRIGGER IF EXISTS update_websites_updated_at ON public.websites;
DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;

-- 3. Drop indexes on columns we're removing from products
DROP INDEX IF EXISTS public.idx_products_brand;

-- 4. Remove brand, sku, notes columns from products table
ALTER TABLE public.products DROP COLUMN IF EXISTS brand CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS sku CASCADE;
ALTER TABLE public.products DROP COLUMN IF EXISTS notes CASCADE;

-- 5. Rename websites table to brands
ALTER TABLE public.websites RENAME TO brands;

-- 6. Rename website_id to brand_id in product_urls
ALTER TABLE public.product_urls RENAME COLUMN website_id TO brand_id;

-- 7. Update foreign key constraint names
ALTER TABLE public.product_urls DROP CONSTRAINT IF EXISTS product_urls_website_id_fkey;
ALTER TABLE public.product_urls
  ADD CONSTRAINT product_urls_brand_id_fkey
  FOREIGN KEY (brand_id) REFERENCES public.brands(id) ON DELETE CASCADE;

-- 8. Rename indexes that referenced websites
ALTER INDEX IF EXISTS public.idx_product_urls_website RENAME TO idx_product_urls_brand;
ALTER INDEX IF EXISTS public.websites_pkey RENAME TO brands_pkey;
ALTER INDEX IF EXISTS public.websites_domain_key RENAME TO brands_domain_key;

-- 9. Recreate triggers with updated table names
CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON public.brands
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Recreate the view with updated schema (no brand/sku/notes, brands instead of websites)
CREATE OR REPLACE VIEW public.products_with_prices AS
SELECT
  p.id,
  p.name,
  p.created_at,
  p.updated_at,
  jsonb_agg(
    jsonb_build_object(
      'brand_id', b.id,
      'brand_name', b.name,
      'brand_domain', b.domain,
      'url', pu.url,
      'is_active', pu.is_active,
      'last_price', pu.last_price,
      'last_scraped_at', pu.last_scraped_at
    )
  ) FILTER (WHERE pu.id IS NOT NULL) AS urls
FROM public.products p
LEFT JOIN public.product_urls pu ON p.id = pu.product_id
LEFT JOIN public.brands b ON pu.brand_id = b.id
GROUP BY p.id, p.name, p.created_at, p.updated_at;

-- 11. Update RLS policies - rename from websites to brands
-- Drop old website policies
DROP POLICY IF EXISTS "Admins can delete websites" ON public.brands;
DROP POLICY IF EXISTS "Anyone can view websites" ON public.brands;
DROP POLICY IF EXISTS "Editors and admins can insert websites" ON public.brands;
DROP POLICY IF EXISTS "Editors and admins can update websites" ON public.brands;

-- Create new brand policies (same logic, just renamed)
CREATE POLICY "Admins can delete brands"
  ON public.brands
  AS PERMISSIVE
  FOR DELETE
  TO PUBLIC
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'::public.user_role
    )
  );

CREATE POLICY "Anyone can view brands"
  ON public.brands
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Editors and admins can insert brands"
  ON public.brands
  AS PERMISSIVE
  FOR INSERT
  TO PUBLIC
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = ANY (ARRAY['admin'::public.user_role, 'editor'::public.user_role])
    )
  );

CREATE POLICY "Editors and admins can update brands"
  ON public.brands
  AS PERMISSIVE
  FOR UPDATE
  TO PUBLIC
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = ANY (ARRAY['admin'::public.user_role, 'editor'::public.user_role])
    )
  );

-- 12. Update unique constraint name in product_urls
ALTER TABLE public.product_urls DROP CONSTRAINT IF EXISTS product_urls_product_id_website_id_key;
ALTER TABLE public.product_urls
  ADD CONSTRAINT product_urls_product_id_brand_id_key
  UNIQUE (product_id, brand_id);
