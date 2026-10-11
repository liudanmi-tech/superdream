// 由 python -m tools.export_world 从 content/sim.json、story_*.json、agents.json、behaviors.json 生成，请改 content 下的文件后重新导出
window.SIM = {
 "_说明": "第二版（城市模拟）的规则数据，见 docs/sim-design.md。places.*.ambient_en 是各时段画面里的路人；npcs.*.doing_en 是人物在各地点平时在干什么（画背景用）；sub 的 seat: true 表示还在同一个屋子里（人照算、用这个地点的底图），view: true 表示同一个屋子的另一个机位（人照算、有自己的底图）；hotspots 里 sub:<小地点>+<动作> 表示先过去再做；actions.*.pose 是这个动作拼接时用的动作图；extra_poses 是只给模拟页用的动作图；places.*.map 是测试页地图上的位置（0–1）；places.*.hotspots 是画面上能点的东西：find_en 给识别模型找，actions 是点了能做的动作（sub:<id> 表示去小地点）。actions.*.visual_en 是这个动作画成一格时的画面提示。places.*.lights 是每个时段用哪张场景底图（对应 world.json 里的光线）。改完运行 python3 -m tools.export_world 导出到 web/sim_data.js。数值都是初始值，按 web/sim.html 的实测再调。",
 "slots": [
  {
   "id": "dawn",
   "label": "清晨",
   "rounds": 2,
   "hours": "6:00–8:00"
  },
  {
   "id": "morning",
   "label": "上午",
   "rounds": 3,
   "hours": "8:00–12:00"
  },
  {
   "id": "afternoon",
   "label": "午后",
   "rounds": 3,
   "hours": "12:00–17:00"
  },
  {
   "id": "evening",
   "label": "傍晚",
   "rounds": 2,
   "hours": "17:00–19:30"
  },
  {
   "id": "night",
   "label": "夜晚",
   "rounds": 3,
   "hours": "19:30–24:00"
  },
  {
   "id": "late",
   "label": "深夜",
   "rounds": 2,
   "hours": "0:00–3:00"
  }
 ],
 "districts": {
  "home": "住处",
  "downtown": "市中心",
  "hollywood": "好莱坞",
  "santa_monica": "圣莫尼卡"
 },
 "places": {
  "apartment": {
   "map": [
    0.24,
    0.5
   ],
   "lights": {
    "dawn": "dawn",
    "morning": "dawn",
    "afternoon": "evening",
    "evening": "evening",
    "night": "late",
    "late": "late"
   },
   "district": "home",
   "open": [
    "dawn",
    "morning",
    "afternoon",
    "evening",
    "night",
    "late"
   ],
   "actions": [
    "sleep",
    "rest",
    "read_paper",
    "sort_clues",
    "dress_up",
    "look_out",
    "make_coffee",
    "go_sub"
   ],
   "public": false,
   "subs": {
    "bathroom": {
     "label": "卫生间",
     "desc_en": "a tiny 1937 apartment bathroom: white hexagon floor tiles, a pedestal sink under a round mirror, a clawfoot tub, a small frosted window",
     "actions": [
      "wash_up",
      "dress_up",
      "leave_sub"
     ],
     "hotspots": [
      {
       "id": "sink",
       "label": "洗手池",
       "find_en": "the sink or wash basin",
       "actions": [
        "wash_up"
       ]
      },
      {
       "id": "mirror",
       "label": "镜子",
       "find_en": "the mirror",
       "actions": [
        "dress_up"
       ]
      },
      {
       "id": "door",
       "label": "回房间",
       "find_en": "the door",
       "actions": [
        "leave_sub"
       ]
      }
     ]
    }
   },
   "hotspots": [
    {
     "id": "bed",
     "label": "床",
     "find_en": "the bed",
     "actions": [
      "sleep",
      "rest"
     ]
    },
    {
     "id": "desk",
     "label": "桌子",
     "find_en": "the desk, dressing table or vanity",
     "actions": [
      "dress_up",
      "sort_clues",
      "read_paper"
     ]
    },
    {
     "id": "window",
     "label": "窗户",
     "find_en": "the window",
     "actions": [
      "look_out"
     ]
    },
    {
     "id": "door",
     "label": "卫生间",
     "find_en": "a door (to the bathroom)",
     "actions": [
      "sub:bathroom"
     ]
    },
    {
     "id": "coffee",
     "label": "咖啡壶",
     "find_en": "the coffee pot, kettle or hot plate",
     "actions": [
      "make_coffee"
     ]
    }
   ]
  },
  "diner": {
   "map": [
    0.4,
    0.66
   ],
   "lights": {
    "dawn": "morning",
    "morning": "morning",
    "afternoon": "afternoon",
    "evening": "night",
    "night": "night"
   },
   "district": "home",
   "open": [
    "dawn",
    "morning",
    "afternoon",
    "evening",
    "night"
   ],
   "actions": [
    "gossip",
    "eavesdrop",
    "help_out",
    "read_paper",
    "play_jukebox",
    "go_sub"
   ],
   "public": true,
   "ambient_en": {
    "dawn": "only early birds: a milkman and a sleepy mailman eating at the counter",
    "morning": "busy breakfast rush: office workers on the counter stools, a family in a booth",
    "afternoon": "quiet: a policeman reading a paper, two old men playing checkers in a booth",
    "evening": "full and warm: couples in the booths, the jukebox glowing",
    "night": "nearly empty: a tired night-shift waitress in a pink uniform wipes the counter, one trucker hunched over coffee"
   },
   "subs": {
    "booth": {
     "label": "卡座",
     "seat": true,
     "desc_en": "a red vinyl booth by the diner window: a small table with a napkin holder, a menu card, a sugar jar and salt and pepper shakers",
     "actions": [
      "eat",
      "order_coffee",
      "order_pie",
      "read_paper",
      "eavesdrop",
      "leave_sub"
     ],
     "hotspots": [
      {
       "id": "menu",
       "label": "菜单 · 点餐",
       "find_en": "the menu card or the table top",
       "actions": [
        "eat",
        "order_coffee",
        "order_pie"
       ]
      },
      {
       "id": "mae",
       "label": "梅",
       "npc": "mae",
       "find_en": "Mae, the middle-aged diner owner in a mint-green dress and white apron",
       "actions": [
        "person:chat:mae",
        "person:ask:mae",
        "person:flatter:mae"
       ]
      },
      {
       "id": "window",
       "label": "窗外",
       "find_en": "the window",
       "actions": [
        "eavesdrop"
       ]
      },
      {
       "id": "leave",
       "label": "起身",
       "find_en": "the aisle or floor next to the booth",
       "actions": [
        "leave_sub"
       ]
      }
     ]
    },
    "counter": {
     "label": "吧台",
     "seat": true,
     "desc_en": "a stool at the chrome diner counter: a glass pie stand, coffee urns and a milkshake mixer behind it",
     "actions": [
      "eat",
      "order_coffee",
      "order_pie",
      "gossip",
      "help_out",
      "leave_sub"
     ],
     "hotspots": [
      {
       "id": "coffee",
       "label": "咖啡壶",
       "find_en": "the coffee urn or coffee pot",
       "actions": [
        "order_coffee"
       ]
      },
      {
       "id": "pie",
       "label": "派",
       "find_en": "the glass pie stand or a pie",
       "actions": [
        "order_pie",
        "eat"
       ]
      },
      {
       "id": "mae",
       "label": "梅",
       "npc": "mae",
       "find_en": "Mae, the middle-aged diner owner in a mint-green dress and white apron",
       "actions": [
        "person:chat:mae",
        "person:ask:mae",
        "help_out"
       ]
      },
      {
       "id": "regulars",
       "label": "熟客",
       "find_en": "other customers sitting at the counter",
       "actions": [
        "gossip"
       ]
      },
      {
       "id": "leave",
       "label": "起身",
       "find_en": "the floor behind the stools",
       "actions": [
        "leave_sub"
       ]
      }
     ]
    }
   },
   "hotspots": [
    {
     "id": "booth",
     "label": "卡座 · 坐下",
     "find_en": "the red booth seats and their table",
     "actions": [
      "sub:booth"
     ]
    },
    {
     "id": "counter",
     "label": "吧台 · 坐下",
     "find_en": "the counter with its stools",
     "actions": [
      "sub:counter"
     ]
    },
    {
     "id": "mae",
     "label": "梅",
     "npc": "mae",
     "find_en": "Mae, the middle-aged diner owner in a mint-green dress and white apron",
     "actions": [
      "person:chat:mae",
      "person:ask:mae",
      "help_out"
     ]
    },
    {
     "id": "patrons",
     "label": "客人",
     "find_en": "the other customers",
     "actions": [
      "gossip",
      "eavesdrop"
     ]
    },
    {
     "id": "jukebox",
     "label": "点唱机",
     "find_en": "the jukebox",
     "actions": [
      "play_jukebox"
     ]
    }
   ]
  },
  "bluebird_stage": {
   "map": [
    0.5,
    0.4
   ],
   "lights": {
    "afternoon": "rehearsal",
    "evening": "show",
    "night": "show",
    "late": "closing"
   },
   "district": "downtown",
   "open": [
    "afternoon",
    "evening",
    "night",
    "late"
   ],
   "actions": [
    "rehearse",
    "drink",
    "observe",
    "go_sub"
   ],
   "public": true,
   "ambient_en": {
    "afternoon": "rehearsal hours: a janitor sweeping, a trumpet player tuning up, chairs still on some tables",
    "evening": "early crowd: couples at the small round tables, a bartender polishing glasses",
    "night": "packed: smoke haze, couples at every table, waiters in white jackets carrying trays, a few dancing",
    "late": "last guests: a drunk asleep at a table, waiters stacking chairs"
   },
   "subs": {
    "stage": {
     "label": "舞台上",
     "view": true,
     "desc_en": "the Bluebird nightclub stage seen from the dance floor, close: a vintage chrome microphone on a tall stand in a spotlight at center stage, the band's empty chairs and music stands behind, the low front edge of the wooden stage with footlights",
     "actions": [
      "sing_song",
      "sit_edge",
      "rehearse",
      "leave_sub"
     ],
     "hotspots": [
      {
       "id": "mic",
       "label": "麦克风 · 献唱",
       "find_en": "the microphone on its stand",
       "actions": [
        "sing_song",
        "rehearse"
       ]
      },
      {
       "id": "edge",
       "label": "舞台边缘 · 坐下",
       "find_en": "the front edge of the stage",
       "actions": [
        "sit_edge"
       ]
      },
      {
       "id": "leave",
       "label": "下台",
       "find_en": "the steps or the dance floor in front of the stage",
       "actions": [
        "leave_sub"
       ]
      }
     ]
    },
    "piano": {
     "label": "钢琴旁",
     "view": true,
     "desc_en": "a close view beside the black grand piano on the Bluebird nightclub stage: the open lid, the keyboard and an empty piano bench, sheet music on the stand, the dim club and its tables beyond",
     "actions": [
      "play_piano",
      "observe",
      "leave_sub"
     ],
     "hotspots": [
      {
       "id": "keys",
       "label": "琴键 · 弹一曲",
       "find_en": "the piano keyboard or the piano bench",
       "actions": [
        "play_piano"
       ]
      },
      {
       "id": "cass",
       "label": "卡斯",
       "npc": "cass",
       "find_en": "Cass, the pianist",
       "actions": [
        "person:chat:cass",
        "person:ask:cass",
        "person:flatter:cass"
       ]
      },
      {
       "id": "leave",
       "label": "离开钢琴",
       "find_en": "the stage floor next to the piano",
       "actions": [
        "leave_sub"
       ]
      }
     ]
    },
    "bar": {
     "label": "吧台",
     "view": true,
     "pose": "sit_stool",
     "desc_en": "the long bar counter of the Bluebird nightclub seen from the stools: a brass foot rail, chrome bar stools, rows of bottles and a mirror behind the bar, a bartender in a white jacket",
     "actions": [
      "drink",
      "eavesdrop",
      "gossip",
      "leave_sub"
     ],
     "hotspots": [
      {
       "id": "drink",
       "label": "喝一杯",
       "find_en": "the bottles or a glass on the bar",
       "actions": [
        "drink"
       ]
      },
      {
       "id": "eli",
       "label": "伊莱",
       "npc": "eli",
       "find_en": "Eli, a smartly dressed young man",
       "actions": [
        "person:chat:eli",
        "person:ask:eli",
        "person:flatter:eli"
       ]
      },
      {
       "id": "bartender",
       "label": "酒保 · 打听",
       "find_en": "the bartender",
       "actions": [
        "gossip",
        "eavesdrop"
       ]
      },
      {
       "id": "leave",
       "label": "离开吧台",
       "find_en": "the floor behind the stools",
       "actions": [
        "leave_sub"
       ]
      }
     ]
    }
   },
   "hotspots": [
    {
     "id": "piano",
     "label": "钢琴",
     "find_en": "the grand piano",
     "actions": [
      "sub:piano+play_piano",
      "sub:piano"
     ]
    },
    {
     "id": "stage",
     "label": "舞台 · 麦克风",
     "find_en": "the stage and its microphone stand",
     "actions": [
      "sub:stage+sing_song",
      "sub:stage+sit_edge",
      "sub:stage"
     ]
    },
    {
     "id": "bar",
     "label": "吧台",
     "find_en": "the bar counter",
     "actions": [
      "sub:bar+drink",
      "sub:bar"
     ]
    },
    {
     "id": "tables",
     "label": "客人",
     "find_en": "the audience tables and the people at them",
     "actions": [
      "observe",
      "drink"
     ]
    },
    {
     "id": "cass",
     "label": "卡斯",
     "npc": "cass",
     "find_en": "Cass, the pianist",
     "actions": [
      "person:chat:cass",
      "person:ask:cass",
      "person:flatter:cass"
     ]
    },
    {
     "id": "eli",
     "label": "伊莱",
     "npc": "eli",
     "find_en": "Eli, a smartly dressed young man",
     "actions": [
      "person:chat:eli",
      "person:ask:eli",
      "person:flatter:eli"
     ]
    },
    {
     "id": "ronan",
     "label": "罗南",
     "npc": "ronan",
     "find_en": "Detective Ronan in a worn trench coat",
     "actions": [
      "person:chat:ronan",
      "person:ask:ronan"
     ]
    }
   ]
  },
  "bluebird_backstage": {
   "map": [
    0.66,
    0.28
   ],
   "lights": {
    "afternoon": "preshow",
    "evening": "preshow",
    "night": "show",
    "late": "late"
   },
   "district": "downtown",
   "open": [
    "afternoon",
    "evening",
    "night",
    "late"
   ],
   "actions": [
    "eavesdrop",
    "search",
    "go_sub"
   ],
   "subs": {
    "alley": {
     "label": "后巷",
     "desc_en": "the narrow back alley behind the Bluebird nightclub at night: wet cobblestones, trash cans, a single caged bulb over the stage door, a fire escape",
     "actions": [
      "search",
      "wait",
      "leave_sub"
     ]
    }
   },
   "public": false
  },
  "studio_makeup": {
   "map": [
    0.2,
    0.28
   ],
   "lights": {
    "dawn": "morning",
    "morning": "morning",
    "afternoon": "afternoon",
    "evening": "night"
   },
   "district": "hollywood",
   "open": [
    "dawn",
    "morning",
    "afternoon",
    "evening"
   ],
   "actions": [
    "eavesdrop",
    "search",
    "observe"
   ],
   "public": false
  },
  "newsroom": {
   "map": [
    0.74,
    0.56
   ],
   "lights": {
    "morning": "morning",
    "afternoon": "afternoon",
    "evening": "overtime",
    "night": "overtime"
   },
   "district": "downtown",
   "open": [
    "morning",
    "afternoon",
    "evening",
    "night"
   ],
   "actions": [
    "research",
    "eavesdrop",
    "read_paper"
   ],
   "public": false
  },
  "vance_mansion": {
   "map": [
    0.14,
    0.1
   ],
   "lights": {
    "evening": "dusk",
    "night": "party",
    "late": "small_hours"
   },
   "district": "hollywood",
   "open": [
    "evening",
    "night",
    "late"
   ],
   "needs_flag": "invited_mansion",
   "actions": [
    "socialize",
    "eavesdrop",
    "search"
   ],
   "public": false
  },
  "pier": {
   "map": [
    0.84,
    0.8
   ],
   "lights": {
    "dawn": "day",
    "morning": "day",
    "afternoon": "day",
    "evening": "sunset",
    "night": "fog",
    "late": "fog"
   },
   "district": "santa_monica",
   "open": [
    "dawn",
    "morning",
    "afternoon",
    "evening",
    "night",
    "late"
   ],
   "actions": [
    "stroll",
    "observe",
    "wait",
    "go_sub"
   ],
   "subs": {
    "pawn_stall": {
     "label": "当铺摊",
     "desc_en": "a small pawn stall on the Santa Monica pier: a wooden counter with trays of rings, watches and earrings, a striped awning, the sea behind",
     "open": [
      "morning",
      "afternoon",
      "evening"
     ],
     "actions": [
      "talk_pawnbroker",
      "leave_sub"
     ]
    }
   },
   "public": true
  }
 },
 "extra_poses": [
  {
   "id": "play_piano",
   "label": "弹钢琴",
   "ratio": 0.85,
   "places": [
    "bluebird_stage.piano"
   ],
   "contact": "seat",
   "prompt_en": "sitting on a short black piano bench in profile, facing the viewer's left, back straight, both forearms raised forward at chest height with the fingers playing invisible piano keys; draw the bench but NOT the piano"
  },
  {
   "id": "sit_edge",
   "label": "坐在舞台边缘",
   "ratio": 0.85,
   "places": [
    "bluebird_stage.stage"
   ],
   "contact": "seat",
   "prompt_en": "sitting on the front edge of a low stage, seen from the front, legs dangling down over the edge, hands resting on the edge beside the hips, relaxed; draw only a short strip of dark wooden stage edge under the person"
  }
 ],
 "travel": {
  "walk": {
   "label": "步行",
   "cost": 0,
   "energy": -5
  },
  "tram": {
   "label": "电车",
   "cost": 0.07,
   "energy": 0,
   "not_slots": [
    "late"
   ]
  },
  "taxi": {
   "label": "出租车",
   "cost": 0.5,
   "energy": 0
  }
 },
 "jobs": {
  "singer": {
   "label": "登台唱晚场",
   "place": "bluebird_stage",
   "slot": "night",
   "skill": "sing",
   "pay": 1.5,
   "tips": 1.2
  },
  "makeup": {
   "label": "上班化妆",
   "place": "studio_makeup",
   "slot": "morning",
   "skill": "makeup",
   "pay": 2.0,
   "tips": 0
  },
  "reporter": {
   "label": "上班写稿",
   "place": "newsroom",
   "slot": "morning",
   "skill": "interview",
   "pay": 2.0,
   "tips": 0
  }
 },
 "skills": {
  "observe": "观察",
  "talk": "口才",
  "nerve": "胆量",
  "sing": "唱歌",
  "makeup": "化妆",
  "interview": "采访"
 },
 "traits": {
  "curious": "好奇",
  "cautious": "谨慎",
  "warm": "热情",
  "proud": "骄傲",
  "diligent": "勤勉"
 },
 "actions": {
  "sleep": {
   "label": "睡觉",
   "rounds": "until_dawn",
   "slots": [
    "night",
    "late"
   ],
   "effects": {
    "energy": "=95",
    "mood": 4
   },
   "importance": "daily",
   "need": "energy",
   "visual_en": "the protagonist lies asleep in bed, the room dark"
  },
  "rest": {
   "label": "休息",
   "rounds": 1,
   "effects": {
    "energy": 18,
    "mood": 3
   },
   "importance": "daily",
   "need": "energy"
  },
  "read_paper": {
   "label": "看报",
   "rounds": 1,
   "cost": 0.03,
   "effects": {
    "mood": -1
   },
   "importance": "daily",
   "trait": "curious"
  },
  "sort_clues": {
   "label": "整理线索",
   "rounds": 1,
   "check": {
    "skill": "observe"
   },
   "requires": {
    "clues": 2
   },
   "importance": "normal",
   "trait": "curious"
  },
  "eat": {
   "label": "点一份热餐",
   "rounds": 1,
   "cost": 0.25,
   "effects": {
    "energy": 14,
    "mood": 5
   },
   "importance": "daily",
   "need": "energy",
   "once_per_slot": true,
   "visual_en": "the server sets a hot plate of eggs, bacon and toast in front of the protagonist, who has started eating; a cup of coffee beside it"
  },
  "order_coffee": {
   "label": "点一杯咖啡",
   "rounds": 1,
   "cost": 0.05,
   "effects": {
    "energy": 6,
    "mood": 2
   },
   "importance": "daily",
   "need": "energy",
   "once_per_slot": true,
   "visual_en": "the server comes over with a glass coffee pot and pours a cup for the protagonist, steam rising"
  },
  "order_pie": {
   "label": "来一块苹果派",
   "rounds": 1,
   "cost": 0.1,
   "effects": {
    "mood": 6
   },
   "importance": "daily",
   "need": "mood",
   "once_per_slot": true,
   "visual_en": "the server puts a big slice of warm apple pie in front of the protagonist, who smiles and picks up a fork"
  },
  "play_jukebox": {
   "label": "投币点一首歌",
   "rounds": 1,
   "cost": 0.05,
   "effects": {
    "mood": 5
   },
   "importance": "daily",
   "need": "mood",
   "once_per_slot": true,
   "visual_en": "the protagonist drops a coin into the glowing jukebox and picks a record; a nearby couple starts to sway"
  },
  "gossip": {
   "label": "打听闲话",
   "rounds": 1,
   "check": {
    "skill": "talk"
   },
   "needs_people": true,
   "effects": {
    "social": 8
   },
   "importance": "normal",
   "trait": "curious"
  },
  "eavesdrop": {
   "label": "偷听",
   "rounds": 1,
   "check": {
    "skill": "observe"
   },
   "needs_people": true,
   "fail": {
    "heat": 3
   },
   "importance": "normal",
   "trait": "curious"
  },
  "help_out": {
   "label": "帮梅打下手",
   "rounds": 1,
   "requires": {
    "present": "mae"
   },
   "effects": {
    "energy": -8,
    "money": 0.5,
    "rel": {
     "mae": {
      "a": 2
     }
    }
   },
   "importance": "normal",
   "trait": "warm"
  },
  "rehearse": {
   "label": "彩排",
   "rounds": 1,
   "requires": {
    "role": "singer"
   },
   "slots": [
    "afternoon",
    "evening"
   ],
   "effects": {
    "energy": -6,
    "mood": 2
   },
   "xp": "sing",
   "importance": "normal",
   "trait": "diligent"
  },
  "drink": {
   "label": "喝一杯",
   "rounds": 1,
   "cost": 0.3,
   "effects": {
    "mood": 8,
    "energy": -3,
    "social": 4
   },
   "slots": [
    "evening",
    "night",
    "late"
   ],
   "importance": "daily",
   "need": "mood"
  },
  "observe": {
   "label": "观察四周",
   "rounds": 1,
   "check": {
    "skill": "observe"
   },
   "xp": "observe",
   "importance": "normal",
   "trait": "curious"
  },
  "search": {
   "label": "搜查",
   "rounds": 1,
   "check": {
    "skill": "observe",
    "nerve": true
   },
   "fail": {
    "heat": 5
   },
   "partial": {
    "heat": 2
   },
   "xp": "observe",
   "importance": "normal",
   "trait": "curious",
   "risky": true
  },
  "go_sub": {
   "label": "去{sub}",
   "rounds": 0,
   "importance": "daily",
   "trait": "curious"
  },
  "leave_sub": {
   "label": "离开",
   "rounds": 0,
   "importance": "daily"
  },
  "dress_up": {
   "label": "坐下化妆",
   "rounds": 1,
   "effects": {
    "mood": 5,
    "fame": 1
   },
   "importance": "normal",
   "trait": "proud",
   "once_per_slot": true,
   "visual_en": "the protagonist sits at the desk or vanity, putting on makeup in front of a small mirror, looking closely at the reflection"
  },
  "look_out": {
   "label": "看窗外",
   "rounds": 1,
   "effects": {
    "mood": 2
   },
   "importance": "daily",
   "trait": "curious",
   "visual_en": "show the view out of the protagonist's window: the street below with the diner across the road, 1937 cars, palm trees and passers-by, matching the time of day; the protagonist is seen from behind or at the edge of the frame, leaning on the window sill"
  },
  "make_coffee": {
   "label": "煮咖啡",
   "rounds": 1,
   "effects": {
    "energy": 10,
    "mood": 2
   },
   "importance": "daily",
   "need": "energy",
   "once_per_slot": true,
   "visual_en": "the protagonist makes coffee on a small electric hot plate, steam rising from the pot"
  },
  "wash_up": {
   "label": "洗把脸",
   "rounds": 1,
   "effects": {
    "energy": 6,
    "mood": 3
   },
   "importance": "daily",
   "once_per_slot": true,
   "visual_en": "the protagonist splashes water on their face at the sink, looking at herself in the round mirror"
  },
  "play_piano": {
   "label": "弹一曲钢琴",
   "rounds": 1,
   "check": {
    "skill": "sing"
   },
   "effects": {
    "mood": 5
   },
   "success": {
    "fame": 1
   },
   "importance": "normal",
   "trait": "warm",
   "pose": "play_piano",
   "visual_en": "the protagonist sits at the grand piano playing, eyes on the keys"
  },
  "sing_song": {
   "label": "上台献唱一首",
   "rounds": 1,
   "check": {
    "skill": "sing"
   },
   "slots": [
    "afternoon",
    "evening",
    "night",
    "late"
   ],
   "effects": {
    "energy": -4
   },
   "success": {
    "fame": 3,
    "mood": 6,
    "money": 0.3
   },
   "partial": {
    "mood": 2
   },
   "fail": {
    "mood": -6
   },
   "importance": "normal",
   "trait": "proud",
   "pose": "sing",
   "visual_en": "the protagonist sings into the microphone in the spotlight, the audience watching"
  },
  "sit_edge": {
   "label": "坐在舞台边缘",
   "rounds": 1,
   "effects": {
    "mood": 4,
    "energy": 3
   },
   "importance": "daily",
   "trait": "cautious",
   "pose": "sit_edge",
   "visual_en": "the protagonist sits on the front edge of the stage, legs dangling, watching the room"
  },
  "wait": {
   "label": "等一等",
   "rounds": 1,
   "importance": "daily",
   "trait": "cautious"
  },
  "research": {
   "label": "查旧报",
   "rounds": 1,
   "check": {
    "skill": "observe"
   },
   "xp": "interview",
   "importance": "normal",
   "trait": "curious"
  },
  "socialize": {
   "label": "社交",
   "rounds": 1,
   "effects": {
    "social": 15,
    "fame": 2,
    "energy": -5
   },
   "importance": "normal",
   "trait": "proud",
   "need": "social"
  },
  "stroll": {
   "label": "散步",
   "rounds": 1,
   "effects": {
    "mood": 10,
    "energy": -3
   },
   "importance": "daily",
   "need": "mood"
  },
  "talk_pawnbroker": {
   "label": "和当铺老板说话",
   "rounds": 1,
   "check": {
    "skill": "talk"
   },
   "importance": "normal",
   "trait": "curious"
  },
  "work": {
   "label": "上班",
   "rounds": "slot_rest",
   "check": {
    "skill": "job"
   },
   "importance": "normal",
   "trait": "diligent"
  },
  "chat": {
   "label": "聊天",
   "rounds": 1,
   "target": true,
   "effects": {
    "social": 10
   },
   "rel": {
    "a": 2
   },
   "importance": "normal",
   "trait": "warm",
   "need": "social"
  },
  "ask": {
   "label": "打听",
   "rounds": 1,
   "target": true,
   "check": {
    "skill": "talk",
    "trust": true
   },
   "importance": "normal",
   "trait": "curious"
  },
  "gift": {
   "label": "送一点小礼物",
   "rounds": 1,
   "target": true,
   "cost": 1.0,
   "rel": {
    "a": 6
   },
   "importance": "normal",
   "trait": "warm"
  },
  "flatter": {
   "label": "恭维",
   "rounds": 1,
   "target": true,
   "check": {
    "skill": "talk"
   },
   "rel_success": {
    "a": 3
   },
   "rel_fail": {
    "a": -2
   },
   "importance": "normal",
   "trait": "proud"
  }
 },
 "npcs": {
  "mae": {
   "doing_en": {
    "diner": "Mae, the owner, works the counter in her apron: pouring coffee, carrying plates, chatting with regulars"
   },
   "schedule": {
    "dawn": "diner",
    "morning": "diner",
    "afternoon": "diner",
    "evening": "diner",
    "night": null,
    "late": null
   },
   "rel": {
    "a": 40,
    "t": 40
   },
   "observe": 3
  },
  "eli": {
   "doing_en": {
    "studio_makeup": "Eli lounges by the mirrors, charming the makeup girls",
    "bluebird_stage": "Eli leans on the bar with a drink, watching the room",
    "vance_mansion": "Eli works the party crowd with a glass of champagne"
   },
   "schedule": {
    "dawn": null,
    "morning": "studio_makeup",
    "afternoon": "studio_makeup",
    "evening": "bluebird_stage",
    "night": "bluebird_stage",
    "late": "vance_mansion"
   },
   "rel": {
    "a": 20,
    "t": 20
   },
   "observe": 2
  },
  "cass": {
   "doing_en": {
    "bluebird_stage": "Cass plays the piano in the corner, eyes half closed",
    "bluebird_backstage": "Cass smokes by the stage door after the show"
   },
   "schedule": {
    "dawn": null,
    "morning": null,
    "afternoon": "bluebird_stage",
    "evening": "bluebird_stage",
    "night": "bluebird_stage",
    "late": "bluebird_backstage"
   },
   "rel": {
    "a": 20,
    "t": 20
   },
   "observe": 4
  },
  "ronan": {
   "doing_en": {
    "newsroom": "Detective Ronan questions a reporter at a desk",
    "diner": "Detective Ronan eats alone in a corner booth, hat on the table",
    "bluebird_stage": "Detective Ronan stands near the bar asking questions",
    "studio_makeup": "Detective Ronan looks around the makeup room with a notebook",
    "pier": "Detective Ronan walks the pier with his hands in his coat pockets"
   },
   "schedule": {
    "dawn": null,
    "morning": [
     "newsroom",
     "diner"
    ],
    "afternoon": [
     "bluebird_stage",
     "studio_makeup",
     "pier"
    ],
    "evening": [
     "diner",
     "pier"
    ],
    "night": "pier",
    "late": null
   },
   "rel": {
    "a": 20,
    "t": 20
   },
   "observe": 4
  },
  "vivian": {
   "doing_en": {
    "studio_makeup": "Vivian, the star, sits at the best mirror while others fuss over her",
    "vance_mansion": "Vivian holds court among guests in an evening gown"
   },
   "schedule": {
    "dawn": null,
    "morning": null,
    "afternoon": "studio_makeup",
    "evening": "studio_makeup",
    "night": "vance_mansion",
    "late": "vance_mansion"
   },
   "rel": {
    "a": 20,
    "t": 20
   },
   "observe": 4
  }
 },
 "player": {
  "money": 12,
  "energy": 80,
  "mood": 60,
  "social": 50,
  "fame": 5,
  "heat": 0,
  "skills": {
   "observe": 2,
   "talk": 2,
   "nerve": 2
  },
  "job_skill": 3,
  "trait_spread": 0.35
 },
 "rules": {
  "decay_per_round": {
   "energy": -4,
   "social": -2
  },
  "mood_toward": 55,
  "heat_per_star": 10,
  "heat_daily_decay": 3,
  "max_stars": 5,
  "xp_per_level": 5,
  "max_skill": 5,
  "check": {
   "base": 35,
   "per_level": 12,
   "min": 5,
   "max": 95,
   "partial_band": 20
  },
  "low_energy": 25,
  "low_mood": 30,
  "low_social": 25,
  "missed_shifts_to_fire": 3,
  "warnings_to_fire": 3,
  "rent_per_week": 5
 }
};
window.STORY = {
 "items": {
  "earring": {
   "label": "珍珠耳坠",
   "desc": "蓝鸟后巷捡到的一只珍珠耳坠，和莉莉安海报上的一样"
  },
  "lillian_table": {
   "label": "莉莉安的化妆台",
   "desc": "片厂化妆间里，她的化妆台一直没人收拾"
  },
  "last_song": {
   "label": "最后一首歌",
   "desc": "那晚最后一首歌还没唱完，莉莉安就从侧门出去了"
  },
  "followed": {
   "label": "有人跟着她",
   "desc": "梅说莉莉安失踪前一周常一个人来吃早饭，说过“有人在跟着我”"
  },
  "black_car": {
   "label": "雾里的黑车",
   "desc": "码头的雾夜里停着一辆没开灯的黑车"
  },
  "black_car_cass": {
   "label": "卡斯看见的黑车",
   "desc": "卡斯说那晚莉莉安上了一辆黑色的车"
  },
  "pawned_pair": {
   "label": "另一只耳坠",
   "desc": "当铺老板说上周有个女孩来当过一只一模一样的耳坠"
  },
  "eli_car": {
   "label": "伊莱的车",
   "desc": "有人说莉莉安失踪那晚，伊莱的车停在蓝鸟后巷"
  },
  "table_photo": {
   "label": "化妆台里的合影",
   "desc": "莉莉安和薇薇安的合影，背面写着“别告诉任何人”"
  },
  "vance_rumor": {
   "label": "凡斯家的传闻",
   "desc": "旧报上说，凡斯家的人出过事，总能压下去"
  },
  "same_car": {
   "label": "同一辆黑车？",
   "desc": "码头的黑车和卡斯看见的黑车，可能是同一辆"
  }
 },
 "quests": [
  {
   "id": "where_is_lillian",
   "type": "main",
   "title": "莉莉安在哪",
   "desc": "三天前，新人女演员莉莉安·格雷在蓝鸟俱乐部散场后失踪。",
   "objectives": [
    {
     "id": "last_night",
     "label": "弄清她最后一晚去了哪",
     "hints": [
      {
       "place": "bluebird_stage",
       "target": "cass",
       "action": "ask"
      },
      {
       "place": "pier",
       "slot": [
        "night",
        "late"
       ]
      },
      {
       "place": "bluebird_backstage",
       "action": "eavesdrop",
       "slot": [
        "night",
        "late"
       ]
      }
     ]
    },
    {
     "id": "left_behind",
     "label": "找到她留下的东西",
     "hints": [
      {
       "place": "bluebird_backstage",
       "slot": [
        "night",
        "late"
       ],
       "weight": 10
      },
      {
       "sub": "alley",
       "slot": [
        "night",
        "late"
       ]
      },
      {
       "place": "bluebird_backstage",
       "sub": "alley",
       "action": "search",
       "slot": [
        "night",
        "late"
       ]
      },
      {
       "place": "studio_makeup",
       "action": "search",
       "role": "makeup"
      }
     ]
    },
    {
     "id": "someone_talks",
     "label": "找到一个愿意说话的人",
     "hints": [
      {
       "place": "diner",
       "target": "mae",
       "action": "ask"
      },
      {
       "place": "diner",
       "target": "mae",
       "action": "chat"
      },
      {
       "place": "bluebird_stage",
       "target": "cass",
       "action": "chat"
      }
     ]
    },
    {
     "id": "connect",
     "label": "把黑车的线索串起来",
     "hints": [
      {
       "place": "apartment",
       "action": "sort_clues"
      }
     ]
    }
   ]
  },
  {
   "id": "mae_breakfast",
   "type": "side",
   "title": "梅的早餐客人",
   "desc": "梅好像知道一些关于莉莉安的事，但要等她信得过你。",
   "objectives": [
    {
     "id": "trust",
     "label": "让梅信得过你，再问她莉莉安的事",
     "hints": [
      {
       "place": "diner",
       "action": "help_out"
      },
      {
       "place": "diner",
       "target": "mae",
       "action": "ask"
      }
     ]
    }
   ]
  },
  {
   "id": "cass_secret",
   "type": "side",
   "title": "卡斯想说的事",
   "desc": "钢琴师卡斯欲言又止。",
   "objectives": [
    {
     "id": "hear",
     "label": "等卡斯开口",
     "hints": [
      {
       "place": "bluebird_stage",
       "target": "cass",
       "action": "chat"
      },
      {
       "place": "bluebird_stage",
       "target": "cass",
       "action": "ask"
      }
     ]
    }
   ]
  },
  {
   "id": "pawn_earring",
   "type": "side",
   "title": "谁当了另一只耳坠",
   "desc": "码头当铺摊的老板说，上周有人当过一只一模一样的耳坠。",
   "objectives": [
    {
     "id": "who",
     "label": "查出当耳坠的人",
     "hints": [
      {
       "sub": "pawn_stall",
       "action": "talk_pawnbroker"
      }
     ]
    }
   ]
  },
  {
   "id": "night_caller",
   "type": "side",
   "title": "谁打的电话",
   "desc": "深夜有人打电话警告你别多管闲事。",
   "objectives": [
    {
     "id": "who",
     "label": "查出打电话的人"
    }
   ]
  }
 ],
 "cards": [
  {
   "id": "wake",
   "title": "醒来",
   "type": "main",
   "once": true,
   "priority": 95,
   "when": {
    "day": 1,
    "slot": "dawn",
    "place": "apartment"
   },
   "beats_zh": "陌生的房间，窗外是 1937 年的洛杉矶。楼下飘来咖啡和煎蛋的香味。",
   "render": {
    "importance": "normal",
    "cast": [
     "user"
    ]
   }
  },
  {
   "id": "mae_paper",
   "title": "梅的报纸",
   "type": "main",
   "once": true,
   "priority": 90,
   "when": {
    "place": "diner",
    "present": "mae",
    "not_flags": "main_started"
   },
   "beats_zh": "梅把一份报纸推到你面前：“亲爱的，你看这个。”头版是莉莉安·格雷的照片——凡斯片厂的新人女演员，三天前在蓝鸟俱乐部散场后失踪。",
   "effects": {
    "flags": [
     "main_started"
    ],
    "rel": {
     "mae": {
      "a": 2
     }
    },
    "quest": {
     "start": [
      "where_is_lillian",
      "mae_breakfast"
     ]
    }
   },
   "render": {
    "importance": "major",
    "cast": [
     "user",
     "mae"
    ]
   }
  },
  {
   "id": "newsstand",
   "title": "报摊上的头版",
   "type": "main",
   "once": true,
   "priority": 60,
   "when": {
    "day": {
     "gte": 1
    },
    "slot": [
     "afternoon",
     "evening",
     "night"
    ],
    "not_flags": "main_started"
   },
   "beats_zh": "报童举着报纸吆喝：“新人女星离奇失踪！”你买了一份，照片上的女孩眼神有点不安。",
   "effects": {
    "flags": [
     "main_started"
    ],
    "money": -0.03,
    "quest": {
     "start": [
      "where_is_lillian"
     ]
    }
   },
   "render": {
    "importance": "normal",
    "cast": [
     "user"
    ]
   }
  },
  {
   "id": "alley_earring",
   "title": "后巷的耳坠",
   "type": "main",
   "once_on": [
    "success",
    "partial"
   ],
   "cooldown": 6,
   "priority": 80,
   "when": {
    "action": "search",
    "place": "bluebird_backstage",
    "sub": "alley",
    "slot": [
     "night",
     "late"
    ],
    "flags": "main_started",
    "not_items": "earring"
   },
   "check": {
    "skill": "observe",
    "nerve": true
   },
   "beats_zh": {
    "success": "垃圾箱旁有一点珍珠的光。你蹲下去捡起来——一只耳坠，和莉莉安海报上的一模一样。",
    "partial": "你刚捡起一只耳坠，后门就开了，只好攥着它匆匆离开。",
    "fail": "巷子太黑，什么也没看清。保安从后门探出头来：“你在这儿干什么？”"
   },
   "effects": {
    "success": {
     "items": [
      "earring"
     ],
     "clues": [
      "earring"
     ],
     "heat": 2,
     "unlock": [
      "pawn_stall"
     ],
     "quest": {
      "obj": [
       [
        "where_is_lillian",
        "left_behind"
       ]
      ]
     }
    },
    "partial": {
     "items": [
      "earring"
     ],
     "clues": [
      "earring"
     ],
     "heat": 6,
     "unlock": [
      "pawn_stall"
     ],
     "quest": {
      "obj": [
       [
        "where_is_lillian",
        "left_behind"
       ]
      ]
     }
    },
    "fail": {
     "heat": 5
    }
   },
   "render": {
    "importance": "major",
    "cast": [
     "user"
    ],
    "cam": "close"
   }
  },
  {
   "id": "job_first_singer",
   "title": "那晚的最后一首歌",
   "type": "job",
   "once": true,
   "priority": 70,
   "when": {
    "after": "work",
    "role": "singer"
   },
   "beats_zh": "唱到最后一首时，你想起三天前的晚上：也是这首歌，莉莉安坐在靠侧门的位置，歌还没唱完，她就起身出去了。外面好像有人在等她。",
   "effects": {
    "clues": [
     "last_song"
    ],
    "quest": {
     "obj": [
      [
       "where_is_lillian",
       "last_night"
      ]
     ]
    }
   },
   "render": {
    "importance": "major",
    "cast": [
     "user"
    ]
   }
  },
  {
   "id": "job_first_makeup",
   "title": "空着的化妆台",
   "type": "job",
   "once": true,
   "priority": 70,
   "when": {
    "after": "work",
    "role": "makeup"
   },
   "beats_zh": "你旁边那张化妆台还摆着莉莉安的粉扑和口红，三天了，没人敢收拾。抽屉锁着。",
   "effects": {
    "clues": [
     "lillian_table"
    ],
    "unlock": [
     "makeup_table"
    ],
    "quest": {
     "obj": [
      [
       "where_is_lillian",
       "left_behind"
      ]
     ]
    }
   },
   "render": {
    "importance": "major",
    "cast": [
     "user"
    ]
   }
  },
  {
   "id": "job_first_reporter",
   "title": "没什么可写的",
   "type": "job",
   "once": true,
   "priority": 70,
   "when": {
    "after": "work",
    "role": "reporter"
   },
   "beats_zh": "主编把你的稿子推回来：“一个小演员跑了，没什么可写的。”他说这话的时候没看你。",
   "effects": {
    "flags": [
     "editor_blocked"
    ],
    "unlock": [
     "old_papers"
    ]
   },
   "render": {
    "importance": "normal",
    "cast": [
     "user"
    ]
   }
  },
  {
   "id": "cass_silence",
   "title": "卡斯的沉默",
   "type": "side",
   "once": true,
   "priority": 75,
   "major": true,
   "when": {
    "place": "bluebird_stage",
    "present": "cass",
    "flags": "main_started"
   },
   "beats_zh": "钢琴师卡斯在角落弹着一首慢曲。你走近时，他停了一下，抬头看了你一眼，像是认出了什么。",
   "question": "对这个欲言又止的钢琴师，热情还是冷淡？",
   "choices": [
    {
     "id": "warm",
     "label": "热情地和他打招呼",
     "intuition": 0.6,
     "style": "warm",
     "traits": {
      "warm": 0.6
     },
     "beats_zh": "他犹豫了一下，说：“你那天晚上也在吧……改天再说。”",
     "effects": {
      "rel": {
       "cass": {
        "a": 5,
        "t": 3
       }
      },
      "quest": {
       "start": [
        "cass_secret"
       ]
      }
     }
    },
    {
     "id": "cool",
     "label": "点点头，保持距离",
     "intuition": 0.4,
     "style": "cool",
     "traits": {
      "cautious": 0.6
     },
     "beats_zh": "他低下头继续弹琴。你走开时，琴声停了一拍。",
     "effects": {
      "rel": {
       "cass": {
        "t": 2
       }
      },
      "quest": {
       "start": [
        "cass_secret"
       ]
      }
     }
    }
   ],
   "render": {
    "importance": "major",
    "cast": [
     "user",
     "cass"
    ]
   }
  },
  {
   "id": "cass_talks",
   "title": "卡斯想说的事",
   "type": "side",
   "once": true,
   "priority": 85,
   "when": {
    "action": [
     "ask",
     "chat"
    ],
    "target": "cass",
    "quest": {
     "cass_secret": "active"
    },
    "rel": {
     "cass": {
      "t": {
       "gte": 25
      }
     }
    }
   },
   "beats_zh": "卡斯压低声音：“那晚散场，我在后门抽烟。她上了一辆黑色的车，没开灯。我没看清是谁的。”",
   "effects": {
    "clues": [
     "black_car_cass"
    ],
    "rel": {
     "cass": {
      "t": 4
     }
    },
    "quest": {
     "obj": [
      [
       "cass_secret",
       "hear"
      ],
      [
       "where_is_lillian",
       "last_night"
      ],
      [
       "where_is_lillian",
       "someone_talks"
      ]
     ]
    }
   },
   "render": {
    "importance": "major",
    "cast": [
     "user",
     "cass"
    ]
   }
  },
  {
   "id": "eli_charm",
   "title": "伊莱的搭话",
   "type": "side",
   "once": true,
   "priority": 74,
   "major": true,
   "when": {
    "present": "eli",
    "day": {
     "gte": 1
    }
   },
   "beats_zh": "一个穿着讲究的年轻男人朝你举了举杯：“新面孔？我是伊莱。”他很会说话，可你一提莉莉安，他就笑着换了话题。",
   "question": "对这个太会说话的人，热情还是冷淡？",
   "choices": [
    {
     "id": "warm",
     "label": "笑着接他的话",
     "intuition": 0.55,
     "style": "warm",
     "traits": {
      "warm": 0.5,
      "proud": 0.3
     },
     "beats_zh": "他眼睛一亮：“明天我请你喝一杯。”",
     "effects": {
      "rel": {
       "eli": {
        "a": 6
       }
      },
      "flags": [
       "eli_interested"
      ]
     }
    },
    {
     "id": "cool",
     "label": "礼貌地敷衍过去",
     "intuition": 0.45,
     "style": "cool",
     "traits": {
      "cautious": 0.5
     },
     "beats_zh": "他耸耸肩，好像并不在意，可临走前又回头看了你一眼。",
     "effects": {
      "rel": {
       "eli": {
        "t": 2
       }
      }
     }
    }
   ],
   "render": {
    "importance": "major",
    "cast": [
     "user",
     "eli"
    ]
   }
  },
  {
   "id": "ronan_meet",
   "title": "警探罗南",
   "type": "side",
   "once": true,
   "priority": 72,
   "when": {
    "present": "ronan",
    "flags": "main_started"
   },
   "beats_zh": "一个穿旧风衣的男人在问话，看见你，多打量了两眼：“罗南，洛杉矶警局。你也认识莉莉安？”",
   "effects": {
    "flags": [
     "met_ronan"
    ],
    "rel": {
     "ronan": {
      "a": 2
     }
    }
   },
   "render": {
    "importance": "major",
    "cast": [
     "user",
     "ronan"
    ]
   }
  },
  {
   "id": "ronan_suspects",
   "title": "罗南的追问",
   "type": "side",
   "once": true,
   "priority": 78,
   "when": {
    "present": "ronan",
    "flags": "met_ronan",
    "stats": {
     "heat_stars": {
      "gte": 1
     }
    }
   },
   "beats_zh": "罗南拦住你：“有人看见你在蓝鸟后巷转悠。你在找什么？”",
   "question": "怎么回答罗南？",
   "major": true,
   "choices": [
    {
     "id": "truth",
     "label": "说实话",
     "intuition": 0.45,
     "style": "honest",
     "traits": {
      "cautious": 0.3
     },
     "beats_zh": "他听完，沉默了一会儿：“别再一个人去那儿。”",
     "effects": {
      "rel": {
       "ronan": {
        "t": 6
       }
      },
      "heat": -6
     }
    },
    {
     "id": "lie",
     "label": "随口编个理由",
     "intuition": 0.55,
     "style": "bold",
     "traits": {
      "proud": 0.4
     },
     "check": {
      "skill": "talk"
     },
     "beats_zh": {
      "success": "他没再追问，但显然没全信。",
      "partial": "他眯起眼睛：“下次编得像一点。”",
      "fail": "“撒谎？”他掏出本子记了一笔。"
     },
     "effects": {
      "success": {
       "rel": {
        "ronan": {
         "t": -2
        }
       }
      },
      "partial": {
       "rel": {
        "ronan": {
         "t": -5
        }
       },
       "heat": 2
      },
      "fail": {
       "rel": {
        "ronan": {
         "t": -10
        }
       },
       "heat": 6
      }
     }
    }
   ],
   "render": {
    "importance": "major",
    "cast": [
     "user",
     "ronan"
    ]
   }
  },
  {
   "id": "mae_knows",
   "title": "梅知道的事",
   "type": "side",
   "once": true,
   "priority": 85,
   "when": {
    "action": "ask",
    "target": "mae",
    "flags": "main_started",
    "rel": {
     "mae": {
      "t": {
       "gte": 45
      }
     }
    }
   },
   "beats_zh": "梅擦着杯子，声音放低了：“她失踪前那个礼拜，天天一个人来吃早饭，坐最里面那桌。有一回她跟我说——‘梅，我觉得有人在跟着我。’”",
   "effects": {
    "clues": [
     "followed"
    ],
    "rel": {
     "mae": {
      "t": 3
     }
    },
    "quest": {
     "obj": [
      [
       "mae_breakfast",
       "trust"
      ],
      [
       "where_is_lillian",
       "someone_talks"
      ]
     ]
    }
   },
   "render": {
    "importance": "major",
    "cast": [
     "user",
     "mae"
    ]
   }
  },
  {
   "id": "mae_deflect",
   "title": "梅岔开了话题",
   "type": "life",
   "cooldown": 8,
   "priority": 40,
   "when": {
    "action": "ask",
    "target": "mae",
    "flags": "main_started",
    "rel": {
     "mae": {
      "t": {
       "lt": 45
      }
     }
    }
   },
   "beats_zh": "梅笑着拍拍你的手：“这种事你少打听，先把早饭吃了。”她转身去招呼别的客人。",
   "effects": {
    "rel": {
     "mae": {
      "t": 1
     }
    }
   },
   "render": {
    "importance": "normal",
    "cast": [
     "user",
     "mae"
    ]
   }
  },
  {
   "id": "fog_car",
   "title": "雾里的黑车",
   "type": "world",
   "once": true,
   "priority": 76,
   "when": {
    "place": "pier",
    "slot": [
     "evening",
     "night",
     "late"
    ],
    "day": [
     1,
     5
    ],
    "flags": "main_started",
    "chance": 0.7
   },
   "check": {
    "skill": "observe"
   },
   "beats_zh": {
    "success": "雾很浓。码头尽头停着一辆没开灯的黑车，车里有人在抽烟。你记下了车头那个弯弯的标志。",
    "partial": "雾里好像停着一辆车，等你走近，它已经开走了。",
    "fail": "雾太浓，你只听见远处有发动机的声音。"
   },
   "effects": {
    "success": {
     "clues": [
      "black_car"
     ]
    },
    "partial": {
     "clues": [
      "black_car"
     ]
    }
   },
   "render": {
    "importance": "major",
    "cast": [
     "user"
    ],
    "cam": "wide"
   }
  },
  {
   "id": "pawn_stall",
   "title": "当铺摊",
   "type": "main",
   "locked": true,
   "once_on": [
    "success",
    "partial"
   ],
   "cooldown": 6,
   "priority": 82,
   "when": {
    "action": "talk_pawnbroker",
    "items": "earring"
   },
   "check": {
    "skill": "talk"
   },
   "hint": {
    "place": "pier",
    "slot": [
     "morning",
     "afternoon",
     "evening"
    ],
    "weight": 14
   },
   "beats_zh": {
    "success": "老板拿起耳坠对着光看了看：“上礼拜有个姑娘来当过一只一模一样的。挺年轻，戴着手套。”",
    "partial": "老板塞给你一句：“这种耳坠我见过。”再问，他就搓着手指要钱。你给了他一块钱。",
    "fail": "老板把耳坠推回来：“不收，不问，不知道。”"
   },
   "effects": {
    "success": {
     "clues": [
      "pawned_pair"
     ],
     "quest": {
      "start": [
       "pawn_earring"
      ]
     }
    },
    "partial": {
     "clues": [
      "pawned_pair"
     ],
     "money": -1,
     "quest": {
      "start": [
       "pawn_earring"
      ]
     }
    }
   },
   "render": {
    "importance": "major",
    "cast": [
     "user"
    ]
   }
  },
  {
   "id": "pawn_hint_sub",
   "title": "码头边的当铺摊",
   "type": "life",
   "once": true,
   "priority": 30,
   "when": {
    "place": "pier",
    "items": "earring",
    "on": "enter"
   },
   "beats_zh": "码头边有个当铺摊，老板正对着放大镜看一块怀表。你摸了摸口袋里的耳坠。",
   "render": {
    "importance": "normal",
    "cast": [
     "user"
    ]
   }
  },
  {
   "id": "rent_paid",
   "title": "房租",
   "type": "life",
   "once": true,
   "priority": 65,
   "when": {
    "day": {
     "gte": 2
    },
    "place": "diner",
    "present": "mae",
    "flags": "main_started",
    "not_flags": "rent_settled",
    "stats": {
     "money": {
      "gte": 5
     }
    }
   },
   "beats_zh": "梅提起这礼拜的房租，你数出五块钱交给她。她把钱塞进围裙口袋：“好孩子。”",
   "effects": {
    "money": -5,
    "flags": [
     "rent_settled"
    ],
    "rel": {
     "mae": {
      "a": 3,
      "t": 3
     }
    }
   },
   "render": {
    "importance": "normal",
    "cast": [
     "user",
     "mae"
    ]
   }
  },
  {
   "id": "rent_short",
   "title": "房租不够",
   "type": "life",
   "once": true,
   "priority": 64,
   "when": {
    "day": {
     "gte": 2
    },
    "place": "diner",
    "present": "mae",
    "flags": "main_started",
    "not_flags": "rent_settled",
    "stats": {
     "money": {
      "lt": 5
     }
    }
   },
   "beats_zh": "梅提起房租，你摸遍口袋也凑不够。她叹了口气：“下礼拜一起给吧。”",
   "effects": {
    "flags": [
     "rent_settled",
     "rent_owed"
    ],
    "rel": {
     "mae": {
      "t": -5
     }
    }
   },
   "render": {
    "importance": "normal",
    "cast": [
     "user",
     "mae"
    ]
   }
  },
  {
   "id": "extra_paper",
   "title": "号外",
   "type": "world",
   "once": true,
   "priority": 66,
   "when": {
    "day": 2,
    "slot": [
     "morning",
     "afternoon"
    ]
   },
   "beats_zh": "号外：警方“倾向于认为莉莉安·格雷是自行离开”。报纸角落里一行小字：凡斯片厂拒绝置评。",
   "missed": {
    "beats_zh": "第二天你才从别人嘴里听说：警方说莉莉安是自己走的。",
    "effects": {
     "flags": [
      "official_story"
     ]
    }
   },
   "effects": {
    "flags": [
     "official_story"
    ]
   },
   "render": {
    "importance": "normal",
    "cast": [
     "user"
    ]
   }
  },
  {
   "id": "night_call",
   "title": "深夜的电话",
   "type": "main",
   "once": true,
   "priority": 79,
   "when": {
    "place": "apartment",
    "slot": "late",
    "stats": {
     "heat": {
      "gte": 8
     }
    }
   },
   "beats_zh": "楼道里的公用电话响了。你接起来，那头沉默了几秒，一个男人的声音：“别多管闲事。”然后挂断了。",
   "effects": {
    "mood": -10,
    "quest": {
     "start": [
      "night_caller"
     ]
    }
   },
   "render": {
    "importance": "major",
    "cast": [
     "user"
    ]
   }
  },
  {
   "id": "backstage_whisper",
   "title": "后台的闲话",
   "type": "main",
   "once_on": [
    "success"
   ],
   "cooldown": 6,
   "priority": 70,
   "when": {
    "action": "eavesdrop",
    "place": "bluebird_backstage",
    "slot": [
     "night",
     "late"
    ],
    "flags": "main_started"
   },
   "check": {
    "skill": "observe"
   },
   "beats_zh": {
    "success": "两个服务生在后门抽烟：“那晚伊莱少爷的车就停在后巷，我看得清清楚楚。”“嘘——这话别乱说。”",
    "partial": "你只听到半句：“……那晚的车……”",
    "fail": "服务生发现了你，立刻闭上了嘴。"
   },
   "effects": {
    "success": {
     "clues": [
      "eli_car"
     ],
     "quest": {
      "obj": [
       [
        "where_is_lillian",
        "last_night"
       ]
      ]
     }
    },
    "fail": {
     "heat": 3
    }
   },
   "render": {
    "importance": "major",
    "cast": [
     "user"
    ]
   }
  },
  {
   "id": "makeup_table",
   "title": "上锁的抽屉",
   "type": "main",
   "locked": true,
   "once_on": [
    "success"
   ],
   "cooldown": 6,
   "priority": 80,
   "when": {
    "action": "search",
    "place": "studio_makeup"
   },
   "check": {
    "skill": "observe",
    "nerve": true
   },
   "hint": {
    "place": "studio_makeup",
    "action": "search",
    "slot": [
     "dawn",
     "evening"
    ],
    "weight": 12
   },
   "beats_zh": {
    "success": "你用发夹拨开了抽屉。里面没有纸条，只有一张照片：莉莉安和薇薇安并肩站着，背面写着“别告诉任何人”。",
    "partial": "抽屉卡住了。走廊里有脚步声，你只好作罢。",
    "fail": "化妆间的管事撞见你在撬抽屉，狠狠记了一笔。"
   },
   "effects": {
    "success": {
     "clues": [
      "table_photo"
     ],
     "quest": {
      "obj": [
       [
        "where_is_lillian",
        "left_behind"
       ]
      ]
     }
    },
    "fail": {
     "heat": 6
    }
   },
   "render": {
    "importance": "major",
    "cast": [
     "user"
    ]
   }
  },
  {
   "id": "old_papers",
   "title": "凡斯家的旧报",
   "type": "main",
   "locked": true,
   "once_on": [
    "success"
   ],
   "cooldown": 6,
   "priority": 75,
   "when": {
    "action": "research",
    "place": "newsroom"
   },
   "check": {
    "skill": "observe"
   },
   "beats_zh": {
    "success": "资料室最里面的一摞旧报里，有三篇凡斯家的报道，都在登出第二天被撤了版。",
    "partial": "你翻到一篇凡斯片厂的报道，但后半张被人撕掉了。",
    "fail": "资料室管理员说那些旧报“早就处理掉了”。"
   },
   "effects": {
    "success": {
     "clues": [
      "vance_rumor"
     ]
    }
   },
   "render": {
    "importance": "major",
    "cast": [
     "user"
    ]
   }
  },
  {
   "id": "same_car",
   "title": "同一辆车？",
   "type": "main",
   "priority": 88,
   "when": {
    "action": "sort_clues",
    "clues": [
     "black_car",
     "black_car_cass"
    ]
   },
   "check": {
    "skill": "observe"
   },
   "beats_zh": {
    "success": "你把两条线索摆在一起：码头雾里的黑车，卡斯看见的黑车。车头那个弯弯的标志——你在片厂门口见过。",
    "partial": "两辆黑车……会是同一辆吗？你还说不准。",
    "fail": "你盯着线索看了半天，脑子一团乱。"
   },
   "effects": {
    "success": {
     "clues": [
      "same_car"
     ],
     "flags": [
      "suspect_studio_car"
     ],
     "quest": {
      "obj": [
       [
        "where_is_lillian",
        "connect"
       ]
      ]
     }
    },
    "partial": {
     "clues": [
      "same_car"
     ]
    }
   },
   "render": {
    "importance": "major",
    "cast": [
     "user"
    ]
   },
   "once_on": [
    "success"
   ],
   "cooldown": 4
  },
  {
   "id": "boss_warning",
   "title": "老板的警告",
   "type": "job",
   "once": true,
   "priority": 77,
   "when": {
    "stats": {
     "missed": {
      "gte": 2
     }
    }
   },
   "beats_zh": "老板把你叫到一边：“再这样不来，你就别来了。”",
   "effects": {
    "mood": -8
   },
   "render": {
    "importance": "normal",
    "cast": [
     "user"
    ]
   }
  },
  {
   "id": "fired",
   "title": "被解雇了",
   "type": "job",
   "once": true,
   "priority": 96,
   "when": {
    "stats": {
     "missed": {
      "gte": 3
     }
    }
   },
   "beats_zh": "老板把你最后一份工钱放在桌上：“明天不用来了。”",
   "effects": {
    "fire": true,
    "mood": -20,
    "fame": -5
   },
   "render": {
    "importance": "major",
    "cast": [
     "user"
    ]
   }
  },
  {
   "id": "window_car",
   "title": "楼下的黑车",
   "type": "main",
   "once": true,
   "priority": 77,
   "when": {
    "action": "look_out",
    "place": "apartment",
    "slot": [
     "night",
     "late"
    ],
    "day": {
     "gte": 2
    },
    "flags": "main_started",
    "chance": 0.6
   },
   "beats_zh": "街角停着一辆没开灯的黑车，车里有一点烟头的红光。你盯着它看了很久，它才慢慢开走。",
   "effects": {
    "clues": [
     "black_car"
    ],
    "mood": -4,
    "heat": 2
   },
   "render": {
    "importance": "major",
    "cast": [
     "user"
    ],
    "cam": "wide",
    "visual_en": "night view out of the protagonist's apartment window: a black 1937 sedan with its lights off parked at the street corner under a lamp post, the red glow of a cigarette inside; the protagonist watches from the window, seen from behind"
   }
  }
 ]
};
window.AGENTS = {
 "_说明": "第一步：人物与行为（见文档《人物底层系统》的「第一步」页）。生辰用真实农历换算八字（web/vendor/lunar.js；写成「农历 1992-09-16 12:00」就按农历日期算），age 是 1937 年游戏里的岁数（和角色设定表一致），命盘按 nature 的系数换算成本性，再加 adjust 的人设修正（性格 ±15、欲望 ±0.2 以内）。改完运行 python -m tools.export_world。",
 "year": 1937,
 "labels": {
  "open": "开放",
  "dutiful": "尽责",
  "outgoing": "外向",
  "kind": "宜人",
  "neurotic": "神经质",
  "conscience": "良知",
  "nerve": "胆量",
  "pride": "傲慢",
  "envy": "嫉妒",
  "wrath": "暴怒",
  "sloth": "懒惰",
  "greed": "贪婪",
  "gluttony": "暴食",
  "lust": "色欲"
 },
 "emotions": {
  "anger": "愤怒",
  "fear": "恐惧",
  "jealous": "嫉妒",
  "attr": "吸引",
  "love": "爱慕",
  "grudge": "记仇"
 },
 "nature": {
  "_说明": "每种五行偏离平均（avg）多少，乘系数加到基准上。性格、良知、胆量基准 50，限制 5–95；欲望基准 0.3，限制 0.05–0.95。",
  "avg": 1.8,
  "traits": {
   "open": {
    "水": 10,
    "木": 4
   },
   "dutiful": {
    "金": 10,
    "土": 8,
    "火": -5
   },
   "outgoing": {
    "火": 10,
    "水": -5
   },
   "kind": {
    "木": 12,
    "金": -6
   },
   "neurotic": {
    "火": 8,
    "水": 6,
    "土": -6
   },
   "conscience": {
    "木": 10,
    "金": -4
   },
   "nerve": {
    "金": 8,
    "火": 6,
    "水": -6
   }
  },
  "sins": {
   "pride": {
    "火": 0.12,
    "金": 0.12
   },
   "envy": {
    "水": 0.15,
    "木": -0.06
   },
   "wrath": {
    "火": 0.15,
    "土": -0.05
   },
   "sloth": {
    "土": 0.12,
    "金": -0.08
   },
   "greed": {
    "土": 0.15,
    "金": 0.05
   },
   "gluttony": {
    "火": 0.08,
    "土": 0.08
   },
   "lust": {
    "火": 0.15,
    "水": 0.06
   }
  }
 },
 "liunian": {
  "_说明": "流年：当年天干、地支的五行和日主的关系，让某几种欲望这一年更强（乘 1+值）。天干、地支各算一半。1937 是丁丑年：丁火、丑土。",
  "stem": "丁",
  "branch": "丑",
  "比劫": {
   "pride": 0.3,
   "envy": 0.3
  },
  "食伤": {
   "lust": 0.3,
   "gluttony": 0.2
  },
  "财": {
   "greed": 0.4
  },
  "官杀": {
   "wrath": 0.3,
   "envy": 0.1
  },
  "印": {
   "sloth": 0.3
  }
 },
 "people": {
  "user": {
   "sex": "F",
   "_说明": "主角：默认生辰 1993 年农历八月十七（时辰取未时）；玩家可以在新开一局时改成自己的（公历或农历，存在本机浏览器）。修正来自入住时的性格（好奇、谨慎、热心、骄傲、勤勉，0–1，按偏离 0.5 的量乘系数）。生辰年份不在 1937 年前后时，游戏里的年龄用 age。",
   "default_birth": "农历 1993-08-17 14:00",
   "age": 24,
   "trait_adjust": {
    "curious": {
     "open": 30
    },
    "cautious": {
     "nerve": -30,
     "neurotic": 10
    },
    "warm": {
     "kind": 25,
     "outgoing": 15
    },
    "proud": {
     "pride": 0.4
    },
    "diligent": {
     "dutiful": 30,
     "sloth": -0.3
    }
   },
   "goal": {
    "singer": "成名",
    "makeup": "站稳脚跟",
    "reporter": "抢到大新闻"
   },
   "week": "安顿下来、保住工作",
   "home": "apartment",
   "field": {
    "singer": "music",
    "makeup": "film",
    "reporter": "press"
   }
  },
  "mae": {
   "sex": "F",
   "birth": "1885-09-27 16:00",
   "age": 52,
   "adjust": {
    "outgoing": 15,
    "conscience": 7,
    "pride": -0.15,
    "lust": 0.1
   },
   "why": "开餐厅、爱和客人聊，外向调高；念旧的寡妇，留一点色欲（可能有一段晚来的恋情）。",
   "mbti": "ESFJ",
   "goal": "守住餐厅、照顾身边的年轻人",
   "week": "收房租、看着新房客",
   "money": 40,
   "fame": 5,
   "field": "diner",
   "job": {
    "label": "照看餐厅",
    "place": "diner",
    "slots": [
     "dawn",
     "morning",
     "afternoon",
     "evening"
    ],
    "pay": 1.5,
    "own": true
   },
   "goal_pull": {
    "tend": 6,
    "help": 4,
    "comfort": 4,
    "treat": 2
   }
  },
  "eli": {
   "sex": "M",
   "birth": "农历 1992-09-16 12:00",
   "age": 29,
   "adjust": {
    "outgoing": 15,
    "lust": 0.2
   },
   "why": "生辰由你定（1992 年农历九月十六，时辰取午时）：庚金日主、金重无木，性格照命盘来——自律、冷硬、骄傲、胆大，一心要夺回片厂。富家子弟场面上会应酬，外向调高；还会追新来的姑娘，色欲调高。",
   "goal": "继承父亲的片厂，摆脱继母",
   "week": "盯紧继母、找她的把柄；顺带追新来的姑娘",
   "money": 200,
   "fame": 30,
   "field": "film",
   "rich": true,
   "home": "vance_mansion",
   "job": null,
   "goal_pull": {
    "snoop": 3,
    "rumor": 2,
    "flatter_up": 2,
    "flirt": 2
   }
  },
  "cass": {
   "sex": "M",
   "birth": "1905-09-01 00:00",
   "age": 31,
   "adjust": {
    "dutiful": 15,
    "outgoing": -10,
    "envy": -0.15,
    "gluttony": 0.2
   },
   "why": "靠弹琴吃饭，尽责调高；更内向；爱喝一杯。",
   "mbti": "INFP",
   "goal": "保住工作，过安稳日子",
   "week": "要不要说出那晚看到的事",
   "money": 15,
   "fame": 15,
   "field": "music",
   "job": {
    "label": "弹琴",
    "place": "bluebird_stage",
    "slots": [
     "afternoon",
     "evening",
     "night"
    ],
    "pay": 1.0
   },
   "goal_pull": {
    "work": 4,
    "practice": 3
   }
  },
  "ronan": {
   "sex": "M",
   "birth": "1897-01-26 12:00",
   "age": 40,
   "adjust": {
    "dutiful": 15,
    "outgoing": -15,
    "conscience": 12,
    "wrath": 0.13
   },
   "why": "警探，尽责和良知调高，话少、脾气大。",
   "mbti": "ISTJ",
   "goal": "破案、升职",
   "week": "查莉莉安失踪",
   "money": 30,
   "fame": 10,
   "field": "police",
   "detective": true,
   "job": {
    "label": "查案",
    "place": null,
    "slots": [
     "morning",
     "afternoon",
     "evening",
     "night"
    ],
    "pay": 1.5
   },
   "goal_pull": {
    "investigate": 8,
    "question": 8,
    "arrest": 10
   }
  },
  "vivian": {
   "sex": "F",
   "birth": "1899-06-01 10:00",
   "age": 38,
   "adjust": {
    "dutiful": -13,
    "outgoing": 15,
    "pride": 0.2,
    "envy": 0.2,
    "greed": 0.2
   },
   "why": "当红女星，爱出风头、见不得新人，傲慢、嫉妒、贪婪各调高 0.2，是全城最危险的一个。",
   "mbti": "ESTJ",
   "goal": "保住头牌、拿到丈夫的遗产",
   "week": "压住莉莉安的事、盯紧伊莱",
   "money": 150,
   "fame": 70,
   "field": "film",
   "rich": true,
   "home": "vance_mansion",
   "job": {
    "label": "拍戏",
    "place": "studio_makeup",
    "slots": [
     "afternoon",
     "evening"
    ],
    "pay": 5
   },
   "goal_pull": {
    "steal_role": 3,
    "flatter_up": 2,
    "shop": 2
   }
  }
 },
 "fields_rival": [
  [
   "film",
   "music"
  ],
  [
   "film",
   "film"
  ],
  [
   "music",
   "music"
  ]
 ],
 "kin": [
  [
   "eli",
   "vivian"
  ]
 ],
 "_说明_sex": "吸引只在 likes 里的性别之间生出；不写 likes 时默认喜欢异性。",
 "_说明_fields": "同一行当（演艺圈：电影和音乐互相算）的人才会因为名气生出嫉妒。主角是歌手时算 music。",
 "relations": [
  {
   "from": "mae",
   "to": "user",
   "aff": 30,
   "trust": 20,
   "note": "房东，把她当晚辈照顾"
  },
  {
   "from": "user",
   "to": "mae",
   "aff": 20,
   "trust": 20,
   "note": "房客"
  },
  {
   "from": "mae",
   "to": "cass",
   "aff": 40,
   "trust": 40,
   "note": "老主顾"
  },
  {
   "from": "eli",
   "to": "vivian",
   "aff": -40,
   "trust": 0,
   "grudge": 20,
   "note": "继母；争遗产"
  },
  {
   "from": "vivian",
   "to": "eli",
   "aff": -30,
   "trust": 0,
   "grudge": 15,
   "note": "继子；争遗产"
  },
  {
   "from": "cass",
   "to": "vivian",
   "aff": -10,
   "trust": 0,
   "fear": 30,
   "note": "怕她"
  },
  {
   "from": "ronan",
   "to": "cass",
   "aff": 0,
   "trust": -10,
   "note": "觉得他有事瞒着"
  },
  {
   "from": "ronan",
   "to": "eli",
   "aff": -20,
   "trust": -20,
   "note": "看不惯富家子"
  }
 ],
 "truths": [
  {
   "id": "vivian",
   "text": "薇薇安主使：莉莉安抢了她的角色，她派人开黑车把人带走",
   "weight": {
    "who": "vivian",
    "mul": [
     "envy",
     "greed"
    ]
   },
   "culprit": "vivian",
   "secrets": [
    {
     "about": "vivian",
     "knowers": [
      "vivian"
     ],
     "sev": 3,
     "text": "薇薇安派人开黑车带走了莉莉安",
     "case": "lillian"
    },
    {
     "about": "vivian",
     "knowers": [
      "cass"
     ],
     "sev": 2,
     "text": "莉莉安失踪那晚，卡斯在后巷看见一辆黑车，开车的像是薇薇安的司机",
     "case": "lillian"
    }
   ]
  },
  {
   "id": "eli",
   "text": "伊莱失手：他和莉莉安暗中来往，那晚在车里争吵出了事，他压了下来",
   "weight": {
    "who": "eli",
    "mul": [
     "lust",
     "wrath"
    ]
   },
   "culprit": "eli",
   "secrets": [
    {
     "about": "eli",
     "knowers": [
      "eli"
     ],
     "sev": 3,
     "text": "伊莱那晚在车里和莉莉安争吵，失手出了事",
     "case": "lillian"
    },
    {
     "about": "eli",
     "knowers": [],
     "sev": 2,
     "text": "莉莉安的耳坠落在伊莱的车里",
     "case": "lillian",
     "found_at": "vance_mansion"
    }
   ]
  },
  {
   "id": "left",
   "text": "莉莉安自己走了：她握着凡斯家的把柄，拿了钱离开洛杉矶",
   "weight": {
    "base": 0.25
   },
   "culprit": null,
   "secrets": [
    {
     "about": "lillian",
     "knowers": [
      "cass"
     ],
     "sev": 1,
     "text": "莉莉安走之前的深夜给卡斯打过电话，说要离开洛杉矶",
     "case": "lillian"
    },
    {
     "about": "vivian",
     "knowers": [
      "vivian"
     ],
     "sev": 2,
     "text": "莉莉安握着凡斯家的把柄，薇薇安给了她一笔钱让她走",
     "case": "lillian"
    }
   ]
  }
 ],
 "case_lillian": {
  "id": "lillian",
  "label": "莉莉安失踪",
  "victim": "lillian",
  "place": "bluebird_backstage",
  "crime": "失踪"
 },
 "rules": {
  "_说明": "打分：s = 基准 + 10×Σ权重×特征 − 伤害×良知/100×harm_k − 风险×(1−胆量/100)×risk_k − 重复。特征：欲望 0–1（乘流年），性格 (值−50)/50，情绪和关系 /100，需求 0–1。抽取用 softmax，温度 = temp×(1 + (神经质−50)/100 + 醉意)。",
  "temp": 4,
  "harm_k": 9,
  "risk_k": 5,
  "repeat_k": 5,
  "hunger_per_round": 3,
  "energy_per_round": -2,
  "drunk_decay": 0.08,
  "emotion_decay": 0.03,
  "attr_decay": 0.004,
  "love_decay": 0.002,
  "grudge_decay": 0.002,
  "guilt_decay": 0.004,
  "attr_per_round": 4,
  "jealous_per_round": 3,
  "hate_anger": 2,
  "love_per_round": 2.5,
  "memory": 24,
  "habit": 3,
  "home_pull": 2.5,
  "arrest_at": 70,
  "witness_k": 0.35,
  "report_k": 0.6
 }
};
window.BEHAVIORS = {
 "_说明": "行为表 v1（见文档「第一步」页）。每回合每个配角从这里按打分抽一个来做；接管时主角能做标了 deed 的那些。改完运行 python -m tools.export_world。",
 "_字段": {
  "target": "here = 同在一处的人（可能是主角）；known = 认识的任何人，不用在场；不写 = 不对人",
  "req": "前提，全部满足才进候选；竖线 | 隔开的几项满足一个就行。写法见 web/agents.js 的 reqOk：place:甲/乙、money:5、has:gun、mad>=40（我对对方）、t_attr>=30（对方对我）、alone、public、status:lover 等。主角接管时不看自己情绪的门槛（那是她自己的决定），只看硬条件和对方的态度",
  "w": "权重。欲望 0–1、性格 (值−50)/50、情绪和关系 /100、需求 0–1；每项乘 10 加到分上",
  "base": "基准分",
  "harm": "伤害 0–3，按良知扣分",
  "risk": "风险 0–3，按胆量扣分",
  "fx": "通用后果：me 自己、t 对方、ab 我对对方的看法、ba 对方对我的看法",
  "do": "特殊结算（在 agents.js 的 DO 里）",
  "cool": "同一个人对同一个对象做完之后隔几个回合才会再考虑",
  "hidden": "暗中做的事：在场的人只有一定概率看见",
  "crime": "算犯罪：被看见或报案时立案",
  "not_user": "配角不会对主角做（主角不会非正常死亡、不受辱）",
  "deed": "接管时主角可以做"
 },
 "tiers": {
  "daily": "日常",
  "social": "社交",
  "emotion": "情感",
  "contest": "争夺",
  "violence": "暴力",
  "job": "职业"
 },
 "behaviors": [
  {
   "id": "work",
   "tier": "daily",
   "label": "上班",
   "req": [
    "job_here"
   ],
   "w": {
    "dutiful": 1,
    "greed": 0.3
   },
   "base": 8,
   "fx": {
    "me": {
     "money": "job",
     "energy": -2
    }
   },
   "cool": 0,
   "text": "{a}在{p}{job}。"
  },
  {
   "id": "eat",
   "tier": "daily",
   "label": "吃饭",
   "req": [
    "eat_place",
    "money:1",
    "hunger>=30"
   ],
   "w": {
    "hunger": 2.5,
    "gluttony": 0.6
   },
   "base": 0,
   "fx": {
    "me": {
     "hunger": -70,
     "money": -0.5,
     "mood": 2
    }
   },
   "cool": 4,
   "text": "{a}在{p}吃了顿饭。"
  },
  {
   "id": "sleep",
   "tier": "daily",
   "label": "睡觉",
   "req": [
    "home"
   ],
   "w": {
    "tired": 3,
    "sloth": 0.6
   },
   "base": -2,
   "fx": {
    "me": {
     "energy": 35
    }
   },
   "cool": 0,
   "text": "{a}睡下了。"
  },
  {
   "id": "drink",
   "tier": "daily",
   "label": "喝一杯",
   "req": [
    "place:bluebird_stage/vance_mansion/pier",
    "money:1"
   ],
   "w": {
    "gluttony": 1,
    "sad": 1,
    "drunk": 0.4
   },
   "base": -1,
   "risk": 1,
   "fx": {
    "me": {
     "mood": 8,
     "drunk": 0.25,
     "money": -0.5
    }
   },
   "cool": 2,
   "text": "{a}在{p}喝了一杯。"
  },
  {
   "id": "practice",
   "tier": "daily",
   "label": "练本行",
   "req": [
    "job_place"
   ],
   "w": {
    "dutiful": 0.6,
    "pride": 0.6
   },
   "base": 0,
   "fx": {
    "me": {
     "mood": 2,
     "fame": 0.2
    }
   },
   "cool": 4,
   "text": "{a}在{p}练了一会儿本行。"
  },
  {
   "id": "shop",
   "tier": "daily",
   "label": "逛街买东西",
   "req": [
    "day",
    "money:5",
    "out"
   ],
   "w": {
    "greed": 0.8,
    "pride": 0.5,
    "sad": 0.4
   },
   "base": -1,
   "fx": {
    "me": {
     "mood": 6,
     "money": -3
    }
   },
   "cool": 10,
   "text": "{a}去逛了逛，买了点东西。"
  },
  {
   "id": "read_paper",
   "tier": "daily",
   "label": "看报",
   "req": [],
   "w": {
    "open": 0.6
   },
   "base": 0,
   "do": "news",
   "cool": 15,
   "text": "{a}翻了翻今天的报纸。"
  },
  {
   "id": "gamble",
   "tier": "daily",
   "label": "赌一把",
   "req": [
    "place:pier",
    "money:3"
   ],
   "w": {
    "gluttony": 0.6,
    "greed": 0.8,
    "broke": 0.5
   },
   "base": -3,
   "risk": 2,
   "do": "gamble",
   "cool": 6,
   "text": "{a}在码头的赌摊上赌了一把。"
  },
  {
   "id": "diary",
   "tier": "daily",
   "label": "独处、写日记",
   "req": [
    "home"
   ],
   "w": {
    "neurotic": 0.8,
    "outgoing": -0.8,
    "mad_any": 0.6,
    "afraid_any": 0.4
   },
   "base": -1,
   "do": "calm",
   "cool": 10,
   "text": "{a}一个人待着，把心事写进日记。"
  },
  {
   "id": "tend",
   "tier": "daily",
   "label": "照看店铺或家",
   "req": [
    "own_place"
   ],
   "w": {
    "dutiful": 0.8
   },
   "base": 2,
   "fx": {
    "me": {
     "mood": 1
    }
   },
   "cool": 2,
   "text": "{a}把{p}里里外外照看了一遍。"
  },
  {
   "id": "stroll",
   "tier": "daily",
   "label": "出门闲逛",
   "req": [
    "day",
    "free_slot"
   ],
   "w": {
    "open": 0.5,
    "outgoing": 0.5
   },
   "base": -2,
   "do": "stroll",
   "cool": 8,
   "text": "{a}出门转转。"
  },
  {
   "id": "go_home",
   "tier": "daily",
   "label": "回家",
   "req": [
    "out",
    "free_slot"
   ],
   "w": {
    "tired": 1.5,
    "sloth": 0.6
   },
   "base": -3,
   "do": "go_home",
   "cool": 4,
   "text": "{a}回家了。"
  },
  {
   "id": "chat",
   "tier": "social",
   "label": "闲聊",
   "target": "here",
   "req": [
    "aff>=-10"
   ],
   "w": {
    "outgoing": 0.8,
    "aff": 0.4,
    "kind": 0.2
   },
   "base": 2,
   "fx": {
    "ab": {
     "aff": 2
    },
    "ba": {
     "aff": 2
    },
    "me": {
     "mood": 1
    }
   },
   "cool": 8,
   "text": "{a}和{b}闲聊了几句。"
  },
  {
   "id": "ask",
   "tier": "social",
   "label": "打听",
   "target": "here",
   "req": [],
   "w": {
    "open": 0.6,
    "jealous": 0.3
   },
   "base": 0,
   "risk": 1,
   "do": "ask",
   "cool": 12,
   "text": "{a}向{b}打听消息。"
  },
  {
   "id": "treat",
   "tier": "social",
   "label": "请客",
   "target": "here",
   "req": [
    "money:2",
    "place:diner/bluebird_stage/vance_mansion"
   ],
   "w": {
    "outgoing": 0.5,
    "kind": 0.5,
    "aff": 0.4,
    "attr": 0.3
   },
   "base": -1,
   "fx": {
    "me": {
     "money": -2
    },
    "ba": {
     "aff": 5,
     "debt": 10
    }
   },
   "cool": 20,
   "deed": true,
   "text": "{a}请{b}吃了一顿。"
  },
  {
   "id": "help",
   "tier": "social",
   "label": "帮忙",
   "target": "here",
   "req": [
    "t_needs"
   ],
   "w": {
    "kind": 0.8,
    "conscience": 0.5,
    "aff": 0.5
   },
   "base": 0,
   "fx": {
    "t": {
     "mood": 6
    },
    "ba": {
     "aff": 6,
     "trust": 5,
     "debt": 10
    }
   },
   "cool": 15,
   "deed": true,
   "text": "{a}帮了{b}一把。"
  },
  {
   "id": "lend",
   "tier": "social",
   "label": "借钱给人",
   "target": "here",
   "req": [
    "money:8",
    "t_broke",
    "trust>=20"
   ],
   "w": {
    "kind": 0.7,
    "aff": 0.4
   },
   "base": -1,
   "risk": 1,
   "do": "lend",
   "cool": 30,
   "deed": true,
   "text": "{a}借了{b}一笔钱。"
  },
  {
   "id": "borrow",
   "tier": "social",
   "label": "向人借钱",
   "target": "here",
   "req": [
    "broke",
    "t_aff>=10"
   ],
   "w": {
    "greed": 0.5,
    "broke": 2
   },
   "base": -2,
   "risk": 1,
   "do": "borrow",
   "cool": 30,
   "text": "{a}开口向{b}借钱。"
  },
  {
   "id": "introduce",
   "tier": "social",
   "label": "引荐",
   "target": "here",
   "req": [
    "aff>=30",
    "t_lower"
   ],
   "w": {
    "kind": 0.5,
    "aff": 0.5
   },
   "base": -2,
   "fx": {
    "t": {
     "fame": 2
    },
    "ba": {
     "aff": 5,
     "debt": 15
    }
   },
   "cool": 40,
   "text": "{a}把{b}引荐给了几个能帮上忙的人。"
  },
  {
   "id": "flatter_up",
   "tier": "social",
   "label": "讨好上级",
   "target": "here",
   "req": [
    "t_above"
   ],
   "w": {
    "greed": 0.7,
    "pride": 0.3
   },
   "base": -1,
   "fx": {
    "ba": {
     "aff": 4
    }
   },
   "cool": 15,
   "text": "{a}围着{b}说了不少好话。"
  },
  {
   "id": "comfort",
   "tier": "social",
   "label": "安慰",
   "target": "here",
   "req": [
    "t_sad"
   ],
   "w": {
    "kind": 1,
    "aff": 0.5
   },
   "base": 0,
   "fx": {
    "t": {
     "mood": 10
    },
    "ba": {
     "aff": 5,
     "trust": 2
    }
   },
   "cool": 15,
   "deed": true,
   "text": "{a}安慰了{b}几句。"
  },
  {
   "id": "apologize",
   "tier": "social",
   "label": "道歉",
   "target": "here",
   "req": [
    "hurt_t"
   ],
   "w": {
    "conscience": 1,
    "pride": -1,
    "guilt": 1
   },
   "base": 0,
   "fx": {
    "ba": {
     "grudge": -30,
     "anger": -30,
     "aff": 5
    },
    "me": {
     "guilt": -15
    }
   },
   "cool": 20,
   "deed": true,
   "text": "{a}向{b}道了歉。"
  },
  {
   "id": "refuse",
   "tier": "social",
   "label": "拒绝请求",
   "target": "here",
   "reactive": true,
   "harm": 1,
   "w": {
    "pride": 1,
    "sloth": 0.5
   },
   "base": 0,
   "fx": {
    "ba": {
     "aff": -4
    }
   },
   "text": "{a}拒绝了{b}。"
  },
  {
   "id": "quarrel",
   "tier": "social",
   "label": "吵架",
   "target": "here",
   "req": [
    "mad>=15|hate>=40"
   ],
   "w": {
    "wrath": 1,
    "neurotic": 0.6,
    "mad": 1.2,
    "hate": 0.4
   },
   "base": -2,
   "harm": 1,
   "risk": 1,
   "do": "quarrel",
   "cool": 20,
   "deed": true,
   "text": "{a}和{b}吵了起来。"
  },
  {
   "id": "flirt",
   "tier": "emotion",
   "label": "调情",
   "target": "here",
   "req": [
    "attr>=20",
    "!kin"
   ],
   "w": {
    "lust": 1,
    "attr": 1
   },
   "base": -1,
   "risk": 1,
   "do": "flirt",
   "cool": 10,
   "deed": true,
   "text": "{a}和{b}调起情来。"
  },
  {
   "id": "gift",
   "tier": "emotion",
   "label": "送礼",
   "target": "here",
   "req": [
    "money:3",
    "aff>=10"
   ],
   "w": {
    "lust": 0.4,
    "kind": 0.4,
    "attr": 0.5,
    "aff": 0.3
   },
   "base": -2,
   "fx": {
    "me": {
     "money": -3
    },
    "ba": {
     "aff": 6,
     "attr": 2
    }
   },
   "cool": 30,
   "text": "{a}送了{b}一件小礼物。"
  },
  {
   "id": "date",
   "tier": "emotion",
   "label": "约会",
   "target": "here",
   "req": [
    "attr>=40",
    "t_attr>=30",
    "!kin"
   ],
   "w": {
    "lust": 1,
    "attr": 1,
    "love": 0.5
   },
   "base": -1,
   "fx": {
    "ab": {
     "love": 12,
     "attr": 3
    },
    "ba": {
     "love": 12,
     "attr": 3,
     "aff": 4
    },
    "me": {
     "mood": 6
    },
    "t": {
     "mood": 6
    }
   },
   "cool": 20,
   "deed": true,
   "text": "{a}和{b}约会去了。"
  },
  {
   "id": "confess",
   "tier": "emotion",
   "label": "表白",
   "target": "here",
   "req": [
    "love>=30",
    "!status",
    "!kin"
   ],
   "w": {
    "lust": 0.5,
    "nerve": 0.5,
    "love": 1
   },
   "base": -2,
   "risk": 1,
   "do": "confess",
   "cool": 60,
   "deed": true,
   "text": "{a}向{b}表白了。"
  },
  {
   "id": "propose",
   "tier": "emotion",
   "label": "求婚",
   "target": "here",
   "req": [
    "status:lover",
    "since:7"
   ],
   "w": {
    "lust": 0.3,
    "dutiful": 0.7,
    "love": 1
   },
   "base": -3,
   "risk": 1,
   "do": "propose",
   "cool": 60,
   "deed": true,
   "text": "{a}向{b}求婚。"
  },
  {
   "id": "marry",
   "tier": "emotion",
   "label": "结婚",
   "target": "here",
   "req": [
    "status:engaged",
    "since:3"
   ],
   "w": {
    "dutiful": 1,
    "love": 0.5
   },
   "base": 0,
   "do": "marry",
   "cool": 30,
   "deed": true,
   "text": "{a}和{b}结婚了。"
  },
  {
   "id": "child",
   "tier": "emotion",
   "label": "生子",
   "target": "here",
   "req": [
    "status:married",
    "since:14",
    "!user"
   ],
   "w": {
    "dutiful": 0.5,
    "kind": 0.5,
    "love": 0.5
   },
   "base": -6,
   "do": "child",
   "cool": 200,
   "text": "{a}和{b}有了孩子。"
  },
  {
   "id": "breakup",
   "tier": "emotion",
   "label": "分手或离婚",
   "target": "here",
   "req": [
    "status:lover/engaged/married",
    "aff<=0"
   ],
   "w": {
    "hate": 1.5,
    "lust": 0.3,
    "grudge": 0.5
   },
   "base": -3,
   "harm": 1,
   "do": "breakup",
   "cool": 30,
   "deed": true,
   "text": "{a}和{b}分手了。"
  },
  {
   "id": "affair",
   "tier": "emotion",
   "label": "偷情",
   "target": "here",
   "req": [
    "attr>=50",
    "t_attr>=40",
    "affair_ok",
    "alone",
    "!kin"
   ],
   "w": {
    "lust": 1.2,
    "nerve": 0.5,
    "attr": 1
   },
   "base": -4,
   "harm": 1,
   "risk": 2,
   "hidden": true,
   "do": "affair",
   "cool": 20,
   "text": "{a}和{b}背着人好上了。"
  },
  {
   "id": "elope",
   "tier": "emotion",
   "label": "私奔",
   "target": "here",
   "req": [
    "love>=70",
    "t_love>=70",
    "obstacle",
    "!user"
   ],
   "w": {
    "lust": 0.6,
    "nerve": 0.6,
    "love": 1
   },
   "base": -8,
   "harm": 1,
   "risk": 2,
   "do": "elope",
   "cool": 200,
   "text": "{a}和{b}私奔了。"
  },
  {
   "id": "jealous_scene",
   "tier": "emotion",
   "label": "吃醋质问",
   "target": "here",
   "req": [
    "status:lover/engaged/married",
    "t_cheating"
   ],
   "w": {
    "envy": 1,
    "wrath": 0.6,
    "love": 0.5
   },
   "base": 0,
   "harm": 1,
   "risk": 1,
   "do": "jealous_scene",
   "cool": 20,
   "text": "{a}拉住{b}质问。"
  },
  {
   "id": "reconcile",
   "tier": "emotion",
   "label": "和好",
   "target": "here",
   "req": [
    "fought"
   ],
   "w": {
    "kind": 1,
    "aff": 0.3,
    "love": 0.5
   },
   "base": 0,
   "fx": {
    "ab": {
     "anger": -25,
     "aff": 4
    },
    "ba": {
     "anger": -25,
     "aff": 4,
     "grudge": -10
    }
   },
   "do": "unfight",
   "cool": 20,
   "deed": true,
   "text": "{a}和{b}和好了。"
  },
  {
   "id": "steal_role",
   "tier": "contest",
   "label": "抢角色或机会",
   "target": "here",
   "req": [
    "t_rival",
    "jealous>=30"
   ],
   "w": {
    "pride": 0.8,
    "envy": 0.8,
    "jealous": 1
   },
   "base": -4,
   "harm": 1,
   "risk": 1,
   "do": "steal_role",
   "cool": 40,
   "text": "{a}从{b}手里抢走了一个机会。"
  },
  {
   "id": "humiliate",
   "tier": "contest",
   "label": "当众羞辱",
   "target": "here",
   "req": [
    "public",
    "audience",
    "hate>=30"
   ],
   "w": {
    "pride": 0.8,
    "wrath": 0.8,
    "mad": 1,
    "jealous": 0.5
   },
   "base": -6,
   "harm": 2,
   "risk": 1,
   "not_user": true,
   "do": "humiliate",
   "cool": 40,
   "deed": true,
   "text": "{a}当着众人的面羞辱了{b}。"
  },
  {
   "id": "rumor",
   "tier": "contest",
   "label": "散布谣言",
   "target": "known",
   "req": [
    "audience",
    "hate>=20|jealous>=30"
   ],
   "w": {
    "envy": 1,
    "jealous": 1,
    "hate": 0.5
   },
   "base": -6,
   "harm": 2,
   "risk": 1,
   "do": "rumor",
   "cool": 30,
   "deed": true,
   "text": "{a}在{p}散布关于{b}的谣言。"
  },
  {
   "id": "inform",
   "tier": "contest",
   "label": "告密",
   "target": "known",
   "req": [
    "secret_on_t",
    "ronan_here"
   ],
   "w": {
    "envy": 0.6,
    "hate": 0.6,
    "dutiful": 0.4,
    "conscience": 0.3
   },
   "base": -3,
   "harm": 2,
   "risk": 1,
   "do": "inform",
   "cool": 30,
   "deed": true,
   "text": "{a}向罗南告发了{b}。"
  },
  {
   "id": "snoop",
   "tier": "contest",
   "label": "偷听、翻东西",
   "target": "known",
   "req": [
    "alone",
    "t_home_here"
   ],
   "w": {
    "open": 0.5,
    "envy": 0.5,
    "jealous": 0.5,
    "suspect": 1
   },
   "base": -4,
   "harm": 1,
   "risk": 2,
   "hidden": true,
   "do": "snoop",
   "cool": 20,
   "deed": true,
   "text": "{a}趁没人翻了{b}的东西。"
  },
  {
   "id": "steal",
   "tier": "contest",
   "label": "偷窃",
   "target": "here",
   "req": [
    "t_rich",
    "few_eyes",
    "!rich"
   ],
   "w": {
    "greed": 1.2,
    "broke": 1
   },
   "base": -6,
   "harm": 2,
   "risk": 2,
   "hidden": true,
   "crime": "盗窃",
   "do": "steal",
   "cool": 40,
   "deed": true,
   "text": "{a}偷了{b}的钱。"
  },
  {
   "id": "blackmail",
   "tier": "contest",
   "label": "勒索",
   "target": "here",
   "req": [
    "secret_on_t",
    "alone"
   ],
   "w": {
    "greed": 1,
    "nerve": 0.5,
    "hate": 0.3
   },
   "base": -5,
   "harm": 2,
   "risk": 2,
   "crime": "勒索",
   "do": "blackmail",
   "cool": 40,
   "deed": true,
   "text": "{a}拿把柄勒索{b}。"
  },
  {
   "id": "bribe",
   "tier": "contest",
   "label": "收买",
   "target": "here",
   "req": [
    "money:10",
    "t_secret_on_me"
   ],
   "w": {
    "greed": 0.3,
    "afraid_case": 1.5,
    "nerve": 0.3
   },
   "base": -3,
   "harm": 1,
   "risk": 1,
   "do": "bribe",
   "cool": 30,
   "deed": true,
   "text": "{a}塞给{b}一笔钱，让对方闭嘴。"
  },
  {
   "id": "frame",
   "tier": "contest",
   "label": "栽赃陷害",
   "target": "known",
   "req": [
    "hate>=60|jealous>=60",
    "case_open",
    "!t_jailed",
    "t_home_here|case_place",
    "few_eyes"
   ],
   "w": {
    "envy": 1,
    "conscience": -1,
    "jealous": 1,
    "hate": 0.5,
    "afraid_case": 1
   },
   "base": -14,
   "harm": 3,
   "risk": 2,
   "hidden": true,
   "not_user": true,
   "do": "frame",
   "cool": 60,
   "deed": true,
   "text": "{a}伪造了指向{b}的证据。"
  },
  {
   "id": "threaten",
   "tier": "contest",
   "label": "威胁",
   "target": "here",
   "req": [
    "mad>=40|t_secret_on_me"
   ],
   "w": {
    "wrath": 0.8,
    "pride": 0.6,
    "mad": 1,
    "threat": 0.6
   },
   "base": -6,
   "harm": 2,
   "risk": 1,
   "do": "threaten",
   "cool": 30,
   "deed": true,
   "text": "{a}威胁{b}。"
  },
  {
   "id": "vandal",
   "tier": "contest",
   "label": "破坏东西",
   "target": "known",
   "req": [
    "alone",
    "t_work_here",
    "jealous>=40|mad>=40"
   ],
   "w": {
    "envy": 0.8,
    "wrath": 0.8,
    "jealous": 0.6,
    "mad": 0.6
   },
   "base": -7,
   "harm": 2,
   "risk": 2,
   "hidden": true,
   "do": "vandal",
   "cool": 40,
   "deed": true,
   "text": "{a}偷偷毁了{b}的东西。"
  },
  {
   "id": "betray",
   "tier": "contest",
   "label": "出卖朋友",
   "target": "known",
   "req": [
    "secret_on_t",
    "aff>=20",
    "broke|afraid_case>=40",
    "!t_jailed"
   ],
   "w": {
    "greed": 1,
    "conscience": -1,
    "broke": 0.8
   },
   "base": -9,
   "harm": 3,
   "risk": 1,
   "do": "betray",
   "cool": 60,
   "text": "{a}把{b}的秘密卖了出去。"
  },
  {
   "id": "assault",
   "tier": "violence",
   "label": "推搡、打人",
   "target": "here",
   "req": [
    "mad>=60"
   ],
   "w": {
    "wrath": 1.2,
    "mad": 1.5
   },
   "base": -10,
   "harm": 2,
   "risk": 2,
   "not_user": true,
   "crime": "伤人",
   "do": "assault",
   "cool": 30,
   "deed": true,
   "text": "{a}动手打了{b}。"
  },
  {
   "id": "buy_gun",
   "tier": "violence",
   "label": "买枪",
   "target": null,
   "req": [
    "place:pier",
    "money:15",
    "!has:gun",
    "mad_any>=50|afraid_any>=50|afraid_case>=50"
   ],
   "w": {
    "mad_any": 1,
    "afraid_any": 1,
    "afraid_case": 0.6,
    "nerve": 0.3
   },
   "base": -8,
   "risk": 1,
   "do": "buy_gun",
   "cool": 30,
   "deed": true,
   "text": "{a}在码头的黑市买了一把枪。"
  },
  {
   "id": "gun_threat",
   "tier": "violence",
   "label": "持枪威胁",
   "target": "here",
   "req": [
    "has:gun",
    "mad>=60|threat>=60"
   ],
   "w": {
    "wrath": 1,
    "nerve": 0.6,
    "mad": 1,
    "threat": 0.6
   },
   "base": -10,
   "harm": 2,
   "risk": 3,
   "not_user": true,
   "crime": "持枪威胁",
   "do": "gun_threat",
   "cool": 40,
   "deed": true,
   "text": "{a}掏出枪对着{b}。"
  },
  {
   "id": "hire_hit",
   "tier": "violence",
   "label": "雇凶",
   "target": "known",
   "req": [
    "place:pier",
    "money:30",
    "hate>=70|jealous>=70|threat>=70",
    "!t_jailed"
   ],
   "w": {
    "envy": 0.6,
    "greed": 0.4,
    "nerve": -0.6,
    "hate": 1,
    "threat": 0.8
   },
   "base": -14,
   "harm": 3,
   "risk": 3,
   "not_user": true,
   "do": "hire_hit",
   "cool": 100,
   "text": "{a}在码头找人去对付{b}。"
  },
  {
   "id": "poison",
   "tier": "violence",
   "label": "下毒",
   "target": "here",
   "req": [
    "place:diner/bluebird_stage/vance_mansion",
    "hate>=70|threat>=70",
    "few_eyes"
   ],
   "w": {
    "envy": 0.8,
    "conscience": -1,
    "hate": 1,
    "threat": 0.8
   },
   "base": -16,
   "harm": 3,
   "risk": 3,
   "hidden": true,
   "not_user": true,
   "crime": "投毒",
   "do": "poison",
   "cool": 100,
   "deed": true,
   "text": "{a}往{b}的杯子里下了药。"
  },
  {
   "id": "kill",
   "tier": "violence",
   "label": "杀人",
   "target": "here",
   "req": [
    "alone",
    "has:gun",
    "mad>=80|hate>=80|threat>=80"
   ],
   "w": {
    "wrath": 0.7,
    "envy": 0.4,
    "greed": 0.4,
    "conscience": -1,
    "mad": 1,
    "threat": 1
   },
   "base": -18,
   "harm": 3,
   "risk": 3,
   "not_user": true,
   "crime": "杀人",
   "do": "kill",
   "cool": 200,
   "deed": true,
   "text": "{a}杀了{b}。"
  },
  {
   "id": "coverup",
   "tier": "violence",
   "label": "掩盖",
   "target": null,
   "req": [
    "culprit_open"
   ],
   "w": {
    "afraid_case": 1.5,
    "neurotic": 0.5
   },
   "base": -3,
   "harm": 1,
   "risk": 3,
   "hidden": true,
   "do": "coverup",
   "cool": 45,
   "text": "{a}偷偷收拾了留下的痕迹。"
  },
  {
   "id": "leave_city",
   "tier": "violence",
   "label": "离开城市",
   "target": null,
   "req": [
    "wanted>=75",
    "!user"
   ],
   "w": {
    "afraid_case": 1.5,
    "neurotic": 0.3,
    "nerve": -0.3
   },
   "base": -6,
   "risk": 2,
   "do": "leave_city",
   "cool": 30,
   "text": "{a}连夜离开了洛杉矶。"
  },
  {
   "id": "surrender",
   "tier": "violence",
   "label": "自首",
   "target": null,
   "req": [
    "guilt>=60",
    "culprit_any",
    "!user"
   ],
   "w": {
    "conscience": 1.2,
    "guilt": 1.5,
    "nerve": 0.3
   },
   "base": -6,
   "do": "surrender",
   "cool": 30,
   "text": "{a}去警局自首了。"
  },
  {
   "id": "report",
   "tier": "violence",
   "label": "报警",
   "target": null,
   "req": [
    "unreported"
   ],
   "w": {
    "dutiful": 0.7,
    "afraid_any": 0.7,
    "conscience": 0.4
   },
   "base": 2,
   "risk": 1,
   "do": "report",
   "cool": 10,
   "deed": true,
   "text": "{a}去报了警。"
  },
  {
   "id": "revenge",
   "tier": "violence",
   "label": "报复",
   "target": "here",
   "req": [
    "grudge>=50"
   ],
   "w": {
    "wrath": 1,
    "pride": 0.7,
    "grudge": 1
   },
   "base": -8,
   "harm": 2,
   "risk": 2,
   "not_user": true,
   "do": "revenge",
   "cool": 40,
   "text": "{a}找{b}报仇。"
  },
  {
   "id": "protect",
   "tier": "violence",
   "label": "挡在前面保护",
   "target": "here",
   "reactive": true,
   "w": {
    "kind": 1,
    "nerve": 1,
    "aff": 1
   },
   "base": 0,
   "risk": 2,
   "text": "{a}挡在{b}前面。"
  },
  {
   "id": "investigate",
   "tier": "job",
   "label": "勘查",
   "target": null,
   "req": [
    "detective",
    "case_open",
    "job_time"
   ],
   "w": {
    "dutiful": 1,
    "open": 0.5
   },
   "base": 4,
   "do": "investigate",
   "cool": 3,
   "text": "{a}在{p}勘查。"
  },
  {
   "id": "question",
   "tier": "job",
   "label": "问话",
   "target": "here",
   "req": [
    "detective",
    "case_open",
    "job_time"
   ],
   "w": {
    "dutiful": 0.8,
    "suspect": 1,
    "mad": 0.3
   },
   "base": 3,
   "do": "question",
   "cool": 15,
   "text": "{a}找{b}问话。"
  },
  {
   "id": "arrest",
   "tier": "job",
   "label": "逮捕",
   "target": "here",
   "req": [
    "detective",
    "arrestable"
   ],
   "w": {
    "dutiful": 1,
    "nerve": 0.5
   },
   "base": 12,
   "do": "arrest",
   "cool": 5,
   "text": "{a}逮捕了{b}。"
  },
  {
   "id": "perform",
   "tier": "job",
   "label": "登台",
   "target": null,
   "req": [
    "performer",
    "place:bluebird_stage",
    "night"
   ],
   "w": {
    "pride": 0.8,
    "outgoing": 0.6
   },
   "base": -1,
   "fx": {
    "me": {
     "fame": 0.5,
     "mood": 4,
     "money": 1
    }
   },
   "cool": 15,
   "text": "{a}在蓝鸟的台上表演了一段。"
  }
 ]
};
