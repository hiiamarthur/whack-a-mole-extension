(function () {
  const host = location.hostname;

  if (host.includes("chat.openai.com") || host.includes("chatgpt.com")) {
    setupChatGPT();
  } else if (host.includes("gemini.google.com")) {
    setupGemini();
  } else {
    console.log("Unsupported host:", host);
  }

  function setupChatGPT() {
    console.log("🧠 Injected into ChatGPT");

    let waiting = false;
    const interval = setInterval(() => {
      const thinking = document.querySelector('.result-thinking');

      if (thinking && !waiting) {
        waiting = true;
        console.log('⏳ ChatGPT is thinking');
        chrome.runtime.sendMessage({ type: "openGameWindow" });
      } else if (!thinking && waiting) {
        waiting = false;
        console.log('✅ ChatGPT finished');
        chrome.runtime.sendMessage({ type: "closeGameWindow" });
      }
    }, 500);
  }

  function setupGemini() {
    console.log("🔍 Gemini watcher running...");
  
    let waiting = false;
  
    const interval = setInterval(() => {
      // Get all avatar elements and find the most recent one
      const avatar = document.querySelector('.avatar_spinner_animation');
      let latestStatus = null;
      
      // Strategy 1: Look for the most recent avatar by checking visibility and position
      for (let i = avatars.length - 1; i >= 0; i--) {
        const avatar = avatars[i];
        const rect = avatar.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0 && 
                         getComputedStyle(avatar).display !== 'none' &&
                         getComputedStyle(avatar).visibility !== 'hidden';
        
        if (isVisible) {
          latestStatus = avatar.getAttribute('data-test-lottie-animation-status');
          break;
        }
      }
      
      // Strategy 2: If no visible avatar found, try to find the last one in the conversation
      if (!latestStatus && avatar) {
        // Look for avatars within the conversation container
        const conversationContainer = document.querySelector('[data-testid="conversation-turn"]') || 
                                    document.querySelector('.conversation-container') ||
                                    document.body;
        
        const conversationAvatars = conversationContainer.querySelectorAll('[data-test-lottie-animation-status]');
        if (conversationAvatars.length > 0) {
          latestStatus = conversationAvatars[conversationAvatars.length - 1].getAttribute('data-test-lottie-animation-status');
        }
      }
      
      // Strategy 3: Fallback to the last avatar in the entire document
      if (!latestStatus && avatars.length > 0) {
        latestStatus = avatars[avatars.length - 1].getAttribute('data-test-lottie-animation-status');
      }
      
      const spinner = document.querySelector('.avatar_spinner_animation');
      
      const isStatusThinking = latestStatus !== 'completed';
      console.log('🤖 Gemini status:', latestStatus, isStatusThinking, 
                  'Total avatars found:', avatars.length,
                  'Visible avatars:', Array.from(avatars).filter(a => {
                    const rect = a.getBoundingClientRect();
                    return rect.width > 0 && rect.height > 0;
                  }).length,
                  spinner ? getComputedStyle(spinner).opacity : 'no-spinner',
                  spinner ? getComputedStyle(spinner).visibility : 'no-spinner');
      
      const isSpinnerVisible = spinner &&
        getComputedStyle(spinner).opacity !== '0' &&
        getComputedStyle(spinner).visibility !== 'hidden';
  
      const isThinking = isStatusThinking || isSpinnerVisible;
  
      if (isThinking && !waiting) {
        waiting = true;
        console.log("⏳ Gemini is thinking — show game");
        chrome.runtime.sendMessage({ type: "openGameWindow" });
      } else if (!isThinking && waiting) {
        waiting = false;
        console.log("✅ Gemini finished — hide game");
        chrome.runtime.sendMessage({ type: "closeGameWindow" });
      }
    }, 300);
  }
})();
