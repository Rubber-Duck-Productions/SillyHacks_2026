// --- 1. Global Configuration ---
const CONFIG = {
  ELEVENLABS_VOICE_ID: 'kE6lVLC9rXp4T2rZ8dMw',
  ELEVENLABS_API_KEY: 'sk_50ad9403cf4ad78ba36e1e1f4f3ada8eceed6141d95ee91f',
  GEMINI_API_KEY:'AIzaSyDjco007dTmB4wwwA1oxxYtxTfMVsVTano',
};

// --- 2. Gemini Text Generation ---
async function generateGeminiContent(modelId, userPrompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${encodeURIComponent(CONFIG.GEMINI_API_KEY)}`;
  const payload = {
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    systemInstruction: {
      parts: [{ text: 'You are an elite anime antagonist named AURA. Keep responses short, dramatic, and intimidating.' }]
    },
    generationConfig: { maxOutputTokens: 100 }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await response.json().catch(() => ({}));
  return { response, data };
}

async function getGeminiResponse(userPrompt) {
  if (!CONFIG.GEMINI_API_KEY || CONFIG.GEMINI_API_KEY === 'YOUR_GEMINI_KEY') {
    console.warn('Gemini API key is missing; using local fallback response');
    return `AURA: I see your message: "${userPrompt}"`; // simple local fallback
  }

  const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastErr = null;

  for (const modelId of models) {
    const { response, data } = await generateGeminiContent(modelId, userPrompt);

    if (response.status === 404 || response.status === 400) {
      const msg = data?.error?.message || response.statusText;
      lastErr = new Error(`Gemini (${modelId}) ${response.status}: ${msg}`);
      continue;
    }

    if (!response.ok) {
      const msg = data?.error?.message || response.statusText;
      throw new Error(`Gemini API ${response.status}: ${msg}`);
    }

    const candidate = data.candidates?.[0];
    const text = candidate?.content?.parts?.find((p) => p.text)?.text;
    if (text) return text;

    const reason = candidate?.finishReason || data.promptFeedback?.blockReason || 'unknown';
    lastErr = new Error(`No text in response (finishReason: ${reason})`);
  }

  throw lastErr || new Error('Gemini: all models failed');
}

// --- 3. ElevenLabs Voice Generation ---
async function generateAnimeSpeech(text) {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${CONFIG.ELEVENLABS_VOICE_ID}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': CONFIG.ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text: text,
      model_id: "eleven_multilingual_v2",
      voice_settings: { stability: 0.5, similarity_boost: 0.8 }
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    let detail = errText;
    try {
      const j = JSON.parse(errText);
      detail = j?.detail?.message || j?.detail || j?.message || errText;
    } catch {
      /* use raw */
    }
    throw new Error(`ElevenLabs HTTP ${response.status}: ${detail}`);
  }

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.addEventListener('ended', () => URL.revokeObjectURL(audioUrl));
  return audio.play();
}

// --- 4. The UI Controller ---
async function talkToGemini(prompt) {
  // Get text from AI
  const aiText = await getGeminiResponse(prompt);
  
  // Trigger audio (don't 'await' so text shows up immediately)
  generateAnimeSpeech(aiText).catch(err => console.error("Audio Error:", err));

  return aiText;
}


document.addEventListener('DOMContentLoaded', () => {
  const sendBtn = document.getElementById('send-btn');
  const promptEl = document.getElementById('prompt');
  const chatWindow = document.getElementById('chat-window');

  function appendMessage(text, cssClass) {
    const message = document.createElement('div');
    message.className = `message ${cssClass}`; // Added 'message' for standard styling
    message.textContent = text;
    chatWindow.appendChild(message);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  async function handleSend() {
    const prompt = promptEl.value.trim();
    if (!prompt) {
      console.warn('No prompt entered');
      return;
    }

    appendMessage(`You: ${prompt}`, 'msg-user');
    promptEl.value = '';

    appendMessage('AURA: thinking...', 'msg-bot');
    const lastBotBubble = chatWindow.lastElementChild;

    try {
      const responseText = await talkToGemini(prompt);
      const finalText = responseText || 'AURA is silent, but your message was sent.';

      if (lastBotBubble) {
        lastBotBubble.textContent = `AURA: ${finalText}`;
      }
    } catch (err) {
      console.error('Gemini pipeline error:', err);
      if (lastBotBubble) {
        const msg = err instanceof Error ? err.message : String(err);
        lastBotBubble.textContent = `AURA: ${msg.slice(0, 280)}${msg.length > 280 ? '…' : ''}`;
      }
    }
  }

  // Listeners
  sendBtn.addEventListener('click', handleSend);
  promptEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });
});