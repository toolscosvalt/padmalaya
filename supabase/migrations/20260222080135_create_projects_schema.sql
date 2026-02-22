/*
  # Padmalaya Group Real Estate Website Schema

  ## Overview
  Creates the database structure for the Padmalaya Group real estate website,
  including projects, images, and site settings.

  ## New Tables
  
  ### `projects`
  Stores all real estate projects (completed and ongoing)
  - `id` (uuid, primary key)
  - `name` (text) - Project name
  - `slug` (text, unique) - URL-friendly identifier
  - `tagline` (text) - Brief description
  - `description` (text) - Full project description
  - `location` (text) - Project location
  - `status` (text) - 'completed' or 'ongoing'
  - `external_url` (text, nullable) - For ongoing projects that redirect externally
  - `hero_image_url` (text) - Main listing image
  - `year_completed` (integer, nullable) - Year of completion
  - `total_units` (integer, nullable) - Number of units
  - `total_area` (text, nullable) - Total project area
  - `display_order` (integer) - For controlling display order
  - `is_featured` (boolean) - Featured projects
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### `project_images`
  Stores multiple images for each project
  - `id` (uuid, primary key)
  - `project_id` (uuid, foreign key)
  - `image_url` (text) - Image URL
  - `category` (text) - 'exterior', 'interior', 'common_areas', 'location'
  - `display_order` (integer)
  - `caption` (text, nullable)
  - `created_at` (timestamptz)

  ### `site_settings`
  Stores site-wide content and settings
  - `id` (uuid, primary key)
  - `key` (text, unique) - Setting identifier
  - `value` (jsonb) - Setting value (flexible structure)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Public read access for all data (this is a public website)
  - No insert/update/delete from frontend (content managed separately)
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  tagline text,
  description text,
  location text NOT NULL,
  status text NOT NULL CHECK (status IN ('completed', 'ongoing')),
  external_url text,
  hero_image_url text NOT NULL,
  year_completed integer,
  total_units integer,
  total_area text,
  display_order integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create project_images table
CREATE TABLE IF NOT EXISTS project_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  category text CHECK (category IN ('exterior', 'interior', 'common_areas', 'location')),
  display_order integer DEFAULT 0,
  caption text,
  created_at timestamptz DEFAULT now()
);

-- Create site_settings table
CREATE TABLE IF NOT EXISTS site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_display_order ON projects(display_order);
CREATE INDEX IF NOT EXISTS idx_project_images_project_id ON project_images(project_id);
CREATE INDEX IF NOT EXISTS idx_project_images_display_order ON project_images(project_id, display_order);

-- Enable Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to projects"
  ON projects FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public read access to project_images"
  ON project_images FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public read access to site_settings"
  ON site_settings FOR SELECT
  TO anon
  USING (true);

-- Insert sample data for development
INSERT INTO projects (name, slug, tagline, description, location, status, hero_image_url, year_completed, total_units, total_area, display_order, is_featured)
VALUES 
  (
    'Padmalaya Heights',
    'padmalaya-heights',
    'Elevated Living in the Heart of the City',
    'Padmalaya Heights represents our commitment to quality construction and thoughtful design. Completed in 2018, this residential complex features modern amenities while maintaining the warmth of community living.',
    'Jubilee Hills, Hyderabad',
    'completed',
    'https://images.pexels.com/photos/1732414/pexels-photo-1732414.jpeg?auto=compress&cs=tinysrgb&w=1200',
    2018,
    48,
    '85,000 sq ft',
    1,
    true
  ),
  (
    'Padmalaya Towers',
    'padmalaya-towers',
    'A Legacy of Trust and Quality',
    'One of our landmark projects, Padmalaya Towers has stood the test of time. With its strategic location and robust construction, it continues to be a sought-after address.',
    'Banjara Hills, Hyderabad',
    'completed',
    'https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1200',
    2015,
    36,
    '65,000 sq ft',
    2,
    true
  ),
  (
    'Padmalaya Dezire Homes',
    'padmalaya-dezire-homes',
    'Your Dream Home Awaits',
    'Our latest ongoing project brings together modern design and sustainable living. Currently under construction with expected completion in 2027.',
    'Gachibowli, Hyderabad',
    'ongoing',
    'https://images.pexels.com/photos/1643389/pexels-photo-1643389.jpeg?auto=compress&cs=tinysrgb&w=1200',
    NULL,
    72,
    '120,000 sq ft',
    3,
    true
  ),
  (
    'Padmalaya Residency',
    'padmalaya-residency',
    'Where Comfort Meets Elegance',
    'Completed in 2020, Padmalaya Residency offers spacious apartments with attention to every detail. A perfect blend of luxury and functionality.',
    'Madhapur, Hyderabad',
    'completed',
    'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1200',
    2020,
    54,
    '95,000 sq ft',
    4,
    false
  );

-- Insert sample project images
INSERT INTO project_images (project_id, image_url, category, display_order, caption)
SELECT 
  p.id,
  'https://images.pexels.com/photos/1732414/pexels-photo-1732414.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'exterior',
  1,
  'Front Elevation'
FROM projects p WHERE p.slug = 'padmalaya-heights'
UNION ALL
SELECT 
  p.id,
  'https://images.pexels.com/photos/2251247/pexels-photo-2251247.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'interior',
  2,
  'Spacious Living Room'
FROM projects p WHERE p.slug = 'padmalaya-heights'
UNION ALL
SELECT 
  p.id,
  'https://images.pexels.com/photos/271816/pexels-photo-271816.jpeg?auto=compress&cs=tinysrgb&w=1200',
  'common_areas',
  3,
  'Lobby Area'
FROM projects p WHERE p.slug = 'padmalaya-heights';

-- Insert site settings
INSERT INTO site_settings (key, value)
VALUES 
  ('hero', '{"headline": "Moments Made Permanent", "subheadline": "Building legacies of trust and quality since 1995", "cta_text": "Explore Our Projects", "cta_link": "/projects"}'),
  ('metrics', '{"years_of_experience": 30, "projects_completed": 25, "happy_families": 1200, "sq_ft_developed": "2.5M"}'),
  ('about', '{"title": "Three Decades of Building Trust", "content": "Since 1995, Padmalaya Group has been synonymous with quality construction and timeless design. What began as a vision to create lasting homes has grown into a legacy of trust, built one project at a time.\n\nOur approach is simple: we build homes we would be proud to live in ourselves. Every project reflects our commitment to structural integrity, thoughtful planning, and attention to detail that stands the test of time.", "ceo_name": "Rajesh Kumar", "ceo_message": "Real estate is not just about buildings—it is about creating spaces where families build their futures. Every project we undertake carries the weight of this responsibility."}'),
  ('contact', '{"phone": "+91 98765 43210", "email": "info@padmalayagroup.com", "whatsapp": "+919876543210", "address": "Road No. 12, Banjara Hills, Hyderabad - 500034"}')
ON CONFLICT (key) DO NOTHING;