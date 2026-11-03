/* 一日一巷 · 胡同生活小场景（5 个）
 *  鸽哨：选一个字，鸽群在天上摆出来        → 小印「鸽」
 *  早点摊：挑早饭进托盘，配出老北京标配      → 小印「早」
 *  小卖部：玻璃柜台，点什么动什么，凑 3 样结账 → 小印「铺」
 *  四合院：院里东西都能点，找出 3 个“福”     → 小印「院」
 *  戏楼：拉开幕布，等她亮相时叫个好          → 小印「戏」
 *  原则：少字。悬停才出一句话小纸签，其余全靠动作和声音反馈。所有声音都是干净的正弦音，不用噪声。
 */
import { soundOn } from './audio.js';

const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const INK = '#2f2b26';
const NS = 'http://www.w3.org/2000/svg';
const rnd = (a, b) => a + Math.random() * (b - a);

/* ---------------- 小音效（全部正弦/三角波，干净不刺耳） ---------------- */
let AC = null, BUS = null;
function ac() {
  if (!AC) {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600; lp.Q.value = .5;
    const comp = AC.createDynamicsCompressor(); comp.threshold.value = -20; comp.ratio.value = 4;
    const g = AC.createGain(); g.gain.value = .8;
    lp.connect(comp); comp.connect(g); g.connect(AC.destination); BUS = lp;
  }
  if (AC.state === 'suspended') AC.resume(); return AC;
}
function tone(f0, f1, dur, vol = .12, type = 'sine', delay = 0) {
  const a = ac(), t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
  f0 = Math.min(f0, 2200); f1 = Math.min(f1, 2200);
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .025); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
  o.connect(g); g.connect(BUS); o.start(t); o.stop(t + dur + .05);
}
export function sfx(type) {
  if (!soundOn()) return;
  try {
    switch (type) {
      case 'pop': tone(440, 880, .16, .1); break;
      case 'drop': tone(330, 200, .18, .1); break;
      case 'bubble': for (let i = 0; i < 4; i++) tone(rnd(500, 800), rnd(900, 1200), .09, .045, 'sine', i * .09); break;
      case 'fry': for (let i = 0; i < 4; i++) tone(rnd(600, 900), rnd(500, 700), .08, .03, 'sine', i * .1); break;
      case 'steam': tone(392, 330, .5, .04); break;
      case 'stamp': tone(160, 80, .35, .22); tone(523, 523, .6, .04, 'sine', .12); break;
      case 'bell': [[784, .9], [1175, .7], [1568, .5]].forEach(([f, d], i) => tone(f, f * .998, d, .06 / (i + 1), 'sine', i * .12)); break;
      case 'chirp': for (let i = 0; i < 3; i++) tone(rnd(1300, 1600), rnd(1700, 2000), .1, .035, 'sine', i * .15); break;
      case 'clack': tone(620, 440, .08, .1, 'sine'); tone(520, 380, .07, .07, 'sine', .08); break;
      case 'gong': [1, 1.48, 2.1].forEach((r, i) => tone(200 * r, 170 * r, 1.6 / (i + 1), .14 / (i + 1))); break;
      case 'xiao': tone(880, 1320, .25, .08); tone(1320, 1760, .2, .06, 'sine', .2); break;
      case 'coin': tone(1047, 1050, .25, .06); tone(1568, 1570, .35, .05, 'sine', .1); break;
      case 'bead': tone(700, 560, .07, .07, 'sine'); break;
      case 'whistle': [784, 880, 1047, 1175].forEach((f, i) => tone(f, f * .998, .7, .045, 'sine', i * .11)); break; // 柔和风铃，代替鸽哨（原 FM 音听感刺耳）
      case 'meow': tone(600, 880, .2, .05); tone(880, 520, .35, .05, 'sine', .2); break;
      case 'hao': tone(300, 420, .3, .08); break;
    }
  } catch (e) {}
}

/* ---------------- 通用外壳 ---------------- */
function shell({ kicker, title, svg, hint, goText, bubbleAt = [800, 200], cls = '' }) {
  const root = el('div', 'life ' + cls, `
    <div class="lf-head"><span class="lf-kicker">${kicker}</span><h3>${title}</h3></div>
    <button class="lf-back">回胡同 <span>→</span></button>
    <div class="lf-wrap">${svg}</div>
    <div class="lf-bubble"><span></span></div>
    <div class="lf-tip"><b></b><span></span></div>
    <div class="lf-bar"><span class="lf-hint">${hint}</span>${goText ? `<button class="lf-go" disabled>${goText}</button>` : ''}</div>
    <div class="lf-seal"><i></i><small>胡同小印</small></div>`);
  document.body.appendChild(root);
  document.body.classList.add('locked');
  requestAnimationFrame(() => root.classList.add('open'));
  const svgEl = root.querySelector('svg'), tip = root.querySelector('.lf-tip'), bubble = root.querySelector('.lf-bubble');
  const S = {
    root, svg: svgEl, go: root.querySelector('.lf-go'),
    q: s => svgEl.querySelector(s), qa: s => svgEl.querySelectorAll(s),
    toScreen(x, y) { const p = svgEl.createSVGPoint(); p.x = x; p.y = y; const r = p.matrixTransform(svgEl.getScreenCTM()); return [r.x, r.y]; },
    scale: () => svgEl.getScreenCTM().a,
    hint: t => { root.querySelector('.lf-hint').textContent = t; },
    say(t, ms = 3000, at = bubbleAt) {
      bubble.querySelector('span').textContent = t;
      bubble.classList.remove('show'); void bubble.offsetWidth; bubble.classList.add('show');
      const [x, y] = S.toScreen(at[0], at[1]); bubble.style.left = x + 'px'; bubble.style.top = y + 'px';
      clearTimeout(S._st); if (ms) S._st = setTimeout(() => bubble.classList.remove('show'), ms);
    },
    pulse(g, ms = 1100) { g.classList.remove('act'); void g.getBBox(); g.classList.add('act'); clearTimeout(g._t); g._t = setTimeout(() => g.classList.remove('act'), ms); },
    stamp(ch, onSeal) {
      const st = root.querySelector('.lf-seal'); st.querySelector('i').textContent = ch;
      st.classList.remove('show', 'settle'); void st.offsetWidth; st.classList.add('show'); sfx('stamp'); onSeal && onSeal();
    },
    onClose: null,
    close() {
      root.classList.remove('open'); document.body.classList.remove('locked');
      removeEventListener('keydown', onKey); S.onClose && S.onClose();
      setTimeout(() => root.remove(), 700);
    }
  };
  // 悬停小纸签：data-tip="名字|一句话"
  svgEl.querySelectorAll('[data-tip]').forEach(g => {
    g.addEventListener('mouseenter', () => { const [a, b] = g.dataset.tip.split('|'); tip.querySelector('b').textContent = a; tip.querySelector('span').textContent = b || ''; tip.classList.add('show'); g.classList.add('hover'); });
    g.addEventListener('mouseleave', () => { tip.classList.remove('show'); g.classList.remove('hover'); });
  });
  root.addEventListener('mousemove', e => { tip.style.left = e.clientX + 'px'; tip.style.top = e.clientY + 'px'; });
  const onKey = e => { if (e.key === 'Escape') S.close(); };
  addEventListener('keydown', onKey);
  root.querySelector('.lf-back').onclick = () => S.close();
  polish(S);
  return S;
}
/* ---------------- 统一“精修层”：纸纹、光、阴影、入场、点击手感 ---------------- */
let GRAIN = null;
function grainURL() {
  if (GRAIN) return GRAIN;
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'), d = x.createImageData(256, 256);
  for (let i = 0; i < d.data.length; i += 4) { const v = 200 + Math.random() * 55; d.data[i] = v; d.data[i + 1] = v * .97; d.data[i + 2] = v * .9; d.data[i + 3] = Math.random() * 40; }
  x.putImageData(d, 0, 0);
  // 几道纤维
  x.strokeStyle = 'rgba(120,90,50,.06)'; for (let i = 0; i < 40; i++) { x.beginPath(); const a = Math.random() * 256, b = Math.random() * 256; x.moveTo(a, b); x.quadraticCurveTo(a + rnd(-30, 30), b + rnd(-30, 30), a + rnd(-60, 60), b + rnd(-60, 60)); x.stroke(); }
  return (GRAIN = c.toDataURL());
}
function polish(S) {
  const { root, svg } = S;
  // SVG 滤镜：落地软阴影 + 悬停暖光描边
  const defs = document.createElementNS(NS, 'defs');
  defs.innerHTML = `
    <filter id="lfSh" x="-20%" y="-20%" width="140%" height="150%"><feGaussianBlur in="SourceAlpha" stdDeviation="5"/><feOffset dx="3" dy="8"/>
      <feComponentTransfer><feFuncA type="linear" slope=".22"/></feComponentTransfer><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="lfGlow" x="-20%" y="-20%" width="140%" height="140%"><feMorphology in="SourceAlpha" operator="dilate" radius="4" result="d"/>
      <feGaussianBlur in="d" stdDeviation="3" result="b"/><feFlood flood-color="#fff1c4"/><feComposite in2="b" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <radialGradient id="lfLight" cx="50%" cy="25%" r="75%"><stop offset="0" stop-color="#fff6dc" stop-opacity=".35"/><stop offset=".6" stop-color="#fff6dc" stop-opacity="0"/><stop offset="1" stop-color="#3a2a1a" stop-opacity=".22"/></radialGradient>`;
  svg.prepend(defs);
  svg.querySelectorAll('.lf-item').forEach(g => g.setAttribute('filter', 'url(#lfSh)'));
  // 光与暗角（在 SVG 里，跟着画面缩放）
  const light = document.createElementNS(NS, 'rect');
  Object.entries({ width: 1600, height: 900, fill: 'url(#lfLight)', class: 'lf-light', 'pointer-events': 'none' }).forEach(([k, v]) => light.setAttribute(k, v));
  svg.appendChild(light);
  // 纸纹 + 漂浮的光尘
  const grain = el('div', 'lf-grain'); grain.style.backgroundImage = `url(${grainURL()})`; root.querySelector('.lf-wrap').appendChild(grain);
  const motes = el('div', 'lf-motes', Array.from({ length: 18 }, () => `<i style="left:${rnd(5, 95)}%;top:${rnd(10, 80)}%;animation-delay:${rnd(-12, 0)}s;animation-duration:${rnd(9, 16)}s;--s:${rnd(.5, 1.2)}"></i>`).join(''));
  root.querySelector('.lf-wrap').appendChild(motes);
  // 鼠标视差：画面跟着手轻轻移动
  const wrap = root.querySelector('.lf-wrap'); let px = 0, py = 0, tx = 0, ty = 0, raf = 0, alive = true;
  root.addEventListener('mousemove', e => { tx = (e.clientX / innerWidth - .5) * -8; ty = (e.clientY / innerHeight - .5) * -5; });
  const tick = () => { if (!alive) return; px += (tx - px) * .06; py += (ty - py) * .06; svg.style.transform = `translate(${px}px,${py}px) scale(1.02)`; raf = requestAnimationFrame(tick); };
  raf = requestAnimationFrame(tick);
  const prevClose = S.close; S.close = () => { alive = false; cancelAnimationFrame(raf); prevClose(); };
  // 入场：东西一件件“落”到位
  [...svg.querySelectorAll('.lf-item')].forEach((g, i) => g.animate([{ opacity: 0, translate: '0 26px' }, { opacity: 1, translate: '0 -4px', offset: .7 }, { opacity: 1, translate: '0 0' }],
    { duration: 700, delay: 350 + i * 70, easing: 'cubic-bezier(.2,.8,.3,1)', fill: 'backwards' }));
  // 点击手感：压一下再弹回来 + 一圈金色小光点
  svg.addEventListener('pointerdown', e => {
    const g = e.target.closest('.lf-item, .yd-fu, .pg-man'); if (!g) return;
    g.animate([{ scale: '1' }, { scale: '1.04 .95', offset: .25 }, { scale: '.98 1.03', offset: .6 }, { scale: '1' }], { duration: 420, easing: 'ease-out', composite: 'add' });
    burst(e.clientX, e.clientY);
  });
}
function burst(x, y) {
  const b = el('div', 'lf-burst'); b.style.left = x + 'px'; b.style.top = y + 'px';
  b.innerHTML = Array.from({ length: 9 }, (_, i) => `<i style="--a:${i * 40 + rnd(-8, 8)}deg;--d:${rnd(26, 46)}px"></i>`).join('');
  document.body.appendChild(b); setTimeout(() => b.remove(), 700);
}
// 一个东西沿弧线飞到目标
function flyIcon(html, sx, sy, tx, ty, size, done) {
  const f = el('div', 'lf-fly', html); f.style.width = f.style.height = size + 'px'; document.body.appendChild(f);
  const mx = (sx + tx) / 2, my = Math.min(sy, ty) - size * 1.4;
  f.animate([
    { transform: `translate(${sx - size / 2}px, ${sy - size / 2}px) scale(.6)` },
    { transform: `translate(${mx - size / 2}px, ${my - size / 2}px) scale(1.05) rotate(${Math.random() < .5 ? -14 : 14}deg)`, offset: .5 },
    { transform: `translate(${tx - size / 2}px, ${ty - size / 2}px) scale(1)` }
  ], { duration: 720, easing: 'cubic-bezier(.3,.1,.3,1)' }).onfinish = () => { f.remove(); done && done(); };
}
const icon = (inner, size) => `<svg viewBox="-60 -60 120 120" width="${size}" height="${size}">${inner}</svg>`;
// 通用：托盘/篮子（N 个格子），点格子里的东西放回
function makeTray(S, { slots, y, onChange, iconOf }) {
  const tray = slots.map(() => null);
  let busy = 0;
  function render() {
    S.qa('.lf-slot').forEach((s, i) => {
      s.querySelectorAll('.lf-in').forEach(n => n.remove());
      if (!tray[i] || tray[i] === '…') return;
      const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'lf-in');
      g.innerHTML = `<g transform="translate(0 -8)">${iconOf(tray[i])}</g>`;
      g.onclick = e => { e.stopPropagation(); if (T.locked) return; tray[i] = null; sfx('drop'); render(); };
      s.appendChild(g);
    });
    onChange && onChange(tray.filter(k => k && k !== '…'));
  }
  const T = {
    tray, locked: false, get busy() { return busy; }, render,
    full: () => tray.indexOf(null) < 0,
    add(k, sx, sy) {
      const i = tray.indexOf(null); if (i < 0) return false;
      tray[i] = '…'; busy++;
      const [tx, ty] = S.toScreen(800 + slots[i], y - 8), size = 112 * S.scale();
      flyIcon(icon(iconOf(k), size), sx, sy, tx, ty, size, () => {
        tray[i] = k; busy--; sfx('drop'); render();
        const n = S.qa('.lf-slot')[i].querySelector('.lf-in'); if (n) n.animate([{ transform: 'translateY(-10px)' }, { transform: 'none' }], { duration: 260, easing: 'ease-out' });
      });
      return true;
    },
    clear() { tray.fill(null); render(); }
  };
  render();
  return T;
}
// 屏幕坐标：某个 <g> 的平移点 + 偏移
function gPos(S, g, dx = 0, dy = 0) { const m = g.transform.baseVal.consolidate().matrix; return S.toScreen(m.e + dx, m.f + dy); }

/* ---------------- 食物小图标（托盘与飞行用） ---------------- */
const bowl = (liquid, extra = '') => `
  <path d="M-46 -6 Q-44 40 0 42 Q44 40 46 -6 Z" fill="#f4efe4" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
  <path d="M-30 18 Q0 26 30 18" fill="none" stroke="#2d5c93" stroke-width="3" opacity=".8"/>
  <ellipse cx="0" cy="-6" rx="46" ry="12" fill="${liquid}" stroke="${INK}" stroke-width="4"/>${extra}`;
