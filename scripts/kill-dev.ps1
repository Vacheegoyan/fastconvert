# Stop any process using port 3000 and remove Next.js dev lock
# Run: .\scripts\kill-dev.ps1

$port = 3000
$lockPath = Join-Path $PSScriptRoot "..\.next\dev\lock"

Write-Host "Checking port $port..."
$proc = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($proc) {
  foreach ($p in $proc) {
    Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
    Write-Host "Stopped process $p (was using port $port)"
  }
} else {
  Write-Host "No process found on port $port"
}

if (Test-Path $lockPath) {
  Remove-Item $lockPath -Force
  Write-Host "Removed lock: $lockPath"
} else {
  Write-Host "No lock file found"
}

Write-Host "Done. You can now run: npm run dev"
