-- Seed core tables for development/testing

-- Deterministic UUIDs for local dev
\set project_id '11111111-1111-1111-1111-111111111111'
\set user_id '22222222-2222-2222-2222-222222222222'

INSERT INTO projects (id, user_id, title, description, status, created_at, updated_at, completed_phases, current_phase)
VALUES (
  :'project_id',
  :'user_id',
  'Demo Project: AI Director Assistant',
  'Seed project for local development',
  'concept',
  now(), now(),
  ARRAY[]::int[],
  1
)
ON CONFLICT DO NOTHING;

INSERT INTO director_inputs (project_id, core_theme, message, emotional_takeaway, genre, target_audience, platform, risk_appetite)
VALUES (
  :'project_id',
  'Identity and ambition',
  'A small-town artist navigates fame and sacrifice',
  'Courage to face the cost of success',
  ARRAY['drama','indie'],
  '{"age_range":"18-45","regions":["US","EU"]}',
  'Theatrical',
  0.5
)
ON CONFLICT DO NOTHING;

INSERT INTO control_sliders (project_id, emotion_intensity, tension_aggression, dialogue_density, visual_symbolism, pace)
VALUES (:'project_id', 0.6, 0.4, 0.5, 0.5, 0.5) ON CONFLICT DO NOTHING;

INSERT INTO ideas (project_id, ai_role, one_liner, logline, short_synopsis, extended_synopsis, hook_moment, originality_score)
VALUES (
  :'project_id', 'Visionary', 'An artist trades privacy for legacy', 'When a small-town painter is thrust into the spotlight, she must choose between authenticity and commerce.', 'A painter becomes famous and must navigate betrayal and creative compromise.', 'Extended synopsis goes here.', 'A public unveiling goes wrong.', 0.82
) ON CONFLICT DO NOTHING;

INSERT INTO ai_outputs (project_id, phase, ai_role, output_type, content)
VALUES (
  :'project_id', 1, 'Visionary', 'concept', '{"one_liner":"An artist trades privacy for legacy","confidence":0.82}'::jsonb
) ON CONFLICT DO NOTHING;

INSERT INTO scripts (project_id, script_type, title, full_content, scene_count, word_count, emotional_coherence, logical_continuity, audience_tolerance, overall_score)
VALUES (
  :'project_id', 'safe', 'Demo Script (Safe)', 'INT. STUDIO - DAY\nArtist paints...', 5, 1200, 0.8, 0.85, 0.7, 0.8
) ON CONFLICT DO NOTHING;

INSERT INTO scenes (project_id, script_id, scene_number, slugline, setting, character_goal, emotional_beat, emotional_intensity)
VALUES (
  :'project_id', (SELECT id FROM scripts WHERE project_id = :'project_id' LIMIT 1), 1, 'INT. STUDIO - DAY', 'Small studio, early morning', 'Finish the painting', 'Determined', 0.7
) ON CONFLICT DO NOTHING;

INSERT INTO characters (project_id, name, role, backstory, desire, fear, arc_type)
VALUES (:'project_id', 'Maya', 'Protagonist', 'Grew up in a small town, moved to the city to pursue art', 'To be recognized', 'Losing her integrity', 'positive') ON CONFLICT DO NOTHING;

INSERT INTO debates (project_id, phase, topic, discussion, agreement_score)
VALUES (:'project_id', 2, 'Tone of Act 2', '[{"role":"Visionary","arg":"Lean into symbolism"},{"role":"Realist","arg":"Keep it grounded"}]'::jsonb, 0.5) ON CONFLICT DO NOTHING;

-- Minimal story outline
INSERT INTO story_outlines (project_id, ai_role, act_one, act_two, act_three, emotional_arc, endings)
VALUES (:'project_id', 'Visionary', '{"beats":[]}'::jsonb, '{"beats":[]}'::jsonb, '{"beats":[]}'::jsonb, '{"global":[]}'::jsonb, '{"safe":"happy_end"}'::jsonb) ON CONFLICT DO NOTHING;

-- Emotion tracking sample
INSERT INTO emotion_tracking (project_id, script_id, scene_id, emotions, micro_emotions, intensity_level, empathy_score)
VALUES (
  :'project_id', (SELECT id FROM scripts WHERE project_id = :'project_id' LIMIT 1), (SELECT id FROM scenes WHERE project_id = :'project_id' LIMIT 1), '{"joy":0.1,"tension":0.9}'::jsonb, '{"guilt":0.2}'::jsonb, 0.6, 0.7
) ON CONFLICT DO NOTHING;

-- Example query to verify seed
-- SELECT p.*, d.core_theme FROM projects p JOIN director_inputs d ON d.project_id = p.id WHERE p.id = '11111111-1111-1111-1111-111111111111';
