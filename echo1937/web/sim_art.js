"use strict";
// ================= 城市模拟测试页的配图 =================
// 给日志里的事件画一格漫画。默认走漫画版的「拼接 + klein 融合」（sim_fuse.js）；也可以选 Gemini 从头画：
// 场景底图 + 你的形象设定图 + 在场人物的设定图做参考。
// 素材都读漫画版主页（index.html）存在同一个浏览器里的东西（IndexedDB echo1937/kv），Key 也读主页的设置（localStorage），这里不新存 Key。
// 生成的图存回同一个 IndexedDB，键 blob:simimg:<局>:<日志序号>，新开一局时删掉上一局的。
// 依赖页面里的 D（Sim.makeData 的结果）。
const Art = (() => {
  const W = window.WORLD;
  const PLACES = Object.fromEntries(W.places.map(p => [p.id, p]));
  const RES = Object.fromEntries(W.residents.map(r => [r.id, r]));
  const ROLES = Object.fromEntries(W.roles.map(r => [r.id, r]));
  const ROLE_EN = {singer: "nightclub singer", makeup: "film studio makeup artist", reporter: "newspaper reporter"};
  const A = {
    cfg: {}, db: null, me: null, urls: {}, rej: {}, jobs: {}, queue: [], running: 0, conc: 2, sceneHotMem: {}, descP: {}, warmAt: 0,
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
      engine: ({fal: "fuse"})[mine.engine] || mine.engine || "fuse", auto: mine.auto || "slot", klein: mine.klein || "4b"};
  }
  function saveMine() { try { localStorage.setItem("echo1937.simArt2", JSON.stringify({engine: A.cfg.engine, auto: A.cfg.auto, klein: A.cfg.klein})); } catch (e) {} }
  // 拼接 + 融合：有你的形象就能画（没有 fal Key 时只拼接）；Gemini 从头画要 OpenRouter Key
  const ready = () => A.cfg.mock || (A.cfg.engine === "gemini" ? !!A.cfg.orKey : !!A.me);

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
      if (sheet || stand) A.me = {sheet, stand, role: S.role, id: S.approved};
    }
  }

  // ---------- 主角长什么样 ----------
  // klein 这类模型参考图一多就会把几个人的衣服混在一起（主角穿上梅的围裙），所以把主角的样子写成文字一起锁住
  async function myLook() {
    if (!A.me || !A.cfg.orKey || A.cfg.mock) return "";
    if (A.me.look !== undefined) return A.me.look;
    const k = `simme:look:${A.me.id}`;
    let look = await get(k);
    if (!look) {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST", headers: {"Authorization": "Bearer " + A.cfg.orKey, "Content-Type": "application/json"},
          body: JSON.stringify({model: A.cfg.text, response_format: {type: "json_object"}, max_tokens: 300, usage: {include: true},
            messages: [{role: "user", content: [{type: "text", text: 'This is a character reference for a comic. Describe how this one fictional character looks so an illustrator can draw them the same way every time, in one English sentence: apparent gender, age range, hair color and style, skin tone, and the full outfit with its colors and accessories. Output JSON only: {"look_en": "..."}'},
              {type: "image_url", image_url: {url: await toDataUrl(A.me.sheet || A.me.stand, 1024)}}]}]}),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && !data.error) {
          try { look = JSON.parse(String(data.choices[0].message.content).replace(/^```(json)?|```$/g, "")).look_en || ""; } catch (e) {}
          if (look) await put(k, look);
        }
      } catch (e) {}
    }
    A.me.look = look || "";
    return A.me.look;
  }

  // ---------- 这一格画什么 ----------
  // 主角色（这一格的主体）+ 背景里在场的人（做自己的事）。在餐厅点餐时，端东西的梅也算主角色
  function castOf(e) {
    const card = (e.card && D.cards.find(c => c.id === e.card)) || null;
    let cast = card && card.render && card.render.cast ? [...card.render.cast] : e.target ? ["user", e.target] : ["user"];
    const present = e.present || [];
    if (serves(e) && present.includes("mae") && !cast.includes("mae")) cast.push("mae");
    cast = cast.filter(id => id === "user" || RES[id]).slice(0, 3);
    const bg = present.filter(id => RES[id] && !cast.includes(id)).slice(0, Math.max(0, 3 - cast.length));
    return {card, cast, bg};
  }
  const serves = e => e.kind === "action" && /^(eat|order_)/.test(e.action || "") && e.place === "diner";
  const serverEn = e => (e.present || []).includes("mae") ? "Mae" : "a tired night-shift waitress in a pink uniform";
  const doingEn = (id, e) => ((D.sim.npcs[id] || {}).doing_en || {})[e.place] || `${nameEn(id)} is there, busy with their own things`;
  const ambientEn = e => ((D.sim.places[e.place] || {}).ambient_en || {})[e.slot] || "";
  const nameEn = id => id === "user" ? "the protagonist" : RES[id].name_en.split(" ")[0];
  function whereEn(e) {
    const p = PLACES[e.place] || {}, sub = e.sub && D.sim.places[e.place].subs[e.sub];
    return sub && sub.desc_en ? sub.desc_en : p.desc_en || e.place;
  }

  // 先让文字模型把中文事件写成一段英文画面描述（快、便宜）；没有 OpenRouter Key 时直接用中文
  function visualHint(e, card) {
    if (card && card.render && card.render.visual_en) return card.render.visual_en;
    const Ac = e.action && D.sim.actions[e.action];
    if (e.kind === "action" && Ac && Ac.visual_en) return Ac.visual_en.replace(/the server/g, serverEn(e));
    if (e.kind === "move") return `the protagonist has just arrived and looks around ${whereEn(e)}`;
    return "";
  }
  async function describe(e, cast, card, ctx, bg = []) {
    const zh = `${e.title ? "【" + e.title + "】" : ""}${e.text}`, hint = visualHint(e, card);
    const plain = {desc: hint ? `${hint}. (${zh})` : zh, shot: (card && card.render && card.render.cam) || "medium"};
    if (!A.cfg.orKey || A.cfg.mock || A.noDesc) return plain;
    const who = cast.map(id => id === "user" ? `the protagonist (a young ${ROLE_EN[ctx.role] || ctx.role} in 1937 Los Angeles)` : `${RES[id].name_en} (${RES[id].appearance_en})`).join("; ");
    const prompt = `You write the picture description for ONE comic panel. Output JSON only: {"description_en": "...", "shot": "wide" | "medium" | "close"}.
Event (Chinese, from the story log): ${zh}
Location: ${whereEn(e)}. Time: ${e.slotLabel} (${e.slot}).
Main people: ${who}.
${bg.length ? "Also in the scene, in the background: " + bg.map(id => doingEn(id, e)).join("; ") + ".\n" : ""}${ambientEn(e) ? "Extras: " + ambientEn(e) + ".\n" : ""}${hint ? "Picture hint from the writer (follow it): " + hint + ".\n" : ""}Write 2-3 concrete sentences in English: what each person is doing, their pose, expression and where they look, and the key prop or detail. Refer to people as "the protagonist", ${[...cast, ...bg].filter(x => x !== "user").map(nameEn).join(", ") || "nobody else"}; mention the background people and extras in one short clause. Describe only what a single still image can show; no dialogue, no text in the image. ${W.content_rules_en}`;
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
  function imagePrompt(e, cast, desc, shot, sceneBlob, ctx, refs, bg = []) {
    const who = cast.map(nameEn), L = [];
    L.push(`Draw ONE finished comic panel of a story moment with ${who.length > 1 ? who.length + " people" : "one person"} in it: ${who.join(" and ")}. Art style: ${W.style.prompt_en}. Los Angeles, 1937.`);
    L.push(`What happens: ${desc}`);
    L.push(`Shot: ${{wide: "wide shot: full bodies, the setting clearly visible around them", medium: "medium shot: from the knees or waist up, the setting behind them", close: "close-up on the faces and hands, a little of the setting behind"}[shot] || "medium shot"}. ${who.join(" and ")} must be clearly visible, in focus, and the main subject of the panel.`);
    let i = 1;
    L.push("References:");
    if (sceneBlob && ctx.prev) L.push(`- Image ${i++}: the previous panel, the same place a moment earlier. Keep the same room, furniture and light; the camera and poses change for the new moment. Take all clothes and faces from the character references and descriptions below, not from this panel.`);
    else if (sceneBlob) L.push(`- Image ${i++}: the EMPTY location, background only. Use it for the setting (architecture, furniture, colors, light: ${e.slot}). It has no people in it: draw the characters INTO this place at a natural scale, feet on the floor or sitting on a real seat, lit by the same light. Do not return the empty background.`);
    else L.push(`- Location (no image): ${whereEn(e)}; time of day: ${e.slot === "late" ? "late night" : e.slot}.`);
    for (const r of refs) L.push(`- Image ${i++}: ${r.what} of ${r.name}${/sheet/.test(r.what) ? " (several views of the same person)" : ""}. Draw ${r.name} ONCE with exactly this face, hair, body and outfit. Do not copy its layout or grey background.`);
    for (const id of [...cast, ...bg]) if (id !== "user" && !refs.some(r => r.id === id)) L.push(`- ${nameEn(id)} (no image): ${RES[id].appearance_en}, wearing ${RES[id].outfit_en}.`);
    if (cast.includes("user") && !refs.some(r => r.id === "user")) L.push(`- The protagonist (no image): ${ctx.look || "a young adult " + (ROLE_EN[ctx.role] || ctx.role) + ", wearing " + (ROLES[ctx.role] ? ROLES[ctx.role].outfit_en : "1937 clothes")}.`);
    // 服装锁定：主角就是主角的样子；每个配角的衣服只属于他自己
    if (cast.includes("user") && ctx.look) L.push(`The protagonist looks exactly like this in every panel: ${ctx.look}. Keep this outfit; never give the protagonist anyone else's clothes.`);
    const others = [...cast, ...bg].filter(id => id !== "user");
    if (others.length) L.push(`Each person keeps their own clothes: ${others.map(id => `only ${nameEn(id)} wears ${RES[id].outfit_en}`).join("; ")}. The protagonist does not wear any of these.`);
    if (bg.length) L.push(`In the background, smaller and doing their own thing: ${bg.map(id => doingEn(id, e)).join("; ")}.`);
    if (ambientEn(e)) L.push(`The place feels alive: ${ambientEn(e)}. These extras stay in the background, smaller and less detailed.`);
    L.push(`${who.join(" and ")} ${who.length > 1 ? "are" : "is"} the main subject. Every person has exactly two arms, two hands, two legs and two feet; nobody appears twice.`);
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
    if (A.cfg.engine === "fuse" || A.cfg.engine === "stitch") {
      const r = await SimFuse.draw(st, e, A.cfg.engine, `模拟·第${e.day}天 ${e.slotLabel}·${e.title || e.action || e.kind}`);
      return {blob: r.blob, cost: r.cost, ms: r.t.total, t: {...r.t, mode: r.mode, note: r.note}};
    }
    const {card, cast, bg} = castOf(e);
    const t0 = performance.now();
    const pre = A.descP[e.n]; delete A.descP[e.n];
    const tw = performance.now();
    const d = (pre ? await pre.p : await describe(e, cast, card, {role: st.role}, bg).catch(() => null)) || {desc: `${e.title ? "【" + e.title + "】" : ""}${e.text}`, shot: "medium"};
    const descWait = performance.now() - tw;
    const prevE = [...st.log].reverse().find(x => x.n < e.n && st.imgs && st.imgs[x.n] && x.day === e.day && x.slot === e.slot && x.place === e.place && x.sub === e.sub);
    const prev = prevE ? await get(st.imgs[prevE.n]) : null;
    // 座位一类的小地点还在同一个屋子里，用这个地点的底图
    const seat = e.sub && ((D.sim.places[e.place].subs || {})[e.sub] || {}).seat;
    const scene = prev || (e.sub && !seat ? null : await sceneBlobFor(e.place, e.slot));
    const images = [], labels = [], refs = [];
    if (scene) { images.push(scene); labels.push(`Image ${images.length}: ${prev ? "the previous panel (same place, a moment earlier)" : "the location"}.`); }
    if (cast.includes("user") && A.me) {
      images.push(A.me.sheet || A.me.stand); labels.push(`Image ${images.length}: the protagonist.`);
      refs.push({id: "user", name: "the protagonist", what: A.me.sheet ? "a character reference sheet" : "a full-body picture"});
    }
    for (const id of [...cast, ...bg]) if (id !== "user" && images.length < 4) {
      const b = await get(`blob:res:${id}:sheet`);
      if (b) { images.push(b); labels.push(`Image ${images.length}: ${nameEn(id)}.`); refs.push({id, name: nameEn(id), what: "a character reference sheet"}); }
    }
    const look = cast.includes("user") ? await myLook() : "";
    const prompt = imagePrompt(e, cast, d.desc, d.shot, scene, {role: st.role, prev: !!prev, look}, refs, bg);
    const out = A.cfg.mock ? await mockPanel(e) : await viaGemini(prompt, images, labels);
    const total = performance.now() - t0;
    // 耗时拆开：等描述、准备参考图、生图请求（其中模型本身算了多久）
    const t = {total: Math.round(total), desc: Math.round(descWait), descSkipped: !!d.skipped, call: out.callMs, model: out.modelMs, prep: Math.round(total - descWait - (out.callMs || 0))};
    return {...out, cost: (out.cost || 0) + (d.cost || 0), ms: t.total, t, prompt};
  }
  // 场景底图：sim.json 里地点 → 时段对应的光线；没有就用这个地点已有的任意一张
  async function sceneBlobFor(place, slot) {
    const want = (D.sim.places[place].lights || {})[slot], all = (PLACES[place] || {}).lights || [];
    for (const l of [want, ...all]) if (l) { const b = await get(`blob:scene:${place}:${l}`); if (b) return b; }
    return null;
  }

  // ---------- 画面上能点的东西 ----------
  // 每个地点（或小地点）在 sim.json 里列了 hotspots；画完一格后让文字模型在图里找这些东西，返回位置框（0–1 的比例）
  function hotspotsFor(place, sub, present) {
    const P = D.sim.places[place] || {};
    const list = (sub ? (P.subs[sub] || {}).hotspots : P.hotspots) || [];
    return present ? list.filter(h => !h.npc || present.includes(h.npc)) : list;
  }
  async function detect(blob, list, side = 1024) {
    if (!list.length || !A.cfg.orKey || A.cfg.mock || A.noDetect) return null;
    const prompt = `Find these objects in the image. For each one that is clearly visible, give its bounding box. Output JSON only:
{"objects": [{"id": "<id>", "box_2d": [ymin, xmin, ymax, xmax]}]} with coordinates normalized to 0-1000. Leave out objects that are not in the image.
Objects:
${list.map(h => `- ${h.id}: ${h.find_en}`).join("\n")}`;
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST", headers: {"Authorization": "Bearer " + A.cfg.orKey, "Content-Type": "application/json"},
      body: JSON.stringify({model: A.cfg.text, messages: [{role: "user", content: [{type: "text", text: prompt}, {type: "image_url", image_url: {url: await toDataUrl(blob, side)}}]}],
        response_format: {type: "json_object"}, usage: {include: true}, max_tokens: 600}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) { if ([401, 402, 403].includes(res.status)) A.noDetect = true; return null; }
    let out = {};
    try { out = JSON.parse(String(data.choices[0].message.content).replace(/^```(json)?|```$/g, "")); } catch (err) {}
    const ids = new Set(list.map(h => h.id)), found = [];
    for (const o of (out.objects || [])) {
      const b = o.box_2d;
      if (!ids.has(o.id) || !Array.isArray(b) || b.length !== 4 || found.some(f => f.id === o.id)) continue;
      const [y0, x0, y1, x1] = b.map(v => Math.max(0, Math.min(1000, Number(v))) / 1000);
      if (x1 - x0 > 0.02 && y1 - y0 > 0.02) found.push({id: o.id, box: [x0, y0, x1, y1]});
    }
    return {found, cost: (data.usage && data.usage.cost) || 0};
  }
  // 场景底图（还没画人时舞台上显示的那张）也找一次，存在库里，以后每局都用
  async function sceneHot(place, slot) {
    const want = (D.sim.places[place].lights || {})[slot], all = (PLACES[place] || {}).lights || [];
    let light = null, blob = null;
    for (const l of [want, ...all]) if (l) { blob = await get(`blob:scene:${place}:${l}`); if (blob) { light = l; break; } }
    if (!blob) return null;
    const k = `simhot:scene:${place}:${light}`;
    if (A.sceneHotMem[k] !== undefined) return A.sceneHotMem[k];
    let v = await get(k);
    if (!v) {
      const r = await detect(blob, hotspotsFor(place, null)).catch(() => null);
      if (r) { v = r.found; await put(k, v); }
    }
    A.sceneHotMem[k] = v || null;
    return A.sceneHotMem[k];
  }

  // ---------- 队列 ----------
  const key = (st, n) => `blob:simimg:${st.gid}:${n}`;
  async function loadGame(st) {
    A.gid = st.gid;
    for (const [n, k] of Object.entries(st.imgs || {})) {
      if (A.urls[n]) continue;
      const b = await get(k);
      if (b) A.urls[n] = URL.createObjectURL(b);
      const rb = await get(k + ":rej");
      if (rb) A.rej[n] = {url: URL.createObjectURL(rb), blob: rb, k};
    }
  }
  // 先同步清掉内存里的，再慢慢删库里的：新一局的图可能在删的过程中就画好了
  function dropGame(st) {
    const keys = Object.values(st.imgs || {}).flatMap(k => [k, k + ":rej"]);
    for (const u of Object.values(A.urls)) URL.revokeObjectURL(u);
    for (const r of Object.values(A.rej)) URL.revokeObjectURL(r.url);
    A.urls = {}; A.rej = {}; A.jobs = {}; A.queue = []; A.descP = {};
    return Promise.all(keys.map(del));
  }
  function request(st, e) {
    if (A.urls[e.n] || (A.jobs[e.n] && A.jobs[e.n].state !== "failed")) return;  // 有图（含正在融合的拼接图）或已经在排队
    if (!ready()) { A.jobs[e.n] = {state: "failed", error: A.cfg.engine === "gemini" ? "没有 OpenRouter Key：去漫画版的设置里填" : "还没有你的形象：先在漫画版完成入住"}; A.onChange(); return; }
    if (A.off) { A.jobs[e.n] = {state: "failed", error: "已暂停：" + A.off}; A.onChange(); return; }
    A.jobs[e.n] = {state: "queued"};
    if (A.cfg.engine === "gemini") {
      const {card, cast, bg} = castOf(e);
      A.descP[e.n] = {t0: performance.now(), p: describe(e, cast, card, {role: st.role}, bg).catch(() => null)};
    }
    A.queue.push({st, e});
    pump(); A.onChange();
  }
  function pump() {
    // 拼接 + 融合一格一格来（klein 很快，排队更省事，花费也算得准）；Gemini 从头画慢，两格一起画
    const conc = A.cfg.engine === "gemini" ? A.conc : 1;
    while (A.running < conc && A.queue.length) {
      const {st, e} = A.queue.shift();
      if (A.off) { A.jobs[e.n] = {state: "failed", error: "已暂停：" + A.off}; continue; }
      A.running++; A.jobs[e.n] = {state: "drawing", since: Date.now()}; A.onChange();
      if (A.cfg.engine === "fuse" || A.cfg.engine === "stitch") { drawFused(st, e); continue; }
      draw(st, e).then(async out => {
        if (st.gid !== A.gid) return;
        const k = key(st, e.n);
        await put(k, out.blob);
        (st.imgs = st.imgs || {})[e.n] = k;
        A.urls[e.n] = URL.createObjectURL(out.blob);
        A.spent += out.cost; A.count++;
        st.artCost = (st.artCost || 0) + out.cost; st.artN = (st.artN || 0) + 1;
        A.jobs[e.n] = {state: "done", ms: out.ms, cost: out.cost, t: out.t, engine: A.cfg.engine};
        (st.artT = st.artT || {})[e.n] = {...out.t, engine: A.cfg.engine};
        A.onChange();
        // 图先显示出来，再找能点的东西
        const list = hotspotsFor(e.place, e.sub, e.present || []);
        if (list.length) {
          A.jobs[e.n].detecting = true;
          const r = await detect(out.blob, list).catch(() => null);
          A.jobs[e.n].detecting = false;
          if (r && st.gid === A.gid) { (st.hot = st.hot || {})[e.n] = r.found; st.artCost += r.cost; A.spent += r.cost; }
        }
      }).catch(err => { A.jobs[e.n] = {state: "failed", error: err.message.slice(0, 200)}; })
        .finally(() => { A.running--; A.onChange(); pump(); });
    }
  }
  // 拼接 + 融合：拼接图一出来就显示、找能点的东西，然后放开队列让下一格开始拼；融合在后台做，通过检查再把图换掉
  async function drawFused(st, e) {
    const tag = `模拟·第${e.day}天 ${e.slotLabel}·${e.title || e.action || e.kind}·${e.n}`;
    let out;
    try { out = await SimFuse.draw(st, e, A.cfg.engine, tag); }
    catch (err) { A.jobs[e.n] = {state: "failed", error: err.message.slice(0, 200)}; A.running--; A.onChange(); pump(); return; }
    if (st.gid !== A.gid) { A.running--; pump(); return; }
    const k = key(st, e.n);
    await put(k, out.blob);
    (st.imgs = st.imgs || {})[e.n] = k;
    A.urls[e.n] = URL.createObjectURL(out.blob);
    st.artCost = (st.artCost || 0) + out.cost; st.artN = (st.artN || 0) + 1; A.spent += out.cost; A.count++;
    (st.artT = st.artT || {})[e.n] = {...out.t, mode: out.mode, note: out.note, fusing: !!out.fuse};
    A.jobs[e.n] = {state: out.fuse ? "fusing" : "done"};
    A.running--; A.onChange(); pump();
    const list = hotspotsFor(e.place, e.sub, e.present || []);
    // 找能点的东西用小图（640），少占和 klein 抢的带宽；坐标是比例，换成融合图也对得上
    const detectP = list.length ? detect(out.blob, list, 640).catch(() => null) : Promise.resolve(null);
    if (out.fuse) {
      const f = await out.fuse;
      if (st.gid !== A.gid) return;
      const swap = async b => { await put(k, b); URL.revokeObjectURL(A.urls[e.n]); A.urls[e.n] = URL.createObjectURL(b); };
      if (f.blob) await swap(f.blob);
      // 被检查拦下的融合图也存下来，让人看看到底哪里变了，觉得没问题可以点「就用它」
      if (f.rejected) { await put(k + ":rej", f.rejected); A.rej[e.n] = {url: URL.createObjectURL(f.rejected), blob: f.rejected, k}; }
      st.artCost += f.cost; A.spent += f.cost;
      Object.assign(st.artT[e.n], {mode: f.mode, note: f.note, fusing: false, fuse: f.fuseMs, attempts: f.attempts, total: f.total, reviewing: !!f.review, rejected: !!f.rejected, limits: f.limits});
      A.jobs[e.n] = {state: "done"}; A.onChange();
      // 后台识别检查：没通过就换回拼接图
      if (f.review) {
        const rv = await f.review.catch(() => ({why: [], ms: 0}));
        if (st.gid !== A.gid) return;
        const L = LOG.filter(x => x.tag === tag + " · 检查" && x.type === "call");
        st.artCost += L.reduce((a, x) => a + (x.cost || 0), 0);
        Object.assign(st.artT[e.n], {reviewing: false, review: rv.ms, reviewWhy: rv.why});
        if (rv.why.length) { await swap(out.blob); st.artT[e.n].mode = "stitch"; }
        A.onChange();
      }
    }
    const r = await detectP;
    if (r && st.gid === A.gid) { (st.hot = st.hot || {})[e.n] = r.found; st.artCost += r.cost; A.spent += r.cost; A.onChange(); }
  }

  async function useRejected(st, n) {
    const r = A.rej[n];
    if (!r) return;
    await put(r.k, r.blob);
    if (A.urls[n]) URL.revokeObjectURL(A.urls[n]);
    A.urls[n] = URL.createObjectURL(r.blob);
    Object.assign(st.artT[n], {mode: "fuse", usedRejected: true});
    A.onChange();
  }

  // 自动配图：大事（故事卡、抉择），或者另外给每个时段挑一件最要紧的事
  function weight(e) {
    if (e.kind === "card" || e.kind === "choice") return 100;
    if (e.kind !== "action") return 0;
    return 10 + (e.target ? 20 : 0) + (e.outcome ? 10 : 0) + (e.action === "work" || /上班|登台/.test(e.text) ? 15 : 0);
  }
  function autoPick(st, from) {
    if (A.cfg.auto === "off") return [];
    const fresh = st.log.filter(e => e.n > from && e.kind !== "time" && !e.skipArt);
    // 每一步都画：所有动作、故事卡和抉择（走路不画）
    if (A.cfg.auto === "every") return fresh.filter(e => ["card", "choice", "action"].includes(e.kind));
    // 接管时你做的每一个动作都马上画，像实时操作
    const pick = fresh.filter(e => e.kind === "card" || e.kind === "choice" || (e.who === "player" && (e.kind === "action" || e.kind === "move")));
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
  // 没有 Key 时不自动画（配图那一栏会提示去哪儿填）；点「画」仍然会说明原因
  function auto(st, from) { if (!ready() || A.off) return; for (const e of autoPick(st, from)) request(st, e); }
  function status() {
    const q = Object.values(A.jobs);
    return {drawing: q.filter(j => j.state === "drawing").length, queued: q.filter(j => j.state === "queued").length, fusing: q.filter(j => j.state === "fusing").length};
  }

  return Object.assign(A, {useRejected, init, readCfg, saveMine, ready, request, auto, loadGame, dropGame, status, castOf, hotspotsFor, sceneHot});
})();
