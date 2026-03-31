// ========================================
//  점수 테이블 (DOC-01 개요서 §6 기반)
// ========================================

export const MATCH_TYPES = {
  JACKPOT:          'JACKPOT',
  TRIPLE:           'TRIPLE',
  DOUBLE_ESPRESSO:  'DOUBLE_ESPRESSO',
  DOUBLE:           'DOUBLE',
  SINGLE_ESPRESSO:  'SINGLE_ESPRESSO',
  ALL_DIFFERENT:    'ALL_DIFFERENT',
  INSTANT_LOSE:     'INSTANT_LOSE',
};

export const SCORE_TABLE = {
  [MATCH_TYPES.JACKPOT]:         1000,
  [MATCH_TYPES.TRIPLE]:           500,
  [MATCH_TYPES.DOUBLE_ESPRESSO]:  300,
  [MATCH_TYPES.DOUBLE]:           200,
  [MATCH_TYPES.SINGLE_ESPRESSO]:  150,
  [MATCH_TYPES.ALL_DIFFERENT]:    100,
  [MATCH_TYPES.INSTANT_LOSE]:       0,
};

export const MATCH_LABELS = {
  [MATCH_TYPES.JACKPOT]:         '🎉 잭팟! 트리플 에스프레소!',
  [MATCH_TYPES.TRIPLE]:          '✨ 트리플 매치!',
  [MATCH_TYPES.DOUBLE_ESPRESSO]: '☕ 더블 에스프레소!',
  [MATCH_TYPES.DOUBLE]:          '👍 더블 매치!',
  [MATCH_TYPES.SINGLE_ESPRESSO]: '☕ 에스프레소 싱글',
  [MATCH_TYPES.ALL_DIFFERENT]:   '😐 올 디퍼런트',
  [MATCH_TYPES.INSTANT_LOSE]:    '💀 트리플 물! 즉시 패배!',
};

export const SUDDEN_DEATH_MAX_ROUNDS = 5;
