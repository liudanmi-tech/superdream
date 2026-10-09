"use strict";
// ================= 两个页面共用的底层：设置、本地存储、生图日志、调用模型、抠图、动作图 =================
// 漫画版（index.html）和城市模拟测试页（sim.html）都加载这个文件；界面相关的代码留在各自的页面里。

const W = window.WORLD;
const ROLES = Object.fromEntries(W.roles.map(r => [r.id, r]));
const POSES = Object.fromEntries(W.poses.map(p => [p.id, p]));
const FIRST_DAY = W.first_day_poses;
const MIN_PHOTOS = 3, MAX_PHOTOS = 5, MAX_SHEETS = 3, MIN_AGE = 18, BASE_H = 900, PHOTO_TTL = 7 * 86400e3;
const PRI_REGEN = 60, PRI_FIRST = 50, PRI_REST = 10;
const STYLE_EN = W.style.prompt_en, RULES_EN = W.content_rules_en;
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"}[c]));
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

// ================= 设置 =================
const SETTINGS_KEY = "echo1937.settings";
const DEFAULTS = {key: "", vision: "google/gemini-2.5-flash", image: "google/gemini-2.5-flash-image", story: "anthropic/claude-sonnet-5.5", conc: 3, mock: false,
  falKey: "", fuse: true, fuseMax: 3, falModel: "fal-ai/flux-2/klein/9b/edit"};
