/*
  # Add CEO Image to Site Settings

  1. Purpose
    - Store CEO image URL in site_settings table
    - Allow admin to update CEO image from admin panel

  2. Changes
    - Insert new row for ceo_image setting if it doesn't exist
    - Set default empty string value

  3. Notes
    - Uses existing site_settings table structure
    - CEO image URL will be stored as a text value
*/

INSERT INTO site_settings (key, value)
VALUES ('ceo_image', '""'::jsonb)
ON CONFLICT (key) DO NOTHING;
