"use strict";
// ================= 交互重绘：人物和场景有接触、或光线特殊的格子，拼好后用 fal 的 FLUX.2 klein 重绘一次 =================
// 拼接格照常 0.1 秒出图；需要重绘的格子在后台重绘，通过本地检查后替换。看当前时段时，下一个时段（剧情已预写）要重绘的格子也先画好。
// 依赖 index.html 的 CFG、logEntry、addCost、notify、sleep，以及 engine.js 的 ASSETS、POSES、PLACES、lightOf、stitch、spriteFor、
// ensureScene、panelTag、updatePanel、renderWorldHead、worldSig、trimBorders（都只在调用时用到，所以这个文件可以先于 engine.js 加载）

const FUSE_W = 768, FUSE_H = 960;
const CONTACTS = ["none", "sit", "lean", "hold"];
const SPECIAL_LIGHTS = ["normal", "spotlight", "backlit", "candle", "neon", "dark"];
const NIGHT_LIGHTS = ["show", "night", "late", "closing", "overtime", "party", "small_hours", "fog"];
let FUSE_OFF = null;  // fal 返回 Key 不对、余额不足时关掉，这次打开页面期间不再尝试
const fuseOn = () => !FUSE_OFF && CFG.fuse !== false && Number(CFG.fuseMax) > 0 && (CFG.mock || !!CFG.falKey);
const fuseModel = () => CFG.falModel || "fal-ai/flux-2/klein/9b/edit";

// ---------------- 分流：给这一格打分，2 分及以上重绘 ----------------
function fuseRoute(panel, info) {
  if (panel.render === "compose" || !panel.cast.length) return {score: 0, why: []};
  const why = [], it = panel.interaction || {};
  let score = 0;
  const seated = (info.poses || []).some(p => POSES[p] && POSES[p].contact === "seat");
  if (seated || (it.contact && it.contact !== "none")) {
    score += 3;
    why.push(seated ? "坐在场景的座位上" : `${{sit: "坐在", lean: "靠着", hold: "扶着"}[it.contact]}${it.target || "场景里的东西"}`);
  }
  const scene = ASSETS.scenes[panel.sceneKey] || {}, lt = scene.mainLight && scene.mainLight.type;
  if (it.light && it.light !== "normal") { score += 2; why.push("光线 " + it.light); }
  else if (["spot", "backlit", "low_key"].includes(lt)) { score += 2; why.push("场景光 " + lt); }
  else if (NIGHT_LIGHTS.includes(panel.light)) { score += 1; why.push("夜间光线"); }
  if (info.darkest != null && info.darkest < 0.3) { score += 1; why.push("环境很暗"); }
  if (score > 0 && panel.cam === "close") { score += 1; why.push("特写"); }
  return {score, why};
}

