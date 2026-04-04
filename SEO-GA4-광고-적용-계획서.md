# SEO / GA4 / 광고 적용 계획서

> 대상 프로젝트: 룰렛 랜드 / 슬롯머신 / 러시안 룰렛  
> 작성일: 2026-04-04  
> 적용 범위: hub/index.html, coffee/src/index.html, russian-roulette/src/index.html, index.html

---

## 1. 목적

이 문서는 룰렛 랜드 서비스에 아래 4가지를 적용하기 위한 실행 계획서다.

1. GA4를 삽입해 DAU / MAU와 게임별 사용량을 측정한다.
2. Google Search Console과 네이버 서치어드바이저 검증 태그를 HEAD 상단에 배치한다.
3. 페이지별 TITLE / DESCRIPTION / META TAG / OG TAG / 구조화 데이터를 정교하게 넣어 검색 유입을 늘린다.
4. Google AdSense / Kakao AdFit 광고를 붙일 수 있게 스크립트와 배치 전략을 준비한다.

---

## 2. 현재 상태 진단

| 구분 | 현재 상태 | 조치 방향 |
|------|-----------|-----------|
| GA4 | 미삽입 | 공통 태그 + 게임별 이벤트 추가 |
| Search Console | 미삽입 | HEAD 상단에 `google-site-verification` 삽입 |
| 네이버 서치어드바이저 | 미삽입 | HEAD 상단에 `naver-site-verification` 삽입 |
| Title / Description | 일부 페이지만 간단히 존재 | 페이지별 상세 문구로 교체 |
| Keywords / Robots / Canonical / OG / Twitter | 대부분 없음 | 신규 추가 |
| Structured Data | 없음 | `WebSite`, `CollectionPage`, `Game` 또는 `SoftwareApplication` 추가 |
| robots.txt | 없음 | 루트에 신규 생성 |
| sitemap.xml | 없음 | 루트에 신규 생성 후 Search Console / 네이버 제출 |
| ads.txt | 없음 | AdSense 승인용 루트 파일 추가 |
| 개인정보처리방침 | 없음 | GA4 / 광고 운영용 정책 페이지 추가 권장 |
| 루트 index.html | 허브로 즉시 리다이렉트 | SEO 관점에서 루트 랜딩 전환 또는 절대 canonical 정비 필요 |
| coffee 페이지 CSP | 외부 스크립트 차단 상태 | GA4 / AdSense / AdFit 허용 도메인 추가 필요 |

---

## 3. 중요한 전제

### 3.1 Search Console / 서치어드바이저만 넣는다고 바로 검색 노출이 되지는 않음

검색 노출에 필요한 최소 조건은 아래와 같다.

- 사이트가 외부에서 접근 가능한 공개 URL로 배포되어 있어야 한다.
- `index,follow` 상태여야 한다.
- `robots.txt`와 `sitemap.xml`이 있어야 한다.
- Search Console / 네이버에 사이트맵을 제출해야 한다.
- 페이지마다 중복되지 않는 title / description / canonical이 있어야 한다.

즉, HEAD 상단 검증 태그는 반드시 필요하지만 그것만으로는 부족하다.

### 3.2 키워드는 많이 넣되, 문장 품질을 해치면 안 됨

`meta keywords`는 현재 검색 순위에 미치는 영향이 매우 작다. 실제로 중요한 것은 아래다.

- `title`
- `meta description`
- `canonical`
- `robots`
- 오픈그래프 태그
- 구조화 데이터
- 페이지 본문 텍스트

따라서 키워드는 많이 넣더라도 페이지별 주제를 분리해서 자연어 문장으로 정리해야 한다.

### 3.3 현재 coffee 페이지는 외부 스크립트가 그대로는 동작하지 않음

`coffee/src/index.html`에는 아래 CSP가 있다.

```html
<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';">
```

이 상태에서는 아래 외부 스크립트가 차단된다.

- GA4 `www.googletagmanager.com`
- AdSense `pagead2.googlesyndication.com`
- AdSense 관련 도메인 `googleads.g.doubleclick.net`
- Kakao AdFit `t1.daumcdn.net`

따라서 coffee 페이지에는 CSP 수정이 선행되어야 한다.

---

## 4. 적용 대상 페이지

| 페이지 | 역할 | SEO 우선순위 | 광고 우선순위 |
|------|------|--------------|--------------|
| `hub/index.html` | 메인 허브 / 검색 유입 랜딩 | 최우선 | 높음 |
| `coffee/src/index.html` | 커피내기 슬롯머신 상세 게임 페이지 | 높음 | 중간 |
| `russian-roulette/src/index.html` | 꽝 뽑기 상세 게임 페이지 | 높음 | 중간 |
| `index.html` | 루트 진입점 | 보조 | 낮음 |