const ICONS = {
  baozi: `<path d="M-44 26 Q-48 -8 -18 -26 Q0 -40 18 -26 Q48 -8 44 26 Z" fill="#fbf4e6" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M-6 -30 Q0 -22 6 -30 M-14 -24 Q-8 -10 -16 0 M14 -24 Q8 -10 16 0 M0 -26 L0 -6" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="0" cy="28" rx="46" ry="7" fill="#e7dcc4" stroke="${INK}" stroke-width="3"/>`,
  youtiao: `<g transform="rotate(-18)"><rect x="-50" y="-16" width="100" height="16" rx="8" fill="#d99a3c" stroke="${INK}" stroke-width="4"/>
    <rect x="-50" y="0" width="100" height="16" rx="8" fill="#e2aa4c" stroke="${INK}" stroke-width="4"/>
    <path d="M-36 -8 h10 M-14 -8 h10 M8 -8 h10 M30 -8 h10 M-30 8 h10 M-6 8 h10 M18 8 h10" stroke="#b06f22" stroke-width="3" stroke-linecap="round"/></g>`,
  doujiang: bowl('#fbf8f0', `<path d="M-14 -10 q6 -4 12 0" stroke="#d8cfbd" stroke-width="3" fill="none"/>`),
  douzhi: bowl('#a7a983', `<circle cx="-12" cy="-8" r="3" fill="#8b8d66"/><circle cx="10" cy="-5" r="2.5" fill="#8b8d66"/>`),
  chaogan: bowl('#6b3b22', `<circle cx="-14" cy="-7" r="5" fill="#8a4e2c" stroke="${INK}" stroke-width="2"/><circle cx="8" cy="-5" r="4" fill="#3d2214"/><path d="M-4 -10 l6 2" stroke="#e8e0c8" stroke-width="3" stroke-linecap="round"/>`),
  jiaoquan: `<ellipse cx="0" cy="26" rx="48" ry="10" fill="#f4efe4" stroke="${INK}" stroke-width="4"/>
    <circle cx="-8" cy="0" r="26" fill="none" stroke="${INK}" stroke-width="15"/><circle cx="-8" cy="0" r="26" fill="none" stroke="#b9702a" stroke-width="9"/>
    <circle cx="14" cy="6" r="22" fill="none" stroke="${INK}" stroke-width="14"/><circle cx="14" cy="6" r="22" fill="none" stroke="#c9843a" stroke-width="8"/>`,
  tangyoubing: `<ellipse cx="0" cy="22" rx="50" ry="12" fill="#f4efe4" stroke="${INK}" stroke-width="4"/>
    <ellipse cx="0" cy="6" rx="42" ry="20" fill="#c98a3a" stroke="${INK}" stroke-width="4"/>
    <path d="M-24 4 Q-8 -8 6 2 Q20 12 28 2" fill="none" stroke="#8a4f1c" stroke-width="5" stroke-linecap="round"/>
    <path d="M-20 12 Q0 4 22 12" fill="none" stroke="#e9b45e" stroke-width="3" stroke-linecap="round"/>`,
  xiancai: `<ellipse cx="0" cy="12" rx="40" ry="14" fill="#f4efe4" stroke="${INK}" stroke-width="4"/>
    <ellipse cx="0" cy="8" rx="30" ry="8" fill="#e9e0cc"/>
    <path d="M-22 6 q10 -10 20 0 M-12 10 q10 -12 22 -2 M0 4 q8 -8 18 2 M-18 0 q14 -4 26 6" fill="none" stroke="#7a4a20" stroke-width="3.5" stroke-linecap="round"/>
    <circle cx="10" cy="0" r="2.5" fill="#b8322a"/>`
};
const FOODS = {
  baozi:       { name: '包子', tip: '薄皮大馅，十八个褶' },
  youtiao:     { name: '油条', tip: '现炸的，外脆里软' },
  doujiang:    { name: '豆浆', tip: '刚磨的，甜咸随您' },
  douzhi:      { name: '豆汁儿', tip: '酸里带馊，越喝越香' },
  jiaoquan:    { name: '焦圈', tip: '脆得掉渣，就豆汁儿' },
  tangyoubing: { name: '糖油饼', tip: '一面糖一面油' },
  xiancai:     { name: '咸菜丝', tip: '豆汁儿的老搭档' },
  chaogan:     { name: '炒肝', tip: '稠糊糊，配包子' }
};
const iconSvg = (k, size = 110) => `<svg viewBox="-60 -60 120 120" width="${size}" height="${size}">${ICONS[k]}</svg>`;

/* ---------------- 早点摊正面场景（SVG） ---------------- */
function stallSVG() {
  // 遮阳棚的波浪边
  let scallop = 'M170 196';
  for (let x = 170; x < 1430; x += 70) scallop += ` Q${x + 35} 236 ${x + 70} 196`;
  let stripes = '';
  for (let x = 170, i = 0; x < 1430; x += 70, i++) if (i % 2) stripes += `<path d="M${x} 96 L${x + 70} 96 L${x + 70} 196 Q${x + 35} 236 ${x} 196 Z" fill="#f3e9d4"/>`;
  let bricks = '';
  for (let y = 40; y < 470; y += 34) for (let x = (y / 34) % 2 ? -40 : 0; x < 1600; x += 82) bricks += `<rect x="${x}" y="${y}" width="78" height="30" rx="2"/>`;
  return `
<svg class="lf-stage" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet">
  <defs>
    <radialGradient id="lfSun" cx=".72" cy=".1" r=".7"><stop offset="0" stop-color="#ffe7b8" stop-opacity=".9"/><stop offset="1" stop-color="#ffe7b8" stop-opacity="0"/></radialGradient>
  </defs>
  <!-- 墙 -->
  <rect x="0" y="0" width="1600" height="900" fill="#ece2cc"/>
  <g fill="#d9cfbb" stroke="#c6bba4" stroke-width="2">${bricks}</g>
  <rect x="0" y="0" width="1600" height="900" fill="url(#lfSun)"/>
  <!-- 窗 -->
  <g transform="translate(1180 250)">
    <rect x="-90" y="-80" width="180" height="150" fill="#3a4a5c" stroke="${INK}" stroke-width="5"/>
    <rect x="-80" y="-70" width="160" height="130" fill="#f2c983" opacity=".85"/>
    <path d="M0 -70 V60 M-80 -5 H80" stroke="#8a2a22" stroke-width="7"/>
    <path d="M-80 -70 l40 40 M40 -70 l40 40" stroke="#fff6dd" stroke-width="3" opacity=".6"/>
  </g>
  <!-- 招幌 -->
  <g class="lf-sway" transform="translate(410 250)">
    <path d="M0 -150 V-110" stroke="${INK}" stroke-width="4"/>
    <rect x="-46" y="-110" width="92" height="190" rx="6" fill="#b8322a" stroke="${INK}" stroke-width="5"/>
    <rect x="-36" y="-100" width="72" height="170" rx="3" fill="none" stroke="#f3d9a6" stroke-width="2.5"/>
    <text x="0" y="-38" text-anchor="middle" font-size="52" fill="#fbefdc" font-family="YRTitle, Noto Serif SC, serif" font-weight="600">早</text>
    <text x="0" y="40" text-anchor="middle" font-size="52" fill="#fbefdc" font-family="YRTitle, Noto Serif SC, serif" font-weight="600">点</text>
    <path d="M-30 80 l-6 30 M-10 80 l-3 36 M10 80 l3 36 M30 80 l6 30" stroke="#b8322a" stroke-width="5" stroke-linecap="round"/>
  </g>
  <!-- 遮阳棚 -->
  <path d="M150 96 H1450" stroke="${INK}" stroke-width="6"/>
  <path d="M170 96 H1430 V196 ${scallop.replace('M170 196', '')} Z" fill="#b8322a" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
  ${stripes}
  <path d="${scallop}" fill="none" stroke="${INK}" stroke-width="5"/>
  <rect x="186" y="200" width="14" height="300" fill="#7a5a3e" stroke="${INK}" stroke-width="4"/>
  <rect x="1400" y="200" width="14" height="300" fill="#7a5a3e" stroke="${INK}" stroke-width="4"/>

  <!-- 摊主：白帽、浓眉、八字胡、肩搭毛巾、围裙、挽袖，手里一把大勺 -->
  <g class="lf-vendor" transform="translate(800 0)" data-tip="摊主老刘|这摊儿摆了三十年">
   <g class="lf-breath">
    <path d="M-84 470 Q-86 356 -42 340 L42 340 Q86 356 84 470 Z" fill="#2d5c93" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M-30 342 L0 372 L30 342" fill="none" stroke="#1f416b" stroke-width="4"/>
    <!-- 围裙 -->
    <path d="M-46 372 Q-50 430 -52 470 L52 470 Q50 430 46 372 Q0 386 -46 372 Z" fill="#f6f1e6" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M-46 372 L-58 344 M46 372 L58 344" stroke="#f6f1e6" stroke-width="6"/><path d="M-46 372 L-58 344 M46 372 L58 344" stroke="${INK}" stroke-width="1.5" opacity=".5"/>
    <rect x="-22" y="410" width="44" height="30" rx="4" fill="#ece4d2" stroke="${INK}" stroke-width="3"/>
    <path d="M-10 410 v-6 M10 410 v-6" stroke="#b8322a" stroke-width="3"/>
    <!-- 肩上毛巾 -->
    <path d="M-70 352 Q-52 334 -30 340 L-26 396 Q-40 400 -50 392 Z" fill="#fbfaf4" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M-60 364 L-34 364 M-58 376 L-32 378" stroke="#b8322a" stroke-width="3"/>
    <!-- 脖子与头 -->
    <rect x="-15" y="314" width="30" height="32" fill="#e3b68e" stroke="${INK}" stroke-width="4"/>
    <g class="lf-head-g">
      <ellipse cx="-47" cy="286" rx="9" ry="13" fill="#e8bc93" stroke="${INK}" stroke-width="4"/>
      <ellipse cx="47" cy="286" rx="9" ry="13" fill="#e8bc93" stroke="${INK}" stroke-width="4"/>
      <path d="M-46 270 Q-48 330 0 334 Q48 330 46 270 Q44 236 0 234 Q-44 236 -46 270 Z" fill="#ecc7a0" stroke="${INK}" stroke-width="5"/>
      <!-- 白帽 -->
      <path d="M-50 262 Q-50 214 0 210 Q50 214 50 262 Z" fill="#fbfaf4" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M-52 258 Q0 270 52 258 L52 268 Q0 280 -52 268 Z" fill="#ece4d2" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      <!-- 眉眼 -->
      <path d="M-30 280 Q-18 272 -6 279 M6 279 Q18 272 30 280" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>
      <g class="lf-eyes"><path d="M-24 292 Q-18 287 -12 292 M12 292 Q18 287 24 292" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/></g>
      <path d="M0 292 Q-6 306 2 308" fill="none" stroke="#b98a62" stroke-width="3.5" stroke-linecap="round"/>
      <!-- 八字胡与笑口 -->
      <path d="M-2 314 Q-14 310 -24 318 Q-14 316 -2 318 Z M2 314 Q14 310 24 318 Q14 316 2 318 Z" fill="${INK}"/>
      <path class="lf-mouth" d="M-10 322 Q0 330 10 322" fill="none" stroke="${INK}" stroke-width="3.5" stroke-linecap="round"/>
      <circle cx="-30" cy="306" r="8" fill="#e79a86" opacity=".55"/><circle cx="30" cy="306" r="8" fill="#e79a86" opacity=".55"/>
      <path d="M-34 296 l-6 2 M34 296 l6 2" stroke="#b98a62" stroke-width="2" stroke-linecap="round"/>
    </g>
    <!-- 右手：挽袖持大勺 -->
    <g class="lf-arm-r">
      <path d="M66 372 Q104 392 112 432" fill="none" stroke="#2d5c93" stroke-width="28" stroke-linecap="round"/>
      <path d="M66 372 Q104 392 112 432" fill="none" stroke="${INK}" stroke-width="32" stroke-linecap="round" opacity="0"/>
      <rect x="98" y="404" width="30" height="12" rx="5" fill="#f6f1e6" stroke="${INK}" stroke-width="3" transform="rotate(20 113 410)"/>
      <path d="M112 424 L118 452" stroke="#e3b68e" stroke-width="20" stroke-linecap="round"/>
      <circle cx="118" cy="454" r="13" fill="#e8bc93" stroke="${INK}" stroke-width="4"/>
      <path d="M120 446 L140 330" stroke="#7a5a3e" stroke-width="7" stroke-linecap="round"/>
      <path d="M126 336 Q140 300 158 330 Q148 346 126 336 Z" fill="#9a958e" stroke="${INK}" stroke-width="4"/>
    </g>
    <!-- 左手：拿毛巾擦汗（定时） -->
    <g class="lf-arm-l">
      <path d="M-66 372 Q-104 392 -108 440" fill="none" stroke="#2d5c93" stroke-width="28" stroke-linecap="round"/>
      <circle cx="-108" cy="452" r="13" fill="#e8bc93" stroke="${INK}" stroke-width="4"/>
    </g>
   </g>
  </g>

  <!-- 柜台 -->
  <rect x="140" y="470" width="1320" height="190" fill="#a7764a" stroke="${INK}" stroke-width="5"/>
  <path d="M140 540 H1460 M140 600 H1460" stroke="#8e6038" stroke-width="3"/>
  <path d="M360 470 V660 M800 470 V660 M1240 470 V660" stroke="#8e6038" stroke-width="3"/>
  <rect x="124" y="452" width="1352" height="24" rx="4" fill="#7e5233" stroke="${INK}" stroke-width="5"/>
  <rect x="140" y="660" width="1320" height="16" fill="#6a4329" stroke="${INK}" stroke-width="4"/>

  <!-- 蒸笼（包子） -->
  <g class="lf-item" data-k="baozi" transform="translate(270 452)">
    ${[0, 1, 2].map(i => `<g transform="translate(0 ${-i * 52})"><path d="M-96 0 V-48 H96 V0 Z" fill="#d8b47e" stroke="${INK}" stroke-width="5"/>
      <path d="M-96 -24 H96" stroke="#b48d58" stroke-width="3"/><ellipse cx="0" cy="-48" rx="96" ry="14" fill="#e3c491" stroke="${INK}" stroke-width="4"/></g>`).join('')}
    <g class="lf-lid"><path d="M-104 -156 Q-100 -216 0 -220 Q100 -216 104 -156 Z" fill="#c9a26a" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
      <ellipse cx="0" cy="-156" rx="104" ry="14" fill="#b88f58" stroke="${INK}" stroke-width="4"/>
      <path d="M-60 -170 Q0 -200 60 -170" fill="none" stroke="#a37c48" stroke-width="3"/><rect x="-18" y="-232" width="36" height="14" rx="6" fill="#8a6338" stroke="${INK}" stroke-width="4"/></g>
    <g class="lf-steam idle">${[-40, 0, 40].map((x, i) => `<path d="M${x} -236 q-14 -24 0 -46 q14 -22 0 -44" fill="none" stroke="#fffaf0" stroke-width="9" stroke-linecap="round" style="animation-delay:${i * .6}s"/>`).join('')}</g>
    <rect x="-110" y="-240" width="220" height="246" fill="transparent"/>
  </g>

  <!-- 油锅（油条） -->
  <g class="lf-item" data-k="youtiao" transform="translate(520 452)">
    <rect x="-70" y="-40" width="140" height="40" fill="#3a3632" stroke="${INK}" stroke-width="5"/>
    <path d="M-100 -40 Q-96 -96 0 -98 Q96 -96 100 -40 Z" fill="#2f2b26" stroke="${INK}" stroke-width="5"/>
    <ellipse cx="0" cy="-92" rx="92" ry="16" fill="#d79a34" stroke="${INK}" stroke-width="4"/>
    <g class="lf-bubbles">${[-50, -18, 20, 52].map((x, i) => `<circle cx="${x}" cy="-92" r="6" fill="#f3c66a" stroke="${INK}" stroke-width="2" style="animation-delay:${i * .25}s"/>`).join('')}</g>
    <g class="lf-fry" transform="translate(0 -96) rotate(-8)"><rect x="-64" y="-12" width="128" height="12" rx="6" fill="#d99a3c" stroke="${INK}" stroke-width="4"/><rect x="-64" y="0" width="128" height="12" rx="6" fill="#e2aa4c" stroke="${INK}" stroke-width="4"/></g>
    <path d="M60 -150 L130 -110 M66 -158 L136 -118" stroke="#7a5a3e" stroke-width="7" stroke-linecap="round"/>
    <rect x="-110" y="-170" width="250" height="172" fill="transparent"/>
  </g>

  <!-- 焦圈 -->
  <g class="lf-item lf-plate" data-k="jiaoquan" transform="translate(690 452)">
    <ellipse cx="0" cy="-10" rx="66" ry="14" fill="#f4efe4" stroke="${INK}" stroke-width="4"/>
    <g transform="translate(0 -34)"><circle cx="-14" cy="0" r="22" fill="none" stroke="${INK}" stroke-width="14"/><circle cx="-14" cy="0" r="22" fill="none" stroke="#b9702a" stroke-width="8"/>
    <circle cx="18" cy="4" r="20" fill="none" stroke="${INK}" stroke-width="13"/><circle cx="18" cy="4" r="20" fill="none" stroke="#c9843a" stroke-width="7"/>
    <circle cx="2" cy="-20" r="18" fill="none" stroke="${INK}" stroke-width="12"/><circle cx="2" cy="-20" r="18" fill="none" stroke="#d29245" stroke-width="6"/></g>
    <rect x="-70" y="-80" width="140" height="84" fill="transparent"/>
  </g>

  <!-- 糖油饼 -->
  <g class="lf-item lf-plate" data-k="tangyoubing" transform="translate(910 452)">
    <ellipse cx="0" cy="-10" rx="70" ry="15" fill="#f4efe4" stroke="${INK}" stroke-width="4"/>
    <ellipse cx="0" cy="-26" rx="58" ry="22" fill="#c98a3a" stroke="${INK}" stroke-width="4"/>
    <path d="M-34 -28 Q-12 -42 6 -30 Q26 -18 36 -30" fill="none" stroke="#8a4f1c" stroke-width="6" stroke-linecap="round"/>
    <ellipse cx="6" cy="-42" rx="48" ry="16" fill="#d69a46" stroke="${INK}" stroke-width="4"/>
    <path d="M-22 -44 Q0 -54 24 -42" fill="none" stroke="#8a4f1c" stroke-width="5" stroke-linecap="round"/>
    <rect x="-74" y="-70" width="148" height="74" fill="transparent"/>
  </g>

  <!-- 炒肝 -->
  <g class="lf-item lf-pot" data-k="chaogan" transform="translate(1060 452)">
    <path d="M-62 -76 Q-60 0 0 2 Q60 0 62 -76 Z" fill="#5d4a3a" stroke="${INK}" stroke-width="5"/>
    <ellipse cx="0" cy="-76" rx="62" ry="14" fill="#6b3b22" stroke="${INK}" stroke-width="4"/>
    <circle cx="-20" cy="-78" r="6" fill="#8a4e2c"/><circle cx="16" cy="-74" r="5" fill="#3d2214"/>
    <g class="lf-ladle"><path d="M30 -78 L70 -150" stroke="#7a5a3e" stroke-width="8" stroke-linecap="round"/><ellipse cx="26" cy="-74" rx="16" ry="8" fill="#8a8580" stroke="${INK}" stroke-width="3"/></g>
    <rect x="-70" y="-156" width="150" height="160" fill="transparent"/>
  </g>

  <!-- 咸菜丝 -->
  <g class="lf-item lf-plate" data-k="xiancai" transform="translate(1180 452)">
    <ellipse cx="0" cy="-10" rx="44" ry="12" fill="#f4efe4" stroke="${INK}" stroke-width="4"/>
    <path d="M-28 -16 q12 -16 24 -2 M-16 -14 q12 -18 26 -4 M0 -18 q10 -12 22 2 M-22 -24 q16 -6 30 8" fill="none" stroke="#7a4a20" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="12" cy="-26" r="3" fill="#b8322a"/>
    <rect x="-48" y="-44" width="96" height="48" fill="transparent"/>
  </g>

  <!-- 豆汁儿锅 -->
  <g class="lf-item lf-pot" data-k="douzhi" transform="translate(1290 452)">
    <path d="M-60 -110 Q-66 0 0 2 Q66 0 60 -110 Z" fill="#7d8c86" stroke="${INK}" stroke-width="5"/>
    <path d="M-62 -60 H62" stroke="#5f6d68" stroke-width="4"/>
    <ellipse cx="0" cy="-110" rx="60" ry="14" fill="#a7a983" stroke="${INK}" stroke-width="4"/>
    <g class="lf-ladle"><path d="M-26 -112 L-70 -186" stroke="#7a5a3e" stroke-width="8" stroke-linecap="round"/><ellipse cx="-22" cy="-108" rx="16" ry="8" fill="#8a8580" stroke="${INK}" stroke-width="3"/></g>
    <rect x="-80" y="-190" width="150" height="194" fill="transparent"/>
  </g>

  <!-- 豆浆桶 -->
  <g class="lf-item lf-pot" data-k="doujiang" transform="translate(1394 452)">
    <path d="M-44 -128 L-40 0 H40 L44 -128 Z" fill="#c69a64" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M-44 -96 H44 M-42 -30 H42" stroke="#3a3632" stroke-width="6"/>
    <ellipse cx="0" cy="-128" rx="44" ry="11" fill="#fbf8f0" stroke="${INK}" stroke-width="4"/>
    <g class="lf-ladle"><path d="M18 -130 L50 -196" stroke="#7a5a3e" stroke-width="7" stroke-linecap="round"/><ellipse cx="14" cy="-126" rx="13" ry="7" fill="#8a8580" stroke="${INK}" stroke-width="3"/></g>
    <rect x="-50" y="-200" width="110" height="204" fill="transparent"/>
  </g>

  <!-- 托盘 -->
  <g class="lf-tray" transform="translate(800 790)">
    <rect x="-330" y="-62" width="660" height="124" rx="18" fill="#9a6a40" stroke="${INK}" stroke-width="6"/>
    <rect x="-312" y="-46" width="624" height="92" rx="10" fill="#b7844f" stroke="#7e5233" stroke-width="3"/>
    <path d="M-300 -20 H300 M-300 14 H300" stroke="#a5744a" stroke-width="2"/>
    ${[-225, -75, 75, 225].map((x, i) => `<g class="lf-slot" data-i="${i}" transform="translate(${x} 0)"><ellipse cx="0" cy="12" rx="56" ry="16" fill="#8e6038" opacity=".35"/></g>`).join('')}
  </g>
</svg>`;
}

