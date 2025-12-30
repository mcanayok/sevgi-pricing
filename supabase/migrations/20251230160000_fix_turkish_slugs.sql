-- Update slug generation to handle Turkish characters properly
CREATE OR REPLACE FUNCTION generate_slug(text_input TEXT)
RETURNS TEXT AS $$
DECLARE
  result TEXT;
BEGIN
  -- First, transliterate Turkish characters to ASCII
  result := text_input;

  -- Lowercase Turkish characters
  result := replace(result, 'ı', 'i');
  result := replace(result, 'ğ', 'g');
  result := replace(result, 'ü', 'u');
  result := replace(result, 'ş', 's');
  result := replace(result, 'ö', 'o');
  result := replace(result, 'ç', 'c');

  -- Uppercase Turkish characters
  result := replace(result, 'İ', 'i');
  result := replace(result, 'I', 'i');
  result := replace(result, 'Ğ', 'g');
  result := replace(result, 'Ü', 'u');
  result := replace(result, 'Ş', 's');
  result := replace(result, 'Ö', 'o');
  result := replace(result, 'Ç', 'c');

  -- Convert to lowercase
  result := lower(result);

  -- Remove special characters (keep only alphanumeric, spaces, and hyphens)
  result := regexp_replace(result, '[^a-z0-9\s-]', '', 'g');

  -- Replace spaces with hyphens
  result := regexp_replace(result, '\s+', '-', 'g');

  -- Replace multiple hyphens with single hyphen
  result := regexp_replace(result, '-+', '-', 'g');

  -- Trim hyphens from start and end
  result := trim(both '-' from result);

  RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Regenerate all slugs with the new function
UPDATE brands SET slug = generate_slug(name);
UPDATE products SET slug = generate_slug(name);
