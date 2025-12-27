Param(
  [string]$RemoteUrl
)

# Apply the generated patch and push the fix branch to a remote
# Usage:
# 1) Provide a remote URL (https or ssh): ./apply_patch_and_push.ps1 -RemoteUrl "https://github.com/you/repo.git"
# 2) If you already have a remote named 'origin', omit the -RemoteUrl parameter and the script will use it.

Set-StrictMode -Version Latest

# Ensure we are in the repo root (script expects to be invoked from project folder)
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Push-Location $root

# Find patch
$patch = Join-Path $root "..\patches\0001-tests-relax-SSR-OutputDashboard-assertion-render-hea.patch"
if (-Not (Test-Path $patch)) {
  Write-Host "Patch file not found at $patch" -ForegroundColor Yellow
  Write-Host "Make sure the patch exists or run 'git format-patch -1 HEAD -o ../patches' to create it." -ForegroundColor Yellow
  Exit 1
}

if ($RemoteUrl) {
  Write-Host "Adding remote 'origin' -> $RemoteUrl"
  git remote add origin $RemoteUrl
}

$remotes = git remote -v
if (-Not $remotes) {
  Write-Host "No git remote found. Provide a remote URL via -RemoteUrl <url> to push the branch." -ForegroundColor Red
  Exit 1
}

# Apply patch
Write-Host "Applying patch..."
git apply $patch
if ($LASTEXITCODE -ne 0) {
  Write-Host "Failed to apply patch. You may need to apply it manually." -ForegroundColor Red
  Exit 1
}

# Create branch and commit if not present
$branch = 'fix/output-dashboard-ssr-test'
$exists = git rev-parse --verify $branch 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Creating branch $branch"
  git checkout -b $branch
  git add -A
  git commit -m "tests: relax SSR OutputDashboard assertion (render header, not async card)"
} else {
  git checkout $branch
  git add -A
  git commit -m "tests: relax SSR OutputDashboard assertion (render header, not async card)" || Write-Host "No changes to commit" -ForegroundColor Yellow
}

# Push
Write-Host "Pushing branch to origin..."
git push --set-upstream origin $branch
if ($LASTEXITCODE -ne 0) {
  Write-Host "Push failed. Check your remote and credentials." -ForegroundColor Red
  Exit 1
}

Write-Host "Branch pushed. Create a PR using the repository UI or the GitHub CLI (if configured):" -ForegroundColor Green
Write-Host "gh pr create --base main --head $branch --title \"tests: relax SSR OutputDashboard assertion (render header, not async card)\" --body \"See PULL_REQUEST.md for details\""

Pop-Location
