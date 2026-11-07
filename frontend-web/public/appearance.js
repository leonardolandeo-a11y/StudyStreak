/* Parser-blocking appearance bootstrap. Shared validation for startup and React. */
(() => {
  const key = 'studystreak:appearance:v1';
  const defaults = Object.freeze({ mode: 'dark', accent: 'mint', reduceMotion: false });
  function normalize(value) {
    const data = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
    return {
      mode: ['dark', 'light', 'system'].includes(data.mode) ? data.mode : defaults.mode,
      accent: ['mint', 'blue', 'purple', 'orange'].includes(data.accent) ? data.accent : defaults.accent,
      reduceMotion: data.reduceMotion === true,
    };
  }
  function read() {
    try { return normalize(JSON.parse(localStorage.getItem(key))); }
    catch { return { ...defaults }; }
  }
  function apply(value) {
    const preferences = normalize(value);
    const root = document.documentElement;
    root.dataset.theme = preferences.mode;
    root.dataset.accent = preferences.accent;
    root.dataset.motion = preferences.reduceMotion ? 'reduce' : 'system';
  }
  function save(value) {
    try { localStorage.setItem(key, JSON.stringify(normalize(value))); return true; }
    catch { return false; }
  }
  window.studyStreakAppearance = Object.freeze({ key, defaults, normalize, read, apply, save });
  apply(read());
})();
