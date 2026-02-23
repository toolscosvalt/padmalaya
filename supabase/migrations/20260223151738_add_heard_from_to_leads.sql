/*
  # Add "Heard From" Field to Leads Table

  ## Summary
  Adds a `heard_from` column to the `leads` table to track how prospective customers
  discovered the company. This helps understand which marketing channels are most effective.

  ## Changes to Existing Tables
  - `leads`
    - Added `heard_from` (text, nullable) - stores the source through which the lead found the company
    - Added CHECK constraint to allow only predefined source values or NULL

  ## Allowed Values for heard_from
  - 'google_search' - Found via Google search
  - 'social_media' - Found via social media (Instagram, Facebook, etc.)
  - 'friend_family' - Referred by a friend or family member
  - 'newspaper_magazine' - Saw an advertisement in print media
  - 'hoarding_banner' - Saw a hoarding or outdoor banner
  - 'site_visit' - Visited a project site directly
  - 'existing_customer' - Already a customer / referral
  - 'other' - Any other source

  ## Important Notes
  1. Column is nullable so existing records are unaffected
  2. A new index is added for analytics queries filtering by source
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'heard_from'
  ) THEN
    ALTER TABLE leads ADD COLUMN heard_from text CHECK (
      heard_from IS NULL OR heard_from IN (
        'google_search',
        'social_media',
        'friend_family',
        'newspaper_magazine',
        'hoarding_banner',
        'site_visit',
        'existing_customer',
        'other'
      )
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS leads_heard_from_idx ON leads (heard_from);
