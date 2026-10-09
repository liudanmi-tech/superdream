"use strict";
// ================= 《回声 1937》第二版：故事卡引擎（见 docs/sim-design.md 第 9–11 节） =================
// 故事卡 = 触发条件 + 要点 + 检定 + 选项 + 后果。模拟内核每走一步就问这里：有没有卡该触发了。
// 卡的四种触发方式：
//   action：做某个动作时由卡接管（when.action），比如在后巷"搜查"触发"后巷的耳坠"；
//   after：某个动作做完、结果符合时（when.after + when.outcome）；
//   enter：走进某个地点时（when.on = "enter"）；
//   tick：每一步结束时检查（其余的卡，比如在餐厅遇到梅、到点发生的世界事件）。
(function (root) {
  const SimRef = () => root.Sim || (typeof require === "function" ? require("./sim.js") : null);
  // 后果可以按检定结果分开写（default/success/partial/fail），也可以直接写一份
  const OUTCOMES = ["default", "success", "partial", "fail"];
  const pickFx = (fx, outcome) => !fx ? null : OUTCOMES.some(k => k in fx) ? (fx[outcome] || fx.default || null) : fx;
  const TRIGGERS = c => c.when && c.when.action ? "action" : c.when && c.when.after ? "after" : c.when && c.when.on === "enter" ? "enter" : "tick";

  function init(st, D) {
    for (const q of D.quests || []) if (q.start === "auto") startQuest(st, D, q.id, true);
  }

  // ---------------- 条件 ----------------
  function cmp(v, c) {
    if (c === null || c === undefined) return true;
    if (typeof c !== "object") return v === c;
    if (Array.isArray(c)) return v >= c[0] && v <= c[1];
    return (c.gte === undefined || v >= c.gte) && (c.lte === undefined || v <= c.lte) && (c.gt === undefined || v > c.gt) && (c.lt === undefined || v < c.lt) && (c.eq === undefined || v === c.eq);
  }
  const asList = v => v === undefined ? null : Array.isArray(v) ? v : [v];
  function stat(st, D, k) {
    const Sim = SimRef();
    if (k === "heat_stars") return Sim.stars(st, D);
    if (k === "clue_count") return st.clues.length;
    return st[k];
  }
  function cond(st, D, c, ctx = {}) {
    const w = c.when || {}, Sim = SimRef(), slot = D.sim.slots[Math.min(st.slot, D.sim.slots.length - 1)].id;
    if (c.locked && !st.cards.unlocked[c.id]) return false;
    const fired = st.cards.fired[c.id] || 0;
    if (c.once && fired) return false;
    if (c.once_on && st.cards.done && st.cards.done[c.id]) return false;
    if (c.cooldown && st.cards.lastAt[c.id] !== undefined && st.tick - st.cards.lastAt[c.id] < c.cooldown) return false;
    if (w.day !== undefined && !cmp(st.day, w.day)) return false;
    if (w.slot && !asList(w.slot).includes(slot)) return false;
    if (w.place && !asList(w.place).includes(st.place)) return false;
    if (w.sub !== undefined && (w.sub || null) !== (st.sub || null)) return false;
    if (w.role && !asList(w.role).includes(st.role)) return false;
    if (w.present) { const here = Sim.presentAt(st, D); if (!asList(w.present).every(id => here.includes(id))) return false; }
    if (w.flags && !asList(w.flags).every(f => st.flags[f])) return false;
    if (w.not_flags && asList(w.not_flags).some(f => st.flags[f])) return false;
    if (w.items && !asList(w.items).every(i => st.items.includes(i))) return false;
    if (w.not_items && asList(w.not_items).some(i => st.items.includes(i))) return false;
    if (w.clues && !asList(w.clues).every(i => st.clues.includes(i))) return false;
    if (w.not_clues && asList(w.not_clues).some(i => st.clues.includes(i))) return false;
    if (w.stats) for (const [k, v] of Object.entries(w.stats)) if (!cmp(stat(st, D, k), v)) return false;
    if (w.rel) for (const [id, r] of Object.entries(w.rel)) { if (!st.rel[id]) return false; if (!cmp(st.rel[id].a, r.a) || !cmp(st.rel[id].t, r.t)) return false; }
    if (w.quest) for (const [qid, s] of Object.entries(w.quest)) { const q = st.quests[qid]; if ((q ? q.status : "none") !== s) return false; }
    if (w.objective) for (const [qid, oid, done] of w.objective) { const q = st.quests[qid]; if (!q || !!q.done[oid] !== !!done) return false; }
    if (w.action && !asList(w.action).includes(ctx.action)) return false;
    if (w.after && !asList(w.after).includes(ctx.action)) return false;
    if (w.outcome && !asList(w.outcome).includes(ctx.outcome)) return false;
    if (w.target && !asList(w.target).includes(ctx.target)) return false;
    return true;
  }
  // 满足条件的卡按优先级排；带 chance 的卡在真正要触发时才掷骰
  function candidates(st, D, kind, ctx) {
    return (D.cards || []).filter(c => TRIGGERS(c) === kind && cond(st, D, c, ctx)).sort((a, b) => (b.priority || 50) - (a.priority || 50));
  }
  function pickCard(st, D, list) {
    const Sim = SimRef();
    for (const c of list) if (!c.when.chance || Sim.rngNext(st) < c.when.chance) return c;
    return null;
  }

  // ---------------- 触发 ----------------
  function cardForAction(st, D, opt) { return pickCard(st, D, candidates(st, D, "action", {action: opt.id, target: opt.target})); }
  function afterAction(st, D, opt, res) {
    const c = pickCard(st, D, candidates(st, D, "after", {action: opt.id, target: opt.target, outcome: res ? res.outcome : "success"}));
    if (c) play(st, D, c, {opt});
  }
  function onEnter(st, D) {
    const c = pickCard(st, D, candidates(st, D, "enter", {}));
    if (c) play(st, D, c, {});
  }
  // 每一步结束时：最多触发 1 张主线/支线卡和 1 张其他卡，避免一个回合塞太多事
  function onTick(st, D) {
    if (st.pending || st.ended) return;
    const list = candidates(st, D, "tick", {});
    const big = pickCard(st, D, list.filter(c => ["main", "side", "world"].includes(c.type)));
    if (big) play(st, D, big, {});
    if (st.pending) return;
    const small = pickCard(st, D, candidates(st, D, "tick", {}).filter(c => !["main", "side", "world"].includes(c.type)));
    if (small) play(st, D, small, {});
  }
  // 世界不等你：到点的事件主角不在场，就按 missed 记下来（之后从别人嘴里听说）
  function onSlotEnd(st, D) {
    const slot = D.sim.slots[st.slot].id;
    for (const c of D.cards || []) {
      if (!c.missed || st.cards.fired[c.id] || st.cards.missed && st.cards.missed[c.id]) continue;
      const w = c.when || {};
      if (w.day !== undefined && !cmp(st.day, w.day)) continue;
      if (asList(w.slot) && asList(w.slot)[asList(w.slot).length - 1] !== slot) continue;
      (st.cards.missed = st.cards.missed || {})[c.id] = st.day;
      const delta = applyCardEffects(st, D, c.missed.effects, {});
      SimRef().log(st, D, {kind: "card", card: c.id, title: c.title + "（错过了）", text: c.missed.beats_zh || `你错过了：${c.title}。`, importance: "normal", delta, missed: true});
    }
  }
  function onNewDay(st, D) { onTick(st, D); }
  function onFlag(st, D, f) { st.flags["last:" + f] = st.day; }

  // ---------------- 播放一张卡 ----------------
  function play(st, D, c, ctx = {}) {
    const Sim = SimRef();
    st.cards.fired[c.id] = (st.cards.fired[c.id] || 0) + 1;
    st.cards.lastAt[c.id] = st.tick;
    let outcome = "default", res = null;
    if (c.check) {
      res = Sim.roll(st, D, Sim.checkOdds(st, D, c.check, {target: ctx.opt && ctx.opt.target, risky: c.check.risky}));
      outcome = res.outcome;
      if (c.check.xp !== false) Sim.gainXp(st, D, c.check.skill === "job" ? "job" : c.check.skill);
    }
    if (c.once_on && c.once_on.includes(outcome)) (st.cards.done = st.cards.done || {})[c.id] = true;
    const delta = applyCardEffects(st, D, pickFx(c.effects, outcome), {});
    const beats = c.beats_zh ? (typeof c.beats_zh === "string" ? c.beats_zh : c.beats_zh[outcome] || c.beats_zh.default) : c.title;
    Sim.log(st, D, {kind: "card", card: c.id, title: c.title, type: c.type, text: beats, outcome: res ? outcome : null, odds: res ? res.p : null,
      importance: (c.render && c.render.importance) || "major", delta, who: ctx.who, cast: c.render && c.render.cast});
    if (c.choices && c.choices.length && !st.ended) {
      st.pending = {card: c.id, title: c.title, question: c.question || c.title, major: !!c.major,
        choices: c.choices.map(ch => ({id: ch.id, label: ch.label, intuition: ch.intuition || 0.5}))};
    }
    return outcome;
  }

  // ---------------- 后果 ----------------
  function applyCardEffects(st, D, fx, delta) {
    if (!fx) return delta;
    const Sim = SimRef();
    Sim.applyEffects(st, D, fx, delta);
    const lbl = id => (D.items[id] || {}).label || id;
    for (const it of fx.items || []) {
      if (it[0] === "-") { st.items = st.items.filter(x => x !== it.slice(1)); (delta.lost = delta.lost || []).push(lbl(it.slice(1))); }
      else if (!st.items.includes(it)) { st.items.push(it); (delta.got = delta.got || []).push(lbl(it)); }
    }
    for (const cl of fx.clues || []) if (!st.clues.includes(cl)) { st.clues.push(cl); (delta.clues = delta.clues || []).push(lbl(cl)); }
    for (const f of fx.flags || []) st.flags[f] = true;
    for (const f of fx.unflags || []) delete st.flags[f];
    for (const id of fx.unlock || []) st.cards.unlocked[id] = true;
    for (const id of fx.lock || []) delete st.cards.unlocked[id];
    if (fx.npc) for (const o of fx.npc) st.flags[`npc:${o.id}:${o.day || st.day}:${o.slot}`] = o.place;
    if (fx.move) { st.place = fx.move; st.sub = null; }
    if (fx.fire) { st.fired = true; (delta.notes = delta.notes || []).push("你被解雇了"); }
    if (fx.quest) {
      for (const q of fx.quest.start || []) if (startQuest(st, D, q)) (delta.notes = delta.notes || []).push(`新任务：${questDef(D, q).title}`);
      for (const [q, o] of fx.quest.obj || []) { const r = completeObjective(st, D, q, o); if (r) (delta.notes = delta.notes || []).push(r); }
      for (const q of fx.quest.fail || []) if (st.quests[q] && st.quests[q].status === "active") { st.quests[q].status = "failed"; (delta.notes = delta.notes || []).push(`任务失败：${questDef(D, q).title}`); }
    }
    if (fx.ending) st.ended = fx.ending;
    return delta;
  }

  // ---------------- 任务 ----------------
  const questDef = (D, id) => (D.quests || []).find(q => q.id === id) || {id, title: id, objectives: []};
  function startQuest(st, D, id, silent) {
    if (st.quests[id]) return false;
    st.quests[id] = {status: "active", done: {}, since: st.day};
    return !silent;
  }
  function completeObjective(st, D, qid, oid) {
    if (!st.quests[qid]) startQuest(st, D, qid, true);
    const q = st.quests[qid], def = questDef(D, qid);
    if (q.done[oid]) return null;
    q.done[oid] = st.day;
    const ob = def.objectives.find(o => o.id === oid);
    let note = `完成目标：${ob ? ob.label : oid}`;
    if (def.objectives.length && def.objectives.every(o => q.done[o.id]) && q.status === "active") {
      q.status = "done"; note += `；任务完成：${def.title}`;
      if (def.on_done) applyCardEffects(st, D, def.on_done, {});
    }
    return note;
  }
  // 自主决策的"任务牵引"：进行中的任务里还没完成的目标，以及已解锁、带提示的卡
  function hints(st, D) {
    const slot = D.sim.slots[Math.min(st.slot, D.sim.slots.length - 1)].id, out = [];
    const urgency = 1 + st.day / 7;
    for (const def of D.quests || []) {
      const q = st.quests[def.id];
      if (!q || q.status !== "active") continue;
      for (const ob of def.objectives) if (!q.done[ob.id]) for (const h of ob.hints || []) {
        if (h.slot && !asList(h.slot).includes(slot)) continue;
        if (h.role && !asList(h.role).includes(st.role)) continue;
        out.push({...h, weight: (h.weight || 12) * urgency * (def.type === "main" ? 1.2 : 1)});
      }
    }
    for (const c of D.cards || []) if (c.hint && (!c.locked || st.cards.unlocked[c.id]) && !(c.once && st.cards.fired[c.id]) && !(st.cards.done && st.cards.done[c.id])) {
      if (c.hint.slot && !asList(c.hint.slot).includes(slot)) continue;
      out.push({...c.hint, weight: c.hint.weight || 10});
    }
    return out;
  }

  // ---------------- 决策点 ----------------
  function canAutoChoose(st, D) {
    if (!st.pending) return true;
    if (st.control === "player") return false;
    return st.decisionMode === "auto" || (st.decisionMode === "major" && !st.pending.major);
  }
  // 分身凭直觉选：编剧给的直觉权重 × 性格加成 × 你过去选择的风格
  function autoChoose(st, D) {
    if (!st.pending || !canAutoChoose(st, D)) return [];
    const c = (D.cards || []).find(x => x.id === st.pending.card), Sim = SimRef();
    const styles = st.prefs.styles, tot = Object.values(styles).reduce((a, b) => a + b, 0);
    const w = c.choices.map(ch => {
      let v = ch.intuition || 0.5;
      for (const [t, k] of Object.entries(ch.traits || {})) v *= 1 + k * ((st.traits[t] || 0.5) - 0.5) * 2;
      if (ch.style && tot) v *= 1 + 0.6 * (styles[ch.style] || 0) / tot;
      return Math.max(0.01, v);
    });
    let r = Sim.rngNext(st) * w.reduce((a, b) => a + b, 0), pick = c.choices[0];
    for (const [i, ch] of c.choices.entries()) { if (r < w[i]) { pick = ch; break; } r -= w[i]; }
    return choose(st, D, pick.id, "auto");
  }
  function choose(st, D, choiceId, who = "player") {
    const Sim = SimRef();
    if (!st.pending) return [];
    const before = st.log.length, c = (D.cards || []).find(x => x.id === st.pending.card), ch = c.choices.find(x => x.id === choiceId);
    if (who === "player" && ch.style) st.prefs.styles[ch.style] = (st.prefs.styles[ch.style] || 0) + 1;
    st.pending = null;
    let outcome = "default", res = null;
    if (ch.check) { res = Sim.roll(st, D, Sim.checkOdds(st, D, ch.check, {target: ch.check.target})); outcome = res.outcome; }
    const delta = applyCardEffects(st, D, pickFx(ch.effects, outcome), {});
    const beats = ch.beats_zh ? (typeof ch.beats_zh === "string" ? ch.beats_zh : ch.beats_zh[outcome] || ch.beats_zh.default) : "";
    Sim.log(st, D, {kind: "choice", card: c.id, title: c.question || c.title, choice: ch.id, choiceLabel: ch.label, text: `${who === "player" ? "你决定" : "分身凭直觉选了"}：${ch.label}。${beats}`,
      outcome: res ? outcome : null, odds: res ? res.p : null, importance: "major", delta, who});
    if (st.pendingAdvance) { const n = st.pendingAdvance; st.pendingAdvance = 0; Sim.advance(st, D, n); }
    onTick(st, D);
    return st.log.slice(before);
  }

  const Story = {init, cardForAction, afterAction, onEnter, onTick, onSlotEnd, onNewDay, onFlag, play, hints, autoChoose, canAutoChoose, choose, cond, questDef, applyCardEffects};
  root.Story = Story;
  if (typeof module !== "undefined") module.exports = Story;
})(typeof window !== "undefined" ? window : globalThis);
