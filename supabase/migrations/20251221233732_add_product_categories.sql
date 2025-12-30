-- ============================================
-- Add Product Categories
-- ============================================

-- 1. Create product_categories table
CREATE TABLE public.product_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT product_categories_pkey PRIMARY KEY (id),
  CONSTRAINT product_categories_name_key UNIQUE (name)
);

-- 2. Enable RLS
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- 3. Add category_id to products table
ALTER TABLE public.products ADD COLUMN category_id uuid REFERENCES public.product_categories(id);

-- 4. Create index
CREATE INDEX idx_products_category ON public.products(category_id);

-- 5. RLS Policies for product_categories
CREATE POLICY "Anyone can view categories"
  ON public.product_categories
  AS PERMISSIVE
  FOR SELECT
  TO PUBLIC
  USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Editors and admins can insert categories"
  ON public.product_categories
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

CREATE POLICY "Editors and admins can update categories"
  ON public.product_categories
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

CREATE POLICY "Admins can delete categories"
  ON public.product_categories
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

-- 6. Add updated_at trigger
CREATE TRIGGER update_product_categories_updated_at
  BEFORE UPDATE ON public.product_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Grant permissions
GRANT ALL ON TABLE public.product_categories TO authenticated;
GRANT ALL ON TABLE public.product_categories TO service_role;
