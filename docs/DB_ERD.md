# AI Director Assistant — DB ERD

This file contains a high-level ERD (Mermaid) and notes for the core schema implemented in
`supabase/migrations/20251227053429_001_create_core_tables.sql`.

```mermaid
erDiagram
    PROJECTS ||--o{ DIRECTOR_INPUTS : has
    PROJECTS ||--o{ CONTROL_SLIDERS : has
    PROJECTS ||--o{ AI_OUTPUTS : has
    PROJECTS ||--o{ IDEAS : has
    PROJECTS ||--o{ DEBATES : has
    PROJECTS ||--o{ STORY_OUTLINES : has
    PROJECTS ||--o{ SCENES : has
    PROJECTS ||--o{ CHARACTERS : has
    PROJECTS ||--o{ SCRIPTS : has
    PROJECTS ||--o{ EMOTION_TRACKING : has

    SCRIPTS ||--o{ SCENES : contains
    SCENES ||--o{ EMOTION_TRACKING : "has metrics"

    PROJECTS {
      uuid id PK
      uuid user_id
      text title
      text description
      int[] completed_phases
      int current_phase
    }

    DIRECTOR_INPUTS {
      uuid id PK
      uuid project_id FK
      text core_theme
      jsonb target_audience
      real risk_appetite
    }

    CONTROL_SLIDERS {
      uuid id PK
      uuid project_id FK
      real emotion_intensity
      real tension_aggression
      real dialogue_density
    }

    AI_OUTPUTS {
      uuid id PK
      uuid project_id FK
      int phase
      text ai_role
      jsonb content
    }

    IDEAS {
      uuid id PK
      uuid project_id FK
      text one_liner
      text logline
      real originality_score
    }

    DEBATES {
      uuid id PK
      uuid project_id FK
      int phase
      jsonb discussion
      real agreement_score
    }

    STORY_OUTLINES {
      uuid id PK
      uuid project_id FK
      jsonb act_one
      jsonb act_two
      jsonb act_three
    }

    SCENES {
      uuid id PK
      uuid project_id FK
      int scene_number
      text slugline
      real emotional_intensity
      real effectiveness_score
    }

    CHARACTERS {
      uuid id PK
      uuid project_id FK
      text name
      jsonb relationships
      real consistency_score
    }

    SCRIPTS {
      uuid id PK
      uuid project_id FK
      text script_type
      text full_content
      int scene_count
    }

    EMOTION_TRACKING {
      uuid id PK
      uuid project_id FK
      uuid scene_id FK
      jsonb emotions
    }
```

Notes:
- RLS policies are applied in the main migration; the ERD focuses on relationships and cardinality.
- Use the sample seed SQL in `supabase/migrations/20251227060500_002_seed_core_tables.sql` to populate a dev project and verify queries.
- Acceptance criteria for Task 1: ERD reviewed, seed migration exists, and local dev DB can be seeded with sample data.
