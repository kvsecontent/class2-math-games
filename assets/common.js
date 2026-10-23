/* Class 2 Maths – shared game helpers (no internet needed except fonts) */
const G = (() => {
  let stars = 0;
  let muted = false;
  let actx = null;

  /* ---------- top bar ---------- */
  function init({ title, subtitle = '', back = '../index.html#ch1' }) {
    document.title = title;
    const bar = document.createElement('header');
    bar.className = 'topbar';
    bar.innerHTML = `
      <button class="tb-btn" id="tb-home">🏠 Home</button>
      <h1>${title}<small>${subtitle}</small></h1>
      <span class="stars">⭐ <span id="tb-stars">0</span></span>
      <button class="tb-btn" id="tb-sound">🔊</button>
      <button class="tb-btn" id="tb-full">⛶</button>`;
    document.body.prepend(bar);
    bar.querySelector('#tb-home').onclick = () => (location.href = back);
    bar.querySelector('#tb-sound').onclick = (e) => {
      muted = !muted;
      e.currentTarget.textContent = muted ? '🔇' : '🔊';
      if (muted) speechSynthesis.cancel();
    };
    bar.querySelector('#tb-full').onclick = fullscreen;

    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.id = 'g-overlay';
    document.body.append(ov);
  }

  function fullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  /* ---------- speech ---------- */
  let voice = null;
  function pickVoice() {
    const vs = speechSynthesis.getVoices();
    voice = vs.find((v) => v.lang === 'en-IN') || vs.find((v) => /en-GB/.test(v.lang)) || vs.find((v) => /^en/.test(v.lang)) || null;
  }
  if ('speechSynthesis' in window) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  }
  function say(text, { rate = 0.8, onend } = {}) {
    if (muted || !('speechSynthesis' in window)) { onend?.(); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.lang = voice?.lang || 'en-IN';
    u.rate = rate;
    u.pitch = 1.1;
    if (onend) u.onend = onend;
    speechSynthesis.speak(u);
  }

  /* ---------- sound effects (Web Audio, no files) ---------- */
  function ctx() {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    return actx;
  }
  function tone(freq, start, dur, type = 'sine', vol = 0.25) {
    const c = ctx();
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, c.currentTime + start);
    g.gain.exponentialRampToValueAtTime(vol, c.currentTime + start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
    o.connect(g).connect(c.destination);
    o.start(c.currentTime + start);
    o.stop(c.currentTime + start + dur + 0.05);
  }
  function sfx(kind) {
    if (muted) return;
    if (kind === 'good') { tone(660, 0, 0.15); tone(880, 0.12, 0.25); }
    else if (kind === 'bad') { tone(220, 0, 0.25, 'triangle', 0.2); tone(180, 0.18, 0.3, 'triangle', 0.2); }
    else if (kind === 'pop') { tone(900, 0, 0.08, 'square', 0.12); }
    else if (kind === 'win') { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.14, 0.35)); }
    else if (kind === 'trin') { for (let i = 0; i < 6; i++) { tone(2600, i * 0.07, 0.12, 'sine', 0.18); tone(3900, i * 0.07, 0.08, 'sine', 0.06); } }
  }

  /* ---------- stars, confetti, end screen ---------- */
  function star(n = 1) {
    stars += n;
    const el = document.getElementById('tb-stars');
    if (el) el.textContent = stars;
  }
  function confetti(n = 40) {
    const bits = ['🎉', '⭐', '🎈', '✨', '🎊', '🌟'];
    for (let i = 0; i < n; i++) {
      const s = document.createElement('div');
      s.className = 'confetti';
      s.textContent = bits[i % bits.length];
      s.style.left = Math.random() * 100 + 'vw';
      s.style.animationDuration = 2 + Math.random() * 2 + 's';
      s.style.animationDelay = Math.random() * 0.6 + 's';
      document.body.append(s);
      setTimeout(() => s.remove(), 5000);
    }
  }
  function end({ title = 'Well done!', msg = '', onReplay }) {
    sfx('win');
    confetti();
    const ov = document.getElementById('g-overlay');
    ov.innerHTML = `<div class="card">
      <h2>${title}</h2>
      <div class="big-stars">⭐ ${stars}</div>
      <p class="prompt" style="font-size:1.5rem">${msg}</p>
      <div class="row">
        <button class="big-btn green" id="ov-again">🔁 Play again</button>
        <button class="big-btn ghost" id="ov-home">🏠 Home</button>
      </div></div>`;
    ov.classList.add('show');
    say(title + ' ' + msg.replace(/<[^>]+>/g, ''));
    ov.querySelector('#ov-again').onclick = () => {
      ov.classList.remove('show');
      stars = 0; star(0);
      onReplay ? onReplay() : location.reload();
    };
    ov.querySelector('#ov-home').onclick = () => document.getElementById('tb-home').click();
  }

  /* ---------- small utils ---------- */
  const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  function progress(el, i, n) {
    el.innerHTML = Array.from({ length: n }, (_, k) => `<span class="${k < i ? 'done' : k === i ? 'now' : ''}"></span>`).join('');
  }
  function feedback(el, ok, text) {
    el.className = 'feedback ' + (ok ? 'good' : 'bad');
    el.innerHTML = text;
  }
  const praise = () => shuffle(['Great job!', 'Super!', 'Well done!', 'Excellent!', 'You got it!', 'Wonderful!'])[0];

  /* ---------- tap-or-drag placing (works with finger, pen and mouse) ----------
     chips: elements to move; zones: drop targets.
     accept(chip, zone) -> true if correct. */
  function tapDrag(chips, zones, accept) {
    let picked = null;
    const pick = (c) => { if (picked) picked.classList.remove('picked'); picked = c; c?.classList.add('picked'); };
    const tryPlace = (chip, zone) => {
      if (!chip || !zone) return;
      pick(null);
      accept(chip, zone);
    };
    chips.forEach((chip) => {
      chip.style.touchAction = 'none';
      chip.addEventListener('pointerdown', (e) => {
        if (chip.dataset.locked) return;
        e.preventDefault();
        const r = chip.getBoundingClientRect();
        const ox = e.clientX - r.left, oy = e.clientY - r.top;
        const sx = e.clientX, sy = e.clientY;
        let ghost = null;
        const move = (ev) => {
          if (!ghost && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 12) {
            ghost = chip.cloneNode(true);
            ghost.classList.add('dragging');
            ghost.style.width = r.width + 'px';
            document.body.append(ghost);
            chip.style.opacity = 0.35;
          }
          if (ghost) { ghost.style.left = ev.clientX - ox + 'px'; ghost.style.top = ev.clientY - oy + 'px'; }
        };
        const up = (ev) => {
          window.removeEventListener('pointermove', move);
          window.removeEventListener('pointerup', up);
          chip.style.opacity = '';
          if (ghost) {
            ghost.remove();
            const zone = document.elementsFromPoint(ev.clientX, ev.clientY).find((el) => zones.includes(el));
            tryPlace(chip, zone);
          } else {
            pick(picked === chip ? null : chip);
            sfx('pop');
          }
        };
        window.addEventListener('pointermove', move);
        window.addEventListener('pointerup', up);
      });
    });
    zones.forEach((z) => z.addEventListener('click', () => picked && tryPlace(picked, z)));
  }

  /* ---------- the bicycle picture (used by several games) ----------
     Every part has data-part so games can colour or label it. */
  function bikeSVG({ frame = '#e63946', seat = '#2f7de1', tyre = '#222', pedal = '#222', plain = false } = {}) {
    const f = plain ? '#eeeeee' : frame, s = plain ? '#eeeeee' : seat, t = plain ? '#eeeeee' : tyre, p = plain ? '#eeeeee' : pedal;
    const o = '#2b2140';
    const spokes = (cx, cy) => Array.from({ length: 12 }, (_, i) => {
      const a = (i * Math.PI) / 6;
      return `<line x1="${cx}" y1="${cy}" x2="${cx + 92 * Math.cos(a)}" y2="${cy + 92 * Math.sin(a)}" stroke="#9aa0ad" stroke-width="3" pointer-events="none"/>`;
    }).join('');
    return `<svg viewBox="0 0 800 480" xmlns="http://www.w3.org/2000/svg" class="bike">
      <g data-part="wheel">
        <circle data-paint="tyre" cx="200" cy="340" r="108" fill="none" stroke="${t}" stroke-width="22"/>
        <circle cx="200" cy="340" r="108" fill="none" stroke="${o}" stroke-width="2" opacity=".5" pointer-events="none"/>
        ${spokes(200, 340)}<circle cx="200" cy="340" r="12" fill="#9aa0ad"/>
      </g>
      <g data-part="wheel">
        <circle data-paint="tyre" cx="610" cy="340" r="108" fill="none" stroke="${t}" stroke-width="22"/>
        <circle cx="610" cy="340" r="108" fill="none" stroke="${o}" stroke-width="2" opacity=".5" pointer-events="none"/>
        ${spokes(610, 340)}<circle cx="610" cy="340" r="12" fill="#9aa0ad"/>
      </g>
      <g data-part="carrier">
        <path d="M140 205 H285" stroke="${o}" stroke-width="12" stroke-linecap="round"/>
        <path d="M150 205 L200 340 M250 205 L200 340" stroke="${o}" stroke-width="7"/>
      </g>
      <g data-part="frame">
        <path data-paint="frame" d="M200 340 L395 340 L330 200 Z M330 200 L545 192 L395 340 M545 192 L610 340"
          fill="none" stroke="${f}" stroke-width="18" stroke-linejoin="round" stroke-linecap="round"/>
        <path d="M200 340 L395 340 L330 200 Z M330 200 L545 192 L395 340 M545 192 L610 340"
          fill="none" stroke="${o}" stroke-width="2" opacity=".35" pointer-events="none"/>
      </g>
      <g data-part="handle">
        <path d="M545 192 L535 130" stroke="${o}" stroke-width="12" stroke-linecap="round"/>
        <path d="M495 122 Q535 110 590 128" fill="none" stroke="${o}" stroke-width="12" stroke-linecap="round"/>
        <rect x="575" y="116" width="40" height="20" rx="10" fill="#555" transform="rotate(14 595 126)"/>
      </g>
      <g data-part="brake">
        <path d="M560 136 Q590 150 612 160" fill="none" stroke="#9aa0ad" stroke-width="8" stroke-linecap="round"/>
      </g>
      <g data-part="bell">
        <circle cx="520" cy="102" r="17" fill="#ffd34d" stroke="${o}" stroke-width="3"/>
        <circle cx="520" cy="102" r="5" fill="${o}"/>
      </g>
      <g data-part="seat">
        <path d="M330 200 L322 168" stroke="${o}" stroke-width="10"/>
        <path data-paint="seat" d="M270 160 Q300 145 370 158 Q372 175 330 176 Q290 178 270 160 Z" fill="${s}" stroke="${o}" stroke-width="3"/>
      </g>
      <g data-part="pedal">
        <circle cx="395" cy="340" r="26" fill="#bbb" stroke="${o}" stroke-width="3"/>
        <path d="M395 340 L430 400" stroke="${o}" stroke-width="10" stroke-linecap="round"/>
        <rect data-paint="pedal" x="410" y="396" width="50" height="16" rx="5" fill="${p}" stroke="${o}" stroke-width="3"/>
      </g>
    </svg>`;
  }

  /* ---------- one-question-at-a-time quiz ----------
     items: data list. question(item) -> html. options(item) -> [{label, value}].
     answer(item) -> right value. Optional: onShow(item), explain(item), endMsg. */
  function quiz({ el, items, question, options, answer, onShow, explain, endMsg = 'You finished the game!', shuffleItems = true }) {
    let list, i, firstTry;
    function start() { list = shuffleItems ? shuffle(items) : [...items]; i = 0; next(); }
    function next() {
      if (i >= list.length) { end({ title: 'Well done!', msg: endMsg, onReplay: start }); return; }
      const item = list[i];
      firstTry = true;
      el.innerHTML = `<div class="progress"></div><div class="q">${question(item)}</div>
        <div class="row opts"></div><div class="feedback"></div>`;
      progress(el.querySelector('.progress'), i, list.length);
      const box = el.querySelector('.opts');
      options(item).forEach((o) => {
        const b = document.createElement('button');
        b.className = 'choice';
        b.innerHTML = o.label;
        b.onclick = () => choose(b, o.value, item);
        box.append(b);
      });
      onShow?.(item, el);
    }
    function choose(btn, val, item) {
      const fb = el.querySelector('.feedback');
      if (val === answer(item)) {
        btn.classList.add('right');
        el.querySelectorAll('.choice').forEach((b) => (b.disabled = true));
        if (firstTry) star();
        sfx('good');
        const p = praise();
        feedback(fb, true, '🎉 ' + p + (explain ? ' ' + explain(item) : ''));
        say(p + (explain ? ' ' + explain(item).replace(/<[^>]+>/g, '') : ''));
        i++;
        setTimeout(next, explain ? 2600 : 1500);
      } else {
        firstTry = false;
        btn.classList.add('wrong');
        sfx('bad');
        feedback(fb, false, '🙂 Try again!');
        setTimeout(() => btn.classList.remove('wrong'), 500);
      }
    }
    start();
  }

  return { init, say, sfx, tone, ctx, star, confetti, end, shuffle, $, $$, progress, feedback, praise, tapDrag, bikeSVG, quiz, isMuted: () => muted };
})();
