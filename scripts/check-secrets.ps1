$ErrorActionPreference = "Stop"

$patterns = @(
    'AKIA[0-9A-Z]{16}',
    'ASIA[0-9A-Z]{16}',
    'aws_secret_access_key',
    'mongodb(?:\+srv)?://[^\s"'']+:[^\s"'']+@',
    '-----BEGIN (?:RSA|EC|OPENSSH|DSA|PRIVATE) KEY-----',
    '(?i)(password|secret|token)\s*[:=]\s*["''][^"'']{12,}["'']'
)

$excluded = @(
    '.git',
    'frontend/node_modules',
    'frontend/dist',
    'backend/.venv',
    'backend/.audit-cache'
)

$files = & rg --files -g '!.git/**' -g '!frontend/node_modules/**' -g '!frontend/dist/**' -g '!backend/.venv/**' -g '!backend/.audit-cache/**' |
    ForEach-Object { Get-Item -LiteralPath $_ }
$files = $files | Where-Object {
    $_.Name -notin @('package-lock.json', 'model.weights.bin', 'ml5.min.js', 'p5.min.js') -and
    $_.FullName -ne (Join-Path (Get-Location) 'scripts/check-secrets.ps1')
}

$matches = foreach ($file in $files) {
    $text = Get-Content -Raw -LiteralPath $file.FullName -ErrorAction SilentlyContinue
    foreach ($pattern in $patterns) {
        if ($text -match $pattern) {
            [pscustomobject]@{ File = $file.FullName; Pattern = $pattern }
        }
    }
}

if ($matches) {
    $matches | Format-Table -AutoSize
    throw "Potential secret material found. Review the matches before committing."
}

Write-Output "Secret scan passed: no high-confidence credential patterns found."
