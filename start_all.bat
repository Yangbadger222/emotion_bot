@echo off
echo ================================================
echo   启动完整系统：Python 后端 + Node.js 前端
echo ================================================
echo.

echo [1/2] 启动 Python 后端 (端口 8000)...
start "Python Backend" cmd /k "cd /d %~dp0 && "C:\Users\badger's thinkbook\AppData\Local\Programs\Python\Python313\python.exe" -m uvicorn app:app --reload --host 127.0.0.1 --port 8000"

timeout /t 3 >nul

echo [2/2] 启动 Node.js 前端 (端口 3000)...
if exist "%~dp0ai\package.json" (
    start "Node.js Frontend" cmd /k "cd /d %~dp0ai && npm start"
) else (
    echo 错误: 未找到 ai 文件夹
    pause
    exit /b 1
)

echo.
echo 启动完成！
echo.
echo 访问：
echo   前端界面: http://localhost:3000
echo   后端 API: http://localhost:8000/docs
echo.
echo 按任意键退出此窗口（不影响服务运行）...
pause >nul