let CFG = {...DEFAULTS};
try { CFG = {...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}")}; } catch (e) {}
// 在重绘测试页（fuse_test.html）填过 fal Key 的话直接沿用
try { if (!CFG.falKey) CFG.falKey = localStorage.getItem("echo1937.falKey") || ""; } catch (e) {}
const live = () => CFG.mock || !!CFG.key;

// ================= 本地存储（IndexedDB，打不开时退回内存） =================
const store = {
  db: null, mem: new Map(),
  async open() {
    try {
      this.db = await new Promise((ok, no) => {
        const r = indexedDB.open("echo1937", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("kv");
        r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
      });
    } catch (e) { this.db = null; notify("浏览器不允许本地存储，刷新页面后数据会丢失。建议用 Chrome 打开。", true); }
  },
  tx(mode, fn) {
    return new Promise((ok, no) => {
      const t = this.db.transaction("kv", mode), s = t.objectStore("kv"), r = fn(s);
      t.oncomplete = () => ok(r && r.result); t.onerror = () => no(t.error);
    });
  },
  get(k) { return this.db ? this.tx("readonly", s => s.get(k)) : Promise.resolve(this.mem.get(k)); },
  set(k, v) { return this.db ? this.tx("readwrite", s => s.put(v, k)) : (this.mem.set(k, v), Promise.resolve()); },
  del(k) { return this.db ? this.tx("readwrite", s => s.delete(k)) : (this.mem.delete(k), Promise.resolve()); },
};
const URLS = {};
async function putBlob(id, blob) { await store.set("blob:" + id, blob); if (URLS[id]) URL.revokeObjectURL(URLS[id]); URLS[id] = URL.createObjectURL(blob); }
async function getBlob(id) { return id ? store.get("blob:" + id) : null; }
async function delBlob(id) { if (!id) return; await store.del("blob:" + id); if (URLS[id]) { URL.revokeObjectURL(URLS[id]); delete URLS[id]; } }
async function preloadUrls(ids) { for (const id of ids) if (id && !URLS[id]) { const b = await getBlob(id); if (b) URLS[id] = URL.createObjectURL(b); } }

// ================= 状态 =================
const fresh = () => ({role: null, birthYear: null, consentAt: null, photos: [], sheets: [], approved: null,
  keepPhotos: false, photosDeleted: false, sprites: {}, world: null, cost: 0, entered: false, step: "role"});
let S = fresh(), STYLE = {items: [], selected: []};
const save = () => store.set("state", S);
const saveStyle = () => store.set("style", STYLE);
let saveTimer = null;
function saveSoon() { clearTimeout(saveTimer); saveTimer = setTimeout(save, 200); }

// ================= 生图日志 =================
// 每次调用、每一格、每个时段各记一条，存在浏览器本地（最多 2000 条），可以导出发给开发者
let LOG = [], logTimer = null;
const secs = ms => ms == null ? "" : (ms / 1000).toFixed(1) + "s";
// 花费明细：每次调用按用途归类累计，存在 S.costBy 里（不受日志只保留 2000 条的影响）
function costCat(e) {
  const t = e.tag || "", m = e.model || "";
  if (m.startsWith("fal:")) return t.startsWith("预先重绘") ? "重绘·提前画好（fal，估算）" : "重绘·出格时现画（fal，估算）";
  if (/· 检查$/.test(t)) return "重绘后识别检查";
  if (/剧情/.test(t)) return "剧情（Claude）";
  if (/^场景 /.test(t)) return "素材·场景底图";
  if (/^标站位/.test(t)) return "素材·场景标注";
  if (/·设定图$|·动作图|·动作质检/.test(t) && !/^你·/.test(t)) return "素材·常驻角色设定图和动作";
  if (/^你·|^照片质检/.test(t)) return "入住·你的设定图和动作";
  if (/^风格参考图/.test(t)) return "风格参考图";
  if (/^合成/.test(t)) return "关键时刻合成（Gemini）";
  return "其他";
}
function countCost(e) {
  const by = S.costBy || (S.costBy = {}), k = costCat(e), r = by[k] || (by[k] = {n: 0, fail: 0, cost: 0});
  r.n++; if (e.ok === false) r.fail++;
  r.cost = Math.round((r.cost + (e.cost || 0)) * 10000) / 10000;
}
function costHtml() {
  const rows = Object.entries(S.costBy || {}).sort((a, b) => b[1].cost - a[1].cost);
  const sum = rows.reduce((t, [, r]) => t + r.cost, 0), older = Math.round((S.cost - sum) * 100) / 100;
  const panels = S.world && Array.isArray(S.world.timeline) ? S.world.timeline.flatMap(ph => ph.panels) : [];
  const fused = panels.filter(p => p.rendered === "fuse").length, kept = panels.filter(p => p.fuseTried && p.rendered !== "fuse").length;
  const fal = rows.filter(([k]) => k.startsWith("重绘·")), falCalls = fal.reduce((t, [, r]) => t + r.n, 0), falCost = fal.reduce((t, [, r]) => t + r.cost, 0);
  return `<h3 style="margin-top:0">花费明细</h3>` + (rows.length ? `<table class="cost-table"><tr><th>用途</th><th>调用次数</th><th>其中失败</th><th>花费</th></tr>` +
    rows.map(([k, r]) => `<tr><td>${esc(k)}</td><td class="n">${r.n}</td><td class="n">${r.fail || ""}</td><td class="n">$${r.cost.toFixed(3)}</td></tr>`).join("") +
    (older > 0.01 ? `<tr><td class="muted">更早的（没有分类）</td><td></td><td></td><td class="n">$${older.toFixed(2)}</td></tr>` : "") +
    `<tr><td><b>合计</b></td><td></td><td></td><td class="n"><b>$${(+S.cost).toFixed(2)}</b></td></tr></table>` : `<p class="muted">还没有花费。</p>`) +
    `<p class="muted">画格 ${panels.length} 格：重绘成功 ${fused} 格，重绘没通过检查、保留拼接 ${kept} 格，关键时刻合成 ${panels.filter(p => p.rendered === "compose").length} 格。` +
    (fused ? `重绘共调用 fal ${falCalls} 次、约 $${falCost.toFixed(2)}，平均每成功一格约 $${(falCost / fused).toFixed(3)}。` : "") +
    `fal 按每百万像素 $0.01 估算，准确数看 fal 后台；其他按 OpenRouter 返回的实际花费。失败的调用不扣钱。${S.costBySince ? `明细从 ${new Date(S.costBySince).toLocaleString()} 开始记。` : ""}</p>`;
}
function logEntry(e) {
  e.at = Date.now();
  if (e.type === "call") { countCost(e); saveSoon(); }
  LOG.push(e);
  if (LOG.length > 2000) LOG = LOG.slice(-2000);
  clearTimeout(logTimer); logTimer = setTimeout(() => store.set("log", LOG), 500);
  console.log("[生图日志]", logText(e));
  const panel = $("s-log");
  if (panel && !panel.classList.contains("hidden")) renderLog();
}
function logText(e) {
  if (e.type === "call") {
    return `${e.tag} · ${e.model}${e.attempt > 1 ? ` · 第${e.attempt}次` : ""} · ${e.ok ? "成功" : "失败"} · 共 ${secs(e.totalMs)}` +
      (e.upMs != null ? `（上传 ${secs(e.upMs)}，等模型 ${secs(e.waitMs)}，下载 ${secs(e.downMs)}）` : "") +
      (e.modelMs != null ? ` · 纯模型 ${secs(e.modelMs)}` : "") +
      (e.upKB != null ? ` · 上传 ${e.upKB}KB${e.images ? `（${e.images} 张图）` : ""}` : "") + (e.cost ? ` · ${e.costEstimated ? "约 " : ""}$${e.cost.toFixed(4)}` : "") + (e.error ? ` · ${e.error}` : "");
  }
  if (e.type === "local") return e.cutMs != null ? `${e.tag} · 抠图 ${secs(e.cutMs)}，锚点 ${secs(e.normMs)}` : `${e.tag}${e.totalMs != null ? " · 共 " + secs(e.totalMs) : ""}${e.note ? " · " + e.note : ""}`;
  if (e.type === "panel") return [e.tag, e.queueMs != null ? `排队 ${secs(e.queueMs)}` : "", e.scene ? `场景 ${e.scene}` : "", (e.cast || []).join("，") || "无人物",
    e.assetMs ? `等素材 ${secs(e.assetMs)}` : "", `${e.render || ""} ${secs(e.renderMs)}`, `共 ${secs(e.totalMs)}`, e.error ? `失败：${e.error}` : ""].filter(Boolean).join(" · ");
  if (e.type === "phase") return `${e.tag}${e.prefetched ? "（剧情已预写）" : ""} · 第一格出图 ${secs(e.firstMs)} · 剧情 ${secs(e.storyMs)} · 剧情写完后画格 ${secs(e.drawMs)} · 共 ${secs(e.totalMs)} · ${e.calls} 次调用 · $${(e.cost || 0).toFixed(4)}`;
  return e.tag || "";
}
function renderLog() {
  $("log-cost").innerHTML = costHtml();
  const recent = LOG.slice(-200).reverse();
  const phases = LOG.filter(e => e.type === "phase").slice(-3).reverse();
  const time = at => new Date(at).toTimeString().slice(0, 8);
  $("log-sum").innerHTML = phases.length ? phases.map(e => `<div><b>${esc(e.tag)}</b>${e.prefetched ? "（剧情已预写）" : ""}：第一格出图 ${secs(e.firstMs)}，剧情 ${secs(e.storyMs)}，共 ${secs(e.totalMs)}，${e.calls} 次调用，$${(e.cost || 0).toFixed(3)}</div>`).join("") : `<span class="muted">还没有完整的时段记录。跑完一个时段后这里会显示汇总。</span>`;
  $("log-list").innerHTML = recent.map(e => `<div class="log-row log-${e.type} ${e.ok === false ? "bad" : ""}"><span class="t">${time(e.at)}</span>${esc(logText(e))}</div>`).join("") || `<span class="muted">还没有日志</span>`;
}

function notify(msg, bad) {
  const el = document.createElement("div");
  el.className = "notice" + (bad ? " bad" : "");
  el.textContent = msg;
  ($("notices") || document.body).prepend(el);
  setTimeout(() => el.remove(), bad ? 12000 : 6000);
}

// ================= OpenRouter =================
async function blobToDataUrl(blob) {
  return new Promise(ok => { const r = new FileReader(); r.onload = () => ok(r.result); r.readAsDataURL(blob); });
}
function parseJson(text) {
  try { return JSON.parse(text); } catch (e) {
    const m = (text || "").match(/[\[{][\s\S]*[\]}]/);
    if (!m) throw new Error("模型没有返回 JSON：" + (text || "").slice(0, 200));
    return JSON.parse(m[0]);
  }
}
// 传入 onDelta 时用流式接收：边生成边传，连接一直有数据流动，不容易被代理或网络中途掐断。
// 网络错误自动重试 2 次；OpenRouter 返回的错误（如模型名不对、余额不足）不重试，直接报出来。
// 用 XMLHttpRequest 而不是 fetch，是为了能分别记下"上传完成"和"收到第一个字节"的时间。
async function openrouter(model, parts, extra, onDelta, tag, maxSide = 1024) {
  const t0 = performance.now();
  const content = [];
  let images = 0;
  for (const p of parts) {
    if (typeof p === "string") content.push({type: "text", text: p});
    else { content.push({type: "image_url", image_url: {url: await blobToDataUrl(await shrinkForUpload(p, maxSide))}}); images++; }
  }
  const body = JSON.stringify({model, messages: [{role: "user", content}], usage: {include: true}, ...extra, ...(onDelta ? {stream: true} : {})});
  const encMs = performance.now() - t0;
  const apiError = msg => Object.assign(new Error(/OpenRouter 402/.test(msg) ? "OpenRouter 余额不足，请充值后再试（" + msg.slice(0, 120) + "）" : msg), {api: true, noCredit: /OpenRouter 402/.test(msg)});
  let last = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    const entry = {type: "call", tag: tag || "调用", model, attempt, images, upKB: Math.round(body.length / 1024), encMs: Math.round(encMs)};
    let text = "", usage = null;
    const sse = onDelta ? sseParser(d => { text += d; onDelta(text.length, text); }, u => { usage = u; }, apiError) : null;
    try {
      const res = await xhrPost(body, sse);
      Object.assign(entry, res.timing, {status: res.status, downKB: Math.round(res.text.length / 1024)});
      if (res.status !== 200) throw apiError(`OpenRouter ${res.status}：${res.text.slice(0, 300)}`);
      let out;
      if (sse) {
        sse(res.text);
        if (!text) throw new Error("连接中断，没有收到内容");
        out = {content: text};
      } else {
        const data = JSON.parse(res.text);
        if (data.error) throw apiError("OpenRouter 错误：" + JSON.stringify(data.error).slice(0, 300));
        usage = data.usage;
        out = data.choices[0].message;
      }
      entry.cost = addCost(usage); entry.ok = true;
      logEntry(entry);
      return out;
    } catch (e) {
      if (e.timing) Object.assign(entry, e.timing);
      entry.ok = false; entry.error = e.message.slice(0, 200);
      logEntry(entry);
      if (e.api) throw e;
      last = e;
      if (attempt < 3) await sleep(2000 * attempt);
    }
  }
  throw new Error("连不上 OpenRouter（已自动重试 2 次。请确认代理软件或 VPN 开着，再点一次）：" + last.message);
}
// 参考图发送前缩到长边 maxSide 像素、转成 JPEG：生成的图都是 1–3 MB 的 PNG，经代理上传很慢，
// 模型并不需要原尺寸。透明背景铺成白色；压缩后反而更大（如很小的图）就用原图
async function shrinkForUpload(blob, maxSide) {
  try {
    const bmp = await createImageBitmap(blob);
    const k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas");
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    const g = c.getContext("2d");
    g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);
    g.drawImage(bmp, 0, 0, c.width, c.height);
    const out = await new Promise(r => c.toBlob(r, "image/jpeg", 0.85));
    return out && out.size < blob.size ? out : blob;
  } catch (e) { return blob; }
}

