/**
 * JudgeEngine — 결과 판정
 */
export class JudgeEngine {
  /**
   * 방아쇠 결과 판정
   * @param {{ isBullet: boolean, chamberIndex: number }} pullResult
   * @param {string} currentPlayer
   * @param {string} penalty
   * @returns {{ type: 'SURVIVE'|'BANG', player: string, chamberIndex: number, penalty?: string }}
   */
  judge(pullResult, currentPlayer, penalty) {
    if (pullResult.isBullet) {
      return {
        type: 'BANG',
        player: currentPlayer,
        chamberIndex: pullResult.chamberIndex,
        penalty
      };
    }
    return {
      type: 'SURVIVE',
      player: currentPlayer,
      chamberIndex: pullResult.chamberIndex
    };
  }
}
