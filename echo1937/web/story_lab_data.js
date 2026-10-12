// 由 python -m tools.export_world 从 content/storylab_hooks.json 和 content/hot_titles.json 生成
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
window.HOT = [
 {
  "platform": "ReelShort",
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
  "platform": "ReelShort",
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
  "platform": "ReelShort",
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
  "platform": "ReelShort",
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
  "platform": "ReelShort",
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
  "platform": "ReelShort",
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
  "platform": "ReelShort",
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
  "platform": "ReelShort",
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
  "platform": "ReelShort",
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
  "platform": "ReelShort",
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
  "platform": "ReelShort",
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
  "platform": "ReelShort",
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
  "platform": "ReelShort",
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
  "platform": "ReelShort",
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
  "platform": "ReelShort",
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
  "platform": "ReelShort",
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
  "platform": "ReelShort",
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
  "platform": "ReelShort",
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
  "platform": "ReelShort",
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
  "platform": "ReelShort",
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
  "platform": "ReelShort",
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
  "platform": "ReelShort",
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
  "platform": "ReelShort",
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
  "platform": "ReelShort",
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
  "platform": "ReelShort",
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
  "platform": "ReelShort",
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
  "platform": "ReelShort",
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
  "platform": "ReelShort",
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
  "platform": "ReelShort",
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
  "platform": "ReelShort",
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
  "platform": "ReelShort",
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
  "platform": "ReelShort",
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
  "platform": "ReelShort",
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
 },
 {
  "platform": "ReelShort",
  "title": "The Heiress Blacklisted Her Husband",
  "year": 2025,
  "tags": [
   "Billionaire",
   "Divorce",
   "Hidden Identity",
   "Revenge",
   "Second Chance"
  ],
  "evidence": "ReelShort homepage listing shows ~179.9M views; IMDb Pro lists first episode 2025-01-11 (US); catalog ID dated 2025-01-07.",
  "source": "https://www.reelshort.com/movie/the-heiress-blacklisted-her-husband-677db481a3cc638b8f0d8a59",
  "verified": true,
  "logline": "被丈夫一家长期冷嘲热讽的妻子Giselle其实是隐藏身份的豪门继承人；离婚后她回归本来身份展开反击，前夫这才醒悟自己爱她并拼命挽回。",
  "opening": "受尽夫家羞辱的妻子毅然签下离婚协议，转身恢复豪门千金身份。（据简介推断）",
  "hooks": [
   "隐藏身份/身份揭晓",
   "打脸",
   "前任追悔",
   "公开羞辱/霸凌"
  ],
  "heroine": "隐忍多年的隐藏身份豪门千金",
  "lead": "有眼无珠、离婚后追悔的前夫"
 },
 {
  "platform": "ReelShort",
  "title": "Wrong Marriage, Fated Groom",
  "year": 2025,
  "tags": [
   "Billionaire",
   "CEO",
   "Fake Marriage",
   "Mistaken Identity",
   "Contract Marriage"
  ],
  "evidence": "ReelShort 'Fake Relationship' collection lists ~70.8M views; catalog ID dated 2025-01-20.",
  "source": "https://www.reelshort.com/movie/wrong-marriage-fated-groom-678df4308987856546031790",
  "verified": true,
  "logline": "婚礼当天被未婚夫甩掉的Emily在闺蜜怂恿下答应假结婚，却阴差阳错嫁给了神秘的亿万富翁CEO。",
  "opening": "新娘在婚礼当天被未婚夫当众悔婚。（据简介推断）",
  "hooks": [
   "被背叛/未婚夫出轨",
   "契约/假结婚/闪婚",
   "隐藏身份/身份揭晓",
   "打脸"
  ],
  "heroine": "婚礼上被抛弃的普通女孩",
  "lead": "被错认的神秘亿万富翁CEO"
 },
 {
  "platform": "ReelShort",
  "title": "The Heiress and Her Possessive Bodyguard",
  "year": 2025,
  "tags": [
   "Bodyguard",
   "Heiress",
   "Age Gap",
   "Enemies to Lovers",
   "Possessive"
  ],
  "evidence": "ReelShort 'Age Gap' collection lists ~61M views; catalog ID dated 2025-02-11.",
  "source": "https://www.reelshort.com/movie/the-heiress-and-her-possessive-bodyguard-67aaaffa39850916ba0e14d0",
  "verified": true,
  "logline": "三年前曾从跟踪狂手中救下女继承人的保镖，因误会与她反目；当她再次遭遇威胁，父亲偏偏雇他贴身保护她。",
  "opening": "父亲为她请来的新保镖，竟是三年前不告而别、如今彼此憎恨的那个男人。（据简介推断）",
  "hooks": [
   "保护欲强的危险男主",
   "恨到爱",
   "破镜重圆"
  ],
  "heroine": "骄纵又受威胁的富家继承人",
  "lead": "冷硬占有欲强的贴身保镖"
 },
 {
  "platform": "ReelShort",
  "title": "Kidnapped by the Devil",
  "year": 2025,
  "tags": [
   "Mafia",
   "Arms Dealer",
   "Kidnapping",
   "Dark Romance",
   "Possessive"
  ],
  "evidence": "ReelShort title page shows ~98.4M views and the mafia tag/search page shows ~176.4M (different snapshots); catalog ID dated 2025-04-04.",
  "source": "https://www.reelshort.com/movie/kidnapped-by-the-devil-67f06dbaaaee64943c0b5240",
  "verified": true,
  "logline": "婚礼前夕，冷酷军火商用俄罗斯轮盘考验新娘未婚夫的爱，未婚夫退缩后，他把新娘Mia掳走据为己有。",
  "opening": "未婚夫在生死赌局面前抛下了她，她被\"恶魔\"带走。（据简介推断）",
  "hooks": [
   "保护欲强的危险男主",
   "被背叛/未婚夫出轨",
   "恨到爱"
  ],
  "heroine": "被未婚夫抛弃的准新娘",
  "lead": "冷酷危险的军火商"
 },
 {
  "platform": "ReelShort",
  "title": "Submitting to My Ex's Dad",
  "year": 2025,
  "tags": [
   "Age Gap",
   "Forbidden",
   "One-Night Stand",
   "Steamy",
   "Ex's Father"
  ],
  "evidence": "ReelShort 'Age Gap' collection lists ~162.5M views; catalog ID dated 2025-04-01.",
  "source": "https://www.reelshort.com/movie/submitting-to-my-ex-s-dad-67ec430800e09545a501247d",
  "verified": true,
  "logline": "婚约破裂后，Flora与陌生男人一夜缠绵，事后才发现对方竟是前未婚夫的父亲，而他还藏着危险的秘密。",
  "opening": "被退婚当晚，她与神秘的成熟男人共度一夜。（据简介推断）",
  "hooks": [
   "禁忌关系（前任长辈）",
   "一夜情",
   "被背叛/未婚夫出轨"
  ],
  "heroine": "刚被退婚的年轻女子",
  "lead": "强势成熟、掌控欲强的前任父亲"
 },
 {
  "platform": "ReelShort",
  "title": "I'm In Love With My Brother's Best Friend?!",
  "year": 2025,
  "tags": [
   "Campus",
   "Brother's Best Friend",
   "Cheating Ex",
   "Novel Adaptation",
   "Roommates"
  ],
  "evidence": "ReelShort 'Age Gap' collection lists ~122.8M views; La Razón (Mexico) covered it on 2025-05-14; based on a Tapas novel; catalog ID dated 2025-04-22.",
  "source": "https://www.reelshort.com/movie/i-m-in-love-with-my-brother-s-best-friend-680755cdaf8e465a6c0e8e91",
  "verified": true,
  "logline": "刚和高中男友同居就撞破他出轨的Kaitlyn，只好搬进哥哥公寓，与哥哥那位研究生好友朝夕相处，旧日暗恋重新燃起。",
  "opening": "搬进新公寓的第一天，她就撞见男友劈腿。（据简介推断）",
  "hooks": [
   "被背叛/未婚夫出轨",
   "禁忌关系（哥哥好友）",
   "恨到爱"
  ],
  "heroine": "失恋的大学女生",
  "lead": "哥哥的研究生好友、她的童年暗恋对象"
 },
 {
  "platform": "ReelShort",
  "title": "Pretty Baby",
  "year": 2025,
  "tags": [
   "Billionaire",
   "Single Dad",
   "Fake Engagement",
   "Lost Child",
   "Escort"
  ],
  "evidence": "ReelShort 'Age Gap'/'Fake Relationship' collections list ~60.7–60.8M views; catalog ID dated 2025-04-10.",
  "source": "https://www.reelshort.com/movie/pretty-baby-67f7906c085fd270130b34b6",
  "verified": true,
  "logline": "一位高级陪伴女郎为寻找七年前出生即被夺走的女儿，答应与丧偶亿万富翁假订婚，却发现他的女儿Lily正是自己的亲骨肉。",
  "opening": "她接下假扮富豪未婚妻的工作，只为找回失散七年的女儿。（据简介推断）",
  "hooks": [
   "契约/假结婚/闪婚",
   "萌宝认亲",
   "秘密孩子/隐瞒怀孕"
  ],
  "heroine": "寻女心切的高级陪伴女郎",
  "lead": "丧偶的亿万富翁单亲爸爸"
 },
 {
  "platform": "ReelShort",
  "title": "Secret Surrogate to the Mafia King",
  "year": 2025,
  "tags": [
   "Mafia",
   "Pregnancy",
   "Surrogate",
   "Cheating Boyfriend",
   "Secret Baby"
  ],
  "evidence": "ReelShort mafia tag/listing pages show ~108.4M–173.7M views across snapshots; catalog ID dated 2025-05-15.",
  "source": "https://www.reelshort.com/movie/secret-surrogate-to-the-mafia-king-6825b38d4baea997900af478",
  "verified": true,
  "logline": "为替男友还债去卖卵的大学生Vanessa，因诊所失误怀上了黑手党教父的孩子；被男友背叛后，她决定留下这个孩子。",
  "opening": "诊所的一次失误，让她怀上了黑手党之王的孩子。（据简介推断）",
  "hooks": [
   "秘密孩子/隐瞒怀孕",
   "被背叛/未婚夫出轨",
   "保护欲强的危险男主"
  ],
  "heroine": "被男友拖累的穷学生",
  "lead": "冷酷的黑手党教父"
 },
 {
  "platform": "ReelShort",
  "title": "The Reckoning Takes Flight",
  "year": 2025,
  "tags": [
   "Revenge",
   "Face-Slapping",
   "Plane",
   "Family Drama",
   "Hidden Identity"
  ],
  "evidence": "ReelShort billionaire tag page lists ~189.3M views; IMDb Pro lists first episode 2025-07-08 (US).",
  "source": "https://www.reelshort.com/movie/the-reckoning-takes-flight-6858f98983761bd35a005ddd",
  "verified": true,
  "logline": "腿上打着石膏的Eve飞去参加哥哥婚礼，却在航班上遭恶霸乘客抢座刁难，落地后又被姐姐误认作准新郎的情妇。",
  "opening": "她订的加宽座位被蛮横的乘客当众强占。（据简介推断）",
  "hooks": [
   "公开羞辱/霸凌",
   "打脸",
   "被冤枉/被陷害",
   "隐藏身份/身份揭晓"
  ],
  "heroine": "受伤仍被欺负的低调千金",
  "lead": "（以女主复仇打脸为主线）"
 },
 {
  "platform": "ReelShort",
  "title": "The Billionaire Female CEO from the Trailer Park",
  "year": 2025,
  "tags": [
   "Female CEO",
   "Hidden Identity",
   "Military",
   "Gold Digger Misunderstanding",
   "Face-Slapping"
  ],
  "evidence": "ReelShort billionaire tag page lists ~30.7M views; catalog ID dated 2025-06-23.",
  "source": "https://www.reelshort.com/movie/the-billionaire-female-ceo-from-the-trailer-park-6858fb34698cc855a209fe28",
  "verified": true,
  "logline": "婚礼当天被征召服役的Elise四年后归来，她暗中已是军工巨头的亿万富翁创始人，却被丈夫家人当成拜金女百般羞辱。",
  "opening": "服役四年的她回到小镇，准备给丈夫补办一场婚礼。（据简介推断）",
  "hooks": [
   "隐藏身份/身份揭晓",
   "公开羞辱/霸凌",
   "打脸"
  ],
  "heroine": "拖车公园出身、隐藏身份的女首富",
  "lead": "对她忠诚的创业者丈夫"
 },
 {
  "platform": "ReelShort",
  "title": "Ruthless Mafia Daddy",
  "year": 2025,
  "tags": [
   "Mafia",
   "Pregnancy Mix-up",
   "Single Mom",
   "Secret Baby"
  ],
  "evidence": "ReelShort mafia tag page lists ~59.2M–89.3M views across snapshots; catalog ID dated 2025-09-04.",
  "source": "https://www.reelshort.com/movie/ruthless-mafia-daddy-68b9295a0725da05b40b9799",
  "verified": true,
  "logline": "Ellie因人工受孕出错怀上了黑手党老大Ace的孩子，这个冷血男人得知后执意要夺回自己的骨肉和她。",
  "opening": "一次精子样本调包，让她怀上了黑手党老大的孩子。（据简介推断）",
  "hooks": [
   "秘密孩子/隐瞒怀孕",
   "保护欲强的危险男主",
   "萌宝认亲"
  ],
  "heroine": "意外怀孕的普通女孩",
  "lead": "冷血的黑手党老大"
 },
 {
  "platform": "ReelShort",
  "title": "Mistaken as His Mate: The Luna's Regret",
  "year": 2025,
  "tags": [
   "Werewolf",
   "Luna",
   "Alpha",
   "Revenge",
   "Mistaken Identity"
  ],
  "evidence": "ReelShort Luna tag page lists ~103M views; catalog ID dated 2025-09-04.",
  "source": "https://www.reelshort.com/movie/mistaken-as-his-mate-the-luna-s-regret-68b929384c72c7c64907f813",
  "verified": true,
  "logline": "Alpha的怀孕妹妹Marina来参加嫂子的Luna加冕礼，却被善妒的Luna误认作情妇并害她流产，Marina由此展开复仇。",
  "opening": "她怀着身孕赶来参加加冕礼，却被当成勾引Alpha的流浪狼。（据简介推断）",
  "hooks": [
   "被冤枉/被陷害",
   "公开羞辱/霸凌",
   "打脸",
   "隐藏身份/身份揭晓"
  ],
  "heroine": "被误认为情妇的Alpha之妹",
  "lead": "Alpha Caspian（兄长）与女主的伴侣"
 },
 {
  "platform": "ReelShort",
  "title": "Alpha Mate Unchained",
  "year": 2025,
  "tags": [
   "Werewolf",
   "Alpha King",
   "Fated Mate",
   "Fake Luna",
   "Dark Fantasy"
  ],
  "evidence": "ReelShort Alpha/Werewolf tag pages list ~44M views; catalog ID dated 2025-09-05.",
  "source": "https://www.reelshort.com/full-episodes/alpha-mate-unchained-68bb61123f9c8d053b0d83bc",
  "verified": true,
  "logline": "新任Alpha之王Rowan必须把命定伴侣Mara藏起来，并立一位假Luna当诱饵保她性命，而假Luna却成了Mara最大的威胁。",
  "opening": "新王登基，他命定的伴侣却只能藏身暗处。（据简介推断）",
  "hooks": [
   "保护欲强的危险男主",
   "契约/假结婚/闪婚",
   "真假千金/冒名顶替"
  ],
  "heroine": "被藏起来的命定伴侣",
  "lead": "新任Alpha之王"
 },
 {
  "platform": "ReelShort",
  "title": "I Had a Baby without You",
  "year": 2025,
  "tags": [
   "CEO",
   "Secret Baby",
   "Glow-Up",
   "One-Night Stand",
   "Single Mom"
  ],
  "evidence": "ReelShort listing ~170M and search page ~172.7M views (flash-marriage collection showed ~261.8M, mapping unconfirmed); catalog ID dated 2025-09-04.",
  "source": "https://www.reelshort.com/movie/i-had-a-baby-without-you-68b9292947761f335e0a7b74",
  "verified": true,
  "logline": "丰满的女服务员Scarlett曾救下孤僻CEO Brandon并与他共度一夜，多年后她瘦身蜕变、带着女儿重回他身边，而他浑然不知自己是孩子父亲。",
  "opening": "多年后，她以判若两人的模样再次出现在CEO面前。（据简介推断）",
  "hooks": [
   "秘密孩子/隐瞒怀孕",
   "一夜情",
   "萌宝认亲",
   "隐藏身份/身份揭晓"
  ],
  "heroine": "蜕变归来的单亲妈妈",
  "lead": "孤僻的豪门CEO"
 },
 {
  "platform": "ReelShort",
  "title": "Taming My Bullies",
  "year": 2025,
  "tags": [
   "Campus",
   "Bully Romance",
   "Rich Heirs",
   "Love Triangle",
   "Franchise"
  ],
  "evidence": "ReelShort pages show ~196.6M–225.6M views; spawned Taming My Bullies 2 and 3 (2026); catalog ID dated 2025-09-29.",
  "source": "https://www.reelshort.com/movie/taming-my-bullies-68dadaea23e33857e70a78f9",
  "verified": true,
  "logline": "转学生Emma入学第一天就痛击欺负弱者的校霸Rowan，成了贵族学校\"四大少\"的头号公敌，在恶作剧与对抗中两人渐生情愫。",
  "opening": "开学第一天，她抡起书包砸向了全校最不能惹的富家少爷。（据简介推断）",
  "hooks": [
   "公开羞辱/霸凌",
   "恨到爱",
   "打脸"
  ],
  "heroine": "正义感爆棚的转学女生",
  "lead": "嚣张的贵族学校校霸继承人"
 },
 {
  "platform": "ReelShort",
  "title": "Betrayed Alpha Queen Rises from the Ashes",
  "year": 2025,
  "tags": [
   "Werewolf",
   "Alpha Queen",
   "Betrayal",
   "Revenge",
   "False Accusation"
  ],
  "evidence": "ReelShort listing shows ~85.8M views (fandom post claimed 28M earlier); catalog ID dated 2025-10-09.",
  "source": "https://www.reelshort.com/movie/betrayed-alpha-queen-rises-from-the-ashes-68e811872fbacf89a40a3d79",
  "verified": true,
  "logline": "为伴侣献出白狼之力的Nessa被诬陷出轨，丈夫轻信谗言险些害死她和儿子；浴火归来的她以Alpha女王之姿复仇。",
  "opening": "她为丈夫牺牲了白狼，换来的却是\"不忠\"的指控。（据简介推断）",
  "hooks": [
   "被冤枉/被陷害",
   "前任追悔",
   "打脸",
   "被拒绝的伴侣"
  ],
  "heroine": "涅槃重生的Alpha女王",
  "lead": "轻信谗言、后悔莫及的Alpha丈夫"
 },
 {
  "platform": "ReelShort",
  "title": "Swapped My Ex for His Billionaire Uncle",
  "year": 2025,
  "tags": [
   "Billionaire",
   "Uncle",
   "Cheating Husband",
   "Age Gap",
   "Possessive"
  ],
  "evidence": "ReelShort billionaire tag page lists ~174.1M views; fandom pages discuss a Part 2; catalog ID dated 2025-12-19.",
  "source": "https://www.reelshort.com/full-episodes/swapped-my-ex-for-his-billionaire-uncle-6945b6f11429aa92890398aa",
  "verified": true,
  "logline": "Nina撞破丈夫Evan出轨又遭其暴力后结束婚姻，却被前夫最年轻的亿万富翁小叔Damon盯上，他不肯放她离开。",
  "opening": "她发现丈夫出轨，决定离开这段婚姻。（据简介推断）",
  "hooks": [
   "禁忌关系（前任长辈）",
   "被背叛/未婚夫出轨",
   "保护欲强的危险男主",
   "前任追悔"
  ],
  "heroine": "摆脱渣夫的前妻",
  "lead": "前夫的亿万富翁小叔"
 },
 {
  "platform": "ReelShort",
  "title": "The Woman Starts the War",
  "year": 2025,
  "tags": [
   "Mafia",
   "Nurse",
   "Fake Fiancée",
   "Captive",
   "Dark Romance"
  ],
  "evidence": "La Razón (Mexico) article 2025-08-17 on the series; ReelShort fandom review claims 15M+ views (unaudited).",
  "source": "https://www.razon.com.mx/entretenimiento/2025/08/17/la-mujer-desata-la-guerra-donde-ver-esta-serie-sobre-un-romance-peligroso/",
  "verified": false,
  "logline": "护士Cindy卷入黑帮枪战，冷酷的黑手党继承人Allan宣称她是自己的未婚妻救下她，从此她被困在他的豪宅和家族战争之中。",
  "opening": "一场黑帮枪战中，危险男人一句\"她是我的未婚妻\"救了她的命。（据简介推断）",
  "hooks": [
   "契约/假结婚/闪婚",
   "保护欲强的危险男主",
   "恨到爱"
  ],
  "heroine": "误入黑帮战争的护士",
  "lead": "黑手党暗黑王子",
  "note": "只有上线报道，没有播放量，默认不勾"
 },
 {
  "platform": "ReelShort",
  "title": "The Billionaire and the Baby Trap",
  "year": 2026,
  "tags": [
   "Billionaire",
   "Loveless Marriage",
   "Baby",
   "Divorce",
   "Marriage Pact"
  ],
  "evidence": "ReelShort 'Age Gap' collection lists ~37.1M views; catalog ID dated 2026-02-17.",
  "source": "https://www.reelshort.com/full-episodes/the-billionaire-and-the-baby-trap-6994c7def370c522ef066652",
  "verified": true,
  "logline": "困在无爱婚姻里的Elara只有生下孩子才能离婚，于是与冷淡的亿万富翁丈夫Josh展开一场造人交易，却假戏真做。",
  "opening": "她想离婚，条件却是先给丈夫生个孩子。（据简介推断）",
  "hooks": [
   "契约/假结婚/闪婚",
   "包办联姻",
   "秘密孩子/隐瞒怀孕"
  ],
  "heroine": "想逃离无爱婚姻的妻子",
  "lead": "冷淡的亿万富翁丈夫"
 },
 {
  "platform": "ReelShort",
  "title": "Scandalous",
  "year": 2026,
  "tags": [
   "Book Adaptation",
   "Age Gap",
   "Office Romance",
   "Enemies to Lovers",
   "Single Dad"
  ],
  "evidence": "ReelShort 'Age Gap' collection lists ~163.9M views; adapted from L.J. Shen's novel; catalog ID dated 2026-03-14.",
  "source": "https://www.reelshort.com/movie/scandalous-69b4ca382fa7f9e12b00f674",
  "verified": true,
  "logline": "叛逆的Edie被父亲逼去为死对头、冷酷商人Trent Rexroth工作并充当间谍，两人在敌意中燃起禁忌欲望。",
  "opening": "父亲把她塞进宿敌的公司，命她当卧底。（据简介推断）",
  "hooks": [
   "恨到爱",
   "禁忌关系（父亲宿敌）",
   "年龄差"
  ],
  "heroine": "叛逆的富家女卧底",
  "lead": "冷酷的单亲爸爸商人"
 },
 {
  "platform": "ReelShort",
  "title": "Married The Mafioso I Saved",
  "year": 2026,
  "tags": [
   "Mafia",
   "Flash Marriage",
   "Green Card",
   "Hidden Identity",
   "Betrayal"
  ],
  "evidence": "ReelShort title page shows ~206.9M views (flash-marriage collection snapshot ~366.4M); also titled 'The Thug I Married Turns Out to Be the Boss'; catalog ID dated 2026-03-23.",
  "source": "https://www.reelshort.com/movie/married-the-mafioso-i-saved-69c0a298c87f09a7e10d8ffe",
  "verified": true,
  "logline": "在美国被未婚夫背叛、身份告急的Hannah，与自己曾救下的男人Alex闪婚，没想到这个\"混混\"竟是黑帮大佬。",
  "opening": "未婚夫背叛后，她与曾经救下的陌生男人闪婚。（据简介推断）",
  "hooks": [
   "契约/假结婚/闪婚",
   "隐藏身份/身份揭晓",
   "被背叛/未婚夫出轨",
   "保护欲强的危险男主"
  ],
  "heroine": "为绿卡挣扎的异乡女孩",
  "lead": "隐藏身份的黑手党老大"
 },
 {
  "platform": "ReelShort",
  "title": "My Dark Romeo",
  "year": 2026,
  "tags": [
   "Book Adaptation",
   "Arranged Marriage",
   "Enemies to Lovers",
   "Billionaire",
   "Revenge"
  ],
  "evidence": "ReelShort title page shows ~36.3M views; adapted from Parker S. Huntington & L.J. Shen novel; reviewed by The Eclectic Review (2026-05-06); catalog ID dated 2026-03-23.",
  "source": "https://www.reelshort.com/movie/my-dark-romeo-69c0a362451b1ea26300fc5f",
  "verified": true,
  "logline": "名媛Dallas在社交舞会上被冷血的Romeo Costa毁掉名声，被迫嫁给他后，她决心反过来引诱、征服这个男人。",
  "opening": "她在初入社交界的舞会上当众名誉扫地。（据简介推断）",
  "hooks": [
   "包办联姻",
   "恨到爱",
   "公开羞辱/霸凌"
  ],
  "heroine": "不肯认输的叛逆名媛",
  "lead": "冷酷阴郁的豪门继承人"
 },
 {
  "platform": "ReelShort",
  "title": "Taming My Bullies 2",
  "year": 2026,
  "tags": [
   "Campus",
   "Bully Romance",
   "Sequel",
   "Rich Heirs",
   "Rival Fiancée"
  ],
  "evidence": "ReelShort pages show ~67M–102M views for Part 2 (Part 3 ~50M–77M, released 2026-06-02 per ReelShort fandom); catalog ID dated 2026-04-10.",
  "source": "https://www.reelshort.com/movie/taming-my-bullies-2-69d91b89a61a85c6f30a4e80",
  "verified": true,
  "logline": "Emma与校霸Rowan确定关系后，一位门当户对的女继承人未婚妻突然出现，让她怀疑自己能否融入他的豪门世界。",
  "opening": "她刚和校霸男友走到一起，他的\"未婚妻\"就找上门来。（据简介推断）",
  "hooks": [
   "包办联姻",
   "公开羞辱/霸凌",
   "恨到爱"
  ],
  "heroine": "出身普通的倔强女主",
  "lead": "贵族学校校霸继承人"
 },
 {
  "platform": "ReelShort",
  "title": "The Imperfect Marriage",
  "year": 2026,
  "tags": [
   "Book Adaptation",
   "Ex's Father",
   "Cheating Fiancé",
   "Age Gap",
   "Marriage of Convenience"
  ],
  "evidence": "ReelShort 'Age Gap' collection lists ~38.3M views; adapted from L. Steele's novel (BuzzFeed book-adaptation roundup); catalog ID dated 2026-05-14.",
  "source": "https://www.reelshort.com/movie/the-imperfect-marriage-6a06477801cfe98f60076ded",
  "verified": true,
  "logline": "未婚夫出轨后，女主转身嫁给了他强势的父亲，在这段不完美的婚姻里与新丈夫从交易走向真情。",
  "opening": "被未婚夫背叛的她，决定嫁给他的父亲。（据简介推断）",
  "hooks": [
   "禁忌关系（前任长辈）",
   "被背叛/未婚夫出轨",
   "契约/假结婚/闪婚"
  ],
  "heroine": "遭背叛后反击的准新娘",
  "lead": "强势冷峻的前任父亲"
 },
 {
  "platform": "ReelShort",
  "title": "Alpha Daddy Make Me Yours",
  "year": 2026,
  "tags": [
   "Werewolf",
   "Age Gap",
   "Taboo",
   "Single Dad",
   "Female Adults Only"
  ],
  "evidence": "ReelShort Alpha/Age Gap tag pages list ~35M–35.3M views; ReelShort fandom calls it a 2026 hit; catalog ID dated 2026-05-21.",
  "source": "https://www.reelshort.com/movie/alpha-daddy-make-me-yours-6a0f7cb70736a2e9de0e9c52",
  "verified": true,
  "logline": "年轻的Lyra与成熟强大的Alpha Damon之间产生了禁忌吸引，年龄差与狼族规矩让这段感情充满危险。",
  "opening": "她无法抗拒那个年长又危险的Alpha。（据简介推断）",
  "hooks": [
   "禁忌关系（年长Alpha）",
   "保护欲强的危险男主",
   "年龄差"
  ],
  "heroine": "年轻倔强的狼族少女",
  "lead": "成熟强势的Alpha单亲爸爸"
 },
 {
  "platform": "ReelShort",
  "title": "Caged by His Twisted Love",
  "year": 2026,
  "tags": [
   "Mafia",
   "Childhood Sweethearts",
   "Amnesia",
   "Obsessive",
   "Cliffhanger"
  ],
  "evidence": "No view count found; ReelShort fandom pages promote it and speculate about a Part 2; catalog ID dated 2026-05-28.",
  "source": "https://www.reelshort.com/movie/caged-by-his-twisted-love-6a18bf73a88aedd7ff0e368b",
  "verified": false,
  "logline": "记者Nora以为自己杀死了黑手党老大Luca，他却以亿万投资人身份归来，逼她做他的女人；两人其实是她已遗忘的童年恋人。",
  "opening": "她亲手开枪\"杀死\"的黑手党老大，活着回来找她了。（据简介推断）",
  "hooks": [
   "保护欲强的危险男主",
   "破镜重圆",
   "恨到爱"
  ],
  "heroine": "失忆的女记者",
  "lead": "偏执疯批的黑手党老大"
 },
 {
  "platform": "ReelShort",
  "title": "Things I Wanted to Say",
  "year": 2026,
  "tags": [
   "Book Adaptation",
   "Dark Academia",
   "Boarding School",
   "Enemies to Lovers",
   "Rich Heir"
  ],
  "evidence": "Variety exclusive: ReelShort adapts Monica Murphy's bestselling novel (14,000+ Amazon reviews), premiering 2026-06-30; no view count found (press about release, not performance).",
  "source": "https://variety.com/2026/tv/news/reelshort-monica-murphy-things-i-wanted-to-say-adaptation-1236791081/",
  "verified": false,
  "logline": "在贵族寄宿学校Lancaster Prep，背负秘密的转学女孩与掌控校园的冷酷继承人针锋相对，又无法抗拒彼此。",
  "opening": "她被送进精英寄宿学校，第一眼就撞上了全校最危险的男生。（据简介推断）",
  "hooks": [
   "恨到爱",
   "公开羞辱/霸凌",
   "保护欲强的危险男主"
  ],
  "heroine": "带着秘密的转学女孩",
  "lead": "冷酷傲慢的贵族学校继承人",
  "note": "只有上线报道，没有播放量，默认不勾"
 },
 {
  "platform": "ReelShort",
  "title": "Bound by Duty",
  "year": 2026,
  "tags": [
   "Mafia",
   "Book Adaptation",
   "Franchise",
   "Widow",
   "Marriage of Convenience"
  ],
  "evidence": "Deadline (2026-08) reports ReelShort's third Cora Reilly 'Born in Blood' adaptation, premiering 2026-08-13, following Bound by Honor (282M–423M views); no view count found for this title.",
  "source": "https://deadline.com/2026/08/reelshort-adapts-bound-by-duty-cora-reilly-born-in-blood-1237018397/",
  "verified": false,
  "logline": "年轻寡妇Valentina被家族安排嫁给芝加哥黑手党继承人Dante，两颗受伤的心在利益婚姻里慢慢靠近。",
  "opening": "丧夫不久的她，被许配给芝加哥黑手党的继承人。（据简介推断）",
  "hooks": [
   "包办联姻",
   "契约/假结婚/闪婚",
   "保护欲强的危险男主"
  ],
  "heroine": "渴望被爱的黑手党寡妇",
  "lead": "冷峻克制的芝加哥黑手党继承人",
  "note": "只有上线报道，没有播放量，默认不勾"
 },
 {
  "platform": "ReelShort",
  "title": "Just One Kiss",
  "year": 2026,
  "tags": [
   "Wattpad Adaptation",
   "Best Friend",
   "Billionaire Heir",
   "Deal",
   "Friends to Lovers"
  ],
  "evidence": "ReelShort listings show ~26.9M–27.3M views; based on Emily Jean's Wattpad novel; catalog ID dated 2026-08-02.",
  "source": "https://www.reelshort.com/embed/6a8752ac7c23cb02b40f062b-md4uq8gmvu",
  "verified": true,
  "logline": "Farrah与暗恋多年的青梅竹马、亿万富翁继承人Ethan达成一项交易，一个吻让两人的友情开始失控。",
  "opening": "她向暗恋多年的好友提出了一笔交易。（据简介推断）",
  "hooks": [
   "契约/假结婚/闪婚",
   "青梅竹马/暗恋"
  ],
  "heroine": "暗恋好友多年的女孩",
  "lead": "青梅竹马的亿万富翁继承人"
 },
 {
  "platform": "Netflix",
  "title": "Bridgerton (Season 4)",
  "year": 2026,
  "tags": [
   "period romance",
   "Cinderella",
   "class divide",
   "masquerade",
   "book adaptation"
  ],
  "evidence": "Part 1 debuted No.1 English TV with 39.7M views in 4 days (Top 10 in 91 countries); 100.2M views in Netflix H1 2026 engagement report (No.2 show of the half).",
  "source": "https://www.thewrap.com/media-platforms/tv/bridgerton-season-4-part-1-ratings-netflix/",
  "verified": true,
  "logline": "摄政时期贵族次子在假面舞会上爱上神秘的“银衣女子”，却不知她是被继母当作女佣使唤的私生女；身份悬殊让这段爱情举步维艰。",
  "opening": "假面舞会上，被继母禁足的女佣偷偷换上礼服混入舞池，与贵族公子共舞后在午夜前消失。（据简介推断）",
  "hooks": [
   "隐藏身份/身份揭晓",
   "灰姑娘/阶级差",
   "禁忌关系"
  ],
  "heroine": "被继母虐待、隐瞒身份的私生女女佣",
  "lead": "放荡不羁却深情的贵族次子"
 },
 {
  "platform": "Netflix",
  "title": "His & Hers",
  "year": 2026,
  "tags": [
   "psychological thriller",
   "murder mystery",
   "exes",
   "unreliable narrator",
   "book adaptation"
  ],
  "evidence": "Most-watched Netflix show of H1 2026 with 104M views (ahead of Bridgerton S4), per Netflix What We Watched report as covered by TheWrap.",
  "source": "https://www.thewrap.com/creative-content/tv-shows/netflix-most-watched-movies-shows-first-half-2026-his-and-hers-war-machine/",
  "verified": true,
  "logline": "隐退的女主播被卷入家乡的一桩谋杀案，负责调查的警探恰是她的前夫，两人各自隐瞒的秘密让彼此都成了嫌疑人。",
  "opening": "女主播在家乡发现旧识遇害，而赶到现场的警探正是多年未见的前夫——他看她的眼神充满怀疑。（据简介推断）",
  "hooks": [
   "破镜重圆",
   "被冤枉/被陷害",
   "秘密过去"
  ],
  "heroine": "表面光鲜、藏着过去的女主播",
  "lead": "怀疑她的前夫警探"
 },
 {
  "platform": "Netflix",
  "title": "Wednesday (Season 2)",
  "year": 2025,
  "tags": [
   "teen",
   "gothic",
   "boarding school",
   "mystery",
   "supernatural"
  ],
  "evidence": "No.1 most-watched show in Netflix's H2 2025 engagement report with 124M views; entered Netflix all-time English TV list (No.10) by Sept 2025.",
  "source": "https://www.mediaweek.com.au/netflixs-2025-winners-the-shows-and-movies-that-actually-moved-the-needle",
  "verified": true,
  "logline": "冷面毒舌的哥特少女回到超自然寄宿学院，靠预知能力追查连环阴谋，同时要应对被全校追捧的“名人”身份。",
  "opening": "开学典礼上，她预见到最好的朋友会因她而死，必须在命运兑现前找出真凶。（据简介推断）",
  "hooks": [
   "学院/竞争",
   "特殊能力",
   "孤傲女主"
  ],
  "heroine": "毒舌冷酷、拥有预知力的哥特少女",
  "lead": "多位暧昧对象（狼人室友、学院男生）"
 },
 {
  "platform": "Netflix",
  "title": "Ginny & Georgia (Season 3)",
  "year": 2025,
  "tags": [
   "family drama",
   "teen",
   "mother-daughter",
   "crime secret",
   "love triangle"
  ],
  "evidence": "No.1 English TV with 17.6M views in first 4 days (June 2025); ~2.9B minutes in Nielsen's week, No.1 streaming original; 48.1M views in H1 2025 report.",
  "source": "https://tvline.com/ratings/ginny-and-georgia-nielsen-streaming-ranking-season-3-1235470713/",
  "verified": true,
  "logline": "带着黑历史搬到小镇的年轻妈妈为了保护女儿不惜犯罪；第三季她因谋杀罪被捕受审，女儿在青春期恋爱与母亲的秘密之间撕扯。",
  "opening": "在自己的婚礼上，妈妈当着全镇人的面被警察以谋杀罪名带走。",
  "hooks": [
   "秘密过去",
   "公开羞辱/霸凌",
   "三角恋"
  ],
  "heroine": "聪明叛逆、对母亲又爱又恨的混血少女",
  "lead": "青梅竹马的“坏男孩”邻居"
 },
 {
  "platform": "Netflix",
  "title": "My Life with the Walter Boys (Season 2)",
  "year": 2025,
  "tags": [
   "teen romance",
   "love triangle",
   "ranch",
   "book adaptation",
   "Wattpad origin"
  ],
  "evidence": "No.1 English TV list with 11.8M views in first 4 days (Aug 25–31, 2025), per Netflix Top 10/Variety.",
  "source": "https://www.netflix.com/tudum/articles/top-10-august-25-2025",
  "verified": true,
  "logline": "父母双亡的纽约富家女被送到科罗拉多牧场，与一家十几个男孩同住，夹在两兄弟之间的三角恋越陷越深。",
  "opening": "失去家人的城市女孩拖着行李走进满是男孩的牧场，第一天就被两个兄弟同时盯上。（据简介推断）",
  "hooks": [
   "三角恋",
   "兄弟争夺",
   "寄人篱下"
  ],
  "heroine": "失去父母、完美主义的城市富家女",
  "lead": "叛逆受伤的哥哥 vs 温柔体贴的弟弟"
 },
 {
  "platform": "Netflix",
  "title": "XO, Kitty (Season 3)",
  "year": 2026,
  "tags": [
   "teen romance",
   "K-drama vibes",
   "boarding school in Seoul",
   "bisexual lead",
   "spin-off"
  ],
  "evidence": "Debuted No.1 English TV list with 12.9M views (week of Mar 30, 2026), per Netflix Tudum Top 10.",
  "source": "https://www.whats-on-netflix.com/news/xo-kitty-season-3-viewership-week-1/",
  "verified": true,
  "logline": "热衷当红娘的美国少女在首尔国际学校继续寻找母亲的过去和自己的真爱，在多段暧昧中摇摆。",
  "opening": "她以为远赴首尔能给异地男友惊喜，结果发现对方早已另有恋人。（据简介推断，系列开篇钩子）",
  "hooks": [
   "学院/竞争",
   "三角恋",
   "寻找母亲的秘密"
  ],
  "heroine": "热情冒失的爱情红娘少女",
  "lead": "首尔学院的财阀少爷与多位暧昧对象"
 },
 {
  "platform": "Netflix",
  "title": "Finding Her Edge",
  "year": 2026,
  "tags": [
   "sports romance",
   "figure skating",
   "love triangle",
   "teen",
   "YA book adaptation"
  ],
  "evidence": "Peaked No.3 English TV with 6.7M views (week of Jan 26, 2026), Top 10 in 81 countries; renewed for S2 after week two.",
  "source": "https://www.netflix.com/tudum/articles/top-10-january-26-2026",
  "verified": true,
  "logline": "为了挽救负债累累的家族冰场，花滑少女与富家冰舞选手搭档参赛，却与旧搭档、前任之间纠缠成三角恋。",
  "opening": "家族冰场即将被收走，她只能接受死对头家族少爷递来的搭档合约。（据简介推断）",
  "hooks": [
   "三角恋",
   "契约/假结婚/闪婚",
   "学院/竞争",
   "前任追悔"
  ],
  "heroine": "背负家族债务的花滑少女",
  "lead": "傲慢的富家搭档 vs 深情的前搭档"
 },
 {
  "platform": "Netflix",
  "title": "Nobody Wants This (Season 2)",
  "year": 2025,
  "tags": [
   "romcom",
   "opposites attract",
   "interfaith",
   "adult romance"
  ],
  "evidence": "No.1 English TV with 8.6M views in first 4 days (Oct 20–26, 2025), 9.4M views next week.",
  "source": "https://www.whats-on-netflix.com/news/a-house-of-dynamite-and-nobody-wants-this-season-2-top-netflix-top-10-charts",
  "verified": true,
  "logline": "毒舌的无神论情感播客主持人爱上了帅气的拉比，两人要跨过宗教、家庭和彼此生活方式的巨大鸿沟。",
  "opening": "派对上，大胆的女播客主误把帅气陌生人当猎物，才发现他是一位拉比。（据简介推断）",
  "hooks": [
   "禁忌关系",
   "家族反对",
   "反差萌"
  ],
  "heroine": "嘴毒独立的情感播客主",
  "lead": "温柔虔诚的年轻拉比"
 },
 {
  "platform": "Netflix",
  "title": "The Hunting Wives",
  "year": 2025,
  "tags": [
   "erotic thriller",
   "female obsession",
   "Texas elite",
   "murder",
   "book adaptation"
  ],
  "evidence": "US-only launch, No.3→No.2 English TV (5.2M→5.8M views); Luminate: 2B+ minutes, most-streamed TV in US week of Jul 25–31, 2025; renewed.",
  "source": "https://www.whats-on-netflix.com/news/the-hunting-wives-renewed-for-season-2-as-global-original/",
  "verified": true,
  "logline": "从东海岸搬到东德州的女主被当地富太圈的女王蜂吸引，卷入情欲、枪支和一桩少女命案。",
  "opening": "新邻居的富太太在射击场递给她一把枪，一个危险的邀请从此开始。（据简介推断）",
  "hooks": [
   "危险诱惑",
   "秘密社团",
   "被冤枉/被陷害"
  ],
  "heroine": "想重新开始、渐被诱惑的外来妻子",
  "lead": "操控欲极强的富太圈女王（及其政客丈夫）"
 },
 {
  "platform": "Netflix",
  "title": "My Oxford Year",
  "year": 2025,
  "tags": [
   "romantic drama",
   "tearjerker",
   "study abroad",
   "terminal illness",
   "book adaptation"
  ],
  "evidence": "No.1 English Film with 27.2M views in 2nd week (Aug 4–10, 2025); ~86.1M views in H2 2025 per FlixPatrol aggregation of Netflix report.",
  "source": "https://www.netflix.com/tudum/articles/top-10-august-4-2025",
  "verified": true,
  "logline": "规划好人生的美国学霸到牛津读书，爱上了迷人的英国导师，却发现他隐瞒着一个改变一切的秘密。",
  "opening": "她初到牛津就被一个傲慢帅哥溅了一身水，第二天却发现他是自己的诗歌导师。（据简介推断）",
  "hooks": [
   "隐藏秘密/身份揭晓",
   "师生禁忌",
   "绝症虐恋"
  ],
  "heroine": "目标明确、野心勃勃的美国留学生",
  "lead": "玩世不恭的贵族导师（隐瞒病情）"
 },
 {
  "platform": "Netflix",
  "title": "The Life List",
  "year": 2025,
  "tags": [
   "romantic drama",
   "grief",
   "bucket list",
   "book adaptation"
  ],
  "evidence": "No.1 English Film debut with 24.4M views, then 29.2M in week 2 (Mar 24–Apr 6, 2025), Top 10 in 88 countries.",
  "source": "https://www.whats-on-netflix.com/news/top-10-reports/netflix-top-10-report-sofia-carson-scores-another-hit-with-the-life-list-harlan-coben-streak-continues",
  "verified": true,
  "logline": "母亲去世后，女儿被要求完成自己13岁写下的人生愿望清单才能继承遗产，途中重遇旧爱并结识新人。",
  "opening": "遗嘱宣读时，母亲留给她的不是家族公司，而是一张少女时代的愿望清单。",
  "hooks": [
   "遗嘱条件",
   "三角恋",
   "自我重建"
  ],
  "heroine": "迷失自我的家族女儿",
  "lead": "温柔的律师 vs 过去的恋人"
 },
 {
  "platform": "Netflix",
  "title": "People We Meet on Vacation",
  "year": 2026,
  "tags": [
   "friends to lovers",
   "romcom",
   "Emily Henry",
   "dual timeline",
   "book adaptation"
  ],
  "evidence": "No.1 English Film with 17.2M views (week of Jan 5, 2026), per Netflix Tudum Top 10.",
  "source": "https://www.netflix.com/tudum/articles/top-10-january-5-2026",
  "verified": true,
  "logline": "一对性格相反的好朋友每年夏天一起旅行，直到某次旅行后两年不说话；她决定用最后一次旅行挽回关系。",
  "opening": "两年零联系后，她给他发消息：“再一起去最后一次旅行吧？”（据简介推断）",
  "hooks": [
   "朋友变恋人",
   "破镜重圆",
   "双时间线"
  ],
  "heroine": "外向随性的旅行博主",
  "lead": "内向规矩的中学老师"
 },
 {
  "platform": "Netflix",
  "title": "Can This Love Be Translated?",
  "year": 2026,
  "tags": [
   "K-drama",
   "romcom",
   "celebrity",
   "interpreter",
   "multilingual"
  ],
  "evidence": "No.1 on Netflix Global Non-English TV (Jan 19–25, 2026) with 9M views, Top 10 in 60 countries.",
  "source": "https://sbsstar.net/article/N1008421049/can-this-love-be-translated-starring-kim-seonho-go-younjung-tops-netflixs-global-nonenglish-tv-chart",
  "verified": true,
  "logline": "精通多国语言的口译员被派去为一夜爆红的女明星做翻译，跨国拍摄途中两人在误解和“翻译不出的情感”里相爱。",
  "opening": "冷静的口译员被迫跟随当红女星全球拍摄恋综，第一句翻译就闹出误会。（据简介推断）",
  "hooks": [
   "身份差/顶流恋爱",
   "误会",
   "恨到爱"
  ],
  "heroine": "一夜爆红、性格多面的女明星",
  "lead": "克制完美主义的多语口译员"
 },
 {
  "platform": "Netflix",
  "title": "Boyfriend on Demand",
  "year": 2026,
  "tags": [
   "K-drama",
   "romcom",
   "virtual dating",
   "fantasy",
   "workplace"
  ],
  "evidence": "Rose to No.1 on Netflix Global Non-English TV in week 2 (4.8M views, Top 10 in 47 countries), March 2026.",
  "source": "https://sbsstar.net/article/N1008481898/blackpink-jisoo-captivates-the-world-boyfriend-on-demand-debuts-at-no-1-on-netflixs-nonenglish-global-top-10",
  "verified": true,
  "logline": "被工作榨干的网剧制片人订阅了虚拟恋爱服务，每月可以换一个完美男友，现实中的心动却悄悄出现。",
  "opening": "加班到崩溃的她点开“按需男友”订阅，下一秒理想型就出现在眼前。（据简介推断）",
  "hooks": [
   "幻想满足",
   "职场",
   "三角恋"
  ],
  "heroine": "恋爱空窗、被工作压垮的女制片人",
  "lead": "完美的虚拟男友们 vs 嘴硬的现实同事"
 },
 {
  "platform": "Netflix",
  "title": "Bon Appétit, Your Majesty",
  "year": 2025,
  "tags": [
   "K-drama",
   "time travel",
   "historical",
   "enemies to lovers",
   "tyrant king",
   "webnovel adaptation"
  ],
  "evidence": "Reached No.1 on Netflix Global Non-English TV for two consecutive weeks (Sept 2025) and stayed ~5+ weeks in Top 10, per Variety/CJ ENM.",
  "source": "https://variety.com/2025/tv/news/cj-enm-bon-appetit-your-majesty-netflix-global-chart-1236527637/",
  "verified": true,
  "logline": "法餐女主厨穿越回朝鲜王朝，落入以暴戾著称、味觉挑剔的暴君手中，只能靠厨艺保命并征服他的心。",
  "opening": "刚拿下世界厨艺大奖的她一睁眼就跪在暴君面前，做不出合他口味的菜就要掉脑袋。（据简介推断）",
  "hooks": [
   "重生/回到过去",
   "保护欲强的危险男主",
   "恨到爱"
  ],
  "heroine": "天才法餐女主厨",
  "lead": "喜怒无常、味觉绝对的暴君"
 },
 {
  "platform": "Prime Video",
  "title": "The Summer I Turned Pretty (Season 3)",
  "year": 2025,
  "tags": [
   "teen romance",
   "love triangle",
   "brothers",
   "book adaptation",
   "coming of age"
  ],
  "evidence": "Nielsen: 6.57B minutes over S3 run; Amazon: 70M viewers in 70 days (+65% vs S2), Prime Video's most-watched season ever among women 18–34.",
  "source": "https://www.thewrap.com/the-summer-i-turned-pretty-season-3-viewership-nielsen/",
  "verified": true,
  "logline": "女孩在一对兄弟之间摇摆多年，大学时与弟弟订婚，却始终放不下哥哥；婚礼前后真相与心意全部摊牌。",
  "opening": "她和弟弟宣布订婚，而哥哥站在人群后面一言不发。（据简介推断）",
  "hooks": [
   "三角恋",
   "兄弟争夺",
   "前任追悔",
   "破镜重圆"
  ],
  "heroine": "在兄弟间摇摆的女大学生",
  "lead": "沉默隐忍的哥哥 vs 热烈依赖的弟弟"
 },
 {
  "platform": "Prime Video",
  "title": "Off Campus",
  "year": 2026,
  "tags": [
   "sports romance",
   "hockey",
   "fake dating",
   "college",
   "BookTok adaptation"
  ],
  "evidence": "Amazon: ~36M viewers worldwide in first 12 days, Prime Video's 3rd-biggest series debut; best performance among women 18–34 of any series on the service.",
  "source": "https://www.hollywoodreporter.com/tv/tv-news/off-campus-ratings-prime-video-1236606024/",
  "verified": true,
  "logline": "成绩挂科的冰球队长请音乐系女生补课，她提出交换条件：假装约会让她的暗恋对象吃醋，假戏渐渐成真。",
  "opening": "冰球明星为保住参赛资格求她补课，她冷冷开出条件：“那你得陪我演一场戏。”（据简介推断）",
  "hooks": [
   "契约/假结婚/闪婚",
   "保护欲强的危险男主",
   "创伤疗愈",
   "学院/竞争"
  ],
  "heroine": "有创伤、坚强的音乐系女生",
  "lead": "傲慢又专一的冰球队长"
 },
 {
  "platform": "Prime Video",
  "title": "Maxton Hall – The World Between Us (Season 2)",
  "year": 2025,
  "tags": [
   "German",
   "elite school",
   "class divide",
   "rich heir",
   "book adaptation"
  ],
  "evidence": "Became top series in 42 markets incl. US after Nov 7, 2025 launch (FlixPatrol via Variety); No.2 on Amazon's most-watched non-English originals list (Jan 2025–Jan 2026).",
  "source": "https://www.aol.com/articles/maxton-hall-season-2-soars-120000512.html",
  "verified": true,
  "logline": "靠奖学金进入贵族学校的平民女孩与傲慢的豪门继承人相爱，家族的掌控、背叛和丑闻不断撕裂他们。",
  "opening": "她无意撞见富家女的秘密，校园之王便找上门要用钱封她的口。（据简介推断，系列开篇钩子）",
  "hooks": [
   "学院/竞争",
   "恨到爱",
   "家族反对/包办联姻",
   "被背叛/未婚夫出轨"
  ],
  "heroine": "自尊心强的奖学金学霸",
  "lead": "被家族控制的傲慢豪门继承人"
 },
 {
  "platform": "Prime Video",
  "title": "Our Fault (Culpa Nuestra)",
  "year": 2025,
  "tags": [
   "Spanish",
   "stepsiblings",
   "dark romance",
   "second chance",
   "Wattpad adaptation"
  ],
  "evidence": "No.1 on Amazon's list of most-watched non-English International Originals (Jan 2025–Jan 2026); Culpables trilogy >100M viewers worldwide.",
  "source": "https://www.aboutamazon.com/news/entertainment/culpables-international-originals-viewing-figures-prime-video",
  "verified": true,
  "logline": "分手多年的继兄妹在一场婚礼上重逢，旧情复燃，却面对家族阻挠、新恋人和一路追来的危险。",
  "opening": "分手多年后，她在朋友的婚礼上再次看到了那个曾让她心碎的继兄。（据简介推断）",
  "hooks": [
   "禁忌关系",
   "破镜重圆",
   "保护欲强的危险男主",
   "前任追悔"
  ],
  "heroine": "倔强叛逆的继妹",
  "lead": "危险、霸道的富家继兄"
 },
 {
  "platform": "Prime Video",
  "title": "We Were Liars",
  "year": 2025,
  "tags": [
   "YA mystery",
   "old money",
   "amnesia",
   "summer island",
   "book adaptation"
  ],
  "evidence": "Nielsen Originals chart No.10 with 328M minutes (week of Jun 30–Jul 6, 2025).",
  "source": "https://www.nielsen.com/data-center/top-ten",
  "verified": true,
  "logline": "名门家族的长孙女在私人岛屿上遭遇事故失去记忆，第二年夏天回岛，试图拼凑出家族和恋人隐藏的真相。",
  "opening": "她只记得前一个夏天被发现浑身是伤躺在海边，而所有人都对那晚闭口不谈。（据简介推断）",
  "hooks": [
   "失忆/真相揭晓",
   "豪门家族秘密",
   "禁忌关系"
  ],
  "heroine": "失忆的豪门继承人少女",
  "lead": "被家族看不起的局外人少年"
 },
 {
  "platform": "Max",
  "title": "Heated Rivalry",
  "year": 2025,
  "tags": [
   "sports romance",
   "hockey",
   "rivals to lovers",
   "secret relationship",
   "M/M",
   "book adaptation"
  ],
  "evidence": "HBO Max: most-watched scripted acquired series in its history, 10.6M+ US viewers (later ~11.5M); Crave's biggest original debut; renewed.",
  "source": "https://www.thewrap.com/media-platforms/tv/heated-rivalry-viewership-hbo-max-post-finale/",
  "verified": true,
  "logline": "两支死敌球队的冰球巨星多年来秘密幽会，在聚光灯和职业生涯的压力下，竞争对手关系慢慢变成不敢公开的爱情。",
  "opening": "赛场上互撞的两个对手，赛后在同一间酒店房间里关上了门。（据简介推断）",
  "hooks": [
   "恨到爱",
   "秘密恋情",
   "禁忌关系"
  ],
  "heroine": "（双男主）谨慎完美的加拿大球星",
  "lead": "张扬危险的俄罗斯球星"
 },
 {
  "platform": "Hulu",
  "title": "Tell Me Lies (Season 3)",
  "year": 2026,
  "tags": [
   "toxic romance",
   "college",
   "psychological",
   "manipulation",
   "book adaptation"
  ],
  "evidence": "Disney: ~5M global views in first 7 days (+150% vs S1 premiere); finale 3.5M views in day one, ~70% above S3 premiere.",
  "source": "https://www.thewrap.com/creative-content/tv-shows/tell-me-lies-series-finale-viewership-ratings-hulu/",
  "verified": true,
  "logline": "大学女生陷入与一个操控型男生的上瘾式关系，谎言、背叛和一桩死亡事件的秘密层层反噬所有人。",
  "opening": "她明知他是危险的骗子，却在又一次深夜短信后再次回到他身边。（据简介推断）",
  "hooks": [
   "有毒恋情/上瘾",
   "被背叛/未婚夫出轨",
   "秘密过去"
  ],
  "heroine": "敏感、渴望被爱的女大学生",
  "lead": "魅力十足的操控型渣男"
 },
 {
  "platform": "Hulu",
  "title": "All's Fair",
  "year": 2025,
  "tags": [
   "female ensemble",
   "divorce lawyers",
   "glam",
   "revenge",
   "Ryan Murphy"
  ],
  "evidence": "3.2M global views in first 3 days, Hulu's biggest scripted debut in ~3 years (Deadline via TheWrap); renewed despite ~0–5% RT score.",
  "source": "https://www.thewrap.com/alls-fair-ratings-viewership-hulu-kim-kardashian-ryan-murphy/",
  "verified": true,
  "logline": "一群女律师离开男性主导的律所自立门户，专打富豪离婚案，在奢华与背叛中替女人夺回一切。",
  "opening": "她们被男上司当众羞辱后集体辞职，十年后成了全洛杉矶男人最怕的离婚律师。（据简介推断）",
  "hooks": [
   "打脸",
   "被背叛/未婚夫出轨",
   "恶女逆袭"
  ],
  "heroine": "精明强悍的女离婚律师",
  "lead": "（群像）被她们打败的富豪丈夫们"
 },
 {
  "platform": "Hulu",
  "title": "The Testaments",
  "year": 2026,
  "tags": [
   "dystopian",
   "teen girls",
   "Handmaid's Tale sequel",
   "rebellion",
   "book adaptation"
  ],
  "evidence": "Hulu: 11M hours in first 8 days, viewing up 76% by ep 8; 45M+ hours globally on Hulu/Disney+ by May 2026; renewed.",
  "source": "https://whatsondisneyplus.com/hulus-the-testaments-renewed-for-a-second-season/",
  "verified": true,
  "logline": "基列国精英家庭的少女在为包办婚姻做准备的学校里长大，逐渐发现自己的身世和这个体制的真相，走上反抗之路。",
  "opening": "她被告知自己即将被许配给一位位高权重的大主教，而她才十几岁。（据简介推断）",
  "hooks": [
   "包办联姻",
   "身份揭晓",
   "学院/竞争"
  ],
  "heroine": "被体制培养、逐渐觉醒的少女",
  "lead": "（反派）掌控她命运的权力男性"
 },
 {
  "platform": "Peacock",
  "title": "The Five Star Weekend",
  "year": 2026,
  "tags": [
   "female friendship",
   "grief",
   "secrets",
   "beach read",
   "Elin Hilderbrand adaptation"
  ],
  "evidence": "Peacock's top scripted series ever: 1B+ minutes in week one; ~2.1B minutes (prelim Nielsen); Nielsen Top 5 streaming original in first two weeks; renewed.",
  "source": "https://www.thewrap.com/creative-content/tv-shows/the-five-star-weekend-renewed-season-2-peacock/",
  "verified": true,
  "logline": "丈夫意外去世后，美食博主把人生各阶段最好的闺蜜召集到南塔克特度周末，所有人的秘密在海岛上爆发。",
  "opening": "丈夫葬礼后不久，她给四个互不相识的“最好朋友”发出了同一张邀请函。（据简介推断）",
  "hooks": [
   "丈夫的秘密",
   "被背叛/未婚夫出轨",
   "闺蜜反目"
  ],
  "heroine": "光鲜却孤独的美食网红寡妇",
  "lead": "（群像）各怀秘密的闺蜜与男人们"
 },
 {
  "platform": "Prime Video",
  "title": "The Girlfriend",
  "year": 2025,
  "tags": [
   "psychological thriller",
   "mother vs girlfriend",
   "class",
   "unreliable narrator",
   "book adaptation"
  ],
  "evidence": "Appeared on Prime Video US Top 10 shows list (Sept 12, 2025) per Tom's Guide; no official view count found.",
  "source": "https://www.tomsguide.com/entertainment/prime-video/prime-video-top-10-shows-heres-the-3-im-binge-watching-this-weekend-september-12-2025",
  "verified": false,
  "logline": "完美的伦敦贵妇认定儿子的新女友是图谋家产的骗子，两个女人展开一场谁也不可靠的心理战。",
  "opening": "儿子带回家的平民女友第一次见面就让她直觉不对劲。（据简介推断）",
  "hooks": [
   "婆媳斗/阶级差",
   "被冤枉/被陷害",
   "不可靠叙述"
  ],
  "heroine": "出身平凡、野心勃勃的年轻女友",
  "lead": "被母亲控制的富家儿子"
 },
 {
  "platform": "Film (theatrical, Warner Bros.)",
  "title": "Wuthering Heights",
  "year": 2026,
  "tags": [
   "dark romance",
   "gothic",
   "period",
   "classic adaptation",
   "obsession"
  ],
  "evidence": "No.1 North American opening $34.8M (3-day), $83M global debut; PostTrak: 76% of opening audience women (AP/Variety).",
  "source": "https://www.ctvnews.ca/entertainment/article/powered-by-women-wuthering-heights-digs-up-us348-million-at-the-box-office-for-a-no-1-debut/",
  "verified": true,
  "logline": "荒原庄园里的大小姐与被收养的野孩子相爱，她却为了地位嫁给富家子，被抛弃的男人归来展开一生的报复。",
  "opening": "她亲口说嫁给他会“降低身份”，被门外的他听见——他当夜消失，多年后衣锦还乡。（据原著情节推断）",
  "hooks": [
   "禁忌关系",
   "前任追悔",
   "复仇",
   "阶级差"
  ],
  "heroine": "任性炽烈的庄园大小姐",
  "lead": "被羞辱后归来复仇的危险男人"
 },
 {
  "platform": "Book",
  "title": "Onyx Storm (The Empyrean #3) – Rebecca Yarros",
  "year": 2025,
  "tags": [
   "romantasy",
   "dragon academy",
   "war",
   "enemies to lovers sequel"
  ],
  "evidence": "Circana BookScan: 1,288,300 hardcovers first week — fastest-selling adult title since BookScan began (2004); ~1.7M units in 2025, main driver of romance category growth.",
  "source": "https://www.publishersweekly.com/pw/print/20250203/96968-first-week-sales-of-onyx-storm-top-one-million.html",
  "verified": true,
  "logline": "龙骑士学院出身的女主为救变成“黑暗施法者”的恋人和面临灭国危机的王国，踏上寻找盟友的跨海之旅。",
  "opening": "她的恋人正在一点点被黑暗吞噬，而她必须在他完全失控前找到解药。（据简介推断）",
  "hooks": [
   "学院/竞争",
   "保护欲强的危险男主",
   "命定伴侣",
   "禁忌关系"
  ],
  "heroine": "体弱却意志坚定的龙骑士",
  "lead": "被黑暗力量侵蚀的叛军之子"
 },
 {
  "platform": "Book",
  "title": "Alchemised – SenLinYu",
  "year": 2025,
  "tags": [
   "dark romantasy",
   "captor romance",
   "amnesia",
   "war",
   "fanfic origin (Dramione)"
  ],
  "evidence": "Debuted No.1 NYT; ~145K US copies first week (BookScan); publisher reports 1M+ sold; ~19 weeks on list by Feb 2026; Legendary film rights.",
  "source": "https://www.pasadenanow.com/weekendr/a-fanfiction-phenomenon-lands-in-pasadena-senlinyu-brings-alchemised-to-city-of-roses/",
  "verified": true,
  "logline": "战败一方的天才治疗师失去记忆沦为战俘，被送到敌方最可怕的高阶执行官手中，成为他的“实验品”与囚徒。",
  "opening": "失忆的她被铐着送进敌方高官的庄园，他说：从今天起，你属于我。（据简介推断）",
  "hooks": [
   "保护欲强的危险男主",
   "失忆/真相揭晓",
   "恨到爱",
   "禁忌关系"
  ],
  "heroine": "失忆的天才女治疗师（战俘）",
  "lead": "冷酷残忍、暗中深情的敌方高官"
 },
 {
  "platform": "Book",
  "title": "Great Big Beautiful Life – Emily Henry",
  "year": 2025,
  "tags": [
   "romcom",
   "rival writers",
   "mystery",
   "slow burn"
  ],
  "evidence": "Goodreads Choice 2025 Best Romance winner (Henry's 5th straight); on all five major bestseller lists May 2025; No.1 ABA indie romance list.",
  "source": "https://www.goodreads.com/blog/show/3030-meet-the-winners-of-the-2025-goodreads-choice-awards",
  "verified": true,
  "logline": "两位作家被神秘的女富豪召到小岛，争夺为她写传记的机会，在竞争与家族秘密中彼此吸引。",
  "opening": "隐居的传奇女富豪只肯把一生的秘密讲给一个人，而她的对手是个令人火大的普利策作家。（据简介推断）",
  "hooks": [
   "恨到爱",
   "竞争对手",
   "家族秘密"
  ],
  "heroine": "乐观的二线作家",
  "lead": "冷淡沉稳的获奖作家"
 },
 {
  "platform": "Book",
  "title": "The Housemaid – Freida McFadden",
  "year": 2025,
  "tags": [
   "psychological thriller",
   "domestic thriller",
   "rich family",
   "twist",
   "film adaptation"
  ],
  "evidence": "Sourcebooks: 3 of top-20 bestselling books of 2025, 6M+ print units; 107 weeks on NYT list (Dec 2025); Lionsgate film (Dec 19, 2025) ~$305M+ worldwide.",
  "source": "https://www.publishersweekly.com/pw/by-topic/columns/book-deals/article/99413-freida-mcfadden-re-ups-with-sourcebooks.html",
  "verified": true,
  "logline": "刚出狱的女孩到豪宅当住家女佣，女主人喜怒无常、男主人温柔体贴，她很快发现阁楼房间的门锁装在外面。",
  "opening": "她拿到了梦寐以求的女佣工作，却发现自己的房间只能从外面上锁。",
  "hooks": [
   "隐藏身份/身份揭晓",
   "被冤枉/被陷害",
   "反转复仇"
  ],
  "heroine": "有前科、急需翻身的年轻女佣",
  "lead": "表面完美的富豪男主人"
 },
 {
  "platform": "Book",
  "title": "Heated Rivalry – Rachel Reid",
  "year": 2026,
  "tags": [
   "sports romance",
   "hockey",
   "rivals to lovers",
   "M/M",
   "TV tie-in"
  ],
  "evidence": "Circana: unit sales up ~1,000% after the TV premiere; ~23K copies, No.7 on BookScan overall (week ending Jan 10, 2026); on all five major lists; topped first UK BookTok monthly list (Mar 2026).",
  "source": "https://www.publishersweekly.com/pw/by-topic/industry-news/page-to-screen/article/99467-rachel-reid-s-heated-rivalry-is-feeling-the-love.html",
  "verified": true,
  "logline": "两位冰球联盟的顶级对手从秘密的身体关系开始，十年间偷偷相爱，最终必须决定是否公开。",
  "opening": "新秀赛季第一次交手后，宿敌在电梯里塞给他一张写着房号的纸条。（据简介推断）",
  "hooks": [
   "恨到爱",
   "秘密恋情",
   "禁忌关系"
  ],
  "heroine": "（双男主）低调温柔的天才球员",
  "lead": "张扬毒舌的宿敌球星"
 },
 {
  "platform": "Book",
  "title": "King of Envy (Kings of Sin #5) – Ana Huang",
  "year": 2025,
  "tags": [
   "billionaire",
   "forbidden love",
   "fiancé's best friend",
   "dark romance",
   "love triangle"
  ],
  "evidence": "Went straight to No.1 on UK Top 50 (NielsenIQ BookScan), 19,550 copies first week (+32% vs prior book).",
  "source": "https://www.thebookseller.com/bestsellers/the-envy-of-all-others-ana-huang-is-crowned-number-one",
  "verified": true,
  "logline": "为摆脱压榨她的经纪公司，超模与好男人订婚；婚礼将近，她却与新郎的伴郎——毁容隐居的亿万富翁——相互吸引。",
  "opening": "婚礼筹备会上，新郎的伴郎第一次见她，就冷冷地说她配不上自己的兄弟。（据简介推断）",
  "hooks": [
   "禁忌关系",
   "三角恋",
   "保护欲强的危险男主",
   "契约/假结婚/闪婚"
  ],
  "heroine": "被经纪公司控制的超模新娘",
  "lead": "毁容、沉默、曾是杀手的亿万富翁伴郎"
 },
 {
  "platform": "Book",
  "title": "Quicksilver (Fae & Alchemy #1) – Callie Hart",
  "year": 2025,
  "tags": [
   "romantasy",
   "fae",
   "enemies to lovers",
   "BookTok self-pub breakout"
  ],
  "evidence": "Marketed as instant #1 NYT bestseller; publisher claims 3M+ series copies; Netflix film in development (publisher/retailer claims, not independently verified).",
  "source": "https://www.hachettebookgroup.com/titles/callie-hart/quicksilver-standard-edition/9781538775790/",
  "verified": false,
  "logline": "沙漠城的小偷少女意外触发禁忌的魔法金属，被拖入精灵王国，与一个嘴毒又危险的精灵战士绑在一起。",
  "opening": "她为了活命偷摸了一把不该碰的剑，下一秒就被传送到冰雪覆盖的精灵国度。（据简介推断）",
  "hooks": [
   "恨到爱",
   "命定伴侣",
   "保护欲强的危险男主"
  ],
  "heroine": "贫民窟出身的倔强女贼",
  "lead": "毒舌高冷的精灵战士"
 },
 {
  "platform": "Book",
  "title": "The Knight and the Moth – Rachel Gillig",
  "year": 2025,
  "tags": [
   "gothic romantasy",
   "prophecy",
   "knight",
   "slow burn"
  ],
  "evidence": "Publisher markets it as instant #1 NYT bestseller (May 2025); exact list data not independently confirmed.",
  "source": "https://www.hachettebookgroup.com/titles/rachel-gillig/the-knight-and-the-moth/9780316573757/",
  "verified": false,
  "logline": "能预知未来的修道院“占梦者”少女在同伴接连失踪后，被迫与一位她唯一看不透未来的骑士踏上寻真之旅。",
  "opening": "同伴一个接一个消失，而唯一愿意帮她的骑士，是她预言中看不到结局的人。（据简介推断）",
  "hooks": [
   "恨到爱",
   "命运/预言",
   "禁忌关系"
  ],
  "heroine": "被囚于修道院的预言少女",
  "lead": "粗鲁忠诚的落魄骑士"
 },
 {
  "platform": "Book",
  "title": "The Boys of Tommen series – Chloe Walsh",
  "year": 2026,
  "tags": [
   "sports romance",
   "rugby",
   "Irish",
   "abuse survivor",
   "BookTok"
  ],
  "evidence": "Placed near top of first UK BookTok monthly bestseller list (March 2026) behind Heated Rivalry; no concrete rank/number found.",
  "source": "https://forreadingaddicts.co.uk/female-authors-dominate-booktok-bestseller-list/",
  "verified": false,
  "logline": "在家暴家庭中挣扎的转学女孩被学校的橄榄球明星注意到，他不顾一切地想保护她。",
  "opening": "转学第一天，她被橄榄球明星一球砸晕，醒来时他守在床边。（据简介推断）",
  "hooks": [
   "保护欲强的危险男主",
   "公开羞辱/霸凌",
   "创伤疗愈"
  ],
  "heroine": "遭受家暴、隐忍的转学女孩",
  "lead": "暴躁深情的橄榄球明星"
 },
 {
  "platform": "WEBTOON",
  "title": "The Remarried Empress",
  "year": 2026,
  "tags": [
   "romance fantasy",
   "divorce",
   "remarriage",
   "palace intrigue",
   "revenge"
  ],
  "evidence": "Webtoon: 2.97B cumulative global views (July 2026); live-action K-drama premieres on Disney+ Nov 4, 2026; teaser 11.7M views.",
  "source": "https://www.animenewsnetwork.com/news/2025-11-14/the-remarried-empress-live-action-series-to-debut-in-2nd-half-of-2026/.231010",
  "verified": true,
  "logline": "完美皇后被皇帝为一个逃奴情人要求离婚，她平静接受，条件是允许她改嫁邻国王子。",
  "opening": "皇帝当众宣布离婚，皇后微笑回应：“我接受，但我要求批准我的再婚。”",
  "hooks": [
   "被背叛/未婚夫出轨",
   "打脸",
   "前任追悔",
   "包办联姻"
  ],
  "heroine": "冷静端庄、被背叛的皇后",
  "lead": "深情腹黑的邻国王子"
 },
 {
  "platform": "WEBTOON",
  "title": "Maybe Meant to Be",
  "year": 2026,
  "tags": [
   "contract marriage",
   "childhood friends",
   "slice of life",
   "adult romance",
   "short drama"
  ],
  "evidence": "Source webcomic 650M+ global views; WEBTOON chose it to lead its live-action Short Drama slate (Aug 2026).",
  "source": "https://www.theouterhaven.net/webtoon-entertainment-debuts-short-dramas/",
  "verified": true,
  "logline": "被父母催婚的32岁失业女与同样被催婚的青梅竹马一拍即合，签下假结婚协议，慢慢动了真心。",
  "opening": "又一次被催婚后，她脱口而出：“不如我们俩结婚吧？”而他答应了。",
  "hooks": [
   "契约/假结婚/闪婚",
   "青梅竹马",
   "慢热"
  ],
  "heroine": "被催婚的大龄失业女",
  "lead": "沉稳温柔的青梅竹马"
 },
 {
  "platform": "WEBTOON",
  "title": "Love Bites",
  "year": 2026,
  "tags": [
   "paranormal romance",
   "vampire",
   "Wattpad adaptation",
   "short drama"
  ],
  "evidence": "Webcomic/web-novel source 146M+ global views; part of WEBTOON's six live-action Short Drama launch (Aug 17, 2026).",
  "source": "https://senalnews.com/en/content/webtoon-entertainment-expands-into-microdramas-with-six-adaptations-of-hit-webcomics",
  "verified": true,
  "logline": "普通女孩与危险的吸血鬼产生羁绊，在人类与夜族的规则之间展开禁忌之恋。（据简介推断）",
  "opening": "她在深夜救下一个受伤的陌生男人，却发现他的伤口在眼前愈合。（据简介推断）",
  "hooks": [
   "禁忌关系",
   "保护欲强的危险男主",
   "命定伴侣"
  ],
  "heroine": "普通的人类女孩",
  "lead": "危险的吸血鬼男主"
 },
 {
  "platform": "Tapas",
  "title": "Villains Are Destined to Die",
  "year": 2026,
  "tags": [
   "villainess",
   "otome isekai",
   "transmigration",
   "romance fantasy",
   "survival"
  ],
  "evidence": "Main story ended Aug 2026 (ch. 214); TV anime announced Aug 9, 2026; webtoon 14.8M views / 1.5M likes; Piccoma Award 2026 SMARTOON winner.",
  "source": "https://animecorner.me/villains-are-destined-to-die-webtoon-tv-anime-adaptation-announced-as-main-story-ends/",
  "verified": true,
  "logline": "女大学生穿进乙女游戏，成了注定被所有男主杀死的假千金恶女，只能在好感度系统中挣扎求生。",
  "opening": "她睁眼成了公爵家人人厌恶的养女，头顶浮现的好感度一旦归零她就会死。",
  "hooks": [
   "恶女逆袭",
   "重生/回到过去",
   "隐藏身份/身份揭晓",
   "公开羞辱/霸凌"
  ],
  "heroine": "被全家厌弃的假千金恶女",
  "lead": "多位危险男主（公爵之子、奴隶骑士、皇太子等）"
 },
 {
  "platform": "WEBTOON",
  "title": "Marry My Husband",
  "year": 2025,
  "tags": [
   "revenge",
   "regression",
   "cheating husband",
   "best friend betrayal",
   "K-drama/J-drama adaptation"
  ],
  "evidence": "Naver: 810M cumulative views across 9 languages; Korean drama (2024) topped Prime Video TV in 67 countries; Japanese remake on Prime Video premiered June 27, 2025 and hit No.1 in Japan (ANN/FlixPatrol).",
  "source": "https://www.koreajoongangdaily.com/business/overseas-audiences-fall-for-marry-my-husband-webtoon/10916198",
  "verified": true,
  "logline": "身患绝症的女人发现丈夫与闺蜜出轨并被丈夫杀害，醒来回到十年前，决定把“渣男”嫁给闺蜜，夺回自己的人生。",
  "opening": "她死在撞破丈夫与闺蜜偷情的那一晚，再睁眼已回到十年前订婚之前。",
  "hooks": [
   "重生/回到过去",
   "被背叛/未婚夫出轨",
   "打脸",
   "恶女逆袭"
  ],
  "heroine": "被丈夫和闺蜜害死后重生的上班族",
  "lead": "重生后的冷面上司（守护者）"
 },
 {
  "platform": "WEBTOON",
  "title": "SubZero",
  "year": 2025,
  "tags": [
   "dragon fantasy",
   "enemies to lovers",
   "arranged marriage",
   "political romance"
  ],
  "evidence": "WEBTOON Original with 3.1M subscribers and ~400M views (ICv2 interview; figures likely 2024, series ongoing).",
  "source": "https://icv2.com/articles/news/view/57083/icv2-interview-subzero-webtoon-creator-junepurrr",
  "verified": false,
  "logline": "为结束两个龙族部落的战争，冰之部族的公主被迫嫁给敌族的火龙王子，在仇恨与吸引中寻求和平。",
  "opening": "战败后，她被作为和亲的筹码送到敌族王子面前。（据简介推断）",
  "hooks": [
   "包办联姻",
   "恨到爱",
   "保护欲强的危险男主"
  ],
  "heroine": "坚韧的冰之部族公主",
  "lead": "冷酷的敌族火龙王子"
 },
 {
  "platform": "DramaBox",
  "title": "Pucked By My Brother's Rival",
  "year": 2025,
  "tags": [
   "sports romance",
   "hockey",
   "brother's best friend/rival",
   "forbidden romance",
   "enemies to lovers"
  ],
  "evidence": "The Ankler (trade press) named it as one of the titles DramaBox used to build a 50M+ global audience; Fangirlish reviewed it in Oct 2025 and recommended watching it on DramaBox (fan review).",
  "source": "https://theankler.com/p/microdramas-art-hook-audiences-dramabox-disney-accelerator",
  "verified": true,
  "logline": "在冰球训练营实习的女孩爱上了哥哥（球队队长）最痛恨的对手，在兄长的阻挠与赛场暴力中被迫选择站队。",
  "opening": "女主刚到冰球营报到，就撞上哥哥的死敌并当众起冲突（据简介推断）。",
  "hooks": [
   "禁忌关系（哥哥的对手）",
   "恨到爱",
   "保护欲强的危险男主"
  ],
  "heroine": "冰球营实习生、队长的妹妹",
  "lead": "桀骜的冰球明星、哥哥的宿敌"
 },
 {
  "platform": "DramaBox",
  "title": "Fake Dating My Rich Nemesis",
  "year": 2025,
  "tags": [
   "fake dating",
   "enemies to lovers",
   "billionaire",
   "rom-com"
  ],
  "evidence": "Named by The Ankler as a flagship DramaBox title; IMDb lists an episode release date of Aug 13, 2025.",
  "source": "https://theankler.com/p/microdramas-art-hook-audiences-dramabox-disney-accelerator",
  "verified": true,
  "logline": "女主为了应付困境，被迫与一直针锋相对的富家死对头假扮情侣，演着演着假戏成真。",
  "opening": "女主在公开场合被逼到绝境，只能拉来死对头冒充男友（据简介推断）。",
  "hooks": [
   "契约/假结婚/闪婚",
   "恨到爱",
   "打脸"
  ],
  "heroine": "倔强的普通职场女孩",
  "lead": "毒舌多金的死对头富二代"
 },
 {
  "platform": "DramaBox",
  "title": "Divorced Housewife to Billionaire Heiress",
  "year": 2025,
  "tags": [
   "divorce revenge",
   "secret heiress",
   "cheating husband",
   "single mother",
   "billionaire"
  ],
  "evidence": "Covered by Mexican newspaper La Razón (Mar 2025) as a series to watch on DramaBox (75 episodes); IMDb lists first episode Apr 16, 2025, rated 7.7.",
  "source": "https://www.razon.com.mx/entretenimiento/2025/03/12/heredera-multimillonaria-divorciada-donde-ver-el-drama-de-la-joven-que-prefiere-la-cocina-que-la-fortuna/",
  "verified": true,
  "logline": "结婚七周年当天被丈夫离婚、连女儿也被抛弃，丈夫还带小三上门羞辱；其实她是全美首富之女，丈夫的成功全靠她暗中输血。",
  "opening": "七周年纪念日，丈夫把离婚协议和小三一起带回了家。",
  "hooks": [
   "被背叛/未婚夫出轨",
   "隐藏身份/身份揭晓",
   "公开羞辱/霸凌",
   "打脸"
  ],
  "heroine": "隐忍的全职主妇、隐藏的首富千金",
  "lead": "出轨的渣夫（反派）与身份显赫的支持者"
 },
 {
  "platform": "DramaBox",
  "title": "A Deal With My Billionaire Donor",
  "year": 2025,
  "tags": [
   "billionaire",
   "pregnancy",
   "contract",
   "telenovela-style romance"
  ],
  "evidence": "Fangirlish review (Oct 27, 2025) rated it 3.5/5 and praised its above-average production; DramaBox's own review page dated 2025-10-29. Fan/promotional only.",
  "source": "https://fangirlish.com/2025/10/27/vertical-movie-review-a-deal-with-my-billionaire-donor/",
  "verified": false,
  "logline": "女主因求子/生育交易与一位亿万富翁“捐赠者”签下协议，交易关系逐渐变成真情。",
  "opening": "女主发现自己的捐赠者竟是一位亿万富翁，对方提出了新的交易条件（据简介推断）。",
  "hooks": [
   "契约/假结婚/闪婚",
   "秘密孩子/隐瞒怀孕",
   "包办联姻"
  ],
  "heroine": "想要孩子的独立女性",
  "lead": "冷峻的亿万富翁捐赠者"
 },
 {
  "platform": "DramaBox",
  "title": "Kissing the Wrong Brother",
  "year": 2026,
  "tags": [
   "brother's best friend",
   "love triangle",
   "fake lessons",
   "college romance"
  ],
  "evidence": "IMDb lists first episode Jan 14, 2026; Fangirlish review (Jan 18, 2026) confirms it streams on DramaBox. Fan review only.",
  "source": "https://fangirlish.com/2026/01/18/kissing-the-wrong-brother-vertical-series-review-to-this-we-say-girl-get-yours/",
  "verified": false,
  "logline": "女大学生暗恋好友，于是向好友的哥哥求教“恋爱课”，练着练着却分不清自己爱的是谁。",
  "opening": "女主鼓起勇气请暗恋对象的哥哥教她接吻（据简介推断）。",
  "hooks": [
   "禁忌关系（暗恋对象的哥哥）",
   "契约/假结婚/闪婚",
   "恨到爱"
  ],
  "heroine": "青涩的女大学生",
  "lead": "成熟腹黑的“哥哥”"
 },
 {
  "platform": "DramaBox",
  "title": "Revenge Puck",
  "year": 2026,
  "tags": [
   "DramaBox Original",
   "hockey",
   "fake dating",
   "revenge"
  ],
  "evidence": "DramaBox Original reuniting the leads of Pucked By My Brother's Rival; trailer covered by Fangirlish May 31, 2026. Fan/promotional coverage only.",
  "source": "https://fangirlish.com/2026/05/31/see-the-trailer-for-the-dramabox-original-revenge-puck-starring-evan-adams-hannah-lowery/",
  "verified": false,
  "logline": "女主为报复前任，与冰球明星假扮情侣，复仇计划却让两人越陷越深。",
  "opening": "女主撞见前任背叛后，拉住一位冰球明星当场宣布恋爱（据简介推断）。",
  "hooks": [
   "契约/假结婚/闪婚",
   "前任追悔",
   "打脸"
  ],
  "heroine": "被背叛后决心报复的女孩",
  "lead": "冰球明星"
 },
 {
  "platform": "GoodShort",
  "title": "Kidnapped by the Mafia",
  "year": 2025,
  "tags": [
   "mafia",
   "dark romance",
   "captive",
   "possessive hero"
  ],
  "evidence": "GoodShort's own Hot List page shows ~18.3M views (title-to-count pairing inferred from page layout); IMDb lists first episode Jun 26, 2025.",
  "source": "https://www.goodshort.com/channel/Hot-List",
  "verified": true,
  "logline": "女主被黑手党老大“买下”，在囚禁与保护交织中逐渐爱上这个危险的男人。",
  "opening": "女主被当作货物带到黑手党老大面前（据简介推断）。",
  "hooks": [
   "保护欲强的危险男主",
   "恨到爱",
   "契约/假结婚/闪婚"
  ],
  "heroine": "被卖身抵债的无助女孩",
  "lead": "冷酷的黑手党老大"
 },
 {
  "platform": "GoodShort",
  "title": "Uncle Richard Is My Baby Daddy",
  "year": 2025,
  "tags": [
   "rebirth",
   "revenge",
   "cheating husband",
   "age gap",
   "secret pregnancy"
  ],
  "evidence": "GoodShort's own Hot List page shows ~10.5M views (pairing inferred); IMDb lists first episode Apr 4, 2025.",
  "source": "https://www.goodshort.com/channel/Hot-List",
  "verified": true,
  "logline": "女主撞破丈夫与同父异母妹妹的奸情后惨死，重生回到三年前被求婚那天，决定复仇，却怀上了丈夫的叔叔理查德的孩子。",
  "opening": "女主死后睁眼，发现自己回到了渣男单膝跪地求婚的那一刻。",
  "hooks": [
   "禁忌关系（前任长辈）",
   "被背叛/未婚夫出轨",
   "秘密孩子/隐瞒怀孕",
   "真假千金/冒名顶替"
  ],
  "heroine": "重生复仇的前妻",
  "lead": "渣男的叔叔、强势年长的掌权者"
 },
 {
  "platform": "GoodShort",
  "title": "My Gangster Baby Daddy Pampers Me to Paradise",
  "year": 2025,
  "tags": [
   "mafia",
   "one-night stand",
   "secret baby",
   "debt"
  ],
  "evidence": "Low-quality web articles (Dec 2025) claim it is trending on GoodShort and MoboReels; GoodShort interview coverage names it a top title. Unverified.",
  "source": "https://beta.kclibrary.org/tiktoknews-005/my-gangster-baby-daddy-pampers-me-to-paradise.html",
  "verified": false,
  "logline": "父亲赌博欠下巨债，女主一夜意外后怀上了黑帮大佬的孩子，从此被他宠上天。",
  "opening": "女主为替父还债走投无路，一夜之后醒来身边是黑帮大佬（据简介推断）。",
  "hooks": [
   "一夜情",
   "秘密孩子/隐瞒怀孕",
   "保护欲强的危险男主"
  ],
  "heroine": "被父亲赌债拖累的女孩",
  "lead": "宠妻黑帮大佬"
 },
 {
  "platform": "GoodShort",
  "title": "My Werewolf Billionaire Husband",
  "year": 2026,
  "tags": [
   "werewolf",
   "contract marriage",
   "hidden identity",
   "billionaire"
  ],
  "evidence": "GoodShort drama page (posted ~mid 2026); also distributed on NetShort with only a few thousand plays shown. Promotional only.",
  "source": "https://www.goodshort.com/drama/my-werewolf-billionaire-husband-31001677472",
  "verified": false,
  "logline": "兽医克莱尔为救弟弟与一名“木匠”签下一年血契婚约，不知他其实是隐藏身份、坐拥巨富的狼王。",
  "opening": "女主为救弟弟走投无路，签下了一份神秘的一年婚约。",
  "hooks": [
   "契约/假结婚/闪婚",
   "隐藏身份/身份揭晓",
   "打脸"
  ],
  "heroine": "善良的兽医",
  "lead": "伪装成木匠的狼王亿万富翁"
 },
 {
  "platform": "ShortMax",
  "title": "My Heir Was In The Stable",
  "year": 2026,
  "tags": [
   "switched baby",
   "mother revenge",
   "family drama",
   "fraud"
  ],
  "evidence": "ShortMax's own guide page reports ~23.5M total views; released Jun 21, 2026, 30 episodes.",
  "source": "https://www.shorttv.live/fandom/my-heir-was-in-the-stable-full-guide-streaming-options-594",
  "verified": true,
  "logline": "艾拉被骗十年，替仇人养大儿子，而亲生继承人却在马厩里受苦；真相揭开后她夺回孩子并清算仇人。",
  "opening": "女主在马厩里撞见一个与自己长得极像、遍体鳞伤的少年（据简介推断）。",
  "hooks": [
   "真假千金/冒名顶替",
   "萌宝认亲",
   "被冤枉/被陷害",
   "打脸"
  ],
  "heroine": "被欺骗十年的豪门母亲",
  "lead": "无明确男主（母子线为核心）"
 },
 {
  "platform": "ShortMax",
  "title": "The Bride They Rejected Became the Mafia Queen",
  "year": 2026,
  "tags": [
   "rejected bride",
   "mafia",
   "revenge",
   "glow-up return"
  ],
  "evidence": "ShortMax's own guide page: released Jul 22, 2026, 56 episodes, ~113K daily video views.",
  "source": "https://www.shorttv.live/fandom/the-bride-they-rejected-became-the-mafia-queen-full-guide-streaming-options-629",
  "verified": true,
  "logline": "被当众退婚的新娘伊娃八年后以黑手党女王身份归来，向当年羞辱她的人逐一清算。",
  "opening": "婚礼上，新娘被新郎一家当众拒之门外。",
  "hooks": [
   "公开羞辱/霸凌",
   "打脸",
   "前任追悔",
   "隐藏身份/身份揭晓"
  ],
  "heroine": "被退婚后逆袭的黑手党女王",
  "lead": "悔不当初的前未婚夫与黑道新势力"
 },
 {
  "platform": "ShortMax",
  "title": "Reborn to Destroy Him",
  "year": 2026,
  "tags": [
   "werewolf",
   "rebirth",
   "betrayal",
   "revenge",
   "fated mate"
  ],
  "evidence": "ShortMax promotes it as its 'latest werewolf treat' (article dated May 13, 2026); page shows unlabeled counts of 262K/87.4K. Promotional only.",
  "source": "https://www.shorttv.live/fandom/all-about-reborn-to-destroy-him%E2%80%99s-plot-analysis-shortmax%E2%80%99s-latest-werewolf-treat-491",
  "verified": false,
  "logline": "莉奥拉被信任的伴侣背叛、陷害并杀死，重生回到婚礼当天，誓要毁掉他并在第二世找到真爱。",
  "opening": "女主死后重生，睁眼时正穿着婚纱站在要害死她的伴侣面前。",
  "hooks": [
   "被背叛/未婚夫出轨",
   "被冤枉/被陷害",
   "被拒绝的伴侣",
   "打脸"
  ],
  "heroine": "重生复仇的狼族女子",
  "lead": "第二世的真命狼王"
 },
 {
  "platform": "ShortMax",
  "title": "Back With Baby, Ex Regrets Deeply",
  "year": 2026,
  "tags": [
   "secret baby",
   "arranged marriage",
   "billionaire",
   "ex regrets",
   "humiliation"
  ],
  "evidence": "ShortMax promotes it as its 'most enjoyable modern family drama' (guide dated Jun 23, 2026). Promotional only; release year inferred.",
  "source": "https://www.shorttv.live/fandom/spotlight-on-back-with-baby-ex-regrets%E2%80%99s-plot-and-characters-shortmax%E2%80%99s-most-enjoyable-modern-family-drama-441",
  "verified": false,
  "logline": "凡妮莎在民政局被未婚夫甩掉，远嫁海外与亿万富翁联姻；三年后带着儿子回国，前任和小三再度羞辱她，丈夫强势护妻并揭开深藏的爱。",
  "opening": "女主在登记处被未婚夫当场抛弃。",
  "hooks": [
   "前任追悔",
   "包办联姻",
   "萌宝认亲",
   "公开羞辱/霸凌"
  ],
  "heroine": "被抛弃后远嫁的单纯女孩",
  "lead": "暗恋多年的亿万富翁丈夫"
 },
 {
  "platform": "ShortMax",
  "title": "Tie Me Up, My Dom CEO",
  "year": 2025,
  "tags": [
   "billionaire CEO",
   "BDSM",
   "spicy romance",
   "self-discovery"
  ],
  "evidence": "Reviewed by Real Reel (Medium) as a 2025 ShortMax sensual vertical drama; no audience numbers.",
  "source": "https://medium.com/real-reel/vertical-drama-review-tie-me-up-my-dom-ceo-shortmax-53d5ed524ef2",
  "verified": false,
  "logline": "女主误入亿万富翁CEO的秘密地下俱乐部，在一段以同意为前提的支配关系中重新认识自己的欲望。",
  "opening": "女主推开一扇不该推开的门，发现冷面上司的另一重身份（据简介推断）。",
  "hooks": [
   "隐藏身份/身份揭晓",
   "契约/假结婚/闪婚",
   "保护欲强的危险男主"
  ],
  "heroine": "压抑自我的职场女性",
  "lead": "掌控欲极强的CEO"
 },
 {
  "platform": "NetShort",
  "title": "Lucky Wife Spoiled by Diamond Tycoon",
  "year": 2025,
  "tags": [
   "Chinese-dubbed",
   "flash marriage",
   "hidden tycoon",
   "sweet pampering"
  ],
  "evidence": "Insightrackr's April 2025 app report says NetShort heavily promoted this localized Chinese drama and it became a breakout hit after its Jan 2025 release.",
  "source": "https://blog.insightrackr.com/en/docs/Apr25TopShortDrama",
  "verified": true,
  "logline": "平凡女孩闪婚后才发现丈夫是钻石大亨，从此被宠上天并一路打脸看不起她的人。",
  "opening": "女主为应付家里与陌生男人闪婚，却不知对方身价惊人（据简介推断）。",
  "hooks": [
   "契约/假结婚/闪婚",
   "隐藏身份/身份揭晓",
   "打脸"
  ],
  "heroine": "被家人轻视的平凡女孩",
  "lead": "低调隐藏身份的钻石大亨"
 },
 {
  "platform": "NetShort",
  "title": "Evil Bride vs CEO's Secret Mom",
  "year": 2025,
  "tags": [
   "hidden identity",
   "mother-in-law",
   "CEO",
   "humiliation",
   "face-slap"
  ],
  "evidence": "Axis AI Studios blog says NetShort launched it as a viral hit in March 2025. Blog claim, unverified.",
  "source": "https://www.axisaistudios.com/blog/the-complete-list-of-vertical-drama-platforms-in-2026",
  "verified": false,
  "logline": "CEO的母亲隐藏身份接近儿子的未婚妻，被对方百般羞辱后亮明身份当场清算。",
  "opening": "一位衣着朴素的妇人在婚礼前被准新娘当众刁难（据简介推断）。",
  "hooks": [
   "隐藏身份/身份揭晓",
   "公开羞辱/霸凌",
   "打脸"
  ],
  "heroine": "隐藏身份的豪门母亲",
  "lead": "CEO儿子"
 },
 {
  "platform": "NetShort",
  "title": "My Contract CEO Husband Desires Me?",
  "year": 2025,
  "tags": [
   "fake marriage",
   "CEO",
   "paparazzi",
   "slow burn"
  ],
  "evidence": "NetShort hot-series page lists release date 2025-09-11. Promotional only.",
  "source": "https://netshort.com/hotseries/my-contract-ceo-husband-desires-me-1963073502607097857",
  "verified": false,
  "logline": "顶级危机公关克拉拉回国退休，一场狗仔风波让她与霍克集团CEO签下商业假婚，感情却逐渐成真。",
  "opening": "女主刚回国就和CEO一起被狗仔拍到“同框”，绯闻一夜爆炸（据简介推断）。",
  "hooks": [
   "契约/假结婚/闪婚",
   "恨到爱"
  ],
  "heroine": "能力超强的危机公关专家",
  "lead": "冷静克制的集团CEO"
 },
 {
  "platform": "NetShort",
  "title": "Spoil Me, Mr. CEO",
  "year": 2025,
  "tags": [
   "one-night stand",
   "pregnancy",
   "CEO",
   "sweet romance"
  ],
  "evidence": "NetShort hot-series page lists release date 2025-05-31. Promotional only.",
  "source": "https://netshort.com/hotseries/spoil-me-mr-ceo-1927179977328205825",
  "verified": false,
  "logline": "西莉亚与CEO朱利安一夜荒唐后意外怀孕，两人从意外开始走向被宠爱的婚姻。",
  "opening": "一夜之后，女主拿着验孕棒发现自己怀上了CEO的孩子（据简介推断）。",
  "hooks": [
   "一夜情",
   "秘密孩子/隐瞒怀孕",
   "契约/假结婚/闪婚"
  ],
  "heroine": "意外怀孕的普通女孩",
  "lead": "宠妻CEO"
 },
 {
  "platform": "NetShort",
  "title": "Winter Romance at the Grand Hotel",
  "year": 2025,
  "tags": [
   "CEO",
   "pregnant",
   "protective husband",
   "holiday romance"
  ],
  "evidence": "NetShort hot-series page lists release date 2025-01-31, tagged CEO / Pregnant / Protective Husband. Promotional only.",
  "source": "https://netshort.com/hotseries/winter-romance-at-the-grand-hotel-1883524398285422594",
  "verified": false,
  "logline": "冬日大酒店里，怀孕的女主与保护欲极强的CEO展开一段先婚后爱的浪漫故事。",
  "opening": "女主在豪华酒店里被刁难时，一位陌生CEO出手相救（据简介推断）。",
  "hooks": [
   "秘密孩子/隐瞒怀孕",
   "保护欲强的危险男主"
  ],
  "heroine": "孤立无援的孕期女孩",
  "lead": "护妻CEO"
 },
 {
  "platform": "NetShort",
  "title": "The Billionaire's Wet Nurse",
  "year": 2026,
  "tags": [
   "werewolf",
   "alpha",
   "widow",
   "forbidden",
   "spicy"
  ],
  "evidence": "NetShort hot-series page lists release date 2026-07-17. Promotional only.",
  "source": "https://netshort.com/hotseries/the-billionaires-wet-nurse-2077325154945314817",
  "verified": false,
  "logline": "贫寒寡妇贝拉用母乳救下重伤的狼族首领后逃走，后来却以奶娘身份进入了他的庄园。",
  "opening": "寡妇在林中发现奄奄一息的狼族首领，用自己的乳汁救了他。",
  "hooks": [
   "隐藏身份/身份揭晓",
   "保护欲强的危险男主",
   "禁忌关系（主仆）"
  ],
  "heroine": "贫穷的年轻寡妇",
  "lead": "狼族首领、亿万富翁"
 },
 {
  "platform": "DramaWave",
  "title": "Meet My Mafia King on Christmas",
  "year": 2025,
  "tags": [
   "mafia",
   "Christmas",
   "rescue",
   "jealous hero"
  ],
  "evidence": "DramaWave title page; Fangirlish review (Dec 23, 2025) rated it 4/5. Fan review only.",
  "source": "https://fangirlish.com/2025/12/23/meet-my-mafia-king-on-christmas-review-dons-get-jealous-wear-silk-humidity-gets-the-hair-going/",
  "verified": false,
  "logline": "圣诞假期的火车上，女主救下一名流血的黑手党老大，从此被卷入他的世界与占有欲之中。",
  "opening": "火车上，一个浑身是血的男人倒在女主面前。",
  "hooks": [
   "保护欲强的危险男主",
   "隐藏身份/身份揭晓"
  ],
  "heroine": "善良的普通女孩",
  "lead": "占有欲强的黑手党老大"
 },
 {
  "platform": "DramaWave",
  "title": "Marked by My Alpha Stepbrother",
  "year": 2026,
  "tags": [
   "werewolf",
   "stepbrother",
   "rival packs",
   "forbidden"
  ],
  "evidence": "Fangirlish review (Mar 24, 2026) identifies it as a DramaWave vertical; IMDb lists the series. Fan review only.",
  "source": "https://fangirlish.com/2026/03/24/marked-by-my-alpha-stepbrother-review-well-that-was-something/",
  "verified": false,
  "logline": "两个敌对狼族因父母联姻合并，女主被迫与对方的Alpha继承人成为继兄妹，宿敌之间的标记与吸引一触即发。",
  "opening": "父母宣布联姻，女主得知自己的死对头将成为继兄（据简介推断）。",
  "hooks": [
   "禁忌关系（继兄）",
   "恨到爱",
   "包办联姻"
  ],
  "heroine": "敌对狼族的继承人",
  "lead": "高傲的Alpha继兄"
 },
 {
  "platform": "DramaWave",
  "title": "Every Sunday, Run to You",
  "year": 2026,
  "tags": [
   "contract marriage",
   "slow burn",
   "grounded romance"
  ],
  "evidence": "Real Reel review (2026) of a DramaWave vertical starring Chéna Verony and Noah Fearnley. Critic blog only; no numbers.",
  "source": "https://medium.com/real-reel/vertical-drama-review-every-sunday-run-to-you-dramawave-df5f2dbdb77a",
  "verified": false,
  "logline": "一对契约夫妻约定每周日见面，在坦诚沟通而非狗血误会中慢慢走向真爱。",
  "opening": "契约婚姻的第一个周日，两人在约定地点尴尬重逢（据简介推断）。",
  "hooks": [
   "契约/假结婚/闪婚"
  ],
  "heroine": "理性独立的契约妻子",
  "lead": "真诚克制的契约丈夫"
 },
 {
  "platform": "My Drama",
  "title": "The Diamond Rose",
  "year": 2025,
  "tags": [
   "romantic noir",
   "strip club",
   "dancer",
   "dark romance"
  ],
  "evidence": "Creators' Shorty Awards entry claims 20M views in the first 24 hours on My Drama; IMDb lists first episode Jun 21, 2025. Self-reported.",
  "source": "https://shortyawards.com/18th/the-diamond-rose-2",
  "verified": false,
  "logline": "一名芭蕾舞老师坠入脱衣舞俱乐部的诱惑地下世界，在危险的男人与黑暗交易中越陷越深。",
  "opening": "芭蕾舞老师第一次走进霓虹闪烁的俱乐部（据简介推断）。",
  "hooks": [
   "保护欲强的危险男主",
   "隐藏身份/身份揭晓"
  ],
  "heroine": "走投无路的芭蕾舞老师",
  "lead": "俱乐部背后的危险男人"
 },
 {
  "platform": "My Drama",
  "title": "A Queen for the Mafia Kings",
  "year": 2026,
  "tags": [
   "mafia",
   "reverse harem",
   "amnesia",
   "auction",
   "dark romance"
  ],
  "evidence": "My Drama's own series page shows ~6.7M (views) and a 9.78 rating, 90 episodes; Fangirlish review Mar 29, 2026.",
  "source": "https://my-drama.com/series/a-queen-for-the-mafia-kings-f6f1c462-87f3-4d92-8e26-4f22e4c0ece0",
  "verified": true,
  "logline": "失忆的女主被拍卖，被三兄弟黑手党买下，三人对她隐瞒过去，她在追查真相中与他们纠缠。",
  "opening": "女主醒来时失去记忆，正站在拍卖台上。",
  "hooks": [
   "隐藏身份/身份揭晓",
   "保护欲强的危险男主",
   "被冤枉/被陷害"
  ],
  "heroine": "失忆的拍卖品女孩",
  "lead": "三位黑手党兄弟"
 },
 {
  "platform": "My Drama",
  "title": "Billionaire Blackmail",
  "year": 2026,
  "tags": [
   "billionaire boss",
   "office romance",
   "blackmail",
   "Fox Entertainment"
  ],
  "evidence": "One of the first two series FOX Entertainment Studios made for My Drama (deal announced Oct 2025; shooting in Atlanta at that time); My Drama page shows ~1.2M (views), 9.32 rating. Release year inferred as 2026.",
  "source": "https://my-drama.com/series/billionaire-blackmail-dcad7a7b-e9c5-460a-bf80-d86b2677a7c6",
  "verified": true,
  "logline": "女员工被亿万富翁老板抓住把柄后被迫听命于他，勒索关系逐渐演变成危险的办公室恋情。",
  "opening": "女主的秘密被老板握在手里，他提出了一个无法拒绝的条件（据简介推断）。",
  "hooks": [
   "契约/假结婚/闪婚",
   "保护欲强的危险男主",
   "恨到爱"
  ],
  "heroine": "有把柄在身的职场女孩",
  "lead": "冷酷的亿万富翁老板"
 },
 {
  "platform": "My Drama",
  "title": "Falling for the Striker",
  "year": 2026,
  "tags": [
   "sports romance",
   "soccer",
   "second chance",
   "ex as assistant"
  ],
  "evidence": "My Drama listing on Google Play; included in Fangirlish '6 Vertical Dramas We've Enjoyed' (Aug 2026). Fan coverage only.",
  "source": "https://fangirlish.com/2026/08/11/6-vertical-dramas-weve-enjoyed-2-we-would-definitely-pass-on/",
  "verified": false,
  "logline": "足球明星不知情地雇了前女友当助理，旧情与误会在朝夕相处中重新燃起。",
  "opening": "女主上班第一天，才发现新老板竟是当年分手的足球明星前任。",
  "hooks": [
   "破镜重圆",
   "前任追悔"
  ],
  "heroine": "为生计当助理的前女友",
  "lead": "傲慢的足球明星前男友"
 },
 {
  "platform": "My Drama",
  "title": "The Summer In Between",
  "year": 2026,
  "tags": [
   "summer romance",
   "toxic relationship",
   "coming of age",
   "dark twist"
  ],
  "evidence": "Fangirlish review (Jul 19, 2026) praises My Drama for experimenting with format. Fan review only.",
  "source": "https://fangirlish.com/2026/07/19/the-summer-in-between-review-a-different-kind-of-vertical-drama/",
  "verified": false,
  "logline": "外来者艾米丽在一个夏天卷入看似甜蜜的恋情，却逐渐揭开一段黑暗、混乱且有毒的关系。",
  "opening": "艾米丽刚到小镇，就被当地风云人物注意到（据简介推断）。",
  "hooks": [
   "恨到爱",
   "被背叛/未婚夫出轨"
  ],
  "heroine": "格格不入的外来女孩",
  "lead": "迷人又危险的夏日恋人"
 }
];