function xhrPost(body, onText) {
  return new Promise((resolve, reject) => {
    const x = new XMLHttpRequest(), t = {};
    const timing = () => {
      const up = t.up ?? t.head ?? t.end ?? performance.now();
      const head = t.head ?? t.end ?? performance.now(), end = t.end ?? performance.now();
      return {upMs: Math.round(up - t.send), waitMs: Math.round(head - up), downMs: Math.round(end - head), totalMs: Math.round(end - t.send)};
    };
    x.open("POST", "https://openrouter.ai/api/v1/chat/completions");
    x.setRequestHeader("Authorization", "Bearer " + CFG.key);
    x.setRequestHeader("Content-Type", "application/json");
    x.setRequestHeader("X-Title", "echo1937");
    x.upload.onload = () => { t.up = performance.now(); };
    x.onreadystatechange = () => { if (x.readyState >= 2 && t.head == null) t.head = performance.now(); };
    x.onprogress = () => { if (onText) { try { onText(x.responseText); } catch (e) { x.abort(); reject(Object.assign(e, {timing: timing()})); } } };
    x.onload = () => { t.end = performance.now(); resolve({status: x.status, text: x.responseText, timing: timing()}); };
    const fail = why => () => { t.end = performance.now(); reject(Object.assign(new Error(why), {timing: timing()})); };
    x.onerror = fail("网络错误（连接被断开、超时或被代理拦下）");
    x.ontimeout = fail("请求超时");
    x.onabort = fail("请求被中止");
    t.send = performance.now();
    x.send(body);
  });
}
// 流式响应是一段段追加的文本，每次传入完整的已收到文本，只解析新增的完整行
function sseParser(onDelta, onUsage, apiError) {
  let pos = 0;
  return full => {
    let i;
    while ((i = full.indexOf("\n", pos)) >= 0) {
      const line = full.slice(pos, i).trim();
      pos = i + 1;
      if (!line.startsWith("data:")) continue;  // 跳过 ": OPENROUTER PROCESSING" 这类保活注释
      const data = line.slice(5).trim();
      if (data === "[DONE]") continue;
      let j;
      try { j = JSON.parse(data); } catch (e) { continue; }
      if (j.error) throw apiError("OpenRouter 错误：" + JSON.stringify(j.error).slice(0, 300));
      const delta = j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content;
      if (delta) onDelta(delta);
      if (j.usage) onUsage(j.usage);
    }
  };
}
function addCost(usage) {
  const cost = Number((usage || {}).cost || 0);
  if (cost) { S.cost = Math.round((S.cost + cost) * 10000) / 10000; saveSoon(); }
  return cost;
}
async function visionJson(parts, mock, tag, maxSide = 512) {
  if (CFG.mock) { logEntry({type: "call", tag: tag || "识别", model: "模拟", attempt: 1, ok: true, totalMs: 0}); return typeof mock === "function" ? mock() : (mock || {}); }
  const msg = await openrouter(CFG.vision, parts, {response_format: {type: "json_object"}, temperature: 0.1}, null, tag || "识别", maxSide);
  return parseJson(msg.content || "");
}
const netSlots = {busy: 0, wait: []};
async function withImageSlot(fn) {
  while (netSlots.busy >= Math.max(1, Number(CFG.conc) || 3)) await new Promise(r => netSlots.wait.push(r));
  netSlots.busy++;
  try { return await fn(); }
  finally { netSlots.busy--; const next = netSlots.wait.shift(); if (next) next(); }
}
function genImage(parts, aspect, mockKind, mockLabel, tag) {
  return withImageSlot(() => genImageNow(parts, aspect, mockKind, mockLabel, tag));
}
async function genImageNow(parts, aspect, mockKind, mockLabel, tag) {
  if (CFG.mock) {
    const ms = 300 + Math.random() * 500; await sleep(ms);
    logEntry({type: "call", tag: tag || "生图", model: "模拟", attempt: 1, ok: true, totalMs: Math.round(ms), images: parts.filter(p => typeof p !== "string").length});
    return mockImage(mockKind, mockLabel, aspect);
  }
  const msg = await openrouter(CFG.image, parts, {modalities: ["image", "text"], image_config: {aspect_ratio: aspect}}, null, tag || "生图");
  for (const img of msg.images || []) {
    const url = (img.image_url || {}).url || "";
    if (url.startsWith("data:")) return (await fetch(url)).blob();
  }
  throw new Error("生图模型没有返回图片（可能被安全策略拦截）" + (msg.content ? "：" + msg.content.slice(0, 200) : ""));
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ---------- 模拟模式的占位图 ----------
const ASPECTS = {"2:3": [683, 1024], "3:2": [1024, 683], "4:5": [820, 1024]};
function mockImage(kind, label, aspect) {
  const [w, h] = ASPECTS[aspect] || [1024, 1024];
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const g = c.getContext("2d");
  let seed = 0; for (const ch of label) seed = (seed * 31 + ch.charCodeAt(0)) % 99991;
  const color = `rgb(${80 + seed % 150},${80 + (seed >> 3) % 150},${80 + (seed >> 6) % 150})`;
  g.fillStyle = kind === "style" || kind === "panel" ? color : "#d9d9d9"; g.fillRect(0, 0, w, h);
  if (kind === "scene") {
    const sky = g.createLinearGradient(0, 0, 0, h * 0.65); sky.addColorStop(0, color); sky.addColorStop(1, "#f1e6cf");
    g.fillStyle = sky; g.fillRect(0, 0, w, h * 0.65);
    g.fillStyle = "#b99a72"; g.fillRect(0, h * 0.65, w, h * 0.35);
    g.fillStyle = "rgba(60,40,30,.5)"; for (let i = 0; i < 4; i++) g.fillRect(w * (0.08 + i * 0.24), h * 0.3, w * 0.12, h * 0.35);
    // 模仿生图模型偶尔画出的白边和细线框，用来测试去白边
    const m = Math.round(w * 0.03);
    g.fillStyle = "#fbfbf8"; g.fillRect(0, 0, w, m); g.fillRect(0, h - m, w, m); g.fillRect(0, 0, m, h); g.fillRect(w - m, 0, m, h);
    g.strokeStyle = "#222"; g.lineWidth = 3; g.strokeRect(m + 1.5, m + 1.5, w - 2 * m - 3, h - 2 * m - 3);
  }
  if (kind === "sprite") figure(g, w / 2, h * 0.92, h * 0.78, color, label);
  if (kind === "sheet") { [0.15, 0.32, 0.49].forEach(x => figure(g, w * x, h * 0.92, h * 0.8, color, "stand"));
    for (let i = 0; i < 4; i++) { g.fillStyle = "#ecc8aa"; g.beginPath(); g.ellipse(w * (0.65 + 0.15 * (i % 2)), h * (0.28 + 0.4 * (i >> 1)), 60, 70, 0, 0, 7); g.fill(); } }
  if (kind !== "sprite") { const o = kind === "scene" ? Math.round(w * 0.03) + 8 : 0; g.fillStyle = "#333"; g.font = "16px sans-serif"; g.fillText("MOCK " + kind, 16 + o, 26 + o); }
  return new Promise(ok => c.toBlob(ok, "image/png"));
}
function figure(g, cx, foot, height, color, pose) {
  if (pose.includes("sit_booth") || pose.includes("type")) height *= 0.72;
  const r = height / 9, top = foot - height, bodyTop = top + 2 * r, bodyBot = top + height * 0.6;
  g.fillStyle = "#ecc8aa"; g.beginPath(); g.ellipse(cx, top + r, r, r, 0, 0, 7); g.fill();
  g.fillStyle = color; g.fillRect(cx - r, bodyTop, 2 * r, bodyBot - bodyTop);
  g.fillStyle = "#323246"; g.fillRect(cx - r, bodyBot, r / 2, foot - bodyBot); g.fillRect(cx + r / 2, bodyBot, r / 2, foot - bodyBot);
  g.strokeStyle = color; g.lineWidth = r / 2; g.beginPath();
  if (pose.includes("wake")) { g.moveTo(cx - r, bodyTop); g.lineTo(cx - r - 20, top - r); g.moveTo(cx + r, bodyTop); g.lineTo(cx + r + 20, top - r); }
  else { g.moveTo(cx - r, bodyTop); g.lineTo(cx - 2 * r, bodyBot); g.moveTo(cx + r, bodyTop); g.lineTo(cx + 2 * r, bodyBot); }
  g.stroke();
}

// ================= 提示词（与后端版 onboard.py 一致） =================
const PHOTO_QC = `You are the photo quality checker for an app that turns a user's own photos into a comic character.
Check each photo below (they are numbered in order, starting at 1). Do NOT identify who the person is.
Return JSON exactly in this shape:
{"photos": [{"index": 1, "person_count": 1, "face_visible": true, "face_occluded": false, "sunglasses": false,
  "too_dark_or_blurry": false, "minor_possible": false, "public_figure_or_media": false, "note": ""}]}
Rules:
- person_count: number of clearly visible people (faces or bodies), ignore tiny far-away passers-by.
- face_visible: the main person's face is clearly visible and large enough to see the features.
- face_occluded: hand, mask, hair, hat brim, heavy filter or sticker covering a significant part of the face.
- minor_possible: the person might be under 18. Be cautious: if in doubt, set true.
- public_figure_or_media: the image looks like a film still, magazine/news photo, poster, or a well-known celebrity.
- note: one short sentence in Chinese if something is wrong, otherwise empty.`;
const QC_REASONS = [
  ["person_count", v => v !== 1, "照片里需要只有你一个人"],
  ["face_visible", v => v === false, "脸不够清楚，请换一张正面、光线充足的照片"],
  ["face_occluded", v => v === true, "脸被遮挡了"],
  ["sunglasses", v => v === true, "请不要戴墨镜"],
  ["too_dark_or_blurry", v => v === true, "照片太暗或太模糊"],
];
function sheetPrompt(roleId, feedback) {
  const role = ROLES[roleId];
  let t = `Create a character reference sheet of the person in the photo references, drawn in the art style of the style references (${STYLE_EN}). ` +
    `Keep their face shape, eyes, nose, hairline, hair texture, skin tone and overall likeness recognizable, but stylized, not photorealistic.\n` +
    `Setting: Los Angeles, 1937. Role: ${role.label} (${role.id}). Outfit: ${role.outfit_en}.\n` +
    `Layout: full-body front view, three-quarter view and side view, plus four head close-ups: neutral, smiling, surprised, sad.\n` +
    `Plain light grey background, even studio lighting, no text, no other people.\n${RULES_EN}`;
  if (feedback) t += `\nAdjustment requested by the person: ${feedback}`;
  return t;
}
function spritePrompt(poseId, outfit) {
  return `Draw the character from the character sheet reference in a single new pose. The character sheet is the definitive reference for the face, hair, body shape and outfit (the photo, if given, is only for double-checking likeness). ` +
    `Art style: ${STYLE_EN}, matching the style reference.\nPose: ${POSES[poseId].prompt_en}.\n` +
    `Outfit: ${outfit} (unless the pose says otherwise). Keep it identical to the character sheet.\n` +
    `Full body from the top of the head to the feet, eye-level camera, the character centered, feet near the bottom of the frame with a small margin.\n` +
    `Plain flat light grey background (#D9D9D9) filling the whole image edge to edge: no border, no frame, no panel outline, no white margin. No floor, no cast shadow, no scenery, no props other than those named in the pose, no text, no other people.`;
}
function spriteQcPrompt(poseId, outfit) {
  return `You check one generated character pose image for a comic app.
Expected pose: ${POSES[poseId].prompt_en}
Expected outfit: ${outfit} (unless the pose description specifies different clothing).
Return JSON: {"pose_matches": true, "full_body": true, "single_person": true, "hands_ok": true, "outfit_matches": true, "plain_background": true, "issues": ["short Chinese description of each problem"]}
- full_body: head and both feet are fully inside the frame.
- hands_ok: no extra, missing or badly malformed fingers or hands.
- plain_background: flat light grey background with no scenery or floor shadow.`;
}
const stylePrompt = subject => `A single illustration that defines the art style for a vertical webtoon set in Los Angeles, 1937. Style: ${STYLE_EN}. Subject: ${subject}. No text, no logos, no real brand names.`;

// ================= 图片处理：压缩、抠图、锚点 =================
async function shrink(file, maxSide = 1536) {
  const bmp = await createImageBitmap(file, {imageOrientation: "from-image"});
  const k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas");
  c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  return {blob: await new Promise(r => c.toBlob(r, "image/jpeg", 0.88)), w: c.width, h: c.height};
}

// 去掉纯色背景：从边缘泛洪，只去掉与边缘连通的部分，人物身上的浅灰色不会被抠掉。
// 模型有时会在四周画白边和细线框，这时剩下的区域几乎占满整张图、内圈又是同一种颜色，
// 就把这一层当成画框去掉，再从内圈继续往里抠，最多剥 3 层。
async function cutout(blob) {
  const bmp = await createImageBitmap(blob);
  const w = bmp.width, h = bmp.height, c = document.createElement("canvas");
  c.width = w; c.height = h;
  const g = c.getContext("2d", {willReadFrequently: true});
  g.drawImage(bmp, 0, 0);
  const img = g.getImageData(0, 0, w, h), d = img.data, n = w * h, TOL = 26;
  const removed = new Uint8Array(n);
  for (let i = 0; i < n; i++) if (d[i * 4 + 3] < 16) removed[i] = 1;
  const near = (i, col) => Math.max(Math.abs(d[i * 4] - col[0]), Math.abs(d[i * 4 + 1] - col[1]), Math.abs(d[i * 4 + 2] - col[2])) <= TOL;
  const ring = r => {
    const out = [];
    for (let x = r.x0; x <= r.x1; x += 2) out.push(r.y0 * w + x, r.y1 * w + x);
    for (let y = r.y0; y <= r.y1; y += 2) out.push(y * w + r.x0, y * w + r.x1);
    return out;
  };
  const median = idx => [0, 1, 2].map(ch => idx.map(i => d[i * 4 + ch]).sort((a, b) => a - b)[idx.length >> 1]);
  const queue = new Int32Array(n);
  const flood = (r, col) => {
    let qh = 0, qt = 0;
    const push = (x, y) => {
      if (x < r.x0 || x > r.x1 || y < r.y0 || y > r.y1) return;
      const i = y * w + x;
      if (!removed[i] && near(i, col)) { removed[i] = 1; queue[qt++] = i; }
    };
    for (let x = r.x0; x <= r.x1; x++) { push(x, r.y0); push(x, r.y1); }
    for (let y = r.y0; y <= r.y1; y++) { push(r.x0, y); push(r.x1, y); }
    while (qh < qt) { const i = queue[qh++], x = i % w, y = (i - x) / w; push(x - 1, y); push(x + 1, y); push(x, y - 1); push(x, y + 1); }
  };
  const box = () => {
    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (!removed[y * w + x]) {
      if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
    return x1 < 0 ? null : {x0, y0, x1, y1};
  };
  // 在剩余区域内侧找一圈"同一种颜色"的位置：线框可能很粗、是双线或带角花，所以从浅到深多试几个深度
  const innerRing = b => {
    for (const k of [4, 8, 12, 16, 24, 32, 48]) {
      const r = {x0: b.x0 + k, y0: b.y0 + k, x1: b.x1 - k, y1: b.y1 - k};
      if (r.x1 <= r.x0 || r.y1 <= r.y0) return null;
      // 四条边都要大多不透明（人物的头顶那条边几乎是空的，不会被误认成画框）
      const sides = [ring({...r, y1: r.y0}), ring({...r, y0: r.y1}), ring({...r, x1: r.x0}), ring({...r, x0: r.x1})];
      if (sides.some(sd => sd.filter(i => !removed[i]).length < sd.length * 0.6)) continue;
      const solid = ring(r).filter(i => !removed[i]), col = median(solid);
      // 画框内的底色是浅灰或白色：亮、不饱和
      if (Math.min(...col) < 150 || Math.max(...col) - Math.min(...col) > 24) continue;
      if (solid.filter(i => near(i, col)).length / solid.length >= 0.85) return {r, col};
    }
    return null;
  };
  const edge = ring({x0: 0, y0: 0, x1: w - 1, y1: h - 1}).filter(i => !removed[i]);
  if (edge.length) flood({x0: 0, y0: 0, x1: w - 1, y1: h - 1}, median(edge));
  for (let pass = 0; pass < 3; pass++) {
    const b = box();
    if (!b || b.x1 - b.x0 < w * 0.7 || b.y1 - b.y0 < h * 0.7) break;
    const found = innerRing(b);
    if (!found) break;
    const r = found.r;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (x < r.x0 || x > r.x1 || y < r.y0 || y > r.y1) removed[y * w + x] = 1;
    flood(r, found.col);
  }
  // 只保留最大的连通区域（人物）和与它相当的大块（如高脚凳），去掉背景花纹留下的零碎线条
  const label = new Int32Array(n), sizes = [0];
  for (let i = 0; i < n; i++) {
    if (removed[i] || label[i]) continue;
    const id = sizes.length;
    let qh = 0, qt = 0, size = 0;
    label[i] = id; queue[qt++] = i;
    while (qh < qt) {
      const j = queue[qh++], x = j % w; size++;
      for (const k of [x > 0 ? j - 1 : -1, x < w - 1 ? j + 1 : -1, j - w, j + w]) {
        if (k >= 0 && k < n && !removed[k] && !label[k]) { label[k] = id; queue[qt++] = k; }
      }
    }
    sizes.push(size);
  }
  const biggest = Math.max(0, ...sizes);
  for (let i = 0; i < n; i++) if (!removed[i] && sizes[label[i]] < biggest * 0.15) removed[i] = 1;
  // 收缩 1 像素去掉灰边，再做一次 3×3 平均让边缘柔和
  const a1 = new Uint8Array(n);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    let v = removed[i] ? 0 : 255;
    if (v) for (let dy = -1; dy <= 1 && v; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < w && yy < h && removed[yy * w + xx]) { v = 0; break; }
    }
    a1[i] = v;
  }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let sum = 0, k = 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < w && yy < h) { sum += a1[yy * w + xx]; k++; }
    }
    d[(y * w + x) * 4 + 3] = Math.round(sum / k);
  }
  g.putImageData(img, 0, 0);
  return c;
}

