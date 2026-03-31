/**
 * 게임 설정 상수
 */
export const MODES = {
  classic: { name: '클래식', bullets: 1, respin: false, icon: '🎯', desc: '탄환 1발, 순차 진행' },
  fair:    { name: '페어',   bullets: 1, respin: true,  icon: '⚖️', desc: '매 턴 리스핀' },
};

export const CHAMBER_SIZE = 6;

export const PENALTY_PRESETS = [
  '☕ 커피 사기',
  '🍽️ 점심값 쏘기',
  '🧹 청소하기',
  '🎤 노래 부르기',
];

export const PLAYER_LIMITS = { min: 2, max: 6 };
export const NAME_MAX_LENGTH = 10;
