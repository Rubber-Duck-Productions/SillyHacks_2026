let typingTimer;
const doneTypingInterval = 1000; // Wait 1 second after typing stops

document.addEventListener('keyup', (event) => {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        clearTimeout(typingTimer); // Reset the timer every time a key is pressed
        
        const text = event.target.value;
        if (text.length > 20) {
            // Start the timer
            typingTimer = setTimeout(() => {
                chrome.runtime.sendMessage({ action: "checkCringe", text: text }, (response) => {
                    if (response && response.cringe) {
                        alert("⚠️ AURA CHECK FAILED: Cringe detected!");
                    }
                });
            }, doneTypingInterval);
        }
    }
});