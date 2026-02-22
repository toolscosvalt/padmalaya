/*
  # Add MD image setting

  1. New Row
    - Inserts a 'md_image' key into site_settings for storing
      the Managing Director (Veer Saraf) photo URL.
*/

INSERT INTO site_settings (key, value)
VALUES ('md_image', 'null'::jsonb)
ON CONFLICT (key) DO NOTHING;