/* ---------------- 摊主点评 ---------------- */
function judge(ks) {
  const has = k => ks.includes(k);
  if (has('douzhi') && has('jiaoquan') && has('xiancai')) return { t: '豆汁儿就焦圈，再来口咸菜丝——地道！', seal: true };
  if (has('chaogan') && has('baozi')) return { t: '炒肝配包子，老北京的讲究！', seal: true };
  if (has('douzhi') && has('jiaoquan')) return { t: '有点意思！再配点儿咸菜丝就齐了。' };
  if (has('douzhi')) return { t: '光喝豆汁儿？来个焦圈儿才对味儿！' };
  if (has('youtiao') && has('doujiang')) return { t: '豆浆油条，走到哪儿都爱这口。' };
  if (has('chaogan')) return { t: '炒肝儿得配包子，您再瞧瞧？' };
  if (ks.length >= 4) return { t: '吃这么多，今儿要逛一整条胡同吧？' };
  return { t: '得嘞，您慢用！' };
}


/* ================= ① 早点摊 ================= */
export function openBreakfast({ onSeal, sealed }) {
  let svg = stallSVG();
  Object.entries(FOODS).forEach(([k, v]) => { svg = svg.replace(`data-k="${k}"`, `data-k="${k}" data-tip="${v.name}|${v.tip}"`); });
  const S = shell({ kicker: '清晨 · 06:45', title: '早 点 摊', svg, hint: '点一样，放进托盘', goText: '就这些！', bubbleAt: [800, 196], cls: 'lf-breakfast' });
  const vendor = S.q('.lf-vendor');
  const talk = (t, ms) => { S.say(t, ms); vendor.classList.remove('talk'); void vendor.getBBox(); vendor.classList.add('talk'); setTimeout(() => vendor.classList.remove('talk'), 1200); };
  setTimeout(() => talk('早啊！来点儿什么？'), 700);
  let tries = 0, judged = false;
  const T = makeTray(S, { slots: [-225, -75, 75, 225], y: 790, iconOf: k => `<g transform="scale(1.05)">${ICONS[k]}</g>`, onChange: ks => {
    if (S.go) S.go.disabled = ks.length === 0;
    if (!judged) S.hint(ks.length === 0 ? '点一样，放进托盘' : ks.length < 4 ? `还能放 ${4 - ks.length} 样 · 点托盘里的可放回` : '托盘满啦');
  } });
  const TOP = { baozi: [0, -170], youtiao: [0, -110], jiaoquan: [0, -40], tangyoubing: [0, -40], xiancai: [0, -20], chaogan: [0, -90], douzhi: [0, -120], doujiang: [0, -140] };
  S.qa('.lf-item').forEach(g => {
    const k = g.dataset.k;
    g.addEventListener('click', e => {
      e.stopPropagation(); if (judged) return;
      if (T.full()) { talk('托盘满啦，先尝尝这些？', 2200); return; }
      S.pulse(g);
      sfx(k === 'baozi' ? 'steam' : k === 'youtiao' ? 'fry' : 'pop');
      const [sx, sy] = gPos(S, g, ...TOP[k]);
      setTimeout(() => T.add(k, sx, sy), k === 'baozi' ? 380 : 280);
    });
  });
  S.go.onclick = () => {
    if (T.busy) return;
    if (judged) { judged = false; T.locked = false; T.clear(); S.go.textContent = '就这些！'; talk('再来点儿什么？', 2000); return; }
    const ks = T.tray.filter(Boolean), r = judge(ks);
    tries++; judged = true; T.locked = true;
    talk(r.t, 0);
    S.go.textContent = '再挑一次';
    S.hint(r.seal ? '老北京标配 ✓' : (tries >= 2 && !sealed() ? '悄悄说：老北京人爱豆汁儿配焦圈' : '摊主说的有道理？'));
    if (r.seal && !sealed()) setTimeout(() => S.stamp('早', onSeal), 900);
  };
  return S;
}