// ---------------- 重绘指令 ----------------
// 服装以第 1 张图为准，指令里不写服装：身份设定是"晚礼服或燕尾服"二选一，写进去模型会两样都画
const FUSE_EDGES = "Blend every character's edges naturally into the scene: no white outline, no light halo, no sticker-like edge around anyone. The picture fills the whole frame edge to edge: no border, no frame line, no margin.";
const FUSE_POSE_FIX = {
  sit_booth: who => `${who} sits on the booth bench right behind them: hips on the seat cushion, back against the backrest, legs naturally in front, partly hidden by the table if there is one. Remove any grey block or seat that was drawn under them.`,
  sit_stool: who => `${who} sits on the bar stool that is already drawn under them in Image 1. Keep that one stool and its legs on the floor; do not add another stool, chair or extra legs.`,
  type: who => `${who} sits at the desk and chair already drawn with them in Image 1; keep that one desk and chair standing on the floor, do not add another.`,
};
const FUSE_ANATOMY = "Every person has exactly two arms, two hands, two legs and two feet; no extra or detached limbs, and nobody appears twice.";
const FUSE_LIGHT = {
  spotlight: "A spotlight shines on them from above; the rest of the room is darker.",
  backlit: "The light comes from behind them: give them a bright rim light and darker fronts.",
  candle: "Warm, flickering candlelight from nearby.",
  neon: "Colored neon light spills onto them.",
  dark: "The room is dark; only dim light reaches them.",
};
const fuseName = id => id === "user" ? "the protagonist" : RESIDENTS[id] ? RESIDENTS[id].name_en.split(" ")[0] : id;
function fuseWhere(panel, id) {
  const a = panel.anchors && panel.anchors[id];
  return !a ? "" : a.x < 0.4 ? " (on the left)" : a.x > 0.6 ? " (on the right)" : " (in the middle)";
}
function fusePrompt(panel, info) {
  const people = panel.cast.slice(0, 3), it = panel.interaction || {};
  const refs = people.map((c, i) => `Image ${i + 2} is a reference of how ${fuseName(c.id)} looks in this panel (face, hair, clothes and colors) on a plain grey background; use it only for their look, do not copy its background or edges.`).join(" ");
  const lines = people.map((c, i) => `- ${fuseName(c.id)}${fuseWhere(panel, c.id)}: ${POSES[info.poses[i]] ? POSES[info.poses[i]].prompt_en : "standing"}.`);
  const fixes = people.map((c, i) => FUSE_POSE_FIX[info.poses[i]] ? FUSE_POSE_FIX[info.poses[i]](fuseName(c.id)) : "").filter(Boolean);
  if (it.contact && it.contact !== "none" && !fixes.length) {
    const who = fuseName(it.who || people[0].id), what = it.target || "the furniture next to them";
    fixes.push(`${who} ${{sit: "sits on", lean: "leans against", hold: "holds onto"}[it.contact]} the ${what} of the scene, with natural contact and no gap.`);
  }
  const place = PLACES[panel.place];
  return `Image 1 is a rough comic panel whose characters still look pasted on. Redraw it as one coherent, finished panel in the same art style.
Keep exactly as in Image 1: the camera, framing and zoom (do not zoom in, crop or move the camera), the background and furniture, and every character's position, size and pose.
Clothing is locked: each character wears exactly the clothes, colors, hair and accessories shown in Image 1. Do not add jackets, coats, shawls or extra layers, and do not change any color.
${FUSE_EDGES}
${FUSE_ANATOMY}
${refs}
Characters:
${lines.join("\n")}
${fixes.length ? "Fix the contact with the scene:\n" + fixes.map(f => "- " + f).join("\n") + "\n" : ""}Lighting: ${lightOf(panel.light)}.${place ? " Location: " + place.desc_en + "." : ""} ${FUSE_LIGHT[it.light] || ""} Relight the characters to match the background: the same light direction, color and brightness, with rim light if the light is behind them, and soft cast shadows and contact shadows on the floor.
Do not add or remove people. No text, no speech bubbles.`;
}

