# Rotating Secrets & Tokens 🔐

This document provides a compact checklist and commands to rotate short-lived or compromised tokens used during triage.

> Use this whenever a token (PAT, API key, service role, etc.) may have been exposed or used temporarily. Follow the steps in order.

---

## 1) Identify what needs rotation ✅

- GitHub PATs (personal access tokens) used for API access or artifact downloads (e.g., `ghp_...`).
- GitHub Actions secrets (e.g., `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`).
- Supabase keys (anon & service role).
- Third-party API keys (e.g., `ANTHROPIC_API_KEY`, OpenAI keys, other provider keys).
- Any environment variables in CI environments or .env files.


## 2) Quick local audit (working tree)

Run this PowerShell script (project root) to search the working tree for suspicious tokens (bundles of common patterns):

```powershell
# scripts/scan_for_secrets.ps1
# Usage: powershell -ExecutionPolicy Bypass -File scripts/scan_for_secrets.ps1
.
```

If matches are found, treat the occurrence as potentially exposed and rotate the key immediately.


## 3) Scan commit history (recommended)

For a historical scan use a tool that inspects git history such as `gitleaks` (recommended) or `truffleHog`:

- Install gitleaks: `brew install gitleaks` (macOS) or follow https://github.com/zricethezav/gitleaks
- Run: `gitleaks detect --source . --report-format json --report-path gitleaks-report.json`

Review the report and rotate any keys found in history.


## 4) Rotate keys / tokens

General steps (provider-specific steps below):

1. Revoke or delete the existing token in the provider's dashboard (GitHub, Supabase, Anthropic, etc.).
2. Create a new token/secret with the minimum required scope.
3. Update any CI secrets (GitHub Actions → Settings → Secrets & variables → Actions) with the new value.
4. Update local `.env` files (and ask team members to update) or instruct them to re-run setup.
5. Confirm services (CI, dev/staging) pick up new values and run tests.


### GitHub (PATs)

- Revoke the token: GitHub → Settings → Developer settings → Personal access tokens → Revoke.
- If the token was used with the `gh` CLI stored credentials, run `gh auth logout` on machines that used it.
- If the token was added to a secret in a repo, add a new secret value and remove the old one (or replace it).


### GitHub Actions secrets

- Web UI: Settings → Secrets & variables → Actions → New repository secret.
- Or use `gh` CLI to set: `gh secret set VITE_SUPABASE_ANON_KEY --body "<newvalue>" --repo <owner>/<repo>`
- Remove any stale secrets (delete the key) once the new value is set in all required repos.


### Supabase

- Go to Supabase project → Settings → API:
  - Rotate `anon` & `service_role` keys as needed.
  - Update GitHub secrets with the rotated values.


### Anthropic / other AI providers

- Use provider dashboard to rotate API keys.
- Replace values in GitHub Secrets with new keys.


## 5) Revoke temporary CI artifacts & credentials (if possible)

If you used a short-lived PAT to download artifacts or access the repo, consider revoking it immediately.


## 6) Post-rotation verification

- Run `npm test` locally and in CI.
- Confirm workflows are green and relevant e2e/integration tests pass.


## 7) Add prevention steps

- Add `gitleaks` as an optional CI job (detect leaked secrets in PRs) — consider as follow-up.
- Add a short `docs/ROTATING_SECRETS.md` into your security checklist and onboarding instructions.


## 8) Quick checklist (copyable)

- [ ] Run `powershell -ExecutionPolicy Bypass -File scripts/scan_for_secrets.ps1` locally
- [ ] Run `gitleaks detect --source . --report-format json --report-path gitleaks-report.json`
- [ ] Revoke exposed tokens on provider dashboards
- [ ] Create new keys/tokens with minimal scopes
- [ ] Update GitHub Secrets and CI envs
- [ ] Re-run CI and confirm green

---

If you want, I can add an optional `gitleaks` CI job to fail PRs when leaks are detected — say the word and I'll add it as a follow-up PR.