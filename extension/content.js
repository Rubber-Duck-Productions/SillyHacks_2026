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
    const existingBackdrop = document.getElementById('aura-overlay-backdrop');
    const existingCenter = document.getElementById('aura-overlay-center');
    existingBackdrop?.remove();
    existingCenter?.remove();

    // Dim full viewport (below the Rock stack)
    const backdrop = document.createElement('div');
    backdrop.id = 'aura-overlay-backdrop';
    backdrop.style.cssText = `
        position: fixed;
        inset: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(0, 0, 0, 0.72);
        z-index: 2147483646;
        backdrop-filter: blur(3px);
        pointer-events: auto;
    `;

    // Rock + message pinned to exact viewport center (browser window middle)
    const center = document.createElement('div');
    center.id = 'aura-overlay-center';
    center.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 2147483647;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 14px;
        max-width: min(92vw, 420px);
        pointer-events: none;
        text-align: center;
    `;

    // 4. Populate Content (Image + Text)
    const imgnum = Math.floor(Math.random() * 9);
    let imgURL = "";
    switch(imgnum) {
        case 0: imgURL = "public/DogGiveUp.jpg"; break;
        case 1: imgURL = "public/DogShush.jpg"; break;
        case 2: imgURL = "public/OMG.jpg"; break;
        case 3: imgURL = "public/Praying.jpg"; break;
        case 4: imgURL = "public/ShaqPause.jpg"; break;
        case 5: imgURL = "public/SusStare.jpg"; break;
        case 6: imgURL = "public/TheRockSideEye.jpg"; break;
        case 7: imgURL = "public/WaitBud.jpg"; break;
        case 8: imgURL = "public/WhatIsThis.jpg"; break;
    }
    popupContent.innerHTML = `
        <img src="${chrome.runtime.getURL(imgURL)}" 
         style="width: 50vw; height: 50vh; object-fit: contain; display: block; margin: 0 auto;" 
        />
        <div style="color: #ff0000; font-size: 16px;">
            Are you sure you wanna send that bro?<br>
        </div>
    `;

    const caption = document.createElement('div');
    caption.style.cssText = `
        color: #ffffff;
        font: 600 17px/1.35 system-ui, -apple-system, sans-serif;
        text-shadow: 0 2px 8px rgba(0,0,0,0.8);
        pointer-events: none;
    `;
    caption.textContent = 'Are you sure you wanna send that bro?';

    center.appendChild(img);
    center.appendChild(caption);
    document.body.appendChild(backdrop);
    document.body.appendChild(center);

    // 6. Play the Audio
    const audioNum = Math.floor(Math.random() * 3);
    audioURL = "";
    switch(audioNum) {
        case 0: audioURL = "public/Fah.mp3"; break;
        case 1: audioURL = "public/Lie.mp3"; break;
        case 2: audioURL = "public/VineBoom.mp3"; break;
    }
    const audio = new Audio(chrome.runtime.getURL(audioURL));
    audio.play();

    // 7. Cleanup after 4 seconds (Removed automatically)
    setTimeout(() => {
        // Use animation/fadeout here if you are feeling fancy
        overlay.remove();
    }, 2000);
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