// ---------------- 调用 fal ----------------
// 图片直接以 data URI 发，同步返回；拼接格和参考图压成 WebP，返回也要 WebP，来回的数据量最小
async function toWebpUrl(blob, maxSide, bg) {
  const bmp = await createImageBitmap(blob);
  const k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  const g = c.getContext("2d");
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height); }
  g.drawImage(bmp, 0, 0, c.width, c.height);
  return c.toDataURL("image/webp", 0.85);
}
let falFormat = "webp", falWarmAt = 0;
// 走代理时建一次连接要好几个来回：重绘前先连一下，真正请求时就不用再握手
function warmFal() {
  if (CFG.mock || !fuseOn() || Date.now() - falWarmAt < 40000) return;
  falWarmAt = Date.now();
  fetch("https://fal.run/", {mode: "no-cors", cache: "no-store"}).catch(() => {});
}
function falPost(body) {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest(), t = {};
    const timing = () => {
      const now = performance.now(), up = t.up ?? t.head ?? t.end ?? now, head = t.head ?? t.end ?? now, end = t.end ?? now;
      return {upMs: Math.round(up - t.send), waitMs: Math.round(head - up), downMs: Math.round(end - head), totalMs: Math.round(end - t.send)};
    };
    x.open("POST", "https://fal.run/" + fuseModel());
    x.setRequestHeader("Authorization", "Key " + CFG.falKey);
    x.setRequestHeader("Content-Type", "application/json");
    x.timeout = 120000;
    x.upload.onload = () => { t.up = performance.now(); };
    x.onreadystatechange = () => { if (x.readyState >= 2 && t.head == null) t.head = performance.now(); };
    x.onload = () => { t.end = performance.now(); resolve({status: x.status, text: x.responseText, timing: timing()}); };
    const fail = why => () => { t.end = performance.now(); reject(Object.assign(new Error(why), {timing: timing()})); };
    x.onerror = fail("连不上 fal（网络错误，确认代理开着）"); x.ontimeout = fail("fal 超时"); x.onabort = fail("被中止");
    t.send = performance.now();
    x.send(body);
  });
}
async function falEdit(prompt, images, tag, seed, size) {
  if (CFG.mock) return mockFuse(images[0], tag);
  for (let attempt = 1; attempt <= 3; attempt++) {
    const W = (size && size.w) || FUSE_W, H = (size && size.h) || FUSE_H;
    const body = JSON.stringify({prompt, image_urls: images, image_size: {width: W, height: H}, output_format: falFormat, sync_mode: true, num_images: 1, ...(seed != null ? {seed} : {})});
    const entry = {type: "call", tag, model: "fal:" + fuseModel(), attempt, images: images.length, upKB: Math.round(body.length / 1024)};
    let res;
    try { res = await falPost(body); }
    catch (e) {
      Object.assign(entry, e.timing, {ok: false, error: e.message}); logEntry(entry);
      if (attempt < 2) { await sleep(1500); continue; }
      throw e;
    }
    Object.assign(entry, res.timing, {status: res.status, downKB: Math.round(res.text.length / 1024)});
    let data = null;
    try { data = JSON.parse(res.text); } catch (e) {}
    if (res.status !== 200) {
      entry.ok = false; entry.error = `fal ${res.status}：${res.text.slice(0, 200)}`; logEntry(entry);
      // 不支持 WebP 输出时退回 JPEG，记住以后都用 JPEG
      if (res.status === 422 && falFormat === "webp" && /output_format|webp/i.test(res.text)) { falFormat = "jpeg"; continue; }
      if ([401, 402, 403].includes(res.status)) {
        FUSE_OFF = res.status === 401 ? "fal Key 不对" : "fal 账户余额不足或被停用";
        notify(`交互重绘已暂停：${FUSE_OFF}（${res.text.slice(0, 80)}）。在设置里改好后刷新页面。`, true);
      }
      throw Object.assign(new Error(entry.error), {api: true});
    }
    const out = data && data.images && data.images[0];
    if (!out || !out.url) { entry.ok = false; entry.error = "fal 没有返回图片"; logEntry(entry); throw new Error(entry.error); }
    const f0 = performance.now();
    const blob = await (await fetch(out.url)).blob();
    if (!out.url.startsWith("data:")) { entry.downMs += Math.round(performance.now() - f0); entry.totalMs += Math.round(performance.now() - f0); }
    // fal 按百万像素计费（输入加输出），这里按每百万像素约 $0.01 估算，以 fal 后台账单为准
    const inMP = images.length * 0.25 + 0.5, cost = Math.round((inMP + W * H / 1e6) * 0.01 * 10000) / 10000;
    entry.ok = true; entry.cost = addCost({cost}); entry.costEstimated = true;
    const inf = data.timings && Number(data.timings.inference);
    if (Number.isFinite(inf)) entry.modelMs = Math.round(inf * 1000);
    logEntry(entry);
    return blob;
  }
  throw new Error("fal 重绘失败");
}
// 模拟模式：在拼接格上叠一层暖色，表示"重绘过"
async function mockFuse(dataUrl, tag) {
  const ms = 300 + Math.random() * 300; await sleep(ms);
  logEntry({type: "call", tag, model: "模拟", attempt: 1, ok: true, totalMs: Math.round(ms)});
  const bmp = await createImageBitmap(await (await fetch(dataUrl)).blob());
  const c = document.createElement("canvas"); c.width = FUSE_W; c.height = FUSE_H;
  const g = c.getContext("2d"); g.drawImage(bmp, 0, 0, FUSE_W, FUSE_H);
  g.globalAlpha = 0.08; g.fillStyle = "#ffb070"; g.fillRect(0, 0, FUSE_W, FUSE_H);
  return new Promise(r => c.toBlob(r, "image/webp", 0.85));
}

