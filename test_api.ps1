Write-Host "Testing Emotion Support Bot API..." -ForegroundColor Cyan
Write-Host ""

# 测试消息
$testMessage = "I feel very anxious today"

Write-Host "Sending message: $testMessage" -ForegroundColor Yellow
Write-Host ""

# 构建请求
$body = @{
    message = $testMessage
} | ConvertTo-Json

try {
    # 发送请求
    $response = Invoke-RestMethod -Uri "http://localhost:8000/chat" -Method POST -Body $body -ContentType "application/json"
    
    Write-Host "Response received!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Detected Emotion:" -ForegroundColor Magenta
    Write-Host "  Label: $($response.emotion.label)"
    Write-Host "  Scores:"
    $response.emotion.scores.PSObject.Properties | ForEach-Object {
        Write-Host "    $($_.Name): $([math]::Round($_.Value, 4))"
    }
    Write-Host ""
    Write-Host "Bot Response:" -ForegroundColor Magenta
    Write-Host $response.answer
    Write-Host ""
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "Make sure the server is running on http://localhost:8000" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
