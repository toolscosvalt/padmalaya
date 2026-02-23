/*
  # Create Leads Table

  ## Summary
  Creates a lead generation table for capturing inquiries submitted via the Contact page form.

  ## New Tables
  - `leads`
    - `id` (uuid, primary key) - Unique identifier
    - `name` (text, not null) - Full name of the lead, max 100 chars
    - `email` (text, not null) - Email address, validated format
    - `phone` (text, not null) - Contact number, max 20 chars
    - `preferred_contact_time` (text) - When the lead prefers to be contacted (morning/afternoon/evening/anytime)
    - `interest` (text, not null) - What they are interested in: ongoing_project / completed_project / investment / general
    - `message` (text) - Optional message, max 1000 chars
    - `status` (text) - Lead status: new / contacted / qualified / closed
    - `created_at` (timestamptz) - Timestamp of submission
    - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - RLS enabled on `leads` table
  - Public (anonymous) INSERT allowed - anyone can submit a lead
  - Authenticated users (admins) can SELECT, UPDATE leads
  - Rate limiting handled at application/edge function level

  ## Important Notes
  1. The table stores raw lead data from the contact form
  2. Admin can update status to track lead progression
  3. Google Sheets sync is handled via an Edge Function triggered on insert
*/

CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 100),
  email text NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$'),
  phone text NOT NULL CHECK (char_length(phone) >= 7 AND char_length(phone) <= 20),
  preferred_contact_time text NOT NULL DEFAULT 'anytime' CHECK (preferred_contact_time IN ('morning', 'afternoon', 'evening', 'anytime')),
  interest text NOT NULL CHECK (interest IN ('ongoing_project', 'completed_project', 'investment', 'general')),
  message text CHECK (message IS NULL OR char_length(message) <= 1000),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a lead"
  ON leads
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can view leads"
  ON leads
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update lead status"
  ON leads
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS leads_created_at_idx ON leads (created_at DESC);
CREATE INDEX IF NOT EXISTS leads_status_idx ON leads (status);
CREATE INDEX IF NOT EXISTS leads_interest_idx ON leads (interest);

CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at_trigger
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();