// ---------------- 本地检查（不花钱）：镜头有没有变、人物衣服颜色有没有大变、四周有没有画框 ----------------
async function gridOf(blob, w = 40, h = 50) {
  const bmp = await createImageBitmap(blob);
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d", {willReadFrequently: true}); g.drawImage(bmp, 0, 0, w, h);
  return {w, h, d: g.getImageData(0, 0, w, h).data};
}
const lumAt = (G, i) => 0.299 * G.d[i] + 0.587 * G.d[i + 1] + 0.114 * G.d[i + 2];
function meanLum(G) { let s = 0; for (let i = 0; i < G.d.length; i += 4) s += lumAt(G, i); return s / (G.d.length / 4); }
const fuseMedian = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] : 0; };
function regionStats(G, x0, y0, x1, y1, darkLimit) {
  let n = 0, r = 0, g = 0, b = 0, sat = 0, dark = 0;
  for (let y = Math.floor(clamp(y0, 0, 1) * G.h); y < Math.ceil(clamp(y1, 0, 1) * G.h); y++) for (let x = Math.floor(clamp(x0, 0, 1) * G.w); x < Math.ceil(clamp(x1, 0, 1) * G.w); x++) {
    const i = (y * G.w + x) * 4, R = G.d[i], Gr = G.d[i + 1], B = G.d[i + 2], mx = Math.max(R, Gr, B);
    r += R; g += Gr; b += B; sat += mx ? (mx - Math.min(R, Gr, B)) / mx : 0; if (lumAt(G, i) < darkLimit) dark++; n++;
  }
  const t = r + g + b || 1, k = Math.max(1, n);
  return {chroma: [r / t, g / t, b / t], mean: [r / k, g / k, b / k], sat: sat / k, dark: dark / k};
}
// 重绘本来就要"按场景重新打光"，模型会把整张画面的明暗、色调一起调。所以比较前先把两张图的整体亮度和色调对齐：
// 背景只看结构（物体、取景）有没有变，衣服只看"相对整张画面"的颜色有没有变。阈值见 FUSE_QC，日志里记下每次的数值，方便以后按实测校准
const FUSE_QC = {frame: 0.4, chroma: 0.12, sat: 0.45, dark: 0.4, keep: 0.06};  // 合成图校准：整体打光 0.02–0.03、聚光 0.24、放大 1.3 倍 0.88、平移 12% 0.83
function chanStats(G, cells) {
  const m = [0, 0, 0], v = [0, 0, 0];
  for (const i of cells) for (let c = 0; c < 3; c++) m[c] += G.d[i + c];
  for (let c = 0; c < 3; c++) m[c] /= cells.length;
  for (const i of cells) for (let c = 0; c < 3; c++) v[c] += (G.d[i + c] - m[c]) ** 2;
  return {m, sd: v.map(x => Math.max(8, Math.sqrt(x / cells.length)))};
}
// opts（城市模拟页用；漫画版用默认值）：
//   luma：背景只比明暗结构，不比颜色（klein 4B 常把整张画面调冷、把窗外变蓝，这不算镜头变了）
//   pad：人物框四周放宽（左右各 pad×框宽，往上 pad×0.3×框高，往下到画面底边），人被放大、挪一点不算背景变了
//        这时衣服的检查也改成：在放宽的范围里，原来衣服的颜色还占多少（人挪了、变大了也找得到）
function fuseQc(info, A, B, opts = {}) {
  const pad = opts.pad || 0;
  const boxes = Object.values(info.boxes || {}).map(b => pad ? [b[0] - pad * (b[2] - b[0]), b[1] - pad * 0.3 * (b[3] - b[1]), b[2] + pad * (b[2] - b[0]), 1] : b), all = [], bg = [];
  const inPerson = (x, y) => boxes.some(b => x >= b[0] - 0.03 && x <= b[2] + 0.03 && y >= b[1] - 0.03 && y <= b[3] + 0.03);
  for (let y = 0; y < A.h; y++) for (let x = 0; x < A.w; x++) {
    const i = (y * A.w + x) * 4;
    all.push(i);
    if (!inPerson((x + 0.5) / A.w, (y + 0.5) / A.h)) bg.push(i);
  }
  // 背景：每个颜色通道先按均值和离散程度归一（去掉整体变亮变暗、偏暖偏冷），再看每个小格差多少；只算人物以外的格子
  const cells = bg.length > all.length * 0.2 ? bg : all;
  const sa = chanStats(A, cells), sb = chanStats(B, cells), diffs = [];
  if (opts.luma) {
    const la0 = cells.map(i => lumAt(A, i)), lb0 = cells.map(i => lumAt(B, i));
    const st = v => { const m = v.reduce((a, b) => a + b, 0) / v.length; return [m, Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length) || 1]; };
    const [ma, da] = st(la0), [mb, db] = st(lb0);
    for (let k = 0; k < cells.length; k++) diffs.push(Math.abs((la0[k] - ma) / da - (lb0[k] - mb) / db));
  } else for (const i of cells) {
    let d = 0;
    for (let c = 0; c < 3; c++) d += ((A.d[i + c] - sa.m[c]) / sa.sd[c] - (B.d[i + c] - sb.m[c]) / sb.sd[c]) ** 2;
    diffs.push(Math.sqrt(d / 3));
  }
  const frame = fuseMedian(diffs), la = meanLum(A), lb = meanLum(B);
  const ga = chanStats(A, all).m, gb = chanStats(B, all).m, people = [];
  const satAll = G => regionStats(G, 0, 0, 1, 1, 0).sat;
  for (const [id, b] of Object.entries(info.boxes || {})) {
    const w = b[2] - b[0], h = b[3] - b[1], box = [b[0] + w * 0.25, b[1] + h * 0.18, b[2] - w * 0.25, b[1] + h * 0.55];
    const ra = regionStats(A, ...box, 0.45 * la), rb = regionStats(B, ...box, 0.45 * lb);
    // 衣服颜色除以整张画面的平均颜色：整体变暖、变暗不算换衣服
    const rel = (r, g) => { const v = r.mean.map((x, c) => x / Math.max(1, g[c])), t = v[0] + v[1] + v[2] || 1; return v.map(x => x / t); };
    const ca = rel(ra, ga), cb = rel(rb, gb);
    const chroma = ca.reduce((t, v, c) => t + Math.abs(v - cb[c]), 0);
    const satRatio = (rb.sat / Math.max(0.01, satAll(B))) / Math.max(0.01, ra.sat / Math.max(0.01, satAll(A))), darkUp = rb.dark - ra.dark;
    if (pad) {
      // 放宽的范围里，有多少小格的颜色（同样除以整体平均色）接近原来的衣服
      const pb = [b[0] - pad * w, b[1] - pad * 0.3 * h, b[2] + pad * w, 1];
      let hit = 0, n = 0;
      for (let y = 0; y < B.h; y++) for (let x = 0; x < B.w; x++) {
        const fx = (x + 0.5) / B.w, fy = (y + 0.5) / B.h;
        if (fx < pb[0] || fx > pb[2] || fy < pb[1] || fy > pb[3]) continue;
        const i = (y * B.w + x) * 4, v = [0, 1, 2].map(c => B.d[i + c] / Math.max(1, gb[c])), t = v[0] + v[1] + v[2] || 1;
        n++; if (v.reduce((a, x2, c) => a + Math.abs(x2 / t - ca[c]), 0) < FUSE_QC.chroma * 0.6) hit++;
      }
      const keep = n ? hit / n : 1;
      people.push({id, chroma: +chroma.toFixed(3), satRatio: +satRatio.toFixed(2), darkUp: +darkUp.toFixed(2), keep: +keep.toFixed(3), flag: keep < FUSE_QC.keep});
    } else people.push({id, chroma: +chroma.toFixed(3), satRatio: +satRatio.toFixed(2), darkUp: +darkUp.toFixed(2),
      flag: chroma > FUSE_QC.chroma || satRatio < FUSE_QC.sat || darkUp > FUSE_QC.dark});
  }
  return {frame: +frame.toFixed(3), frameFlag: frame > FUSE_QC.frame, people};
}
const qcNumbers = q => `背景 ${q.frame}` + q.people.map(x => ` · ${nameOf(x.id)} 颜色 ${x.chroma} 饱和度 ×${x.satRatio} 深色 ${x.darkUp >= 0 ? "+" : ""}${x.darkUp}`).join("") + (q.border && q.border.length ? ` · 边框 ${q.border.join("")}` : "");
async function borderSides(blob) {
  const bmp = await createImageBitmap(blob), G = await gridOf(blob, Math.round(bmp.width / 2), Math.round(bmp.height / 2)), sides = [];
  const dh = Math.round(G.h * 0.045), dw = Math.round(G.w * 0.045);
  const line = (vertical, k) => { const v = [], n = vertical ? G.h : G.w; for (let j = 0; j < n; j++) v.push(lumAt(G, (vertical ? j * G.w + k : k * G.w + j) * 4)); return v; };
  const stat = v => { const m = v.reduce((a, b) => a + b, 0) / v.length; return {m, sd: Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length)}; };
  for (const [name, vertical, outer, inner] of [["上", false, 0, dh], ["下", false, G.h - 1, G.h - 1 - dh], ["左", true, 0, dw], ["右", true, G.w - 1, G.w - 1 - dw]]) {
    const o = stat(line(vertical, outer)), i = stat([inner, inner + (outer ? -1 : 1), inner + (outer ? -2 : 2)].flatMap(k => line(vertical, k)));
    if (o.sd < 18 && Math.abs(o.m - i.m) > 25) sides.push(name);
  }
  return sides;
}
// 有画框时先试着裁掉再拉回原尺寸，比整张重画省钱
async function dropBorder(blob) {
  const {blob: cut, trim} = await trimBorders(blob);
  if (!trim) return null;
  const bmp = await createImageBitmap(cut), c = document.createElement("canvas"); c.width = FUSE_W; c.height = FUSE_H;
  c.getContext("2d").drawImage(bmp, 0, 0, FUSE_W, FUSE_H);
  return new Promise(r => c.toBlob(r, "image/webp", 0.9));
}
const qcText = q => [q.frameFlag ? `镜头或背景变了（${q.frame}）` : "", ...q.people.filter(x => x.flag).map(x => `${nameOf(x.id)}的衣服颜色变了`), q.border && q.border.length ? `有边框（${q.border.join("")}）` : "", ...(q.review || [])].filter(Boolean).join("、");

