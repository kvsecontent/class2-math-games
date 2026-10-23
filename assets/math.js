/* Class 2 Maths – number helpers shared by the games (needs common.js) */
const M = (() => {
  /* Ten strip = a column of 10 squares; unit = one square. */
  function strips(n, { col = '#ffc93c', unit = '#ff8a3d', size = 1.6 } = {}) {
    const t = Math.floor(n / 10), o = n % 10;
    const strip = `<span class="m-strip" style="--c:${col};--s:${size}rem">${'<i></i>'.repeat(10)}</span>`;
    const one = `<span class="m-unit" style="--c:${unit};--s:${size}rem"></span>`;
    return `<span class="m-blocks">${strip.repeat(t)}<span class="m-units">${one.repeat(o)}</span></span>`;
  }

  /* Big on-screen number pad. Calls onEnter(number) when ✓ is pressed. */
  function pad(el, { show, onEnter, digits = 3, row = false }) {
    let v = '';
    el.classList.add('m-pad');
    el.classList.toggle('one-row', row); // row: all keys in one line, for pages with wide pictures
    el.innerHTML = (row ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 0, '⌫', '✓'] : [1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✓']).map((k) => `<button data-k="${k}" class="${k === '✓' ? 'ok' : k === '⌫' ? 'del' : ''}">${k}</button>`).join('');
    const draw = () => (show.textContent = v || '?');
    el.onclick = (e) => {
      const b = e.target.closest('button');
      if (!b) return;
      const k = b.dataset.k;
      G.sfx('pop');
      if (k === '⌫') v = v.slice(0, -1);
      else if (k === '✓') { if (v !== '') onEnter(+v); return; }
      else if (v.length < digits) v = (v === '0' ? '' : v) + k;
      draw();
    };
    draw();
    return { clear() { v = ''; draw(); }, get value() { return v; } };
  }

  /* Number words up to 100 for read-aloud and labels */
  const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  function word(n) {
    if (n === 100) return 'one hundred';
    if (n < 20) return ONES[n];
    return TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : '');
  }
  const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

  /* Solid shapes as small SVG pictures: cube, cuboid, cone, cylinder, sphere */
  function solid(kind, col = '#ffc93c') {
    const o = 'stroke="#2b2140" stroke-width="2.5" stroke-linejoin="round"';
    const mix = (t) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(col.slice(i, i + 2), 16) * 0.7 + t * 0.3).toString(16).padStart(2, '0')).join('');
    const dk = mix(0), lt = mix(255);
    const S = {
      cube: `<path d="M18 36 L58 36 L58 86 L18 86 Z" fill="${col}" ${o}/><path d="M18 36 L38 18 L78 18 L58 36 Z" fill="${lt}" ${o}/><path d="M58 36 L78 18 L78 68 L58 86 Z" fill="${dk}" ${o}/>`,
      cuboid: `<path d="M6 46 L70 46 L70 86 L6 86 Z" fill="${col}" ${o}/><path d="M6 46 L24 30 L88 30 L70 46 Z" fill="${lt}" ${o}/><path d="M70 46 L88 30 L88 70 L70 86 Z" fill="${dk}" ${o}/>`,
      cone: `<path d="M50 8 L84 78 A34 10 0 0 1 16 78 Z" fill="${col}" ${o}/><path d="M16 78 A34 10 0 0 0 84 78" fill="none" stroke="#2b2140" stroke-width="1.5" stroke-dasharray="4 3"/>`,
      cylinder: `<path d="M18 20 L18 80 A32 10 0 0 0 82 80 L82 20" fill="${col}" ${o}/><ellipse cx="50" cy="20" rx="32" ry="10" fill="${lt}" ${o}/>`,
      sphere: `<defs><radialGradient id="sg${col.replace('#', '')}" cx="35%" cy="32%"><stop offset="0" stop-color="#fff"/><stop offset="0.35" stop-color="${lt}"/><stop offset="1" stop-color="${dk}"/></radialGradient></defs><circle cx="50" cy="50" r="38" fill="url(#sg${col.replace('#', '')})" ${o}/><path d="M12 50 A38 11 0 0 0 88 50" fill="none" stroke="#2b2140" stroke-width="1.2" stroke-dasharray="4 3"/>`,
    };
    return `<svg viewBox="0 0 100 100" class="solid">${S[kind]}</svg>`;
  }

  /* A clock face. h = hour (1–12) the short hand points to, m = number the long hand points to (12 for o'clock).
     Pass null to leave a hand out. */
  function clock({ h, m = 12, size = 14, nums = true } = {}) {
    const hand = (n, len, w, col) => { const a = (n % 12) * 30 * Math.PI / 180; return `<line x1="100" y1="100" x2="${100 + Math.sin(a) * len}" y2="${100 - Math.cos(a) * len}" stroke="${col}" stroke-width="${w}" stroke-linecap="round"/>`; };
    let s = `<svg viewBox="0 0 200 200" class="clock" style="width:${size}rem;height:${size}rem"><circle cx="100" cy="100" r="94" fill="#fff" stroke="#2b2140" stroke-width="6"/>`;
    for (let i = 1; i <= 12; i++) { const a = i * 30 * Math.PI / 180; s += nums ? `<text data-n="${i}" x="${100 + Math.sin(a) * 74}" y="${100 - Math.cos(a) * 74 + 9}" font-size="24" font-weight="800" text-anchor="middle" fill="#2b2140">${i}</text>` : `<circle cx="${100 + Math.sin(a) * 80}" cy="${100 - Math.cos(a) * 80}" r="4" fill="#2b2140"/>`; }
    if (m != null) s += hand(m, 70, 6, '#2f7de1');
    if (h != null) s += hand(h, 46, 10, '#e63946');
    return s + '<circle cx="100" cy="100" r="8" fill="#2b2140"/></svg>';
  }

  /* Indian money pictures. v = rupees: 1, 2, 5 and 'c10'/'c20' are coins; 10, 20, 50, 100, 200, 500 are notes.
     With p: true, v is a paise coin. */
  function money(v, { p = false, size = 1 } = {}) {
    if (p) return `<span class="m-coin" style="--s:${size * 4.2}rem;background:#d8c39a">${v}<small>paise</small></span>`;
    if ([1, 2, 5].includes(v) || v === 'c10' || v === 'c20') { const n = String(v).replace('c', ''); return `<span class="m-coin" style="--s:${size * (3.4 + n * 0.08)}rem;background:${n == 10 || n == 20 ? 'radial-gradient(#e9d27a 55%, #c0c0c0 56%)' : '#d9d9d9'}">₹${n}</span>`; }
    const COL = { 10: '#c58a54', 20: '#c7d66b', 50: '#6fd0d6', 100: '#b39ddb', 200: '#ffb36b', 500: '#a8a8a0' };
    return `<span class="m-note" style="--s:${size};background:${COL[v]}"><b>₹${v}</b><i>${v}</i></span>`;
  }

  return { strips, pad, word, rnd, solid, clock, money };
})();
