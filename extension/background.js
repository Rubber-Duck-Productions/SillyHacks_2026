import { HF_TOKEN, AURA_GEMINI_API_KEY } from './config.js';

const CONFIG = {
  GEMINI_API_KEY: (typeof AURA_GEMINI_API_KEY !== 'undefined' ? AURA_GEMINI_API_KEY : '').trim(),
  ELEVENLABS_API_KEY: (typeof AURA_ELEVENLABS_API_KEY !== 'undefined' ? AURA_ELEVENLABS_API_KEY : '').trim(),
  ELEVENLABS_VOICE_ID: (
    typeof AURA_ELEVENLABS_VOICE_ID !== 'undefined' && String(AURA_ELEVENLABS_VOICE_ID).trim()
      ? String(AURA_ELEVENLABS_VOICE_ID).trim()
      : 'kE6lVLC9rXp4T2rZ8dMw'
  ),
};

// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'CHECK_AURA') {        
        console.log("Brain received:", request.content);
        
        askTheBrain(request.content).then(cringeScore => {
            sendResponse({ 
                score: cringeScore, 
            });
        });
    }

    // ROAST SECTION
    if (request.type === 'GET_ROAST') {
        fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${encodeURIComponent(CONFIG.GEMINI_API_KEY)}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: 
                        `The user was about to send this message: "${request.content}". 
                        Roast them in one short savage sentence. No quotes, no emojis, max 12 words.` 
                    }]}],
                    generationConfig: { maxOutputTokens: 50 }
                })
            }
        )
        .then(r => r.json())
        .then(data => {
            const roast = data.candidates?.[0]?.content?.parts?.[0]?.text || "bro really said that";
            sendResponse({ roast });
        })
        .catch(() => sendResponse({ roast: "bro really said that" }));
    }
    return true;
});

async function askTheBrain(userInput) {
    const modelUrl = "https://router.huggingface.co/hf-inference/models/finiteautomata/bertweet-base-sentiment-analysis";
    try {
        const response = await fetch(modelUrl, {
            headers: { 
                "Authorization": `Bearer ${HF_TOKEN}`,
                "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify({ inputs: userInput }),
        });

        const result = await response.json();
        console.log("Raw API result:", JSON.stringify(result));

        const negativeScore = result[0].find(item => item.label === 'NEG')?.score || 0;

        // check for cringe words
        const lowerInput = userInput.toLowerCase();
        const isCringe = CRINGE_LIST.some(word => lowerInput.includes(word));

        if (isCringe) {
            return 1 - negativeScore; // flip signs
        }

        return negativeScore; 
    } catch (error) {
        console.error("Brain Connection Failed:", error);
        return 0; // Default to 'Safe' if the API is down
    }
}

// force checker
const CRINGE_LIST = [
    "skibidi", "gyat", "rizz", 
    "ohio", "sigma", "mewing",
    "67", "ratio", "bussin", 
    "sus", "yeet", "based", 
    "poggers", "uwu", "rawr", 
    "chud", "baby gronk", "griddy", 
    "bombaclat", "sussy baka", "mog",
    "bffr", "uwu", "xd", "owo", 
    "sybau", "tmo", "ts", "diddy", 
    "diddyblud", "tuff", "tweaking", 
    "dih", "puh", "fuh", "bih", "chungus",
    "mald", "mog", "tung", "tralalero",
    "patapim", "brainrot", "unc"
];