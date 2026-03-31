import { $, showOverlay, hideOverlay, wait } from '../utils/dom.js';
import { gameState } from '../state/GameState.js';
import { CHAMBER_SIZE } from '../constants/config.js';

/**
 * GameScreen — 게임 화면 UI 로직
 */
export class GameScreen {
  #chamberEngine;
  #turnEngine;
  #judgeEngine;
  #animationManager;
  #onGameOver;
  #busy = false;

  constructor(chamberEngine, turnEngine, judgeEngine, animationManager, onGameOver) {
    this.#chamberEngine = chamberEngine;
    this.#turnEngine = turnEngine;
    this.#judgeEngine = judgeEngine;
    this.#animationManager = animationManager;
    this.#onGameOver = onGameOver;

    // onclick은 기존 핸들러를 교체하므로 중복 바인딩 방지
    $('#trigger-btn').onclick = () => this.#handleTrigger();
  }

  /** 게임 화면 초기화 및 렌더 */
  render() {
    this.#busy = false;
    const state = gameState.getState();

    // 현재 플레이어
    this.#updateCurrentPlayer();

    // 탄창 UI
    this.#renderChamber();

    // 참가자 상태 목록
    this.#renderPlayerStatusList();

    // 방아쇠 활성화
    $('#trigger-btn').disabled = false;

    // 긴장감 클래스
    this.#updateTension();
  }

  #updateCurrentPlayer() {
    const player = this.#turnEngine.getCurrentPlayer();
    const prob = this.#chamberEngine.getRemainingProbability();
    $('#current-player').textContent = `🎯 ${player}`;
    $('#probability').textContent = `확률: ${prob.bullets}/${prob.remaining} (${prob.percent}%)`;
  }

  #renderChamber() {
    const visible = this.#chamberEngine.getVisibleState();
    const currentPos = this.#chamberEngine.getCurrentPosition();
    const slots = document.querySelectorAll('#game-chamber .chamber-slot');

    slots.forEach((slot, i) => {
      slot.className = 'chamber-slot';
      slot.classList.add(visible[i]);
      if (i === currentPos && visible[i] === 'unknown') {
        slot.classList.add('current');
      }
    });
  }

  #renderPlayerStatusList() {
    const state = gameState.getState();
    const list = $('#player-status-list');
    list.innerHTML = '';

    const currentPlayer = this.#turnEngine.getCurrentPlayer();

    state.players.forEach((name, i) => {
      const row = document.createElement('div');
      row.className = 'player-status-row';

      // 해당 플레이어의 모든 히스토리 (순환 턴 대응)
      const historyEntries = state.turnHistory.filter(h => h.player === name);
      const lastEntry = historyEntries.length > 0 ? historyEntries[historyEntries.length - 1] : null;
      const isCurrent = name === currentPlayer && !state.gameOver;

      let icon = '⏳';
      let resultText = '대기';

      // 꽝 당한 플레이어
      if (lastEntry && lastEntry.result === 'bang') {
        icon = '💀';
        resultText = `꽝! (${lastEntry.turnNumber}번째)`;
        row.classList.add('eliminated');
      }
      // 현재 차례 (이전에 생존했더라도 현재 턴이면 현재 표시)
      else if (isCurrent) {
        icon = '🎯';
        resultText = historyEntries.length > 0 ? `← 현재 (생존 ${historyEntries.length}회)` : '← 현재';
        row.classList.add('current');
      }
      // 생존한 플레이어 (현재 차례 아님)
      else if (lastEntry && lastEntry.result === 'survive') {
        icon = '✅';
        resultText = `생존 (${lastEntry.turnNumber}번째)`;
        row.classList.add('survived');
      }

      row.innerHTML = `
        <span class="status-icon">${icon}</span>
        <span class="status-name">${this.#escapeHtml(name)}</span>
        <span class="status-result">${resultText}</span>
      `;
      list.appendChild(row);
    });
  }

  async #handleTrigger() {
    if (this.#busy) return;
    this.#busy = true;
    $('#trigger-btn').disabled = true;

    const state = gameState.getState();
    const currentPlayer = this.#turnEngine.getCurrentPlayer();

    // 페어 모드: 매 턴 리스핀
    if (state.respin && this.#chamberEngine.getPullCount() > 0) {
      this.#chamberEngine.spin();
      this.#renderChamber();
      await wait(300);
    }

    // 방아쇠 당기기
    const pullResult = this.#chamberEngine.pull();
    const verdict = this.#judgeEngine.judge(pullResult, currentPlayer, state.penalty);
    const turnNumber = this.#chamberEngine.getPullCount();

    // 히스토리 추가
    const history = [...state.turnHistory, {
      player: currentPlayer,
      result: verdict.type === 'BANG' ? 'bang' : 'survive',
      chamberIndex: pullResult.chamberIndex,
      turnNumber
    }];

    if (verdict.type === 'SURVIVE') {
      // 생존 연출
      gameState.setState({ turnHistory: history, phase: 'SURVIVE' });
      this.#renderChamber();

      const prob = this.#chamberEngine.getRemainingProbability();
      $('#survive-player').textContent = `${currentPlayer} — 생존!`;
      $('#survive-remaining').textContent = `잔여: ${prob.bullets}/${prob.remaining} (${prob.percent}%)`;

      await this.#animationManager.playSurviveEffect();
      showOverlay('survive-overlay');
      await wait(1500);
      hideOverlay('survive-overlay');

      // 다음 턴
      this.#turnEngine.nextTurn();
      gameState.setState({ phase: 'PLAYING', currentPlayerIndex: this.#turnEngine.getCurrentIndex() });
      this.render();
    } else {
      // 꽝! 연출
      gameState.setState({
        turnHistory: history,
        loser: currentPlayer,
        gameOver: true,
        phase: 'BANG'
      });
      this.#renderChamber();

      $('#bang-player').textContent = `💀 ${currentPlayer} 꽝!`;

      await this.#animationManager.playBangEffect();
      showOverlay('bang-overlay');
      await wait(2000);
      hideOverlay('bang-overlay');

      this.#onGameOver(currentPlayer, state.penalty, history);
    }
  }

  #updateTension() {
    const prob = this.#chamberEngine.getRemainingProbability();
    const remaining = prob.remaining;
    const trigger = $('#trigger-btn');

    // Remove all heartbeat classes
    trigger.classList.remove('heartbeat-1', 'heartbeat-2', 'heartbeat-3', 'heartbeat-4', 'heartbeat-5', 'tension');

    if (remaining <= 1) {
      trigger.classList.add('heartbeat-5', 'tension');
    } else if (remaining <= 2) {
      trigger.classList.add('heartbeat-4', 'tension');
    } else if (remaining <= 3) {
      trigger.classList.add('heartbeat-3');
    } else if (remaining <= 4) {
      trigger.classList.add('heartbeat-2');
    } else {
      trigger.classList.add('heartbeat-1');
    }
  }

  #escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
