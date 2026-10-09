"use strict";
// ================= 城市模拟测试页：每一格都走漫画版的「拼接 + 重绘」 =================
// 一件事 → 一格：地点和光线 → 场景底图，在场的人 → 动作图，按站位拼好（0.1 秒），再交给 fal 的 klein 融合一遍（约 2–3 秒）。
// 缺的素材先补：你的某个动作没有就先用 Gemini 生成动作图；梅、卡斯这些人第一次出场先生成设定图和动作图；
// 卫生间这类小地点第一次去先生成场景底图并标好站位。补过的素材存在浏览器里，漫画版和模拟页共用，以后直接拼。
// 依赖 core.js（CFG、S、store、getBlob、putBlob、generateSprite、logEntry）、engine.js（ASSETS、PLACES、POSES、ensureScene、stitch）
// 和 fuse.js（fusePanel、FUSE_OFF）。
const SimFuse = (() => {
  let ready = false, rawSet = null;

  // ---------- 启动：读漫画版存的素材和你的形象 ----------
  // 模拟页只往库里加素材（场景、动作图），不改漫画版的进度、花费和日志
  async function init() {
    if (ready) return;
    await store.open();
    S = {...fresh(), ...(await store.get("state") || {})};
    STYLE = await store.get("style") || {items: [], selected: []};
    ASSETS = await store.get("assets") || {scenes: {}, residents: {}};
    rawSet = store.set.bind(store);
    store.set = async (k, v) => {
      if (k === "state" || k === "log") return;
      if (k === "assets") v = mergeAssets(await store.get("assets"), v);
      return rawSet(k, v);
    };
    countCost = () => {};
    // 小地点（不是座位的）当成单独的场景：第一次去时生成底图
    for (const [pid, P] of Object.entries(SIMD().sim.places)) for (const [sid, sub] of Object.entries(P.subs || {})) {
      if (sub.seat || !PLACES[pid]) continue;
      PLACES[`${pid}.${sid}`] = {id: `${pid}.${sid}`, label: `${PLACES[pid].label}·${sub.label}`, desc_en: sub.desc_en || PLACES[pid].desc_en, lights: PLACES[pid].lights, map: PLACES[pid].map};
    }
    ready = true;
  }
  const SIMD = () => window.D;
  // 两个页面可能同时开着：存素材时把库里已有的和这边新加的合在一起，谁也不覆盖谁
  function mergeAssets(cur, mine) {
    cur = cur || {scenes: {}, residents: {}};
    const out = {scenes: {...cur.scenes, ...mine.scenes}, residents: {...cur.residents}};
    for (const [id, r] of Object.entries(mine.residents || {})) {
      const c = cur.residents[id] || {sheet: false, poses: {}};
      out.residents[id] = {sheet: c.sheet || r.sheet, poses: {...c.poses, ...r.poses}};
    }
    Object.assign(ASSETS.scenes, out.scenes);
    for (const [id, r] of Object.entries(out.residents)) ASSETS.residents[id] = r;
    return out;
  }
  const haveMe = () => !!(S.approved && S.sprites && Object.values(S.sprites).some(sp => sp && sp.version));

  // ---------- 你的动作图：没有就先生成 ----------
  const okSprite = sp => sp && sp.version && (sp.status === "ready" || sp.status === "qc_warn");
  async function ensureMyPose(pose, rec) {
    if (okSprite(S.sprites[pose]) || !POSES[pose]) return;
    const t0 = Date.now();
    const out = await generateSprite(await getBlob("sheet:" + S.approved), null, pose, ROLES[S.role].outfit_en);
    const version = Date.now();
    await putBlob(`sprite:${pose}:${version}`, out.blob);
    const sp = {...(S.sprites[pose] || {}), version, meta: out.meta, qc: out.qc, status: out.status, attempts: out.attempts, error: null};
    S.sprites[pose] = sp;
    // 只把这一个动作写回漫画版的进度，别的字段不动
    const cur = await store.get("state");
    if (cur) { cur.sprites = cur.sprites || {}; cur.sprites[pose] = sp; await rawSet("state", cur); }
    if (rec) rec.made.push(`你·${POSES[pose].label} ${((Date.now() - t0) / 1000).toFixed(1)} 秒`);
  }

  // ---------- 一件事 → 一格 ----------
  const ROLE_WORK = {singer: "sing", makeup: "makeup", reporter: "type"};
  const ACTION_POSE = {read_paper: "newspaper", make_coffee: "coffee", order_coffee: "coffee", rehearse: "sing", research: "type", sort_clues: "hold_note",
    dress_up: "makeup", rest: "wake_stretch", look_out: "look_back", chat: "stand_smile", ask: "stand", flatter: "stand_smile", gift: "stand_smile",
    play_jukebox: "stand_smile", stroll: "walk", drink: "coffee", wash_up: "stand", wait: "stand", observe: "look_back", search: "stand", eavesdrop: "look_back"};
  const NPC_POSE = {mae: {diner: "coffee"}, eli: {bluebird_stage: "stand_smile", studio_makeup: "stand_smile"}, vivian: {studio_makeup: "stand_smile"}};
  const CARD_POSE = {wake: "wake_stretch", mae_paper: "newspaper", newsstand: "newspaper", extra_paper: "newspaper", night_call: "phone", alley_earring: "hold_note",
    fog_car: "surprised", window_car: "look_back", same_car: "hold_note", fired: "surprised", boss_warning: "surprised"};
  function myPose(e, seat) {
    if (seat === "booth") return "sit_booth";
    if (seat === "counter") return "sit_stool";
    if (e.card && CARD_POSE[e.card]) return CARD_POSE[e.card];
    if (e.kind === "move") return "walk";
    return ACTION_POSE[e.action] || "stand";
  }
  function buildPanel(st, e) {
    const SD = SIMD().sim, P = SD.places[e.place] || {}, sub = e.sub && (P.subs || {})[e.sub];
    const seat = sub && sub.seat ? e.sub : null;
    const place = sub && !sub.seat && PLACES[`${e.place}.${e.sub}`] ? `${e.place}.${e.sub}` : e.place;
    const pl = PLACES[place];
    const light = (P.lights || {})[e.slot] && pl.lights.includes(P.lights[e.slot]) ? P.lights[e.slot] : lightFor(place, e.slot);
    // 睡觉：只画房间，不放人
    if (e.action === "sleep") return {place, light, cam: "wide", cast: [], seat};
    const {cast, bg} = Art.castOf(e);
    const ids = [...cast, ...bg].slice(0, 3);
    const work = e.action === "work" ? ROLE_WORK[st.role] : null;
    const spots = ids.length === 1 ? ["center"] : ids.length === 2 ? ["left", "right"] : ["left", "right", "center"];
    const panelCast = ids.map((id, i) => ({
      id, spot: spots[i],
      pose: id === "user" ? (work || myPose(e, seat)) : (bg.includes(id) ? (NPC_POSE[id] || {})[e.place] || "stand" : (NPC_POSE[id] || {})[e.place] || "stand_smile"),
      facing: ids.length === 1 ? undefined : spots[i] === "left" ? "right" : "left",
    }));
    const card = e.card && SIMD().cards.find(c => c.id === e.card);
    const cam = (card && card.render && card.render.cam === "wide") || e.kind === "move" || e.action === "look_out" ? "wide" : "mid";
    const interaction = seat ? {who: "user", contact: "sit", target: seat === "booth" ? "booth seat" : "bar stool", light: "normal"} : null;
    return {place, light, cam, cast: panelCast, seat, interaction, render: "stitch"};
  }

  // ---------- 画一格 ----------
  // engine: "fuse" 拼接 + klein 融合；"stitch" 只拼接
  async function draw(st, e, engine, tag) {
    await init();
    if (!S.approved) throw new Error("还没有你的形象：先在漫画版完成入住（确认设定图）");
    const t0 = Date.now(), cost0 = S.cost || 0, rec = {cast: [], made: []};
    const panel = buildPanel(st, e);
    // 素材：场景底图（没有就生成并标站位）、你的动作图（没有就生成）；梅这些人的动作图由 stitch 里的 spriteFor 补
    const hadScene = Object.keys(ASSETS.scenes).some(k => k.startsWith(panel.place + ":"));
    panel.sceneKey = await ensureScene(panel.place, panel.light);
    if (!hadScene) rec.made.push(`场景 ${PLACES[panel.place].label}`);
    // 站立是兜底：动作图坏了时拼接会先换成站立
    if (panel.cast.some(c => c.id === "user")) await ensureMyPose("stand", rec);
    for (const c of panel.cast) {
      if (c.id === "user") await ensureMyPose(usablePose(c.pose, panel.place, ASSETS.scenes[panel.sceneKey]), rec);
      else {
        const pose = usablePose(c.pose, panel.place, ASSETS.scenes[panel.sceneKey]), t1 = Date.now();
        if (residentAsset(c.id).sheet && residentAsset(c.id).poses[pose]) continue;
        try { await ensureResidentSprite(c.id, pose); } catch (err) { if (pose === "stand") throw err; c.pose = "stand"; await ensureResidentSprite(c.id, "stand"); }
        rec.made.push(`${nameOf(c.id)}·${(POSES[c.pose] || {}).label || c.pose} ${((Date.now() - t1) / 1000).toFixed(1)} 秒`);
      }
    }
    const tA = Date.now();
    const stitched = await stitch(panel, rec);
    panel.anchors = stitched.anchors;
    const tS = Date.now();
    let blob = stitched.blob, mode = "stitch", note = "";
    if (engine === "fuse" && panel.cast.length) {
      if (FUSE_OFF) note = "klein 已暂停：" + FUSE_OFF;
      else if (!CFG.mock && !CFG.falKey) note = "没有 fal Key，只拼接";
      else {
        try { const r = await fusePanel(panel, stitched.blob, stitched.info, tag); blob = r.blob; mode = "fuse"; }
        catch (err) { note = err.message.slice(0, 120); }
      }
    }
    const tF = Date.now();
    return {blob, mode, note, cost: Math.round(((S.cost || 0) - cost0) * 10000) / 10000,
      t: {total: tF - t0, assets: tA - t0, stitch: tS - tA, fuse: mode === "fuse" || note ? tF - tS : 0, made: rec.made, poses: stitched.info.poses, cam: stitched.info.cam}};
  }
  return {init, draw, buildPanel, haveMe};
})();