function alphaBox(g, w, h) {
  const d = g.getImageData(0, 0, w, h).data;
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 40) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return x1 < 0 ? null : {x0, y0, x1: x1 + 1, y1: y1 + 1, d};
}

// 裁到人物边界、缩放到统一身高，标出脚底锚点（最低处中点）和头部锚点（顶部 15% 的中心）
async function normalizeSprite(src, ratio) {
  const sg = src.getContext("2d", {willReadFrequently: true});
  const b = alphaBox(sg, src.width, src.height);
  if (!b) throw new Error("抠图后没有找到人物");
  const figH = b.y1 - b.y0;
  if (figH < src.height * 0.2) throw new Error("抠出来的人物太小，可能抠图失败");
  // 剩下一块矩形背景时，外接框四条边全都是满的；人物至少头顶那条边基本是空的
  const sw = src.width, op = (x, y) => b.d[(y * sw + x) * 4 + 3] > 40;
  const side = pts => pts.filter(([x, y]) => op(x, y)).length / Math.max(1, pts.length);
  const xs = [], ys = [];
  for (let x = b.x0; x < b.x1; x += 2) xs.push(x);
  for (let y = b.y0; y < b.y1; y += 2) ys.push(y);
  const sides = [side(xs.map(x => [x, b.y0])), side(xs.map(x => [x, b.y1 - 1])), side(ys.map(y => [b.x0, y])), side(ys.map(y => [b.x1 - 1, y]))];
  if (sides.every(v => v > 0.6)) throw new Error("背景没抠干净（图片可能带了边框或场景），请重新生成");
  const pad = Math.round(figH * 0.02);
  const cx = Math.max(0, b.x0 - pad), cy = Math.max(0, b.y0 - pad);
  const cw = Math.min(src.width, b.x1 + pad) - cx, ch = Math.min(src.height, b.y1 + pad) - cy;
  const scale = BASE_H * ratio / figH;
  const out = document.createElement("canvas");
  out.width = Math.max(1, Math.round(cw * scale)); out.height = Math.max(1, Math.round(ch * scale));
  const og = out.getContext("2d", {willReadFrequently: true});
  og.imageSmoothingQuality = "high";
  og.drawImage(src, cx, cy, cw, ch, 0, 0, out.width, out.height);
  const W2 = out.width, H2 = out.height, f = alphaBox(og, W2, H2);
  const centroid = (top, bottom) => {
    let xs = 0, ys = 0, k = 0;
    for (let y = top; y < bottom; y++) for (let x = f.x0; x < f.x1; x++) if (f.d[(y * W2 + x) * 4 + 3] > 40) { xs += x; ys += y; k++; }
    return k ? [xs / k, ys / k] : [(f.x0 + f.x1) / 2, (top + bottom) / 2];
  };
  const fh = f.y1 - f.y0;
  const [footX] = centroid(f.y1 - Math.max(1, Math.round(fh * 0.03)), f.y1);
  const [headX, headY] = centroid(f.y0, f.y0 + Math.max(1, Math.round(fh * 0.15)));
  const r4 = v => Math.round(v * 10000) / 10000;
  return {blob: await new Promise(r => out.toBlob(r, "image/png")),
    meta: {foot_x: r4(footX / W2), foot_y: r4(f.y1 / H2), head_x: r4(headX / W2), head_y: r4(headY / H2), width: W2, height: H2}};
}

