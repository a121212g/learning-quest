// 三年級內容包：區域、關卡、怪物、夥伴
// 升年級時：複製整個 grade3 資料夾改名（例如 grade4），把所有 'grade3' 改成 'grade4' 再修改內容。
registerPack('grade3', {
  name: '三年級',
  order: 3,

  // 題型。math 對應 math-config.js 的設定；bank + tag 對應題庫檔裡的題目。
  topics: {
    add:      { name: '加法',         subject: 'math',    math: 'add' },
    sub:      { name: '減法',         subject: 'math',    math: 'sub' },
    mul9:     { name: '九九乘法',     subject: 'math',    math: 'mul9' },
    mul2:     { name: '多位數乘法',   subject: 'math',    math: 'mul2' },
    div:      { name: '除法',         subject: 'math',    math: 'div' },
    frac:     { name: '分數',         subject: 'math',    math: 'frac' },
    unit:     { name: '時間與長度',   subject: 'math',    math: 'unit' },
    zhuyin:   { name: '注音',         subject: 'chinese', bank: 'chinese', tag: 'zhuyin' },
    shape:    { name: '字形辨識',     subject: 'chinese', bank: 'chinese', tag: 'shape' },
    word:     { name: '詞語運用',     subject: 'chinese', bank: 'chinese', tag: 'word' },
    meaning:  { name: '相似與相反詞', subject: 'chinese', bank: 'chinese', tag: 'meaning' },
    idiom:    { name: '成語',         subject: 'chinese', bank: 'chinese', tag: 'idiom' },
    letter:   { name: '字母',         subject: 'english', bank: 'english', tag: 'letter' },
    vocab:    { name: '單字',         subject: 'english', bank: 'english', tag: 'vocab' },
    spell:    { name: '拼字',         subject: 'english', bank: 'english', tag: 'spell' },
    numcolor: { name: '數字與顏色',   subject: 'english', bank: 'english', tag: 'numcolor' },
    sentence: { name: '句型',         subject: 'english', bank: 'english', tag: 'sentence' }
  },

  subjects: { math: '數學', chinese: '國語', english: '英語' },

  // 區域 → 關卡。monster.hp 越高要答對越多題；monster.atk 是答錯時扣的血。
  // boss: true 的魔王關固定用 level 指定的難度出題。
  // hard 是進階版出現的進化型怪物（名字、圖示；也可加 hp、atk、xp、gold、plus 個別指定）。
  areas: [
    {
      id: 'forest', name: '數字森林', icon: '🌲', subject: 'math', unlockLevel: 1, color: '#2e9e5b',
      stages: [
        { id: 'f1', name: '加減小徑', topics: ['add', 'sub'], xp: 30, gold: 20,
          hard: { name: '算數蝴蝶', icon: '🦋' },
          monster: { id: 'worm', name: '算數毛毛蟲', icon: '🐛', hp: 60, atk: 8 } },
        { id: 'f2', name: '九九乘法林', topics: ['mul9'], xp: 35, gold: 22,
          hard: { name: '乘法樹精', icon: '🌳' },
          monster: { id: 'mush', name: '乘法蘑菇', icon: '🍄', hp: 70, atk: 9 } },
        { id: 'f3', name: '乘法山洞', topics: ['mul2'], xp: 40, gold: 25,
          hard: { name: '倍數吸血鬼', icon: '🧛' },
          monster: { id: 'bat', name: '倍數蝙蝠', icon: '🦇', hp: 75, atk: 10 } },
        { id: 'f4', name: '除法峽谷', topics: ['div'], xp: 45, gold: 28,
          hard: { name: '除法狼王', icon: '🐺' },
          monster: { id: 'wolf', name: '除法野狼', icon: '🐺', hp: 80, atk: 11 } },
        { id: 'f5', name: '分數與時鐘塔', topics: ['frac', 'unit'], xp: 50, gold: 30,
          hard: { name: '時空神鷹', icon: '🦅' },
          monster: { id: 'owl', name: '貓頭鷹博士', icon: '🦉', hp: 85, atk: 12 } },
        { id: 'f6', name: '森林巨龍', boss: true, level: 3, xp: 100, gold: 80,
          topics: ['add', 'sub', 'mul9', 'mul2', 'div', 'frac', 'unit'],
          hard: { name: '遠古巨龍', icon: '🐉' },
          monster: { id: 'dragon', name: '森林巨龍', icon: '🐲', hp: 150, atk: 14 } }
      ]
    },
    {
      id: 'cave', name: '文字洞窟', icon: '⛰️', subject: 'chinese', unlockLevel: 2, color: '#8a5a2b',
      stages: [
        { id: 'c1', name: '注音石階', topics: ['zhuyin'], xp: 30, gold: 20,
          hard: { name: '注音蛛后', icon: '🕸️' },
          monster: { id: 'spider', name: '注音蜘蛛', icon: '🕷️', hp: 60, atk: 8 } },
        { id: 'c2', name: '字形岔路', topics: ['shape'], xp: 35, gold: 22,
          hard: { name: '字形鱷魚', icon: '🐊' },
          monster: { id: 'lizard', name: '字形蜥蜴', icon: '🦎', hp: 70, atk: 9 } },
        { id: 'c3', name: '詞語大廳', topics: ['word'], xp: 40, gold: 25,
          hard: { name: '詞語南瓜魔', icon: '🎃' },
          monster: { id: 'ghost', name: '詞語幽靈', icon: '👻', hp: 75, atk: 10 } },
        { id: 'c4', name: '鏡子長廊', topics: ['meaning'], xp: 45, gold: 28,
          hard: { name: '反義巨石神', icon: '🗿' },
          monster: { id: 'statue', name: '反義石像', icon: '🗿', hp: 80, atk: 11 } },
        { id: 'c5', name: '成語密室', topics: ['idiom'], xp: 50, gold: 30,
          hard: { name: '成語毒蛇王', icon: '🐍' },
          monster: { id: 'scorpion', name: '成語毒蠍', icon: '🦂', hp: 85, atk: 12 } },
        { id: 'c6', name: '文字魔王', boss: true, level: 3, xp: 100, gold: 80,
          topics: ['zhuyin', 'shape', 'word', 'meaning', 'idiom'],
          hard: { name: '文字大魔神', icon: '👺' },
          monster: { id: 'ogre', name: '文字魔王', icon: '👹', hp: 150, atk: 14 } }
      ]
    },
    {
      id: 'bay', name: '英語海灣', icon: '🏝️', subject: 'english', unlockLevel: 3, color: '#1f8fc4',
      stages: [
        { id: 'b1', name: '字母沙灘', topics: ['letter'], xp: 30, gold: 20,
          hard: { name: '字母龍蝦', icon: '🦞' },
          monster: { id: 'crab', name: '字母螃蟹', icon: '🦀', hp: 60, atk: 8 } },
        { id: 'b2', name: '單字淺灘', topics: ['vocab'], xp: 35, gold: 22,
          hard: { name: '單字大王烏賊', icon: '🦑' },
          monster: { id: 'octopus', name: '單字章魚', icon: '🐙', hp: 70, atk: 9 } },
        { id: 'b3', name: '拼字珊瑚礁', topics: ['spell'], xp: 40, gold: 25,
          hard: { name: '拼字獅子魚', icon: '🐠' },
          monster: { id: 'puffer', name: '拼字河豚', icon: '🐡', hp: 75, atk: 10 } },
        { id: 'b4', name: '彩虹海溝', topics: ['numcolor'], xp: 45, gold: 28,
          hard: { name: '數字大白鯊', icon: '🦈' },
          monster: { id: 'shark', name: '數字鯊魚', icon: '🦈', hp: 80, atk: 11 } },
        { id: 'b5', name: '會話燈塔', topics: ['sentence'], xp: 50, gold: 30,
          hard: { name: '句型孔雀', icon: '🦚' },
          monster: { id: 'parrot', name: '句型鸚鵡', icon: '🦜', hp: 85, atk: 12 } },
        { id: 'b6', name: '海灣鯨王', boss: true, level: 3, xp: 100, gold: 80,
          topics: ['letter', 'vocab', 'spell', 'numcolor', 'sentence'],
          hard: { name: '深海鯨皇', icon: '🐳' },
          monster: { id: 'whale', name: '海灣鯨王', icon: '🐋', hp: 150, atk: 14 } }
      ]
    }
  ],

  // 夥伴：id 要和上面怪物的 id 相同，打倒那隻怪物就有機會收服。
  // bonus.type：gold 金幣加成、xp 經驗加成、power 攻擊加成、guard 受傷減少、heal 答對回血（value 為回血量）
  pets: [
    { id: 'worm',     bonus: { type: 'gold',  value: 0.10 } },
    { id: 'mush',     bonus: { type: 'heal',  value: 3 } },
    { id: 'bat',      bonus: { type: 'xp',    value: 0.10 } },
    { id: 'wolf',     bonus: { type: 'power', value: 0.10 } },
    { id: 'owl',      bonus: { type: 'guard', value: 0.20 } },
    { id: 'dragon',   bonus: { type: 'power', value: 0.20 } },
    { id: 'spider',   bonus: { type: 'guard', value: 0.10 } },
    { id: 'lizard',   bonus: { type: 'gold',  value: 0.15 } },
    { id: 'ghost',    bonus: { type: 'xp',    value: 0.15 } },
    { id: 'statue',   bonus: { type: 'guard', value: 0.25 } },
    { id: 'scorpion', bonus: { type: 'power', value: 0.15 } },
    { id: 'ogre',     bonus: { type: 'xp',    value: 0.25 } },
    { id: 'crab',     bonus: { type: 'heal',  value: 2 } },
    { id: 'octopus',  bonus: { type: 'gold',  value: 0.20 } },
    { id: 'puffer',   bonus: { type: 'guard', value: 0.15 } },
    { id: 'shark',    bonus: { type: 'power', value: 0.15 } },
    { id: 'parrot',   bonus: { type: 'xp',    value: 0.20 } },
    { id: 'whale',    bonus: { type: 'gold',  value: 0.30 } }
  ]
});
