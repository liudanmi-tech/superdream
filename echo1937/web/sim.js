"use strict";
// ================= 《回声 1937》第二版：城市模拟内核（见 docs/sim-design.md） =================
// 规则决定发生什么：时间回合、地点和移动、人物日程、需求、动作结算、检定、自主决策。不依赖页面，浏览器和 Node 都能跑。
// 故事卡由 story.js 处理（Story.afterAction / Story.onTick / Story.hints），这里在合适的时机调用它。
(function (root) {
  const Story = root.Story || (typeof require === "function" ? require("./story.js") : null);

  // ---------------- 随机数：同一个种子跑出同样的结果 ----------------
  function rngNext(state) {
    let t = (state.rng = (state.rng + 0x6D2B79F5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  // 与玩家怎么走无关的随机（比如人物今天去哪）：按种子和天、时段算，玩家怎么选都不会改变
  function hashRand(...parts) {
    let h = 2166136261;
    for (const ch of parts.join("|")) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
    h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995); h ^= h >>> 15;
    return (h >>> 0) / 4294967296;
  }
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const round2 = v => Math.round(v * 100) / 100;

  // ---------------- 新游戏 ----------------
  function newGame(D, opts = {}) {
    const S = D.sim, seed = (opts.seed >>> 0) || 1, role = opts.role || "singer";
    const st = {
      v: 1, seed, rng: seed, role, day: 1, slot: 0, round: 0, place: "apartment", sub: null,
      money: S.player.money, energy: S.player.energy, mood: S.player.mood, social: S.player.social,
      fame: S.player.fame + (role === "singer" ? 5 : 0), heat: 0,
      skills: {...S.player.skills, [S.jobs[role].skill]: S.player.job_skill}, xp: {},
      traits: {}, rel: {}, items: [], clues: [], flags: {}, cards: {fired: {}, unlocked: {}, lastAt: {}},
      quests: {}, prefs: {actions: {}, styles: {}}, control: "auto", decisionMode: opts.decisionMode || "auto",
      jobDone: {}, missed: 0, warnings: 0, fired: false, todayPlaces: ["apartment"], recent: [], onceSlot: {},
      pending: null, log: [], seq: 0, ended: null, tick: 0, placeLog: [], dayCount: {},
    };
    // 性格：入住时给一个基础值，按身份略有倾向，再加一点随机；接管越多，"像你"的权重越大
    const lean = {singer: {proud: 0.15, warm: 0.1}, makeup: {cautious: 0.1, diligent: 0.15}, reporter: {curious: 0.2}}[role] || {};
    for (const t of Object.keys(S.traits)) st.traits[t] = round2(clamp(0.5 + (lean[t] || 0) + (rngNext(st) - 0.5) * 2 * S.player.trait_spread, 0, 1));
    if (opts.traits) Object.assign(st.traits, opts.traits);
    for (const [id, n] of Object.entries(S.npcs)) st.rel[id] = {a: n.rel.a, t: n.rel.t};
    if (Story) Story.init(st, D);
    log(st, D, {kind: "system", text: `第 1 天 · ${S.slots[0].label}。你在公寓醒来。`, importance: "daily"});
    if (Story) Story.onTick(st, D);
    makePlan(st, D);
    return st;
  }

  // ---------------- 时间 ----------------
  const slotOf = (st, D) => D.sim.slots[st.slot];
  const roundsLeft = (st, D) => slotOf(st, D).rounds - st.round;
  // 人物此刻在哪：按日程；日程写成数组时按种子、天、时段在几个地点里选一个；故事卡可以临时改（st.flags["npc:<id>:<day>:<slot>"]）
  function npcPlace(st, D, id, slotIdx = st.slot, day = st.day) {
    const slot = D.sim.slots[slotIdx].id, over = st.flags[`npc:${id}:${day}:${slot}`];
    if (over !== undefined) return over || null;
    if (st.flags[`gone:${id}`]) return null;
    let p = D.sim.npcs[id].schedule[slot];
    if (Array.isArray(p)) p = p[Math.floor(hashRand(st.seed, id, day, slot) * p.length)];
    return p || null;
  }
  // 此刻在场的人。座位一类的小地点（seat: true，比如餐厅的卡座）还在同一个屋子里，人照算
  function presentAt(st, D, place = st.place, sub = st.sub) {
    const sp = sub && ((D.sim.places[place].subs || {})[sub] || {});
    if (sub && !sp.seat && !sp.view) return [];
    return Object.keys(D.sim.npcs).filter(id => npcPlace(st, D, id) === place && D.sim.places[place] && isOpen(st, D, place));
  }
  function isOpen(st, D, place) {
    const P = D.sim.places[place];
    return !!P && P.open.includes(slotOf(st, D).id) && (!P.needs_flag || st.flags[P.needs_flag]);
  }

  // 推进 n 个回合：需求变化，跨时段时结算没去上班，跨天时进入新的一天
  function advance(st, D, n) {
    const R = D.sim.rules;
    for (let i = 0; i < n && !st.ended; i++) {
      st.energy = clamp(st.energy + R.decay_per_round.energy, 0, 100);
      st.social = clamp(st.social + R.decay_per_round.social, 0, 100);
      st.mood = clamp(st.mood + Math.sign(R.mood_toward - st.mood), 0, 100);
      st.round++; st.tick++;
      if (st.round >= slotOf(st, D).rounds) endSlot(st, D);
    }
  }
  function endSlot(st, D) {
    const job = D.sim.jobs[st.role], slot = slotOf(st, D);
    if (!st.fired && job.slot === slot.id && !st.jobDone[st.day]) {
      st.missed++;
      log(st, D, {kind: "system", text: `你没去${D.world_places[job.place]}上班（缺勤 ${st.missed} 次）。`, importance: "normal", delta: {missed: 1}});
      if (Story) Story.onFlag(st, D, "missed_shift");
    }
    if (Story) Story.onSlotEnd(st, D);
    st.round = 0; st.slot++;
    if (st.slot >= D.sim.slots.length) newDay(st, D);
    else { log(st, D, {kind: "time", text: `${slotOf(st, D).label}（${slotOf(st, D).hours}）`, importance: "daily"}); makePlan(st, D); }
  }
  function newDay(st, D, slept) {
    const R = D.sim.rules;
    if (st.place !== "apartment") { log(st, D, {kind: "system", text: "夜深了，你拖着步子回到公寓。", importance: "daily"}); st.place = "apartment"; st.sub = null; }
    st.energy = slept ? 95 : clamp(st.energy + 55, 0, 85);
    st.heat = Math.max(0, st.heat - R.heat_daily_decay);
    st.day++; st.slot = 0; st.round = 0; st.todayPlaces = ["apartment"]; st.dayCount = {};
    log(st, D, {kind: "day", text: `第 ${st.day} 天 · ${D.sim.slots[0].label}`, importance: "daily"});
    if (Story) Story.onNewDay(st, D);
    makePlan(st, D);
  }

  // ---------------- 检定 ----------------
  function skillLevel(st, D, skill) { return skill === "job" ? st.skills[D.sim.jobs[st.role].skill] : (st.skills[skill] || 1); }
  function checkOdds(st, D, chk, ctx = {}) {
    const C = D.sim.rules.check, R = D.sim.rules;
    let mod = chk.mod || 0;
    if (chk.nerve) mod += (skillLevel(st, D, "nerve") - 2) * 5;
    if (chk.trust && ctx.target) mod += Math.round((st.rel[ctx.target].t - 40) / 4);
    if (st.energy < R.low_energy) mod -= 10;
    if (st.mood < R.low_mood) mod -= 5;
    if (ctx.risky) mod -= 3 * stars(st, D);
    return clamp(C.base + C.per_level * skillLevel(st, D, chk.skill) + mod, C.min, C.max);
  }
  function roll(st, D, p) {
    const r = Math.floor(rngNext(st) * 100) + 1;
    return {p, roll: r, outcome: r <= p ? "success" : r <= p + D.sim.rules.check.partial_band ? "partial" : "fail"};
  }
  const stars = (st, D) => Math.min(D.sim.rules.max_stars, Math.floor(st.heat / D.sim.rules.heat_per_star));
  function gainXp(st, D, skill, n = 1) {
    if (!skill) return null;
    if (skill === "job") skill = D.sim.jobs[st.role].skill;
    st.xp[skill] = (st.xp[skill] || 0) + n;
    if (st.xp[skill] >= D.sim.rules.xp_per_level && st.skills[skill] < D.sim.rules.max_skill) {
      st.xp[skill] = 0; st.skills[skill]++;
      return `${D.sim.skills[skill]}升到 ${st.skills[skill]} 级`;
    }
    return null;
  }

  // ---------------- 效果 ----------------
  function applyEffects(st, D, fx, delta = {}) {
    if (!fx) return delta;
    for (const k of ["energy", "mood", "social", "fame"]) if (fx[k] !== undefined) {
      const before = st[k];
      st[k] = typeof fx[k] === "string" && fx[k][0] === "=" ? +fx[k].slice(1) : clamp(st[k] + fx[k], 0, 100);
      delta[k] = (delta[k] || 0) + st[k] - before;
    }
    if (fx.money) { st.money = round2(st.money + fx.money); delta.money = round2((delta.money || 0) + fx.money); }
    if (fx.heat) { st.heat = Math.max(0, st.heat + fx.heat); delta.heat = (delta.heat || 0) + fx.heat; }
    if (fx.rel) for (const [id, r] of Object.entries(fx.rel)) {
      if (!st.rel[id]) continue;
      const d = delta.rel = delta.rel || {}, dd = d[id] = d[id] || {a: 0, t: 0};
      if (r.a) { st.rel[id].a = clamp(st.rel[id].a + r.a, 0, 100); dd.a += r.a; }
      if (r.t) { st.rel[id].t = clamp(st.rel[id].t + r.t, 0, 100); dd.t += r.t; }
    }
    if (fx.xp) for (const [k, n] of Object.entries(fx.xp)) { const up = gainXp(st, D, k, n); if (up) (delta.levelUp = delta.levelUp || []).push(up); }
    return delta;
  }

  // ---------------- 今天的打算 ----------------
  // 每个时段打算去哪儿、为什么：上班 > 任务线索 > 吃饭 > 找朋友 > 在家。她自己过的时候往打算的地方走；你接管时可以不管它。
  // 每个时段开始时把剩下的时段重新排一遍（任务可能变了），已经过去的时段保留原来的打算。
  function subParent(D, sub) { return Object.keys(D.sim.places).find(pid => (D.sim.places[pid].subs || {})[sub]) || null; }
  function makePlan(st, D) {
    const S = D.sim, job = S.jobs[st.role], used = {};
    const keep = st.plan && st.plan.day === st.day ? st.plan.items.filter(x => S.slots.findIndex(y => y.id === x.slot) < st.slot) : [];
    for (const x of keep) used[x.place] = (used[x.place] || 0) + 1;
    const items = [...keep];
    for (let i = st.slot; i < S.slots.length; i++) {
      const slot = S.slots[i].id;
      const openAt = pid => { const P = S.places[pid]; return !!P && P.open.includes(slot) && (!P.needs_flag || !!st.flags[P.needs_flag]); };
      let it = null;
      if (!st.fired && job.slot === slot && !st.jobDone[st.day]) it = {place: job.place, why: job.label, kind: "job"};
      else if (slot === "late") it = {place: "apartment", why: "回家睡觉", kind: "home"};
      else {
        let best = null;
        for (const h of Story ? Story.hints(st, D, slot) : []) {
          const place = h.place || (h.sub ? subParent(D, h.sub) : null);
          if (!place || !openAt(place) || (h.role && h.role !== st.role)) continue;
          // 线索不够还做不了的事（比如整理线索）不排进打算
          const need = h.action && S.actions[h.action] && (S.actions[h.action].requires || {}).clues;
          if (need && st.clues.length < need) continue;
          if (h.target && npcPlace(st, D, h.target, i) !== place) continue;
          const w = h.weight - 6 * (used[place] || 0);
          if (!best || w > best.w) best = {w, place, why: h.why || "任务"};
        }
        if (best) it = {place: best.place, why: best.why, kind: "quest"};
        else if ((slot === "dawn" || slot === "morning") && openAt("diner") && !used.diner) it = {place: "diner", why: "吃早饭", kind: "meal"};
        else if (slot === "evening" && openAt("diner")) it = {place: "diner", why: "吃晚饭", kind: "meal"};
        else {
          let friend = null;
          for (const [id, r] of Object.entries(st.rel)) { const p = npcPlace(st, D, id, i); if (p && openAt(p) && (!friend || r.a > friend.a)) friend = {a: r.a, place: p, id}; }
          it = friend ? {place: friend.place, why: `找${D.names[friend.id] || friend.id}`, kind: "social"} : {place: "apartment", why: "在家歇着", kind: "home"};
        }
      }
      used[it.place] = (used[it.place] || 0) + 1;
      items.push({slot, ...it});
    }
    st.plan = {day: st.day, items};
    return st.plan;
  }
  function planNow(st, D) {
    const slot = slotOf(st, D).id;
    if (!st.plan || st.plan.day !== st.day || !st.plan.items.some(x => x.slot === slot)) makePlan(st, D);
    return st.plan.items.find(x => x.slot === slot);
  }

  // ---------------- 能做的事 ----------------
  // 每一项：{key, kind: "place"|"person"|"go"|"sub"|"job", id, label, rounds, cost, odds, target, place, mode}
  function options(st, D) {
    if (st.ended || st.pending) return [];
    const S = D.sim, P = S.places[st.place], slot = slotOf(st, D).id, out = [];
    const here = st.sub ? P.subs[st.sub] : P, present = presentAt(st, D);
    const job = S.jobs[st.role];
    const ok = (A, id) => !blockReason(st, D, id, present);
    if (!st.sub || !here.open || here.open.includes(slot)) for (const id of here.actions || []) {
      const A = S.actions[id];
      if (!A || !ok(A, id)) continue;
      if (id === "go_sub") { for (const [sid, sub] of Object.entries(P.subs || {})) if (!sub.open || sub.open.includes(slot)) out.push({key: "sub:" + sid, kind: "sub", id, sub: sid, label: `去${sub.label}`, rounds: 0}); continue; }
      out.push({key: "place:" + id, kind: "place", id, label: A.label, rounds: roundsOf(st, D, A), cost: A.cost || 0, odds: A.check ? checkOdds(st, D, A.check, {risky: A.risky}) : null, risky: !!A.risky});
    }
    if (!st.fired && (!st.sub || here.seat || here.view) && job.place === st.place && job.slot === slot && !st.jobDone[st.day])
      out.push({key: "job", kind: "job", id: "work", label: job.label, rounds: roundsLeft(st, D), odds: checkOdds(st, D, {skill: "job"})});
    for (const t of present) for (const id of ["chat", "ask", "gift", "flatter"]) {
      const A = S.actions[id];
      if (A.cost && st.money < A.cost) continue;
      out.push({key: `person:${id}:${t}`, kind: "person", id, target: t, label: `${A.label}（${D.names[t]}）`, rounds: 1, cost: A.cost || 0,
        odds: A.check ? checkOdds(st, D, A.check, {target: t}) : null});
    }
    for (const [pid, Q] of Object.entries(S.places)) {
      if (pid === st.place || !isOpen(st, D, pid)) continue;
      const same = Q.district === P.district;
      for (const [mid, M] of Object.entries(S.travel)) {
        if (same && mid !== "walk") continue;
        if (M.not_slots && M.not_slots.includes(slot)) continue;
        if (st.money < M.cost) continue;
        out.push({key: `go:${pid}:${mid}`, kind: "go", id: "go", place: pid, mode: mid, label: `${same ? "走到" : M.label + "去"}${D.world_places[pid]}`, rounds: same ? 0 : 1, cost: same ? 0 : M.cost});
      }
    }
    return out;
  }
  // 这个动作此刻为什么做不了；能做时返回空字符串
  function blockReason(st, D, id, present = presentAt(st, D)) {
    const S = D.sim, A = S.actions[id], P = S.places[st.place], slot = slotOf(st, D).id;
    if (!A) return "没有这个动作";
    if (A.slots && !A.slots.includes(slot)) return `要到${A.slots.map(x => S.slots.find(y => y.id === x).label).join("或")}才能做`;
    if (A.cost && st.money < A.cost) return "钱不够";
    if (A.needs_people && !present.length && !P.public) return "这里没有人";
    const rq = A.requires || {};
    if (rq.role && rq.role !== st.role) return "你的身份做不了";
    if (rq.present && !present.includes(rq.present)) return `${D.names[rq.present] || rq.present}不在`;
    if (rq.clues && st.clues.length < rq.clues) return `至少要有 ${rq.clues} 条线索`;
    if (A.once_per_slot && (st.onceSlot || {})[id] === st.day + ":" + slot) return "这个时段已经做过了";
    if (id === "sleep" && !(slot === "late" || (slot === "night" && st.round >= 1) || st.energy < 30)) return "还不困：要到夜里，或者很累的时候";
    return "";
  }
  function roundsOf(st, D, A) {
    if (A.rounds === "until_dawn") return Infinity;
    if (A.rounds === "slot_rest") return roundsLeft(st, D);
    return A.rounds;
  }

  // ---------------- 执行一个动作 ----------------
  function act(st, D, opt, who = st.control) {
    if (st.ended || st.pending) return [];
    const S = D.sim, before = st.log.length, slot = slotOf(st, D).id;
    if (who === "player") { const k = opt.kind === "go" ? "go:" + opt.place : opt.id; st.prefs.actions[k] = (st.prefs.actions[k] || 0) + 1; }
    st.recent = [...st.recent.slice(-5), opt.key];
    st.dayCount = st.dayCount || {}; st.dayCount[opt.key] = (st.dayCount[opt.key] || 0) + 1;
    const ctx = {opt, who, delta: {}};
    if (opt.kind === "go") {
      const M = S.travel[opt.mode], same = opt.rounds === 0;
      if (!same) applyEffects(st, D, {money: -M.cost, energy: M.energy}, ctx.delta);
      const from = st.place;
      st.placeLog = [...st.placeLog.slice(-5), {place: from, tick: st.tick}];
      st.place = opt.place; st.sub = null;
      if (!st.todayPlaces.includes(opt.place)) st.todayPlaces.push(opt.place);
      log(st, D, {kind: "move", action: "go", text: same ? `你走到${D.world_places[opt.place]}。` : `你${S.travel[opt.mode].label}从${D.world_places[from]}去${D.world_places[opt.place]}。`,
        importance: "daily", delta: ctx.delta, who});
      if (!same) advance(st, D, 1);
      if (Story) Story.onEnter(st, D);
      return st.log.slice(before);
    }
    if (opt.kind === "sub") {
      st.sub = opt.sub;
      log(st, D, {kind: "move", action: "go_sub", text: `你去了${S.places[st.place].subs[opt.sub].label}。`, importance: "daily", who});
      if (Story) Story.onEnter(st, D);
      return st.log.slice(before);
    }
    if (opt.id === "leave_sub") {
      st.sub = null;
      log(st, D, {kind: "move", action: "leave_sub", text: `你回到${D.world_places[st.place]}。`, importance: "daily", who});
      return st.log.slice(before);
    }
    const A = opt.kind === "job" ? {label: S.jobs[st.role].label, check: {skill: "job"}} : S.actions[opt.id];
    let res = null;
    // 故事卡可以接管这个动作（比如在后巷"搜查"会触发"后巷的耳坠"）：卡自己决定检定和后果
    const card = Story ? Story.cardForAction(st, D, opt) : null;
    if (!card && A.check) res = roll(st, D, checkOdds(st, D, A.check, {target: opt.target, risky: A.risky}));
    if (A.cost) applyEffects(st, D, {money: -A.cost}, ctx.delta);
    if (opt.kind === "job") workShift(st, D, res, ctx);
    else if (!card) resolveAction(st, D, opt, A, res, ctx);
    if (A.once_per_slot) (st.onceSlot = st.onceSlot || {})[opt.id] = st.day + ":" + slot;
    const xpUp = (!card && A.xp) ? gainXp(st, D, A.xp) : null;
    if (xpUp) (ctx.delta.levelUp = ctx.delta.levelUp || []).push(xpUp);
    if (!card && opt.kind !== "job") log(st, D, {kind: "action", action: opt.id, target: opt.target, outcome: res && res.outcome, odds: res && res.p,
      text: describe(st, D, opt, res, ctx), importance: A.importance || "normal", delta: ctx.delta, who});
    if (card) Story.play(st, D, card, {opt, who});
    else if (Story) Story.afterAction(st, D, opt, res);
    // 动作占的回合
    const n = roundsOf(st, D, A);
    if (n === Infinity) { while (st.slot < S.slots.length - 1) { st.round = 0; st.slot++; } newDay(st, D, true); }
    else if (n > 0 && !st.pending) advance(st, D, n);
    else if (n > 0) st.pendingAdvance = n;
    if (!st.pending && Story) Story.onTick(st, D);
    return st.log.slice(before);
  }

  function resolveAction(st, D, opt, A, res, ctx) {
    const o = res ? res.outcome : "success";
    applyEffects(st, D, A.effects, ctx.delta);
    if (o === "fail" && A.fail) applyEffects(st, D, A.fail, ctx.delta);
    if (o === "partial" && A.partial) applyEffects(st, D, A.partial, ctx.delta);
    if (o === "success" && A.success && res) applyEffects(st, D, A.success, ctx.delta);
    if (opt.target) {
      const r = A.rel || (o === "fail" ? A.rel_fail : o !== "fail" ? A.rel_success : null);
      if (r) {
        // 热情的人聊天更讨喜
        const bonus = opt.id === "chat" ? Math.round(st.traits.warm * 2) : 0;
        applyEffects(st, D, {rel: {[opt.target]: {a: (r.a || 0) + bonus, t: r.t || 0}}}, ctx.delta);
      }
      if (opt.id === "ask" && o === "success") applyEffects(st, D, {rel: {[opt.target]: {t: 1}}}, ctx.delta);
    }
    if (opt.id === "sort_clues" && o !== "fail") applyEffects(st, D, {mood: 3}, ctx.delta);
  }
  function workShift(st, D, res, ctx) {
    const job = D.sim.jobs[st.role], o = res.outcome;
    const pay = round2(job.pay + (o === "success" ? job.tips : o === "partial" ? job.tips / 2 : 0) - (o === "fail" ? job.pay / 2 : 0));
    st.jobDone[st.day] = true;
    applyEffects(st, D, {money: pay, energy: -10, fame: o === "success" ? 2 : 0, mood: o === "fail" ? -6 : 3}, ctx.delta);
    if (o === "fail") st.warnings++;
    const up = gainXp(st, D, "job");
    if (up) (ctx.delta.levelUp = ctx.delta.levelUp || []).push(up);
    log(st, D, {kind: "action", action: "work", outcome: o, odds: res.p, text: describe(st, D, {id: "work", kind: "job"}, res, ctx), importance: "normal", delta: ctx.delta, who: ctx.who});
    if (Story) Story.onFlag(st, D, o === "fail" ? "work_fail" : "work_done");
  }

  // ---------------- 文字（M1 用模板；M4 换成 AI 演出的漫画） ----------------
  // 餐厅里给你端东西的人：梅在就是梅，不在就是夜班女招待
  const server = (st, D) => presentAt(st, D).includes("mae") ? "梅" : "夜班女招待";
  function describe(st, D, opt, res, ctx) {
    const o = res ? res.outcome : "success", P = D.world_places[st.place], n = opt.target ? D.names[opt.target] : "";
    const t = {
      sleep: "你回到床上，一觉睡到天亮。", rest: "你在床上躺了一会儿。", read_paper: "你翻了翻今天的报纸。",
      sort_clues: {success: "你把手上的线索摊在桌上，理出了一点头绪。", partial: "你把线索摆了又摆，好像有点眉目。", fail: "线索太乱，越理越糊涂。"},
      eat: st.place === "diner" ? `${server(st, D)}把一盘热腾腾的煎蛋培根和吐司端到你面前，你吃得很香。` : `你在${P}吃了点东西。`,
      order_coffee: `${server(st, D)}拎着咖啡壶过来，给你倒满一杯。`, order_pie: `${server(st, D)}切了一大块苹果派放到你面前，还温着。`,
      play_jukebox: "你往点唱机里投了一枚硬币，一首慢摇摆响了起来，有人跟着哼。",
      play_piano: {success: "你在钢琴前坐下弹了一曲，几桌客人停下来听，有人鼓掌。", partial: "你弹了一曲，磕磕绊绊，好在没人在意。", fail: "手指不听使唤，弹错了好几个音，你赶紧停下。"},
      sing_song: {success: "你站到麦克风前唱了一首，满场安静下来，唱完掌声四起，有人往台上扔了几枚硬币。", partial: "你唱了一首，台下有人跟着打拍子，也有人只顾聊天。", fail: "你一开口就跑了调，台下有人笑出了声。"},
      sit_edge: "你在舞台边缘坐下，晃着腿，看着台下的人来人往。", help_out: "你帮梅端盘子、擦桌子，她偷偷多塞给你一块派。",
      gossip: {success: "你和熟客们聊了一圈，听到不少闲话。", partial: "大家聊得热闹，可没什么有用的。", fail: "你一开口，大家就换了话题。"},
      eavesdrop: {success: "你装作若无其事，把隔壁的对话听了个大概。", partial: "你只听到零星几句。", fail: "对方察觉到你在听，狠狠瞪了你一眼。"},
      rehearse: "你在空荡荡的舞台上把晚上的曲目过了一遍。", drink: "你点了一杯，靠在吧台边看人来人往。",
      observe: {success: "你留意着周围的每一个人，发现了一些细节。", partial: "你看了一圈，没什么特别。", fail: "你什么也没注意到。"},
      search: {success: "你趁没人注意翻了一遍，什么也没找到，但至少没被发现。", partial: "你刚翻了几下就听见脚步声，赶紧停手。", fail: "你正在翻找，被人撞了个正着。"},
      wait: "你站在原地等了一会儿。", dress_up: "你坐到桌前，对着小镜子仔细化了个妆。", make_coffee: "你在电炉上煮了一壶咖啡，屋里全是香味。",
      wash_up: "你在洗手池前洗了把脸，镜子里的人看起来精神了些。",
      look_out: {dawn: "天刚亮，楼下梅的餐厅已经亮了灯，送奶车慢慢开过。", morning: "街上人来人往，电车叮叮当当地开过去。", afternoon: "午后的太阳晒得街面发白，棕榈树一动不动。",
        evening: "傍晚的街灯一盏盏亮起来，餐厅门口排起了队。", night: "街上没什么人了，只有路灯和远处的霓虹。", late: "整条街都睡了，只有一盏路灯亮着。"}[slotOf(st, D).id], research: {success: "你在旧报堆里翻到几篇有意思的报道。", partial: "旧报太多，你只翻了一小部分。", fail: "灰尘呛得你直咳嗽，什么也没找到。"},
      socialize: "你在宾客间周旋，认识了几个人。", stroll: "你沿着码头慢慢走，海风很凉。",
      talk_pawnbroker: {success: "当铺老板打量着你，话比平时多了几句。", partial: "老板爱答不理。", fail: "老板挥挥手让你别挡着生意。"},
      chat: `你和${n}聊了一会儿。`, gift: `你送了${n}一点小礼物，对方很高兴。`,
      ask: {success: `${n}跟你聊了聊近况，没什么新消息。`, partial: `${n}说得含含糊糊。`, fail: `${n}岔开了话题。`},
      flatter: {success: `${n}被你夸得笑了起来。`, partial: `${n}礼貌地笑了笑。`, fail: `${n}觉得你有点假。`},
      work: {success: "你今天状态很好，表现得很出色。", partial: "工作平平稳稳地过去了。", fail: "今天出了岔子，老板脸色不太好。"},
    }[opt.id];
    let s = typeof t === "string" ? t : t ? t[o] : opt.label;
    if (opt.id === "work") s = `${D.sim.jobs[st.role].label}：${s}`;
    return s;
  }

  // ---------------- 自主决策：托管时她怎么选 ----------------
  function score(st, D, o, hints) {
    const S = D.sim, R = S.rules, A = o.kind === "go" ? null : S.actions[o.id] || {}, slot = slotOf(st, D).id;
    let s = 10;
    const tr = st.traits, needE = (100 - st.energy) / 100, needM = (100 - st.mood) / 100, needS = (100 - st.social) / 100;
    if (o.kind === "job") s += 45 + 20 * tr.diligent - (st.energy < 15 ? 20 : 0);
    else if (A) {
      if (A.need === "energy") s += 55 * needE * needE * (o.id === "sleep" ? (slot === "late" ? 2 : 1.3) : 1);
      if (A.need === "mood") s += 40 * needM * needM;
      if (A.need === "social") s += 40 * needS * needS;
      if (A.trait) s += 18 * (tr[A.trait] || 0);
      if (A.risky) s -= 6 * stars(st, D) + 10 * tr.cautious;
      if (o.odds != null) s += (o.odds - 50) / 10;
      if (o.cost) s -= o.cost > 0.5 && st.money < 5 ? 8 : 1;
      if (o.kind === "person" && o.target) s += 6 * tr.warm + (st.rel[o.target].a - 30) / 10;
    }
    if (o.kind === "go") s = goScore(st, D, o);
    if (o.kind === "sub") {
      s += 8 * tr.curious;
      // 往前看一步：坐下才能点餐，饿了就更想坐下
      const sub = (D.sim.places[st.place].subs || {})[o.sub] || {};
      let look = 0;
      for (const id of sub.actions || []) { const B = S.actions[id]; if (!B || blockReason(st, D, id)) continue;
        if (B.need === "energy") look = Math.max(look, 50 * needE * needE); if (B.need === "mood") look = Math.max(look, 35 * needM * needM);
        if (B.trait) look = Math.max(look, 10 * (tr[B.trait] || 0)); }
      s += look;
    }
    // 像你：接管时常选的动作
    const pref = st.prefs.actions[o.kind === "go" ? "go:" + o.place : o.id] || 0, tot = Object.values(st.prefs.actions).reduce((a, b) => a + b, 0);
    if (tot) s += 20 * pref / tot;
    // 任务牵引：同一个选项只取最强的一条提示，不叠加
    let pull = 0;
    for (const h of hints) if (matchHint(st, D, o, h)) pull = Math.max(pull, h.weight);
    s += pull;
    // 新鲜感：最近做过几次就扣几次分，免得反复做同一件事
    s -= 10 * st.recent.slice(-4).filter(k => k === o.key).length;
    // 同一天里对同一个人反复打听、反复做同一件事，越往后越没意思
    const n = (st.dayCount || {})[o.key] || 0;
    if (o.kind === "person") s -= (o.id === "ask" ? 16 : 10) * n;
    else if (o.kind === "place" && A && A.importance !== "daily") s -= 6 * n;
    // 刚到一个地方，先待一会儿再走
    const last = st.recent[st.recent.length - 1] || "";
    if (o.kind === "go" && (last.startsWith("go:") || last.startsWith("sub:")) && !(o.place === "apartment" && (slot === "late" || st.energy < 25))) s -= 20;
    // 今天的打算：打算来吃饭的话，坐下、点餐
    const planHere = planNow(st, D);
    if (planHere && planHere.kind === "meal" && st.place === planHere.place) {
      if (o.kind === "sub") s += 15;
      if (A && A.need && /^(eat|order_)/.test(o.id)) s += 22;
    }
    if (o.kind === "go") {
      const plan = planNow(st, D), S2 = D.sim.slots, last = st.round === S2[st.slot].rounds - 1;
      const next = last && st.slot + 1 < S2.length ? st.plan.items.find(x => x.slot === S2[st.slot + 1].id) : null;
      if (plan && o.place === plan.place) s += 24;
      else if (plan && st.place === plan.place && !st.sub) s -= 12;
      if (next && o.place === next.place) s += 14;
    }
    // 刚离开的地方不急着回去，避免来回跑
    if (o.kind === "go" && st.placeLog.some(x => x.place === o.place && st.tick - x.tick <= 3)) s -= 18;
    return s;
  }
  function matchHint(st, D, o, h) {
    if (o.kind === "go") {
      // 去某地：那里要开门；提示里有人的话，那个人此刻要在那里
      if (!h.place || o.place !== h.place) return false;
      if (h.target && npcPlace(st, D, h.target) !== o.place) return false;
      return true;
    }
    if (h.place && h.place !== st.place) return false;
    if (h.sub !== undefined && o.kind === "sub") return o.sub === h.sub;
    if (h.sub && h.sub !== st.sub) return false;
    if (h.action && h.action !== o.id) return false;
    if (h.target && h.target !== o.target) return false;
    return !!(h.action || h.target);
  }
  // 去某个地方值不值：到那里最想做的事 + 有没有想见的人 + 任务牵引 − 路上的花费；同区域的地点几乎不花代价
  function goScore(st, D, o) {
    const S = D.sim, Q = S.places[o.place], slot = slotOf(st, D).id, tr = st.traits;
    let best = 0;
    for (const id of Q.actions) { const A = S.actions[id]; if (!A || (A.slots && !A.slots.includes(slot))) continue;
      let v = 10; if (A.need === "energy") v += 50 * Math.pow((100 - st.energy) / 100, 2); if (A.need === "mood") v += 35 * Math.pow((100 - st.mood) / 100, 2);
      if (A.need === "social") v += 35 * Math.pow((100 - st.social) / 100, 2); if (A.trait) v += 18 * (tr[A.trait] || 0); best = Math.max(best, v); }
    const job = S.jobs[st.role];
    if (!st.fired && job.place === o.place && !st.jobDone[st.day]) {
      const idx = S.slots.findIndex(x => x.id === job.slot);
      if (idx === st.slot) best = Math.max(best, 70 + 20 * tr.diligent);
      else if (idx === st.slot + 1 && st.round === S.slots[st.slot].rounds - 1) best = Math.max(best, 45);
    }
    if (o.place === "apartment" && (slot === "late" || st.energy < 25)) best = Math.max(best, 40 + (slot === "late" ? 25 : 0));
    const people = Object.keys(S.npcs).filter(id => npcPlace(st, D, id) === o.place);
    best += people.length * (4 + 6 * tr.warm) * ((100 - st.social) / 100 + 0.3);
    if (!st.todayPlaces.includes(o.place)) best += 4 * tr.curious;
    const M = S.travel[o.mode];
    best -= o.rounds ? 6 + M.cost * (st.money < 3 ? 20 : 6) + (M.energy ? -M.energy * (st.energy < 40 ? 1.5 : 0.5) : 0) : 0;
    if (o.mode === "taxi" && st.money < 6) best -= 10;
    return best;
  }
  // 她这一步想做什么（不执行）。返回 null 表示没有可做的事
  function decide(st, D) {
    if (st.ended || st.pending) return null;
    let opts = options(st, D);
    // 同一回合里连续不占时间的移动最多两次，避免来回走
    if ((st.zeroMoves || 0) >= 2) opts = opts.filter(o => o.rounds !== 0);
    if (!opts.length) return null;
    const hints = Story ? Story.hints(st, D) : [];
    // 去同一个地方的几种走法只留最划算的一种，再加随机量；否则"出门"的候选太多，总能抽到一个高分
    const best = {};
    for (const o of opts) {
      const s = score(st, D, o, hints), k = o.kind === "go" ? "go:" + o.place : o.key;
      if (!best[k] || s > best[k].s) best[k] = {o, s};
    }
    const scored = Object.values(best).map(x => ({o: x.o, s: x.s + rngNext(st) * 10})).sort((a, b) => b.s - a.s);
    st.lastScores = scored.slice(0, 5).map(x => ({label: x.o.label, s: Math.round(x.s)}));
    return scored[0].o;
  }
  function actAuto(st, D, pick) {
    st.zeroMoves = pick.rounds === 0 ? (st.zeroMoves || 0) + 1 : 0;
    return act(st, D, pick, "auto");
  }
  function auto(st, D) {
    if (st.ended) return [];
    if (st.pending) { if (Story) return Story.autoChoose(st, D); return []; }
    const pick = decide(st, D);
    if (!pick) { advance(st, D, 1); return []; }
    return actAuto(st, D, pick);
  }
  function runUntil(st, D, stop) {
    let guard = 0;
    while (!st.ended && guard++ < 400) {
      if (st.pending && st.decisionMode !== "auto" && Story && !Story.canAutoChoose(st, D)) break;
      auto(st, D);
      if (stop(st)) break;
    }
  }

  // ---------------- 日志 ----------------
  function log(st, D, e) {
    const slot = D.sim.slots[Math.min(st.slot, D.sim.slots.length - 1)];
    st.log.push({n: ++st.seq, day: st.day, slot: slot.id, slotLabel: slot.label, round: st.round, place: st.place, sub: st.sub, present: st.slot < D.sim.slots.length ? presentAt(st, D) : [], ...e});
    if (st.log.length > 3000) st.log.splice(0, st.log.length - 3000);
  }

  // 把几份数据拼成内核要的样子：模拟规则、地点名、人物名、故事卡、任务、物品和线索
  function makeData(sim, world, story) {
    const names = {user: "你"};
    for (const r of world.residents) names[r.id] = r.name;
    return {sim, world, world_places: Object.fromEntries(world.places.map(p => [p.id, p.label])), names,
      cards: story.cards || [], quests: story.quests || [], items: story.items || {}};
  }

  const Sim = {makeData, newGame, options, act, blockReason, decide, actAuto, makePlan, planNow, auto, runUntil, advance, checkOdds, roll, applyEffects, npcPlace, presentAt, isOpen, stars, log, rngNext, gainXp, slotOf, roundsLeft};
  root.Sim = Sim;
  if (typeof module !== "undefined") module.exports = Sim;
})(typeof window !== "undefined" ? window : globalThis);
