-- Add script_versions and exports tables for script versioning and artifact management
CREATE TABLE IF NOT EXISTS script_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id uuid REFERENCES scripts(id) ON DELETE CASCADE,
  project_id uuid NOT NULL,
  version_number integer NOT NULL,
  content text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  export_type text NOT NULL,
  artifact_url text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- index for quick lookups
CREATE INDEX IF NOT EXISTS idx_script_versions_script_id ON script_versions(script_id);
CREATE INDEX IF NOT EXISTS idx_exports_project_id ON exports(project_id);
