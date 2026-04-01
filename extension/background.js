// background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'CHECK_AURA') {
        const mockScore = Math.random(); 
        
        console.log("Brain received:", request.content);
        
        sendResponse({ 
            score: mockScore, 
        });
    }
    return true;
});