Write-Host "Starting Emotion Support Bot Server..." -ForegroundColor Green
Write-Host ""
& "C:\Users\badger's thinkbook\AppData\Local\Programs\Python\Python313\python.exe" -m uvicorn app:app --reload --host 127.0.0.1 --port 8000
