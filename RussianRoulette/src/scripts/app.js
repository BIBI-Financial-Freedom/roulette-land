/**
 * Russian Roulette — 꽝 뽑기
 * 앱 진입점: 모듈 연결 및 게임 플로우 관리
 */
import { showScreen, wait } from './utils/dom.js';
import { gameState } from './state/GameState.js';
import { ChamberEngine } from './engine/ChamberEngine.js';
import { TurnEngine } from './engine/TurnEngine.js';
import { JudgeEngine } from './engine/JudgeEngine.js';
import { SetupScreen } from './ui/SetupScreen.js';
import { GameScreen } from './ui/GameScreen.js';
import { ResultScreen } from './ui/ResultScreen.js';
import { AnimationManager } from './effects/AnimationManager.js';
import { SoundManager } from './effects/SoundManager.js';

// === Singletons ===
const chamberEngine = new ChamberEngine();
const judgeEngine = new JudgeEngine();
const animationManager = new AnimationManager();
const soundManager = new SoundManager();

let turnEngine = null;
let gameScreen = null;

// === Result Screen ===
const resultScreen = new ResultScreen(handleRetry, handleHome);

// === Setup Screen ===
new SetupScreen(handleGameStart);

// === Flow Handlers ===

async function handleGameStart() {
  const state = gameState.getState();

  // 장전 화면
  showScreen('loading-screen');

  // 탄창 생성 및 스핀
  chamberEngine.create(state.bulletCount);
  chamberEngine.spin();

  // 턴 엔진 생성
  turnEngine = new TurnEngine(state.players);

  // 게임 스크린 생성 (매번 새로 바인딩)
  gameScreen = new GameScreen(
    chamberEngine,
    turnEngine,
    judgeEngine,
    animationManager,
    handleGameOver
  );

  // 장전 연출
  soundManager.playSpin();
  await animationManager.playSpinAnimation('loading-chamber');
  await wait(500);

  // 게임 화면 전환
  gameState.setState({ phase: 'PLAYING' });
  showScreen('game-screen');
  gameScreen.render();
}

function handleGameOver(loser, penalty, history) {
  resultScreen.render(loser, penalty, history);
}

async function handleRetry() {
  const state = gameState.getState();
  // 같은 설정으로 재시작
  gameState.setState({
    phase: 'LOADING',
    turnHistory: [],
    loser: null,
    gameOver: false,
    currentPlayerIndex: 0,
  });
  await handleGameStart();
}

function handleHome() {
  gameState.reset();
  showScreen('setup-screen');
}
