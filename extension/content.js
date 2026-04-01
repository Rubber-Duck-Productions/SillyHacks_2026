//content.js
let isBypassing = false;
document.addEventListener('keydown', handleKeyPress, true);

//main function
async function handleKeyPress(event) {
    if (isBypassing) return;

    //test trigger
    if (event.key === 'Enter' && event.ctrlKey) {
        event.preventDefault(); // stop send if any
        const element = event.target; //event target is the text box
        if (!isTextEntry(element)) {
            console.log("ERROR: Not a text entry element.");
            return; // filter for text areas
        }
        const text = getElementText(element); // get text

        console.log("Testing...");  
        
        //our actual function
        processAuraCheck(text, element, true); 
        return; 
    }
    //actual sending
    else if (event.key === 'Enter' && !event.shiftKey) {
        const element = event.target;
        
        // Filter for actual text areas
        if (isTextEntry(element)) {
            const rawContent = getElementText(element);
            
            // stop all processes 
            event.preventDefault();
            event.stopImmediatePropagation();

            // 2. Trigger the "Vibe Check"
            processAuraCheck(rawContent, element);
            return;
        }
        return;
    }
}

//aura checker
async function processAuraCheck(text, element, isTest = false) {
    chrome.runtime.sendMessage({ type: 'CHECK_AURA', content: text }, (response) => {
        if (isTest) {
            console.log(`Cringe Level: ${Math.round(response.score * 100)}%`);
        } else if (response.score > 0.8) {
            // roast them
            triggerPopup(element);
        } else {
            // allow send
            releaseMessage(element);
        }
    });
}

//Functions--------------------------------------------------------------------
function isTextEntry(el) {
    if (!el) return false;

    const tagName = el.tagName.toLowerCase();
    
    // Standard HTML text boxes
    if (tagName === 'input' || tagName === 'textarea') {
        return true;
    }

    // Modern rich-text editors (Discord, Gmail, Slack, etc.)
    if (el.isContentEditable || el.getAttribute('contenteditable') === 'true') {
        return true;
    }

    return false;
}

function getElementText(el) {
    const tag = el.tagName.toLowerCase();

    // Standard input fields
    if (tag === 'input' || tag === 'textarea') {
        return el.value;
    }

    // Rich text / contenteditable (Discord, Slack, Gmail, etc.)
    if (el.isContentEditable || el.getAttribute('contenteditable') === 'true') {
        return el.innerText || el.textContent || '';
    }

    return '';
}

function triggerPopup(element) {
    // Implementation for triggering the popup
}

// allow sending
function releaseMessage(element) {
    isBypassing = true;

    // create a fake "Enter" event
    const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
    });

    // put in textbox and send
    element.dispatchEvent(enterEvent);

    // turn bypass off so we catch the next message
    isBypassing = false;
    console.log("Message released.");
}