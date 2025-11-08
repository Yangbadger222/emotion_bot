# 快速开始：5分钟接入 RAG

本指南帮助您快速理解和接入 RAG（检索增强生成）系统。

## 🎯 什么是 RAG？

**简单理解：** 让 AI 能够访问您的文档来回答问题。

```
传统 AI：只能根据训练时的知识回答
RAG AI：先查找你的文档，再基于文档内容回答
```

**优势：**
- ✅ 解决 AI 知识过时问题
- ✅ 可以访问私有数据（公司文档、产品手册等）
- ✅ 减少 AI "瞎编"（幻觉）
- ✅ 成本低，无需训练模型

## 🚀 最简单的开始方式

### 步骤 1: 运行设置脚本（30秒）

```bash
node scripts/setup_rag.js
```

这会自动创建所需的目录结构和示例文件。

### 步骤 2: 安装依赖（2分钟）

```bash
npm install openai chromadb uuid pdf-parse mammoth multer
```

### 步骤 3: 配置 API Key（1分钟）

复制 `.env.example` 为 `.env`，填入你的 OpenAI API Key：

```env
OPENAI_API_KEY=sk-your-actual-key-here
CHROMA_URL=http://localhost:8000
```

> 📝 如何获取 API Key？访问 https://platform.openai.com/api-keys

### 步骤 4: 启动向量数据库（30秒）

**选项 A - 使用 Docker（推荐）：**
```bash
docker run -p 8000:8000 chromadb/chroma
```

**选项 B - 使用 Python：**
```bash
pip install chromadb
chroma run --path ./chroma_data
```

### 步骤 5: 复制核心代码（1分钟）

从 `docs/LLM_RAG_Guide.md` 复制以下文件到项目：

1. `src/services/llm/openai.js` - OpenAI 服务封装
2. `src/services/rag/vectorStore.js` - 向量存储
3. `src/services/rag/documentLoader.js` - 文档加载器
4. `src/services/rag/ragService.js` - RAG 主服务

### 步骤 6: 测试（30秒）

```bash
node examples/test_rag.js
```

应该看到类似输出：
```
✅ 文档已索引

问题: 如何退货?
答案: 根据产品使用手册，退货流程如下：1. 7天内申请无理由退货...

来源: [{ source: 'sample.txt', type: 'text' }]
```

## 💡 实际使用示例

### 示例 1：索引你的文档

```javascript
import { RAGService } from './src/services/rag/ragService.js';

const rag = new RAGService();
await rag.initialize();

// 索引文本文件
await rag.indexDocument('./docs/manual.txt');

// 索引 PDF
await rag.indexDocument('./docs/policy.pdf');

// 索引 Word 文档
await rag.indexDocument('./docs/guide.docx');
```

### 示例 2：向 AI 提问

```javascript
const result = await rag.query('退货需要几天内申请?');

console.log(result.answer);  // AI 基于文档的回答
console.log(result.sources); // 引用的文档来源
```

### 示例 3：集成到现有聊天应用

在您的 `server.js` 中添加 RAG 端点：

```javascript
import { RAGService } from './src/services/rag/ragService.js';

const ragService = new RAGService();
await ragService.initialize();

// RAG 查询接口
app.post('/api/rag/query', async (req, res) => {
  const { question } = req.body;
  const result = await ragService.query(question);
  res.json(result);
});
```

前端调用：

```javascript
// public/app.js
async function askRAG(question) {
  const response = await fetch('/api/rag/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });
  
  const { answer, sources } = await response.json();
  console.log('答案:', answer);
  console.log('来源:', sources);
}
```

## 📊 成本估算

使用 OpenAI 的 RAG 系统成本：

| 操作 | 模型 | 成本 |
|------|------|------|
| 文档向量化 | text-embedding-3-small | $0.02/1M tokens |
| 查询回答 | gpt-4o-mini | $0.15/1M 输入 + $0.60/1M 输出 |

**实际例子：**
- 索引 100 页文档（约 5 万字）：~$0.01
- 1000 次查询（每次返回 200 字）：~$0.50

**总计：** 每月几美元就能支撑中小型应用。

## 🔧 常见问题排查

### 问题 1: ChromaDB 连接失败

```
Error: Failed to connect to ChromaDB
```

**解决：**
1. 确认 ChromaDB 正在运行：`curl http://localhost:8000/api/v1/heartbeat`
2. 检查 `.env` 中的 `CHROMA_URL` 配置

### 问题 2: OpenAI API 调用失败

```
Error: Incorrect API key provided
```

**解决：**
1. 检查 `.env` 中的 `OPENAI_API_KEY` 是否正确
2. 确认 API Key 有足够的额度

### 问题 3: 文档加载失败

```
Error: 不支持的文件类型
```

**解决：**
当前支持的格式：`.txt`, `.md`, `.pdf`, `.docx`  
如需支持其他格式，参考 `documentLoader.js` 扩展。

## 📚 下一步学习

### 初级（已完成 ✅）
- [x] 理解 RAG 概念
- [x] 成功运行示例
- [x] 索引自己的文档

### 中级（继续学习）
- [ ] 优化文档分块策略（chunk size）
- [ ] 实现对话历史记忆
- [ ] 添加文档管理界面
- [ ] 使用不同的向量数据库（Pinecone、Weaviate）

### 高级（深入研究）
- [ ] 多语言文档处理
- [ ] 混合检索（向量 + 关键词）
- [ ] 自定义 Embedding 模型
- [ ] 分布式向量存储

## 🎓 深入学习资源

- **完整文档：** `docs/LLM_RAG_Guide.md`
- **OpenAI 文档：** https://platform.openai.com/docs/guides/embeddings
- **ChromaDB 文档：** https://docs.trychroma.com
- **RAG 论文：** https://arxiv.org/abs/2005.11401

## 💬 需要帮助？

遇到问题？参考：
1. `docs/LLM_RAG_Guide.md` - 详细的故障排查章节
2. 项目 Issues - 提交 bug 或功能请求
3. OpenAI 社区论坛 - https://community.openai.com

---

**记住：** RAG 不是魔法，它只是让 AI 能够"查资料"后再回答。质量好的文档 = 质量好的答案！

祝你成功！🎉
