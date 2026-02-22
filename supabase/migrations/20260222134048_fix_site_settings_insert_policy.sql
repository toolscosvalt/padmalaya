/*
  # Fix Site Settings Insert Policy

  1. Purpose
    - Allow authenticated users to insert new settings via upsert operations
    - Maintain security while enabling settings management

  2. Changes
    - Add INSERT policy for authenticated users on site_settings table
    - Allows admin users to create new setting entries

  3. Security
    - Only authenticated users can insert
    - Works with existing UPDATE and SELECT policies
*/

-- Add INSERT policy for site_settings
CREATE POLICY "Authenticated users can insert settings"
  ON site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);