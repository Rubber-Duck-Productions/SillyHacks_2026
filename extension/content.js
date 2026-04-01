document.addEventListener('keyup', (event) => {
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        const text = event.target.value;
        if (text.length > 20) {
            // The Waiter sends a note to the Chef
            chrome.runtime.sendMessage({ action: "checkCringe", text: text }, (response) => {
                if (response.cringe) {
                    alert("⚠️ AURA CHECK FAILED: Cringe detected!");
                }
            });
        }
    }
});