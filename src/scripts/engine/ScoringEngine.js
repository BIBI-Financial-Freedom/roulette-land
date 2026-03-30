// ========================================
//  ScoringEngine — 점수 산출 + 조합 판정
//  (DOC-03 F3.1, F3.2 기반)
// ========================================

import { MATCH_TYPES, SCORE_TABLE, MATCH_LABELS } from '../constants/scoring.js';

/**
 * 심볼 3개의 조합을 판정하고 점수를 반환한다.
 * @param {[object, object, object]} symbols
 * @returns {{ symbols, matchType, score, label, isJackpot, isInstantLose }}
 */
export function evaluate(symbols) {
  const [a, b, c] = symbols;
  const ids = [a.id, b.id, c.id];

  let matchType;

  // 트리플 체크
  if (ids[0] === ids[1] && ids[1] === ids[2]) {
    if (ids[0] === 'water') {
      matchType = MATCH_TYPES.INSTANT_LOSE;
    } else if (ids[0] === 'espresso') {
      matchType = MATCH_TYPES.JACKPOT;
    } else {
      matchType = MATCH_TYPES.TRIPLE;
    }
  }
  // 더블 체크
  else {
    const counts = {};
    for (const id of ids) {
      counts[id] = (counts[id] || 0) + 1;
    }

    const doubled = Object.keys(counts).find(k => counts[k] === 2);
    if (doubled) {
      matchType = doubled === 'espresso'
        ? MATCH_TYPES.DOUBLE_ESPRESSO
        : MATCH_TYPES.DOUBLE;
    }
    // 싱글 에스프레소
    else if (ids.includes('espresso')) {
      matchType = MATCH_TYPES.SINGLE_ESPRESSO;
    }
    // 올 디퍼런트
    else {
      matchType = MATCH_TYPES.ALL_DIFFERENT;
    }
  }

  return {
    symbols,
    matchType,
    score: SCORE_TABLE[matchType],
    label: MATCH_LABELS[matchType],
    isJackpot: matchType === MATCH_TYPES.JACKPOT,
    isInstantLose: matchType === MATCH_TYPES.INSTANT_LOSE,
  };
}
