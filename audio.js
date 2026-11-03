/* 一日一巷 · 胡同环境声
 * 全部用 Web Audio 实时合成，不依赖音频文件：
 *  主背景音乐：卜卜卜《华年（二胡版）》循环
 *  点缀音效（压在音乐下面）：拂晓 鸽哨 · 正午 空竹与鸟鸣 · 黄昏 戏楼锣鼓 · 深夜 蛐蛐
 */
let ctx = null, master = null, dry = null, wet = null, windG = null, windF = null;
let bgmEl = null, bgmG = null, sfxBus = null;
const BGM_VOL = .55, SFX_VOL = .32;   // 音乐为主，音效是点缀
let enabled = false;
const next = {};
const rnd = (a, b) => a + Math.random() * (b - a);

function init() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  master = ctx.createGain(); master.gain.value = 0; master.connect(ctx.destination);
  // 主背景音乐
  bgmEl = new Audio('./audio/huanian.mp3'); bgmEl.loop = true; bgmEl.preload = 'auto';
  bgmG = ctx.createGain(); bgmG.gain.value = BGM_VOL;
  ctx.createMediaElementSource(bgmEl).connect(bgmG); bgmG.connect(master);
  // 音效总线：整体压低，并做轻压缩，避免锣鼓等突然很响
  const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -26; comp.ratio.value = 4; comp.knee.value = 12;
  sfxBus = ctx.createGain(); sfxBus.gain.value = SFX_VOL; sfxBus.connect(comp); comp.connect(master);
  dry = ctx.createGain(); dry.gain.value = 1; dry.connect(sfxBus);
  // 院落混响：生成一段衰减噪声作为脉冲响应
  const delay = ctx.createDelay(); delay.delayTime.value = .12;
  const feed = ctx.createGain(); feed.gain.value = .35;
  delay.connect(feed); feed.connect(delay);
  wet = ctx.createGain(); wet.gain.value = .15; wet.connect(delay); delay.connect(sfxBus);
  // 底噪：胡同里的风
  const nb = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate), nd = nb.getChannelData(0);
  let b0 = 0; for (let i = 0; i < nd.length; i++) { b0 = .985 * b0 + .015 * (Math.random() * 2 - 1); nd[i] = b0 * 6; }
  const ns = ctx.createBufferSource(); ns.buffer = nb; ns.loop = true;
  windF = ctx.createBiquadFilter(); windF.type = 'lowpass'; windF.frequency.value = 500;
  windG = ctx.createGain(); windG.gain.value = 0;
  // 风声底噪已去掉（听感像电流“滋啦”声）
}
function out(gain, pan = 0, wetAmt = .3) {
  const g = ctx.createGain(); g.gain.value = gain;
  const p = ctx.createStereoPanner(); p.pan.value = pan;
  g.connect(p); p.connect(dry);
  const w = ctx.createGain(); w.gain.value = wetAmt; p.connect(w); w.connect(wet);
  return { g, p };
}
function noiseBuf(sec) {
  const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; return b;
}

