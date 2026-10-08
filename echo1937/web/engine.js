"use strict";
// ================= 世界：素材、叙事、出图、观察、夺舍 =================
// 依赖 index.html 里的 W、S、CFG、store、openrouter、visionJson、genImage、generateSprite 等

const PHASES = W.phases;
const PLACES = Object.fromEntries(W.places.map(p => [p.id, p]));
const RESIDENTS = Object.fromEntries(W.residents.map(r => [r.id, r]));
const DAYS = Object.fromEntries(W.chapter1.days.map(d => [d.day, d]));
const LAST_DAY = W.chapter1.days.length;
const COMPOSE_PER_DAY = 3;
const STORY_FALLBACKS = ["anthropic/claude-sonnet-5.5", "anthropic/claude-sonnet-4.5", "anthropic/claude-sonnet-4"];
const PANEL_W = 800, PANEL_H = 1000;
const SPOT_IDS = ["left", "center", "right", "front"];
const POSE_FACING = {look_back: "right"};

// 每种光线：生图用的描述，以及拼接时给人物调色的参数（色调、强度、亮度）
const LIGHTS = {
  dawn: ["early dawn, pale blue-gold light through the window", "#8fa6c8", 0.10, 0.95],
  morning: ["bright morning sunlight, warm gold and mint green", "#ffd9a0", 0.06, 1],
  afternoon: ["warm afternoon sunlight", "#ffcf8a", 0.08, 1],
  evening: ["golden evening light, long shadows", "#ff9f6b", 0.12, 0.95],
  dusk: ["dusk, orange and violet sky", "#c27aa0", 0.14, 0.9],
  sunset: ["sunset, deep orange sky over the sea", "#ff8a5c", 0.15, 0.92],
  night: ["night, deep blue with warm amber lamps", "#3a3f78", 0.18, 0.82],
  late: ["late night, a single lamp, deep blue shadows", "#2c2f5e", 0.22, 0.75],
  rehearsal: ["daytime rehearsal, house lights on, dusty sunbeams", "#e8d2a8", 0.06, 1],
  show: ["showtime, a spotlight on the stage, neon pink and deep blue", "#3a2a5a", 0.18, 0.85],
  closing: ["after closing, chairs stacked on tables, dim amber lamps", "#4a3a3a", 0.18, 0.8],
  preshow: ["before the show, warm bulb-mirror light", "#ffcc88", 0.10, 0.95],
  overtime: ["working late at night, green desk lamps in the dark", "#2f4a3a", 0.18, 0.8],
  party: ["a glittering party night, chandeliers and lanterns", "#5a3a6a", 0.14, 0.9],
  small_hours: ["the small hours after the party, blue moonlight", "#2a3050", 0.22, 0.75],
  day: ["bright daytime sun over the sea", "#bfe3ff", 0.05, 1],
  fog: ["night fog, lamp posts glowing amber in the mist", "#7a8090", 0.20, 0.85],
};
const PHASE_LIGHT = {
  dawn: ["dawn", "morning", "day", "rehearsal", "preshow"],
  morning: ["morning", "day", "rehearsal", "dawn"],
  afternoon: ["afternoon", "day", "rehearsal", "morning"],
  evening: ["evening", "dusk", "sunset", "preshow", "afternoon"],
  night: ["night", "show", "party", "overtime", "fog", "evening"],
  late: ["late", "closing", "small_hours", "fog", "night", "overtime"],
};
const DEFAULT_SPOTS = [{id: "left", x: 0.3, y: 0.86, scale: 1}, {id: "center", x: 0.5, y: 0.84, scale: 1},
  {id: "right", x: 0.7, y: 0.86, scale: 1}, {id: "front", x: 0.5, y: 0.95, scale: 1.2}];

