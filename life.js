/* 一日一巷 · 胡同生活小场景
 *  早点摊：正面平视的摊位，点一样“飞”进托盘，配出老北京标配就盖“胡同小印”
 *  原则：少字。悬停才出一句话小纸签，其余全靠动作和声音反馈
 */
import { soundOn } from './audio.js';

const $ = s => document.querySelector(s);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
const INK = '#2f2b26';

/* ---------------- 小音效 ---------------- */
let AC = null;
function ac() { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); return AC; }
function sfx(type) {
  if (!soundOn()) return;
  try {
    const a = ac(), t = a.currentTime, g = a.createGain(); g.connect(a.destination);
    if (type === 'pop' || type === 'drop') {
      const o = a.createOscillator(); o.type = 'sine';
      const f0 = type === 'pop' ? 520 : 300;
      o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * (type === 'pop' ? 1.9 : .55), t + .12);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.16, t + .01); g.gain.exponentialRampToValueAtTime(.001, t + .18);
      o.connect(g); o.start(t); o.stop(t + .2);
    } else if (type === 'sizzle' || type === 'steam') {
      const len = a.sampleRate * .7, b = a.createBuffer(1, len, a.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (type === 'sizzle' ? (Math.random() < .3 ? 1 : .2) : 1);
      const s = a.createBufferSource(), f = a.createBiquadFilter(); s.buffer = b;
      f.type = type === 'sizzle' ? 'highpass' : 'bandpass'; f.frequency.value = type === 'sizzle' ? 3500 : 1200;
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(type === 'sizzle' ? .07 : .05, t + .05); g.gain.exponentialRampToValueAtTime(.001, t + .65);
      s.connect(f); f.connect(g); s.start(t);
    } else if (type === 'stamp') {
      const o = a.createOscillator(); o.type = 'triangle';
      o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(60, t + .2);
      g.gain.setValueAtTime(.3, t); g.gain.exponentialRampToValueAtTime(.001, t + .3);
      o.connect(g); o.start(t); o.stop(t + .32);
    }
  } catch (e) {}
}

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

  <!-- 摊主 -->
  <g class="lf-vendor" transform="translate(800 0)">
    <path d="M-78 470 Q-80 360 -40 344 L40 344 Q80 360 78 470 Z" fill="#2d5c93" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M-42 360 L-36 470 L36 470 L42 360 Q0 380 -42 360 Z" fill="#f6f1e6" stroke="${INK}" stroke-width="4"/>
    <rect x="-14" y="316" width="28" height="34" fill="#e7c09a" stroke="${INK}" stroke-width="4"/>
    <circle cx="0" cy="282" r="46" fill="#ecc7a0" stroke="${INK}" stroke-width="5"/>
    <path d="M-48 262 Q-46 222 0 220 Q46 222 48 262 Z" fill="#f6f1e6" stroke="${INK}" stroke-width="5" stroke-linejoin="round"/>
    <circle class="lf-eye" cx="-16" cy="286" r="4.5" fill="${INK}"/><circle class="lf-eye" cx="16" cy="286" r="4.5" fill="${INK}"/>
    <path d="M-14 304 Q0 314 14 304" fill="none" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>
    <circle cx="-26" cy="300" r="7" fill="#e79a86" opacity=".6"/><circle cx="26" cy="300" r="7" fill="#e79a86" opacity=".6"/>
    <g class="lf-arm"><path d="M60 380 Q110 400 120 440" fill="none" stroke="#2d5c93" stroke-width="26" stroke-linecap="round"/><path d="M60 380 Q110 400 120 440" fill="none" stroke="${INK}" stroke-width="4" stroke-dasharray="0" opacity=".0"/></g>
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

