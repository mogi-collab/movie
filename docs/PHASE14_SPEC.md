# Phase 14 — Legal & Rights Clearance

## Goal
Generate a concise clearance checklist and guidance for rights, releases, and legal obligations necessary for production and distribution.

## Scope (scaffold-first)
- UI placeholder component: `Phase14Legal` that can POST `{ projectId }` to the function route `/functions/v1/phase14-legal`.
- Server stub: `supabase/functions/phase14-legal/index.ts` — echoes payload and returns a success response.
- Unit test for UI that asserts render + fetch call.
- Integration test for function that asserts POST echoes payload and OPTIONS returns 200.

## Acceptance criteria
- `src/components/phases/Phase14Legal.tsx` exists and renders with a "Generate Clearance Checklist" button.
- Unit and integration tests for Phase 14 pass locally (Vitest).
- Documentation `docs/PHASE14_SPEC.md` exists with the above scope and acceptance criteria.

## Future work (follow-ups)
- Expand AI prompt templates and result persistence.
- Add form inputs to collect specifics (e.g., rights types, third parties) and show generated checklist items.
- Add e2e test that simulates a user generating a checklist and saving results.

---

Created: 2025-12-27
