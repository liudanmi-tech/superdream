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
  sit_stool: who => `${who} sits on a bar stool of the scene, one foot on its footrest; the stool stands on the floor.`,
  type: who => `${who} sits at the desk typing; chair, desk and typewriter stand firmly on the floor.`,
};
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
async function falEdit(prompt, images, tag, seed) {
  if (CFG.mock) return mockFuse(images[0], tag);
  for (let attempt = 1; attempt <= 3; attempt++) {
    const body = JSON.stringify({prompt, image_urls: images, image_size: {width: FUSE_W, height: FUSE_H}, output_format: falFormat, sync_mode: true, num_images: 1, ...(seed != null ? {seed} : {})});
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
    const inMP = images.length * 0.25 + 0.5, cost = Math.round((inMP + FUSE_W * FUSE_H / 1e6) * 0.01 * 10000) / 10000;
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
  const t = r + g + b || 1;
  return {chroma: [r / t, g / t, b / t], sat: sat / Math.max(1, n), dark: dark / Math.max(1, n)};
}
// 阈值按测试页的结果定：换了衣服（绿裙子加黑外套）时颜色、深色占比都会大变；只是重新打光时变化小得多
function fuseQc(info, A, B) {
  const la = meanLum(A), lb = meanLum(B), k = la / Math.max(1, lb), diffs = [];
  for (let i = 0; i < A.d.length; i += 4) diffs.push(Math.hypot(A.d[i] - B.d[i] * k, A.d[i + 1] - B.d[i + 1] * k, A.d[i + 2] - B.d[i + 2] * k) / 441.7);
  const frame = fuseMedian(diffs), people = [];
  for (const [id, b] of Object.entries(info.boxes || {})) {
    const w = b[2] - b[0], h = b[3] - b[1], box = [b[0] + w * 0.25, b[1] + h * 0.18, b[2] - w * 0.25, b[1] + h * 0.55];
    const sa = regionStats(A, ...box, 0.45 * la), sb = regionStats(B, ...box, 0.45 * lb);
    const chroma = sa.chroma.reduce((s, v, i) => s + Math.abs(v - sb.chroma[i]), 0), satRatio = sb.sat / Math.max(0.01, sa.sat), darkUp = sb.dark - sa.dark;
    people.push({id, chroma: +chroma.toFixed(3), satRatio: +satRatio.toFixed(2), darkUp: +darkUp.toFixed(2), flag: chroma > 0.15 || satRatio < 0.5 || darkUp > 0.4});
  }
  return {frame: +frame.toFixed(3), frameFlag: frame > 0.12, people};
}
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
const qcText = q => [q.frameFlag ? `镜头或背景变了（${q.frame}）` : "", ...q.people.filter(x => x.flag).map(x => `${nameOf(x.id)}的衣服颜色变了`), q.border && q.border.length ? `有边框（${q.border.join("")}）` : ""].filter(Boolean).join("、");

// ---------------- 重绘一格 ----------------
async function fusePanel(panel, stitched, info, tag) {
  warmFal();
  const images = [await toWebpUrl(stitched, FUSE_H)];
  for (const [i, c] of panel.cast.slice(0, 3).entries()) {
    const s = await spriteFor(c.id, info.poses[i]);
    images.push(await toWebpUrl(s.blob, 384, "#d9d9d9"));
  }
  const prompt = fusePrompt(panel, info), base = await gridOf(stitched);
  let last = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    let blob = await falEdit(prompt, images, tag, attempt > 1 ? Math.floor(Math.random() * 1e9) : undefined);
    let border = await borderSides(blob);
    if (border.length) { const fixed = await dropBorder(blob); if (fixed && !(await borderSides(fixed)).length) { blob = fixed; border = []; } }
    const q = {...fuseQc(info, base, await gridOf(blob)), border};
    if (!q.frameFlag && !q.people.some(x => x.flag) && !border.length) return {blob, qc: q, attempt};
    last = q;
    logEntry({type: "local", tag: `${tag} · 第 ${attempt} 次没通过检查`, note: qcText(q)});
  }
  throw new Error("两次重绘都没通过检查：" + qcText(last));
}
// 同一格的重绘只发一次：预先重绘还没完成时，正式出格直接等它
const FUSE_PENDING = new Map(), FUSE_CACHE = new Map();
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
  panel.fusing = true; saveSoon(); updatePanel(panel); renderWorldHead();
  const t0 = Date.now(), key = fuseKey(panel);
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
    } catch (e) { console.warn("预先重绘失败", e); }
  }
}
