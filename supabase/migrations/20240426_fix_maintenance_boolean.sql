-- Fix Platform Settings to use BOOLEAN for maintenance mode
-- Since the previous migration used JSONB, we will drop and recreate or alter.
-- For simplicity and precision as requested by the user:

ALTER TABLE platform_settings 
ALTER COLUMN value TYPE BOOLEAN 
USING (value::text::boolean);

-- Ensure default is set correctly
INSERT INTO platform_settings (key, value) 
VALUES ('maintenance_mode', false) 
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
