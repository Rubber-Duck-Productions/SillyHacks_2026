
const CONFIG = {
  ELEVENLABS_VOICE_ID: 'kE6lVLC9rXp4T2rZ8dMw',
  ELEVENLABS_API_KEY: 'sk_50ad9403cf4ad78ba36e1e1f4f3ada8eceed6141d95ee91f',
  GEMINI_API_KEY:'AIzaSyDjco007dTmB4wwwA1oxxYtxTfMVsVTano',
};

// 1. Function to get text from Gemini (same behavior as popup.js; for console/testing)
async function getGeminiResponse(userPrompt) {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(CONFIG.GEMINI_API_KEY)}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: { maxOutputTokens: 100 },
        }),
      }
    );
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || `HTTP ${response.status}`);
    }
    const text = data.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text;
    if (text) return text;
    throw new Error('No text in Gemini response');
  } catch (error) {
    console.error('Gemini Error:', error);
    return "I'm having trouble thinking of what to say right now.";
  }
}

// 2. Your existing TTS function
async function generateAnimeSpeech(text) {
  if (!CONFIG.ELEVENLABS_API_KEY) {
    console.warn('ElevenLabs API key not set.');
    return;
  }

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
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.8,
        style: 0.0,
        use_speaker_boost: true
      }
    }),
  });

  if (!response.ok) throw new Error('Failed to generate audio');

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.play();
}

// 3. Orchestrator: Combine both
async function talkToGemini(userInput) {
  console.log("Thinking...");
  const aiText = await getGeminiResponse(userInput);
  
  console.log("Gemini said:", aiText);
  console.log("Generating voice...");
  
  await generateAnimeSpeech(aiText);
}

// Call talkToGemini(...) from the console when testing; the extension popup uses popup.js.