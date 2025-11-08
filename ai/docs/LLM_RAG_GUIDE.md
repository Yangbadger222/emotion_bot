# LLM 和 RAG 完全指南

## 目录
1. [基础概念](#基础概念)
2. [当前项目架构分析](#当前项目架构分析)
3. [接入 LLM 详解](#接入-llm-详解)
4. [RAG 系统实现](#rag-系统实现)
5. [模型训练与微调](#模型训练与微调)
6. [实战示例](#实战示例)
7. [成本优化](#成本优化)

---

## 基础概念

### 什么是 LLM（Large Language Model）？
LLM 是大型语言模型，如 GPT-4、Claude、文心一言等。它们通过海量文本训练，能够理解和生成人类语言。

**关键特点：**
- **预训练**：在大量文本上训练（如互联网文章、书籍）
- **上下文理解**：能理解对话历史
- **生成能力**：可以写作、编程、翻译、总结等

### 什么是 RAG（Retrieval-Augmented Generation）？
RAG = 检索增强生成，是一种让 LLM 访问外部知识的技术。

**工作流程：**
```
用户提问 → 检索相关文档 → 将文档+问题发给LLM → LLM生成答案
```

**优势：**
- 解决 LLM 知识过时问题
- 减少幻觉（瞎编）
- 可以访问私有数据（如公司文档）

---

## 当前项目架构分析

### 您的现有代码
```javascript
// 当前 /api/chat 端点（在 server.js 中）
app.post('/api/chat', async (req, res) => {
  const { messages, provider, model, temperature } = req.body;
  // 调用 OpenAI/Azure/OpenRouter API
  // 返回 LLM 回复
});
```

**现有能力：**
✅ 基础对话功能  
✅ 多提供商支持（OpenAI/Azure/OpenRouter）  
✅ 情绪识别（本地规则）  

**缺失能力：**
❌ 无法访问外部知识（RAG）  
❌ 无向量存储  
❌ 无文档上传功能  
❌ 无模型微调能力  

---

## 接入 LLM 详解

### 方式一：使用 OpenAI API（推荐新手）

#### 1. 获取 API Key
```bash
# 访问 https://platform.openai.com/api-keys
# 创建新密钥，复制保存
```

#### 2. 安装依赖
```bash
npm install openai@^4.0.0
```

#### 3. 创建 LLM 服务封装
```javascript
// src/services/llm/openai.js
import OpenAI from 'openai';

export class OpenAIService {
  constructor(apiKey, baseURL) {
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
      baseURL: baseURL || 'https://api.openai.com/v1'
    });
  }

  /**
   * 基础对话
   * @param {Array} messages - 对话历史 [{role:'user', content:'你好'}]
   * @param {Object} options - 配置 {model, temperature, max_tokens}
   */
  async chat(messages, options = {}) {
    const response = await this.client.chat.completions.create({
      model: options.model || 'gpt-4o-mini',
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 2000,
      stream: options.stream || false
    });

    if (options.stream) {
      return response; // 返回流式响应
    }

    return {
      content: response.choices[0].message.content,
      usage: response.usage,
      model: response.model
    };
  }

  /**
   * 流式对话（实时输出）
   */
  async *chatStream(messages, options = {}) {
    const stream = await this.client.chat.completions.create({
      model: options.model || 'gpt-4o-mini',
      messages: messages,
      temperature: options.temperature || 0.7,
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) yield content;
    }
  }

  /**
   * 生成向量嵌入（用于 RAG）
   */
  async createEmbedding(text) {
    const response = await this.client.embeddings.create({
      model: 'text-embedding-3-small', // 便宜且好用
      input: text
    });
    return response.data[0].embedding; // 返回 1536 维向量
  }

  /**
   * 函数调用（Function Calling）
   */
  async chatWithFunctions(messages, functions, options = {}) {
    const response = await this.client.chat.completions.create({
      model: options.model || 'gpt-4o-mini',
      messages: messages,
      functions: functions,
      function_call: 'auto',
      temperature: options.temperature || 0.7
    });

    const choice = response.choices[0];
    if (choice.finish_reason === 'function_call') {
      return {
        type: 'function_call',
        name: choice.message.function_call.name,
        arguments: JSON.parse(choice.message.function_call.arguments)
      };
    }

    return {
      type: 'message',
      content: choice.message.content
    };
  }
}
```

#### 4. 在 server.js 中使用
```javascript
// server.js (添加到现有代码)
import { OpenAIService } from './src/services/llm/openai.js';

const llmService = new OpenAIService();

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model, temperature } = req.body;
    
    const result = await llmService.chat(messages, {
      model: model || 'gpt-4o-mini',
      temperature: temperature || 0.7
    });

    res.json({
      content: result.content,
      usage: result.usage
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 流式接口（推荐）
app.post('/api/chat/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  try {
    const { messages, model, temperature } = req.body;
    
    for await (const chunk of llmService.chatStream(messages, { model, temperature })) {
      res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
    }
    
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});
```

---

## RAG 系统实现

### RAG 架构图
```
┌─────────────┐
│  用户提问    │
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│  1. 向量化查询          │ ← Embedding API
│  "如何使用RAG?"         │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  2. 向量数据库检索      │
│  找到最相关的3个文档    │ ← Chroma/Pinecone
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  3. 构建增强提示        │
│  上下文: [文档1,2,3]    │
│  问题: 如何使用RAG?     │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  4. LLM 生成答案        │ ← OpenAI API
└──────┬──────────────────┘
       │
       ▼
┌─────────────┐
│  返回答案    │
└─────────────┘
```

### 实现步骤

#### 步骤1：安装依赖
```bash
npm install chromadb uuid pdf-parse mammoth multer
```

#### 步骤2：创建向量存储服务
```javascript
// src/services/rag/vectorStore.js
import { ChromaClient } from 'chromadb';
import { OpenAIService } from '../llm/openai.js';

export class VectorStore {
  constructor() {
    this.client = new ChromaClient({
      path: process.env.CHROMA_URL || 'http://localhost:8000'
    });
    this.llm = new OpenAIService();
    this.collectionName = 'documents';
  }

  /**
   * 初始化集合
   */
  async initialize() {
    try {
      this.collection = await this.client.getOrCreateCollection({
        name: this.collectionName,
        metadata: { 'hnsw:space': 'cosine' }
      });
    } catch (error) {
      console.error('初始化向量库失败:', error);
      throw error;
    }
  }

  /**
   * 添加文档
   * @param {Array} documents - [{id, text, metadata}]
   */
  async addDocuments(documents) {
    const ids = [];
    const embeddings = [];
    const texts = [];
    const metadatas = [];

    for (const doc of documents) {
      const embedding = await this.llm.createEmbedding(doc.text);
      ids.push(doc.id);
      embeddings.push(embedding);
      texts.push(doc.text);
      metadatas.push(doc.metadata || {});
    }

    await this.collection.add({
      ids: ids,
      embeddings: embeddings,
      documents: texts,
      metadatas: metadatas
    });

    return { count: documents.length };
  }

  /**
   * 搜索相关文档
   * @param {string} query - 查询文本
   * @param {number} topK - 返回前 K 个结果
   */
  async search(query, topK = 3) {
    const queryEmbedding = await this.llm.createEmbedding(query);

    const results = await this.collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK
    });

    return results.documents[0].map((doc, idx) => ({
      text: doc,
      metadata: results.metadatas[0][idx],
      distance: results.distances[0][idx]
    }));
  }

  /**
   * 删除文档
   */
  async deleteDocuments(ids) {
    await this.collection.delete({ ids });
  }

  /**
   * 清空集合
   */
  async clear() {
    await this.client.deleteCollection({ name: this.collectionName });
    await this.initialize();
  }
}
```

#### 步骤3：创建文档加载器
```javascript
// src/services/rag/documentLoader.js
import fs from 'fs/promises';
import path from 'path';
import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';
import { v4 as uuidv4 } from 'uuid';

export class DocumentLoader {
  /**
   * 加载文本文件
   */
  async loadText(filePath) {
    const content = await fs.readFile(filePath, 'utf-8');
    return [{
      id: uuidv4(),
      text: content,
      metadata: {
        source: filePath,
        type: 'text'
      }
    }];
  }

  /**
   * 加载 PDF
   */
  async loadPDF(filePath) {
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);
    
    return [{
      id: uuidv4(),
      text: data.text,
      metadata: {
        source: filePath,
        type: 'pdf',
        pages: data.numpages
      }
    }];
  }

  /**
   * 加载 Word 文档
   */
  async loadWord(filePath) {
    const buffer = await fs.readFile(filePath);
    const result = await mammoth.extractRawText({ buffer });
    
    return [{
      id: uuidv4(),
      text: result.value,
      metadata: {
        source: filePath,
        type: 'docx'
      }
    }];
  }

  /**
   * 文本分块（Chunking）
   * 长文档需要切分成小块
   */
  chunkText(text, chunkSize = 500, overlap = 50) {
    const chunks = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      chunks.push({
        id: uuidv4(),
        text: text.slice(start, end),
        metadata: {
          chunk_index: chunks.length,
          start_char: start,
          end_char: end
        }
      });
      start += chunkSize - overlap;
    }

    return chunks;
  }

  /**
   * 智能加载（根据扩展名自动选择）
   */
  async load(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    
    switch (ext) {
      case '.txt':
      case '.md':
        return this.loadText(filePath);
      case '.pdf':
        return this.loadPDF(filePath);
      case '.docx':
        return this.loadWord(filePath);
      default:
        throw new Error(`不支持的文件类型: ${ext}`);
    }
  }
}
```

#### 步骤4：创建 RAG 服务
```javascript
// src/services/rag/ragService.js
import { VectorStore } from './vectorStore.js';
import { DocumentLoader } from './documentLoader.js';
import { OpenAIService } from '../llm/openai.js';

export class RAGService {
  constructor() {
    this.vectorStore = new VectorStore();
    this.loader = new DocumentLoader();
    this.llm = new OpenAIService();
  }

  async initialize() {
    await this.vectorStore.initialize();
  }

  /**
   * 索引文档
   */
  async indexDocument(filePath) {
    // 1. 加载文档
    const docs = await this.loader.load(filePath);
    
    // 2. 分块（如果文档很长）
    const chunks = [];
    for (const doc of docs) {
      if (doc.text.length > 1000) {
        chunks.push(...this.loader.chunkText(doc.text));
      } else {
        chunks.push(doc);
      }
    }

    // 3. 添加到向量库
    await this.vectorStore.addDocuments(chunks);
    
    return { indexed: chunks.length };
  }

  /**
   * RAG 查询
   */
  async query(question, options = {}) {
    // 1. 检索相关文档
    const relevantDocs = await this.vectorStore.search(
      question, 
      options.topK || 3
    );

    // 2. 构建增强提示
    const context = relevantDocs
      .map((doc, idx) => `[文档${idx + 1}]\n${doc.text}`)
      .join('\n\n');

    const messages = [
      {
        role: 'system',
        content: `你是一个helpful的助手。请基于以下文档回答问题。如果文档中没有相关信息，请说"我不知道"。

参考文档：
${context}`
      },
      {
        role: 'user',
        content: question
      }
    ];

    // 3. 调用 LLM 生成答案
    const result = await this.llm.chat(messages, {
      model: options.model || 'gpt-4o-mini',
      temperature: 0.3 // RAG 通常用较低温度
    });

    return {
      answer: result.content,
      sources: relevantDocs.map(d => d.metadata),
      usage: result.usage
    };
  }

  /**
   * 对话式 RAG（保留历史）
   */
  async chatWithHistory(question, history = [], options = {}) {
    const relevantDocs = await this.vectorStore.search(question, 3);
    const context = relevantDocs.map(d => d.text).join('\n\n');

    const messages = [
      {
        role: 'system',
        content: `基于以下文档回答：\n${context}`
      },
      ...history,
      { role: 'user', content: question }
    ];

    const result = await this.llm.chat(messages, options);
    return result;
  }
}
```

#### 步骤5：添加 API 端点
```javascript
// server.js (添加到现有代码)
import { RAGService } from './src/services/rag/ragService.js';
import multer from 'multer';

const ragService = new RAGService();
await ragService.initialize();

// 文件上传配置
const upload = multer({ dest: 'uploads/' });

// 上传并索引文档
app.post('/api/rag/upload', upload.single('file'), async (req, res) => {
  try {
    const result = await ragService.indexDocument(req.file.path);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RAG 查询
app.post('/api/rag/query', async (req, res) => {
  try {
    const { question, topK, model } = req.body;
    const result = await ragService.query(question, { topK, model });
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## 模型训练与微调

### 重要概念区分

| 操作 | 成本 | 时间 | 适用场景 |
|------|------|------|----------|
| **提示工程** | 免费 | 分钟级 | 90%的场景 |
| **RAG** | 低 | 小时级 | 需要外部知识 |
| **微调（Fine-tuning）** | 中 | 天级 | 特定领域/风格 |
| **预训练** | 极高 | 月级 | 大公司/研究机构 |

### OpenAI 微调实战

#### 什么时候需要微调？
- ❌ **不需要微调**：一般问答、客服、翻译、写作
- ✅ **需要微调**：
  - 特定领域术语（医疗、法律）
  - 固定输出格式（JSON、特定风格）
  - 品牌语气一致性

#### 微调步骤

**1. 准备训练数据**
```jsonl
// data/training_data.jsonl
{"messages": [{"role": "system", "content": "你是一个医疗助手"}, {"role": "user", "content": "什么是高血压?"}, {"role": "assistant", "content": "高血压是指..."}]}
{"messages": [{"role": "system", "content": "你是一个医疗助手"}, {"role": "user", "content": "糖尿病症状?"}, {"role": "assistant", "content": "糖尿病的主要症状包括..."}]}
```

**要求：**
- 至少 10 条（推荐 50-100 条）
- 格式一致
- 高质量标注

**2. 验证数据格式**
```javascript
// scripts/validateData.js
import fs from 'fs';

const lines = fs.readFileSync('data/training_data.jsonl', 'utf-8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (!lines[i].trim()) continue;
  
  try {
    const obj = JSON.parse(lines[i]);
    if (!obj.messages || !Array.isArray(obj.messages)) {
      console.error(`第 ${i+1} 行格式错误`);
    }
  } catch (e) {
    console.error(`第 ${i+1} 行 JSON 解析失败`);
  }
}

console.log('验证完成！');
```

**3. 上传训练文件**
```javascript
// scripts/finetune.js
import OpenAI from 'openai';
import fs from 'fs';

const openai = new OpenAI();

async function fineTune() {
  // 1. 上传文件
  const file = await openai.files.create({
    file: fs.createReadStream('data/training_data.jsonl'),
    purpose: 'fine-tune'
  });
  console.log('文件上传成功:', file.id);

  // 2. 创建微调任务
  const fineTune = await openai.fineTuning.jobs.create({
    training_file: file.id,
    model: 'gpt-4o-mini-2024-07-18', // 或 gpt-3.5-turbo
    hyperparameters: {
      n_epochs: 3 // 训练轮次
    }
  });
  console.log('微调任务已创建:', fineTune.id);

  // 3. 监控进度
  while (true) {
    const status = await openai.fineTuning.jobs.retrieve(fineTune.id);
    console.log('状态:', status.status);
    
    if (status.status === 'succeeded') {
      console.log('微调完成！模型:', status.fine_tuned_model);
      break;
    }
    
    if (status.status === 'failed') {
      console.error('微调失败:', status.error);
      break;
    }
    
    await new Promise(r => setTimeout(r, 60000)); // 每分钟检查一次
  }
}

fineTune();
```

**4. 使用微调模型**
```javascript
const response = await openai.chat.completions.create({
  model: 'ft:gpt-4o-mini-2024-07-18:your-org:custom-model:id',
  messages: [{ role: 'user', content: '什么是高血压?' }]
});
```

**成本估算（OpenAI）：**
- 训练：$0.008/1K tokens（gpt-4o-mini）
- 使用：$0.003/1K tokens（输入）+ $0.006/1K tokens（输出）
- 100条对话（每条200 tokens）≈ $1.6

---

## 实战示例

### 示例1：客服机器人（RAG）
```javascript
// examples/customerService.js
import { RAGService } from '../src/services/rag/ragService.js';

const rag = new RAGService();
await rag.initialize();

// 索引公司文档
await rag.indexDocument('./docs/product_manual.pdf');
await rag.indexDocument('./docs/faq.txt');

// 客户提问
const result = await rag.query('如何退货?');
console.log('答案:', result.answer);
console.log('来源:', result.sources);
```

### 示例2：代码助手（Function Calling）
```javascript
// examples/codeAssistant.js
import { OpenAIService } from '../src/services/llm/openai.js';

const llm = new OpenAIService();

const functions = [{
  name: 'execute_code',
  description: '执行 Python 代码',
  parameters: {
    type: 'object',
    properties: {
      code: { type: 'string', description: 'Python 代码' }
    },
    required: ['code']
  }
}];

const result = await llm.chatWithFunctions(
  [{ role: 'user', content: '帮我计算 123 * 456' }],
  functions
);

if (result.type === 'function_call') {
  console.log('需要执行:', result.name);
  console.log('参数:', result.arguments);
  // 实际执行代码...
}
```

### 示例3：流式输出（打字机效果）
```javascript
// public/app.js (前端代码示例)
async function sendStream() {
  const response = await fetch('/api/chat/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model, temperature })
  });

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let assistantMessage = { role: 'assistant', content: '' };
  messages.push(assistantMessage);

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value);
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;
        
        try {
          const json = JSON.parse(data);
          assistantMessage.content += json.content;
          render(); // 实时更新界面
        } catch (e) {}
      }
    }
  }
}
```

---

## 成本优化

### 选择合适的模型

| 模型 | 输入成本 | 输出成本 | 适用场景 |
|------|----------|----------|----------|
| gpt-4o-mini | $0.15/1M | $0.60/1M | 日常对话、RAG |
| gpt-4o | $2.50/1M | $10.00/1M | 复杂推理、代码 |
| gpt-3.5-turbo | $0.50/1M | $1.50/1M | 高性价比 |

### 优化技巧

**1. 使用缓存**
```javascript
import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 3600 });

