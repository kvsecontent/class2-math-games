/* Tug of War – two players answer at the same time on one smartboard.
   Each right answer pulls the rope towards that player. Pull the flag over
   your line (5 ahead) or have more right answers after 10 questions to win.
   Usage: TUG({ bank: [{ e, t, o: [right, wrong, wrong] }, …] })  (needs common.js) */
function TUG({ bank, rounds = 10, win = 5 }) {
  const STEP = 15 / win; // % the rope moves per point of difference; `win` ahead = flag on the goal line (35% / 65%)
  const P = { a: { name: 'Player 1', score: 0, i: 0, list: [], busy: false }, b: { name: 'Player 2', score: 0, i: 0, list: [], busy: false } };
  let over = false;

  document.querySelector('main').innerHTML = `
    <div class="tug-stage">
      <div class="field">
        <div class="names"><span class="a" id="nA"></span><span class="b" id="nB"></span></div>
        <div class="goal l"></div><div class="goal r"></div><div class="mid"></div>
        <div class="pull" id="pull"><div class="rope"></div><span class="flag">🎀</span>
          <span class="kid a"><span>🧒🏽</span></span><span class="kid b">🧒🏻</span></div>
      </div>
      <div class="duel">
        <div class="side a" id="sideA"></div>
        <div class="side b" id="sideB"></div>
      </div>
    </div>`;

  /* ---------- start screen ---------- */
  function cover(html) {
    let c = G.$('.tug-cover');
    if (!c) { c = document.createElement('div'); c.className = 'tug-cover'; document.body.append(c); }
    c.innerHTML = html;
    c.style.display = 'flex';
    return c;
  }
  function setup() {
    const c = cover(`<div class="card"><h2>🪢 Tug of War</h2>
      <p class="rules">Two players stand at the board. Each one answers their own questions.<br>
      Every right answer pulls the rope your way! Pull the 🎀 to your 🚩 to win,<br>or get more right answers after ${rounds} questions.</p>
      <div class="names-in"><input class="a" id="inA" value="${P.a.name}" aria-label="Player 1 name"><input class="b" id="inB" value="${P.b.name}" aria-label="Player 2 name"></div>
      <button class="big-btn green" id="go">▶ Start</button></div>`);
    G.$('#go', c).onclick = () => {
      P.a.name = G.$('#inA', c).value.trim() || 'Player 1';
      P.b.name = G.$('#inB', c).value.trim() || 'Player 2';
      countdown();
    };
  }
  function countdown() {
    let n = 3;
    const tick = () => {
      if (n === 0) { cover('<div class="count-big">Pull!</div>'); G.sfx('win'); G.say('Pull!'); setTimeout(begin, 700); return; }
      cover(`<div class="count-big">${n}</div>`); G.sfx('pop'); G.say(String(n));
      n--; setTimeout(tick, 900);
    };
    tick();
  }

  /* ---------- the game ---------- */
  function begin() {
    G.$('.tug-cover').style.display = 'none';
    over = false;
    // Each player gets different questions from the same chapter bank.
    const deck = G.shuffle(bank);
    P.a.list = deck.slice(0, rounds);
    P.b.list = deck.slice(rounds, rounds * 2).length >= rounds ? deck.slice(rounds, rounds * 2) : G.shuffle(bank).slice(0, rounds);
    ['a', 'b'].forEach((k) => { P[k].score = 0; P[k].i = 0; P[k].busy = false; });
    G.$('#nA').textContent = '🔵 ' + P.a.name;
    G.$('#nB').textContent = P.b.name + ' 🔴';
    pull();
    show('a'); show('b');
  }
  function pull(who) {
    const diff = P.a.score - P.b.score;
    const el = G.$('#pull');
    el.style.transform = `translateX(${-diff * STEP}%)`;
    el.classList.remove('tug-a', 'tug-b');
    if (who) { void el.offsetWidth; el.classList.add('tug-' + who); }
    return diff;
  }
  function show(k) {
    const p = P[k], side = G.$(k === 'a' ? '#sideA' : '#sideB');
    const head = `<div class="head"><b>${k === 'a' ? '🔵' : '🔴'} ${p.name}</b><span class="count">${Math.min(p.i + 1, rounds)} / ${rounds}</span><span class="score">${p.score}</span></div>`;
    if (p.i >= rounds) {
      side.innerHTML = head + `<div class="done">✅ All done!<br>Wait for your friend…</div>`;
      side.querySelector('.count').textContent = `${rounds} / ${rounds}`;
      if (P.a.i >= rounds && P.b.i >= rounds) finish();
      return;
    }
    const q = p.list[p.i];
    side.innerHTML = head + `<div class="qbox"><button class="say">🔊</button><div class="e">${q.e}</div><div class="t">${q.t}</div></div>
      <div class="opts">${G.shuffle(q.o).map((o) => `<button class="opt">${o}</button>`).join('')}</div>`;
    side.querySelector('.say').onclick = () => G.say(q.t.replace(/_+/g, 'blank'));
    side.querySelectorAll('.opt').forEach((b) => {
      // pointerdown so two children can tap at the same moment on a multi-touch board
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); answer(k, b, q); });
    });
  }
  function answer(k, btn, q) {
    const p = P[k];
    if (over || p.busy) return;
    p.busy = true;
    const side = btn.closest('.side');
    const ok = btn.textContent === q.o[0];
    if (ok) {
      btn.classList.add('right');
      p.score++;
      side.querySelector('.score').textContent = p.score;
      G.sfx('good');
      const diff = pull(k);
      if (Math.abs(diff) >= win) { setTimeout(() => finish(diff > 0 ? 'a' : 'b'), 700); return; }
    } else {
      btn.classList.add('wrong');
      side.querySelectorAll('.opt').forEach((b) => b.textContent === q.o[0] && b.classList.add('right'));
      G.sfx('bad');
    }
    setTimeout(() => { if (over) return; p.i++; p.busy = false; show(k); }, ok ? 900 : 1600);
  }

  /* ---------- the end ---------- */
  function finish(pulled) {
    if (over) return;
    over = true;
    const w = pulled || (P.a.score > P.b.score ? 'a' : P.b.score > P.a.score ? 'b' : '');
    G.sfx('win'); G.confetti(50);
    const title = w ? `🏆 ${P[w].name} wins!` : '🤝 It’s a tie!';
    const how = pulled ? `${P[w].name} pulled the 🎀 over the line!` : 'Both players finished all the questions.';
    const c = cover(`<div class="card"><h2>${title}</h2>
      <p style="font-size:1.6rem;margin:0.4rem 0">${how}</p>
      <p style="font-size:2rem;font-weight:800"><span style="color:var(--blue)">${P.a.name}: ${P.a.score}</span> &nbsp;·&nbsp; <span style="color:var(--red)">${P.b.name}: ${P.b.score}</span></p>
      <div class="row"><button class="big-btn green" id="again">🔁 Play again</button><button class="big-btn ghost" id="home">🏠 Home</button></div></div>`);
    G.say(title.replace(/[🏆🤝]/gu, '') + ' ' + how.replace('🎀', 'ribbon'));
    G.$('#again', c).onclick = setup;
    G.$('#home', c).onclick = () => G.$('#tb-home').click();
  }

  setup();
}
