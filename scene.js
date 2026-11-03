/* 一日一巷 · 3D 胡同场景
 * 程序化生成一条东西向胡同：四合院、门楼、戏楼、早点摊、小卖部、槐树、电线杆、鸽群、风筝。
 * 风格：米色纸面 + 卡通分层光 + 墨线描边，雾气把远景溶进纸里（对标 Chartogne-Taillet）。
 * Tripo AI 模型：把 glb 放进 models/ 并在 MODEL_SLOTS 中登记，会自动替换对应的程序化建筑。
 */
import * as THREE from 'three';
import { GLTFLoader } from './lib/loaders/GLTFLoader.js';

const C = (s) => new THREE.Color(s);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);

/* ---------- Tripo 模型槽位：文件存在就替换程序化建筑 ---------- */
export const MODEL_SLOTS = {
  opera:     { file: 'models/opera.glb',     pos: [-90, 0, 15],  rotY: Math.PI, size: 16 },
  gate:      { file: 'models/gate.glb',      pos: [-20.25, 0, -4.6], rotY: 0, size: 4.2 },
  siheyuan:  { file: 'models/siheyuan.glb',  pos: [0, 0, -18],   rotY: 0,     size: 30 },
  stall:     { file: 'models/stall.glb',     pos: [96, 0, 7],    rotY: 0,     size: 5 },
  store:     { file: 'models/store.glb',     pos: [108, 0, -7],  rotY: 0,     size: 8 },
  tree:      { file: 'models/tree.glb',      pos: null }
};

/* ---------- 镜头节点（与 main.js 的 STOPS 一一对应） ---------- */
const CAMS = [
  { p: [128, 2.6, 0],  t: [40, 15, 0] },          // 拂晓 · 站在胡同口（与首页同视角）
  { p: [82, 22, 48], t: [40, 27, 0] },           // 放鸽子 · 越过屋脊，鸽群的独立特写
  { p: [101.5, 3.6, 15.5], t: [95.5, 1.9, 6.5] }, // 早点摊（略高平视，摊主与蒸笼入画）
  { p: [112, 4.8, 8], t: [108, 3, -7] },         // 小卖部 · 门面和玻璃柜台的独立特写
  { p: [86.5, 2.7, -10.4], t: [84, 1.15, -15] }, // 毛猴（贴近工作台，平视）
  { p: [21, 13, 2],    t: [-1, 1.5, -18] },       // 四合院（斜 45° 越过门楼看院心与下棋的大爷）
  { p: [-7, 2.6, -2.5], t: [-25, 10, 13] },        // 沙燕（胡同里仰看：放风筝的孩子 + 风筝）
  { p: [-84, 12.5, -13], t: [-90, 5.5, 11] },     // 戏楼（拉远，越过对面屋顶看整座戏楼）
  { p: [-98.6, 4.3, 3.2], t: [-104.5, 2, 13] },    // 脸谱（后台门口）
  { p: [-70, 62, -95], t: [-25, 0, 0] }          // 深夜 · 西头回望
];

/* ---------- 光照关键帧 ---------- */
const LIGHT = [
  // 拂晓：天蒙蒙亮，青灰蓝，太阳未出，路灯还亮着，雾重
  { h: 5,    top: '#6f7f99', hor: '#cdbfba', sun: '#ffb48a', si: .18, hs: '#8593ad', hg: '#6f6c72', hi: .78, fn: 18,  ff: 170, lamp: .75, night: .18 },
  { h: 5.9,  top: '#93a0b4', hor: '#e2c7b4', sun: '#ffb27a', si: .6,  hs: '#a6aec0', hg: '#8f8580', hi: .8,  fn: 30,  ff: 220, lamp: .3,  night: .06 },
  // 清晨：太阳刚出，低角度金光，暖橙色，长影子
  { h: 6.75, top: '#e7c6a6', hor: '#ffd9a6', sun: '#ffac5e', si: 1.9, hs: '#ecd2b8', hg: '#b49a7c', hi: .62, fn: 55,  ff: 300, lamp: 0,   night: 0 },
  // 上午：清透明亮，天空泛一点蓝
  { h: 8.5,  top: '#cdd9df', hor: '#f6efe0', sun: '#fff1d6', si: 2.2, hs: '#eae8e2', hg: '#d3c6ac', hi: .85, fn: 100, ff: 440, lamp: 0,   night: 0 },
  // 正午：最亮、最白、对比最强
  { h: 12,   top: '#bcd0de', hor: '#f8f5ec', sun: '#ffffff', si: 2.8, hs: '#f6f4ee', hg: '#d8ccb4', hi: 1.0, fn: 130, ff: 500, lamp: 0,   night: 0 },
  // 午后：开始回暖
  { h: 15,   top: '#e6d2ae', hor: '#f7e4c2', sun: '#ffdca2', si: 2.1, hs: '#f0e2c8', hg: '#d0bc98', hi: .85, fn: 110, ff: 460, lamp: 0,   night: 0 },
  { h: 17.5, top: '#e3a274', hor: '#f5c99a', sun: '#ff9a55', si: 1.7, hs: '#f0b890', hg: '#a88a70', hi: .65, fn: 80,  ff: 380, lamp: .25, night: 0 },
  { h: 19,   top: '#5d5478', hor: '#c98a78', sun: '#ff7a50', si: .55, hs: '#7d7090', hg: '#5a4a4a', hi: .5,  fn: 60,  ff: 330, lamp: .85, night: .35 },
  { h: 21,   top: '#121a2d', hor: '#2c3450', sun: '#9fb4e0', si: .45, hs: '#3a4668', hg: '#1c1e28', hi: .45, fn: 50,  ff: 300, lamp: 1,   night: 1 },
  { h: 24,   top: '#0d1424', hor: '#232a42', sun: '#9fb4e0', si: .4,  hs: '#34405e', hg: '#181a22', hi: .42, fn: 50,  ff: 300, lamp: 1,   night: 1 }
];
function lightAt(h) {
  let i = 0;
  while (i < LIGHT.length - 2 && h > LIGHT[i + 1].h) i++;
  const a = LIGHT[i], b = LIGHT[i + 1], t = smooth(clamp((h - a.h) / (b.h - a.h)));
  const out = {};
  for (const k in a) {
    if (k === 'h') continue;
    out[k] = typeof a[k] === 'string' ? C(a[k]).lerp(C(b[k]), t) : lerp(a[k], b[k], t);
  }
  return out;
}

/* ---------- 材质 ---------- */
function gradientMap() {
  const d = new Uint8Array([90, 90, 90, 255, 175, 175, 175, 255, 255, 255, 255, 255]);
  const t = new THREE.DataTexture(d, 3, 1, THREE.RGBAFormat);
  t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true;
  return t;
}
const GM = gradientMap();
const matCache = {};
const M = (hex) => matCache[hex] || (matCache[hex] = new THREE.MeshToonMaterial({ color: hex, gradientMap: GM }));
const PAL = {
  wall: '#cfc6b4', brick: '#a9a49a', roof: '#6f7378', ridge: '#55585c', red: '#9b3b2e', redDoor: '#a5402f',
  wood: '#8a6a4c', ground: '#e8dfca', alley: '#d6cbb2', yard: '#ddd2bc', leaf: '#8f9b7c', leaf2: '#7f8c6f',
  trunk: '#6d5d4e', stone: '#bdb6a8', paper: '#efe6d2', pole: '#6a5f52'
};
const inkMat = new THREE.LineBasicMaterial({ color: '#3a342c', transparent: true, opacity: .85 });
const lanternMat = new THREE.MeshStandardMaterial({ color: '#b8322a', emissive: '#ff7a3a', emissiveIntensity: 0, roughness: .7 });
const windowMat = new THREE.MeshStandardMaterial({ color: '#7a5a3e', emissive: '#ffbf6a', emissiveIntensity: 0, roughness: 1 });