// ================= 入住流程 =================
async function qcPhotos(blobs, sizes) {
  const parts = [PHOTO_QC];
  blobs.forEach((b, i) => parts.push(`Photo ${i + 1}:`, b));
  const raw = await visionJson(parts, () => ({photos: blobs.map((_, i) => ({index: i + 1, person_count: 1, face_visible: true}))}), "照片质检", 768);
  const list = Array.isArray(raw) ? raw : (raw && Array.isArray(raw.photos) ? raw.photos : []);
  const found = {};
  list.forEach(p => { if (p && typeof p === "object") found[Number(p.index)] = p; });
  let block = null;
  const results = blobs.map((_, i) => {
    const r = found[i + 1] || {};
    const reasons = QC_REASONS.filter(([k, bad]) => k in r && bad(r[k])).map(x => x[2]);
    if (Math.min(sizes[i].w, sizes[i].h) < 400) reasons.push("照片分辨率太低");
    if (!found[i + 1]) reasons.push("没能识别这张照片，请换一张");
    if (r.minor_possible === true) block = "照片里的人可能未满 18 岁，Demo 只为成年人生成形象。";
    if (r.public_figure_or_media === true) block = block || "这组照片看起来像剧照、媒体照片或公众人物，只能上传你本人的生活照。";
    return {ok: !reasons.length, reasons, note: typeof r.note === "string" ? r.note : ""};
  });
  return {results, block};
}

