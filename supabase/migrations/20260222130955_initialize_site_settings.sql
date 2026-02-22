/*
  # Initialize Site Settings

  1. Purpose
    - Initialize hero and metrics settings with default values
    - Ensure site_settings table has required entries

  2. Changes
    - Insert default hero settings if not exists
    - Insert default metrics settings if not exists

  3. Notes
    - Uses ON CONFLICT to avoid duplicates
    - Provides sensible defaults for new installations
*/

INSERT INTO site_settings (key, value)
VALUES 
  ('hero', '{"headline": "Moments Made Permanent", "subheadline": "Building legacies of trust and quality since 1982", "cta_text": "Explore Our Projects", "cta_link": "/projects"}'::jsonb),
  ('metrics', '{"years_of_experience": 40, "projects_completed": 10, "happy_families": 500, "sq_ft_developed": "5.5 Lakh"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