권장 방향은 `hub/index.html`을 대표 랜딩 페이지로 삼고, 각 게임 페이지는 개별 검색 유입을 받는 구조로 운영하는 것이다.

---

## 5. HEAD 삽입 표준 순서

사용자 요청대로 Search Console / 네이버 서치어드바이저 태그는 HEAD 상단에 둔다. 권장 순서는 아래와 같다.

```html
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">

  <!-- 1) 검증 태그: HEAD 상단 고정 -->
  <meta name="google-site-verification" content="GOOGLE_VERIFICATION_TOKEN">
  <meta name="naver-site-verification" content="NAVER_VERIFICATION_TOKEN">

  <!-- 2) 기본 SEO -->
  <title>페이지별 최적화 제목</title>
  <meta name="description" content="페이지별 상세 설명">
  <meta name="keywords" content="페이지별 키워드 묶음">
  <meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
  <meta name="theme-color" content="#111111">
  <link rel="canonical" href="https://example.com/page-path/">

  <!-- 3) 오픈그래프 / SNS -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="룰렛 랜드">
  <meta property="og:title" content="페이지별 OG 제목">
  <meta property="og:description" content="페이지별 OG 설명">
  <meta property="og:url" content="https://example.com/page-path/">
  <meta property="og:image" content="https://example.com/assets/og/cover.jpg">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="페이지별 트위터 제목">
  <meta name="twitter:description" content="페이지별 트위터 설명">
  <meta name="twitter:image" content="https://example.com/assets/og/cover.jpg">

  <!-- 4) GA4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX', {
      send_page_view: true
    });
  </script>

  <!-- 5) AdSense: 공통 헤드 로더 -->
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
</head>
```

비고:

- `canonical`은 반드시 절대 URL을 사용한다.
- `index.html` 루트 리다이렉트 페이지는 장기적으로 실제 랜딩 페이지로 바꾸는 것이 가장 좋다.
- 광고 블록은 HEAD가 아니라 BODY의 실제 배치 지점에 넣는다.

---

## 6. 페이지별 SEO 문구 초안

### 6.1 허브 페이지 `hub/index.html`

#### 권장 Title

`룰렛 랜드 | 커피내기 룰렛, 벌칙 룰렛, 꽝 뽑기, 랜덤 추첨 웹게임`

#### 권장 Description

`룰렛 랜드는 커피내기, 점심내기, 벌칙 정하기를 브라우저에서 바로 즐길 수 있는 무료 웹게임 모음입니다. 슬롯머신 커피내기 게임과 러시안 룰렛 꽝 뽑기를 모바일과 PC에서 바로 플레이하세요.`

#### 권장 Keywords

`커피내기, 커피내기 게임, 벌칙 룰렛, 꽝 뽑기, 랜덤 추첨, 점심내기, 회식 게임, 술자리 게임, MT 게임, 사무실 게임, 웹게임, 미니게임, 슬롯머신 게임, 러시안 룰렛 게임, 벌칙 정하기`

#### SEO 포인트

- 검색 유입 메인 랜딩으로 운영
- 두 게임으로 내부 링크 전달
- `CollectionPage` 또는 `WebSite` 구조화 데이터 추가

### 6.2 슬롯머신 페이지 `coffee/src/index.html`

#### 권장 Title

`슬롯머신 | 커피내기 슬롯머신, 점심내기 룰렛 대체 웹게임`

#### 권장 Description

`슬롯머신은 커피내기와 점심값 내기를 재미있게 정하는 슬롯머신형 웹게임입니다. 참가자 이름을 입력하고 슬롯을 돌려 꼴등 또는 1등이 커피를 사는 규칙으로 모바일과 PC에서 바로 즐길 수 있습니다.`

#### 권장 Keywords

`커피내기, 커피내기 슬롯머신, 커피 사는 사람 정하기, 점심내기 게임, 벌칙 슬롯, 랜덤 벌칙, 사무실 내기, 팀 게임, 슬롯머신 웹게임, 커피값 내기, 점심값 내기, 내기 게임`

#### SEO 포인트

- 슬롯머신형 내기 게임 키워드 집중
- `Game` 또는 `SoftwareApplication` 구조화 데이터 추가
- 본문에도 `커피내기`, `점심내기`, `슬롯머신 게임` 문구 보강 권장

### 6.3 러시안 룰렛 페이지 `russian-roulette/src/index.html`

#### 권장 Title

`러시안 룰렛 꽝 뽑기 | 벌칙 정하기, 랜덤 벌칙, 회식·MT 게임`

