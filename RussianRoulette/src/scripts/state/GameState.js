/**
 * GameState — 중앙 상태 관리 (Observer 패턴)
 */

const initialState = {
  phase: 'SETUP',       // SETUP | LOADING | PLAYING | SURVIVE | BANG | RESULT
  players: [],
  mode: 'classic',
  bulletCount: 1,
  respin: false,
  penalty: '☕ 커피 사기',
  soundEnabled: true,

  currentPlayerIndex: 0,
  turnHistory: [],      // { player, result, chamberIndex }[]

  loser: null,
  gameOver: false,
};

class GameState {
  #state;
  #listeners;

  constructor() {
    this.#state = { ...initialState };
    this.#listeners = new Set();
  }

  getState() {
    return { ...this.#state };
  }

  setState(partial) {
    this.#state = { ...this.#state, ...partial };
    this.#notify();
  }

  subscribe(listener) {
    this.#listeners.add(listener);
    return () => this.#listeners.delete(listener);
  }

  #notify() {
    const snapshot = this.getState();
    this.#listeners.forEach(fn => fn(snapshot));
  }

  reset() {
    this.#state = { ...initialState };
    this.#notify();
  }
}

export const gameState = new GameState();
