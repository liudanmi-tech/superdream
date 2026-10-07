// 由 python -m tools.export_world 从 content/world.json 生成，请改 world.json 后重新导出
window.WORLD = {
 "title": "回声 1937",
 "era": "1937 年，洛杉矶",
 "premise": "你在 1937 年的洛杉矶醒来，住在梅的餐厅楼上。三天前，凡斯片厂的新人女演员莉莉安·格雷在蓝鸟俱乐部散场后失踪。你的工作、你遇到的人，都会把你一点点卷进这桩案子。",
 "style": {
  "bible_zh": "竖屏条漫，干净的线稿，平涂加柔和的阴影，带一点胶片颗粒，不做照片级写实。白天是暖金和薄荷绿，夜晚是深蓝、霓虹粉和琥珀色。装饰艺术风格的几何线条贯穿建筑和家具。汽车、电话、招牌、服饰符合 1930 年代后期，不出现真实品牌。",
  "prompt_en": "vertical webtoon art style, clean confident line art, flat colors with soft cel shading, subtle film grain, Art Deco geometric accents, late-1930s Los Angeles period details, no real brand names, not photorealistic",
  "reference_subjects_en": [
   "a sunny 1937 Los Angeles street corner with Art Deco storefronts, palm trees and period cars, warm gold and mint green daylight, no people",
   "the stage of a 1937 jazz nightclub at night, a lone microphone under a spotlight, deep blue and neon pink with amber lamps, empty tables, no people",
   "a 1937 roadside diner interior in the morning, chrome counter, red booths, coffee pot steaming, warm sunlight, no people",
   "a 1937 film studio makeup room, a row of mirrors framed with light bulbs, brushes and powder tins, afternoon light, no people",
   "a 1937 newspaper newsroom at night, typewriters, stacks of paper, green desk lamps, cigarette smoke haze, no people",
   "the terrace of a 1937 Hollywood hilltop mansion at dusk, city lights below, Art Deco railings, lanterns, no people",
   "Santa Monica pier in evening fog in 1937, wooden boards, lamp posts glowing amber, the sea fading into mist, no people",
   "a full-body portrait of a fictional young woman in a 1937 belted trench coat and cloche hat standing on a rainy street at night, neon reflections, looking over her shoulder"
  ]
 },
 "phases": [
  {
   "id": "dawn",
   "label": "清晨"
  },
  {
   "id": "morning",
   "label": "上午"
  },
  {
   "id": "afternoon",
   "label": "午后"
  },
  {
   "id": "evening",
   "label": "傍晚"
  },
  {
   "id": "night",
   "label": "夜晚"
  },
  {
   "id": "late",
   "label": "深夜"
  }
 ],
 "roles": [
  {
   "id": "singer",
   "label": "俱乐部歌手",
   "intro": "你在蓝鸟俱乐部唱晚场。莉莉安失踪那晚，你是最后几个看见她的人之一。",
   "workplace": "bluebird_stage",
   "outfit_zh": "缎面晚礼服或双排扣礼服西装，复古波浪发或油头，年代首饰",
   "outfit_en": "a 1937 nightclub singer's evening look: a bias-cut satin evening gown in deep emerald with period jewelry, or, if it suits the person better, a sharp double-breasted black tuxedo with a satin lapel; finger-waved or neatly slicked 1930s hair"
  },
  {
   "id": "makeup",
   "label": "片厂化妆师",
   "intro": "你在凡斯片厂的化妆间工作，每天给明星上妆。莉莉安的化妆台就在你旁边，一直没人收拾。",
   "workplace": "studio_makeup",
   "outfit_zh": "高腰阔腿裤配短袖衬衫，或卷袖衬衫配背带；帆布围裙，口袋里插着化妆刷",
   "outfit_en": "a 1937 film studio makeup artist's work clothes: high-waisted wide-leg trousers with a short-sleeved blouse, or a shirt with rolled-up sleeves and suspenders, plus a canvas apron with makeup brushes tucked in the front pocket"
  },
  {
   "id": "reporter",
   "label": "《晨星报》记者",
   "intro": "你是《晨星报》最年轻的记者。主编说莉莉安的案子“没什么可写的”，你不这么认为。",
   "workplace": "newsroom",
   "outfit_zh": "粗花呢套装或西装裙配风衣，软呢帽或钟形帽，帽带里插着记者证",
   "outfit_en": "a 1937 newspaper reporter's outfit: a tweed suit or tweed skirt suit under a belted trench coat, a fedora or cloche hat with a PRESS card tucked into the hatband, a small notebook in hand"
  }
 ],
 "residents": [
  {
   "id": "mae",
   "name": "梅",
   "name_en": "Mae Collins",
   "age": 52,
   "role": "路边餐厅老板，你的房东",
   "personality": "热心、嘴快、什么八卦都知道，但真正的秘密会守住",
   "speech": "叫你“亲爱的”，说话像连珠炮，常拿咖啡壶比划",
   "arc_ch1": "第一天把莉莉安失踪的报纸推到你面前；她知道莉莉安失踪前一周常常一个人来吃早饭",
   "appearance_en": "a sturdy, warm-faced woman in her early fifties, greying auburn hair pinned up under a hairnet, laugh lines, rolled sleeves",
   "outfit_en": "a 1937 diner owner's mint-green waitress dress with a white apron and a pencil behind her ear"
  },
  {
   "id": "eli",
   "name": "伊莱",
   "name_en": "Eli Vance",
   "age": 29,
   "role": "凡斯片厂老板的独子",
   "personality": "风趣、慷慨、习惯被喜欢；对莉莉安的事避而不谈",
   "speech": "说话轻松带笑，喜欢送花和开车兜风",
   "arc_ch1": "接连三次出现在你身边，第三天送来花；第五天开车在散场后等你",
   "appearance_en": "a tall, handsome man of twenty-nine with wavy dark-blond hair, an easy grin and a slightly crooked nose",
   "outfit_en": "an expensive cream linen suit with a silk pocket square, two-tone shoes and a gold wristwatch"
  },
  {
   "id": "cass",
   "name": "卡斯",
   "name_en": "Cass Moreno",
   "age": 31,
   "role": "蓝鸟俱乐部的钢琴师",
   "personality": "安静、敏锐、自尊心强；看见的比说出来的多",
   "speech": "话很少，常用一句玩笑带过真心话",
   "arc_ch1": "莉莉安失踪那晚他也在场；第五天散场后在后门等你，想告诉你一件事",
   "appearance_en": "a lean man of thirty-one with warm brown skin, black curly hair cut short, a thin moustache and long pianist's hands",
   "outfit_en": "a worn but well-pressed black tuxedo with the bow tie loosened and the top button undone"
  },
  {
   "id": "ronan",
   "name": "罗南",
   "name_en": "Ronan Quinn",
   "age": 40,
   "role": "洛杉矶警局警探",
   "personality": "疲惫、固执、不信任有钱人；比看起来更在乎这个案子",
   "speech": "问话直来直去，总在本子上记点什么",
   "arc_ch1": "第四天第一次来问话；上面让他尽快结案，他不肯",
   "appearance_en": "a broad-shouldered man of forty with tired grey eyes, a five-o'clock shadow and close-cropped black hair greying at the temples",
   "outfit_en": "a rumpled charcoal suit, a loosened tie, a brown fedora and a long tan trench coat with a detective's badge clipped to the belt"
  },
  {
   "id": "vivian",
   "name": "薇薇安",
   "name_en": "Vivian Vance",
   "age": 38,
   "role": "凡斯片厂的当红女星，伊莱的继母",
   "personality": "优雅、冷静、精于算计，但对莉莉安有真感情",
   "speech": "说话慢，喜欢用反问；从不正面回答",
   "arc_ch1": "第三天第一次见到你；第六天暗示你“明晚的派对，不要去”",
   "appearance_en": "an elegant woman of thirty-eight with platinum-blonde finger waves, arched brows, red lips and a beauty mark",
   "outfit_en": "a white silk evening gown with a fur stole and long satin gloves"
  }
 ],
 "missing_person": {
  "id": "lillian",
  "name": "莉莉安",
  "name_en": "Lillian Gray",
  "facts": [
   "二十二岁，凡斯片厂新签约的女演员，第一部电影还没上映",
   "三天前的夜里，在蓝鸟俱乐部散场后离开，再也没有回到住处",
   "她的化妆台在凡斯片厂化妆间，也有一张在凡斯家大宅的客房里",
   "化妆台抽屉里藏着一张纸条，第七天才会被发现"
  ],
  "note_text": "“如果我没回来，去码头找第三根灯柱。——L”"
 },
 "places": [
  {
   "id": "apartment",
   "label": "你的公寓",
   "map": [
    0.3,
    0.55
   ],
   "lights": [
    "dawn",
    "evening",
    "late"
   ],
   "desc_en": "a small 1937 rented apartment above a diner: an iron bed, a window over the street, a writing desk, a hot plate and a coffee pot"
  },
  {
   "id": "diner",
   "label": "梅的路边餐厅",
   "map": [
    0.34,
    0.62
   ],
   "lights": [
    "morning",
    "afternoon",
    "night"
   ],
   "desc_en": "a 1937 roadside diner with a chrome counter, red leather booths, a jukebox and a big front window"
  },
  {
   "id": "bluebird_stage",
   "label": "蓝鸟俱乐部·舞台",
   "map": [
    0.55,
    0.42
   ],
   "lights": [
    "rehearsal",
    "show",
    "closing"
   ],
   "desc_en": "the stage and floor of The Bluebird, a 1937 jazz nightclub: a curved stage, a grand piano, small round tables and a long bar"
  },
  {
   "id": "bluebird_backstage",
   "label": "蓝鸟俱乐部·后台",
   "map": [
    0.58,
    0.38
   ],
   "lights": [
    "preshow",
    "show",
    "late"
   ],
   "desc_en": "the cramped backstage of a 1937 nightclub: a dressing table with bulb mirror, costume rack, a door to the alley"
  },
  {
   "id": "studio_makeup",
   "label": "凡斯片厂·化妆间",
   "map": [
    0.2,
    0.3
   ],
   "lights": [
    "morning",
    "afternoon",
    "night"
   ],
   "desc_en": "the makeup room of Vance Studios in 1937: rows of bulb-framed mirrors, swivel chairs, wig stands and powder tins"
  },
  {
   "id": "newsroom",
   "label": "《晨星报》编辑部",
   "map": [
    0.7,
    0.6
   ],
   "lights": [
    "morning",
    "afternoon",
    "overtime"
   ],
   "desc_en": "the newsroom of The Morning Star newspaper in 1937: rows of desks with typewriters, green lamps, a big wall clock"
  },
  {
   "id": "vance_mansion",
   "label": "凡斯家山顶大宅",
   "map": [
    0.15,
    0.15
   ],
   "lights": [
    "dusk",
    "party",
    "small_hours"
   ],
   "desc_en": "the Vance family's Art Deco hilltop mansion in 1937: a grand hall, a ballroom and a terrace over the city lights"
  },
  {
   "id": "pier",
   "label": "圣莫尼卡码头",
   "map": [
    0.85,
    0.8
   ],
   "lights": [
    "day",
    "sunset",
    "fog"
   ],
   "desc_en": "Santa Monica Pier in 1937: wooden boards, iron lamp posts, a carousel building and the Pacific beyond"
  }
 ],
 "poses": [
  {
   "id": "stand",
   "label": "自然站立",
   "ratio": 1.0,
   "prompt_en": "standing naturally, relaxed, arms at the sides, facing three-quarters to the viewer's left"
  },
  {
   "id": "stand_smile",
   "label": "站立微笑",
   "ratio": 1.0,
   "prompt_en": "standing and smiling warmly, one hand resting on the hip, facing three-quarters to the viewer's left"
  },
  {
   "id": "walk",
   "label": "走路",
   "ratio": 1.0,
   "prompt_en": "walking mid-stride toward the viewer's left, side view, arms swinging naturally"
  },
  {
   "id": "wake_stretch",
   "label": "起床伸懒腰",
   "ratio": 1.15,
   "prompt_en": "standing and stretching sleepily with both arms raised above the head, eyes half closed, wearing simple 1930s cotton pajamas instead of the work outfit"
  },
  {
   "id": "coffee",
   "label": "双手捧着咖啡",
   "ratio": 1.0,
   "prompt_en": "standing and holding a white diner coffee mug with both hands near the chest, steam rising, facing three-quarters to the viewer's left"
  },
  {
   "id": "sit_booth",
   "label": "坐在卡座里",
   "ratio": 0.72,
   "prompt_en": "sitting as if on a diner booth bench, knees bent, hands resting on an invisible table edge; do NOT draw the seat or table, only the seated person"
  },
  {
   "id": "sit_stool",
   "label": "坐在吧台高脚凳上",
   "ratio": 0.95,
   "prompt_en": "sitting on a chrome 1930s bar stool, one foot on the stool's footrest, facing three-quarters to the viewer's left; draw the stool"
  },
  {
   "id": "sing",
   "label": "拿着麦克风唱歌",
   "ratio": 1.0,
   "prompt_en": "singing into a 1930s chrome ribbon microphone on a tall stand, one hand on the microphone, eyes half closed"
  },
  {
   "id": "makeup",
   "label": "拿着化妆刷工作",
   "ratio": 1.0,
   "prompt_en": "standing and working with a makeup brush raised in one hand and a powder compact in the other, focused expression, facing three-quarters to the viewer's left"
  },
  {
   "id": "type",
   "label": "在打字机前打字",
   "ratio": 0.75,
   "prompt_en": "sitting on a wooden office chair at a small wooden desk, typing on a 1930s black typewriter; draw the chair, desk and typewriter"
  },
  {
   "id": "newspaper",
   "label": "看报纸",
   "ratio": 1.0,
   "prompt_en": "standing and reading an unfolded 1937 broadsheet newspaper held with both hands, the front page facing the viewer with no legible text"
  },
  {
   "id": "phone",
   "label": "拿着老式电话听筒",
   "ratio": 1.0,
   "prompt_en": "standing and holding a 1930s black candlestick telephone receiver to the ear, the cord hanging down, attentive expression"
  },
  {
   "id": "dance",
   "label": "跳舞",
   "ratio": 1.0,
   "prompt_en": "dancing a 1930s swing step alone, one arm extended as if holding an invisible partner's hand, joyful"
  },
  {
   "id": "hold_note",
   "label": "双手拿着一张纸条",
   "ratio": 1.0,
   "prompt_en": "standing and holding a small folded paper note open with both hands at chest height, looking down at it, tense expression"
  },
  {
   "id": "surprised",
   "label": "吃惊、手捂嘴",
   "ratio": 1.0,
   "prompt_en": "standing, startled, one hand over the mouth, eyes wide, body leaning slightly back"
  },
  {
   "id": "look_back",
   "label": "回头望",
   "ratio": 1.0,
   "prompt_en": "walking away toward the viewer's right while looking back over the shoulder at the viewer"
  }
 ],
 "first_day_poses": [
  "wake_stretch",
  "coffee",
  "newspaper",
  "walk"
 ],
 "chapter1": {
  "title": "第一章 · 化妆台里的纸条",
  "days": [
   {
    "day": 1,
    "must": [
     "在公寓醒来",
     "在餐厅认识梅",
     "报纸上莉莉安失踪的新闻"
    ],
    "decision": {
     "phase": "morning",
     "question": "第一天上班前，要不要绕去看看失踪现场？",
     "options": [
      {
       "id": "go",
       "text": "绕去蓝鸟俱乐部后巷看看",
       "intuition": 0.6
      },
      {
       "id": "skip",
       "text": "按时去上班",
       "intuition": 0.4
      }
     ]
    }
   },
   {
    "day": 2,
    "must": [
     "按身份遇到一位常驻角色：歌手遇到卡斯，化妆师遇到伊莱，记者遇到罗南"
    ],
    "meet_by_role": {
     "singer": "cass",
     "makeup": "eli",
     "reporter": "ronan"
    },
    "decision": {
     "phase": "afternoon",
     "question": "对第一个搭话的人，热情还是冷淡？",
     "options": [
      {
       "id": "warm",
       "text": "热情回应",
       "intuition": 0.55
      },
      {
       "id": "cool",
       "text": "保持距离",
       "intuition": 0.45
      }
     ]
    }
   },
   {
    "day": 3,
    "must": [
     "第一次见到薇薇安",
     "伊莱第三次出现"
    ],
    "decision": {
     "phase": "evening",
     "question": "接不接受伊莱送来的花？",
     "options": [
      {
       "id": "accept",
       "text": "收下花",
       "intuition": 0.5
      },
      {
       "id": "decline",
       "text": "婉拒",
       "intuition": 0.5
      }
     ]
    }
   },
   {
    "day": 4,
    "must": [
     "罗南第一次来问话"
    ],
    "decision": {
     "phase": "afternoon",
     "question": "对警探说实话，还是有所保留？",
     "options": [
      {
       "id": "truth",
       "text": "说出看到的一切",
       "intuition": 0.45
      },
      {
       "id": "hold",
       "text": "留一手",
       "intuition": 0.55
      }
     ]
    }
   },
   {
    "day": 5,
    "must": [
     "卡斯在散场后等你"
    ],
    "decision": {
     "phase": "late",
     "question": "和卡斯走回家，还是上伊莱的车？",
     "options": [
      {
       "id": "cass",
       "text": "和卡斯走回家",
       "intuition": 0.5
      },
      {
       "id": "eli",
       "text": "上伊莱的车",
       "intuition": 0.5
      }
     ]
    }
   },
   {
    "day": 6,
    "must": [
     "派对前的一天",
     "薇薇安暗示你“不要去”"
    ],
    "decision": {
     "phase": "evening",
     "question": "明晚的派对，选哪一件礼服？",
     "options": [
      {
       "id": "red",
       "text": "醒目的红色",
       "intuition": 0.4
      },
      {
       "id": "black",
       "text": "低调的黑色",
       "intuition": 0.6
      }
     ]
    }
   },
   {
    "day": 7,
    "must": [
     "凡斯家的派对",
     "在莉莉安的化妆台里发现纸条"
    ],
    "decision": {
     "phase": "late",
     "question": "纸条交给罗南，还是自己藏起来？",
     "options": [
      {
       "id": "ronan",
       "text": "交给罗南",
       "intuition": 0.5
      },
      {
       "id": "keep",
       "text": "自己藏起来",
       "intuition": 0.5
      }
     ]
    }
   }
  ]
 },
 "content_rules_en": "All characters are adults. Romance stays at hugging, hand-holding and kissing at most. No nudity, no sexual content, no gore. Real-person likenesses are never shown in demeaning or humiliating situations."
};
