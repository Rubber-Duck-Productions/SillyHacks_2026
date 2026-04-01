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
            if (response.score > 0.5) {
            // roast them
                triggerPopup(element);
            }
        } else if (response.score > 0.5) {
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
    // 1. Prevent Stacking: If an overlay exists, get rid of it.
    const existing = document.getElementById('aura-overlay');
    if (existing) existing.remove();

    // 2. Create the Gray-out Overlay (Centered Container)
    const overlay = document.createElement('div');
    overlay.id = 'aura-overlay';
    // Style the backdrop: Full screen, semi-transparent, centered content
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.7); /* Dims the rest of the page */
        z-index: 2147483647; /* Max allowed z-index to stay on top of everything */
        display: flex;
        justify-content: center;
        align-items: center;
        backdrop-filter: blur(2px); /* Optional: slight blur effect */
        pointer-events: all; /* Blocks clicks on the rest of the page */
    `;

    // 3. Create the Inner Roast Popup Content
    const popupContent = document.createElement('div');
    popupContent.id = 'aura-popup-content';
    // Style the actual card
    popupContent.style.cssText = `
        background: #1a1a1a;
        color: #ff4757; /* Toxic red color */
        padding: 30px;
        border-radius: 12px;
        font-family: 'Courier New', monospace; /* "Hacker/Terminal" vibe */
        font-size: 20px;
        text-align: center;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;
        min-width: 300px;
    `;

    // 4. Populate Content (Image + Text)
    popupContent.innerHTML = `
        <img src="${chrome.runtime.getURL('public/TheRockSideEye.jpg')}" 
        <div style="color: #ffffff; font-size: 16px;">
            Are you sure you wanna send that bro?<br>
        </div>
    `;

    // 5. Assemble and Inject
    overlay.appendChild(popupContent);
    document.body.appendChild(overlay);

    // 6. Play the Audio (Vine Boom)
    //const audio = new Audio(chrome.runtime.getURL('vine-boom.mp3'));
    //audio.play();

    // 7. Cleanup after 4 seconds (Removed automatically)
    setTimeout(() => {
        // Use animation/fadeout here if you are feeling fancy
        overlay.remove();
    }, 4000);
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