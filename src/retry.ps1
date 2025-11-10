$maxRetries = 8
$retryCount = 0
$success = $false

do {
    $retryCount++
    Write-Host "尝试启动 pnpm run run（第 $retryCount 次）..."

    # 执行 pnpm run run 命令
    pnpm run run

    # 检查上一条命令是否成功（$LASTEXITCODE 为 0 表示成功）
    if ($LASTEXITCODE -eq 0) {
        $success = $true
        Write-Host "pnpm run run 成功执行。"
    } else {
        Write-Host "pnpm run run 失败（退出码: $LASTEXITCODE）"
        if ($retryCount -lt $maxRetries) {
            Write-Host "等待 2 秒后重试..."
            Start-Sleep -Seconds 2
        }
    }
} while (-not $success -and $retryCount -lt $maxRetries)

if (-not $success) {
    Write-Host "经过 $maxRetries 次尝试后仍然失败。"
    exit 1
}