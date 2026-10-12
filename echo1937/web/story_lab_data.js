// 由 python -m tools.export_world 从 content/storylab_hooks.json 和 content/reelshort_top.json 生成
window.HOOKS = {
 "_说明": "剧情实验室用的规则，来自《剧情钩子手册》（2026-10-12）。改完运行 python -m tools.export_world。",
 "principles": [
  "从最高点开始：世界的第一格就是冲突，前情用一句旁白交代。",
  "一段一个情绪：每段只做一件事（撞破、对峙、反转、护短），做到极致。",
  "结尾不落地：每段最后一格是未完成的动作或未说完的话。",
  "快兑现：前 5 段内至少给一次爽点兑现，例如打脸、护短、反转。",
  "主角是用户：主角的处境要让人代入，“如果是我”的愤怒或心动越强越好；主角可以受委屈，但不能长期窝囊。",
  "全部原创：借用公共套路，不搬运任何电影或短剧的具体故事、台词和分镜。"
 ],
 "hook_types": [
  {
   "id": "crisis_open",
   "name": "危机开场",
   "def": "第一格就身处最糟糕的处境",
   "where": "世界开场、封面"
  },
  {
   "id": "public_humiliation",
   "name": "当众羞辱",
   "def": "主角在很多人面前被践踏",
   "where": "开场、第 1–2 段"
  },
  {
   "id": "walk_in",
   "name": "撞破",
   "def": "主角亲眼看到不该看的事",
   "where": "开场、段落结尾"
  },
  {
   "id": "identity_reveal",
   "name": "身份反转",
   "def": "某人的真实身份被揭开",
   "where": "段落结尾、章节结尾"
  },
  {
   "id": "hidden_power",
   "name": "隐藏实力",
   "def": "主角的价值被低估，然后被揭开",
   "where": "爽点兑现"
  },
  {
   "id": "face_slap",
   "name": "当众打脸",
   "def": "曾经看不起主角的人当场吃瘪",
   "where": "爽点兑现"
  },
  {
   "id": "protector",
   "name": "护短",
   "def": "强势的人站出来为主角撑腰",
   "where": "爽点兑现、段落结尾"
  },
  {
   "id": "half_sentence",
   "name": "半句话",
   "def": "关键信息说到一半被打断",
   "where": "段落结尾"
  },
  {
   "id": "sudden_arrival",
   "name": "突然出现",
   "def": "不该出现的人出现在门口",
   "where": "段落结尾"
  },
  {
   "id": "countdown",
   "name": "倒计时",
   "def": "主角必须在限定时间内做决定",
   "where": "选择节点、章节结尾"
  },
  {
   "id": "forbidden_closeness",
   "name": "禁忌靠近",
   "def": "两个人越来越近，但不能在一起",
   "where": "段落结尾、章节结尾"
  },
  {
   "id": "secret_seed",
   "name": "秘密伏笔",
   "def": "埋一个用户知道、角色不知道的秘密",
   "where": "章节结尾、离线来信"
  }
 ],
 "beats": [
  {
   "n": 1,
   "beat": "危机开场",
   "intensity": 5,
   "hooks": "危机开场 / 当众羞辱 / 撞破",
   "ending": "主角的反应还没出现"
  },
  {
   "n": 2,
   "beat": "主角反击的苗头",
   "intensity": 4,
   "hooks": "隐藏实力的第一个信号",
   "ending": "一个陌生人注意到了她"
  },
  {
   "n": 3,
   "beat": "第一次选择",
   "intensity": 4,
   "hooks": "倒计时",
   "ending": "选择后的第一格反应",
   "choice": true
  },
  {
   "n": 4,
   "beat": "选择的后果",
   "intensity": 3,
   "hooks": "突然出现",
   "ending": "新角色登场"
  },
  {
   "n": 5,
   "beat": "第一次爽点兑现",
   "intensity": 5,
   "hooks": "当众打脸 / 护短",
   "ending": "反派暗中报复的伏笔"
  },
  {
   "n": 6,
   "beat": "第二次选择",
   "intensity": 4,
   "hooks": "禁忌靠近 / 倒计时",
   "ending": "两人关系的转折",
   "choice": true
  },
  {
   "n": 7,
   "beat": "局势急转",
   "intensity": 4,
   "hooks": "半句话 / 秘密伏笔",
   "ending": "真相只露出一角"
  },
  {
   "n": 8,
   "beat": "章节大悬念",
   "intensity": 5,
   "hooks": "身份反转 + 突然出现",
   "ending": "最强的问号，下一章才回答"
  }
 ],
 "writing_rules": [
  "每段 6–12 格，台词每格不超过 2 句，每句不超过 12 个英文单词。",
  "每段至少 1 格主角特写（情绪最高点），供截图分享。",
  "旁白只用于跳过时间，不用于解释情绪。",
  "主角用第二人称“你”（用户本人），台词里别人叫她时可以用名字以外的称呼，避免写死主角的名字。"
 ],
 "choice_rules": [
  "两个选项都要“爽”或都要“痛”，不能一个明显正确。",
  "用动作描述，不用态度描述：“把酒泼在他脸上”，而不是“表达愤怒”。",
  "选完第一格就是对方的表情反应。",
  "至少在后续一个节点被回扣，并提示“因为你……”。"
 ],
 "safety_rules": [
  "朋友位角色（用户上传的朋友照片）只能出演闺蜜、对手、反派、配角；不能成为暴力的直接对象。",
  "亲密内容控制在 PG-13：拥抱、亲吻、暧昧，不出现裸露和性内容。",
  "暴力画面风格化，不写实；按 17+ 准备。"
 ],
 "checklist": [
  "第一格就有冲突，不需要前情也能看懂",
  "这一段只有一个情绪节拍",
  "最后一格留下了未完成的动作、半句话或突然出现的人",
  "至少有 1 格主角特写，适合截图分享",
  "台词每格不超过 2 句，每句不超过 12 个英文单词",
  "主角受委屈后，5 段内有兑现",
  "选择节点的两个选项都有吸引力，且都是动作",
  "每个选择在后续至少被回扣一次",
  "朋友位角色只出演允许的角色，不成为暴力对象",
  "故事、角色和台词均为原创，没有搬运任何已有作品"
 ],
 "worlds": [
  {
   "id": "werewolf",
   "name": "被拒绝的 Luna（狼人）",
   "logline": "命定伴侣在全族面前拒绝了你，那一夜你觉醒了千年未见的白狼血脉。",
   "cast": "你：族里最不起眼的孤女，被认为没有狼形（用户本人）；Kael：本族 Alpha，你的命定伴侣，当众拒绝你；Lysandra：族中贵女，Kael 的“官方”未婚妻（朋友位·反派）；Rowan：敌对族群的 Alpha，第一个看出你真实血脉的人；Mia：你唯一的朋友，族中医者（朋友位·盟友）",
   "arc": "被拒 → 觉醒白狼 → 被敌族 Alpha 带走保护 → 两个 Alpha 争夺你 → 揭开你的身世是失踪的白狼王族 → 你决定自己成为 Luna 还是 Alpha"
  },
  {
   "id": "ceo",
   "name": "契约新娘（总裁）",
   "logline": "为了救父亲，你替姐姐嫁给一个从不露面的亿万富翁，契约第一条是“不准爱上我”。",
   "cast": "你：普通设计师，替姐姐出嫁（用户本人）；Damian Vale：神秘的集团继承人，你的契约丈夫；Celine：你的姐姐，逃婚后又想回来夺位（朋友位·反派）；Ethan：Damian 的白月光的弟弟，似乎知道真相；Zoe：你的闺蜜兼同事（朋友位·盟友）",
   "arc": "替嫁 → 契约同居 → 替身身份差点暴露 → 白月光回国 → 发现 Damian 早就知道你是谁 → 契约到期，你选择离开还是留下"
  },
  {
   "id": "revenge",
   "name": "复仇开店",
   "logline": "生日当天你撞见男友和闺蜜在一起，被赶出公司后，你用最后 500 美元开了一家小店。",
   "cast": "你：被冒领功劳的营销主管（用户本人）；Brandon：前男友，偷走你的方案升职；Vanessa：前闺蜜，和 Brandon 一起背叛你（朋友位·反派）；Leo：街对面咖啡馆的老板，嘴毒心软，身份不简单；Sam：你的室友，一直支持你（朋友位·盟友）",
   "arc": "被背叛 → 开店 → 被前任公司打压 → 小店爆红 → 发现 Leo 是行业巨头的继承人 → 当众揭穿前任和闺蜜的造假，生意和爱情双赢"
  }
 ]
};
window.REELSHORT = [
 {
  "title": "The Double Life of My Billionaire Husband",
  "year": 2023,
  "tags": [
   "billionaire/CEO",
   "secret identity",
   "substitute bride",
   "contract marriage",
   "family abuse"
  ],
  "evidence": "Time (2024-11) 报道 419M+ 播放；Backstage/Filmustage/Real Reel 称 500M+、ReelShort 头号爆款；ReelShort 官方页快照约 787.7M（未标注指标）",
  "source": "https://time.com/7173765/reelshort-crazy-maple-studio-joey-jia-interview/",
  "verified": true,
  "logline": "为筹母亲医药费，女主被继母和继姐逼着代替继姐嫁给传闻中坐过牢的落魄豪门少爷，却不知丈夫真实身份是顶级豪门继承人；契约式婚姻在家族阴谋中变成真爱。",
  "opening": "女主向父亲求助母亲医药费，被继母与继姐羞辱，并被要求以替嫁作为拿钱条件。",
  "hooks": [
   "替嫁",
   "隐藏身份/身份揭晓",
   "家人偏心/继母继姐打压",
   "契约/假结婚/闪婚",
   "打脸"
  ],
  "heroine": "隐忍善良、被原生家庭压榨的穷女儿",
  "lead": "伪装成落魄者的豪门继承人"
 },
 {
  "title": "Found A Homeless Billionaire Husband for Christmas",
  "year": 2024,
  "tags": [
   "billionaire/CEO",
   "secret identity",
   "fake marriage",
   "holiday",
   "friends to lovers"
  ],
  "evidence": "ReelShort 首页快照显示约 702.3M 播放（2026 年 10 月附近，平台自报）；2024-12-25 上线",
  "source": "https://www.reelshort.com/movie/found-a-homeless-billionaire-husband-for-christmas-6752885d3d9eb9334300b6ca",
  "verified": true,
  "logline": "被未婚夫抛下的女主为了在家人面前保住面子，临时和自己一直接济的流浪汉结婚回家过节，对方其实是大集团CEO。",
  "opening": "圣诞前女主的婚约突然告吹，她面临独自回家面对家人的尴尬。",
  "hooks": [
   "被背叛/未婚夫出轨",
   "契约/假结婚/闪婚",
   "隐藏身份/身份揭晓",
   "前任追悔"
  ],
  "heroine": "善良热心的普通打工女孩",
  "lead": "伪装成流浪汉的亿万CEO"
 },
 {
  "title": "True Heiress vs. Fake Queen Bee",
  "year": 2024,
  "tags": [
   "heiress",
   "secret identity",
   "high school",
   "bullying",
   "impostor"
  ],
  "evidence": "ReelShort 官方页快照约 463.4M；Real Reel 称 395M+，'仅次于 Double Life'",
  "source": "https://www.reelshort.com/movie/true-heiress-vs-fake-queen-bee-6746aa92c946defef504c9ff",
  "verified": true,
  "logline": "富家千金隐瞒身份转入公立高中，家中女佣的女儿却冒充她成了校园女王；真千金在霸凌中忍耐，最终在舞会上揭穿假货。",
  "opening": "真千金低调入学的同时，女佣之女顶着'继承人'名头登场并开始欺压她。",
  "hooks": [
   "真假千金/冒名顶替",
   "隐藏身份/身份揭晓",
   "公开羞辱/霸凌",
   "打脸"
  ],
  "heroine": "低调隐忍的真千金",
  "lead": "校园男主（感情线为辅）"
 },
 {
  "title": "Bound by Honor",
  "year": 2025,
  "tags": [
   "mafia",
   "arranged marriage",
   "book adaptation",
   "dark romance",
   "cold husband"
  ],
  "evidence": "Deadline 与 ReelShort 新闻稿（2026-05）：播放超过 400M，催生续作 Bound by Love",
  "source": "https://deadline.com/2026/05/reelshort-bound-by-love-release-date-1236902293/",
  "verified": true,
  "logline": "为平息两大黑手党家族的世仇，刚满十八岁的女主被许配给纽约黑手党继承人；她在恐惧中嫁给这个冷酷危险的男人，并逐渐看到他的保护与柔情。",
  "opening": "女主得知自己被父亲当作和平筹码，许配给以残忍闻名的继承人。",
  "hooks": [
   "包办联姻",
   "保护欲强的危险男主",
   "禁忌/危险关系",
   "新婚夜压力"
  ],
  "heroine": "纯真但坚韧的黑帮千金",
  "lead": "冷酷危险的黑手党继承人"
 },
 {
  "title": "How to Tame a Silver Fox",
  "year": 2025,
  "tags": [
   "age gap",
   "dad's best friend",
   "forbidden romance",
   "billionaire/CEO"
  ],
  "evidence": "ReelShort 官方页快照约 421M；Real Reel 称 356M；Backstage 称 295.6M（不同时点）",
  "source": "https://www.reelshort.com/movie/how-to-tame-a-silver-fox-67e1dd63c794efd25f08931a",
  "verified": true,
  "logline": "年轻女主与父亲那位成熟、过度保护她的好友之间产生暧昧，两人必须在家庭禁忌与彼此吸引之间拉扯。",
  "opening": "女主与父亲的成熟好友重逢，对方以'长辈'姿态管束她，暧昧张力立刻成立。（据简介推断）",
  "hooks": [
   "禁忌关系（年龄差/长辈）",
   "保护欲强的男主",
   "秘密恋情"
  ],
  "heroine": "大胆主动的年轻女孩",
  "lead": "成熟克制的'银狐'富豪"
 },
 {
  "title": "Breaking the Ice",
  "year": 2024,
  "tags": [
   "sports/hockey",
   "secret baby",
   "second chance",
   "single mom"
  ],
  "evidence": "TMZ 称其为 ReelShort 最受欢迎作品之一；Backstage 列为入门推荐、他处称 350M+；ReelShort 页显示 540.6M（未标注指标）",
  "source": "https://www.tmz.com/2025/01/03/breaking-the-ice-seth-edeen-reelshort-movies-perfect-formula/",
  "verified": true,
  "logline": "单亲妈妈与八年前分手的高中恋人、如今的冰球明星重逢并为他工作，而她从未告诉他自己生下了他的孩子。",
  "opening": "女主时隔八年与已成明星的前任重逢，且对方成了她的雇主。",
  "hooks": [
   "秘密孩子/隐瞒怀孕",
   "破镜重圆",
   "职场身份差"
  ],
  "heroine": "独自抚养孩子的坚强单亲妈妈",
  "lead": "明星冰球运动员（初恋）"
 },
 {
  "title": "Fated to My Forbidden Alpha",
  "year": 2023,
  "tags": [
   "werewolf/alpha",
   "fated mates",
   "rival packs",
   "cinderella",
   "rejected mate"
  ],
  "evidence": "Rest of World：TikTok 片段播放数千万；Backstage：上线半年 110M+；ReelShort 列表约 219M–328.9M；Rolling Stone 称其为狼人版灰姑娘",
  "source": "https://restofworld.org/2023/what-is-reelshort",
  "verified": true,
  "logline": "在本族狼群中受尽虐待的少女被敌对狼群的Alpha带走，两人竟是命定伴侣，却身处两族战争的对立面，男主一度打算拒绝她。",
  "opening": "女主在自己的狼群中被欺凌虐待，随即被敌对Alpha救走。",
  "hooks": [
   "命定伴侣",
   "禁忌关系（敌对阵营）",
   "被拒绝的伴侣",
   "灰姑娘逆袭"
  ],
  "heroine": "受虐但善良的'灰姑娘'少女",
  "lead": "强势霸道的敌对狼族Alpha"
 },
 {
  "title": "My Sister Is the Warlord Queen",
  "year": 2025,
  "tags": [
   "secret identity",
   "female power fantasy",
   "sisterhood",
   "face-slap"
  ],
  "evidence": "ReelShort 官方页快照 290.9M–420.2M；ReelShort Fandom 称 380M+；2025-12-31 上线",
  "source": "https://www.reelshort.com/movie/my-sister-is-the-warlord-queen-694b2440aef92798df032b95",
  "verified": true,
  "logline": "被父母抛弃、相依为命的姐妹中，姐姐其实是秘密执行任务的'战神女王'；妹妹订婚宴上她被当作穷亲戚嘲讽后亮出身份护妹。",
  "opening": "姐姐结束卧底任务赶到妹妹订婚宴，被在场众人当众嘲笑。",
  "hooks": [
   "隐藏身份/身份揭晓",
   "公开羞辱/霸凌",
   "打脸",
   "守护家人"
  ],
  "heroine": "隐藏实力的强大女战神",
  "lead": "感情线弱（家族/姐妹为主）"
 },
 {
  "title": "Ms. CEO's Baby Daddy Is the Merchant of Death",
  "year": 2026,
  "tags": [
   "one-night stand",
   "secret baby",
   "secret identity",
   "arms dealer",
   "billionaire"
  ],
  "evidence": "ReelShort Fandom 称 365M+ 播放（平台自家宣传，未在独立来源核实）",
  "source": "https://www.reelshort.com/movie/ms-ceo-s-baby-daddy-is-the-merchant-of-death-6968674a59095c2b4e0e5bd7",
  "verified": false,
  "logline": "卧底当卡车司机的军火大亨曾与他救下的女人共度一夜；四年后她带着两人的孩子出现，他必须在不暴露身份的前提下保护母子。",
  "opening": "卧底中的男主从危险中救下女主，两人发生一夜情。",
  "hooks": [
   "一夜情",
   "秘密孩子/隐瞒怀孕",
   "隐藏身份/身份揭晓",
   "保护欲强的危险男主"
  ],
  "heroine": "独自带娃的女CEO",
  "lead": "隐姓埋名的军火大亨"
 },
 {
  "title": "Daddy Help! Mommy's in Prison!",
  "year": 2025,
  "tags": [
   "cute kid",
   "secret baby",
   "wrongful imprisonment",
   "second chance",
   "billionaire/CEO"
  ],
  "evidence": "ReelShort 首页快照约 214.6M（抓取文本排版混乱，归属待确认）",
  "source": "https://www.reelshort.com/movie/daddy-help-mommy-s-in-prison-6858f9ac22406d541c068b15",
  "verified": false,
  "logline": "强势CEO意外得知自己有个女儿，并把入狱的大学恋人救出来，两人化解多年怨恨，联手保护孩子对抗当年拆散他们的人。",
  "opening": "小女孩找上门向陌生的CEO父亲求救：妈妈在坐牢。（据标题与简介推断）",
  "hooks": [
   "萌宝认亲",
   "秘密孩子/隐瞒怀孕",
   "冤屈/被陷害",
   "破镜重圆"
  ],
  "heroine": "蒙冤入狱的单亲妈妈",
  "lead": "强势但心软的CEO父亲"
 },
 {
  "title": "Snatched a Billionaire to be My Husband",
  "year": 2024,
  "tags": [
   "billionaire/CEO",
   "ex's uncle",
   "flash marriage",
   "pregnancy",
   "revenge on ex"
  ],
  "evidence": "ReelShort 官方页约 197.6M；ReelShort Fandom 称 406.8M；多篇第三方榜单列为热门",
  "source": "https://www.reelshort.com/movie/snatched-a-billionaire-to-be-my-husband-662b1729de38c805800b1af6",
  "verified": true,
  "logline": "被男友背叛的女主转身'抢'了一个男人当丈夫，结果对方是前男友的亿万富翁叔叔。",
  "opening": "女主撞破男友背叛后冲动地拉住陌生男人结婚。（据标题与宣传语推断）",
  "hooks": [
   "被背叛/未婚夫出轨",
   "契约/假结婚/闪婚",
   "禁忌关系（前任长辈）",
   "打脸"
  ],
  "heroine": "冲动直率、受伤后反击的女孩",
  "lead": "前任的亿万富翁叔叔"
 },
 {
  "title": "Claimed by the Alpha I Hate",
  "year": 2025,
  "tags": [
   "werewolf/alpha",
   "rejected mate",
   "wolfless heroine",
   "enemies to lovers",
   "book adaptation"
  ],
  "evidence": "ReelShort 官方页约 197.1M；ReelShort Fandom 称 127M+",
  "source": "https://www.reelshort.com/movie/claimed-by-the-alpha-i-hate-67aab6d180531fad7304cf74",
  "verified": true,
  "logline": "无法变身的女主在十八岁生日被伴侣背叛并断绝契约，离开族群；母亲离奇死亡后，新任Alpha强令她回来，两人互相敌视却彼此吸引。",
  "opening": "十八岁生日当天，女主的伴侣背叛她并当场断绝伴侣关系。",
  "hooks": [
   "被拒绝的伴侣",
   "被背叛/未婚夫出轨",
   "恨到爱",
   "废柴逆袭"
  ],
  "heroine": "无法变身、被看不起的'废柴'狼女",
  "lead": "强势冷硬的新任Alpha"
 },
 {
  "title": "True Luna",
  "year": 2023,
  "tags": [
   "werewolf/alpha",
   "rejected mate",
   "special bloodline",
   "love triangle"
  ],
  "evidence": "ReelShort 狼人列表快照约 143.9M",
  "source": "https://www.reelshort.com/movie/true-luna-654e1d538b7ca93fd101f48c",
  "verified": true,
  "logline": "命定伴侣为了另一只母狼拒绝了女主，随后流浪狼之王打算把她据为己有，而她第一次变身显露出罕见的红狼力量，令前任重新考虑。",
  "opening": "女主被命定伴侣公开拒绝。",
  "hooks": [
   "被拒绝的伴侣",
   "隐藏血统/特殊能力",
   "前任追悔",
   "三角恋"
  ],
  "heroine": "被轻视、身怀特殊血统的少女",
  "lead": "后悔的Alpha与危险的流浪狼王（双男主）"
 },
 {
  "title": "Rejected Luna Is the Alpha Queen",
  "year": 2026,
  "tags": [
   "werewolf/alpha",
   "cheating husband",
   "rejected luna",
   "alpha king",
   "revenge"
  ],
  "evidence": "ReelShort 首页快照约 120M；已推出第二季",
  "source": "https://www.reelshort.com/full-episodes/rejected-luna-is-the-alpha-queen-69fa0a977e9368c0730c1459",
  "verified": true,
  "logline": "Alpha丈夫为情妇抛弃女主，她却遇到真正的命定伴侣——Alpha King，并在续季中为父母之死复仇。",
  "opening": "女主发现丈夫选择情妇、当众将她抛弃。",
  "hooks": [
   "被背叛/未婚夫出轨",
   "被拒绝的伴侣",
   "更强男主替换（升级）",
   "逆袭复仇"
  ],
  "heroine": "被抛弃后觉醒的Luna",
  "lead": "更强大的Alpha King"
 },
 {
  "title": "Never Reject A Wolf Princess",
  "year": 2025,
  "tags": [
   "werewolf/alpha",
   "secret princess",
   "rejected mate",
   "second chance"
  ],
  "evidence": "ReelShort 列表快照约 95.9M",
  "source": "https://www.reelshort.com/movie/never-reject-a-wolf-princess-6825b34d0453c1c8c408726f",
  "verified": true,
  "logline": "隐藏身份接近伴侣的狼族公主遭到背叛与拒绝，随后与一位同样藏着秘密的新伴侣结缘。",
  "opening": "女主隐瞒公主身份留在伴侣身边，却被他背叛拒绝。",
  "hooks": [
   "被拒绝的伴侣",
   "隐藏身份/身份揭晓",
   "前任追悔",
   "更强男主替换（升级）"
  ],
  "heroine": "隐藏身份的狼族公主",
  "lead": "同样有秘密的新伴侣"
 },
 {
  "title": "The Cursed Alpha's Mute Bride",
  "year": 2025,
  "tags": [
   "werewolf/alpha",
   "curse",
   "disabled heroine",
   "arranged marriage"
  ],
  "evidence": "ReelShort Fandom 称 77M+（平台宣传）",
  "source": "https://www.reelshort.com/movie/the-cursed-alpha-s-mute-bride-67cb7455c17f28dfa9082402",
  "verified": false,
  "logline": "不能说话的女主与身负诅咒的Alpha结合，两个'被诅咒'的人在偏见中互相救赎。",
  "opening": "哑女被送到传闻可怕的受诅咒Alpha身边。（据标题推断）",
  "hooks": [
   "包办联姻",
   "弱势女主被轻视",
   "互相救赎",
   "保护欲强的危险男主"
  ],
  "heroine": "沉默但坚强的哑女",
  "lead": "受诅咒、孤僻危险的Alpha"
 },
 {
  "title": "Bound by Hatred",
  "year": 2026,
  "tags": [
   "mafia",
   "arranged marriage",
   "enemies to lovers",
   "book adaptation",
   "franchise"
  ],
  "evidence": "2026 年 ReelShort 首页 TOP 榜第 1 位（新作，约 14.4M）；Bound by 系列（Cora Reilly 改编）",
  "source": "https://www.reelshort.com/movie/bound-by-hatred-6aac622e968c52e4da007355",
  "verified": true,
  "logline": "Bound by 系列第三部：叛逆的女主被迫嫁给黑手党家族中最危险的男人之一，两人从彼此憎恨开始。",
  "opening": "叛逆的女主得知自己被家族许配给一个她厌恶的危险男人。",
  "hooks": [
   "包办联姻",
   "恨到爱",
   "保护欲强的危险男主",
   "系列IP"
  ],
  "heroine": "叛逆嘴硬、渴望自由的黑帮千金",
  "lead": "疯狂危险的黑手党继承人"
 },
 {
  "title": "Bound by Love",
  "year": 2026,
  "tags": [
   "mafia",
   "married couple",
   "sequel",
   "book adaptation"
  ],
  "evidence": "Deadline/PR Newswire：2026-05-28 上线，作为 400M+ 播放的 Bound by Honor 续作（续作播放数未核实）",
  "source": "https://www.prnewswire.com/news-releases/reelshort-debuts-its-latest-sequel-with-adaptation-of-cora-reillys-bound-by-love-302784078.html",
  "verified": true,
  "logline": "Bound by Honor 的续作，继续讲述黑手党夫妻在家族冲突与信任考验中守护婚姻。",
  "opening": "承接前作，婚后的夫妻立刻面临新的外部威胁。（据系列设定推断）",
  "hooks": [
   "保护欲强的危险男主",
   "系列IP",
   "婚后甜虐"
  ],
  "heroine": "成长中的黑帮妻子",
  "lead": "冷酷但专一的黑手党老大"
 },
 {
  "title": "Falling for My Ex's Mafia Dad",
  "year": 2025,
  "tags": [
   "mafia",
   "ex's father",
   "age gap",
   "fake marriage",
   "hidden lineage"
  ],
  "evidence": "ReelShort 官方页约 175.7M–182.7M，并带 Trending 标签；2026 年推出续作",
  "source": "https://www.reelshort.com/movie/falling-for-my-ex-s-mafia-dad-67b55429a9d0ac04b202017f",
  "verified": true,
  "logline": "撞见男友出轨后，女主得知自己其实是黑帮老大的女儿，并与前男友的黑手党父亲达成假结婚协议。",
  "opening": "女主撞见男友出轨。",
  "hooks": [
   "被背叛/未婚夫出轨",
   "禁忌关系（前任长辈）",
   "契约/假结婚/闪婚",
   "隐藏身份/身份揭晓"
  ],
  "heroine": "被背叛后反击的女孩（隐藏的黑帮千金）",
  "lead": "前任的黑手党父亲"
 },
 {
  "title": "Uncle William, Please Say I Do!",
  "year": 2025,
  "tags": [
   "billionaire/CEO",
   "ex's uncle",
   "contract marriage",
   "rescue debt"
  ],
  "evidence": "ReelShort 官方页约 57.9M；入选 ReelShort Fandom '2026 必看亿万富翁短剧 Top 8'",
  "source": "https://www.reelshort.com/movie/uncle-william-please-say-i-do-679423dff9a4ac9055018cfe",
  "verified": true,
  "logline": "女主曾在车祸中救下一个男人并得到他的承诺；未婚夫出轨后，为完成病重祖母的心愿，她请求这个男人——未婚夫的叔叔——和她秘密结婚一年。",
  "opening": "女主在车祸现场救出陌生男人，对方许下承诺。",
  "hooks": [
   "救命之恩",
   "被背叛/未婚夫出轨",
   "契约/假结婚/闪婚",
   "禁忌关系（前任长辈）"
  ],
  "heroine": "善良有担当的孙女",
  "lead": "成熟强势的亿万富翁'叔叔'"
 },
 {
  "title": "Never Divorce a Secret Billionaire Heiress",
  "year": 2023,
  "tags": [
   "heiress",
   "secret identity",
   "divorce",
   "revenge",
   "second chance"
  ],
  "evidence": "ReelShort 官方页快照约 85.3M–99.9M；入选 ReelShort Fandom 2026 亿万富翁 Top 8；FanFicAble 评测",
  "source": "https://www.reelshort.com/movie/never-divorce-a-secret-billionaire-heiress-661e02c43ac6aff255050ed1",
  "verified": true,
  "logline": "在婚姻中得不到丈夫支持的女主决定离婚，丈夫并不知道她其实是亿万富豪家族的继承人。",
  "opening": "女主在婚姻中受尽冷落与羞辱，决定提出离婚。",
  "hooks": [
   "离婚后身份揭晓",
   "隐藏身份/身份揭晓",
   "前任追悔",
   "打脸"
  ],
  "heroine": "隐忍付出的隐藏千金",
  "lead": "冷漠后悔的前夫"
 },
 {
  "title": "The Double Life of a Billionaire Heiress",
  "year": 2024,
  "tags": [
   "heiress",
   "secret identity",
   "divorce",
   "misunderstanding",
   "billionaire/CEO"
  ],
  "evidence": "ReelShort 官方页快照 143.3M–268.7M",
  "source": "https://www.reelshort.com/movie/the-double-life-of-a-billionaire-heiress-662c25c5344cb5014203b23a",
  "verified": true,
  "logline": "婚后三年，CEO丈夫认定妻子是出轨的拜金女；被人下药设计后他赶回家，发现妻子已提出离婚并恢复了亿万继承人身份。",
  "opening": "丈夫怀疑妻子出轨拜金，对她冷嘲热讽。",
  "hooks": [
   "被误会",
   "离婚后身份揭晓",
   "打脸",
   "前任追悔"
  ],
  "heroine": "被误解的隐藏千金",
  "lead": "傲慢多疑、后知后觉的CEO丈夫"
 },
 {
  "title": "We Will Love Again",
  "year": 2024,
  "tags": [
   "rags to riches",
   "second chance",
   "billionaire/CEO",
   "misunderstanding"
  ],
  "evidence": "ReelShort Fandom 称 122.5M；Filmora 榜单列第 1；LootBar 评测",
  "source": "https://www.reelshort.com/fandom/reelshort-billionaire-short-drama-01-20-1a2b555/",
  "verified": false,
  "logline": "穷小子被未婚妻嫌弃'没出息'而分手，数年后他成为科技公司亿万CEO回来想让她后悔，却发现分手背后另有隐情。",
  "opening": "女主突然以男主没有成就为由提出分手。",
  "hooks": [
   "屈辱分手",
   "逆袭归来",
   "被误会",
   "破镜重圆"
  ],
  "heroine": "有苦衷的前未婚妻",
  "lead": "逆袭成功的科技亿万CEO"
 },
 {
  "title": "Move Aside! I'm the Final Boss",
  "year": 2025,
  "tags": [
   "secret identity",
   "war god returns",
   "face-slap",
   "male power fantasy"
  ],
  "evidence": "ReelShort 官方 TikTok 称 100M 播放（未核实）；ReelPulse 2026 榜单第 2（'Kingsley'）",
  "source": "https://www.reelshort.com/movie/move-aside-i-m-the-final-boss-67c24a90717e250f170c4ebc",
  "verified": false,
  "logline": "从战场归来的秘密军团之王、世界首富被青梅竹马当作'小丑'甩掉，随后以真实身份逐一打脸看不起他的人。",
  "opening": "男主刚归来就被青梅竹马当众抛弃。",
  "hooks": [
   "隐藏身份/身份揭晓",
   "公开羞辱/霸凌",
   "打脸"
  ],
  "heroine": "势利的青梅竹马（非女性向主角）",
  "lead": "隐藏身份的战神/首富",
  "note": "男频（战神归来）对照，默认不勾选"
 },
 {
  "title": "The Senator's Son",
  "year": 2025,
  "tags": [
   "college",
   "bully to lover",
   "enemies to lovers",
   "forced proximity",
   "book adaptation"
  ],
  "evidence": "ReelPulse 2026 榜单第 1；ReelShort 搜索页显示 93M（指标不明）；TikTok 大量 'part 1' 搜索词",
  "source": "https://www.reelshort.com/movie/the-senator-s-son-67c01b28b0d6fa52350dea61",
  "verified": false,
  "logline": "想低调读大学的书呆子女主被参议员之子、校园风云人物盯上欺负，两人被困船屋一夜后关系开始转变。",
  "opening": "女主刚入校就被男主当众针对捉弄。",
  "hooks": [
   "恨到爱",
   "被迫共处",
   "公开羞辱/霸凌",
   "前任追悔"
  ],
  "heroine": "低调聪明的书呆子女生",
  "lead": "叛逆嚣张的权贵之子"
 },
 {
  "title": "We Are Never Ever Getting Back Together",
  "year": 2024,
  "tags": [
   "contract marriage",
   "divorce",
   "office romance",
   "comedy",
   "mistaken identity"
  ],
  "evidence": "Backstage 将其列为最能体现形式魅力的竖屏剧之一（罕见喜剧向）；播放数未核实",
  "source": "https://www.backstage.com/magazine/article/best-vertical-series-worth-watching-80065/",
  "verified": true,
  "logline": "与CEO的契约婚姻突然结束后，女主发现自己成了前夫的下属，而前夫根本不知道她长什么样。",
  "opening": "女主的契约婚姻在毫无预警下终止。",
  "hooks": [
   "契约/假结婚/闪婚",
   "身份误认",
   "职场身份差",
   "破镜重圆"
  ],
  "heroine": "乐观机灵的职场女孩",
  "lead": "不知妻子长相的CEO前夫"
 },
 {
  "title": "The Hacker Heiress Strikes Back",
  "year": 2025,
  "tags": [
   "true vs fake heiress",
   "family favoritism",
   "genius skill",
   "revenge"
  ],
  "evidence": "ReelShort 首页 TOP 区约 90.1M",
  "source": "https://www.reelshort.com/movie/the-hacker-heiress-strikes-back-68debeedb1751af04908a55f",
  "verified": true,
  "logline": "天才黑客女主被对手千金诬陷抄袭，家人偏信谎言将她赶出家门，她借全球黑客大赛证明自己并夺回一切。",
  "opening": "女主被诬陷抄袭，随即被家人赶出家门。",
  "hooks": [
   "被冤枉/被陷害",
   "家人偏心/继母继姐打压",
   "技能碾压",
   "打脸"
  ],
  "heroine": "被低估的天才黑客",
  "lead": "欣赏其才华的强者（据推断）"
 },
 {
  "title": "Married a Gardener, Got a Prince",
  "year": 2025,
  "tags": [
   "royalty",
   "secret identity",
   "flash marriage",
   "runaway from arranged marriage"
  ],
  "evidence": "ReelShort 首页 TOP 区约 20.1M（2026 快照）",
  "source": "https://www.reelshort.com/episodes/episode-44-married-a-gardener-got-a-prince-6916da89686e13455b00b9c9-t45mz6q708",
  "verified": true,
  "logline": "为逃避包办婚姻跑到美国的王子自称皇家园丁，与女主闪婚，最后身份揭晓并获得王室接纳。",
  "opening": "女主与自称园丁的陌生男人仓促闪婚。",
  "hooks": [
   "契约/假结婚/闪婚",
   "隐藏身份/身份揭晓",
   "阶层差"
  ],
  "heroine": "脚踏实地的普通女孩",
  "lead": "伪装平民的王子"
 },
 {
  "title": "My Sugar-coated Mafia Boss",
  "year": 2025,
  "tags": [
   "mafia",
   "stolen credit",
   "sweet romance",
   "identity contrast"
  ],
  "evidence": "ReelShort 黑手党列表快照约 85.1M",
  "source": "https://www.reelshort.com/tags/movie-themes/mafia-movies-676d210d4582b53a140819c9",
  "verified": true,
  "logline": "女主救了黑手党老大，功劳却被朋友冒领；阴差阳错之下，这位老大成了她的甜点学徒。",
  "opening": "女主救下受伤的黑手党老大，朋友抢走了救命之恩。",
  "hooks": [
   "救命之恩被冒领",
   "身份反差萌",
   "保护欲强的危险男主"
  ],
  "heroine": "温柔的甜点师",
  "lead": "反差萌的黑手党老大"
 },
 {
  "title": "The Return of My Mafia Husband",
  "year": 2025,
  "tags": [
   "mafia",
   "secret identity",
   "ordinary girl"
  ],
  "evidence": "ReelShort 黑手党列表快照约 74.3M",
  "source": "https://www.reelshort.com/tags/movie-themes/mafia-movies-676d210d4582b53a140819c9",
  "verified": true,
  "logline": "黑手党家族的老大隐瞒身份与普通女孩恋爱，身份终将曝光并把她卷入危险。",
  "opening": "普通女孩与身份神秘的男人开始交往。（据简介推断）",
  "hooks": [
   "隐藏身份/身份揭晓",
   "保护欲强的危险男主",
   "阶层差"
  ],
  "heroine": "普通善良的女孩",
  "lead": "隐藏身份的黑手党老大"
 },
 {
  "title": "The Mafia Boss Happens to Be My Sex Partner",
  "year": 2025,
  "tags": [
   "mafia",
   "loveless marriage",
   "affair",
   "dark romance"
  ],
  "evidence": "ReelShort 黑手党列表快照约 105.6M",
  "source": "https://www.reelshort.com/tags/movie-themes/mafia-movies-676d210d4582b53a140819c9",
  "verified": true,
  "logline": "困在无爱婚姻中的女主与一个危险男人发生关系，后来才发现对方是黑手党老大。",
  "opening": "女主在冷漠婚姻中压抑崩溃，与陌生男人一夜纠缠。（据简介推断）",
  "hooks": [
   "一夜情",
   "被背叛/未婚夫出轨",
   "保护欲强的危险男主",
   "禁忌/危险关系"
  ],
  "heroine": "困在无爱婚姻中的妻子",
  "lead": "危险的黑手党老大"
 },
 {
  "title": "Bound by Vendetta: Sleeping with the Enemy",
  "year": 2023,
  "tags": [
   "mafia",
   "revenge",
   "enemies to lovers",
   "betrayal"
  ],
  "evidence": "多篇第三方文章列为 ReelShort 热门；播放数未核实",
  "source": "https://foxdata.com/kr/blogs/how-reelshort-became-a-great-hit-around-the-globe-especially-the-usa/",
  "verified": false,
  "logline": "女主深爱的男人屠杀了她全家，她又被敌对家族俘获，在复仇与爱情之间挣扎。",
  "opening": "女主发现恋人正是杀害她家人的凶手。",
  "hooks": [
   "被背叛/未婚夫出轨",
   "逆袭复仇",
   "恨到爱",
   "保护欲强的危险男主"
  ],
  "heroine": "背负血仇的复仇者",
  "lead": "敌对家族的危险首领"
 },
 {
  "title": "My Hockey Alpha",
  "year": 2024,
  "tags": [
   "werewolf/alpha",
   "sports/hockey",
   "secret identity",
   "campus"
  ],
  "evidence": "ReelShort 狼人列表带 Trending 标签；播放数未核实",
  "source": "https://www.reelshort.com/tags/movie-identities/werewolf-movies-676d210e4582b53a14081ab3",
  "verified": false,
  "logline": "发誓不再碰冰球运动员的女主被一名冰球明星死缠烂打，而他藏着一个关于狼人的大秘密。",
  "opening": "女主当众宣告拒绝冰球运动员，男主却不打算放弃。",
  "hooks": [
   "隐藏身份/身份揭晓",
   "追求/拉扯",
   "跨类型混搭（体育+狼人）"
  ],
  "heroine": "嘴硬心软的大学女生",
  "lead": "藏着狼人秘密的冰球明星"
 }
];
