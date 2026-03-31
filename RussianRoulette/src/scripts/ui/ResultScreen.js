import { $, showScreen } from '../utils/dom.js';
import { gameState } from '../state/GameState.js';

/**
 * ResultScreen — 결과 화면 UI 로직
 */
export class ResultScreen {
  #onRetry;
  #onHome;

  constructor(onRetry, onHome) {
    this.#onRetry = onRetry;
    this.#onHome = onHome;

    $('#retry-btn').addEventListener('click', () => this.#onRetry());
    $('#home-btn').addEventListener('click', () => this.#onHome());
  }

  /**
   * @param {string} loser
   * @param {string} penalty
   * @param {Array} history — turn history
   */
  render(loser, penalty, history) {
    const state = gameState.getState();

    // 패배자 발표
    $('#result-loser').textContent = `${loser}님이 꽝에 걸렸습니다!`;
    $('#result-penalty').textContent = `벌칙: ${penalty}`;

    // 결과 목록
    const list = $('#result-list');
    list.innerHTML = '';

    state.players.forEach(name => {
      const entry = history.find(h => h.player === name);
      const row = document.createElement('div');
      row.className = 'result-row';

      let icon, detail, cls;
      if (!entry) {
        icon = '──';
        detail = '미진행';
        cls = 'pending';
      } else if (entry.result === 'bang') {
        icon = '💀';
        detail = `꽝! (${entry.turnNumber}번째)`;
        cls = 'loser';
      } else {
        icon = '✅';
        detail = `생존 (${entry.turnNumber}번째)`;
        cls = 'survivor';
      }

      row.classList.add(cls);
      row.innerHTML = `
        <span class="result-icon">${icon}</span>
        <span class="result-name">${this.#escapeHtml(name)}</span>
        <span class="result-detail">${detail}</span>
      `;
      list.appendChild(row);
    });

    gameState.setState({ phase: 'RESULT' });
    showScreen('result-screen');
  }

  #escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
}
