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
    chrome.runtime.sendMessage({ type: 'CHECK_AURA', content: text }, async (response) => {
        if (isTest) {
            console.log(`Cringe Level: ${Math.round(response.score * 100)}%`);
            if (response.score > 0.5) {
            // roast them
                const roast = await fetchGeminiRoast(text);
                triggerPopup(element, roast);
            }
        } else if (response.score > 0.5) {
            // roast them
            const roast = await fetchGeminiRoast(text);
            triggerPopup(element, roast);
        } else {
            // allow send
            releaseMessage(element);
        }
    });
}

async function fetchGeminiRoast(text) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'GET_ROAST', content: text }, (response) => {
            resolve(response?.roast || "bro really said that");
        });
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

function triggerPopup(element, roastText = "bro really said that") {
    document.getElementById('aura-overlay-backdrop')?.remove();
    document.getElementById('aura-overlay-center')?.remove();

    const backdrop = document.createElement('div');
    backdrop.id = 'aura-overlay-backdrop';
    backdrop.style.cssText = `
        position: fixed; inset: 0;
        width: 100vw; height: 100vh;
        background: rgba(0,0,0,0.72);
        z-index: 2147483646;
        backdrop-filter: blur(3px);
        pointer-events: auto;
    `;

    const center = document.createElement('div');
    center.id = 'aura-overlay-center';
    center.style.cssText = `
        position: fixed; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        z-index: 2147483647;
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        gap: 14px;
        max-width: min(92vw, 420px);
        pointer-events: none;
        text-align: center;
    `;

    const leftCol = document.createElement('div');
    leftCol.style.cssText = `
        display: flex; flex-direction: column;
        align-items: center; gap: 14px;
        pointer-events: auto;
    `;

    // Right side — video
    const rightCol = document.createElement('div');
    rightCol.style.cssText = `
        display: flex; align-items: center; justify-content: center;
        pointer-events: none;
    `;

    // Image
    const imgNum = Math.floor(Math.random() * 9);
    const imgFiles = [
        "public/DogGiveUp.jpg", "public/DogShush.jpg", "public/OMG.jpg",
        "public/Praying.jpg",   "public/ShaqPause.jpg", "public/SusStare.jpg",
        "public/TheRockSideEye.jpg", "public/WaitBud.jpg", "public/WhatIsThis.jpg"
    ];
    const img = document.createElement('img');
    img.src = chrome.runtime.getURL(imgFiles[imgNum]);
    img.style.cssText = "width: 50vw; height: 50vh; object-fit: contain; display: block; margin: 0 auto;";

    // Warning
    const warning = document.createElement('div');
    warning.style.cssText = `color: #ff0000; font-size: 16px; font-weight: 700;
        text-shadow: 0 2px 8px rgba(0,0,0,0.8);`;
    warning.textContent = 'Are you sure you wanna send that bro?';

    const spokenRoast = ROASTS[Math.floor(Math.random() * ROASTS.length)];

    // Gemini roast
    const caption = document.createElement('div');
    caption.style.cssText = `color: #ffffff; font: 600 17px/1.35 system-ui, -apple-system, sans-serif;
        text-shadow: 0 2px 8px rgba(0,0,0,0.8);`;
    caption.textContent = spokenRoast;

    const video = document.createElement('video');
    video.src = chrome.runtime.getURL("media/animeGirl.mp4");
    video.style.cssText = "width: 50vw; max-height: 40vh; object-fit: contain; display: none; margin: 0 auto; border-radius: 8px;";
    video.autoplay = true;
    video.loop = false;

    video.style.cssText = `
        width: 28vw; max-height: 50vh;
        object-fit: contain; display: none;
        border-radius: 8px;
    `;

    // Buttons
    const btnRow = document.createElement('div');
    btnRow.style.cssText = `display: flex; gap: 12px; margin-top: 8px; pointer-events: auto;`;

    const btnProceed = document.createElement('button');
    btnProceed.textContent = '😈 Send it anyway';
    btnProceed.style.cssText = `
        padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer;
        background: #e53e3e; color: #fff; font-weight: 700; font-size: 15px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    `;

    const btnCancel = document.createElement('button');
    btnCancel.textContent = '✅ Let me fix it';
    btnCancel.style.cssText = `
        padding: 10px 20px; border-radius: 8px; border: none; cursor: pointer;
        background: #38a169; color: #fff; font-weight: 700; font-size: 15px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    `;

    const cleanup = () => {
        backdrop.remove();
        center.remove();
    };

    btnProceed.addEventListener('click', () => {
        cleanup();
        releaseMessage(element);
    });

    btnCancel.addEventListener('click', () => {
        cleanup();
        console.log("Cringe averted. Aura preserved.");
    });

    btnRow.appendChild(btnProceed);
    btnRow.appendChild(btnCancel);

    leftCol.appendChild(img);
    leftCol.appendChild(warning);
    leftCol.appendChild(caption);
    leftCol.appendChild(btnRow);
    rightCol.appendChild(video);

    center.appendChild(leftCol);
    center.appendChild(rightCol);
    document.body.appendChild(backdrop);
    document.body.appendChild(center);

    // Audio
    const audioFiles = ["public/Fah.mp3", "public/Lie.mp3", "public/VineBoom.mp3"];
    const audioURL = audioFiles[Math.floor(Math.random() * 3)];
    const audio = new Audio(chrome.runtime.getURL(audioURL));
    audio.play();

    setTimeout(() => {
        console.log("Boom! 1 second passed.");
    }, 2000);

    audio.addEventListener('ended', async () => {
        // Swap image for video
        img.style.display = 'none';
        video.style.display = 'block';
        video.play();

        // Generate and play AI voice over the video
        try {
            await generateAnimeSpeech(spokenRoast);
        } catch (err) {
            console.error("ElevenLabs failed:", err);
        }
    });
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

const ROASTS = [
    "Did you really just type that? Your aura is cooked.",
    "Bro spent three seconds writing that and lost fifty aura points.",
    "Your ancestors are crying. Delete that immediately.",
    "That message has the energy of a participation trophy.",
    "Even your autocorrect was embarrassed to suggest that.",
    "You just set a new personal record for being cringe.",
    "I have seen better takes from a broken fortune cookie.",
    "Your rizz is in the negatives and falling fast.",
    "That sentence just made the whole internet dumber.",
    "Whoever taught you to type owes everyone an apology.",
    "Your message has been flagged as a crime against vibes.",
    "Three words: touch some grass.",
    "That was so cringe my screen tried to turn itself off.",
    "You typed that with your whole chest and that is the problem.",
    "The audacity. The nerve. The absolute lack of self-awareness.",
];