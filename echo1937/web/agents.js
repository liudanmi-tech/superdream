"use strict";
// ================= 《回声 1937》人物底层系统 · 第一步（见文档《人物底层系统》） =================
// 每个人有命盘算出来的本性（性格、七宗罪、良知、胆量），有对每个人的情绪和关系，握着秘密，记得发生过的事。
// 每回合每个配角从行为表里按打分抽一件事来做；后果由规则结算，看见的人会记住，犯了事会有人去查。
// 不依赖页面，浏览器和 Node 都能跑。sim.js 在每回合、每个时段调用这里；数据在 content/agents.json 和 behaviors.json。
(function (root) {
  const Lunar = root.Solar ? root : (typeof require === "function" ? require("./vendor/lunar.js") : null);
  let Sim = null;  // sim.js 加载后调用 bind

  const WX = {甲: "木", 乙: "木", 丙: "火", 丁: "火", 戊: "土", 己: "土", 庚: "金", 辛: "金", 壬: "水", 癸: "水",
    子: "水", 丑: "土", 寅: "木", 卯: "木", 辰: "土", 巳: "火", 午: "火", 未: "土", 申: "金", 酉: "金", 戌: "土", 亥: "水"};
  const SHENG = {木: "火", 火: "土", 土: "金", 金: "水", 水: "木"};  // 甲生乙
  const KE = {木: "土", 土: "水", 水: "火", 火: "金", 金: "木"};     // 甲克乙
  const TRAITS = ["open", "dutiful", "outgoing", "kind", "neurotic", "conscience", "nerve"];
  const SINS = ["pride", "envy", "wrath", "sloth", "greed", "gluttony", "lust"];
  const EMO = ["anger", "fear", "jealous", "attr", "love", "grudge"];
  const PARTNER = ["lover", "engaged", "married"];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const r2 = v => Math.round(v * 100) / 100;

  // ---------------- 命盘 ----------------
  // birth："1913-07-15 14:00"。返回八字、日主、五行计数（8 个字 + 日主多算一份 = 9）
  function chart(birth) {
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2})(?::(\d{2}))?)?$/.exec(String(birth || "").trim());
    if (!m || !Lunar) return null;
    const y = +m[1], mo = +m[2], d = +m[3], h = m[4] == null ? 12 : +m[4], mi = m[5] == null ? 0 : +m[5];
    if (mo < 1 || mo > 12 || d < 1 || d > 31 || h > 23 || mi > 59) return null;
    const ec = Lunar.Solar.fromYmdHms(y, mo, d, h, mi, 0).getLunar().getEightChar();
    const pillars = [ec.getYear(), ec.getMonth(), ec.getDay(), ec.getTime()], wx = {金: 0, 木: 0, 水: 0, 火: 0, 土: 0};
    for (const ch of pillars.join("")) wx[WX[ch]]++;
    const dm = ec.getDayGan();
    wx[WX[dm]]++;
    return {birth: `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")} ${String(h).padStart(2, "0")}:${String(mi).padStart(2, "0")}`,
      year: y, pillars: pillars.join(" "), dm: dm + WX[dm], dmWx: WX[dm], wx};
  }
  // 命盘换算成本性（还没加人设修正）
  function nature(A, wx) {
    const N = A.nature, d = {}, out = {};
    for (const k of Object.keys(wx)) d[k] = wx[k] - N.avg;
    for (const t of TRAITS) { let v = 50; for (const [e, c] of Object.entries(N.traits[t])) v += c * d[e]; out[t] = Math.round(clamp(v, 5, 95)); }
    for (const s of SINS) { let v = 0.3; for (const [e, c] of Object.entries(N.sins[s])) v += c * d[e]; out[s] = r2(clamp(v, 0.05, 0.95)); }
    return out;
  }
  // 五行 x 对日主是什么：比劫（同我）、食伤（我生）、财（我克）、官杀（克我）、印（生我）
  function tenGod(dmWx, x) {
    if (x === dmWx) return "比劫";
    if (SHENG[dmWx] === x) return "食伤";
    if (KE[dmWx] === x) return "财";
    if (KE[x] === dmWx) return "官杀";
    return "印";
  }
  // 流年：天干、地支各算一半，加到欲望的倍数上
  function liunian(A, dmWx) {
    const L = A.liunian, out = {}, gods = [tenGod(dmWx, WX[L.stem]), tenGod(dmWx, WX[L.branch])];
    for (const g of gods) for (const [k, v] of Object.entries(L[g] || {})) out[k] = r2((out[k] || 0) + v / 2);
    return {gods, mul: out};
  }
  function applyAdjust(nat, adj) {
    const out = {...nat};
    for (const [k, v] of Object.entries(adj || {})) {
      if (SINS.includes(k)) out[k] = r2(clamp(out[k] + clamp(v, -0.2, 0.2), 0.05, 0.95));
      else if (TRAITS.includes(k)) out[k] = Math.round(clamp(out[k] + clamp(v, -15, 15), 5, 95));
    }
    return out;
  }
  // MBTI 只是显示用：外向、开放、宜人、尽责各取一半为界
  const mbti = n => (n.outgoing >= 50 ? "E" : "I") + (n.open >= 50 ? "N" : "S") + (n.kind >= 50 ? "F" : "T") + (n.dutiful >= 50 ? "J" : "P");

  // ---------------- 随机数：和主角那边的 st.rng 分开 ----------------
  function rnd(ag) {
    let t = (ag.rng = (ag.rng + 0x6D2B79F5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  function hashRand(...parts) {  // 和 sim.js 的同名函数一样：日程写成数组时按它挑一个
    let h = 2166136261;
    for (const ch of parts.join("|")) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
  }

  // ---------------- 开局 ----------------
  function init(st, D, opts = {}) {
    const A = D.agents;
    if (!A || !D.behaviors) return null;
    const ag = st.ag = {v: 1, rng: ((st.seed * 2654435761) ^ 0x9E3779B9) >>> 0 || 7, t: 0, p: {}, rel: {}, secrets: [], cases: [], hits: [],
      news: [], stats: {acts: {}, ev: {}}, slotKey: null, sid: 0};
    for (const [id, def] of Object.entries(A.people)) {
      const isUser = id === "user";
      const birth = isUser ? (opts.birth || def.default_birth) : def.birth;
      const ch = chart(birth) || chart(def.default_birth || "1913-07-15 14:00");
      const raw = nature(A, ch.wx);
      let adj = def.adjust || {};
      if (isUser) {  // 主角：入住时的性格（0–1）偏离 0.5 的量乘系数
        adj = {};
        for (const [t, m] of Object.entries(def.trait_adjust || {})) for (const [k, c] of Object.entries(m)) adj[k] = (adj[k] || 0) + ((st.traits[t] == null ? 0.5 : st.traits[t]) - 0.5) * c;
      }
      const nat = applyAdjust(raw, adj), ly = liunian(A, ch.dmWx);
      ag.p[id] = {id, birth: ch.birth, age: A.year - ch.year, chart: {pillars: ch.pillars, dm: ch.dm, wx: ch.wx}, raw, adj, nat, ly: ly.mul, lyGods: ly.gods,
        mbti: def.mbti || mbti(nat), goal: isUser ? (def.goal || {})[st.role] || "" : def.goal, week: def.week || "",
        money: def.money || 0, fame: def.fame || 0, field: isUser ? (def.field || {})[st.role] : def.field, rich: !!def.rich, home: def.home || null,
        job: def.job || null, detective: !!def.detective, goalPull: def.goal_pull || {},
        sex: def.sex || null, likes: def.likes || (def.sex === "M" ? ["F"] : def.sex === "F" ? ["M"] : []),
        place: null, status: "free", hunger: 20, energy: 80, mood: 60, drunk: 0, guilt: 0, hurt: 0, has: {}, mem: [], last: null, cool: {}, recent: [], unreported: []};
    }
    for (const r of A.relations) {
      const x = rel(ag, r.from, r.to);
      for (const k of ["aff", "trust", "fear", "grudge"]) if (r[k]) x[k] = r[k];
      if (r.note) x.note = r.note;
    }
    for (const [a, b] of A.kin || []) { rel(ag, a, b).kin = true; rel(ag, b, a).kin = true; }
    pickTruth(st, D, ag);
    return ag;
  }
  // 莉莉安案：按本性加权、用种子抽一个真相，把秘密分给人物
  function pickTruth(st, D, ag) {
    const A = D.agents, w = A.truths.map(t => t.weight.base != null ? t.weight.base : t.weight.mul.reduce((m, k) => m * ag.p[t.weight.who].nat[k], 1));
    const tot = w.reduce((a, b) => a + b, 0);
    let r = rnd(ag) * tot, i = 0;
    while (i < w.length - 1 && (r -= w[i]) > 0) i++;
    const T = A.truths[i];
    ag.truth = {id: T.id, text: T.text, culprit: T.culprit, odds: w.map((x, j) => ({id: A.truths[j].id, p: Math.round(x / tot * 100)}))};
    for (const s of T.secrets) addSecret(ag, {about: [s.about], knowers: [...s.knowers], sev: s.sev, text: s.text, case: s.case, found_at: s.found_at || null, kind: "case"});
    const C = A.case_lillian;
    ag.cases.push({id: C.id, label: C.label, crime: C.crime, victim: C.victim, place: C.place, culprit: T.culprit, ev: {}, left: 0, open: true, day: 1, frames: []});
    if (T.culprit) ag.p[T.culprit].guilt = T.culprit === "eli" ? 30 : 15;
  }
  function addSecret(ag, s) {
    const x = {id: "s" + (++ag.sid), public: false, silenced: {}, ...s};
    ag.secrets.push(x);
    return x;
  }

  // ---------------- 关系 ----------------
  function rel(ag, a, b) {
    const k = a + ">" + b;
    return ag.rel[k] || (ag.rel[k] = {aff: 0, trust: 0, attr: 0, love: 0, anger: 0, fear: 0, jealous: 0, grudge: 0, debt: 0, status: null, since: 0, fought: -999, kin: false});
  }
  const BOUNDS = {aff: [-100, 100], trust: [-100, 100]};
  // 改关系；主角和配角之间的好感、信任同步到 sim.js 的 st.rel（那边是 0–100）
  function bump(st, a, b, d) {
    if (!d || a === b) return;
    const ag = st.ag, x = rel(ag, a, b);
    for (const [k, v] of Object.entries(d)) {
      if (!v) continue;
      const [lo, hi] = BOUNDS[k] || [0, 100];
      x[k] = r2(clamp(x[k] + v, lo, hi));
    }
    if (b === "user" && st.rel[a] && (d.aff || d.trust)) {
      if (d.aff) st.rel[a].a = clamp(Math.round(st.rel[a].a + d.aff), 0, 100);
      if (d.trust) st.rel[a].t = clamp(Math.round(st.rel[a].t + d.trust), 0, 100);
    }
  }
  // sim.js 那边主角的动作（聊天、送礼……）改了 st.rel，同步到这里
  function mirror(st, id, d) {
    if (!st.ag || !st.ag.p[id]) return;
    const x = rel(st.ag, id, "user");
    if (d.a) x.aff = clamp(x.aff + d.a, -100, 100);
    if (d.t) x.trust = clamp(x.trust + d.t, -100, 100);
  }
  const partnerOf = (ag, a) => Object.keys(ag.p).find(b => b !== a && PARTNER.includes(rel(ag, a, b).status)) || null;
  function setStatus(st, a, b, s) {
    const ag = st.ag, day = st.day;
    for (const [x, y] of [[a, b], [b, a]]) { const r = rel(ag, x, y); r.status = s; r.since = day; }
  }

  // ---------------- 个人数值：主角的钱、心情、体力、名气在 st 上 ----------------
  const USER_KEYS = {money: "money", mood: "mood", energy: "energy", fame: "fame"};
  function val(st, id, k) {
    if (id === "user" && USER_KEYS[k]) return st[USER_KEYS[k]];
    return st.ag.p[id][k];
  }
  function add(st, id, k, v) {
    if (!v) return;
    if (id === "user" && USER_KEYS[k]) {
      const key = USER_KEYS[k];
      st[key] = key === "money" ? r2(st[key] + v) : clamp(Math.round(st[key] + v), 0, 100);
      return;
    }
    const P = st.ag.p[id];
    if (k === "money") P.money = r2(Math.max(0, P.money + v));
    else if (k === "drunk") P.drunk = r2(clamp(P.drunk + v, 0, 1.5));
    else if (k === "fame") P.fame = r2(clamp(P.fame + v, 0, 100));
    else P[k] = r2(clamp((P[k] || 0) + v, 0, 100));
  }

  // ---------------- 在哪儿 ----------------
  const slotId = (st, D) => D.sim.slots[Math.min(st.slot, D.sim.slots.length - 1)].id;
  function habitPlace(st, D, id, slot) {
    const n = D.sim.npcs[id];
    if (!n) return null;
    let p = n.schedule[slot];
    if (Array.isArray(p)) p = p[Math.floor(hashRand(st.seed, id, st.day, slot) * p.length)];
    return p || null;
  }
  // sim.js 的 npcPlace 在当前时段问这里
  function placeOf(st, D, id) {
    ensureSlot(st, D);
    const over = st.flags[`npc:${id}:${st.day}:${slotId(st, D)}`];
    if (over !== undefined && st.ag.p[id]) st.ag.p[id].place = over || null;
    const P = st.ag.p[id];
    return P && P.status === "free" ? P.place : null;
  }
  const placeOfAny = (st, id) => id === "user" ? st.place : (st.ag.p[id].status === "free" ? st.ag.p[id].place : null);
  // 某地此刻有谁（含主角）。配角在家（place 为 null）时谁也碰不到
  function peopleAt(st, place) {
    if (!place) return [];
    const out = Object.keys(st.ag.p).filter(id => id !== "user" && st.ag.p[id].status === "free" && st.ag.p[id].place === place);
    if (st.place === place && !st.ended) out.push("user");
    return out;
  }
  // 每个时段开始时每个配角决定去哪：习惯（原来的日程）分量最大，再加欲望和想见的人；故事卡临时改的位置照办
  function ensureSlot(st, D) {
    const ag = st.ag, key = st.day + ":" + st.slot;
    if (!ag || ag.slotKey === key) return;
    ag.slotKey = key;
    const slot = slotId(st, D), R = D.agents.rules;
    for (const id of Object.keys(ag.p)) {
      if (id === "user") continue;
      const P = ag.p[id];
      if (P.status !== "free") { P.place = null; continue; }
      const over = st.flags[`npc:${id}:${st.day}:${slot}`];
      if (over !== undefined) { P.place = over || null; continue; }
      if (st.flags[`gone:${id}`]) { P.place = null; continue; }
      const habit = habitPlace(st, D, id, slot), f = feat(st, D, id, null), cands = [null];
      for (const [pid, Q] of Object.entries(D.sim.places)) if (pid !== "apartment" && Q.open.includes(slot)) cands.push(pid);
      const scored = cands.map(pl => ({pl, s: placeScore(st, D, id, P, pl, habit, slot, f, R)}));
      P.placeWhy = scored.slice().sort((a, b) => b.s - a.s).slice(0, 3).map(x => ({place: x.pl, s: Math.round(x.s)}));
      P.place = softPick(ag, scored, R.temp * temperature(P)).pl;
    }
  }
  function placeScore(st, D, id, P, pl, habit, slot, f, R) {
    let s = 0;
    if (pl === habit) s += R.habit * 10;
    if (pl === null && habit === null) s += R.home_pull * 10;
    if (pl === null) s += f.tired * 15 + (P.hurt ? 25 : 0) + (slot === "late" ? 10 : 0);
    const J = P.job;
    if (J && J.place && J.slots.includes(slot) && pl === J.place) s += 15;
    if (pl === "bluebird_stage" || pl === "vance_mansion" || pl === "pier") s += 6 * f.gluttony + 6 * f.sad;
    if (pl === "pier") s += 4 * f.greed + (!P.has.gun && P.money >= 15 && Math.max(f.mad_any, f.afraid_any, f.afraid_case) >= 0.5 ? 12 : 0);
    if (pl && pl === P.home) s += 5;
    // 想见、想找的人此刻大概在哪
    for (const q of Object.keys(st.ag.p)) {
      if (q === id || st.ag.p[q].status !== "free") continue;
      const where = q === "user" ? st.place : habitPlace(st, D, q, slot);
      if (where !== pl || !pl) continue;
      const x = rel(st.ag, id, q);
      s += (x.attr + x.love) / 100 * 10 + Math.max(0, x.aff) / 100 * 4 + x.grudge / 100 * 4 * f.wrath;
      if (P.detective) s += maxEv(st.ag, q) / 100 * 15 + (maxEv(st.ag, q) >= R.arrest_at ? 40 : 0);
    }
    if (P.detective && pl) for (const c of st.ag.cases) if (c.open && c.place === pl) s += 6;
    return s;
  }
  const temperature = P => Math.max(0.5, 1 + (P.nat.neurotic - 50) / 100 + P.drunk);
  function softPick(ag, scored, T) {
    const mx = Math.max(...scored.map(x => x.s));
    const w = scored.map(x => Math.exp((x.s - mx) / T)), tot = w.reduce((a, b) => a + b, 0);
    let r = rnd(ag) * tot;
    for (let i = 0; i < scored.length; i++) { r -= w[i]; if (r <= 0) return {...scored[i], p: w[i] / tot}; }
    return {...scored[scored.length - 1], p: w[w.length - 1] / tot};
  }

  // ---------------- 特征：打分和前提都用它 ----------------
  function maxEv(ag, id) { let m = 0; for (const c of ag.cases) if (c.open) m = Math.max(m, c.ev[id] || 0); return m; }
  // 案子有多重：小偷小摸不至于让人连夜跑路
  const GRAVE = {盗窃: 0.5, 勒索: 0.6, 伤人: 0.8, 持枪威胁: 0.8, 投毒: 1, 凶杀: 1, 失踪: 1};
  function wantedOf(ag, id) { let m = 0; for (const c of ag.cases) if (c.open) m = Math.max(m, (c.ev[id] || 0) * (GRAVE[c.crime] || 0.8)); return m; }
  const knows = (s, id) => s.knowers.includes(id);
  const secretsAbout = (ag, about, knower) => ag.secrets.filter(s => !s.public && s.about.includes(about) && (!knower || knows(s, knower)));
  const isCulprit = (ag, id) => ag.cases.some(c => c.open && c.culprit === id);
  function afraidCase(ag, id) {
    if (!isCulprit(ag, id) && !maxEv(ag, id)) return 0;
    let n = 0;
    for (const s of ag.secrets) if (!s.public && s.about.includes(id) && s.sev >= 2) n += s.knowers.filter(k => k !== id && !s.silenced[k]).length;
    return clamp(wantedOf(ag, id) + 20 * n + (isCulprit(ag, id) ? 15 : 0), 0, 100);
  }
  function feat(st, D, a, b) {
    const ag = st.ag, P = ag.p[a], f = {};
    for (const k of SINS) f[k] = P.nat[k] * (1 + (P.ly[k] || 0));
    for (const k of TRAITS) f[k] = (P.nat[k] - 50) / 50;
    const energy = val(st, a, "energy"), mood = val(st, a, "mood"), money = val(st, a, "money");
    f.hunger = a === "user" ? 0 : P.hunger / 100;
    f.tired = (100 - energy) / 100;
    f.sad = (100 - mood) / 100;
    f.drunk = P.drunk;
    f.broke = money < 5 ? (5 - money) / 5 : 0;
    f.guilt = P.guilt / 100;
    let ma = 0, fa = 0;
    for (const q of Object.keys(ag.p)) if (q !== a) { const x = ag.rel[a + ">" + q]; if (x) { ma = Math.max(ma, x.anger); fa = Math.max(fa, x.fear); } }
    f.mad_any = ma / 100; f.afraid_any = fa / 100;
    f.afraid_case = afraidCase(ag, a) / 100;
    f.wanted = wantedOf(ag, a) / 100;
    if (b) {
      const x = rel(ag, a, b);
      f.aff = x.aff / 100; f.hate = Math.max(0, -x.aff) / 100; f.trust = x.trust / 100; f.attr = x.attr / 100; f.love = x.love / 100;
      f.mad = x.anger / 100; f.afraid = x.fear / 100; f.jealous = x.jealous / 100; f.grudge = x.grudge / 100; f.debt = x.debt / 100;
      f.suspect = P.detective ? maxEv(ag, b) / 100 : (secretsAbout(ag, b).length && x.jealous > 30 ? 0.3 : 0);
      f.threat = secretsAbout(ag, a, b).some(s => !s.silenced[b]) ? f.afraid_case : 0;
    }
    return f;
  }

  // ---------------- 前提 ----------------
  const DAY = ["dawn", "morning", "afternoon"], NIGHT = ["evening", "night", "late"];
  const PUBLIC = (D, pl) => !!(pl && D.sim.places[pl] && D.sim.places[pl].public);
  const stash = (st, id) => { const P = st.ag.p[id]; return [P.home, P.job && P.job.place].filter(Boolean); };
  const rivalField = (D, x, y) => !!(x && y && (D.agents.fields_rival || []).some(([a, b]) => (a === x && b === y) || (a === y && b === x)));
  function reqOk(st, D, a, b, B, isUser) {
    for (const tok of B.req || []) if (!tok.split("|").some(t => reqOne(st, D, a, b, t, isUser))) return false;
    return true;
  }
  function reqOne(st, D, a, b, tok, isUser) {
    if (tok[0] === "!") return !reqOne(st, D, a, b, tok.slice(1), isUser);
    const ag = st.ag, P = ag.p[a], Q = b ? ag.p[b] : null, slot = slotId(st, D), here = placeOfAny(st, a);
    const m = /^(t_)?([a-z_]+)(>=|<=)(-?\d+)$/.exec(tok);
    if (m) {
      // 主角接管时，自己的情绪门槛不算（那是她自己的决定）；对方的态度照算
      if (isUser && !m[1]) return true;
      if (m[1] && !b) return false;
      const f = m[1] ? feat(st, D, b, a) : feat(st, D, a, b), v = (f[m[2]] || 0) * 100;
      return m[3] === ">=" ? v >= +m[4] : v <= +m[4];
    }
    const [name, arg] = tok.split(":");
    const others = () => peopleAt(st, here).filter(x => x !== a && x !== b);
    switch (name) {
      case "place": return arg.split("/").includes(here);
      case "money": return val(st, a, "money") >= +arg;
      case "has": return !!(isUser ? (st.items || []).includes(arg) || P.has[arg] : P.has[arg]);
      case "status": return !!b && (arg ? arg.split("/").includes(rel(ag, a, b).status) : !!rel(ag, a, b).status);
      case "since": return !!b && st.day - rel(ag, a, b).since >= +arg;
      case "job_here": return !!P.job && P.job.slots.includes(slot) && (P.job.place ? here === P.job.place : !!here);
      case "job_place": return !!P.job && !!P.job.place && here === P.job.place;
      case "job_time": return !!P.job && P.job.slots.includes(slot) && !!here;
      case "own_place": return !!P.job && P.job.own && here === P.job.place;
      case "eat_place": return a === "user" ? false : !here || ["diner", "vance_mansion", "bluebird_stage"].includes(here);
      case "home": return a === "user" ? st.place === "apartment" : !here;
      case "out": return !!here && (a !== "user" || st.place !== "apartment");
      case "public": return PUBLIC(D, here);
      case "audience": return others().length >= 1;
      case "alone": return !!here && others().length === 0;
      case "few_eyes": return !!here && others().length <= 1;
      case "day": return DAY.includes(slot);
      case "night": return NIGHT.includes(slot);
      case "free_slot": return !(P.job && P.job.slots.includes(slot));
      case "kin": return !!b && rel(ag, a, b).kin;
      case "user": return a === "user" || b === "user";
      case "t_needs": return !!b && (val(st, b, "mood") < 40 || val(st, b, "money") < 5 || (Q && Q.hurt > 0));
      case "t_sad": return !!b && val(st, b, "mood") < 40;
      case "t_broke": return !!b && val(st, b, "money") < 5;
      case "broke": return val(st, a, "money") < 5;
      case "t_rich": return !!b && val(st, b, "money") >= 20;
      case "t_lower": return !!b && val(st, b, "fame") < val(st, a, "fame") - 10;
      case "t_above": return !!b && (val(st, b, "fame") > val(st, a, "fame") + 15 || (Q.rich && !P.rich));
      case "t_rival": return !!b && rivalField(D, P.field, Q.field) && val(st, b, "fame") >= val(st, a, "fame") - 25;
      case "affair_ok": { const pa = partnerOf(ag, a), pb = partnerOf(ag, b); return (pa && pa !== b) || (pb && pb !== a); }
      case "obstacle": { const pa = partnerOf(ag, a), pb = partnerOf(ag, b); return (pa && pa !== b) || (pb && pb !== a) || rel(ag, a, b).kin; }
      case "t_cheating": return !!b && (ag.secrets.some(s => s.kind === "affair" && s.about.includes(b) && !s.about.includes(a) && knows(s, a)) || rel(ag, a, b).jealous >= 40);
      case "fought": return !!b && ag.t - rel(ag, a, b).fought <= 45 && (rel(ag, a, b).anger > 5 || rel(ag, b, a).anger > 5);
      case "secret_on_t": return !!b && secretsAbout(ag, b, a).length > 0;
      case "t_secret_on_me": return !!b && secretsAbout(ag, a, b).some(s => !s.silenced[b]);
      case "ronan_here": return a !== "ronan" && ag.p.ronan && ag.p.ronan.status === "free" && peopleAt(st, here).includes("ronan");
      case "t_home_here": return !!b && stash(st, b).includes(here) && !peopleAt(st, here).includes(b);
      case "t_work_here": return !!b && stash(st, b).includes(here) && !peopleAt(st, here).includes(b);
      case "case_open": return ag.cases.some(c => c.open);
      case "case_place": return !!here && ag.cases.some(c => c.open && c.place === here);
      case "culprit_open": return isCulprit(ag, a);
      case "culprit_any": return isCulprit(ag, a) || ag.cases.some(c => c.open && (c.frames || []).some(f => f.by === a));
      case "t_jailed": return !!b && b !== "user" && Q.status !== "free";
      case "detective": return !!P.detective;
      case "arrestable": return !!b && ag.cases.some(c => c.open && topSuspect(c) === b && (c.ev[b] || 0) >= D.agents.rules.arrest_at);
      case "performer": return P.field === "music";
      case "unreported": return P.unreported.length > 0;
      case "rich": return !!P.rich;
      case "hurt_t": return !!b && rel(ag, b, a).grudge >= 20;
    }
    if (!WARNED[tok]) { WARNED[tok] = 1; if (typeof console !== "undefined") console.warn("agents.js：不认识的前提", tok); }
    return false;
  }
  const WARNED = {};
  const addEv = (c, id, n) => { c.ev[id] = clamp(Math.round((c.ev[id] || 0) + n), 0, 100); };
  function topSuspect(c) { let best = null; for (const [k, v] of Object.entries(c.ev)) if (!best || v > c.ev[best]) best = k; return best; }

  // ---------------- 打分、抽取 ----------------
  function score(st, D, a, B, b) {
    const R = D.agents.rules, P = st.ag.p[a], f = feat(st, D, a, b);
    let s = B.base || 0;
    for (const [k, w] of Object.entries(B.w || {})) s += 10 * w * (f[k] || 0);
    s += P.goalPull[B.id] || 0;
    s -= (B.harm || 0) * P.nat.conscience / 100 * R.harm_k;
    s -= (B.risk || 0) * (1 - P.nat.nerve / 100) * R.risk_k;
    s -= R.repeat_k * P.recent.filter(x => x === B.id).length;
    if (P.hurt && B.tier !== "daily") s -= 10;
    return s;
  }
  function targetsFor(st, D, a, B, isUser) {
    const ag = st.ag;
    if (!B.target) return [null];
    if (B.target === "here") return peopleAt(st, placeOfAny(st, a)).filter(x => x !== a);
    return Object.keys(ag.p).filter(x => x !== a && (x === "user" || ag.p[x].status === "free"));
  }
  function candidates(st, D, a, isUser) {
    const ag = st.ag, P = ag.p[a], out = [];
    for (const B of D.behaviors.behaviors) {
      if (B.reactive || (isUser && !B.deed)) continue;
      if (!isUser && !placeOfAny(st, a) && !["sleep", "eat", "diary", "read_paper"].includes(B.id)) continue;
      for (const b of targetsFor(st, D, a, B, isUser)) {
        if (b === "user" && !isUser && B.not_user) continue;
        if (!isUser && (P.cool[B.id + ":" + (b || "")] || 0) > ag.t) continue;
        if (!reqOk(st, D, a, b, B, isUser)) continue;
        out.push({B, b});
      }
    }
    return out;
  }
  // 一个配角这一回合做什么
  function decide(st, D, a) {
    const ag = st.ag, P = ag.p[a], R = D.agents.rules;
    const c = candidates(st, D, a, false);
    const scored = c.map(x => ({...x, s: score(st, D, a, x.B, x.b)}));
    scored.push({B: null, b: null, s: 2 + 5 * P.nat.sloth});  // 什么也不做，待着
    const T = R.temp * temperature(P), pick = softPick(ag, scored, T);
    const mx = Math.max(...scored.map(x => x.s)), w = scored.map(x => Math.exp((x.s - mx) / T)), tot = w.reduce((x, y) => x + y, 0);
    P.cands = scored.map((x, i) => ({label: x.B ? x.B.label + (x.b ? "→" + nameOf(D, x.b) : "") : "待着", p: Math.round(w[i] / tot * 1000) / 10, s: Math.round(x.s)}))
      .sort((x, y) => y.p - x.p).slice(0, 6);
    return pick;
  }

  // ---------------- 每回合 ----------------
  function tick(st, D) {
    const ag = st.ag;
    if (!ag || st.ended) return;
    for (const id of Object.keys(ag.p)) if (id !== "user") placeOf(st, D, id);  // 故事卡临时改的位置
    ag.t++;
    passive(st, D);
    for (const id of Object.keys(ag.p)) {
      if (id === "user" || ag.p[id].status !== "free") continue;
      const pick = decide(st, D, id);
      if (pick.B) resolve(st, D, id, pick.B, pick.b, {p: pick.p});
      else ag.p[id].last = {label: "待着", place: ag.p[id].place, t: ag.t};
      if (st.ended) return;
    }
    dueHits(st, D);
  }
  // 主角睡到天亮时，配角照样过完剩下的回合
  function skipSlot(st, D) {
    if (!st.ag) return;
    const n = D.sim.slots[st.slot].rounds - st.round;
    for (let i = 0; i < n && !st.ended; i++) tick(st, D);
  }
  // 需求、醉意、情绪随时间变化；同处一地的人慢慢生出吸引和嫉妒
  function passive(st, D) {
    const ag = st.ag, R = D.agents.rules;
    for (const [id, P] of Object.entries(ag.p)) {
      if (P.status !== "free") continue;
      if (id !== "user") {
        P.hunger = clamp(P.hunger + R.hunger_per_round, 0, 100);
        if (P.place) P.energy = clamp(P.energy + R.energy_per_round, 0, 100);
        P.mood = clamp(P.mood + Math.sign(60 - P.mood), 0, 100);
      }
      P.drunk = r2(Math.max(0, P.drunk - R.drunk_decay));
      if (P.hurt) P.hurt--;
      P.guilt = r2(P.guilt * (1 - R.guilt_decay));
      const calm = R.emotion_decay * (1.5 - P.nat.neurotic / 100);
      for (const q of Object.keys(ag.p)) {
        const x = ag.rel[id + ">" + q];
        if (!x) continue;
        x.anger = r2(x.anger * (1 - calm)); x.fear = r2(x.fear * (1 - calm)); x.jealous = r2(x.jealous * (1 - calm / 3));
        x.attr = r2(x.attr * (1 - R.attr_decay)); x.love = r2(x.love * (1 - R.love_decay)); x.grudge = r2(x.grudge * (1 - R.grudge_decay));
      }
    }
    const places = new Set(Object.keys(ag.p).map(id => placeOfAny(st, id)).filter(Boolean));
    for (const pl of places) {
      const here = peopleAt(st, pl);
      for (const a of here) for (const b of here) {
        if (a === b) continue;
        const A = ag.p[a], B = ag.p[b], x = rel(ag, a, b);
        if (!x.kin && A.likes.includes(B.sex)) x.attr = r2(clamp(x.attr + R.attr_per_round * A.nat.lust * (1 + (A.ly.lust || 0)) * appeal(B) * (1 - x.attr / 100), 0, 100));
        const gap = (val(st, b, "fame") - val(st, a, "fame") + 30) / 60;
        if (rivalField(D, A.field, B.field) && gap > 0) x.jealous = r2(clamp(x.jealous + R.jealous_per_round * A.nat.envy * (1 + (A.ly.envy || 0)) * Math.min(1, gap), 0, 100));
        // 看不顺眼的人待在一起：火气慢慢往上冒，喝了酒更容易
        if (x.aff < -20) x.anger = r2(clamp(x.anger + R.hate_anger * (-x.aff / 100) * A.nat.wrath * (1 + (A.ly.wrath || 0)) * (1 + 2 * A.drunk), 0, 100));
        // 有吸引、又处得来：吸引慢慢变成爱慕
        if (x.attr >= 50 && x.aff >= 20) x.love = r2(clamp(x.love + R.love_per_round * (x.attr / 100) * (1 - x.love / 100), 0, 100));
        // 伴侣和别人走得近：吃醋
        const pa = partnerOf(ag, a);
        if (pa && pa !== b && here.includes(pa) && rel(ag, pa, b).attr >= 40) bump(st, a, b, {jealous: 3 * A.nat.envy, anger: 1});
      }
    }
  }
  const appeal = P => (P.age >= 18 && P.age <= 40 ? 1 : P.age <= 50 ? 0.5 : 0.2);
  // 雇的凶手到期动手
  function dueHits(st, D) {
    const ag = st.ag;
    for (const h of ag.hits) {
      if (h.done || h.at > ag.t) continue;
      h.done = true;
      const V = ag.p[h.on];
      if (!V || V.status !== "free") continue;
      const dead = rnd(ag) < 0.3;
      if (dead) die(st, D, h.on, `${nameOf(D, h.on)}在夜里遇袭，没能救回来`);
      else { V.hurt = 30; add(st, h.on, "mood", -30); }
      const c = openCase(st, D, {crime: dead ? "凶杀" : "伤人", victim: h.on, culprit: h.by, place: V.place || V.home || "pier"});
      addEv(c, h.by, 10);
      ev(ag, dead ? "kill" : "assault");
      note(st, D, {actor: h.by, target: h.on, behavior: "hire_hit", tier: "violence", text: dead ? `${nameOf(D, h.on)}在夜里遇袭身亡。` : `${nameOf(D, h.on)}在夜里遇袭，受了重伤。`, place: V.place, imp: "major"});
    }
  }

  // ---------------- 结算 ----------------
  const nameOf = (D, id) => (D.names && D.names[id]) || ({lillian: "莉莉安", user: "你"})[id] || id;
  const fmt = (D, s, c) => String(s || "").replace(/\{a\}/g, nameOf(D, c.a)).replace(/\{b\}/g, c.b ? nameOf(D, c.b) : "").replace(/\{p\}/g, c.place ? (D.world_places[c.place] || c.place) : "家里")
    .replace(/\{job\}/g, (c.P.job && c.P.job.label) || "干活");
  const ev = (ag, k, n = 1) => { ag.stats.ev[k] = (ag.stats.ev[k] || 0) + n; };
  function remember(st, D, id, text) {
    const P = st.ag.p[id];
    if (!P) return;
    P.mem.push({d: st.day, s: D.sim.slots[Math.min(st.slot, D.sim.slots.length - 1)].label, text});
    if (P.mem.length > D.agents.rules.memory) P.mem.shift();
  }
  function applyFx(st, c, fx) {
    if (!fx) return;
    const {a, b} = c;
    for (const [k, v] of Object.entries(fx.me || {})) add(st, a, k, v === "job" ? (c.P.job ? c.P.job.pay : 0) : v);
    if (b) {
      for (const [k, v] of Object.entries(fx.t || {})) add(st, b, k, v);
      bump(st, a, b, fx.ab);
      bump(st, b, a, fx.ba);
    }
  }
  // 一件事：前提已经满足。who = "player" 表示主角接管时做的
  function resolve(st, D, a, B, b, o = {}) {
    const ag = st.ag, P = ag.p[a], place = placeOfAny(st, a);
    const c = {a, b, B, P, Q: b ? ag.p[b] : null, place, who: o.who || (a === "user" ? "player" : "npc"), wit: [], text: null, out: "ok", imp: null};
    ag.stats.acts[B.id] = (ag.stats.acts[B.id] || 0) + 1;
    P.recent = [...P.recent.slice(-5), B.id];
    if (B.cool) P.cool[B.id + ":" + (b || "")] = ag.t + B.cool;
    // 在场的人：暗中做的事只有一定概率被看见
    const R = D.agents.rules;
    for (const w of peopleAt(st, place)) {
      if (w === a || w === b) continue;
      if (!B.hidden || rnd(ag) < R.witness_k * (1 + ag.p[w].nat.open / 100)) c.wit.push(w);
    }
    applyFx(st, c, B.fx);
    if (B.do && DO[B.do]) DO[B.do](st, D, c);
    if (c.out === "skip") return c;
    const text = c.text || fmt(D, B.text, c);
    // 记忆：做的人、对象、看见的人
    if (B.tier !== "daily" || c.memo) {
      remember(st, D, a, c.memo || text);
      if (b && b !== "user" && !(B.hidden && !c.noticed)) remember(st, D, b, text);
      for (const w of c.wit) remember(st, D, w, "看见：" + text);
    }
    // 看见伤人的事：对做的人好感降、害怕
    if ((B.harm || 0) >= 2) for (const w of c.wit) if (w !== "user") bump(st, w, a, {aff: -5 * B.harm, fear: 5 * B.harm});
    // 犯罪：被看见或对象知道，就会有人去报警；罗南在场就当场立案
    if (B.crime && c.out !== "fail" && c.out !== "blocked") crime(st, D, c);
    if (a === "user" && (B.harm || 0) >= 2 && c.wit.length) st.heat = (st.heat || 0) + B.harm * 2 * c.wit.length;
    P.last = {label: B.label, b, text, place, t: ag.t, p: o.p == null ? null : Math.round(o.p * 100)};
    const seen = place && place === st.place, involved = a === "user" || b === "user";
    if (B.tier !== "daily" && (B.tier !== "social" || seen || involved) || c.imp) {
      note(st, D, {actor: a, target: b, behavior: B.id, tier: B.tier, text, place, who: c.who === "player" ? "player" : "npc", secret: !!B.hidden && !c.wit.length,
        imp: c.imp || (B.tier === "violence" ? "major" : B.tier === "social" ? "daily" : "normal"), seen: seen || involved});
    }
    return c;
  }
  function note(st, D, e) {
    if (!Sim) return;
    Sim.log(st, D, {kind: "agent", actor: e.actor, target: e.target, behavior: e.behavior, tier: e.tier, text: e.text, importance: e.imp || "normal",
      who: e.who || "npc", place: e.place || null, sub: null, secret: !!e.secret, seen: !!e.seen, skipArt: true, present: e.place ? peopleAt(st, e.place).filter(x => x !== "user") : []});
  }
  function crime(st, D, c) {
    const ag = st.ag, rep = {crime: c.B.crime, culprit: c.a, victim: c.b, place: c.place, day: st.day};
    const aware = [...c.wit];
    if (c.b && c.noticed !== false && ag.p[c.b] && ag.p[c.b].status === "free") aware.push(c.b);
    if (aware.includes("ronan") && c.a !== "ronan") { const k = openCase(st, D, rep); addEv(k, c.a, 60); return; }
    for (const w of aware) if (w !== "user" && w !== c.a) ag.p[w].unreported.push(rep);
    if (c.B.crime === "杀人" || c.B.crime === "投毒") { if (c.dead) openCase(st, D, rep); }
  }
  function openCase(st, D, r) {
    const ag = st.ag;
    let k = ag.cases.find(x => x.open && x.victim === r.victim && x.crime === r.crime && x.culprit === r.culprit);
    if (!k) {
      k = {id: "c" + (ag.cases.length + 1), label: `${nameOf(D, r.victim)}${r.crime}案`, crime: r.crime, victim: r.victim, place: r.place, culprit: r.culprit, ev: {}, left: 0, open: true, day: st.day, frames: []};
      ag.cases.push(k);
      ag.news.push({d: st.day, text: `警方在查${k.label}`});
      ev(ag, "case");
    }
    return k;
  }
  // 人不在了（死、入狱、离开）：恋人、夫妻关系随之结束
  function endTies(st, id) {
    for (const q of Object.keys(st.ag.p)) if (q !== id && st.ag.rel[q + ">" + id] && st.ag.rel[q + ">" + id].status) setStatus(st, q, id, null);
  }
  function die(st, D, id, why) {
    const ag = st.ag, P = ag.p[id];
    if (!P || id === "user") return;
    endTies(st, id);
    P.status = "dead"; P.place = null; P.diedOf = why;
    st.flags[`gone:${id}`] = true;
    ag.news.push({d: st.day, text: why});
    ev(ag, "death");
    for (const q of Object.keys(ag.p)) if (q !== id && q !== "user") { const x = rel(ag, q, id); if (x.aff > 20 || x.love > 20) add(st, q, "mood", -25); }
  }
  function jail(st, D, id, why) {
    const ag = st.ag;
    if (id === "user") { st.ended = "被罗南逮捕入狱"; ag.news.push({d: st.day, text: why}); return; }
    const P = ag.p[id];
    endTies(st, id);
    P.status = "jail"; P.place = null;
    st.flags[`gone:${id}`] = true;
    ag.news.push({d: st.day, text: why});
  }
  function leave(st, D, id, why) {
    const ag = st.ag, P = ag.p[id];
    if (!P || id === "user") return;
    endTies(st, id);
    P.status = "gone"; P.place = null;
    st.flags[`gone:${id}`] = true;
    ag.news.push({d: st.day, text: why});
  }
  // 有人挡在前面（在场、对对象有好感、有胆量）
  function protector(st, D, c) {
    for (const w of c.wit) {
      if (w === "user" || w === c.a) continue;
      const x = rel(st.ag, w, c.b), W = st.ag.p[w];
      if (x.aff >= 40 && rnd(st.ag) < W.nat.nerve / 100 * 0.8) return w;
    }
    return null;
  }
  const chance = (st, p) => rnd(st.ag) < p;

  // ---------------- 特殊结算 ----------------
  const DO = {
    news(st, D, c) {
      const n = st.ag.news[st.ag.news.length - 1];
      if (n) c.memo = `报上说：${n.text}`;
    },
    gamble(st, D, c) {
      const stake = Math.min(10, Math.max(1, Math.floor(val(st, c.a, "money") / 3)));
      if (chance(st, 0.45)) { add(st, c.a, "money", stake); add(st, c.a, "mood", 8); c.text = `${nameOf(D, c.a)}在码头赌了一把，赢了 $${stake}。`; }
      else { add(st, c.a, "money", -stake); add(st, c.a, "mood", -8); c.text = `${nameOf(D, c.a)}在码头赌了一把，输了 $${stake}。`; }
    },
    calm(st, D, c) {
      for (const q of Object.keys(st.ag.p)) { const x = st.ag.rel[c.a + ">" + q]; if (x) { x.anger = r2(x.anger * 0.6); x.fear = r2(x.fear * 0.8); } }
      add(st, c.a, "mood", 5);
    },
    stroll(st, D, c) {
      const slot = slotId(st, D), opts = Object.entries(D.sim.places).filter(([pid, Q]) => Q.public && Q.open.includes(slot) && pid !== c.place).map(([pid]) => pid);
      if (!opts.length) { c.out = "skip"; return; }
      c.P.place = opts[Math.floor(rnd(st.ag) * opts.length)];
      c.text = `${nameOf(D, c.a)}出门转到了${D.world_places[c.P.place]}。`;
    },
    go_home(st, D, c) { c.P.place = null; },
    ask(st, D, c) {
      if (c.b === "user") { c.text = `${nameOf(D, c.a)}向你打听最近的事。`; return; }
      const x = rel(st.ag, c.b, c.a), Q = c.Q;
      const s = st.ag.secrets.find(s => !s.public && knows(s, c.b) && !knows(s, c.a) && !s.about.includes(c.b) && !s.silenced[c.b]);
      if (s && (x.trust >= 20 || x.aff >= 30) && chance(st, 0.3 + Q.nat.outgoing / 300)) {
        s.knowers.push(c.a);
        c.text = `${nameOf(D, c.b)}悄悄告诉${nameOf(D, c.a)}：${s.text}。`;
        c.imp = "normal"; ev(st.ag, "leak");
      } else c.text = `${nameOf(D, c.a)}向${nameOf(D, c.b)}打听消息，没问出什么。`;
    },
    lend(st, D, c) {
      const amt = Math.min(10, Math.floor(val(st, c.a, "money") / 3));
      add(st, c.a, "money", -amt); add(st, c.b, "money", amt);
      bump(st, c.b, c.a, {debt: amt * 5, aff: 5, trust: 3});
      c.text = `${nameOf(D, c.a)}借给${nameOf(D, c.b)} $${amt}。`;
    },
    borrow(st, D, c) {
      if (c.b === "user") { c.text = `${nameOf(D, c.a)}开口想向你借钱。`; return; }
      const x = rel(st.ag, c.b, c.a), Q = c.Q;
      if (Q.money >= 10 && x.aff >= 20 && chance(st, 0.4 + Q.nat.kind / 200)) {
        const amt = Math.min(10, Math.floor(Q.money / 3));
        add(st, c.b, "money", -amt); add(st, c.a, "money", amt);
        bump(st, c.a, c.b, {debt: amt * 5, aff: 4});
        c.text = `${nameOf(D, c.a)}向${nameOf(D, c.b)}借了 $${amt}。`;
      } else {
        bump(st, c.a, c.b, {aff: -4}); st.ag.stats.acts.refuse = (st.ag.stats.acts.refuse || 0) + 1;
        c.text = `${nameOf(D, c.a)}想向${nameOf(D, c.b)}借钱，被拒绝了。`;
      }
    },
    quarrel(st, D, c) {
      const Bn = c.b === "user" ? null : c.Q;
      bump(st, c.a, c.b, {anger: 10, aff: -6});
      bump(st, c.b, c.a, {anger: 15 + (Bn ? Bn.nat.wrath * 10 : 5), aff: -8, grudge: 5});
      rel(st.ag, c.a, c.b).fought = rel(st.ag, c.b, c.a).fought = st.ag.t;
      add(st, c.a, "mood", -5); add(st, c.b, "mood", -6);
      ev(st.ag, "quarrel");
    },
    flirt(st, D, c) {
      const x = rel(st.ag, c.b, c.a), lust = c.b === "user" ? st.ag.p.user.nat.lust : c.Q.nat.lust;
      if (x.attr >= 20 || chance(st, lust)) {
        bump(st, c.a, c.b, {attr: 5}); bump(st, c.b, c.a, {attr: 4 + lust * 8, aff: 2});
        c.text = `${nameOf(D, c.a)}和${nameOf(D, c.b)}调情，${nameOf(D, c.b)}也笑着回应。`;
      } else {
        bump(st, c.b, c.a, {aff: -3}); add(st, c.a, "mood", -3);
        c.text = `${nameOf(D, c.a)}对${nameOf(D, c.b)}献殷勤，${nameOf(D, c.b)}没理会。`; c.out = "fail";
      }
    },
    confess(st, D, c) {
      const x = rel(st.ag, c.b, c.a);
      if (x.love >= 30 || (x.attr >= 50 && x.aff >= 25)) {
        setStatus(st, c.a, c.b, "lover"); bump(st, c.b, c.a, {love: 10}); add(st, c.a, "mood", 15); add(st, c.b, "mood", 10);
        c.text = `${nameOf(D, c.a)}向${nameOf(D, c.b)}表白，${c.b === "user" ? "你答应了。你们" : "对方答应了。他们"}在一起了。`; ev(st.ag, "romance");
      } else {
        add(st, c.a, "mood", -15); bump(st, c.a, c.b, {love: -10}); bump(st, c.b, c.a, {aff: -2});
        c.text = `${nameOf(D, c.a)}向${nameOf(D, c.b)}表白，被婉拒了。`; c.out = "fail";
      }
    },
    propose(st, D, c) {
      const x = rel(st.ag, c.b, c.a);
      if (x.love >= 55) { setStatus(st, c.a, c.b, "engaged"); add(st, c.a, "mood", 15); add(st, c.b, "mood", 15); c.text = `${nameOf(D, c.a)}向${nameOf(D, c.b)}求婚，${c.b === "user" ? "你" : "对方"}答应了。`; ev(st.ag, "engaged"); }
      else if (x.love < 25) { DO.breakup(st, D, c); c.text = `${nameOf(D, c.a)}向${nameOf(D, c.b)}求婚，反倒闹到分手。`; c.out = "fail"; }
      else { add(st, c.a, "mood", -10); c.text = `${nameOf(D, c.a)}向${nameOf(D, c.b)}求婚，对方说还要想想。`; c.out = "fail"; }
    },
    marry(st, D, c) { setStatus(st, c.a, c.b, "married"); add(st, c.a, "mood", 20); add(st, c.b, "mood", 20); ev(st.ag, "marry"); st.ag.news.push({d: st.day, text: `${nameOf(D, c.a)}和${nameOf(D, c.b)}结婚了`}); },
    child(st, D, c) { (st.ag.children = st.ag.children || []).push({parents: [c.a, c.b], day: st.day}); ev(st.ag, "child"); c.imp = "major"; },
    breakup(st, D, c) {
      setStatus(st, c.a, c.b, null);
      const x = rel(st.ag, c.b, c.a), y = rel(st.ag, c.a, c.b);
      bump(st, c.b, c.a, {grudge: 20 + x.love / 3, anger: 20, aff: -15});
      x.love = r2(x.love / 2); y.love = r2(y.love / 2);
      add(st, c.b, "mood", -20);
      ev(st.ag, "breakup");
    },
    affair(st, D, c) {
      bump(st, c.a, c.b, {love: 6, attr: 4}); bump(st, c.b, c.a, {love: 6, attr: 4});
      const s = addSecret(st.ag, {about: [c.a, c.b], knowers: [c.a, c.b, ...c.wit], sev: 2, text: `${nameOf(D, c.a)}和${nameOf(D, c.b)}背着人私通`, kind: "affair"});
      for (const w of c.wit) for (const lover of [c.a, c.b]) if (partnerOf(st.ag, lover) === w) bump(st, w, lover, {jealous: 50, anger: 40, aff: -30});
      ev(st.ag, "affair"); c.noticed = true;
      void s;
    },
    elope(st, D, c) {
      leave(st, D, c.a, `${nameOf(D, c.a)}和${nameOf(D, c.b)}私奔了`); leave(st, D, c.b, `${nameOf(D, c.a)}和${nameOf(D, c.b)}私奔了`);
      ev(st.ag, "elope"); c.imp = "major";
    },
    jealous_scene(st, D, c) {
      bump(st, c.a, c.b, {anger: 20}); bump(st, c.b, c.a, {anger: 10});
      rel(st.ag, c.a, c.b).fought = rel(st.ag, c.b, c.a).fought = st.ag.t;
      const B = c.b === "user" ? st.ag.p.user : c.Q;
      if (chance(st, (B.nat.kind + B.nat.conscience) / 250)) { bump(st, c.a, c.b, {jealous: -20}); c.text = `${nameOf(D, c.a)}拉住${nameOf(D, c.b)}质问，${nameOf(D, c.b)}低头认了错。`; }
      else if (chance(st, 0.4)) { DO.breakup(st, D, c); c.text = `${nameOf(D, c.a)}拉住${nameOf(D, c.b)}质问，两人大吵一架，分手了。`; }
      else c.text = `${nameOf(D, c.a)}拉住${nameOf(D, c.b)}质问，两人吵得不欢而散。`;
      ev(st.ag, "quarrel");
    },
    unfight(st, D, c) { rel(st.ag, c.a, c.b).fought = rel(st.ag, c.b, c.a).fought = -999; },
    steal_role(st, D, c) {
      add(st, c.b, "fame", -3); add(st, c.a, "fame", 3);
      bump(st, c.b, c.a, {grudge: 30, anger: 20, aff: -15});
      add(st, c.b, "mood", -10);
      c.text = `${nameOf(D, c.a)}从${nameOf(D, c.b)}手里抢走了一个机会。`; ev(st.ag, "steal_role");
    },
    humiliate(st, D, c) {
      add(st, c.b, "mood", -15); add(st, c.a, "mood", 5);
      bump(st, c.b, c.a, {grudge: 40, anger: 30, aff: -20});
      for (const w of c.wit) if (w !== "user") bump(st, w, c.a, {aff: -5});
      ev(st.ag, "humiliate");
    },
    rumor(st, D, c) {
      add(st, c.b, "fame", -2);
      for (const w of c.wit) if (w !== "user" && w !== c.b) bump(st, w, c.b, {aff: -5, trust: -3});
      if (c.b !== "user" && chance(st, 0.35)) { bump(st, c.b, c.a, {grudge: 25, anger: 15, aff: -10}); remember(st, D, c.b, `听说${nameOf(D, c.a)}在背后说我坏话`); }
      if (c.b === "user") add(st, "user", "mood", -3);
      ev(st.ag, "rumor");
    },
    inform(st, D, c) {
      const list = secretsAbout(st.ag, c.b, c.a);
      for (const s of list) {
        if (!knows(s, "ronan")) s.knowers.push("ronan");
        if (s.case) { const k = st.ag.cases.find(x => x.id === s.case && x.open); if (k) addEv(k, c.b, 15 * s.sev); }
      }
      bump(st, "ronan", c.b, {trust: -10});
      c.text = `${nameOf(D, c.a)}向罗南告发了${nameOf(D, c.b)}：${list[0].text}。`;
      ev(st.ag, "inform");
    },
    snoop(st, D, c) {
      const found = st.ag.secrets.find(s => !s.public && s.found_at === c.place && s.about.includes(c.b) && !knows(s, c.a))
        || (chance(st, 0.3) ? st.ag.secrets.find(s => !s.public && knows(s, c.b) && !knows(s, c.a)) : null);
      if (found) { found.knowers.push(c.a); c.text = `${nameOf(D, c.a)}趁没人翻了${nameOf(D, c.b)}的东西，发现：${found.text}。`; ev(st.ag, "snoop_found"); }
      else c.text = `${nameOf(D, c.a)}趁没人翻了${nameOf(D, c.b)}的东西，没找到什么。`;
    },
    steal(st, D, c) {
      const amt = r2(Math.min(val(st, c.b, "money") * 0.3, 20));
      add(st, c.b, "money", -amt); add(st, c.a, "money", amt);
      const B = c.b === "user" ? st.ag.p.user : c.Q;
      c.noticed = chance(st, 0.25 + B.nat.open / 400);
      if (c.noticed) { bump(st, c.b, c.a, {anger: 40, aff: -30, trust: -40, grudge: 30}); c.text = `${nameOf(D, c.a)}偷${nameOf(D, c.b)}的钱，被当场发现。`; }
      else c.text = c.b === "user" ? `你身上少了 $${amt}，不知道丢在了哪儿。` : `${nameOf(D, c.a)}偷走了${nameOf(D, c.b)}的 $${amt}，没被发现。`;
      add(st, c.a, "guilt", 10 * c.P.nat.conscience / 100);
      ev(st.ag, "steal");
    },
    blackmail(st, D, c) {
      const s = secretsAbout(st.ag, c.b, c.a)[0], B = c.b === "user" ? st.ag.p.user : c.Q;
      if (c.b !== "user" && B.nat.nerve < 60) {
        const amt = r2(Math.min(val(st, c.b, "money") * 0.4, 30));
        add(st, c.b, "money", -amt); add(st, c.a, "money", amt);
        c.text = `${nameOf(D, c.a)}拿「${s.text}」勒索${nameOf(D, c.b)}，拿到 $${amt}。`;
      } else { c.text = `${nameOf(D, c.a)}拿「${s.text}」勒索${nameOf(D, c.b)}，${c.b === "user" ? "你" : "对方"}没有就范。`; c.out = "fail"; }
      bump(st, c.b, c.a, {fear: 30, aff: -30, grudge: 40, anger: 20});
      ev(st.ag, "blackmail");
    },
    bribe(st, D, c) {
      const s = secretsAbout(st.ag, c.a, c.b).find(x => !x.silenced[c.b]), B = c.Q;
      if (c.b === "user") { add(st, "user", "money", 10); add(st, c.a, "money", -10); c.text = `${nameOf(D, c.a)}塞给你 $10，让你别多嘴。`; return; }
      if (!s) { c.out = "skip"; return; }
      if (B.nat.greed * 100 + rel(st.ag, c.b, c.a).aff / 2 > 30) {
        add(st, c.a, "money", -10); add(st, c.b, "money", 10); s.silenced[c.b] = true;
        c.text = `${nameOf(D, c.a)}塞给${nameOf(D, c.b)} $10，对方答应闭嘴。`; ev(st.ag, "bribe");
      } else { bump(st, c.b, c.a, {trust: -15}); c.text = `${nameOf(D, c.a)}想收买${nameOf(D, c.b)}，被推了回来。`; c.out = "fail"; }
    },
    frame(st, D, c) {
      const ag = st.ag, k = ag.cases.find(x => x.open && x.culprit === c.a) || ag.cases.find(x => x.open);
      addEv(k, c.b, 35);
      k.frames.push({by: c.a, on: c.b, day: st.day});
      addSecret(ag, {about: [c.a], knowers: [c.a, ...c.wit], sev: 3, text: `${nameOf(D, c.a)}伪造了指向${nameOf(D, c.b)}的证据（${k.label}）`, kind: "frame", case: k.id});
      add(st, c.a, "guilt", 20 * c.P.nat.conscience / 100);
      c.text = `${nameOf(D, c.a)}伪造了指向${nameOf(D, c.b)}的证据（${k.label}）。`;
      ev(ag, "frame");
    },
    threaten(st, D, c) {
      const B = c.b === "user" ? st.ag.p.user : c.Q;
      bump(st, c.b, c.a, {fear: 30 + c.P.nat.nerve / 5, anger: 10, aff: -15});
      for (const s of secretsAbout(st.ag, c.a, c.b)) if (B.nat.nerve < 50) s.silenced[c.b] = true;
      if (c.b === "user") add(st, "user", "mood", -8);
      ev(st.ag, "threaten");
    },
    vandal(st, D, c) {
      add(st, c.b, "mood", -12); add(st, c.b, "money", -3);
      if (c.b !== "user") remember(st, D, c.b, `我的东西被人毁了，不知道是谁`);
      c.text = `${nameOf(D, c.a)}趁没人毁了${nameOf(D, c.b)}放在${D.world_places[c.place]}的东西。`;
      ev(st.ag, "vandal");
    },
    betray(st, D, c) {
      const ag = st.ag, s = secretsAbout(ag, c.b, c.a)[0];
      let buyer = null, best = 0;
      for (const q of Object.keys(ag.p)) if (q !== c.a && q !== c.b && q !== "user" && ag.p[q].status === "free" && !knows(s, q)) { const h = -rel(ag, q, c.b).aff + (q === "ronan" ? 30 : 0); if (h > best) { best = h; buyer = q; } }
      if (!buyer) { c.out = "skip"; return; }
      s.knowers.push(buyer);
      if (s.case && buyer === "ronan") { const k = ag.cases.find(x => x.id === s.case && x.open); if (k) addEv(k, c.b, 15 * s.sev); }
      if (buyer !== "ronan") { add(st, buyer, "money", -10); add(st, c.a, "money", 10); }
      add(st, c.a, "guilt", 25 * c.P.nat.conscience / 100);
      if (chance(st, 0.3)) bump(st, c.b, c.a, {grudge: 60, aff: -50, trust: -80});
      c.text = `${nameOf(D, c.a)}把${nameOf(D, c.b)}的秘密卖给了${nameOf(D, buyer)}：${s.text}。`;
      ev(ag, "betray");
    },
    assault(st, D, c) {
      const w = protector(st, D, c);
      if (w) { c.text = `${nameOf(D, c.a)}要动手打${nameOf(D, c.b)}，${nameOf(D, w)}挡在了前面。`; c.out = "blocked"; bump(st, c.b, w, {aff: 15, trust: 10}); bump(st, c.b, c.a, {anger: 20, grudge: 20}); ev(st.ag, "protect"); return; }
      if (c.b !== "user") c.Q.hurt = 12;
      add(st, c.b, "mood", -20);
      bump(st, c.b, c.a, {anger: 30, fear: 20, grudge: 40, aff: -25});
      add(st, c.a, "guilt", 10 * c.P.nat.conscience / 100);
      ev(st.ag, "assault");
    },
    buy_gun(st, D, c) {
      add(st, c.a, "money", -15);
      if (c.a === "user") { if (!st.items.includes("gun")) st.items.push("gun"); }
      c.P.has.gun = true;
      addSecret(st.ag, {about: [c.a], knowers: [c.a, ...c.wit], sev: 1, text: `${nameOf(D, c.a)}在码头买了一把枪`, kind: "gun"});
      ev(st.ag, "gun");
    },
    gun_threat(st, D, c) {
      const w = protector(st, D, c);
      if (w) { c.text = `${nameOf(D, c.a)}掏枪对着${nameOf(D, c.b)}，${nameOf(D, w)}挡在了前面，${nameOf(D, c.a)}没敢开枪。`; c.out = "blocked"; ev(st.ag, "protect"); return; }
      bump(st, c.b, c.a, {fear: 50, anger: 20, aff: -30, grudge: 30});
      const B = c.b === "user" ? st.ag.p.user : c.Q;
      for (const s of secretsAbout(st.ag, c.a, c.b)) if (B.nat.nerve < 70) s.silenced[c.b] = true;
      ev(st.ag, "gun_threat");
    },
    hire_hit(st, D, c) {
      add(st, c.a, "money", -30);
      st.ag.hits.push({by: c.a, on: c.b, at: st.ag.t + 15 + Math.floor(rnd(st.ag) * 20)});
      addSecret(st.ag, {about: [c.a], knowers: [c.a], sev: 3, text: `${nameOf(D, c.a)}在码头雇了人对付${nameOf(D, c.b)}`, kind: "hit"});
      add(st, c.a, "guilt", 20 * c.P.nat.conscience / 100);
      ev(st.ag, "hire");
    },
    poison(st, D, c) {
      const dead = chance(st, 0.3);
      if (dead) { die(st, D, c.b, `${nameOf(D, c.b)}在${D.world_places[c.place]}突然倒下，再没醒来`); c.dead = true; c.text = `${nameOf(D, c.a)}往${nameOf(D, c.b)}的杯子里下了药，${nameOf(D, c.b)}死了。`; ev(st.ag, "kill"); }
      else { c.Q.hurt = 25; add(st, c.b, "mood", -25); c.text = `${nameOf(D, c.a)}往${nameOf(D, c.b)}的杯子里下了药，${nameOf(D, c.b)}病倒了。`; ev(st.ag, "poison"); }
      c.noticed = false;
      addSecret(st.ag, {about: [c.a], knowers: [c.a, ...c.wit], sev: 3, text: `${nameOf(D, c.a)}给${nameOf(D, c.b)}下过毒`, kind: "crime"});
      add(st, c.a, "guilt", 35 * c.P.nat.conscience / 100 + 10);
      c.imp = "major";
    },
    kill(st, D, c) {
      die(st, D, c.b, `${nameOf(D, c.b)}被发现死在${D.world_places[c.place]}`);
      c.dead = true; c.noticed = false;
      const k = openCase(st, D, {crime: "凶杀", victim: c.b, culprit: c.a, place: c.place});
      addEv(k, c.a, 15);
      addSecret(st.ag, {about: [c.a], knowers: [c.a], sev: 3, text: `${nameOf(D, c.a)}杀了${nameOf(D, c.b)}`, kind: "crime", case: k.id});
      add(st, c.a, "guilt", 40 * c.P.nat.conscience / 100 + 10);
      ev(st.ag, "kill"); c.imp = "major";
    },
    coverup(st, D, c) {
      for (const k of st.ag.cases) if (k.open && k.culprit === c.a) addEv(k, c.a, -15);
      if (chance(st, 0.1)) { for (const k of st.ag.cases) if (k.open && k.culprit === c.a) addEv(k, c.a, 25); c.text = `${nameOf(D, c.a)}想收拾留下的痕迹，反倒露了马脚。`; c.out = "fail"; }
      ev(st.ag, "coverup");
    },
    leave_city(st, D, c) { leave(st, D, c.a, `${nameOf(D, c.a)}连夜离开了洛杉矶`); ev(st.ag, "left"); c.imp = "major"; },
    surrender(st, D, c) {
      for (const k of st.ag.cases) if (k.open && (k.culprit === c.a || (k.frames || []).some(f => f.by === c.a))) { k.open = false; k.result = "自首"; }
      for (const s of st.ag.secrets) if (s.about.includes(c.a)) s.public = true;
      jail(st, D, c.a, `${nameOf(D, c.a)}去警局自首了`);
      ev(st.ag, "surrender"); ev(st.ag, "solved"); c.imp = "major";
    },
    report(st, D, c) {
      for (const r of c.P.unreported.splice(0)) {
        const k = openCase(st, D, r);
        addEv(k, r.culprit, 30);
      }
      ev(st.ag, "report");
    },
    revenge(st, D, c) {
      const opts = ["humiliate", "rumor", "quarrel", "assault"].map(id => D.behaviors.behaviors.find(x => x.id === id))
        .filter(B => B && reqOk(st, D, c.a, c.b, {...B, req: (B.req || []).filter(t => !/^(mad|hate|jealous)>=/.test(t))}, false));
      if (!opts.length) { c.out = "skip"; return; }
      const B = opts.sort((x, y) => score(st, D, c.a, y, c.b) - score(st, D, c.a, x, c.b))[0];
      bump(st, c.a, c.b, {grudge: -20});
      resolve(st, D, c.a, B, c.b, {who: c.who});
      c.out = "skip";
    },
    investigate(st, D, c) {
      const ag = st.ag, k = ag.cases.filter(x => x.open).sort((x, y) => (y.place === c.place) - (x.place === c.place))[0];
      const P = c.P, find = 0.06 + P.nat.dutiful / 800 + P.nat.open / 1200 + (k.place === c.place ? 0.06 : 0);
      c.text = `${nameOf(D, c.a)}在${D.world_places[c.place]}为${k.label}勘查。`;
      const phys = ag.secrets.find(s => !s.public && s.found_at === c.place && !knows(s, c.a));
      if (phys) { phys.knowers.push(c.a); if (phys.case === k.id) addEv(k, phys.about[0], 15 * phys.sev); c.text += `发现：${phys.text}。`; ev(ag, "clue"); return; }
      if (!chance(st, find)) return;
      // 被栽赃的人：细心的警探有机会看出破绽
      const fr = k.frames.find(f => !f.seen);
      if (fr && chance(st, 0.25 + P.nat.open / 200)) { fr.seen = true; addEv(k, fr.on, -35); addEv(k, fr.by, 30); c.text += `看出指向${nameOf(D, fr.on)}的证据是伪造的。`; ev(ag, "frame_seen"); return; }
      if (k.culprit) { addEv(k, k.culprit, 10); c.text += "找到一点新线索。"; }
      else { k.left += 10; c.text += "越查越像是她自己走的。"; if (k.left >= 70) { k.open = false; k.result = "自己离开"; ag.news.push({d: st.day, text: `罗南认定${k.label.replace("失踪", "")}是自己离开洛杉矶的`}); ev(ag, "solved"); c.imp = "major"; } }
    },
    question(st, D, c) {
      const ag = st.ag, k = ag.cases.find(x => x.open);
      if (c.b === "user") {
        const hit = k && (k.culprit === "user" || (k.ev.user || 0) > 0);
        if (hit && chance(st, 0.5 - (st.skills.nerve || 2) * 0.08)) { k.ev.user = (k.ev.user || 0) + 10; c.text = `${nameOf(D, c.a)}找你问话，你有点紧张。`; }
        else c.text = `${nameOf(D, c.a)}找你问了几句${k ? k.label : ""}的事。`;
        return;
      }
      const B = c.Q, x = rel(ag, c.b, c.a);
      const told = ag.secrets.find(s => !s.public && s.case && knows(s, c.b) && !knows(s, c.a) && !s.about.includes(c.b) && !s.silenced[c.b]);
      const fearOf = told ? Math.max(...told.about.map(q => (ag.rel[c.b + ">" + q] || {fear: 0}).fear)) : 0;
      if (told && chance(st, B.nat.conscience / 100 * (1 - fearOf / 100) * (0.5 + x.trust / 200) + 0.1)) {
        told.knowers.push(c.a);
        const kk = ag.cases.find(z => z.id === told.case && z.open);
        if (kk) for (const q of told.about) if (q !== "lillian") addEv(kk, q, 15 * told.sev);
        if (kk && told.about.includes("lillian")) kk.left += 25;
        c.text = `${nameOf(D, c.a)}找${nameOf(D, c.b)}问话，${nameOf(D, c.b)}说出：${told.text}。`; c.imp = "normal"; ev(ag, "testify");
        bump(st, c.b, c.a, {trust: 3});
        return;
      }
      const sus = ag.cases.find(z => z.open && (z.culprit === c.b || (z.ev[c.b] || 0) > 0));
      if (sus && !chance(st, B.nat.nerve / 100)) { addEv(sus, c.b, 8); c.text = `${nameOf(D, c.a)}找${nameOf(D, c.b)}问话，${nameOf(D, c.b)}答得前后对不上。`; }
      else c.text = `${nameOf(D, c.a)}找${nameOf(D, c.b)}问话，没问出什么。`;
      bump(st, c.b, c.a, {fear: 5});
    },
    arrest(st, D, c) {
      const ag = st.ag, k = ag.cases.find(x => x.open && topSuspect(x) === c.b && (x.ev[c.b] || 0) >= D.agents.rules.arrest_at);
      k.open = false;
      const right = k.culprit === c.b;
      k.result = right ? "破案" : "抓错了人";
      for (const s of ag.secrets) if (s.case === k.id && s.about.includes(c.b)) s.public = true;
      jail(st, D, c.b, `${nameOf(D, c.a)}以${k.label}逮捕了${nameOf(D, c.b)}`);
      ev(ag, right ? "solved" : "wrongful"); ev(ag, "arrest");
      c.text = `${nameOf(D, c.a)}以${k.label}逮捕了${nameOf(D, c.b)}。`; c.imp = "major";
      add(st, c.a, "fame", 5);
    },
  };

  // ---------------- 主角接管：能做的事 ----------------
  function deedOptions(st, D) {
    if (!st.ag || st.ended || st.pending) return [];
    ensureSlot(st, D);
    const out = [];
    for (const {B, b} of candidates(st, D, "user", true)) {
      if (b && b !== "user" && st.ag.p[b].status !== "free") continue;
      out.push({key: `deed:${B.id}:${b || ""}`, kind: "deed", id: B.id, target: b, label: B.label + (b ? `（${nameOf(D, b)}）` : ""), rounds: 1, tier: B.tier, harm: B.harm || 0, risky: (B.risk || 0) >= 2});
    }
    return out;
  }
  function playerDeed(st, D, opt) {
    const B = D.behaviors.behaviors.find(x => x.id === opt.id);
    if (!B) return null;
    return resolve(st, D, "user", B, opt.target || null, {who: "player"});
  }

  // ---------------- 给页面看的 ----------------
  function view(st, D) {
    const ag = st.ag;
    if (!ag) return null;
    ensureSlot(st, D);
    const L = D.agents.labels;
    return Object.values(ag.p).map(P => {
      const id = P.id, rels = [];
      for (const q of Object.keys(ag.p)) {
        if (q === id) continue;
        const x = ag.rel[id + ">" + q];
        if (!x) continue;
        const bits = [];
        if (x.status) bits.push({lover: "恋人", engaged: "订婚", married: "夫妻"}[x.status]);
        if (Math.abs(x.aff) >= 5) bits.push(`好感${Math.round(x.aff)}`);
        if (Math.abs(x.trust) >= 5) bits.push(`信任${Math.round(x.trust)}`);
        for (const e of EMO) if (x[e] >= 5) bits.push(`${D.agents.emotions[e]}${Math.round(x[e])}`);
        if (x.debt >= 5) bits.push(`欠人情${Math.round(x.debt)}`);
        if (bits.length) rels.push({to: q, name: nameOf(D, q), text: bits.join(" ")});
      }
      return {id, name: nameOf(D, id), status: P.status, place: id === "user" ? st.place : P.place, birth: P.birth, age: P.age, chart: P.chart, mbti: P.mbti, lyGods: P.lyGods,
        nat: P.nat, raw: P.raw, labels: L, goal: P.goal, week: P.week, money: val(st, id, "money"), fame: val(st, id, "fame"), mood: val(st, id, "mood"),
        hunger: P.hunger, energy: val(st, id, "energy"), drunk: P.drunk, guilt: P.guilt, hurt: P.hurt, gun: !!P.has.gun,
        last: P.last, cands: P.cands || [], placeWhy: P.placeWhy || [], mem: P.mem.slice(-6), rels,
        secrets: ag.secrets.filter(s => knows(s, id)).map(s => ({text: s.text, pub: s.public, mine: s.about.includes(id)}))};
    });
  }

  const Agents = {init, tick, skipSlot, placeOf, deedOptions, playerDeed, mirror, view, chart, nature, liunian, applyAdjust, tenGod,
    bind(sim) { Sim = sim; }, rel: (st, a, b) => rel(st.ag, a, b), feat, reqOk, score};
  root.Agents = Agents;
  if (typeof module !== "undefined") module.exports = Agents;
})(typeof window !== "undefined" ? window : globalThis);
