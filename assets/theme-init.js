/* Runs first, synchronously in <head>, so the page never flashes the wrong theme or language. */
(function () {
  var root = document.documentElement;

  /* ---------- theme ---------- */
  var t = null;
  try { t = localStorage.getItem('theme'); } catch (e) {}
  if (t !== 'light' && t !== 'dark') {
    t = window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  root.setAttribute('data-theme', t);
  root.classList.add('js');
  var m = document.getElementById('theme-color');
  if (m) m.setAttribute('content', t === 'dark' ? '#0f1115' : '#ffffff');

  /* ---------- language: ?lang=xx > saved choice > browser language > English ---------- */
  var TAGS = { en: 'en-US', pt: 'pt-PT', es: 'es', fr: 'fr' };
  function norm(x) {
    if (!x) return null;
    var p = String(x).toLowerCase().split(/[-_]/)[0];
    return TAGS[p] ? p : null;
  }
  var lang = null;
  try {
    lang = norm(new URLSearchParams(location.search).get('lang'));
    if (lang) localStorage.setItem('lang', lang);      /* an explicit ?lang= is remembered */
  } catch (e) {}
  if (!lang) { try { lang = norm(localStorage.getItem('lang')); } catch (e) {} }
  if (!lang) {
    var list = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language];
    for (var i = 0; i < list.length && !lang; i++) lang = norm(list[i]);
  }
  lang = lang || 'en';
  root.setAttribute('lang', TAGS[lang]);
  root.setAttribute('data-lang', lang);
  if (lang !== 'en') {
    /* hide the (English) page until site.js has translated it; never stay hidden if that fails */
    root.setAttribute('data-pending-lang', '');
    setTimeout(function () { root.removeAttribute('data-pending-lang'); }, 3000);
  }
})();