/* ================= ② 鸽哨 · 鸽阵 ================= */
function roofsSVG() {
  // 一排排灰瓦屋顶（剪影 + 瓦垄）
  const roof = (x, y, w, h, c1, c2) => {
    let ridges = ''; for (let i = x + 14; i < x + w - 10; i += 16) ridges += `<path d="M${i} ${y + 8} Q${i + 4} ${y + h * .6} ${i - 2} ${y + h}" stroke="${c2}" stroke-width="3" fill="none"/>`;
    return `<path d="M${x - 16} ${y + h} Q${x + w * .08} ${y + 6} ${x + 10} ${y} H${x + w - 10} Q${x + w * .92} ${y + 6} ${x + w + 16} ${y + h} Z" fill="${c1}" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
      ${ridges}<rect x="${x - 4}" y="${y - 10}" width="${w + 8}" height="14" rx="4" fill="${c2}" stroke="${INK}" stroke-width="4"/>
      <path d="M${x - 4} ${y - 4} q-14 -16 -26 -8 M${x + w + 4} ${y - 4} q14 -16 26 -8" stroke="${INK}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  };
  return `
<svg class="lf-stage" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="pgSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fb6c9"/><stop offset=".55" stop-color="#e9dcc6"/><stop offset="1" stop-color="#f6e2bf"/></linearGradient>
    <radialGradient id="pgSun" cx=".78" cy=".62" r=".4"><stop offset="0" stop-color="#ffe2a8" stop-opacity=".95"/><stop offset="1" stop-color="#ffe2a8" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1600" height="900" fill="url(#pgSky)"/>
  <rect width="1600" height="900" fill="url(#pgSun)"/>
  <circle cx="1250" cy="560" r="46" fill="#ffd89a" opacity=".85"/>
  <g opacity=".5"><path d="M160 210 q40 -26 90 -6 q30 -20 70 0 q40 -10 60 14 Z M1020 150 q30 -20 70 -4 q26 -16 56 0 q30 -6 44 12 Z" fill="#fbf4e6"/></g>
  <!-- 远处白塔与城楼剪影 -->
  <g fill="#b9b3a6" opacity=".75">
    <path d="M300 700 L300 640 Q300 600 330 590 L330 560 L326 556 L334 520 L342 556 L338 560 L338 590 Q368 600 368 640 L368 700 Z"/>
    <path d="M980 700 V650 H1160 V700 Z M990 650 Q1070 610 1150 650 Z M1010 632 Q1070 596 1130 632 Z"/>
  </g>
  <!-- 鸽群层 -->
  <g class="pg-flock"></g>
  <!-- 近处屋顶 -->
  <g>${roof(-40, 690, 520, 120, '#8d8a84', '#6e6b66')}${roof(560, 720, 460, 110, '#97948d', '#74716b')}${roof(1080, 680, 600, 130, '#8a8780', '#6b6862')}</g>
  <rect y="800" width="1600" height="100" fill="#7a776f" stroke="${INK}" stroke-width="4"/>
  <!-- 槐树 -->
  <g transform="translate(1440 640)"><path d="M0 200 V40 Q-4 10 -30 -10 M0 60 Q30 30 50 0" stroke="#5b4634" stroke-width="18" fill="none" stroke-linecap="round"/>
    <g fill="#7e9a63" stroke="${INK}" stroke-width="4"><circle cx="-40" cy="-40" r="60"/><circle cx="40" cy="-30" r="56"/><circle cx="0" cy="-90" r="62"/></g></g>
  <!-- 放鸽人：站在房上摇竿 -->
  <g class="pg-man" transform="translate(300 690)" data-tip="放鸽人|一摇竹竿，鸽群就起飞">
    <g class="pg-pole"><path d="M18 -86 L120 -300" stroke="#7a5a3e" stroke-width="7" stroke-linecap="round"/>
      <path class="pg-flag" d="M120 -300 Q160 -296 186 -282 Q160 -268 128 -270 Z" fill="#b8322a" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/></g>
    <path d="M-22 0 L-18 -60 Q-20 -88 0 -92 Q20 -88 20 -60 L22 0 Z" fill="#3b5f8a" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <circle cx="0" cy="-110" r="18" fill="#ecc7a0" stroke="${INK}" stroke-width="4"/>
    <path d="M-20 -116 Q0 -138 20 -116 Z" fill="#2f2b26"/>
    <path d="M14 -80 L22 -88" stroke="#3b5f8a" stroke-width="12" stroke-linecap="round"/>
    <rect x="-40" y="-150" width="120" height="160" fill="transparent"/>
  </g>
</svg>`;
}
const PG_SHAPES = [['福', '福'], ['京', '京'], ['安', '安'], ['巷', '巷'], ['心', '♥'], ['圆', '○']];
function shapePoints(key, N) {
  const c = document.createElement('canvas'); c.width = c.height = 240; const x = c.getContext('2d');
  x.fillStyle = '#000'; x.strokeStyle = '#000';
  if (key === '心') { x.beginPath(); x.moveTo(120, 210); x.bezierCurveTo(-10, 120, 40, 10, 120, 70); x.bezierCurveTo(200, 10, 250, 120, 120, 210); x.fill(); }
  else if (key === '圆') { x.lineWidth = 34; x.beginPath(); x.arc(120, 120, 88, 0, Math.PI * 2); x.stroke(); }
  else { x.font = '900 210px "Noto Serif SC","Songti SC","STSong",serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(key, 120, 128); }
  const d = x.getImageData(0, 0, 240, 240).data, filled = (i, j) => d[(j * 240 + i) * 4 + 3] > 120;
  let best = null;
  for (let step = 16; step >= 3; step -= .5) {
    const pts = []; for (let j = 0; j < 240; j += step) for (let i = 0; i < 240; i += step) if (filled(i | 0, j | 0)) pts.push([i, j]);
    best = pts; if (pts.length >= N) break;
  }
  const out = []; for (let k = 0; k < N; k++) out.push(best[Math.floor(k * best.length / N)] || best[k % best.length]);
  return out.map(([i, j]) => [800 + (i - 120) * 2.15, 360 + (j - 120) * 2.0]);
}
export function openPigeon({ onSeal, sealed }) {
  const chips = PG_SHAPES.map(([k, t]) => `<button class="pg-chip" data-k="${k}">${t}</button>`).join('') + `<button class="pg-chip ghost" data-k="散">散</button>`;
  const S = shell({ kicker: '拂晓 · 05:30', title: '鸽 哨', svg: roofsSVG(), hint: '选一个字，让鸽子摆出来', bubbleAt: [300, 520], cls: 'lf-pigeon' });
  const bar = S.root.querySelector('.lf-bar'); const cw = el('div', 'pg-chips', chips); bar.appendChild(cw);
  const flock = S.q('.pg-flock'), N = 96, birds = [];
  for (let i = 0; i < N; i++) {
    const g = document.createElementNS(NS, 'g'), white = Math.random() < .75;
    g.innerHTML = `<g class="pb"><path class="pw2" d="M0 0 Q-6 -16 -18 -14 Q-10 -6 0 0" fill="${white ? '#e9e5dc' : '#8e939b'}" stroke="${INK}" stroke-width="2"/>
      <ellipse cx="0" cy="0" rx="13" ry="6" fill="${white ? '#fbf9f3' : '#a7adb5'}" stroke="${INK}" stroke-width="2.4"/>
      <circle cx="11" cy="-2" r="4.5" fill="${white ? '#fbf9f3' : '#a7adb5'}" stroke="${INK}" stroke-width="2.2"/><path d="M15 -2 l5 1.5 l-5 1" fill="#d9a441"/>
      <path d="M-12 0 l-8 -4 l0 8 Z" fill="${white ? '#e9e5dc' : '#7d838b'}" stroke="${INK}" stroke-width="2"/>
      <path class="pw" d="M-2 -1 Q-6 -20 -20 -22 Q-12 -8 -2 -1" fill="${white ? '#fbf9f3' : '#a7adb5'}" stroke="${INK}" stroke-width="2.2"/></g>`;
    flock.appendChild(g);
    const a = Math.random() * Math.PI * 2;
    birds.push({ g, wing: g.querySelector('.pw'), x: 800 + Math.cos(a) * 500, y: 320 + Math.sin(a) * 160, a, r: rnd(.85, 1.15), sp: rnd(.9, 1.1), ph: rnd(0, 6), tx: 0, ty: 0, delay: 0, dir: 1, s: rnd(.85, 1.1) });
  }
  let mode = 'orbit', targets = null, t0 = performance.now(), formedAt = 0, raf = 0;
  const done = new Set();
  function setShape(k) {
    S.qa && cw.querySelectorAll('.pg-chip').forEach(b => b.classList.toggle('on', b.dataset.k === k));
    if (k === '散') { mode = 'orbit'; S.hint('选一个字，让鸽子摆出来'); return; }
    targets = shapePoints(k, N);
    // 按横坐标排序配对，飞行路线更顺
    const order = birds.map((b, i) => i).sort((i, j) => birds[i].x - birds[j].x);
    const tOrder = targets.map((p, i) => i).sort((i, j) => targets[i][0] - targets[j][0]);
    order.forEach((bi, n) => { const b = birds[bi]; [b.tx, b.ty] = targets[tOrder[n]]; b.delay = Math.random() * .6; });
    mode = 'form'; formedAt = performance.now(); sfx('whistle');
    S.hint('鸽哨声起，鸽群慢慢排好……');
    done.add(k);
    setTimeout(() => {
      if (mode !== 'form') return;
      S.hint(done.size >= 3 || sealed() ? '再换一个字？' : `再摆 ${3 - done.size} 个字，就能领小印`);
      if (done.size >= 3 && !sealed()) setTimeout(() => S.stamp('鸽', onSeal), 400);
    }, 3200);
  }
  cw.querySelectorAll('.pg-chip').forEach(b => b.onclick = () => setShape(b.dataset.k));
  // 放鸽人：摇竿 → 鸽群散开再盘旋
  S.q('.pg-man').addEventListener('click', () => { S.pulse(S.q('.pg-man'), 1200); mode = 'orbit'; cw.querySelectorAll('.pg-chip').forEach(b => b.classList.remove('on')); birds.forEach(b => { b.a += rnd(-.6, .6); }); sfx('whistle'); S.say('嘿——起！', 1600); });
  // 点天空里的鸽子：被点到的扑腾一下
  S.svg.addEventListener('click', e => {
    const p = S.svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const q = p.matrixTransform(S.svg.getScreenCTM().inverse());
    birds.forEach(b => { const d = Math.hypot(b.x - q.x, b.y - q.y); if (d < 60) { b.kick = 1; b.kx = (b.x - q.x) / (d + 1) * 40; b.ky = (b.y - q.y) / (d + 1) * 40 - 20; } });
  });
  function frame(now) {
    const t = (now - t0) / 1000;
    birds.forEach((b, i) => {
      let tx, ty;
      if (mode === 'orbit') {
        b.a += .0042 * b.sp;
        tx = 800 + Math.cos(b.a) * 560 * b.r; ty = 330 + Math.sin(b.a) * 170 * b.r + Math.sin(t * 1.3 + b.ph) * 14;
      } else {
        const k = Math.max(0, (now - formedAt) / 1000 - b.delay);
        tx = b.tx + Math.sin(t * 1.6 + b.ph) * 3; ty = b.ty + Math.cos(t * 1.4 + b.ph) * 3;
        if (k < .1) { tx = b.x + (b.tx - b.x) * .02; ty = b.y + (b.ty - b.y) * .02 - 2; }
      }
      const ease = mode === 'orbit' ? .045 : .05;
      let nx = b.x + (tx - b.x) * ease, ny = b.y + (ty - b.y) * ease;
      if (b.kick) { nx += b.kx * b.kick; ny += b.ky * b.kick; b.kick *= .9; if (b.kick < .02) b.kick = 0; }
      const vx = nx - b.x, sp = Math.hypot(vx, ny - b.y);
      if (Math.abs(vx) > .3) b.dir = vx > 0 ? 1 : -1;
      b.x = nx; b.y = ny;
      const flap = Math.sin(t * (sp > 1.2 ? 18 : 7) + b.ph);
      b.wing.setAttribute('transform', `scale(1 ${(.25 + .75 * Math.abs(flap)) * (flap > 0 ? 1 : -.6)})`);
      b.g.setAttribute('transform', `translate(${b.x.toFixed(1)} ${b.y.toFixed(1)}) scale(${(b.dir * b.s).toFixed(2)} ${b.s.toFixed(2)})`);
    });
    raf = requestAnimationFrame(frame);
  }
  raf = requestAnimationFrame(frame);
  S.onClose = () => cancelAnimationFrame(raf);
  document.fonts && document.fonts.load('900 100px "Noto Serif SC"', '福京安巷');
  setTimeout(() => S.say('早！鸽子都放出来了', 2400), 800);
  return S;
}

/* ================= ③ 小卖部 ================= */
const ST_ICONS = {
  soda: `<g transform="translate(0 4)"><path d="M-14 -46 h28 v10 q16 10 16 30 v54 q0 8 -8 8 h-44 q-8 0 -8 -8 v-54 q0 -20 16 -30 Z" fill="#e8892c" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <rect x="-22" y="4" width="44" height="30" fill="#f6f1e6" stroke="${INK}" stroke-width="3"/><path d="M-22 12 h44 M-22 26 h44" stroke="#2d5c93" stroke-width="3"/>
    <rect x="-16" y="-56" width="32" height="12" rx="3" fill="#2d5c93" stroke="${INK}" stroke-width="3"/></g>`,
  marble: `<circle cx="-16" cy="8" r="16" fill="#7fb6d8" stroke="${INK}" stroke-width="4"/><path d="M-26 6 q8 -10 18 0" stroke="#e8892c" stroke-width="4" fill="none"/>
    <circle cx="16" cy="12" r="14" fill="#e6b54a" stroke="${INK}" stroke-width="4"/><path d="M8 10 q8 -8 16 2" stroke="#3b7d5a" stroke-width="4" fill="none"/>
    <circle cx="2" cy="-16" r="13" fill="#d76a5a" stroke="${INK}" stroke-width="4"/><circle cx="-2" cy="-20" r="3" fill="#fff" opacity=".8"/>`,
  candy: `<g transform="rotate(-12)"><path d="M-46 -14 L-24 0 L-46 14 Z M46 -14 L24 0 L46 14 Z" fill="#f6f1e6" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <rect x="-26" y="-18" width="52" height="36" rx="16" fill="#f6f1e6" stroke="${INK}" stroke-width="4"/>
    <path d="M-14 -18 V18 M14 -18 V18" stroke="#2d5c93" stroke-width="4"/><circle cx="0" cy="0" r="6" fill="#d76a5a"/></g>`,
  shabao: `<path d="M-30 -24 L30 -24 L34 26 L-34 26 Z" fill="#c2533f" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <path d="M-30 -24 L34 26 M30 -24 L-34 26" stroke="#e6b54a" stroke-width="5"/><path d="M-32 0 H32 M0 -24 V26" stroke="#3b7d5a" stroke-width="3" stroke-dasharray="6 5"/>`,
  icepop: `<rect x="-6" y="16" width="12" height="40" rx="3" fill="#d9b98c" stroke="${INK}" stroke-width="3"/>
    <path d="M-22 -40 Q-22 -54 0 -54 Q22 -54 22 -40 V20 H-22 Z" fill="#f4efe4" stroke="${INK}" stroke-width="4"/>
    <path d="M-22 -10 H22" stroke="#e6b54a" stroke-width="10"/><circle cx="-8" cy="-34" r="3" fill="#fff"/>`,
  frog: `<ellipse cx="0" cy="12" rx="36" ry="22" fill="#5f9a54" stroke="${INK}" stroke-width="4"/>
    <circle cx="-16" cy="-12" r="11" fill="#5f9a54" stroke="${INK}" stroke-width="4"/><circle cx="16" cy="-12" r="11" fill="#5f9a54" stroke="${INK}" stroke-width="4"/>
    <circle cx="-16" cy="-13" r="4.5" fill="${INK}"/><circle cx="16" cy="-13" r="4.5" fill="${INK}"/>
    <path d="M-14 16 Q0 24 14 16" stroke="${INK}" stroke-width="3" fill="none"/><path d="M-30 30 l-14 6 M30 30 l14 6" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>
    <path d="M-28 4 h56" stroke="#e6b54a" stroke-width="4" stroke-dasharray="5 6"/>`
};
const ST_ITEMS = {
  soda:   { name: '北冰洋', tip: '橘子汽水，瓶盖“啵”一声', price: 1.5 },
  marble: { name: '玻璃弹珠', tip: '一毛钱一把，能玩一下午', price: .1 },
  candy:  { name: '大白兔', tip: '七颗等于一杯牛奶', price: .2 },
  shabao: { name: '沙包', tip: '丢沙包，跳房子', price: .3 },
  icepop: { name: '冰棍儿', tip: '小豆、奶油，三分五分', price: .05 },
  frog:   { name: '铁皮青蛙', tip: '上紧发条，蹦三蹦', price: .8 }
};
function storeSVG() {
  let tiles = ''; for (let x = 0; x < 1600; x += 60) tiles += `<path d="M${x} 730 V900" stroke="#b9ad93" stroke-width="2"/>`;
  return `
<svg class="lf-stage" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet">
  <rect width="1600" height="900" fill="#efe5cd"/>
  <rect y="330" width="1600" height="330" fill="#7fa58e"/><path d="M0 330 H1600" stroke="${INK}" stroke-width="5"/><path d="M0 344 H1600" stroke="#5f8670" stroke-width="4"/>
  <!-- 吊灯 -->
  <g class="st-bulb" transform="translate(800 0)" data-tip="灯泡|一根线吊着，晃晃悠悠">
    <path d="M0 0 V110" stroke="${INK}" stroke-width="3"/><path d="M-40 140 Q0 98 40 140 Z" fill="#2d5c93" stroke="${INK}" stroke-width="4"/>
    <circle cx="0" cy="152" r="16" fill="#ffe8a8" stroke="${INK}" stroke-width="3"/><circle class="st-glow" cx="0" cy="160" r="90" fill="#fff1c2" opacity=".35"/>
    <rect x="-46" y="96" width="92" height="90" fill="transparent"/>
  </g>
  <!-- 年画 -->
  <g transform="translate(250 190)" class="st-poster" data-tip="年画|胖娃娃抱鲤鱼，年年有余">
    <rect x="-80" y="-110" width="160" height="210" fill="#f6ead0" stroke="${INK}" stroke-width="5"/>
    <rect x="-70" y="-100" width="140" height="190" fill="none" stroke="#b8322a" stroke-width="3"/>
    <circle cx="0" cy="-30" r="34" fill="#f2cfa8" stroke="${INK}" stroke-width="4"/><path d="M-14 -50 q14 -14 28 0" stroke="${INK}" stroke-width="5" fill="none"/>
    <circle cx="-14" cy="-24" r="7" fill="#e7837a" opacity=".7"/><circle cx="14" cy="-24" r="7" fill="#e7837a" opacity=".7"/>
    <path d="M-50 40 Q0 -2 50 40 Q30 70 -40 66 Z" fill="#d76a5a" stroke="${INK}" stroke-width="4"/><path d="M-30 40 q10 8 20 0 q10 8 20 0" stroke="#f6ead0" stroke-width="3" fill="none"/>
  </g>
  <!-- 货架 -->
  <g transform="translate(1040 0)">
    <rect x="0" y="60" width="440" height="560" fill="#9a6a40" stroke="${INK}" stroke-width="6"/>
    <rect x="16" y="76" width="408" height="528" fill="#6f4a2c"/>
    ${[200, 340, 480].map(y => `<rect x="10" y="${y}" width="420" height="16" fill="#b7844f" stroke="${INK}" stroke-width="4"/>`).join('')}
    <!-- 上层：一排汽水 -->
    ${[0, 1, 2, 3, 4, 5].map(i => `<g transform="translate(${60 + i * 64} 170) scale(.62)">${ST_ICONS.soda}</g>`).join('')}
    <!-- 中层：糖罐子 -->
    ${[0, 1, 2].map(i => `<g transform="translate(${90 + i * 130} 300)"><rect x="-44" y="-70" width="88" height="96" rx="12" fill="#dbe8ea" opacity=".75" stroke="${INK}" stroke-width="4"/>
      <rect x="-48" y="-84" width="96" height="18" rx="5" fill="${['#b8322a', '#2d5c93', '#3b7d5a'][i]}" stroke="${INK}" stroke-width="4"/>
      ${[0, 1, 2, 3, 4, 5].map(j => `<circle cx="${-26 + (j % 3) * 26}" cy="${-36 + Math.floor(j / 3) * 30}" r="10" fill="${['#e6b54a', '#d76a5a', '#7fb6d8', '#f6f1e6'][(i + j) % 4]}" stroke="${INK}" stroke-width="2"/>`).join('')}</g>`).join('')}
    <!-- 下层：本子和铁皮盒 -->
    <rect x="40" y="410" width="90" height="70" fill="#d8b47e" stroke="${INK}" stroke-width="4"/><rect x="150" y="390" width="70" height="90" fill="#c2533f" stroke="${INK}" stroke-width="4"/>
    <rect x="240" y="420" width="150" height="60" fill="#2d5c93" stroke="${INK}" stroke-width="4"/><circle cx="315" cy="450" r="16" fill="#e6b54a" stroke="${INK}" stroke-width="3"/>
    ${[0, 1, 2, 3].map(i => `<rect x="${50 + i * 90}" y="${520 + (i % 2) * 8}" width="70" height="${76 - (i % 2) * 8}" fill="${['#e9dcc0', '#b7c9a8', '#e6b54a', '#d9c8a6'][i]}" stroke="${INK}" stroke-width="4"/>`).join('')}
  </g>
  <!-- 老奶奶 -->
  <g class="st-granny" transform="translate(560 0)" data-tip="王奶奶|看着胡同里的孩子长大">
    <path d="M-80 520 Q-82 400 -40 380 L40 380 Q82 400 80 520 Z" fill="#a74a3c" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M0 384 V520" stroke="#7d342a" stroke-width="3"/>${[410, 440, 470, 500].map(y => `<circle cx="0" cy="${y}" r="4" fill="#e6b54a" stroke="${INK}" stroke-width="2"/>`).join('')}
    <rect x="-14" y="352" width="28" height="32" fill="#e3b68e" stroke="${INK}" stroke-width="4"/>
    <g class="lf-head-g">
      <path d="M-44 310 Q-46 368 0 372 Q46 368 44 310 Q42 274 0 272 Q-42 274 -44 310 Z" fill="#efcfac" stroke="${INK}" stroke-width="5"/>
      <path d="M-48 312 Q-50 262 0 258 Q50 262 48 312 Q36 284 0 286 Q-36 284 -48 312 Z" fill="#d9d4cc" stroke="${INK}" stroke-width="4"/>
      <circle cx="0" cy="252" r="20" fill="#d9d4cc" stroke="${INK}" stroke-width="4"/><path d="M-12 248 q12 -8 24 0" stroke="#b9b3aa" stroke-width="3" fill="none"/>
      <g fill="none" stroke="${INK}" stroke-width="3.5"><circle cx="-17" cy="322" r="12"/><circle cx="17" cy="322" r="12"/><path d="M-5 322 h10"/></g>
      <g class="lf-eyes"><circle cx="-17" cy="322" r="3.5" fill="${INK}"/><circle cx="17" cy="322" r="3.5" fill="${INK}"/></g>
      <path class="lf-mouth" d="M-10 350 Q0 358 10 350" stroke="${INK}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
      <circle cx="-30" cy="342" r="7" fill="#e79a86" opacity=".55"/><circle cx="30" cy="342" r="7" fill="#e79a86" opacity=".55"/>
      <path d="M-34 334 l-5 3 M34 334 l5 3 M-8 304 h-12 M8 304 h12" stroke="#b98a62" stroke-width="2" stroke-linecap="round"/>
    </g>
    <rect x="-90" y="240" width="180" height="280" fill="transparent"/>
  </g>
  <!-- 玻璃柜台 -->
  <rect x="120" y="520" width="1360" height="150" fill="#b7d3d6" opacity=".55" stroke="${INK}" stroke-width="5"/>
  <path d="M120 520 l60 0 l-40 150 M520 520 l50 0 l-34 150 M980 520 l50 0 l-34 150" fill="#fff" opacity=".35"/>
  ${[0, 1, 2, 3, 4, 5, 6].map(i => `<rect x="${160 + i * 185}" y="${590 + (i % 2) * 10}" width="120" height="${70 - (i % 2) * 10}" rx="4" fill="${['#e6b54a', '#d76a5a', '#f6f1e6', '#7fb6d8', '#c2533f', '#e9dcc0', '#3b7d5a'][i]}" stroke="${INK}" stroke-width="3" opacity=".85"/>`).join('')}
  <rect x="100" y="506" width="1400" height="20" rx="4" fill="#9a6a40" stroke="${INK}" stroke-width="5"/>
  <rect x="120" y="670" width="1360" height="60" fill="#8a5c36" stroke="${INK}" stroke-width="5"/>
  <rect y="730" width="1600" height="170" fill="#cfc2a5"/>${tiles}
  <!-- 柜台上的东西 -->
  <g class="lf-item st-soda" data-k="soda" transform="translate(250 506)">
    <g class="st-bottle" transform="translate(0 -60)">${ST_ICONS.soda.replace('<rect x="-16" y="-56"', '<rect class="st-cap" x="-16" y="-56"')}</g>
    <g class="st-fizz">${[0, 1, 2, 3, 4].map(i => `<circle cx="${-8 + (i % 3) * 8}" cy="-130" r="${4 + i % 2 * 2}" fill="#fff4dc" stroke="${INK}" stroke-width="2" style="animation-delay:${i * .12}s"/>`).join('')}</g>
    <rect x="-40" y="-150" width="80" height="150" fill="transparent"/>
  </g>
  <g class="lf-item st-marble" data-k="marble" transform="translate(400 506)">
    <path d="M-50 -110 Q-56 -4 0 0 Q56 -4 50 -110 Z" fill="#dbe8ea" opacity=".8" stroke="${INK}" stroke-width="4"/>
    <rect x="-56" y="-124" width="112" height="18" rx="6" fill="#2d5c93" stroke="${INK}" stroke-width="4"/>
    ${[[-24, -30, '#7fb6d8'], [0, -26, '#e6b54a'], [24, -32, '#d76a5a'], [-12, -56, '#3b7d5a'], [14, -58, '#7fb6d8'], [-26, -80, '#e6b54a'], [4, -84, '#d76a5a'], [26, -78, '#3b7d5a']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="12" fill="${c}" stroke="${INK}" stroke-width="2.5"/>`).join('')}
    <g class="st-hop">${[0, 1, 2].map(i => `<circle class="st-m${i}" cx="0" cy="-130" r="12" fill="${['#7fb6d8', '#e6b54a', '#d76a5a'][i]}" stroke="${INK}" stroke-width="2.5" opacity="0"/>`).join('')}</g>
    <rect x="-60" y="-130" width="120" height="130" fill="transparent"/>
  </g>
  <g class="lf-item st-candy" data-k="candy" transform="translate(890 506)">
    ${[[-40, -16, -10], [0, -18, 14], [40, -14, -6], [-20, -42, 8], [20, -42, -16]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r}) scale(.6)">${ST_ICONS.candy}</g>`).join('')}
    <g class="st-unwrap" transform="translate(0 -70) scale(.9)"><path class="st-wl" d="M-46 -14 L-24 0 L-46 14 Z" fill="#f6f1e6" stroke="${INK}" stroke-width="4"/><path class="st-wr" d="M46 -14 L24 0 L46 14 Z" fill="#f6f1e6" stroke="${INK}" stroke-width="4"/>
      <rect x="-26" y="-18" width="52" height="36" rx="16" fill="#f6f1e6" stroke="${INK}" stroke-width="4"/><path d="M-14 -18 V18 M14 -18 V18" stroke="#2d5c93" stroke-width="4"/><circle cx="0" cy="0" r="6" fill="#d76a5a"/></g>
    <rect x="-70" y="-100" width="140" height="100" fill="transparent"/>
  </g>
  <g class="lf-item st-shabao" data-k="shabao" transform="translate(1060 506)">
    <g class="st-toss" transform="translate(0 -30) scale(.85)">${ST_ICONS.shabao}</g>
    <g transform="translate(46 -20) rotate(20) scale(.6)">${ST_ICONS.shabao.replace(/#c2533f/g, '#2d5c93')}</g>
    <rect x="-40" y="-70" width="120" height="70" fill="transparent"/>
  </g>
  <g class="lf-item st-ice" data-k="icepop" transform="translate(1250 506)">
    <rect x="-90" y="-100" width="180" height="100" rx="8" fill="#f6f6f2" stroke="${INK}" stroke-width="5"/>
    <path d="M-90 -50 H90" stroke="#2d5c93" stroke-width="10"/>
    <g class="st-pop" transform="translate(0 -100)"><g transform="scale(.8)">${ST_ICONS.icepop}</g></g>
    <g class="st-lid"><rect x="-96" y="-118" width="192" height="22" rx="6" fill="#e9eef0" stroke="${INK}" stroke-width="5"/><rect x="-24" y="-126" width="48" height="10" rx="4" fill="#9aa3a8" stroke="${INK}" stroke-width="3"/></g>
    <g class="st-frost">${[-40, 0, 40].map((x, i) => `<path d="M${x} -130 q-10 -20 0 -40" stroke="#ffffff" stroke-width="8" fill="none" stroke-linecap="round" style="animation-delay:${i * .15}s"/>`).join('')}</g>
    <rect x="-96" y="-180" width="192" height="180" fill="transparent"/>
  </g>
  <g class="lf-item st-frog" data-k="frog" transform="translate(1400 506)">
    <g class="st-jump" transform="translate(0 -26) scale(.8)">${ST_ICONS.frog}</g>
    <rect x="-46" y="-70" width="92" height="70" fill="transparent"/>
  </g>
  <!-- 算盘 -->
  <g class="st-abacus" transform="translate(680 506)" data-tip="算盘|奶奶算账从来不用笔">
    <rect x="-90" y="-70" width="180" height="70" rx="4" fill="#7e5233" stroke="${INK}" stroke-width="5"/>
    <path d="M-80 -48 H80" stroke="${INK}" stroke-width="4"/>
    ${[0, 1, 2, 3, 4, 5, 6].map(i => `<path d="M${-72 + i * 24} -64 V-6" stroke="#c9a26a" stroke-width="2.5"/><ellipse class="st-bead up" cx="${-72 + i * 24}" cy="-57" rx="10" ry="5" fill="#3a2a1e" stroke="#1b130c" stroke-width="2"/>
      ${[0, 1, 2].map(j => `<ellipse class="st-bead dn" data-c="${i}" cx="${-72 + i * 24}" cy="${-28 + j * 9}" rx="10" ry="4.5" fill="#3a2a1e" stroke="#1b130c" stroke-width="2"/>`).join('')}`).join('')}
  </g>
  <!-- 竹篮 -->
  <g transform="translate(800 820)">
    <path d="M-260 -60 Q-262 40 -230 60 H230 Q262 40 260 -60 Z" fill="#c99a5c" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
    ${[-30, 0, 30].map(y => `<path d="M-256 ${y} Q0 ${y + 14} 256 ${y}" stroke="#a87a42" stroke-width="4" fill="none"/>`).join('')}
    ${[-200, -120, -40, 40, 120, 200].map(x => `<path d="M${x} -58 V58" stroke="#a87a42" stroke-width="3"/>`).join('')}
    <path d="M-240 -60 Q0 -190 240 -60" stroke="#a87a42" stroke-width="14" fill="none"/><path d="M-240 -60 Q0 -190 240 -60" stroke="${INK}" stroke-width="3" fill="none"/>
    <rect x="-268" y="-72" width="536" height="22" rx="10" fill="#b8874a" stroke="${INK}" stroke-width="5"/>
    ${[-160, 0, 160].map((x, i) => `<g class="lf-slot" data-i="${i}" transform="translate(${x} -40)"></g>`).join('')}
  </g>
</svg>`;
}
export function openStore({ onSeal, sealed }) {
  let svg = storeSVG();
  Object.entries(ST_ITEMS).forEach(([k, v]) => { svg = svg.replace(`data-k="${k}"`, `data-k="${k}" data-tip="${v.name}|${v.tip}"`); });
  const S = shell({ kicker: '胡同口 · 全天', title: '小 卖 部', svg, hint: '点点柜台上的东西', goText: '结账', bubbleAt: [560, 236], cls: 'lf-store' });
  const granny = S.q('.st-granny');
  const talk = (t, ms) => { S.say(t, ms); granny.classList.remove('talk'); void granny.getBBox(); granny.classList.add('talk'); setTimeout(() => granny.classList.remove('talk'), 1200); };
  setTimeout(() => talk('孩子，想要点儿啥？', 2600), 700);
  let paid = false;
  const T = makeTray(S, { slots: [-160, 0, 160], y: 780, iconOf: k => `<g transform="scale(.95)">${ST_ICONS[k]}</g>`, onChange: ks => {
    S.go.disabled = ks.length < 1;
    if (!paid) S.hint(ks.length === 0 ? '点点柜台上的东西' : ks.length < 3 ? `篮子里还能放 ${3 - ks.length} 样` : '篮子满了，去结账吧');
  } });
  const SOUND = { soda: 'bubble', marble: 'clack', candy: 'pop', shabao: 'drop', icepop: 'steam', frog: 'bead' };
  S.qa('.lf-item').forEach(g => {
    const k = g.dataset.k; let n = 0;
    g.addEventListener('click', e => {
      e.stopPropagation();
      S.pulse(g, 1300); sfx(SOUND[k]);
      if (k === 'marble') [0, 1, 2].forEach(i => setTimeout(() => sfx('clack'), 300 + i * 220));
      if (k === 'frog') [0, 1].forEach(i => setTimeout(() => sfx('bead'), 380 + i * 380));
      // 第二次点同一样才放进篮子：第一次先看它“动”
      n++;
      if (paid || T.full()) return;
      if (n >= 2) { n = 0; const [sx, sy] = gPos(S, g, 0, -80); setTimeout(() => T.add(k, sx, sy), 500); }
      else if (!g._told) { g._told = 1; S.hint('再点一下，放进篮子'); }
    });
  });
  S.q('.st-bulb').addEventListener('click', () => { S.pulse(S.q('.st-bulb'), 2000); sfx('bead'); });
  S.go.onclick = () => {
    if (T.busy) return;
    if (paid) { paid = false; T.locked = false; T.clear(); S.go.textContent = '结账'; return; }
    const ks = T.tray.filter(Boolean); if (!ks.length) return;
    paid = true; T.locked = true;
    const total = ks.reduce((s, k) => s + ST_ITEMS[k].price, 0);
    // 拨算盘
    const beads = [...S.qa('.st-bead.dn')]; let i = 0;
    const iv = setInterval(() => { if (i >= 6) { clearInterval(iv); return; } const b = beads[(i * 3 + 7) % beads.length]; b.classList.toggle('on'); sfx('bead'); i++; }, 120);
    setTimeout(() => { sfx('coin'); talk(`一共${total.toFixed(2).replace(/\.?0+$/, '')}块，拿好喽！`, 0); }, 900);
    S.go.textContent = '再逛逛';
    S.hint('奶奶算得可快了');
    if (!sealed()) setTimeout(() => S.stamp('铺', onSeal), 1700);
  };
  return S;
}

/* ================= ⑤ 戏楼 · 换脸谱 · 叫个好 ================= */
// 三张脸：只换颜色和纹样，人物不变——点不同的脸谱，台上的角儿就“变脸”
const XL_FACES = {
  red:   { name: '红脸 · 关羽', tip: '红是忠勇，赤胆忠心', base: '#c23a2b', brow: INK, mark: '#2b2724', line: '“青龙偃月，过五关斩六将”' },
  black: { name: '黑脸 · 包拯', tip: '黑是刚直，铁面无私', base: '#2b2724', brow: '#f4ece0', mark: '#f4ece0', line: '“开封有个包青天”' },
  white: { name: '白脸 · 曹操', tip: '白是奸诈，多疑善谋', base: '#f4ece0', brow: INK, mark: '#2b2724', line: '“宁教我负天下人”' },
  blue:  { name: '蓝脸 · 窦尔敦', tip: '蓝是桀骜，刚强勇猛', base: '#2f5d8a', brow: INK, mark: '#f4ece0', line: '“盗御马，坐寨黄天坝”' }
};
function xlFace(f, s = 1) {
  return `<g transform="scale(${s})">
    <path d="M-52 -40 Q-56 40 0 70 Q56 40 52 -40 Q40 -78 0 -80 Q-40 -78 -52 -40 Z" fill="${f.base}" stroke="${INK}" stroke-width="5"/>
    <path d="M-40 -22 Q-22 -40 -6 -20 M40 -22 Q22 -40 6 -20" fill="none" stroke="${f.brow}" stroke-width="9" stroke-linecap="round"/>
    <path d="M-34 -6 Q-20 -16 -8 -4 Q-20 6 -34 -6 Z M34 -6 Q20 -16 8 -4 Q20 6 34 -6 Z" fill="#fbf8f0" stroke="${INK}" stroke-width="3"/>
    <circle cx="-20" cy="-6" r="4" fill="${INK}"/><circle cx="20" cy="-6" r="4" fill="${INK}"/>
    <path d="M0 -70 V-34" stroke="${f.mark}" stroke-width="6" stroke-linecap="round"/>
    <path d="M-10 14 Q0 26 10 14" fill="${f.mark}" stroke="${INK}" stroke-width="3"/>
    <path d="M-20 40 Q0 50 20 40" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
  </g>`;
}
function operaSVG() {
  const seats = [260, 520, 1080, 1340].map((x, i) => `
    <g transform="translate(${x} 820)"><rect x="-70" y="-30" width="140" height="22" rx="6" fill="#8a5a36" stroke="${INK}" stroke-width="4"/>
      <rect x="-60" y="-8" width="10" height="44" fill="#6b4428"/><rect x="50" y="-8" width="10" height="44" fill="#6b4428"/></g>`).join('');
  return `
<svg class="lf-stage" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
  <defs>
    <radialGradient id="xlSpot" cx="50%" cy="40%" r="55%"><stop offset="0" stop-color="#fff2c8" stop-opacity=".85"/><stop offset="1" stop-color="#fff2c8" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1600" height="900" fill="#3b2a24"/>
  <!-- 戏台：红柱、飞檐、匾额 -->
  <path d="M120 120 Q800 40 1480 120 L1440 160 H160 Z" fill="#2f5d8a" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
  <path d="M160 160 H1440 V196 H160 Z" fill="#c9a227" stroke="${INK}" stroke-width="5"/>
  ${[0,1,2,3,4,5,6,7,8,9,10,11,12].map(i => `<circle cx="${200 + i * 100}" cy="178" r="8" fill="#c23a2b" stroke="${INK}" stroke-width="2"/>`).join('')}
  <g transform="translate(800 120)"><rect x="-120" y="-36" width="240" height="64" rx="8" fill="#2b2724" stroke="#c9a227" stroke-width="5"/>
    <text x="0" y="12" text-anchor="middle" font-size="40" fill="#e0ad3a" font-family="YRTitle,serif" letter-spacing="10">出将入相</text></g>
  ${[200, 1360].map(x => `<rect x="${x}" y="196" width="40" height="520" fill="#a8322a" stroke="${INK}" stroke-width="5"/>
    <rect x="${x + 8}" y="230" width="24" height="380" fill="#2b2724" stroke="#c9a227" stroke-width="2"/>
    ${[0, 1, 2, 3, 4, 5, 6].map(i => `<path d="M${x + 14} ${256 + i * 50} h12 M${x + 20} ${248 + i * 50} v16" stroke="#e0ad3a" stroke-width="3"/>`).join('')}
    <path d="M${x - 6} 690 H${x + 46} V716 H${x - 6} Z" fill="#8a8580" stroke="${INK}" stroke-width="4"/>`).join('')}
  <!-- 台板 + 红氍毹 -->
  <path d="M120 700 H1480 L1520 760 H80 Z" fill="#7a4e2e" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
  ${Array.from({ length: 14 }, (_, i) => `<path d="M${160 + i * 100} 700 L${130 + i * 104} 760" stroke="#5e3b22" stroke-width="2"/>`).join('')}
  <path d="M380 700 H1220 L1250 744 H350 Z" fill="#a8322a" stroke="${INK}" stroke-width="4"/>
  <path d="M400 708 H1200 M370 736 H1230" stroke="#e0ad3a" stroke-width="3" stroke-dasharray="18 8"/>
  <g class="yd-lt xl-lt1" transform="translate(140 200)"><path d="M0 -40 V0" stroke="#3a2a1e" stroke-width="3"/>
    <rect x="-14" y="0" width="28" height="8" rx="2" fill="#c9a227" stroke="${INK}" stroke-width="2"/>
    <ellipse cx="0" cy="40" rx="34" ry="40" fill="#d0432f" stroke="${INK}" stroke-width="4"/>
    <path d="M0 6 V74 M-22 14 Q-34 40 -22 66 M22 14 Q34 40 22 66" fill="none" stroke="#9e2a1e" stroke-width="2.5"/>
    <ellipse cx="-10" cy="28" rx="7" ry="12" fill="#fff" opacity=".25"/>
    <rect x="-14" y="72" width="28" height="8" rx="2" fill="#c9a227" stroke="${INK}" stroke-width="2"/>
    <path class="lt-tassel" d="M0 80 V112 M-6 80 L-8 108 M6 80 L8 108" stroke="#e0ad3a" stroke-width="3" stroke-linecap="round"/></g>
  <g class="yd-lt xl-lt2" transform="translate(1460 200)"><path d="M0 -40 V0" stroke="#3a2a1e" stroke-width="3"/>
    <rect x="-14" y="0" width="28" height="8" rx="2" fill="#c9a227" stroke="${INK}" stroke-width="2"/>
    <ellipse cx="0" cy="40" rx="34" ry="34" fill="#d0432f" stroke="${INK}" stroke-width="4"/>
    <path d="M0 6 V74 M-22 14 Q-34 40 -22 66 M22 14 Q34 40 22 66" fill="none" stroke="#9e2a1e" stroke-width="2.5"/>
    <ellipse cx="-10" cy="28" rx="7" ry="12" fill="#fff" opacity=".25"/>
    <rect x="-14" y="72" width="28" height="8" rx="2" fill="#c9a227" stroke="${INK}" stroke-width="2"/>
    <path class="lt-tassel" d="M0 80 V112 M-6 80 L-8 108 M6 80 L8 108" stroke="#e0ad3a" stroke-width="3" stroke-linecap="round"/></g>
  <circle cx="140" cy="240" r="90" fill="#ffb060" opacity=".14" class="xl-lglow"/><circle cx="1460" cy="240" r="90" fill="#ffb060" opacity=".14" class="xl-lglow"/>
  <!-- 舞台后墙 + 灯 -->
  <rect x="240" y="196" width="1120" height="504" fill="#5a3a2e"/>
  <ellipse class="xl-spot" cx="800" cy="470" rx="420" ry="300" fill="url(#xlSpot)"/>
  <!-- 角儿（靠旗、蟒袍、脸谱） -->
  <g class="xl-actor" transform="translate(800 690)">
    <g class="xl-flags">${[-60,-20,20,60].map(a => `<g transform="rotate(${a} 0 -330)"><path d="M0 -330 V-470" stroke="#6b4428" stroke-width="5"/><path d="M0 -470 L46 -450 L0 -410 Z" fill="#c23a2b" stroke="${INK}" stroke-width="3"/></g>`).join('')}</g>
    <g class="xl-body">
      <path d="M-110 0 Q-120 -160 -70 -250 H70 Q120 -160 110 0 Z" fill="#2f6b4f" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
      <path d="M-70 -250 Q0 -200 70 -250" fill="none" stroke="#e0ad3a" stroke-width="10"/>
      <path d="M-60 -150 Q0 -120 60 -150 M-80 -70 Q0 -40 80 -70" fill="none" stroke="#e0ad3a" stroke-width="5" stroke-dasharray="14 10"/>
      <circle cx="0" cy="-160" r="26" fill="#e0ad3a" stroke="${INK}" stroke-width="4"/>
      <rect x="-90" y="-110" width="180" height="16" rx="8" fill="#c9a227" stroke="${INK}" stroke-width="3"/>
    </g>
    <g class="xl-arm-l"><path d="M-70 -230 Q-170 -230 -200 -160" fill="none" stroke="#2f6b4f" stroke-width="40" stroke-linecap="round"/>
      <path class="xl-sleeve" d="M-200 -160 Q-250 -60 -190 -20 Q-170 -90 -180 -150 Z" fill="#fbf8f0" stroke="${INK}" stroke-width="4"/></g>
    <g class="xl-arm-r"><path d="M70 -230 Q170 -250 190 -330" fill="none" stroke="#2f6b4f" stroke-width="40" stroke-linecap="round"/>
      <path d="M190 -330 L205 -520" stroke="#6b4428" stroke-width="10" stroke-linecap="round"/>
      <path d="M205 -520 Q250 -500 240 -460 L200 -470 Z" fill="#c9c4b8" stroke="${INK}" stroke-width="4"/></g>
    <g class="xl-head" transform="translate(0 -320)">
      <path d="M-62 -60 Q0 -130 62 -60 L54 -40 H-54 Z" fill="#c9a227" stroke="${INK}" stroke-width="5"/>
      ${[-40,0,40].map(x => `<circle cx="${x}" cy="-90" r="10" fill="#c23a2b" stroke="${INK}" stroke-width="3"/>`).join('')}
      <g class="xl-face">${xlFace(XL_FACES.red)}</g>
      <path class="xl-beard" d="M-30 50 Q-40 140 0 160 Q40 140 30 50 Z" fill="#2b2724" stroke="${INK}" stroke-width="3"/>
    </g>
    <circle class="xl-ring" cx="0" cy="-320" r="120" fill="none" stroke="#e0ad3a" stroke-width="8"/>
  </g>
  <!-- 幕布（左右两扇，点了拉开） -->
  <g class="xl-curtain lf-item" data-k="curtain" data-tip="幕布|点一下，开锣">
    <g class="xl-cl"><path d="M240 196 H810 V700 H240 Z" fill="#a8322a" stroke="${INK}" stroke-width="5"/>
      <path d="M240 660 H810" stroke="#e0ad3a" stroke-width="10"/><path d="M240 676 H810" stroke="#e0ad3a" stroke-width="3"/>
      <g transform="translate(525 430)"><circle r="78" fill="none" stroke="#e0ad3a" stroke-width="5"/><circle r="62" fill="none" stroke="#e0ad3a" stroke-width="2"/>
        ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M0 -58 q14 22 0 40 q-14 -18 0 -40z" fill="#e0ad3a" transform="rotate(${i * 45})"/>`).join('')}<circle r="10" fill="#e0ad3a"/></g>
      ${[300,380,460,540,620,700,780].map(x => `<path d="M${x} 196 Q${x + 18} 450 ${x} 700" fill="none" stroke="#7d2219" stroke-width="5"/>`).join('')}</g>
    <g class="xl-cr"><path d="M790 196 H1360 V700 H790 Z" fill="#a8322a" stroke="${INK}" stroke-width="5"/>
      <path d="M790 660 H1360" stroke="#e0ad3a" stroke-width="10"/><path d="M790 676 H1360" stroke="#e0ad3a" stroke-width="3"/>
      <g transform="translate(1075 430)"><circle r="78" fill="none" stroke="#e0ad3a" stroke-width="5"/><circle r="62" fill="none" stroke="#e0ad3a" stroke-width="2"/>
        ${[0, 1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M0 -58 q14 22 0 40 q-14 -18 0 -40z" fill="#e0ad3a" transform="rotate(${i * 45})"/>`).join('')}<circle r="10" fill="#e0ad3a"/></g>
      ${[840,920,1000,1080,1160,1240,1320].map(x => `<path d="M${x} 196 Q${x + 18} 450 ${x} 700" fill="none" stroke="#7d2219" stroke-width="5"/>`).join('')}</g>
  </g>
  <!-- 顶上帷幔 + 流苏 -->
  <path d="M240 196 H1360 V226 ${Array.from({ length: 14 }, (_, i) => `Q${1340 - i * 80} 266 ${1280 - i * 80} 226`).join(' ')} Q260 266 240 226 Z" fill="#7d2219" stroke="${INK}" stroke-width="4"/>
  ${Array.from({ length: 15 }, (_, i) => `<path class="xl-tas" d="M${240 + i * 80} 228 V256" stroke="#e0ad3a" stroke-width="4" stroke-linecap="round"/><circle cx="${240 + i * 80}" cy="260" r="5" fill="#e0ad3a"/>`).join('')}
  <!-- 台口乐队：锣、鼓、京胡 -->
  <g class="lf-item xl-gong" data-k="gong" transform="translate(150 640)" data-tip="大锣|“哐——”">
    <path d="M0 -150 V-90" stroke="#6b4428" stroke-width="6"/><circle cx="0" cy="-50" r="46" fill="#c9a227" stroke="${INK}" stroke-width="5"/><circle cx="0" cy="-50" r="16" fill="#e0ad3a" stroke="${INK}" stroke-width="3"/>
    <rect x="-60" y="-110" width="120" height="120" fill="transparent"/></g>
  <g class="lf-item xl-drum" data-k="drum" transform="translate(1450 650)" data-tip="单皮鼓|一出戏的指挥">
    <path d="M-40 -60 L-50 60 M40 -60 L50 60" stroke="#6b4428" stroke-width="7"/>
    <ellipse cx="0" cy="-60" rx="56" ry="18" fill="#efe1c4" stroke="${INK}" stroke-width="5"/><path d="M-56 -60 V-30 Q0 -10 56 -30 V-60" fill="#a8322a" stroke="${INK}" stroke-width="5"/>
    <g class="xl-stick"><path d="M20 -120 L-6 -66" stroke="#3a2a1e" stroke-width="6" stroke-linecap="round"/></g></g>
  <!-- 台下：八仙桌、盖碗茶、瓜子 -->
  <path d="M0 760 H1600 V900 H0 Z" fill="#4a352b"/>
  ${seats}
  <g transform="translate(800 820)"><rect x="-190" y="-40" width="380" height="26" rx="6" fill="#8a5a36" stroke="${INK}" stroke-width="5"/>
    <rect x="-170" y="-14" width="14" height="80" fill="#6b4428"/><rect x="156" y="-14" width="14" height="80" fill="#6b4428"/></g>
  <g class="lf-item xl-tea" data-k="tea" transform="translate(700 780)" data-tip="盖碗茶|刮一刮，抿一口">
    <path d="M-34 0 H34 L26 34 H-26 Z" fill="#fbf8f0" stroke="${INK}" stroke-width="4"/><path d="M-30 6 H30" stroke="#2f5d8a" stroke-width="5"/>
    <g class="xl-lid"><path d="M-38 -2 Q0 -26 38 -2 Z" fill="#fbf8f0" stroke="${INK}" stroke-width="4"/><circle cx="0" cy="-16" r="6" fill="#2f5d8a" stroke="${INK}" stroke-width="2"/></g>
    <ellipse cx="0" cy="38" rx="44" ry="7" fill="#fbf8f0" stroke="${INK}" stroke-width="3"/>
    <g class="xl-tsteam">${[-12, 12].map(x => `<path d="M${x} -30 q-8 -14 0 -28 q8 -14 0 -26" fill="none" stroke="#fffaf0" stroke-width="5" stroke-linecap="round"/>`).join('')}</g>
    <rect x="-48" y="-60" width="96" height="104" fill="transparent"/></g>
  <g class="lf-item xl-seed" data-k="seed" transform="translate(900 790)" data-tip="瓜子|嗑一个，听一段">
    <ellipse cx="0" cy="14" rx="56" ry="14" fill="#c9a227" stroke="${INK}" stroke-width="4"/>
    ${[-30,-14,2,18,32,-22,10].map((x, i) => `<ellipse class="xl-s${i}" cx="${x}" cy="${4 - (i > 4 ? 10 : 0)}" rx="8" ry="5" fill="#2b2724" transform="rotate(${i * 26} ${x} 4)"/>`).join('')}
    <g class="xl-shell"><ellipse cx="-6" cy="-30" rx="7" ry="4" fill="#2b2724"/><ellipse cx="8" cy="-34" rx="7" ry="4" fill="#2b2724"/></g>
    <rect x="-60" y="-40" width="120" height="70" fill="transparent"/></g>
  <!-- 叫好的看客（剪影） -->
  <g class="xl-crowd">${[180, 420, 620, 980, 1180, 1420].map((x, i) => `<g class="xl-fan xl-f${i}" transform="translate(${x} 900)"><circle cx="0" cy="-130" r="34" fill="#241914"/><path d="M-56 0 Q-56 -90 0 -96 Q56 -90 56 0 Z" fill="#241914"/>
    <path class="xl-hand" d="M30 -80 L64 -150" stroke="#241914" stroke-width="16" stroke-linecap="round"/></g>`).join('')}</g>
  <!-- “好！”字 -->
  <g class="xl-hao" transform="translate(800 260)" opacity="0"><text text-anchor="middle" font-size="120" fill="#e0ad3a" stroke="${INK}" stroke-width="4" font-family="YRTitle,serif">好！</text></g>
  <g class="xl-petals"></g>
</svg>`;
}
export function openOpera({ onSeal, sealed }) {
  const S = shell({ kicker: '戏楼 · 18:00', title: '听 一 出 戏', svg: operaSVG(), hint: '点幕布，开锣', goText: '叫好！', bubbleAt: [800, 230], cls: 'lf-opera' });
  // 台下换脸谱的小圆牌
  const chips = el('div', 'pg-chips xl-chips', Object.entries(XL_FACES).map(([k, f]) =>
    `<button class="pg-chip xl-chip${k === 'red' ? ' on' : ''}" data-k="${k}" title="${f.name}"><svg viewBox="-60 -90 120 170" width="30" height="40">${xlFace(f)}</svg></button>`).join(''));
  S.root.querySelector('.lf-bar').prepend(chips);
  chips.style.visibility = 'hidden';
  const actor = S.q('.xl-actor'), faceG = S.q('.xl-face'), beard = S.q('.xl-beard'), hao = S.q('.xl-hao');
  let open = false, cur = 'red', window_ = false, goods = 0, seen = new Set(['red']), loopT = 0, disposed = false;
  S.onClose = () => { disposed = true; clearTimeout(loopT); };

  function setFace(k) {
    cur = k; const f = XL_FACES[k];
    actor.classList.remove('turn'); void actor.getBBox(); actor.classList.add('turn');
    sfx('gong');
    setTimeout(() => { faceG.innerHTML = xlFace(f); beard.style.display = k === 'white' ? 'none' : ''; }, 260);
    chips.querySelectorAll('.xl-chip').forEach(b => b.classList.toggle('on', b.dataset.k === k));
    S.say(f.line, 2400);
    seen.add(k);
  }
  chips.querySelectorAll('.xl-chip').forEach(b => b.onclick = () => { if (open) setFace(b.dataset.k); });

  // 角儿的节奏：走两步 → 甩袖 → 亮相（金圈亮起时叫好才算“叫在点上”）
  function cycle() {
    if (disposed || !open) return;
    actor.classList.remove('liang', 'walk', 'sleeve');
    actor.classList.add('walk');
    [0, 1, 2].forEach(i => setTimeout(() => !disposed && sfx('clack'), 400 + i * 380));
    loopT = setTimeout(() => {
      actor.classList.remove('walk'); actor.classList.add('sleeve'); sfx('xiao');
      loopT = setTimeout(() => {
        actor.classList.remove('sleeve'); actor.classList.add('liang'); sfx('gong'); window_ = true;
        S.hint('亮相了——快叫好！');
        loopT = setTimeout(() => { window_ = false; actor.classList.remove('liang'); S.hint(goods >= 3 ? '换张脸谱，再看一遍' : '等他亮相，再叫好'); loopT = setTimeout(cycle, 900); }, 1700);
      }, 1100);
    }, 1600);
  }
  S.q('.xl-curtain').addEventListener('click', () => {
    if (open) return; open = true;
    S.root.classList.add('xl-open'); sfx('gong'); setTimeout(() => sfx('gong'), 380);
    [0, 1, 2, 3].forEach(i => setTimeout(() => sfx('clack'), 700 + i * 160));
    S.hint('等他亮相，再叫好'); chips.style.visibility = '';
    S.go.disabled = false;
    setTimeout(cycle, 1500);
  });
  S.go.onclick = () => {
    if (!open) return;
    const fans = S.qa('.xl-fan');
    if (window_) {
      window_ = false; goods++;
      hao.classList.remove('show'); void hao.getBBox(); hao.classList.add('show');
      fans.forEach((f, i) => setTimeout(() => S.pulse(f, 900), i * 60));
      sfx('hao'); setTimeout(() => sfx('hao'), 120); sfx('coin');
      petals();
      if (goods === 1) S.say('叫在点儿上！懂戏！', 2200, [800, 760]);
      if (goods >= 3 && seen.size >= 2 && !sealed()) setTimeout(() => S.stamp('戏', onSeal), 900);
      else if (goods >= 3 && seen.size < 2) S.hint('换张脸谱试试——点下面的小脸');
    } else {
      S.pulse(fans[2], 700); sfx('drop');
      S.say('嘘——还没到时候', 1600, [800, 760]);
    }
  };
  function petals() {
    const g = S.q('.xl-petals');
    for (let i = 0; i < 14; i++) {
      const p = document.createElementNS(NS, 'path');
      const x = rnd(420, 1180);
      p.setAttribute('d', `M${x} 200 q6 -10 12 0 q-6 10 -12 0z`);
      p.setAttribute('fill', ['#c23a2b', '#e0ad3a', '#fbf8f0'][i % 3]);
      g.appendChild(p);
      p.animate([{ transform: 'translate(0,0) rotate(0deg)', opacity: 1 }, { transform: `translate(${rnd(-60, 60)}px, ${rnd(380, 480)}px) rotate(${rnd(-300, 300)}deg)`, opacity: 0 }],
        { duration: rnd(1600, 2400), easing: 'ease-in', delay: i * 40 }).onfinish = () => p.remove();
    }
  }
  // 台口 / 台下小物件
  const tap = (k, f) => S.q(`[data-k="${k}"]`).addEventListener('click', e => { e.stopPropagation(); S.pulse(e.currentTarget, 1200); f(); });
  tap('gong', () => sfx('gong'));
  tap('drum', () => [0, 1, 2, 3, 4].forEach(i => setTimeout(() => sfx('clack'), i * 110)));
  tap('tea', () => { sfx('bead'); setTimeout(() => sfx('bead'), 200); });
  tap('seed', () => { sfx('clack'); setTimeout(() => sfx('pop'), 140); });
  return S;
}

/* ================= ④ 四合院 · 找福 ================= */
const fuMark = (s = 1, rot = 0) => `<g transform="rotate(${rot}) scale(${s})"><circle r="70" fill="rgba(0,0,0,0)"/><rect x="-30" y="-30" width="60" height="60" rx="4" transform="rotate(45)" fill="#c23a2b" stroke="${INK}" stroke-width="4"/>
  <text y="15" text-anchor="middle" font-size="42" fill="#f3d27a" font-family="YRTitle,serif" transform="rotate(180)">福</text></g>`;
function yardSVG() {
  const tiles = n => Array.from({ length: n }, (_, i) => `<path d="M${i * 46} 0 q23 -16 46 0" fill="none" stroke="${INK}" stroke-width="3"/>`).join('');
  return `
<svg class="lf-stage" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
  <rect width="1600" height="900" fill="#cfe0e6"/>
  <rect y="560" width="1600" height="340" fill="#d8ccb2"/>
  <defs>
    <pattern id="ydLat" width="30" height="30" patternUnits="userSpaceOnUse"><rect width="30" height="30" fill="#f2e6c9"/>
      <path d="M0 15 H10 V5 H20 V15 H30 M15 0 V5 M15 30 V20 H5 M25 20 V30" fill="none" stroke="#8a3a2e" stroke-width="2.4"/></pattern>
    <linearGradient id="ydSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9d4de"/><stop offset="1" stop-color="#e8eee6"/></linearGradient>
    <linearGradient id="ydBeam" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffbe8" stop-opacity=".5"/><stop offset="1" stop-color="#fffbe8" stop-opacity="0"/></linearGradient>
  </defs>
  <rect width="1600" height="560" fill="url(#ydSky)"/>
  <g opacity=".55">${[[260, 90, 70], [1240, 70, 90], [1500, 130, 50]].map(([x, y, r]) => `<g transform="translate(${x} ${y})"><ellipse rx="${r}" ry="${r * .32}" fill="#fff"/><ellipse cx="${r * .5}" cy="-8" rx="${r * .6}" ry="${r * .3}" fill="#fff"/></g>`).join('')}</g>
  <rect y="560" width="1600" height="340" fill="#d8ccb2"/>
  ${Array.from({ length: 12 }, (_, i) => `<path d="M0 ${600 + i * 26} H1600" stroke="#c4b796" stroke-width="2"/>`).join('')}
  ${Array.from({ length: 23 }, (_, i) => `<path d="M${800 + (i - 11) * 40} 560 L${800 + (i - 11) * 150} 900" stroke="#c4b796" stroke-width="2"/>`).join('')}
  <!-- 墙头远景：邻院屋脊、槐树梢 -->
  <g opacity=".6"><path d="M0 250 H260 L300 220 H1300 L1340 250 H1600 V560 H0 Z" fill="#a9a59a"/>
    ${Array.from({ length: 36 }, (_, i) => `<path d="M${i * 46} 250 q23 -12 46 0" fill="none" stroke="#7f7b72" stroke-width="2"/>`).join('')}
    <circle cx="1480" cy="200" r="70" fill="#7fa286"/><circle cx="1400" cy="225" r="50" fill="#7fa286"/><circle cx="90" cy="215" r="60" fill="#7fa286"/></g>
  <rect y="250" width="1600" height="310" fill="#b8b0a0" opacity=".55"/>
  <!-- 正房（北） -->
  <g transform="translate(400 210)">
    <path d="M-40 40 L60 -40 H740 L840 40 Z" fill="#5d6466" stroke="${INK}" stroke-width="6" stroke-linejoin="round"/>
    ${Array.from({ length: 34 }, (_, i) => `<path d="M${70 + i * 20} -36 L${-24 + i * 25.6} 38" stroke="#474d4f" stroke-width="5" stroke-linecap="round"/>`).join('')}
    <rect x="50" y="-56" width="700" height="20" rx="4" fill="#4a5052" stroke="${INK}" stroke-width="5"/>
    <path d="M50 -56 q-30 -30 -14 -50 q14 10 24 30 M750 -56 q30 -30 14 -50 q-14 10 -24 30" fill="#4a5052" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
    <g transform="translate(0 30)">${Array.from({ length: 18 }, (_, i) => `<path d="M${i * 46} 0 q23 -16 46 0" fill="#6a7173" stroke="${INK}" stroke-width="3"/>`).join('')}</g>
    ${Array.from({ length: 18 }, (_, i) => `<path d="M${i * 46 + 12} 40 l11 12 l11 -12" fill="#5d6466" stroke="${INK}" stroke-width="2.5"/>`).join('')}
    <rect x="0" y="40" width="800" height="320" fill="#b8473a" stroke="${INK}" stroke-width="6"/>
    <rect x="0" y="40" width="800" height="30" fill="#2b2724" opacity=".22"/>
    <path d="M0 70 H800" stroke="#2f5d8a" stroke-width="8"/><path d="M0 78 H800" stroke="#c9a227" stroke-width="3"/>
    ${[0, 1, 2, 3].map(i => `<rect x="${40 + i * 190}" y="96" width="150" height="174" fill="url(#ydLat)" stroke="${INK}" stroke-width="5"/>
      <rect x="${40 + i * 190}" y="96" width="150" height="174" fill="#fff6dc" opacity=".25"/>
      <path d="M${40 + i * 190} 183 H${190 + i * 190}" stroke="#8a3a2e" stroke-width="6"/>`).join('')}
    ${[20, 210, 400, 590, 780].map(x => `<rect x="${x - 8}" y="80" width="16" height="280" fill="#9e3a2f"/>`).join('')}
    <rect x="0" y="300" width="800" height="60" fill="#8a3a2e" stroke="${INK}" stroke-width="5"/>
    <path d="M0 300 H800" stroke="#c9a227" stroke-width="3"/>
    <rect x="-20" y="356" width="840" height="18" fill="#a8a194" stroke="${INK}" stroke-width="4"/>
    <!-- 楹联 -->
    <rect x="201" y="104" width="18" height="150" fill="#c23a2b" stroke="${INK}" stroke-width="2"/>
    <rect x="391" y="104" width="18" height="150" fill="#c23a2b" stroke="${INK}" stroke-width="2"/>
    ${[0, 1, 2, 3, 4].map(i => `<circle cx="210" cy="${122 + i * 28}" r="4" fill="#e0ad3a"/><circle cx="400" cy="${122 + i * 28}" r="4" fill="#e0ad3a"/>`).join('')}
  </g>
  <g class="yd-lt yd-lt1" transform="translate(470 250)"><path d="M0 -40 V0" stroke="#3a2a1e" stroke-width="3"/>
    <rect x="-14" y="0" width="28" height="8" rx="2" fill="#c9a227" stroke="${INK}" stroke-width="2"/>
    <ellipse cx="0" cy="40" rx="34" ry="34" fill="#d0432f" stroke="${INK}" stroke-width="4"/>
    <path d="M0 6 V74 M-22 14 Q-34 40 -22 66 M22 14 Q34 40 22 66" fill="none" stroke="#9e2a1e" stroke-width="2.5"/>
    <ellipse cx="-10" cy="28" rx="7" ry="12" fill="#fff" opacity=".25"/>
    <rect x="-14" y="72" width="28" height="8" rx="2" fill="#c9a227" stroke="${INK}" stroke-width="2"/>
    <path class="lt-tassel" d="M0 80 V112 M-6 80 L-8 108 M6 80 L8 108" stroke="#e0ad3a" stroke-width="3" stroke-linecap="round"/></g>
  <g class="yd-lt yd-lt2" transform="translate(1130 250)"><path d="M0 -40 V0" stroke="#3a2a1e" stroke-width="3"/>
    <rect x="-14" y="0" width="28" height="8" rx="2" fill="#c9a227" stroke="${INK}" stroke-width="2"/>
    <ellipse cx="0" cy="40" rx="34" ry="34" fill="#d0432f" stroke="${INK}" stroke-width="4"/>
    <path d="M0 6 V74 M-22 14 Q-34 40 -22 66 M22 14 Q34 40 22 66" fill="none" stroke="#9e2a1e" stroke-width="2.5"/>
    <ellipse cx="-10" cy="28" rx="7" ry="12" fill="#fff" opacity=".25"/>
    <rect x="-14" y="72" width="28" height="8" rx="2" fill="#c9a227" stroke="${INK}" stroke-width="2"/>
    <path class="lt-tassel" d="M0 80 V112 M-6 80 L-8 108 M6 80 L8 108" stroke="#e0ad3a" stroke-width="3" stroke-linecap="round"/></g>
  <!-- 斜阳光束 -->
  <g class="yd-beams" pointer-events="none">${[[300, 120], [520, 80], [760, 140]].map(([x, w]) => `<path d="M${x} 0 L${x + w} 0 L${x + w + 520} 900 L${x + 420} 900 Z" fill="url(#ydBeam)"/>`).join('')}</g>
  <!-- 落地影子 -->
  <g fill="#3a2a1a" opacity=".16" pointer-events="none"><ellipse cx="200" cy="646" rx="120" ry="16"/><ellipse cx="800" cy="806" rx="150" ry="18"/><ellipse cx="520" cy="842" rx="110" ry="12"/>
    <ellipse cx="1080" cy="762" rx="96" ry="12"/><ellipse cx="1395" cy="858" rx="170" ry="12"/></g>
  <!-- 花盆 -->
  <g transform="translate(640 640)"><path d="M-34 0 H34 L26 46 H-26 Z" fill="#b5653a" stroke="${INK}" stroke-width="4"/>
    <path d="M0 0 Q-30 -40 -20 -70 M0 0 Q10 -50 30 -66 M0 0 Q-4 -40 4 -86" fill="none" stroke="#4f8a5c" stroke-width="6" stroke-linecap="round"/>
    <circle cx="-20" cy="-72" r="9" fill="#e07a9a" stroke="${INK}" stroke-width="2"/><circle cx="30" cy="-68" r="8" fill="#e07a9a" stroke="${INK}" stroke-width="2"/><circle cx="4" cy="-88" r="9" fill="#e0ad3a" stroke="${INK}" stroke-width="2"/></g>
  <!-- 正房门上的福（倒贴） -->
  <g class="yd-fu yd-fu0" data-f="0" transform="translate(590 380)">${fuMark(.8)}</g>
  <!-- 石榴树（左） -->
  <g class="lf-item yd-tree" data-k="tree" transform="translate(200 640)" data-tip="石榴树|多子多福">
    <path d="M-14 0 Q-20 -160 0 -260 M0 -200 Q60 -240 90 -300 M0 -220 Q-60 -260 -90 -310" fill="none" stroke="#6b4428" stroke-width="22" stroke-linecap="round"/>
    <g class="yd-leaves">${[[-90, -330, 90], [0, -380, 110], [90, -320, 90], [-20, -280, 80]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#4f8a5c" stroke="${INK}" stroke-width="5"/>`).join('')}
      ${[[-110, -350, 50], [-10, -410, 60], [70, -350, 46]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#6aa676"/>`).join('')}
      ${[[-60, -290], [40, -300], [-120, -310], [110, -290], [0, -350], [-40, -400], [60, -400]].map(([x, y]) => `<path d="M${x} ${y} q8 -10 16 0 q-8 10 -16 0z" fill="#3c6e47"/>`).join('')}</g>
    ${[[-80, -300], [40, -350], [110, -300], [-30, -260]].map(([x, y], i) => `<g class="yd-pom yd-p${i}" transform="translate(${x} ${y})"><circle r="16" fill="#d0432f" stroke="${INK}" stroke-width="4"/><path d="M-6 -16 L0 -24 L6 -16" fill="#d0432f" stroke="${INK}" stroke-width="3"/></g>`).join('')}
    <rect x="-200" y="-480" width="400" height="480" fill="transparent"/>
  </g>
  <!-- 鸟笼挂在树枝 -->
  <g class="lf-item yd-cage" data-k="cage" transform="translate(300 380)" data-tip="鸟笼|画眉一早要遛">
    <path d="M0 -60 V-20" stroke="#6b4428" stroke-width="4"/>
    <path d="M-50 70 V0 Q0 -50 50 0 V70 Z" fill="rgba(255,255,255,.2)" stroke="#6b4428" stroke-width="5"/>
    ${[-30, -10, 10, 30].map(x => `<path d="M${x} 70 V${-18 + Math.abs(x) * .4}" stroke="#6b4428" stroke-width="3"/>`).join('')}
    <rect x="-56" y="66" width="112" height="12" rx="4" fill="#6b4428"/>
    <g class="yd-bird" transform="translate(0 40)"><ellipse rx="18" ry="13" fill="#c9a227" stroke="${INK}" stroke-width="3"/><circle cx="14" cy="-8" r="9" fill="#c9a227" stroke="${INK}" stroke-width="3"/><path d="M22 -8 l10 3 l-10 3" fill="#e07a2a"/><circle cx="16" cy="-10" r="2" fill="${INK}"/></g>
    <rect x="-60" y="-60" width="120" height="140" fill="transparent"/>
  </g>
  <!-- 晾衣绳 + 被子（后面藏福） -->
  <path d="M960 330 Q1200 370 1440 330" fill="none" stroke="#6b4428" stroke-width="4"/>
  <g class="yd-fu yd-fu1" data-f="1" transform="translate(1210 430)">${fuMark(.9)}</g>
  <g class="lf-item yd-quilt" data-k="quilt" transform="translate(1210 350)" data-tip="晒被子|正午太阳好">
    <g class="yd-qbody"><path d="M-130 0 H130 V190 Q0 210 -130 190 Z" fill="#3f6fa0" stroke="${INK}" stroke-width="5"/>
      ${[-80, -20, 40, 100].map((x, i) => `<circle cx="${x}" cy="${60 + (i % 2) * 70}" r="20" fill="#f2e6c9" stroke="${INK}" stroke-width="3"/>`).join('')}
      <path d="M-130 0 Q0 26 130 0" fill="none" stroke="${INK}" stroke-width="3"/></g>
    <rect x="-140" y="-10" width="280" height="220" fill="transparent"/>
  </g>
  <!-- 鱼缸（中） -->
  <g class="lf-item yd-tank" data-k="tank" transform="translate(800 760)" data-tip="大鱼缸|金鱼摆尾">
    <path d="M-130 -110 H130 Q120 40 0 50 Q-120 40 -130 -110 Z" fill="#8a6a50" stroke="${INK}" stroke-width="6"/>
    <path d="M-110 -70 Q0 -50 110 -70" fill="none" stroke="#c9a227" stroke-width="5" stroke-dasharray="12 10"/>
    <ellipse cx="0" cy="-110" rx="130" ry="26" fill="#6fa7b8" stroke="${INK}" stroke-width="5"/>
    <g class="yd-fish"><path d="M-20 -112 q20 -14 40 0 q-20 14 -40 0z" fill="#e07a2a" stroke="${INK}" stroke-width="3"/><path d="M20 -112 l16 -10 v20z" fill="#e07a2a" stroke="${INK}" stroke-width="3"/></g>
    <g class="yd-ripple"><ellipse cx="0" cy="-110" rx="30" ry="6" fill="none" stroke="#fffaf0" stroke-width="3"/></g>
    <path d="M-60 -116 q10 -20 20 0 M50 -112 q8 -16 16 0" fill="#4f8a5c" stroke="${INK}" stroke-width="3"/>
    <rect x="-140" y="-150" width="280" height="200" fill="transparent"/>
  </g>
  <!-- 门墩 + 猫（猫下面藏福） -->
  <g transform="translate(1080 720)">
    <rect x="-70" y="-40" width="140" height="80" rx="10" fill="#9a9384" stroke="${INK}" stroke-width="5"/>
    <circle cx="0" cy="-70" r="46" fill="#a8a194" stroke="${INK}" stroke-width="5"/><circle cx="0" cy="-70" r="24" fill="none" stroke="${INK}" stroke-width="3"/>
  </g>
  <g class="yd-fu yd-fu2" data-f="2" transform="translate(1080 650)">${fuMark(.7)}</g>
  <g class="lf-item yd-cat" data-k="cat" transform="translate(1080 640)" data-tip="大花猫|晒太阳，别吵它">
    <g class="yd-catb">
      <ellipse cx="0" cy="0" rx="62" ry="34" fill="#e7a95a" stroke="${INK}" stroke-width="5"/>
      <path d="M-30 -10 q10 10 0 22 M0 -16 q10 10 0 24 M30 -10 q10 10 0 22" stroke="#b5732e" stroke-width="5" fill="none"/>
      <g class="yd-cathead" transform="translate(-58 -20)"><circle r="30" fill="#e7a95a" stroke="${INK}" stroke-width="5"/>
        <path d="M-24 -16 L-20 -44 L-4 -26 M24 -16 L20 -44 L4 -26" fill="#e7a95a" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/>
        <path class="yd-eye" d="M-14 -2 q5 4 10 0 M6 -2 q5 4 10 0" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
        <path d="M-3 10 l3 3 l3 -3" fill="none" stroke="${INK}" stroke-width="3"/></g>
      <path class="yd-tail" d="M58 6 Q110 -10 100 -60" fill="none" stroke="#e7a95a" stroke-width="14" stroke-linecap="round"/>
    </g>
    <rect x="-100" y="-70" width="220" height="110" fill="transparent"/>
  </g>
  <!-- 兔儿爷（窗台） -->
  <g class="lf-item yd-rabbit" data-k="rabbit" transform="translate(1000 520)" data-tip="兔儿爷|老北京的中秋泥人">
    <path d="M-26 0 Q-30 -60 0 -64 Q30 -60 26 0 Z" fill="#c23a2b" stroke="${INK}" stroke-width="4"/>
    <circle cx="0" cy="-80" r="20" fill="#fbf8f0" stroke="${INK}" stroke-width="4"/>
    <path d="M-8 -96 Q-14 -140 -4 -142 Q2 -120 -2 -98 M8 -96 Q14 -140 4 -142 Q-2 -120 2 -98" fill="#fbf8f0" stroke="${INK}" stroke-width="3"/>
    <path d="M-6 -78 h4 M2 -78 h4" stroke="${INK}" stroke-width="3"/><path d="M-3 -70 q3 3 6 0" stroke="#c23a2b" stroke-width="3" fill="none"/>
    <rect x="-30" y="-24" width="60" height="10" fill="#c9a227"/>
    <rect x="-40" y="-150" width="80" height="160" fill="transparent"/>
  </g>
  <!-- 自行车（右前） -->
  <g class="lf-item yd-bike" data-k="bike" transform="translate(1390 760)" data-tip="二八大杠|叮铃铃——">
    <g class="yd-wheel" transform="translate(-80 40)"><circle r="56" fill="none" stroke="${INK}" stroke-width="7"/><path d="M-56 0 H56 M0 -56 V56 M-40 -40 L40 40 M40 -40 L-40 40" stroke="${INK}" stroke-width="2"/></g>
    <g class="yd-wheel" transform="translate(90 40)"><circle r="56" fill="none" stroke="${INK}" stroke-width="7"/><path d="M-56 0 H56 M0 -56 V56 M-40 -40 L40 40 M40 -40 L-40 40" stroke="${INK}" stroke-width="2"/></g>
    <path d="M-80 40 L-10 -40 H70 L90 40 M-10 -40 L10 40 L70 -40 M-10 -40 L-20 -70 M70 -40 L60 -80" fill="none" stroke="#2b2724" stroke-width="9" stroke-linejoin="round"/>
    <path d="M-40 -74 H0" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M40 -86 H84" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
    <circle class="yd-bell" cx="74" cy="-96" r="9" fill="#c9c4b8" stroke="${INK}" stroke-width="3"/>
    <rect x="-150" y="-110" width="310" height="210" fill="transparent"/>
  </g>
  <!-- 石桌 + 空竹 -->
  <g class="lf-item yd-diabolo" data-k="diabolo" transform="translate(520 780)" data-tip="空竹|抖起来，转得飞快">
    <path d="M-90 -40 H90 L70 -20 H-70 Z" fill="#a8a194" stroke="${INK}" stroke-width="5"/><rect x="-24" y="-20" width="48" height="80" fill="#9a9384" stroke="${INK}" stroke-width="5"/>
    <g class="yd-dia" transform="translate(0 -66)"><g class="yd-diab"><path d="M-40 -20 L-6 0 L-40 20 Z M40 -20 L6 0 L40 20 Z" fill="#2f5d8a" stroke="${INK}" stroke-width="4" stroke-linejoin="round"/><ellipse cx="-40" rx="6" ry="20" fill="#c23a2b" stroke="${INK}" stroke-width="3"/><ellipse cx="40" rx="6" ry="20" fill="#c23a2b" stroke="${INK}" stroke-width="3"/></g></g>
    <rect x="-100" y="-100" width="200" height="160" fill="transparent"/>
  </g>
  <g class="yd-drop"></g>
</svg>`;
}
export function openYard({ onSeal, sealed }) {
  const S = shell({ kicker: '四合院 · 12:00', title: '院 里 找 福', svg: yardSVG(), hint: '院里藏着 3 个“福”', bubbleAt: [800, 180], cls: 'lf-yard' });
  const cnt = el('span', 'yd-count', '福 <b>0</b> / 3'); S.root.querySelector('.lf-bar').prepend(cnt);
  const got = new Set();
  const reveal = { quilt: 1, cat: 2 };
  // 福放到最上层，不会被被子、猫的点击区挡住
  S.qa('.yd-fu').forEach(f => S.svg.insertBefore(f, S.q('.yd-drop')));
  // 福：被子吹开、猫挪开才露出来；正房门上那张倒贴的一直在
  function collect(f) {
      const i = f.dataset.f;
      if (f.classList.contains('hid') || got.has(i)) return;
      got.add(i); f.classList.add('got'); sfx('bell');
      cnt.querySelector('b').textContent = got.size; cnt.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 500 });
      S.say(['倒着贴，“福到了”！', '被子后头藏着一个', '猫屁股底下还有一个'][i], 2200);
      if (got.size === 3) { S.hint('三个福都找到了'); if (!sealed()) setTimeout(() => S.stamp('院', onSeal), 900); }
  }
  S.qa('.yd-fu').forEach(f => {
    if (f.dataset.f !== '0') f.classList.add('hid');
    // pointerdown 比 click 更跟手：鼠标稍微一动也不会丢
    f.addEventListener('pointerdown', e => { e.stopPropagation(); collect(f); });
  });
  const SND = {
    tree: () => sfx('drop'), cage: () => sfx('chirp'), quilt: () => sfx('steam'), tank: () => sfx('bubble'),
    cat: () => sfx('meow'), rabbit: () => sfx('pop'), bike: () => sfx('bell'), diabolo: () => [0, 1, 2, 3, 4].forEach(i => tone(523 + i * 40, 530 + i * 40, .14, .035, 'sine', i * .1))
  };
  S.qa('.lf-item').forEach(g => g.addEventListener('click', e => {
    e.stopPropagation(); const k = g.dataset.k;
    if ((k === 'quilt' || k === 'cat') && !g.classList.contains('moved')) {
      g.classList.add('moved');
      setTimeout(() => { S.q(`.yd-fu${reveal[k]}`).classList.remove('hid'); S.hint('看见“福”了吗？点它'); }, 500);
      if (k === 'cat') S.say('喵～（挪个窝）', 1600, [1180, 560]);
    } else if (k === 'quilt' || k === 'cat') { collect(S.q(`.yd-fu${reveal[k]}`)); }
    else S.pulse(g, 1400);
    SND[k] && SND[k]();
    if (k === 'tree') dropPom();
  }));
  function dropPom() {
    const p = S.q(`.yd-p${Math.random() * 4 | 0}`); const c = p.cloneNode(true);
    const m = p.transform.baseVal.consolidate().matrix;
    c.setAttribute('class', 'yd-pomfall'); c.setAttribute('transform', `translate(${200 + m.e} ${640 + m.f})`);
    S.q('.yd-drop').appendChild(c);
    c.animate([{ translate: '0 0' }, { translate: `${rnd(-20, 20)}px ${-m.f - 20}px`, offset: .8 }, { translate: `${rnd(-30, 30)}px ${-m.f - 34}px` }], { duration: 900, easing: 'cubic-bezier(.5,0,.8,.6)', fill: 'forwards' });
    setTimeout(() => sfx('drop'), 800);
    setTimeout(() => c.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 600, fill: 'forwards' }).onfinish = () => c.remove(), 2200);
  }
  setTimeout(() => S.say('院里东西都能点点', 2400), 700);
  return S;
}
