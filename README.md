# AI Director Assistant - Multi-AI Filmmaking Intelligence

A comprehensive, AI-powered creative writing and screenwriting platform that operates as a digital writer's room. The system harnesses six distinct AI perspectives working in parallel to generate, critique, and synthesize creative ideas into production-ready screenplays.

## System Architecture

### Core Features

**Multi-AI Orchestration**
- 6 AI Perspectives: Visionary, Classic, Emotional, Realist, Audience, Producer
- Independent generation preventing cross-contamination
- Structured debate system for creative conflict resolution
- Convergence algorithm synthesizing diverse viewpoints

**16-Phase Creative Workflow**

1. **Phase Setup** - Collect director vision and control parameters
2. **Phase 1** - Concept & Idea Generation (One-liner, logline, synopsis)
3. **Phase 2** - Story Outline Generation (Three-act structure per AI)
4. **Phase 3** - Multi-AI Debate (Structured argument and counter-argument)
5. **Phase 4** - Script Convergence (Safe vs Bold variants)
6. **Phase 5** - Character Design & Arcs
7. **Phase 6** - Story Structure & Logic Validation
8. **Phase 7** - Screenplay Formatting
9. **Phase 8** - Dialogue & Performance Direction
10. **Phase 9** - Emotion & Tension Tracking
11. **Phase 10** - Scene-Level Micro Intelligence
12. **Phase 11** - Genre-Specific Intelligence
13. **Phase 12** - Visual & Sound Direction
14. **Phase 13** - Audience Simulation
15. **Phase 14** - Adaptive Endings
16. **Phase 15** - Control & Real-time Adjustment
17. **Phase 16** - Learning System (Director preferences)

### Director Control Sliders

Fine-tune AI generation with five intuitive controls:
- **Emotion Intensity** (0-1): How emotionally charged is the story?
- **Tension Aggression** (0-1): How aggressive/suspenseful?
- **Dialogue Density** (0-1): How much dialogue vs. action?
- **Visual Symbolism** (0-1): How metaphorical/symbolic?
- **Pace** (0-1): Fast vs. slow pacing?

### AI Role Definitions

**Visionary**
- Bold, experimental, boundary-pushing
- Favors symbolic structures and thematic depth
- Embraces unconventional storytelling

**Classic**
- Grounded in proven storytelling rules
- Prioritizes clarity and emotional resonance
- Master of three-act structure

**Emotional**
- Focuses on character psychology and feelings
- Prioritizes emotional authenticity
- Guides empathy and connection

**Realist**
- Examines logic, motivation, believability
- Identifies plot holes and inconsistencies
- Ensures narrative coherence

**Audience**
- Simulates viewer engagement and reactions
- Predicts drop-off moments
- Optimizes entertainment value

**Producer**
- Balances art with practicality
- Considers efficiency and budgeting
- Identifies redundancies

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Vite** as build tool
- **Lucide React** for icons

### Backend
- **Supabase** for database and authentication
- **Edge Functions** for AI orchestration
- **Anthropic Claude** for AI generation

### Database Schema
- **Projects** - Project container with metadata
- **Director Inputs** - Creative vision parameters
- **Control Sliders** - Real-time generation controls
- **Ideas** - Concept outputs from Phase 1
- **Story Outlines** - Three-act structures from Phase 2
- **Debates** - Argument transcripts from Phase 3
- **Scripts** - Final screenplay versions from Phase 4
- **Scenes** - Individual scene data
- **Characters** - Character profiles and arcs

## Getting Started

### Prerequisites
- Node.js 16+
- Supabase account (automatic)
- Anthropic API key (for AI generation)

### Installation

```bash
npm install
npm run build
```

### Running Locally

```bash
npm run dev
```

Visit `http://localhost:5173`

## Continuous Integration (CI) 🔁

- The repository includes a GitHub Actions workflow at `.github/workflows/ci.yml` which runs lint, type checking, unit tests, and a dedicated integration-tests job.
- Integration tests in `tests/integration/` are designed to mock external AI and Supabase calls by default so they are safe to run on PRs.

### Optional Secrets for Full E2E

For true end-to-end runs that call Anthropic or Supabase REST APIs directly (not required for the included tests), configure the following repository secrets in GitHub:

- `ANTHROPIC_API_KEY` — your Anthropic API key (used by edge functions for production runs)
- `SUPABASE_URL` — your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key for server-side writes

### Optional Export & Storage Services

To enable real PDF generation and artifact storage in CI / production, provide one or both of the following environment variables (or implement an HTTP endpoint that the function can call):

- `PDF_SERVICE_URL` — an HTTP endpoint that accepts `{ html }` and returns `{ base64 }` with PDF bytes base64 encoded.
- `STORAGE_SERVICE_URL` — an HTTP endpoint that accepts `{ filename, base64, contentType }` and returns `{ url }` where the stored artifact is accessible. This can be an upload service that writes to S3/GCS.

