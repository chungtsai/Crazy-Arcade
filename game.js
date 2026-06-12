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
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 400;

    const gain = this.ctx.createGain();
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

    noise.start();
    noise.stop(this.ctx.currentTime + 0.4);

    const bass = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    bass.connect(bassGain);
    bassGain.connect(this.ctx.destination);
    bass.type = 'triangle';
    bass.frequency.setValueAtTime(120, this.ctx.currentTime);
    bass.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.25);
    bassGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    bassGain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
    bass.start();
    bass.stop(this.ctx.currentTime + 0.25);
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
}

const sfx = new SoundFX();

// Game configuration constants
const TILE_SIZE = 48;
const GRID_COLS = 15;
const GRID_ROWS = 13;
const GAME_WIDTH = GRID_COLS * TILE_SIZE;
const GAME_HEIGHT = GRID_ROWS * TILE_SIZE;

// Original Sea 14 Map layout (15x13)
const MAP_LAYOUT = [
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
];

// Character configs
const CHARACTER_CONFIGS = {
  dao: { name: '藍寶', maxBubbles: 1, maxLen: 2, speed: 2.5, color: 0x0066cc, faceColor: 0x5ebcff },
  bazzi: { name: '困寶', maxBubbles: 1, maxLen: 2, speed: 3.2, color: 0xcc0033, faceColor: 0xff7ea5 },
  marid: { name: '妮妮', maxBubbles: 2, maxLen: 2, speed: 2.0, color: 0xcca300, faceColor: 0xffe66d }
};

