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
    // 只给模拟页用的动作图（弹钢琴、坐在舞台边缘……）和它们融合时的提示
    for (const p of SIMD().sim.extra_poses || []) if (!POSES[p.id]) POSES[p.id] = p;
    Object.assign(FUSE_POSE_FIX, {
      play_piano: who => `${who} sits on the piano bench already drawn under them and plays the grand piano: hands on its keys, the piano right in front of them. Keep that one bench; do not add another seat.`,
      sit_edge: who => `${who} sits on the front edge of the stage with legs hanging over it and hands on the edge; the body rests on the stage floor with no gap.`,
    });
    // 小地点（不是座位的）和同一屋子的其他机位当成单独的场景：第一次去时生成底图；
    // 在原地点能用的坐姿，在这个机位也能用
    for (const [pid, P] of Object.entries(SIMD().sim.places)) for (const [sid, sub] of Object.entries(P.subs || {})) {
      if (sub.seat || !PLACES[pid]) continue;
      const id = `${pid}.${sid}`;
      PLACES[id] = {id, label: `${PLACES[pid].label}·${sub.label}`, desc_en: sub.desc_en || PLACES[pid].desc_en, lights: PLACES[pid].lights, map: PLACES[pid].map};
      for (const ps of Object.values(POSES)) if (ps.places && ps.places.includes(pid) && !ps.places.includes(id)) ps.places = [...ps.places, id];
    }
    // 和 fal 保持连接，重绘时不用再握手（走代理时握手要好几个来回）
    if (CFG.falKey && !CFG.mock) { const warm = () => { falWarmAt = 0; warmFal(); }; warm(); setInterval(warm, 45000); }
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
  const NPC_POSE = {mae: {diner: "coffee"}, eli: {bluebird_stage: "stand_smile", "bluebird_stage.bar": "sit_stool", studio_makeup: "stand_smile"}, vivian: {studio_makeup: "stand_smile"},
    cass: {"bluebird_stage.piano": "play_piano"}};
  const SEAT_TARGET = {sit_booth: "booth seat", sit_stool: "bar stool", play_piano: "piano bench", sit_edge: "front edge of the stage"};
  const CARD_POSE = {wake: "wake_stretch", mae_paper: "newspaper", newsstand: "newspaper", extra_paper: "newspaper", night_call: "phone", alley_earring: "hold_note",
    fog_car: "surprised", window_car: "look_back", same_car: "hold_note", fired: "surprised", boss_warning: "surprised"};
  function myPose(e, seat, sub) {
    const A = SIMD().sim.actions[e.action] || {};
    if (e.kind === "action" && A.pose) return A.pose;
    if (seat === "booth") return "sit_booth";
    if (seat === "counter") return "sit_stool";
    if (sub && sub.pose && e.kind !== "move") return sub.pose;
    if (e.card && CARD_POSE[e.card]) return CARD_POSE[e.card];
    if (e.kind === "move") return "walk";
    return ACTION_POSE[e.action] || "stand";
  }
  // 配角的动作：按机位/地点；你在弹钢琴时卡斯就站在旁边
  function npcPose(id, place, e, isBg) {
    const by = NPC_POSE[id] || {};
    let p = by[place] || by[place.split(".")[0]] || (isBg ? "stand" : "stand_smile");
    if (p === "play_piano" && e.action === "play_piano") p = "stand_smile";
    return p;
  }
  function buildPanel(st, e) {
    const SD = SIMD().sim, P = SD.places[e.place] || {}, sub = e.sub && (P.subs || {})[e.sub];
    const seat = sub && sub.seat ? e.sub : null;
    let place = sub && !sub.seat && PLACES[`${e.place}.${e.sub}`] ? `${e.place}.${e.sub}` : e.place;
    // 歌手登台唱晚场：画在舞台机位
    if (e.action === "work" && st.role === "singer" && PLACES["bluebird_stage.stage"] && e.place === "bluebird_stage") place = "bluebird_stage.stage";
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
      pose: id === "user" ? (work || myPose(e, seat, sub)) : npcPose(id, place, e, bg.includes(id)),
      facing: ids.length === 1 ? undefined : spots[i] === "left" ? "right" : "left",
    }));
    const card = e.card && SIMD().cards.find(c => c.id === e.card);
    const cam = (card && card.render && card.render.cam === "wide") || e.kind === "move" || e.action === "look_out" ? "wide" : "mid";
    // 坐着的动作告诉融合：坐在什么上面
    const mine = panelCast.find(c => c.id === "user");
    const interaction = mine && SEAT_TARGET[mine.pose] ? {who: "user", contact: "sit", target: SEAT_TARGET[mine.pose], light: "normal"} : null;
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
    const t = {total: tS - t0, assets: tA - t0, stitch: tS - tA, made: rec.made, poses: stitched.info.poses, cam: stitched.info.cam};
    const out = {blob: stitched.blob, mode: "stitch", note: "", cost: Math.round(((S.cost || 0) - cost0) * 10000) / 10000, t, fuse: null};
    // 拼接图先给出去马上显示；融合在后台做，通过检查再替换
    if (engine === "fuse" && panel.cast.length) {
      if (FUSE_OFF) out.note = "klein 已暂停：" + FUSE_OFF;
      else if (!CFG.mock && !CFG.falKey) out.note = "没有 fal Key，只拼接";
      else out.fuse = fuseLater(panel, stitched, tag, t0);
    }
    return out;
  }
  // 城市模拟页的融合：只重绘一次；输入输出都小一点（少传数据、模型也快一点）；本地检查通过就先换图，
  // 识别检查（数人数、看手脚）放到后台，没通过再换回拼接图
  // 拼接图长边 512（每格要传的只剩这一张，约 30–40KB）；人物参考图存在 fal 上只传一次；输出 576×720
  const SIM_FUSE = {attempts: 1, review: false, side: 512, refSide: 256, size: {w: 576, h: 720}, refUrl: falRefUrl};
  const KLEIN = {"4b": "fal-ai/flux-2/klein/4b/edit", "9b": "fal-ai/flux-2/klein/9b/edit"};
  function setModel(id) { CFG.falModel = KLEIN[id] || KLEIN["4b"]; }

  // ---------- 人物参考图放在 fal 的存储里 ----------
  // 同一张动作图第一次用时上传到 fal 的文件存储，拿到网址存在浏览器里；以后每格只发网址，fal 从自己机房取。
  // 网址先当一天有效；上传不成功就关掉这条路，照旧把图内嵌在请求里
  const REF_TTL = 24 * 3600e3, refMem = {};
  let refOff = false;
  function falRefUrl(key, blob, side) {
    if (refOff || CFG.mock || !CFG.falKey || !key) return Promise.resolve(null);
    const k = `falref:${key}:${side}`;
    if (!refMem[k]) refMem[k] = (async () => {
      const hit = await store.get(k);
      if (hit && Date.now() - hit.at < REF_TTL) return hit.url;
      const file = await (await fetch(await toWebpUrl(blob, side, "#d9d9d9"))).blob(), t0 = Date.now();
      try {
        const r = await fetch("https://rest.alpha.fal.ai/storage/upload/initiate?storage_type=fal-cdn-v3", {method: "POST",
          headers: {"Authorization": "Key " + CFG.falKey, "Content-Type": "application/json"},
          body: JSON.stringify({content_type: "image/webp", file_name: key.replace(/[^\w.-]+/g, "_") + ".webp"})});
        if (!r.ok) throw new Error(`initiate ${r.status} ${(await r.text()).slice(0, 100)}`);
        const j = await r.json();
        const up = await fetch(j.upload_url, {method: "PUT", headers: {"Content-Type": "image/webp"}, body: file});
        if (!up.ok) throw new Error(`upload ${up.status}`);
        await store.set(k, {url: j.file_url, at: Date.now()});
        logEntry({type: "local", tag: `参考图存到 fal：${key}`, note: `${Math.round(file.size / 1024)}KB，${((Date.now() - t0) / 1000).toFixed(1)} 秒`});
        return j.file_url;
      } catch (err) {
        refOff = true;
        logEntry({type: "local", tag: "参考图存到 fal 没成功，改回每次内嵌", note: err.message});
        return null;
      }
    })().then(url => { if (!url) delete refMem[k]; return url; });
    return refMem[k];
  }
  // fal 取不到网址（过期、被删）时：清掉这些缓存，下次重新上传
  async function dropRefs() {
    for (const k of Object.keys(refMem)) { delete refMem[k]; await store.del(k).catch(() => {}); }
  }
  async function fuseLater(panel, stitched, tag, t0) {
    const f0 = Date.now();
    let blob = null, note = "", rejected = null, qc = null;
    try { blob = (await fusePanel(panel, stitched.blob, stitched.info, tag, SIM_FUSE)).blob; }
    catch (err) {
      note = err.message.slice(0, 160); rejected = err.rejected || null; qc = err.qc || null;
      if (/fal 4\d\d/.test(err.message) && /url|download|fetch|image/i.test(err.message)) await dropRefs();
    }
    const mine = LOG.filter(x => x.at >= f0 && x.tag && (x.tag === tag || x.tag.startsWith(tag + " ·")));
    const calls = mine.filter(x => x.type === "call" && !/ · 检查$/.test(x.tag) && (String(x.model).startsWith("fal:") || x.model === "模拟"));
    const qcs = mine.filter(x => x.type === "local" && /第 \d+ 次(没)?通过检查/.test(x.tag));
    const attempts = calls.filter(c => c.ok !== false).map((c, i) => ({engine: /4b/.test(c.model) ? "klein 4B" : /9b/.test(c.model) ? "klein 9B" : "klein", images: c.images, ms: c.totalMs, up: c.upMs, wait: c.waitMs, down: c.downMs, model: c.modelMs, upKB: c.upKB, downKB: c.downKB,
      pass: qcs[i] ? !/没通过/.test(qcs[i].tag) : null, why: qcs[i] && /没通过/.test(qcs[i].tag) ? String(qcs[i].note || "").slice(0, String(qcs[i].note || "").lastIndexOf("（")) : "",
      nums: qcs[i] ? String(qcs[i].note || "").replace(/^.*（(.*)）$/, "$1").replace(/（识别检查在后台做）$/, "") : ""}));
    const cost = Math.round(mine.reduce((a, x) => a + (x.cost || 0), 0) * 10000) / 10000;
    const n = Math.min(3, panel.cast.length);
    // 后台识别检查：返回没通过的原因（空数组 = 通过）
    const review = blob ? (async () => { const r0 = Date.now(); const why = await fuseReview(blob, n, tag); return {why, ms: Date.now() - r0}; })() : null;
    return {blob, mode: blob ? "fuse" : "stitch", note, cost, fuseMs: Date.now() - f0, attempts, total: Date.now() - t0, review, rejected,
      limits: {frame: FUSE_QC.frame, chroma: FUSE_QC.chroma}};
  }
  return {init, draw, buildPanel, haveMe, setModel, KLEIN};
})();
