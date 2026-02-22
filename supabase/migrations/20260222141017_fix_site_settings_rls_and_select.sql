/*
  # Fix site_settings RLS policies

  1. Problem
    - SELECT policy only allows 'anon' role, not 'authenticated' role
    - This means logged-in admin users cannot read site_settings rows
    - UPDATE silently matches 0 rows because the USING clause blocks the read

  2. Fix
    - Drop existing SELECT policy and recreate it for both anon and authenticated roles
*/

DROP POLICY IF EXISTS "Allow public read access to site_settings" ON site_settings;

CREATE POLICY "Allow public read access to site_settings"
  ON site_settings
  FOR SELECT
  TO anon, authenticated
  USING (true);
