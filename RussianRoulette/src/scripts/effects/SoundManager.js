/**
 * SoundManager — 사운드 재생 관리
 * 데모 버전: Web Audio API oscillator로 간이 사운드 생성
 * (외부 사운드 파일 없이 동작)
 */
export class SoundManager {
  #ctx;
  #muted = false;

  constructor() {
    this.#ctx = null;
  }

  #ensureContext() {
    if (!this.#ctx) {
      this.#ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.#ctx.state === 'suspended') {
      this.#ctx.resume();
    }
    return this.#ctx;
  }

  setMute(muted) {
    this.#muted = muted;
  }

  /** 찰칵 사운드 (생존) — 짧은 클릭 */
  playClick() {
    if (this.#muted) return;
    try {
      const ctx = this.#ensureContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.08);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    } catch { /* ignore audio errors */ }
  }

  /** 빵! 사운드 (꽝) — 폭발음 */
  playBang() {
    if (this.#muted) return;
    try {
      const ctx = this.#ensureContext();

      // Noise burst for explosion
      const bufferSize = ctx.sampleRate * 0.3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2000, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.3);

      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start(ctx.currentTime);
    } catch { /* ignore audio errors */ }
  }

  /** 스핀 사운드 — 기계적 회전음 */
  playSpin() {
    if (this.#muted) return;
    try {
      const ctx = this.#ensureContext();
      // Play a series of clicks to simulate spinning
      for (let i = 0; i < 12; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600 - i * 30, ctx.currentTime + i * 0.12);
        gain.gain.setValueAtTime(0.15, ctx.currentTime + i * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.05);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.05);
      }
    } catch { /* ignore audio errors */ }
  }
}
