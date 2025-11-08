## AI 辅助聊天 + 情绪识别 Web

一个可本地运行的小型网页应用：
- 聊天对话，调用后端代理接入 OpenAI / Azure OpenAI / OpenRouter
- 输入框实时文本情绪识别（本地规则，无需联网）

### 运行步骤

1) 安装依赖

```bash
npm install
```

2) 复制环境变量模板并填写密钥

```bash
cp .env.example .env
```

在 `.env` 中至少填写对应提供商的密钥与配置：
- OpenAI: `OPENAI_API_KEY`，可选 `OPENAI_BASE_URL`、`DEFAULT_MODEL`
- Azure OpenAI: `AZURE_OPENAI_API_KEY`、`AZURE_OPENAI_ENDPOINT`、`AZURE_OPENAI_DEPLOYMENT`
- OpenRouter: `OPENROUTER_API_KEY`，可选 `OPENROUTER_BASE_URL`、`OPENROUTER_SITE_URL`、`OPENROUTER_APP_NAME`

3) 启动服务

```bash
npm run start
```

访问 `http://localhost:3000`。

### 前端使用说明

- 顶部选择提供商与模型；Azure 场景下模型可留空（由服务端部署名决定）。
- 输入框实时显示情绪结果（标签+极性分值），不调用任何外部接口。
- Ctrl+Enter 发送，或点击“发送”。

### 接入 AI API 的方式说明

本项目通过后端代理统一转发，隐藏 API 密钥，浏览器端不暴露密钥：

- 统一接口：`POST /api/chat`

请求体示例：

```json
{
  "provider": "openai", // openai | azure | openrouter
  "model": "gpt-4o-mini",
  "temperature": 0.7,
  "messages": [
    { "role": "user", "content": "你好" }
  ]
}
```

返回：

```json
{ "content": "助手回复文本", "raw": { "...上游完整响应..." } }
```

如需改为流式输出，可在 `server.js` 中将 `/api/chat` 调整为 `stream=true` 并使用 SSE/分块读取实现。

### 如何改成你已有的后端

- 如果你已有 OpenAI 兼容网关，只需在 `.env` 设置 `OPENAI_BASE_URL` 和 `OPENAI_API_KEY` 即可。
- 若只用一个提供商，可在 `public/index.html` 固定 `provider`，或在 `server.js` 写死默认值。

### 📚 高级功能文档

想要更强大的 AI 能力？查看以下文档：

#### 🚀 [快速开始：5分钟接入 RAG](docs/Quick_Start.md)
- 让 AI 能够访问你的文档（PDF、Word、TXT）
- 解决 AI 知识过时问题
- 无需训练模型，成本低廉

#### 📖 [LLM 和 RAG 完全指南](docs/LLM_RAG_Guide.md)
- 详细的 LLM 接入教程（OpenAI、Azure、OpenRouter）
- RAG（检索增强生成）系统实现
- 模型微调（Fine-tuning）实战
- 成本优化技巧
- 10+ 实战示例代码

#### 🛠️ 快速设置
```bash
# 运行自动设置脚本
node scripts/setup_rag.js

# 安装 RAG 依赖
npm install openai chromadb uuid pdf-parse mammoth multer
```

### 如何辅助我完成你的项目

告诉我：
- 你想用的云厂商/模型（如 OpenAI gpt-4o、Azure 部署名、OpenRouter 指定模型）。
- 是否需要流式对话、对话历史保存、登录鉴权、多会话等扩展。
- 是否需要更精细的情绪识别（可切换到服务端模型或引入更丰富词典）。
- **是否需要 RAG 功能**（访问私有文档、知识库问答）。
我可以按你的需求扩展路由、前端 UI、数据存储方案，并接入 CI/CD。


