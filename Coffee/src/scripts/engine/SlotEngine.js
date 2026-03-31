// ========================================
//  SlotEngine — 슬롯 엔진
//  (DOC-03 F2.1, F2.2 기반)
// ========================================

import { SYMBOLS } from '../constants/symbols.js';
import { weightedSelect } from '../infra/RNG.js';

/**
 * 3릴 스핀 실행 → 심볼 3개 반환
 * @returns {[object, object, object]}
 */
export function spin() {
  return [
    weightedSelect(SYMBOLS),
    weightedSelect(SYMBOLS),
    weightedSelect(SYMBOLS),
  ];
}