function ink(mesh, angle = 28) {
  const e = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, angle), inkMat);
  e.raycast = () => {};
  mesh.add(e);
  return mesh;
}
function mesh(geo, color, { shadow = true, edges = true, angle } = {}) {
  const m = new THREE.Mesh(geo, typeof color === 'string' ? M(color) : color);
  if (shadow) { m.castShadow = true; m.receiveShadow = true; }
  if (edges) ink(m, angle);
  return m;
}
function box(w, h, d, color, x = 0, y = 0, z = 0, opt) {
  const m = mesh(new THREE.BoxGeometry(w, h, d), color, opt);
  m.position.set(x, y + h / 2, z);
  return m;
}

/* ---------- 构件 ---------- */
// 坡屋顶：沿 x 方向延伸，屋面略带凹曲线（北方硬山顶）
function roof(w, d, h, o = .6, color = PAL.roof) {
  const g = new THREE.Group();
  const hd = d / 2 + o, L = w + o * 2;
  const s = new THREE.Shape();
  s.moveTo(-hd, -.1);
  s.quadraticCurveTo(-hd * .35, h * .18, 0, h);
  s.quadraticCurveTo(hd * .35, h * .18, hd, -.1);
  s.lineTo(hd, -.45);
  s.quadraticCurveTo(hd * .35, h * .18 - .35, 0, h - .35);
  s.quadraticCurveTo(-hd * .35, h * .18 - .35, -hd, -.45);
  const geo = new THREE.ExtrudeGeometry(s, { depth: L, bevelEnabled: false, curveSegments: 8 });
  geo.translate(0, 0, -L / 2); geo.rotateY(Math.PI / 2);
  g.add(mesh(geo, color, { angle: 35 }));
  // 瓦垄：细线增加手绘感
  const pts = [];
  for (let x = -L / 2 + .5; x < L / 2; x += .55) {
    pts.push(new THREE.Vector3(x, h - .02, 0), new THREE.Vector3(x, h * .3, hd * .72));
    pts.push(new THREE.Vector3(x, h - .02, 0), new THREE.Vector3(x, h * .3, -hd * .72));
  }
  const lg = new THREE.BufferGeometry().setFromPoints(pts);
  const lines = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({ color: '#4a4d52', transparent: true, opacity: .35 }));
  g.add(lines);
  const ridge = box(L, .45, .5, PAL.ridge, 0, h - .2, 0);
  g.add(ridge);
  // 屋脊两端微翘
  [-1, 1].forEach(sx => { const c = box(.5, .8, .55, PAL.ridge, sx * (L / 2 - .25), h - .1, 0); g.add(c); });
  return g;
}
// 房子：正面朝 +z
function house(w, d, wallH = 3.2, roofH = 2.2, { lit = false, color = PAL.wall } = {}) {
  const g = new THREE.Group();
  g.add(box(w, wallH, d, color));
  // 正面：红柱 + 槛窗
  const cols = Math.max(2, Math.round(w / 3.2));
  for (let i = 0; i <= cols; i++) {
    const x = -w / 2 + .25 + i * (w - .5) / cols;
    g.add(box(.28, wallH, .28, PAL.red, x, 0, d / 2 + .1, { edges: false }));
  }
  for (let i = 0; i < cols; i++) {
    const x = -w / 2 + .25 + (i + .5) * (w - .5) / cols;
    const win = new THREE.Mesh(new THREE.BoxGeometry((w - .5) / cols - .6, wallH * .5, .08), lit ? windowMat : M(PAL.wood));
    win.position.set(x, wallH * .55, d / 2 + .06);
    ink(win); g.add(win);
  }
  const r = roof(w, d, roofH);
  r.position.y = wallH;
  g.add(r);
  return g;
}
function wall(len, h = 2.8, color = PAL.brick) {
  const g = new THREE.Group();
  g.add(box(len, h, .5, color));
  const cap = box(len + .2, .35, .9, PAL.ridge, 0, h, 0);
  g.add(cap);
  return g;
}
function lantern(x, y, z, parent) {
  const l = new THREE.Mesh(new THREE.SphereGeometry(.32, 12, 8), lanternMat);
  l.scale.y = 1.25; l.position.set(x, y, z);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(.18, .18, .12, 8), M('#2f2b26'));
  cap.position.y = .42; l.add(cap);
  parent.add(l);
  return l;
}
// 宅门：门楼 + 红门 + 门墩 + 灯笼，正面朝 +z
function gate(withPlate = false) {
  const g = new THREE.Group();
  g.add(box(3.8, 3.4, 3, PAL.wall));
  const door = box(2.2, 2.6, .12, PAL.redDoor, 0, 0, 1.56);
  g.add(door);
  g.add(box(.05, 2.6, .14, '#4a1f18', 0, 0, 1.6, { edges: false }));
  [-.5, .5].forEach(x => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(.12, .03, 6, 12), M('#c99a4b'));
    ring.position.set(x * .5, 1.3, 1.65); g.add(ring);
  });
  [-1, 1].forEach(s => {
    const drum = mesh(new THREE.CylinderGeometry(.35, .35, .45, 14), PAL.stone);
    drum.rotation.x = Math.PI / 2; drum.position.set(s * 1.4, .55, 1.9); g.add(drum);
    g.add(box(.8, .3, .7, PAL.stone, s * 1.4, 0, 1.85));
  });
  g.add(box(3.4, .3, 1.2, PAL.stone, 0, 0, 2.1));
  const r = roof(3.8, 3, 1.5, .7);
  r.position.y = 3.4; g.add(r);
  g.userData.lanterns = [lantern(-1.3, 2.75, 1.85, g), lantern(1.3, 2.75, 1.85, g)];
  if (withPlate) {
    const plate = box(.7, .4, .06, '#2b4a72', 1.5, 2.1, 1.55);
    g.add(plate);
  }
  return g;
}
function tree(scale = 1, seed = 1) {
  const g = new THREE.Group();
  const rnd = mulberry(seed);
  const trunk = mesh(new THREE.CylinderGeometry(.35 * scale, .55 * scale, 5 * scale, 7), PAL.trunk);
  trunk.position.y = 2.5 * scale; g.add(trunk);
  for (let i = 0; i < 7; i++) {
    const r = (1.6 + rnd() * 1.4) * scale;
    const c = mesh(new THREE.IcosahedronGeometry(r, 0), i % 2 ? PAL.leaf : PAL.leaf2, { angle: 40 });
    const a = rnd() * Math.PI * 2, d = rnd() * 2.2 * scale;
    c.position.set(Math.cos(a) * d, (5 + rnd() * 2.6) * scale, Math.sin(a) * d);
    c.rotation.set(rnd() * 3, rnd() * 3, 0);
    g.add(c);
  }
  return g;
}
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

