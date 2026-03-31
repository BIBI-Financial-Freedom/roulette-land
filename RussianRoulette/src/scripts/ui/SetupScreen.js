import { $, $$, showScreen } from '../utils/dom.js';
import { PLAYER_LIMITS, NAME_MAX_LENGTH, MODES } from '../constants/config.js';
import { gameState } from '../state/GameState.js';

/**
 * SetupScreen — 시작 화면 UI 로직
 */
export class SetupScreen {
  #onStart;

  constructor(onStart) {
    this.#onStart = onStart;
    this.#init();
  }

  #init() {
    // 초기 참가자 2명 생성
    this.#renderPlayerInputs(2);

    // 참가자 추가 버튼
    $('#add-player-btn').addEventListener('click', () => {
      const rows = $$('#player-list .player-row');
      if (rows.length < PLAYER_LIMITS.max) {
        this.#addPlayerRow(rows.length + 1);
        this.#updateStartButton();
      }
    });

    // 모드 선택
    $$('.mode-card').forEach(card => {
      card.addEventListener('click', () => {
        $$('.mode-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
      });
    });

    // 벌칙 프리셋
    $$('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        $$('.preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        $('#penalty-input').value = '';
      });
    });

    // 커스텀 벌칙 입력 시 프리셋 해제
    $('#penalty-input').addEventListener('input', () => {
      if ($('#penalty-input').value.trim()) {
        $$('.preset-btn').forEach(b => b.classList.remove('active'));
      }
    });

    // 게임 시작 버튼
    $('#start-btn').addEventListener('click', () => this.#handleStart());
  }

  #renderPlayerInputs(count) {
    const list = $('#player-list');
    list.innerHTML = '';
    for (let i = 1; i <= count; i++) {
      this.#addPlayerRow(i);
    }
  }

  #addPlayerRow(number) {
    const list = $('#player-list');
    const row = document.createElement('div');
    row.className = 'player-row';

    const numSpan = document.createElement('span');
    numSpan.className = 'player-number';
    numSpan.textContent = number;

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'input player-name-input';
    input.placeholder = `참가자 ${number}`;
    input.maxLength = NAME_MAX_LENGTH;
    input.addEventListener('input', () => this.#updateStartButton());

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-btn';
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', () => {
      if ($$('#player-list .player-row').length > PLAYER_LIMITS.min) {
        row.remove();
        this.#renumberPlayers();
        this.#updateStartButton();
      }
    });

    row.appendChild(numSpan);
    row.appendChild(input);
    row.appendChild(removeBtn);
    list.appendChild(row);

    this.#updateStartButton();
    this.#updateAddButton();
  }

  #renumberPlayers() {
    $$('#player-list .player-row').forEach((row, i) => {
      row.querySelector('.player-number').textContent = i + 1;
      const inp = row.querySelector('.player-name-input');
      if (!inp.value) inp.placeholder = `참가자 ${i + 1}`;
    });
    this.#updateAddButton();
  }

  #updateAddButton() {
    const count = $$('#player-list .player-row').length;
    $('#add-player-btn').disabled = count >= PLAYER_LIMITS.max;
    $('#add-player-btn').style.display = count >= PLAYER_LIMITS.max ? 'none' : '';
  }

  #updateStartButton() {
    const names = this.#getPlayerNames();
    const valid = names.length >= PLAYER_LIMITS.min && names.every(n => n.length > 0);
    $('#start-btn').disabled = !valid;
  }

  #getPlayerNames() {
    return Array.from($$('.player-name-input')).map(inp => inp.value.trim());
  }

  #getSelectedMode() {
    const active = $('.mode-card.active');
    return active ? active.dataset.mode : 'classic';
  }

  #getPenalty() {
    const custom = $('#penalty-input').value.trim();
    if (custom) return custom;
    const activePreset = $('.preset-btn.active');
    return activePreset ? activePreset.dataset.penalty : '☕ 커피 사기';
  }

  #handleStart() {
    const players = this.#getPlayerNames().filter(n => n.length > 0);
    if (players.length < PLAYER_LIMITS.min) return;

    const mode = this.#getSelectedMode();
    const modeConfig = MODES[mode];

    gameState.setState({
      players,
      mode,
      bulletCount: modeConfig.bullets,
      respin: modeConfig.respin,
      penalty: this.#getPenalty(),
      phase: 'LOADING',
      turnHistory: [],
      loser: null,
      gameOver: false,
      currentPlayerIndex: 0,
    });

    this.#onStart();
  }
}
