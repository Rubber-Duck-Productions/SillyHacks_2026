const HF_TOKEN = "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";

// The Chef listens for a "note" from the Waiter
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "checkCringe") {
        askTheBrain(request.text).then(isCringe => {
            sendResponse({ cringe: isCringe });
        });
        return true; // Keeps the line open for the answer
    }
});

async function askTheBrain(userInput) {
    const modelUrl = "https://router.huggingface.co/models/tabularisai/multilingual-sentiment-analysis";
    const response = await fetch(modelUrl, {
        headers: { Authorization: `Bearer ${HF_TOKEN}` },
        method: "POST",
        body: JSON.stringify({ inputs: userInput }),
    });
    const result = await response.json();
    const topResult = result[0][0]; 
    return (topResult.label === "1 star" || topResult.label === "2 stars");
}