// 四合院：本地坐标 z=0 为临街，院子向 -z 延伸；门楼在东南角
function siheyuan(seed, { big = false, plate = false, noTree = false } = {}) {
  const g = new THREE.Group();
  const rnd = mulberry(seed);
  const W = big ? 30 : 22, D = big ? 30 : 26;
  const yard = new THREE.Mesh(new THREE.PlaneGeometry(W - 1, D - 1), M(PAL.yard));
  yard.rotation.x = -Math.PI / 2; yard.position.set(0, .02, -D / 2); yard.receiveShadow = true;
  g.add(yard);
  // 倒座房（背向胡同）
  const dz = house(W * .62, 5, 3, 2, {}); dz.rotation.y = Math.PI; dz.position.set(-W * .17, 0, -2.8); g.add(dz);
  // 门楼
  const gt = gate(plate); gt.position.set(W / 2 - 5, 0, -1.5); g.add(gt);
  g.userData.gate = gt;
  // 正房
  const zf = house(W * .7, 6.5, 3.6, 2.6, { lit: true }); zf.position.set(0, 0, -D + 4); g.add(zf);
  // 耳房
  [-1, 1].forEach(s => { const e = house(W * .12, 5, 3, 1.8); e.position.set(s * (W * .35 + W * .06), 0, -D + 3.6); g.add(e); });
  // 厢房
  [-1, 1].forEach(s => { const x = house(9, 5, 3.2, 2.1, { lit: rnd() > .4 }); x.rotation.y = -s * Math.PI / 2; x.position.set(s * (W / 2 - 3.3), 0, -D * .5); g.add(x); });
  // 围墙
  [-1, 1].forEach(s => { const w = wall(D); w.rotation.y = Math.PI / 2; w.position.set(s * (W / 2 - .25), 0, -D / 2); g.add(w); });
  const bw = wall(W); bw.position.set(0, 0, -D + .25); g.add(bw);
  // 院中树 / 鱼缸
  if (!noTree && (rnd() > .25 || big)) { const t = tree(big ? 1.25 : .9 + rnd() * .3, seed * 7); t.position.set((rnd() - .5) * 6, 0, -D * .5 + (rnd() - .5) * 4); g.add(t); g.userData.tree = t; }
  const tank = mesh(new THREE.CylinderGeometry(.9, .7, .8, 14), '#7d7468'); tank.position.set(-3, .4, -D * .42); g.add(tank);
  return g;
}

function operaStage() {
  const g = new THREE.Group();
  g.add(box(18, .25, 14, '#8d867a'));               // 台基（贴地）
  g.add(box(16, 1.4, 12, PAL.stone, 0, .2, 0));
  for (let k = 0; k < 3; k++) g.add(box(5, .45 * (k + 1), .55, PAL.stone, 0, 0, 6.0 + (2 - k) * .55)); // 台阶
  g.add(box(16.4, .2, 12.4, '#8d867a', 0, 1.6, 0));
  // 柱
  [[-6.5, 5], [6.5, 5], [-6.5, -5], [6.5, -5], [-2.2, 5], [2.2, 5]].forEach(([x, z]) => g.add(box(.55, 6, .55, PAL.red, x, 1.6, z)));
  // 后墙
  g.add(box(15, 6, .5, PAL.wall, 0, 1.6, -5.2));
  // 额枋
  g.add(box(14, .9, .5, '#2f5d8a', 0, 6.8, 5));
  g.add(box(4, .7, .2, '#c99a4b', 0, 6.85, 5.3));
  // 重檐
  const r1 = roof(16, 12, 2.4, 1.2); r1.position.y = 7.6; g.add(r1);
  const r2 = roof(11, 7, 2.8, 1); r2.position.y = 10.2; g.add(r2);
  g.add(box(11, 1.4, 7, PAL.wall, 0, 9.0, 0));
  // 翘角
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => {
    const c = mesh(new THREE.ConeGeometry(.35, 1.6, 6), PAL.ridge);
    c.position.set(sx * 8.9, 8.1, sz * 7); c.rotation.z = -sx * .9; c.rotation.x = sz * .5; g.add(c);
  });
  // 台口帷幔
  g.add(box(13, 1.2, .1, '#a5402f', 0, 5.6, 5.1, { edges: false }));
  g.userData.lanterns = [lantern(-4.5, 5.2, 5.6, g), lantern(4.5, 5.2, 5.6, g), lantern(-7, 5.2, 5.6, g), lantern(7, 5.2, 5.6, g)];
  return g;
}

function breakfastStall() {
  const g = new THREE.Group();
  g.add(box(3.2, 1, 1.6, PAL.wood));
  for (let i = 0; i < 3; i++) {
    const s = mesh(new THREE.CylinderGeometry(.55, .55, .35, 16), '#c9b48a');
    s.position.set(-.8, 1.2 + i * .36, 0); g.add(s);
  }
  const lid = mesh(new THREE.ConeGeometry(.6, .35, 16), '#b9a37a'); lid.position.set(-.8, 2.25, 0); g.add(lid); g.userData.lid = lid;
  const wok = mesh(new THREE.SphereGeometry(.55, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), '#3a3530'); wok.position.set(.8, 1.4, 0); g.add(wok);
  // 伞
  const pole = mesh(new THREE.CylinderGeometry(.05, .05, 3.6, 6), PAL.pole, { edges: false }); pole.position.set(1.8, 1.8, .6); g.add(pole);
  const um = mesh(new THREE.ConeGeometry(2.4, .9, 12, 1, true), M('#b8322a'), { angle: 10 }); um.material.side = THREE.DoubleSide; um.position.set(1.8, 3.7, .6); g.add(um);
  // 桌凳
  [[-.5, 2.4], [1.6, 2.6]].forEach(([x, z]) => { g.add(box(1.2, .75, .8, PAL.wood, x, 0, z)); g.add(box(.4, .45, .4, PAL.wood, x - .9, 0, z)); g.add(box(.4, .45, .4, PAL.wood, x + .9, 0, z)); });
  // 糖葫芦草把
  const straw = mesh(new THREE.CylinderGeometry(.22, .22, 1, 8), '#c9a75a'); straw.position.set(-2.1, 2.2, .4); g.add(straw);
  const sp = mesh(new THREE.CylinderGeometry(.03, .03, 2.4, 4), PAL.pole, { edges: false }); sp.position.set(-2.1, 1.2, .4); g.add(sp);
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * Math.PI * 2;
    const st = new THREE.Mesh(new THREE.CylinderGeometry(.03, .03, .7, 4), M('#7a5a3e'));
    st.position.set(-2.1 + Math.cos(a) * .3, 2.6, .4 + Math.sin(a) * .3); st.rotation.set(Math.sin(a) * .5, 0, -Math.cos(a) * .5); g.add(st);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(.09, 8, 6), M('#b8322a'));
    ball.position.set(-2.1 + Math.cos(a) * .45, 2.85, .4 + Math.sin(a) * .45); g.add(ball);
  }
  return g;
}
function store() {
  const g = house(8, 5, 3.2, 1.8, { lit: true, color: '#d6cdb9' });
  g.add(box(4.5, .9, .15, '#b8322a', 0, 3.3, 2.65));
  g.add(box(2.4, 1, .9, '#9fb3b8', -1.8, 0, 3));
  return g;
}
function kite() {
  const g = new THREE.Group();
  const s = new THREE.Shape();
  // 沙燕轮廓（简化）
  s.moveTo(0, 1.6); s.quadraticCurveTo(.6, 1.4, .5, .9); s.lineTo(2.6, 1.1); s.quadraticCurveTo(2.9, .4, 2.2, .2);
  s.lineTo(.6, .1); s.lineTo(.9, -1.6); s.lineTo(.2, -.9); s.lineTo(0, -1.2);
  s.lineTo(-.2, -.9); s.lineTo(-.9, -1.6); s.lineTo(-.6, .1); s.lineTo(-2.2, .2);
  s.quadraticCurveTo(-2.9, .4, -2.6, 1.1); s.lineTo(-.5, .9); s.quadraticCurveTo(-.6, 1.4, 0, 1.6);
  const geo = new THREE.ShapeGeometry(s);
  const m = new THREE.Mesh(geo, new THREE.MeshToonMaterial({ color: '#f1e7d2', gradientMap: GM, side: THREE.DoubleSide }));
  ink(m, 1); g.add(m);
  // 彩绘
  const c1 = new THREE.Mesh(new THREE.CircleGeometry(.35, 16), new THREE.MeshBasicMaterial({ color: '#b8322a', side: THREE.DoubleSide }));
  c1.position.set(1.4, .6, .01); g.add(c1);
  const c2 = c1.clone(); c2.position.x = -1.4; g.add(c2);
  const c3 = new THREE.Mesh(new THREE.CircleGeometry(.28, 16), new THREE.MeshBasicMaterial({ color: '#2f5d8a', side: THREE.DoubleSide }));
  c3.position.set(0, .9, .01); g.add(c3);
  g.scale.setScalar(1.3);
  return g;
}


