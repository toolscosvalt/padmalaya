/*
  # Add Project Detail Fields

  ## Changes
  Adds four new nullable columns to the `projects` table for enhanced project information:

  - `rera_number` (text) — RERA registration number (legal requirement under RERA Act 2016)
  - `flat_config` (text) — Flat configuration (e.g., "2BHK, 3BHK, 4BHK")
  - `builtup_area` (text) — Built-up area / size, supports ranges (e.g., "1200-2400 sq ft")
  - `towers` (text) — Number/description of towers (e.g., "2 Towers" or "3")

  ## Backward Compatibility
  All columns are nullable with no default values. Existing projects will have NULL
  for these fields and continue to work without modification.

  ## Security
  No RLS changes needed — these columns inherit existing table-level RLS policies.
*/

-- Add new project detail columns
ALTER TABLE projects ADD COLUMN IF NOT EXISTS rera_number text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS flat_config text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS builtup_area text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS towers text;

-- Add index on rera_number for lookup queries
CREATE INDEX IF NOT EXISTS idx_projects_rera_number ON projects(rera_number) WHERE rera_number IS NOT NULL;
