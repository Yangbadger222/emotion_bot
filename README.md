# 情感支持机器人 - 运行指南

## 快速开始 🚀

### 1. 启动服务器
```powershell
.\start_server.ps1
```
或者双击 `start_server.bat`

### 2. 测试 API
打开新的 PowerShell 窗口，运行：
```powershell
.\test_api.ps1
```

### 3. 使用 Web 界面测试
在浏览器中访问：http://localhost:8000/docs

---

## 完整安装步骤（首次运行）

### 1. 安装依赖
```powershell
pip install -r requirements.txt
```

### 2. 构建 RAG 索引
```powershell
& "C:\Users\badger's thinkbook\AppData\Local\Programs\Python\Python313\python.exe" rag\build_index.py
```

### 3. 启动服务器
```powershell
.\start_server.ps1
```

## 测试 API

### 使用 PowerShell 测试
```powershell
$body = @{
    message = "I'm feeling very anxious and stressed today"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8000/chat" -Method POST -Body $body -ContentType "application/json"
```

### 使用浏览器测试
访问: http://localhost:8000/docs
在 Swagger UI 中测试 `/chat` 端点

## 项目结构

```
bot/
├── app.py                  # FastAPI 主应用
├── config.py              # 配置文件（包含 API 密钥）
├── llm.py                 # OpenAI LLM 调用
├── requirements.txt       # Python 依赖
├── data/
│   └── kb/               # 知识库文档
│       ├── anxiety_management.txt
│       ├── depression_support.txt
│       └── stress_relief.txt
├── models/
│   └── emotion_model.py  # 情感分类模型
└── rag/
    ├── build_index.py    # 构建向量索引
    └── query.py          # 查询向量数据库
```

## 工作流程

1. 用户发送消息到 `/chat` 端点
2. 情感分类模型识别用户情绪（negative/neutral/positive）
3. RAG 系统从知识库检索相关上下文
4. 将情绪标签和上下文传递给 GPT-4o-mini
5. 生成同理心回复并返回给用户

## 注意事项

- 首次运行会下载情感分类模型（约 500MB）
- 确保已构建 RAG 索引再启动服务
- API 密钥已配置在 config.py 中
- 如需修改模型，在 llm.py 中更改 model 参数

## 常见问题

**Q: 依赖安装失败？**
A: 如果 torch 安装失败，可以访问 https://pytorch.org 选择适合您系统的版本

**Q: 知识库为空？**
A: 运行 `python rag/build_index.py` 构建索引

**Q: 服务启动后无响应？**
A: 检查端口 8000 是否被占用，可以修改端口号
