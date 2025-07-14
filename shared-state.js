// Shared State Manager for Whack-a-Mole Extension
// This file provides a centralized way to manage state across popup, game, and scripts

class SharedState {
  constructor() {
    this.listeners = new Map();
    this.cache = new Map();
  }

  // Initialize state with default values
  async init() {
    const defaults = {
      moleUrl: null,
      superMoleUrl: null,
      bombUrl: null,
      highestScore: 0,
      currentScore: 0,
      gameSettings: {
        difficulty: 'normal',
        soundEnabled: true,
        soundVolume: 0.7,
        autoClose: true,
        timeout: 2.0,
        autoStart: false
      }
    };

    // Load existing data or use defaults
    const result = await chrome.storage.local.get(defaults);
    Object.entries(result).forEach(([key, value]) => {
      this.cache.set(key, value);
    });

    return result;
  }

  // Get a value from shared state
  async get(key) {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    const result = await chrome.storage.local.get(key);
    const value = result[key];
    this.cache.set(key, value);
    return value;
  }

  // Set a value in shared state
  async set(key, value) {
    this.cache.set(key, value);
    await chrome.storage.local.set({ [key]: value });
    
    // Notify listeners
    this.notifyListeners(key, value);
  }

  // Update multiple values at once
  async update(updates) {
    Object.entries(updates).forEach(([key, value]) => {
      this.cache.set(key, value);
    });
    
    await chrome.storage.local.set(updates);
    
    // Notify listeners for each updated key
    Object.entries(updates).forEach(([key, value]) => {
      this.notifyListeners(key, value);
    });
  }

  // Listen for state changes
  on(key, callback) {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    this.listeners.get(key).add(callback);
  }

  // Remove listener
  off(key, callback) {
    if (this.listeners.has(key)) {
      this.listeners.get(key).delete(callback);
    }
  }

  // Notify all listeners for a key
  notifyListeners(key, value) {
    if (this.listeners.has(key)) {
      this.listeners.get(key).forEach(callback => {
        try {
          callback(value);
        } catch (error) {
          console.error('Error in state listener:', error);
        }
      });
    }
  }

  // Clear all data
  async clear() {
    this.cache.clear();
    this.listeners.clear();
    await chrome.storage.local.clear();
  }

  // Get all current state
  async getAll() {
    const result = await chrome.storage.local.get(null);
    Object.entries(result).forEach(([key, value]) => {
      this.cache.set(key, value);
    });
    return result;
  }
}

// Create global instance
window.sharedState = new SharedState();

// Initialize when loaded
if (typeof window !== 'undefined') {
  window.sharedState.init().catch(console.error);
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SharedState;
} 