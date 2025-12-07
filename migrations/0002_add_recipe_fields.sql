
-- Add recipe-specific fields to products table
ALTER TABLE products ADD COLUMN IF NOT EXISTS type VARCHAR(50);
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_recipe BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS batch_size NUMERIC(10, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS total_for_1kg NUMERIC(12, 2);
ALTER TABLE products ADD COLUMN IF NOT EXISTS effective_fg_produced NUMERIC(10, 2);

-- Update existing recipe products
UPDATE products 
SET is_recipe = true, 
    type = 'recipe'
WHERE type IS NULL AND id IN (
  SELECT DISTINCT product_id FROM product_ingredients
);
