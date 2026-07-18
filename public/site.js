/* Shared shell for every DAWASSI landing page: injects the header, ticker and
   footer from one source, wires all the page behaviours, hydrates icons and
   applies i18n. Each page only ships its own <main> content + this script. */
(function () {
  'use strict';

  // ---- inline SVG icons (Feather/Lucide-style) — no emojis, no external files
  const ICONS = {
    home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    video: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
    film: '<rect x="2" y="2" width="20" height="20" rx="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/>',
    youtube: '<path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    sparkles: '<path d="M12 3l1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3z"/><path d="M5 3v4M3 5h4M19 16v3M17.5 17.5h3"/>',
    captions: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><line x1="7" y1="9" x2="13" y2="9"/><line x1="7" y1="13" x2="17" y2="13"/>',
    type: '<polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>',
    mic: '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>',
    gem: '<path d="M6 3h12l4 6-10 13L2 9z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>',
    radio: '<circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    smartphone: '<rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
    flag: '<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',
    scissors: '<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>',
    keyboard: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 8h.01M10 8h.01M14 8h.01M18 8h.01M8 12h.01M12 12h.01M16 12h.01M7 16h10"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    play: '<polygon points="6 3 20 12 6 21 6 3"/>',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    menu: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
    alignleft: '<line x1="17" y1="10" x2="3" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="17" y1="18" x2="3" y2="18"/>',
    aligncenter: '<line x1="18" y1="10" x2="6" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="18" y1="18" x2="6" y2="18"/>',
    alignright: '<line x1="21" y1="10" x2="7" y2="10"/><line x1="21" y1="6" x2="3" y2="6"/><line x1="21" y1="14" x2="3" y2="14"/><line x1="21" y1="18" x2="7" y2="18"/>',
    music: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    tool: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
    globe: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    chevrondown: '<polyline points="6 9 12 15 18 9"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    check2: '<polyline points="20 6 9 17 4 12"/>',
  };
  const iconSvg = (n) => { const p = ICONS[n]; return p ? '<svg class="lic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>' : ''; };
  window.icon = iconSvg; // page scripts may build icon()-driven markup

  // ---- shared SVG brand marks
  const DISCORD = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.369a19.8 19.8 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.3 18.3 0 0 0-5.487 0 12.6 12.6 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.7 19.7 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.08.08 0 0 0 .031.056 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.1 13.1 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.009c.12.099.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.8 19.8 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.028ZM8.02 15.331c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418Zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z"/></svg>';
  const brand = {
    website: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
    twitch: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0 1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/></svg>',
    instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.6" cy="6.4" r="1.3" fill="currentColor" stroke="none"/></svg>',
    linkedin: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    github: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>',
    mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></svg>',
    discord: DISCORD,
  };

  // ---- nav model (one source of truth for header + footer)
  const NAV = [
    { href: '/features.html', key: 'nav.features', label: 'Features' },
    { href: '/how-it-works.html', key: 'nav.how', label: 'How it works' },
    { href: '/use-cases.html', key: 'nav.uses', label: 'Use cases' },
    { href: '/pricing.html', key: 'nav.pricing', label: 'Pricing' },
    { href: '/whats-new.html', key: 'nav.new', label: "What's new" },
  ];
  const FOOTER_NAV = NAV.concat([
    { href: '/faq.html', key: 'nav.faq', label: 'FAQ' },
    { href: '/download.html', key: 'nav.download', label: 'Download' },
    { href: '/about.html', key: 'nav.about', label: 'About' },
    { href: '/book-a-call.html', key: 'nav.book', label: 'Book a call' },
  ]);

  const path = location.pathname.replace(/index\.html$/, '') || '/';
  const isActive = (href) => (href === '/' ? path === '/' : path === href || path === href.replace(/\.html$/, ''));

  function headerHTML() {
    const links = NAV.map((n) =>
      `<a href="${n.href}"${isActive(n.href) ? ' class="on" aria-current="page"' : ''} data-i18n="${n.key}">${n.label}</a>`).join('');
    return `
<div class="progress" id="progress"></div>
<div class="blobs" id="blobs"><span class="blob b1"></span><span class="blob b2"></span><span class="blob b3"></span></div>
<header id="header">
  <div class="headrow">
    <nav>
      <a href="/" class="logo">DAWASSI <span class="script">AI Clipper</span></a>
      <div class="navlinks" id="navlinks">
        ${links}
        <a href="/book-a-call.html" class="navbook" data-i18n="nav.book">Book a call</a>
        <a href="https://discord.gg/nFPU9Gteu" target="_blank" rel="noopener" class="navdiscord" title="Join our Discord">${DISCORD}</a>
      </div>
      <button class="menuBtn" id="menuBtn" aria-label="Menu" data-ic="menu"></button>
    </nav>
    <div class="langwrap" id="langWrap">
      <button class="langbtn" id="langBtn" aria-haspopup="listbox" aria-expanded="false">
        <span class="globe" data-ic="globe"></span>
        <span class="lname" id="langCur">English</span>
        <span class="caret" data-ic="chevrondown"></span>
      </button>
      <div class="langmenu" id="langMenu" role="listbox"></div>
    </div>
  </div>
</header>
<div class="tickerwrap" id="ticker" aria-label="Latest news and tips"><div class="tickertrack" id="tickerTrack"></div></div>`;
  }

  function footerHTML() {
    const nav = FOOTER_NAV.map((n) => `<a href="${n.href}" data-i18n="${n.key}">${n.label}</a>`).join('');
    const soc = [
      ['https://darrylwassi.com', brand.website, '<span data-i18n="foot.website">Website</span>'],
      ['https://x.com/darryl_wassi', brand.x, '@darryl_wassi'],
      ['https://youtube.com/@d_wassi', brand.youtube, 'YouTube'],
      ['https://twitch.tv/darrylwassi', brand.twitch, 'Twitch'],
      ['https://instagram.com/k_rryl', brand.instagram, 'Instagram'],
      ['https://linkedin.com/in/darryl-wassi', brand.linkedin, 'LinkedIn'],
      ['https://github.com/darryl-17/dawassi-ai-clipper', brand.github, 'GitHub'],
      ['https://discord.gg/nFPU9Gteu', brand.discord, 'Discord'],
      ['mailto:darrylwassi@gmail.com', brand.mail, '<span data-i18n="foot.contact">Contact</span>'],
    ].map(([h, s, l]) => `<a href="${h}"${h.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${s}${l}</a>`).join('');
    return `
<footer>
  <div class="fbrand">DAWASSI <span class="script">AI Clipper</span></div>
  <nav class="fnav">${nav}</nav>
  <div class="flinks">${soc}</div>
  <div class="fcopy" data-i18n="foot.copy">© 2026 Darryl Wassi · DAWASSI AI CLIPPER — free &amp; open source · runs 100% on your machine</div>
</footer>`;
  }

  // ---- inject shell around the page's <main>
  document.body.insertAdjacentHTML('afterbegin', headerHTML());
  document.body.insertAdjacentHTML('beforeend', footerHTML());
  document.querySelectorAll('[data-ic]').forEach((el) => { el.innerHTML = iconSvg(el.getAttribute('data-ic')); });

  // ---- language pill + dropdown
  const langWrap = document.getElementById('langWrap');
  const langBtn = document.getElementById('langBtn');
  const langMenu = document.getElementById('langMenu');
  function buildLangMenu() {
    const cur = getLang();
    document.getElementById('langCur').textContent = (LANGS.find((l) => l.code === cur) || LANGS[0]).name;
    langMenu.innerHTML = '<div class="lmhead">' + t('lang.label') + '</div>' + LANGS.map((l) =>
      '<button class="langopt' + (l.code === cur ? ' on' : '') + '" role="option" data-code="' + l.code + '">'
      + '<span class="code">' + l.code.toUpperCase() + '</span><span>' + l.name + '</span>'
      + '<span class="chk">' + iconSvg('check') + '</span></button>').join('');
    langMenu.querySelectorAll('.langopt').forEach((o) => (o.onclick = () => { setLang(o.dataset.code); closeLang(); }));
  }
  const openLang = () => { langWrap.classList.add('open'); langBtn.setAttribute('aria-expanded', 'true'); };
  function closeLang() { langWrap.classList.remove('open'); langBtn.setAttribute('aria-expanded', 'false'); }
  langBtn.addEventListener('click', (e) => { e.stopPropagation(); langWrap.classList.contains('open') ? closeLang() : openLang(); });
  langMenu.addEventListener('click', (e) => e.stopPropagation());
  document.addEventListener('click', closeLang);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLang(); });

  // ---- news ticker
  const TICKS = [
    { tag: 'new', key: 'tick.1' }, { tag: 'new', key: 'tick.2' }, { tag: 'new', key: 'tick.3' },
    { tag: 'tip', key: 'tick.4' }, { tag: 'tip', key: 'tick.5' }, { tag: 'tip', key: 'tick.6' },
    { tag: 'tip', key: 'tick.7' }, { tag: 'tip', key: 'tick.8' }, { tag: 'tip', key: 'tick.9' },
    { tag: 'new', key: 'tick.10' }, { tag: 'new', key: 'tick.11' },
  ];
  const tickerTrack = document.getElementById('tickerTrack');
  function buildTicker() {
    const items = TICKS.slice().sort(() => Math.random() - 0.5);
    const html = (clone) => items.map((it) =>
      '<span class="tickeritem"' + (clone ? ' data-clone="1" aria-hidden="true"' : '') + '>'
      + '<span class="tk ' + it.tag + '">' + t('tick.tag' + it.tag) + '</span>'
      + '<span>' + t(it.key) + '</span></span>').join('');
    tickerTrack.innerHTML = html(false) + html(true);
    const half = tickerTrack.scrollWidth / 2;
    if (half) tickerTrack.style.setProperty('--tdur', Math.round(half / 55) + 's');
  }

  // ---- mobile menu
  const nav = document.getElementById('navlinks');
  document.getElementById('menuBtn').onclick = () => nav.classList.toggle('open');
  nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => nav.classList.remove('open')));

  // ---- scroll-reveal (stagger + IntersectionObserver + fallback)
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('[data-stagger]').forEach((group) => {
    [...group.querySelectorAll('[data-animate]')].forEach((el, i) => el.style.setProperty('--d', i * 80));
  });
  function revealInView() {
    document.querySelectorAll('[data-animate]:not(.in)').forEach((el) => {
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) el.classList.add('in');
    });
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('[data-animate]').forEach((el) => io.observe(el));
  requestAnimationFrame(revealInView);

  // ---- header state, progress bar, blob parallax
  const header = document.getElementById('header');
  const blobs = document.getElementById('blobs');
  const progress = document.getElementById('progress');
  let ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      const h = document.documentElement.scrollHeight - window.innerHeight;
      header.classList.toggle('scrolled', y > 8);
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + '%';
      if (!reduce.matches) blobs.style.transform = 'translateY(' + (y * 0.12) + 'px)';
      revealInView();
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---- FAQ accordion (used on home + faq page)
  document.addEventListener('click', (e) => {
    const q = e.target.closest('.faqq');
    if (!q) return;
    const item = q.parentElement;
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faqitem.open').forEach((i) => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  });

  // ---- magnetic buttons
  if (!reduce.matches && matchMedia('(pointer:fine)').matches) {
    document.querySelectorAll('.magnetic').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.18) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.32) + 'px)';
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  // ---- i18n: apply, keep shell + ticker in sync on language change
  window.onLangChange = () => { buildLangMenu(); buildTicker(); if (window.onSitePageLang) window.onSitePageLang(); };
  initI18n();
  buildLangMenu();
  buildTicker();
})();