/* ---------- 胡同里的人（低面数小人 + 简单动作） ---------- */
const SKIN = '#e3c09a';
function person({ shirt = '#5b6b7a', pants = '#3b3a40', hat = null, h = 1.7, kid = false, robe = false, hair = '#2b2724' } = {}) {
  const g = new THREE.Group(), k = h / 1.7;
  const legL = new THREE.Group(), legR = new THREE.Group(), armL = new THREE.Group(), armR = new THREE.Group(), body = new THREE.Group(), head = new THREE.Group();
  const hipY = .82 * k;
  [legL, legR].forEach((L, i) => {
    L.position.set((i ? .1 : -.1) * k, hipY, 0);
    const leg = mesh(new THREE.CylinderGeometry(.065 * k, .055 * k, .78 * k, 6), pants, { angle: 40 }); leg.position.y = -.39 * k; L.add(leg);
    const shoe = mesh(new THREE.BoxGeometry(.11 * k, .07 * k, .22 * k), '#2a2622', { edges: false }); shoe.position.set(0, -.79 * k, .04 * k); L.add(shoe);
    g.add(L);
  });
  body.position.y = hipY; g.add(body);
  const torso = robe
    ? mesh(new THREE.CylinderGeometry(.17 * k, .3 * k, 1.25 * k, 8), shirt, { angle: 40 })
    : mesh(new THREE.CylinderGeometry(.18 * k, .15 * k, .62 * k, 8), shirt, { angle: 40 });
  torso.position.y = robe ? .0 : .31 * k; body.add(torso);
  head.position.y = .72 * k; body.add(head);
  const hd = mesh(new THREE.SphereGeometry((kid ? .15 : .12) * k, 10, 8), SKIN, { angle: 60 }); hd.position.y = .1 * k; head.add(hd);
  const hr = mesh(new THREE.SphereGeometry((kid ? .155 : .125) * k, 10, 6, 0, Math.PI * 2, 0, Math.PI * .55), hair, { edges: false }); hr.position.y = .11 * k; hr.rotation.x = -.25; head.add(hr);
  if (hat === 'cap') { const c = mesh(new THREE.SphereGeometry(.13 * k, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), '#2b2724', { edges: false }); c.position.y = .15 * k; head.add(c);
    const kn = mesh(new THREE.SphereGeometry(.025 * k, 6, 4), '#b8322a', { edges: false }); kn.position.y = .28 * k; head.add(kn); }
  if (hat === 'straw') { const c = mesh(new THREE.ConeGeometry(.26 * k, .14 * k, 12), '#cdb27a', { angle: 50 }); c.position.y = .26 * k; head.add(c); }
  if (hat === 'opera') { const c = mesh(new THREE.CylinderGeometry(.13 * k, .15 * k, .2 * k, 8), '#c99a4b', { angle: 50 }); c.position.y = .26 * k; head.add(c);
    [-1, 1].forEach(sx => { const f = mesh(new THREE.ConeGeometry(.03 * k, .5 * k, 4), '#b8322a', { edges: false }); f.position.set(sx * .12 * k, .45 * k, -.05); f.rotation.z = -sx * .5; head.add(f); }); }
  [armL, armR].forEach((A, i) => {
    A.position.set((i ? .22 : -.22) * k, .58 * k, 0);
    const arm = mesh(new THREE.CylinderGeometry(.048 * k, .042 * k, .58 * k, 6), robe ? shirt : shirt, { angle: 40 }); arm.position.y = -.29 * k; A.add(arm);
    const hand = mesh(new THREE.SphereGeometry(.05 * k, 6, 5), SKIN, { edges: false }); hand.position.y = -.6 * k; A.add(hand);
    if (robe) { const sl = mesh(new THREE.BoxGeometry(.04 * k, .7 * k, .3 * k), '#f4ece0', { edges: false }); sl.position.set(0, -.85 * k, 0); A.add(sl); } // 水袖
    body.add(A);
  });
  g.userData = { legL, legR, armL, armR, body, head, k };
  return g;
}
function sitPose(p, stoolH = .45) {
  const u = p.userData; u.legL.rotation.x = u.legR.rotation.x = -1.45;
  p.position.y = stoolH - .82 * u.k + .05;
}

