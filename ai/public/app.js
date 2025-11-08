const chatEl = document.getElementById('chat');
const inputEl = document.getElementById('input');
const emotionEl = document.getElementById('emotion');
const sendBtn = document.getElementById('send');
const clearBtn = document.getElementById('clear');
const providerEl = document.getElementById('provider');
const modelEl = document.getElementById('model');
const tempEl = document.getElementById('temperature');

const messages = [];

function render() {
  chatEl.innerHTML = '';
  for (const m of messages) {
    const row = document.createElement('div');
    row.className = 'message';
    const role = document.createElement('div');
    role.className = 'role';
    role.textContent = m.role === 'user' ? '你' : '助手';
    const bubble = document.createElement('div');
    bubble.className = 'bubble ' + (m.role === 'assistant' ? 'assistant' : '');
    bubble.textContent = m.content;
    row.appendChild(role);
    row.appendChild(bubble);
    chatEl.appendChild(row);
  }
  chatEl.scrollTop = chatEl.scrollHeight;
}

// Simple emotion detection (rule-based + polarity)
const EMOJI = {
  joy: '😊',
  anger: '😠',
  sadness: '😢',
  fear: '😨',
  surprise: '😮',
  love: '😍',
  neutral: '😐'
};

const LEXICON = {
  joy: ['开心','高兴','棒','太好了','赞','快乐','喜欢','满意','兴奋','happy','great','awesome','good','yay','love'],
  anger: ['生气','愤怒','气死','怒','烂','垃圾','讨厌','气愤','angry','mad','furious','hate'],
  sadness: ['伤心','难过','难受','沮丧','失望','sad','unhappy','depressed'],
  fear: ['害怕','恐惧','担心','不安','怕','worry','afraid','scared'],
  surprise: ['惊讶','惊喜','震惊','哇','居然','wow','surprised','shocked'],
  love: ['爱','热爱','喜欢你','感谢','感激','谢谢','love','adore','kudos']
};

const POLARITY = new Map([
  ['good', 2], ['great', 3], ['awesome', 3], ['happy', 2], ['love', 3], ['like', 1], ['满意', 2], ['开心', 2],
  ['bad', -2], ['terrible', -3], ['hate', -3], ['angry', -2], ['垃圾', -3], ['失望', -2]
]);

function detectEmotion(text) {
  const lower = text.toLowerCase();
  const counts = { joy:0, anger:0, sadness:0, fear:0, surprise:0, love:0 };
  let score = 0;
  for (const [tok, val] of POLARITY.entries()) {
    if (lower.includes(tok) || text.includes(tok)) score += val;
  }
  for (const [emo, words] of Object.entries(LEXICON)) {
    for (const w of words) {
      if (lower.includes(w.toLowerCase())) counts[emo]++;
    }
  }
  let label = 'neutral';
  let max = 0;
  for (const [emo, c] of Object.entries(counts)) {
    if (c > max) { max = c; label = emo; }
  }
  if (label === 'neutral') {
    if (score > 1) label = 'joy';
    else if (score < -1) label = 'anger';
  }
  return { label, score };
}

function renderEmotion(text) {
  if (!text || !text.trim()) { emotionEl.textContent = ''; return; }
  const { label, score } = detectEmotion(text);
  const emoji = EMOJI[label] || EMOJI.neutral;
  emotionEl.textContent = `情绪：${emoji} ${label}（极性 ${score}）`;
}

inputEl.addEventListener('input', (e) => {
  renderEmotion(e.target.value);
});

async function send() {
  const content = inputEl.value.trim();
  if (!content) return;
  messages.push({ role: 'user', content });
  render();
  inputEl.value = '';
  renderEmotion('');

  const emotionMode = document.getElementById('emotionMode').checked;

  // 情感支持模式：调用 Python RAG 后端
  if (emotionMode) {
    try {
      const res = await fetch('/api/emotion-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content })
      });
      
      if (!res.ok) {
        const errText = await res.text();
        messages.push({ role: 'assistant', content: `出错：${errText}` });
        render();
        return;
      }
      
      const data = await res.json();
      const emotionInfo = `[检测情绪: ${data.emotion.label}]\n\n`;
      const reply = emotionInfo + data.answer;
      messages.push({ role: 'assistant', content: reply });
      render();
      return;
    } catch (err) {
      messages.push({ role: 'assistant', content: `Python 后端错误: ${err.message}` });
      render();
      return;
    }
  }

  // 普通模式：使用原有的 LLM API
  const provider = providerEl.value;
  const model = modelEl.value.trim() || undefined;
  const temperature = Number(tempEl.value) || 0.7;

  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model, provider, temperature })
  });
  if (!res.ok) {
    const errText = await res.text();
    messages.push({ role: 'assistant', content: `出错：${errText}` });
    render();
    return;
  }
  const data = await res.json();
  const reply = data?.content || '[无内容]';
  messages.push({ role: 'assistant', content: reply });
  render();
}

sendBtn.addEventListener('click', send);
inputEl.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') send();
});
clearBtn.addEventListener('click', () => { messages.length = 0; render(); });

// Greeting
messages.push({ role: 'assistant', content: '你好！我可以和你聊天，并在你输入时识别情绪。' });
render();


