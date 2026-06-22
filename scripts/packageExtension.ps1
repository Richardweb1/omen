$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$extensionRoot = Join-Path $repoRoot "extension"
$publicZip = Join-Path $repoRoot "web\public\omen-extension.zip"
$storeDirectory = Join-Path $repoRoot "store-assets"
$storeZip = Join-Path $storeDirectory "omen-pre-action-scan-v0.1.2.zip"
$stagingRoot = Join-Path $env:TEMP "omen-extension-store-package"
$resolvedTempRoot = [System.IO.Path]::GetFullPath($env:TEMP).TrimEnd('\') + '\'
$resolvedStagingRoot = [System.IO.Path]::GetFullPath($stagingRoot)

if (-not $resolvedStagingRoot.StartsWith($resolvedTempRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Refusing to use a staging directory outside the system temp folder."
}

$runtimeFiles = @(
  "manifest.json",
  "config.mjs",
  "popup.html",
  "popup.css",
  "popup.mjs",
  "popup-utils.mjs",
  "icons\icon-16.png",
  "icons\icon-32.png",
  "icons\icon-48.png",
  "icons\icon-128.png"
)

foreach ($relativePath in $runtimeFiles) {
  $sourcePath = Join-Path $extensionRoot $relativePath
  if (-not (Test-Path -LiteralPath $sourcePath)) {
    throw "Missing extension runtime file: $relativePath"
  }
}

if (Test-Path -LiteralPath $stagingRoot) {
  Remove-Item -LiteralPath $stagingRoot -Recurse -Force
}

New-Item -ItemType Directory -Path $stagingRoot | Out-Null

foreach ($relativePath in $runtimeFiles) {
  $sourcePath = Join-Path $extensionRoot $relativePath
  $destinationPath = Join-Path $stagingRoot $relativePath
  $destinationDirectory = Split-Path -Parent $destinationPath
  New-Item -ItemType Directory -Path $destinationDirectory -Force | Out-Null
  Copy-Item -LiteralPath $sourcePath -Destination $destinationPath
}

New-Item -ItemType Directory -Path $storeDirectory -Force | Out-Null
foreach ($zipPath in @($publicZip, $storeZip)) {
  if (Test-Path -LiteralPath $zipPath) {
    Remove-Item -LiteralPath $zipPath -Force
  }
  Compress-Archive -Path (Join-Path $stagingRoot "*") -DestinationPath $zipPath -CompressionLevel Optimal
}

Remove-Item -LiteralPath $stagingRoot -Recurse -Force

Write-Host "Created public download: $publicZip"
Write-Host "Created store package: $storeZip"
