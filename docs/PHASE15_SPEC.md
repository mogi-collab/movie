# Phase 15 — Release & Promotion

## Goal
Generate an initial release and promotion plan covering release windows, marketing channels, festival strategy, and basic PR guidance.

## Scope (scaffold-first)
- UI placeholder component: `Phase15Release` that can POST `{ projectId }` to the function route `/functions/v1/phase15-release`.
- Server stub: `supabase/functions/phase15-release/index.ts` — echoes payload and returns a success response.
- Unit test for UI that asserts render + fetch call.
- Integration test for function that asserts POST echoes payload and OPTIONS returns 200.

## Acceptance criteria
- `src/components/phases/Phase15Release.tsx` exists and renders with a "Generate Release Plan" button.
- Unit and integration tests for Phase 15 pass locally (Vitest).
- Documentation `docs/PHASE15_SPEC.md` exists with the above scope and acceptance criteria.

## Future work
- Add inputs for target release date, target festivals, marketing budget, and target channels.
- Persist generated plan to the project and allow editing.
- Add e2e test to simulate a user generating and saving a release plan.

---

Created: 2025-12-27
