// 三年級數學出題設定。每個題型有 5 個難度等級（由易到難），遊戲會依孩子的答對率自動升降。
// gen 是出題方式（定義在 js/questions.js）：add 加法、sub 減法、mul 乘法、div 除法、frac 分數、unit 單位換算
registerPack('grade3', {
  math: {
    // carry：'no' 不進位、'yes' 一定進位、'any' 都可以；maxSum 是答案上限
    add: { gen: 'add', levels: [
      { min: 10, max: 99, carry: 'no' },
      { min: 10, max: 99, carry: 'yes' },
      { min: 100, max: 499, carry: 'any', maxSum: 999 },
      { min: 100, max: 899, carry: 'yes', maxSum: 999 },
      { min: 1000, max: 4999, carry: 'any', maxSum: 9999 }
    ] },

    // borrow：'no' 不退位、'yes' 一定退位、'any' 都可以
    sub: { gen: 'sub', levels: [
      { min: 10, max: 99, borrow: 'no' },
      { min: 10, max: 99, borrow: 'yes' },
      { min: 100, max: 999, borrow: 'any' },
      { min: 100, max: 999, borrow: 'yes' },
      { min: 1000, max: 9999, borrow: 'any' }
    ] },

    // a × b；blank: true 會出「□ × 7 = 56」這種填空題
    mul9: { gen: 'mul', levels: [
      { a: [2, 5], b: [1, 9] },
      { a: [2, 9], b: [2, 9] },
      { a: [6, 9], b: [6, 9] },
      { a: [2, 9], b: [2, 9], blank: true },
      { a: [3, 10], b: [6, 10], blank: true }
    ] },

    mul2: { gen: 'mul', levels: [
      { a: [10, 20], b: [2, 3] },
      { a: [11, 49], b: [2, 5] },
      { a: [11, 99], b: [2, 9] },
      { a: [100, 300], b: [2, 5] },
      { a: [100, 999], b: [2, 9] }
    ] },

    // d 是除數範圍、q 是商的範圍，都能整除
    div: { gen: 'div', levels: [
      { d: [2, 5], q: [1, 9] },
      { d: [2, 9], q: [2, 9] },
      { d: [6, 9], q: [6, 9] },
      { d: [2, 9], q: [10, 20] },
      { d: [2, 9], q: [11, 99] }
    ] },

    // mode：compare 同分母比大小、unit 單位分數比大小、add 同分母加法、sub 同分母減法、mixed 加減混合
    frac: { gen: 'frac', levels: [
      { mode: 'compare', den: [3, 8] },
      { mode: 'unit', den: [2, 10] },
      { mode: 'add', den: [4, 10] },
      { mode: 'sub', den: [4, 12] },
      { mode: 'mixed', den: [6, 15] }
    ] },

    // kinds：可出的換算種類
    unit: { gen: 'unit', levels: [
      { kinds: ['m-cm', 'h-min'] },
      { kinds: ['m-cm', 'h-min', 'cm-mm', 'min-s'] },
      { kinds: ['km-m', 'day-h', 'cm-m'] },
      { kinds: ['m-cm2', 'h-min2'] },
      { kinds: ['m-cm2', 'h-min2', 'km-m2', 'min-s2'] }
    ] }
  }
});
