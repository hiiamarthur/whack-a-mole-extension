const statusMsg = document.getElementById('status-msg');
const highestScoreEl = document.getElementById('highest-score');
const currentScoreEl = document.getElementById('current-score');

// Mole elements
const moleInput = document.getElementById('mole-input');
const molePreview = document.getElementById('mole-preview');
const setMoleBtn = document.getElementById('set-mole-btn');
const moleErrorMsg = document.getElementById('mole-error-msg');

// Super mole elements
const superMoleInput = document.getElementById('super-mole-input');
const superMolePreview = document.getElementById('super-mole-preview');
const setSuperMoleBtn = document.getElementById('set-super-mole-btn');
const superMoleErrorMsg = document.getElementById('super-mole-error-msg');

// Bomb elements
const bombInput = document.getElementById('bomb-input');
const bombPreview = document.getElementById('bomb-preview');
const setBombBtn = document.getElementById('set-bomb-btn');
const bombErrorMsg = document.getElementById('bomb-error-msg');

// Reset button
const resetCursorBtn = document.getElementById('reset-cursor-btn');

// Sound controls
const soundToggle = document.getElementById('sound-toggle');
const volumeSlider = document.getElementById('volume-slider');
const volumeValue = document.getElementById('volume-value');

// Game controls
const autoCloseToggle = document.getElementById('auto-close-toggle');
const timeoutSlider = document.getElementById('timeout-slider');
const timeoutValue = document.getElementById('timeout-value');

const MAX_SIZE = 64;
let moleUrl = null;
let superMoleUrl = null;
let bombUrl = null;

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
    
    // Load mole
    if (state.moleUrl) {
      molePreview.src = state.moleUrl;
      molePreview.style.display = 'inline-block';
      moleUrl = state.moleUrl;
      setMoleBtn.disabled = false;
    }

    // Load super mole
    if (state.superMoleUrl) {
      superMolePreview.src = state.superMoleUrl;
      superMolePreview.style.display = 'inline-block';
      superMoleUrl = state.superMoleUrl;
      setSuperMoleBtn.disabled = false;
    }

    // Load bomb
    if (state.bombUrl) {
      bombPreview.src = state.bombUrl;
      bombPreview.style.display = 'inline-block';
      bombUrl = state.bombUrl;
      setBombBtn.disabled = false;
    }

    // Load score
    if (state.highestScore) {
      highestScoreEl.textContent = state.highestScore;
    }

    // Load sound settings
    if (state.gameSettings) {
      soundToggle.checked = state.gameSettings.soundEnabled !== false;
      const volume = state.gameSettings.soundVolume || 0.7;
      volumeSlider.value = Math.round(volume * 100);
      volumeValue.textContent = `${Math.round(volume * 100)}%`;
      
      // Load game settings
      autoCloseToggle.checked = state.gameSettings.autoClose !== false;
      const timeout = state.gameSettings.timeout || 2.0;
      timeoutSlider.value = timeout;
      timeoutValue.textContent = `${timeout}s`;
    }

    // Listen for score updates
    window.sharedState.on('currentScore', (score) => {
      currentScoreEl.textContent = score;
    });

    window.sharedState.on('highestScore', (score) => {
      highestScoreEl.textContent = score;
    });

    // Listen for sound setting updates
    window.sharedState.on('gameSettings', (settings) => {
      if (settings) {
        soundToggle.checked = settings.soundEnabled !== false;
        const volume = settings.soundVolume || 0.7;
        volumeSlider.value = Math.round(volume * 100);
        volumeValue.textContent = `${Math.round(volume * 100)}%`;
        
        // Update game settings
        autoCloseToggle.checked = settings.autoClose !== false;
        const timeout = settings.timeout || 2.0;
        timeoutSlider.value = timeout;
        timeoutValue.textContent = `${timeout}s`;
      }
    });

  } else {
    // Fallback to localStorage
    const LS_MOLE_KEY = 'customMole';
    const LS_SUPER_MOLE_KEY = 'customSuperMole';
    const LS_BOMB_KEY = 'customBomb';
    const LS_SCORE_KEY = 'highestMoleScore';

    // Load mole
    const cachedMole = localStorage.getItem(LS_MOLE_KEY);
    if (cachedMole) {
      molePreview.src = cachedMole;
      molePreview.style.display = 'inline-block';
      moleUrl = cachedMole;
      setMoleBtn.disabled = false;
    }

    // Load super mole
    const cachedSuperMole = localStorage.getItem(LS_SUPER_MOLE_KEY);
    if (cachedSuperMole) {
      superMolePreview.src = cachedSuperMole;
      superMolePreview.style.display = 'inline-block';
      superMoleUrl = cachedSuperMole;
      setSuperMoleBtn.disabled = false;
    }

    // Load bomb
    const cachedBomb = localStorage.getItem(LS_BOMB_KEY);
    if (cachedBomb) {
      bombPreview.src = cachedBomb;
      bombPreview.style.display = 'inline-block';
      bombUrl = cachedBomb;
      setBombBtn.disabled = false;
    }

    const cachedScore = localStorage.getItem(LS_SCORE_KEY);
    if (cachedScore && !isNaN(cachedScore)) {
      highestScoreEl.textContent = cachedScore;
    }

    // Load sound settings from localStorage
    const soundEnabled = localStorage.getItem('soundEnabled');
    if (soundEnabled !== null) {
      soundToggle.checked = soundEnabled === 'true';
    }
    const soundVolume = localStorage.getItem('soundVolume');
    if (soundVolume !== null) {
      const volume = parseFloat(soundVolume);
      volumeSlider.value = Math.round(volume * 100);
      volumeValue.textContent = `${Math.round(volume * 100)}%`;
    }

    // Load game settings from localStorage
    const autoClose = localStorage.getItem('autoClose');
    if (autoClose !== null) {
      autoCloseToggle.checked = autoClose === 'true';
    }
    const timeout = localStorage.getItem('timeout');
    if (timeout !== null) {
      const timeoutValue = parseFloat(timeout);
      timeoutSlider.value = timeoutValue;
      timeoutValue.textContent = `${timeoutValue}s`;
    }
  }
}

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