async function cachedChat(messages) {
  const key = JSON.stringify(messages);
  if (cache.has(key)) return cache.get(key);
  
  const result = await llm.chat(messages);
  cache.set(key, result);
  return result;
}
```

**2. 减少 Token**
```javascript
// ❌ 坏例子
const prompt = `请基于以下10000字的文档回答...`;

// ✅ 好例子 - 先用 RAG 检索相关部分
const docs = await vectorStore.search(question, 3); // 只取前3个
const prompt = `基于以下摘要回答...\n${docs.slice(0, 500)}`;
```

**3. 批量处理**
```javascript
// 并发请求（但注意 API 限流）
const results = await Promise.all(
  questions.map(q => llm.chat([{ role: 'user', content: q }]))
);
```

**4. 监控使用**
```javascript
let totalTokens = 0;

function trackUsage(usage) {
  totalTokens += usage.total_tokens;
  console.log(`已使用: ${totalTokens} tokens (约 $${totalTokens * 0.0000015})`);
}
```

---

## 安装 ChromaDB（向量数据库）

### Windows 安装
```bash
# 使用 Docker (推荐)
docker run -p 8000:8000 chromadb/chroma

# 或使用 Python
pip install chromadb
chroma run --path ./chroma_data
```

### 测试连接
```javascript
import { ChromaClient } from 'chromadb';
const client = new ChromaClient({ path: 'http://localhost:8000' });
const heartbeat = await client.heartbeat();
console.log('连接成功:', heartbeat);
```

---

## 常见问题

### Q: RAG 和微调选哪个？
**A:** 优先用 RAG！
- RAG：实时更新、成本低、无需训练数据
- 微调：固定知识、成本高、需要标注数据

### Q: 向量数据库怎么选？
**A:** 
- 本地/小项目：ChromaDB
- 生产环境：Pinecone、Weaviate、Qdrant

### Q: 如何避免 API 限流？
**A:**
```javascript
import pLimit from 'p-limit';
const limit = pLimit(5); // 最多5个并发

const tasks = questions.map(q => 
  limit(() => llm.chat([{ role: 'user', content: q }]))
);
await Promise.all(tasks);
```

### Q: 模型响应太慢？
**A:**
1. 用流式输出（打字机效果）
2. 减少 max_tokens
3. 换更快的模型（gpt-4o-mini）

---

## 下一步学习

1. **Prompt Engineering** - 学习如何写好提示词
2. **LangChain** - 更高级的 LLM 框架
3. **向量数据库优化** - 索引、查询优化
4. **多模态** - 图片/语音输入

## 参考资源

- OpenAI 官方文档: https://platform.openai.com/docs
- LangChain 文档: https://js.langchain.com
- ChromaDB 文档: https://docs.trychroma.com
- Prompt Engineering Guide: https://www.promptingguide.ai

---

**创建日期：** 2025年11月2日  
**版本：** 1.0
