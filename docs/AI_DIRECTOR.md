# AI Director Assistant — Multi-Phase Filmmaking Intelligence System

This document describes the high-level architecture, model choices, and phase responsibilities for the AI Director Assistant.

## Global AI Stack (reference)

| Capability | API / Model |
|---|---|
| Core reasoning & generation | Google Gemini 1.5 Flash / Pro |
| Backup LLM | Mistral-7B / LLaMA-3-8B (Hugging Face) |
| Multi-AI orchestration | CrewAI |
| Emotion classification | GoEmotions (DistilBERT) |
| Dialogue emotion | DistilBERT Emotion |
| Logic & consistency | spaCy + KeyBERT |
| Memory & recall | FAISS + SentenceTransformers |
| Visual pre-vis | Stable Diffusion |
| Audience prediction | Custom ML (scikit-learn) |
| UI | Streamlit (MVP) / React (future) |

## Database schema (initial)

- projects
- director_inputs
- control_sliders
- ai_outputs_{role}
- debates
- scene_analysis
- script_versions
- character_profiles
- emotion_tracks
- audience_predictions

Use PostgreSQL when available; SQLite is acceptable for quick local runs / CI tests.

## High-level flow

1. Director provides inputs (forms / sliders).
2. Orchestrator invokes role-specific LLMs (via `ai.config.json` defaults or env overrides).
3. CrewAI coordinates multi-AI debates (if enabled).
4. Outputs are stored in `ai_outputs_{role}` and presented in the UI.
5. Memory (FAISS) stores embeddings for search and consistency checks.

## Phases & responsibilities (summary)

- Phase 1: Idea & Concept Engine — Gemini for loglines, FAISS for originality checks.
- Phase 2: Multi-AI Story Generation — Gemini for outline, GoEmotions for emotional arc.
- Phase 3: AI Debate & Argument Engine — CrewAI to orchestrate critique/defense cycles.
- Phase 4: Script Convergence — Multiple Gemini variants, spaCy validation.
- Phase 5: Character Design & Arc — Gemini + FAISS for memory.
- Phase 6: Story Structure & Logic Validation — spaCy + KeyBERT.
- Phase 7–11: Formatting, Dialogue, Emotion, Micro-intel, Genre-specific logic.
- Phase 12–16: Visual pre-vis, Audience simulation, Adaptive endings, Director control, Learning & memory.

(See `docs/PHASE*_SPEC.md` for per-phase detail; if missing, we will scaffold these.)

## Implementation guidelines

- Use `ai.config.json` for machine-readable defaults; allow override via env vars (`GEMINI_MODEL`, `HF_DEFAULT_MODEL`).
- Keep real API keys out of source control (use `.env` locally and GitHub Actions secrets for CI).
- Use small, testable server-side functions (Supabase edge functions) to run phases; each function should accept a JSON payload and return structured JSON.
- Add unit and integration tests for deterministic behavior and mocking external LLM calls.

## Next steps

- Add a Streamlit-based MVP that can drive phase runs locally.
- Implement a `run-director` orchestrator to accept composite runs (e.g., run Phase 1 → Phase 2 → Phase 3 in sequence) and emit an execution trace.
- Add per-phase server stubs and tests.

---

Created: 2025-12-27