/* ---------------- 打开早点摊 ---------------- */
export function openBreakfast({ onSeal, sealed }) {
  const root = el('div', 'life', `
    <div class="lf-head"><span class="lf-kicker">清晨 · 06:45</span><h3>早 点 摊</h3></div>
    <button class="lf-back">回胡同 <span>→</span></button>
    <div class="lf-wrap">${stallSVG()}</div>
    <div class="lf-bubble"><span>早啊！来点儿什么？</span></div>
    <div class="lf-tip"><b></b><span></span></div>
    <div class="lf-bar"><span class="lf-hint">点一样，放进托盘</span><button class="lf-go" disabled>就这些！</button></div>
    <div class="lf-seal"><i>早</i><small>胡同小印</small></div>`);
  document.body.appendChild(root);
  document.body.classList.add('locked');
  requestAnimationFrame(() => root.classList.add('open'));

  const svg = root.querySelector('svg'), tip = root.querySelector('.lf-tip'), bubble = root.querySelector('.lf-bubble');
  const goBtn = root.querySelector('.lf-go'), hint = root.querySelector('.lf-hint');
  const tray = [null, null, null, null];
  let tries = 0, judged = false, busy = 0;

  // 把 SVG 坐标换算成屏幕坐标
  const toScreen = (x, y) => { const p = svg.createSVGPoint(); p.x = x; p.y = y; const r = p.matrixTransform(svg.getScreenCTM()); return [r.x, r.y]; };
  const scale = () => svg.getScreenCTM().a;

  function say(t, ms = 3200) {
    bubble.querySelector('span').textContent = t;
    bubble.classList.remove('show'); void bubble.offsetWidth; bubble.classList.add('show');
    const [x, y] = toScreen(800, 210); bubble.style.left = x + 'px'; bubble.style.top = y + 'px';
    clearTimeout(say.t); if (ms) say.t = setTimeout(() => bubble.classList.remove('show'), ms);
  }
  setTimeout(() => say('早啊！来点儿什么？'), 700);

  function renderTray() {
    svg.querySelectorAll('.lf-slot').forEach((s, i) => {
      s.querySelectorAll('.lf-in').forEach(n => n.remove());
      if (!tray[i]) return;
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('class', 'lf-in'); g.dataset.k = tray[i];
      g.innerHTML = `<g transform="translate(0 -8) scale(1.05)">${ICONS[tray[i]]}</g>`;
      g.onclick = e => { e.stopPropagation(); if (judged) return; tray[i] = null; sfx('drop'); renderTray(); };
      s.appendChild(g);
    });
    const n = tray.filter(Boolean).length;
    goBtn.disabled = n === 0;
    hint.textContent = n === 0 ? '点一样，放进托盘' : n < 4 ? `还能放 ${4 - n} 样 · 点托盘里的可放回` : '托盘满啦';
  }

  // 飞进托盘
  function fly(k, sx, sy) {
    const i = tray.indexOf(null);
    if (i < 0) { say('托盘满啦，先尝尝这些？', 2200); return; }
    tray[i] = '…'; busy++;
    const [tx, ty] = toScreen(800 + [-225, -75, 75, 225][i], 782);
    const s = scale(), size = 116 * s;
    const f = el('div', 'lf-fly', iconSvg(k, size)); document.body.appendChild(f);
    const mx = (sx + tx) / 2, my = Math.min(sy, ty) - 160 * s;
    f.animate([
      { transform: `translate(${sx - size / 2}px, ${sy - size / 2}px) scale(.6) rotate(0deg)` },
      { transform: `translate(${mx - size / 2}px, ${my - size / 2}px) scale(1.05) rotate(${Math.random() < .5 ? -14 : 14}deg)`, offset: .5 },
      { transform: `translate(${tx - size / 2}px, ${ty - size / 2}px) scale(1) rotate(0deg)` }
    ], { duration: 720, easing: 'cubic-bezier(.3,.1,.3,1)' }).onfinish = () => {
      f.remove(); tray[i] = k; busy--; sfx('drop'); renderTray();
      const slot = svg.querySelectorAll('.lf-slot')[i].querySelector('.lf-in'); if (slot) slot.animate([{ transform: 'translateY(-10px)' }, { transform: 'translateY(0)' }], { duration: 260, easing: 'ease-out' });
    };
  }

  // 每样东西的小动作
  function act(g, k) {
    g.classList.remove('act'); void g.getBBox(); g.classList.add('act');
    setTimeout(() => g.classList.remove('act'), 1100);
    if (k === 'baozi') sfx('steam'); else if (k === 'youtiao') sfx('sizzle'); else sfx('pop');
    const b = g.getBBox(), m = g.transform.baseVal.consolidate().matrix;
    const ox = m.e, oy = m.f;
    const top = { baozi: [0, -170], youtiao: [0, -110], jiaoquan: [0, -40], tangyoubing: [0, -40], xiancai: [0, -20], chaogan: [0, -90], douzhi: [0, -120], doujiang: [0, -140] }[k];
    const [sx, sy] = toScreen(ox + top[0], oy + top[1]);
    setTimeout(() => fly(k, sx, sy), k === 'baozi' ? 380 : k === 'youtiao' ? 260 : 300);
  }

  svg.querySelectorAll('.lf-item').forEach(g => {
    const k = g.dataset.k;
    g.addEventListener('click', e => {
      e.stopPropagation(); if (judged) return;
      if (tray.indexOf(null) < 0) { say('托盘满啦，先尝尝这些？', 2200); return; }
      act(g, k);
    });
    g.addEventListener('mouseenter', () => { tip.querySelector('b').textContent = FOODS[k].name; tip.querySelector('span').textContent = FOODS[k].tip; tip.classList.add('show'); g.classList.add('hover'); });
    g.addEventListener('mouseleave', () => { tip.classList.remove('show'); g.classList.remove('hover'); });
  });
  root.addEventListener('mousemove', e => { tip.style.left = e.clientX + 'px'; tip.style.top = e.clientY + 'px'; });

  goBtn.onclick = () => {
    if (busy) return;
    if (judged) { // 再挑一次
      judged = false; tray.fill(null); renderTray(); goBtn.textContent = '就这些！'; root.classList.remove('judged'); say('再来点儿什么？', 2000); return;
    }
    const ks = tray.filter(Boolean), r = judge(ks);
    tries++; judged = true; root.classList.add('judged');
    say(r.t, 0);
    svg.querySelector('.lf-vendor').classList.add('nod'); setTimeout(() => svg.querySelector('.lf-vendor').classList.remove('nod'), 900);
    goBtn.textContent = '再挑一次';
    hint.textContent = r.seal ? '老北京标配 ✓' : (tries >= 2 && !sealed() ? '悄悄说：老北京人爱豆汁儿配焦圈' : '摊主说的有道理？');
    if (r.seal && !sealed()) setTimeout(() => {
      const st = root.querySelector('.lf-seal'); st.classList.add('show'); sfx('stamp'); onSeal && onSeal();
      setTimeout(() => st.classList.add('settle'), 1600);
    }, 900);
  };

  function close() {
    root.classList.remove('open'); document.body.classList.remove('locked');
    removeEventListener('keydown', onKey);
    setTimeout(() => root.remove(), 700);
  }
  const onKey = e => { if (e.key === 'Escape') close(); };
  addEventListener('keydown', onKey);
  root.querySelector('.lf-back').onclick = close;
  renderTray();
  return { close };
}
