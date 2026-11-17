$ErrorActionPreference = 'Stop'
node (Join-Path $PSScriptRoot 'study-check.cjs')
exit $LASTEXITCODE
