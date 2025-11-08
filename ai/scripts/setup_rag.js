/**
 * RAG 系统快速设置脚本
 * 运行: node scripts/setup_rag.js
 */
import fs from 'fs/promises';
import path from 'path';

async function setup() {
  console.log('🚀 开始设置 RAG 系统...\n');

  // 1. 创建目录结构
  const dirs = [
    'src/services/llm',
    'src/services/rag',
    'data/documents',
    'data/vectors',
    'uploads',
    'examples',
    'scripts'
  ];

  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
      console.log(`✅ 创建目录: ${dir}`);
    } catch (e) {
      console.log(`⚠️  目录已存在: ${dir}`);
    }
  }

  // 2. 创建示例文档
  const sampleDoc = `# 产品使用手册

## 产品简介
我们的 AI 聊天助手支持多种 LLM 提供商，包括 OpenAI、Azure OpenAI 和 OpenRouter。

## 退货政策
1. 7天无理由退货
2. 需保持商品完好
3. 联系客服获取退货地址
4. 退货运费由买家承担（质量问题除外）

## 常见问题

### Q: 如何激活产品？
A: 扫描包装盒上的二维码即可激活。首次激活需要联网。

### Q: 忘记密码怎么办？
A: 点击登录页面的"忘记密码"，通过邮箱重置。

### Q: 支持哪些支付方式？
A: 支持支付宝、微信支付、信用卡等多种方式。

### Q: 如何联系客服？
A: 工作日 9:00-18:00 可拨打客服热线 400-123-4567。

## 技术规格
- 支持的模型：GPT-4o, GPT-4o-mini, GPT-3.5-turbo
- 最大上下文长度：128K tokens
- 支持流式输出
- 支持情绪识别
`;

  await fs.writeFile('data/documents/sample.txt', sampleDoc);
  console.log('✅ 创建示例文档: data/documents/sample.txt\n');

  // 3. 创建 .env.example
  const envTemplate = `# OpenAI API Key
OPENAI_API_KEY=sk-your-key-here

# Azure OpenAI (可选)
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your-azure-key
AZURE_OPENAI_DEPLOYMENT=your-deployment-name

# OpenRouter (可选)
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_SITE_URL=http://localhost:3000
OPENROUTER_APP_NAME=AI Chat Emotion Web

# ChromaDB URL
CHROMA_URL=http://localhost:8000

# Server Port
PORT=3000

# Default Model
DEFAULT_MODEL=gpt-4o-mini
`;

  await fs.writeFile('.env.example', envTemplate);
  console.log('✅ 创建 .env.example\n');

  // 4. 创建训练数据模板
  const trainingTemplate = `{"messages": [{"role": "system", "content": "你是一个专业的客服助手"}, {"role": "user", "content": "如何退货?"}, {"role": "assistant", "content": "退货流程：1. 7天内申请退货 2. 保持商品完好 3. 联系客服获取退货地址"}]}
{"messages": [{"role": "system", "content": "你是一个专业的客服助手"}, {"role": "user", "content": "忘记密码怎么办?"}, {"role": "assistant", "content": "您可以点击登录页面的'忘记密码'按钮，通过注册邮箱重置密码"}]}
{"messages": [{"role": "system", "content": "你是一个专业的客服助手"}, {"role": "user", "content": "支持哪些支付方式?"}, {"role": "assistant", "content": "我们支持多种支付方式：支付宝、微信支付、信用卡等"}]}
`;

  await fs.writeFile('data/training_data.jsonl', trainingTemplate);
  console.log('✅ 创建训练数据模板: data/training_data.jsonl\n');

  // 5. 创建快速测试脚本
  const testScript = `// 快速测试 RAG 系统
import { RAGService } from '../src/services/rag/ragService.js';

async function test() {
  console.log('测试 RAG 系统...');
  
  const rag = new RAGService();
  await rag.initialize();
  
  // 索引示例文档
  await rag.indexDocument('./data/documents/sample.txt');
  console.log('✅ 文档已索引');
  
  // 测试查询
  const result = await rag.query('如何退货?');
  console.log('\\n问题: 如何退货?');
  console.log('答案:', result.answer);
  console.log('\\n来源:', result.sources);
}

test().catch(console.error);
`;

  await fs.writeFile('examples/test_rag.js', testScript);
  console.log('✅ 创建测试脚本: examples/test_rag.js\n');

  // 6. 显示后续步骤
  console.log('=' .repeat(60));
  console.log('✨ 设置完成！\n');
  console.log('📋 后续步骤:');
  console.log('');
  console.log('1️⃣  安装依赖:');
  console.log('   npm install openai chromadb uuid pdf-parse mammoth multer p-limit node-cache');
  console.log('');
  console.log('2️⃣  配置环境变量:');
  console.log('   复制 .env.example 为 .env');
  console.log('   编辑 .env 填入你的 OpenAI API Key');
  console.log('');
  console.log('3️⃣  启动 ChromaDB (选择一种方式):');
  console.log('   - Docker: docker run -p 8000:8000 chromadb/chroma');
  console.log('   - Python: pip install chromadb && chroma run');
  console.log('');
  console.log('4️⃣  复制代码文件:');
  console.log('   参考 docs/LLM_RAG_Guide.md 创建服务文件');
  console.log('');
  console.log('5️⃣  测试 RAG:');
  console.log('   node examples/test_rag.js');
  console.log('');
  console.log('=' .repeat(60));
  console.log('');
  console.log('📚 详细文档: docs/LLM_RAG_Guide.md');
  console.log('');
}

setup().catch(console.error);
