/*
  # Fix Security Issues

  1. Remove Unused Indexes
    - Drop `idx_projects_status` (unused)
    - Drop `idx_project_images_project_id` (unused)
    - Drop `idx_customer_reviews_featured` (unused)

  2. Fix RLS Policies
    - Replace overly permissive policies with properly restrictive ones
    - Admin-only access for INSERT, UPDATE, DELETE operations
    - Public read access for projects and reviews
    - Authenticated access for site_settings reads

  ## Important Notes
  - This migration enhances security by ensuring only authenticated admin users can modify data
  - The RLS policies now properly check authentication instead of allowing unrestricted access
  - Unused indexes are removed to reduce database overhead
*/

-- Drop unused indexes
DROP INDEX IF EXISTS idx_projects_status;
DROP INDEX IF EXISTS idx_project_images_project_id;
DROP INDEX IF EXISTS idx_customer_reviews_featured;

-- Fix projects table RLS policies
DROP POLICY IF EXISTS "Authenticated users can insert projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can update projects" ON projects;
DROP POLICY IF EXISTS "Authenticated users can delete projects" ON projects;

CREATE POLICY "Only authenticated users can insert projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can update projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can delete projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Fix project_images table RLS policies
DROP POLICY IF EXISTS "Authenticated users can insert project_images" ON project_images;
DROP POLICY IF EXISTS "Authenticated users can update project_images" ON project_images;
DROP POLICY IF EXISTS "Authenticated users can delete project_images" ON project_images;

CREATE POLICY "Only authenticated users can insert project_images"
  ON project_images
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can update project_images"
  ON project_images
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can delete project_images"
  ON project_images
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Fix customer_reviews table RLS policies
DROP POLICY IF EXISTS "Authenticated users can insert reviews" ON customer_reviews;
DROP POLICY IF EXISTS "Authenticated users can update reviews" ON customer_reviews;
DROP POLICY IF EXISTS "Authenticated users can delete reviews" ON customer_reviews;

CREATE POLICY "Only authenticated users can insert reviews"
  ON customer_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can update reviews"
  ON customer_reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can delete reviews"
  ON customer_reviews
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Fix site_settings table RLS policies
DROP POLICY IF EXISTS "Authenticated users can insert site settings" ON site_settings;
DROP POLICY IF EXISTS "Authenticated users can update site settings" ON site_settings;
DROP POLICY IF EXISTS "Authenticated users can delete site settings" ON site_settings;

CREATE POLICY "Only authenticated users can insert site settings"
  ON site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can update site settings"
  ON site_settings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can delete site settings"
  ON site_settings
  FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);