// Show status message
function showStatus(message, duration = 3000) {
  statusMsg.textContent = message;
  setTimeout(() => {
    statusMsg.textContent = '';
  }, duration);
}

// Send message to game window if it exists
function sendToGame(message) {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      if (tab.url && tab.url.includes('whack/index.html')) {
        chrome.tabs.sendMessage(tab.id, message);
      }
    });
  });
}

// Generic function to handle file uploads
function handleFileUpload(file, previewElement, setButton, errorElement, onSuccess) {
  errorElement.textContent = '';
  
  if (!file) {
    previewElement.style.display = 'none';
    setButton.disabled = true;
    return;
  }

  if (!['image/png', 'image/jpeg'].includes(file.type)) {
    errorElement.textContent = 'Only PNG and JPEG images are allowed.';
    return;
  }

  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > MAX_SIZE || height > MAX_SIZE) {
        const scale = Math.min(MAX_SIZE / width, MAX_SIZE / height);
        width = Math.floor(width * scale);
        height = Math.floor(height * scale);
      }
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const resizedDataUrl = canvas.toDataURL('image/png');
      previewElement.src = resizedDataUrl;
      previewElement.style.display = 'inline-block';
      setButton.disabled = false;

      onSuccess(resizedDataUrl);
    };
    img.onerror = () => {
      errorElement.textContent = 'Failed to load image. Try another file.';
      previewElement.style.display = 'none';
      setButton.disabled = true;
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

moleInput.addEventListener('change', () => {
  const file = moleInput.files[0];
  handleFileUpload(file, molePreview, setMoleBtn, moleErrorMsg, (dataUrl) => {
    moleUrl = dataUrl;
    showStatus('Mole image ready! Click "Set Mole" to apply.');
  });
});

superMoleInput.addEventListener('change', () => {
  const file = superMoleInput.files[0];
  handleFileUpload(file, superMolePreview, setSuperMoleBtn, superMoleErrorMsg, (dataUrl) => {
    superMoleUrl = dataUrl;
    showStatus('Super mole image ready! Click "Set Super Mole" to apply.');
  });
});

bombInput.addEventListener('change', () => {
  const file = bombInput.files[0];
  handleFileUpload(file, bombPreview, setBombBtn, bombErrorMsg, (dataUrl) => {
    bombUrl = dataUrl;
    showStatus('Bomb image ready! Click "Set Bomb" to apply.');
  });
});

setMoleBtn.addEventListener('click', async () => {
  if (!moleUrl) return;
  
  if (sharedStateReady && window.sharedState) {
    // Save to shared state
    await window.sharedState.set('moleUrl', moleUrl);
  } else {
    // Fallback to localStorage
    const LS_MOLE_KEY = 'customMole';
    localStorage.setItem(LS_MOLE_KEY, moleUrl);
  }
  
  // Send to game window
  sendToGame({
    type: 'setMole',
    moleUrl: moleUrl
  });
  
  showStatus('Mole image applied!');
});

setSuperMoleBtn.addEventListener('click', async () => {
  if (!superMoleUrl) return;
  
  if (sharedStateReady && window.sharedState) {
    // Save to shared state
    await window.sharedState.set('superMoleUrl', superMoleUrl);
  } else {
    // Fallback to localStorage
    const LS_SUPER_MOLE_KEY = 'customSuperMole';
    localStorage.setItem(LS_SUPER_MOLE_KEY, superMoleUrl);
  }
  
  // Send to game window
  sendToGame({
    type: 'setSuperMole',
    superMoleUrl: superMoleUrl
  });
  
  showStatus('Super mole image applied!');
});

setBombBtn.addEventListener('click', async () => {
  if (!bombUrl) return;
  
  if (sharedStateReady && window.sharedState) {
    // Save to shared state
    await window.sharedState.set('bombUrl', bombUrl);
  } else {
    // Fallback to localStorage
    const LS_BOMB_KEY = 'customBomb';
    localStorage.setItem(LS_BOMB_KEY, bombUrl);
  }
  
  // Send to game window
  sendToGame({
    type: 'setBomb',
    bombUrl: bombUrl
  });
  
  showStatus('Bomb image applied!');
});

resetCursorBtn.addEventListener('click', async () => {
  // Clear local state for mole
  molePreview.style.display = 'none';
  moleInput.value = '';
  setMoleBtn.disabled = true;
  moleErrorMsg.textContent = '';
  moleUrl = null;

  // Clear local state for super mole
  superMolePreview.style.display = 'none';
  superMoleInput.value = '';
  setSuperMoleBtn.disabled = true;
  superMoleErrorMsg.textContent = '';
  superMoleUrl = null;

  // Clear local state for bomb
  bombPreview.style.display = 'none';
  bombInput.value = '';
  setBombBtn.disabled = true;
  bombErrorMsg.textContent = '';
  bombUrl = null;

  if (sharedStateReady && window.sharedState) {
    // Clear shared state
    await window.sharedState.clear();
    window.customSuperMoleUrl = null;
    window.customBombUrl = null;
    window.customMoleUrl = null;
  

  }
  // Fallback to localStorage
  const LS_MOLE_KEY = 'customMole';
  const LS_SUPER_MOLE_KEY = 'customSuperMole';
  const LS_BOMB_KEY = 'customBomb';
  const LS_SCORE_KEY = 'highestMoleScore';
  
  localStorage.removeItem(LS_MOLE_KEY);
  localStorage.removeItem(LS_SUPER_MOLE_KEY);
  localStorage.removeItem(LS_BOMB_KEY);
  localStorage.removeItem(LS_SCORE_KEY);
  
  highestScoreEl.textContent = '0';
  
  // Send to game window
  sendToGame({
    type: 'resetAll'
  });
  
  showStatus('All settings reset!');
});

// Listen for messages from game window
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'scoreUpdate') {
    updateScore(message.score);
    currentScoreEl.textContent = message.score;
  }
});