// 本地检查看不出多画的手脚、重复的人：通过本地检查后再让识别模型看一眼（约 1.5 秒、$0.001）
const FUSE_REVIEW = n => `Check this comic panel. It should show exactly ${n} ${n > 1 ? "people" : "person"}.
Return JSON: {"people_count": ${n}, "extra_limbs": false, "duplicate_person": false, "floating": false}
- people_count: clearly drawn people (ignore people inside pictures, posters, mirrors or far behind windows).
- extra_limbs: anyone has more than two arms, hands, legs or feet, or a limb that is not attached to a body.
- duplicate_person: the same character appears twice, including a faint or see-through copy.
- floating: a standing person whose feet are visible is clearly above the floor, or stands on top of a table, counter or chair.`;
async function fuseReview(blob, n, tag) {
  try {
    const r = await visionJson([FUSE_REVIEW(n), blob], {people_count: n, extra_limbs: false, duplicate_person: false, floating: false}, tag + " · 检查");
    const why = [];
    if (r && isFinite(r.people_count) && +r.people_count !== n) why.push(`人数是 ${r.people_count}，应该是 ${n}`);
    if (r && r.extra_limbs === true) why.push("多了手脚");
    if (r && r.duplicate_person === true) why.push("同一个人画了两次");
    if (r && r.floating === true) why.push("有人悬空或站在家具上");
    return why;
  } catch (e) { console.warn("重绘检查失败", e); return []; }  // 识别调不通时不拦着
}

