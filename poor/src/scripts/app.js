/* ===== 디지털 거지 시뮬레이터 — App Logic ===== */

(function () {
  'use strict';

  // ── DOM References ──
  const $ = (sel) => document.querySelector(sel);
  const screenInput = $('#screen-input');
  const screenLoading = $('#screen-loading');
  const screenResult = $('#screen-result');
  const form = $('#input-form');
  const nicknameInput = $('#nickname');
  const expense1 = $('#expense1');
  const expense2 = $('#expense2');
  const expense3 = $('#expense3');
  const btnSubmit = $('#btn-submit');
  const progressFill = $('#progress-fill');
  const progressText = $('#progress-text');
  const loadingTitle = $('#loading-title');
  const loadingMsg = $('#loading-msg');
  const balanceValue = $('#balance-value');
  const resultNickname = $('#result-nickname');
  const resultDate = $('#result-date');
  const resultDescription = $('#result-description');
  const gaugeFill = $('#gauge-fill');
  const gaugeNumber = $('#gauge-number');
  const btnDownload = $('#btn-download');
  const btnShare = $('#btn-share');
  const btnRetry = $('#btn-retry');
  const toast = $('#toast');

  // ── Sanitize ──
  function sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // ── Screen Transition ──
  function showScreen(target) {
    const screens = [screenInput, screenLoading, screenResult];
    screens.forEach((s) => {
      if (s === target) {
        s.classList.add('active', 'fade-in');
        s.classList.remove('fade-out');
        s.addEventListener('animationend', () => s.classList.remove('fade-in'), { once: true });
      } else {
        s.classList.remove('active', 'fade-in');
      }
    });
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  // ── Toast ──
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  // ── Validation ──
  function validate() {
    let valid = true;
    [nicknameInput, expense1, expense2, expense3].forEach((input) => {
      input.classList.remove('error');
      if (!input.value.trim()) {
        input.classList.add('error');
        valid = false;
      }
    });
    return valid;
  }

  // ── Loading Animation ──
  const LOADING_MESSAGES = [
    '"님의 통장 잔고를 분석하는 중..."',
    '"쓸데없는 소비 내역을 조사하는 중..."',
    '"파산 예정일을 계산하는 중..."',
    '"님의 미래를 점치는 중... 🔮"',
    '"거지력을 측정하는 중..."',
    '"통장이 비명을 지르고 있습니다..."',
  ];

  const BALANCE_STEPS = [
    3000000, 2100000, 1350000, 850000, 420000, 180000, 55000, 12000, 3000, 0,
  ];

  function formatCurrency(n) {
    return '₩' + n.toLocaleString('ko-KR');
  }

  async function runLoadingSequence(aiDoneSignal) {
    let progress = 0;
    let msgIdx = 0;
    let balIdx = 0;
    let aiDone = false;

    // AI 완료 시 신호 수신
    aiDoneSignal.then(() => { aiDone = true; });

    return new Promise((resolve) => {
      const tick = setInterval(() => {
        // Progress — AI 완료 전에는 85%까지, 완료 후 100%로
        if (aiDone) {
          progress += (100 - progress) * 0.3;
          if (progress > 99.5) progress = 100;
        } else {
          progress += Math.random() * 6 + 1;
          if (progress > 85) progress = 85;
        }
        progressFill.style.width = Math.round(progress) + '%';
        progressText.textContent = Math.round(progress) + '% 분석 완료';

        // Messages
        if (Math.random() < 0.35 && msgIdx < LOADING_MESSAGES.length) {
          loadingMsg.textContent = LOADING_MESSAGES[msgIdx++];
        }

        // Balance countdown
        if (balIdx < BALANCE_STEPS.length) {
          balanceValue.textContent = formatCurrency(BALANCE_STEPS[balIdx]);
          balanceValue.classList.add('flash');
          setTimeout(() => balanceValue.classList.remove('flash'), 300);
          if (BALANCE_STEPS[balIdx] === 0) {
            balanceValue.textContent = '₩0 💀';
            balanceValue.classList.add('dead');
          }
          balIdx++;
        }

        // 100% 도달 시 완료
        if (progress >= 100) {
          clearInterval(tick);
          progressFill.style.width = '100%';
          progressText.textContent = '100% 분석 완료';
          loadingTitle.textContent = '분석 완료!';
          setTimeout(resolve, 500);
        }
      }, 300);
    });
  }

  // ── LM Studio AI Engine ──
  const LM_STUDIO_URL = 'http://localhost:1234/v1/chat/completions';
  const LM_STUDIO_MODEL = 'gemma-4-e4b-it-heretic';
  const API_TIMEOUT = 15000; // 15초

  function buildPrompt(nickname, expenses) {
    return `너는 독설가 금융 전문가야. 유저의 쓸데없는 소비 습관을 보고 파산 시점을 예언하고 조롱해줘.
반드시 한국어로 답변해.

중요: futureDescription과 roasts의 모든 문장은 반드시 정중한 존댓말(~습니다, ~네요, ~세요 등)로 작성해.
겉으로는 공손하지만 내용은 날카롭고 비꼬는 투로, 팩폭이 제대로 느껴지게 해줘.

유저 닉네임: ${nickname}
쓸데없는 소비 1: ${expenses[0]}
쓸데없는 소비 2: ${expenses[1]}
쓸데없는 소비 3: ${expenses[2]}

반드시 아래 JSON 형식으로만 응답해. 다른 텍스트 없이 JSON만 출력해:
{
  "bankruptDate": "YYYY년 MM월 (연도는 반드시 2027년 이후)",
  "poorScore": 0~100 사이 숫자,
  "futureDescription": "파산 후 모습 묘사 2~3문장, 구체적이고 웃긴 상황, 반드시 존댓말",
  "roasts": [
    "소비1에 대한 팩폭 코멘트 1문장 (존댓말, 정중하지만 비꼬는 투)",
    "소비2에 대한 팩폭 코멘트 1문장 (존댓말, 정중하지만 비꼬는 투)",
    "소비3에 대한 팩폭 코멘트 1문장 (존댓말, 정중하지만 비꼬는 투)"
  ],
  "summary": "${nickname} 님은 YYYY년 MM월 파산 예정"
}`;
  }

  function parseAIResponse(text) {
    // JSON 블록 추출 (```json ... ``` 또는 순수 JSON)
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
    if (!jsonMatch) throw new Error('JSON not found in response');

    const parsed = JSON.parse(jsonMatch[1]);

    // 필수 필드 검증
    if (!parsed.bankruptDate || !parsed.futureDescription || !Array.isArray(parsed.roasts)) {
      throw new Error('Missing required fields');
    }

    return {
      bankruptDate: String(parsed.bankruptDate),
      poorScore: Math.max(0, Math.min(100, Number(parsed.poorScore) || 75)),
      futureDescription: String(parsed.futureDescription),
      roasts: parsed.roasts.map(String).slice(0, 3),
      summary: String(parsed.summary || `결과 생성 완료`),
    };
  }

  async function callAI(nickname, expenses) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const response = await fetch(LM_STUDIO_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: LM_STUDIO_MODEL,
          messages: [
            { role: 'system', content: '너는 독설가 금융 전문가야. 반드시 요청된 JSON 형식으로만 응답해. 한국어 존댓말로 답변해. 겉은 공손하지만 내용은 날카롭고 비꼬는 투를 유지해.' },
            { role: 'user', content: buildPrompt(nickname, expenses) },
          ],
          temperature: 0.9,
          max_tokens: 1024,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('Empty AI response');

      return parseAIResponse(content);
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn('AI call failed, using fallback:', err.message);
      return null;
    }
  }

  // ── Fallback Engine ──
  function generateFallbackResult(nickname, expenses) {
    const months = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];
    const futureMonth = months[Math.floor(Math.random() * 12)];
    const yearOffset = Math.floor(Math.random() * 3); // 0~2년 후
    const futureYear = (2027 + yearOffset) + '년';
    const poorScore = Math.floor(Math.random() * 30) + 70; // 70~99

    const descriptions = [
      `한강 대교 밑에서 무료 와이파이를 구걸하는 '사이버 각설이'로 전락할 확률이 ${poorScore}%입니다. 님의 통장은 이미 임종 직전입니다.`,
      `편의점 삼각김밥으로 연명하며 스마트폰 배터리를 공공기관에서 충전하는 '디지털 노숙인'이 될 확률이 ${poorScore}%입니다.`,
      `지하철 무임승차를 시도하다 걸려서 벌금 내느라 더 거지가 되는 '악순환의 늪'에 빠질 확률이 ${poorScore}%입니다.`,
      `카페에서 물만 시키고 3시간 버티다가 쫓겨나는 '카페 난민'이 될 확률이 ${poorScore}%입니다. 이미 통장 잔고가 라떼 한 잔 가격입니다.`,
      `중고거래 앱에서 본인의 자존심까지 팔게 되는 '만물상 거지'로 전락할 확률이 ${poorScore}%입니다. 님의 소비 패턴은 통장에 대한 테러입니다.`,
    ];

    const roastTemplates = [
      [
        `"${expenses[0]}"에 돈을 쓰면서 '나를 위한 투자'라고 합리화하고 있죠? 그 투자 수익률은 마이너스 무한대입니다.`,
        `"${expenses[1]}"? 사놓고 안 쓰는 건 쇼핑이 아니라 기부입니다. 자기 통장에 대한 기부.`,
        `"${expenses[2]}"는 매달 님 통장에서 조용히 피를 빨고 있습니다. 구독 해지가 아니라 구급차가 필요한 수준.`,
      ],
      [
        `"${expenses[0]}" — 이걸 소비라고 부르기엔 통장이 너무 억울해합니다. 돈이 증발하는 속도가 우사인 볼트급입니다.`,
        `"${expenses[1]}" — 쓸데없는 물건의 정의를 새로 쓰셨네요. 노벨 낭비상 후보입니다.`,
        `"${expenses[2]}" — 이 소비가 반복되면 님의 주소지가 '한강 이남'에서 '한강 밑'으로 바뀝니다.`,
      ],
      [
        `"${expenses[0]}"가 녹는 속도보다 님의 통장 잔고가 녹는 속도가 더 빠릅니다.`,
        `"${expenses[1]}" — 옷장에서 울고 있는 소리가 여기까지 들립니다. 님의 충동구매는 국보급입니다.`,
        `"${expenses[2]}"에 쓴 돈으로 라면을 샀으면 3개월은 버텼을 겁니다. 우선순위 조절이 시급합니다.`,
      ],
    ];

    const roasts = roastTemplates[Math.floor(Math.random() * roastTemplates.length)];
    const description = descriptions[Math.floor(Math.random() * descriptions.length)];

    return {
      bankruptDate: `${futureYear} ${futureMonth}`,
      poorScore,
      futureDescription: description,
      roasts,
      summary: `${nickname} 님은 ${futureYear} ${futureMonth} 파산 예정`,
    };
  }

  // ── Render Result ──
  function renderResult(nickname, result) {
    resultNickname.textContent = sanitize(nickname);
    resultDate.textContent = result.bankruptDate;
    resultDescription.textContent = `"${result.futureDescription}"`;

    // Roasts
    for (let i = 0; i < 3; i++) {
      const el = $(`#roast-${i + 1} .roast-text`);
      if (el && result.roasts[i]) {
        el.textContent = result.roasts[i];
      }
    }

    // Show result screen with glitch
    showScreen(screenResult);
    screenResult.classList.add('glitch-in');
    screenResult.addEventListener('animationend', () => {
      screenResult.classList.remove('glitch-in');
    }, { once: true });

    // Animate result card
    const card = $('#result-card');
    card.classList.add('animate-in');
    card.addEventListener('animationend', () => {
      card.classList.remove('animate-in');
      card.classList.add('shake');
      card.addEventListener('animationend', () => card.classList.remove('shake'), { once: true });
    }, { once: true });

    // Animate gauge
    setTimeout(() => {
      gaugeFill.style.width = result.poorScore + '%';
      animateCounter(gaugeNumber, 0, result.poorScore, 1200);
    }, 400);

    // Stagger roast items
    document.querySelectorAll('.roast-item').forEach((item, i) => {
      setTimeout(() => item.classList.add('animate-in'), 800 + i * 250);
    });
  }

  // ── Counter Animation ──
  function animateCounter(el, from, to, duration) {
    const start = performance.now();
    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      el.textContent = Math.round(from + (to - from) * eased);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ── Reset ──
  function resetAll() {
    // Reset loading
    progressFill.style.width = '0%';
    progressText.textContent = '0% 분석 완료';
    loadingTitle.textContent = '통장 잔고를 분석 중...';
    loadingMsg.textContent = '"님의 쓸데없는 소비 내역을 조사하는 중..."';
    balanceValue.textContent = '₩3,000,000';
    balanceValue.classList.remove('dead');

    // Reset result animations
    gaugeFill.style.width = '0%';
    gaugeNumber.textContent = '0';
    document.querySelectorAll('.roast-item').forEach((item) => item.classList.remove('animate-in'));

    // Reset form
    form.reset();
    [nicknameInput, expense1, expense2, expense3].forEach((i) => i.classList.remove('error'));

    showScreen(screenInput);
  }

  // ── Image Download (html2canvas) ──
  async function downloadImage(nickname) {
    const card = $('#result-card');
    if (!window.html2canvas) {
      showToast('이미지 라이브러리 로딩 중... 다시 시도해 주세요');
      return;
    }

    btnDownload.textContent = '⏳ 생성 중...';
    btnDownload.disabled = true;

    try {
      await document.fonts.ready;

      // html2canvas가 CSS 애니메이션 최종 상태를 못 읽으므로 캡처 전 opacity 강제 설정
      const roastItems = card.querySelectorAll('.roast-item');
      roastItems.forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });

      const canvas = await html2canvas(card, {
        scale: 2,
        backgroundColor: '#0D0D0D',
        useCORS: true,
        logging: false,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        width: card.scrollWidth,
        height: card.scrollHeight,
      });

      canvas.toBlob((blob) => {
        // 캡처 후 인라인 스타일 복원
        roastItems.forEach((el) => { el.style.opacity = ''; el.style.transform = ''; });
        if (!blob) {
          showToast('이미지 생성에 실패했습니다');
          return;
        }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `디지털거지_${sanitize(nickname)}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('이미지가 저장되었습니다! ✅');
      }, 'image/png');
    } catch (err) {
      console.error('Capture failed:', err);
      showToast('이미지 생성 중 오류가 발생했습니다');
    } finally {
      btnDownload.textContent = '📥 이미지 저장';
      btnDownload.disabled = false;
    }
  }

  // ── Share ──
  async function shareResult(nickname, result) {
    const text = `💸 ${result.summary}\n나도 테스트 해보기 👉`;
    const url = window.location.href.split('?')[0];

    if (navigator.share) {
      try {
        await navigator.share({ title: '💸 디지털 거지 시뮬레이터', text, url });
      } catch (e) {
        // User cancelled or error — fallback to clipboard
        await copyToClipboard(url, text);
      }
    } else {
      await copyToClipboard(url, text);
    }
  }

  async function copyToClipboard(url, text) {
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      showToast('링크가 복사되었습니다! 📋');
    } catch {
      showToast('복사에 실패했습니다. 직접 URL을 복사해 주세요.');
    }
  }

  // ── Event Handlers ──
  let currentResult = null;
  let currentNickname = '';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate()) return;

    currentNickname = nicknameInput.value.trim();
    const expenses = [
      expense1.value.trim(),
      expense2.value.trim(),
      expense3.value.trim(),
    ];

    // Switch to loading
    showScreen(screenLoading);

    // AI 호출 — 완료 신호를 로딩 애니메이션에 전달
    let signalAIDone;
    const aiDoneSignal = new Promise((resolve) => { signalAIDone = resolve; });

    const aiPromise = callAI(currentNickname, expenses).then((result) => {
      signalAIDone();
      return result;
    });

    // 로딩 애니메이션은 AI 완료 시까지 자연스럽게 진행
    const [aiResult] = await Promise.all([
      aiPromise,
      runLoadingSequence(aiDoneSignal),
    ]);

    // AI 성공 시 사용, 실패 시 폴백
    currentResult = aiResult || generateFallbackResult(currentNickname, expenses);

    // Render
    renderResult(currentNickname, currentResult);
  });

  btnRetry.addEventListener('click', resetAll);

  btnDownload.addEventListener('click', () => {
    downloadImage(currentNickname);
  });

  btnShare.addEventListener('click', () => {
    if (currentResult) {
      shareResult(currentNickname, currentResult);
    }
  });

  // Remove error on input
  [nicknameInput, expense1, expense2, expense3].forEach((input) => {
    input.addEventListener('input', () => input.classList.remove('error'));
  });

})();
