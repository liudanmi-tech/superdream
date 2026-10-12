"use strict";
// ================= 剧情实验室：热门短剧 → 提炼套路 → AI 重写 → 三个评审打分 =================
// 流程：① ReelShort 热门剧库（content/reelshort_top.json）→ ② 套路分析师提炼公共套路 →
// ③ 编剧按《剧情钩子手册》写一章（8 段）→ 原创性检查 + 三个互不相识的评审各自打分 →
// 三个都 ≥ 通过分（默认 90）且原创才算通过；否则编剧带着评审意见改写，最多改 N 轮。
// 每次调用都是全新的对话：评审看不到编剧的思路、看不到彼此的分数、也不记得上一轮。
// 模型走 OpenRouter，Key 用漫画版设置里的（echo1937.settings），本页设置存在 echo1937.storylab。
(function (root) {
  const H = root.HOOKS || {}, Lab = {};

  // ---------------- 设置 ----------------
  const AGENTS = {
    trope: {name: "套路分析师", def: "anthropic/claude-sonnet-5.5"},
    writer: {name: "编剧", def: "anthropic/claude-opus-5.5"},
    orig: {name: "原创性检查", def: "anthropic/claude-haiku-5.5"},
    j1: {name: "评审一 · 目标观众 Jess", def: "anthropic/claude-sonnet-5.5"},
    j2: {name: "评审二 · 短剧主编", def: "google/gemini-2.5-pro"},
    j3: {name: "评审三 · 互动叙事设计师", def: "openai/gpt-5"},
  };
  Lab.AGENTS = AGENTS;
  Lab.cfg = function () {
    let s = {}, mine = {};
    try { s = JSON.parse(localStorage.getItem("echo1937.settings") || "{}"); } catch (e) {}
    try { mine = JSON.parse(localStorage.getItem("echo1937.storylab") || "{}"); } catch (e) {}
    const models = {};
    for (const [k, a] of Object.entries(AGENTS)) models[k] = (mine.models || {})[k] || a.def;
    return {key: s.key || "", models, pass: mine.pass || 90, rounds: mine.rounds || 4, scope: mine.scope || 8};
  };
  Lab.save = function (c) {
    try { localStorage.setItem("echo1937.storylab", JSON.stringify({models: c.models, pass: c.pass, rounds: c.rounds, scope: c.scope})); } catch (e) {}
  };

  // ---------------- 调用 OpenRouter ----------------
  const JSON_RULE = "\n\n【JSON 格式要求】只输出一个合法的 JSON 对象。字符串里需要引号时一律用「」，绝对不要在字符串里用英文双引号 \"；字符串里不要换行。";
  Lab.spent = {calls: 0, cost: 0};
  // 会先思考再回答的模型（Gemini 2.5 Pro、GPT-5 等），思考也算在 max_tokens 里：给足上限，思考强度设成中等，思考内容不传回来
  async function call(c, model, system, user, maxTokens, signal) {
    if (!c.key) throw new Error("没有 OpenRouter Key：在漫画版（index.html）的设置里填，填好后刷新本页");
    const t0 = Date.now();
    let last = null;
    for (let attempt = 1; attempt <= 2; attempt++) {
      const {res, text} = await post(c, signal, JSON.stringify({model, max_tokens: attempt === 1 ? maxTokens : maxTokens * 2, usage: {include: true}, reasoning: {effort: "medium", exclude: true},
        messages: [{role: "system", content: system + JSON_RULE}, {role: "user", content: attempt === 1 ? user : user + `\n\n（上一次的回答不是合法 JSON：${last && last.message}。这次只输出一个合法的 JSON 对象，不要任何别的文字；字符串里需要引号时一律用「」，不要用英文双引号。）`}]}), model);
      if (res.status !== 200) throw new Error(res.status === 402 ? "OpenRouter 余额不足" : res.status === 401 ? "OpenRouter Key 不对" : `OpenRouter ${res.status}：${text.slice(0, 200)}`);
      const data = JSON.parse(text);
      if (data.error) throw new Error("OpenRouter 错误：" + JSON.stringify(data.error).slice(0, 200));
      const cost = Number((data.usage || {}).cost || 0);
      Lab.spent.calls++; Lab.spent.cost = Math.round((Lab.spent.cost + cost) * 10000) / 10000;
      const ch0 = (data.choices || [])[0] || {}, out = String((ch0.message || {}).content || "");
      if (ch0.finish_reason === "length") { last = new Error("回答太长被截断了"); if (attempt === 2) break; continue; }
      try { return {json: parseJson(out), ms: Date.now() - t0, cost, model, usage: data.usage || {}}; } catch (e) { last = e; }
    }
    throw new Error(`${model} 没有按格式回答（${last && last.message}）`);
  }
  // 网络断开（浏览器报 Failed to fetch，常见于代理掐断长连接）或 OpenRouter 临时忙（429、5xx）：等几秒自动重试，最多 3 次
  const sleep = (ms, signal) => new Promise((ok, no) => {
    const t = setTimeout(ok, ms);
    if (signal) signal.addEventListener("abort", () => { clearTimeout(t); no(new DOMException("已停止", "AbortError")); }, {once: true});
  });
  async function post(c, signal, body, model) {
    const waits = [3000, 8000, 15000];
    for (let i = 0; ; i++) {
      let res = null, text = "", err = null;
      try {
        res = await fetch("https://openrouter.ai/api/v1/chat/completions", {method: "POST", signal, body,
          headers: {"Authorization": "Bearer " + c.key, "Content-Type": "application/json", "X-Title": "echo1937-storylab"}});
        text = await res.text();
      } catch (e) { if (e.name === "AbortError") throw e; err = e; }
      const busy = res && (res.status === 429 || res.status >= 500);
      if (!err && !busy) return {res, text};
      if (i >= waits.length) throw new Error(err ? `网络断了，重试 ${waits.length} 次还是不行（${err.message}）。检查网络或代理后，再点这一稿的「重新评分」` : `OpenRouter ${res.status}，重试 ${waits.length} 次还是不行：${text.slice(0, 200)}`);
      Lab.retries = (Lab.retries || 0) + 1;
      if (Lab.onRetry) Lab.onRetry(`${model}：${err ? "网络断了" : "OpenRouter " + res.status}，${waits[i] / 1000} 秒后第 ${i + 1} 次重试…`);
      await sleep(waits[i], signal);
    }
  }
  function parseJson(s) {
    const t = String(s).replace(/^\s*```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    const i = t.indexOf("{"), j = t.lastIndexOf("}");
    if (i < 0 || j < i) throw new Error("找不到 JSON");
    const body = t.slice(i, j + 1);
    try { return JSON.parse(body); } catch (e) {
      try { return JSON.parse(repairJson(body)); } catch (e2) { throw e; }
    }
  }
  // 模型常见的格式毛病：中文内容里夹着没转义的英文双引号（"霸总"）、字符串里直接换行、末尾多逗号。
  // 在字符串里遇到 "：后面紧跟 , } ] : 的才算字符串结束，否则当作内容里的引号转义掉
  function repairJson(s) {
    let out = "", inStr = false;
    for (let k = 0; k < s.length; k++) {
      const ch = s[k];
      if (!inStr) { out += ch; if (ch === '"') inStr = true; continue; }
      if (ch === "\\") { out += ch + (s[k + 1] || ""); k++; continue; }
      if (ch === "\n") { out += "\\n"; continue; }
      if (ch === "\r" || ch === "\t") { out += " "; continue; }
      if (ch === '"') {
        let m = k + 1;
        while (m < s.length && /\s/.test(s[m])) m++;
        if (m >= s.length || ",}]:".includes(s[m])) { out += ch; inStr = false; }
        else out += '\\"';
        continue;
      }
      out += ch;
    }
    return out.replace(/,\s*([}\]])/g, "$1");
  }
  Lab.repairJson = repairJson;
  // OpenRouter 的模型清单（公开接口，不用 Key）
  Lab.models = async function () {
    const res = await fetch("https://openrouter.ai/api/v1/models");
    const data = await res.json();
    return (data.data || []).map(m => ({id: m.id, name: m.name, in: +((m.pricing || {}).prompt || 0) * 1e6, out: +((m.pricing || {}).completion || 0) * 1e6}));
  };

  // ---------------- ② 提炼套路 ----------------
  const TROPE_SYS = `你是北美女性向娱乐内容的行业分析师。下面是一份北美 18–34 岁女性在 2025–2026 年最爱看的爆款清单，来自竖屏短剧平台（ReelShort、DramaBox 等）、Netflix 等流媒体、畅销小说和 Webtoon（每条有平台、标题、类型、热度、梗概、开场、钩子）。
请提炼出可以自由借用的公共套路：关系套路、情节套路、情绪节拍、开场钩子、爽点、段落/章节结尾的悬念手法。我们要做的是 30–90 秒一段的竖屏互动漫画，主角是用户本人：长剧和小说里的套路要说清楚怎么压缩成短剧节奏；只在长剧、小说里流行而短剧里少见的套路，单独标出来，它们可能是差异化机会。
- 只提炼公共套路，不复述任何一部剧的具体故事链、台词或标志性场景。
- 每条套路写清楚：它是什么、在清单里出现了几次（count，按清单数）、举 2–4 个出现它的剧名、为什么能勾住 18–34 岁的北美女性观众、写的时候怎么用才不落俗套。
- 按勾人程度从高到低排序，给 20–30 条；每条注明主要来自哪类平台（短剧 / 流媒体 / 小说 / Webtoon / 都有）。
- 另外总结 5–8 种最常见的开场模式，以及观众最讨厌的写法。
只输出一个 JSON 对象：{"tropes":[{"name":"","type":"关系|情节|情绪节拍|开场钩子|爽点|结尾悬念","source":"短剧|流媒体|小说|Webtoon|都有","desc":"","count":0,"examples":[""],"why":"","how":""}],"openings":[{"pattern":"","examples":[""],"why":""}],"donts":[""]}`;
  Lab.extractTropes = async function (c, dramas, signal) {
    const list = dramas.map((d, i) => `${i + 1}. [${d.platform || "?"}] ${d.title}${d.year ? `（${d.year}）` : ""}｜${(d.tags || []).join("、")}｜热度：${d.evidence || "—"}\n   梗概：${d.logline}\n   开场：${d.opening}\n   钩子：${(d.hooks || []).join("、")}`).join("\n");
    const r = await call(c, c.models.trope, TROPE_SYS, `爆款清单（共 ${dramas.length} 部）：\n${list}`, 16000, signal);
    return {...r.json, meta: {model: r.model, ms: r.ms, cost: r.cost, n: dramas.length, at: Date.now()}};
  };

  // ---------------- ③ 编剧 ----------------
  const bullet = a => (a || []).map(x => "- " + x).join("\n");
  function writerSys() {
    return `你是北美竖屏短剧和互动漫画的顶级编剧，写的是「平行时空的 Instagram」里的一个世界：主角就是用户本人（第二人称“你”），她的脸会出现在每一格漫画里；每段 30–90 秒、6–12 格竖屏漫画，配音配乐，像刷 TikTok 一样上滑看下一段。目标观众是北美 18–34 岁女性，短剧观众兼恋爱/经营游戏玩家。

【核心原则】
${bullet(H.principles)}

【一章的节拍（8 段，情绪“高开—小落—再起—最高点收尾”）】
${(H.beats || []).map(b => `第 ${b.n} 段 ${b.beat}（强度 ${b.intensity}）：必用钩子 ${b.hooks}；结尾留下：${b.ending}${b.choice ? "；本段有选择节点" : ""}`).join("\n")}

【钩子类型】
${(H.hook_types || []).map(h => `${h.name}：${h.def}（适用：${h.where}）`).join("\n")}

【写作规则】
${bullet(H.writing_rules)}

【选择节点】
${bullet(H.choice_rules)}
超时默认：按主角性格默认更强势的选项。

【安全与分级】
${bullet(H.safety_rules)}

【输出】台词用英文（口语、短、狠），每句后附中文译文；画面描述、旁白说明、选项说明用中文。只输出一个 JSON 对象：
{"title":"世界名（英文）","cover_line":"封面冲突文案，不超过 8 个英文单词","logline_zh":"一句话中文梗概",
 "characters":[{"name":"","role_zh":"","friend_slot":"none|ally|villain","note_zh":""}],
 "segments":[{"n":1,"beat_zh":"","hooks":["钩子名"],"panels":[{"n":1,"shot":"wide|medium|closeup|pov","you_closeup":false,"visual_zh":"画面里发生什么","narration_en":"","narration_zh":"","lines":[{"who":"角色名或 You","en":"","zh":""}]}],
   "cliffhanger_zh":"最后一格留下了什么",
   "choice":null 或 {"prompt_zh":"","a":{"en":"","zh":"","changes_zh":"改变哪些状态"},"b":{"en":"","zh":"","changes_zh":""},"default":"a|b","reaction_zh":"选完第一格的反应","callback_zh":"后面在哪一段怎么回扣"}}]}`;
  }
  function writerUser(job, prev) {
    const w = job.world, t = job.tropes;
    let s = `【世界】${w.name}\n一句话：${w.logline}\n角色：${w.cast}\n主线：${w.arc}\n\n`;
    if (t && t.length) s += `【这次要用上的套路（从北美女性爆款里提炼的公共套路，只借套路，不借具体剧情）】\n${t.map(x => `- ${x.name}：${x.desc}${x.how ? `（写法：${x.how}）` : ""}`).join("\n")}\n\n`;
    s += `【任务】写第一章的第 1–${job.scope} 段。`;
    if (!prev) return s + "直接从冲突最高点开始。";
    return s + `\n\n这是第 ${prev.n + 1} 稿。上一稿没有通过：三个评审各自独立打分（通过线 ${job.pass}），意见如下。保留评审夸过的地方，改掉被批评的地方，分数最低的段落优先重写；不要为了迎合评审把剧情写平。\n\n` +
      prev.judges.map(j => j.error ? "" : `【${j.name}：${j.score} 分】\n最好的：${j.best}\n最想划走的：${j.worst}\n要改的：\n${bullet(j.fixes)}\n${(j.segments || []).filter(x => x.score < job.pass).map(x => `  第 ${x.n} 段 ${x.score} 分：${x.note}`).join("\n")}`).join("\n\n") +
      (prev.checks.length ? `\n\n【规则检查没过的】\n${bullet(prev.checks)}` : "") +
      (prev.orig && !prev.orig.ok ? `\n\n【原创性问题】\n${bullet((prev.orig.issues || []).map(x => `${x.title}：${x.what}`))}` : "") +
      `\n\n【上一稿】\n${JSON.stringify(prev.draft)}`;
  }

  // ---------------- 规则自检（不用模型） ----------------
  Lab.check = function (d, scope) {
    const out = [], segs = d.segments || [];
    if (segs.length !== scope) out.push(`应该写 ${scope} 段，实际 ${segs.length} 段`);
    const words = s => String(s || "").trim().split(/\s+/).filter(Boolean).length;
    if (d.cover_line && words(d.cover_line) > 8) out.push(`封面文案超过 8 个英文单词：${d.cover_line}`);
    for (const g of segs) {
      const P = g.panels || [];
      if (P.length < 6 || P.length > 12) out.push(`第 ${g.n} 段有 ${P.length} 格（应为 6–12 格）`);
      if (!P.some(p => p.you_closeup || p.shot === "closeup")) out.push(`第 ${g.n} 段没有主角特写格`);
      for (const p of P) {
        if ((p.lines || []).length > 2) out.push(`第 ${g.n} 段第 ${p.n} 格台词超过 2 句`);
        for (const l of p.lines || []) if (words(l.en) > 12) out.push(`第 ${g.n} 段第 ${p.n} 格台词超过 12 个英文单词：“${l.en}”`);
      }
      const beat = (H.beats || []).find(b => b.n === g.n);
      if (beat && beat.choice && !g.choice) out.push(`第 ${g.n} 段应该有选择节点`);
      if (g.choice && (!g.choice.a || !g.choice.b)) out.push(`第 ${g.n} 段的选择缺选项`);
      if (!g.cliffhanger_zh) out.push(`第 ${g.n} 段没写结尾悬念`);
    }
    return out;
  };

  // ---------------- 给评审看的剧本（不带编剧自己标的钩子名，免得评审被标签带着走） ----------------
  Lab.script = function (d) {
    const lines = [`《${d.title || ""}》 封面文案：${d.cover_line || ""}`, `梗概：${d.logline_zh || ""}`,
      `角色：${(d.characters || []).map(c => `${c.name}（${c.role_zh}${c.friend_slot && c.friend_slot !== "none" ? "，朋友位" : ""}）`).join("；")}`, ""];
    for (const g of d.segments || []) {
      lines.push(`━━ 第 ${g.n} 段 ━━`);
      for (const p of g.panels || []) {
        lines.push(`[格 ${p.n} · ${({wide: "全景", medium: "中景", closeup: "特写", pov: "第一视角"})[p.shot] || p.shot}${p.you_closeup ? " · 主角特写" : ""}] ${p.visual_zh || ""}`);
        if (p.narration_en) lines.push(`  旁白：${p.narration_en}（${p.narration_zh || ""}）`);
        for (const l of p.lines || []) lines.push(`  ${l.who}：${l.en}（${l.zh}）`);
      }
      if (g.choice) lines.push(`  ▶ 选择（5 秒）：${g.choice.prompt_zh}\n    A. ${g.choice.a.en}（${g.choice.a.zh}）\n    B. ${g.choice.b.en}（${g.choice.b.zh}）\n    选完：${g.choice.reaction_zh || ""}；后面回扣：${g.choice.callback_zh || ""}`);
      lines.push("");
    }
    return lines.join("\n");
  };

  // ---------------- ④ 三个评审 + 原创性检查 ----------------
  const CALIBRATE = `【打分标准（0–100）】
- 90 以上：和 ReelShort 年度头部爆款同等抓人，看完这一章会立刻想看下一章、愿意付费解锁。90 分以上要非常少给，必须每一项都过硬。
- 80–89：好看，但有明显短板。70–79：能看，会走神。70 以下：会划走。
- 有任何一条硬伤，总分不超过 85：第一格没有冲突；某一段结尾没有悬念；主角连续 3 段被动挨打没有兑现；选择节点有一个选项明显正确；台词又长又解释情绪。
- 只看实际写出来的格子和台词，不要因为用了某个流行套路就加分。
- 你是独立评审，不知道其他评审的意见，也不需要客气。

只输出一个 JSON 对象：{"score":0,"sub":{"维度名":0},"verdict":"一句话结论","best":"最好的一处（指出第几段第几格）","worst":"最想划走的一处（指出第几段第几格）","fixes":["最多 5 条具体的修改建议"],"segments":[{"n":1,"score":0,"note":"一句话"}]}`;
  const JUDGES = {
    j1: `你是 Jess，26 岁，住在德州奥斯汀的护士，单身。每晚睡前在 ReelShort 上刷一小时短剧，最爱狼人、总裁、复仇题材，为好几部剧付过钱；也玩 Love and Deepspace。你没耐心：3 秒抓不住就划走；讨厌女主窝囊太久、剧情拖沓、选了没用的选项、男主油腻。这部剧的女主就是“你自己”——你的脸会出现在每一格里。
请以观众的身份读这份第一章剧本，按下面 5 个维度各打 0–20 分，相加为总分：开场 3 秒抓人、代入感（如果是我，会不会气到或心动）、每段结尾想不想上滑、爽点够不够爽、愿不愿意付钱和截图发给闺蜜。
${CALIBRATE}`,
    j2: `你是做了 8 年竖屏短剧的主编，经手过多部北美 Top 10 爆款，天天看完播率、付费墙转化和差评。你要判断这份第一章剧本能不能做成爆款。
按下面 5 个维度各打 0–20 分，相加为总分：钩子密度和位置（每段至少一个、开场即冲突）、节拍和情绪波浪（高开—小落—再起—最高点收尾，前 5 段内有爽点兑现）、段落结尾悬念强度、台词（短、狠、口语、每格不超过 2 句、每句不超过 12 个英文单词）、人物（反派可信、男主有魅力、女主不长期窝囊）。
${CALIBRATE}`,
    j3: `你是互动叙事设计师，做过 Episode / Chapters 上留存最高的选择节点，也研究过 AI 互动短剧和乙女游戏。这部作品的主角是用户本人（第二人称），用户会在关键节点 5 秒内做二选一。
按下面 5 个维度各打 0–20 分，相加为总分：选择是不是真两难（两个都爽或都痛）、选项是不是具体动作、选完能不能立刻看到对方反应、回扣设计（后面会不会因为这个选择不同）、代入感设计（第二人称、主角特写格适合截图、第一视角用在对视或看到证据的瞬间、朋友位角色用得合适且不成为暴力对象）。
${CALIBRATE}`,
  };
  const ORIG_SYS = `你是版权审核。下面有一份新写的短剧剧本，以及一份热门剧、小说和 Webtoon 清单（只有平台、标题和梗概）。
判断新剧本有没有搬运某一部已有作品：具体的故事链（几个关键事件按同样顺序发生）、角色名、标志性台词或场景。拒绝伴侣、契约婚姻、撞破出轨、隐藏继承人这类公共套路本身不算。
只输出一个 JSON 对象：{"ok":true,"issues":[{"title":"像哪部剧","what":"哪里太像，怎么改"}]}`;

  async function judge(c, k, script, signal) {
    try {
      const r = await call(c, c.models[k], JUDGES[k], `【第一章剧本】\n${script}`, 16000, signal);
      const j = r.json;
      return {k, name: AGENTS[k].name, model: r.model, ms: r.ms, cost: r.cost, score: Math.round(+j.score || 0), sub: j.sub || {}, verdict: j.verdict || "",
        best: j.best || "", worst: j.worst || "", fixes: (j.fixes || []).slice(0, 5), segments: j.segments || []};
    } catch (e) { if (e.name === "AbortError") throw e; return {k, name: AGENTS[k].name, model: c.models[k], error: e.message, score: 0}; }
  }
  async function originality(c, script, dramas, signal) {
    try {
      const list = dramas.map(d => `- [${d.platform || "?"}] ${d.title}：${d.logline}`).join("\n");
      const r = await call(c, c.models.orig, ORIG_SYS, `【新剧本】\n${script}\n\n【热门剧清单】\n${list}`, 1500, signal);
      return {ok: r.json.ok !== false && !(r.json.issues || []).length, issues: r.json.issues || [], model: r.model, cost: r.cost};
    } catch (e) { if (e.name === "AbortError") throw e; return {ok: true, issues: [], error: e.message}; }
  }

  // ---------------- 一次完整的流程 ----------------
  // job: {world, tropes, scope, pass, rounds}；onStep(run) 每一步之后回调，页面据此刷新
  const costOf = run => Math.round(run.rounds.reduce((s, r) => s + r.writer.cost + r.judges.reduce((a, j) => a + (j.cost || 0), 0) + ((r.orig || {}).cost || 0) + (r.rejudgeCost || 0), 0) * 10000) / 10000;
  // job.from = {run, n}：接着这一局、从第 n 稿往下改（不新开一局）
  Lab.run = async function (c, job, dramas, onStep, signal) {
    const run = job.from ? job.from.run : {id: Date.now().toString(36), at: Date.now(), world: job.world, tropes: (job.tropes || []).map(t => t.name), scope: job.scope, pass: job.pass,
      models: {...c.models}, rounds: [], status: "running", step: "", cost: 0};
    if (job.from) { run.rounds = run.rounds.filter(r => r.n <= job.from.n); run.status = "running"; run.error = ""; job = {...job, world: run.world, scope: run.scope, pass: run.pass}; }
    const step = s => { run.step = s; onStep(run); };
    let prev = job.from ? run.rounds.find(r => r.n === job.from.n) : null;
    try {
      // 起点和终点先算好：循环里 prev 会变，不能拿它算终点
      const first = prev ? prev.n + 1 : 1, last = first + job.rounds - 1;
      for (let n = first; n <= last; n++) {
        if (run.rounds.length >= 12) { run.status = "failed"; step("一局最多 12 稿，已停下"); return run; }
        step(`第 ${n} 稿：编剧在写…`);
        const w = await call(c, c.models.writer, writerSys(), writerUser(job, prev), 24000, signal);
        const draft = w.json, checks = Lab.check(draft, job.scope), script = Lab.script(draft);
        const round = {n, draft, checks, writer: {model: w.model, ms: w.ms, cost: w.cost}, judges: [], orig: null};
        run.rounds.push(round);
        step(`第 ${n} 稿：三个评审和原创性检查在读…`);
        const [orig, ...judges] = await Promise.all([originality(c, script, dramas, signal), judge(c, "j1", script, signal), judge(c, "j2", script, signal), judge(c, "j3", script, signal)]);
        round.orig = orig; round.judges = judges;
        round.min = Math.min(...judges.map(j => j.score));
        round.pass = judges.every(j => !j.error && j.score >= job.pass) && orig.ok;
        run.cost = costOf(run);
        // 有评审没打出分：不拿缺评审的结果去改稿（白花钱），停下来报错；可以换模型后点「重新评分」
        const broken = judges.filter(j => j.error);
        if (broken.length) {
          run.status = "error"; run.error = `评审出错，先停下：${broken.map(j => `${j.name}（${j.model}）：${j.error}`).join("；")}。可以在设置里给它换个模型，再点这一稿的「重新评分」`;
          step(run.error); return run;
        }
        if (!run.best || round.min >= run.best.min) run.best = {n, min: round.min};
        if (round.pass) { run.status = "passed"; step(`第 ${n} 稿通过：三个评审都 ≥ ${job.pass}`); return run; }
        prev = round;
      }
      run.status = "failed"; step(`改了 ${job.rounds} 稿还没通过；最好的是第 ${run.best.n} 稿（最低分 ${run.best.min}）`);
    } catch (e) {
      run.status = e.name === "AbortError" ? "stopped" : "error"; run.error = e.name === "AbortError" ? "已停止" : e.message; step(run.error);
    }
    return run;
  };

  // 只给某一稿重新评分（不重写），比如评审出错、换了评审模型之后
  Lab.rejudge = async function (c, run, n, dramas, onStep, signal) {
    const r = run.rounds.find(x => x.n === n), script = Lab.script(r.draft);
    run.status = "running"; run.error = ""; run.step = `第 ${n} 稿：重新评分…`; onStep(run);
    try {
      const [orig, ...judges] = await Promise.all([originality(c, script, dramas, signal), judge(c, "j1", script, signal), judge(c, "j2", script, signal), judge(c, "j3", script, signal)]);
      r.rejudgeCost = (r.rejudgeCost || 0) + r.judges.reduce((a, j) => a + (j.cost || 0), 0) + ((r.orig || {}).cost || 0);
      r.orig = orig; r.judges = judges; r.min = Math.min(...judges.map(j => j.score));
      r.pass = judges.every(j => !j.error && j.score >= run.pass) && orig.ok;
      run.cost = costOf(run);
      if (!run.best || r.min >= run.best.min) run.best = {n, min: r.min};
      const broken = judges.filter(j => j.error);
      run.status = broken.length ? "error" : r.pass ? "passed" : "failed";
      run.error = broken.length ? `评审出错：${broken.map(j => `${j.name}（${j.model}）：${j.error}`).join("；")}` : "";
      run.step = broken.length ? run.error : r.pass ? `第 ${n} 稿通过：三个评审都 ≥ ${run.pass}` : `第 ${n} 稿没通过（最低 ${r.min} 分），可以点「从这一稿接着改」`;
    } catch (e) { run.status = e.name === "AbortError" ? "stopped" : "error"; run.error = e.name === "AbortError" ? "已停止" : e.message; run.step = run.error; }
    onStep(run);
    return run;
  };

  // 导出成编剧交付格式的 Markdown
  Lab.markdown = function (run, n) {
    const r = run.rounds.find(x => x.n === n) || run.rounds[run.rounds.length - 1], d = r.draft;
    let s = `# ${d.title}\n\n> ${d.cover_line}\n\n${d.logline_zh}\n\n世界：${run.world.name}｜第 ${r.n} 稿｜评分：${r.judges.map(j => `${j.name} ${j.score}`).join("，")}\n\n## 角色\n\n`;
    s += (d.characters || []).map(c => `- **${c.name}**：${c.role_zh}${c.friend_slot !== "none" ? `（朋友位·${c.friend_slot === "ally" ? "盟友" : "反派"}）` : ""}${c.note_zh ? "。" + c.note_zh : ""}`).join("\n") + "\n";
    for (const g of d.segments || []) {
      s += `\n## 第 ${g.n} 段 · ${g.beat_zh}\n\n钩子：${(g.hooks || []).join("、")}｜结尾悬念：${g.cliffhanger_zh}\n\n| 格 | 镜头 | 画面 | 台词 |\n|---|---|---|---|\n`;
      for (const p of g.panels || []) s += `| ${p.n} | ${p.shot}${p.you_closeup ? "·主角特写" : ""} | ${(p.visual_zh || "").replace(/\|/g, "／")} | ${[p.narration_en ? `旁白：${p.narration_en}` : "", ...(p.lines || []).map(l => `${l.who}: ${l.en}（${l.zh}）`)].filter(Boolean).join("<br>").replace(/\|/g, "／")} |\n`;
      if (g.choice) s += `\n**选择**：${g.choice.prompt_zh}\n- A：${g.choice.a.en}（${g.choice.a.zh}）→ ${g.choice.a.changes_zh}\n- B：${g.choice.b.en}（${g.choice.b.zh}）→ ${g.choice.b.changes_zh}\n- 选完：${g.choice.reaction_zh}；回扣：${g.choice.callback_zh}\n`;
    }
    return s;
  };

  root.StoryLab = Lab;
})(typeof window !== "undefined" ? window : globalThis);
