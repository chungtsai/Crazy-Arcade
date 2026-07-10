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
    this.pauseModal = document.getElementById('pause-modal');
    this.menuBtn = document.getElementById('menu-btn');
    
    this.selectedChar = 'dao';
    this.selectedChar2 = 'bazzi';
    this.player2Team = 'red';
    this.is2PMode = false;
    this.player2 = null;
    this.selectedMap = 'sea14';
    this.timeLeft = 180;
    this.timerInterval = null;
    this.gameActive = false;
    this.cratesDestroyedCount = 0;
    this.gameStartTime = 0;

    // Network properties for LAN Multi Mode
    this.isNetMode = false;
    this.socket = null;
    this.netRole = null; 
    this.netRoomCode = null;
    this.netPlayerCount = 0;
    this.netRolesInRoom = [];
    this.lastSentState = null;

    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
    window.addEventListener('gamepadconnected', this.handleGamepadConnected.bind(this));
    window.addEventListener('gamepaddisconnected', this.handleGamepadDisconnected.bind(this));

    this.gamepadInputs = [
      { dx: 0, dy: 0, placeBubble: false, useItem: false },
      { dx: 0, dy: 0, placeBubble: false, useItem: false }
    ];
    this.prevGamepadStates = [
      { placeBubblePressed: false, useItemPressed: false },
      { placeBubblePressed: false, useItemPressed: false }
    ];

    this.lobbyRowIdx = 0;
    this.lobbyColIdx = 0;
    this.pauseFocusIdx = 0;
    this.resultFocusIdx = 0;
    this.prevMenuGamepadState = {
      up: false,
      down: false,
      left: false,
      right: false,
      click: false,
      back: false,
      togglePause: false
    };

    this.setupMobileControls();
    this.setupLobby();

    // Start gamepad menu navigation loop
    this.startGamepadMenuLoop();
  }

  getCharacters() {
    const list = [this.player];
    if (this.player2) list.push(this.player2);
    if (this.player3) list.push(this.player3);
    if (this.player4) list.push(this.player4);
    return [...list, ...this.cpus];
  }

  handleGamepadConnected(e) {
    console.log("Gamepad connected at index %d: %s. %d buttons, %d axes.",
      e.gamepad.index, e.gamepad.id,
      e.gamepad.buttons.length, e.gamepad.axes.length);
    
    const playerNum = e.gamepad.index + 1;
    this.showToast(`🎮 已偵測到遙桿 ${playerNum}：${e.gamepad.id.substring(0, 15)}...`, 'gamepad-connect');
  }

  handleGamepadDisconnected(e) {
    console.log("Gamepad disconnected from index %d: %s",
      e.gamepad.index, e.gamepad.id);
    
    const playerNum = e.gamepad.index + 1;
    this.showToast(`❌ 搖桿 ${playerNum} 已中斷連接`, 'gamepad-disconnect');
  }

  showToast(message, type = '') {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
      toast.classList.add('show');
    }, 50);

    // Remove toast after 3 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        toast.remove();
      }, 400);
    }, 3000);
  }

  pollGamepads() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    
    for (let i = 0; i < 2; i++) {
      const gp = gamepads[i];
      if (!gp) {
        this.gamepadInputs[i] = { dx: 0, dy: 0, placeBubble: false, useItem: false };
        continue;
      }

      const input = this.gamepadInputs[i];
      const prev = this.prevGamepadStates[i];

      // Left joystick / D-pad movement
      const deadzone = 0.25;
      let ax = gp.axes[0] || 0;
      let ay = gp.axes[1] || 0;
      if (Math.abs(ax) < deadzone) ax = 0;
      if (Math.abs(ay) < deadzone) ay = 0;

      // D-pad check
      let dpadUp = gp.buttons[12] && gp.buttons[12].pressed;
      let dpadDown = gp.buttons[13] && gp.buttons[13].pressed;
      let dpadLeft = gp.buttons[14] && gp.buttons[14].pressed;
      let dpadRight = gp.buttons[15] && gp.buttons[15].pressed;

      if (dpadUp) ay = -1;
      if (dpadDown) ay = 1;
      if (dpadLeft) ax = -1;
      if (dpadRight) ax = 1;

      // Normalize diagonal inputs
      if (ax !== 0 && ay !== 0) {
        const length = Math.sqrt(ax * ax + ay * ay);
        input.dx = ax / length;
        input.dy = ay / length;
      } else {
        input.dx = ax;
        input.dy = ay;
      }

      // Bubble placement (Button 0: A/Cross, Button 2: X/Square)
      const btnA = gp.buttons[0] && gp.buttons[0].pressed;
      const btnX = gp.buttons[2] && gp.buttons[2].pressed;
      const currentPlace = btnA || btnX;

      // Item usage (Button 1: B/Circle, Button 3: Y/Triangle, Buttons 4,5: LB/RB)
      const btnB = gp.buttons[1] && gp.buttons[1].pressed;
      const btnY = gp.buttons[3] && gp.buttons[3].pressed;
      const btnL1 = gp.buttons[4] && gp.buttons[4].pressed;
      const btnR1 = gp.buttons[5] && gp.buttons[5].pressed;
      const currentUseItem = btnB || btnY || btnL1 || btnR1;

      // Trigger actions on button-down transition (edge detection)
      const player = (i === 1 && this.is2PMode) ? this.player2 : this.player;
      
      if (player && this.gameActive) {
        // Place bubble
        if (currentPlace && !prev.placeBubblePressed) {
          if (player.state === 'normal') {
            this.placeBubble(player);
          }
        }
        
        // Use item
        if (currentUseItem && !prev.useItemPressed) {
          this.useActiveItem(player);
        }
      }

      // Save states for next frame edge detection
      prev.placeBubblePressed = currentPlace;
      prev.useItemPressed = currentUseItem;
    }
  }

  startGamepadMenuLoop() {
    const loop = () => {
      this.pollGamepadForMenus();
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  pollGamepadForMenus() {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    
    let gp = null;
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i]) {
        gp = gamepads[i];
        break;
      }
    }
    
    if (!gp) return;

    // Read directions
    const deadzone = 0.4;
    let ax = gp.axes[0] || 0;
    let ay = gp.axes[1] || 0;
    
    let up = (ay < -deadzone) || (gp.buttons[12] && gp.buttons[12].pressed);
    let down = (ay > deadzone) || (gp.buttons[13] && gp.buttons[13].pressed);
    let left = (ax < -deadzone) || (gp.buttons[14] && gp.buttons[14].pressed);
    let right = (ax > deadzone) || (gp.buttons[15] && gp.buttons[15].pressed);
    
    let click = gp.buttons[0] && gp.buttons[0].pressed; // A button / Cross
    let back = gp.buttons[1] && gp.buttons[1].pressed;  // B button / Circle
    let togglePause = gp.buttons[9] && gp.buttons[9].pressed; // Start button

    const prev = this.prevMenuGamepadState;

    // Edge detection for menus
    let moveUp = up && !prev.up;
    let moveDown = down && !prev.down;
    let moveLeft = left && !prev.left;
    let moveRight = right && !prev.right;
    let doClick = click && !prev.click;
    let doBack = back && !prev.back;
    let doTogglePause = togglePause && !prev.togglePause;

    // Save state
    prev.up = up;
    prev.down = down;
    prev.left = left;
    prev.right = right;
    prev.click = click;
    prev.back = back;
    prev.togglePause = togglePause;

    if (moveUp || moveDown || moveLeft || moveRight || doClick || doBack || doTogglePause) {
      this.handleMenuGamepadInput({ moveUp, moveDown, moveLeft, moveRight, doClick, doBack, doTogglePause });
    }
  }

  handleMenuGamepadInput(input) {
    const { moveUp, moveDown, moveLeft, moveRight, doClick, doBack, doTogglePause } = input;

    if (doTogglePause) {
      this.toggleGamePause();
      return;
    }

    if (this.pauseModal && this.pauseModal.classList.contains('active')) {
      const buttons = this.getPauseModalButtons();
      if (buttons.length === 0) return;

      if (moveDown) {
        this.pauseFocusIdx = (this.pauseFocusIdx + 1) % buttons.length;
        sfx.playClick();
      } else if (moveUp) {
        this.pauseFocusIdx = (this.pauseFocusIdx - 1 + buttons.length) % buttons.length;
        sfx.playClick();
      } else if (doClick) {
        buttons[this.pauseFocusIdx].click();
      } else if (doBack) {
        this.toggleGamePause(); // Resume
      }
      this.updateMenuFocus();
      return;
    }

    if (this.resultOverlay && this.resultOverlay.classList.contains('active')) {
      const buttons = this.getResultButtons();
      if (buttons.length === 0) return;

      if (moveDown || moveRight) {
        this.resultFocusIdx = (this.resultFocusIdx + 1) % buttons.length;
        sfx.playClick();
      } else if (moveUp || moveLeft) {
        this.resultFocusIdx = (this.resultFocusIdx - 1 + buttons.length) % buttons.length;
        sfx.playClick();
      } else if (doClick) {
        buttons[this.resultFocusIdx].click();
      }
      this.updateMenuFocus();
      return;
    }

    if (this.lobbyScreen && this.lobbyScreen.classList.contains('active')) {
      const rows = this.getLobbyRows();
      if (rows.length === 0) return;

      if (moveDown) {
        this.lobbyRowIdx = (this.lobbyRowIdx + 1) % rows.length;
        this.lobbyColIdx = Math.min(this.lobbyColIdx, rows[this.lobbyRowIdx].length - 1);
        sfx.playClick();
      } else if (moveUp) {
        this.lobbyRowIdx = (this.lobbyRowIdx - 1 + rows.length) % rows.length;
        this.lobbyColIdx = Math.min(this.lobbyColIdx, rows[this.lobbyRowIdx].length - 1);
        sfx.playClick();
      } else if (moveRight) {
        const currentRow = rows[this.lobbyRowIdx];
        const target = currentRow[this.lobbyColIdx];
        if (target && target.tagName === 'SELECT') {
          target.selectedIndex = (target.selectedIndex + 1) % target.options.length;
          target.dispatchEvent(new Event('change'));
          sfx.playClick();
        } else {
          this.lobbyColIdx = (this.lobbyColIdx + 1) % currentRow.length;
          sfx.playClick();
        }
      } else if (moveLeft) {
        const currentRow = rows[this.lobbyRowIdx];
        const target = currentRow[this.lobbyColIdx];
        if (target && target.tagName === 'SELECT') {
          target.selectedIndex = (target.selectedIndex - 1 + target.options.length) % target.options.length;
          target.dispatchEvent(new Event('change'));
          sfx.playClick();
        } else {
          this.lobbyColIdx = (this.lobbyColIdx - 1 + currentRow.length) % currentRow.length;
          sfx.playClick();
        }
      } else if (doClick) {
        const target = rows[this.lobbyRowIdx][this.lobbyColIdx];
        if (target) {
          if (target.tagName !== 'SELECT') {
            target.click();
          }
        }
      }
      this.updateMenuFocus();
      return;
    }
  }

  updateMenuFocus() {
    // Clear previous highlights
    document.querySelectorAll('.gamepad-focused').forEach(el => {
      el.classList.remove('gamepad-focused');
    });

    if (this.pauseModal && this.pauseModal.classList.contains('active')) {
      const buttons = this.getPauseModalButtons();
      if (buttons.length > 0) {
        this.pauseFocusIdx = Math.max(0, Math.min(this.pauseFocusIdx, buttons.length - 1));
        const target = buttons[this.pauseFocusIdx];
        if (target) target.classList.add('gamepad-focused');
      }
    } else if (this.resultOverlay && this.resultOverlay.classList.contains('active')) {
      const buttons = this.getResultButtons();
      if (buttons.length > 0) {
        this.resultFocusIdx = Math.max(0, Math.min(this.resultFocusIdx, buttons.length - 1));
        const target = buttons[this.resultFocusIdx];
        if (target) target.classList.add('gamepad-focused');
      }
    } else if (this.lobbyScreen && this.lobbyScreen.classList.contains('active')) {
      const rows = this.getLobbyRows();
      if (rows.length > 0) {
        this.lobbyRowIdx = Math.max(0, Math.min(this.lobbyRowIdx, rows.length - 1));
        const currentRow = rows[this.lobbyRowIdx];
        if (currentRow && currentRow.length > 0) {
          this.lobbyColIdx = Math.max(0, Math.min(this.lobbyColIdx, currentRow.length - 1));
          const target = currentRow[this.lobbyColIdx];
          if (target) {
            target.classList.add('gamepad-focused');
            // Ensure the focused element is visible within the scrollable lobby screen
            target.scrollIntoView({ block: 'nearest', inline: 'nearest' });

            // 自動頁籤同步邏輯
            const tabContent = target.closest('.lobby-tab-content');
            if (tabContent && !tabContent.classList.contains('active')) {
              const tabId = tabContent.id.replace('lobby-tab-', '');
              const tabBtn = document.querySelector(`.lobby-tab-btn[data-tab="${tabId}"]`);
              if (tabBtn) {
                tabBtn.click();
              }
            }
          }
        }
      }
    }
  }

  resetMenuFocus() {
    this.lobbyRowIdx = 0;
    this.lobbyColIdx = 0;
    this.pauseFocusIdx = 0;
    this.resultFocusIdx = 0;
    this.updateMenuFocus();
  }

  clearMenuFocus() {
    document.querySelectorAll('.gamepad-focused').forEach(el => {
      el.classList.remove('gamepad-focused');
    });
  }

  getPauseModalButtons() {
    const modal = document.getElementById('pause-modal');
    if (!modal) return [];
    const allButtons = Array.from(modal.querySelectorAll('.btn'));
    return allButtons.filter(btn => {
      const style = window.getComputedStyle(btn);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
  }

  getResultButtons() {
    const overlay = document.getElementById('result-overlay');
    if (!overlay) return [];
    return Array.from(overlay.querySelectorAll('.btn'));
  }

  getLobbyRows() {
    const rows = [];
    
    // Helper to filter out elements that are hidden (having offsetWidth/offsetHeight 0)
    const isVisible = el => el.offsetWidth > 0 || el.offsetHeight > 0;

    // Row: Lobby tab buttons (visible only on mobile/tablet)
    const tabs = Array.from(document.querySelectorAll('.lobby-tab-btn')).filter(isVisible);
    if (tabs.length > 0) rows.push(tabs);

    // Row: Map selection (Settings column / Tab 1)
    const mapSelect = document.getElementById('map-select');
    if (mapSelect && isVisible(mapSelect)) {
      rows.push([mapSelect]);
    }

    // Row: Mode selection (Settings column / Tab 1)
    const modeSelect = document.getElementById('mode-select');
    if (modeSelect && isVisible(modeSelect)) {
      rows.push([modeSelect]);
    }

    // Row: LAN setup input and connect button (Settings column / Tab 1 - net mode)
    const netIp = document.getElementById('net-server-ip');
    const netConnect = document.getElementById('net-connect-btn');
    if (netIp && netConnect && isVisible(netIp)) {
      rows.push([netIp, netConnect]);
    }

    // Row: CPU selection (Settings column / Tab 1 - offline mode)
    const cpuSelect = document.getElementById('cpu-select');
    if (cpuSelect && isVisible(cpuSelect)) {
      rows.push([cpuSelect]);
    }

    // Row: P1 character selection (Characters column / Tab 2)
    const p1Chars = Array.from(document.querySelectorAll('.p1-grid .char-card')).filter(isVisible);
    if (p1Chars.length > 0) rows.push(p1Chars);

    // Row: P2 character selection (Characters column / Tab 2 - 2P mode only)
    const p2Sel = document.querySelector('.p2-selection');
    if (p2Sel && isVisible(p2Sel)) {
      const p2Chars = Array.from(document.querySelectorAll('.p2-grid .char-card')).filter(isVisible);
      if (p2Chars.length > 0) rows.push(p2Chars);
    }

    // Row: Team toggles (Characters column / Tab 2)
    const teamToggles = Array.from(document.querySelectorAll('.team-toggle-btn')).filter(btn => !btn.disabled && isVisible(btn));
    if (teamToggles.length > 0) rows.push(teamToggles);

    // Row: Start button (Footer - visible on all tabs/columns)
    const startBtn = document.getElementById('start-btn');
    if (startBtn && isVisible(startBtn)) {
      rows.push([startBtn]);
    }

    return rows;
  }

  toggleGamePause() {
    if (this.gameActive && !this.gameEnding) {
      sfx.playClick();
      this.gameActive = false;
      if (this.pauseModal) {
        this.pauseModal.classList.add('active');
        this.resetMenuFocus();
      }
    } else if (!this.gameActive && this.pauseModal && this.pauseModal.classList.contains('active')) {
      sfx.playClick();
      this.gameActive = true;
      this.pauseModal.classList.remove('active');
      this.clearMenuFocus();
    }
  }

  setupLobby() {
    // 1. 初始化大廳頁籤 (Mobile/Tablet 適用)
    const tabBtns = document.querySelectorAll('.lobby-tab-btn');
    const tabContents = document.querySelectorAll('.lobby-tab-content');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;
        
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        tabContents.forEach(c => {
          if (c.id === `lobby-tab-${tabId}`) {
            c.classList.add('active');
          } else {
            c.classList.remove('active');
          }
        });
        
        if (typeof sfx !== 'undefined' && sfx.playClick) {
          sfx.playClick();
        }
      });
    });

    // Mode selection dropdown
    const modeSelect = document.getElementById('mode-select');
    if (modeSelect) {
      // Sync initial mode
      this.is2PMode = modeSelect.value === '2p';
      this.isNetMode = modeSelect.value === 'net';

      modeSelect.addEventListener('change', () => {
        sfx.playClick();
        const selectedMode = modeSelect.value;
        this.is2PMode = selectedMode === '2p';
        this.isNetMode = selectedMode === 'net';

        // Toggle character selection headers and Player 2 selection visibility
        const p2Sel = document.querySelector('.p2-selection');
        const p1Title = document.querySelector('.p1-selection h3');
        const guide1p = document.getElementById('controls-guide-1p');
        const guide2p = document.getElementById('controls-guide-2p');
        const cpuSel = document.querySelector('.cpu-select-container');
        const teamSel = document.querySelector('.team-selection');
        const netPanel = document.getElementById('net-setup-panel');
        const startBtn = document.getElementById('start-btn');

        if (this.isNetMode) {
          this.is2PMode = false;
          if (p2Sel) p2Sel.style.display = 'none';
          if (p1Title) p1Title.textContent = '選擇您的角色';
          if (guide1p) guide1p.style.display = 'block';
          if (guide2p) guide2p.style.display = 'none';
          if (cpuSel) cpuSel.style.display = 'none';
          if (teamSel) teamSel.style.display = 'none';
          if (netPanel) netPanel.style.display = 'block';
          this.cpuCount = 0;
          this.updateNetLobbyStartBtn();
          this.initNetSetup();
        } else {
          if (p2Sel) p2Sel.style.display = this.is2PMode ? 'block' : 'none';
          if (p1Title) p1Title.textContent = this.is2PMode ? '選擇 1P 角色' : '選擇角色';
          if (guide1p) guide1p.style.display = this.is2PMode ? 'none' : 'block';
          if (guide2p) guide2p.style.display = this.is2PMode ? 'block' : 'none';
          if (cpuSel) cpuSel.style.display = 'block';
          if (teamSel) teamSel.style.display = 'block';
          if (netPanel) netPanel.style.display = 'none';

          // Restore cpuCount from the CPU select dropdown
          const cpuSelect = document.getElementById('cpu-select');
          this.cpuCount = cpuSelect ? parseInt(cpuSelect.value, 10) : 3;

          if (startBtn) {
            startBtn.disabled = false;
            startBtn.textContent = '開始遊戲';
          }
          this.disconnectNet();
        }

        this.updateTeamSlotsUI();
      });
    }

    const p1Cards = document.querySelectorAll('.p1-grid .char-card');
    p1Cards.forEach(card => {
      card.addEventListener('click', () => {
        sfx.playClick();
        p1Cards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.selectedChar = card.dataset.char;
        this.updateTeamSlotsUI();

        if (this.isNetMode) {
          this.sendNetMessage({
            type: 'select_char',
            char: this.selectedChar
          });
        }
      });
    });

    const p2Cards = document.querySelectorAll('.p2-grid .char-card');
    p2Cards.forEach(card => {
      card.addEventListener('click', () => {
        sfx.playClick();
        p2Cards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.selectedChar2 = card.dataset.char;
        this.updateTeamSlotsUI();
      });
    });

    const mapSelect = document.getElementById('map-select');
    if (mapSelect) {
      mapSelect.value = this.selectedMap || 'sea14';
      const handleMapChange = () => {
        this.selectedMap = mapSelect.value;
        const subTitleEl = document.querySelector('.sub-title');
        if (this.selectedMap === 'random') {
          document.title = "爆爆王 (Crazy Arcade) - 🎲 隨機地圖模式";
          if (subTitleEl) {
            subTitleEl.textContent = "🎲 正在隨機配置挑戰關卡...";
            subTitleEl.classList.add('rolling-active');
          }
        } else {
          const mapConf = MAPS_CONFIG[this.selectedMap];
          if (mapConf) {
            if (subTitleEl) {
              subTitleEl.textContent = `${mapConf.name} 經典關卡`;
              subTitleEl.classList.remove('rolling-active');
            }
            document.title = `爆爆王 (Crazy Arcade) - ${mapConf.name}`;
          }
        }
      };
      mapSelect.addEventListener('change', () => {
        sfx.playClick();
        handleMapChange();
      });
      handleMapChange();
    }

    // CPU selection dropdown
    const cpuSelect = document.getElementById('cpu-select');
    if (cpuSelect) {
      // Sync initial CPU count
      this.cpuCount = parseInt(cpuSelect.value, 10);

      cpuSelect.addEventListener('change', () => {
        sfx.playClick();
        this.cpuCount = parseInt(cpuSelect.value, 10);
        this.updateTeamSlotsUI();

        // Implement the auto-jump tab logic (clicking the characters tab button)
        const charTabBtn = document.querySelector('.lobby-tab-btn[data-tab="characters"]');
        if (charTabBtn) {
          charTabBtn.click();
        }
      });
    }

    document.getElementById('start-btn').addEventListener('click', () => {
      sfx.playClick();
      if (this.isNetMode) {
        if (this.netRole === 'p1' && this.netPlayerCount >= 2) {
          let mapToSend = this.selectedMap;
          if (mapToSend === 'random') {
            const mapKeys = Object.keys(MAPS_CONFIG).filter(key => key !== 'random');
            mapToSend = mapKeys[Math.floor(Math.random() * mapKeys.length)];
          }
          this.sendNetMessage({
            type: 'start_game',
            selectedMap: mapToSend
          });
        }
      } else {
        this.startGame();
      }
    });

    // Menu button triggers pause modal
    if (this.menuBtn) {
      this.menuBtn.addEventListener('click', () => {
        sfx.playClick();
        if (this.isNetMode) {
          this.showToast('ℹ️ 區域連線模式下無法暫停遊戲');
          return;
        }
        if (this.gameActive && !this.gameEnding) {
          this.gameActive = false;
          if (this.pauseModal) {
            this.pauseModal.classList.add('active');
            this.resetMenuFocus();
          }
        }
      });
    }

    // Modal action buttons
    const modalResumeBtn = document.getElementById('modal-resume-btn');
    if (modalResumeBtn) {
      modalResumeBtn.addEventListener('click', () => {
        sfx.playClick();
        this.gameActive = true;
        if (this.pauseModal) {
          this.pauseModal.classList.remove('active');
        }
        this.clearMenuFocus();
        if (document.activeElement) {
          document.activeElement.blur();
        }
        if (this.prevGamepadStates) {
          this.prevGamepadStates.forEach(state => {
            state.placeBubblePressed = true;
            state.useItemPressed = true;
          });
        }
      });
    }

    const modalRestartBtn = document.getElementById('modal-restart-btn');
    if (modalRestartBtn) {
      modalRestartBtn.addEventListener('click', () => {
        sfx.playClick();
        if (this.pauseModal) {
          this.pauseModal.classList.remove('active');
        }
        this.clearMenuFocus();
        this.restartGame();
      });
    }

    const modalExitBtn = document.getElementById('modal-exit-btn');
    if (modalExitBtn) {
      modalExitBtn.addEventListener('click', () => {
        sfx.playClick();
        if (this.pauseModal) {
          this.pauseModal.classList.remove('active');
        }
        this.clearMenuFocus();
        this.endGame(null, 'abort');
      });
    }

    document.getElementById('play-again-btn').addEventListener('click', () => {
      sfx.playClick();
      if (this.isNetMode) {
        if (this.netRole === 'p1') {
          let mapToSend = this.selectedMap;
          if (mapToSend === 'random') {
            const mapKeys = Object.keys(MAPS_CONFIG).filter(key => key !== 'random');
            mapToSend = mapKeys[Math.floor(Math.random() * mapKeys.length)];
          }
          this.sendNetMessage({
            type: 'start_game',
            selectedMap: mapToSend
          });
        }
      } else {
        this.clearMenuFocus();
        this.restartGame();
      }
    });

    document.getElementById('result-exit-btn').addEventListener('click', () => {
      sfx.playClick();
      this.resultOverlay.classList.remove('active');
      this.lobbyScreen.classList.add('active');
      this.gameScreen.classList.remove('active');
      this.resetMenuFocus();
    });

    this.updateTeamSlotsUI();
    this.resetMenuFocus();
  }

  updateTeamSlotsUI() {
    const container = document.getElementById('team-slots');
    if (!container) return;
    container.innerHTML = '';

    if (this.isNetMode) {
      // Net mode lobby slots based on connected roles
      const roles = this.netRolesInRoom || [];
      roles.forEach(role => {
        const charKey = (this.netSelectedChars && this.netSelectedChars[role]) || (role === 'p2' ? 'bazzi' : (role === 'p3' ? 'marid' : 'dao'));
        const team = (role === 'p1' || role === 'p3') ? 'red' : 'blue';
        const teamLabel = team === 'red' ? '紅隊' : '藍隊';
        const teamClass = team === 'red' ? 'team-red' : 'team-blue';
        const charName = CHARACTER_CONFIGS[charKey] ? CHARACTER_CONFIGS[charKey].name : charKey;
        
        const isLocal = role === this.netRole;
        const slotLabel = role.toUpperCase() + (isLocal ? ' (你)' : '');

        const playerCard = document.createElement('div');
        playerCard.className = `team-slot-card ${teamClass}`;
        playerCard.innerHTML = `
          <div class="slot-avatar ${charKey}-color"></div>
          <div class="slot-name">${slotLabel} (${charName})</div>
          <button class="team-toggle-btn ${teamClass}" disabled>${teamLabel}</button>
        `;
        container.appendChild(playerCard);
      });
      return;
    }

    // 1. Add Player 1 Slot
    const playerCard = document.createElement('div');
    playerCard.className = 'team-slot-card team-red';
    const playerCharName = CHARACTER_CONFIGS[this.selectedChar].name;
    playerCard.innerHTML = `
      <div class="slot-avatar ${this.selectedChar}-color"></div>
      <div class="slot-name">玩家1 (${playerCharName})</div>
      <button class="team-toggle-btn team-red" disabled>紅隊</button>
    `;
    container.appendChild(playerCard);

    // 2. Add Player 2 Slot if 2P Mode is active
    if (this.is2PMode) {
      const char2 = this.selectedChar2 || 'bazzi';
      const player2CharName = CHARACTER_CONFIGS[char2].name;
      const team = this.player2Team || 'red';
      const teamLabel = team === 'red' ? '紅隊' : '藍隊';
      const teamClass = team === 'red' ? 'team-red' : 'team-blue';

      const player2Card = document.createElement('div');
      player2Card.className = `team-slot-card ${teamClass}`;
      player2Card.innerHTML = `
        <div class="slot-avatar ${char2}-color"></div>
        <div class="slot-name">玩家2 (${player2CharName})</div>
        <button class="team-toggle-btn ${teamClass}" id="player2-team-toggle">${teamLabel}</button>
      `;

      player2Card.querySelector('#player2-team-toggle').addEventListener('click', () => {
        sfx.playClick();
        this.player2Team = this.player2Team === 'red' ? 'blue' : 'red';
        this.updateTeamSlotsUI();
      });

      container.appendChild(player2Card);
    }

    // 3. Add CPU Slots
    const selectedChars = this.is2PMode ? [this.selectedChar, this.selectedChar2 || 'bazzi'] : [this.selectedChar];
    const availableCPUChars = Object.keys(CHARACTER_CONFIGS).filter(char => !selectedChars.includes(char));
    const finalCPUChars = availableCPUChars.length > 0 ? availableCPUChars : Object.keys(CHARACTER_CONFIGS);

    for (let i = 0; i < this.cpuCount; i++) {
      const cpuChar = finalCPUChars[i % finalCPUChars.length];
      const cpuCharName = CHARACTER_CONFIGS[cpuChar].name;
      const team = this.cpuTeams[i] || 'blue';
      const teamLabel = team === 'red' ? '紅隊' : '藍隊';
      const teamClass = team === 'red' ? 'team-red' : 'team-blue';

      const cpuCard = document.createElement('div');
      cpuCard.className = `team-slot-card ${teamClass}`;
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

  // Network Multi-player helper methods
  initNetSetup() {
    const serverIpInput = document.getElementById('net-server-ip');
    const connectBtn = document.getElementById('net-connect-btn');
    const statusText = document.getElementById('net-status-text');
    const roomInfo = document.getElementById('net-room-info');

    if (serverIpInput && !serverIpInput.value) {
      if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
        serverIpInput.value = `ws://${window.location.host}`;
      } else {
        serverIpInput.value = 'ws://localhost:3000';
      }
    }

    if (connectBtn && !connectBtn.hasListener) {
      connectBtn.hasListener = true;
      connectBtn.addEventListener('click', () => {
        sfx.playClick();
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          this.disconnectNet();
        } else {
          const url = serverIpInput.value.trim();
          this.connectNet(url);
        }
      });
    }
  }

  connectNet(url) {
    const statusText = document.getElementById('net-status-text');
    const connectBtn = document.getElementById('net-connect-btn');
    const roomInfo = document.getElementById('net-room-info');

    if (statusText) {
      statusText.textContent = '● 連線中...';
      statusText.style.color = '#ffaa00';
    }

    try {
      this.socket = new WebSocket(url);
      
      this.socket.onopen = () => {
        if (statusText) {
          statusText.textContent = '● 已連線';
          statusText.style.color = '#4dff4d';
        }
        if (connectBtn) {
          connectBtn.textContent = '中斷連線';
        }
        
        this.sendNetMessage({
          type: 'join_lobby'
        });
      };

      this.socket.onmessage = (e) => {
        this.handleNetMessage(e.data);
      };

      this.socket.onclose = (event) => {
        this.handleNetDisconnect();
      };

      this.socket.onerror = (err) => {
        console.error('Socket error:', err);
        if (statusText) {
          statusText.textContent = '● 連線失敗';
          statusText.style.color = '#ff6b6b';
        }
      };
    } catch (e) {
      console.error(e);
      if (statusText) {
        statusText.textContent = '● 網址錯誤';
        statusText.style.color = '#ff6b6b';
      }
    }
  }

  disconnectNet() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.handleNetDisconnect();
  }

  handleNetDisconnect() {
    this.socket = null;
    this.netRole = null;
    this.netRoomCode = null;
    this.netPlayerCount = 0;
    this.netRolesInRoom = [];
    this.lastSentState = null;

    const statusText = document.getElementById('net-status-text');
    const connectBtn = document.getElementById('net-connect-btn');
    const roomInfo = document.getElementById('net-room-info');

    if (statusText) {
      statusText.textContent = '● 未連線';
      statusText.style.color = '#ff6b6b';
    }
    if (connectBtn) {
      connectBtn.textContent = '連線';
    }
    if (roomInfo) {
      roomInfo.style.display = 'none';
      roomInfo.textContent = '';
    }

    this.updateNetLobbyStartBtn();

    if (this.gameActive && this.isNetMode) {
      this.showToast('⚠️ 與伺服器連線已中斷，回到大廳');
      this.endGame(null, 'abort');
    }
  }

  sendNetMessage(data) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data));
    }
  }

  handleNetMessage(messageText) {
    try {
      const data = JSON.parse(messageText);

      switch (data.type) {
        case 'joined':
          this.netRole = data.role;
          this.netRoomCode = data.roomCode;
          if (!this.netSelectedChars) this.netSelectedChars = {};
          this.netSelectedChars[this.netRole] = this.selectedChar;
          this.showToast(`🎉 已成功加入房間！您的身分為: ${this.netRole.toUpperCase()}`);
          this.updateNetLobbyStartBtn();
          
          this.sendNetMessage({
            type: 'select_char',
            char: this.selectedChar
          });
          break;

        case 'room_status':
          this.netPlayerCount = data.playerCount;
          this.netRolesInRoom = data.roles;
          
          const roomInfo = document.getElementById('net-room-info');
          if (roomInfo) {
            roomInfo.style.display = 'block';
            roomInfo.innerHTML = `
              <div>房間：${this.netRoomCode}</div>
              <div>連線玩家數：${this.netPlayerCount} / 4</div>
              <div>狀態：${this.netPlayerCount >= 2 ? '👥 隨時可以開始遊戲！' : '⌛ 等待其他玩家加入...'}</div>
            `;
          }
          this.updateNetLobbyStartBtn();
          this.updateTeamSlotsUI();
          break;

        case 'error':
          this.showToast(`❌ 連線錯誤: ${data.message}`);
          this.disconnectNet();
          break;

        case 'player_disconnected':
          this.showToast(`⚠️ 玩家 (${data.role.toUpperCase()}) 已離開房間`);
          if (this.gameActive) {
            this.endGame(null, 'abort');
          }
          break;

        case 'select_char':
          if (!this.netSelectedChars) this.netSelectedChars = {};
          this.netSelectedChars[data.role] = data.char;
          this.updateTeamSlotsUI();
          break;

        case 'start_game':
          this.netSelectedChars = data.selectedChars || {};
          this.selectedMap = data.selectedMap;
          this.is2PMode = true; 
          this.startGame();
          break;

        case 'move':
          const mPlayer = this.netPlayersMap[data.role];
          if (mPlayer) {
            mPlayer.x = data.x;
            mPlayer.y = data.y;
            mPlayer.dirX = data.dirX;
            mPlayer.dirY = data.dirY;
            mPlayer.state = data.state;
          }
          break;

        case 'place_bubble':
          const pbPlayer = this.netPlayersMap[data.role];
          if (pbPlayer) {
            this.placeBubble(pbPlayer);
          }
          break;

        case 'use_item':
          const uiPlayer = this.netPlayersMap[data.role];
          if (uiPlayer) {
            this.useActiveItem(uiPlayer);
          }
          break;

        case 'destroy_crate':
          this.destroyCrate(data.col, data.row, data.itemType);
          break;

        case 'collect_item':
          const ciPlayer = this.netPlayersMap[data.role];
          if (ciPlayer) {
            const itemIndex = this.items.findIndex(it => it.col === data.col && it.row === data.row);
            if (itemIndex !== -1) {
              const item = this.items[itemIndex];
              this.collectItem(ciPlayer, item);
              this.itemContainer.removeChild(item.graphics);
              item.graphics.destroy({ children: true });
              this.items.splice(itemIndex, 1);
            }
          }
          break;
      }
    } catch (e) {
      console.error('Error parsing net message:', e);
    }
  }

  updateNetLobbyStartBtn() {
    const startBtn = document.getElementById('start-btn');
    if (!startBtn) return;

    if (!this.isNetMode) {
      startBtn.disabled = false;
      startBtn.textContent = '開始遊戲';
      return;
    }

    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      startBtn.disabled = true;
      startBtn.textContent = '請先連線至伺服器';
      return;
    }

    if (this.netRole === 'p1') {
      if (this.netPlayerCount >= 2) {
        startBtn.disabled = false;
        startBtn.textContent = `開始遊戲 (${this.netPlayerCount}人已連線)`;
      } else {
        startBtn.disabled = true;
        startBtn.textContent = '等待對手加入 (1/2)...';
      }
    } else if (this.netRole) {
      startBtn.disabled = true;
      startBtn.textContent = '等待主機開始遊戲...';
    } else {
      startBtn.disabled = true;
      startBtn.textContent = '正在加入房間...';
    }
  }

  setupMobileControls() {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                             ('ontouchstart' in window) ||
                             (navigator.maxTouchPoints > 0);
      const isSmallScreen = window.innerWidth <= 768;
      const isMobile = isMobileDevice || isSmallScreen;
      const isTablet = isMobileDevice && !isSmallScreen;

      if (isMobile) {
        document.body.classList.add('is-mobile');
      } else {
        document.body.classList.remove('is-mobile');
      }

      if (isTablet) {
        document.body.classList.add('is-tablet');
      } else {
        document.body.classList.remove('is-tablet');
      }

      // Move instruction panel to appropriate container dynamically
      const instructions = document.querySelector('.instructions-panel');
      if (instructions) {
        if (isMobile) {
          const tabInstructions = document.getElementById('lobby-tab-instructions');
          if (tabInstructions && instructions.parentElement !== tabInstructions) {
            tabInstructions.appendChild(instructions);
          }
        } else {
          const tabChars = document.getElementById('lobby-tab-characters');
          if (tabChars && instructions.parentElement !== tabChars) {
            tabChars.appendChild(instructions);
          }
        }
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
          this.useActiveItem();
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

    let storedMode = 'joystick';
    try {
      storedMode = localStorage.getItem('mobileControlMode') || 'joystick';
    } catch (e) {
      console.warn('localStorage is not available, default to joystick');
    }
    this.mobileControlMode = storedMode;

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
        try {
          localStorage.setItem('mobileControlMode', this.mobileControlMode);
        } catch (e) {
          console.warn('localStorage is not available');
        }
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
    this.clearMenuFocus();
    this.startGame();
  }

  startGame() {
    this.clearMenuFocus();
    this.lobbyScreen.classList.remove('active');
    this.gameScreen.classList.add('active');
    this.resultOverlay.classList.remove('active');
    if (this.pauseModal) {
      this.pauseModal.classList.remove('active');
    }

    // Reset previous gamepad button states to prevent accidental bubble placement on menu exit
    if (this.prevGamepadStates) {
      this.prevGamepadStates.forEach(state => {
        state.placeBubblePressed = true;
        state.useItemPressed = true;
      });
    }

    this.currentMapKey = this.selectedMap;
    if (this.currentMapKey === 'random') {
      const mapKeys = Object.keys(MAPS_CONFIG).filter(key => key !== 'random');
      this.currentMapKey = mapKeys[Math.floor(Math.random() * mapKeys.length)];
    }
    const mapConf = MAPS_CONFIG[this.currentMapKey];
    
    // Dynamically update document title on game start
    document.title = `爆爆王 (Crazy Arcade) - ${mapConf.name}`;

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
    if (this.gameEndTimeout) {
      clearTimeout(this.gameEndTimeout);
      this.gameEndTimeout = null;
    }
    this.gameEnding = false;

    if (this.dartsProjectiles) {
      for (const d of this.dartsProjectiles) {
        if (d.graphics) {
          this.app.stage.removeChild(d.graphics);
          d.graphics.destroy();
        }
      }
    }
    this.dartsProjectiles = [];

    this.grid = JSON.parse(JSON.stringify(mapConf.layout));
    this.ensureSpawnSafety();
    this.generateCrateItems();
    this.bubbles = [];
    this.flames = [];
    this.items = [];
    this.cratesDestroyedCount = 0;
    this.keys = {};
    if (this.particles) {
      for (const p of this.particles) {
        if (p.graphics) {
          p.graphics.destroy();
        }
      }
    }
    this.particles = [];

    this.backgroundContainer = new PIXI.Container();
    this.mapContainer = new PIXI.Container();
    this.itemContainer = new PIXI.Container();
    this.bubbleContainer = new PIXI.Container();
    this.flameContainer = new PIXI.Container();
    this.characterContainer = new PIXI.Container();
    this.particleContainer = new PIXI.Container();

    this.app.stage.addChild(this.backgroundContainer);
    this.app.stage.addChild(this.mapContainer);
    this.app.stage.addChild(this.itemContainer);
    this.app.stage.addChild(this.bubbleContainer);
    this.app.stage.addChild(this.flameContainer);
    this.app.stage.addChild(this.characterContainer);
    this.app.stage.addChild(this.particleContainer);

    this.drawBackground();
    this.drawMap();
    const localCharKey = this.isNetMode ? (this.netSelectedChars[this.netRole] || 'dao') : this.selectedChar;
    const config = CHARACTER_CONFIGS[localCharKey];
    
    let localX, localY, localDirY, localTeam;
    if (this.isNetMode) {
      if (this.netRole === 'p1') {
        localX = TILE_SIZE * 0.5 + 2;
        localY = TILE_SIZE * 0.5 + 2;
        localDirY = 1;
        localTeam = 'red';
      } else if (this.netRole === 'p2') {
        localX = TILE_SIZE * 0.5 + 2;
        localY = GAME_HEIGHT - TILE_SIZE * 0.5 - 2;
        localDirY = -1;
        localTeam = 'blue';
      } else if (this.netRole === 'p3') {
        localX = GAME_WIDTH - TILE_SIZE * 0.5 - 2;
        localY = GAME_HEIGHT - TILE_SIZE * 0.5 - 2;
        localDirY = -1;
        localTeam = 'red';
      } else if (this.netRole === 'p4') {
        localX = GAME_WIDTH - TILE_SIZE * 0.5 - 2;
        localY = TILE_SIZE * 0.5 + 2;
        localDirY = 1;
        localTeam = 'blue';
      }
    } else {
      localX = TILE_SIZE * 0.5 + 2;
      localY = TILE_SIZE * 0.5 + 2;
      localDirY = 1;
      localTeam = 'red';
    }

    this.player = {
      charKey: localCharKey,
      x: localX,
      y: localY,
      radius: TILE_SIZE * 0.38,
      speed: config.speed,
      maxBubbles: config.maxBubbles,
      bubbleLength: config.maxLen,
      itemSlot: null,
      hasPet: false,
      color: config.color,
      faceColor: config.faceColor,
      isCPU: false,
      state: 'normal',
      trapTimer: 0,
      graphics: new PIXI.Graphics(),
      placedCount: 0,
      dirX: 0,
      dirY: localDirY,
      team: localTeam
    };

    this.characterContainer.addChild(this.player.graphics);

    const playerStyle = new PIXI.TextStyle({
      fontFamily: 'Outfit',
      fontSize: 13,
      fontWeight: 'bold',
      fill: '#ffffff',
      stroke: this.player.team === 'red' ? '#ff3333' : '#3333ff',
      strokeThickness: 3.5,
      align: 'center'
    });
    this.player.countdownText = new PIXI.Text('', playerStyle);
    this.player.countdownText.anchor.set(0.5);
    this.player.countdownText.visible = false;
    this.characterContainer.addChild(this.player.countdownText);

    const overheadStyle1 = new PIXI.TextStyle({
      fontFamily: 'Outfit',
      fontSize: 12,
      fontWeight: '900',
      fill: '#ffffff',
      stroke: this.player.team === 'red' ? '#ff3333' : '#3333ff',
      strokeThickness: 3,
      align: 'center'
    });
    this.player.overheadText = new PIXI.Text(this.isNetMode ? this.netRole.toUpperCase() : '1P', overheadStyle1);
    this.player.overheadText.anchor.set(0.5, 1);
    this.characterContainer.addChild(this.player.overheadText);

    this.player.countdownText.interactive = true;
    this.player.countdownText.cursor = 'pointer';
    this.player.countdownText.on('pointerdown', () => {
      this.useActiveItem(this.player);
    });

    this.player.graphics.interactive = true;
    this.player.graphics.cursor = 'pointer';
    this.player.graphics.on('pointerdown', () => {
      this.useActiveItem(this.player);
    });

    this.player2 = null;
    this.player3 = null;
    this.player4 = null;
    this.netPlayersMap = {};
    this.netPlayersMap[this.netRole] = this.player;

    const spawnRemotePlayer = (role, idx) => {
      const charKey = this.netSelectedChars[role] || 'bazzi';
      const conf = CHARACTER_CONFIGS[charKey];
      
      let spawnX, spawnY, spawnDirY, spawnTeam;
      if (role === 'p1') {
        spawnX = TILE_SIZE * 0.5 + 2;
        spawnY = TILE_SIZE * 0.5 + 2;
        spawnDirY = 1;
        spawnTeam = 'red';
      } else if (role === 'p2') {
        spawnX = TILE_SIZE * 0.5 + 2;
        spawnY = GAME_HEIGHT - TILE_SIZE * 0.5 - 2;
        spawnDirY = -1;
        spawnTeam = 'blue';
      } else if (role === 'p3') {
        spawnX = GAME_WIDTH - TILE_SIZE * 0.5 - 2;
        spawnY = GAME_HEIGHT - TILE_SIZE * 0.5 - 2;
        spawnDirY = -1;
        spawnTeam = 'red';
      } else if (role === 'p4') {
        spawnX = GAME_WIDTH - TILE_SIZE * 0.5 - 2;
        spawnY = TILE_SIZE * 0.5 + 2;
        spawnDirY = 1;
        spawnTeam = 'blue';
      }

      const pObj = {
        charKey: charKey,
        role: role,
        x: spawnX,
        y: spawnY,
        radius: TILE_SIZE * 0.38,
        speed: conf.speed,
        maxBubbles: conf.maxBubbles,
        bubbleLength: conf.maxLen,
        itemSlot: null,
        hasPet: false,
        color: conf.color,
        faceColor: conf.faceColor,
        isCPU: false,
        state: 'normal',
        trapTimer: 0,
        graphics: new PIXI.Graphics(),
        placedCount: 0,
        dirX: 0,
        dirY: spawnDirY,
        team: spawnTeam
      };

      this.characterContainer.addChild(pObj.graphics);

      const pStyle = new PIXI.TextStyle({
        fontFamily: 'Outfit',
        fontSize: 13,
        fontWeight: 'bold',
        fill: '#ffffff',
        stroke: spawnTeam === 'red' ? '#ff3333' : '#3333ff',
        strokeThickness: 3.5,
        align: 'center'
      });
      pObj.countdownText = new PIXI.Text('', pStyle);
      pObj.countdownText.anchor.set(0.5);
      pObj.countdownText.visible = false;
      this.characterContainer.addChild(pObj.countdownText);

      const overheadStyle = new PIXI.TextStyle({
        fontFamily: 'Outfit',
        fontSize: 12,
        fontWeight: '900',
        fill: '#ffffff',
        stroke: spawnTeam === 'red' ? '#ff3333' : '#3333ff',
        strokeThickness: 3,
        align: 'center'
      });
      pObj.overheadText = new PIXI.Text(role.toUpperCase(), overheadStyle);
      pObj.overheadText.anchor.set(0.5, 1);
      this.characterContainer.addChild(pObj.overheadText);

      pObj.countdownText.interactive = true;
      pObj.countdownText.cursor = 'pointer';
      pObj.countdownText.on('pointerdown', () => {
        this.useActiveItem(pObj);
      });

      pObj.graphics.interactive = true;
      pObj.graphics.cursor = 'pointer';
      pObj.graphics.on('pointerdown', () => {
        this.useActiveItem(pObj);
      });

      return pObj;
    };

    if (this.isNetMode) {
      const remoteRoles = (this.netRolesInRoom || []).filter(r => r !== this.netRole);
      remoteRoles.forEach((role, idx) => {
        const pObj = spawnRemotePlayer(role, idx);
        if (idx === 0) this.player2 = pObj;
        else if (idx === 1) this.player3 = pObj;
        else if (idx === 2) this.player4 = pObj;
        this.netPlayersMap[role] = pObj;
      });
    } else if (this.is2PMode) {
      const config2 = CHARACTER_CONFIGS[this.selectedChar2 || 'bazzi'];
      this.player2 = {
        charKey: this.selectedChar2 || 'bazzi',
        x: TILE_SIZE * 0.5 + 2,
        y: GAME_HEIGHT - TILE_SIZE * 0.5 - 2,
        radius: TILE_SIZE * 0.38,
        speed: config2.speed,
        maxBubbles: config2.maxBubbles,
        bubbleLength: config2.maxLen,
        itemSlot: null,
        hasPet: false,
        color: config2.color,
        faceColor: config2.faceColor,
        isCPU: false,
        state: 'normal',
        trapTimer: 0,
        graphics: new PIXI.Graphics(),
        placedCount: 0,
        dirX: 0,
        dirY: -1,
        team: this.player2Team || 'red'
      };

      this.characterContainer.addChild(this.player2.graphics);

      const player2Style = new PIXI.TextStyle({
        fontFamily: 'Outfit',
        fontSize: 13,
        fontWeight: 'bold',
        fill: '#ffffff',
        stroke: this.player2.team === 'red' ? '#ff3333' : '#3333ff',
        strokeThickness: 3.5,
        align: 'center'
      });
      this.player2.countdownText = new PIXI.Text('', player2Style);
      this.player2.countdownText.anchor.set(0.5);
      this.player2.countdownText.visible = false;
      this.characterContainer.addChild(this.player2.countdownText);

      const overheadStyle2 = new PIXI.TextStyle({
        fontFamily: 'Outfit',
        fontSize: 12,
        fontWeight: '900',
        fill: '#ffffff',
        stroke: this.player2.team === 'red' ? '#ff3333' : '#3333ff',
        strokeThickness: 3,
        align: 'center'
      });
      this.player2.overheadText = new PIXI.Text('2P', overheadStyle2);
      this.player2.overheadText.anchor.set(0.5, 1);
      this.characterContainer.addChild(this.player2.overheadText);

      this.player2.countdownText.interactive = true;
      this.player2.countdownText.cursor = 'pointer';
      this.player2.countdownText.on('pointerdown', () => {
        this.useActiveItem(this.player2);
      });

      this.player2.graphics.interactive = true;
      this.player2.graphics.cursor = 'pointer';
      this.player2.graphics.on('pointerdown', () => {
        this.useActiveItem(this.player2);
      });
    }

    const player1HudEl = document.getElementById('player1-hud');
    if (player1HudEl) {
      player1HudEl.className = 'player-profile team-red';
      const nameEl = player1HudEl.querySelector('.profile-name');
      if (nameEl) {
        const redCharName = CHARACTER_CONFIGS[this.isNetMode ? (this.netSelectedChars[this.netRole] || 'dao') : this.selectedChar].name;
        nameEl.innerHTML = this.isNetMode ? `<span style="color: #ff8080; font-weight: bold;">[紅隊]</span> ${this.netRole.toUpperCase()} (${redCharName})` : `<span style="color: #ff8080; font-weight: bold;">[紅隊]</span> ${redCharName}`;
      }
    }

    const player2HudEl = document.getElementById('player2-hud');
    if (player2HudEl) {
      if (this.is2PMode && this.player2) {
        player2HudEl.style.display = 'flex';
        const teamColor = this.player2.team === 'red' ? '#ff8080' : '#809fff';
        const teamText = this.player2.team === 'red' ? '紅隊' : '藍隊';
        player2HudEl.className = `player-profile team-${this.player2.team}`;
        const nameEl = player2HudEl.querySelector('.profile-name');
        if (nameEl) {
          const blueCharName = CHARACTER_CONFIGS[this.isNetMode ? (this.netSelectedChars[this.player2.role] || 'bazzi') : (this.selectedChar2 || 'bazzi')].name;
          nameEl.innerHTML = this.isNetMode ? `<span style="color: ${teamColor}; font-weight: bold;">[${teamText}]</span> ${this.player2.role.toUpperCase()} (${blueCharName})` : `<span style="color: ${teamColor}; font-weight: bold;">[${teamText}]</span> ${blueCharName}`;
        }
      } else {
        player2HudEl.style.display = 'none';
      }
    }

    this.cpus = [];
    const selectedChars = this.is2PMode ? [this.selectedChar, this.selectedChar2 || 'bazzi'] : [this.selectedChar];
    const availableCPUChars = Object.keys(CHARACTER_CONFIGS).filter(char => !selectedChars.includes(char));
    const finalCPUChars = availableCPUChars.length > 0 ? availableCPUChars : Object.keys(CHARACTER_CONFIGS);

    // Skip bottom-left start position if P2 is active
    const activeCPUPositions = [];
    for (let pIdx = 0; pIdx < CPU_START_POSITIONS.length; pIdx++) {
      if (this.is2PMode && pIdx === 2) continue;
      activeCPUPositions.push(CPU_START_POSITIONS[pIdx]);
    }

    for (let i = 0; i < this.cpuCount; i++) {
      const cpuChar = finalCPUChars[i % finalCPUChars.length];
      const cpuConfig = CHARACTER_CONFIGS[cpuChar];
      const pos = activeCPUPositions[i % activeCPUPositions.length];
      const cpu = {
        id: i + 1,
        charKey: cpuChar,
        x: pos.x,
        y: pos.y,
        radius: TILE_SIZE * 0.38,
        speed: cpuConfig.speed,
        maxBubbles: cpuConfig.maxBubbles + 1, // CPU gets a tiny buff for extra challenge
        bubbleLength: cpuConfig.maxLen,
        itemSlot: null, // Holds either 'needle' or 'dart'
        hasPet: false,
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

      const cpuStyle = new PIXI.TextStyle({
        fontFamily: 'Outfit',
        fontSize: 13,
        fontWeight: 'bold',
        fill: '#ffffff',
        stroke: cpu.team === 'red' ? '#ff3333' : '#3333ff',
        strokeThickness: 3.5,
        align: 'center'
      });
      cpu.countdownText = new PIXI.Text('', cpuStyle);
      cpu.countdownText.anchor.set(0.5);
      cpu.countdownText.visible = false;
      this.characterContainer.addChild(cpu.countdownText);

      this.cpus.push(cpu);
    }

    const cpuHudContainer = document.getElementById('cpu-hud-container');
    cpuHudContainer.innerHTML = `
      <div class="team-remaining-hud">
        <div class="team-hud-badge team-red">
          <span class="team-dot">🔴</span>
          <span class="team-name">紅隊</span>
          <span class="team-count-val" id="hud-red-alive-count">0</span>
        </div>
        <div class="team-hud-separator"></div>
        <div class="team-hud-badge team-blue">
          <span class="team-dot">🔵</span>
          <span class="team-name">藍隊</span>
          <span class="team-count-val" id="hud-blue-alive-count">0</span>
        </div>
      </div>
    `;

    this.updateHUD();

    this.timeLeft = 180;
    this.gameStartTime = Date.now();
    this.gameActive = true;

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (!this.gameActive || this.gameEnding) return;
      this.timeLeft--;
      this.updateTimerDisplay();
      if (this.timeLeft <= 0) {
        this.endGame('draw', 'time_out');
      }
    }, 1000);
    this.updateTimerDisplay();

    if (this.app) {
      this.app.ticker.remove(this.update, this);
    }
    this.app.ticker.add(this.update, this);
  }

  updateTimerDisplay() {
    const min = Math.floor(this.timeLeft / 60).toString().padStart(2, '0');
    const sec = (this.timeLeft % 60).toString().padStart(2, '0');
    this.timerDisplay.textContent = `${min}:${sec}`;
  }

  updateHUD() {
    if (!this.player) return;

    let p1Obj = null;
    let p2Obj = null;
    let p3Obj = null;
    let p4Obj = null;

    if (this.isNetMode) {
      p1Obj = this.netPlayersMap['p1'];
      p2Obj = this.netPlayersMap['p2'];
      p3Obj = this.netPlayersMap['p3'];
      p4Obj = this.netPlayersMap['p4'];
    } else {
      p1Obj = this.player;
      p2Obj = this.player2;
    }

    const p1Char = this.isNetMode ? (this.netSelectedChars['p1'] || 'dao') : this.selectedChar;
    const p2Char = this.isNetMode ? (this.netSelectedChars['p2'] || 'bazzi') : (this.selectedChar2 || 'bazzi');
    const p3Char = this.isNetMode ? (this.netSelectedChars['p3'] || 'marid') : 'marid';
    const p4Char = this.isNetMode ? (this.netSelectedChars['p4'] || 'dao') : 'dao';

    this.updateSinglePlayerHUD(p1Obj, 'player1', 'hud-p', p1Char, '#ff8080', '紅隊', 'P1');
    this.updateSinglePlayerHUD(p2Obj, 'player2', 'hud-p2', p2Char, '#809fff', '藍隊', 'P2');
    this.updateSinglePlayerHUD(p3Obj, 'player3', 'hud-p3', p3Char, '#ff8080', '紅隊', 'P3');
    this.updateSinglePlayerHUD(p4Obj, 'player4', 'hud-p4', p4Char, '#809fff', '藍隊', 'P4');

    const chars = this.getCharacters();
    const redAlive = chars.filter(c => c.team === 'red' && c.state !== 'dead' && c.state !== 'dying').length;
    const blueAlive = chars.filter(c => c.team === 'blue' && c.state !== 'dead' && c.state !== 'dying').length;

    const redAliveEl = document.getElementById('hud-red-alive-count');
    const blueAliveEl = document.getElementById('hud-blue-alive-count');
    if (redAliveEl) redAliveEl.textContent = redAlive;
    if (blueAliveEl) blueAliveEl.textContent = blueAlive;
  }

  updateSinglePlayerHUD(playerObj, prefix, statsPrefix, charKey, teamColor, teamText, label) {
    const bubbleEl = document.getElementById(`${statsPrefix}-bubble`);
    const lenEl = document.getElementById(`${statsPrefix}-len`);
    const speedEl = document.getElementById(`${statsPrefix}-speed`);
    const itemEl = document.getElementById(`${statsPrefix}-item`);
    const petEl = document.getElementById(`${statsPrefix}-pet`);
    const avatarEl = document.getElementById(prefix === 'player1' ? 'player-hud-avatar' : `${prefix}-hud-avatar`);
    const profileEl = document.getElementById(`${prefix}-hud`);

    if (!playerObj) {
      if (profileEl) profileEl.style.display = 'none';
      return;
    }

    if (profileEl) profileEl.style.display = 'flex';
    if (bubbleEl) bubbleEl.textContent = `🎈 ${playerObj.placedCount}/${playerObj.maxBubbles}`;
    if (lenEl) lenEl.textContent = `📏 ${playerObj.bubbleLength}`;
    if (speedEl) speedEl.textContent = `⚡ ${playerObj.speed.toFixed(1)}`;

    if (itemEl) {
      let itemText = '🎒';
      itemEl.classList.remove('has-item');
      if (playerObj.itemSlot === 'needle') {
        itemText = '📍';
        itemEl.classList.add('has-item');
      } else if (playerObj.itemSlot === 'dart') {
        itemText = '🎯';
        itemEl.classList.add('has-item');
      } else if (playerObj.itemSlot === 'spring_shoe') {
        itemText = '🦘';
        itemEl.classList.add('has-item');
      }
      itemEl.textContent = itemText;
    }

    if (petEl) {
      let petText = '🐱';
      if (playerObj.hasPet === 'fast_turtle') petText = '🐢💨';
      else if (playerObj.hasPet === 'slow_turtle') petText = '🐢💤';
      petEl.textContent = petText;
      petEl.classList.toggle('has-pet', !!playerObj.hasPet);
    }

    if (avatarEl) {
      avatarEl.className = 'profile-avatar';
      avatarEl.classList.add(charKey === 'dao' ? 'dao-color' : (charKey === 'bazzi' ? 'bazzi-color' : 'marid-color'));
    }

    if (profileEl) {
      profileEl.className = `player-profile team-${playerObj.team}`;
      if (playerObj.state === 'dead' || playerObj.state === 'dying') {
        profileEl.classList.add('eliminated');
      } else {
        profileEl.classList.remove('eliminated');
      }
      const nameEl = profileEl.querySelector('.profile-name');
      if (nameEl) {
        const charName = CHARACTER_CONFIGS[charKey] ? CHARACTER_CONFIGS[charKey].name : charKey;
        nameEl.innerHTML = `<span style="color: ${teamColor}; font-weight: bold;">[${teamText}]</span> ${label} (${charName})`;
      }
    }

    if (playerObj === this.player) {
      this.updateMobileHUD(playerObj);
    }
  }

  updateMobileHUD(localPlayer) {
    const needleBtnEmoji = document.getElementById('btn-needle-emoji');
    const needleBtnLabel = document.getElementById('btn-needle-label');
    if (needleBtnEmoji && needleBtnLabel) {
      if (localPlayer.itemSlot === 'needle') {
        needleBtnEmoji.textContent = '📍';
        needleBtnLabel.textContent = '自救針';
      } else if (localPlayer.itemSlot === 'dart') {
        needleBtnEmoji.textContent = '🎯';
        needleBtnLabel.textContent = '飛針';
      } else if (localPlayer.itemSlot === 'spring_shoe') {
        needleBtnEmoji.textContent = '🦘';
        needleBtnLabel.textContent = '彈簧鞋';
      } else {
        needleBtnEmoji.textContent = '🎒';
        needleBtnLabel.textContent = '道具';
      }
    }

    const needleBtn = document.getElementById('btn-needle');
    if (needleBtn) {
      needleBtn.classList.remove('has-needle', 'has-dart', 'has-spring-shoe');
      if (localPlayer.itemSlot === 'needle') {
        needleBtn.classList.add('has-needle');
      } else if (localPlayer.itemSlot === 'dart') {
        needleBtn.classList.add('has-dart');
      } else if (localPlayer.itemSlot === 'spring_shoe') {
        needleBtn.classList.add('has-spring-shoe');
      }

      const canUseNeedle = localPlayer.itemSlot === 'needle' && localPlayer.state === 'trapped';
      const canUseDart = localPlayer.itemSlot === 'dart' && localPlayer.state === 'normal';
      const canUseSpringShoe = localPlayer.itemSlot === 'spring_shoe' && localPlayer.state === 'normal';
      if (canUseNeedle || canUseDart || canUseSpringShoe) {
        needleBtn.classList.add('can-use');
      } else {
        needleBtn.classList.remove('can-use');
      }
    }
  }

  drawBackground() {
    this.backgroundContainer.removeChildren();
    const bg = new PIXI.Graphics();
    const mapConf = MAPS_CONFIG[this.currentMapKey || this.selectedMap];
    
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
    const mapConf = MAPS_CONFIG[this.currentMapKey || this.selectedMap];

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

  useActiveItem(player = this.player) {
    if (!this.gameActive || !player || this.gameEnding) return;
    
    if (player.itemSlot === 'needle') {
      if (player.state === 'trapped') {
        player.itemSlot = null;
        player.state = 'normal';
        sfx.playNeedle();
        this.updateHUD();
      }
    } else if (player.itemSlot === 'dart') {
      if (player.state === 'normal') {
        player.itemSlot = null;
        sfx.playNeedle(); // Play shot sound
        this.updateHUD();

        let dx = player.dirX;
        let dy = player.dirY;
        if (dx === 0 && dy === 0) {
          dy = 1;
        }

        const dart = {
          x: player.x,
          y: player.y,
          dirX: dx,
          dirY: dy,
          graphics: new PIXI.Graphics(),
          owner: player,
          speed: 360
        };
        this.app.stage.addChild(dart.graphics);
        this.dartsProjectiles.push(dart);
      }
    } else if (player.itemSlot === 'spring_shoe') {
      if (player.state === 'normal' && !player.isJumping) {
        let dx = player.dirX;
        let dy = player.dirY;
        if (dx === 0 && dy === 0) {
          dy = 1;
        }
        const targetX = player.x + dx * TILE_SIZE;
        const targetY = player.y + dy * TILE_SIZE;
        const targetCol = Math.floor(targetX / TILE_SIZE);
        const targetRow = Math.floor(targetY / TILE_SIZE);

        const hasBomb = this.bubbles.some(b => b.col === targetCol && b.row === targetRow);
        if (targetCol >= 0 && targetCol < GRID_COLS && targetRow >= 0 && targetRow < GRID_ROWS && 
            this.grid[targetRow][targetCol] === 0 && !hasBomb) {
          player.itemSlot = null;
          sfx.playJump();
          this.updateHUD();

          player.isJumping = true;
          player.jumpStartX = player.x;
          player.jumpStartY = player.y;
          player.jumpEndX = targetCol * TILE_SIZE + TILE_SIZE / 2;
          player.jumpEndY = targetRow * TILE_SIZE + TILE_SIZE / 2;
          player.jumpProgress = 0;
          player.jumpDuration = 0.4;
        } else {
          this.showFloatingText(player.x, player.y - 20, "BLOCKED!", 0xff3333);
        }
      }
    }

    if (this.isNetMode && player === this.player) {
      this.sendNetMessage({
        type: 'use_item'
      });
    }
  }

  handleKeyDown(e) {
    // Ignore gameplay key inputs if they are targeted at HTML button controls (e.g. menu buttons)
    if (e.target && e.target.tagName === 'BUTTON') {
      return;
    }

    if (e.code === 'Space' || e.code === 'Enter' || e.code === 'Slash') {
      e.preventDefault();
    }
    
    this.keys[e.code] = true;

    // Menu navigation keys when game is not active (e.g., lobby, pause, game-over screen)
    // This supports standard TV remote controllers (which send keyboard events) and keyboards.
    if (!this.gameActive) {
      const moveUp = e.code === 'ArrowUp' || e.code === 'KeyW';
      const moveDown = e.code === 'ArrowDown' || e.code === 'KeyS';
      const moveLeft = e.code === 'ArrowLeft' || e.code === 'KeyA';
      const moveRight = e.code === 'ArrowRight' || e.code === 'KeyD';
      const doClick = e.code === 'Enter' || e.code === 'Space';
      const doBack = e.code === 'Escape' || e.code === 'Backspace';
      const doTogglePause = false;

      if (moveUp || moveDown || moveLeft || moveRight || doClick || doBack) {
        this.handleMenuGamepadInput({ moveUp, moveDown, moveLeft, moveRight, doClick, doBack, doTogglePause });
        e.preventDefault();
        return;
      }
    }

    // Player 1 use item
    if (e.code === 'KeyN' || e.code === 'KeyF' || e.code === 'KeyE' || e.code === 'KeyJ') {
      this.useActiveItem(this.player);
    }


    // Player 2 use item (disabled in net mode as player2 is remote)
    if (this.is2PMode && this.player2 && !this.isNetMode && (e.code === 'KeyM' || e.code === 'Period' || e.code === 'ShiftRight' || e.code === 'KeyL')) {
      this.useActiveItem(this.player2);
    }

    if (e.code === 'Escape') {
      if (this.isNetMode) {
        this.showToast('ℹ️ 區域連線模式下無法暫停遊戲');
        return;
      }
      if (this.gameActive && !this.gameEnding) {
        sfx.playClick();
        this.gameActive = false;
        if (this.pauseModal) {
          this.pauseModal.classList.add('active');
          this.resetMenuFocus();
        }
      } else if (!this.gameActive && this.pauseModal && this.pauseModal.classList.contains('active')) {
        sfx.playClick();
        this.gameActive = true;
        this.pauseModal.classList.remove('active');
        this.clearMenuFocus();
        // Clear focus so keypresses don't keep triggering button click
        if (document.activeElement) {
          document.activeElement.blur();
        }
        // Sync gamepad states to prevent input propagation on resume
        if (this.prevGamepadStates) {
          this.prevGamepadStates.forEach(state => {
            state.placeBubblePressed = true;
            state.useItemPressed = true;
          });
        }
      }
    }

    if (e.code === 'Space' && this.gameActive && this.player && this.player.state === 'normal') {
      this.placeBubble(this.player);
    }

    // Player 2 place bubble (disabled in net mode as player2 is remote)
    if (this.is2PMode && this.player2 && !this.isNetMode && this.gameActive && this.player2.state === 'normal') {
      if (e.code === 'Enter' || e.code === 'Slash' || e.code === 'NumpadEnter') {
        this.placeBubble(this.player2);
      }
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
    const characters = this.getCharacters();
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

    if (this.isNetMode && character === this.player) {
      this.sendNetMessage({
        type: 'place_bubble'
      });
    }
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
    if (char.isJumping) return;
    if (char.state !== 'normal') return;

    const prevX = char.x;
    const prevY = char.y;
    const slideSpeed = char.speed * 0.8 * (this.cappedDelta || 1.0);

    if (dx !== 0) {
      char.dirX = Math.sign(dx);
      char.dirY = 0;
    } else if (dy !== 0) {
      char.dirX = 0;
      char.dirY = Math.sign(dy);
    }

    if (char.hasKickShoe && dx !== 0) {
      const dirX = Math.sign(dx);
      const checkCol = Math.floor((char.x + dirX * char.radius * 0.95) / TILE_SIZE);
      const checkRow = Math.floor(char.y / TILE_SIZE);
      const aheadBubble = this.bubbles.find(b => b.col === checkCol && b.row === checkRow);
      if (aheadBubble && !aheadBubble.isSliding) {
        this.kickBubble(aheadBubble, dirX, 0);
      }
    }
    if (char.hasKickShoe && dy !== 0) {
      const dirY = Math.sign(dy);
      const checkCol = Math.floor(char.x / TILE_SIZE);
      const checkRow = Math.floor((char.y + dirY * char.radius * 0.95) / TILE_SIZE);
      const aheadBubble = this.bubbles.find(b => b.col === checkCol && b.row === checkRow);
      if (aheadBubble && !aheadBubble.isSliding) {
        this.kickBubble(aheadBubble, 0, dirY);
      }
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
          char.y -= Math.sign(offset) * Math.min(Math.abs(offset), slideSpeed);
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
          char.x -= Math.sign(offset) * Math.min(Math.abs(offset), slideSpeed);
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
      item.graphics.destroy({ children: true });
      this.items.splice(itemIndex, 1);

      if (this.isNetMode && char === this.player) {
        this.sendNetMessage({
          type: 'collect_item',
          col,
          row
        });
      }
    }
  }

  mountPet(char, petType) {
    if (char.hasPet) {
      this.dismountPet(char);
    }
    char.speedBeforePet = char.speed;
    char.hasPet = petType;
    if (petType === 'fast_turtle') {
      char.speed = 4.5;
    } else if (petType === 'slow_turtle') {
      char.speed = 1.2;
    } else {
      // Cat: speed remains unchanged
      char.speed = char.speedBeforePet;
    }
  }

  dismountPet(char) {
    if (char.hasPet) {
      char.hasPet = false;
      if (char.speedBeforePet !== undefined) {
        char.speed = char.speedBeforePet;
        delete char.speedBeforePet;
      }
    }
  }

  collectItem(char, item) {
    sfx.playItemCollect();
    if (item.type === ITEM_TYPES.BUBBLE_UP) {
      char.maxBubbles = Math.min(6, char.maxBubbles + 1);
    } else if (item.type === ITEM_TYPES.LENGTH_UP) {
      char.bubbleLength = Math.min(6, char.bubbleLength + 1);
    } else if (item.type === ITEM_TYPES.SPEED_UP) {
      if (char.speedBeforePet !== undefined) {
        char.speedBeforePet = Math.min(5.0, char.speedBeforePet + 0.3);
      } else {
        char.speed = Math.min(5.0, char.speed + 0.3);
      }
    } else if (item.type === ITEM_TYPES.NEEDLE) {
      char.itemSlot = 'needle'; // overwrite current slot item
    } else if (item.type === ITEM_TYPES.DART) {
      char.itemSlot = 'dart'; // overwrite current slot item
    } else if (item.type === ITEM_TYPES.PET) {
      this.mountPet(char, 'cat');
    } else if (item.type === ITEM_TYPES.PET_FAST_TURTLE) {
      this.mountPet(char, 'fast_turtle');
    } else if (item.type === ITEM_TYPES.PET_SLOW_TURTLE) {
      this.mountPet(char, 'slow_turtle');
    } else if (item.type === ITEM_TYPES.KICK_SHOE) {
      char.hasKickShoe = true;
      this.showFloatingText(char.x, char.y - 20, "KICK SHOES! 👟", 0x33ff99);
    } else if (item.type === ITEM_TYPES.SPRING_SHOE) {
      char.itemSlot = 'spring_shoe';
    } else if (item.type === ITEM_TYPES.DEVIL) {
      char.devilTimer = 5.0;
      this.showFloatingText(char.x, char.y - 20, "CONFUSED! 😈", 0xff3333);
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
    this.triggerScreenShake(0.22, 5.5);
  }

  destroyCrate(col, row, itemTypeOverride = undefined) {
    if (this.grid[row][col] !== 2) {
      if (itemTypeOverride !== undefined && itemTypeOverride !== null) {
        const hasItem = this.items.some(it => it.col === col && it.row === row);
        if (!hasItem) {
          const item = {
            col,
            row,
            type: itemTypeOverride,
            graphics: new PIXI.Graphics(),
            pulsePhase: 0
          };
          this.drawItem(item);
          this.itemContainer.addChild(item.graphics);
          this.items.push(item);
        }
      }
      return;
    }

    this.grid[row][col] = 0;
    this.cratesDestroyedCount++;
    this.drawMap();
    this.spawnCrateParticles(col, row);

    let chosenType = null;
    if (itemTypeOverride !== undefined) {
      chosenType = itemTypeOverride;
    } else {
      if (this.isNetMode && this.netRole !== 'p1') {
        return; // Client waits for host to sync item
      }
      const key = `${col}_${row}`;
      if (this.crateItems && this.crateItems[key] !== undefined) {
        chosenType = this.crateItems[key];
      }
    }

    if (chosenType !== null) {
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

    if (this.isNetMode && this.netRole === 'p1') {
      this.sendNetMessage({
        type: 'destroy_crate',
        col,
        row,
        itemType: chosenType
      });
    }
  }

  drawItem(item) {
    const g = item.graphics;
    g.clear();
    const x = item.col * TILE_SIZE + TILE_SIZE / 2;
    const y = item.row * TILE_SIZE + TILE_SIZE / 2;
    const scale = 1 + 0.08 * Math.sin(item.pulsePhase);
    
    // Translucent outer bubble
    g.beginFill(0xffffff, 0.2);
    g.drawCircle(x, y, (TILE_SIZE * 0.38) * scale);
    g.endFill();

    g.lineStyle(1.5, 0xffffff, 0.6);
    g.drawCircle(x, y, (TILE_SIZE * 0.35) * scale);
    g.lineStyle(0);

    // Inner highlight for glass effect
    g.beginFill(0xffffff, 0.08);
    g.drawCircle(x - 2 * scale, y - 2 * scale, (TILE_SIZE * 0.28) * scale);
    g.endFill();

    if (!item.textChild) {
      let emoji = '❓';
      if (item.type === ITEM_TYPES.BUBBLE_UP) emoji = '🎈';
      else if (item.type === ITEM_TYPES.LENGTH_UP) emoji = '📏';
      else if (item.type === ITEM_TYPES.SPEED_UP) emoji = '⚡';
      else if (item.type === ITEM_TYPES.NEEDLE) emoji = '📍';
      else if (item.type === ITEM_TYPES.DART) emoji = '🎯';
      else if (item.type === ITEM_TYPES.PET) emoji = '🐱';
      else if (item.type === ITEM_TYPES.PET_FAST_TURTLE) emoji = '🐢💨';
      else if (item.type === ITEM_TYPES.PET_SLOW_TURTLE) emoji = '🐢💤';
      else if (item.type === ITEM_TYPES.KICK_SHOE) emoji = '👟';
      else if (item.type === ITEM_TYPES.SPRING_SHOE) emoji = '🦘';
      else if (item.type === ITEM_TYPES.DEVIL) emoji = '😈';

      const style = new PIXI.TextStyle({
        fontSize: 22,
        align: 'center'
      });
      item.textChild = new PIXI.Text(emoji, style);
      item.textChild.anchor.set(0.5);
      g.addChild(item.textChild);
    }

    item.textChild.x = x;
    item.textChild.y = y;
    item.textChild.scale.set(scale);
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
      const item = this.items[itemIndex];
      this.itemContainer.removeChild(item.graphics);
      item.graphics.destroy({ children: true });
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
      // CPU rescue logic: If CPU is trapped, and has needles in itemSlot, use one after 0.6 seconds!
      if (cpu.state === 'trapped' && cpu.itemSlot === 'needle' && cpu.trapTimer < 4.4) {
        cpu.itemSlot = null;
        cpu.state = 'normal';
        sfx.playNeedle();
        this.updateHUD();
      }
      return;
    }

    // CPU AI Dart usage: if CPU has a dart in itemSlot, and there's a bubble in front of it in its moving direction, it throws it
    if (cpu.itemSlot === 'dart' && Math.random() < 0.03) {
      let dx = cpu.dirX;
      let dy = cpu.dirY;
      if (dx !== 0 || dy !== 0) {
        const frontCol = Math.floor(cpu.x / TILE_SIZE) + dx;
        const frontRow = Math.floor(cpu.y / TILE_SIZE) + dy;
        if (frontCol >= 0 && frontCol < GRID_COLS && frontRow >= 0 && frontRow < GRID_ROWS) {
          const hasBubble = this.bubbles.some(b => b.col === frontCol && b.row === frontRow);
          if (hasBubble) {
            cpu.itemSlot = null;
            sfx.playNeedle();
            this.updateHUD();

            const dart = {
              x: cpu.x,
              y: cpu.y,
              dirX: dx,
              dirY: dy,
              graphics: new PIXI.Graphics(),
              owner: cpu,
              speed: 360
            };
            this.app.stage.addChild(dart.graphics);
            this.dartsProjectiles.push(dart);
          }
        }
      }
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

        const stepSpeed = cpu.speed * (this.cappedDelta || 1.0);

        if (nextTile.col !== currentTileCol) {
          // Move horizontally, align vertically first
          const currentTileCenterY = currentTileRow * TILE_SIZE + TILE_SIZE / 2;
          const alignDiffY = currentTileCenterY - cpu.y;
          if (Math.abs(alignDiffY) > 2) {
            dy = Math.sign(alignDiffY) * Math.min(Math.abs(alignDiffY), stepSpeed);
          } else {
            cpu.y = currentTileCenterY; // snap
            dx = Math.sign(diffX) * Math.min(Math.abs(diffX), stepSpeed);
          }
        } else if (nextTile.row !== currentTileRow) {
          // Move vertically, align horizontally first
          const currentTileCenterX = currentTileCol * TILE_SIZE + TILE_SIZE / 2;
          const alignDiffX = currentTileCenterX - cpu.x;
          if (Math.abs(alignDiffX) > 2) {
            dx = Math.sign(alignDiffX) * Math.min(Math.abs(alignDiffX), stepSpeed);
          } else {
            cpu.x = currentTileCenterX; // snap
            dy = Math.sign(diffY) * Math.min(Math.abs(diffY), stepSpeed);
          }
        } else {
          // Same tile, just slight adjustment
          if (Math.abs(diffX) > 2) dx = Math.sign(diffX) * Math.min(Math.abs(diffX), stepSpeed);
          if (Math.abs(diffY) > 2) dy = Math.sign(diffY) * Math.min(Math.abs(diffY), stepSpeed);
        }

        if (cpu.devilTimer && cpu.devilTimer > 0) {
          dx = -dx;
          dy = -dy;
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
        const teammates = this.getCharacters().filter(c => c.team === cpu.team && c !== cpu);
        const enemies = this.getCharacters().filter(c => c.team !== cpu.team && c.state !== 'dead');

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
          
          // AI Intelligence Optimization: Avoid friendly fire. Do not place bubble if teammate is in the blast radius.
          const activeTeammates = teammates.filter(t => t.state !== 'dead' && t.state !== 'dying');
          const teammateInDanger = activeTeammates.some(t => {
            const tc = Math.floor(t.x / TILE_SIZE);
            const tr = Math.floor(t.y / TILE_SIZE);
            return hypotheticalDanger.some(z => z.col === tc && z.row === tr);
          });

          if (!teammateInDanger) {
            const tempBubbles = [...dangerZones, ...hypotheticalDanger];
            const escapeTest = this.findClosestSafeTile(cpuCol, cpuRow, tempBubbles);
            if (escapeTest && escapeTest.path.length > 0) {
              this.placeBubble(cpu);
              cpu.placeCooldown = 2.0; // Prevent spamming
              cpu.aiState = 'escape';
              cpu.movePath = escapeTest.path;
            }
          }
        }

        // If patrolling and path completed, find next target
        if (cpu.movePath.length === 0) {
          if (targetCol === null) {
            // Fallback to player
            let fallbackPlayer = this.player;
            if (this.is2PMode && this.player2 && this.player2.state !== 'dead') {
              if (this.player.state === 'dead') {
                fallbackPlayer = this.player2;
              } else {
                const dist1 = Math.abs(cpuCol - Math.floor(this.player.x / TILE_SIZE)) + Math.abs(cpuRow - Math.floor(this.player.y / TILE_SIZE));
                const dist2 = Math.abs(cpuCol - Math.floor(this.player2.x / TILE_SIZE)) + Math.abs(cpuRow - Math.floor(this.player2.y / TILE_SIZE));
                if (dist2 < dist1) {
                  fallbackPlayer = this.player2;
                }
              }
            }
            targetCol = Math.floor(fallbackPlayer.x / TILE_SIZE);
            targetRow = Math.floor(fallbackPlayer.y / TILE_SIZE);
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

    // Cap delta to prevent massive speed jumps/teleportation during lag spikes or tab sleep
    this.cappedDelta = Math.min(delta, 3.0);
    const dt = this.cappedDelta / 60;

    // Poll physical gamepads/remotes
    this.pollGamepads();

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
    let player2Dx = 0;
    let player2Dy = 0;
    
    if (!this.gameEnding) {
      if (this.isNetMode) {
        // Network mode: Local player controls (WASD and Arrow keys)
        if (this.keys['KeyW'] || this.keys['ArrowUp']) playerDy = -this.player.speed;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) playerDy = this.player.speed;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) playerDx = -this.player.speed;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) playerDx = this.player.speed;

        // Local player Gamepad override
        if (this.gamepadInputs && this.gamepadInputs[0]) {
          const gp1 = this.gamepadInputs[0];
          if (gp1.dx !== 0 || gp1.dy !== 0) {
            playerDx = gp1.dx * this.player.speed;
            playerDy = gp1.dy * this.player.speed;
          }
        }
        // Player 2 is remote and controlled via network messages; no local keyboard/gamepad overrides
      } else if (this.is2PMode) {
        // Player 1 keyboard controls
        if (this.keys['KeyW']) playerDy = -this.player.speed;
        if (this.keys['KeyS']) playerDy = this.player.speed;
        if (this.keys['KeyA']) playerDx = -this.player.speed;
        if (this.keys['KeyD']) playerDx = this.player.speed;

        // Player 1 Gamepad override
        if (this.gamepadInputs && this.gamepadInputs[0]) {
          const gp1 = this.gamepadInputs[0];
          if (gp1.dx !== 0 || gp1.dy !== 0) {
            playerDx = gp1.dx * this.player.speed;
            playerDy = gp1.dy * this.player.speed;
          }
        }

        // Player 2 keyboard controls
        if (this.player2) {
          if (this.keys['ArrowUp']) player2Dy = -this.player2.speed;
          if (this.keys['ArrowDown']) player2Dy = this.player2.speed;
          if (this.keys['ArrowLeft']) player2Dx = -this.player2.speed;
          if (this.keys['ArrowRight']) player2Dx = this.player2.speed;

          // Player 2 Gamepad override
          if (this.gamepadInputs && this.gamepadInputs[1]) {
            const gp2 = this.gamepadInputs[1];
            if (gp2.dx !== 0 || gp2.dy !== 0) {
              player2Dx = gp2.dx * this.player2.speed;
              player2Dy = gp2.dy * this.player2.speed;
            }
          }
        }
      } else {
        // Single player mode keyboard controls
        if (this.keys['KeyW'] || this.keys['ArrowUp']) playerDy = -this.player.speed;
        if (this.keys['KeyS'] || this.keys['ArrowDown']) playerDy = this.player.speed;
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) playerDx = -this.player.speed;
        if (this.keys['KeyD'] || this.keys['ArrowRight']) playerDx = this.player.speed;

        // Player 1 Gamepad override
        if (this.gamepadInputs && this.gamepadInputs[0]) {
          const gp1 = this.gamepadInputs[0];
          if (gp1.dx !== 0 || gp1.dy !== 0) {
            playerDx = gp1.dx * this.player.speed;
            playerDy = gp1.dy * this.player.speed;
          }
        }
      }

      // Keyboard input normalization (skip if using analog gamepad inputs which are already normalized)
      if (this.is2PMode) {
        if (!this.gamepadInputs || !this.gamepadInputs[0] || (this.gamepadInputs[0].dx === 0 && this.gamepadInputs[0].dy === 0)) {
          if (playerDx !== 0 && playerDy !== 0) {
            playerDx *= 0.7071;
            playerDy *= 0.7071;
          }
        }
        if (this.player2 && (!this.gamepadInputs || !this.gamepadInputs[1] || (this.gamepadInputs[1].dx === 0 && this.gamepadInputs[1].dy === 0))) {
          if (player2Dx !== 0 && player2Dy !== 0) {
            player2Dx *= 0.7071;
            player2Dy *= 0.7071;
          }
        }
      } else {
        if (!this.gamepadInputs || !this.gamepadInputs[0] || (this.gamepadInputs[0].dx === 0 && this.gamepadInputs[0].dy === 0)) {
          if (playerDx !== 0 && playerDy !== 0) {
            playerDx *= 0.7071;
            playerDy *= 0.7071;
          }
        }
      }
    }

    if (this.player && this.player.devilTimer > 0) {
      playerDx = -playerDx;
      playerDy = -playerDy;
    }
    this.moveCharacter(this.player, playerDx * this.cappedDelta, playerDy * this.cappedDelta);

    if (this.is2PMode && this.player2) {
      if (this.player2.devilTimer > 0) {
        player2Dx = -player2Dx;
        player2Dy = -player2Dy;
      }
      this.moveCharacter(this.player2, player2Dx * this.cappedDelta, player2Dy * this.cappedDelta);
    }

    if (this.cpus && !this.gameEnding) {
      for (const cpu of this.cpus) {
        this.updateCPUAI(cpu, dt);
      }
    }

    this.updateCharacterStates(this.player, dt);
    if (this.player2) {
      this.updateCharacterStates(this.player2, dt);
    }
    if (this.player3) {
      this.updateCharacterStates(this.player3, dt);
    }
    if (this.player4) {
      this.updateCharacterStates(this.player4, dt);
    }
    if (this.cpus) {
      for (const cpu of this.cpus) {
        this.updateCharacterStates(cpu, dt);
      }
    }

    // Update Screen Shake
    if (this.shakeTimer && this.shakeTimer > 0) {
      this.shakeTimer -= dt;
      if (this.shakeTimer <= 0) {
        this.shakeTimer = 0;
        this.app.stage.position.set(0, 0);
      } else {
        const sx = (Math.random() - 0.5) * this.shakeIntensity;
        const sy = (Math.random() - 0.5) * this.shakeIntensity;
        this.app.stage.position.set(sx, sy);
      }
    }

    // Update Particles
    if (this.particles) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= dt;
        if (p.life <= 0) {
          this.particleContainer.removeChild(p.graphics);
          p.graphics.destroy();
          this.particles.splice(i, 1);
        } else {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 220 * dt; // gravity
          p.graphics.clear();
          const alpha = p.life / p.maxLife;
          p.graphics.beginFill(p.color, alpha);
          p.graphics.drawRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
          p.graphics.endFill();
        }
      }
    }

    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];

      // Update Sliding Bubble
      if (b.isSliding) {
        b.slideProgress += dt * 8;
        if (b.slideProgress >= 1.0) {
          b.x = b.endX;
          b.y = b.endY;
          b.isSliding = false;

          const nextCol = b.col + b.slideDirX;
          const nextRow = b.row + b.slideDirY;
          const hasObstacle = nextCol < 0 || nextCol >= GRID_COLS || nextRow < 0 || nextRow >= GRID_ROWS ||
                              this.grid[nextRow][nextCol] !== 0 ||
                              this.bubbles.some(other => other !== b && other.col === nextCol && other.row === nextRow) ||
                              this.items.some(it => it.col === nextCol && it.row === nextRow);
          if (!hasObstacle) {
            b.slideProgress = 0;
            b.startX = b.x;
            b.startY = b.y;
            b.col = nextCol;
            b.row = nextRow;
            b.endX = nextCol * TILE_SIZE + TILE_SIZE / 2;
            b.endY = nextRow * TILE_SIZE + TILE_SIZE / 2;
            b.isSliding = true;
          }
        } else {
          b.x = b.startX + (b.endX - b.startX) * b.slideProgress;
          b.y = b.startY + (b.endY - b.startY) * b.slideProgress;
        }
      }

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

    // Update Darts Projectiles
    if (this.dartsProjectiles) {
      for (let i = this.dartsProjectiles.length - 1; i >= 0; i--) {
        const d = this.dartsProjectiles[i];
        d.x += d.dirX * d.speed * dt;
        d.y += d.dirY * d.speed * dt;

        d.graphics.clear();
        d.graphics.lineStyle(3, 0xffa500, 1);
        
        // Draw dart pointing in direction
        d.graphics.moveTo(d.x, d.y);
        d.graphics.lineTo(d.x - d.dirX * 12, d.y - d.dirY * 12);
        
        // Draw tip
        d.graphics.beginFill(0xffaa00);
        d.graphics.drawCircle(d.x, d.y, 3.5);
        d.graphics.endFill();
        d.graphics.lineStyle(0);

        const dCol = Math.floor(d.x / TILE_SIZE);
        const dRow = Math.floor(d.y / TILE_SIZE);

        let hit = false;
        if (dCol < 0 || dCol >= GRID_COLS || dRow < 0 || dRow >= GRID_ROWS) {
          hit = true;
        } else if (this.grid[dRow][dCol] === 1 || this.grid[dRow][dCol] === 2) {
          hit = true;
        } else {
          const bubbleIndex = this.bubbles.findIndex(b => b.col === dCol && b.row === dRow);
          if (bubbleIndex !== -1) {
            const b = this.bubbles[bubbleIndex];
            this.explodeBubble(b);
            this.bubbleContainer.removeChild(b.graphics);
            this.bubbles.splice(bubbleIndex, 1);
            hit = true;
          }
        }

        if (hit) {
          this.app.stage.removeChild(d.graphics);
          d.graphics.destroy();
          this.dartsProjectiles.splice(i, 1);
        }
      }
    }

    this.drawCharacter(this.player);
    if (this.is2PMode && this.player2) {
      this.drawCharacter(this.player2);
    }
    if (this.cpus) {
      for (const cpu of this.cpus) {
        this.drawCharacter(cpu);
      }
    }

    this.checkGameResolutions();

    // Broadcast local player movement & state to remote player
    if (this.isNetMode && this.player) {
      const currentState = {
        x: this.player.x,
        y: this.player.y,
        dirX: this.player.dirX,
        dirY: this.player.dirY,
        state: this.player.state
      };
      
      if (!this.lastSentState ||
          this.lastSentState.x !== currentState.x ||
          this.lastSentState.y !== currentState.y ||
          this.lastSentState.dirX !== currentState.dirX ||
          this.lastSentState.dirY !== currentState.dirY ||
          this.lastSentState.state !== currentState.state) {
        
        this.sendNetMessage({
          type: 'move',
          ...currentState
        });
        this.lastSentState = currentState;
      }
    }
  }

  updateCharacterStates(char, dt) {
    if (char.state === 'dying' && !char.hasDroppedBuffOnDeath) {
      this.dropBuffOnDeath(char);
    }

    if (char.invincibilityTimer && char.invincibilityTimer > 0) {
      char.invincibilityTimer -= dt;
    }

    if (char.isJumping) {
      char.jumpProgress += dt / char.jumpDuration;
      if (char.jumpProgress >= 1.0) {
        char.x = char.jumpEndX;
        char.y = char.jumpEndY;
        char.isJumping = false;
        char.jumpProgress = 0;

        // Check if standing on an item and collect it immediately
        const col = Math.floor(char.x / TILE_SIZE);
        const row = Math.floor(char.y / TILE_SIZE);
        const itemIndex = this.items.findIndex(it => it.col === col && it.row === row);
        if (itemIndex !== -1) {
          const item = this.items[itemIndex];
          this.collectItem(char, item);
          this.itemContainer.removeChild(item.graphics);
          item.graphics.destroy({ children: true });
          this.items.splice(itemIndex, 1);

          if (this.isNetMode && char === this.player) {
            this.sendNetMessage({
              type: 'collect_item',
              col,
              row
            });
          }
        }
      } else {
        char.x = char.jumpStartX + (char.jumpEndX - char.jumpStartX) * char.jumpProgress;
        char.y = char.jumpStartY + (char.jumpEndY - char.jumpStartY) * char.jumpProgress;
      }
    }

    if (char.devilTimer && char.devilTimer > 0) {
      char.devilTimer -= dt;
      if (char.devilTimer <= 0) {
        char.devilTimer = 0;
      }
    }

    if (char.state === 'trapped') {
      char.trapTimer -= dt;
      if (char.trapTimer <= 0) {
        char.state = 'dying';
        char.dyingTimer = 1.5;
        sfx.playPopTrap();
        this.updateHUD();
      }
    } else if (char.state === 'dying') {
      char.dyingTimer -= dt;
      char.y -= dt * 30; // Float up
      if (char.dyingTimer <= 0) {
        char.state = 'dead';
        this.updateHUD();
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
    const characters = this.getCharacters();
    let stateChanged = false;
    for (const char of characters) {
      if (char.state === 'dead' || char.state === 'dying') continue;
      if (char.isJumping) continue;

      const charCol = Math.floor(char.x / TILE_SIZE);
      const charRow = Math.floor(char.y / TILE_SIZE);

      if (charCol === flame.col && charRow === flame.row) {
        if (char.state === 'normal') {
          if (char.invincibilityTimer && char.invincibilityTimer > 0) {
            continue;
          }
          if (char.hasPet) {
            this.dismountPet(char);
            char.invincibilityTimer = 1.5;
            sfx.playNeedle(); // play shield sound
            this.showFloatingText(char.x, char.y - 20, "PET SHIELD!", 0xff66cc);
            stateChanged = true;
          } else {
            char.state = 'trapped';
            char.trapTimer = 5.0;
            char.trappedTime = Date.now(); // Record when they got trapped to prevent instant popping by same/overlapping flames
            sfx.playBubbleTrap();
            stateChanged = true;
          }
        } else if (char.state === 'trapped') {
          // Add a 0.5-second invulnerability window upon being trapped, so overlapping or simultaneous flames don't cause instant pop
          if (!char.trappedTime || (Date.now() - char.trappedTime > 500)) {
            char.state = 'dying';
            char.dyingTimer = 1.5;
            sfx.playPopTrap();
            stateChanged = true;
          }
        }
      }
    }
    if (stateChanged) {
      this.updateHUD();
    }
  }

  drawCharacter(char) {
    const g = char.graphics;
    g.clear();

    const bodyColor = char.team === 'red' ? 0xff3b30 : 0x007aff;
    const teamColorHex = char.team === 'red' ? 0xff4d4d : 0x4d4dff;

    // Blinking effect when invincible
    g.alpha = (char.invincibilityTimer > 0 && Math.floor(Date.now() / 100) % 2 === 0) ? 0.35 : 1.0;

    if (char.state === 'dead') {
      if (char.countdownText) {
        char.countdownText.visible = false;
      }
      if (char.overheadText) {
        char.overheadText.visible = false;
      }
      return;
    }

    let drawX = char.x;
    let drawY = char.y;

    if (char.isJumping) {
      const p = char.jumpProgress;
      const jumpHeight = 45 * 4 * p * (1 - p);
      drawY -= jumpHeight;
    }

    if (char.devilTimer && char.devilTimer > 0) {
      g.rotation = 0.12 * Math.sin(Date.now() * 0.015);
      g.pivot.set(char.x, char.y);
      g.position.set(char.x + 4 * Math.sin(Date.now() * 0.025), char.y);
    } else {
      g.rotation = 0;
      g.pivot.set(0, 0);
      g.position.set(0, 0);
    }

    const isMoving = char.lastX !== undefined && (Math.abs(char.x - char.lastX) > 0.1 || Math.abs(char.y - char.lastY) > 0.1);
    char.lastX = char.x;
    char.lastY = char.y;

    let bob = 0;
    if (char.hasPet && char.state === 'normal') {
      const animSpeed = isMoving ? 0.015 : 0.006;
      const bobAmt = isMoving ? 2.5 : 1.0;
      bob = Math.sin(Date.now() * animSpeed) * bobAmt;
      drawY = char.y - 12 + bob;

      const petX = char.x;
      let petY = char.y + 6 + bob * 0.5;

      if (char.isJumping) {
        const p = char.jumpProgress;
        const jumpHeight = 45 * 4 * p * (1 - p);
        drawY -= jumpHeight;
        petY -= jumpHeight;
      }

      const petR = char.radius * 1.1;

      if (char.hasPet === 'fast_turtle' || char.hasPet === 'slow_turtle') {
        const isFast = char.hasPet === 'fast_turtle';

        // 1. Draw Tail (behind shell)
        const tailSwing = Math.sin(Date.now() * (isMoving ? 0.015 : 0.006) * 1.5) * 3;
        const tailDir = char.dirX !== 0 ? -char.dirX : -1;
        const tailX = petX + tailDir * (petR * 0.85);
        const tailY = petY + petR * 0.2;

        g.beginFill(isFast ? 0x2eb82e : 0x70a370);
        g.drawCircle(tailX, tailY + tailSwing * 0.5, petR * 0.2);
        g.endFill();

        // 2. Draw Flippers/Feet (walking animation)
        const walkCycle = isMoving ? Math.sin(Date.now() * 0.02) * 4 : 0;
        const pawY = petY + petR * 0.65;
        g.beginFill(isFast ? 0x5cd65c : 0x8cc68c);
        // Back foot
        g.drawCircle(petX - 8 + walkCycle, pawY, 5);
        // Front foot
        g.drawCircle(petX + 8 - walkCycle, pawY, 5);
        g.endFill();

        // 3. Draw Head (protrudes in direction of movement)
        const headDir = char.dirX !== 0 ? char.dirX : 1;
        const headX = petX + headDir * (petR * 0.75);
        const headY = petY - petR * 0.1;

        g.beginFill(isFast ? 0x5cd65c : 0x8cc68c);
        g.drawCircle(headX, headY, petR * 0.45);
        g.endFill();

        if (isFast) {
          // Fast Turtle Headband (Red)
          g.beginFill(0xff3333);
          g.drawRect(headX - petR * 0.45, headY - petR * 0.25, petR * 0.9, petR * 0.18);
          g.endFill();

          // Headband tie knot
          const knotX = headX - headDir * (petR * 0.4);
          g.beginFill(0xff3333);
          g.moveTo(knotX, headY);
          g.lineTo(knotX - headDir * 6, headY + 3);
          g.lineTo(knotX - headDir * 4, headY + 6);
          g.endFill();
        }

        // Eyes
        const eyeOffset = headDir * 1.5;
        if (isFast) {
          g.beginFill(0x222222);
          g.drawCircle(headX + eyeOffset + headDir * 1, headY - 1, 2.5);
          g.endFill();
          g.beginFill(0xffffff);
          g.drawCircle(headX + eyeOffset + headDir * 1.5, headY - 1.5, 1);
          g.endFill();
        } else {
          g.lineStyle(1.8, 0x555555);
          g.moveTo(headX - 3 + eyeOffset, headY);
          g.quadraticCurveTo(headX + eyeOffset, headY + 2, headX + 3 + eyeOffset, headY);
          g.lineStyle(0);

          // Zzz
          if (Math.floor(Date.now() / 800) % 2 === 0) {
            g.lineStyle(1.2, 0xffffff, 0.8);
            const zX = headX + headDir * 6;
            const zY = headY - 12;
            g.moveTo(zX - 3, zY - 3);
            g.lineTo(zX + 3, zY - 3);
            g.lineTo(zX - 3, zY + 3);
            g.lineTo(zX + 3, zY + 3);
            g.lineStyle(0);
          }
        }

        // 4. Draw Shell
        const shellColor = isFast ? 0xff5533 : 0x4d88ff;
        const plateColor = isFast ? 0xffcc00 : 0x2b59c3;

        g.beginFill(shellColor);
        g.drawCircle(petX, petY, petR);
        g.endFill();

        g.lineStyle(1.5, plateColor, 0.8);
        g.beginFill(shellColor);
        g.drawCircle(petX, petY, petR * 0.5);
        g.endFill();

        g.moveTo(petX, petY - petR * 0.5);
        g.lineTo(petX, petY - petR);
        g.moveTo(petX, petY + petR * 0.5);
        g.lineTo(petX, petY + petR);
        g.moveTo(petX - petR * 0.5, petY);
        g.lineTo(petX - petR, petY);
        g.moveTo(petX + petR * 0.5, petY);
        g.lineTo(petX + petR, petY);
        g.lineStyle(0);

        g.lineStyle(2, plateColor);
        g.drawCircle(petX, petY, petR);
        g.lineStyle(0);

      } else {
        // Draw Cat
        // 1. Draw Tail (behind body)
        const tailSwing = Math.sin(Date.now() * (isMoving ? 0.015 : 0.006) * 1.5) * 4;
        const tailDir = char.dirX !== 0 ? -char.dirX : -1;
        const tailX = petX + tailDir * (petR * 0.85);
        const tailY = petY + 2;

        g.beginFill(0xff409f); // Darker pink tail tip
        g.drawCircle(tailX + tailDir * 4, tailY - 5 + tailSwing, petR * 0.25);
        g.endFill();

        g.beginFill(0xff73b9); // Main tail body
        g.drawCircle(tailX, tailY + tailSwing * 0.5, petR * 0.35);
        g.endFill();

        // 2. Draw Paws
        const walkCycle = isMoving ? Math.sin(Date.now() * 0.02) * 4 : 0;
        const pawY = petY + petR * 0.75;
        // Left front paw
        g.beginFill(0xffffff);
        g.drawCircle(petX - 8 + walkCycle, pawY, 4.5);
        // Right front paw
        g.drawCircle(petX + 8 - walkCycle, pawY, 4.5);
        g.endFill();

        // Paw pads (little pink dots!)
        g.beginFill(0xffb3d9);
        g.drawCircle(petX - 8 + walkCycle, pawY + 1, 2);
        g.drawCircle(petX + 8 - walkCycle, pawY + 1, 2);
        g.endFill();

        // 3. Draw Ears
        // Left ear
        g.beginFill(0xff73b9);
        g.moveTo(petX - petR * 0.85, petY - petR * 0.3);
        g.lineTo(petX - petR * 0.4, petY - petR * 0.95);
        g.lineTo(petX - petR * 0.15, petY - petR * 0.2);
        g.endFill();
        // Left inner ear
        g.beginFill(0xffb3d9);
        g.moveTo(petX - petR * 0.75, petY - petR * 0.35);
        g.lineTo(petX - petR * 0.45, petY - petR * 0.85);
        g.lineTo(petX - petR * 0.25, petY - petR * 0.3);
        g.endFill();

        // Right ear
        g.beginFill(0xff73b9);
        g.moveTo(petX + petR * 0.85, petY - petR * 0.3);
        g.lineTo(petX + petR * 0.4, petY - petR * 0.95);
        g.lineTo(petX + petR * 0.15, petY - petR * 0.2);
        g.endFill();
        // Right inner ear
        g.beginFill(0xffb3d9);
        g.moveTo(petX + petR * 0.75, petY - petR * 0.35);
        g.lineTo(petX + petR * 0.45, petY - petR * 0.85);
        g.lineTo(petX + petR * 0.25, petY - petR * 0.3);
        g.endFill();

        // 4. Draw Main Body (head/body combined)
        g.beginFill(0xff73b9);
        g.drawCircle(petX, petY, petR);
        g.endFill();

        // 5. Draw Face details (cheeks, eyes, nose, mouth)
        // Cheeks
        g.beginFill(0xff99cc, 0.75);
        g.drawCircle(petX - petR * 0.5, petY + 2, 4);
        g.drawCircle(petX + petR * 0.5, petY + 2, 4);
        g.endFill();

        // Eye offset depending on where player looks
        const faceOffset = char.dirX * 3.5;

        // Eyes
        g.beginFill(0x222222);
        g.drawCircle(petX - 5.5 + faceOffset, petY - 1, 3.2);
        g.drawCircle(petX + 5.5 + faceOffset, petY - 1, 3.2);
        g.endFill();
        // Sparkle
        g.beginFill(0xffffff);
        g.drawCircle(petX - 6.5 + faceOffset, petY - 2, 1.2);
        g.drawCircle(petX + 4.5 + faceOffset, petY - 2, 1.2);
        g.endFill();

        // Nose (tiny triangle)
        g.beginFill(0xff409f);
        g.moveTo(petX - 1.5 + faceOffset, petY + 1.5);
        g.lineTo(petX + 1.5 + faceOffset, petY + 1.5);
        g.lineTo(petX + faceOffset, petY + 3);
        g.endFill();

        // Mouth
        g.lineStyle(1.2, 0xff409f);
        g.moveTo(petX - 2.5 + faceOffset, petY + 4);
        g.quadraticCurveTo(petX - 1.25 + faceOffset, petY + 5.5, petX + faceOffset, petY + 4.2);
        g.quadraticCurveTo(petX + 1.25 + faceOffset, petY + 5.5, petX + 2.5 + faceOffset, petY + 4);
        g.lineStyle(0);

        // Whiskers
        g.lineStyle(1, 0xffffff, 0.9);
        // Left whiskers
        g.moveTo(petX - petR * 0.45 + faceOffset, petY + 2);
        g.lineTo(petX - petR * 0.85 + faceOffset, petY + 1.2);
        g.moveTo(petX - petR * 0.45 + faceOffset, petY + 3.2);
        g.lineTo(petX - petR * 0.85 + faceOffset, petY + 3.8);
        // Right whiskers
        g.moveTo(petX + petR * 0.45 + faceOffset, petY + 2);
        g.lineTo(petX + petR * 0.85 + faceOffset, petY + 1.2);
        g.moveTo(petX + petR * 0.45 + faceOffset, petY + 3.2);
        g.lineTo(petX + petR * 0.85 + faceOffset, petY + 3.8);
        g.lineStyle(0);
      }
    }

    if (char.state === 'dying') {
      const pulse = 1.0 + 0.1 * Math.sin(Date.now() * 0.015);
      const alpha = Math.max(0, char.dyingTimer / 1.5);
      
      // Draw a cute ghost (like classic Crazy Arcade)
      g.beginFill(0xffffff, alpha * 0.75);
      
      // Ghost head
      g.drawCircle(char.x, char.y, char.radius * pulse);
      
      // Ghost body/skirt
      const tailY = char.y + char.radius * 0.7;
      g.drawRect(char.x - char.radius, char.y, char.radius * 2, char.radius * 0.7);
      
      // Skirt waves at bottom
      g.drawCircle(char.x - char.radius * 0.6, tailY, char.radius * 0.35);
      g.drawCircle(char.x, tailY, char.radius * 0.35);
      g.drawCircle(char.x + char.radius * 0.6, tailY, char.radius * 0.35);
      g.endFill();

      // Ghost eyes
      g.beginFill(0x555555, alpha * 0.85);
      g.drawCircle(char.x - 4, char.y - 1, 2.5);
      g.drawCircle(char.x + 4, char.y - 1, 2.5);
      g.endFill();

      // Ghost cute cheeks
      g.beginFill(0xffb3b3, alpha * 0.6);
      g.drawCircle(char.x - 7, char.y + 3, 2);
      g.drawCircle(char.x + 7, char.y + 3, 2);
      g.endFill();

      if (char.countdownText) {
        char.countdownText.visible = false;
      }
      if (char.overheadText) {
        char.overheadText.visible = false;
      }
      return;
    }

    if (char.state === 'trapped') {
      const pulse = 1.05 + 0.05 * Math.sin(Date.now() * 0.01);
      g.beginFill(0x00d2ff, 0.4);
      g.drawCircle(char.x, char.y - 12, char.radius * 1.3 * pulse);
      g.endFill();

      g.lineStyle(2, 0xffffff, 0.7);
      g.drawCircle(char.x, char.y - 12, char.radius * 1.3 * pulse);
      g.lineStyle(0);

      g.beginFill(bodyColor);
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

      // Update overhead 1P/2P label position if exists
      if (char.overheadText) {
        char.overheadText.visible = true;
        char.overheadText.x = char.x;
        char.overheadText.y = char.y - char.radius * 1.3 - 25;
      }

      // Draw countdown text & prompt above bubble
      if (char.countdownText) {
        char.countdownText.visible = true;
        char.countdownText.x = char.x;
        char.countdownText.y = char.y - char.radius * 1.3 - 42;
        const secondsLeft = Math.max(0, Math.ceil(char.trapTimer));
        
        let text = `${secondsLeft}s`;
        if (char.itemSlot === 'needle') {
          if (!char.isCPU) {
            let selfRescuePrompt = "";
            if (char === this.player2) {
              selfRescuePrompt = "📍 按 [M]/點擊自救";
            } else {
              selfRescuePrompt = document.body.classList.contains('is-mobile') ? "📍 點 [自救]/畫面自救" : "📍 按 [N]/點擊自救";
            }
            text += `\n${selfRescuePrompt}`;
          } else {
            text += `\n📍 自救中...`;
          }
        } else {
          if (!char.isCPU) {
            text += `\n❌ 無針自救`;
          }
        }
        char.countdownText.text = text;
      }

      return;
    }

    if (char.countdownText) {
      char.countdownText.visible = false;
    }

    if (char.overheadText) {
      char.overheadText.visible = true;
      char.overheadText.x = drawX;
      char.overheadText.y = drawY - char.radius - 15;
    }

    // 1. Draw Under-foot Team Ring / Aura
    if (char.state === 'normal') {
      const pulse = 1.0 + 0.06 * Math.sin(Date.now() * 0.01);
      g.lineStyle(3, teamColorHex, 0.35);
      g.drawEllipse(char.x, char.y + char.radius - 2, char.radius * 1.25 * pulse, 6 * pulse);
      g.lineStyle(1.5, teamColorHex, 0.85);
      g.drawEllipse(char.x, char.y + char.radius - 2, char.radius * 1.05 * pulse, 4.8 * pulse);
      g.lineStyle(0);
    }

    // 2. Draw Shadow
    g.beginFill(0x000000, 0.25);
    if (char.hasPet && char.state === 'normal') {
      g.drawEllipse(char.x, char.y + 18, char.radius * 1.3, 8);
    } else {
      g.drawEllipse(char.x, char.y + char.radius - 2, char.radius * 0.9, 6);
    }
    g.endFill();

    // 3. Draw Character Hood Ears / Accessories (drawn behind main head circle)
    const charKey = char.charKey || 'dao';
    if (charKey === 'dao') {
      // Dao round blue ears
      g.beginFill(0x0066cc);
      g.drawCircle(drawX - char.radius * 0.65, drawY - char.radius * 0.6, char.radius * 0.35);
      g.drawCircle(drawX + char.radius * 0.65, drawY - char.radius * 0.6, char.radius * 0.35);
      g.endFill();
      g.beginFill(0x5ebcff); 
      g.drawCircle(drawX - char.radius * 0.65, drawY - char.radius * 0.6, char.radius * 0.18);
      g.drawCircle(drawX + char.radius * 0.65, drawY - char.radius * 0.6, char.radius * 0.18);
      g.endFill();
    } else if (charKey === 'bazzi') {
      // Bazzi pointed red ears
      g.beginFill(0xcc0033);
      g.moveTo(drawX - char.radius * 0.35, drawY - char.radius * 0.75);
      g.lineTo(drawX - char.radius * 0.75, drawY - char.radius * 1.25);
      g.lineTo(drawX - char.radius * 0.1, drawY - char.radius * 0.9);
      g.endFill();
      g.beginFill(0xcc0033);
      g.moveTo(drawX + char.radius * 0.35, drawY - char.radius * 0.75);
      g.lineTo(drawX + char.radius * 0.75, drawY - char.radius * 1.25);
      g.lineTo(drawX + char.radius * 0.1, drawY - char.radius * 0.9);
      g.endFill();
    } else if (charKey === 'marid') {
      // Marid round yellow ears
      g.beginFill(0xcca300);
      g.drawCircle(drawX - char.radius * 0.55, drawY - char.radius * 0.55, char.radius * 0.3);
      g.drawCircle(drawX + char.radius * 0.55, drawY - char.radius * 0.55, char.radius * 0.3);
      g.endFill();
      g.beginFill(0xffe66d); 
      g.drawCircle(drawX - char.radius * 0.55, drawY - char.radius * 0.55, char.radius * 0.15);
      g.drawCircle(drawX + char.radius * 0.55, drawY - char.radius * 0.55, char.radius * 0.15);
      g.endFill();
    }

    // 4. Draw Main Head/Body Circle in Team Color
    g.beginFill(bodyColor);
    g.drawCircle(drawX, drawY, char.radius);
    g.endFill();

    // 5. Draw Marid Ribbon Bow (if Marid, drawn on top of head circle)
    if (charKey === 'marid') {
      g.beginFill(0xff4da6); // Vibrant pink ribbon
      g.moveTo(drawX, drawY - char.radius * 0.8);
      g.lineTo(drawX - char.radius * 0.45, drawY - char.radius * 1.15);
      g.lineTo(drawX - char.radius * 0.45, drawY - char.radius * 0.55);
      g.lineTo(drawX, drawY - char.radius * 0.8);
      g.lineTo(drawX + char.radius * 0.45, drawY - char.radius * 1.15);
      g.lineTo(drawX + char.radius * 0.45, drawY - char.radius * 0.55);
      g.lineTo(drawX, drawY - char.radius * 0.8);
      g.endFill();
      g.beginFill(0xffcc00); // Yellow knot
      g.drawCircle(drawX, drawY - char.radius * 0.8, char.radius * 0.15);
      g.endFill();
    }

    // Draw Player's dangling feet when riding a pet
    if (char.hasPet && char.state === 'normal') {
      g.beginFill(bodyColor);
      g.drawCircle(drawX - char.radius * 0.7, drawY + char.radius * 0.6, 4.5);
      g.drawCircle(drawX + char.radius * 0.7, drawY + char.radius * 0.6, 4.5);
      g.endFill();
      // shoes
      g.beginFill(0xffffff);
      g.drawCircle(drawX - char.radius * 0.75, drawY + char.radius * 0.7, 3);
      g.drawCircle(drawX + char.radius * 0.75, drawY + char.radius * 0.7, 3);
      g.endFill();
    }

    // 6. Draw Face Area
    g.beginFill(char.faceColor);
    g.drawRoundedRect(drawX - char.radius * 0.65, drawY - char.radius * 0.2, char.radius * 1.3, char.radius * 0.8, 6);
    g.endFill();

    // 7. Draw Team Jersey V-Collar (overlay on face lower border)
    g.beginFill(0xffffff, 0.95); 
    g.moveTo(drawX - char.radius * 0.3, drawY + char.radius * 0.65);
    g.lineTo(drawX + char.radius * 0.3, drawY + char.radius * 0.65);
    g.lineTo(drawX, drawY + char.radius * 0.95);
    g.endFill();
    g.beginFill(teamColorHex);
    g.drawCircle(drawX, drawY + char.radius * 0.72, 3);
    g.endFill();

    g.beginFill(0x111111);
    const eyeOffset = char.dirX * 4;
    g.drawCircle(drawX - 5 + eyeOffset, drawY + char.radius * 0.2, 3.5);
    g.drawCircle(drawX + 5 + eyeOffset, drawY + char.radius * 0.2, 3.5);
    g.endFill();

    g.beginFill(0xffffff, 0.35);
    g.drawCircle(drawX - char.radius * 0.4, drawY - char.radius * 0.4, char.radius * 0.25);
    g.endFill();

    // Draw Team Indicator Above Head
    const teamColor = char.team === 'red' ? 0xff4d4d : 0x4d4dff;
    g.beginFill(teamColor);
    g.moveTo(drawX - 6, drawY - char.radius - 12);
    g.lineTo(drawX + 6, drawY - char.radius - 12);
    g.lineTo(drawX, drawY - char.radius - 6);
    g.endFill();
  }

  kickBubble(bubble, dirX, dirY) {
    if (bubble.isSliding) return;
    
    const nextCol = bubble.col + dirX;
    const nextRow = bubble.row + dirY;
    
    const hasObstacle = nextCol < 0 || nextCol >= GRID_COLS || nextRow < 0 || nextRow >= GRID_ROWS ||
                        this.grid[nextRow][nextCol] !== 0 ||
                        this.bubbles.some(other => other.col === nextCol && other.row === nextRow) ||
                        this.items.some(it => it.col === nextCol && it.row === nextRow);
    if (!hasObstacle) {
      bubble.slideProgress = 0;
      bubble.startX = bubble.x;
      bubble.startY = bubble.y;
      bubble.col = nextCol;
      bubble.row = nextRow;
      bubble.endX = nextCol * TILE_SIZE + TILE_SIZE / 2;
      bubble.endY = nextRow * TILE_SIZE + TILE_SIZE / 2;
      bubble.isSliding = true;
      bubble.slideDirX = dirX;
      bubble.slideDirY = dirY;
      bubble.allowedCharacters = [];
    }
  }

  triggerScreenShake(duration = 0.2, intensity = 6.0) {
    this.shakeTimer = duration;
    this.shakeIntensity = intensity;
  }

  spawnCrateParticles(col, row) {
    const mapConf = MAPS_CONFIG[this.currentMapKey || this.selectedMap];
    const color = mapConf.crateColor || 0xbf7130;
    const cx = col * TILE_SIZE + TILE_SIZE / 2;
    const cy = row * TILE_SIZE + TILE_SIZE / 2;
    
    const count = 10 + Math.floor(Math.random() * 6);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 90;
      const particle = {
        x: cx + (Math.random() - 0.5) * 16,
        y: cy + (Math.random() - 0.5) * 16,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        life: 0.45 + Math.random() * 0.3,
        maxLife: 0.45 + Math.random() * 0.3,
        size: 3 + Math.random() * 5,
        color: color,
        graphics: new PIXI.Graphics()
      };
      if (this.particleContainer) {
        this.particleContainer.addChild(particle.graphics);
        this.particles.push(particle);
      }
    }
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
          text.destroy(true);
        }
      };
      this.app.ticker.add(anim);
    } catch (e) {
      console.error(e);
    }
  }

  checkGameResolutions() {
    const chars = this.getCharacters();

    // 1. Resolve character-to-character collision for Trapped states (Rescue / Kill)
    for (let i = 0; i < chars.length; i++) {
      const charA = chars[i];
      if (charA.state !== 'normal') continue;
      if (charA.isJumping) continue;

      for (let j = 0; j < chars.length; j++) {
        if (i === j) continue;
        const charB = chars[j];
        if (charB.state !== 'trapped') continue;
        if (charB.isJumping) continue;

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
            // Add a 0.5-second invulnerability window upon being trapped, so enemies standing right on the player don't instantly kill them
            if (!charB.trappedTime || (Date.now() - charB.trappedTime > 500)) {
              charB.state = 'dying';
              charB.dyingTimer = 1.5;
              sfx.playPopTrap();
              this.showFloatingText(charB.x, charB.y - 20, "OUT!", 0xff8080);
              this.updateHUD();
            }
          }
        }
      }
    }

    // 2. Check winning/losing condition based on team survival
    const redTeamAlive = chars.some(c => c.team === 'red' && c.state !== 'dead' && c.state !== 'dying');
    const blueTeamAlive = chars.some(c => c.team === 'blue' && c.state !== 'dead' && c.state !== 'dying');

    if (!redTeamAlive && !blueTeamAlive) {
      if (!this.gameEnding) {
        this.gameEnding = true;
        this.gameEndTimeout = setTimeout(() => {
          this.endGame('draw', 'both_teams_dead');
        }, 1500);
      }
    } else if (!redTeamAlive) {
      if (!this.gameEnding) {
        this.gameEnding = true;
        this.gameEndTimeout = setTimeout(() => {
          this.endGame('lose', 'red_team_dead');
        }, 1500);
      }
    } else if (!blueTeamAlive) {
      if (!this.gameEnding) {
        this.gameEnding = true;
        this.gameEndTimeout = setTimeout(() => {
          this.endGame('win', 'blue_team_dead');
        }, 1500);
      }
    }
  }

  endGame(outcome, reason) {
    if (!this.gameActive && reason !== 'abort') return;
    this.gameActive = false;

    if (this.gameEndTimeout) {
      clearTimeout(this.gameEndTimeout);
      this.gameEndTimeout = null;
    }
    this.gameEnding = false;

    if (this.dartsProjectiles) {
      for (const d of this.dartsProjectiles) {
        if (d.graphics) {
          this.app.stage.removeChild(d.graphics);
          d.graphics.destroy();
        }
      }
    }
    this.dartsProjectiles = [];

    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this.app) {
      this.app.ticker.remove(this.update, this);
    }

    if (reason === 'abort') {
      this.gameScreen.classList.remove('active');
      this.lobbyScreen.classList.add('active');
      this.resetMenuFocus();
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

    if (this.isNetMode) {
      const localWon = (outcome === 'win' && this.player.team === 'red') || (outcome === 'lose' && this.player.team === 'blue');
      const localLost = (outcome === 'win' && this.player.team === 'blue') || (outcome === 'lose' && this.player.team === 'red');
      
      if (localWon) {
        title.textContent = '您獲勝了！';
        title.style.color = 'var(--accent-blue)';
        msg.textContent = '恭喜你！成功擊敗對手，獲得了最終的勝利！';
      } else if (localLost) {
        title.textContent = '您戰敗了...';
        title.style.color = 'var(--accent-pink)';
        msg.textContent = '太可惜了！對手成功擊敗了你，下次再努力贏回來吧！';
      } else {
        title.textContent = '平局';
        title.style.color = 'var(--text-light)';
        msg.textContent = '雙方全軍覆沒，平分秋色！';
      }

      const playAgainBtn = document.getElementById('play-again-btn');
      if (playAgainBtn) {
        if (this.netRole === 'p1') {
          playAgainBtn.disabled = false;
          playAgainBtn.textContent = '重新開始';
        } else {
          playAgainBtn.disabled = true;
          playAgainBtn.textContent = '等待主機重新開始...';
        }
      }
    } else {
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
      const playAgainBtn = document.getElementById('play-again-btn');
      if (playAgainBtn) {
        playAgainBtn.disabled = false;
        playAgainBtn.textContent = '再玩一次';
      }
    }

    this.resultOverlay.classList.add('active');
    this.resetMenuFocus();
  }

  ensureSpawnSafety() {
    // Corner spawns (width = 15, height = 13)
    const corners = [
      { r: 0, c: 0, adjR: [0, 1], adjC: [1, 0], safeR: 1, safeC: 1 },         // Top-Left
      { r: 0, c: 14, adjR: [0, 1], adjC: [13, 14], safeR: 1, safeC: 13 },     // Top-Right
      { r: 12, c: 0, adjR: [12, 11], adjC: [1, 0], safeR: 11, safeC: 1 },     // Bottom-Left
      { r: 12, c: 14, adjR: [12, 11], adjC: [13, 14], safeR: 11, safeC: 13 }  // Bottom-Right
    ];

    corners.forEach(corner => {
      if (this.grid[corner.r] !== undefined && this.grid[corner.r][corner.c] !== undefined) {
        this.grid[corner.r][corner.c] = 0;
      }
      if (this.grid[corner.adjR[0]] !== undefined && this.grid[corner.adjR[0]][corner.adjC[0]] !== undefined) {
        this.grid[corner.adjR[0]][corner.adjC[0]] = 0;
      }
      if (this.grid[corner.adjR[1]] !== undefined && this.grid[corner.adjR[1]][corner.adjC[1]] !== undefined) {
        this.grid[corner.adjR[1]][corner.adjC[1]] = 0;
      }
      if (this.grid[corner.safeR] !== undefined && this.grid[corner.safeR][corner.safeC] !== undefined) {
        this.grid[corner.safeR][corner.safeC] = 0;
      }
    });

    // Center/Middle spawns
    const middles = [
      { r: 6, c: 7 }, // Center
      { r: 4, c: 7 }, // Top-Middle
      { r: 8, c: 7 }  // Bottom-Middle
    ];

    middles.forEach(mid => {
      if (this.grid[mid.r] !== undefined && this.grid[mid.r][mid.c] !== undefined) {
        this.grid[mid.r][mid.c] = 0;
      }
      if (this.grid[mid.r] !== undefined && this.grid[mid.r][mid.c - 1] !== undefined) {
        this.grid[mid.r][mid.c - 1] = 0;
      }
      if (this.grid[mid.r - 1] !== undefined && this.grid[mid.r - 1][mid.c - 1] !== undefined) {
        this.grid[mid.r - 1][mid.c - 1] = 0;
      }
      if (this.grid[mid.r + 1] !== undefined && this.grid[mid.r + 1][mid.c - 1] !== undefined) {
        this.grid[mid.r + 1][mid.c - 1] = 0;
      }
    });
  }

  generateCrateItems() {
    this.crateItems = {};
    const crates = [];
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        if (this.grid[r][c] === 2) {
          crates.push({ r, c });
        }
      }
    }

    // Shuffle crates
    for (let i = crates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [crates[i], crates[j]] = [crates[j], crates[i]];
    }

    // Define a fixed pool of items
    const itemPool = [
      ITEM_TYPES.BUBBLE_UP, ITEM_TYPES.BUBBLE_UP, ITEM_TYPES.BUBBLE_UP, ITEM_TYPES.BUBBLE_UP, ITEM_TYPES.BUBBLE_UP,
      ITEM_TYPES.LENGTH_UP, ITEM_TYPES.LENGTH_UP, ITEM_TYPES.LENGTH_UP, ITEM_TYPES.LENGTH_UP, ITEM_TYPES.LENGTH_UP,
      ITEM_TYPES.SPEED_UP, ITEM_TYPES.SPEED_UP, ITEM_TYPES.SPEED_UP, ITEM_TYPES.SPEED_UP, ITEM_TYPES.SPEED_UP,
      ITEM_TYPES.NEEDLE, ITEM_TYPES.NEEDLE, ITEM_TYPES.NEEDLE,
      ITEM_TYPES.DART, ITEM_TYPES.DART,
      ITEM_TYPES.KICK_SHOE, ITEM_TYPES.SPRING_SHOE, ITEM_TYPES.DEVIL,
      ITEM_TYPES.PET, ITEM_TYPES.PET_FAST_TURTLE, ITEM_TYPES.PET_SLOW_TURTLE
    ];

    // Assign items to shuffled crates
    const assignCount = Math.min(crates.length, itemPool.length);
    for (let i = 0; i < assignCount; i++) {
      const crate = crates[i];
      const key = `${crate.c}_${crate.r}`;
      this.crateItems[key] = itemPool[i];
    }
  }

  dropBuffOnDeath(char) {
    if (!char || char.hasDroppedBuffOnDeath) return;
    char.hasDroppedBuffOnDeath = true;

    // In online mode, only Host (p1) decides item drops and broadcasts them.
    if (this.isNetMode && this.netRole !== 'p1') {
      return;
    }

    const charKey = char.charKey || 'bazzi';
    const conf = CHARACTER_CONFIGS[charKey];
    if (!conf) return;

    // Determine initial stats
    const initialMaxBubbles = char.isCPU ? (conf.maxBubbles + 1) : conf.maxBubbles;
    const initialBubbleLength = conf.maxLen;
    const initialSpeed = conf.speed;

    const bubbleUpCount = Math.max(0, char.maxBubbles - initialMaxBubbles);
    const lengthUpCount = Math.max(0, char.bubbleLength - initialBubbleLength);
    const currentSpeedVal = (char.speedBeforePet !== undefined) ? char.speedBeforePet : char.speed;
    const speedUpCount = Math.max(0, Math.round((currentSpeedVal - initialSpeed) / 0.3));

    const activeBuffs = [];
    for (let i = 0; i < bubbleUpCount; i++) activeBuffs.push(ITEM_TYPES.BUBBLE_UP);
    for (let i = 0; i < lengthUpCount; i++) activeBuffs.push(ITEM_TYPES.LENGTH_UP);
    for (let i = 0; i < speedUpCount; i++) activeBuffs.push(ITEM_TYPES.SPEED_UP);

    if (activeBuffs.length > 0) {
      const randIdx = Math.floor(Math.random() * activeBuffs.length);
      const droppedItemType = activeBuffs[randIdx];

      // Reduce char's stats
      if (droppedItemType === ITEM_TYPES.BUBBLE_UP) {
        char.maxBubbles = Math.max(initialMaxBubbles, char.maxBubbles - 1);
      } else if (droppedItemType === ITEM_TYPES.LENGTH_UP) {
        char.bubbleLength = Math.max(initialBubbleLength, char.bubbleLength - 1);
      } else if (droppedItemType === ITEM_TYPES.SPEED_UP) {
        if (char.speedBeforePet !== undefined) {
          char.speedBeforePet = Math.max(initialSpeed, char.speedBeforePet - 0.3);
        } else {
          char.speed = Math.max(initialSpeed, char.speed - 0.3);
        }
      }

      const col = Math.min(GRID_COLS - 1, Math.max(0, Math.floor(char.x / TILE_SIZE)));
      const row = Math.min(GRID_ROWS - 1, Math.max(0, Math.floor(char.y / TILE_SIZE)));

      // Spawn this item at character's current grid position
      this.destroyCrate(col, row, droppedItemType);
    }
  }
}