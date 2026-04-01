// --- 1. Global Configuration ---
const CONFIG = {
  ELEVENLABS_VOICE_ID: 'kE6lVLC9rXp4T2rZ8dMw',
  ELEVENLABS_API_KEY: 'sk_50ad9403cf4ad78ba36e1e1f4f3ada8eceed6141d95ee91f',
  GEMINI_API_KEY:'AIzaSyDjco007dTmB4wwwA1oxxYtxTfMVsVTano',
};

// --- 2. Gemini Text Generation ---
function isGeminiQuotaOrRateLimit(status, message) {
  if (status === 429) return true;
  if (!message) return false;
  return /quota|rate limit|rate-limit|resource.exhausted|Resource exhausted/i.test(message);
}

/** When Gemini free-tier quota is hit, still give a short villain line so TTS + UI work. */
function localAuraVillainLine(userPrompt) {
  const q = userPrompt.trim().slice(0, 72).replace(/\s+/g, ' ') || 'silence';
  const lines = [
    `You dare say "${q}"? That weakness will be your epitaph.`,
    `"${q}" — words for a gravestone. I’ll remember them when you fall.`,
    `I heard "${q}". Pray I forget it before we meet again.`,
  ];
  return lines[Math.floor(Math.random() * lines.length)];
}

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

  /** Prefer current free-tier models first; avoid deprecated 2.0 for new keys hitting odd 429s. */
  const models = [
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-2.0-flash',
  ];
  let lastErr = null;
  /** False once we see 404/400 (bad model), empty body, etc. — means “not project-wide quota only”. */
  let anyNonQuotaFailure = false;

  for (const modelId of models) {
    const { response, data } = await generateGeminiContent(modelId, userPrompt);
    const msg = data?.error?.message || response.statusText;

    if (response.ok) {
      const candidate = data.candidates?.[0];
      const text = candidate?.content?.parts?.find((p) => p.text)?.text;
      if (text) return text;

      anyNonQuotaFailure = true;
      const reason = candidate?.finishReason || data.promptFeedback?.blockReason || 'unknown';
      lastErr = new Error(`No text in response (finishReason: ${reason})`);
      continue;
    }

    // Same key can 429 on one model but succeed on another (pool limits, deprecation, RPM).
    if (isGeminiQuotaOrRateLimit(response.status, msg)) {
      lastErr = new Error(`Gemini (${modelId}) ${response.status}: ${msg}`);
      continue;
    }

    anyNonQuotaFailure = true;
    lastErr = new Error(`Gemini (${modelId}) ${response.status}: ${msg}`);

    if (response.status !== 404 && response.status !== 400) {
      throw lastErr;
    }
  }

  if (!anyNonQuotaFailure && lastErr) {
    console.warn(
      '[AURA] Quota/rate limit on every model tried — using offline lines. New keys are tied to a Google Cloud project; confirm Generative Language API + billing at https://aistudio.google.com/ and https://ai.google.dev/gemini-api/docs/rate-limits'
    );
    return localAuraVillainLine(userPrompt);
  }

  throw lastErr || new Error('Gemini: all models failed');
}

// --- 3. ElevenLabs — verify key + voice (runs once when popup opens) ---
async function checkElevenLabsConnection() {
  if (!CONFIG.ELEVENLABS_API_KEY || CONFIG.ELEVENLABS_API_KEY.length < 20) {
    return { ok: false, label: 'ElevenLabs: set ELEVENLABS_API_KEY in popup.js' };
  }

  const userRes = await fetch('https://api.elevenlabs.io/v1/user', {
    headers: { 'xi-api-key': CONFIG.ELEVENLABS_API_KEY },
  });

  if (!userRes.ok) {
    const errText = await userRes.text().catch(() => '');
    const detail = parseElevenLabsErrorBody(errText);
    return { ok: false, label: `ElevenLabs: not connected (${userRes.status}) — ${detail}` };
  }

  const voiceRes = await fetch(
    `https://api.elevenlabs.io/v1/voices/${encodeURIComponent(CONFIG.ELEVENLABS_VOICE_ID)}`,
    { headers: { 'xi-api-key': CONFIG.ELEVENLABS_API_KEY } }
  );

  if (!voiceRes.ok) {
    const errText = await voiceRes.text().catch(() => '');
    const detail = parseElevenLabsErrorBody(errText);
    return {
      ok: true,
      label: `ElevenLabs: API key OK · voice lookup ${voiceRes.status} (${detail}) — TTS will still run if the ID is valid`,
    };
  }

  return { ok: true, label: 'ElevenLabs: connected (API key + voice ID verified)' };
}

function parseElevenLabsErrorBody(errText) {
  if (!errText) return 'unknown error';
  try {
    const j = JSON.parse(errText);
    if (typeof j?.detail === 'string') return j.detail;
    if (j?.detail?.message) return j.detail.message;
    if (j?.message) return j.message;
  } catch {
    /* raw */
  }
  return errText.slice(0, 120);
}

// --- 4. ElevenLabs Voice Generation ---
async function generateAnimeSpeech(text) {
  const trimmed = (text || '').trim();
  if (!trimmed) throw new Error('ElevenLabs: nothing to speak');

  if (!CONFIG.ELEVENLABS_API_KEY || CONFIG.ELEVENLABS_API_KEY.length < 20) {
    throw new Error('ElevenLabs: API key missing');
  }

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(CONFIG.ELEVENLABS_VOICE_ID)}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Accept: 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': CONFIG.ELEVENLABS_API_KEY,
    },
    body: JSON.stringify({
      text: trimmed,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.8 },
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    const detail = parseElevenLabsErrorBody(errText);
    throw new Error(`ElevenLabs HTTP ${response.status}: ${detail}`);
  }

  const ctype = (response.headers.get('Content-Type') || '').toLowerCase();
  if (ctype.includes('application/json')) {
    const errText = await response.text().catch(() => '');
    throw new Error(parseElevenLabsErrorBody(errText));
  }

  const audioBlob = await response.blob();
  if (audioBlob.size < 100) {
    const errText = await audioBlob.text().catch(() => '');
    throw new Error(`ElevenLabs: empty or invalid audio — ${parseElevenLabsErrorBody(errText)}`);
  }
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);

  const cleanup = () => URL.revokeObjectURL(audioUrl);
  audio.addEventListener('ended', cleanup, { once: true });
  audio.addEventListener('error', cleanup, { once: true });

  try {
    await audio.play();
  } catch (e) {
    cleanup();
    throw new Error(
      `ElevenLabs: audio blocked — ${e instanceof Error ? e.message : String(e)} (try interacting with the page again)`
    );
  }
}

// --- 5. The UI Controller ---
async function talkToGemini(prompt) {
  return getGeminiResponse(prompt);
}


document.addEventListener('DOMContentLoaded', () => {
  const sendBtn = document.getElementById('send-btn');
  const promptEl = document.getElementById('prompt');
  const chatWindow = document.getElementById('chat-window');
  const statusLine = document.getElementById('status-line');

  checkElevenLabsConnection()
    .then((result) => {
      if (statusLine) statusLine.textContent = result.label;
    })
    .catch((e) => {
      if (statusLine) {
        statusLine.textContent = `ElevenLabs: check failed — ${e instanceof Error ? e.message : String(e)}`;
      }
    });

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

      try {
        await generateAnimeSpeech(finalText);
      } catch (ttsErr) {
        console.error('[AURA] ElevenLabs:', ttsErr);
        appendMessage(
          `Voice: ${ttsErr instanceof Error ? ttsErr.message : String(ttsErr)}`,
          'msg-tts-error'
        );
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