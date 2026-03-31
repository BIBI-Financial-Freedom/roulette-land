// ========================================
//  App — 메인 진입점 + 화면 전환 + 게임 흐름
//  (DOC-05 아키텍처 기반)
// ========================================

import { SYMBOLS } from './constants/symbols.js';
import { SUDDEN_DEATH_MAX_ROUNDS } from './constants/scoring.js';
import { spin } from './engine/SlotEngine.js';
import { evaluate } from './engine/ScoringEngine.js';
import { getSecureRandom } from './infra/RNG.js';

// ── State ──
const state = {
  players: [],
  playerOrder: [],
  currentIndex: 0,
  results: new Map(),
  isSuddenDeath: false,
  suddenDeathRound: 0,
  suddenDeathPlayers: [],
  isMuted: false,
};

// ── DOM refs ──
const $ = (sel) => document.querySelector(sel);
const screens = {
  start:       $('#start-screen'),
  game:        $('#game-screen'),
  suddenDeath: $('#sudden-death-screen'),
  result:      $('#result-screen'),
};

// ── Screen management ──
function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

// ── Helpers ──
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = getSecureRandom(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Start Screen ──
const nameInput  = $('#player-name-input');
const addBtn     = $('#add-player-btn');
const playerList = $('#player-list');
const shuffleBtn = $('#shuffle-btn');
const startBtn   = $('#start-game-btn');

function updateStartUI() {
  playerList.innerHTML = '';
  state.players.forEach((name, i) => {
    const li = document.createElement('li');
    li.innerHTML = `
      <span class="player-name">👤 ${escapeHTML(name)}</span>
      <button class="remove-btn" data-index="${i}" aria-label="${escapeHTML(name)} 삭제">✕</button>
    `;
    playerList.appendChild(li);
  });

  const hasEnough = state.players.length >= 2;
  startBtn.disabled = !hasEnough;
  shuffleBtn.disabled = !hasEnough;
}

function addPlayer() {
  const name = nameInput.value.trim();
  if (!name || name.length > 20) return;
  if (state.players.length >= 10) return;

  // 중복 이름 처리
  let finalName = name;
  let count = 1;
  while (state.players.includes(finalName)) {
    count++;
    finalName = `${name}${count}`;
  }

  state.players.push(finalName);
  nameInput.value = '';
  nameInput.focus();
  updateStartUI();
}

addBtn.addEventListener('click', addPlayer);
nameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addPlayer();
});

playerList.addEventListener('click', (e) => {
  const btn = e.target.closest('.remove-btn');
  if (!btn) return;
  const index = parseInt(btn.dataset.index, 10);
  state.players.splice(index, 1);
  updateStartUI();
});

shuffleBtn.addEventListener('click', () => {
  state.players = shuffleArray(state.players);
  updateStartUI();
});

// ── Game Start ──
startBtn.addEventListener('click', () => {
  state.playerOrder = [...Array(state.players.length).keys()];
  state.currentIndex = 0;
  state.results.clear();
  state.isSuddenDeath = false;
  startGameRound();
});

function startGameRound() {
  showScreen('game');
  updateGameUI();
  renderScoreboard();
  $('#spin-btn').disabled = false;
}

function updateGameUI() {
  const idx = state.playerOrder[state.currentIndex];
  const name = state.players[idx];
  $('#current-player-name').textContent = name;
  $('#turn-progress').textContent = `${state.currentIndex + 1}/${state.playerOrder.length}`;

  // 릴 초기화
  [0, 1, 2].forEach(i => {
    const reel = $(`#reel-${i}`);
    reel.classList.remove('spinning', 'reel-stopped', 'matched');
    const strip = reel.querySelector('.reel-strip');
    strip.innerHTML = `<span class="symbol">${SYMBOLS[getSecureRandom(SYMBOLS.length)].emoji}</span>`;
  });
}

function renderScoreboard() {
  const list = $('#score-list');
  list.innerHTML = '';
  state.playerOrder.forEach((pIdx, orderIdx) => {
    const name = state.players[pIdx];
    const result = state.results.get(pIdx);
    const li = document.createElement('li');
    if (orderIdx === state.currentIndex && !result) {
      li.classList.add('current-turn');
    }
    li.innerHTML = `
      <span>${escapeHTML(name)}</span>
      <span class="score-value">${result ? result.score + '점' : '---'}</span>
    `;
    list.appendChild(li);
  });
}

// ── Spin ──
const spinBtn = $('#spin-btn');

