// Sound Synthesizer using Web Audio API
class SoundFX {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playBubblePlace() {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playExplosion() {
    this.init();
    const now = this.ctx.currentTime;
    
    // 1. Low-frequency blast rumble (using a triangle oscillator sweep)
    const blastOsc = this.ctx.createOscillator();
    const blastGain = this.ctx.createGain();
    blastOsc.type = 'triangle';
    blastOsc.frequency.setValueAtTime(165, now);
    blastOsc.frequency.exponentialRampToValueAtTime(35, now + 0.4);
    blastGain.gain.setValueAtTime(0.45, now);
    blastGain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
    
    blastOsc.connect(blastGain);
    blastGain.connect(this.ctx.destination);
    blastOsc.start(now);
    blastOsc.stop(now + 0.5);

    // 2. High-frequency water splash spray (using noise and bandpass filters)
    const bufferSize = this.ctx.sampleRate * 0.65;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    
    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(800, now);
    noiseFilter.frequency.exponentialRampToValueAtTime(1600, now + 0.15);
    noiseFilter.frequency.linearRampToValueAtTime(280, now + 0.6);
    noiseFilter.Q.setValueAtTime(3.5, now);
    
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.38, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.005, now + 0.65);
    
    noiseSource.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    
    noiseSource.start(now);
    noiseSource.stop(now + 0.65);

    // 3. Wet bubble pop chirp (sine wave pitch sweep downwards)
    const popOsc = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(620, now);
    popOsc.frequency.exponentialRampToValueAtTime(85, now + 0.18);
    popGain.gain.setValueAtTime(0.28, now);
    popGain.gain.linearRampToValueAtTime(0.001, now + 0.2);
    
    popOsc.connect(popGain);
    popGain.connect(this.ctx.destination);
    popOsc.start(now);
    popOsc.stop(now + 0.2);
  }

  playTick(remainingTime) {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    // Pitch goes up as remaining time goes down
    const pitch = 650 + (2.5 - remainingTime) * 320; 
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch, now);
    
    gain.gain.setValueAtTime(0.045, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.05);
    
    osc.start();
    osc.stop(now + 0.06);
  }

  playItemCollect() {
    this.init();
    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.50];
    freqs.forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + i * 0.06);
      gain.gain.setValueAtTime(0.08, now + i * 0.06);
      gain.gain.linearRampToValueAtTime(0.001, now + i * 0.06 + 0.12);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.12);
    });
  }

  playBubbleTrap() {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.35);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.35);
  }

  playPopTrap() {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, this.ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playNeedle() {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playClick() {
    this.init();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playRescue() {
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.08); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.16); // G5
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.linearRampToValueAtTime(0.001, now + 0.3);
    osc.start();
    osc.stop(now + 0.3);
  }
}

const sfx = new SoundFX();

// Game configuration constants
const TILE_SIZE = 48;
const GRID_COLS = 15;
const GRID_ROWS = 13;
const GAME_WIDTH = GRID_COLS * TILE_SIZE;
const GAME_HEIGHT = GRID_ROWS * TILE_SIZE;

// Map configurations containing layout and visual themes
const MAPS_CONFIG = {
  sea14: {
    name: '海盜 14',
    badge: 'Patrit 14',
    layout: [
      [0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0],
      [0, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 0],
      [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2],
      [2, 1, 0, 1, 2, 1, 2, 0, 2, 1, 2, 1, 0, 1, 2],
      [2, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 2, 2],
      [2, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 2],
      [2, 2, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 2, 2],
      [2, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 2],
      [2, 2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 2, 0, 2, 2],
      [2, 1, 0, 1, 2, 1, 2, 0, 2, 1, 2, 1, 0, 1, 2],
      [2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2],
      [0, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 2, 1, 0],
      [0, 0, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 0, 0]
    ],
    wallColor: 0x4a5d6e,
    wallBorderColor: 0x7c94a8,
    wallInnerColor: 0x273542,
    crateColor: 0xbf7130,
    crateBorderColor: 0x824413,
    crateInnerColor: 0x542a0b,
    bgTileColorDark: 0x0a1c36,
    bgTileColorLight: 0x07152a,
    bgGridColor: 0x0d284f
  },
  village10: {
    name: '村莊 10',
    badge: 'Village 10',
    layout: [
      [0, 0, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 0, 0],
      [0, 1, 2, 1, 2, 1, 2, 2, 2, 1, 2, 1, 2, 1, 0],
      [2, 2, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 2, 2],
      [2, 1, 2, 1, 2, 1, 2, 2, 2, 1, 2, 1, 2, 1, 2],
      [2, 2, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 2, 2],
      [0, 0, 2, 0, 2, 0, 0, 0, 0, 0, 2, 0, 2, 0, 0],
      [2, 2, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 2, 2],
      [2, 2, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 2, 2],
      [2, 1, 2, 1, 2, 1, 2, 2, 2, 1, 2, 1, 2, 1, 2],
      [2, 2, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 2, 2],
      [0, 1, 2, 1, 2, 1, 2, 2, 2, 1, 2, 1, 2, 1, 0],
      [0, 0, 2, 2, 2, 2, 2, 0, 2, 2, 2, 2, 2, 0, 0]
    ],
    wallColor: 0xe05638,       // Red roof houses
    wallBorderColor: 0xf7a361, // Light orange wall
    wallInnerColor: 0xfce497,  // Yellow brick window/facade
    crateColor: 0xe6b450,       // Light yellow wood box
    crateBorderColor: 0xb58010, // Medium wood border
    crateInnerColor: 0x7a5405,  // Dark wood details
    bgTileColorDark: 0x337d43,  // Dark green grass
    bgTileColorLight: 0x3b8c4c, // Light green grass
    bgGridColor: 0x1f5c2e       // Deep grass divider lines
  }
};

// Character configs
const CHARACTER_CONFIGS = {
  dao: { name: '藍寶', maxBubbles: 1, maxLen: 2, speed: 2.5, color: 0x0066cc, faceColor: 0x5ebcff },
  bazzi: { name: '困寶', maxBubbles: 1, maxLen: 2, speed: 3.2, color: 0xcc0033, faceColor: 0xff7ea5 },
  marid: { name: '妮妮', maxBubbles: 2, maxLen: 2, speed: 2.0, color: 0xcca300, faceColor: 0xffe66d }
};

const CPU_START_POSITIONS = [
  { x: GAME_WIDTH - TILE_SIZE * 0.5 - 2, y: GAME_HEIGHT - TILE_SIZE * 0.5 - 2, dirX: 0, dirY: -1 }, // Bottom-Right
  { x: GAME_WIDTH - TILE_SIZE * 0.5 - 2, y: TILE_SIZE * 0.5 + 2, dirX: -1, dirY: 0 },              // Top-Right
  { x: TILE_SIZE * 0.5 + 2, y: GAME_HEIGHT - TILE_SIZE * 0.5 - 2, dirX: 1, dirY: 0 },               // Bottom-Left
  { x: TILE_SIZE * 7.5, y: TILE_SIZE * 6.5, dirX: 0, dirY: 1 },                                     // Center
  { x: TILE_SIZE * 7.5, y: TILE_SIZE * 2.5, dirX: -1, dirY: 0 },                                    // Top-Middle
  { x: TILE_SIZE * 7.5, y: TILE_SIZE * 10.5, dirX: 1, dirY: 0 }                                     // Bottom-Middle
];

// Items
const ITEM_TYPES = {
  BUBBLE_UP: 3,
  LENGTH_UP: 4,
  SPEED_UP: 5,
  NEEDLE: 6
};

