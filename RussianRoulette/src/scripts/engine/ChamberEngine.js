import { RNG } from '../infra/RNG.js';
import { CHAMBER_SIZE } from '../constants/config.js';

/**
 * ChamberEngine — 탄창 생성, 배치, 스핀, 발사
 * 탄환 위치는 #private으로 캡슐화하여 외부 노출 차단
 */
export class ChamberEngine {
  #chamber;    // boolean[] — true = bullet
  #position;   // current index
  #revealed;   // boolean[] — which slots have been revealed
  #pullCount;  // how many pulls done

  constructor() {
    this.#chamber = Array(CHAMBER_SIZE).fill(false);
    this.#position = 0;
    this.#revealed = Array(CHAMBER_SIZE).fill(false);
    this.#pullCount = 0;
  }

  /**
   * 탄창에 탄환 배치
   * @param {number} bulletCount — 탄환 수 (1~3)
   */
  create(bulletCount = 1) {
    this.#chamber = Array(CHAMBER_SIZE).fill(false);
    this.#revealed = Array(CHAMBER_SIZE).fill(false);
    this.#pullCount = 0;

    const indices = Array.from({ length: CHAMBER_SIZE }, (_, i) => i);
    const bulletPositions = RNG.sample(indices, bulletCount);
    bulletPositions.forEach(pos => {
      this.#chamber[pos] = true;
    });
  }

  /** 탄창 스핀 — 시작 위치 무작위화 */
  spin() {
    this.#position = RNG.getInt(0, CHAMBER_SIZE - 1);
    this.#revealed = Array(CHAMBER_SIZE).fill(false);
    this.#pullCount = 0;
  }

  /**
   * 방아쇠 당기기
   * @returns {{ isBullet: boolean, chamberIndex: number }}
   */
  pull() {
    const index = this.#position;
    const isBullet = this.#chamber[index];
    this.#revealed[index] = true;
    this.#pullCount++;
    this.#position = (this.#position + 1) % CHAMBER_SIZE;
    return { isBullet, chamberIndex: index };
  }

  /** 현재 위치 인덱스 */
  getCurrentPosition() {
    return this.#position;
  }

  /** Pull 횟수 */
  getPullCount() {
    return this.#pullCount;
  }

  /**
   * UI용 안전한 상태 (탄환 위치 숨김)
   * @returns {string[]} — 'unknown' | 'empty' | 'bullet'
   */
  getVisibleState() {
    return this.#revealed.map((revealed, i) => {
      if (!revealed) return 'unknown';
      return this.#chamber[i] ? 'bullet' : 'empty';
    });
  }

  /**
   * 잔여 확률 계산
   * @returns {{ bullets: number, remaining: number, percent: string }}
   */
  getRemainingProbability() {
    let remaining = 0;
    let bullets = 0;
    for (let i = 0; i < CHAMBER_SIZE; i++) {
      if (!this.#revealed[i]) {
        remaining++;
        if (this.#chamber[i]) bullets++;
      }
    }
    const percent = remaining > 0 ? ((bullets / remaining) * 100).toFixed(1) : '0.0';
    return { bullets, remaining, percent };
  }
}
