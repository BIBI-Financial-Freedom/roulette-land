// ========================================
//  RNG — 암호학적 안전한 난수 생성기
//  (DOC-03 F2.2, DOC-05 §7 보안 기반)
// ========================================

/**
 * 0 이상 max 미만의 편향 없는 랜덤 정수 반환
 * rejection sampling으로 modulo bias 제거
 */
export function getSecureRandom(max) {
  if (max <= 0) throw new RangeError('max must be positive');
  if (max === 1) return 0;

  const array = new Uint32Array(1);
  const limit = Math.floor(0xFFFFFFFF / max) * max; // bias 제거 threshold

  let value;
  do {
    crypto.getRandomValues(array);
    value = array[0];
  } while (value >= limit);

  return value % max;
}

/**
 * 가중치 기반 랜덤 선택
 * @param {Array<{weight: number}>} items
 * @returns {object} 선택된 아이템
 */
export function weightedSelect(items) {
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  let random = getSecureRandom(totalWeight);
  let cumulative = 0;

  for (const item of items) {
    cumulative += item.weight;
    if (random < cumulative) {
      return item;
    }
  }

  return items[items.length - 1]; // fallback (should never reach)
}