---

## Applying patches & creating a PR (if you don't want to push from this workspace)

If you cannot push directly from this environment (no remote configured or no `gh` CLI), use the included patch and helper script to apply and push changes locally.

1. Apply the generated patch (from repo root):

   ```powershell
   git apply ../patches/0001-tests-relax-SSR-OutputDashboard-assertion-render-hea.patch
   ```

2. Or use the helper script to apply the patch and push to a remote (PowerShell):

   ```powershell
   cd project
   ./scripts/apply_patch_and_push.ps1 -RemoteUrl "https://github.com/<owner>/<repo>.git"
   ```

3. If you prefer to create a PR manually after pushing, the suggested PR title and body is in `PULL_REQUEST.md` and `.github/PULL_REQUEST_TEMPLATE.md`.

If you'd like me to push to a remote, provide a repo URL and I will attempt to push and give you the PR URL (or I can generate the PR body for you to paste).


If these services are not configured, the export functions will fall back to returning a data URL placeholder.

If these secrets are set, some workflows or manual runs may perform real API calls. The CI integration job does not require them because the tests mock network interactions.

## Usage Flow

### 1. Create a Project
- Dashboard allows creating new projects
- Define basic project details (title, description)

### 2. Configure Director Vision (Phase Setup)
- Enter core theme (e.g., "Love," "Revenge")
- Specify message and emotional takeaway
- Select genres (multi-select)
- Choose platform (Theatre, OTT, Mobile, Short Film)
- Define risk appetite (Safe ↔ Bold)
- Set control sliders for AI generation

### 3. Generate Concepts (Phase 1)
- All 6 AI roles generate unique concepts
- Outputs include:
  - One-liner
  - Logline
  - Short synopsis
  - Hook moment
  - Moral question
  - Theme conflict
  - Originality & philosophy scores

### 4. Generate Story Outlines (Phase 2)
- Each AI creates complete three-act structure
- Scenes outlined with descriptions
- Turning points and climaxes identified

### 5. Conduct AI Debates (Phase 3)
- AIs argue about key creative decisions
- Structured arguments and counter-arguments
- Agreement and conflict intensity scored

### 6. Synthesize Scripts (Phase 4)
- Two final scripts generated:
  - **Safe/Commercial** - Proven formula, broad appeal
  - **Bold/Artistic** - Experimental, unique vision
- Quality metrics for each:
  - Emotional coherence
  - Logical continuity
  - Audience tolerance

## Edge Functions Deployed

### generate-concepts
- Accepts: `projectId`
- Triggers concept generation for all 6 AI roles
- Returns: Array of `Idea` objects
- Stores: Ideas in database

### generate-stories
- Accepts: `projectId`
- Creates three-act outlines per AI role
- Returns: Array of `StoryOutline` objects

### generate-debates
- Accepts: `projectId`
- Conducts structured debates on story topics
- Returns: Array of `Debate` objects

### generate-scripts
- Accepts: `projectId`
- Synthesizes Safe and Bold script variants
- Returns: Array of `Script` objects

## Output Formats

### Project Output Dashboard
- Concept summary cards
- Debate transcripts with scoring
- Script comparison interface
- JSON export for further processing

### Export Options
- **JSON Report** - Complete project data
- **Screenplay** - Industry-standard format
- **Character Bible** - Detailed character profiles
- **Visual Direction** - Shot lists and mood boards

## Data Security

- **Row Level Security** enabled on all tables
- Users only access their own projects
- Authentication via Supabase Auth
- No sensitive data in logs

## Future Enhancements

- Real-time collaborative editing
- More AI perspectives
- Voice/audio screenplay reading
- Integration with casting databases
- Budget and scheduling tools
- Location scouting integration
- Shot planning and visualizations
- Virtual reality storyboarding

## License

MIT

## Support

For issues or feature requests, contact the development team.

---

**AI Director Assistant v1.0**
*Transforming Creative Vision into Production-Ready Screenplays*

---

## AI Integrations

This repository includes examples, helper wrappers, and CI templates to integrate with AI services (Gemini, Hugging Face, CrewAI, emotion models, memory stores, and visual models).

- Read the full guide: `docs/AI_INTEGRATION.md` (env setup, usage examples, and CI guidance)
- Examples: `scripts/gemini_gen.py`, `scripts/hf_gen.py`, `scripts/hf_example.js`
- TypeScript helpers: `src/lib/ai/gemini.ts`, `src/lib/ai/hf.ts`

> Security: Store API keys in GitHub secrets (e.g., `GEMINI_API_KEY`, `HF_API_TOKEN`) and avoid committing secrets to the repo.

