import { buildPrompt, extractOptions } from '../utils/prompt.js';
import './messages.js'; // handles OPEN_OPTIONS message

// Context menu for manual trigger (debug / fallback)
chrome.runtime.onInstalled.addListener(() => {
  try {
    chrome.contextMenus.create({ id: 'bitman-open-panel', title: 'BitMan: Open Panel', contexts: ['selection'] });
  } catch(e) { /* ignore duplicate */ }
});

chrome.contextMenus.onClicked?.addListener((info, tab) => {
  if(info.menuItemId === 'bitman-open-panel' && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'BITMAN_FORCE_PANEL' });
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'BITMAN_ASK') {
    handleAsk(msg.payload).then(sendResponse).catch(e => {
      console.error(e);
      sendResponse({ error: e.message || 'Unknown error' });
    });
    return true; // async
  }
});

async function handleAsk(payload) {
  const { question, rawSelection } = payload;
  const options = extractOptions(rawSelection) || [];
  const { openaiKey, geminiKey, modelOpenAI, modelGemini } = await chrome.storage.sync.get({
    openaiKey: '',
    geminiKey: '',
    modelOpenAI: 'gpt-4o-mini',
    modelGemini: 'gemini-1.5-flash'
  });

  if (!openaiKey && !geminiKey) {
    return { error: 'Add at least one API key in Options.' };
  }

  const prompt = buildPrompt(question, options);

  const [openaiAnswer, geminiAnswer] = await Promise.all([
    openaiKey ? askOpenAI(openaiKey, modelOpenAI, prompt, options) : null,
    geminiKey ? askGemini(geminiKey, modelGemini, prompt, options) : null
  ]);

  return { openaiAnswer, geminiAnswer, options };
}

async function askOpenAI(key, model, prompt, options) {
  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'You answer only with the exact option text that best answers the question. If uncertain, return the single most likely option. Never invent new text.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0
      })
    });
    if (!resp.ok) throw new Error('OpenAI API error');
    const data = await resp.json();
    let content = data.choices?.[0]?.message?.content?.trim() || '';
    content = sanitizeToOptions(content, options);
    return content;
  } catch (e) {
    return 'Error: ' + e.message;
  }
}

async function askGemini(key, model, prompt, options) {
  try {
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        safetySettings: [],
        generationConfig: { temperature: 0 }
      })
    });
    if (!resp.ok) throw new Error('Gemini API error');
    const data = await resp.json();
    let content = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
    content = sanitizeToOptions(content, options);
    return content;
  } catch (e) {
    return 'Error: ' + e.message;
  }
}

function sanitizeToOptions(answer, options) {
  if (!options?.length) return answer;
  // Attempt to match by exact option or letter label.
  const lower = answer.toLowerCase();
  // If answer includes newline with explanation, take first line.
  let first = lower.split(/\n|\r/)[0].trim();
  // Try direct match
  for (const opt of options) {
    if (first === opt.toLowerCase()) return opt;
  }
  // Try letter extraction (A, B, C...)
  const letterMatch = first.match(/^([a-d])\b/);
  if (letterMatch) {
    const idx = letterMatch[1].charCodeAt(0) - 97;
    if (options[idx]) return options[idx];
  }
  // Fallback: find first option whose words appear in answer
  for (const opt of options) {
    const tokens = opt.toLowerCase().split(/\s+/).slice(0,3).join(' ');
    if (first.includes(tokens)) return opt;
  }
  return answer;
}
