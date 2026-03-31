/**
 * TurnEngine — 참가자 턴 순서 관리
 */
export class TurnEngine {
  #players;
  #currentIndex;

  /**
   * @param {string[]} players
   */
  constructor(players) {
    this.#players = [...players];
    this.#currentIndex = 0;
  }

  getCurrentPlayer() {
    return this.#players[this.#currentIndex];
  }

  getCurrentIndex() {
    return this.#currentIndex;
  }

  getPlayers() {
    return [...this.#players];
  }

  /** 다음 참가자로 이동 */
  nextTurn() {
    this.#currentIndex = (this.#currentIndex + 1) % this.#players.length;
  }

  /** 초기화 */
  reset() {
    this.#currentIndex = 0;
  }
}
