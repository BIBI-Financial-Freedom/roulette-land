/**
 * 🔫 러시안 룰렛 — 꽝 뽑기
 * 단일 번들 (서버 없이 file:// 프로토콜로 실행 가능)
 */
(function () {
  'use strict';

  // ============================================================
  // [1] Constants
  // ============================================================
  const MODES = {
    classic:   { name: '클래식',   bullets: 1, respin: false, survival: false },
    fair:      { name: '페어',     bullets: 1, respin: true,  survival: false },
    hard:      { name: '하드',     bullets: 2, respin: false, survival: false },
    deathmatch:{ name: '데스매치', bullets: 3, respin: false, survival: false },
    survival:  { name: '서바이벌', bullets: 1, respin: false, survival: true  },
  };
  const CHAMBER_SIZE = 6;
  const PLAYER_LIMITS = { min: 2, max: 6 };
  const NAME_MAX_LENGTH = 10;

  // ============================================================
  // [2] DOM Utilities
  // ============================================================
  const $ = sel => document.querySelector(sel);
  const $$ = sel => document.querySelectorAll(sel);
  const wait = ms => new Promise(r => setTimeout(r, ms));

  function showScreen(id) {
    $$('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  }
  function showOverlay(id) { document.getElementById(id).classList.add('active'); }
  function hideOverlay(id) { document.getElementById(id).classList.remove('active'); }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  // ============================================================
  // [3] RNG (crypto 기반)
  // ============================================================
  const RNG = {
    getInt(min, max) {
      const range = max - min + 1;
      const arr = new Uint32Array(1);
      crypto.getRandomValues(arr);
      return min + (arr[0] % range);
    },
    sample(array, n) {
      const s = [...array];
      for (let i = s.length - 1; i > 0; i--) {
        const j = this.getInt(0, i);
        [s[i], s[j]] = [s[j], s[i]];
      }
      return s.slice(0, n);
    }
  };

  // ============================================================
  // [4] ChamberEngine
  // ============================================================
  class ChamberEngine {
    constructor() { this._chamber = []; this._pos = 0; this._revealed = []; this._pullCount = 0; }

    create(bulletCount = 1) {
      this._chamber = Array(CHAMBER_SIZE).fill(false);
      this._revealed = Array(CHAMBER_SIZE).fill(false);
      this._pullCount = 0;
      const indices = Array.from({ length: CHAMBER_SIZE }, (_, i) => i);
      RNG.sample(indices, bulletCount).forEach(p => { this._chamber[p] = true; });
    }

    spin() {
      this._pos = RNG.getInt(0, CHAMBER_SIZE - 1);
      this._revealed = Array(CHAMBER_SIZE).fill(false);
      this._pullCount = 0;
    }

    pull() {
      const idx = this._pos;
      const isBullet = this._chamber[idx];
      this._revealed[idx] = true;
      this._pullCount++;
      this._pos = (this._pos + 1) % CHAMBER_SIZE;
      return { isBullet, chamberIndex: idx };
    }

    getCurrentPosition() { return this._pos; }
    getPullCount() { return this._pullCount; }

    getVisibleState() {
      return this._revealed.map((r, i) => {
        if (!r) return 'unknown';
        return this._chamber[i] ? 'bullet' : 'empty';
      });
    }

    getRemainingProbability() {
      let remaining = 0, bullets = 0;
      for (let i = 0; i < CHAMBER_SIZE; i++) {
        if (!this._revealed[i]) { remaining++; if (this._chamber[i]) bullets++; }
      }
      const percent = remaining > 0 ? ((bullets / remaining) * 100).toFixed(1) : '0.0';
      return { bullets, remaining, percent };
    }
  }

  // ============================================================
  // [5] TurnEngine
  // ============================================================
  class TurnEngine {
    constructor(players) { this._players = [...players]; this._idx = 0; this._eliminated = new Set(); }
    getCurrentPlayer() { return this._players[this._idx]; }
    getCurrentIndex() { return this._idx; }
    getPlayers() { return [...this._players]; }
    eliminate(name) { this._eliminated.add(name); }
    isEliminated(name) { return this._eliminated.has(name); }
    nextTurn() {
      const len = this._players.length;
      let tries = 0;
      do {
        this._idx = (this._idx + 1) % len;
        tries++;
      } while (this._eliminated.has(this._players[this._idx]) && tries < len);
    }
    reset() { this._idx = 0; this._eliminated.clear(); }
  }

  // ============================================================
  // [6] SoundManager (Web Audio API — 외부 파일 불필요)
  // ============================================================
  class SoundManager {
    constructor() { this._ctx = null; this._muted = false; }

    _ensure() {
      if (!this._ctx) this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (this._ctx.state === 'suspended') this._ctx.resume();
      return this._ctx;
    }

    setMute(m) { this._muted = m; }

    playClick() {
      if (this._muted) return;
      try {
        const c = this._ensure(), o = c.createOscillator(), g = c.createGain();
        o.connect(g); g.connect(c.destination);
        o.type = 'square';
        o.frequency.setValueAtTime(800, c.currentTime);
        o.frequency.exponentialRampToValueAtTime(200, c.currentTime + 0.08);
        g.gain.setValueAtTime(0.3, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.1);
        o.start(c.currentTime); o.stop(c.currentTime + 0.1);
      } catch {}
    }

    playBang() {
      if (this._muted) return;
      try {
        const c = this._ensure();
        const len = c.sampleRate * 0.3, buf = c.createBuffer(1, len, c.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
        const src = c.createBufferSource(); src.buffer = buf;
        const g = c.createGain();
        g.gain.setValueAtTime(0.5, c.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.3);
        const f = c.createBiquadFilter(); f.type = 'lowpass';
        f.frequency.setValueAtTime(2000, c.currentTime);
        f.frequency.exponentialRampToValueAtTime(100, c.currentTime + 0.3);
        src.connect(f); f.connect(g); g.connect(c.destination); src.start(c.currentTime);
      } catch {}
    }

    playSpin() {
      if (this._muted) return;
      try {
        const c = this._ensure();
        for (let i = 0; i < 12; i++) {
          const o = c.createOscillator(), g = c.createGain();
          o.connect(g); g.connect(c.destination);
          o.type = 'triangle';
          const t = c.currentTime + i * 0.12;
          o.frequency.setValueAtTime(600 - i * 30, t);
          g.gain.setValueAtTime(0.15, t);
          g.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
          o.start(t); o.stop(t + 0.05);
        }
      } catch {}
    }
  }

  // ============================================================
  // [7] AnimationManager
  // ============================================================
  class AnimationManager {
    async playSpinAnimation(id) {
      const el = document.getElementById(id);
      el.classList.add('spinning');
      await wait(2000);
      el.classList.remove('spinning');
    }
    async playSurviveEffect() {
      document.body.classList.add('flash-green');
      await wait(500);
      document.body.classList.remove('flash-green');
    }
    async playBangEffect() {
      document.body.classList.add('flash-red', 'screen-shake');
      if (navigator.vibrate) navigator.vibrate([100, 50, 200]);
      await wait(800);
      document.body.classList.remove('flash-red', 'screen-shake');
    }
  }

  // ============================================================
  // [8] Game State
  // ============================================================
  const state = {
    phase: 'SETUP',
    players: [],
    mode: 'classic',
    bulletCount: 1,
    respin: false,
    survival: false,
    penalty: '☕ 커피 사기',
    loserCount: 1,
    losers: [],
    turnHistory: [],
    loser: null,
    gameOver: false,
    timerEnabled: false,
    timerSeconds: 10,
    survivalRound: 0,
  };

  function resetState() {
    state.phase = 'SETUP';
    state.players = [];
    state.mode = 'classic';
    state.bulletCount = 1;
    state.respin = false;
    state.survival = false;
    state.penalty = '☕ 커피 사기';
    state.loserCount = 1;
    state.losers = [];
    state.turnHistory = [];
    state.loser = null;
    state.gameOver = false;
    state.timerEnabled = false;
    state.timerSeconds = 10;
    state.survivalRound = 0;
  }

  const analytics = window.SiteIntegrations || { track: function () {} };
  function track(eventName, params) {
    analytics.track(eventName, Object.assign({
      game_name: 'russian-roulette'
    }, params || {}));
  }

  // ============================================================
  // [9] Instances
  // ============================================================
  const chamber = new ChamberEngine();
  const sound = new SoundManager();
  const anim = new AnimationManager();
  let turn = null;

  // ============================================================
  // [10] Setup Screen Logic
  // ============================================================
  function initSetupScreen() {
    renderPlayerInputs(2);

    $('#add-player-btn').addEventListener('click', () => {
      const rows = $$('#player-list .player-row');
      if (rows.length < PLAYER_LIMITS.max) {
        addPlayerRow(rows.length + 1);
        updateStartButton();
      }
    });

    $$('.mode-card').forEach(card => {
      card.addEventListener('click', () => {
        $$('.mode-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        updateLoserCountSelector();
        track('roulette_mode_select', {
          game_mode: card.dataset.mode,
          bullet_count: Number(card.dataset.bullets || 1),
        });
      });
    });

    $$('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        $('#penalty-input').value = '';
      });
    });

    $('#penalty-input').addEventListener('input', () => {
      if ($('#penalty-input').value.trim()) {
        $$('.preset-btn').forEach(b => b.classList.remove('active'));
      }
    });

    $('#start-btn').addEventListener('click', handleStart);

    $('#shuffle-player-btn').addEventListener('click', () => {
      const rows = Array.from($$('#player-list .player-row'));
      if (rows.length < 2) return;
      const names = rows.map(r => r.querySelector('.player-name-input').value);
      for (let i = names.length - 1; i > 0; i--) {
        const j = RNG.getInt(0, i);
        [names[i], names[j]] = [names[j], names[i]];
      }
      rows.forEach((row, idx) => {
        row.querySelector('.player-name-input').value = names[idx];
      });
      updateStartButton();
    });

    // 참가자 수 변경 시 꽝 인원 셀렉터 업데이트
    new MutationObserver(updateLoserCountSelector).observe($('#player-list'), { childList: true });
  }

  function updateLoserCountSelector() {
    const count = $$('#player-list .player-row').length;
    const card = $('#loser-count-card');
    const selector = $('#loser-count-selector');
    const activeMode = $('.mode-card.active');
    const isSurvival = activeMode && activeMode.dataset.mode === 'survival';

    if (count < 3 || isSurvival) {
      card.style.display = 'none';
      state.loserCount = isSurvival ? count - 1 : 1;
      return;
    }

    card.style.display = '';
    const maxLosers = count - 1;
    selector.innerHTML = '';

    for (let i = 1; i <= maxLosers; i++) {
      const btn = document.createElement('button');
      btn.className = 'loser-count-btn' + (i === state.loserCount ? ' active' : '');
      btn.dataset.count = i;
      btn.textContent = `${i}명`;
      btn.addEventListener('click', () => {
        $$('.loser-count-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.loserCount = i;
      });
      selector.appendChild(btn);
    }

    if (state.loserCount > maxLosers) {
      state.loserCount = 1;
      selector.firstChild?.classList.add('active');
    }
  }

  function renderPlayerInputs(count) {
    $('#player-list').innerHTML = '';
    for (let i = 1; i <= count; i++) addPlayerRow(i);
  }

  function addPlayerRow(num) {
    const list = $('#player-list');
    const row = document.createElement('div');
    row.className = 'player-row';

    const span = document.createElement('span');
    span.className = 'player-number';
    span.textContent = num;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'input player-name-input';
    input.placeholder = `참가자 ${num}`;
    input.maxLength = NAME_MAX_LENGTH;
    input.addEventListener('input', updateStartButton);

    const btn = document.createElement('button');
    btn.className = 'remove-btn';
    btn.textContent = '×';
    btn.addEventListener('click', () => {
      if ($$('#player-list .player-row').length > PLAYER_LIMITS.min) {
        row.remove();
        renumberPlayers();
        updateStartButton();
      }
    });

    row.append(span, input, btn);
    list.appendChild(row);
    updateStartButton();
    updateAddButton();
  }

  function renumberPlayers() {
    $$('#player-list .player-row').forEach((row, i) => {
      row.querySelector('.player-number').textContent = i + 1;
      const inp = row.querySelector('.player-name-input');
      if (!inp.value) inp.placeholder = `참가자 ${i + 1}`;
    });
    updateAddButton();
  }

  function updateAddButton() {
    const c = $$('#player-list .player-row').length;
    $('#add-player-btn').disabled = c >= PLAYER_LIMITS.max;
    $('#add-player-btn').style.display = c >= PLAYER_LIMITS.max ? 'none' : '';
  }

  function updateStartButton() {
    const names = getPlayerNames();
    const filled = names.filter(n => n.length > 0);
    const hasDuplicates = filled.length !== new Set(filled).size;
    const valid = names.length >= PLAYER_LIMITS.min && names.every(n => n.length > 0) && !hasDuplicates;

    const warn = $('#duplicate-warning');
    if (hasDuplicates && filled.length > 0) {
      warn.classList.remove('hidden');
    } else {
      warn.classList.add('hidden');
    }

    $('#start-btn').disabled = !valid;
  }

  function getPlayerNames() {
    return Array.from($$('.player-name-input')).map(inp => inp.value.trim());
  }

  function getSelectedMode() {
    const a = $('.mode-card.active');
    return a ? a.dataset.mode : 'classic';
  }

  function getPenalty() {
    const custom = $('#penalty-input').value.trim();
    if (custom) return custom;
    const a = $('.preset-btn.active');
    return a ? a.dataset.penalty : '☕ 커피 사기';
  }

  // ============================================================
  // [11] Game Flow
  // ============================================================
  async function handleStart() {
    const players = getPlayerNames().filter(n => n.length > 0);
    if (players.length < PLAYER_LIMITS.min) return;

    const mode = getSelectedMode();
    const mc = MODES[mode];

    state.players = players;
    state.mode = mode;
    state.bulletCount = mc.bullets;
    state.respin = mc.respin;
    state.survival = mc.survival || false;
    state.penalty = getPenalty();
    state.losers = [];
    state.turnHistory = [];
    state.loser = null;
    state.gameOver = false;
    state.survivalRound = 0;
    state.phase = 'LOADING';

    // 서바이벌 모드: 꽝 인원 = 참가자 - 1 (최후 1인 생존)
    if (state.survival) {
      state.loserCount = players.length - 1;
    }

    track('game_start', {
      game_mode: state.mode,
      player_count: state.players.length,
      bullet_count: state.bulletCount,
      timer_enabled: state.timerEnabled,
      loser_count: state.loserCount,
    });

    showScreen('loading-screen');

    chamber.create(state.bulletCount);
    chamber.spin();
    turn = new TurnEngine(players);

    sound.playSpin();
    await anim.playSpinAnimation('loading-chamber');
    await wait(500);

    state.phase = 'PLAYING';
    showScreen('game-screen');
    renderGame();
  }

  // ============================================================
  // [12] Game Screen Rendering
  // ============================================================
  function renderGame() {
    updateCurrentPlayer();
    updateRoundInfo();
    renderChamberUI();
    renderPlayerStatusList();
    $('#trigger-btn').disabled = false;
    updateTension();
    startTimer();
  }

  function updateRoundInfo() {
    const aliveCount = state.players.length - state.losers.length;
    let text;
    if (state.survival) {
      text = `서바이벌 R${state.survivalRound + 1} · 생존 ${aliveCount}명`;
    } else {
      const totalPulls = state.turnHistory.length;
      const currentRound = aliveCount > 0 ? Math.floor(totalPulls / aliveCount) + 1 : 1;
      const pullInRound = aliveCount > 0 ? (totalPulls % aliveCount) + 1 : 1;
      text = `${currentRound}턴의 ${pullInRound}번째`;
      if (state.loserCount > 1) {
        text += ` · 꽝 ${state.losers.length}/${state.loserCount}`;
      }
    }
    $('#round-info').textContent = text;
  }

  function updateCurrentPlayer() {
    const player = turn.getCurrentPlayer();
    const prob = chamber.getRemainingProbability();
    $('#current-player').textContent = `🎯 ${player}`;
    $('#probability').textContent = `확률: ${prob.bullets}/${prob.remaining} (${prob.percent}%)`;
  }

  function renderChamberUI() {
    const visible = chamber.getVisibleState();
    const curPos = chamber.getCurrentPosition();
    const slots = $$('#game-chamber .chamber-slot');
    slots.forEach((slot, i) => {
      slot.className = 'chamber-slot';
      slot.classList.add(visible[i]);
      if (i === curPos && visible[i] === 'unknown') slot.classList.add('current');
    });
  }

  function renderPlayerStatusList() {
    const list = $('#player-status-list');
    list.innerHTML = '';
    const currentPlayer = turn.getCurrentPlayer();

    state.players.forEach(name => {
      const row = document.createElement('div');
      row.className = 'player-status-row';

      const entries = state.turnHistory.filter(h => h.player === name);
      const lastEntry = entries.length > 0 ? entries[entries.length - 1] : null;
      const isCurrent = name === currentPlayer && !state.gameOver;

      let icon = '⏳', resultText = '대기';

      if (lastEntry && lastEntry.result === 'bang') {
        icon = '💀'; resultText = `꽝! (${lastEntry.turnNumber}번째)`;
        row.classList.add('eliminated');
      } else if (isCurrent) {
        icon = '🎯';
        resultText = entries.length > 0 ? `← 현재 (생존 ${entries.length}회)` : '← 현재';
        row.classList.add('current');
      } else if (lastEntry && lastEntry.result === 'survive') {
        icon = '✅'; resultText = `생존 (${lastEntry.turnNumber}번째)`;
        row.classList.add('survived');
      }

      row.innerHTML = `
        <span class="status-icon">${icon}</span>
        <span class="status-name">${escapeHtml(name)}</span>
        <span class="status-result">${resultText}</span>`;
      list.appendChild(row);
    });
  }

  function updateTension() {
    const remaining = chamber.getRemainingProbability().remaining;
    const btn = $('#trigger-btn');
    btn.classList.remove('heartbeat-1','heartbeat-2','heartbeat-3','heartbeat-4','heartbeat-5','tension');
    if (remaining <= 1) btn.classList.add('heartbeat-5', 'tension');
    else if (remaining <= 2) btn.classList.add('heartbeat-4', 'tension');
    else if (remaining <= 3) btn.classList.add('heartbeat-3');
    else if (remaining <= 4) btn.classList.add('heartbeat-2');
    else btn.classList.add('heartbeat-1');
  }

  // ============================================================
  // [13] Trigger Handler
  // ============================================================
  let busy = false;

  async function handleTrigger() {
    if (busy) return;
    busy = true;
    stopTimer();
    $('#trigger-btn').disabled = true;

    const currentPlayer = turn.getCurrentPlayer();
    const probabilityBeforePull = chamber.getRemainingProbability();
    track('roulette_trigger_pull', {
      game_mode: state.mode,
      current_player: currentPlayer,
      remaining_chambers: probabilityBeforePull.remaining,
      remaining_bullets: probabilityBeforePull.bullets,
    });

    // 페어 모드: 매 턴 리스핀
    if (state.respin && chamber.getPullCount() > 0) {
      chamber.spin();
      renderChamberUI();
      await wait(300);
    }

    const result = chamber.pull();
    const isBang = result.isBullet;
    const turnNumber = chamber.getPullCount();

    state.turnHistory.push({
      player: currentPlayer,
      result: isBang ? 'bang' : 'survive',
      chamberIndex: result.chamberIndex,
      turnNumber
    });

    if (!isBang) {
      // === 생존 ===
      state.phase = 'SURVIVE';
      renderChamberUI();

      const prob = chamber.getRemainingProbability();
      $('#survive-player').textContent = `${currentPlayer} — 생존!`;
      $('#survive-remaining').textContent = `잔여: ${prob.bullets}/${prob.remaining} (${prob.percent}%)`;
      track('roulette_survive', {
        game_mode: state.mode,
        current_player: currentPlayer,
        remaining_probability: `${prob.bullets}/${prob.remaining}`,
      });

      sound.playClick();
      await anim.playSurviveEffect();
      showOverlay('survive-overlay');
      await wait(1500);
      hideOverlay('survive-overlay');

      turn.nextTurn();
      state.phase = 'PLAYING';
      busy = false;
      renderGame();
    } else {
      // === 꽝! ===
      state.losers.push(currentPlayer);
      turn.eliminate(currentPlayer);
      state.phase = 'BANG';
      renderChamberUI();
      track('roulette_bang', {
        game_mode: state.mode,
        current_player: currentPlayer,
        penalty_type: state.penalty,
        loser_count: state.losers.length,
      });

      $('#bang-player').textContent = `💀 ${currentPlayer} 꽝!`;

      sound.playBang();
      await anim.playBangEffect();
      showOverlay('bang-overlay');
      await wait(2000);
      hideOverlay('bang-overlay');

      if (state.losers.length >= state.loserCount) {
        // 모든 꽝 인원 확정
        state.loser = state.losers[state.losers.length - 1];
        state.gameOver = true;
        busy = false;
        renderResult();
      } else if (state.survival) {
        // 서바이벌: 매 꽝마다 새 라운드 (리스핀)
        state.survivalRound++;
        showOverlay('reload-overlay');
        sound.playSpin();
        await wait(1800);
        hideOverlay('reload-overlay');

        chamber.create(state.bulletCount);
        chamber.spin();
        turn.nextTurn();
        state.phase = 'PLAYING';
        busy = false;
        renderGame();
      } else {
        const remainingBullets = chamber.getRemainingProbability().bullets;
        if (remainingBullets > 0) {
          // 탄창에 탄환 남아있음 — 계속 진행
          turn.nextTurn();
          state.phase = 'PLAYING';
          busy = false;
          renderGame();
        } else {
          // 탄환 소진 — 재장전 연출 후 계속
          showOverlay('reload-overlay');
          sound.playSpin();
          await wait(1800);
          hideOverlay('reload-overlay');

          chamber.create(state.bulletCount);
          chamber.spin();
          turn.nextTurn();
          state.phase = 'PLAYING';
          busy = false;
          renderGame();
        }
      }
    }
  }

  // ============================================================
  // [14] Result Screen
  // ============================================================
  function renderResult() {
    const losers = state.losers;
    const penalty = state.penalty;
    track('game_complete', {
      game_mode: state.mode,
      player_count: state.players.length,
      loser_count: losers.length,
      penalty_type: penalty,
    });

    if (state.survival) {
      const winner = state.players.find(p => !losers.includes(p));
      $('#result-loser').textContent = `🏆 ${winner} 최종 생존!`;
      $('#result-penalty').textContent = `꽝: ${losers.join(', ')} · 벌칙: ${penalty}`;
    } else if (losers.length === 1) {
      $('#result-loser').textContent = `${losers[0]}님이 꽝에 걸렸습니다!`;
      $('#result-penalty').textContent = `벌칙: ${penalty}`;
    } else {
      $('#result-loser').textContent = `${losers.join(', ')} 꽝!`;
      $('#result-penalty').textContent = `벌칙: ${penalty}`;
    }

    const list = $('#result-list');
    list.innerHTML = '';

    state.players.forEach(name => {
      const entry = state.turnHistory.filter(h => h.player === name);
      const bangEntry = entry.find(e => e.result === 'bang');
      const last = entry.length > 0 ? entry[entry.length - 1] : null;
      const row = document.createElement('div');
      row.className = 'result-row';

      let icon, detail, cls;
      if (!last) {
        icon = '──'; detail = '미진행'; cls = 'pending';
      } else if (bangEntry) {
        icon = '💀'; detail = `꽝! (${bangEntry.turnNumber}번째)`; cls = 'loser';
      } else if (state.survival && !losers.includes(name)) {
        icon = '🏆'; detail = '최종 생존!'; cls = 'survivor';
      } else {
        icon = '✅'; detail = `생존 (${last.turnNumber}번째)`; cls = 'survivor';
      }

      row.classList.add(cls);
      row.innerHTML = `
        <span class="result-icon">${icon}</span>
        <span class="result-name">${escapeHtml(name)}</span>
        <span class="result-detail">${detail}</span>`;
      list.appendChild(row);
    });

    state.phase = 'RESULT';
    showScreen('result-screen');
  }

  // ============================================================
  // [15] Share
  // ============================================================
  function buildShareText() {
    const modeName = MODES[state.mode]?.name || state.mode;
    let lines = [`🔫 러시안 룰렛 — 꽝 뽑기 [${modeName}]`, ''];

    state.players.forEach(name => {
      const bangEntry = state.turnHistory.find(h => h.player === name && h.result === 'bang');
      if (bangEntry) {
        lines.push(`💀 ${name} — 꽝! (${bangEntry.turnNumber}번째)`);
      } else if (state.survival && !state.losers.includes(name)) {
        lines.push(`🏆 ${name} — 최종 생존!`);
      } else {
        const entries = state.turnHistory.filter(h => h.player === name);
        const last = entries.length > 0 ? entries[entries.length - 1] : null;
        lines.push(last ? `✅ ${name} — 생존 (${last.turnNumber}번째)` : `── ${name} — 미진행`);
      }
    });

    lines.push('', `📝 벌칙: ${state.penalty}`);
    return lines.join('\n');
  }

  function showToast(msg) {
    let toast = $('#share-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'share-toast';
      toast.className = 'share-toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
  }

  // ============================================================
  // [16] Countdown Timer
  // ============================================================
  const TIMER_DURATION = 10;
  let timerId = null;
  let timerStart = 0;

  function startTimer() {
    stopTimer();
    if (!state.timerEnabled) {
      $('#timer-bar').classList.add('hidden');
      return;
    }
    $('#timer-bar').classList.remove('hidden');
    timerStart = Date.now();
    const fill = $('#timer-fill');
    const text = $('#timer-text');
    fill.style.width = '100%';
    text.textContent = TIMER_DURATION;

    timerId = setInterval(() => {
      const elapsed = (Date.now() - timerStart) / 1000;
      const remain = Math.max(TIMER_DURATION - elapsed, 0);
      const pct = (remain / TIMER_DURATION) * 100;
      fill.style.width = pct + '%';
      text.textContent = Math.ceil(remain);

      if (remain <= 0) {
        stopTimer();
        // 자동 발사
        handleTrigger();
      }
    }, 100);
  }

  function stopTimer() {
    if (timerId) { clearInterval(timerId); timerId = null; }
  }

  // ============================================================
  // [17] Init
  // ============================================================
  document.addEventListener('DOMContentLoaded', () => {
    initSetupScreen();

    // 방아쇠 버튼
    $('#trigger-btn').addEventListener('click', handleTrigger);

    // 사운드 토글
    const soundBtn = $('#sound-toggle');
    soundBtn.addEventListener('click', () => {
      const muted = !sound._muted;
      sound.setMute(muted);
      soundBtn.textContent = muted ? '🔇' : '🔊';
      soundBtn.classList.toggle('muted', muted);
    });

    // 타이머 토글
    const timerToggle = $('#timer-toggle');
    if (timerToggle) {
      timerToggle.addEventListener('click', () => {
        state.timerEnabled = !state.timerEnabled;
        timerToggle.classList.toggle('active', state.timerEnabled);
        timerToggle.textContent = state.timerEnabled ? '⏱ 타이머 ON' : '⏱ 타이머 OFF';
        track('roulette_timer_toggle', {
          enabled: state.timerEnabled,
        });
      });
    }

    // 결과 공유 — 클립보드 복사
    const copyBtn = $('#share-copy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        track('share_result', {
          share_type: 'clipboard',
        });
        const text = buildShareText();
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(() => {
            showToast('결과가 복사되었습니다!');
          }).catch(() => {
            fallbackCopy(text);
          });
        } else {
          fallbackCopy(text);
        }
      });
    }

    function fallbackCopy(text) {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); showToast('결과가 복사되었습니다!'); }
      catch (e) { showToast('복사에 실패했습니다.'); }
      document.body.removeChild(ta);
    }

    // 결과 공유 — 카카오 / Web Share
    const kakaoBtn = $('#share-kakao-btn');
    if (kakaoBtn) {
      kakaoBtn.addEventListener('click', () => {
        track('share_result', {
          share_type: navigator.share ? 'web-share' : 'kakao-story',
        });
        const text = buildShareText();
        if (navigator.share) {
          navigator.share({ title: '러시안 룰렛 결과', text: text }).catch(() => {});
        } else {
          // 카카오톡 공유 URL scheme (모바일)
          const encoded = encodeURIComponent(text);
          window.open(`https://story.kakao.com/share?url=&text=${encoded}`, '_blank');
        }
      });
    }

    // 다시 하기
    $('#retry-btn').addEventListener('click', () => {
      track('game_restart', {});
      state.turnHistory = [];
      state.loser = null;
      state.losers = [];
      state.gameOver = false;
      busy = false;
      stopTimer();
      handleStart();
    });

    // 처음으로
    $('#home-btn').addEventListener('click', () => {
      resetState();
      busy = false;
      stopTimer();
      showScreen('setup-screen');
    });
  });

})();