/* ---------- 初始化 ---------- */
export function initScene(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog('#f6eedb', 100, 450);
  const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, .5, 1500);

  const hemi = new THREE.HemisphereLight('#f2ece0', '#d8ccb4', .9);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight('#fff8ea', 2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, { left: -55, right: 55, top: 55, bottom: -55, near: 1, far: 600 });
  sun.shadow.bias = -.0005; sun.shadow.normalBias = .12;
  scene.add(sun); scene.add(sun.target);

  const world = new THREE.Group(); scene.add(world);
  const procedural = {};

  // 地面 + 胡同路面
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), M(PAL.ground));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; world.add(ground);
  const alley = new THREE.Mesh(new THREE.PlaneGeometry(250, 7), M(PAL.alley));
  alley.rotation.x = -Math.PI / 2; alley.position.y = .015; alley.receiveShadow = true; world.add(alley);
  // 路面石板缝
  const seams = [];
  for (let x = -125; x < 125; x += 1.6) seams.push(new THREE.Vector3(x, .03, -3.5), new THREE.Vector3(x + .2, .03, 3.5));
  world.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(seams), new THREE.LineBasicMaterial({ color: '#b9ad94', transparent: true, opacity: .5 })));

  const lanterns = [];
  const addCourt = (x, side, seed, opt = {}) => {
    const c = siheyuan(seed, opt);
    c.position.set(x, 0, side * 3.6);
    c.rotation.y = side < 0 ? 0 : Math.PI;
    world.add(c);
    lanterns.push(...c.userData.gate.userData.lanterns);
    return c;
  };
  const north = [[84, 3, { noTree: true }], [60, 5], [36, 8], [0, 11, { big: true }], [-26, 13, { plate: true }], [-50, 17], [-74, 19], [-98, 23]];
  const south = [[72, 29], [48, 31], [24, 37], [-2, 41], [-28, 43], [-52, 47]];
  const courts = {};
  north.forEach(([x, s, o]) => courts['n' + x] = addCourt(x, -1, s, o));
  south.forEach(([x, s, o]) => courts['s' + x] = addCourt(x, 1, s, o));
  procedural.siheyuan = courts.n0;

  // 胡同外围的远景屋顶（溶进雾里）
  const rndF = mulberry(99);
  for (let i = 0; i < 70; i++) {
    const x = -160 + rndF() * 320, side = rndF() > .5 ? 1 : -1, z = side * (38 + rndF() * 90);
    const h = house(8 + rndF() * 10, 5 + rndF() * 3, 3, 2);
    h.position.set(x, 0, z); h.rotation.y = rndF() > .5 ? 0 : Math.PI; world.add(h);
  }
  for (let i = 0; i < 40; i++) {
    const t = tree(.9 + rndF() * .6, i + 200);
    const side = rndF() > .5 ? 1 : -1;
    t.position.set(-170 + rndF() * 340, 0, side * (34 + rndF() * 100)); world.add(t);
  }

  // 戏楼（西头南侧）
  const opera = operaStage(); opera.position.set(-90, 0, 15); opera.rotation.y = Math.PI; world.add(opera);
  lanterns.push(...opera.userData.lanterns);
  procedural.opera = opera;
  // 戏班后台
  const back = house(8, 6, 3.2, 2, { lit: true }); back.position.set(-104, 0, 16); back.rotation.y = Math.PI; world.add(back);
  lanterns.push(lantern(-101, 2.8, 12.6, world), lantern(-107, 2.8, 12.6, world));
  // 戏楼前小广场
  const plaza = new THREE.Mesh(new THREE.PlaneGeometry(30, 12), M('#d9cdb3'));
  plaza.rotation.x = -Math.PI / 2; plaza.position.set(-92, .02, 6); plaza.receiveShadow = true; world.add(plaza);

  // 早点摊 / 小卖部（东头）
  const stall = breakfastStall(); stall.position.set(96, 0, 7); world.add(stall); procedural.stall = stall;
  const shop = store(); shop.position.set(108, 0, -7); world.add(shop); procedural.store = shop;
  lanterns.push(lantern(110.5, 3.1, -4.2, world));

  // 胡同两侧大槐树
  [[30, 4.6, 1.3], [64, 4.6, 1.2], [-62, -4.6, 1.3], [102, -4.4, 1.1], [-122, 4.6, 1.2]].forEach(([x, z, s], i) => {
    const t = tree(s, 500 + i); t.position.set(x, 0, z); world.add(t);
  });

  // 电线杆 + 电线
  const poleTops = [];
  for (let x = 116; x > -118; x -= 19) {
    const p = mesh(new THREE.CylinderGeometry(.12, .16, 8, 6), PAL.pole); p.position.set(x, 4, 4.3); world.add(p);
    const arm = box(1.6, .12, .12, PAL.pole, x, 7.3, 4.3); world.add(arm);
    poleTops.push(new THREE.Vector3(x, 7.4, 3.7), new THREE.Vector3(x, 7.4, 4.9));
  }
  const wirePts = [];
  for (let i = 0; i < poleTops.length - 2; i++) {
    const a = poleTops[i], b = poleTops[i + 2];
    for (let k = 0; k < 12; k++) {
      const t0 = k / 12, t1 = (k + 1) / 12;
      const sag = (t) => -Math.sin(t * Math.PI) * 1.1;
      wirePts.push(a.clone().lerp(b, t0).add(new THREE.Vector3(0, sag(t0), 0)), a.clone().lerp(b, t1).add(new THREE.Vector3(0, sag(t1), 0)));
    }
  }
  world.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(wirePts), inkMat));

  // 毛猴工作台（东侧院里，窗下一张桌子）
  const bench = new THREE.Group();
  bench.add(box(3, .9, 1.4, PAL.wood));
  bench.add(box(3.2, .1, 1.6, '#7a5a3e', 0, .9, 0));
  const mkMonkey = (x, z, r) => { const m = new THREE.Group();
    const body = mesh(new THREE.SphereGeometry(.13, 8, 6), '#8a6a4c'); body.scale.y = 1.4; body.position.y = .18; m.add(body);
    const head = mesh(new THREE.SphereGeometry(.09, 8, 6), '#b08a5a'); head.position.y = .38; m.add(head);
    [-1, 1].forEach(sx => { const a = mesh(new THREE.CylinderGeometry(.015, .015, .22, 4), '#6d4f36', { edges: false }); a.position.set(sx * .13, .22, 0); a.rotation.z = sx * .7; m.add(a); });
    m.position.set(x, 1, z); m.rotation.y = r; bench.add(m); return m; };
  mkMonkey(-.9, .2, .3); mkMonkey(-.4, -.1, -.5); mkMonkey(.2, .25, .8);
  // 迷你洋车
  const cart = box(.5, .25, .3, '#a5402f', .9, 1, 0); bench.add(cart);
  [-1, 1].forEach(sz => { const w = mesh(new THREE.TorusGeometry(.16, .025, 6, 12), '#2f2b26', { edges: false }); w.position.set(.9, 1.12, sz * .2); bench.add(w); });
  const lampB = lantern(1.2, 1.9, -.4, bench);
  lanterns.push(lampB);
  bench.position.set(84, 0, -15); world.add(bench);

  // 晾衣绳 + 自行车：胡同生活细节
  const clothesCols = ['#c9d2d6', '#b8322a', '#e8dcc0', '#7d8fa0', '#d9c38a'];
  [[56, -9, 6], [-44, -9, 5], [20, 10, 5]].forEach(([x, z, len], k) => {
    const pts = [new THREE.Vector3(x - len / 2, 2.6, z), new THREE.Vector3(x + len / 2, 2.6, z)];
    world.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), inkMat));
    for (let i = 0; i < 4; i++) { const c = mesh(new THREE.PlaneGeometry(.7, .9), new THREE.MeshToonMaterial({ color: clothesCols[(i + k) % 5], gradientMap: GM, side: THREE.DoubleSide }), { angle: 1 });
      c.position.set(x - len / 2 + .9 + i * (len - 1.8) / 3, 2.1, z); world.add(c); }
  });
  const bike = (x, z, r) => { const b = new THREE.Group(); const wm = M('#2f2b26');
    [-.55, .55].forEach(dx => { const w = new THREE.Mesh(new THREE.TorusGeometry(.33, .03, 6, 16), wm); w.position.set(dx, .35, 0); b.add(w); });
    const f = new THREE.Mesh(new THREE.BoxGeometry(1.1, .05, .05), wm); f.position.y = .62; f.rotation.z = .15; b.add(f);
    const st = new THREE.Mesh(new THREE.BoxGeometry(.05, .4, .05), wm); st.position.set(-.25, .55, 0); b.add(st);
    b.position.set(x, 0, z); b.rotation.y = r; world.add(b); };
  bike(90, -3, .1); bike(40, 3.1, 0); bike(-58, -3, .2); bike(-15, 3, -.1); bike(102, 3, .3);

  // 鸟笼（大院槐树下）
  const cage = new THREE.Group();
  const cageBody = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, .9, 12, 1, true), new THREE.MeshBasicMaterial({ color: '#6d5d4e', wireframe: true }));
  cage.add(cageBody);
  const cageTop = mesh(new THREE.ConeGeometry(.55, .4, 12), PAL.wood); cageTop.position.y = .65; cage.add(cageTop);
  cage.position.set(1.5, 4.2, -14); world.add(cage);

  // 风筝
  const kiteG = kite(); kiteG.position.set(-28, 15, 13); world.add(kiteG);
  const kiteLineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-28, 15, 13), new THREE.Vector3(-23.5, 6, 7), new THREE.Vector3(-19.7, 1.25, 2.9)]);
  const kiteLine = new THREE.Line(kiteLineGeo, inkMat); world.add(kiteLine);

  /* ---------- 人 ---------- */
  const people = [];
  const add = (p, x, y, z, ry, show, act) => { p.position.set(x, y, z); p.rotation.y = ry; p.userData.base = new THREE.Vector3(x, y, z); p.userData.show = show; p.userData.act = act; world.add(p); people.push(p); return p; };
  // 拂晓：扫街的大爷（胡同口）
  const sweeper = add(person({ shirt: '#3f5f7a', hat: 'cap' }), 112, 0, -1.8, -Math.PI / 2 + .4, [4.5, 9], 'sweep');
  const broom = new THREE.Group(); const bh = mesh(new THREE.CylinderGeometry(.02, .02, 1.4, 5), '#8a6a4c', { edges: false }); bh.position.y = -.4; broom.add(bh);
  const bb = mesh(new THREE.ConeGeometry(.22, .45, 6), '#c9b077', { angle: 50 }); bb.position.y = -1.15; bb.rotation.x = Math.PI; broom.add(bb);
  broom.position.set(0, -.55, .15); broom.rotation.x = .6; sweeper.userData.armR.add(broom);
  // 拂晓：提笼遛鸟的人
  const walker1 = add(person({ shirt: '#6b5a48', hat: 'cap' }), 104, 0, 1.6, -Math.PI / 2, [4.5, 10], 'walk');
  walker1.userData.path = { x0: 118, x1: 60, speed: .9 };
  const cage2 = new THREE.Group(); const cb = new THREE.Mesh(new THREE.CylinderGeometry(.15, .15, .3, 10, 1, true), new THREE.MeshBasicMaterial({ color: '#5a4a3a', wireframe: true })); cage2.add(cb);
  const cbt = mesh(new THREE.ConeGeometry(.17, .12, 10), '#8a6a4c', { edges: false }); cbt.position.y = .2; cage2.add(cbt); cage2.position.y = -.82; walker1.userData.armR.add(cage2);
  // 早点摊：摊主 + 两位食客
  const vendor = add(person({ shirt: '#efe6d2', pants: '#3b3a40' }), 95.2, 0, 5.7, 0, [5.2, 11], 'vendor');
  const apron = mesh(new THREE.BoxGeometry(.34, .5, .04), '#b8322a', { edges: false }); apron.position.set(0, .2, .17); vendor.userData.body.add(apron);
  [[97.6, 9.1, Math.PI + .3, '#5b6b7a'], [94.4, 9.3, Math.PI - .2, '#7a5a3e']].forEach(([x, z, r, c]) => {
    const d = add(person({ shirt: c, hat: x > 96 ? 'cap' : null }), x, 0, z, r, [5.8, 10.5], 'eat'); sitPose(d, .5);
  });
  // 毛猴艺人（工作台后坐着）
  const artisan = add(person({ shirt: '#4a5a6a', hat: null, hair: '#bdb6aa' }), 84, 0, -16.25, 0, [6, 12.5], 'craft'); sitPose(artisan, .55);
  // 四合院：槐树下两位下棋的大爷 + 小桌
  const chessT = new THREE.Group();
  chessT.add(box(.9, .06, .9, '#8a6a4c', 0, .68, 0)); chessT.add(box(.12, .68, .12, '#6d5d4e'));
  const board = new THREE.Mesh(new THREE.PlaneGeometry(.7, .7), new THREE.MeshBasicMaterial({ color: '#e8d9b0' })); board.rotation.x = -Math.PI / 2; board.position.y = .745; chessT.add(board);
  for (let i = 0; i < 10; i++) { const pc = new THREE.Mesh(new THREE.CylinderGeometry(.035, .035, .025, 10), M(i % 2 ? '#b8322a' : '#2b2724')); pc.position.set(-.28 + Math.random() * .56, .76, -.28 + Math.random() * .56); chessT.add(pc); }
  chessT.position.set(-1.5, 0, -16.5); world.add(chessT);
  const ch1 = add(person({ shirt: '#f2ede2', hair: '#cfc8bc' }), -2.4, 0, -16.5, Math.PI / 2, [10, 16.5], 'chess'); sitPose(ch1, .45);
  const ch2 = add(person({ shirt: '#4f6d8a', hat: 'cap', hair: '#cfc8bc' }), -.6, 0, -16.5, -Math.PI / 2, [10, 16.5], 'think'); sitPose(ch2, .45);
  const kibitz = add(person({ shirt: '#8a7a64', hair: '#9a9488' }), -1.4, 0, -17.6, 0, [10, 16.5], 'watch');
  // 放风筝的孩子（胡同里）
  const kid = add(person({ shirt: '#c23a2b', pants: '#2f5d8a', h: 1.15, kid: true }), -19.6, 0, 2.6, -.68, [12.5, 18], 'kite');
  // 戏楼：台上两位演员 + 台下观众
  add(person({ shirt: '#b8322a', robe: true, hat: 'opera' }), -91.5, 1.8, 11.6, 0, [16.5, 22], 'actor');
  add(person({ shirt: '#2f5d8a', robe: true, hat: 'opera' }), -88.3, 1.8, 11.2, Math.PI * .15, [16.5, 22], 'actor2');
  [[-94, 5.5], [-92.2, 5.2], [-90.2, 5.6], [-88.3, 5.1], [-93.2, 3.6], [-89.4, 3.5], [-91.2, 3.8]].forEach(([x, z], i) => {
    const a = add(person({ shirt: ['#5b6b7a', '#7a5a3e', '#3f5f7a', '#6b5a48', '#8a7a64', '#4a5a6a', '#9b3b2e'][i], hat: i % 3 ? null : 'cap' }), x, 0, z, 0, [17, 22], 'audience'); sitPose(a, .45);
  });
  // 后台：对镜勾脸的演员
  const makeup = add(person({ shirt: '#f4ece0', hair: '#2b2724' }), -103.4, 0, 12.4, Math.PI * .88, [18, 22.5], 'makeup'); sitPose(makeup, .5);
  // 深夜：提灯回家的人
  const night1 = add(person({ shirt: '#2f3440', hat: 'cap' }), 0, 0, -1.2, Math.PI / 2, [20.2, 25], 'walk');
  night1.userData.path = { x0: -60, x1: 40, speed: .8, dir: 1 };
  const nl = new THREE.Mesh(new THREE.SphereGeometry(.13, 10, 8), lanternMat); nl.position.y = -.75; night1.userData.armR.add(nl);
  const nlight = new THREE.PointLight('#ffb766', 0, 14, 1.6); nl.add(nlight); night1.userData.light = nlight;
  // 白天：骑车穿过胡同的人
  const rider = add(person({ shirt: '#efe6d2', pants: '#2f5d8a' }), 50, .25, 1.4, -Math.PI / 2, [7.5, 17.5], 'ride');
  rider.userData.path = { x0: 120, x1: -110, speed: 3.2 };
  const rb = new THREE.Group(); const wm = M('#2f2b26');
  [-.6, .6].forEach(dz => { const w = new THREE.Mesh(new THREE.TorusGeometry(.33, .03, 6, 16), wm); w.rotation.y = Math.PI / 2; w.position.set(0, -.25 + .08, dz); rb.add(w); });
  const fr = new THREE.Mesh(new THREE.BoxGeometry(.05, .05, 1.2), wm); fr.position.y = .25; rb.add(fr);
  rb.position.y = -.25; rider.add(rb); rider.userData.legL.rotation.x = -1.1; rider.userData.legR.rotation.x = -.7;
  rider.userData.armL.rotation.x = rider.userData.armR.rotation.x = -1.0; rider.userData.body.rotation.x = .25;

  function updatePeople(now, h) {
    const t = now / 1000;
    people.forEach(p => {
      const u = p.userData, [a, b] = u.show;
      const vis = h >= a && h <= b; p.visible = vis; if (!vis) return;
      switch (u.act) {
        case 'sweep': u.armR.rotation.x = -.6 + Math.sin(t * 2.4) * .45; u.armL.rotation.x = -.5 + Math.sin(t * 2.4) * .4; u.body.rotation.x = .25; u.body.rotation.y = Math.sin(t * 2.4) * .25; break;
        case 'walk': case 'ride': {
          const P = u.path, span = Math.abs(P.x1 - P.x0), dir = P.x1 > P.x0 ? 1 : -1;
          const d = (t * P.speed) % span; p.position.x = P.x0 + dir * d; p.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
          if (u.act === 'walk') { const s = Math.sin(t * P.speed * 5); u.legL.rotation.x = s * .5; u.legR.rotation.x = -s * .5; u.armL.rotation.x = -s * .35; u.armR.rotation.x = s * .12 - .05; p.position.y = Math.abs(Math.cos(t * P.speed * 5)) * .03; }
          else { const s = t * 6; u.legL.rotation.x = -1.1 + Math.sin(s) * .45; u.legR.rotation.x = -1.1 - Math.sin(s) * .45; }
          if (u.light) u.light.intensity = h > 20 ? 18 : 0;
          break; }
        case 'vendor': { const c = (t % 6) / 6; const lift = c < .3 ? Math.sin(c / .3 * Math.PI) : 0;
          u.armL.rotation.x = -lift * 1.9; u.armR.rotation.x = -.6; u.head.rotation.y = Math.sin(t * .7) * .3;
          if (stall.userData.lid) { stall.userData.lid.position.y = 2.25 + lift * .55; stall.userData.lid.rotation.z = lift * .35; }
          break; }
        case 'eat': u.armR.rotation.x = -1.2 + Math.max(0, Math.sin(t * 1.6 + p.position.x)) * -.5; u.head.rotation.x = .2 + Math.sin(t * 1.6 + p.position.x) * .08; break;
        case 'craft': u.armL.rotation.x = -1.05 + Math.sin(t * 3) * .08; u.armR.rotation.x = -1.1 + Math.sin(t * 3 + 1) * .1; u.armL.rotation.z = .35; u.armR.rotation.z = -.35; u.head.rotation.x = .45; break;
        case 'chess': { const c = (t % 7) / 7; const r = c > .7 ? Math.sin((c - .7) / .3 * Math.PI) : 0; u.armR.rotation.x = -.7 - r * .7; u.armL.rotation.x = -.5; u.head.rotation.x = .35; break; }
        case 'think': u.armL.rotation.x = -2.2; u.armL.rotation.z = .5; u.armR.rotation.x = -.5; u.head.rotation.x = .3 + Math.sin(t * .8) * .06; break;
        case 'watch': u.armL.rotation.z = .25; u.armR.rotation.z = -.25; u.armL.rotation.x = u.armR.rotation.x = .25; u.body.rotation.x = .18; u.head.rotation.x = .35; break;
        case 'kite': { u.armL.rotation.x = -2.0 + Math.sin(t * 1.8) * .15; u.armR.rotation.x = -1.7 + Math.sin(t * 1.8) * .2; u.head.rotation.x = -.55; p.position.y = Math.max(0, Math.sin(t * 3.2)) * .04;
          const pos = kiteLine.geometry.attributes.position; pos.setXYZ(0, kiteG.position.x, kiteG.position.y - .6, kiteG.position.z); pos.needsUpdate = true; break; }
        case 'actor': case 'actor2': { const ph = u.act === 'actor' ? 0 : 2; u.armL.rotation.z = .9 + Math.sin(t * .9 + ph) * .5; u.armR.rotation.z = -.9 - Math.sin(t * .9 + ph + 1) * .5; u.armL.rotation.x = -.4; p.rotation.y = Math.PI + (u.act === 'actor' ? .25 : -.35) + Math.sin(t * .45 + ph) * .6; break; }
        case 'audience': u.head.rotation.y = Math.sin(t * .5 + p.position.x) * .15; u.armL.rotation.x = u.armR.rotation.x = -.9; break;
        case 'makeup': u.armR.rotation.x = -2.1 + Math.sin(t * 2.5) * .1; u.armR.rotation.z = -.4; u.armL.rotation.x = -.8; u.head.rotation.x = -.05; break;
      }
    });
  }


  // 鸽群
  const pigeons = [];
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, .4, -.9, .1, 0, 0, 0, -.3, 0, 0, .4, .9, .1, 0, 0, 0, -.3], 3));
  pg.computeVertexNormals();
  const pmat = new THREE.MeshBasicMaterial({ color: '#4a443c', side: THREE.DoubleSide });
  for (let i = 0; i < 16; i++) { const p = new THREE.Mesh(pg.clone(), pmat); p.userData = { a: i / 16 * Math.PI * 2 + Math.random() * .3, r: 22 + Math.random() * 6, y: 26 + Math.random() * 4, ph: Math.random() * 6 }; world.add(p); pigeons.push(p); }

  // 早点摊蒸汽
  const steamTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); return new THREE.CanvasTexture(c); })();
  const steam = [];
  for (let i = 0; i < 14; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTex, transparent: true, depthWrite: false, opacity: 0 }));
    s.userData.ph = i / 14; world.add(s); steam.push(s);
  }

  // 夜间点光
  const pls = [[95, 3, 8], [109, 3, -3], [-20, 3, -2], [-90, 6, 9], [-104, 3, 11], [0, 3, -2], [60, 3, -2], [-50, 3, 2]].map(([x, y, z]) => {
    const l = new THREE.PointLight('#ffb766', 0, 22, 1.6); l.position.set(x, y, z); scene.add(l); return l;
  });

  /* ---------- Tripo 模型替换 ---------- */
  const loader = new GLTFLoader();
  fetch('models/manifest.json').then(r => r.ok ? r.json() : []).catch(() => []).then(list => list.forEach(key => {
    const slot = MODEL_SLOTS[key];
    if (!slot || !slot.pos) return;
    {
      loader.load(slot.file, (gltf) => {
        const obj = gltf.scene;
        const bb = new THREE.Box3().setFromObject(obj), size = bb.getSize(new THREE.Vector3());
        const s = slot.size / Math.max(size.x, size.z);
        obj.scale.setScalar(s);
        bb.setFromObject(obj); const c = bb.getCenter(new THREE.Vector3());
        obj.position.set(slot.pos[0] - c.x, slot.pos[1] - bb.min.y, slot.pos[2] - c.z);
        obj.rotation.y = slot.rotY || 0;
        obj.traverse(o => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; ink(o, 35); } });
        if (procedural[key]) procedural[key].visible = false;
        world.add(obj);
        console.log('[Tripo] 已载入', slot.file);
      });
    }
  }));

  /* ---------- 锚点（热点 3D 位置） ---------- */
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const anchors = {
    breakfast: V(95, 2.6, 7), store: V(108, 4.4, -4), maohou: V(84, 1.6, -15), yard: V(1.5, 4.2, -14),
    kite: V(-28, 15.5, 13), pigeon: V(40, 27, 0), opera: V(-90, 8, 9), mask: V(-104, 3, 12), gate: V(-20.6, 2.2, -2)
  };

  /* ---------- 更新 ---------- */
  const tmpP = new THREE.Vector3(), tmpT = new THREE.Vector3(), skyEl = document.getElementById('sky');
  let lastNight = -1;
  function update({ prog, h, ovT, mx, my, now, intro = 0 }) {
    const n = CAMS.length;
    const i = Math.min(n - 2, Math.floor(prog)), raw = prog - i;
    const e = smooth(clamp((raw - .18) / .64));
    const A = CAMS[i], B = CAMS[i + 1];
    tmpP.set(lerp(A.p[0], B.p[0], e), lerp(A.p[1], B.p[1], e), lerp(A.p[2], B.p[2], e));
    tmpT.set(lerp(A.t[0], B.t[0], e), lerp(A.t[1], B.t[1], e), lerp(A.t[2], B.t[2], e));
    // 飞行途中抬升，像无人机掠过屋顶
    const dist = Math.hypot(A.p[0] - B.p[0], A.p[2] - B.p[2]);
    tmpP.y += Math.sin(e * Math.PI) * Math.min(28, dist * .3);
    // 全图模式
    if (ovT > .001) {
      tmpP.lerp(V(40, 150, 170), ovT); tmpT.lerp(V(0, 0, -5), ovT);
    }
    // 首页推进：镜头从胡同口外往里走，落点正好是第一个镜头
    if (intro > 0) { const k = intro * intro * 22; tmpP.x += k; tmpT.x += k; tmpP.y += intro * .4; }
    tmpP.x += mx * 3; tmpP.y -= my * 2;
    camera.position.copy(tmpP); camera.lookAt(tmpT);

    const L = lightAt(h);
    skyEl.style.background = `linear-gradient(180deg, #${L.top.getHexString()} 0%, #${L.hor.getHexString()} 62%, #${L.hor.getHexString()} 100%)`;
    scene.fog.color.copy(L.hor); scene.fog.near = L.fn; scene.fog.far = L.ff;
    hemi.color.copy(L.hs); hemi.groundColor.copy(L.hg); hemi.intensity = L.hi;
    sun.color.copy(L.sun); sun.intensity = L.si;
    // 太阳东升西落；入夜换成月光
    const st = clamp((h - 5) / 14);
    const sunDir = h < 19.4 ? V(Math.cos(st * Math.PI) * 200, Math.sin(st * Math.PI) * 150 + 15, 110) : V(-90, 160, 80);
    sun.position.copy(tmpT).add(sunDir); sun.target.position.copy(tmpT);
    // 墨线：始终是深色墨线，夜里转为深靛
    inkMat.color.set('#3a342c').lerp(C('#0b0d14'), L.night); inkMat.opacity = .85 - L.night * .25;
    if (Math.abs(L.night - lastNight) > .01) {
      lastNight = L.night;
      Object.entries(matCache).forEach(([hex, m]) => m.color.set(hex).lerp(C('#1d2333'), L.night * .55));
    }
    lanternMat.emissiveIntensity = L.lamp * 2.2;
    windowMat.emissiveIntensity = L.lamp * 2.4;
    pls.forEach(l => l.intensity = L.lamp * 40);

    updatePeople(now, h);
    // 动画：风筝、鸽子、蒸汽
    kiteG.rotation.z = Math.sin(now / 900) * .12; kiteG.rotation.y = Math.PI + Math.sin(now / 1300) * .25;
    kiteG.position.y = 15 + Math.sin(now / 1100) * .6;
    const day = h > 5.6 && h < 18.5;
    pigeons.forEach(p => {
      const u = p.userData, a = u.a + now / 5200;
      p.visible = day;
      p.position.set(40 + Math.cos(a) * u.r, u.y + Math.sin(now / 700 + u.ph) * .6, Math.sin(a) * u.r * .7);
      p.rotation.y = -a; p.scale.set(1, 1 + Math.sin(now / 90 + u.ph) * .6, 1);
    });
    const so = h < 10.5 ? 1 : clamp(11.5 - h);
    steam.forEach(s => {
      const t = (s.userData.ph + now / 3500) % 1;
      s.position.set(95.2 + Math.sin(t * 6 + s.userData.ph * 9) * .3, 2.3 + t * 3.2, 7);
      s.scale.setScalar(.6 + t * 1.8); s.material.opacity = Math.sin(t * Math.PI) * .75 * so;
    });

    renderer.render(scene, camera);
    return { sunDir, night: L.night };
  }

  const proj = new THREE.Vector3();
  function project(v) {
    proj.copy(v).project(camera);
    const visible = proj.z < 1 && Math.abs(proj.x) < 1.1 && Math.abs(proj.y) < 1.1;
    return { x: (proj.x + 1) / 2 * innerWidth, y: (1 - proj.y) / 2 * innerHeight, visible, depth: camera.position.distanceTo(v) };
  }
  function projectDir(dir) { return project(camera.position.clone().add(dir.clone().normalize().multiplyScalar(800))); }

  addEventListener('resize', () => { renderer.setSize(innerWidth, innerHeight); camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); });

  /* ---------- 互动结果回写到 3D 世界 ---------- */
  let myMonkey = null;
  function addMaohou(obj) {
    if (myMonkey) bench.remove(myMonkey);
    const bb = new THREE.Box3().setFromObject(obj), sz = bb.getSize(new THREE.Vector3());
    obj.scale.multiplyScalar(.62 / sz.y);
    obj.position.set(-.1, 1.0, .35); obj.rotation.y = .75;
    obj.traverse(o => { if (o.isMesh) { o.castShadow = true; } });
    bench.add(obj); myMonkey = obj;
  }
  let myKite = null;
  function setKiteTexture(cv) {
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    kiteG.children.forEach(c => c.visible = false);
    if (myKite) kiteG.remove(myKite);
    const w = 5.8, h = w * cv.height / cv.width;
    myKite = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: .05, side: THREE.DoubleSide }));
    myKite.rotation.y = Math.PI; kiteG.add(myKite);
  }

  return { update, project, projectDir, anchors, addMaohou, setKiteTexture };
}
