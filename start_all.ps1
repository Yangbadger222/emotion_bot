Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  情感支持机器人 - 完整系统启动" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# 检查 Python 后端
Write-Host "[检查 1/3] 检查 Python 后端..." -ForegroundColor Yellow
if (-not (Test-Path ".\app.py")) {
    Write-Host "错误: 未找到 app.py 文件" -ForegroundColor Red
    Write-Host "请确保在 d:\bot 目录下运行此脚本" -ForegroundColor Yellow
    pause
    exit 1
}
Write-Host "✓ Python 后端文件存在" -ForegroundColor Green

# 检查 Node.js 前端
Write-Host "[检查 2/3] 检查 Node.js 前端..." -ForegroundColor Yellow
if (-not (Test-Path ".\ai\package.json")) {
    Write-Host "错误: 未找到 ai 目录或 package.json" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "✓ Node.js 前端文件存在" -ForegroundColor Green

# 检查 .env 文件
Write-Host "[检查 3/3] 检查配置文件..." -ForegroundColor Yellow
if (-not (Test-Path ".\ai\.env")) {
    Write-Host "! 警告: 未找到 .env 文件" -ForegroundColor Yellow
    Write-Host "  请确保 ai\.env 文件已创建并包含 OPENAI_API_KEY" -ForegroundColor Yellow
} else {
    Write-Host "✓ .env 配置文件存在" -ForegroundColor Green
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  开始启动服务..." -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# 启动 Python 后端
Write-Host "[1/2] 启动 Python 后端 (端口 8000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; Write-Host '启动 Python 后端...' -ForegroundColor Green; & 'C:\Users\badger''s thinkbook\AppData\Local\Programs\Python\Python313\python.exe' -m uvicorn app:app --reload --host 127.0.0.1 --port 8000"

Start-Sleep -Seconds 5
Write-Host "✓ Python 后端已启动" -ForegroundColor Green

# 启动 Node.js 前端
Write-Host "[2/2] 启动 Node.js 前端 (端口 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\ai'; Write-Host '启动 Node.js 前端...' -ForegroundColor Green; npm start"

Start-Sleep -Seconds 3
Write-Host "✓ Node.js 前端已启动" -ForegroundColor Green

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "  系统启动完成！" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "访问地址：" -ForegroundColor Cyan
Write-Host "  前端界面: " -NoNewline -ForegroundColor White
Write-Host "http://localhost:3000" -ForegroundColor Yellow
Write-Host "  后端 API: " -NoNewline -ForegroundColor White
Write-Host "http://localhost:8000/docs" -ForegroundColor Yellow
Write-Host ""
Write-Host "使用说明：" -ForegroundColor Cyan
Write-Host "  1. 普通模式: 不勾选'情感支持模式'，使用标准 LLM" -ForegroundColor White
Write-Host "  2. 情感支持模式: 勾选后使用 RAG + 心理知识库" -ForegroundColor White
Write-Host ""
Write-Host "提示: 两个服务窗口将保持打开，关闭它们即可停止服务" -ForegroundColor Yellow
Write-Host ""
Write-Host "按任意键退出此窗口（不影响服务运行）..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
