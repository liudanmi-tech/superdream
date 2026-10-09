// 城市模拟的自检：改完 content/sim.json 或 story_*.json 并导出后运行
//   node tools/sim_check.js [局数] [天数]
// 每种身份跑若干局，检查不报错、不卡死、主线有进展，并列出从没触发过的故事卡。
const fs = require("fs"), vm = require("vm"), path = require("path");
const W = path.join(__dirname, "..", "web") + "/";
const ctx = {window: {}}; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(W + "world.js", "utf8"), ctx);
vm.runInContext(fs.readFileSync(W + "sim_data.js", "utf8"), ctx);
const Sim = require(W + "sim.js");
const D = Sim.makeData(ctx.window.SIM, ctx.window.WORLD, ctx.window.STORY);
const N = +process.argv[2] || 30, days = +process.argv[3] || 7;
let bad = 0;
const hits = {};
for (const role of Object.keys(D.sim.jobs)) {
  const a = {money: 0, clues: 0, done: 0, missed: 0, fired: 0, moves: 0, cards: 0};
  for (let seed = 1; seed <= N; seed++) {
    let st;
    try {
      st = Sim.newGame(D, {seed, role});
      let guard = 0;
      while (!st.ended && st.day <= days && guard++ < 1200 * days) Sim.auto(st, D);
      if (!st.ended && st.day <= days) { bad++; console.log(`卡住了：${role} 种子 ${seed}，停在第 ${st.day} 天 ${Sim.slotOf(st, D).label}`); continue; }
    } catch (e) { bad++; console.log(`出错：${role} 种子 ${seed}：${e.stack.split("\n").slice(0, 3).join(" | ")}`); continue; }
    a.money += st.money; a.clues += st.clues.length; a.missed += st.missed; a.fired += st.fired ? 1 : 0;
    a.done += Object.values(st.quests).filter(q => q.status === "done").length;
    for (const e of st.log) { if (e.kind === "move") a.moves++; if (e.kind === "card") { a.cards++; hits[e.card] = (hits[e.card] || 0) + 1; } }
    const main = st.quests.where_is_lillian;
    if (!main || !Object.keys(main.done).length) { bad++; console.log(`主线没有进展：${role} 种子 ${seed}`); }
  }
  const f = v => Math.round(v / N * 100) / 100;
  console.log(`${role}: 钱 $${f(a.money)} · 线索 ${f(a.clues)} · 完成任务 ${f(a.done)} · 缺勤 ${f(a.missed)} · 被解雇 ${a.fired}/${N} · 每天移动 ${f(a.moves / days)} · 每天卡 ${f(a.cards / days)}`);
}
const never = D.cards.filter(c => !hits[c.id]).map(c => c.id);
console.log(`从没触发的卡（自动跑不一定能碰到，接管时才会出现的也算在内）：${never.join("、") || "无"}`);
console.log(bad ? `有 ${bad} 个问题` : "通过");
process.exit(bad ? 1 : 0);