#### 권장 Description

`러시안 룰렛 꽝 뽑기는 벌칙 대상, 커피 사는 사람, 점심값 낼 사람을 랜덤하게 정하는 웹게임입니다. 클래식, 페어, 하드, 데스매치, 서바이벌 모드를 모바일과 PC에서 바로 플레이할 수 있습니다.`

#### 권장 Keywords

`꽝 뽑기, 벌칙 정하기, 랜덤 벌칙, 러시안 룰렛 게임, 회식 게임, MT 게임, 술자리 게임, 점심내기, 커피내기, 벌칙 게임, 랜덤 추첨, 파티 게임, 팀 빌딩 게임, 웹게임`

#### SEO 포인트

- `꽝 뽑기`, `벌칙 정하기`, `랜덤 벌칙` 키워드 중심
- 모드 수와 사용 맥락을 description에 반영
- 결과 공유 기능과 카카오 공유를 본문 텍스트에도 노출 권장

### 6.4 루트 페이지 `index.html`

#### 권장 방향

- 가장 좋은 방법: 루트를 실제 허브 랜딩 페이지로 변경
- 차선책: 현재 리다이렉트 유지 시 절대 canonical과 최소 메타만 유지
- 광고는 루트 리다이렉트 페이지에 넣지 않음

---

## 7. 필수 추가 메타 태그 목록

페이지별로 아래 메타 태그를 기본 세트로 넣는다.

```html
<meta name="description" content="...">
<meta name="keywords" content="...">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
<meta property="og:type" content="website">
<meta property="og:site_name" content="룰렛 랜드">
<meta property="og:title" content="...">
<meta property="og:description" content="...">
<meta property="og:url" content="...">
<meta property="og:image" content="...">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="...">
<meta name="twitter:description" content="...">
<meta name="twitter:image" content="...">
<link rel="canonical" href="...">
```

권장 추가 항목:

- `meta name="theme-color"`
- `link rel="icon"`
- `link rel="apple-touch-icon"`
- `link rel="manifest"`

---

## 8. 구조화 데이터 계획

검색엔진이 페이지 성격을 더 잘 이해하도록 JSON-LD를 추가한다.

### 8.1 허브 페이지

- `WebSite`
- `CollectionPage`
- 필요 시 `BreadcrumbList`

### 8.2 게임 상세 페이지

- `Game`
- 또는 `SoftwareApplication`

### 8.3 예시

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Game",
  "name": "슬롯머신",
  "url": "https://example.com/coffee/",
  "applicationCategory": "GameApplication",
  "operatingSystem": "Web Browser",
  "inLanguage": "ko",
  "description": "커피내기를 재미있게 정하는 슬롯머신형 웹게임"
}
</script>
```

---

## 9. GA4 적용 계획

### 9.1 목표 지표

- DAU
- WAU
- MAU
- DAU / MAU 비율
- 페이지별 유입 수
- 게임 시작 수
- 게임 완료 수
- 공유 버튼 클릭 수
- 가장 많이 플레이되는 게임과 모드

### 9.2 기본 삽입 방식

모든 실제 서비스 페이지에 동일한 GA4 기본 태그를 넣는다.

```html
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

### 9.3 커스텀 이벤트 설계

| 이벤트명 | 페이지 | 목적 | 주요 파라미터 |
|---------|--------|------|--------------|
| `select_game` | 허브 | 어떤 게임 카드가 클릭되는지 측정 | `game_name` |
| `game_start` | 공통 | 게임 시작 수 측정 | `game_name`, `player_count`, `game_mode` |
| `game_restart` | 공통 | 재도전 수 측정 | `game_name` |
| `share_result` | 공통 | 공유 전환 측정 | `game_name`, `share_type` |
| `coffee_rule_change` | 슬롯머신 | 꼴등/1등 규칙 사용량 측정 | `rule_type` |
| `coffee_spin` | 슬롯머신 | 스핀 사용량 측정 | `player_count`, `round_number` |
| `coffee_sudden_death` | 슬롯머신 | 서든데스 진입 측정 | `tie_count` |
| `roulette_mode_select` | 러시안 룰렛 | 모드 선호도 측정 | `game_mode`, `bullet_count` |
| `roulette_trigger_pull` | 러시안 룰렛 | 방아쇠 동작 수 측정 | `game_mode`, `remaining_chambers` |
| `roulette_bang` | 러시안 룰렛 | 꽝 발생 측정 | `game_mode`, `penalty_type` |
| `roulette_survive` | 러시안 룰렛 | 생존 연속 구간 측정 | `game_mode`, `remaining_probability` |
| `roulette_timer_toggle` | 러시안 룰렛 | 타이머 사용 여부 측정 | `enabled` |