/* ---------- 声音素材 ---------- */
// 鸽哨：一群鸽子从头顶掠过，几支哨子和声，带多普勒与左右扫过
function pigeonWhistle() {
  const t = ctx.currentTime, dur = rnd(4.5, 6.5), dir = Math.random() < .5 ? -1 : 1;
  const o = out(.0, 0, .45);
  o.p.pan.setValueAtTime(-.9 * dir, t); o.p.pan.linearRampToValueAtTime(.9 * dir, t + dur);
  o.g.gain.setValueAtTime(0, t); o.g.gain.linearRampToValueAtTime(.05, t + dur * .45); o.g.gain.linearRampToValueAtTime(0, t + dur);
  const base = rnd(640, 760);
  [1, 1.5, 2.01, 1.26].forEach((r, i) => {
    const os = ctx.createOscillator(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    os.type = 'sine'; os.frequency.setValueAtTime(base * r * 1.02, t); os.frequency.linearRampToValueAtTime(base * r * .97, t + dur);
    lfo.frequency.value = rnd(4, 6); lg.gain.value = base * r * .008; lfo.connect(lg); lg.connect(os.frequency);
    g.gain.value = [1, .55, .3, .4][i];
    os.connect(g); g.connect(o.g); os.start(t); lfo.start(t); os.stop(t + dur + .1); lfo.stop(t + dur + .1);
  });
}
// 叫卖：“豆汁儿——焦圈儿”（共振峰合成的远处吆喝）
function hawker() {
  const t0 = ctx.currentTime + .05, f0 = rnd(170, 200), pan = rnd(-.5, .5);
  const o = out(.16, pan, .7);
  const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2400; lp.connect(o.g);
  const src = ctx.createOscillator(); src.type = 'sawtooth';
  const vib = ctx.createOscillator(), vg = ctx.createGain(); vib.frequency.value = 5.2; vg.gain.value = f0 * .018; vib.connect(vg); vg.connect(src.frequency);
  const amp = ctx.createGain(); amp.gain.value = 0; src.connect(amp);
  const F = [0, 1, 2].map(() => { const b = ctx.createBiquadFilter(); b.type = 'bandpass'; b.Q.value = 7; amp.connect(b); b.connect(lp); return b; });
  // 音节：[时长, 起始音高倍数, 结束音高倍数, F1, F2, 停顿]
  const syl = [
    [.38, 1.25, 1.0, 520, 900, .02],   // 豆
    [1.25, 1.33, 1.28, 480, 1350, .5], // 汁儿——
    [.45, 1.33, 1.33, 760, 1250, .03], // 焦
    [1.15, 1.33, 1.05, 700, 1200, .1]  // 圈儿——
  ];
  let t = t0;
  syl.forEach(([d, a, b, f1, f2, gap]) => {
    src.frequency.setValueAtTime(f0 * a, t); src.frequency.linearRampToValueAtTime(f0 * b, t + d);
    F[0].frequency.setValueAtTime(f1, t); F[1].frequency.setValueAtTime(f2, t); F[2].frequency.setValueAtTime(2600, t);
    amp.gain.setValueAtTime(0, t); amp.gain.linearRampToValueAtTime(1, t + .06); amp.gain.setValueAtTime(1, t + d - .12); amp.gain.linearRampToValueAtTime(0, t + d);
    t += d + gap;
  });
  src.start(t0); vib.start(t0); src.stop(t + .2); vib.stop(t + .2);
}
// 空竹：转动时“嗡——”的哨音，忽强忽弱
function kongzhu() {
  const t = ctx.currentTime, dur = rnd(3.5, 5), o = out(0, rnd(-.6, .6), .35);
  o.g.gain.setValueAtTime(0, t); o.g.gain.linearRampToValueAtTime(.07, t + .8); o.g.gain.setValueAtTime(.07, t + dur - 1); o.g.gain.linearRampToValueAtTime(0, t + dur);
  const am = ctx.createGain(); am.gain.value = .5; am.connect(o.g);
  const lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = rnd(7, 10); lg.gain.value = .5; lfo.connect(lg); lg.connect(am.gain);
  const f = rnd(470, 540);
  [1, 2.02, 2.97].forEach((r, i) => {
    const os = ctx.createOscillator(), g = ctx.createGain(); os.type = 'sine';
    os.frequency.setValueAtTime(f * r * .94, t); os.frequency.linearRampToValueAtTime(f * r * 1.05, t + dur);
    g.gain.value = [1, .35, .15][i]; os.connect(g); g.connect(am); os.start(t); os.stop(t + dur + .1);
  });
  lfo.start(t); lfo.stop(t + dur + .1);
}
// 鸟鸣：几声短促的啾啾
function birds() {
  const n = 3 + (Math.random() * 4 | 0), o = out(.035, rnd(-.8, .8), .25), base = rnd(1900, 2600);
  let t = ctx.currentTime;
  for (let i = 0; i < n; i++) {
    const os = ctx.createOscillator(), g = ctx.createGain(), d = rnd(.05, .11);
    os.frequency.setValueAtTime(base, t); os.frequency.linearRampToValueAtTime(base * rnd(1.1, 1.3), t + d);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.6, t + .015); g.gain.exponentialRampToValueAtTime(.001, t + d);
    os.connect(g); g.connect(o.g); os.start(t); os.stop(t + d + .02);
    t += d + rnd(.04, .12);
  }
}
// 锣鼓：大锣“仓”、小锣“台”、板鼓“大”
function hit(type, t, o) {
  if (type === 'da') {
    const s = ctx.createOscillator(), g = ctx.createGain();   // 板鼓改成干净的木头声，不用噪声
    s.type = 'triangle'; s.frequency.setValueAtTime(620, t); s.frequency.exponentialRampToValueAtTime(380, t + .07);
    g.gain.setValueAtTime(.5, t); g.gain.exponentialRampToValueAtTime(.001, t + .08);
    s.connect(g); g.connect(o); s.start(t); s.stop(t + .1); return;
  }
  const big = type === 'cang', base = big ? 190 : 820;
  const ratios = big ? [1, 1.48, 2.1, 2.76, 3.9] : [1, 1.08, 2.3];
  ratios.forEach((r, i) => {
    const os = ctx.createOscillator(), g = ctx.createGain(); os.type = 'sine';
    os.frequency.setValueAtTime(base * r * (big ? 1 : .96), t); os.frequency.linearRampToValueAtTime(base * r * (big ? .92 : 1.06), t + (big ? 1.6 : .4));
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.5 / (i + 1), t + .005);
    g.gain.exponentialRampToValueAtTime(.001, t + (big ? 1.8 : .45) / (1 + i * .25));
    os.connect(g); g.connect(o); os.start(t); os.stop(t + 2);
  });
}
function luogu() {
  const o = out(.13, rnd(-.3, .3), .25), t = ctx.currentTime + .05;
  // 一段【急急风】式的简化锣鼓经：大 大 大大 | 仓 才 仓 才 | 仓 台 仓 —
  const seq = [['da', 0], ['da', .28], ['da', .5], ['da', .62], ['cang', .9], ['tai', 1.2], ['cang', 1.5], ['tai', 1.8], ['cang', 2.1], ['tai', 2.32], ['cang', 2.55]];
  seq.forEach(([k, d]) => hit(k, t + d, o.g));
}
// 蛐蛐：两只，此起彼伏
function cricket() {
  const o = out(.02, rnd(-.9, .9), .1), f = rnd(3200, 3700);
  let t = ctx.currentTime;
  const chirps = 2 + (Math.random() * 3 | 0);
  for (let c = 0; c < chirps; c++) {
    for (let k = 0; k < 3; k++) {
      const os = ctx.createOscillator(), g = ctx.createGain(); os.frequency.value = f;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(1, t + .006); g.gain.linearRampToValueAtTime(0, t + .03);
      os.connect(g); g.connect(o.g); os.start(t); os.stop(t + .04); t += .045;
    }
    t += rnd(.18, .3);
  }
}

