# Simple PowerShell script to scan the working tree for common secret patterns
# Usage: pwsh -ExecutionPolicy Bypass -File scripts/scan_for_secrets.ps1

$patterns = @(
  'VITE_SUPABASE',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON',
  'ANTHROPIC',
  'OPENAI',
  'ghp_[A-Za-z0-9]+',
  'GITHUB_TOKEN',
  'SECRET',
  'API_KEY'
)

Write-Host "Scanning working tree for common secret patterns..."

foreach ($p in $patterns) {
  Write-Host "\nPattern: $p" -ForegroundColor Cyan
  try {
    # Use Select-String to search files excluding node_modules and .git
    $matches = Get-ChildItem -Recurse -File -Exclude node_modules, .git -ErrorAction SilentlyContinue | Select-String -Pattern $p -SimpleMatch -CaseSensitive:$false
    if ($matches) {
      $matches | ForEach-Object {
        Write-Host "`tMatch: $($_.Filename):$($_.LineNumber) -> $($_.Line.Trim())" -ForegroundColor Yellow
      }
    } else {
      Write-Host "`tNo matches in working tree" -ForegroundColor Green
    }
  } catch {
    Write-Host "`tError scanning for pattern: $p" -ForegroundColor Red
  }
}

Write-Host "\nFor commit-history scanning, install and run gitleaks (recommended): https://github.com/zricethezav/gitleaks" -ForegroundColor Magenta
Write-Host "gitleaks detect --source . --report-format json --report-path gitleaks-report.json" -ForegroundColor Magenta