// Sound control event listeners
soundToggle.addEventListener('change', async () => {
  const enabled = soundToggle.checked;
  
  if (sharedStateReady && window.sharedState) {
    const settings = await window.sharedState.get('gameSettings') || {};
    const newSettings = { ...settings, soundEnabled: enabled };
    await window.sharedState.set('gameSettings', newSettings);
  } else {
    localStorage.setItem('soundEnabled', enabled.toString());
  }
  
  // Send to game window
  sendToGame({
    type: 'updateSoundSettings',
    soundEnabled: enabled
  });
  
  showStatus(enabled ? 'Sound enabled!' : 'Sound disabled!');
});

volumeSlider.addEventListener('input', async () => {
  const volume = volumeSlider.value / 100;
  volumeValue.textContent = `${volumeSlider.value}%`;
  
  if (sharedStateReady && window.sharedState) {
    const settings = await window.sharedState.get('gameSettings') || {};
    const newSettings = { ...settings, soundVolume: volume };
    await window.sharedState.set('gameSettings', newSettings);
  } else {
    localStorage.setItem('soundVolume', volume.toString());
  }
  
  // Send to game window
  sendToGame({
    type: 'updateSoundSettings',
    soundVolume: volume
  });
});

// Game control event listeners
autoCloseToggle.addEventListener('change', async () => {
  const enabled = autoCloseToggle.checked;
  
  if (sharedStateReady && window.sharedState) {
    const settings = await window.sharedState.get('gameSettings') || {};
    const newSettings = { ...settings, autoClose: enabled };
    await window.sharedState.set('gameSettings', newSettings);
  } else {
    localStorage.setItem('autoClose', enabled.toString());
  }
  
  // Send to background script
  chrome.runtime.sendMessage({
    type: 'updateGameSettings',
    autoClose: enabled
  });
  
  showStatus(enabled ? 'Auto-close enabled!' : 'Auto-close disabled!');
});

timeoutSlider.addEventListener('input', async () => {
  const timeout = parseFloat(timeoutSlider.value);
  timeoutValue.textContent = `${timeout}s`;
  
  if (sharedStateReady && window.sharedState) {
    const settings = await window.sharedState.get('gameSettings') || {};
    const newSettings = { ...settings, timeout: timeout };
    await window.sharedState.set('gameSettings', newSettings);
  } else {
    localStorage.setItem('timeout', timeout.toString());
  }
  
  // Send to background script
  chrome.runtime.sendMessage({
    type: 'updateGameSettings',
    timeout: timeout
  });
});

// Initialize shared state and load cache when popup opens
initSharedState(); 