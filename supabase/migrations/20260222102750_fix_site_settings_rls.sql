/*
  # Fix Site Settings RLS Policies

  1. Changes
    - Drop existing restrictive policies
    - Add proper policies for authenticated users to manage settings
    - Allow upsert operations (INSERT + UPDATE)

  2. Security
    - Only authenticated users can modify settings
    - Public read access remains for displaying logo
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can update site settings" ON site_settings;
DROP POLICY IF EXISTS "Authenticated users can insert site settings" ON site_settings;

-- Create new policies for authenticated users
CREATE POLICY "Authenticated users can insert site settings"
  ON site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update site settings"
  ON site_settings
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete site settings"
  ON site_settings
  FOR DELETE
  TO authenticated
  USING (true);