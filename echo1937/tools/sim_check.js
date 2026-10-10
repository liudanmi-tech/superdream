// 城市模拟的自检：改完 content/sim.json、story_*.json、agents.json、behaviors.json 并导出后运行
//   node tools/sim_check.js [局数] [天数]
// 每种身份跑若干局，检查不报错、不卡死、主线有进展，并列出从没触发过的故事卡；
// 再统计人物底层系统：每种大事在多少局里发生过、三种真相各抽中多少次、莉莉安案的结局。
const fs = require("fs"), vm = require("vm"), path = require("path");
const W = path.join(__dirname, "..", "web") + "/";
const ctx = {window: {}}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(W + "world.js", "utf8"), ctx);
vm.runInContext(fs.readFileSync(W + "sim_data.js", "utf8"), ctx);
const Sim = require(W + "sim.js");
const D = Sim.makeData(ctx.window.SIM, ctx.window.WORLD, ctx.window.STORY, {agents: ctx.window.AGENTS, behaviors: ctx.window.BEHAVIORS});
const N = +process.argv[2] || 30, days = +process.argv[3] || 7;
let bad = 0, games = 0;
const hits = {}, big = {}, truths = {}, endings = {}, acts = {};
// 大事：统计名 → 说明
const BIG = {romance: "恋爱", engaged: "订婚", marry: "结婚", breakup: "分手", affair: "偷情", quarrel: "吵架", humiliate: "当众羞辱", rumor: "散布谣言",
  steal: "偷窃", blackmail: "勒索", bribe: "收买", frame: "栽赃", frame_seen: "识破栽赃", threaten: "威胁", assault: "打人", gun: "买枪", gun_threat: "持枪威胁",
  hire: "雇凶", poison: "下毒", kill: "杀人", death: "有人死亡", testify: "证人开口", leak: "说出秘密", solved: "破案或结案", wrongful: "抓错人", arrest: "逮捕",
  left: "有人离开城市", surrender: "自首", elope: "私奔", protect: "挡在前面"};
for (const role of Object.keys(D.sim.jobs)) {
  const a = {money: 0, clues: 0, done: 0, missed: 0, fired: 0, moves: 0, cards: 0, agentLog: 0};
  for (let seed = 1; seed <= N; seed++) {
    let st;
    try {
      st = Sim.newGame(D, {seed, role});
      let guard = 0;
      while (!st.ended && st.day <= days && guard++ < 1200 * days) Sim.auto(st, D);
      if (!st.ended && st.day <= days) { bad++; console.log(`卡住了：${role} 种子 ${seed}，停在第 ${st.day} 天 ${Sim.slotOf(st, D).label}`); continue; }
    } catch (e) { bad++; console.log(`出错：${role} 种子 ${seed}：${e.stack.split("\n").slice(0, 3).join(" | ")}`); continue; }
    games++;
    a.money += st.money; a.clues += st.clues.length; a.missed += st.missed; a.fired += st.fired ? 1 : 0;
    a.done += Object.values(st.quests).filter(q => q.status === "done").length;
    for (const e of st.log) { if (e.kind === "move") a.moves++; if (e.kind === "agent") a.agentLog++; if (e.kind === "card") { a.cards++; hits[e.card] = (hits[e.card] || 0) + 1; } }
    const main = st.quests.where_is_lillian;
    if (!main || !Object.keys(main.done).length) { bad++; console.log(`主线没有进展：${role} 种子 ${seed}`); }
    if (st.ag) {
      for (const k of Object.keys(st.ag.stats.ev)) big[k] = (big[k] || 0) + 1;
      for (const [k, n] of Object.entries(st.ag.stats.acts)) acts[k] = (acts[k] || 0) + n;
      const t = st.ag.truth.id, c = st.ag.cases.find(x => x.id === "lillian");
      truths[t] = (truths[t] || 0) + 1;
      const end = c.open ? (Object.keys(c.ev).length ? "在查，有嫌疑人" : "在查，没头绪") : c.result;
      (endings[t] = endings[t] || {})[end] = ((endings[t] || {})[end] || 0) + 1;
    }
  }
  const f = v => Math.round(v / N * 100) / 100;
  console.log(`${role}: 钱 $${f(a.money)} · 线索 ${f(a.clues)} · 完成任务 ${f(a.done)} · 缺勤 ${f(a.missed)} · 被解雇 ${a.fired}/${N} · 每天移动 ${f(a.moves / days)} · 每天卡 ${f(a.cards / days)} · 每天人物日志 ${f(a.agentLog / days)}`);
}
const never = D.cards.filter(c => !hits[c.id]).map(c => c.id);
console.log(`从没触发的卡（自动跑不一定能碰到，接管时才会出现的也算在内）：${never.join("、") || "无"}`);
if (D.agents && games) {
  const pct = n => Math.round(n / games * 100) + "%";
  console.log(`\n人物底层系统（${games} 局，每局 ${days} 天）`);
  console.log("莉莉安案的真相：" + Object.entries(truths).map(([k, n]) => `${k} ${pct(n)}`).join(" · "));
  for (const [t, m] of Object.entries(endings)) console.log(`  真相 ${t}：` + Object.entries(m).map(([k, n]) => `${k} ${Math.round(n / truths[t] * 100)}%`).join(" · "));
  console.log("大事发生的局数比例：" + Object.keys(BIG).filter(k => big[k]).map(k => `${BIG[k]} ${pct(big[k])}`).join(" · "));
  console.log("没发生过：" + (Object.keys(BIG).filter(k => !big[k]).map(k => BIG[k]).join("、") || "无"));
  console.log("每局平均做了几次：" + Object.entries(acts).sort((x, y) => y[1] - x[1]).map(([k, n]) => `${k} ${Math.round(n / games * 10) / 10}`).join(" · "));
}
console.log(bad ? `有 ${bad} 个问题` : "通过");
process.exit(bad ? 1 : 0);