const CPU_START_POSITIONS = [
  { x: GAME_WIDTH - TILE_SIZE * 0.5 - 2, y: GAME_HEIGHT - TILE_SIZE * 0.5 - 2, dirX: 0, dirY: -1 }, // Bottom-Right
  { x: GAME_WIDTH - TILE_SIZE * 0.5 - 2, y: TILE_SIZE * 0.5 + 2, dirX: -1, dirY: 0 },              // Top-Right
  { x: TILE_SIZE * 0.5 + 2, y: GAME_HEIGHT - TILE_SIZE * 0.5 - 2, dirX: 1, dirY: 0 }               // Bottom-Left
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
    this.cpuCount = 1;
    this.bubbles = [];
    this.flames = [];
    this.items = [];
    this.keys = {};
    
    this.lobbyScreen = document.getElementById('lobby-screen');
    this.gameScreen = document.getElementById('game-screen');
    this.resultOverlay = document.getElementById('result-overlay');
    this.timerDisplay = document.getElementById('timer-display');
    
    this.selectedChar = 'dao';
    this.timeLeft = 180;
    this.timerInterval = null;
    this.gameActive = false;
    this.cratesDestroyedCount = 0;
    this.gameStartTime = 0;

    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));

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
      });
    });

    const cpuBtns = document.querySelectorAll('.cpu-opt-btn');
    cpuBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        sfx.playClick();
        cpuBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.cpuCount = parseInt(btn.dataset.cpu, 10);
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
  }

  restartGame() {
    this.startGame();
  }

  startGame() {
    this.lobbyScreen.classList.remove('active');
    this.gameScreen.classList.add('active');
    this.resultOverlay.classList.remove('active');

    if (!this.app) {
      this.app = new PIXI.Application({
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        backgroundColor: 0x0c1e3b,
        antialias: true
      });
      document.getElementById('pixi-canvas-container').appendChild(this.app.view);
    } else {
      this.app.stage.removeChildren();
    }

    this.grid = JSON.parse(JSON.stringify(MAP_LAYOUT));
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
      dirY: 1
    };

    this.characterContainer.addChild(this.player.graphics);

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
        dirY: pos.dirY
      };
      this.characterContainer.addChild(cpu.graphics);
      this.cpus.push(cpu);
    }

    const cpuHudContainer = document.getElementById('cpu-hud-container');
    cpuHudContainer.innerHTML = '';
    this.cpus.forEach(cpu => {
      const cpuProfile = document.createElement('div');
      cpuProfile.className = 'player-profile cpu';
      cpuProfile.id = `cpu-profile-${cpu.id}`;
      
      cpuProfile.innerHTML = `
        <div class="profile-details">
          <div class="profile-name">${CHARACTER_CONFIGS[cpu.charKey].name} (CPU ${cpu.id})</div>
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
    
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const isDark = (r + c) % 2 === 0;
        bg.beginFill(isDark ? 0x0a1c36 : 0x07152a);
        bg.drawRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        bg.endFill();

        bg.lineStyle(1, 0x0d284f, 0.4);
        bg.drawRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        bg.lineStyle(0);
      }
    }
    this.backgroundContainer.addChild(bg);
  }

  drawMap() {
    this.mapContainer.removeChildren();
    const mainG = new PIXI.Graphics();

    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const cell = this.grid[r][c];
        const x = c * TILE_SIZE;
        const y = r * TILE_SIZE;

        if (cell === 1) {
          mainG.beginFill(0x4a5d6e);
          mainG.drawRoundedRect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6, 8);
          mainG.endFill();

          mainG.lineStyle(2, 0x7c94a8, 0.8);
          mainG.drawRoundedRect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6, 8);
          
          mainG.lineStyle(0);
          mainG.beginFill(0x273542);
          mainG.drawCircle(x + TILE_SIZE/2, y + TILE_SIZE/2, TILE_SIZE/4);
          mainG.endFill();
        } else if (cell === 2) {
          mainG.beginFill(0xbf7130);
          mainG.drawRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
          mainG.endFill();

          mainG.lineStyle(3, 0x824413, 0.9);
          mainG.moveTo(x + 4, y + 4);
          mainG.lineTo(x + TILE_SIZE - 4, y + TILE_SIZE - 4);
          mainG.moveTo(x + TILE_SIZE - 4, y + 4);
          mainG.lineTo(x + 4, y + TILE_SIZE - 4);

          mainG.lineStyle(2, 0x542a0b, 1);
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
      allowedCharacters: [character]
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
        const playerCol = Math.floor(this.player.x / TILE_SIZE);
        const playerRow = Math.floor(this.player.y / TILE_SIZE);
        
        // Attack/Bubble Placement checks
        const distToPlayer = Math.abs(cpuCol - playerCol) + Math.abs(cpuRow - playerRow);
        
        // Check if we should place bubble to trap player or destroy crate
        let triggerPlace = false;
        
        // Adjacent crate check (Runs 5 times/sec, so 0.15 is about 60% chance/sec)
        const neighbors = [[0, -1], [0, 1], [-1, 0], [1, 0]];
        for (const [dx, dy] of neighbors) {
          const nc = cpuCol + dx;
          const nr = cpuRow + dy;
          if (nc >= 0 && nc < GRID_COLS && nr >= 0 && nr < GRID_ROWS) {
            if (this.grid[nr][nc] === 2 && Math.random() < 0.15) {
              triggerPlace = true;
            }
          }
        }

        // Close to player check (Runs 5 times/sec, so 0.25 probability)
        if (distToPlayer <= 3 && Math.random() < 0.25) {
          triggerPlace = true;
        }

        // Run validation: If we place a bubble on cpuCol, cpuRow, can we escape safely?
        if (triggerPlace && cpu.placedCount < cpu.maxBubbles && cpu.placeCooldown <= 0) {
          // Simulate placing a bubble at current tile, including its full hypothetical blast range
          const hypotheticalDanger = this.getDangerousZonesForBomb(cpuCol, cpuRow, cpu.bubbleLength);
          const tempBubbles = [...dangerZones, ...hypotheticalDanger];
          const escapeTest = this.findClosestSafeTile(cpuCol, cpuRow, tempBubbles);
          if (escapeTest && escapeTest.path.length > 0) {
            // Yes, safe getaway exists! Place it.
            this.placeBubble(cpu);
            cpu.placeCooldown = 2.0; // Prevent spamming
            cpu.aiState = 'escape';
            cpu.movePath = escapeTest.path;
          }
        }

        // If patrolling and path completed, find next target (Player or Items or Crates)
        if (cpu.movePath.length === 0) {
          let targetCol = playerCol;
          let targetRow = playerRow;

          // Occasionally go for items instead of player
          if (this.items.length > 0 && Math.random() < 0.5) {
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
  }

  checkGameResolutions() {
    // 1. Check if a normal player collides with a trapped CPU to pop it
    if (this.player.state === 'normal') {
      for (const cpu of this.cpus) {
        if (cpu.state === 'trapped') {
          const dist = Math.hypot(this.player.x - cpu.x, this.player.y - cpu.y);
          if (dist < (this.player.radius + cpu.radius)) {
            cpu.state = 'dead';
            sfx.playPopTrap();
            // Check if this was the last CPU
            if (this.cpus.every(c => c.state === 'dead')) {
              this.endGame('win', 'all_cpus_dead');
              return;
            }
          }
        }
      }
    }

    // 2. Check if a normal CPU collides with a trapped player to pop them
    if (this.player.state === 'trapped') {
      for (const cpu of this.cpus) {
        if (cpu.state === 'normal') {
          const dist = Math.hypot(this.player.x - cpu.x, this.player.y - cpu.y);
          if (dist < (this.player.radius + cpu.radius)) {
            this.player.state = 'dead';
            sfx.playPopTrap();
            this.endGame('lose', 'cpu_popped_player');
            return;
          }
        }
      }
    }

    // 3. Check survival count
    const allCpusDead = this.cpus.every(c => c.state === 'dead');
    if (this.player.state === 'dead' && allCpusDead) {
      this.endGame('draw', 'both_dead');
    } else if (this.player.state === 'dead') {
      this.endGame('lose', 'player_dead');
    } else if (allCpusDead) {
      this.endGame('win', 'cpu_dead');
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
      title.textContent = 'YOU WIN!';
      title.style.color = 'var(--accent-blue)';
      if (this.cpuCount > 1) {
        msg.textContent = `水落石出！你成功擊敗了所有 ${this.cpuCount} 位 CPU 玩家，重溫經典海盜 14 的榮耀！`;
      } else {
        msg.textContent = '水落石出！你成功擊敗了 CPU 玩家，重溫經典海盜 14 的榮耀！';
      }
    } else if (outcome === 'lose') {
      title.textContent = 'YOU LOSE';
      title.style.color = 'var(--accent-pink)';
      msg.textContent = '太可惜了！被 CPU 給困住引爆。加油，再試一次一定能贏！';
    } else {
      title.textContent = 'DRAW GAME';
      title.style.color = 'var(--text-light)';
      msg.textContent = '雙方不分勝負，攜手步入水花世界。';
    }

    this.resultOverlay.classList.add('active');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.game = new Game();
});
