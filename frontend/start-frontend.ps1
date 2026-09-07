param(
    [switch]$InstallDeps,
    [int]$Port = 5173,
    [string]$BindHost = '0.0.0.0'
)

$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectRoot

$packageJson = Join-Path $projectRoot 'package.json'
if (-not (Test-Path $packageJson)) {
    Write-Error 'package.json was not found in the frontend project root.'
}

$npmCommand = Get-Command npm.cmd -ErrorAction SilentlyContinue
if (-not $npmCommand) {
    $npmCommand = Get-Command npm -ErrorAction SilentlyContinue
}

if (-not $npmCommand) {
    Write-Error 'npm was not found in PATH. Install Node.js and npm before starting the frontend.'
}

function Install-FrontendDependencies {
    Write-Host 'Installing frontend dependencies with npm install...'
    & $npmCommand.Source install
    if ($LASTEXITCODE -ne 0) {
        Write-Error 'npm install failed. Resolve the npm errors and retry.'
    }
}

$viteBinary = Join-Path $projectRoot 'node_modules\.bin\vite.cmd'
$needsDeps = $InstallDeps -or -not (Test-Path $viteBinary)

if ($needsDeps) {
    Install-FrontendDependencies
}

Write-Host "Starting frontend on http://localhost:$Port ..."
& $npmCommand.Source run dev -- --host $BindHost --port $Port