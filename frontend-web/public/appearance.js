/* Blocking bootstrap + the single appearance store used by React. No token access. */
(() => {
  const key = 'studystreak:appearance:v2';
  const legacyKey = 'studystreak:appearance:v1';
  const ownerKey = `${key}:legacy-owner`;
  const tabKey = `${key}:account`;
  const defaults = Object.freeze({ mode: 'system', background: 'neutral', accent: 'mint', reduceMotion: false });
  const modes = ['dark', 'light', 'system'];
  const accents = ['mint', 'blue', 'purple', 'orange'];
  const backgrounds = ['neutral', 'lavender', 'sage', 'amber', 'sky'];
  const validAccount = id => Number.isSafeInteger(id) && id > 0;
  const accountKey = id => id === null ? `${key}:guest` : validAccount(id) ? `${key}:${id}` : null;
  let account = null;
  try { const id = Number(sessionStorage.getItem(tabKey)); if (validAccount(id)) account = id; } catch { /* Storage may be unavailable. */ }
  function normalize(value) {
    const data = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    return {
      mode: modes.includes(data.mode) ? data.mode : defaults.mode,
      background: backgrounds.includes(data.background) ? data.background : defaults.background,
      accent: accents.includes(data.accent) ? data.accent : defaults.accent,
      reduceMotion: data.reduceMotion === true,
    };
  }
  function legacy(id) {
    const owner = localStorage.getItem(ownerKey);
    // The former browser-wide preference is claimed once; other accounts start independently.
    if (owner !== null && owner !== String(id)) return null;
    const value = JSON.parse(localStorage.getItem(legacyKey));
    if (!value || Array.isArray(value) || !modes.includes(value.mode) || !accents.includes(value.accent)) return null;
    return normalize({ ...value, background: 'lavender' });
  }
  function read(id = account) {
    try {
      const scopedKey = accountKey(id);
      if (!scopedKey) return { ...defaults };
      const raw = localStorage.getItem(scopedKey);
      return raw === null ? legacy(id) ?? { ...defaults } : normalize(JSON.parse(raw));
    } catch { return { ...defaults }; }
  }
  function apply(value) {
    const preferences = normalize(value);
    const root = document.documentElement;
    root.dataset.theme = preferences.mode;
    root.dataset.background = preferences.background;
    root.dataset.accent = preferences.accent;
    root.dataset.motion = preferences.reduceMotion ? 'reduce' : 'system';
  }
  function save(value, id = account) {
    try {
      const scopedKey = accountKey(id);
      if (!scopedKey) return false;
      localStorage.setItem(scopedKey, JSON.stringify(normalize(value)));
      return true;
    } catch { return false; }
  }
  function activate(id) {
    account = validAccount(id) ? id : null;
    try {
      if (account === null) sessionStorage.removeItem(tabKey);
      else sessionStorage.setItem(tabKey, String(account));
    } catch { /* React still applies the correct account before painting. */ }
    try {
      if (account !== null && localStorage.getItem(accountKey(account)) === null) {
        const previous = legacy(account);
        if (previous) {
          localStorage.setItem(ownerKey, String(account));
          save(previous, account);
        }
      }
    } catch { /* A denied migration never blocks the application or alters v1. */ }
  }
  window.studyStreakAppearance = Object.freeze({ key, legacyKey, accountKey, defaults, normalize, read, apply, save, activate });
  apply(read());
})();
