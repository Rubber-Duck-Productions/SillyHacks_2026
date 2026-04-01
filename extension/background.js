<<<<<<< HEAD
importScripts('aura-config.js');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CHECK_AURA') {
    const mockScore = Math.random();
    console.log('Brain received:', request.content);
    sendResponse({ score: mockScore });
    return false;
  }

  if (request.action === 'checkCringe') {
    sendResponse({ cringe: Math.random() > 0.5 });
    return false;
  }

  return false;
});
=======
import { HF_TOKEN } from './config.js';
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
    "diddyblud", "tuff", "fine shyt", "shyt", "tweaking", 
    "dih", "puh", "fuh", "bih", "chungus",
    "mald", "mog", "tung", "tralalero",
    "patapim", "brainrot", "unc"
];
>>>>>>> 6f8ee1f3c89db87cb352130a42f1bf8f23939646
