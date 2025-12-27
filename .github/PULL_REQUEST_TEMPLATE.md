<!-- Title: short, imperative, lower-case, e.g. "fix: make X faster"

Describe the motivation and context for this change. List any dependencies and how CI should be expected to run.
-->

### Summary
A short description of the change and why it is needed.

### Changes
- Bullet list of changes made

### How to test locally
1. Apply the patch if the branch is not pushed: `git apply ../patches/0001-tests-relax-SSR-OutputDashboard-assertion-render-hea.patch`
2. Run tests: `npm test`
3. Run typecheck: `npm run typecheck`

### Checklist
- [ ] Tests pass locally
- [ ] CI passes on this PR
- [ ] Documentation updated (README, PULL_REQUEST.md)
- [ ] Request at least one reviewer

### Notes
Any special notes for reviewers or maintainers (build time, flaky tests, manual steps)
