/* Site behaviour: language, theme toggle, CV button, "?" help and question chips. */
(function () {
  var root = document.documentElement;
  var I = window.I18N;                          /* translations (assets/i18n.js) */
  var FILE_NAME = 'PauloPacheco_CV.pdf';
  var FALLBACK = {                              /* used only if i18n.js failed to load */
    'c.theme.toDark': 'Switch to dark mode',
    'c.theme.toLight': 'Switch to light mode',
    'c.cv.status': 'Download started: {file}',
    'i.more': 'See the full resume'
  };

  function qsa(sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); }

  /* ---------- language ---------- */
  function curLang() { return root.getAttribute('data-lang') || 'en'; }
  function tr(key) {
    var v = null;
    if (I) {
      var d = I.DICT[curLang()] || I.DICT.en;
      v = d[key];
      if (v == null) v = I.DICT.en[key];
    }
    if (v == null) v = FALLBACK[key];
    return v == null ? '' : v;
  }
  /* **bold** and __italic__ become <strong> / <em>; everything else is plain text (no HTML is ever injected) */
  function setMarkup(el, text) {
    el.textContent = '';
    String(text).split(/(\*\*[^*]+\*\*|__[^_]+__)/).forEach(function (part) {
      if (!part) return;
      var m;
      if ((m = /^\*\*([^*]+)\*\*$/.exec(part))) { var b = document.createElement('strong'); b.textContent = m[1]; el.appendChild(b); }
      else if ((m = /^__([^_]+)__$/.exec(part))) { var i = document.createElement('em'); i.textContent = m[1]; el.appendChild(i); }
      else el.appendChild(document.createTextNode(part));
    });
  }
  function formatDates(code) {
    var months = I && I.MONTHS[code];
    qsa('time[datetime]').forEach(function (t) {
      if (!t.hasAttribute('data-orig')) t.setAttribute('data-orig', t.textContent);
      var m = /^(\d{4})-(\d{2})$/.exec(t.getAttribute('datetime'));
      t.textContent = (months && m) ? months[parseInt(m[2], 10) - 1] + ' ' + m[1] : t.getAttribute('data-orig');
    });
  }

  var langSel = document.getElementById('lang-select');
  var langCode = document.querySelector('.lang-code');

  function applyLanguage(code) {
    if (!I || !I.DICT[code]) { root.removeAttribute('data-pending-lang'); return; }
    var info = null;
    I.LANGS.forEach(function (l) { if (l.code === code) info = l; });
    root.setAttribute('data-lang', code);
    root.setAttribute('lang', info.tag);

    qsa('[data-i18n]').forEach(function (el) { setMarkup(el, tr(el.getAttribute('data-i18n'))); });
    qsa('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(';').forEach(function (part) {
        var p = part.split(':');
        el.setAttribute(p[0], tr(p[1]));
      });
    });
    formatDates(code);

    var pre = document.body.getAttribute('data-page') === 'resume' ? 'r.' : 'i.';
    document.title = tr(pre + 'title');
    var md = document.querySelector('meta[name="description"]');
    if (md) md.setAttribute('content', tr(pre + 'desc'));

    if (langSel) langSel.value = code;
    if (langCode) langCode.textContent = info.short;
    renderThemeLabel();
    root.removeAttribute('data-pending-lang');
    document.dispatchEvent(new CustomEvent('i18n:change', { detail: { lang: code } }));
  }

  if (langSel) {
    langSel.addEventListener('change', function () {
      try { localStorage.setItem('lang', langSel.value); } catch (e) {}
      applyLanguage(langSel.value);
    });
  }

  /* ---------- theme toggle ---------- */
  var btn = document.getElementById('theme-toggle');
  var meta = document.getElementById('theme-color');

  function renderThemeLabel() {
    if (!btn) return;
    var label = tr(root.getAttribute('data-theme') === 'dark' ? 'c.theme.toLight' : 'c.theme.toDark');
    btn.setAttribute('aria-label', label);
    btn.setAttribute('title', label);
  }
  function apply(theme) {
    root.setAttribute('data-theme', theme);
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0f1115' : '#ffffff');
    renderThemeLabel();
  }
  function stored() {
    try { var t = localStorage.getItem('theme'); return (t === 'light' || t === 'dark') ? t : null; }
    catch (e) { return null; }
  }

  apply(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');
  applyLanguage(curLang());                     /* language was decided in theme-init.js */

  if (btn) {
    btn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      apply(next);
      try { localStorage.setItem('theme', next); } catch (e) {}
    });
  }

  /* follow the system setting until the visitor makes their own choice */
  if (window.matchMedia) {
    var mq = matchMedia('(prefers-color-scheme: dark)');
    var onChange = function (e) { if (!stored()) apply(e.matches ? 'dark' : 'light'); };
    if (mq.addEventListener) mq.addEventListener('change', onChange);
    else if (mq.addListener) mq.addListener(onChange);
  }

  /* ---------- CV button: always saves the file (never shows it in the browser) and confirms the click ---------- */
  /* How: the PDF is fetched in the background and handed to the browser as a generic binary file
     (application/octet-stream), which a browser can only save, not display. If that is not ready
     or not supported, the plain link (download attribute) does the job, so it works without JavaScript too. */
  var cvTimer = null;
  var canBlob = !!(window.fetch && window.Blob && window.URL && URL.createObjectURL);

  qsa('a[data-cv-link]').forEach(function (a) {
    var status = document.getElementById('cv-status');
    var blobUrl = null;

    function prefetch() {
      fetch(a.href, { credentials: 'same-origin' })
        .then(function (res) { if (!res.ok) throw new Error('HTTP ' + res.status); return res.arrayBuffer(); })
        .then(function (buf) {
          blobUrl = URL.createObjectURL(new Blob([buf], { type: 'application/octet-stream' }));
          a.setAttribute('data-ready', 'true');
        })
        .catch(function () { /* stay on the plain link */ });
    }
    if (canBlob) {
      if (document.readyState === 'complete') prefetch();
      else window.addEventListener('load', prefetch);
    }

    function confirmClick() {
      a.setAttribute('data-state', 'done');
      if (status) {
        status.textContent = '';   /* clear first so a repeated click is announced again */
        setTimeout(function () { status.textContent = tr('c.cv.status').replace('{file}', FILE_NAME); }, 50);
      }
      clearTimeout(cvTimer);
      cvTimer = setTimeout(function () {
        a.setAttribute('data-state', 'idle');
        if (status) status.textContent = '';
      }, 3500);
    }

    a.addEventListener('click', function (e) {
      confirmClick();
      /* leave modified clicks (Ctrl/Cmd/Shift/Alt) and the not-ready case to the browser's own link handling */
      if (!blobUrl || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      var tmp = document.createElement('a');
      tmp.href = blobUrl;
      tmp.download = a.getAttribute('download') || FILE_NAME;
      tmp.style.display = 'none';
      document.body.appendChild(tmp);
      tmp.click();
      document.body.removeChild(tmp);
    });
  });

  /* ---------- "?" help: opens only when clicked; closes on a second click, Escape, or a click elsewhere ---------- */
  qsa('[data-help]').forEach(function (helpBtn) {
    var pop = document.getElementById(helpBtn.getAttribute('aria-controls'));
    var wrap = helpBtn.parentNode;
    if (!pop) return;

    function setOpen(open) {
      pop.hidden = !open;
      helpBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      helpBtn.classList.toggle('is-open', open);
    }
    helpBtn.addEventListener('click', function () {
      setOpen(helpBtn.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && helpBtn.getAttribute('aria-expanded') === 'true') setOpen(false);
    });
    document.addEventListener('click', function (e) {
      if (!wrap.contains(e.target)) setOpen(false);
    });
  });

  /* ---------- question chips (home page); rebuilt whenever the language changes ---------- */
  var dataEl = document.getElementById('qa-data');
  var chips = document.getElementById('chips');
  var panel = document.getElementById('answer');
  if (!dataEl || !chips || !panel) return;

  var base;
  try { base = JSON.parse(dataEl.textContent); } catch (e) { return; }
  var selectedId = null;

  function items() {
    var d = I && I.DICT[curLang()];
    return (d && d.qa) || base;
  }
  function show(item, button) {
    selectedId = item.id;
    qsa('#chips .chip').forEach(function (c) {
      c.setAttribute('aria-pressed', c === button ? 'true' : 'false');
    });
    panel.textContent = '';
    var h = document.createElement('h3');
    h.className = 'answer-q';
    h.textContent = item.q;
    panel.appendChild(h);
    item.a.split('\n\n').forEach(function (para) {
      var p = document.createElement('p');
      p.textContent = para;
      panel.appendChild(p);
    });
    var more = document.createElement('p');
    more.className = 'answer-more';
    var a = document.createElement('a');
    a.href = 'resume.html';
    a.textContent = tr('i.more');
    more.appendChild(a);
    panel.appendChild(more);
  }
  function build() {
    chips.textContent = '';
    var pressed = null, pressedItem = null;
    items().forEach(function (item) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.textContent = item.q;
      b.setAttribute('aria-pressed', 'false');
      b.setAttribute('data-id', item.id);
      b.addEventListener('click', function () { show(item, b); });
      chips.appendChild(b);
      if (item.id === selectedId) { pressed = b; pressedItem = item; }
    });
    if (pressed) show(pressedItem, pressed);    /* keep the chosen question, now in the new language */
  }
  document.addEventListener('i18n:change', build);
  build();
})();
