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
