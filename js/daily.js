// 每日任務與連續天數
(function (G) {
  'use strict';

  function makeTasks() {
    const pack = G.Save.pack();
    const groups = [
      [
        { type: 'correct', target: 10, label: '答對 10 題', gold: 20, xp: 15 },
        { type: 'correct', target: 20, label: '答對 20 題', gold: 35, xp: 25 }
      ],
      [
        { type: 'win', target: 2, label: '打贏 2 場戰鬥', gold: 20, xp: 15 },
        { type: 'win', target: 3, label: '打贏 3 場戰鬥', gold: 30, xp: 25 }
      ],
      [{ type: 'combo', target: 5, label: '連續答對 5 題', gold: 25, xp: 20 }],
      [{ type: 'star3', target: 1, label: '拿到 1 次三星過關', gold: 25, xp: 20 }]
    ];
    pack.areas.forEach((a) => {
      if (G.state.level >= a.unlockLevel) {
        groups.push([{ type: 'subject', subject: a.subject, target: 1, label: '在「' + a.name + '」打贏 1 關', gold: 20, xp: 15 }]);
      }
    });
    return G.shuffle(groups).slice(0, 3).map((g) => {
      const t = Object.assign({}, G.pick(g));
      t.progress = 0; t.claimed = false;
      return t;
    });
  }

  G.Daily = {
    // 換日時產生新任務
    ensure() {
      const d = G.state.daily, t = G.today();
      if (d.date !== t || !d.tasks.length) {
        d.date = t; d.tasks = makeTasks(); d.chest = false;
        G.Save.write();
      }
    },

    streak() {
      const d = G.state.daily, t = G.today();
      return d.lastPlay === t || d.lastPlay === G.dateAdd(t, -1) ? d.streak : 0;
    },

    // 今天有完成戰鬥就算玩過一天
    markPlayed() {
      const d = G.state.daily, t = G.today();
      if (d.lastPlay === t) return;
      d.streak = d.lastPlay === G.dateAdd(t, -1) ? d.streak + 1 : 1;
      d.lastPlay = t;
    },

    // 連續天數的獎勵加成：第 2 天起每天 +10%，最多 +50%
    mult() { return 1 + 0.1 * Math.min(Math.max(this.streak() - 1, 0), 5); },

    on(type, v) {
      this.ensure();
      G.state.daily.tasks.forEach((t) => {
        if (t.claimed) return;
        if (type === 'correct' && t.type === 'correct') t.progress += 1;
        else if (type === 'combo' && t.type === 'combo') t.progress = Math.max(t.progress, v);
        else if (type === 'win') {
          if (t.type === 'win') t.progress += 1;
          else if (t.type === 'subject' && t.subject === v.subject) t.progress += 1;
          else if (t.type === 'star3' && v.stars === 3) t.progress += 1;
        }
        if (t.progress > t.target) t.progress = t.target;
      });
    },

    claimable() {
      const d = G.state.daily;
      let n = d.tasks.filter((t) => !t.claimed && t.progress >= t.target).length;
      if (!d.chest && d.tasks.length && d.tasks.every((t) => t.claimed)) n += 1;
      return n;
    }
  };

  function afterReward(gold, xp, extra) {
    G.Player.addGold(gold);
    const ups = G.Player.addXp(xp);
    G.Save.write();
    G.sfx(ups ? 'level' : 'coin');
    G.toast('獲得 🪙' + gold + '　✨' + xp + ' 經驗' + (extra || '') + (ups ? '　🎉 升到 Lv ' + G.state.level + '！' : ''));
    G.refresh();
  }

  G.actions['daily-claim'] = (d) => {
    const t = G.state.daily.tasks[Number(d.i)];
    if (!t || t.claimed || t.progress < t.target) return;
    const m = G.Daily.mult();
    t.claimed = true;
    afterReward(Math.round(t.gold * m), Math.round(t.xp * m));
  };

  G.actions['daily-chest'] = () => {
    const d = G.state.daily;
    if (d.chest || !d.tasks.every((t) => t.claimed)) return;
    const m = G.Daily.mult();
    d.chest = true;
    G.state.potions += 1;
    afterReward(Math.round(50 * m), Math.round(30 * m), '　🧪 藥水 ×1');
  };

  G.screens.daily = () => {
    G.Daily.ensure();
    const d = G.state.daily;
    const streak = G.Daily.streak();
    const m = G.Daily.mult();
    const playedToday = d.lastPlay === G.today();
    const tasks = d.tasks.map((t, i) => {
      const done = t.progress >= t.target;
      const btn = t.claimed
        ? '<span class="tag ok">已領取</span>'
        : done
          ? '<button class="btn gold sm" data-act="daily-claim" data-i="' + i + '">領取</button>'
          : '<span class="tag">' + t.progress + ' / ' + t.target + '</span>';
      return '<div class="card task' + (t.claimed ? ' dim' : '') + '">' +
        '<div class="task-main"><div class="task-label">' + G.esc(t.label) + '</div>' +
        G.bar(t.progress, t.target, 'green') +
        '<div class="sub">獎勵 🪙' + Math.round(t.gold * m) + '　✨' + Math.round(t.xp * m) + '</div></div>' + btn + '</div>';
    }).join('');
    const allClaimed = d.tasks.length && d.tasks.every((t) => t.claimed);
    const chest = d.chest
      ? '<div class="card chest dim"><div class="chest-icon">🎁</div><div><b>今日寶箱已開啟</b><div class="sub">明天再來挑戰新任務！</div></div></div>'
      : '<div class="card chest"><div class="chest-icon">🎁</div><div class="task-main"><b>今日寶箱</b><div class="sub">完成並領取全部 3 個任務就能打開</div></div>' +
        (allClaimed ? '<button class="btn gold sm" data-act="daily-chest">打開</button>' : '<span class="tag">🔒</span>') + '</div>';

    return G.page('daily',
      '<h2 class="title">📜 每日任務</h2>' +
      '<div class="card streak"><div class="streak-num">🔥 ' + streak + '</div><div><b>連續 ' + streak + ' 天</b>' +
      '<div class="sub">' + (playedToday ? '今天已經完成冒險了，明天再來可以延續！' : '今天完成一場戰鬥就能延續連續天數') +
      '</div><div class="sub">目前獎勵加成：+' + Math.round((m - 1) * 100) + '%（每多一天 +10%，最多 +50%）</div></div></div>' +
      tasks + chest);
  };
})(window.G);
