import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import { HttpsProxyAgent } from 'https-proxy-agent';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// 可选代理支持（用于本机代理/Clash/V2Ray 等）
const PROXY_URL = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || process.env.PROXY || process.env.OPENAI_PROXY || null;
const proxyAgent = PROXY_URL ? new HttpsProxyAgent(PROXY_URL) : null;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

function getProviderConfig(provider) {
  switch ((provider || '').toLowerCase()) {
    case 'openai':
      return {
        baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
        apiKey: process.env.OPENAI_API_KEY,
        headers: (apiKey) => ({
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }),
        path: '/chat/completions',
        transformBody: (body) => body
      };
    case 'azure': {
      const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
      const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
      if (!endpoint || !deployment) {
        throw new Error('Missing AZURE_OPENAI_ENDPOINT or AZURE_OPENAI_DEPLOYMENT');
      }
      return {
        baseUrl: `${endpoint}/openai/deployments/${deployment}`,
        apiKey: process.env.AZURE_OPENAI_API_KEY,
        headers: (apiKey) => ({
          'api-key': apiKey,
          'Content-Type': 'application/json'
        }),
        path: '/chat/completions?api-version=2024-02-15-preview',
        transformBody: (body) => {
          const { model, ...rest } = body;
          return rest;
        }
      };
    }
    case 'openrouter':
      return {
        baseUrl: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
        apiKey: process.env.OPENROUTER_API_KEY,
        headers: (apiKey) => ({
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'http://localhost',
          'X-Title': process.env.OPENROUTER_APP_NAME || 'AI Chat Emotion Web',
          'Content-Type': 'application/json'
        }),
        path: '/chat/completions',
        transformBody: (body) => body
      };
    default:
      throw new Error('Unknown provider. Use one of: openai, azure, openrouter');
  }
}

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, model, provider = 'openai', temperature = 0.7, max_tokens } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const cfg = getProviderConfig(provider);
    if (!cfg.apiKey) {
      return res.status(400).json({ error: `Missing API key for provider: ${provider}` });
    }

    const url = `${cfg.baseUrl}${cfg.path}`;
    const body = cfg.transformBody({
      model: model || process.env.DEFAULT_MODEL || 'gpt-3.5-turbo',
      messages,
      temperature,
      max_tokens
    });

    const fetchOptions = {
      method: 'POST',
      headers: cfg.headers(cfg.apiKey),
      body: JSON.stringify(body)
    };
    if (proxyAgent) fetchOptions.agent = proxyAgent;

    const response = await fetch(url, fetchOptions);

    if (!response.ok) {
      const text = await response.text();
      return res.status(response.status).json({ error: text || 'Upstream error' });
    }

    const data = await response.json();
    // Normalize to { content, raw }
    let content = '';
    try {
      content = data?.choices?.[0]?.message?.content ?? '';
    } catch (_) {
      content = '';
    }
    res.json({ content, raw: data });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// 新增：调用 Python 后端的情感支持接口
app.post('/api/emotion-chat', async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // 调用 Python FastAPI 后端
    const response = await fetch('http://127.0.0.1:8000/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      throw new Error(`Python API returned ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to call Python backend' });
  }
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server running on http://localhost:${PORT}`);
});


