// ========================================
//  심볼 정의 (DOC-01 개요서 §5 기반)
// ========================================

export const SYMBOLS = [
  { id: 'espresso', emoji: '☕', name: '에스프레소', grade: 'S', weight: 5 },
  { id: 'bean',     emoji: '🫘', name: '원두',       grade: 'A', weight: 15 },
  { id: 'donut',    emoji: '🍩', name: '도넛',       grade: 'B', weight: 20 },
  { id: 'milk',     emoji: '🥛', name: '우유',       grade: 'B', weight: 20 },
  { id: 'sugar',    emoji: '🧊', name: '각설탕',     grade: 'C', weight: 20 },
  { id: 'water',    emoji: '💧', name: '물',         grade: 'D', weight: 20 },
];

export const TOTAL_WEIGHT = SYMBOLS.reduce((sum, s) => sum + s.weight, 0);
