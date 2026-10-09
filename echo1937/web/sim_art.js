"use strict";
// ================= 城市模拟测试页的配图 =================
// 给日志里的事件直接生成一格漫画：场景底图 + 你的形象设定图 + 在场人物的设定图做参考，fal 的 FLUX.2 klein 9B 或 Gemini 生图。
// 素材都读漫画版主页（index.html）存在同一个浏览器里的东西（IndexedDB echo1937/kv），Key 也读主页的设置（localStorage），这里不新存 Key。
// 生成的图存回同一个 IndexedDB，键 blob:simimg:<局>:<日志序号>，新开一局时删掉上一局的。
// 依赖页面里的 D（Sim.makeData 的结果）。
const Art = (() => {
  const W = window.WORLD;
  const PLACES = Object.fromEntries(W.places.map(p => [p.id, p]));
  const RES = Object.fromEntries(W.residents.map(r => [r.id, r]));
  const ROLES = Object.fromEntries(W.roles.map(r => [r.id, r]));
  const FAL_W = 1024, FAL_H = 688;
  const ROLE_EN = {singer: "nightclub singer", makeup: "film studio makeup artist", reporter: "newspaper reporter"};
  const A = {
    cfg: {}, db: null, me: null, urls: {}, jobs: {}, queue: [], running: 0, conc: 2,
    spent: 0, count: 0, off: null, onChange: () => {},
  };

  // ---------- 设置和素材 ----------
  function readCfg() {
    let c = {};
    try { c = JSON.parse(localStorage.getItem("echo1937.settings") || "{}"); } catch (e) {}
    try { if (!c.falKey) c.falKey = localStorage.getItem("echo1937.falKey") || ""; } catch (e) {}
    let mine = {};
    try { mine = JSON.parse(localStorage.getItem("echo1937.simArt2") || "{}"); } catch (e) {}
    A.cfg = {orKey: c.key || "", falKey: c.falKey || "", falModel: c.falModel || "fal-ai/flux-2/klein/9b/edit",
      image: c.image || "google/gemini-2.5-flash-image", text: c.vision || "google/gemini-2.5-flash", mock: !!c.mock,
      engine: mine.engine || (c.key ? "gemini" : "fal"), auto: mine.auto || "slot"};
  }
  function saveMine() { try { localStorage.setItem("echo1937.simArt2", JSON.stringify({engine: A.cfg.engine, auto: A.cfg.auto})); } catch (e) {} }
  const ready = () => A.cfg.mock || (A.cfg.engine === "fal" ? !!A.cfg.falKey : !!A.cfg.orKey);

  function kv(mode, fn) {
    return new Promise((ok, no) => {
      const t = A.db.transaction("kv", mode), s = t.objectStore("kv"), r = fn(s);
      t.oncomplete = () => ok(r && r.result); t.onerror = () => no(t.error);
    });
  }
  const get = k => A.db ? kv("readonly", s => s.get(k)).catch(() => null) : Promise.resolve(null);
  const put = (k, v) => A.db ? kv("readwrite", s => s.put(v, k)).catch(() => null) : Promise.resolve();
  const del = k => A.db ? kv("readwrite", s => s.delete(k)).catch(() => null) : Promise.resolve();

  async function init() {
    readCfg();
    try {
      A.db = await new Promise((ok, no) => {
        const r = indexedDB.open("echo1937", 1);
        r.onupgradeneeded = () => r.result.createObjectStore("kv");
        r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
      });
    } catch (e) { A.db = null; }
    // 你的形象：漫画版里确认过的设定图；没有的话用站姿动作图
    const S = await get("state");
    if (S && S.approved) {
      const sheet = await get("blob:sheet:" + S.approved);
      const sp = S.sprites && S.sprites.stand;
      const stand = sp && sp.version ? await get(`blob:sprite:stand:${sp.version}`) : null;
      if (sheet || stand) A.me = {sheet, stand, role: S.role};
    }
  }

  // ---------- 这一格画什么 ----------
  function castOf(e) {
    const card = (e.card && D.cards.find(c => c.id === e.card)) || null;
    let cast = card && card.render && card.render.cast ? card.render.cast : e.target ? ["user", e.target] : ["user"];
    return {card, cast: cast.filter(id => id === "user" || RES[id]).slice(0, 3)};
  }
  const nameEn = id => id === "user" ? "the protagonist" : RES[id].name_en.split(" ")[0];
  function whereEn(e) {
    const p = PLACES[e.place] || {}, sub = e.sub && D.sim.places[e.place].subs[e.sub];
    return sub && sub.desc_en ? sub.desc_en : p.desc_en || e.place;
  }

  // 先让文字模型把中文事件写成一段英文画面描述（快、便宜）；没有 OpenRouter Key 时直接用中文
  async function describe(e, cast, card, ctx) {
    const zh = `${e.title ? "【" + e.title + "】" : ""}${e.text}`;
    const plain = {desc: zh, shot: (card && card.render && card.render.cam) || "medium"};
    if (!A.cfg.orKey || A.cfg.mock || A.noDesc) return plain;
    const who = cast.map(id => id === "user" ? `the protagonist (a young ${ROLE_EN[ctx.role] || ctx.role} in 1937 Los Angeles)` : `${RES[id].name_en} (${RES[id].appearance_en})`).join("; ");
    const prompt = `You write the picture description for ONE comic panel. Output JSON only: {"description_en": "...", "shot": "wide" | "medium" | "close"}.
Event (Chinese, from the story log): ${zh}
Location: ${whereEn(e)}. Time: ${e.slotLabel} (${e.slot}).
People in the panel (no one else in focus): ${who}.
Write 2-3 concrete sentences in English: what each person is doing, their pose, expression and where they look, and the key prop or detail. Refer to people as "the protagonist", ${cast.filter(x => x !== "user").map(nameEn).join(", ") || "nobody else"}. Describe only what a single still image can show; no dialogue, no text in the image. ${W.content_rules_en}`;
    const t0 = performance.now();
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST", headers: {"Authorization": "Bearer " + A.cfg.orKey, "Content-Type": "application/json"},
      body: JSON.stringify({model: A.cfg.text, messages: [{role: "user", content: prompt}], response_format: {type: "json_object"}, usage: {include: true}, max_tokens: 400}),
    });
    const data = await res.json().catch(() => ({}));
    // 写描述失败不影响出图：退回中文；Key 不对或没余额时这次打开页面期间不再写
    if (!res.ok || data.error) { if ([401, 402, 403].includes(res.status)) A.noDesc = true; return plain; }
    const cost = (data.usage && data.usage.cost) || 0;
    let out = {};
    try { out = JSON.parse(String(data.choices[0].message.content).replace(/^```(json)?|```$/g, "")); } catch (err) {}
    return {desc: out.description_en || zh, shot: out.shot || "medium", cost, ms: Math.round(performance.now() - t0)};
  }

  // 先说画谁、发生什么，再交代每张参考图。场景底图是空的，要明确让模型把人画进去，否则容易只还原一张空场景
  function imagePrompt(e, cast, desc, shot, sceneBlob, ctx, refs) {
    const who = cast.map(nameEn), L = [];
    L.push(`Draw ONE finished comic panel of a story moment with ${who.length > 1 ? who.length + " people" : "one person"} in it: ${who.join(" and ")}. Art style: ${W.style.prompt_en}. Los Angeles, 1937.`);
    L.push(`What happens: ${desc}`);
    L.push(`Shot: ${{wide: "wide shot: full bodies, the setting clearly visible around them", medium: "medium shot: from the knees or waist up, the setting behind them", close: "close-up on the faces and hands, a little of the setting behind"}[shot] || "medium shot"}. ${who.join(" and ")} must be clearly visible, in focus, and the main subject of the panel.`);
    let i = 1;
    L.push("References:");
    if (sceneBlob) L.push(`- Image ${i++}: the EMPTY location, background only. Use it for the setting (architecture, furniture, colors, light: ${e.slot}). It has no people in it: draw the characters INTO this place at a natural scale, feet on the floor or sitting on a real seat, lit by the same light. Do not return the empty background.`);
    else L.push(`- Location (no image): ${whereEn(e)}; time of day: ${e.slot === "late" ? "late night" : e.slot}.`);
    for (const r of refs) L.push(`- Image ${i++}: ${r.what} of ${r.name} (several views of the same person). Draw ${r.name} ONCE with exactly this face, hair, body and outfit. Do not copy the sheet's layout, multiple views or grey background.`);
    for (const id of cast) if (id !== "user" && !refs.some(r => r.id === id)) L.push(`- ${nameEn(id)} (no image): ${RES[id].appearance_en}, wearing ${RES[id].outfit_en}.`);
    if (cast.includes("user") && !refs.some(r => r.id === "user")) L.push(`- The protagonist (no image): a young adult ${ROLE_EN[ctx.role] || ctx.role}, wearing ${ROLES[ctx.role] ? ROLES[ctx.role].outfit_en : "1937 clothes"}.`);
    L.push(`Only ${who.join(" and ")} in focus; blurred distant extras are fine in public places. Every person has exactly two arms, two hands, two legs and two feet; nobody appears twice.`);
    L.push(`No text, no speech bubbles, no captions, no border or frame. ${W.content_rules_en}`);
    return L.join("\n");
  }

  // ---------- 生图 ----------
  async function toDataUrl(blob, maxSide) {
    const bmp = await createImageBitmap(blob);
    const k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    const g = c.getContext("2d"); g.fillStyle = "#d9d9d9"; g.fillRect(0, 0, c.width, c.height); g.drawImage(bmp, 0, 0, c.width, c.height);
    return c.toDataURL("image/webp", 0.85);
  }
  let falFormat = "webp";
  async function viaFal(prompt, images) {
    // 一张参考图都没有（没生成过底图和形象）时改用同一个模型的文生图接口
    const model = images.length ? A.cfg.falModel : A.cfg.falModel.replace(/\/edit$/, "");
    for (let attempt = 1; attempt <= 2; attempt++) {
      const urls = [];
      for (const b of images) urls.push(await toDataUrl(b, 768));
      const res = await fetch("https://fal.run/" + model, {
        method: "POST", headers: {"Authorization": "Key " + A.cfg.falKey, "Content-Type": "application/json"},
        body: JSON.stringify({prompt, ...(urls.length ? {image_urls: urls} : {}), image_size: {width: FAL_W, height: FAL_H}, output_format: falFormat, sync_mode: true, num_images: 1}),
      });
      const text = await res.text();
      if (res.status === 422 && falFormat === "webp" && /output_format|webp/i.test(text)) { falFormat = "jpeg"; continue; }
      if ([401, 402, 403].includes(res.status)) A.off = res.status === 401 ? "fal Key 不对" : "fal 账户余额不足或被停用";
      if (!res.ok) throw new Error(`fal ${res.status}：${text.slice(0, 160)}`);
      const data = JSON.parse(text), out = data.images && data.images[0];
      if (!out || !out.url) throw new Error("fal 没有返回图片");
      // fal 按百万像素计费（输入加输出），按每百万像素约 $0.01 估算
      const cost = Math.round((images.length * 0.3 + FAL_W * FAL_H / 1e6) * 0.01 * 10000) / 10000;
      return {blob: await (await fetch(out.url)).blob(), cost};
    }
    throw new Error("fal 生图失败");
  }
  async function viaGemini(prompt, images, labels) {
    const content = [{type: "text", text: prompt}];
    for (let i = 0; i < images.length; i++) content.push({type: "text", text: labels[i]}, {type: "image_url", image_url: {url: await toDataUrl(images[i], 1024)}});
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST", headers: {"Authorization": "Bearer " + A.cfg.orKey, "Content-Type": "application/json"},
      body: JSON.stringify({model: A.cfg.image, messages: [{role: "user", content}], modalities: ["image", "text"], image_config: {aspect_ratio: "3:2"}, usage: {include: true}}),
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) A.off = "OpenRouter Key 不对";
    if (res.status === 402) A.off = "OpenRouter 余额不足";
    if (!res.ok || data.error) throw new Error(`OpenRouter ${res.status}：${JSON.stringify(data.error || "").slice(0, 160)}`);
    const msg = data.choices[0].message;
    for (const img of msg.images || []) {
      const url = (img.image_url || {}).url || "";
      if (url.startsWith("data:")) return {blob: await (await fetch(url)).blob(), cost: (data.usage && data.usage.cost) || 0};
    }
    throw new Error("Gemini 没有返回图片（可能被安全策略拦截）");
  }
  function mockPanel(e) {
    const c = document.createElement("canvas"); c.width = 600; c.height = 400; const g = c.getContext("2d");
    g.fillStyle = `hsl(${(e.n * 47) % 360},40%,45%)`; g.fillRect(0, 0, 600, 400);
    g.fillStyle = "#fff"; g.font = "22px sans-serif"; g.fillText("MOCK · " + (e.title || e.action || e.kind), 20, 200);
    return new Promise(ok => c.toBlob(b => ok({blob: b, cost: 0}), "image/png"));
  }

  async function draw(st, e) {
    const {card, cast} = castOf(e);
    const t0 = performance.now();
    const d = await describe(e, cast, card, {role: st.role}).catch(() => ({desc: `${e.title ? "【" + e.title + "】" : ""}${e.text}`, shot: "medium"}));
    const scene = e.sub ? null : await sceneBlobFor(e.place, e.slot);
    const images = [], labels = [], refs = [];
    if (scene) { images.push(scene); labels.push(`Image ${images.length}: the location.`); }
    if (cast.includes("user") && A.me) {
      images.push(A.me.sheet || A.me.stand); labels.push(`Image ${images.length}: the protagonist.`);
      refs.push({id: "user", name: "the protagonist", what: A.me.sheet ? "a character reference sheet" : "a full-body reference"});
    }
    for (const id of cast) if (id !== "user") {
      const b = await get(`blob:res:${id}:sheet`);
      if (b) { images.push(b); labels.push(`Image ${images.length}: ${nameEn(id)}.`); refs.push({id, name: nameEn(id), what: "a character reference sheet"}); }
    }
    const prompt = imagePrompt(e, cast, d.desc, d.shot, scene, {role: st.role}, refs);
    const out = A.cfg.mock ? await mockPanel(e) : A.cfg.engine === "fal" ? await viaFal(prompt, images) : await viaGemini(prompt, images, labels);
    return {...out, cost: (out.cost || 0) + (d.cost || 0), ms: Math.round(performance.now() - t0), prompt};
  }
  // 场景底图：sim.json 里地点 → 时段对应的光线；没有就用这个地点已有的任意一张
  async function sceneBlobFor(place, slot) {
    const want = (D.sim.places[place].lights || {})[slot], all = (PLACES[place] || {}).lights || [];
    for (const l of [want, ...all]) if (l) { const b = await get(`blob:scene:${place}:${l}`); if (b) return b; }
    return null;
  }

  // ---------- 队列 ----------
  const key = (st, n) => `blob:simimg:${st.gid}:${n}`;
  async function loadGame(st) {
    A.gid = st.gid;
    for (const [n, k] of Object.entries(st.imgs || {})) {
      if (A.urls[n]) continue;
      const b = await get(k);
      if (b) A.urls[n] = URL.createObjectURL(b);
    }
  }
  // 先同步清掉内存里的，再慢慢删库里的：新一局的图可能在删的过程中就画好了
  function dropGame(st) {
    const keys = Object.values(st.imgs || {});
    for (const u of Object.values(A.urls)) URL.revokeObjectURL(u);
    A.urls = {}; A.jobs = {}; A.queue = [];
    return Promise.all(keys.map(del));
  }
  function request(st, e) {
    if (A.urls[e.n] || (A.jobs[e.n] && A.jobs[e.n].state !== "failed")) return;
    if (!ready()) { A.jobs[e.n] = {state: "failed", error: A.cfg.engine === "fal" ? "没有 fal Key：去漫画版的设置里填" : "没有 OpenRouter Key：去漫画版的设置里填"}; A.onChange(); return; }
    if (A.off) { A.jobs[e.n] = {state: "failed", error: "已暂停：" + A.off}; A.onChange(); return; }
    A.jobs[e.n] = {state: "queued"};
    A.queue.push({st, e});
    pump(); A.onChange();
  }
  function pump() {
    while (A.running < A.conc && A.queue.length) {
      const {st, e} = A.queue.shift();
      if (A.off) { A.jobs[e.n] = {state: "failed", error: "已暂停：" + A.off}; continue; }
      A.running++; A.jobs[e.n] = {state: "drawing", since: Date.now()}; A.onChange();
      draw(st, e).then(async out => {
        if (st.gid !== A.gid) return;
        const k = key(st, e.n);
        await put(k, out.blob);
        (st.imgs = st.imgs || {})[e.n] = k;
        A.urls[e.n] = URL.createObjectURL(out.blob);
        A.spent += out.cost; A.count++;
        st.artCost = (st.artCost || 0) + out.cost; st.artN = (st.artN || 0) + 1;
        A.jobs[e.n] = {state: "done", ms: out.ms, cost: out.cost};
      }).catch(err => { A.jobs[e.n] = {state: "failed", error: err.message.slice(0, 200)}; })
        .finally(() => { A.running--; A.onChange(); pump(); });
    }
  }
  // 自动配图：大事（故事卡、抉择），或者另外给每个时段挑一件最要紧的事
  function weight(e) {
    if (e.kind === "card" || e.kind === "choice") return 100;
    if (e.kind !== "action") return 0;
    return 10 + (e.target ? 20 : 0) + (e.outcome ? 10 : 0) + (e.action === "work" || /上班|登台/.test(e.text) ? 15 : 0);
  }
  function autoPick(st, from) {
    if (A.cfg.auto === "off") return [];
    const fresh = st.log.filter(e => e.n > from && e.kind !== "time");
    // 每一步都画：所有动作、故事卡和抉择（走路不画）
    if (A.cfg.auto === "every") return fresh.filter(e => ["card", "choice", "action"].includes(e.kind));
    // 接管时你做的每一个动作都马上画，像实时操作
    const pick = fresh.filter(e => e.kind === "card" || e.kind === "choice" || (e.who === "player" && e.kind === "action"));
    if (A.cfg.auto === "slot") {
      const groups = {};
      for (const e of fresh) (groups[e.day + ":" + e.slot] = groups[e.day + ":" + e.slot] || []).push(e);
      for (const g of Object.values(groups)) {
        if (g.some(e => e.kind === "card" || e.kind === "choice")) continue;
        const best = g.filter(e => weight(e) > 0).sort((a, b) => weight(b) - weight(a))[0];
        if (best) pick.push(best);
      }
    }
    return pick;
  }
  function auto(st, from) { for (const e of autoPick(st, from)) request(st, e); }
  function status() {
    const q = Object.values(A.jobs);
    return {drawing: q.filter(j => j.state === "drawing").length, queued: q.filter(j => j.state === "queued").length};
  }

  return Object.assign(A, {init, readCfg, saveMine, ready, request, auto, loadGame, dropGame, status, castOf});
})();
