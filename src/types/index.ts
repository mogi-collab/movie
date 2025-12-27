export type AIRole = 'visionary' | 'classic' | 'emotional' | 'realist' | 'audience' | 'producer';
export type Platform = 'theatre' | 'ott' | 'mobile' | 'short-film';
export type ScriptType = 'safe' | 'bold' | 'experimental';
export type CharacterArcType = 'positive' | 'negative' | 'flat' | 'tragic' | 'corruption' | 'redemption';
export type ProjectStatus = 'concept' | 'in-progress' | 'completed';
export type DebatePhase = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;

export interface Project {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
  completed_phases: number[];
  current_phase: number;
}

export interface DirectorInputs {
  id: string;
  project_id: string;
  core_theme: string;
  message?: string;
  emotional_takeaway?: string;
  genre: string[];
  target_audience: TargetAudience;
  cultural_context?: string;
  regional_context?: string;
  platform: Platform;
  risk_appetite: number;
  created_at: string;
  updated_at: string;
}

export interface TargetAudience {
  ageRange?: string;
  demographics?: string[];
  interests?: string[];
  description?: string;
}

export interface ControlSliders {
  id: string;
  project_id: string;
  emotion_intensity: number;
  tension_aggression: number;
  dialogue_density: number;
  visual_symbolism: number;
  pace: number;
  created_at: string;
  updated_at: string;
}

