/* ===== 문해력 바닥 인증기 — App Logic ===== */

(function () {
  'use strict';

  // ── DOM ──
  const $ = (sel) => document.querySelector(sel);
  const screenStep1 = $('#screen-step1');
  const screenStep2 = $('#screen-step2');
  const screenLoading = $('#screen-loading');
  const screenResult = $('#screen-result');

  const step1Form = $('#step1-form');
  const step2Form = $('#step2-form');
  const nicknameInput = $('#nickname');
  const topicGrid = $('#topic-grid');
  const btnNext = $('#btn-next');
  const btnBack = $('#btn-back');
  const btnAnalyze = $('#btn-analyze');
  const step2TopicLabel = $('#step2-topic-label');
  const userText = $('#user-text');
  const charCount = $('#char-count');
  const charMin = $('#char-min');

  const progressFill = $('#progress-fill');
  const progressText = $('#progress-text');
  const loadingTitle = $('#loading-title');
  const loadingMsg = $('#loading-msg');

  const resultNickname = $('#result-nickname');
  const resultAge = $('#result-age');
  const gaugeFill = $('#gauge-fill');
  const gaugeNumber = $('#gauge-number');
  const resultEra = $('#result-era');
  const resultKeyword = $('#result-keyword');
  const resultAnalysis = $('#result-analysis');
  const btnDownload = $('#btn-download');
  const btnShare = $('#btn-share');
  const btnRetry = $('#btn-retry');
  const toast = $('#toast');

  // ── State ──
  let selectedTopic = null;
  let currentResult = null;
  let currentNickname = '';

  const TOPICS = {
    excuse: { name: '변명의 달인', placeholder: '아 진짜 이거 제 잘못이 아니라...' },
    money: { name: '돈 빌리기', placeholder: '야 나 진짜 급한데 좀만 빌려줘 ㅠㅠ...' },
    breakup: { name: '이별 통보', placeholder: '우리 좀 얘기 좀 하자...' },
    late: { name: '지각 변명', placeholder: '미안 지금 거의 다 왔어...' },
  };

  // ── Utilities ──
  function sanitize(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function showScreen(target) {
    [screenStep1, screenStep2, screenLoading, screenResult].forEach((s) => {
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

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  }

  // ── Step 1: Topic Selection ──
  topicGrid.addEventListener('click', (e) => {
    const card = e.target.closest('.topic-card');
    if (!card) return;
    document.querySelectorAll('.topic-card').forEach((c) => c.classList.remove('selected'));
    card.classList.add('selected');
    selectedTopic = card.dataset.topic;
    updateStep1Validity();
  });

  nicknameInput.addEventListener('input', updateStep1Validity);

  function updateStep1Validity() {
    btnNext.disabled = !(nicknameInput.value.trim().length >= 1 && selectedTopic);
  }

  step1Form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!nicknameInput.value.trim() || !selectedTopic) return;
    currentNickname = nicknameInput.value.trim();

    // Prepare step 2
    const topic = TOPICS[selectedTopic];
    step2TopicLabel.textContent = `주제: ${topic.name}`;
    userText.placeholder = topic.placeholder;
    userText.value = '';
    charCount.textContent = '0';
    charMin.classList.remove('met');
    btnAnalyze.disabled = true;

    showScreen(screenStep2);
    userText.focus();
  });

  // ── Step 2: Text Input ──
  btnBack.addEventListener('click', () => showScreen(screenStep1));

  userText.addEventListener('input', () => {
    const len = userText.value.length;
    charCount.textContent = len;
    if (len >= 30) {
      charMin.textContent = '✓ 최소 충족';
      charMin.classList.add('met');
      btnAnalyze.disabled = false;
    } else {
      charMin.textContent = `(최소 30자)`;
      charMin.classList.remove('met');
      btnAnalyze.disabled = true;
    }
  });

  step2Form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (userText.value.length < 30) return;

    showScreen(screenLoading);

    // AI 호출 — 완료 신호를 로딩 애니메이션에 전달
    let signalAIDone;
    const aiDoneSignal = new Promise((resolve) => { signalAIDone = resolve; });

    const aiPromise = callAI(currentNickname, selectedTopic, userText.value).then((result) => {
      signalAIDone();
      return result;
    });

    const [aiResult] = await Promise.all([
      aiPromise,
      runLoadingSequence(aiDoneSignal),
    ]);

    // AI 성공 시 사용, 실패 시 폴백
    currentResult = aiResult || generateFallbackResult(currentNickname, selectedTopic, userText.value);
    renderResult(currentNickname, currentResult);
  });

  // ── Loading ──
  const LOADING_MESSAGES = [
    '"님의 텍스트를 입수했습니다..."',
    '"어휘 창고를 뒤지는 중..."',
    '"반복 단어를 세는 중..."',
    '"문해력 점수를 계산하는 중..."',
    '"님의 어휘 연령을 감정하는 중... 🔍"',
    '"국어사전이 울고 있습니다..."',
  ];

  function runLoadingSequence(aiDoneSignal) {
    let progress = 0;
    let msgIdx = 0;
    let aiDone = false;

    aiDoneSignal.then(() => { aiDone = true; });

    return new Promise((resolve) => {
      const tick = setInterval(() => {
        if (aiDone) {
          progress += (100 - progress) * 0.3;
          if (progress > 99.5) progress = 100;
        } else {
          progress += Math.random() * 6 + 1;
          if (progress > 85) progress = 85;
        }
        progressFill.style.width = Math.round(progress) + '%';
        progressText.textContent = Math.round(progress) + '% 분석 완료';
        if (Math.random() < 0.4 && msgIdx < LOADING_MESSAGES.length) {
          loadingMsg.textContent = LOADING_MESSAGES[msgIdx++];
        }
        if (progress >= 100) {
          clearInterval(tick);
          progressFill.style.width = '100%';
          progressText.textContent = '100% 분석 완료';
          loadingTitle.textContent = '분석 완료!';
          setTimeout(resolve, 500);
        }
      }, 280);
    });
  }

  // ── LM Studio AI Engine ──
  const LM_STUDIO_URL = 'http://localhost:1234/v1/chat/completions';
  const LM_STUDIO_MODEL = 'gemma-4-e4b-it-heretic';
  const API_TIMEOUT = 15000;

  function buildPrompt(nickname, topic, text) {
    const topicName = TOPICS[topic]?.name || '자유';
    return `너는 날카로운 국어 선생님이야. 학생의 어휘력을 날카롭게 분석하고 조롱해줘.
반드시 한국어 존댓말로 답변해. 겉은 공손하지만 내용은 날카롭고 비꼬는 투로.

유저 닉네임: ${nickname}
주제: ${topicName}
유저가 쓴 텍스트:
"""
${text}
"""

반드시 아래 JSON 형식으로만 응답해. 다른 텍스트 없이 JSON만 출력해:
{
  "vocabAge": 5~80 사이 숫자 (정신적 어휘 연령),
  "score": 0~100 사이 숫자 (문해력 점수),
  "repeatedWords": [
    {"word": "가장 많이 반복한 단어1", "count": 횟수},
    {"word": "가장 많이 반복한 단어2", "count": 횟수},
    {"word": "가장 많이 반복한 단어3", "count": 횟수}
  ],
  "analysis": "어휘 분석 팩폭 코멘트 3~4문장, 존댓말로 정중하지만 비꼬는 투",
  "keyword": "어휘 특성 키워드 1개 (예: 복사붙여넣기급)",
  "era": "어휘가 머물러 있는 시대 (예: 2010년대)",
  "roast": "한 줄 핵심 디스 (공유용)",
  "summary": "${nickname} 님의 어휘력은 N세 수준입니다"
}`;
  }

  function parseAIResponse(text) {
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/(\{[\s\S]*\})/);
    if (!jsonMatch) throw new Error('JSON not found in response');

    const parsed = JSON.parse(jsonMatch[1]);

    if (!parsed.analysis || !Array.isArray(parsed.repeatedWords)) {
      throw new Error('Missing required fields');
    }

    return {
      vocabAge: Math.max(5, Math.min(80, Number(parsed.vocabAge) || 10)),
      score: Math.max(0, Math.min(100, Number(parsed.score) || 30)),
      repeatedWords: parsed.repeatedWords.slice(0, 3).map((w) => ({
        word: String(w.word),
        count: Number(w.count) || 1,
      })),
      analysis: String(parsed.analysis),
      keyword: String(parsed.keyword || '어휘 빈곤'),
      era: String(parsed.era || '2010년대'),
      roast: String(parsed.roast || ''),
      summary: String(parsed.summary || `${currentNickname} 님의 어휘력 분석 완료`),
    };
  }

  async function callAI(nickname, topic, text) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const response = await fetch(LM_STUDIO_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: LM_STUDIO_MODEL,
          messages: [
            { role: 'system', content: '너는 날카로운 국어 선생님이야. 반드시 요청된 JSON 형식으로만 응답해. 한국어 존댓말로 답변해. 겉은 공손하지만 내용은 날카롭고 비꼬는 투를 유지해.' },
            { role: 'user', content: buildPrompt(nickname, topic, text) },
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
  function countWords(text) {
    const words = text.replace(/[^가-힣a-zA-Z\s]/g, '').split(/\s+/).filter(Boolean);
    const freq = {};
    words.forEach((w) => {
      if (w.length < 2) return;
      freq[w] = (freq[w] || 0) + 1;
    });
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word, count]) => ({ word, count }));
  }

  function generateFallbackResult(nickname, topic, text) {
    const repeated = countWords(text);
    // Pad to 3 if not enough
    const fillerWords = [
      { word: '진짜', count: 2 },
      { word: '그냥', count: 2 },
      { word: '근데', count: 1 },
    ];
    while (repeated.length < 3) {
      repeated.push(fillerWords[repeated.length]);
    }

    const vocabAge = Math.floor(Math.random() * 10) + 5; // 5~14
    const score = Math.floor(Math.random() * 35) + 10;    // 10~44
    const eras = ['2000년대', '2010년대', '2015년대', '인터넷 초창기'];
    const keywords = ['복사붙여넣기급', '카톡체 마스터', '초등 일기장급', '이모티콘 의존증', '문장력 미아', '맞춤법 테러리스트'];

    const topicName = TOPICS[topic]?.name || '자유';
    const topWord = repeated[0]?.word || '진짜';

    const analyses = [
      `${nickname} 님의 어휘력은 ${eras[Math.floor(Math.random() * eras.length)]}에 머물러 있습니다. '${topWord}'을(를) ${repeated[0]?.count || 3}번이나 반복하셨네요. 이건 어휘력이 아니라 Ctrl+V 수준입니다. ${topicName} 주제에서 이 정도 표현력이면 상대방은 이미 읽기를 포기했을 겁니다.`,
      `'${topWord}' 없이는 한 문장도 완성 못 하시는 ${vocabAge}세 수준이네요. 님의 텍스트에서 독창적인 표현을 찾으려 했는데 404 Not Found입니다. 국어사전이 님을 고소하고 싶어합니다.`,
      `${nickname} 님, 축하합니다. 님의 어휘 다양성은 자판기 메뉴판 수준입니다. '${topWord}'말고 다른 단어도 있다는 걸 알려드립니다. ${topicName}에 대해 쓴다면서 핵심 단어가 빠져있어요. 이건 글이 아니라 주절거림입니다.`,
      `텍스트 분석 결과, 님의 문장 구조는 '주어 + ${topWord} + 끝'입니다. 중학교 국어 시간에 뭘 하셨나요? ${topicName} 주제로 이 정도 글을 쓸 수 있다는 건 일종의 재능입니다. 나쁜 쪽으로요.`,
    ];

    const era = eras[Math.floor(Math.random() * eras.length)];
    const keyword = keywords[Math.floor(Math.random() * keywords.length)];
    const analysis = analyses[Math.floor(Math.random() * analyses.length)];

    return {
      vocabAge,
      score,
      repeatedWords: repeated,
      analysis,
      keyword,
      era,
      roast: `'${topWord}'을(를) 빼면 말을 못 하는 ${vocabAge}세 수준`,
      summary: `${nickname} 님의 어휘력은 ${vocabAge}세 수준입니다`,
    };
  }

  // ── Render Result ──
  function renderResult(nickname, result) {
    resultNickname.textContent = sanitize(nickname);
    resultEra.textContent = result.era;
    resultKeyword.textContent = result.keyword;
    resultAnalysis.textContent = result.analysis;

    // Word cards
    result.repeatedWords.forEach((w, i) => {
      const card = $(`#word-${i + 1}`);
      if (card) {
        card.querySelector('.word-text').textContent = w.word;
        card.querySelector('.word-count').textContent = `${w.count}회`;
      }
    });

    showScreen(screenResult);
    screenResult.classList.add('glitch-in');
    screenResult.addEventListener('animationend', () => screenResult.classList.remove('glitch-in'), { once: true });

    const card = $('#result-card');
    card.classList.add('animate-in');
    card.addEventListener('animationend', () => card.classList.remove('animate-in'), { once: true });

    // Animate age counter
    setTimeout(() => {
      animateCounter(resultAge, 0, result.vocabAge, 1000);
    }, 300);

    // Animate gauge
    setTimeout(() => {
      gaugeFill.style.width = result.score + '%';
      animateCounter(gaugeNumber, 0, result.score, 1200);
    }, 500);

    // Stagger word cards
    document.querySelectorAll('.word-card').forEach((card, i) => {
      card.classList.remove('word-pop');
      setTimeout(() => card.classList.add('word-pop'), 700 + i * 200);
    });

    // Slide up analysis
    const analysisEl = $('.analysis-section');
    analysisEl.classList.remove('slide-up');
    setTimeout(() => analysisEl.classList.add('slide-up'), 1200);
  }

  function animateCounter(el, from, to, duration) {
    const start = performance.now();
    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(from + (to - from) * eased);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  // ── Reset ──
  function resetAll() {
    progressFill.style.width = '0%';
    progressText.textContent = '0% 분석 완료';
    loadingTitle.textContent = '어휘 창고를 뒤지는 중...';
    loadingMsg.textContent = '"님의 텍스트를 입수했습니다..."';

    gaugeFill.style.width = '0%';
    gaugeNumber.textContent = '0';
    resultAge.textContent = '0';
    document.querySelectorAll('.word-card').forEach((c) => c.classList.remove('word-pop'));
    $('.analysis-section').classList.remove('slide-up');

    step1Form.reset();
    step2Form.reset();
    selectedTopic = null;
    document.querySelectorAll('.topic-card').forEach((c) => c.classList.remove('selected'));
    btnNext.disabled = true;

    showScreen(screenStep1);
  }

  // ── Image Download ──
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

      // html2canvas가 CSS 애니메이션 최종 상태를 못 읽으므로 캡처 전 애니메이션 제거
      const animatedEls = card.querySelectorAll('.word-card, .analysis-section, .animate-in, .word-pop, .slide-up');
      animatedEls.forEach((el) => {
        el.style.animation = 'none';
        el.style.opacity = '1';
        el.style.transform = 'none';
      });

      const canvas = await html2canvas(card, {
        scale: 2,
        backgroundColor: '#0F0A2E',
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
        animatedEls.forEach((el) => {
          el.style.animation = '';
          el.style.opacity = '';
          el.style.transform = '';
        });
        if (!blob) { showToast('이미지 생성에 실패했습니다'); return; }
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `어휘력_${sanitize(nickname)}.png`;
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
    const text = `📖 ${result.summary}\n나도 테스트 해보기 👉`;
    const url = window.location.href.split('?')[0];
    if (navigator.share) {
      try { await navigator.share({ title: '📖 문해력 바닥 인증기', text, url }); }
      catch { await copyToClipboard(url, text); }
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
  btnRetry.addEventListener('click', resetAll);
  btnDownload.addEventListener('click', () => downloadImage(currentNickname));
  btnShare.addEventListener('click', () => {
    if (currentResult) shareResult(currentNickname, currentResult);
  });

  // Remove error on input
  nicknameInput.addEventListener('input', () => nicknameInput.classList.remove('error'));

})();
