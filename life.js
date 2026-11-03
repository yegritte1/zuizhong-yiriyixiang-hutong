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
let AC = null;
function ac() { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); return AC; }
function tone(f0, f1, dur, vol = .12, type = 'sine', delay = 0) {
  const a = ac(), t = a.currentTime + delay, o = a.createOscillator(), g = a.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + .012); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
  o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + dur + .02);
}
export function sfx(type) {
  if (!soundOn()) return;
  try {
    switch (type) {
      case 'pop': tone(520, 990, .16, .14); break;
      case 'drop': tone(330, 180, .16, .14); break;
      case 'bubble': for (let i = 0; i < 5; i++) tone(rnd(700, 1300), rnd(1400, 2000), .07, .05, 'sine', i * .07); break;
      case 'fry': for (let i = 0; i < 7; i++) tone(rnd(1800, 2600), rnd(1200, 1600), .04, .025, 'sine', i * .06); break;
      case 'steam': tone(420, 260, .5, .05, 'triangle'); break;
      case 'stamp': tone(150, 60, .3, .3, 'triangle'); break;
      case 'bell': [1, 2.76, 5.4].forEach((r, i) => tone(1500 * r, 1500 * r * .995, 1.1 / (i + 1), .07 / (i + 1))); tone(1500, 1495, .9, .06, 'sine', .18); break;
      case 'chirp': for (let i = 0; i < 3; i++) tone(rnd(2600, 3200), rnd(3600, 4200), .08, .05, 'sine', i * .13); break;
      case 'clack': tone(900, 600, .06, .16, 'triangle'); tone(700, 500, .05, .1, 'triangle', .07); break;
      case 'gong': [1, 1.48, 2.1].forEach((r, i) => tone(200 * r, 170 * r, 1.6 / (i + 1), .14 / (i + 1))); break;
      case 'xiao': tone(880, 1320, .25, .08); tone(1320, 1760, .2, .06, 'sine', .2); break;
      case 'coin': tone(1900, 2100, .12, .07); tone(2500, 2600, .18, .06, 'sine', .08); break;
      case 'bead': tone(1200, 1000, .04, .08, 'triangle'); break;
      case 'whistle': [700, 1050, 1400].forEach((f, i) => { const a = ac(), t = a.currentTime, o = a.createOscillator(), g = a.createGain(), l = a.createOscillator(), lg = a.createGain();
          o.frequency.value = f; l.frequency.value = 5 + i; lg.gain.value = f * .012; l.connect(lg); lg.connect(o.frequency);
          g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.035, t + .8); g.gain.linearRampToValueAtTime(.0001, t + 2.6);
          o.connect(g); g.connect(a.destination); o.start(t); l.start(t); o.stop(t + 2.7); l.stop(t + 2.7); }); break;
      case 'meow': tone(700, 1000, .18, .05, 'triangle'); tone(1000, 600, .3, .05, 'triangle', .18); break;
      case 'hao': tone(300, 420, .3, .09, 'triangle'); break;
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
  return S;
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
