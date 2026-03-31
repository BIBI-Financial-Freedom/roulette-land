import { wait } from '../utils/dom.js';

/**
 * AnimationManager — 화면 연출 관리
 */
export class AnimationManager {
  /** 탄창 스핀 연출 */
  async playSpinAnimation(chamberWrapId = 'loading-chamber') {
    const el = document.getElementById(chamberWrapId);
    el.classList.add('spinning');
    await wait(2000);
    el.classList.remove('spinning');
  }

  /** 생존 연출 — 초록 플래시 */
  async playSurviveEffect() {
    document.body.classList.add('flash-green');
    await wait(500);
    document.body.classList.remove('flash-green');
  }

  /** 꽝 연출 — 빨간 플래시 + 화면 흔들림 */
  async playBangEffect() {
    document.body.classList.add('flash-red', 'screen-shake');
    // 모바일 햅틱
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 200]);
    }
    await wait(800);
    document.body.classList.remove('flash-red', 'screen-shake');
  }
}
