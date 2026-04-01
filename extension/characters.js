
const ELEVENLABS_VOICE_ID = 'kE6lVLC9rXp4T2rZ8dMw';
const ELEVENLABS_API_KEY = 'sk_50ad9403cf4ad78ba36e1e1f4f3ada8eceed6141d95ee91f';
const GEMINI_API_KEY = 'AIzaSyDjco007dTmB4wwwA1oxxYtxTfMVsVTano'; // Get from Google Cloud console for Gemini API

async function generateAnimeSpeech(text) {
  if (!ELEVENLABS_API_KEY || ELEVENLABS_API_KEY.startsWith('<')) {
    console.warn('ElevenLabs API key not set. Skipping TTS.');
    return;
  }

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY,
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

  if (!response.ok) {
    throw new Error('Failed to generate audio');
  }

  const audioBlob = await response.blob();
  const audioUrl = URL.createObjectURL(audioBlob);
  
  // Play the audio immediately
  const audio = new Audio(audioUrl);
  audio.play();
}









generateAnimeSpeech("Your weapons are but toothpicks to me. Surrender now!");