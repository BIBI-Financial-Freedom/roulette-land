/**
 * RNG — 암호학적 안전 난수 생성기
 * crypto.getRandomValues() 기반, Math.random() 사용 금지
 */
export const RNG = {
  /**
   * min~max 범위의 정수 난수 (양끝 포함)
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */
  getInt(min, max) {
    const range = max - min + 1;
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return min + (array[0] % range);
  },

  /**
   * 배열에서 n개 무작위 비복원 추출
   * @param {Array} array
   * @param {number} n
   * @returns {Array}
   */
  sample(array, n) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = this.getInt(0, i);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, n);
  },

  /**
   * Fisher-Yates 셔플
   * @param {Array} array
   * @returns {Array}
   */
  shuffle(array) {
    return this.sample(array, array.length);
  }
};