// 场景底图和常驻角色是所有人共用的素材，删除个人数据时保留
let ASSETS = {scenes: {}, residents: {}};
const saveAssets = () => store.set("assets", ASSETS);
const inflight = {};
function once(key, fn) {
  if (!inflight[key]) inflight[key] = fn().finally(() => delete inflight[key]);
  return inflight[key];
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const nameOf = id => id === "user" ? "你" : (RESIDENTS[id] ? RESIDENTS[id].name : id);
const lightOf = l => LIGHTS[l] || [l, null, 0, 1];
let worldBusy = false;

// ---------------- 世界状态 ----------------
function freshWorld() {
  const rel = {};
  for (const r of W.residents) rel[r.id] = r.id === "mae" ? {a: 40, t: 40} : {a: 20, t: 20};
  return {day: 1, next: 0, pace: "fast", rel, relStart: {1: JSON.parse(JSON.stringify(rel))}, timeline: [],
    diaries: {}, decisions: [], composeUsed: {}, viewDay: 1, done: false};
}
async function loadWorld() {
  ASSETS = await store.get("assets") || {scenes: {}, residents: {}};
  if (S.approved && (!S.world || !Array.isArray(S.world.timeline))) S.world = freshWorld();
  if (!S.world || !Array.isArray(S.world.timeline)) return;
  const ids = [];
  for (const ph of S.world.timeline) for (const p of ph.panels) ids.push("panel:" + p.id);
  await preloadUrls(ids);
  // 上次关页面时没画完的画格，重新画
  for (const ph of S.world.timeline) for (const p of ph.panels) {
    if (p.status === "queued" || p.status === "drawing") { p.status = "queued"; drawLater(p); }
    // 关键时刻合成到一半关了页面：退回名额，重新合成
    if (p.upgrading) { p.upgrading = false; S.world.composeUsed[p.day] = Math.max(0, (S.world.composeUsed[p.day] || 1) - 1); setTimeout(() => upgradeToCompose(p), 0); }
  }
  for (const ph of S.world.timeline) if (ph.writing) { ph.writing = false; if (!ph.t || !ph.t.story) S.world.timeline = S.world.timeline.filter(x => x !== ph); }
  if (S.view === "world") setTimeout(schedulePrefetch, 1500);
}
async function deleteWorldBlobs() {
  if (!S.world || !Array.isArray(S.world.timeline)) return;
  for (const ph of S.world.timeline) for (const p of ph.panels) await delBlob("panel:" + p.id);
}
function enterWorld() {
  if (!S.world || !Array.isArray(S.world.timeline)) S.world = freshWorld();
  S.view = "world"; S.entered = true; save(); render();
  window.scrollTo(0, 0);
  if (!S.world.timeline.length && live()) nextPhase();
  else schedulePrefetch();
}

// ---------------- 素材：场景底图（第一次用到时生成） ----------------
function lightFor(place, phaseId, wanted) {
  const p = PLACES[place];
  if (wanted && p.lights.includes(wanted)) return wanted;
  for (const l of PHASE_LIGHT[phaseId] || []) if (p.lights.includes(l)) return l;
  return p.lights[0];
}
function scenePrompt(place, light) {
  return `A vertical-webtoon background illustration in the style of the reference images.
Location: ${place.desc_en}, Los Angeles, 1937. Art Deco details, period-accurate cars, signage and furniture, no real brand names.
Lighting: ${lightOf(light)[0]}.
Composition: wide establishing shot, eye-level camera, clear floor area in the lower third where characters can stand. NO people in the scene.
Clean line art, flat colors with soft shading, subtle film grain. No text.`;
}
const SPOT_PROMPT = `This is a background illustration for a comic. Characters will be pasted standing on its floor.
Return JSON: {"ground_y": 0.8, "spots": [{"x": 0.3, "y": 0.86, "scale": 1.0}]}
- ground_y: the vertical position (0 = top, 1 = bottom) of the floor line at mid depth.
- spots: 3 to 5 places on the visible floor where a standing person's FEET could be, as fractions of width (x) and height (y).
  Spread them left to right. scale is the person's size there relative to mid depth: nearer spots 1.1–1.4, farther 0.7–0.9.
  Never put a spot on furniture, walls, water or the sky.`;

async function ensureScene(place, light) {
  const key = `${place}:${light}`;
  if (ASSETS.scenes[key]) return key;
  return once("scene:" + key, async () => {
    const p = PLACES[place];
    const sibling = p.lights.find(l => ASSETS.scenes[`${place}:${l}`]);
    let parts;
    if (sibling) {
      // 同一地点已有别的光线版本：拿它做参考只改光线，布局不变
      parts = [`Redraw this exact same location with the same layout, camera angle and furniture. Only change the lighting and time of day to: ${lightOf(light)[0]}. Keep the art style. NO people in the scene. No text.`,
        "Reference (same place, different time of day):", await getBlob(`scene:${place}:${sibling}`)];
    } else {
      parts = [scenePrompt(p, light)];
      const styles = await styleBlobs(3);
      if (styles.length) parts.push("Style references (art style only):", ...styles);
    }
    const blob = await genImage(parts, "3:2", "scene", key, `场景 ${p.label}·${light}${sibling ? "（参考已有光线版本）" : ""}`);
    const spots = sibling ? {ground_y: ASSETS.scenes[`${place}:${sibling}`].ground_y, spots: ASSETS.scenes[`${place}:${sibling}`].spots} : await annotateScene(blob, p.label);
    await putBlob("scene:" + key, blob);
    ASSETS.scenes[key] = {place, light, ...spots};
    await saveAssets();
    return key;
  });
}
async function annotateScene(blob, label) {
  let raw = {};
  try { raw = await visionJson([SPOT_PROMPT, blob], {ground_y: 0.82, spots: DEFAULT_SPOTS}, `标站位 ${label}`); } catch (e) { console.warn("标站位失败", e); }
  const list = (raw && Array.isArray(raw.spots) ? raw.spots : []).filter(s => s && isFinite(s.x) && isFinite(s.y))
    .map(s => ({x: clamp(+s.x, 0.12, 0.88), y: clamp(+s.y, 0.6, 0.97), scale: clamp(+s.scale || 1, 0.6, 1.5)}))
    .sort((a, b) => a.x - b.x).slice(0, 5);
  // 统一成 left / center / right / front 四个站位，方便叙事模型引用
  let spots = DEFAULT_SPOTS;
  if (list.length >= 3) {
    const mid = list[Math.floor(list.length / 2)], front = list.reduce((a, b) => (b.y > a.y ? b : a));
    spots = [{id: "left", ...list[0]}, {id: "center", ...mid}, {id: "right", ...list[list.length - 1]}, {id: "front", ...front, scale: Math.max(front.scale, 1.1)}];
  }
  return {ground_y: clamp(+(raw && raw.ground_y) || 0.82, 0.55, 0.95), spots};
}

// ---------------- 素材：常驻角色（第一次出场时生成设定图，第一次用到某个动作时生成动作图） ----------------
function residentSheetPrompt(r) {
  return `Create a character reference sheet of an original fictional character in the art style of the style references (${STYLE_EN}). Do not base the character on any real person.
Character: ${r.name_en}, ${r.age} years old, ${r.role}. Appearance: ${r.appearance_en}. Outfit: ${r.outfit_en}. Setting: Los Angeles, 1937.
Layout: full-body front view, three-quarter view and side view, plus four head close-ups: neutral, smiling, surprised, sad.
Plain light grey background, even studio lighting, no text, no other people.`;
}
function residentAsset(id) { return ASSETS.residents[id] || (ASSETS.residents[id] = {sheet: false, poses: {}}); }
async function ensureResidentSheet(id) {
  if (residentAsset(id).sheet) return;
  return once("rsheet:" + id, async () => {
    const parts = [residentSheetPrompt(RESIDENTS[id])];
    const styles = await styleBlobs(2);
    if (styles.length) parts.push("Style references (copy the art style only, not the content):", ...styles);
    await putBlob(`res:${id}:sheet`, await genImage(parts, "3:2", "sheet", "res-" + id, `${RESIDENTS[id].name}·设定图`));
    residentAsset(id).sheet = true;
    await saveAssets();
  });
}
async function ensureResidentSprite(id, pose) {
  await ensureResidentSheet(id);
  if (residentAsset(id).poses[pose]) return;
  return once(`rsprite:${id}:${pose}`, async () => {
    const out = await generateSprite(await getBlob(`res:${id}:sheet`), null, pose, RESIDENTS[id].outfit_en, RESIDENTS[id].name);
    const version = Date.now();
    await putBlob(`res:${id}:${pose}:${version}`, out.blob);
    residentAsset(id).poses[pose] = {version, meta: out.meta, status: out.status};
    await saveAssets();
  });
}
async function spriteFor(who, pose) {
  if (who === "user") {
    const ok = sp => sp && sp.version && (sp.status === "ready" || sp.status === "qc_warn");
    if (!ok(S.sprites[pose])) pose = "stand";
    const sp = S.sprites[pose];
    return {blob: await getBlob(`sprite:${pose}:${sp.version}`), meta: sp.meta, pose};
  }
  try { await ensureResidentSprite(who, pose); }
  catch (e) { if (pose === "stand") throw e; console.warn(e); pose = "stand"; await ensureResidentSprite(who, pose); }
  const P = residentAsset(who).poses[pose];
  return {blob: await getBlob(`res:${who}:${pose}:${P.version}`), meta: P.meta, pose};
}

// ---------------- 拼接格 ----------------
let GRAIN = null;
function grain(g) {
  if (!GRAIN) {
    GRAIN = document.createElement("canvas"); GRAIN.width = GRAIN.height = 128;
    const gg = GRAIN.getContext("2d"), img = gg.createImageData(128, 128);
    for (let i = 0; i < img.data.length; i += 4) { const v = Math.random() * 255; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; }
    gg.putImageData(img, 0, 0);
  }
  g.save(); g.globalAlpha = 0.06; g.globalCompositeOperation = "overlay";
  g.fillStyle = g.createPattern(GRAIN, "repeat"); g.fillRect(0, 0, PANEL_W, PANEL_H); g.restore();
}
function gradeSprite(img, light, flip) {
  const [, tint, strength, bright] = lightOf(light);
  const c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
  const g = c.getContext("2d");
  if (flip) { g.translate(c.width, 0); g.scale(-1, 1); }
  if (bright && bright !== 1) g.filter = `brightness(${bright})`;
  g.drawImage(img, 0, 0);
  g.setTransform(1, 0, 0, 1, 0, 0); g.filter = "none";
  if (tint) { g.globalCompositeOperation = "source-atop"; g.globalAlpha = strength; g.fillStyle = tint; g.fillRect(0, 0, c.width, c.height); }
  return c;
}
async function stitch(panel, rec) {
  const scene = ASSETS.scenes[panel.sceneKey];
  const bg = await createImageBitmap(await getBlob("scene:" + panel.sceneKey));
  const BW = bg.width, BH = bg.height;
  const spots = Object.fromEntries(scene.spots.map(s => [s.id, s]));
  const used = {}, actors = [];
  const a0 = Date.now();
  const got = await Promise.all(panel.cast.map(async c => {
    const s0 = Date.now();
    const had = c.id === "user" || (residentAsset(c.id).sheet && residentAsset(c.id).poses[c.pose]);
    const r = await spriteFor(c.id, c.pose);
    if (rec) rec.cast.push(`${nameOf(c.id)}·${r.pose} ${had ? "现成" : "新生成 " + secs(Date.now() - s0)}`);
    return r;
  }));
  const r0 = Date.now();
  if (rec) rec.assetMs = (rec.assetMs || 0) + (r0 - a0);
  for (const [i, c] of panel.cast.entries()) {
    const spot = spots[c.spot] || scene.spots[actors.length % scene.spots.length];
    const n = used[spot.id] = (used[spot.id] || 0) + 1;
    const x = clamp(spot.x + (n > 1 ? (n % 2 ? 1 : -1) * 0.12 * Math.ceil((n - 1) / 2) : 0), 0.08, 0.92);
    const {blob, meta, pose} = got[i];
    const img = await createImageBitmap(blob);
    const k = BH * 0.42 * spot.scale / BASE_H;
    const natural = POSE_FACING[pose] || "left";
    actors.push({id: c.id, img, meta, w: meta.width * k, h: meta.height * k, fx: x * BW, fy: spot.y * BH, flip: (c.facing || natural) !== natural});
  }
  // 4:5 竖幅：远景裁得宽、特写裁得窄；水平中心跟着人物走，脚下留一点地面
  let ch = BH * ({wide: 1, mid: 0.82, close: 0.62}[panel.cam] || 0.82);
  const cx = actors.length ? actors.reduce((s, a) => s + a.fx, 0) / actors.length : (panel.focus ?? 0.5) * BW;
  if (actors.length > 1) {
    // 人物分得太开时先放宽镜头；放到最宽还装不下，就把人物往中间收拢，保证每个人都完整入画
    const halfW = Math.max(...actors.map(a => a.w)) * 0.6;
    const spread = Math.max(...actors.map(a => Math.abs(a.fx - cx))) + halfW;
    ch = clamp(Math.max(ch, spread * 2 / 0.8), ch, BH);
    const room = ch * 0.8 / 2 - halfW;
    const far = Math.max(...actors.map(a => Math.abs(a.fx - cx)));
    if (far > room && far > 0) for (const a of actors) a.fx = cx + (a.fx - cx) * Math.max(0.2, room / far);
  }
  const cw = ch * 0.8;
  const x0 = clamp(cx - cw / 2, 0, BW - cw);
  const feet = actors.length ? Math.max(...actors.map(a => a.fy)) : BH;
  const y0 = clamp(feet + ch * 0.07 - ch, 0, BH - ch);
  const s = PANEL_H / ch;
  const canvas = document.createElement("canvas"); canvas.width = PANEL_W; canvas.height = PANEL_H;
  const g = canvas.getContext("2d");
  g.imageSmoothingQuality = "high";
  g.drawImage(bg, x0, y0, cw, ch, 0, 0, PANEL_W, PANEL_H);
  const anchors = {};
  actors.sort((a, b) => a.fy - b.fy);
  for (const a of actors) {
    const px = (a.fx - x0) * s, py = (a.fy - y0) * s, dw = a.w * s, dh = a.h * s;
    g.fillStyle = "rgba(20,15,30,0.28)";
    g.beginPath(); g.ellipse(px, py, dw * 0.3, dw * 0.055, 0, 0, Math.PI * 2); g.fill();
    const footX = a.flip ? 1 - a.meta.foot_x : a.meta.foot_x, headX = a.flip ? 1 - a.meta.head_x : a.meta.head_x;
    const left = px - footX * dw, top = py - a.meta.foot_y * dh;
    g.drawImage(gradeSprite(a.img, scene.light, a.flip), left, top, dw, dh);
    anchors[a.id] = {x: (left + headX * dw) / PANEL_W, y: (top + a.meta.head_y * dh) / PANEL_H};
  }
  grain(g);
  const out = await new Promise(r => canvas.toBlob(r, "image/jpeg", 0.88));
  if (rec) rec.renderMs = Date.now() - r0;
  return {blob: out, anchors};
}

// ---------------- 合成格（关键时刻，Gemini） ----------------
function composePrompt(panel) {
  const who = panel.cast.slice(0, 3).map(c => {
    const name = c.id === "user" ? "The protagonist" : RESIDENTS[c.id].name_en;
    return `- ${name}: ${POSES[c.pose] ? POSES[c.pose].prompt_en : "standing"}`;
  }).join("\n");
  return `A single vertical webtoon panel (4:5) in the art style of the style reference.
Use the scene reference as the location and keep its layout and lighting.
Characters, each matching their own character sheet exactly:
${who}
Moment: ${panel.moment_en || panel.caption}
Camera: ${panel.cam === "close" ? "close-up" : panel.cam === "wide" ? "wide shot" : "medium shot"}. Cinematic, emotional, 1937 Los Angeles.
${RULES_EN}
No text, no speech bubbles, no extra people unless described.`;
}
const REVIEW_PROMPT = n => `Check this comic panel. It should show exactly ${n} main character(s).
Return JSON: {"people_count": ${n}, "complete": true, "inappropriate": false}
- people_count: number of clearly drawn main characters (ignore tiny background figures).
- complete: every main character is fully drawn without missing or distorted body parts or faces.
- inappropriate: nudity, sexual content, gore, or a humiliating depiction.`;
async function compose(panel) {
  const parts = [composePrompt(panel), "Scene reference:", await getBlob("scene:" + panel.sceneKey)];
  for (const c of panel.cast.slice(0, 3)) {
    if (c.id === "user") parts.push("Character sheet of the protagonist:", await getBlob("sheet:" + S.approved));
    else { await ensureResidentSheet(c.id); parts.push(`Character sheet of ${RESIDENTS[c.id].name_en}:`, await getBlob(`res:${c.id}:sheet`)); }
  }
  const styles = await styleBlobs(1);
  if (styles.length) parts.push("Style reference (art style only):", styles[0]);
  const n = Math.min(3, panel.cast.length);
  for (let attempt = 1; attempt <= 2; attempt++) {
    const blob = await genImage(parts, "4:5", "panel", panel.id, "合成格");
    const r = await visionJson([REVIEW_PROMPT(n), blob], {people_count: n, complete: true, inappropriate: false}, "合成审核");
    if (r && r.inappropriate !== true && r.complete !== false && (!isFinite(r.people_count) || r.people_count <= n + 0)) return blob;
  }
  throw new Error("合成格两次都没通过审核");
}

// ---------------- 画格队列 ----------------
// 素材现成的格子不到 0.1 秒就能拼好，不让它们排在等新素材的格子后面；生图请求的总数由 withImageSlot 限制
const drawQueue = []; let drawing = 0;
function drawLater(panel) { drawQueue.push(panel); pumpDraw(); }
function pumpDraw() {
  while (drawing < 8 && drawQueue.length) {
    const p = drawQueue.shift(); drawing++;
    drawPanel(p).finally(() => { drawing--; pumpDraw(); });
  }
}
function panelTag(panel) {
  const ph = S.world.timeline.find(x => x.panels.includes(panel));
  return {ph, tag: `第 ${panel.day} 天 ${ph ? phaseLabel(ph.phase) : ""} 第 ${ph ? ph.panels.indexOf(panel) + 1 : 0} 格`};
}
async function drawPanel(panel) {
  if (panel.dead) return;
  const t0 = Date.now();
  const {ph, tag} = panelTag(panel);
  const rec = {type: "panel", tag, queueMs: panel.queuedAt ? t0 - panel.queuedAt : null, cast: []};
  panel.status = "drawing"; updatePanel(panel);
  try {
    const key = `${panel.place}:${panel.light}`, hadScene = !!ASSETS.scenes[key];
    panel.sceneKey = await ensureScene(panel.place, panel.light);
    rec.assetMs = Date.now() - t0;
    rec.scene = `${PLACES[panel.place].label}·${panel.light} ${hadScene ? "现成" : "新生成 " + secs(rec.assetMs)}`;
    // 关键时刻也先用拼接格立刻顶上，合成格画好后再替换
    const {blob, anchors} = await stitch(panel, rec);
    if (panel.dead) return;
    await putBlob("panel:" + panel.id, blob);
    panel.anchors = anchors; panel.rendered = "stitch"; rec.render = "拼接";
    panel.status = "ready"; panel.error = null;
    if (ph && ph.t && !ph.t.first) ph.t.first = Date.now();
  } catch (e) { console.error(e); panel.status = "failed"; panel.error = e.message; rec.error = e.message.slice(0, 120); }
  rec.totalMs = Date.now() - t0;
  logEntry(rec);
  saveSoon(); updatePanel(panel); renderWorldHead();
  if (panel.status === "ready" && panel.render === "compose" && !panel.upgraded) upgradeToCompose(panel);
  if (ph) finishPhaseLog(ph);
}
async function upgradeToCompose(panel) {
  const used = S.world.composeUsed[panel.day] || 0;
  if (used >= COMPOSE_PER_DAY || !panel.cast.length) { panel.upgraded = true; return; }
  S.world.composeUsed[panel.day] = used + 1;  // 先占名额，避免同时开出超过每天上限的合成格
  panel.upgrading = true; updatePanel(panel); renderWorldHead();
  const t0 = Date.now(), {tag} = panelTag(panel);
  const rec = {type: "panel", tag: tag + " · 关键时刻", cast: panel.cast.slice(0, 3).map(c => `${nameOf(c.id)}（设定图）`), assetMs: 0};
  try {
    const blob = await compose(panel);
    if (!panel.dead) {
      await putBlob("panel:" + panel.id, blob);
      panel.anchors = null; panel.rendered = "compose";
    }
    rec.render = "合成替换拼接";
  } catch (e) {
    console.warn(e);
    S.world.composeUsed[panel.day] = Math.max(0, (S.world.composeUsed[panel.day] || 1) - 1);
    rec.render = "合成没成功，保留拼接"; rec.error = e.message.slice(0, 120);
  }
  rec.renderMs = rec.totalMs = Date.now() - t0;
  logEntry(rec);
  panel.upgrading = false; panel.upgraded = true;
  saveSoon(); updatePanel(panel); renderWorldHead();
}
// 一个时段的所有画格都有结果后，记一条汇总：剧情用时、画格用时、调用次数和花费
function finishPhaseLog(ph) {
  if (!ph.t || ph.t.logged || ph.writing || ph.panels.some(p => p.status === "queued" || p.status === "drawing")) return;
  const end = Date.now(), calls = LOG.filter(e => e.type === "call" && e.at >= ph.t.start && e.at <= end);
  ph.t.logged = true;
  logEntry({type: "phase", tag: `第 ${ph.day} 天 ${phaseLabel(ph.phase)}`, firstMs: ph.t.first ? ph.t.first - ph.t.start : null,
    storyMs: ph.t.story - ph.t.start, drawMs: Math.max(0, end - ph.t.story), totalMs: end - ph.t.start, prefetched: !!ph.t.prefetched,
    panels: ph.panels.length, calls: calls.length, cost: calls.reduce((s, e) => s + (e.cost || 0), 0)});
}

// ---------------- 叙事（Claude） ----------------
async function narrateJson(prompt, label, onText, tag = "剧情") {
  const models = [CFG.story, ...STORY_FALLBACKS.filter(m => m !== CFG.story)];
  let last;
  for (const m of models) {
    try {
      const msg = await openrouter(m, [prompt], {max_tokens: 4000, temperature: 0.8}, (n, text) => {
        if (label) renderWorldHead(`${label}（已收到 ${n} 字）`);
        if (onText) onText(text);
      }, tag);
      if (m !== CFG.story) {
        CFG.story = m; localStorage.setItem(SETTINGS_KEY, JSON.stringify(CFG));
        notify(`叙事模型已自动换成可用的 ${m}`);
      }
      return parseJson(msg.content || "");
    } catch (e) {
      last = e;
      // 模型名不存在时换下一个，其他错误直接抛出
      if (!/OpenRouter (400|404)/.test(e.message) || !/model/i.test(e.message)) throw e;
    }
  }
  throw last;
}
function rosterText() {
  return W.residents.map(r => `- ${r.id}：${r.name}（${r.name_en}），${r.age} 岁，${r.role}。性格：${r.personality}。说话：${r.speech}。本章线索：${r.arc_ch1}`).join("\n");
}
function contextText() {
  const Wd = S.world, role = ROLES[S.role], day = Wd.day, phase = PHASES[Wd.next];
  const today = Wd.timeline.filter(p => p.day === day).map(p => `${PHASES.find(x => x.id === p.phase).label}：${p.summary}`).join("\n") || "（还没有）";
  const recent = Wd.timeline.filter(p => p.day < day).slice(-6).map(p => `第 ${p.day} 天${PHASES.find(x => x.id === p.phase).label}：${p.summary}`).join("\n") || "（还没有）";
  const choices = Wd.decisions.slice(-10).map(d => `第 ${d.day} 天「${d.question}」→ ${d.chosenText}（${d.byUser ? "用户亲自接管选的" : "分身凭直觉选的"}）`).join("\n") || "（还没有）";
  const rel = Object.entries(Wd.rel).map(([id, v]) => `${RESIDENTS[id].name}：好感 ${v.a}，信任 ${v.t}`).join("；");
  const facts = W.missing_person.facts.slice(0, day >= 7 ? 4 : 3).map(f => "- " + f).join("\n");
  return `【世界】${W.premise}
【主角】用户本人的分身，身份：${role.label}。${role.intro}画格里用 id "user"，旁白里称"你"。
【主角过去的选择】（分身要越来越像用户）\n${choices}
【常驻角色】\n${rosterText()}
【失踪案】莉莉安·格雷（Lillian Gray）\n${facts}${day >= 7 ? `\n纸条内容：${W.missing_person.note_text}` : ""}
【现在】第 ${day} 天 · ${phase.label}（这一天的第 ${Wd.next + 1}/6 个时段）
【今天前面已经发生】\n${today}
【最近几天】\n${recent}
【当前关系】${rel}
【可用地点】\n${W.places.map(p => `- ${p.id}：${p.label}（光线：${p.lights.join("/")}）`).join("\n")}
【可用动作】${W.poses.map(p => `${p.id}（${p.label}）`).join("、")}`;
}
const OUTPUT_RULES = `规则：
- 每格 cast 最多 3 人；地点只能用可用地点的 id；动作只能用可用动作的 id；角色 id 只能是 user 或常驻角色 id。
- spot 只能是 left、center、right、front；facing 是人物脸朝画面的 left 还是 right，两人对话时让他们相向。
- cam：wide（远景，交代环境）、mid（中景）、close（特写）。
- 台词简短口语化，每句不超过 25 个汉字；type 为 speech（说出口）或 thought（心声）；旁白写在 caption，不超过 30 个汉字。
- drama 是这一格的戏剧性 0–10。两人有身体接触（拥抱、牵手、披外套、跳舞），或剧本里的关键时刻（第一次见面、发现纸条），render 设为 "compose"，并在 moment_en 用一句英文描述这个画面；其他格 render 为 "stitch"。
- 内容边界：所有角色都是成年人；爱情最多到拥抱和接吻；不写裸露和性内容；不把任何角色写成被羞辱的对象。
- relationship_changes 只写这段剧情里真的变化了的角色，affection 和 trust 的变化都在 -10 到 10 之间，reason 一句话。
只输出一个 JSON 对象，不要输出任何其他文字。`;
const PANEL_SCHEMA = `{"place": "diner", "light": "morning", "cam": "wide", "cast": [{"id": "user", "pose": "coffee", "spot": "left", "facing": "right"}, {"id": "mae", "pose": "stand_smile", "spot": "right", "facing": "left"}], "lines": [{"who": "mae", "type": "speech", "text": "亲爱的，今天的报纸你得看看。"}], "caption": "梅的餐厅，早上七点半。", "drama": 3, "render": "stitch", "moment_en": ""}`;

function phasePrompt(dec) {
  const Wd = S.world, day = Wd.day, phase = PHASES[Wd.next], node = DAYS[day];
  const meet = node.meet_by_role ? `今天主角会遇到：${nameOf(node.meet_by_role[S.role])}。` : "";
  let extra = "";
  if (dec) extra += `\n【这个时段结束时的决策点】${dec.question}　选项：${dec.options.map(o => `${o.id}：${o.text}`).join("；")}。剧情要自然走到这个选择前停住，不要替主角做出选择。在 decision_intuition 里给出分身凭直觉选每个选项的概率（参考主角过去的选择，合计为 1）。`;
  if (phase.id === "late") extra += `\n【深夜】另外写 diary：分身的日记，第一人称"我"，60–100 字，写今天的感受和一个具体细节；other_view：今天出场的一位常驻角色对今天的内心独白，40–80 字。`;
  return `你是互动漫画《回声 1937》的叙事导演，同时扮演所有角色。
${contextText()}
【今天剧本必须发生的事】${node.must.join("；")}。${meet}把这些事分散安排在今天合适的时段，不要一个时段全部用完；今天已经发生过的不要重复。${extra}

为这个时段生成 4–6 格分镜。第一格通常用 wide 交代地点。
${OUTPUT_RULES}

输出格式：
{"summary": "这个时段发生了什么，一句话", "panels": [${PANEL_SCHEMA}],
 "relationship_changes": [{"who": "mae", "affection": 3, "trust": 2, "reason": "她把报纸留给了你"}],
 "decision_intuition": {"选项id": 0.5}, "diary": "", "other_view": {"who": "mae", "text": ""}}`;
}
function followPrompt(kind, info) {
  const what = kind === "decision"
    ? `【刚才的决策】${info.question}　主角的选择：${info.chosenText}（${info.byUser ? "用户亲自接管做的选择" : "分身凭直觉做的选择"}）${info.custom ? `。用户写下的做法：${info.custom}` : ""}
生成 2–3 格这个选择带来的直接后果，然后停住。`
    : `【自由行动】用户接管分身，来到${PLACES[info.place].label}，想做：${info.text}
生成 2–3 格这段小剧情。动作必须从可用动作里选最接近的；想做的事没有对应动作时，用最接近的动作，并在 caption 里交代发生了什么。地点固定为 ${info.place}，render 一律为 "stitch"。`;
  return `你是互动漫画《回声 1937》的叙事导演，同时扮演所有角色。
${contextText()}
${what}
${OUTPUT_RULES}

输出格式：
{"summary": "一句话", "panels": [${PANEL_SCHEMA}], "relationship_changes": [{"who": "eli", "affection": 2, "trust": -1, "reason": "..."}]}`;
}

// 校验模型输出：地点、光线、动作、站位、角色不合法的都换成默认值
function cleanPanels(raw, phaseId, forcePlace, offset = 0) {
  const list = Array.isArray(raw && raw.panels) ? raw.panels : [];
  const ids = new Set(["user", ...W.residents.map(r => r.id)]);
  const str = (v, n) => (typeof v === "string" ? v : "").trim().slice(0, n);
  return list.slice(0, 6).map((p, i) => {
    p = p && typeof p === "object" ? p : {};
    const place = forcePlace || (PLACES[p.place] ? p.place : "apartment");
    const cast = (Array.isArray(p.cast) ? p.cast : []).filter(c => c && ids.has(c.id))
      .filter((c, j, a) => a.findIndex(x => x.id === c.id) === j).slice(0, 3)
      .map(c => ({id: c.id, pose: POSES[c.pose] ? c.pose : "stand", spot: SPOT_IDS.includes(c.spot) ? c.spot : SPOT_IDS[0], facing: c.facing === "right" ? "right" : "left"}));
    const castIds = new Set(cast.map(c => c.id));
    const lines = (Array.isArray(p.lines) ? p.lines : []).filter(l => l && typeof l.text === "string" && l.text.trim())
      .slice(0, 4).map(l => ({who: castIds.has(l.who) ? l.who : null, type: l.type === "thought" ? "thought" : "speech", text: str(l.text, 60)}));
    const drama = clamp(Math.round(+p.drama || 0), 0, 10);
    return {place, light: lightFor(place, phaseId, p.light), cam: ["wide", "mid", "close"].includes(p.cam) ? p.cam : (i + offset ? "mid" : "wide"),
      focus: isFinite(p.focus) ? clamp(+p.focus, 0, 1) : 0.5, cast, lines, caption: str(p.caption, 80), drama,
      render: (p.render === "compose" || drama >= 8) && cast.length && !forcePlace ? "compose" : "stitch",
      moment_en: str(p.moment_en, 300), status: "queued"};
  });
}
function applyRel(raw, day, tag) {
  const out = [];
  for (const c of Array.isArray(raw && raw.relationship_changes) ? raw.relationship_changes : []) {
    if (!c || !S.world.rel[c.who]) continue;
    const da = clamp(Math.round(+c.affection || 0), -10, 10), dt = clamp(Math.round(+c.trust || 0), -10, 10);
    if (!da && !dt) continue;
    const r = S.world.rel[c.who];
    r.a = clamp(r.a + da, 0, 100); r.t = clamp(r.t + dt, 0, 100);
    out.push({who: c.who, a: da, t: dt, reason: (typeof c.reason === "string" ? c.reason : "").slice(0, 60), day, tag});
  }
  return out;
}
function addPanels(ph, panels, tag) {
  panels.forEach((p, i) => {
    p.id = `d${ph.day}_${ph.phase}_${ph.panels.length + 1}_${uid().slice(0, 4)}`;
    p.day = ph.day; p.tag = tag || null; p.queuedAt = Date.now();
    ph.panels.push(p);
    drawLater(p);
  });
}

// 从流式收到的 JSON 文本里，逐个取出 "panels" 数组中已经写完整的格子
function panelStream(onPanel) {
  let pos = -1, index = 0, finished = false;
  return text => {
    if (finished) return;
    if (pos < 0) {
      const k = text.indexOf('"panels"');
      if (k < 0) return;
      const b = text.indexOf("[", k);
      if (b < 0) return;
      pos = b + 1;
    }
    for (;;) {
      let i = pos;
      while (i < text.length && " \n\r\t,".includes(text[i])) i++;
      if (i >= text.length) return;
      if (text[i] !== "{") { finished = true; return; }
      let depth = 0, inStr = false, escp = false, j = i;
      for (; j < text.length; j++) {
        const ch = text[j];
        if (inStr) { if (escp) escp = false; else if (ch === "\\") escp = true; else if (ch === '"') inStr = false; continue; }
        if (ch === '"') inStr = true;
        else if (ch === "{") depth++;
        else if (ch === "}" && --depth === 0) break;
      }
      if (j >= text.length) return;
      pos = j + 1;
      let obj = null;
      try { obj = JSON.parse(text.slice(i, j + 1)); } catch (e) { /* 留到整段写完时再处理 */ }
      if (obj) onPanel(obj, index);
      index++;
    }
  };
}

async function nextPhase() {
  const Wd = S.world;
  if (worldBusy || Wd.done) return;
  const open = Wd.timeline.find(p => p.decision && p.decision.status !== "resolved");
  if (open) return notify("先在决策点做出选择，故事才会继续。");
  if (!live()) return notify("请先点右上角「设置」填写 API Key", true);
  worldBusy = true; renderWorldHead("正在写这个时段的剧情…");
  const tStart = Date.now();
  const day = Wd.day, phase = PHASES[Wd.next], node = DAYS[day];
  const dec = node.decision && node.decision.phase === phase.id ? node.decision : null;
  let ph = null;
  const shown = new Set();
  const startPhase = () => {
    if (!ph) { ph = {id: uid(), day, phase: phase.id, place: null, summary: "", panels: [], rel: [], writing: true, t: {start: tStart}}; Wd.timeline.push(ph); Wd.viewDay = day; }
    return ph;
  };
  try {
    const sig = worldSig();
    let raw = null;
    if (Wd.prefetch && Wd.prefetch.sig === sig) raw = Wd.prefetch.raw;
    else if (prefetchJob && prefetchJob.sig === sig) { renderWorldHead("下一个时段的剧情马上写好…"); raw = await prefetchJob.promise; }
    Wd.prefetch = null;
    const prefetched = !!raw;
    if (prefetched) logEntry({type: "local", tag: "剧情：用后台预先写好的", totalMs: Date.now() - tStart});
    else if (CFG.mock) raw = mockPhase(day, phase, dec);
    else {
      // 边写边出格：剧情每写完一格，就先把这一格画出来
      const feed = panelStream((obj, i) => {
        if (i >= 6) return;
        const [c] = cleanPanels({panels: [obj]}, phase.id, null, i);
        if (!c) return;
        startPhase();
        if (!ph.place) ph.place = c.place;
        shown.add(i);
        addPanels(ph, [c]);
        renderWorld();
      });
      raw = await narrateJson(phasePrompt(dec), "正在写这个时段的剧情…", feed);
    }
    const panels = cleanPanels(raw, phase.id);
    if (!panels.length && !shown.size) throw new Error("叙事模型没有返回画格，请再试一次");
    startPhase();
    ph.place = ph.place || panels[0].place;
    ph.summary = (raw.summary || "").toString().slice(0, 120);
    ph.t.story = Date.now(); ph.t.prefetched = prefetched;
    ph.rel = applyRel(raw, day, null);
    if (dec) {
      const intu = raw.decision_intuition && typeof raw.decision_intuition === "object" ? raw.decision_intuition : {};
      let opts = dec.options.map(o => ({...o, p: isFinite(+intu[o.id]) ? Math.max(0, +intu[o.id]) : o.intuition}));
      const sum = opts.reduce((s, o) => s + o.p, 0) || 1;
      opts = opts.map(o => ({...o, p: Math.round(o.p / sum * 100) / 100}));
      ph.decision = {question: dec.question, options: opts, status: "open"};
    }
    const rest = panels.filter((_, i) => !shown.has(i));
    if (phase.id === "late") {
      const ov = raw.other_view && typeof raw.other_view === "object" ? raw.other_view : {};
      Wd.diaries[day] = {text: (raw.diary || "").toString().slice(0, 400),
        other: RESIDENTS[ov.who] && ov.text ? {who: ov.who, text: ov.text.toString().slice(0, 300)} : null};
      // 日记配一张分身在公寓窗前的拼接格
      rest.push({place: "apartment", light: lightFor("apartment", "late"), cam: "mid", focus: 0.5,
        cast: [{id: "user", pose: "stand", spot: "center", facing: "left"}], lines: [], caption: "深夜，你在窗前写下今天。", drama: 2, render: "stitch", moment_en: "", status: "queued", diary: true});
    }
    ph.writing = false;
    addPanels(ph, rest);
    finishPhaseLog(ph);
    // 时段推进：深夜之后进入下一天，第 7 天深夜后第一章结束
    Wd.next++;
    if (Wd.next >= PHASES.length) {
      if (day >= LAST_DAY) Wd.done = true;
      else { Wd.day++; Wd.next = 0; Wd.relStart[Wd.day] = JSON.parse(JSON.stringify(Wd.rel)); }
    }
    await save();
  } catch (e) {
    console.error(e);
    // 剧情写到一半失败：去掉这个没写完的时段，下次重新生成
    if (ph) {
      Wd.timeline = Wd.timeline.filter(x => x !== ph);
      for (const p of ph.panels) { p.dead = true; delBlob("panel:" + p.id); }
    }
    notify("生成剧情失败：" + e.message, true);
  }
  worldBusy = false; renderWorld();
  schedulePrefetch();
}

// ---------------- 后台预写下一个时段 ----------------
// 看当前时段的时候，后台先把下一个时段的剧情写好；期间如果做了选择或自由行动，剧情前提变了，就作废重写
function worldSig() {
  const Wd = S.world;
  return [Wd.day, Wd.next, Wd.timeline.length, Wd.decisions.length, Wd.timeline.reduce((n, p) => n + p.panels.length, 0)].join(":");
}
let prefetchJob = null;
function schedulePrefetch() {
  const Wd = S.world;
  if (!Wd || !Array.isArray(Wd.timeline) || !Wd.timeline.length || Wd.done || !live() || worldBusy) return;
  if (Wd.timeline.some(p => p.decision && p.decision.status !== "resolved")) return;
  const sig = worldSig();
  if ((Wd.prefetch && Wd.prefetch.sig === sig) || (prefetchJob && prefetchJob.sig === sig)) return;
  Wd.prefetch = null;
  const day = Wd.day, phase = PHASES[Wd.next], node = DAYS[day];
  const dec = node.decision && node.decision.phase === phase.id ? node.decision : null;
  const prompt = phasePrompt(dec);
  const job = {sig};
  job.promise = (async () => {
    try {
      const raw = CFG.mock ? mockPhase(day, phase, dec) : await narrateJson(prompt, null, null, "剧情（后台预写）");
      if (worldSig() === sig) { S.world.prefetch = {sig, raw}; saveSoon(); prewarm(raw, phase.id); }
      return raw;
    } catch (e) { console.warn("后台预写失败", e); return null; }
    finally { if (prefetchJob === job) prefetchJob = null; renderWorldHead(); }
  })();
  prefetchJob = job;
  renderWorldHead();
}
// 预写好的剧情里用到的场景和角色动作，顺手先生成好
function prewarm(raw, phaseId) {
  for (const p of cleanPanels(raw, phaseId)) {
    ensureScene(p.place, p.light).catch(() => {});
    for (const c of p.cast) if (c.id !== "user") ensureResidentSprite(c.id, c.pose).catch(() => {});
  }
}

// ---------------- 预生成全部素材 ----------------
let pregen = null;
function missingAssets() {
  const scenes = [], sheets = [], sprites = [];
  for (const p of W.places) for (const l of p.lights) if (!ASSETS.scenes[`${p.id}:${l}`]) scenes.push([p.id, l]);
  for (const r of W.residents) {
    if (!residentAsset(r.id).sheet) sheets.push(r.id);
    for (const ps of W.poses) if (!residentAsset(r.id).poses[ps.id]) sprites.push([r.id, ps.id]);
  }
  return {scenes, sheets, sprites, total: scenes.length + sheets.length + sprites.length};
}
function renderPregen() {
  if (step() !== "world") return;
  const m = missingAssets();
  const allScenes = W.places.reduce((n, p) => n + p.lights.length, 0), allSprites = W.residents.length * W.poses.length;
  const all = allScenes + W.residents.length + allSprites;
  const conc = Math.max(1, Number(CFG.conc) || 3);
  $("pg-sum").textContent = `场景底图 ${allScenes - m.scenes.length}/${allScenes}，角色设定图 ${W.residents.length - m.sheets.length}/${W.residents.length}，角色动作 ${allSprites - m.sprites.length}/${allSprites}。` +
    (m.total ? `还差 ${m.total} 张，预计约 $${(m.total * 0.047).toFixed(1)}、${Math.max(1, Math.ceil(m.total * 15 / conc / 60))} 分钟。素材齐了以后，画格基本都是秒出。` : "素材已经齐了，画格基本都是秒出。");
  $("pg-bar").style.width = Math.round((all - m.total) / all * 100) + "%";
  const running = pregen && pregen.running;
  $("pg-go").classList.toggle("hidden", !!running || !m.total);
  $("pg-go").textContent = pregen && pregen.done ? "继续预生成" : "预生成全部素材";
  $("pg-pause").classList.toggle("hidden", !running);
  $("pg-pause").disabled = !!(running && pregen.paused);
  $("pg-msg").textContent = !pregen ? "" : pregen.noCredit && !running ? `余额不足已暂停：本次完成 ${pregen.done}/${pregen.total}。充值后点「继续预生成」，只补还缺的。` : (running ? (pregen.paused ? `正在收尾，已完成 ${pregen.done}/${pregen.total}` : `进行中 ${pregen.done}/${pregen.total}，已花费约 $${(S.cost - pregen.cost0).toFixed(2)}`)
    : `${pregen.paused ? "已暂停" : "完成"}：${pregen.done}/${pregen.total}，花费约 $${(S.cost - pregen.cost0).toFixed(2)}`) + (pregen.failed.length ? `，${pregen.failed.length} 个失败（再点一次会重试）` : "");
}
async function startPregen() {
  if (pregen && pregen.running) return;
  if (!live()) return notify("请先点右上角「设置」填写 API Key", true);
  const m = missingAssets();
  if (!m.total) return renderPregen();
  pregen = {running: true, paused: false, noCredit: false, total: m.total, done: 0, failed: [], t0: Date.now(), cost0: S.cost};
  // 依赖：角色动作要等设定图；同一地点的其他光线要等第一张底图（拿它做参考，布局才一致）
  const sheetFailed = {}, sceneFailed = {}, tasks = [];
  for (const id of m.sheets) tasks.push({label: `${RESIDENTS[id].name}·设定图`, ready: () => true, run: () => ensureResidentSheet(id), fail: () => { sheetFailed[id] = true; }});
  for (const p of W.places) {
    m.scenes.filter(([pid]) => pid === p.id).forEach(([, l], i) => tasks.push({label: `场景 ${p.label}·${l}`,
      ready: () => i === 0 || p.lights.some(x => ASSETS.scenes[`${p.id}:${x}`]) || sceneFailed[p.id],
      run: () => ensureScene(p.id, l), fail: () => { if (i === 0) sceneFailed[p.id] = true; }}));
  }
  for (const [id, pose] of m.sprites) tasks.push({label: `${RESIDENTS[id].name}·${POSES[pose].label}`,
    ready: () => residentAsset(id).sheet || sheetFailed[id], skip: () => !residentAsset(id).sheet, run: () => ensureResidentSprite(id, pose)});
  const worker = async () => {
    while (!pregen.paused) {
      const t = tasks.find(x => !x.started && x.ready());
      if (!t) { if (tasks.every(x => x.started)) return; await sleep(500); continue; }
      t.started = true;
      if (t.skip && t.skip()) pregen.failed.push(`${t.label}：设定图没生成成功，跳过`);
      else {
        try { await t.run(); } catch (e) {
          if (e.noCredit) {
            if (!pregen.paused) notify("OpenRouter 余额不足，预生成已暂停。充值后点「继续预生成」。", true);
            pregen.paused = true; pregen.noCredit = true;
          } else { pregen.failed.push(`${t.label}：${e.message.slice(0, 60)}`); if (t.fail) t.fail(); }
        }
      }
      pregen.done++; renderPregen(); renderWorldHead();
    }
  };
  renderPregen();
  await Promise.all(Array.from({length: Math.max(1, Number(CFG.conc) || 3)}, worker));
  pregen.running = false;
  logEntry({type: "local", tag: `预生成素材${pregen.paused ? "（暂停）" : ""}：${pregen.done}/${pregen.total}，失败 ${pregen.failed.length}`, totalMs: Date.now() - pregen.t0,
    note: `花费约 $${(S.cost - pregen.cost0).toFixed(3)}${pregen.failed.length ? "；" + pregen.failed.slice(0, 5).join("；") : ""}`});
  renderPregen(); renderWorldHead();
}
$("pg-go").onclick = () => startPregen();
$("pg-pause").onclick = () => { if (pregen) pregen.paused = true; renderPregen(); };

async function resolveDecision(ph, chosenId, custom, byUser) {
  if (worldBusy) return;
  const d = ph.decision, opt = d.options.find(o => o.id === chosenId);
  const predicted = d.options.reduce((a, b) => (b.p > a.p ? b : a)).id;
  const chosenText = custom ? `按自己的做法：${custom}` : opt.text;
  worldBusy = true; d.status = "resolving"; renderWorld();
  try {
    const info = {question: d.question, chosenText, custom, byUser};
    const raw = CFG.mock ? mockFollow("decision", info, ph) : await narrateJson(followPrompt("decision", info), "正在写你选择之后的剧情…");
    Object.assign(d, {status: "resolved", chosen: custom ? "custom" : chosenId, chosenText, custom: custom || null, byUser, predicted});
    S.world.decisions.push({day: ph.day, question: d.question, chosen: d.chosen, chosenText, byUser, predicted});
    ph.rel.push(...applyRel(raw, ph.day, "decision"));
    addPanels(ph, cleanPanels(raw, ph.phase), "decision");
    await save();
  } catch (e) { d.status = "open"; notify("生成后续剧情失败：" + e.message, true); }
  worldBusy = false; renderWorld();
  schedulePrefetch();
}

async function freeAction(place, text) {
  if (worldBusy || !text.trim()) return;
  const ph = S.world.timeline[S.world.timeline.length - 1];
  if (!ph) return notify("先推进到第一个时段，再自由行动。");
  worldBusy = true; renderWorldHead("正在写自由行动…");
  try {
    const info = {place, text: text.trim().slice(0, 60)};
    const raw = CFG.mock ? mockFollow("free", info, ph) : await narrateJson(followPrompt("free", info), "正在写自由行动…");
    ph.rel.push(...applyRel(raw, ph.day, "free"));
    addPanels(ph, cleanPanels(raw, ph.phase, place), "free");
    S.world.viewDay = ph.day;
    await save();
    $("w-free-text").value = ""; $("w-free").classList.add("hidden");
  } catch (e) { notify("自由行动失败：" + e.message, true); }
  worldBusy = false; renderWorld();
  schedulePrefetch();
}

// ---------------- 模拟模式的剧情 ----------------
const MOCK_PLACE = {dawn: "apartment", morning: "diner", evening: "pier", late: "apartment"};
const MOCK_WHO = {1: "mae", 3: "vivian", 4: "ronan", 5: "cass", 6: "vivian", 7: "eli"};
function mockPhase(day, phase, dec) {
  const work = ROLES[S.role].workplace;
  const place = MOCK_PLACE[phase.id] || work;
  const who = day === 2 ? DAYS[2].meet_by_role[S.role] : (phase.id === "morning" ? "mae" : MOCK_WHO[day] || "mae");
  const pose = {dawn: "wake_stretch", morning: "coffee", afternoon: "stand", evening: "walk", night: "stand_smile", late: "newspaper"}[phase.id];
  const panels = [
    {place, cam: "wide", cast: [{id: "user", pose, spot: "center"}], lines: [], caption: `（模拟）第 ${day} 天${phase.label}，${PLACES[place].label}。`, drama: 2},
    {place, cam: "mid", cast: [{id: "user", pose: "stand", spot: "left", facing: "right"}, {id: who, pose: "stand_smile", spot: "right", facing: "left"}],
      lines: [{who, type: "speech", text: "（模拟）你听说莉莉安的事了吗？"}, {who: "user", type: "speech", text: "（模拟）听说了。"}], caption: "", drama: 4},
    {place, cam: "close", cast: [{id: who, pose: "stand", spot: "center"}], lines: [{who, type: "thought", text: "（模拟）别让她知道太多。"}], caption: "", drama: 5},
    {place, cam: "mid", cast: [{id: "user", pose: phase.id === "night" ? "dance" : "surprised", spot: "left", facing: "right"}, {id: who, pose: phase.id === "night" ? "dance" : "stand", spot: "right", facing: "left"}],
      lines: [], caption: "（模拟）这一刻你记了很久。", drama: phase.id === "night" ? 8 : 3, render: phase.id === "night" ? "compose" : "stitch", moment_en: "they dance together"},
  ];
  return {summary: `（模拟）第 ${day} 天${phase.label}，在${PLACES[place].label}遇到了${nameOf(who)}。`, panels,
    relationship_changes: [{who, affection: 3, trust: 1, reason: "（模拟）聊得还不错"}],
    decision_intuition: dec ? Object.fromEntries(dec.options.map(o => [o.id, o.intuition])) : {},
    diary: phase.id === "late" ? `（模拟）第 ${day} 天的日记：今天在${PLACES[place].label}，我一直在想莉莉安的事。` : "",
    other_view: {who, text: "（模拟）那个新来的人，眼神里有点什么。"}};
}
function mockFollow(kind, info, ph) {
  const place = kind === "free" ? info.place : ph.place;
  return {summary: kind === "free" ? `（模拟）你去了${PLACES[place].label}：${info.text}` : `（模拟）你选择了：${info.chosenText}`,
    panels: [{place, cam: "mid", cast: [{id: "user", pose: "walk", spot: "center"}], lines: [{who: "user", type: "thought", text: "（模拟）就这么办。"}], caption: kind === "free" ? `（模拟）${info.text}` : `（模拟）${info.chosenText}`, drama: 4},
      {place, cam: "close", cast: [{id: "user", pose: "look_back", spot: "center"}], lines: [], caption: "（模拟）身后好像有人。", drama: 5}],
    relationship_changes: [{who: "mae", affection: 1, trust: 0, reason: "（模拟）"}]};
}

// ---------------- 界面：观察与夺舍 ----------------
function phaseLabel(id) { return (PHASES.find(p => p.id === id) || {}).label || id; }
function renderWorldHead(status) {
  if (!S.world || !Array.isArray(S.world.timeline) || step() !== "world") return;
  const Wd = S.world;
  $("w-title").textContent = Wd.done ? "第一章 · 完" : `第 ${Wd.day} 天 · 下一个时段：${PHASES[Wd.next].label}`;
  const open = Wd.timeline.some(p => p.decision && p.decision.status !== "resolved");
  const drawingNow = Wd.timeline.some(ph => ph.panels.some(p => p.status === "queued" || p.status === "drawing"));
  $("w-next").disabled = worldBusy || open || Wd.done;
  $("w-free-btn").disabled = worldBusy || !Wd.timeline.length;
  const upgrading = Wd.timeline.some(ph => ph.panels.some(p => p.upgrading));
  const ready = Wd.prefetch && Wd.prefetch.sig === worldSig();
  $("w-status").innerHTML = worldBusy ? `<span class="spinner"></span>${esc(status || "生成中…")}`
    : open ? "先在下面的决策点做出选择"
    : drawingNow ? `<span class="spinner"></span>正在画格…（第一次去的地点、第一次出场的角色要先生成素材）`
    : [upgrading ? "关键时刻的合成格正在精修，好了会自动替换" : "", ready ? "下一个时段已经写好，点一下马上出图" : prefetchJob ? "后台正在预写下一个时段…" : "", `已花费约 $${S.cost}`].filter(Boolean).join(" · ");
}
function renderWorld() {
  if (step() !== "world") return;
  const Wd = S.world;
  renderWorldHead();
  const days = [...new Set(Wd.timeline.map(p => p.day))];
  if (!days.includes(Wd.viewDay)) Wd.viewDay = days[days.length - 1] || 1;
  $("w-days").innerHTML = days.map(d => `<button data-d="${d}" class="${d === Wd.viewDay ? "on" : ""}">第 ${d} 天</button>`).join("");
  $("w-days").querySelectorAll("button").forEach(b => b.onclick = () => { Wd.viewDay = +b.dataset.d; saveSoon(); renderWorld(); });
  $("w-free-place").innerHTML = W.places.map(p => `<option value="${p.id}">${esc(p.label)}</option>`).join("");
  renderMap(); renderRel(); renderPregen();
  const day = Wd.viewDay, phases = Wd.timeline.filter(p => p.day === day);
  let h = phases.length ? "" : `<div class="card"><p>点「下一个时段」，第 1 天就从清晨开始。剧情边写边出格；素材齐了以后，画格基本都是秒出。</p></div>`;
  for (const ph of phases) {
    h += `<div class="phase-h" id="ph-${ph.id}">${esc(phaseLabel(ph.phase))}${PLACES[ph.place] ? " · " + esc(PLACES[ph.place].label) : ""} <span class="muted">${ph.writing ? "（剧情还在写，后面的格子陆续出来）" : esc(ph.summary)}</span></div>`;
    let lastTag = null;
    for (const p of ph.panels) {
      if (p.tag && p.tag !== lastTag) h += `<div class="phase-h"><span class="muted">${p.tag === "free" ? "自由行动" : "你的选择之后"}</span></div>`;
      lastTag = p.tag;
      h += `<div class="panel" id="p-${p.id}"></div>`;
      if (p.diary && Wd.diaries[day]) h += diaryHtml(day);
    }
    if (ph.decision) h += decisionHtml(ph);
  }
  $("w-strip").innerHTML = h;
  for (const ph of phases) for (const p of ph.panels) updatePanel(p);
  for (const ph of phases) if (ph.decision) bindDecision(ph);
}
function updatePanel(p) {
  const el = document.getElementById("p-" + p.id);
  if (!el) return;
  if (p.status !== "ready") {
    el.className = "panel " + (p.status === "failed" ? "failed" : "pending");
    el.innerHTML = p.status === "failed"
      ? `<div>这一格没画出来</div><div class="muted" style="color:#c9bb98">${esc(p.error || "")}</div><button class="small" data-redraw="${p.id}">重画</button>`
      : `<div><span class="spinner"></span>${p.status === "drawing" ? "正在画这一格…" : "排队中…"}</div><div class="muted" style="color:#c9bb98">${esc(p.caption || "")}</div>`;
    const b = el.querySelector("[data-redraw]");
    if (b) b.onclick = () => { p.status = "queued"; drawLater(p); };
    return;
  }
  el.className = "panel";
  let h = `<img src="${URLS["panel:" + p.id] || ""}" alt="">`;
  const stacked = [];
  const perWho = {};
  for (const l of p.lines) {
    const a = p.anchors && l.who && p.anchors[l.who];
    if (!a) { stacked.push(l); continue; }
    const k = perWho[l.who] = (perWho[l.who] || 0) + 1;
    const x = clamp(a.x, 0.3, 0.7) * 100, y = clamp(a.y - 0.03 - (k - 1) * 0.09, 0.1, 0.95) * 100;
    h += `<div class="bubble ${l.type}" style="left:${x}%;top:${y}%">${esc(l.text)}</div>`;
  }
  if (stacked.length) h += `<div class="stackbox">${stacked.map(l => `<div class="bubble stack ${l.type}">${l.who ? `<b>${esc(nameOf(l.who))}：</b>` : ""}${esc(l.text)}</div>`).join("")}</div>`;
  if (p.caption) h += `<div class="cap ${stacked.length ? "low" : ""}">${esc(p.caption)}</div>`;
  if (p.rendered === "compose") h += `<span class="tag">关键时刻</span>`;
  else if (p.upgrading) h += `<span class="tag">关键时刻精修中…</span>`;
  el.innerHTML = h;
}
function decisionHtml(ph) {
  const d = ph.decision;
  if (d.status === "resolved") {
    const same = d.chosen === d.predicted;
    return `<div class="card decision"><b>${esc(d.question)}</b><p>${d.byUser ? "你接管了分身" : "你没有接管，分身凭直觉"}，选择了：${esc(d.chosenText)}${d.byUser && !d.custom ? (same ? "（和分身的直觉一样）" : "（和分身的直觉不同）") : ""}</p></div>`;
  }
  return `<div class="card decision" id="dec-${ph.id}"><b>决策点 · ${esc(d.question)}</b>
    <p class="muted">分身已经走到这里，等你决定。选一个选项，或者写下你自己的做法；也可以不接管，让分身凭直觉选。</p>
    ${d.options.map(o => `<button class="opt" data-o="${o.id}">${esc(o.text)}<span class="pct">分身直觉 ${Math.round(o.p * 100)}%</span></button>`).join("")}
    <textarea placeholder="或者写下你自己的做法（可选）"></textarea>
    <div class="row" style="margin-top:8px"><button class="primary" data-act="take" disabled>接管，就这么做</button><button data-act="auto">不接管，让分身自己选</button></div>
    ${d.status === "resolving" ? `<p><span class="spinner"></span>正在写后续…</p>` : ""}</div>`;
}
function bindDecision(ph) {
  const box = document.getElementById("dec-" + ph.id);
  if (!box) return;
  let picked = null;
  const take = box.querySelector("[data-act=take]"), ta = box.querySelector("textarea");
  const sync = () => { take.disabled = worldBusy || (!picked && !ta.value.trim()); };
  box.querySelectorAll(".opt").forEach(b => b.onclick = () => { picked = b.dataset.o; box.querySelectorAll(".opt").forEach(x => x.classList.toggle("on", x === b)); sync(); });
  ta.oninput = sync;
  take.onclick = () => resolveDecision(ph, picked, ta.value.trim(), true);
  box.querySelector("[data-act=auto]").onclick = () => {
    // 分身按直觉的概率抽一个选项
    let r = Math.random(), pick = ph.decision.options[0].id;
    for (const o of ph.decision.options) { if (r < o.p) { pick = o.id; break; } r -= o.p; }
    resolveDecision(ph, pick, "", false);
  };
  if (worldBusy) box.querySelectorAll("button").forEach(b => b.disabled = true);
}
function diaryHtml(day) {
  const d = S.world.diaries[day];
  return `<div class="card diary"><b>第 ${day} 天 · 日记</b><p>${esc(d.text)}</p>${d.other ? `<p class="muted"><b>${esc(nameOf(d.other.who))}的视角：</b>${esc(d.other.text)}</p>` : ""}</div>`;
}
function renderMap() {
  const day = S.world.viewDay, phases = S.world.timeline.filter(p => p.day === day);
  const P = id => { const [x, y] = PLACES[id].map; return [x * 100, y * 70 + 3]; };
  let svg = `<svg viewBox="0 0 100 76" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="76" fill="#efe2c4"/>
    <path d="M100 48 C88 52 84 60 78 66 C72 72 70 76 70 76 L100 76 Z" fill="#a9c7c4"/>
    <text x="90" y="72" font-size="2.6" fill="#5c7f7b" text-anchor="middle">太平洋</text>
    <path d="M0 0 C10 6 22 4 30 0 Z" fill="#d7c6a0"/>
    <path d="M5 40 H95 M50 5 V70 M15 20 L85 60" stroke="#dccca8" stroke-width="0.8" fill="none"/>`;
  if (phases.length > 1) svg += `<polyline points="${phases.map(p => P(p.place).join(",")).join(" ")}" fill="none" stroke="#b4473c" stroke-width="0.8" stroke-dasharray="1.6 1"/>`;
  for (const pl of W.places) {
    const [x, y] = P(pl.id), visited = phases.some(p => p.place === pl.id);
    svg += `<circle cx="${x}" cy="${y}" r="${visited ? 1.6 : 1.1}" fill="${visited ? "#232945" : "#a4977d"}"/><text x="${x}" y="${y - 2.4}" font-size="2.4" fill="#4a4033" text-anchor="middle">${esc(pl.label)}</text>`;
  }
  phases.forEach((ph, i) => {
    const [x, y] = P(ph.place);
    svg += `<g class="pt" data-ph="${ph.id}"><circle cx="${x + 2.4}" cy="${y + 2}" r="1.9" fill="#b4473c"/><text x="${x + 2.4}" y="${y + 2.8}" font-size="2.2" fill="#fff" text-anchor="middle">${i + 1}</text></g>`;
  });
  $("w-map").innerHTML = svg + `</svg><p class="muted">数字是今天各时段的顺序，点一下跳到那一段。</p>`;
  $("w-map").querySelectorAll(".pt").forEach(g => g.onclick = () => { const el = document.getElementById("ph-" + g.dataset.ph); if (el) el.scrollIntoView({behavior: "smooth"}); });
}
function renderRel() {
  const Wd = S.world, day = Wd.viewDay;
  const changes = Wd.timeline.filter(p => p.day === day).flatMap(p => p.rel || []);
  $("w-rel").innerHTML = W.residents.map(r => {
    const v = Wd.rel[r.id], mine = changes.filter(c => c.who === r.id);
    const da = mine.reduce((s, c) => s + c.a, 0), dt = mine.reduce((s, c) => s + c.t, 0);
    const delta = mine.length ? `今天 好感 ${da >= 0 ? "+" : ""}${da}，信任 ${dt >= 0 ? "+" : ""}${dt}：${mine.map(c => c.reason).filter(Boolean).join("；")}` : "";
    return `<div class="rel"><b>${esc(r.name)}</b><div class="bars"><div class="b" title="好感 ${v.a}"><i style="width:${v.a}%;background:#d9789a"></i></div><div class="b" title="信任 ${v.t}"><i style="width:${v.t}%;background:#5b86c9"></i></div></div>${delta ? `<div class="why">${esc(delta)}</div>` : ""}</div>`;
  }).join("") + `<p class="muted">粉色是好感，蓝色是信任。显示的是当前的值和所选那一天的变化。</p>`;
}

$("w-next").onclick = () => nextPhase();
$("w-back").onclick = () => { S.view = "pack"; save(); render(); };
$("w-free-btn").onclick = () => $("w-free").classList.toggle("hidden");
$("w-free-go").onclick = () => freeAction($("w-free-place").value, $("w-free-text").value);

boot().catch(e => { console.error(e); notify("启动失败：" + e.message, true); });
