let gameWindowId = null;
let pendingOpenTimeout = null;
let gameSettings = {
  autoClose: true,
  timeout: 2.0
};

// Load settings from storage on startup
chrome.storage.local.get(['gameSettings'], (result) => {
  if (result.gameSettings) {
    gameSettings = { ...gameSettings, ...result.gameSettings };
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "openGameWindow") {
    if (pendingOpenTimeout) {
      clearTimeout(pendingOpenTimeout);
      pendingOpenTimeout = null;
    }

    const openNewWindow = () => {
      chrome.windows.create({
        url: chrome.runtime.getURL("whack/index.html"),
        type: "popup",
        width: 600,
        height: 600
      }, (newWindow) => {
        gameWindowId = newWindow.id;
      });
    };

    if (gameWindowId) {
      // Close existing window first, then open new one after removal completes
      chrome.windows.remove(gameWindowId, () => {
        gameWindowId = null;
        // Open new window after small delay to ensure cleanup
        setTimeout(() => {
          openNewWindow();
        }, 100);
      });
    } else {
      // No window open, just open after timeout
      pendingOpenTimeout = setTimeout(() => {
        openNewWindow();
        pendingOpenTimeout = null;
      }, (gameSettings.timeout || 0) * 1000);
    }
  }

  


  if(message.type === "closeGameWindow") {
    if(gameWindowId && gameSettings.autoClose) {
      chrome.windows.remove(gameWindowId);
      gameWindowId = null;
    }
  }
  if(message.type === "updateGameSettings") {
    if (message.autoClose !== undefined) {
      gameSettings.autoClose = message.autoClose;
    }
    if (message.timeout !== undefined) {
      gameSettings.timeout = message.timeout;
    }
    
    // Save to storage
    chrome.storage.local.set({ gameSettings });
  }
});

chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === gameWindowId) {
    gameWindowId = null;
  }
});