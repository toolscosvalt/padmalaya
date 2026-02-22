/*
  # Add Admin Policies for Projects and Images

  1. Changes
    - Add policies for authenticated users (admins) to manage projects
    - Add policies for authenticated users (admins) to manage project images
    - Allows full CRUD operations (SELECT, INSERT, UPDATE, DELETE) for authenticated users
  
  2. Security
    - Authenticated users have full control over projects and images
    - Anonymous users can only read (existing policies remain)
*/

-- Projects: Allow authenticated users full access
CREATE POLICY "Authenticated users can read projects"
  ON projects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete projects"
  ON projects FOR DELETE
  TO authenticated
  USING (true);

-- Project Images: Allow authenticated users full access
CREATE POLICY "Authenticated users can read project_images"
  ON project_images FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert project_images"
  ON project_images FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update project_images"
  ON project_images FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete project_images"
  ON project_images FOR DELETE
  TO authenticated
  USING (true);