// 由 python -m tools.export_world 从 content/sim.json 和 content/story_*.json 生成，请改 content 下的文件后重新导出
window.SIM = {
 "_说明": "第二版（城市模拟）的规则数据，见 docs/sim-design.md。places.*.map 是测试页地图上的位置（0–1）；places.*.hotspots 是画面上能点的东西：find_en 给识别模型找，actions 是点了能做的动作（sub:<id> 表示去小地点）。actions.*.visual_en 是这个动作画成一格时的画面提示。places.*.lights 是每个时段用哪张场景底图（对应 world.json 里的光线）。改完运行 python3 -m tools.export_world 导出到 web/sim_data.js。数值都是初始值，按 web/sim.html 的实测再调。",
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
       "label": "门",
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
    "eat",
    "gossip",
    "eavesdrop",
    "help_out",
    "read_paper"
   ],
   "public": true
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
    "observe"
   ],
   "public": true
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
   "label": "吃饭",
   "rounds": 1,
   "cost": 0.25,
   "effects": {
    "energy": 14,
    "mood": 5
   },
   "importance": "daily",
   "need": "energy",
   "once_per_slot": true
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