async function photoBlobs() {
  const out = [];
  for (const p of S.photos) if (p.ok && p.id && !S.photosDeleted) { const b = await getBlob(p.id); if (b) out.push(b); }
  return out;
}
async function styleBlobs(n) {
  const out = [];
  for (const id of STYLE.selected.slice(0, n)) { const b = await getBlob(id); if (b) out.push(b); }
  return out;
}

async function makeSheet(feedback) {
  const sheet = {id: uid(), attempt: S.sheets.length + 1, feedback: (feedback || "").trim().slice(0, 200), status: "generating", error: null};
  S.sheets.push(sheet); await save(); render();
  try {
    const parts = [sheetPrompt(S.role, sheet.feedback), "Photo references of the person:", ...await photoBlobs()];
    const styles = await styleBlobs(2);
    if (styles.length) parts.push("Style references (copy the art style only, not the content):", ...styles);
    const blob = await genImage(parts, "3:2", "sheet", `${S.role}-${sheet.attempt}`, "你·设定图");
    await putBlob("sheet:" + sheet.id, blob);
    sheet.status = "ready";
  } catch (e) { sheet.status = "failed"; sheet.error = e.message; console.error(e); }
  await save(); render();
}

async function approve(sheetId, keep) {
  S.approved = sheetId; S.keepPhotos = keep;
  S.world = {day: 1, phase: "dawn", pace: "fast"};
  for (const p of W.poses) S.sprites[p.id] = {status: "queued", attempts: 0, version: 0, meta: null, qc: null, error: null};
  await save();
  for (const p of W.poses) enqueue(p.id, FIRST_DAY.includes(p.id) ? PRI_FIRST : PRI_REST);
  render();
}