spinBtn.addEventListener('click', async () => {
  spinBtn.disabled = true;
  const symbols = spin();
  const result = evaluate(symbols);
  const idx = state.playerOrder[state.currentIndex];

  // 릴 애니메이션
  await animateReels(symbols);

  // 결과 저장
  state.results.set(idx, result);
  renderScoreboard();

  // 잭팟/즉시패배 연출
  if (result.isJackpot) {
    document.body.classList.add('flash-gold');
    setTimeout(() => document.body.classList.remove('flash-gold'), 1000);
  } else if (result.isInstantLose) {
    document.body.classList.add('flash-red', 'shake');
    setTimeout(() => document.body.classList.remove('flash-red', 'shake'), 600);
  }

  // 결과 라벨 표시 (간단 팝업)
  await showResultPopup(symbols, result);

  // 다음 차례 또는 라운드 종료
  state.currentIndex++;
  if (state.currentIndex < state.playerOrder.length) {
    updateGameUI();
    spinBtn.disabled = false;
  } else {
    finishRound();
  }
});

async function animateReels(symbols) {
  const delays = [1000, 1500, 2000];

  // 릴 회전 시작
  [0, 1, 2].forEach(i => {
    const reel = $(`#reel-${i}`);
    reel.classList.add('spinning');
  });

  // 릴 순차 정지
  for (let i = 0; i < 3; i++) {
    await sleep(i === 0 ? delays[0] : delays[i] - delays[i - 1]);
    const reel = $(`#reel-${i}`);
    reel.classList.remove('spinning');
    reel.classList.add('reel-stopped');
    const strip = reel.querySelector('.reel-strip');
    strip.innerHTML = `<span class="symbol result">${symbols[i].emoji}</span>`;
  }

  await sleep(300);
}

async function showResultPopup(symbols, result) {
  // 간단 overlay 방식
  const overlay = document.createElement('div');
  overlay.className = 'result-popup scale-up';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: rgba(0,0,0,0.6); z-index: 50; color: white; text-align: center;
    cursor: pointer;
  `;
  overlay.innerHTML = `
    <div style="font-size: 48px; letter-spacing: 12px; margin-bottom: 16px;">
      ${symbols.map(s => s.emoji).join(' ')}
    </div>
    <div style="font-size: 22px; font-weight: 700; margin-bottom: 8px;">${escapeHTML(result.label)}</div>
    <div style="font-size: 32px; font-weight: 900;">${result.score}점</div>
    <div style="margin-top: 24px; font-size: 14px; opacity: 0.7;">탭하여 계속</div>
  `;

  document.body.appendChild(overlay);

  return new Promise(resolve => {
    overlay.addEventListener('click', () => {
      overlay.remove();
      resolve();
    }, { once: true });
  });
}

// ── Round Finish ──
function finishRound() {
  // 순위 계산
  const rankings = state.playerOrder.map(pIdx => ({
    playerIndex: pIdx,
    name: state.players[pIdx],
    result: state.results.get(pIdx),
  }));

  rankings.sort((a, b) => b.result.score - a.result.score);

  // 즉시 패배자 체크
  const instantLosers = rankings.filter(r => r.result.isInstantLose);
  if (instantLosers.length > 0) {
    showResult(rankings, instantLosers.map(l => l.name));
    return;
  }

  // 최하위 동점 체크
  const minScore = rankings[rankings.length - 1].result.score;
  const losers = rankings.filter(r => r.result.score === minScore);

  if (losers.length > 1) {
    startSuddenDeath(losers);
  } else {
    showResult(rankings, [losers[0].name]);
  }
}

// ── Sudden Death ──
function startSuddenDeath(tiedPlayers) {
  state.isSuddenDeath = true;
  state.suddenDeathRound = 1;
  state.suddenDeathPlayers = tiedPlayers.map(p => ({
    ...p,
    sdResult: null,
  }));

  showScreen('suddenDeath');
  renderSuddenDeath();
}

function renderSuddenDeath() {
  const names = state.suddenDeathPlayers.map(p => p.name);
  $('#sd-matchup').textContent = names.join(' vs ');
  $('#sd-current-turn').textContent = `차례: ${names[0]} (서든데스 ${state.suddenDeathRound}라운드)`;

  state.sdCurrentIndex = 0;

  [0, 1, 2].forEach(i => {
    const reel = $(`#sd-reel-${i}`);
    reel.classList.remove('spinning', 'reel-stopped');
    reel.querySelector('.reel-strip').innerHTML = '<span class="symbol">❓</span>';
  });

  $('#sd-spin-btn').disabled = false;
}

