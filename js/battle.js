// 回合制答題戰鬥：答對攻擊怪物，答錯被怪物攻擊
(function (G) {
  'use strict';
  let B = null; // 目前這場戰鬥的狀態

  function nextQuestion() {
    B.q = G.Q.next(B.stage, B.used);
    B.used.add(B.q.key);
    B.input = '';
    B.picked = null;
    B.phase = 'ask';
    B.fx = '';
    B.dmg = 0;
    B.num += 1;
  }

  function start(areaId, stageId) {
    const area = G.findArea(areaId);
    const stage = area.stages.filter((s) => s.id === stageId)[0];
    if (!stage) return;
    G.closeModal();
    B = {
      area: area, stage: stage,
      mMax: stage.monster.hp, mHp: stage.monster.hp,
      pMax: G.Player.maxHp(), pHp: G.Player.maxHp(),
      combo: 0, maxCombo: 0, asked: 0, correct: 0, num: 0,
      used: new Set(), startAt: Date.now()
    };
    nextQuestion();
    G.go('battle');
  }
  G.actions['battle-start'] = (d) => start(d.area, d.stage);
  G.Battle = { start: start, current: () => B };

  function addTime() {
    const sec = Math.min(900, Math.round((Date.now() - B.startAt) / 1000));
    G.Save.day().sec += sec;
  }

  function finish(win) {
    const s = G.state, gd = G.Save.gradeData(), st = B.stage;
    addTime();
    G.Daily.markPlayed();
    const acc = B.asked ? B.correct / B.asked : 0;
    const before = s.level;
    const r = {
      win: win, area: B.area, stage: st, asked: B.asked, correct: B.correct,
      acc: Math.round(acc * 100), maxCombo: B.maxCombo, stars: 0, xp: 0, gold: 0, pet: null, first: false
    };
    if (win) {
      r.stars = acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1;
      r.first = !gd.stars[st.id];
      gd.stars[st.id] = Math.max(gd.stars[st.id] || 0, r.stars);
      r.xp = Math.round(st.xp * (1 + G.Pets.bonus('xp')));
      r.gold = Math.round(st.gold * (1 + G.Pets.bonus('gold')));
      r.pet = G.Pets.tryCapture(st);
      G.Daily.on('win', { subject: B.area.subject, stars: r.stars });
    } else {
      r.xp = B.correct * 2; // 沒過關也有努力的獎勵
    }
    G.Player.addGold(r.gold);
    r.ups = G.Player.addXp(r.xp);
    r.level = s.level;
    r.opened = G.Save.pack().areas.filter((a) => a.unlockLevel > before && a.unlockLevel <= s.level);
    G.Save.write();
    G.sfx(win ? (r.ups ? 'level' : 'win') : 'lose');
    B = null;
    G.go('result', r);
  }

  function resolve(given) {
    if (!B || B.phase !== 'ask') return;
    const q = B.q, me = B;
    const ok = G.Q.check(q, given);
    B.picked = given;
    B.asked += 1;
    G.Q.record(q, ok, B.stage);

    if (ok) {
      B.correct += 1;
      B.combo += 1;
      B.maxCombo = Math.max(B.maxCombo, B.combo);
      const base = G.Player.atk() * (1 + G.Pets.bonus('power'));
      const mult = 1 + 0.1 * Math.min(B.combo - 1, 5);
      // 每一擊最多打掉怪物五分之一的血，確保每關至少要答對 5 題
      B.dmg = Math.min(Math.round(base * mult), Math.ceil(B.mMax / 5));
      B.mHp = Math.max(0, B.mHp - B.dmg);
      B.pHp = Math.min(B.pMax, B.pHp + G.Pets.bonus('heal'));
      B.phase = 'right'; B.fx = 'hit-mon';
      G.Daily.on('correct');
      G.Daily.on('combo', B.combo);
      G.sfx('right');
    } else {
      B.combo = 0;
      B.dmg = Math.max(1, Math.round(B.stage.monster.atk * (1 - G.Pets.bonus('guard'))));
      B.pHp = Math.max(0, B.pHp - B.dmg);
      B.phase = 'wrong'; B.fx = 'hit-me';
      G.sfx('wrong');
    }
    G.Save.write();
    G.refresh();

    const say = G.Q.sayText(q);
    if (say) G.speak(say);

    if (ok) {
      // 答對自動進下一題；答錯要按「知道了」，讓孩子看清楚正確答案
      setTimeout(() => {
        if (B !== me || G.current !== 'battle' || B.phase !== 'right') return;
        advance();
      }, say ? 1500 : 950);
    }
  }

  function advance() {
    if (!B) return;
    if (B.mHp <= 0) return finish(true);
    if (B.pHp <= 0) return finish(false);
    nextQuestion();
    G.refresh();
  }

  G.actions['battle-ans'] = (d) => { if (B) resolve(B.q.choices[Number(d.i)]); };
  G.actions['battle-key'] = (d) => {
    if (!B || B.phase !== 'ask') return;
    if (d.k === 'del') B.input = B.input.slice(0, -1);
    else if (d.k === 'ok') { if (B.input !== '') resolve(B.input); return; }
    else if (B.input.length < 6) B.input += d.k;
    G.sfx('tap');
    B.fx = '';
    G.refresh();
  };
  G.actions['battle-next'] = () => { if (B && B.phase === 'wrong') advance(); };
  G.actions['battle-speak'] = () => { if (B) G.speak(B.q.speak); };
  G.actions['battle-potion'] = () => {
    if (!B || B.phase !== 'ask' || G.state.potions <= 0 || B.pHp >= B.pMax) return;
    G.state.potions -= 1;
    B.pHp = Math.min(B.pMax, B.pHp + G.ITEMS.potion.heal);
    B.fx = 'heal';
    G.Save.write();
    G.sfx('coin');
    G.refresh();
  };
  G.actions['battle-flee'] = () => {
    G.confirm('要離開這場戰鬥嗎？這一關要重新挑戰喔。', '離開', () => {
      if (B) { addTime(); if (B.asked) G.Daily.markPlayed(); G.Save.write(); }
      B = null;
      G.go('map');
    });
  };

  // 鍵盤操作（電腦上測試或接鍵盤時使用）
  document.addEventListener('keydown', (e) => {
    if (G.current !== 'battle' || !B || !G.$('#modal').hidden) return;
    if (B.phase === 'wrong') { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); advance(); } return; }
    if (B.phase !== 'ask') return;
    if (B.q.type === 'input') {
      if (/^[0-9]$/.test(e.key)) G.actions['battle-key']({ k: e.key });
      else if (e.key === 'Backspace') G.actions['battle-key']({ k: 'del' });
      else if (e.key === 'Enter') G.actions['battle-key']({ k: 'ok' });
    } else if (/^[1-4]$/.test(e.key) && B.q.choices[Number(e.key) - 1] !== undefined) {
      resolve(B.q.choices[Number(e.key) - 1]);
    }
  });

  function answersHtml() {
    const q = B.q, asking = B.phase === 'ask';
    if (q.type === 'choice') {
      return '<div class="choices' + (q.choices.some((c) => c.length > 8) ? ' long' : '') + '">' + q.choices.map((c, i) => {
        let cls = '';
        if (!asking) {
          if (c === q.answerText) cls = ' right';
          else if (c === B.picked) cls = ' wrong';
          else cls = ' fade';
        }
        return '<button class="choice' + cls + '" data-act="battle-ans" data-i="' + i + '"' + (asking ? '' : ' disabled') + '>' + G.esc(c) + '</button>';
      }).join('') + '</div>';
    }
    const shown = asking ? B.input : String(B.picked);
    const cls = asking ? '' : (B.phase === 'right' ? ' right' : ' wrong');
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'].map((k) =>
      '<button class="key' + (k === 'ok' ? ' ok' : k === 'del' ? ' del' : '') + '" data-act="battle-key" data-k="' + k + '"' +
      (asking && !(k === 'ok' && B.input === '') ? '' : ' disabled') + '>' + (k === 'del' ? '⌫' : k === 'ok' ? '確定' : k) + '</button>').join('');
    return '<div class="answer-box' + cls + '">' + (shown === '' ? '<span class="ph">輸入答案</span>' : G.esc(shown)) + '</div>' +
      '<div class="keypad">' + keys + '</div>';
  }

  G.screens.battle = () => {
    if (!B) return G.screens.map();
    const s = G.state, q = B.q, st = B.stage, pack = G.Save.pack();
    const pet = G.Pets.active();
    const topic = pack.topics[q.topic];
    let feedback = '';
    if (B.phase === 'right') {
      feedback = '<div class="feedback good">⭕ 答對了！' + (B.combo >= 2 ? '　🔥 ' + B.combo + ' 連擊' : '') + '</div>';
    } else if (B.phase === 'wrong') {
      feedback = '<div class="feedback bad"><div>❌ 正確答案是 <b>' + G.esc(q.answerText) + '</b></div>' +
        '<button class="btn primary" data-act="battle-next">知道了</button></div>';
    }
    const canPotion = B.phase === 'ask' && s.potions > 0 && B.pHp < B.pMax;

    return '<div class="battle" style="--area:' + B.area.color + '">' +
      '<div class="b-top"><button class="btn ghost sm" data-act="battle-flee">✕ 離開</button>' +
      '<b>' + (st.boss ? '👑 ' : '') + G.esc(st.name) + '</b><span>第 ' + B.num + ' 題</span></div>' +

      '<div class="b-field">' +
      '<div class="b-side' + (B.fx === 'hit-me' ? ' shake' : '') + (B.fx === 'heal' ? ' glow' : '') + '">' +
      (B.fx === 'hit-me' ? '<span class="float bad">−' + B.dmg + '</span>' : '') +
      '<div class="b-ava">' + G.esc(s.avatar) + (pet ? '<span class="b-pet">' + pet.icon + '</span>' : '') + '</div>' +
      '<div class="b-name">' + G.esc(s.name) + '</div>' + G.bar(B.pHp, B.pMax, 'hp') +
      '<small>❤️ ' + B.pHp + ' / ' + B.pMax + '</small></div>' +

      '<div class="b-vs">' + (B.combo >= 2 ? '<span class="combo">🔥' + B.combo + '</span>' : 'VS') + '</div>' +

      '<div class="b-side' + (B.fx === 'hit-mon' ? ' shake' : '') + (B.mHp <= 0 ? ' dead' : '') + '">' +
      (B.fx === 'hit-mon' ? '<span class="float good">−' + B.dmg + '</span>' : '') +
      '<div class="b-ava mon">' + st.monster.icon + '</div>' +
      '<div class="b-name">' + G.esc(st.monster.name) + '</div>' + G.bar(B.mHp, B.mMax, 'mhp') +
      '<small>' + B.mHp + ' / ' + B.mMax + '</small></div>' +
      '</div>' +

      '<div class="q-card">' +
      '<div class="q-meta"><span class="tag">' + G.esc(topic ? topic.name : '') + '</span>' +
      (q.review ? '<span class="tag warn">上次答錯，再試一次</span>' : '') +
      (q.speak ? '<button class="btn ghost sm" data-act="battle-speak">🔊 聽一聽</button>' : '') + '</div>' +
      '<div class="q-text' + (q.text.length > 16 ? ' small' : '') + '">' + G.esc(q.text) + '</div></div>' +

      answersHtml() + feedback +

      '<div class="b-bottom"><button class="btn ghost sm" data-act="battle-potion"' + (canPotion ? '' : ' disabled') + '>🧪 藥水 ×' + s.potions + '</button></div>' +
      '</div>';
  };

  G.screens.result = (r) => {
    const st = r.stage, area = r.area;
    const i = area.stages.indexOf(st);
    const next = r.win && area.stages[i + 1];
    let extra = '';
    if (r.ups) extra += '<div class="card levelup">🎉 升級了！現在是 <b>Lv ' + r.level + '</b>，血量和攻擊力都提升了</div>';
    r.opened.forEach((a) => { extra += '<div class="card levelup">🗺️ 新區域開放：<b>' + a.icon + ' ' + G.esc(a.name) + '</b></div>'; });
    if (r.pet) {
      extra += '<div class="card levelup">🐾 收服了新夥伴 <b>' + r.pet.icon + ' ' + G.esc(r.pet.name) + '</b>！<div class="sub">' + G.Pets.bonusText(r.pet.bonus) + '</div></div>';
    }
    const claim = G.Daily.claimable();
    if (claim) extra += '<div class="card levelup">📜 有 ' + claim + ' 個每日任務獎勵可以領取</div>';

    const head = r.win
      ? '<div class="big-icon bounce">🏆</div><h2>過關！</h2><div class="result-stars">' + G.starsHtml(r.stars) + '</div>'
      : '<div class="big-icon">💪</div><h2>差一點點！</h2><p class="hint">沒關係，答錯的題目已經記下來了，再挑戰一次會更厲害。</p>';

    return '<div class="page result"><main><div class="card center">' + head +
      '<div class="result-grid">' +
      '<div><b>' + r.correct + ' / ' + r.asked + '</b><small>答對題數</small></div>' +
      '<div><b>' + r.acc + '%</b><small>答對率</small></div>' +
      '<div><b>' + r.maxCombo + '</b><small>最高連擊</small></div>' +
      '<div><b>✨ ' + r.xp + '</b><small>經驗值</small></div>' +
      '<div><b>🪙 ' + r.gold + '</b><small>金幣</small></div>' +
      '</div></div>' + extra +
      '<div class="col">' +
      (next ? '<button class="btn primary" data-act="battle-start" data-area="' + area.id + '" data-stage="' + next.id + '">下一關：' + G.esc(next.name) + ' ▶</button>' : '') +
      '<button class="btn ' + (next ? 'ghost' : 'primary') + '" data-act="battle-start" data-area="' + area.id + '" data-stage="' + st.id + '">🔁 ' + (r.win ? '再玩一次' : '再挑戰一次') + '</button>' +
      '<button class="btn ghost" data-act="nav" data-to="map">🗺️ 回地圖</button>' +
      '</div></main></div>';
  };
})(window.G);
