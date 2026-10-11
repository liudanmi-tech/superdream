"use strict";
// ================= 《回声 1937》人物底层系统 · 第二步：关键时刻和反思交给大模型 =================
// agents.js 遇到关键时刻会停下来（st.ag.wait），这里把人物的本性、此刻、关系、记忆和规则算出的候选拼成提示词，
// 交给 OpenRouter 上的剧情模型，以第一人称决定做哪个、怎么做、说什么、心里想什么，再交回 Agents.answer。
// 停不下来的（她在睡觉时）事后补台词（entry.perform）；反思排在 st.ag.reflQ 里，后台一个个做。
// Key 用漫画版设置里的 OpenRouter Key（echo1937.settings）；这一页自己的开关和模型存在 echo1937.simLLM。
// 花费只记在这一局（st.llm），不碰漫画版的花费。
(function (root) {
  const MODELS = {"anthropic/claude-sonnet-5.5": "Claude Sonnet 5.5", "anthropic/claude-haiku-5.5": "Claude Haiku 5.5", "anthropic/claude-opus-5.5": "Claude Opus 5.5"};
  const L = {MODELS};

  L.cfg = function () {
    let s = {}, mine = {};
    try { s = JSON.parse(localStorage.getItem("echo1937.settings") || "{}"); } catch (e) {}
    try { mine = JSON.parse(localStorage.getItem("echo1937.simLLM") || "{}"); } catch (e) {}
    return {key: s.key || "", mock: !!s.mock, on: mine.on !== false, model: mine.model || (MODELS[s.story] ? s.story : "anthropic/claude-sonnet-5.5")};
  };
  L.save = function (c) { try { localStorage.setItem("echo1937.simLLM", JSON.stringify({on: c.on, model: c.model})); } catch (e) {} };
  L.ready = c => c.on && (c.key || c.mock);

  // ---------------- 把本性说成人话 ----------------
  const HI = {open: "好奇、爱新鲜", dutiful: "自律、讲规矩", outgoing: "爱热闹、健谈", kind: "心软、体贴", neurotic: "敏感多疑、容易激动", conscience: "有底线", nerve: "胆大、敢冒险"};
  const LO = {open: "守旧", dutiful: "散漫", outgoing: "沉默寡言", kind: "冷硬、刻薄", neurotic: "沉得住气", conscience: "没什么底线", nerve: "胆小怕事"};
  const SIN = {pride: "傲慢", envy: "善妒", wrath: "易怒", sloth: "懒散", greed: "贪财", gluttony: "贪杯好吃", lust: "好色多情"};
  function natureText(P) {
    const n = P.nat, out = [];
    for (const k of Object.keys(HI)) { if (n[k] >= 65) out.push(HI[k]); else if (n[k] <= 35) out.push(LO[k]); }
    const sins = Object.keys(SIN).filter(k => n[k] >= 0.45).sort((a, b) => n[b] - n[a]).map(k => SIN[k]);
    return out.join("、") + (sins.length ? `；${sins.join("、")}` : "");
  }
  // 日志和记忆里主角写作「你」；提示词里「你」是这个角色自己，主角改称「她」
  const her = t => String(t).replace(/你/g, "她");
  const resident = (D, id) => (D.world.residents || []).find(r => r.id === id) || {};
  const ROLE = {singer: "新来的俱乐部歌手", makeup: "片厂新来的化妆师", reporter: "《晨星报》新来的记者"};
  function who(st, D, id) {
    if (id === "user") return `她（主角，${ROLE[st.role] || "新来的人"}，住在梅的餐厅楼上）`;
    const r = resident(D, id), P = st.ag.p[id];
    return `${D.names[id] || id}（${P.age} 岁，${r.role || ""}）`;
  }
  function relText(st, D, a, b) {
    const x = Agents.rel(st, a, b), bits = [];
    if (x.status) bits.push({lover: "恋人", engaged: "已订婚", married: "夫妻"}[x.status]);
    bits.push(`好感 ${Math.round(x.aff)}`, `信任 ${Math.round(x.trust)}`);
    for (const [k, l] of [["attr", "吸引"], ["love", "爱慕"], ["anger", "愤怒"], ["fear", "恐惧"], ["jealous", "嫉妒"], ["grudge", "记仇"], ["debt", "欠人情"]]) if (x[k] >= 5) bits.push(`${l} ${Math.round(x[k])}`);
    if (x.kin) bits.push("继母子");
    return bits.join("，");
  }
  function scene(st, D, id) {
    const P = st.ag.p[id], sl = D.sim.slots[Math.min(st.slot, D.sim.slots.length - 1)];
    const here = P.place ? Object.keys(st.ag.p).filter(q => q !== id && (q === "user" ? st.place === P.place : st.ag.p[q].status === "free" && st.ag.p[q].place === P.place)) : [];
    return `1937 年洛杉矶，第 ${st.day} 天 · ${sl.label}（${sl.hours}），${P.place ? D.world_places[P.place] : "家里"}。` +
      `在场：${here.length ? here.map(q => q === "user" ? "她（主角）" : D.names[q]).join("、") : "没有别人"}。` +
      `他此刻心情 ${Math.round(P.mood)}${P.drunk >= 0.2 ? `，有几分醉意（${P.drunk}）` : ""}${P.hurt ? "，身上有伤" : ""}，身上有 $${P.money.toFixed(0)}${P.has.gun ? "，带着枪" : ""}。`;
  }
  function selfBlock(st, D, id) {
    const P = st.ag.p[id], r = resident(D, id);
    return `【你是】${who(st, D, id)}\n本性：${natureText(P)}（MBTI ${P.mbti}）。\n说话方式：${r.speech || "—"}\n人生目标：${P.goal}；这周的打算：${P.week}`;
  }
  function memories(st, D, id, about, n) {
    const m = st.ag.p[id].mem, name = about ? (about === "user" ? "你" : D.names[about]) : null;
    const hit = name ? m.filter(x => x.text.includes(name)) : [];
    const pick = [...new Set([...hit.slice(-3), ...m.slice(-n)])].slice(-n);
    return pick.length ? pick.map(x => `- 第 ${x.d} 天${x.s}：${her(x.text)}`).join("\n") : "- （还没有什么值得记的）";
  }
  function secrets(st, D, id) {
    const list = st.ag.secrets.filter(s => !s.public && s.knowers.includes(id));
    return list.length ? list.map(s => `- ${her(s.text)}${s.about.includes(id) ? "（关于你自己，不能让人知道）" : ""}`).join("\n") : "- 没有";
  }

  const SYSTEM = `你在为一部 1937 年洛杉矶黑色电影风格的互动漫画扮演其中一个人物。规则引擎按这个人的本性、情绪和处境，算出了他此刻可能做的几件事和各自的概率。你要以这个人的身份决定做哪一件、怎么做、说了什么、心里怎么想。

要求：
- 只能从候选里选一项，或者选 0 表示想了想作罢。概率是规则按本性算出的参考：可以改选，但要像这个人。良知低的人不会突然变善良，胆小的人不会突然拼命，骄傲的人不轻易低头。不要把人物写得比他的本性更善良、更客气。
- 提示词里的「你」是你扮演的这个角色，「她」是主角（新来洛杉矶的年轻女人）。但你写的 how 里要把主角写成「你」（读者就是她），其他人用名字；line 是对谁说的就怎么称呼。
- 内容边界：暴力只写事前、影子和事后，不写血腥细节；亲密场面在亲密之前暗场；配角不会对主角动手、也不会当众羞辱她；孩子不会成为暴力或色情的对象。
- 用简体中文。how 是一两句第三人称的动作描写，以这个人物的名字开头（不超过 60 字）；line 是说出口的一句话（不超过 40 字，这件事不用说话就留空）；thought 是他心里的一句话（不超过 40 字）；memory 是他自己记下的一句第一人称（不超过 40 字）。
- 只输出一个 JSON 对象，不要别的文字：{"choice": 数字, "how": "...", "line": "...", "thought": "...", "memory": "..."}`;

  const REFLECT = `你在为一部 1937 年洛杉矶黑色电影风格的互动漫画扮演其中一个人物。现在是他独处、回想最近这些事的时候。以他的身份、按他的本性，写下他对自己和身边人的新看法，并决定接下来的打算。

要求：
- 看法要从记忆里的具体事情出发，两三句，第一人称，不超过 90 字。不要把人物写得比他的本性更宽容。
- rel：最多三个人，对每个人好感（aff）和信任（trust）的调整，各在 -15 到 15 之间；没有变化的人不要写。to 填名字（主角写「她」）。
- week：这周的打算，不超过 20 字。
- goal：人生目标要换才填，只能从给出的清单里选一个；不换就留空。
- 用简体中文，只输出一个 JSON 对象：{"view": "...", "rel": [{"to": "名字", "aff": 0, "trust": 0}], "week": "...", "goal": ""}`;

  // ---------------- 提示词 ----------------
  function decidePrompt(st, D, w) {
    const id = w.id, others = [...new Set(w.cands.map(c => c.b).filter(Boolean))];
    const rels = others.map(b => `- 对${b === "user" ? "她（主角）" : D.names[b]}：${relText(st, D, id, b)}`).join("\n");
    const cands = w.cands.map((c, i) => `${i + 1}. ${her(Agents.labelOf(D, c.bid, c.b))} — 规则概率 ${c.p}%${c.bid === w.bid && c.b === w.b ? "（规则抽中的是这一项）" : ""}`).join("\n");
    return `${selfBlock(st, D, id)}\n\n【此刻】${scene(st, D, id)}\n\n【你对相关的人】\n${rels || "- 无"}\n\n【你记得】\n${memories(st, D, id, w.b, 6)}\n\n【你握着的秘密】\n${secrets(st, D, id)}\n\n【候选】\n${cands}\n0. 想了想，作罢`;
  }
  function performPrompt(st, D, e) {
    const id = e.actor;
    return `${selfBlock(st, D, id)}\n\n【此刻】${scene(st, D, id)}\n\n${e.target ? `【你对${e.target === "user" ? "她（主角）" : D.names[e.target]}】${relText(st, D, id, e.target)}\n\n` : ""}【你记得】\n${memories(st, D, id, e.target, 5)}\n\n【这件事已经发生】${her(e.perform.rule)}\n\n【候选】\n1. ${her(Agents.labelOf(D, e.behavior, e.target))}（已经发生，choice 填 1，只写怎么做、说了什么、心里怎么想）`;
  }
  function reflectPrompt(st, D, q) {
    const id = q.id, P = st.ag.p[id], rels = [];
    for (const b of Object.keys(st.ag.p)) if (b !== id && st.ag.rel[id + ">" + b]) rels.push(`- 对${b === "user" ? "她（主角）" : D.names[b]}：${relText(st, D, id, b)}`);
    return `${selfBlock(st, D, id)}\n\n【为什么现在想】${her(q.why)}\n\n【最近的记忆】\n${P.mem.slice(-15).map(x => `- 第 ${x.d} 天${x.s}：${her(x.text)}`).join("\n") || "- 没有"}\n\n【你对别人的看法】\n${rels.join("\n") || "- 没有"}\n\n【可选的人生目标】${(D.agents.goals_pool || []).join("、")}`;
  }

  // ---------------- 调用 ----------------
  async function call(c, system, user, maxTokens) {
    const t0 = Date.now(), ctl = typeof AbortController !== "undefined" ? new AbortController() : null;
    const timer = ctl && setTimeout(() => ctl.abort(), 45000);
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST", signal: ctl && ctl.signal,
        headers: {"Authorization": "Bearer " + c.key, "Content-Type": "application/json", "X-Title": "echo1937"},
        body: JSON.stringify({model: c.model, max_tokens: maxTokens, usage: {include: true}, messages: [{role: "system", content: system}, {role: "user", content: user}]}),
      });
      const text = await res.text();
      if (res.status !== 200) throw new Error(res.status === 402 ? "OpenRouter 余额不足" : res.status === 401 ? "OpenRouter Key 不对" : `OpenRouter ${res.status}：${text.slice(0, 160)}`);
      const data = JSON.parse(text);
      if (data.error) throw new Error("OpenRouter 错误：" + JSON.stringify(data.error).slice(0, 160));
      const out = String(((data.choices || [])[0] || {}).message ? data.choices[0].message.content || "" : "");
      const i = out.indexOf("{"), j = out.lastIndexOf("}");
      if (i < 0 || j < i) throw new Error("模型没有按格式回答：" + out.slice(0, 80));
      return {json: JSON.parse(out.slice(i, j + 1)), ms: Date.now() - t0, cost: Number((data.usage || {}).cost || 0), model: MODELS[c.model] || c.model};
    } catch (e) {
      throw new Error(e.name === "AbortError" ? "等了 45 秒没有回答" : e.message === "Failed to fetch" ? "连不上 OpenRouter（确认代理或 VPN 开着）" : e.message);
    } finally { if (timer) clearTimeout(timer); }
  }
  function record(st, r, err) {
    const s = st.llm = st.llm || {calls: 0, cost: 0, ms: 0, fails: 0, err: ""};
    if (r) { s.calls++; s.cost = Math.round((s.cost + r.cost) * 10000) / 10000; s.ms += r.ms; s.err = ""; s.failRun = 0; }
    if (err) { s.fails++; s.err = err; s.failRun = (s.failRun || 0) + 1; }
  }
  const cut = (v, n) => String(v || "").replace(/\s+/g, " ").trim().slice(0, n);
  // 模拟模式（漫画版设置里勾了模拟）：不花钱，选规则抽中的那项
  function mockDecide(st, D, w) {
    const i = w.cands.findIndex(c => c.bid === w.bid && c.b === w.b);
    return {json: {choice: i + 1, how: "", line: "（模拟台词）", thought: "（模拟的想法）", memory: ""}, ms: 300, cost: 0, model: "模拟"};
  }

  // 关键时刻：返回给 Agents.answer 的对象
  L.decide = async function (st, D, c) {
    const w = st.ag.wait;
    try {
      const r = c.mock ? await new Promise(ok => setTimeout(() => ok(mockDecide(st, D, w)), 300)) : await call(c, SYSTEM, decidePrompt(st, D, w), 600);
      record(st, r);
      const j = r.json, n = Number.isInteger(+j.choice) ? +j.choice : -1;
      return {choice: n >= 0 && n <= w.cands.length ? n : w.cands.findIndex(x => x.bid === w.bid && x.b === w.b) + 1,
        how: cut(j.how, 90), line: cut(j.line, 60), thought: cut(j.thought, 60), memory: cut(j.memory, 60), model: r.model, ms: r.ms, cost: r.cost};
    } catch (e) { record(st, null, e.message); return {error: e.message}; }
  };
  // 已经按规则发生的事：补上怎么做、台词和想法（写回那条日志）
  L.perform = async function (st, D, c, e) {
    try {
      const r = c.mock ? mockDecide(st, D, {cands: [{}], bid: null}) : await call(c, SYSTEM, performPrompt(st, D, e), 500);
      record(st, r);
      const j = r.json;
      if (j.how) e.text = cut(j.how, 90);
      e.llm = {model: r.model, line: cut(j.line, 60), thought: cut(j.thought, 60), ms: r.ms, cost: r.cost, after: true};
    } catch (err) { record(st, null, err.message); e.llm = {error: err.message}; }
    e.perform = null;
  };
  L.reflect = async function (st, D, c, q) {
    try {
      const r = c.mock ? {json: {view: "（模拟的反思）这几天的事让我想了很多。", rel: [], week: "", goal: ""}, ms: 300, cost: 0, model: "模拟"} : await call(c, REFLECT, reflectPrompt(st, D, q), 600);
      record(st, r);
      const j = r.json;
      Agents.reflect(st, D, q.id, {view: cut(j.view, 140), rel: Array.isArray(j.rel) ? j.rel.slice(0, 3).map(x => ({...x, to: x.to === "她" || x.to === "主角" ? "user" : x.to})) : [], week: cut(j.week, 30), goal: cut(j.goal, 12),
        model: r.model, ms: r.ms, cost: r.cost});
    } catch (e) { record(st, null, e.message); Agents.reflect(st, D, q.id, {}); }
  };
  // 给页面和测试看提示词长什么样
  L.prompts = {decide: decidePrompt, perform: performPrompt, reflect: reflectPrompt, SYSTEM, REFLECT, natureText};

  root.AgentsLLM = L;
  if (typeof module !== "undefined") module.exports = L;
})(typeof window !== "undefined" ? window : globalThis);