### 9.4 예시 이벤트 코드

```html
<script>
  gtag('event', 'game_start', {
    game_name: 'coffee-slot',
    player_count: 4,
    game_mode: 'last_place_buys'
  });

  gtag('event', 'roulette_bang', {
    game_name: 'russian-roulette',
    game_mode: 'classic',
    penalty_type: 'coffee'
  });
</script>
```

### 9.5 DAU / MAU 확인 방법

GA4에서 별도 복잡한 구현 없이도 기본 활성 사용자 지표로 확인 가능하다.

- DAU: 일 단위 활성 사용자
- MAU: 최근 28일 활성 사용자
- 점착도: $DAU / MAU$

운영 시에는 아래 두 가지 대시보드를 추천한다.

1. 전체 서비스 대시보드: 허브 + 두 게임 전체 활성 사용자
2. 게임별 대시보드: 슬롯머신 / 러시안 룰렛 각각의 활성 사용자와 시작 수

---

## 10. Search Console / 네이버 서치어드바이저 적용 계획

### 10.1 HEAD 상단 검증 태그

```html
<meta name="google-site-verification" content="GOOGLE_VERIFICATION_TOKEN">
<meta name="naver-site-verification" content="NAVER_VERIFICATION_TOKEN">
```

### 10.2 진행 순서

1. 실서비스 도메인 또는 GitHub Pages URL을 확정한다.
2. Google Search Console에서 URL Prefix 속성을 생성한다.
3. 발급된 메타 태그를 각 색인 대상 페이지 HEAD 상단에 넣는다.
4. 네이버 서치어드바이저에서도 동일하게 메타 검증을 진행한다.
5. `robots.txt`와 `sitemap.xml`을 루트에 배치한다.
6. Search Console과 네이버에 사이트맵 URL을 제출한다.
7. 핵심 페이지 3개를 URL 검사로 즉시 색인 요청한다.

### 10.3 필수 추가 파일

#### `robots.txt` 예시

```txt
User-agent: *
Allow: /

Sitemap: https://example.com/sitemap.xml
```

#### `sitemap.xml` 포함 대상

- `/`
- `/hub/`
- `/coffee/` 또는 실제 공개 URL
- `/russian-roulette/` 또는 실제 공개 URL

### 10.4 운영 포인트

- Search Console은 검증 도구이자 색인 상태 확인 도구다.
- 네이버 서치어드바이저는 네이버 검색 노출 최적화용이다.
- 둘 다 HEAD 상단에 두는 것은 관리상 좋지만, 색인 성패는 사이트맵과 콘텐츠 품질이 더 중요하다.

---

## 11. 광고 적용 계획

### 11.1 Google AdSense 공통 스크립트

```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXXXXXXXX" crossorigin="anonymous"></script>
```

### 11.2 AdSense 광고 블록 예시

```html
<ins class="adsbygoogle"
     style="display:block"
     data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
     data-ad-slot="1234567890"
     data-ad-format="auto"
     data-full-width-responsive="true"></ins>
<script>
  (adsbygoogle = window.adsbygoogle || []).push({});
</script>
```

### 11.3 Kakao AdFit 스크립트 예시

```html
<ins class="kakao_ad_area"
     style="display:none;"
     data-ad-unit="DAN-XXXXXXXXXXXXXXXX"
     data-ad-width="320"
     data-ad-height="100"></ins>
<script type="text/javascript" src="//t1.daumcdn.net/kas/static/ba.min.js" async></script>
```

### 11.4 광고 배치 원칙

- 게임 조작 버튼 근처에는 광고를 붙이지 않는다.
- 사용자가 실수로 누를 수 있는 위치는 피한다.
- 모바일에서는 고정 하단 광고보다 결과 화면 광고가 정책상 안전하다.
- 게임 중간보다 진입 화면 / 결과 화면 / 허브 화면이 광고 친화적이다.
- 광고 영역 높이를 미리 확보해 CLS를 줄인다.

### 11.5 페이지별 광고 배치안

| 페이지 | 1차 배치안 | 이유 |
|------|------------|------|
| 허브 | 헤더 아래 1개, 푸터 위 1개 | 검색 유입 랜딩이자 체류 페이지 |
| 슬롯머신 | 시작 화면 하단 1개, 결과 화면 결과 영역 아래 1개 | 게임 몰입을 해치지 않으면서 노출 가능 |
| 러시안 룰렛 | 설정 화면 하단 1개, 결과 화면 벌칙 결과 아래 1개 | 방아쇠 버튼 근처 광고를 피하기 위함 |
| 루트 리다이렉트 | 배치 안 함 | 리다이렉트 페이지는 광고 효율과 정책 모두 불리 |

