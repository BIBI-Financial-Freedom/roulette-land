window.ROULETTE_SITE_CONFIG = Object.freeze({
  siteName: '룰렛 랜드',
  siteUrl: '',
  defaultOgImagePath: 'shared/assets/og-default.svg',
  verification: {
    google: '',
    naver: '',
  },
  analytics: {
    gaMeasurementId: '',
  },
  ads: {
    enabled: false,
    provider: 'adsense',
    showPlaceholdersOnLocal: true,
    adsense: {
      client: '',
      slots: {
        hub_top: '',
        hub_bottom: '',
        coffee_start: '',
        coffee_game_top: '',
        coffee_game_bottom: '',
        coffee_result: '',
        roulette_setup: '',
        roulette_game_top: '',
        roulette_game_bottom: '',
        roulette_result: '',
      },
    },
    adfit: {
      slots: {
        hub_top: { unit: '', width: 728, height: 90 },
        hub_bottom: { unit: '', width: 728, height: 90 },
        coffee_start: { unit: '', width: 320, height: 100 },
        coffee_game_top: { unit: '', width: 320, height: 100 },
        coffee_game_bottom: { unit: '', width: 320, height: 100 },
        coffee_result: { unit: '', width: 320, height: 100 },
        roulette_setup: { unit: '', width: 320, height: 100 },
        roulette_game_top: { unit: '', width: 320, height: 100 },
        roulette_game_bottom: { unit: '', width: 320, height: 100 },
        roulette_result: { unit: '', width: 320, height: 100 },
      },
    },
  },
});