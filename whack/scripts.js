const highestScoreEl = document.getElementById('highest-score');
const currentScoreEl = document.getElementById('current-score');

const MAX_SIZE = 64;
let customCursorUrl = null;

// Wait for shared state to be ready
let sharedStateReady = false;

// Initialize shared state
async function initSharedState() {
  if (window.sharedState) {
    await window.sharedState.init();
    sharedStateReady = true;
    loadCache();
  } else {
    // Fallback to localStorage if shared state not available
    console.warn('Shared state not available, falling back to localStorage');
    loadCache();
  }
}

// Load cached data on startup
async function loadCache() {
  if (sharedStateReady && window.sharedState) {
    // Use shared state
    const state = await window.sharedState.getAll();
    
    // Store them globally for the game to use
    window.customMoleUrl = state.moleUrl;
    window.customSuperMoleUrl = state.superMoleUrl;
    window.customBombUrl = state.bombUrl;

    if (state.highestScore) {
      highestScoreEl.textContent = state.highestScore;
    }

  } else {
    // Fallback to localStorage
    const LS_MOLE_KEY = 'customMole';
    const LS_SUPER_MOLE_KEY = 'customSuperMole';
    const LS_BOMB_KEY = 'customBomb';
    const LS_SCORE_KEY = 'highestMoleScore';

    // Load mole, super mole and bomb images (these will be used by the game logic)
    const cachedMole = localStorage.getItem(LS_MOLE_KEY);
    const cachedSuperMole = localStorage.getItem(LS_SUPER_MOLE_KEY);
    const cachedBomb = localStorage.getItem(LS_BOMB_KEY);
    
    // Store them globally for the game to use
    window.customMoleUrl = cachedMole;
    window.customSuperMoleUrl = cachedSuperMole;
    window.customBombUrl = cachedBomb;

    const cachedScore = localStorage.getItem(LS_SCORE_KEY);
    console.log("loadCache",cachedScore);
    if (cachedScore && !isNaN(cachedScore)) {
      highestScoreEl.textContent = cachedScore;
    }
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.type === 'setMole') {
    if (sharedStateReady && window.sharedState) {
      await window.sharedState.set('moleUrl', message.moleUrl);
    } else {
      const LS_MOLE_KEY = 'customMole';
      localStorage.setItem(LS_MOLE_KEY, message.moleUrl);
    }
    window.customMoleUrl = message.moleUrl;
  } else if (message.type === 'setSuperMole') {
    if (sharedStateReady && window.sharedState) {
      await window.sharedState.set('superMoleUrl', message.superMoleUrl);
    } else {
      const LS_SUPER_MOLE_KEY = 'customSuperMole';
      localStorage.setItem(LS_SUPER_MOLE_KEY, message.superMoleUrl);
    }
    window.customSuperMoleUrl = message.superMoleUrl;
  } else if (message.type === 'setBomb') {
    if (sharedStateReady && window.sharedState) {
      await window.sharedState.set('bombUrl', message.bombUrl);
    } else {
      const LS_BOMB_KEY = 'customBomb';
      localStorage.setItem(LS_BOMB_KEY, message.bombUrl);
    }
    window.customBombUrl = message.bombUrl;
  } else if (message.type === 'updateSoundSettings') {
    if (window.soundManager) {
      if (message.soundEnabled !== undefined) {
        window.soundManager.setEnabled(message.soundEnabled);
      }
      if (message.soundVolume !== undefined) {
        window.soundManager.setVolume(message.soundVolume);
      }
    }
  } else if (message.type === 'resetAll') {
    if (sharedStateReady && window.sharedState) {
      await window.sharedState.clear();
    } else {
      const LS_MOLE_KEY = 'customMole';
      const LS_SUPER_MOLE_KEY = 'customSuperMole';
      const LS_BOMB_KEY = 'customBomb';
      const LS_SCORE_KEY = 'highestMoleScore';
      
      localStorage.removeItem(LS_MOLE_KEY);
      localStorage.removeItem(LS_SUPER_MOLE_KEY);
      localStorage.removeItem(LS_BOMB_KEY);
      localStorage.removeItem(LS_SCORE_KEY);
    }
    highestScoreEl.textContent = '0';
    
    // Clear global variables
    window.customMoleUrl = null;
    window.customSuperMoleUrl = null;
    window.customBombUrl = null;
  }
});

// Update highest score if higher than current
async function updateScore(newScore) {
  if (sharedStateReady && window.sharedState) {
    const currentHigh = await window.sharedState.get('highestScore') || 0;
    console.log("updateScore", newScore, currentHigh);
    
    if (newScore > currentHigh) {
      await window.sharedState.set('highestScore', newScore);
      highestScoreEl.textContent = newScore;
    }
    
    // Always update current score
    await window.sharedState.set('currentScore', newScore);
  } else {
    // Fallback to localStorage
    const LS_SCORE_KEY = 'highestMoleScore';
    const currentHigh = parseInt(localStorage.getItem(LS_SCORE_KEY) || '0', 10);
    console.log("updateScore", newScore, currentHigh);
    if (newScore > currentHigh) {
      localStorage.setItem(LS_SCORE_KEY, newScore);
      highestScoreEl.textContent = newScore;
    }
  }
}




initSharedState();