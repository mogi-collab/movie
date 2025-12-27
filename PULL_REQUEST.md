Title: tests: relax SSR OutputDashboard assertion (render header, not async card)

Description:
This PR contains a small test fix and additional client-side tests/helpers for the `OutputDashboard` component:

- Relaxed the original SSR test in `tests/OutputDashboardStructure.test.tsx` so it asserts deterministic SSR content (the static header) instead of an async-loaded card. This prevents flaky SSR tests that depend on client-side data fetching.
- Added a client-side test that mounts `OutputDashboard` in `jsdom` and stubs the `supabase` queries and the `generate-structure-check` function to assert that the Structure Coherence card is rendered after async load.
- Added `tests/test-utils.ts` and `tests/setupTests.ts` to provide reusable test helpers and expose them globally for UI tests.
- Added `vitest.config.ts` to configure the `jsdom` environment and wire the setup file.

How to apply (apply patch or push branch):
1. Apply the patch in `patches/0001-tests-relax-SSR-OutputDashboard-assertion-render-hea.patch` (created at repository root by this script):

   git apply ../patches/0001-tests-relax-SSR-OutputDashboard-assertion-render-hea.patch

2. Or, if you prefer to push the existing branch from this workspace:

   # add a remote (replace <remote-url> with your repo)
   git remote add origin <remote-url>
   git push --set-upstream origin fix/output-dashboard-ssr-test

3. Create a pull request with a standard title & body. Suggested PR text (also in this file header).

CI:
- The added tests use `jsdom` and `jsdom` is required as a dev dependency.
- After applying/pushing the branch, CI should run `npm test` and pass.

Notes:
- If you'd like, I can push this branch and open the PR for you — provide a remote URL or grant permission to create a GitHub repo with `gh`.