// ---------------- 校色：把重绘图的色调拉回拼接图 ----------------
// klein（尤其 4B）常把整张画面调冷、调蓝，画面结构和人物都没问题。在 Lab 空间里把重绘图每个通道的均值和离散程度
// 对齐到拼接图（Reinhard 颜色迁移），色调回到原来的场景；strength 是对齐的力度（1 = 完全对齐）
function rgb2lab(r, g, b) {
  const f = v => (v /= 255) <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  const R = f(r), G = f(g), B = f(b);
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047, y = R * 0.2126 + G * 0.7152 + B * 0.0722, z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const h = t => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  const fx = h(x), fy = h(y), fz = h(z);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}
function lab2rgb(L, a, bb) {
  const fy = (L + 16) / 116, fx = fy + a / 500, fz = fy - bb / 200;
  const g3 = t => t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787;
  const x = g3(fx) * 0.95047, y = g3(fy), z = g3(fz) * 1.08883;
  const R = x * 3.2406 - y * 1.5372 - z * 0.4986, G = -x * 0.9689 + y * 1.8758 + z * 0.0415, B = x * 0.0557 - y * 0.2040 + z * 1.0570;
  const e = v => Math.round(255 * Math.min(1, Math.max(0, v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055)));
  return [e(R), e(G), e(B)];
}
async function labStats(blob, side = 96) {
  const bmp = await createImageBitmap(blob), k = side / Math.max(bmp.width, bmp.height);
  const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(bmp.width * k)); c.height = Math.max(1, Math.round(bmp.height * k));
  const g = c.getContext("2d", {willReadFrequently: true}); g.drawImage(bmp, 0, 0, c.width, c.height);
  const d = g.getImageData(0, 0, c.width, c.height).data, sum = [0, 0, 0], sq = [0, 0, 0], n = d.length / 4;
  for (let i = 0; i < d.length; i += 4) { const v = rgb2lab(d[i], d[i + 1], d[i + 2]); for (let k2 = 0; k2 < 3; k2++) { sum[k2] += v[k2]; sq[k2] += v[k2] * v[k2]; } }
  const m = sum.map(v => v / n);
  return {m, sd: sq.map((v, k2) => Math.sqrt(Math.max(1e-6, v / n - m[k2] * m[k2])))};
}
async function matchTone(blob, ref, strength = 1) {
  const [S, R] = await Promise.all([labStats(blob), labStats(ref)]);
  const bmp = await createImageBitmap(blob);
  const c = document.createElement("canvas"); c.width = bmp.width; c.height = bmp.height;
  const g = c.getContext("2d", {willReadFrequently: true}); g.drawImage(bmp, 0, 0);
  const img = g.getImageData(0, 0, c.width, c.height), d = img.data;
  // 亮度只对齐一半（保住重绘的明暗层次，不发灰）；冷暖两个通道完全对齐，但越鲜艳的颜色（比如绿裙子）挪得越少，免得衣服被染色
  const gain = [1 + (R.sd[0] / S.sd[0] - 1) * 0.5, R.sd[1] / S.sd[1], R.sd[2] / S.sd[2]].map(v => Math.min(2.5, Math.max(0.4, v)));
  const part = [0.5, 1, 1];
  for (let i = 0; i < d.length; i += 4) {
    const v = rgb2lab(d[i], d[i + 1], d[i + 2]);
    const keep = 1 - 0.85 * Math.min(1, Math.hypot(v[1] - S.m[1], v[2] - S.m[2]) / 30);
    const t = v.map((x, k2) => x + strength * part[k2] * (k2 ? keep : 1) * ((x - S.m[k2]) * gain[k2] + R.m[k2] - x));
    const o = lab2rgb(t[0], t[1], t[2]);
    d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2];
  }
  g.putImageData(img, 0, 0);
  return new Promise(r => c.toBlob(r, "image/jpeg", 0.92));
}