// ---------- 动作包队列：按优先级、限制并发 ----------
const queue = []; let running = 0;
function enqueue(pose, priority) {
  if (queue.some(t => t.pose === pose)) return;
  queue.push({pose, priority});
  pump();
}
function pump() {
  while (running < Math.max(1, Number(CFG.conc) || 3) && queue.length && live()) {
    queue.sort((a, b) => b.priority - a.priority);
    const t = queue.shift();
    running++;
    makeSprite(t.pose).finally(() => { running--; pump(); });
  }
}

async function spriteQc(blob, pose, outfit, who) {
  let raw;
  try {
    raw = await visionJson([spriteQcPrompt(pose, outfit), blob], {pose_matches: true, full_body: true, single_person: true, hands_ok: true, outfit_matches: true, plain_background: true, issues: []}, `${who}·动作质检 ${pose}`);
  } catch (e) {
    // 余额不足、连不上这类错误照常抛出；只有"模型回了但 JSON 坏了"时才放过
    if (e.api || e.message.startsWith("连不上")) throw e;
    return {pass: false, unknown: true, failed: [], issues: ["质检没有返回有效结果，这张没检查"]};
  }
  const r = raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {};
  const failed = ["pose_matches", "full_body", "single_person", "hands_ok", "outfit_matches", "plain_background"].filter(k => r[k] === false);
  const issues = Array.isArray(r.issues) ? r.issues.filter(x => x).map(String) : [];
  return {pass: !failed.length, failed, issues};
}

