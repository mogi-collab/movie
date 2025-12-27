/*
  # AI Director Assistant - Core Database Schema

  1. New Tables
    - `projects` - Main project container
    - `director_inputs` - All director configuration inputs
    - `control_sliders` - Real-time control parameters
    - `ai_outputs` - Store outputs from each AI role
    - `debates` - Track multi-AI debates and discussions
    - `scripts` - Final script versions (Safe/Bold/Experimental)
    - `scenes` - Individual scene data
    - `characters` - Character profiles and arcs
    - `ideas` - Concept/idea generation outputs
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users accessing their own projects
    
  3. Core Features
    - Projects support multiple phases of development
    - AI outputs tracked separately per role
    - Debates maintain structured argument flow
    - Scripts track A/B/C variants
*/

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'concept',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_phases int[] DEFAULT '{}',
  current_phase int DEFAULT 1
);

-- Director inputs
CREATE TABLE IF NOT EXISTS director_inputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  core_theme text NOT NULL,
  message text,
  emotional_takeaway text,
  genre text[] NOT NULL,
  target_audience jsonb,
  cultural_context text,
  regional_context text,
  platform text NOT NULL,
  risk_appetite real DEFAULT 0.5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Control sliders
CREATE TABLE IF NOT EXISTS control_sliders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  emotion_intensity real DEFAULT 0.5,
  tension_aggression real DEFAULT 0.5,
  dialogue_density real DEFAULT 0.5,
  visual_symbolism real DEFAULT 0.5,
  pace real DEFAULT 0.5,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- AI Roles enum and outputs
CREATE TABLE IF NOT EXISTS ai_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase int NOT NULL,
  ai_role text NOT NULL,
  output_type text NOT NULL,
  content jsonb NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Ideas and concepts from Phase 1
CREATE TABLE IF NOT EXISTS ideas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  ai_role text NOT NULL,
  one_liner text,
  logline text,
  short_synopsis text,
  extended_synopsis text,
  hook_moment text,
  theme_conflict jsonb,
  moral_question text,
  originality_score real,
  philosophy_depth real,
  created_at timestamptz DEFAULT now()
);

-- Debates tracking
CREATE TABLE IF NOT EXISTS debates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  phase int NOT NULL,
  topic text NOT NULL,
  discussion jsonb NOT NULL,
  arguments jsonb,
  agreement_score real,
  conflict_intensity real,
  winner_perspective text,
  created_at timestamptz DEFAULT now()
);

-- Story outlines
CREATE TABLE IF NOT EXISTS story_outlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  ai_role text NOT NULL,
  act_one jsonb,
  act_two jsonb,
  act_three jsonb,
  emotional_arc jsonb,
  endings jsonb,
  created_at timestamptz DEFAULT now()
);

-- Scenes
CREATE TABLE IF NOT EXISTS scenes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  script_id uuid,
  scene_number int,
  slugline text,
  setting text,
  character_goal text,
  obstacle text,
  emotional_beat text,
  emotional_intensity real,
  dialogue_density real,
  action_description text,
  dialogue_content text,
  visual_metaphor text,
  effectiveness_score real,
  cost_estimate text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Characters
CREATE TABLE IF NOT EXISTS characters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  role text,
  backstory text,
  desire text,
  fear text,
  flaws jsonb,
  moral_code text,
  contradictions text,
  inner_voice text,
  arc_type text,
  relationships jsonb,
  consistency_score real,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Script versions (A/B/C)
CREATE TABLE IF NOT EXISTS scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  script_type text NOT NULL,
  title text,
  full_content text,
  scene_count int,
  word_count int,
  emotional_coherence real,
  logical_continuity real,
  audience_tolerance real,
  overall_score real,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Emotion tracking
CREATE TABLE IF NOT EXISTS emotion_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  script_id uuid,
  scene_id uuid,
  emotions jsonb NOT NULL,
  micro_emotions jsonb,
  intensity_level real,
  empathy_score real,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE director_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE control_sliders ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE debates ENABLE ROW LEVEL SECURITY;
ALTER TABLE story_outlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE emotion_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for all child tables (allow access if user owns the project)
CREATE POLICY "Access through project ownership"
  ON director_inputs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = director_inputs.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Create director inputs"
  ON director_inputs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = director_inputs.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Update director inputs"
  ON director_inputs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = director_inputs.project_id AND projects.user_id = auth.uid()
    )
  );

-- Apply similar policies to all other tables
CREATE POLICY "Access through project ownership"
  ON control_sliders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = control_sliders.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Create control sliders"
  ON control_sliders FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = control_sliders.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Update control sliders"
  ON control_sliders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = control_sliders.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Access ai_outputs"
  ON ai_outputs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = ai_outputs.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Create ai_outputs"
  ON ai_outputs FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = ai_outputs.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Access ideas"
  ON ideas FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = ideas.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Create ideas"
  ON ideas FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = ideas.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Access debates"
  ON debates FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = debates.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Create debates"
  ON debates FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = debates.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Access story_outlines"
  ON story_outlines FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = story_outlines.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Create story_outlines"
  ON story_outlines FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = story_outlines.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Access scenes"
  ON scenes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = scenes.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Create scenes"
  ON scenes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = scenes.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Update scenes"
  ON scenes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = scenes.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Access characters"
  ON characters FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = characters.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Create characters"
  ON characters FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = characters.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Update characters"
  ON characters FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = characters.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Access scripts"
  ON scripts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = scripts.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Create scripts"
  ON scripts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = scripts.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Access emotion_tracking"
  ON emotion_tracking FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = emotion_tracking.project_id AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Create emotion_tracking"
  ON emotion_tracking FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects WHERE projects.id = emotion_tracking.project_id AND projects.user_id = auth.uid()
    )
  );