### 11.6 피해야 할 위치

- `슬롯머신`의 `SPIN` 버튼 바로 위/아래
- `러시안 룰렛`의 `방아쇠 당기기` 버튼 바로 위/아래
- 전체 화면 오버레이 내부
- 타이머 바 근처
- 결과 공유 버튼 바로 옆

### 11.7 정책 리스크

- 게임 UI와 광고가 너무 가까우면 오클릭 유도가 되어 정책 위반 위험이 있다.
- 아동 대상처럼 보이는 표현, 과도한 깜빡임, 클릭 유도 문구는 피해야 한다.
- 광고 승인 전에는 `개인정보처리방침`, `운영자 정보`, `문의 방법` 페이지를 준비하는 편이 유리하다.

---

## 12. 추가로 만들어야 할 파일 목록

아래 파일은 광고 / SEO / 분석 운영을 위해 사실상 필요하다.

- `robots.txt`
- `sitemap.xml`
- `ads.txt`
- `advertisement/privacy-policy.html` 또는 정책 페이지
- 대표 OG 이미지 파일
- 파비콘 및 앱 아이콘
- 가능하면 `site.webmanifest`

---

## 13. 실제 구현 우선순위

### 1단계: 검색/측정 기반 구축

1. 실서비스 URL 확정
2. Search Console / 네이버 서치어드바이저 속성 생성
3. 각 페이지 HEAD 상단에 검증 태그 삽입
4. GA4 기본 태그 삽입
5. coffee 페이지 CSP 수정

### 2단계: SEO 메타 정비

1. 페이지별 title / description / keywords 적용
2. canonical / robots / OG / Twitter 태그 추가
3. 구조화 데이터 추가
4. 루트 리다이렉트 전략 확정

### 3단계: 색인 파일 구축

1. `robots.txt` 생성
2. `sitemap.xml` 생성
3. Search Console / 네이버에 사이트맵 제출

### 4단계: 광고 초기 배치

1. AdSense 승인용 스크립트 추가
2. AdFit 광고 단위 발급
3. 허브와 결과 화면 중심으로 1차 광고 배치
4. CLS / 모바일 가독성 / 오클릭 여부 점검

### 5단계: 운영 최적화

1. GA4 이벤트 대시보드 점검
2. 유입 키워드와 랜딩 페이지 성과 확인
3. 광고 클릭률과 체류 시간 비교
4. 제목 / 설명 / 광고 위치 A/B 테스트

---

## 14. 체크리스트

- [ ] 실서비스 도메인 확정
- [ ] Google Search Console 속성 생성
- [ ] 네이버 서치어드바이저 속성 생성
- [ ] GA4 속성 및 측정 ID 발급
- [ ] HEAD 상단 검증 태그 추가
- [ ] Title / Description / Keywords 정비
- [ ] Canonical / Robots / OG / Twitter 태그 추가
- [ ] JSON-LD 구조화 데이터 추가
- [ ] coffee 페이지 CSP 수정
- [ ] `robots.txt` 생성
- [ ] `sitemap.xml` 생성
- [ ] `ads.txt` 생성
- [ ] 개인정보처리방침 페이지 작성
- [ ] AdSense 스크립트 추가
- [ ] AdFit 광고 단위 추가
- [ ] 광고 위치 QA
- [ ] Search Console 색인 요청
- [ ] 네이버 사이트맵 제출
- [ ] GA4 이벤트 수집 확인

---

## 15. 최종 권장 결론

가장 먼저 해야 할 일은 아래 4가지다.

1. `hub/index.html`, `coffee/src/index.html`, `russian-roulette/src/index.html`의 HEAD 상단에 Search Console / 네이버 서치어드바이저 검증 태그를 넣는다.
2. 동일한 세 페이지에 GA4를 넣고, 게임 시작 / 완료 / 공유 이벤트를 심는다.
3. `robots.txt`, `sitemap.xml`, `ads.txt`, 개인정보처리방침 페이지를 만든다.
4. 광고는 허브와 결과 화면부터 시작하고, 게임 조작 버튼 근처 광고는 피한다.

운영 관점에서 가장 중요한 리스크는 두 가지다.

- `coffee/src/index.html`의 CSP 때문에 외부 스크립트가 현재는 차단된다.
- 루트 `index.html`이 리다이렉트 전용이라 검색 랜딩 품질이 약하다.

따라서 실제 구현 시에는 SEO 태그 추가와 함께 이 두 문제를 반드시 같이 처리해야 한다.