/* ---------- 调度：按时辰安排 ---------- */
const PLAN = [
  // [声音, 起始时刻, 结束时刻, 最短间隔, 最长间隔]
  [birds, 5.5, 9, 8, 15], // 凌晨鸟鸣
  [birds, 10, 16, 12, 18], // 鸽哨替换为柔和鸟鸣
  [birds, 6.8, 17.6, 2.5, 6],   // 空竹（嗡嗡的电流感）已去掉，改为更多鸟鸣
  [birds, 10.5, 16.5, 4, 9],
  [luogu, 17.2, 20.6, 14, 20],
  [cricket, 20, 25, .8, 2.2]
];
export function updateAmbient(h, dt = .016) {
  if (!ctx || !enabled) return;
  const now = ctx.currentTime;
  PLAN.forEach((p, i) => {
    const [fn, a, b, mn, mx] = p;
    if (h < a || h > b) { next[i] = null; return; }
    if (next[i] == null) { next[i] = now + rnd(.5, mn * .5); return; }
    if (now >= next[i]) { try { fn(); } catch (e) {} next[i] = now + rnd(mn, mx); }
  });
  // 底噪随时辰：清晨柔、正午亮、深夜低
  const tgtF = h < 7 ? 380 : h < 17 ? 650 : h < 20 ? 500 : 300;
  const tgtG = h < 7 ? .018 : h < 20 ? .012 : .01;
  // 戏楼锣鼓时段音乐稍让一让，深夜音乐放轻
  const tgtB = (h > 17.2 && h < 20.6 ? .48 : h > 21 ? .5 : 1) * BGM_VOL;
  bgmG.gain.value += (tgtB - bgmG.gain.value) * .02;
}
export function setSound(on) {
  enabled = on;
  try { localStorage.setItem('yryx-sound', on ? '1' : '0'); } catch (e) {}
  if (on) { init(); ctx.resume(); bgmEl.play().catch(() => {}); }
  if (!ctx) return;
  if (!on) setTimeout(() => { if (!enabled) bgmEl.pause(); }, 450);
  const t = ctx.currentTime;
  master.gain.cancelScheduledValues(t); master.gain.setValueAtTime(master.gain.value, t);
  master.gain.linearRampToValueAtTime(on ? 1 : 0, t + (on ? 2.5 : .4));
  if (!on) Object.keys(next).forEach(k => next[k] = null);
}
export const soundOn = () => enabled;
export const soundPref = () => { try { return localStorage.getItem('yryx-sound') !== '0'; } catch (e) { return true; } };

// 切到别的标签页时暂停，回来继续
document.addEventListener('visibilitychange', () => {
  if (!ctx || !enabled) return;
  if (document.hidden) { bgmEl.pause(); ctx.suspend(); } else { ctx.resume(); bgmEl.play().catch(() => {}); }
});
