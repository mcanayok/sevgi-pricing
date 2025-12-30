-- ============================================
-- Add subcategory to products table
-- ============================================

-- Add subcategory column to products table
ALTER TABLE public.products ADD COLUMN subcategory text;

-- Create index for faster filtering
CREATE INDEX idx_products_subcategory ON public.products(subcategory);