class Game {
  constructor() {
    this.app = null;
    this.grid = [];
    this.player = null;
    this.cpus = [];
    this.cpuCount = 3;
    this.cpuTeams = ['blue', 'blue', 'blue', 'blue', 'blue']; // Default all CPUs to blue team
    this.bubbles = [];
    this.flames = [];
    this.items = [];
    this.keys = {};
    
    this.lobbyScreen = document.getElementById('lobby-screen');
    this.gameScreen = document.getElementById('game-screen');
    this.resultOverlay = document.getElementById('result-overlay');
    this.timerDisplay = document.getElementById('timer-display');
    
    this.selectedChar = 'dao';
    this.selectedMap = 'sea14';
    this.timeLeft = 180;
    this.timerInterval = null;
    this.gameActive = false;
    this.cratesDestroyedCount = 0;
    this.gameStartTime = 0;

    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));

    this.setupMobileControls();
    this.setupLobby();
  }

  setupLobby() {
    const cards = document.querySelectorAll('.char-card');
    cards.forEach(card => {
      card.addEventListener('click', () => {
        sfx.playClick();
        cards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.selectedChar = card.dataset.char;
        this.updateTeamSlotsUI();
      });
    });

    const mapCards = document.querySelectorAll('.map-card');
    mapCards.forEach(card => {
      card.addEventListener('click', () => {
        sfx.playClick();
        mapCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.selectedMap = card.dataset.map;
      });
    });

    const cpuBtns = document.querySelectorAll('.cpu-opt-btn');
    cpuBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        sfx.playClick();
        cpuBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.cpuCount = parseInt(btn.dataset.cpu, 10);
        this.updateTeamSlotsUI();
      });
    });

    document.getElementById('start-btn').addEventListener('click', () => {
      sfx.playClick();
      this.startGame();
    });

    document.getElementById('exit-btn').addEventListener('click', () => {
      sfx.playClick();
      this.endGame(null, 'abort');
    });

    document.getElementById('restart-btn').addEventListener('click', () => {
      sfx.playClick();
      this.restartGame();
    });

    document.getElementById('play-again-btn').addEventListener('click', () => {
      sfx.playClick();
      this.restartGame();
    });

    document.getElementById('result-exit-btn').addEventListener('click', () => {
      sfx.playClick();
      this.resultOverlay.classList.remove('active');
      this.lobbyScreen.classList.add('active');
      this.gameScreen.classList.remove('active');
    });

    this.updateTeamSlotsUI();
  }

  updateTeamSlotsUI() {
    const container = document.getElementById('team-slots');
    if (!container) return;
    container.innerHTML = '';

    // 1. Add Player Slot
    const playerCard = document.createElement('div');
    playerCard.className = 'team-slot-card';
    const playerCharName = CHARACTER_CONFIGS[this.selectedChar].name;
    playerCard.innerHTML = `
      <div class="slot-avatar ${this.selectedChar}-color"></div>
      <div class="slot-name">玩家 (${playerCharName})</div>
      <button class="team-toggle-btn team-red" disabled>紅隊</button>
    `;
    container.appendChild(playerCard);

    // 2. Add CPU Slots
    const availableCPUChars = Object.keys(CHARACTER_CONFIGS).filter(char => char !== this.selectedChar);
    for (let i = 0; i < this.cpuCount; i++) {
      const cpuChar = availableCPUChars[i % availableCPUChars.length];
      const cpuCharName = CHARACTER_CONFIGS[cpuChar].name;
      const team = this.cpuTeams[i] || 'blue';
      const teamLabel = team === 'red' ? '紅隊' : '藍隊';
      const teamClass = team === 'red' ? 'team-red' : 'team-blue';

      const cpuCard = document.createElement('div');
      cpuCard.className = 'team-slot-card';
      cpuCard.innerHTML = `
        <div class="slot-avatar ${cpuChar}-color"></div>
        <div class="slot-name">CPU ${i + 1} (${cpuCharName})</div>
        <button class="team-toggle-btn ${teamClass}" data-index="${i}">${teamLabel}</button>
      `;

      // Event listener for toggle button
      cpuCard.querySelector('.team-toggle-btn').addEventListener('click', (e) => {
        sfx.playClick();
        const idx = parseInt(e.target.dataset.index, 10);
        this.cpuTeams[idx] = this.cpuTeams[idx] === 'red' ? 'blue' : 'red';
        this.updateTeamSlotsUI();
      });

      container.appendChild(cpuCard);
    }
  }

  setupMobileControls() {
    const checkMobile = () => {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                       ('ontouchstart' in window) ||
                       (navigator.maxTouchPoints > 0) ||
                       (window.innerWidth <= 768);

      if (isMobile) {
        document.body.classList.add('is-mobile');
      } else {
        document.body.classList.remove('is-mobile');
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);

    const bindActionButton = (id, key) => {
      const btn = document.getElementById(id);
      if (!btn) return;

      const handleStart = (e) => {
        e.preventDefault();
        sfx.init();
        if (key === 'Space') {
          if (this.gameActive && this.player && this.player.state === 'normal') {
            this.placeBubble(this.player);
          }
        } else if (key === 'KeyN') {
          if (this.gameActive && this.player && this.player.state === 'trapped') {
            if (this.player.needles > 0) {
              this.player.needles--;
              this.player.state = 'normal';
              sfx.playNeedle();
              this.updateHUD();
            }
          }
        }
        btn.classList.add('active');
      };

      const handleEnd = (e) => {
        e.preventDefault();
        btn.classList.remove('active');
      };

      btn.addEventListener('touchstart', handleStart, { passive: false });
      btn.addEventListener('touchend', handleEnd, { passive: false });
      btn.addEventListener('touchcancel', handleEnd, { passive: false });

      btn.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
          handleStart(e);
        }
      });
      const mouseUpHandler = (e) => {
        handleEnd(e);
      };
      btn.addEventListener('mouseup', mouseUpHandler);
      btn.addEventListener('mouseleave', mouseUpHandler);
    };

    bindActionButton('btn-bomb', 'Space');
    bindActionButton('btn-needle', 'KeyN');

    const joystickWrapper = document.getElementById('joystick-wrapper');
    const joystickKnob = document.getElementById('joystick-knob');
    const toggleBtn = document.getElementById('control-mode-toggle');

    if (!joystickWrapper) return;

    this.mobileControlMode = localStorage.getItem('mobileControlMode') || 'joystick';

    const applyControlMode = () => {
      if (this.mobileControlMode === 'joystick') {
        joystickWrapper.classList.add('joystick-mode');
        joystickWrapper.classList.remove('dpad-mode');
        if (toggleBtn) {
          toggleBtn.querySelector('.toggle-icon').textContent = '🎮';
          toggleBtn.querySelector('.toggle-text').textContent = '搖桿模式';
        }
      } else {
        joystickWrapper.classList.remove('joystick-mode');
        joystickWrapper.classList.add('dpad-mode');
        if (toggleBtn) {
          toggleBtn.querySelector('.toggle-icon').textContent = '🎛️';
          toggleBtn.querySelector('.toggle-text').textContent = '按鍵模式';
        }
      }
      this.keys['ArrowUp'] = false;
      this.keys['ArrowDown'] = false;
      this.keys['ArrowLeft'] = false;
      this.keys['ArrowRight'] = false;
      if (joystickKnob) joystickKnob.style.transform = 'translate3d(0, 0, 0)';
      
      joystickWrapper.querySelectorAll('.joystick-arrow, .dpad-btn').forEach(el => {
        el.classList.remove('active');
      });
    };

    applyControlMode();

    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        sfx.init();
        this.mobileControlMode = this.mobileControlMode === 'joystick' ? 'dpad' : 'joystick';
        localStorage.setItem('mobileControlMode', this.mobileControlMode);
        applyControlMode();
        
        if ('vibrate' in navigator) {
          navigator.vibrate([15, 30, 15]);
        }
      });
    }

    let joystickActive = false;
    let joystickPointerId = null;
    let joystickCenter = { x: 0, y: 0 };
    let activeDirections = { up: false, down: false, left: false, right: false };

    const handlePointerDown = (e) => {
      if (joystickActive) return;
      
      joystickActive = true;
      joystickPointerId = e.pointerId;
      joystickWrapper.setPointerCapture(e.pointerId);
      
      const rect = joystickWrapper.getBoundingClientRect();
      joystickCenter = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2
      };

      sfx.init();
      handlePointerMove(e);
    };

    const handlePointerMove = (e) => {
      if (!joystickActive || e.pointerId !== joystickPointerId) return;

      const dx = e.clientX - joystickCenter.x;
      const dy = e.clientY - joystickCenter.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      const maxRadius = 45; 
      const deadzone = 12;
      
      let nx = 0;
      let ny = 0;
      
      if (distance > 0) {
        nx = dx / distance;
        ny = dy / distance;
      }

      if (this.mobileControlMode === 'joystick' && joystickKnob) {
        const knobX = Math.min(distance, maxRadius) * nx;
        const knobY = Math.min(distance, maxRadius) * ny;
        joystickKnob.style.transform = `translate3d(${knobX}px, ${knobY}px, 0)`;
      }

      const threshold = 0.38;
      
      const newUp = distance >= deadzone && ny < -threshold;
      const newDown = distance >= deadzone && ny > threshold;
      const newLeft = distance >= deadzone && nx < -threshold;
      const newRight = distance >= deadzone && nx > threshold;

      const dirChanged = (
        newUp !== activeDirections.up ||
        newDown !== activeDirections.down ||
        newLeft !== activeDirections.left ||
        newRight !== activeDirections.right
      );

      if (dirChanged) {
        activeDirections = { up: newUp, down: newDown, left: newLeft, right: newRight };
        
        this.keys['ArrowUp'] = newUp;
        this.keys['ArrowDown'] = newDown;
        this.keys['ArrowLeft'] = newLeft;
        this.keys['ArrowRight'] = newRight;

        if (this.mobileControlMode === 'joystick') {
          const arrowUp = joystickWrapper.querySelector('.joystick-arrow.up');
          const arrowDown = joystickWrapper.querySelector('.joystick-arrow.down');
          const arrowLeft = joystickWrapper.querySelector('.joystick-arrow.left');
          const arrowRight = joystickWrapper.querySelector('.joystick-arrow.right');

          if (arrowUp) arrowUp.classList.toggle('active', newUp);
          if (arrowDown) arrowDown.classList.toggle('active', newDown);
          if (arrowLeft) arrowLeft.classList.toggle('active', newLeft);
          if (arrowRight) arrowRight.classList.toggle('active', newRight);
        } else {
          const btnUp = joystickWrapper.querySelector('.dpad-btn.up');
          const btnDown = joystickWrapper.querySelector('.dpad-btn.down');
          const btnLeft = joystickWrapper.querySelector('.dpad-btn.left');
          const btnRight = joystickWrapper.querySelector('.dpad-btn.right');

          if (btnUp) btnUp.classList.toggle('active', newUp);
          if (btnDown) btnDown.classList.toggle('active', newDown);
          if (btnLeft) btnLeft.classList.toggle('active', newLeft);
          if (btnRight) btnRight.classList.toggle('active', newRight);
        }

        if ('vibrate' in navigator && (newUp || newDown || newLeft || newRight)) {
          navigator.vibrate(8);
        }
      }
    };

    const handlePointerUp = (e) => {
      if (!joystickActive || e.pointerId !== joystickPointerId) return;
      
      joystickActive = false;
      joystickPointerId = null;
      
      try {
        joystickWrapper.releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }

      this.keys['ArrowUp'] = false;
      this.keys['ArrowDown'] = false;
      this.keys['ArrowLeft'] = false;
      this.keys['ArrowRight'] = false;

      activeDirections = { up: false, down: false, left: false, right: false };

      if (joystickKnob) {
        joystickKnob.style.transform = 'translate3d(0, 0, 0)';
      }

      joystickWrapper.querySelectorAll('.joystick-arrow, .dpad-btn').forEach(el => {
        el.classList.remove('active');
      });

      if ('vibrate' in navigator) {
        navigator.vibrate(5);
      }
    };

    joystickWrapper.addEventListener('pointerdown', handlePointerDown);
    joystickWrapper.addEventListener('pointermove', handlePointerMove);
    joystickWrapper.addEventListener('pointerup', handlePointerUp);
    joystickWrapper.addEventListener('pointercancel', handlePointerUp);
  }

  restartGame() {
    this.startGame();
  }

  startGame() {
    this.lobbyScreen.classList.remove('active');
    this.gameScreen.classList.add('active');
    this.resultOverlay.classList.remove('active');

    const mapConf = MAPS_CONFIG[this.selectedMap];

    if (!this.app) {
      this.app = new PIXI.Application({
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        backgroundColor: mapConf.bgTileColorLight,
        antialias: true
      });
      document.getElementById('pixi-canvas-container').appendChild(this.app.view);
    } else {
      this.app.stage.removeChildren();
      if (this.app.renderer && this.app.renderer.background) {
        this.app.renderer.background.color = mapConf.bgTileColorLight;
      }
    }

    this.grid = JSON.parse(JSON.stringify(mapConf.layout));
    this.bubbles = [];
    this.flames = [];
    this.items = [];
    this.cratesDestroyedCount = 0;
    this.keys = {};

    this.backgroundContainer = new PIXI.Container();
    this.mapContainer = new PIXI.Container();
    this.flameContainer = new PIXI.Container();
    this.itemContainer = new PIXI.Container();
    this.bubbleContainer = new PIXI.Container();
    this.characterContainer = new PIXI.Container();

    this.app.stage.addChild(this.backgroundContainer);
    this.app.stage.addChild(this.mapContainer);
    this.app.stage.addChild(this.itemContainer);
    this.app.stage.addChild(this.bubbleContainer);
    this.app.stage.addChild(this.flameContainer);
    this.app.stage.addChild(this.characterContainer);

    this.drawBackground();
    this.drawMap();

    const config = CHARACTER_CONFIGS[this.selectedChar];
    this.player = {
      x: TILE_SIZE * 0.5 + 2,
      y: TILE_SIZE * 0.5 + 2,
      radius: TILE_SIZE * 0.38,
      speed: config.speed,
      maxBubbles: config.maxBubbles,
      bubbleLength: config.maxLen,
      needles: 1,
      color: config.color,
      faceColor: config.faceColor,
      isCPU: false,
      state: 'normal',
      trapTimer: 0,
      graphics: new PIXI.Graphics(),
      placedCount: 0,
      dirX: 0,
      dirY: 1,
      team: 'red' // Player is always Red Team
    };

    this.characterContainer.addChild(this.player.graphics);

    // Apply player HUD team styling
    const playerProfileEl = document.querySelector('.player-profile');
    if (playerProfileEl) {
      playerProfileEl.className = 'player-profile team-red';
      const nameEl = playerProfileEl.querySelector('.profile-name');
      if (nameEl) {
        nameEl.innerHTML = `<span style="color: #ff8080; font-weight: bold;">[紅隊]</span> ${CHARACTER_CONFIGS[this.selectedChar].name}`;
      }
    }

    this.cpus = [];
    const availableCPUChars = Object.keys(CHARACTER_CONFIGS).filter(char => char !== this.selectedChar);

    for (let i = 0; i < this.cpuCount; i++) {
      const cpuChar = availableCPUChars[i % availableCPUChars.length];
      const cpuConfig = CHARACTER_CONFIGS[cpuChar];
      const pos = CPU_START_POSITIONS[i];
      const cpu = {
        id: i + 1,
        charKey: cpuChar,
        x: pos.x,
        y: pos.y,
        radius: TILE_SIZE * 0.38,
        speed: cpuConfig.speed,
        maxBubbles: cpuConfig.maxBubbles + 1, // CPU gets a tiny buff for extra challenge
        bubbleLength: cpuConfig.maxLen,
        needles: 2, // Smart CPU starts with needles for self-defense
        color: cpuConfig.color,
        faceColor: cpuConfig.faceColor,
        isCPU: true,
        state: 'normal',
        trapTimer: 0,
        graphics: new PIXI.Graphics(),
        placedCount: 0,
        // Smart AI variables
        aiState: 'patrol',
        movePath: [],
        placeCooldown: 0.5,
        decisionTimer: 0,
        dirX: pos.dirX,
        dirY: pos.dirY,
        team: this.cpuTeams[i] || 'blue' // Get configured team
      };
      this.characterContainer.addChild(cpu.graphics);
      this.cpus.push(cpu);
    }

    const cpuHudContainer = document.getElementById('cpu-hud-container');
    cpuHudContainer.innerHTML = '';
    this.cpus.forEach(cpu => {
      const cpuProfile = document.createElement('div');
      cpuProfile.className = `player-profile cpu team-${cpu.team}`;
      cpuProfile.id = `cpu-profile-${cpu.id}`;
      
      const teamLabel = cpu.team === 'red' ? '<span style="color: #ff8080; font-weight: bold;">[紅隊]</span>' : '<span style="color: #809fff; font-weight: bold;">[藍隊]</span>';

      cpuProfile.innerHTML = `
        <div class="profile-details">
          <div class="profile-name">${teamLabel} ${CHARACTER_CONFIGS[cpu.charKey].name} (CPU ${cpu.id})</div>
          <div class="hud-item-stats">
            <span class="hud-stat" id="hud-c-bubble-${cpu.id}">🎈 0/${cpu.maxBubbles}</span>
            <span class="hud-stat" id="hud-c-len-${cpu.id}">📏 ${cpu.bubbleLength}</span>
            <span class="hud-stat" id="hud-c-speed-${cpu.id}">⚡ ${cpu.speed.toFixed(1)}</span>
          </div>
        </div>
        <div class="profile-avatar ${cpu.charKey}-color" id="cpu-hud-avatar-${cpu.id}"></div>
      `;
      cpuHudContainer.appendChild(cpuProfile);
    });

    this.updateHUD();

    this.timeLeft = 180;
    this.gameStartTime = Date.now();
    this.gameActive = true;

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (!this.gameActive) return;
      this.timeLeft--;
      this.updateTimerDisplay();
      if (this.timeLeft <= 0) {
        this.endGame('draw', 'time_out');
      }
    }, 1000);
    this.updateTimerDisplay();

    this.app.ticker.add(this.update, this);
  }

  updateTimerDisplay() {
    const min = Math.floor(this.timeLeft / 60).toString().padStart(2, '0');
    const sec = (this.timeLeft % 60).toString().padStart(2, '0');
    this.timerDisplay.textContent = `${min}:${sec}`;
  }

  updateHUD() {
    if (this.player) {
      document.getElementById('hud-p-bubble').textContent = `🎈 ${this.player.placedCount}/${this.player.maxBubbles}`;
      document.getElementById('hud-p-len').textContent = `📏 ${this.player.bubbleLength}`;
      document.getElementById('hud-p-speed').textContent = `⚡ ${this.player.speed.toFixed(1)}`;
      document.getElementById('hud-p-needle').textContent = `📍 ${this.player.needles}`;

      const pAvatar = document.getElementById('player-hud-avatar');
      pAvatar.className = 'profile-avatar';
      pAvatar.classList.add(this.selectedChar === 'dao' ? 'dao-color' : (this.selectedChar === 'bazzi' ? 'bazzi-color' : 'marid-color'));
    }

    if (this.cpus) {
      this.cpus.forEach(cpu => {
        const bubbleEl = document.getElementById(`hud-c-bubble-${cpu.id}`);
        const lenEl = document.getElementById(`hud-c-len-${cpu.id}`);
        const speedEl = document.getElementById(`hud-c-speed-${cpu.id}`);
        const profileEl = document.getElementById(`cpu-profile-${cpu.id}`);
        
        if (bubbleEl) bubbleEl.textContent = `🎈 ${cpu.placedCount}/${cpu.maxBubbles}`;
        if (lenEl) lenEl.textContent = `📏 ${cpu.bubbleLength}`;
        if (speedEl) speedEl.textContent = `⚡ ${cpu.speed.toFixed(1)}`;
        
        if (profileEl) {
          if (cpu.state === 'dead') {
            profileEl.classList.add('eliminated');
          } else {
            profileEl.classList.remove('eliminated');
          }
        }
      });
    }
  }

  drawBackground() {
    this.backgroundContainer.removeChildren();
    const bg = new PIXI.Graphics();
    const mapConf = MAPS_CONFIG[this.selectedMap];
    
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const isDark = (r + c) % 2 === 0;
        bg.beginFill(isDark ? mapConf.bgTileColorDark : mapConf.bgTileColorLight);
        bg.drawRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        bg.endFill();

        bg.lineStyle(1, mapConf.bgGridColor, 0.4);
        bg.drawRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        bg.lineStyle(0);
      }
    }
    this.backgroundContainer.addChild(bg);
  }

  drawMap() {
    this.mapContainer.removeChildren();
    const mainG = new PIXI.Graphics();
    const mapConf = MAPS_CONFIG[this.selectedMap];

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const cell = this.grid[r][c];
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;

        if (cell === 1) {
          mainG.beginFill(mapConf.wallColor);
          mainG.drawRoundedRect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6, 8);
          mainG.endFill();

          mainG.lineStyle(2, mapConf.wallBorderColor, 0.8);
          mainG.drawRoundedRect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6, 8);
          
          mainG.lineStyle(0);
          mainG.beginFill(mapConf.wallInnerColor);
          mainG.drawCircle(x + TILE_SIZE/2, y + TILE_SIZE/2, TILE_SIZE/4);
          mainG.endFill();
        } else if (cell === 2) {
          mainG.beginFill(mapConf.crateColor);
          mainG.drawRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
          mainG.endFill();

          mainG.lineStyle(3, mapConf.crateBorderColor, 0.9);
          mainG.moveTo(x + 4, y + 4);
          mainG.lineTo(x + TILE_SIZE - 4, y + TILE_SIZE - 4);
          mainG.moveTo(x + TILE_SIZE - 4, y + 4);
          mainG.lineTo(x + 4, y + TILE_SIZE - 4);

          mainG.lineStyle(2, mapConf.crateInnerColor, 1);
          mainG.drawRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
          mainG.lineStyle(0);
        }
      }
    }
    this.mapContainer.addChild(mainG);
  }

  handleKeyDown(e) {
    if (e.code === 'Space') {
      e.preventDefault();
    }
    
    this.keys[e.code] = true;

    if (e.code === 'KeyN' && this.player.state === 'trapped') {
      if (this.player.needles > 0) {
        this.player.needles--;
        this.player.state = 'normal';
        sfx.playNeedle();
        this.updateHUD();
      }
    }

    if (e.code === 'Space' && this.gameActive && this.player.state === 'normal') {
      this.placeBubble(this.player);
    }
  }

  handleKeyUp(e) {
    this.keys[e.code] = false;
  }

  placeBubble(character) {
    const col = Math.floor(character.x / TILE_SIZE);
    const row = Math.floor(character.y / TILE_SIZE);

    if (this.grid[row][col] === 1 || this.grid[row][col] === 2) return;
    
    const hasBubble = this.bubbles.some(b => b.col === col && b.row === row);
    if (hasBubble) return;

    if (character.placedCount >= character.maxBubbles) return;

    character.placedCount++;
    
    const allowed = [];
    const characters = [this.player, ...this.cpus];
    const bubbleLeft = col * TILE_SIZE;
    const bubbleRight = (col + 1) * TILE_SIZE;
    const bubbleTop = row * TILE_SIZE;
    const bubbleBottom = (row + 1) * TILE_SIZE;

    for (const char of characters) {
      if (char.state === 'dead') continue;
      const charLeft = char.x - char.radius * 0.8;
      const charRight = char.x + char.radius * 0.8;
      const charTop = char.y - char.radius * 0.8;
      const charBottom = char.y + char.radius * 0.8;

      const isOverlapping = charLeft < bubbleRight && charRight > bubbleLeft &&
                            charTop < bubbleBottom && charBottom > bubbleTop;
      if (isOverlapping) {
        allowed.push(char);
      }
    }

    if (!allowed.includes(character)) {
      allowed.push(character);
    }

    const bubble = {
      col,
      row,
      x: col * TILE_SIZE + TILE_SIZE / 2,
      y: row * TILE_SIZE + TILE_SIZE / 2,
      timer: 2.5,
      length: character.bubbleLength,
      owner: character,
      graphics: new PIXI.Graphics(),
      scalePhase: 0,
      allowedCharacters: allowed,
      nextTickTime: 2.0
    };

    this.bubbleContainer.addChild(bubble.graphics);
    this.bubbles.push(bubble);
    sfx.playBubblePlace();
    this.updateHUD();
  }

  checkTileCollision(rect, char) {
    const startCol = Math.floor(rect.x / TILE_SIZE);
    const endCol = Math.floor((rect.x + rect.width) / TILE_SIZE);
    const startRow = Math.floor(rect.y / TILE_SIZE);
    const endRow = Math.floor((rect.y + rect.height) / TILE_SIZE);

    for (let r = startRow; r <= endRow; r++) {
      for (let c = startCol; c <= endCol; c++) {
        if (r < 0 || r >= GRID_ROWS || c < 0 || c >= GRID_COLS) {
          return true;
        }
        
        if (this.grid[r][c] === 1 || this.grid[r][c] === 2) {
          return true;
        }

        const bubble = this.bubbles.find(b => b.col === c && b.row === r);
        if (bubble) {
          if (!bubble.allowedCharacters || !bubble.allowedCharacters.includes(char)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  moveCharacter(char, dx, dy) {
    if (char.state !== 'normal') return;

    const prevX = char.x;
    const prevY = char.y;

    if (dx !== 0) {
      char.dirX = Math.sign(dx);
      char.dirY = 0;
    } else if (dy !== 0) {
      char.dirX = 0;
      char.dirY = Math.sign(dy);
    }

    if (dx !== 0) {
      char.x += dx;
      const rectX = {
        x: char.x - char.radius * 0.8,
        y: char.y - char.radius * 0.8,
        width: char.radius * 1.6,
        height: char.radius * 1.6,
        originX: prevX,
        originY: prevY
      };
      if (this.checkTileCollision(rectX, char)) {
        const gridY = Math.floor(char.y / TILE_SIZE);
        const offset = char.y - (gridY * TILE_SIZE + TILE_SIZE / 2);
        if (Math.abs(offset) < TILE_SIZE * 0.45) {
          char.y -= Math.sign(offset) * Math.min(Math.abs(offset), char.speed * 0.8);
        }
        char.x = prevX;
      }
    }

    if (dy !== 0) {
      char.y += dy;
      const rectY = {
        x: char.x - char.radius * 0.8,
        y: char.y - char.radius * 0.8,
        width: char.radius * 1.6,
        height: char.radius * 1.6,
        originX: prevX,
        originY: prevY
      };
      if (this.checkTileCollision(rectY, char)) {
        const gridX = Math.floor(char.x / TILE_SIZE);
        const offset = char.x - (gridX * TILE_SIZE + TILE_SIZE / 2);
        if (Math.abs(offset) < TILE_SIZE * 0.45) {
          char.x -= Math.sign(offset) * Math.min(Math.abs(offset), char.speed * 0.8);
        }
        char.y = prevY;
      }
    }

    const col = Math.floor(char.x / TILE_SIZE);
    const row = Math.floor(char.y / TILE_SIZE);
    const itemIndex = this.items.findIndex(it => it.col === col && it.row === row);
    if (itemIndex !== -1) {
      const item = this.items[itemIndex];
      this.collectItem(char, item);
      this.itemContainer.removeChild(item.graphics);
      this.items.splice(itemIndex, 1);
    }
  }

  collectItem(char, item) {
    sfx.playItemCollect();
    if (item.type === ITEM_TYPES.BUBBLE_UP) {
      char.maxBubbles = Math.min(6, char.maxBubbles + 1);
    } else if (item.type === ITEM_TYPES.LENGTH_UP) {
      char.bubbleLength = Math.min(6, char.bubbleLength + 1);
    } else if (item.type === ITEM_TYPES.SPEED_UP) {
      char.speed = Math.min(5.0, char.speed + 0.3);
    } else if (item.type === ITEM_TYPES.NEEDLE) {
      if (!char.isCPU) {
        char.needles = Math.min(3, char.needles + 1);
      } else {
        char.needles = Math.min(3, char.needles + 1); // CPU can gather needles too
      }
    }
    this.updateHUD();
  }

  explodeBubble(bubble) {
    const { col, row, length } = bubble;
    bubble.owner.placedCount = Math.max(0, bubble.owner.placedCount - 1);
    this.updateHUD();

    this.addFlame(col, row);

    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (const [dx, dy] of dirs) {
      for (let i = 1; i <= length; i++) {
        const c = col + dx * i;
        const r = row + dy * i;

        if (c < 0 || c >= GRID_COLS || r < 0 || r >= GRID_ROWS) break;
        if (this.grid[r][c] === 1) break;

        if (this.grid[r][c] === 2) {
          this.destroyCrate(c, r);
          break;
        }

        const neighboringBubble = this.bubbles.find(b => b.col === c && b.row === r);
        if (neighboringBubble && neighboringBubble.timer > 0.05) {
          neighboringBubble.timer = 0.01;
        }

        this.addFlame(c, r);
      }
    }

    sfx.playExplosion();
  }

  destroyCrate(col, row) {
    this.grid[row][col] = 0;
    this.cratesDestroyedCount++;
    this.drawMap();

    if (Math.random() < 0.3) {
      const types = Object.values(ITEM_TYPES);
      let chosenType = types[Math.floor(Math.random() * (types.length - 1))];
      if (Math.random() < 0.1) {
        chosenType = ITEM_TYPES.NEEDLE;
      }

      const item = {
        col,
        row,
        type: chosenType,
        graphics: new PIXI.Graphics(),
        pulsePhase: 0
      };

      this.drawItem(item);
      this.itemContainer.addChild(item.graphics);
      this.items.push(item);
    }
  }

  drawItem(item) {
    const g = item.graphics;
    g.clear();
    const x = item.col * TILE_SIZE + TILE_SIZE / 2;
    const y = item.row * TILE_SIZE + TILE_SIZE / 2;
    const scale = 1 + 0.08 * Math.sin(item.pulsePhase);
    
    g.beginFill(0xffffff, 0.2);
    g.drawCircle(x, y, (TILE_SIZE * 0.35) * scale);
    g.endFill();

    g.lineStyle(1.5, 0xffffff, 0.6);
    g.drawCircle(x, y, (TILE_SIZE * 0.3) * scale);
    g.lineStyle(0);

    let color = 0x00d2ff;
    if (item.type === ITEM_TYPES.BUBBLE_UP) color = 0xff007f;
    if (item.type === ITEM_TYPES.LENGTH_UP) color = 0xffe66d;
    if (item.type === ITEM_TYPES.SPEED_UP) color = 0x00ffaa;
    if (item.type === ITEM_TYPES.NEEDLE) color = 0xffffff;

    g.beginFill(color);
    g.drawCircle(x, y - 2, 8 * scale);
    g.endFill();

    if (item.type === ITEM_TYPES.BUBBLE_UP) {
      g.beginFill(color);
      g.drawPolygon([x - 2, y + 6, x + 2, y + 6, x, y + 10]);
      g.endFill();
    } else if (item.type === ITEM_TYPES.SPEED_UP) {
      g.beginFill(0x000000);
      g.drawPolygon([x - 3, y - 2, x + 2, y - 5, x, y + 2, x + 3, y + 2, x - 2, y + 7, x - 1, y]);
      g.endFill();
    }
  }

  addFlame(col, row) {
    const flame = {
      col,
      row,
      x: col * TILE_SIZE,
      y: row * TILE_SIZE,
      timer: 0.5,
      graphics: new PIXI.Graphics()
    };
    this.flameContainer.addChild(flame.graphics);
    this.flames.push(flame);

    const itemIndex = this.items.findIndex(it => it.col === col && it.row === row);
    if (itemIndex !== -1) {
      this.itemContainer.removeChild(this.items[itemIndex].graphics);
      this.items.splice(itemIndex, 1);
    }
  }

  // Improved, robust BFS pathfinder for CPU AI
  findPath(startCol, startRow, targetCol, targetRow, dangerZones = []) {
    const isDangerous = (c, r) => dangerZones.some(z => z.col === c && z.row === r);
    const isSolid = (c, r) => {
      if (c < 0 || c >= GRID_COLS || r < 0 || r >= GRID_ROWS) return true;
      if (this.grid[r][c] === 1 || this.grid[r][c] === 2) return true;
      if (this.bubbles.some(b => b.col === c && b.row === r)) return true;
      return false;
    };

    const queue = [[startCol, startRow, []]];
    const visited = new Set();
    visited.add(`${startCol},${startRow}`);

    while (queue.length > 0) {
      const [c, r, path] = queue.shift();

      if (c === targetCol && r === targetRow) {
        return path;
      }

      const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      for (const [dx, dy] of dirs) {
        const nc = c + dx;
        const nr = r + dy;
        const key = `${nc},${nr}`;

        if (!visited.has(key) && !isSolid(nc, nr) && !isDangerous(nc, nr)) {
          visited.add(key);
          queue.push([nc, nr, [...path, { col: nc, row: nr }]]);
        }
      }
    }
    return null;
  }

  // BFS to closest safe tile that does not contain walls/bubbles
  findClosestSafeTile(startCol, startRow, dangerZones) {
    const isDangerous = (c, r) => dangerZones.some(z => z.col === c && z.row === r);
    const isSolid = (c, r) => {
      if (c < 0 || c >= GRID_COLS || r < 0 || r >= GRID_ROWS) return true;
      if (this.grid[r][c] === 1 || this.grid[r][c] === 2) return true;
      if (this.bubbles.some(b => b.col === c && b.row === r)) return true;
      return false;
    };

    const queue = [[startCol, startRow, []]];
    const visited = new Set();
    visited.add(`${startCol},${startRow}`);

    while (queue.length > 0) {
      const [c, r, path] = queue.shift();

      if (!isDangerous(c, r)) {
        return { tile: { col: c, row: r }, path };
      }

      const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      for (const [dx, dy] of dirs) {
        const nc = c + dx;
        const nr = r + dy;
        const key = `${nc},${nr}`;

        if (!visited.has(key) && !isSolid(nc, nr)) {
          visited.add(key);
          queue.push([nc, nr, [...path, { col: nc, row: nr }]]);
        }
      }
    }
    return null;
  }

  updateCPUAI(cpu, dt) {
    if (cpu.state !== 'normal') {
      // CPU rescue logic: If CPU is trapped, and has needles, use one after 0.6 seconds!
      if (cpu.state === 'trapped' && cpu.needles > 0 && cpu.trapTimer < 4.4) {
        cpu.needles--;
        cpu.state = 'normal';
        sfx.playNeedle();
        this.updateHUD();
      }
      return;
    }

    if (cpu.placeCooldown > 0) {
      cpu.placeCooldown -= dt;
    }

    // 1. Process path step-by-step movement (Runs every frame for smooth physics)
    if (cpu.movePath.length > 0) {
      const nextTile = cpu.movePath[0];
      const targetWorldX = nextTile.col * TILE_SIZE + TILE_SIZE / 2;
      const targetWorldY = nextTile.row * TILE_SIZE + TILE_SIZE / 2;

      const diffX = targetWorldX - cpu.x;
      const diffY = targetWorldY - cpu.y;

      if (Math.abs(diffX) < 5 && Math.abs(diffY) < 5) {
        cpu.x = targetWorldX;
        cpu.y = targetWorldY;
        cpu.movePath.shift();
      } else {
        const currentTileCol = Math.floor(cpu.x / TILE_SIZE);
        const currentTileRow = Math.floor(cpu.y / TILE_SIZE);
        let dx = 0;
        let dy = 0;

        if (nextTile.col !== currentTileCol) {
          // Move horizontally, align vertically first
          const currentTileCenterY = currentTileRow * TILE_SIZE + TILE_SIZE / 2;
          const alignDiffY = currentTileCenterY - cpu.y;
          if (Math.abs(alignDiffY) > 2) {
            dy = Math.sign(alignDiffY) * Math.min(Math.abs(alignDiffY), cpu.speed);
          } else {
            cpu.y = currentTileCenterY; // snap
            dx = Math.sign(diffX) * Math.min(Math.abs(diffX), cpu.speed);
          }
        } else if (nextTile.row !== currentTileRow) {
          // Move vertically, align horizontally first
          const currentTileCenterX = currentTileCol * TILE_SIZE + TILE_SIZE / 2;
          const alignDiffX = currentTileCenterX - cpu.x;
          if (Math.abs(alignDiffX) > 2) {
            dx = Math.sign(alignDiffX) * Math.min(Math.abs(alignDiffX), cpu.speed);
          } else {
            cpu.x = currentTileCenterX; // snap
            dy = Math.sign(diffY) * Math.min(Math.abs(diffY), cpu.speed);
          }
        } else {
          // Same tile, just slight adjustment
          if (Math.abs(diffX) > 2) dx = Math.sign(diffX) * Math.min(Math.abs(diffX), cpu.speed);
          if (Math.abs(diffY) > 2) dy = Math.sign(diffY) * Math.min(Math.abs(diffY), cpu.speed);
        }

        this.moveCharacter(cpu, dx, dy);
      }
    }

    // 2. Throttled Decision Cycle (Runs 5 times per second)
    cpu.decisionTimer -= dt;
    if (cpu.decisionTimer > 0) {
      return;
    }
    cpu.decisionTimer = 0.2; // Reset decision cooldown

    const cpuCol = Math.floor(cpu.x / TILE_SIZE);
    const cpuRow = Math.floor(cpu.y / TILE_SIZE);

    const dangerZones = this.getDangerousZones();
    const currentInDanger = dangerZones.some(z => z.col === cpuCol && z.row === cpuRow);
    const pathCompromised = !currentInDanger && cpu.movePath.some(tile => 
      dangerZones.some(z => z.col === tile.col && z.row === tile.row)
    );

    if (currentInDanger || pathCompromised) {
      // URGENT: Recalculate escape path if not currently escaping or target/path is compromised
      cpu.aiState = 'escape';
      const escape = this.findClosestSafeTile(cpuCol, cpuRow, dangerZones);
      if (escape && escape.path.length > 0) {
        cpu.movePath = escape.path;
      } else {
        cpu.movePath = []; // Nowhere to run, stay still or wait
      }
    } else {
      // We are safe
      if (cpu.aiState === 'escape') {
        if (cpu.movePath.length === 0) {
          cpu.aiState = 'patrol';
        }
      }

      if (cpu.aiState === 'patrol') {
        const teammates = [this.player, ...this.cpus].filter(c => c.team === cpu.team && c !== cpu);
        const enemies = [this.player, ...this.cpus].filter(c => c.team !== cpu.team && c.state !== 'dead');

        // 1. Check for trapped teammates to rescue
        const trappedTeammate = teammates.find(t => t.state === 'trapped');

        let targetCol = null;
        let targetRow = null;
        let isRescuing = false;

        if (trappedTeammate) {
          targetCol = Math.floor(trappedTeammate.x / TILE_SIZE);
          targetRow = Math.floor(trappedTeammate.y / TILE_SIZE);
          isRescuing = true;
        } else {
          // 2. Target the nearest active enemy
          let nearestEnemy = null;
          let minDistance = Infinity;

          for (const enemy of enemies) {
            const enemyCol = Math.floor(enemy.x / TILE_SIZE);
            const enemyRow = Math.floor(enemy.y / TILE_SIZE);
            const dist = Math.abs(cpuCol - enemyCol) + Math.abs(cpuRow - enemyRow);
            if (dist < minDistance) {
              minDistance = dist;
              nearestEnemy = enemy;
            }
          }

          if (nearestEnemy) {
            targetCol = Math.floor(nearestEnemy.x / TILE_SIZE);
            targetRow = Math.floor(nearestEnemy.y / TILE_SIZE);
          }
        }

        // Attack/Bubble Placement checks
        let triggerPlace = false;

        if (!isRescuing && targetCol !== null) {
          const distToTarget = Math.abs(cpuCol - targetCol) + Math.abs(cpuRow - targetRow);
          
          // Adjacent crate check (Runs 5 times/sec, so 0.15 is about 60% chance/sec)
          const neighbors = [[0, -1], [0, 1], [-1, 0], [1, 0]];
          for (const [dx, dy] of neighbors) {
            const nc = cpuCol + dx;
            const nr = cpuRow + dy;
            if (nc >= 0 && nc < GRID_COLS && nr >= 0 && nr < GRID_ROWS) {
              if (this.grid[nr][nc] === 2 && Math.random() < 0.15) {
                // Ensure no teammates are nearby
                const teammateNearby = teammates.some(t => {
                  const tc = Math.floor(t.x / TILE_SIZE);
                  const tr = Math.floor(t.y / TILE_SIZE);
                  return Math.abs(cpuCol - tc) + Math.abs(cpuRow - tr) <= 2;
                });
                if (!teammateNearby) {
                  triggerPlace = true;
                }
              }
            }
          }

          // Close to enemy check (Runs 5 times/sec, so 0.25 probability)
          if (distToTarget <= 3 && Math.random() < 0.25) {
            triggerPlace = true;
          }
        }

        // Run validation: If we place a bubble on cpuCol, cpuRow, can we escape safely?
        if (triggerPlace && cpu.placedCount < cpu.maxBubbles && cpu.placeCooldown <= 0) {
          const hypotheticalDanger = this.getDangerousZonesForBomb(cpuCol, cpuRow, cpu.bubbleLength);
          const tempBubbles = [...dangerZones, ...hypotheticalDanger];
          const escapeTest = this.findClosestSafeTile(cpuCol, cpuRow, tempBubbles);
          if (escapeTest && escapeTest.path.length > 0) {
            this.placeBubble(cpu);
            cpu.placeCooldown = 2.0; // Prevent spamming
            cpu.aiState = 'escape';
            cpu.movePath = escapeTest.path;
          }
        }

        // If patrolling and path completed, find next target
        if (cpu.movePath.length === 0) {
          if (targetCol === null) {
            // Fallback to player
            targetCol = Math.floor(this.player.x / TILE_SIZE);
            targetRow = Math.floor(this.player.y / TILE_SIZE);
          }

          // Occasionally go for items instead of enemies
          if (!isRescuing && this.items.length > 0 && Math.random() < 0.5) {
            const nearestItem = this.items.reduce((prev, curr) => {
              const d1 = Math.abs(cpuCol - prev.col) + Math.abs(cpuRow - prev.row);
              const d2 = Math.abs(cpuCol - curr.col) + Math.abs(cpuRow - curr.row);
              return d1 < d2 ? prev : curr;
            });
            targetCol = nearestItem.col;
            targetRow = nearestItem.row;
          }

          const path = this.findPath(cpuCol, cpuRow, targetCol, targetRow, dangerZones);
          if (path && path.length > 0) {
            cpu.movePath = path;
          } else {
            // Backup wandering
            const backupPaths = this.getWanderingDirections(cpuCol, cpuRow, dangerZones);
            if (backupPaths.length > 0) {
              cpu.movePath = [backupPaths[Math.floor(Math.random() * backupPaths.length)]];
            } else {
              cpu.movePath = []; // Stay safe/still if no safe neighboring directions
            }
          }
        }
      }
    }
  }

  getWanderingDirections(col, row, dangerZones = []) {
    const paths = [];
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (const [dx, dy] of dirs) {
      const c = col + dx;
      const r = row + dy;
      if (c >= 0 && c < GRID_COLS && r >= 0 && r < GRID_ROWS) {
        if (this.grid[r][c] === 0) {
          const hasBubble = this.bubbles.some(b => b.col === c && b.row === r);
          const isDangerous = dangerZones.some(z => z.col === c && z.row === r);
          if (!hasBubble && !isDangerous) {
            paths.push({ col: c, row: r });
          }
        }
      }
    }
    return paths;
  }

  getDangerousZonesForBomb(col, row, length) {
    const zones = [{ col, row }];
    const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
    for (const [dx, dy] of dirs) {
      for (let i = 1; i <= length; i++) {
        const c = col + dx * i;
        const r = row + dy * i;
        if (c < 0 || c >= GRID_COLS || r < 0 || r >= GRID_ROWS) break;
        if (this.grid[r][c] === 1) break;
        zones.push({ col: c, row: r });
        if (this.grid[r][c] === 2) break;
      }
    }
    return zones;
  }

  getDangerousZones() {
    const zones = [];
    
    // Flame cells are dangerous
    for (const f of this.flames) {
      zones.push({ col: f.col, row: f.row });
    }

    // Active bubbles and their flame reach are dangerous
    for (const b of this.bubbles) {
      zones.push({ col: b.col, row: b.row });
      const dirs = [[0, -1], [0, 1], [-1, 0], [1, 0]];
      for (const [dx, dy] of dirs) {
        for (let i = 1; i <= b.length; i++) {
          const c = b.col + dx * i;
          const r = b.row + dy * i;
          if (c < 0 || c >= GRID_COLS || r < 0 || r >= GRID_ROWS) break;
          if (this.grid[r][c] === 1) break;
          zones.push({ col: c, row: r });
          if (this.grid[r][c] === 2) break;
        }
      }
    }

    return zones;
  }

  update(delta) {
    if (!this.gameActive) return;

    const dt = delta / 60;

    // Clear bubble overlap allowance once characters walk off the bubble
    for (const b of this.bubbles) {
      if (b.allowedCharacters && b.allowedCharacters.length > 0) {
        for (let j = b.allowedCharacters.length - 1; j >= 0; j--) {
          const char = b.allowedCharacters[j];
          const charLeft = char.x - char.radius * 0.8;
          const charRight = char.x + char.radius * 0.8;
          const charTop = char.y - char.radius * 0.8;
          const charBottom = char.y + char.radius * 0.8;

          const bubbleLeft = b.col * TILE_SIZE;
          const bubbleRight = (b.col + 1) * TILE_SIZE;
          const bubbleTop = b.row * TILE_SIZE;
          const bubbleBottom = (b.row + 1) * TILE_SIZE;

          const isOverlapping = charLeft < bubbleRight && charRight > bubbleLeft &&
                                charTop < bubbleBottom && charBottom > bubbleTop;

          if (!isOverlapping) {
            b.allowedCharacters.splice(j, 1);
          }
        }
      }
    }

    let playerDx = 0;
    let playerDy = 0;
    
    if (this.keys['KeyW'] || this.keys['ArrowUp']) playerDy = -this.player.speed;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) playerDy = this.player.speed;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) playerDx = -this.player.speed;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) playerDx = this.player.speed;

    if (playerDx !== 0 && playerDy !== 0) {
      playerDx *= 0.7071;
      playerDy *= 0.7071;
    }

    this.moveCharacter(this.player, playerDx, playerDy);

    if (this.cpus) {
      for (const cpu of this.cpus) {
        this.updateCPUAI(cpu, dt);
      }
    }

    this.updateCharacterStates(this.player, dt);
    if (this.cpus) {
      for (const cpu of this.cpus) {
        this.updateCharacterStates(cpu, dt);
      }
    }

    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      b.timer -= dt;
      b.scalePhase += dt * 8;

      // Play ticking warning sound that speeds up as explosion approaches
      if (b.nextTickTime !== undefined && b.timer <= b.nextTickTime) {
        sfx.playTick(b.nextTickTime);
        if (b.nextTickTime > 1.0) {
          b.nextTickTime -= 0.5;
        } else if (b.nextTickTime > 0.4) {
          b.nextTickTime -= 0.3;
        } else {
          b.nextTickTime -= 0.15;
        }
      }

      if (b.timer <= 0) {
        this.explodeBubble(b);
        this.bubbleContainer.removeChild(b.graphics);
        this.bubbles.splice(i, 1);
      } else {
        this.drawBubble(b);
      }
    }

    for (let i = this.flames.length - 1; i >= 0; i--) {
      const f = this.flames[i];
      f.timer -= dt;

      if (f.timer <= 0) {
        this.flameContainer.removeChild(f.graphics);
        this.flames.splice(i, 1);
      } else {
        this.drawFlame(f);
        this.checkFlameCollision(f);
      }
    }

    for (const it of this.items) {
      it.pulsePhase += dt * 6;
      this.drawItem(it);
    }

    this.drawCharacter(this.player);
    if (this.cpus) {
      for (const cpu of this.cpus) {
        this.drawCharacter(cpu);
      }
    }

    this.checkGameResolutions();
  }

  updateCharacterStates(char, dt) {
    if (char.state === 'trapped') {
      char.trapTimer -= dt;
      if (char.trapTimer <= 0) {
        char.state = 'dead';
        sfx.playPopTrap();
      }
    }
  }

  drawBubble(b) {
    const g = b.graphics;
    g.clear();

    const radius = TILE_SIZE * 0.42 + 2 * Math.sin(b.scalePhase);
    
    g.beginFill(0x00d2ff, 0.7);
    g.drawCircle(b.x, b.y, radius);
    g.endFill();

    g.beginFill(0xffffff, 0.5);
    g.drawCircle(b.x - radius * 0.3, b.y - radius * 0.3, radius * 0.25);
    g.endFill();

    g.lineStyle(2, 0xffffff, 0.8);
    g.drawCircle(b.x, b.y, radius);
    g.lineStyle(0);
  }

  drawFlame(f) {
    const g = f.graphics;
    g.clear();

    const margin = 2;
    const center = TILE_SIZE / 2;
    const alpha = Math.min(1.0, f.timer / 0.4);
    const offset = 4 * Math.sin(f.timer * 30);

    g.beginFill(0x00ffff, alpha * 0.85);
    g.drawCircle(f.x + center, f.y + center, (TILE_SIZE / 2 - margin) + offset);
    g.endFill();

    g.beginFill(0xffffff, alpha * 0.9);
    g.drawCircle(f.x + center, f.y + center, (TILE_SIZE / 3 - margin) + offset);
    g.endFill();
  }

  checkFlameCollision(flame) {
    const characters = [this.player, ...this.cpus];
    for (const char of characters) {
      if (char.state === 'dead') continue;

      const charCol = Math.floor(char.x / TILE_SIZE);
      const charRow = Math.floor(char.y / TILE_SIZE);

      if (charCol === flame.col && charRow === flame.row) {
        if (char.state === 'normal') {
          char.state = 'trapped';
          char.trapTimer = 5.0;
          sfx.playBubbleTrap();
        } else if (char.state === 'trapped') {
          char.state = 'dead';
          sfx.playPopTrap();
        }
      }
    }
  }

  drawCharacter(char) {
    const g = char.graphics;
    g.clear();

    if (char.state === 'dead') return;

    if (char.state === 'trapped') {
      const pulse = 1.05 + 0.05 * Math.sin(Date.now() * 0.01);
      g.beginFill(0x00d2ff, 0.4);
      g.drawCircle(char.x, char.y - 12, char.radius * 1.3 * pulse);
      g.endFill();

      g.lineStyle(2, 0xffffff, 0.7);
      g.drawCircle(char.x, char.y - 12, char.radius * 1.3 * pulse);
      g.lineStyle(0);

      g.beginFill(char.color);
      g.drawCircle(char.x, char.y - 12, char.radius * 0.8);
      g.endFill();

      g.lineStyle(1.5, 0xffffff, 0.9);
      g.moveTo(char.x - 4, char.y - 15);
      g.lineTo(char.x - 1, char.y - 12);
      g.moveTo(char.x - 1, char.y - 15);
      g.lineTo(char.x - 4, char.y - 12);

      g.moveTo(char.x + 1, char.y - 15);
      g.lineTo(char.x + 4, char.y - 12);
      g.moveTo(char.x + 4, char.y - 15);
      g.lineTo(char.x + 1, char.y - 12);
      g.lineStyle(0);

      // Draw Team Indicator Above Trapped Bubble
      const teamColor = char.team === 'red' ? 0xff4d4d : 0x4d4dff;
      g.beginFill(teamColor);
      g.moveTo(char.x - 6, char.y - char.radius * 1.3 - 22);
      g.lineTo(char.x + 6, char.y - char.radius * 1.3 - 22);
      g.lineTo(char.x, char.y - char.radius * 1.3 - 16);
      g.endFill();

      return;
    }

    g.beginFill(0x000000, 0.25);
    g.drawEllipse(char.x, char.y + char.radius - 2, char.radius * 0.9, 6);
    g.endFill();

    g.beginFill(char.color);
    g.drawCircle(char.x, char.y, char.radius);
    g.endFill();

    g.beginFill(char.faceColor);
    g.drawRoundedRect(char.x - char.radius * 0.65, char.y - char.radius * 0.2, char.radius * 1.3, char.radius * 0.8, 6);
    g.endFill();

    g.beginFill(0x111111);
    const eyeOffset = char.dirX * 4;
    g.drawCircle(char.x - 5 + eyeOffset, char.y + char.radius * 0.2, 3.5);
    g.drawCircle(char.x + 5 + eyeOffset, char.y + char.radius * 0.2, 3.5);
    g.endFill();

    g.beginFill(0xffffff, 0.35);
    g.drawCircle(char.x - char.radius * 0.4, char.y - char.radius * 0.4, char.radius * 0.25);
    g.endFill();

    // Draw Team Indicator Above Head
    const teamColor = char.team === 'red' ? 0xff4d4d : 0x4d4dff;
    g.beginFill(teamColor);
    g.moveTo(char.x - 6, char.y - char.radius - 12);
    g.lineTo(char.x + 6, char.y - char.radius - 12);
    g.lineTo(char.x, char.y - char.radius - 6);
    g.endFill();
  }

  showFloatingText(x, y, textStr, colorHex) {
    try {
      const style = new PIXI.TextStyle({
        fontFamily: 'Outfit',
        fontSize: 16,
        fontWeight: 'bold',
        fill: colorHex,
        stroke: '#000000',
        strokeThickness: 3
      });
      const text = new PIXI.Text(textStr, style);
      text.anchor.set(0.5);
      text.x = x;
      text.y = y;
      this.characterContainer.addChild(text);

      let frames = 45;
      const anim = () => {
        text.y -= 0.8;
        text.alpha = frames / 45;
        frames--;
        if (frames <= 0) {
          this.characterContainer.removeChild(text);
          this.app.ticker.remove(anim);
          text.destroy();
        }
      };
      this.app.ticker.add(anim);
    } catch (e) {
      console.error(e);
    }
  }

  checkGameResolutions() {
    const chars = [this.player, ...this.cpus];

    // 1. Resolve character-to-character collision for Trapped states (Rescue / Kill)
    for (let i = 0; i < chars.length; i++) {
      const charA = chars[i];
      if (charA.state !== 'normal') continue;

      for (let j = 0; j < chars.length; j++) {
        if (i === j) continue;
        const charB = chars[j];
        if (charB.state !== 'trapped') continue;

        const dist = Math.hypot(charA.x - charB.x, charA.y - charB.y);
        if (dist < (charA.radius + charB.radius)) {
          if (charA.team === charB.team) {
            // Teammate rescue!
            charB.state = 'normal';
            charB.trapTimer = 0;
            sfx.playRescue();
            this.showFloatingText(charB.x, charB.y - 20, "RESCUE!", 0x80ff80);
            this.updateHUD();
          } else {
            // Enemy kill!
            charB.state = 'dead';
            sfx.playPopTrap();
            this.showFloatingText(charB.x, charB.y - 20, "OUT!", 0xff8080);
            this.updateHUD();
          }
        }
      }
    }

    // 2. Check winning/losing condition based on team survival
    const redTeamAlive = chars.some(c => c.team === 'red' && c.state !== 'dead');
    const blueTeamAlive = chars.some(c => c.team === 'blue' && c.state !== 'dead');

    if (!redTeamAlive && !blueTeamAlive) {
      this.endGame('draw', 'both_teams_dead');
    } else if (!redTeamAlive) {
      this.endGame('lose', 'red_team_dead');
    } else if (!blueTeamAlive) {
      this.endGame('win', 'blue_team_dead');
    }
  }

  endGame(outcome, reason) {
    if (!this.gameActive && reason !== 'abort') return;
    this.gameActive = false;

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.app) {
      this.app.ticker.remove(this.update, this);
    }

    if (reason === 'abort') {
      this.gameScreen.classList.remove('active');
      this.lobbyScreen.classList.add('active');
      return;
    }

    const title = document.getElementById('result-title');
    const msg = document.getElementById('result-message');
    const resTime = document.getElementById('res-time');
    const resCrates = document.getElementById('res-crates');

    const duration = Math.floor((Date.now() - this.gameStartTime) / 1000);
    const min = Math.floor(duration / 60).toString().padStart(2, '0');
    const sec = (duration % 60).toString().padStart(2, '0');
    resTime.textContent = `${min}:${sec}`;
    resCrates.textContent = `${this.cratesDestroyedCount} 個`;

    if (outcome === 'win') {
      title.textContent = '紅隊獲勝!';
      title.style.color = 'var(--accent-blue)';
      msg.textContent = '恭喜你！紅隊成功消滅了藍隊所有成員，獲得了最終的勝利！';
    } else if (outcome === 'lose') {
      title.textContent = '藍隊獲勝';
      title.style.color = 'var(--accent-pink)';
      msg.textContent = '太可惜了！藍隊成功擊敗了紅隊，下次再努力配合隊友贏回來吧！';
    } else {
      title.textContent = '平局';
      title.style.color = 'var(--text-light)';
      msg.textContent = '雙方全軍覆沒，平分秋色！';
    }

    this.resultOverlay.classList.add('active');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
