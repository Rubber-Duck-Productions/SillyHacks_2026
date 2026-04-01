// --- Main UI Logic only ---

document.addEventListener('DOMContentLoaded', () => {
  const sendBtn = document.getElementById('send-btn');
  const promptEl = document.getElementById('prompt');
  const chatWindow = document.getElementById('chat-window');

  function appendMessage(text, cssClass) {
    const message = document.createElement('div');
    message.className = cssClass;
    message.textContent = text;
    chatWindow.appendChild(message);
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }

  async function handleSend() {
    const prompt = promptEl.value.trim();
    if (!prompt) return;

    appendMessage(`You: ${prompt}`, 'msg-user');
    promptEl.value = '';

    appendMessage('AURA: thinking...', 'msg-bot');
    const lastBotBubble = chatWindow.lastElementChild;

    try {
      const responseText = await talkToGemini(prompt); // `talkToGemini` from characters.js
      if (lastBotBubble) {
        lastBotBubble.textContent = `AURA: ${responseText}`;
      }
    } catch (error) {
      if (lastBotBubble) {
        lastBotBubble.textContent = 'AURA: The AI is not responding right now.';
      }
      console.error('Gemini pipeline error:', error);
    }
  }

  sendBtn.addEventListener('click', handleSend);

  promptEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  });
});
