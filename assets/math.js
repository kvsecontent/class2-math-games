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
  function pad(el, { show, onEnter, digits = 3 }) {
    let v = '';
    el.classList.add('m-pad');
    el.innerHTML = [1, 2, 3, 4, 5, 6, 7, 8, 9, '⌫', 0, '✓'].map((k) => `<button data-k="${k}" class="${k === '✓' ? 'ok' : k === '⌫' ? 'del' : ''}">${k}</button>`).join('');
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

  return { strips, pad, word, rnd };
})();
