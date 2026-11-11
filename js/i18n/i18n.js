/* ==========================================================
   COSLAB i18n core
   - Dictionaries register themselves via I18N.register(code, dict)
   - Nested keys: t('nav.home')
   - Interpolation: t('x.y', { n: 3 }) replaces {n}
   - Falls back to English, then to the key itself.
   ========================================================== */
(function (global) {
  const LANGS = [
    { code: 'vi', name: 'Tiếng Việt', en: 'Vietnamese', dir: 'ltr', locale: 'vi-VN' },
    { code: 'en', name: 'English', en: 'English', dir: 'ltr', locale: 'en-US' },
    { code: 'zh', name: '中文', en: 'Chinese (Simplified)', dir: 'ltr', locale: 'zh-CN' },
    { code: 'ko', name: '한국어', en: 'Korean', dir: 'ltr', locale: 'ko-KR' },
    { code: 'ja', name: '日本語', en: 'Japanese', dir: 'ltr', locale: 'ja-JP' },
    { code: 'ar', name: 'العربية', en: 'Arabic', dir: 'rtl', locale: 'ar' },
    { code: 'fr', name: 'Français', en: 'French', dir: 'ltr', locale: 'fr-FR' },
    { code: 'es', name: 'Español', en: 'Spanish', dir: 'ltr', locale: 'es-ES' },
  ];

  const dicts = {};
  let current = 'vi';
  const listeners = new Set();

  function lookup(dict, key) {
    if (!dict) return undefined;
    return key.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), dict);
  }

  function t(key, vars) {
    let s = lookup(dicts[current], key);
    if (s === undefined) s = lookup(dicts.en, key);
    if (s === undefined) return key;
    if (vars && typeof s === 'string') {
      s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? vars[k] : m));
    }
    return s;
  }

  function apply(root) {
    (root || document).querySelectorAll('[data-i18n]').forEach((el) => {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    (root || document).querySelectorAll('[data-i18n-ph]').forEach((el) => {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
    });
    (root || document).querySelectorAll('[data-i18n-title]').forEach((el) => {
      const v = t(el.getAttribute('data-i18n-title'));
      el.setAttribute('title', v);
      el.setAttribute('aria-label', v);
    });
  }

  function setLang(code) {
    const meta = LANGS.find((l) => l.code === code) || LANGS[0];
    current = meta.code;
    document.documentElement.lang = meta.code;
    document.documentElement.dir = meta.dir;
    apply();
    listeners.forEach((fn) => fn(current));
  }

  global.I18N = {
    LANGS,
    register(code, dict) { dicts[code] = dict; },
    t,
    apply,
    setLang,
    get lang() { return current; },
    get meta() { return LANGS.find((l) => l.code === current); },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    has(code) { return !!dicts[code]; },
  };
  global.t = t;
})(window);
