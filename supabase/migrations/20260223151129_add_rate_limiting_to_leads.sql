/*
  # Add Rate Limiting Support to Leads

  ## Summary
  Adds a `source_ip` column to the leads table to enable IP-based rate limiting
  checks in the edge function. Also adds a composite index to efficiently query
  recent submissions by email or IP.

  ## Changes to Existing Tables
  - `leads`
    - Added `source_ip` (text, nullable) - stores the submitter's IP address for rate limiting

  ## New Indexes
  - `leads_email_created_at_idx` - fast lookup of recent submissions by email
  - `leads_ip_created_at_idx` - fast lookup of recent submissions by IP

  ## Important Notes
  1. Rate limiting logic runs in the edge function, not via DB triggers
  2. IP is stored only for abuse prevention; it is never displayed in the admin UI
  3. The column is nullable to support cases where IP cannot be determined
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'source_ip'
  ) THEN
    ALTER TABLE leads ADD COLUMN source_ip text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS leads_email_created_at_idx ON leads (email, created_at DESC);
CREATE INDEX IF NOT EXISTS leads_ip_created_at_idx ON leads (source_ip, created_at DESC);