// 生成一个动作：出图 → 质检（不合格自动重生一次）→ 抠图 → 锚点与统一身高。用户和常驻角色共用
async function generateSprite(sheet, photo, pose, outfit, who = "你") {
  const parts = [spritePrompt(pose, outfit), "Character sheet reference:", sheet];
  if (photo) parts.push("Photo of the real person (likeness check only):", photo);
  const styles = await styleBlobs(1);
  if (styles.length) parts.push("Style reference (art style only):", styles[0]);
  let raw = null, qc = null, attempt = 0;
  for (attempt = 1; attempt <= 2; attempt++) {
    raw = await genImage(parts, "2:3", "sprite", pose, `${who}·动作图 ${pose}`);
    qc = await spriteQc(raw, pose, outfit, who);
    if (qc.pass || qc.unknown) break;
  }
  const c0 = performance.now();
  const cut = await cutout(raw);
  const c1 = performance.now();
  const {blob, meta} = await normalizeSprite(cut, POSES[pose].ratio);
  logEntry({type: "local", tag: `${who}·抠图 ${pose}`, cutMs: Math.round(c1 - c0), normMs: Math.round(performance.now() - c1), totalMs: Math.round(performance.now() - c0)});
  return {blob, raw, meta, qc, attempts: Math.min(attempt, 2), status: qc.pass ? "ready" : "qc_warn"};
}

async function makeSprite(pose) {
  const sp = S.sprites[pose];
  sp.status = "generating"; sp.error = null; saveSoon(); render();
  try {
    const photos = await photoBlobs();
    const {blob, raw, meta, qc, attempts: attempt, status} = await generateSprite(await getBlob("sheet:" + S.approved), photos[0], pose, ROLES[S.role].outfit_en);
    const old = sp.version;
    sp.version = Date.now();
    await putBlob(`sprite:${pose}:${sp.version}`, blob);
    await store.set(`blob:raw:${pose}:${sp.version}`, raw);
    if (old) { await delBlob(`sprite:${pose}:${old}`); await store.del(`blob:raw:${pose}:${old}`); }
    Object.assign(sp, {status, meta, qc, attempts: sp.attempts + attempt});
  } catch (e) { sp.status = "failed"; sp.error = e.message; console.error(e); }
  await finishPackIfDone();
  await save(); render();
}

async function finishPackIfDone() {
  const list = Object.values(S.sprites);
  const pending = list.some(s => s.status === "queued" || s.status === "generating");
  const allOk = list.length === W.poses.length && list.every(s => s.status === "ready" || s.status === "qc_warn");
  if (!pending && allOk && !S.keepPhotos && !S.photosDeleted) await deletePhotos();
}
async function deletePhotos() {
  for (const p of S.photos) await delBlob(p.id);
  S.photosDeleted = true;
  await save();
}

// 用保存的原图重新抠图和标锚点，不调用接口；旧版本没存原图的，用当前动作图重抠
async function recutAll() {
  let ok = 0, bad = 0;
  for (const [pose, sp] of Object.entries(S.sprites)) {
    if (!sp.version || sp.status === "queued" || sp.status === "generating") continue;
    // 每次都从同一张原图重抠，多点几次结果也一样；旧版本没存原图的，把当前动作图存成原图
    let src = await store.get(`blob:raw:${pose}:${sp.version}`);
    if (!src) {
      src = await getBlob(`sprite:${pose}:${sp.version}`);
      if (!src) continue;
      await store.set(`blob:raw:${pose}:${sp.version}`, src);
    }
    try {
      const {blob, meta} = await normalizeSprite(await cutout(src), POSES[pose].ratio);
      await putBlob(`sprite:${pose}:${sp.version}`, blob);
      sp.meta = meta;
      if (sp.status === "failed") sp.status = "ready";
      ok++;
    } catch (e) { sp.status = "failed"; sp.error = e.message; bad++; }
    render();
  }
  await save(); render();
  return {ok, bad};
}
