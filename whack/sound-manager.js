// Sound Manager for Whack-a-Mole Game
// Handles different hammer hit sounds for different mole types

class SoundManager {
  constructor() {
    this.sounds = new Map();
    this.enabled = true;
    this.volume = 0.7;
    this.init();
  }

  async init() {
    // Initialize sound effects
    await this.loadSounds();
    
    // Load sound settings from shared state or localStorage
    if (window.sharedState) {
      try {
        const settings = await window.sharedState.get('gameSettings');
        if (settings) {
          this.enabled = settings.soundEnabled !== false;
          this.volume = settings.soundVolume || 0.7;
        }
      } catch (error) {
        console.warn('Could not load sound settings from shared state:', error);
      }
    } else {
      // Fallback to localStorage
      const soundEnabled = localStorage.getItem('soundEnabled');
      if (soundEnabled !== null) {
        this.enabled = soundEnabled === 'true';
      }
      const soundVolume = localStorage.getItem('soundVolume');
      if (soundVolume !== null) {
        this.volume = parseFloat(soundVolume);
      }
    }
  }

  async loadSounds() {
    try {
      // Create audio contexts for different mole types
      const normalHit = new Audio(chrome.runtime.getURL('whack/sounds/normal-hit.mp3'));
      const superHit = new Audio(chrome.runtime.getURL('whack/sounds/super-hit.mp3'));
      const bombHit = new Audio(chrome.runtime.getURL('whack/sounds/bomb-hit.mp3'));
      
      // Set volume and preload
      [normalHit, superHit, bombHit].forEach(audio => {
        audio.volume = this.volume;
        audio.preload = 'auto';
      });

      this.sounds.set('normal', normalHit);
      this.sounds.set('super', superHit);
      this.sounds.set('bomb', bombHit);

      console.log('Sounds loaded successfully');
    } catch (error) {
      console.warn('Could not load sound files, using fallback sounds:', error);
      this.createFallbackSounds();
    }
  }

  createFallbackSounds() {
    // Create simple beep sounds as fallback
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    const createBeep = (frequency, duration, type = 'sine') => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, audioContext.currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
      
      return { oscillator, gainNode, duration };
    };

    // Create different beep sounds for different mole types
    const normalBeep = createBeep(800, 0.1); // Higher pitch for normal mole
    const superBeep = createBeep(600, 0.15, 'square'); // Lower pitch, square wave for super mole
    const bombBeep = createBeep(400, 0.2, 'sawtooth'); // Even lower pitch, sawtooth for bomb

    this.sounds.set('normal', normalBeep);
    this.sounds.set('super', superBeep);
    this.sounds.set('bomb', bombBeep);
  }

  playHitSound(moleType) {
    if (!this.enabled) return;

    try {
      const sound = this.sounds.get(moleType);
      if (!sound) {
        console.warn(`No sound found for mole type: ${moleType}`);
        return;
      }

      if (sound instanceof Audio) {
        // Reset audio to beginning and play
        sound.currentTime = 0;
        sound.volume = this.volume;
        sound.play().catch(error => {
          console.warn('Could not play audio:', error);
        });
      } else {
        // Fallback beep sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(sound.oscillator.frequency.value, audioContext.currentTime);
        oscillator.type = sound.oscillator.type;
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.3, audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + sound.duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + sound.duration);
      }
    } catch (error) {
      console.warn('Error playing sound:', error);
    }
  }

  setEnabled(enabled) {
    this.enabled = enabled;
    
    // Save to shared state or localStorage
    if (window.sharedState) {
      window.sharedState.get('gameSettings').then(settings => {
        const newSettings = { ...settings, soundEnabled: enabled };
        window.sharedState.set('gameSettings', newSettings);
      });
    } else {
      localStorage.setItem('soundEnabled', enabled.toString());
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    
    // Update volume for all loaded audio files
    this.sounds.forEach(sound => {
      if (sound instanceof Audio) {
        sound.volume = this.volume;
      }
    });
    
    // Save to shared state or localStorage
    if (window.sharedState) {
      window.sharedState.get('gameSettings').then(settings => {
        const newSettings = { ...settings, soundVolume: this.volume };
        window.sharedState.set('gameSettings', newSettings);
      });
    } else {
      localStorage.setItem('soundVolume', this.volume.toString());
    }
  }

  toggle() {
    this.setEnabled(!this.enabled);
  }

  getEnabled() {
    return this.enabled;
  }

  getVolume() {
    return this.volume;
  }
}

// Create global sound manager instance
window.soundManager = new SoundManager(); 