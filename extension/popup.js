// --- 1. Global Configuration ---
const CONFIG = {
  ELEVENLABS_VOICE_ID: 'kE6lVLC9rXp4T2rZ8dMw',
  ELEVENLABS_API_KEY: 'sk_50ad9403cf4ad78ba36e1e1f4f3ada8eceed6141d95ee91f',
  GEMINI_API_KEY:'AIzaSyDjco007dTmB4wwwA1oxxYtxTfMVsVTano',
};

// --- 2. Gemini Text Generation ---
async function getGeminiResponse(userPrompt) {
  if (!CONFIG.GEMINI_API_KEY || CONFIG.GEMINI_API_KEY === 'YOUR_GEMINI_KEY') {
    console.warn('Gemini API key is missing; using local fallback response');
    return `AURA: I see your message: "${userPrompt}"`; // simple local fallback
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${CONFIG.GEMINI_API_KEY}`;
  const payload = {
    contents: [{ parts: [{ text: userPrompt }] }],
    system_instruction: {
      parts: [{ text: 'You are an elite anime antagonist named AURA. Keep responses short, dramatic, and intimidating.' }]
    },
    generationConfig: { maxOutputTokens: 100 }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error(`Gemini API HTTP ${response.status}`);
  }

  const data = await response.json();
  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('AURA chose silence.');
  }

  return data.candidates[0].content.parts[0].text;
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

  if (!response.ok) throw new Error('TTS Failed');

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  
  
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
        lastBotBubble.textContent = 'AURA: Could not get reply (check API key or network).';
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