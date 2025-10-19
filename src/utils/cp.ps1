# Continuous file copy script
$sourceFile = "./data/result.json"
$destinationFile = "./src/resultView/public/result.json"

# Check if source file exists
if (-not (Test-Path $sourceFile)) {
    Write-Error "Source file $sourceFile does not exist!"
    exit 1
}

# Create destination directory if it doesn't exist
$destinationDir = Split-Path $destinationFile -Parent
if (-not (Test-Path $destinationDir)) {
    New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
    Write-Host "Created destination directory: $destinationDir"
}

Write-Host "Starting file copy loop (Press Ctrl+C to stop)..."
Write-Host "Copying from: $sourceFile"
Write-Host "Copying to: $destinationFile"
Write-Host "Interval: 10 seconds"
Write-Host ""

try {
    while ($true) {
        if (Test-Path $sourceFile) {
            try {
                Copy-Item -Path $sourceFile -Destination $destinationFile -Force
                Write-Host "$(Get-Date -Format 'HH:mm:ss'): File copied successfully"
            }
            catch {
                Write-Error "Error copying file: $_"
            }
        } else {
            Write-Warning "$(Get-Date -Format 'HH:mm:ss'): Source file not found"
        }

        # Wait for 10 seconds
        Start-Sleep -Seconds 10
    }
}
catch {
    Write-Host "Script terminated: $_"
}
finally {
    Write-Host "File copy loop stopped."
}