$('#sd-spin-btn').addEventListener('click', async () => {
  $('#sd-spin-btn').disabled = true;

  const player = state.suddenDeathPlayers[state.sdCurrentIndex];
  const symbols = spin();
  const result = evaluate(symbols);

  // 릴 애니메이션 (서든데스용)
  for (let i = 0; i < 3; i++) {
    const reel = $(`#sd-reel-${i}`);
    reel.classList.add('spinning');
  }

  for (let i = 0; i < 3; i++) {
    await sleep(800 + i * 400);
    const reel = $(`#sd-reel-${i}`);
    reel.classList.remove('spinning');
    reel.classList.add('reel-stopped');
    reel.querySelector('.reel-strip').innerHTML = `<span class="symbol">${symbols[i].emoji}</span>`;
  }

  await sleep(300);
  player.sdResult = result;

  await showResultPopup(symbols, result);

  state.sdCurrentIndex++;

  if (state.sdCurrentIndex < state.suddenDeathPlayers.length) {
    // 다음 서든데스 참가자
    const nextName = state.suddenDeathPlayers[state.sdCurrentIndex].name;
    $('#sd-current-turn').textContent = `차례: ${nextName} (서든데스 ${state.suddenDeathRound}라운드)`;

    [0, 1, 2].forEach(i => {
      const reel = $(`#sd-reel-${i}`);
      reel.classList.remove('reel-stopped');
      reel.querySelector('.reel-strip').innerHTML = '<span class="symbol">❓</span>';
    });

    $('#sd-spin-btn').disabled = false;
  } else {
    // 서든데스 라운드 종료 — 판정
    resolveSuddenDeath();
  }
});

function resolveSuddenDeath() {
  const players = state.suddenDeathPlayers;
  const minScore = Math.min(...players.map(p => p.sdResult.score));
  const losers = players.filter(p => p.sdResult.score === minScore);

  if (losers.length === 1 || state.suddenDeathRound >= SUDDEN_DEATH_MAX_ROUNDS) {
    // 승부 결정 또는 최대 라운드 도달 → 전원 패배
    const loserNames = losers.map(l => l.name);

    // 전체 순위 재계산
    const allRankings = state.playerOrder.map(pIdx => ({
      playerIndex: pIdx,
      name: state.players[pIdx],
      result: state.results.get(pIdx),
    }));
    allRankings.sort((a, b) => b.result.score - a.result.score);

    showResult(allRankings, loserNames);
  } else {
    // 계속 동점 → 다음 서든데스 라운드
    state.suddenDeathRound++;
    state.suddenDeathPlayers = losers.map(p => ({ ...p, sdResult: null }));
    renderSuddenDeath();
  }
}

// ── Result Screen ──
function showResult(rankings, loserNames) {
  showScreen('result');

  const list = $('#ranking-list');
  list.innerHTML = '';

  const badges = ['🥇', '🥈', '🥉'];

  rankings.forEach((r, i) => {
    const li = document.createElement('li');
    li.className = 'slide-in';
    li.style.animationDelay = `${i * 0.15}s`;
    li.innerHTML = `
      <span class="rank-badge">${badges[i] || `${i + 1}위`}</span>
      <div class="rank-info">
        <div class="rank-name">${escapeHTML(r.name)}</div>
        <div class="rank-symbols">${r.result.symbols.map(s => s.emoji).join('')}</div>
      </div>
      <span class="rank-score">${r.result.score}점</span>
    `;
    list.appendChild(li);
  });

  const loserText = loserNames.map(n => escapeHTML(n)).join(', ');
  $('#loser-name').textContent = loserText;

  // 패자 연출딜레이
  const announce = $('#loser-announce');
  announce.classList.remove('scale-up');
  setTimeout(() => {
    announce.classList.add('scale-up');
  }, rankings.length * 150 + 500);
}

// ── Restart ──
$('#restart-btn').addEventListener('click', () => {
  state.currentIndex = 0;
  state.results.clear();
  state.isSuddenDeath = false;
  showScreen('start');
});

// ── Share ──
$('#share-btn').addEventListener('click', async () => {
  const rankings = state.playerOrder.map(pIdx => ({
    name: state.players[pIdx],
    result: state.results.get(pIdx),
  }));
  rankings.sort((a, b) => b.result.score - a.result.score);

  const badges = ['🥇', '🥈', '🥉'];
  const lines = rankings.map((r, i) => {
    const badge = badges[i] || `${i + 1}위`;
    return `${badge} ${r.name} - ${r.result.symbols.map(s => s.emoji).join('')} (${r.result.score}점)`;
  });

  const loserName = $('#loser-name').textContent;
  const text = [
    '🎰 커피내기 슬롯머신 결과!',
    '━━━━━━━━━━━━━',
    ...lines,
    '━━━━━━━━━━━━━',
    `☕ ${loserName}님이 커피를 삽니다!`,
  ].join('\n');

  try {
    if (navigator.share) {
      await navigator.share({ title: 'Operation Epic Fury', text });
    } else {
      await navigator.clipboard.writeText(text);
      alert('결과가 클립보드에 복사되었습니다!');
    }
  } catch {
    // 사용자가 공유를 취소한 경우 무시
  }
});

// ── Mute ──
$('#mute-btn').addEventListener('click', () => {
  state.isMuted = !state.isMuted;
  $('#mute-btn').textContent = state.isMuted ? '🔇' : '🔊';
});

// ── Util ──
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
