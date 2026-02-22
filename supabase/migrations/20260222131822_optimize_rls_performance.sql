/*
  # Optimize RLS Policy Performance

  1. Performance Improvements
    - Wrap all `auth.uid()` calls in SELECT statements
    - This ensures auth functions are evaluated once per query, not per row
    - Significantly improves query performance at scale

  2. Tables Updated
    - projects: All INSERT, UPDATE, DELETE policies
    - project_images: All INSERT, UPDATE, DELETE policies
    - customer_reviews: All INSERT, UPDATE, DELETE policies
    - site_settings: All INSERT, UPDATE, DELETE policies

  ## Important Notes
  - Using `(select auth.uid())` instead of `auth.uid()` prevents re-evaluation for each row
  - This is a best practice for RLS policies that need to scale
  - Security remains unchanged, only performance is improved
*/

-- Optimize projects table RLS policies
DROP POLICY IF EXISTS "Only authenticated users can insert projects" ON projects;
DROP POLICY IF EXISTS "Only authenticated users can update projects" ON projects;
DROP POLICY IF EXISTS "Only authenticated users can delete projects" ON projects;

CREATE POLICY "Only authenticated users can insert projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Only authenticated users can update projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Only authenticated users can delete projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- Optimize project_images table RLS policies
DROP POLICY IF EXISTS "Only authenticated users can insert project_images" ON project_images;
DROP POLICY IF EXISTS "Only authenticated users can update project_images" ON project_images;
DROP POLICY IF EXISTS "Only authenticated users can delete project_images" ON project_images;

CREATE POLICY "Only authenticated users can insert project_images"
  ON project_images
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Only authenticated users can update project_images"
  ON project_images
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Only authenticated users can delete project_images"
  ON project_images
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- Optimize customer_reviews table RLS policies
DROP POLICY IF EXISTS "Only authenticated users can insert reviews" ON customer_reviews;
DROP POLICY IF EXISTS "Only authenticated users can update reviews" ON customer_reviews;
DROP POLICY IF EXISTS "Only authenticated users can delete reviews" ON customer_reviews;

CREATE POLICY "Only authenticated users can insert reviews"
  ON customer_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Only authenticated users can update reviews"
  ON customer_reviews
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Only authenticated users can delete reviews"
  ON customer_reviews
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- Optimize site_settings table RLS policies
DROP POLICY IF EXISTS "Only authenticated users can insert site settings" ON site_settings;
DROP POLICY IF EXISTS "Only authenticated users can update site settings" ON site_settings;
DROP POLICY IF EXISTS "Only authenticated users can delete site settings" ON site_settings;

CREATE POLICY "Only authenticated users can insert site settings"
  ON site_settings
  FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Only authenticated users can update site settings"
  ON site_settings
  FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

CREATE POLICY "Only authenticated users can delete site settings"
  ON site_settings
  FOR DELETE
  TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