// ---------------- 重绘一格 ----------------
// opts（城市模拟页用来提速，漫画版用默认值）：attempts 重绘几次；review=false 时不在这里做识别检查，由调用方自己在后台做；
// side / refSide 发给 fal 的拼接图、动作参考图的长边；size 输出尺寸；refUrl(key, blob, side) 返回参考图在 fal 上的网址；
// tone 重绘图先按拼接图校色（0–1 力度）再检查；qc 传给 fuseQc 的选项；promptExtra 附加到重绘指令后面
async function fusePanel(panel, stitched, info, tag, opts = {}) {
  warmFal();
  const images = [await toWebpUrl(stitched, opts.side || FUSE_H)];
  for (const [i, c] of panel.cast.slice(0, 3).entries()) {
    const s = await spriteFor(c.id, info.poses[i]);
    // refUrl：调用方可以把参考图换成已经存在 fal 上的网址（同一张动作图不用每次重传）；拿不到就照旧内嵌
    const url = opts.refUrl ? await opts.refUrl(s.key, s.blob, opts.refSide || 384).catch(() => null) : null;
    images.push(url || await toWebpUrl(s.blob, opts.refSide || 384, "#d9d9d9"));
  }
  const prompt = fusePrompt(panel, info) + (opts.promptExtra ? "\n" + opts.promptExtra : ""), base = await gridOf(stitched);
  let last = null, lastBlob = null;
  for (let attempt = 1; attempt <= (opts.attempts || 2); attempt++) {
    let blob = await falEdit(prompt, images, tag, attempt > 1 ? Math.floor(Math.random() * 1e9) : undefined, opts.size);
    let border = await borderSides(blob);
    if (border.length) { const fixed = await dropBorder(blob); if (fixed) { blob = fixed; border = await borderSides(fixed); } }
    if (opts.tone) blob = await matchTone(blob, stitched, opts.tone);
    const q = {...fuseQc(info, base, await gridOf(blob), opts.qc || {}), border};
    if (!q.frameFlag && !q.people.some(x => x.flag) && !border.length) {
      if (opts.review === false) { logEntry({type: "local", tag: `${tag} · 第 ${attempt} 次通过检查`, note: qcNumbers(q) + "（识别检查在后台做）"}); return {blob, qc: q, attempt, reviewed: false}; }
      q.review = await fuseReview(blob, Math.min(3, panel.cast.length), tag);
      if (!q.review.length) { logEntry({type: "local", tag: `${tag} · 第 ${attempt} 次通过检查`, note: qcNumbers(q)}); return {blob, qc: q, attempt}; }
    }
    last = q; lastBlob = blob;
    logEntry({type: "local", tag: `${tag} · 第 ${attempt} 次没通过检查`, note: qcText(q) + "（" + qcNumbers(q) + "）"});
  }
  // 被拦下的重绘图也带出去：调用方可以给人看、让人自己决定用不用
  throw Object.assign(new Error(`${(opts.attempts || 2) > 1 ? "两次重绘都" : "重绘"}没通过检查：` + qcText(last)), {rejected: lastBlob, qc: last});
}
// 同一格的重绘只发一次：预先重绘还没完成时，正式出格直接等它
const FUSE_PENDING = new Map(), FUSE_CACHE = new Map(), FUSE_FAILED = new Set();
function fuseKey(panel) {
  const scene = ASSETS.scenes[panel.sceneKey] || {};
  const s = JSON.stringify([panel.place, panel.light, panel.cam, panel.focus, panel.cast.map(c => [c.id, c.pose, c.spot, c.facing]), panel.interaction || null, panel.sceneKey, scene.v, fuseModel()]);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
function fuseOnce(key, fn) {
  if (!FUSE_PENDING.has(key)) FUSE_PENDING.set(key, fn().finally(() => FUSE_PENDING.delete(key)));
  return FUSE_PENDING.get(key);
}
function fuseCacheTake(panel) {
  if (!panel.sceneKey) return null;
  const key = fuseKey(panel), hit = FUSE_CACHE.get(key);
  if (hit) FUSE_CACHE.delete(key);
  return hit || null;
}

// 拼接格出图后调用：分到重绘的格子在后台重绘，通过检查就替换
async function maybeFuse(panel, ph, stitched, info) {
  if (!fuseOn() || panel.fused || panel.fuseTried || panel.dead) return;
  const route = fuseRoute(panel, info);
  panel.route = route;
  if (route.score < 2) return;
  const {tag} = panelTag(panel);
  if (ph) {
    ph.fuseUsed = ph.fuseUsed || 0;
    if (ph.fuseUsed >= Number(CFG.fuseMax)) { logEntry({type: "local", tag: `${tag} · 不重绘：这个时段已经重绘了 ${ph.fuseUsed} 格（设置里的上限）`}); return; }
    ph.fuseUsed++;
  }
  const key = fuseKey(panel);
  if (FUSE_FAILED.has(key)) {
    if (ph) ph.fuseUsed = Math.max(0, ph.fuseUsed - 1);
    panel.fuseTried = true; saveSoon();
    logEntry({type: "local", tag: `${tag} · 不重绘：提前重绘时两次都没通过检查，保留拼接`});
    return;
  }
  panel.fusing = true; saveSoon(); updatePanel(panel); renderWorldHead();
  const t0 = Date.now();
  const rec = {type: "panel", tag: tag + " · 重绘", cast: [`${route.why.join("、")}（${route.score} 分）`], assetMs: 0};
  try {
    const pending = FUSE_PENDING.has(key);
    const r = await fuseOnce(key, () => fusePanel(panel, stitched, info, tag + " · 重绘"));
    FUSE_CACHE.delete(key);
    if (!panel.dead) { await putBlob("panel:" + panel.id, r.blob); panel.rendered = "fuse"; panel.fused = true; }
    rec.render = `重绘替换拼接${pending ? "（等预先重绘）" : ""}${r.attempt > 1 ? "（第 2 次才通过检查）" : ""}`;
  } catch (e) {
    console.warn(e);
    if (ph) ph.fuseUsed = Math.max(0, ph.fuseUsed - 1);
    panel.fuseTried = true;
    rec.render = "重绘没成功，保留拼接"; rec.error = e.message.slice(0, 160);
  }
  rec.renderMs = rec.totalMs = Date.now() - t0;
  logEntry(rec);
  panel.fusing = false; saveSoon(); updatePanel(panel); renderWorldHead();
}

// 后台预写好下一个时段后调用：把其中要重绘的格子先拼好、重绘好，放进缓存，正式出格时直接用
let prefuseJob = null;
async function prefuse(panels, sig) {
  if (!fuseOn()) return;
  const job = prefuseJob = {sig};
  let used = 0;
  warmFal();
  for (const [i, p] of panels.entries()) {
    if (prefuseJob !== job || worldSig() !== sig || used >= Number(CFG.fuseMax)) return;
    if (p.render === "compose" || !p.cast.length) continue;
    try {
      const tp = {...p, id: "pre" + i};
      tp.sceneKey = await ensureScene(tp.place, tp.light);
      const key = fuseKey(tp);
      if (FUSE_CACHE.has(key)) { used++; continue; }
      const {blob, anchors, info} = await stitch(tp, null);
      tp.anchors = anchors;
      const route = fuseRoute(tp, info);
      if (route.score < 2) continue;
      used++;
      const t0 = Date.now();
      const r = await fuseOnce(key, () => fusePanel(tp, blob, info, `预先重绘 下一个时段第 ${i + 1} 格`));
      FUSE_CACHE.set(key, {blob: r.blob, anchors, info, route});
      while (FUSE_CACHE.size > 24) FUSE_CACHE.delete(FUSE_CACHE.keys().next().value);
      logEntry({type: "local", tag: `预先重绘 下一个时段第 ${i + 1} 格：${route.why.join("、")}`, totalMs: Date.now() - t0});
    } catch (e) {
      console.warn("预先重绘失败", e);
      // 记住这一格没成功，正式出这一格时直接保留拼接，不再花钱重画
      try { FUSE_FAILED.add(fuseKey({...p, sceneKey: await ensureScene(p.place, p.light)})); } catch (e2) {}
    }
  }
}