export interface AIOutput {
  id: string;
  project_id: string;
  phase: number;
  ai_role: AIRole;
  output_type: string;
  content: Record<string, any>;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface Idea {
  id: string;
  project_id: string;
  ai_role: AIRole;
  one_liner?: string;
  logline?: string;
  short_synopsis?: string;
  extended_synopsis?: string;
  hook_moment?: string;
  theme_conflict?: Record<string, any>;
  moral_question?: string;
  originality_score?: number;
  philosophy_depth?: number;
  created_at: string;
}

export interface Debate {
  id: string;
  project_id: string;
  phase: number;
  topic: string;
  discussion: DebateEntry[];
  arguments: DebateArgument[];
  agreement_score: number;
  conflict_intensity: number;
  winner_perspective?: string;
  minority_opinions?: DebateArgument[];
  created_at: string;
}

export interface DebateEntry {
  ai_role: AIRole;
  perspective: string;
  timestamp: string;
}

export interface DebateArgument {
  ai_role: AIRole;
  argument: string;
  strength: number;
  counter_arguments?: string[];
}

export interface StoryOutline {
  id: string;
  project_id: string;
  ai_role: AIRole;
  act_one: Act;
  act_two: Act;
  act_three: Act;
  emotional_arc: EmotionalArc[];
  endings: Ending[];
  created_at: string;
}

export interface EmotionalArc {
  act: number;
  emotion: string;
  description?: string;
}

export interface Act {
  title: string;
  scenes: SceneOutline[];
  turning_point?: string;
  emotional_climax?: string;
}

export interface SceneOutline {
  number: number;
  title: string;
  description: string;
  characters: string[];
  key_event?: string;
}

export interface Ending {
  type: string;
  description: string;
  emotional_impact: string;
  audience_satisfaction: number;
}

export interface Scene {
  id: string;
  project_id: string;
  script_id?: string;
  scene_number: number;
  slugline: string;
  setting: string;
  character_goal: string;
  obstacle: string;
  emotional_beat: string;
  emotional_intensity: number;
  dialogue_density: number;
  action_description: string;
  dialogue_content?: string;
  visual_metaphor?: string;
  effectiveness_score?: number;
  cost_estimate?: string;
  created_at: string;
  updated_at: string;
}

export interface Character {
  id: string;
  project_id: string;
  name: string;
  role: string;
  backstory?: string;
  desire?: string;
  fear?: string;
  flaws: Record<string, string>;
  moral_code?: string;
  contradictions?: string;
  inner_voice?: string;
  arc_type: CharacterArcType;
  relationships: RelationshipMap;
  consistency_score?: number;
  created_at: string;
  updated_at: string;
}

export interface RelationshipMap {
  [characterName: string]: {
    type: string;
    dynamic: string;
    tension: number;
  };
}

export interface Script {
  id: string;
  project_id: string;
  script_type: ScriptType;
  title?: string;
  full_content: string;
  scene_count: number;
  word_count: number;
  emotional_coherence: number;
  logical_continuity: number;
  audience_tolerance: number;
  overall_score: number;
  created_at: string;
  updated_at: string;
}

export interface ScriptVersion {
  id: string;
  script_id?: string;
  project_id: string;
  version_number: number;
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface ExportArtifact {
  id: string;
  project_id: string;
  export_type: string;
  artifact_url?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface EmotionTracking {
  id: string;
  project_id: string;
  script_id?: string;
  scene_id?: string;
  emotions: EmotionState;
  micro_emotions: MicroEmotionState;
  intensity_level: number;
  empathy_score: number;
  created_at: string;
}

export interface EmotionState {
  joy: number;
  sadness: number;
  fear: number;
  anger: number;
  love: number;
  shock: number;
  hope: number;
}

export interface MicroEmotionState {
  guilt?: number;
  envy?: number;
  relief?: number;
  [key: string]: number | undefined;
}

export interface ConceptLock {
  one_liner: string;
  logline: string;
  short_synopsis: string;
  extended_synopsis: string;
  hook_moment: string;
  theme_conflict: ThemeConflict;
  moral_question: string;
  originality_score: number;
  philosophy_depth: number;
  clarity_score: number;
}

export interface ThemeConflict {
  primary_theme: string;
  opposing_force: string;
  resolution?: string;
}

export interface DebugTranscript {
  phase: number;
  topic: string;
  debate_rounds: DebateRound[];
  agreement_summary: string;
  minority_opinions: string[];
}

export interface DebateRound {
  round_number: number;
  participants: DebateParticipant[];
  key_points: string[];
}

export interface DebateParticipant {
  ai_role: AIRole;
  position: string;
  argument_strength: number;
}

export interface CharacterBible {
  project_id: string;
  characters: CharacterProfile[];
  relationships: RelationshipMatrix;
  consistency_notes: string;
}

export interface CharacterProfile {
  character: Character;
  arc_graph: ArcPoint[];
  decision_predictions: DecisionPrediction[];
}

export interface ArcPoint {
  act: number;
  emotional_state: string;
  transformation_level: number;
}

export interface DecisionPrediction {
  situation: string;
  predicted_decision: string;
  reasoning: string;
  alternatives: string[];
}

export interface RelationshipMatrix {
  [pair: string]: RelationshipData;
}

export interface RelationshipData {
  tension: number;
  alignment: number;
  dependency: number;
  description: string;
}

export interface ScreenplayMetadata {
  title: string;
  script_type: ScriptType;
  emotional_coherence: number;
  logical_continuity: number;
  audience_tolerance: number;
  total_word_count: number;
  total_scenes: number;
}

export interface ScreenplayScene {
  scene_number: number;
  slugline: string;
  character_goal: string;
  obstacle: string;
  emotional_beat: string;
  emotional_intensity: number;
  dialogue_density: number;
  action: string;
  dialogue?: string;
  visual_metaphor?: string;
  effectiveness_score: number;
}

export interface EmotionAndTensionOverview {
  emotional_arc: {
    overall_trajectory: string;
    peak_moments: string[];
    valley_moments: string[];
  };
  tension_curve: {
    formula_explanation: string;
    key_tension_points: string[];
    relief_moments: string[];
  };
  heatmap_description: string;
}

export interface VisualAndSoundDirection {
  color_palette: string;
  dominant_colors: string[];
  visual_symbolism_level: number;
  shot_types: ShotTypeGuide[];
  camera_movements: CameraMovement[];
  music_guidance: MusicGuidance;
  sound_design_hints: string[];
}

export interface ShotTypeGuide {
  scene_type: string;
  recommended_shots: string[];
  psychological_effect: string;
}

export interface CameraMovement {
  type: string;
  psychological_effect: string;
  frequency: string;
}

export interface MusicGuidance {
  overall_tone: string;
  emotion_mapping: Record<string, string>;
  silence_moments: number;
}

export interface AudienceSimulation {
  youth_response: AudienceResponse;
  family_response: AudienceResponse;
  ott_binge_behavior: BingeBehavior;
  drop_off_probability: number;
  repeat_watch_potential: number;
  controversy_risk: string;
}

export interface AudienceResponse {
  engagement_score: number;
  emotional_connection: number;
  likelihood_to_recommend: number;
  key_moments: string[];
}

export interface BingeBehavior {
  episode_completion_rate: number;
  pause_points: number[];
  expected_watch_duration: string;
}

export interface DirectorNotes {
  overall_vision_summary: string;
  creative_decisions: string[];
  thematic_emphasis: string;
  audience_targeting: string;
  visual_style_notes: string;
  performance_direction: string[];
  post_production_considerations: string;
}
