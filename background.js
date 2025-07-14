let gameWindowId = null;
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
    if (!gameWindowId) {
      // Add timeout delay before opening window
      setTimeout(() => {
        chrome.windows.create({
          url: chrome.runtime.getURL("whack/index.html"),
          type: "popup",
          width: 600,
          height: 600
        }, (newWindow) => {
          gameWindowId = newWindow.id;
        });
      }, gameSettings.timeout * 1000);
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