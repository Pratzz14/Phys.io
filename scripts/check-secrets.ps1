$ErrorActionPreference = "Stop"

$patterns = @(
    'AKIA[0-9A-Z]{16}',
    'ASIA[0-9A-Z]{16}',
    'aws_secret_access_key',
    'mongodb(?:\+srv)?://[^\s"'']+:[^\s"'']+@',
    '-----BEGIN (?:RSA|EC|OPENSSH|DSA|PRIVATE) KEY-----',
    '(?i)(password|secret|token)\s*[:=]\s*["''][^"'']{12,}["'']'
)

$repositoryRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Push-Location $repositoryRoot
try {
    $gitDirectory = Join-Path $repositoryRoot ".git"
    $paths = & git "--git-dir=$gitDirectory" "--work-tree=$repositoryRoot" ls-files --cached --others --exclude-standard
    if ($LASTEXITCODE -ne 0) {
        throw "Unable to list repository files with git."
    }

    $files = $paths | ForEach-Object {
        $absolutePath = Join-Path $repositoryRoot $_
        if (
            [System.IO.File]::Exists($absolutePath) -and
            (Split-Path -Leaf $absolutePath) -notin @('package-lock.json', 'model.weights.bin', 'ml5.min.js', 'p5.min.js') -and
            $absolutePath -ne (Join-Path $repositoryRoot 'scripts/check-secrets.ps1')
        ) {
            $absolutePath
        }
    }

    $matches = foreach ($file in $files) {
        $text = Get-Content -Raw -LiteralPath $file -ErrorAction SilentlyContinue
        foreach ($pattern in $patterns) {
            if ($text -match $pattern) {
                [pscustomobject]@{ File = $file; Pattern = $pattern }
            }
        }
    }

    if ($matches) {
        $matches | Format-Table -AutoSize
        throw "Potential secret material found. Review the matches before committing."
    }

    Write-Output "Secret scan passed: no high-confidence credential patterns found."
}
finally {
    Pop-Location
}
