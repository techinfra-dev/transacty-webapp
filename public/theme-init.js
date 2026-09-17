// Applies the persisted color scheme before first paint.
// Kept as a separate same-origin file (not inline) so the CSP can use a strict
// `script-src 'self'` with no nonce, hash, or 'unsafe-inline'.
(function () {
  try {
    var raw = localStorage.getItem('transcaty-ui-preferences');
    if (!raw) return;
    var parsed = JSON.parse(raw);
    if (parsed && parsed.state && parsed.state.colorScheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.style.colorScheme = 'dark';
    }
  } catch (e) {}
})();
