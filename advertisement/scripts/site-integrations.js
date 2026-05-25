(function (window, document) {
  'use strict';

  const html = document.documentElement;
  const config = window.ROULETTE_SITE_CONFIG || {};
  const noop = function () {};
  const localPreview = window.location.protocol === 'file:' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  function readPageData(key, fallbackValue) {
    const value = html.dataset ? html.dataset[key] : '';
    return typeof value === 'string' && value.trim() ? value.trim() : (fallbackValue || '');
  }

  function clean(value) {
    return typeof value === 'string' ? value.trim() : '';
  }

  function hasRealValue(value) {
    const text = clean(value);
    if (!text) return false;
    return !/^REPLACE_/i.test(text) &&
      !/^YOUR_/i.test(text) &&
      !/XXXXXXXX/i.test(text) &&
      !/example\.com/i.test(text);
  }

  function normalizeBaseUrl(url) {
    const text = clean(url);
    return hasRealValue(text) ? text.replace(/\/+$/, '') : '';
  }

  function buildPublicUrl(path) {
    const baseUrl = normalizeBaseUrl(config.siteUrl);
    const safePath = clean(path).replace(/^\/+/, '');
    return baseUrl && safePath ? baseUrl + '/' + safePath : '';
  }

  function setMeta(selector, content) {
    if (!hasRealValue(content)) return;
    const target = document.querySelector(selector);
    if (target) target.setAttribute('content', content);
  }

  function setLink(selector, href) {
    if (!hasRealValue(href)) return;
    const target = document.querySelector(selector);
    if (target) target.setAttribute('href', href);
  }

  function ensureScript(id, src, attrs) {
    if (document.getElementById(id)) return document.getElementById(id);
    const script = document.createElement('script');
    script.id = id;
    script.async = true;
    script.src = src;
    Object.keys(attrs || {}).forEach(key => {
      script.setAttribute(key, attrs[key]);
    });
    document.head.appendChild(script);
    return script;
  }

  function applyConfiguredMeta() {
    const googleToken = config.verification && config.verification.google;
    const naverToken = config.verification && config.verification.naver;
    const pagePath = readPageData('pagePath', '');
    const ogImagePath = readPageData('ogImage', config.defaultOgImagePath || '');
    const pageUrl = buildPublicUrl(pagePath);
    const ogImageUrl = buildPublicUrl(ogImagePath);

    setMeta('meta[name="google-site-verification"]', googleToken);
    setMeta('meta[name="naver-site-verification"]', naverToken);
    setLink('link[rel="canonical"]', pageUrl);
    setMeta('meta[property="og:url"]', pageUrl);
    setMeta('meta[name="twitter:url"]', pageUrl);
    setMeta('meta[property="og:image"]', ogImageUrl);
    setMeta('meta[name="twitter:image"]', ogImageUrl);
  }

  function initGA() {
    const measurementId = config.analytics && config.analytics.gaMeasurementId;
    if (!hasRealValue(measurementId)) return false;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

    ensureScript(
      'roulette-ga4-loader',
      'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId),
      {}
    );

    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      send_page_view: true,
      page_title: document.title,
      page_path: '/' + readPageData('pagePath', '').replace(/^\/+/, ''),
    });

    return true;
  }

  function getDefaultProvider() {
    return clean(config.ads && config.ads.provider) || 'adsense';
  }

  function getSlotKey(slot) {
    return clean(slot.dataset.adKey);
  }

  function getAdsenseClient() {
    return config.ads && config.ads.adsense ? clean(config.ads.adsense.client) : '';
  }

  function getAdsenseSlotId(slotKey) {
    if (!config.ads || !config.ads.adsense || !config.ads.adsense.slots) return '';
    return clean(config.ads.adsense.slots[slotKey]);
  }

  function getAdfitSlotConfig(slotKey) {
    if (!config.ads || !config.ads.adfit || !config.ads.adfit.slots) return null;
    const slot = config.ads.adfit.slots[slotKey];
    return slot || null;
  }

  function renderPlaceholder(slot, provider, reason) {
    slot.innerHTML = '';
    slot.classList.remove('is-active');
    slot.classList.add('is-placeholder');
    slot.innerHTML =
      '<div class="ad-slot__placeholder">' +
        '<strong>광고 슬롯 준비됨</strong>' +
        '<span>' + (slot.dataset.adLabel || getSlotKey(slot) || '광고 영역') + '</span>' +
        '<span>' + provider.toUpperCase() + ' · ' + reason + '</span>' +
      '</div>';
  }

  function renderAdsenseSlot(slot, slotKey) {
    const client = getAdsenseClient();
    const adSlot = getAdsenseSlotId(slotKey);

    if (!hasRealValue(client) || !hasRealValue(adSlot)) {
      return false;
    }

    ensureScript(
      'roulette-adsense-loader',
      'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=' + encodeURIComponent(client),
      { crossorigin: 'anonymous' }
    );

    slot.innerHTML = '';
    slot.classList.remove('is-placeholder');
    slot.classList.add('is-active');

    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.style.display = 'block';
    ins.setAttribute('data-ad-client', client);
    ins.setAttribute('data-ad-slot', adSlot);
    ins.setAttribute('data-ad-format', slot.dataset.adFormat || 'auto');
    ins.setAttribute('data-full-width-responsive', 'true');
    slot.appendChild(ins);

    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.push({});
    return true;
  }

  function renderAdfitSlot(slot, slotKey) {
    const slotConfig = getAdfitSlotConfig(slotKey);
    if (!slotConfig || !hasRealValue(slotConfig.unit)) {
      return false;
    }

    ensureScript(
      'roulette-adfit-loader',
      'https://t1.daumcdn.net/kas/static/ba.min.js',
      {}
    );

    slot.innerHTML = '';
    slot.classList.remove('is-placeholder');
    slot.classList.add('is-active');

    const ins = document.createElement('ins');
    ins.className = 'kakao_ad_area';
    ins.style.display = 'none';
    ins.setAttribute('data-ad-unit', clean(slotConfig.unit));
    ins.setAttribute('data-ad-width', String(slotConfig.width || 320));
    ins.setAttribute('data-ad-height', String(slotConfig.height || 100));
    slot.appendChild(ins);
    return true;
  }

  function hydrateAds() {
    const adSlots = Array.from(document.querySelectorAll('.ad-slot[data-ad-key]'));
    if (adSlots.length === 0) return;

    const adConfig = config.ads || {};
    const previewSlots = localPreview
      ? adConfig.showPlaceholdersOnLocal !== false
      : adConfig.showPlaceholdersOnLive === true;
    const preferredProvider = getDefaultProvider();

    adSlots.forEach(slot => {
      const slotKey = getSlotKey(slot);
      const provider = clean(slot.dataset.adProvider) || preferredProvider;
      let rendered = false;

      if (adConfig.enabled !== false) {
        if (provider === 'adsense') rendered = renderAdsenseSlot(slot, slotKey);
        if (!rendered && provider === 'adfit') rendered = renderAdfitSlot(slot, slotKey);
      }

      if (!rendered) {
        if (previewSlots) {
          const reason = provider === 'adsense'
            ? 'AdSense client / slot ID 입력 대기'
            : 'AdFit unit ID 입력 대기';
          renderPlaceholder(slot, provider, reason);
        } else {
          slot.innerHTML = '';
          slot.classList.remove('is-active', 'is-placeholder');
        }
      }
    });
  }

  const integrations = {
    track: noop,
    config,
    pageKey: readPageData('pageKey', ''),
    pagePath: readPageData('pagePath', ''),
  };

  window.SiteIntegrations = integrations;

  applyConfiguredMeta();
  const analyticsReady = initGA();
  if (analyticsReady) {
    integrations.track = function (eventName, params) {
      if (typeof window.gtag !== 'function') return;
      window.gtag('event', eventName, params || {});
    };
  }

  document.addEventListener('DOMContentLoaded', hydrateAds);
})(window, document);