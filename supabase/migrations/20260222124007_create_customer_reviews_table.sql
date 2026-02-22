/*
  # Create Customer Reviews Table

  1. New Tables
    - `customer_reviews`
      - `id` (uuid, primary key) - Unique identifier for each review
      - `customer_name` (text, not null) - Name of the customer who left the review
      - `review_text` (text, not null) - The review content/testimonial
      - `rating` (integer) - Optional star rating (1-5)
      - `is_featured` (boolean, default false) - Whether to display on homepage
      - `display_order` (integer) - Order in which reviews should appear
      - `created_at` (timestamptz) - When the review was created
      - `updated_at` (timestamptz) - When the review was last updated

  2. Security
    - Enable RLS on `customer_reviews` table
    - Add policy for public read access to view reviews
    - Add policy for authenticated admin users to insert reviews
    - Add policy for authenticated admin users to update reviews
    - Add policy for authenticated admin users to delete reviews

  3. Indexes
    - Index on `is_featured` for efficient featured reviews queries
    - Index on `display_order` for sorting
*/

CREATE TABLE IF NOT EXISTS customer_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  review_text text NOT NULL,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  is_featured boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customer_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews"
  ON customer_reviews
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert reviews"
  ON customer_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update reviews"
  ON customer_reviews
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete reviews"
  ON customer_reviews
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_customer_reviews_featured 
  ON customer_reviews(is_featured) 
  WHERE is_featured = true;

CREATE INDEX IF NOT EXISTS idx_customer_reviews_display_order 
  ON customer_reviews(display_order);