// 出題引擎：數學自動出題、題庫抽題、難度自動調整、錯題重出
(function (G) {
  'use strict';
  const ri = G.ri;
  const START_LEVEL = 2;      // 每個題型一開始的難度
  const REVIEW_CHANCE = 0.35; // 有錯題時，每題抽到錯題的機率

  // ---------- 數學出題 ----------
  function hasCarry(a, b) {
    while (a > 0 && b > 0) {
      if ((a % 10) + (b % 10) >= 10) return true;
      a = Math.floor(a / 10); b = Math.floor(b / 10);
    }
    return false;
  }
  function hasBorrow(a, b) {
    while (b > 0) {
      if (a % 10 < b % 10) return true;
      a = Math.floor(a / 10); b = Math.floor(b / 10);
    }
    return false;
  }
  function tryGen(make, ok) {
    let r = make();
    for (let i = 0; i < 400 && !ok(r); i++) r = make();
    return r;
  }
  const input = (text, ans) => ({ text: text, type: 'input', answerText: String(ans) });
  function choice(text, correct, wrongs) {
    const seen = {}; seen[correct] = 1;
    const list = [correct];
    wrongs.forEach((w) => { if (!seen[w] && list.length < 4) { seen[w] = 1; list.push(w); } });
    return { text: text, type: 'choice', choices: G.shuffle(list), answerText: correct };
  }

  const UNITS = {
    'm-cm': () => { const n = ri(1, 9); return input(n + ' 公尺 = ? 公分', n * 100); },
    'cm-mm': () => { const n = ri(1, 20); return input(n + ' 公分 = ? 毫米', n * 10); },
    'h-min': () => { const n = ri(1, 5); return input(n + ' 小時 = ? 分鐘', n * 60); },
    'min-s': () => { const n = ri(1, 5); return input(n + ' 分鐘 = ? 秒', n * 60); },
    'km-m': () => { const n = ri(1, 9); return input(n + ' 公里 = ? 公尺', n * 1000); },
    'day-h': () => { const n = ri(1, 3); return input(n + ' 日 = ? 小時', n * 24); },
    'cm-m': () => { const n = ri(1, 9); return input(n * 100 + ' 公分 = ? 公尺', n); },
    'm-cm2': () => { const a = ri(1, 9), b = ri(1, 99); return input(a + ' 公尺 ' + b + ' 公分 = ? 公分', a * 100 + b); },
    'h-min2': () => { const a = ri(1, 4), b = ri(1, 59); return input(a + ' 小時 ' + b + ' 分鐘 = ? 分鐘', a * 60 + b); },
    'km-m2': () => { const a = ri(1, 9), b = ri(1, 19) * 50; return input(a + ' 公里 ' + b + ' 公尺 = ? 公尺', a * 1000 + b); },
    'min-s2': () => { const a = ri(1, 5), b = ri(1, 59); return input(a + ' 分 ' + b + ' 秒 = ? 秒', a * 60 + b); }
  };

  const gens = {
    add(c) {
      const p = tryGen(() => [ri(c.min, c.max), ri(c.min, c.max)], (r) =>
        (!c.maxSum || r[0] + r[1] <= c.maxSum) &&
        (!c.carry || c.carry === 'any' || hasCarry(r[0], r[1]) === (c.carry === 'yes')));
      return input(p[0] + ' + ' + p[1] + ' = ?', p[0] + p[1]);
    },
    sub(c) {
      const p = tryGen(() => {
        const x = ri(c.min, c.max), y = ri(c.min, c.max);
        return x >= y ? [x, y] : [y, x];
      }, (r) => r[0] > r[1] &&
        (!c.borrow || c.borrow === 'any' || hasBorrow(r[0], r[1]) === (c.borrow === 'yes')));
      return input(p[0] + ' − ' + p[1] + ' = ?', p[0] - p[1]);
    },
    mul(c) {
      const a = ri(c.a[0], c.a[1]), b = ri(c.b[0], c.b[1]);
      if (c.blank) {
        return Math.random() < 0.5
          ? input('□ × ' + b + ' = ' + a * b + '，□ = ?', a)
          : input(a + ' × □ = ' + a * b + '，□ = ?', b);
      }
      return input(a + ' × ' + b + ' = ?', a * b);
    },
    div(c) {
      const d = ri(c.d[0], c.d[1]), q = ri(c.q[0], c.q[1]);
      return input(d * q + ' ÷ ' + d + ' = ?', q);
    },
    frac(c) {
      let mode = c.mode;
      if (mode === 'mixed') mode = Math.random() < 0.5 ? 'add' : 'sub';
      const den = ri(Math.max(3, c.den[0]), c.den[1]);
      const f = (n, d) => n + '/' + d;
      if (mode === 'compare') {
        const a = ri(1, den - 1);
        const b = tryGen(() => ri(1, den - 1), (x) => x !== a);
        return choice(f(a, den) + ' 和 ' + f(b, den) + '，哪一個比較大？', f(Math.max(a, b), den), [f(Math.min(a, b), den), '一樣大']);
      }
      if (mode === 'unit') {
        const d1 = ri(c.den[0], c.den[1]);
        const d2 = tryGen(() => ri(c.den[0], c.den[1]), (x) => x !== d1);
        return choice(f(1, d1) + ' 和 ' + f(1, d2) + '，哪一個比較大？', f(1, Math.min(d1, d2)), [f(1, Math.max(d1, d2)), '一樣大']);
      }
      if (mode === 'add') {
        const a = ri(1, den - 2), b = ri(1, den - 1 - a), s = a + b;
        return choice(f(a, den) + ' + ' + f(b, den) + ' = ?', f(s, den),
          [f(s, den * 2), f(s + 1, den), f(s - 1, den), f(s + 2, den), f(s, den + 1)]);
      }
      // sub
      const a = ri(2, den - 1), b = ri(1, a - 1), r = a - b;
      return choice(f(a, den) + ' − ' + f(b, den) + ' = ?', f(r, den),
        [f(a + b, den), f(r + 1, den), f(r, den * 2), f(r + 2, den), f(r, den + 1)]);
    },
    unit(c) { return UNITS[G.pick(c.kinds)](); }
  };

  // ---------- 題庫抽題 ----------
  function fromBank(pack, topicId, t, level, used) {
    const all = (pack.banks[t.bank] || []).filter((x) => x.tag === t.tag);
    if (!all.length) return null;
    const keyOf = (x) => topicId + '|' + x.q + '|' + x.choices[x.answer];
    const fresh = all.filter((x) => !used.has(keyOf(x)));
    const tiers = [
      fresh.filter((x) => x.level === level),
      fresh.filter((x) => Math.abs(x.level - level) <= 1),
      fresh.filter((x) => x.level <= level),
      fresh,
      all
    ];
    let pool = tiers[0].length && Math.random() < 0.6 ? tiers[0] : null;
    for (let i = 1; !pool && i < tiers.length; i++) if (tiers[i].length) pool = tiers[i];
    const x = G.pick(pool);
    return {
      key: keyOf(x), topic: topicId, text: x.q, type: 'choice',
      choices: G.shuffle(x.choices), answerText: x.choices[x.answer],
      speak: x.speak || '', say: x.say || ''
    };
  }

  function make(pack, topicId, level, used) {
    const t = pack.topics[topicId];
    if (!t) return null;
    if (t.math) {
      const cfg = pack.math[t.math];
      const lv = cfg.levels[Math.max(1, Math.min(cfg.levels.length, level)) - 1];
      let q = null;
      for (let i = 0; i < 15; i++) {
        q = gens[cfg.gen](lv);
        q.topic = topicId;
        q.key = topicId + '|' + q.text + '|' + q.answerText;
        if (!used.has(q.key)) break;
      }
      return q;
    }
    return fromBank(pack, topicId, t, level, used);
  }

  function isEnglishText(s) { return /^[A-Za-z][A-Za-z ,.'!?-]*$/.test(s); }

  G.Q = {
    gens: gens,
    START_LEVEL: START_LEVEL,

    level(topicId) {
      const d = G.Save.gradeData().diff[topicId];
      return d ? d.level : START_LEVEL;
    },

    // 取下一題。used 是這場戰鬥已出過的題目，避免重複。
    next(stage, used) {
      const pack = G.Save.pack();
      const gd = G.Save.gradeData();
      const cand = gd.wrong.filter((w) => stage.topics.indexOf(w.topic) >= 0 && !used.has(w.key));
      if (cand.length && Math.random() < REVIEW_CHANCE) {
        const w = G.pick(cand);
        return {
          key: w.key, topic: w.topic, text: w.text, type: w.type,
          choices: w.choices ? G.shuffle(w.choices) : null,
          answerText: w.answerText, speak: w.speak || '', say: w.say || '', review: true
        };
      }
      const topicId = G.pick(stage.topics);
      const level = (stage.boss ? (stage.level || 3) : this.level(topicId)) + (stage.plus || 0);
      return make(pack, topicId, level, used);
    },

    check(q, given) {
      if (q.type === 'input') return given !== '' && String(Number(given)) === q.answerText;
      return given === q.answerText;
    },

    // 作答後要朗讀的英文（沒有就回傳空字串）
    sayText(q) {
      if (q.say) return q.say;
      const t = G.Save.pack().topics[q.topic];
      return t && t.subject === 'english' && isEnglishText(q.answerText) ? q.answerText : '';
    },

    // 記錄作答結果：統計、難度調整、錯題本。回傳難度變化 'up' / 'down' / ''
    record(q, correct, stage) {
      const gd = G.Save.gradeData();
      const day = G.Save.day();
      const ts = gd.topics[q.topic] || (gd.topics[q.topic] = { q: 0, correct: 0 });
      ts.q += 1; day.q += 1;
      if (correct) { ts.correct += 1; day.correct += 1; }

      // 錯題本：答錯加入，連續答對兩次才移除
      const idx = gd.wrong.findIndex((w) => w.key === q.key);
      if (correct) {
        if (idx >= 0) {
          gd.wrong[idx].streak += 1;
          if (gd.wrong[idx].streak >= 2) gd.wrong.splice(idx, 1);
        }
      } else {
        if (idx >= 0) { gd.wrong[idx].streak = 0; gd.wrong[idx].wrong += 1; }
        else {
          gd.wrong.push({
            key: q.key, topic: q.topic, text: q.text, type: q.type,
            choices: q.choices ? q.choices.slice() : null, answerText: q.answerText,
            speak: q.speak || '', say: q.say || '', streak: 0, wrong: 1
          });
          if (gd.wrong.length > 100) gd.wrong.shift();
        }
        const m = gd.misses[q.key] || (gd.misses[q.key] = { text: q.text, answer: q.answerText, topic: q.topic, n: 0 });
        m.n += 1;
        const keys = Object.keys(gd.misses);
        if (keys.length > 150) {
          keys.sort((a, b) => gd.misses[a].n - gd.misses[b].n);
          delete gd.misses[keys[0] === q.key ? keys[1] : keys[0]];
        }
      }

      // 難度調整：魔王關、進階版與錯題複習不列入
      let change = '';
      if (!stage.boss && !stage.hard && !q.review) {
        const d = gd.diff[q.topic] || (gd.diff[q.topic] = { level: START_LEVEL, recent: [] });
        d.recent.push(correct ? 1 : 0);
        if (d.recent.length > 10) d.recent.shift();
        if (d.recent.length >= 5) {
          const rate = d.recent.reduce((a, b) => a + b, 0) / d.recent.length;
          if (rate > 0.85 && d.level < 5) { d.level += 1; d.recent = []; change = 'up'; }
          else if (rate < 0.6 && d.level > 1) { d.level -= 1; d.recent = []; change = 'down'; }
        }
      }
      return change;
    }
  };
})(window.G);
