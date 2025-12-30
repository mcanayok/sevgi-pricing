-- Add color column to brands table
ALTER TABLE brands ADD COLUMN IF NOT EXISTS color TEXT;

-- Set brand colors based on their branding
-- Fropie: White with black text (special brand)
UPDATE brands SET color = '#FFFFFF' WHERE name = 'Fropie' OR name = 'Fropy';

-- Trendyol: Yellow (as requested)
UPDATE brands SET color = '#FFC107' WHERE name ILIKE '%trendyol%';

-- Major retailers with brand colors
UPDATE brands SET color = '#FF6B00' WHERE name ILIKE '%hepsiburada%'; -- Orange
UPDATE brands SET color = '#FF9900' WHERE name ILIKE '%amazon%';      -- Amazon orange
UPDATE brands SET color = '#7C3AED' WHERE name ILIKE '%migros%';      -- Purple
UPDATE brands SET color = '#0066CC' WHERE name ILIKE '%carrefour%';   -- Blue
UPDATE brands SET color = '#E53E3E' WHERE name ILIKE '%şok%' OR name ILIKE '%sok%'; -- Red
UPDATE brands SET color = '#F97316' WHERE name ILIKE '%a101%';        -- Orange
UPDATE brands SET color = '#3B82F6' WHERE name ILIKE '%bim%';         -- Blue

-- Product brands with distinct colors
UPDATE brands SET color = '#10B981' WHERE name ILIKE '%aroha%';       -- Emerald
UPDATE brands SET color = '#8B5CF6' WHERE name ILIKE '%fellas%';      -- Violet
UPDATE brands SET color = '#EC4899' WHERE name ILIKE '%rawsome%';     -- Pink
UPDATE brands SET color = '#14B8A6' WHERE name ILIKE '%naturiga%';    -- Teal
UPDATE brands SET color = '#F59E0B' WHERE name ILIKE '%wefood%';      -- Amber
UPDATE brands SET color = '#6366F1' WHERE name ILIKE '%protein ocean%'; -- Indigo
UPDATE brands SET color = '#EF4444' WHERE name ILIKE '%corny%';       -- Red
UPDATE brands SET color = '#06B6D4' WHERE name ILIKE '%yummate%';     -- Cyan
UPDATE brands SET color = '#84CC16' WHERE name ILIKE '%züber%' OR name ILIKE '%zuber%'; -- Lime
UPDATE brands SET color = '#A855F7' WHERE name ILIKE '%patiswiss%';   -- Purple
UPDATE brands SET color = '#22C55E' WHERE name ILIKE '%vegeat%';      -- Green
UPDATE brands SET color = '#F43F5E' WHERE name ILIKE '%bite%';        -- Rose
UPDATE brands SET color = '#0EA5E9' WHERE name ILIKE '%kellog%';      -- Sky blue
UPDATE brands SET color = '#D946EF' WHERE name ILIKE '%uniq2go%';     -- Fuchsia
UPDATE brands SET color = '#FB923C' WHERE name ILIKE '%delly%';       -- Orange
UPDATE brands SET color = '#4ADE80' WHERE name ILIKE '%saf%';         -- Green
UPDATE brands SET color = '#FACC15' WHERE name ILIKE '%waspco%';      -- Yellow
UPDATE brands SET color = '#2DD4BF' WHERE name ILIKE '%mom%';         -- Teal
UPDATE brands SET color = '#818CF8' WHERE name ILIKE '%bahs%';        -- Indigo

-- Default gray for any remaining brands
UPDATE brands SET color = '#64748b' WHERE color IS NULL;
