// 世界地圖、關卡解鎖，以及各頁共用的角色列與底部選單
(function (G) {
  'use strict';

  function header() {
    const s = G.state, need = G.Player.xpNeed();
    const pet = G.Pets.active();
    return '<header class="hud">' +
      '<div class="hud-ava">' + G.esc(s.avatar) + (pet ? '<span class="hud-pet">' + pet.icon + '</span>' : '') + '</div>' +
      '<div class="hud-main"><div class="hud-name">' + G.esc(s.name) + ' <span class="lv">Lv ' + s.level + '</span></div>' +
      G.bar(s.xp, need, 'xp') + '<div class="hud-xp">經驗值 ' + s.xp + ' / ' + need + '</div></div>' +
      '<div class="hud-stats"><span title="金幣">🪙 ' + s.gold + '</span><span title="連續天數">🔥 ' + G.Daily.streak() + '</span></div>' +
      '</header>';
  }

  function nav(active) {
    const n = G.Daily.claimable();
    const items = [
      ['map', '🗺️', '地圖'], ['daily', '📜', '任務'], ['pets', '🐾', '夥伴'], ['shop', '🛒', '商店'], ['more', '⚙️', '更多']
    ];
    return '<nav class="nav">' + items.map((it) =>
      '<button class="nav-btn' + (it[0] === active ? ' on' : '') + '" data-act="nav" data-to="' + it[0] + '">' +
      '<span class="nav-icon">' + it[1] + (it[0] === 'daily' && n ? '<i class="badge">' + n + '</i>' : '') + '</span>' + it[2] + '</button>').join('') + '</nav>';
  }

  G.page = (active, body) => '<div class="page">' + header() + '<main>' + body + '</main></div>' + nav(active);

  G.actions.nav = (d) => { G.sfx('tap'); G.go(d.to); };

  function stars(n) {
    return '<span class="stars">' + [1, 2, 3].map((i) => '<i class="' + (i <= n ? 'on' : '') + '">★</i>').join('') + '</span>';
  }
  G.starsHtml = stars;

  function findArea(id) {
    const areas = G.Save.pack().areas;
    return areas.filter((a) => a.id === id)[0] || areas[0];
  }
  G.findArea = findArea;

  // 進階版關卡：同一關換上更強的怪物。血量、攻擊、獎勵提高，題目難度加 1 級。
  // 內容包可在關卡加 hard: { name, icon, hp, atk, xp, gold, plus } 個別指定，沒寫就用下面的倍率。
  const HARD = { hp: 1.6, atk: 1.5, reward: 1.5, plus: 1 };
  G.hardStage = (st) => {
    const h = st.hard || {}, m = st.monster;
    return Object.assign({}, st, {
      id: st.id + '+', hard: true, base: st, plus: h.plus || HARD.plus,
      xp: h.xp || Math.round(st.xp * HARD.reward), gold: h.gold || Math.round(st.gold * HARD.reward),
      monster: Object.assign({}, m, {
        name: h.name || '進階・' + m.name, icon: h.icon || m.icon,
        hp: h.hp || Math.round(m.hp * HARD.hp / 5) * 5, atk: h.atk || Math.round(m.atk * HARD.atk)
      })
    });
  };

  function stageOpen(area, i) {
    return i === 0 || (G.Save.gradeData().stars[area.stages[i - 1].id] || 0) > 0;
  }

  G.screens.map = () => {
    G.Daily.ensure();
    const pack = G.Save.pack(), gd = G.Save.gradeData(), s = G.state;
    const area = findArea(G.ui.area);
    G.ui.area = area.id;

    const tabs = pack.areas.map((a) => {
      const locked = s.level < a.unlockLevel;
      const got = a.stages.reduce((sum, st) => sum + (gd.stars[st.id] || 0), 0);
      return '<button class="area-tab' + (a.id === area.id ? ' on' : '') + (locked ? ' locked' : '') + '" style="--area:' + a.color + '" data-act="area" data-id="' + a.id + '">' +
        '<span class="area-icon">' + (locked ? '🔒' : a.icon) + '</span><b>' + G.esc(a.name) + '</b>' +
        '<small>' + (locked ? 'Lv ' + a.unlockLevel + ' 開放' : '★ ' + got + ' / ' + a.stages.length * 3) + '</small></button>';
    }).join('');

    let body;
    if (s.level < area.unlockLevel) {
      body = '<div class="card center"><div class="big-icon">🔒</div><b>' + G.esc(area.name) + '</b>' +
        '<p class="hint">角色升到 Lv ' + area.unlockLevel + ' 就會開放。先去其他區域冒險累積經驗值吧！</p></div>';
    } else {
      body = '<div class="stages" style="--area:' + area.color + '">' + area.stages.map((st, i) => {
        const open = stageOpen(area, i);
        const n = gd.stars[st.id] || 0;
        const topics = st.boss ? '單元總複習' : st.topics.map((t) => pack.topics[t].name).join('、');
        return '<button class="stage' + (open ? '' : ' locked') + (st.boss ? ' boss' : '') + (n ? ' done' : '') + '"' +
          (open ? ' data-act="stage" data-area="' + area.id + '" data-stage="' + st.id + '"' : ' disabled') + '>' +
          '<span class="stage-icon">' + (open ? st.monster.icon : '🔒') + '</span>' +
          '<span class="stage-main"><b>' + (st.boss ? '👑 ' : (i + 1) + '. ') + G.esc(st.name) + '</b><small>' + G.esc(topics) + '</small></span>' +
          (open ? '<span class="star-col">' + stars(n) + (n ? '<span class="hard-stars">🔥' + stars(gd.stars[st.id + '+'] || 0) + '</span>' : '') + '</span>'
            : '<small class="lock-note">先通過上一關</small>') + '</button>';
      }).join('') + '</div>';
    }

    return G.page('map',
      '<div class="grade-label">' + G.esc(pack.name) + '冒險地圖</div>' +
      '<div class="area-tabs">' + tabs + '</div>' + body);
  };

  G.actions.area = (d) => { G.ui.area = d.id; G.sfx('tap'); G.refresh(); };

  G.actions.stage = (d) => {
    const pack = G.Save.pack(), area = findArea(d.area);
    const st = area.stages.filter((x) => x.id === d.stage)[0];
    if (!st) return;
    const petKey = pack.id + ':' + st.monster.id;
    const pet = G.Pets.get(petKey);
    const petLine = !pet ? '' : G.Pets.has(petKey)
      ? '<div class="sub">🐾 已收服這隻夥伴</div>'
      : '<div class="sub">🐾 ' + (st.boss ? '打倒魔王一定能收服牠' : '打倒牠有機會收服成夥伴') + '</div>';
    G.sfx('tap');
    const gd = G.Save.gradeData(), cleared = (gd.stars[st.id] || 0) > 0;
    const card = (v, hard) => {
      const locked = hard && !cleared;
      return '<div class="variant' + (hard ? ' hard' : '') + (locked ? ' locked' : '') + '">' +
        '<div class="v-icon">' + v.monster.icon + '</div>' +
        '<b>' + (hard ? '🔥 進階' : '普通') + '</b>' +
        '<div class="sub">' + G.esc(v.monster.name) + '</div>' +
        '<div class="sub">❤️ ' + v.monster.hp + '　⚔️ ' + v.monster.atk + '</div>' +
        '<div class="sub">' + (hard ? '題目難度 +' + v.plus : '題目依程度調整') + '</div>' +
        '<div class="sub">✨' + v.xp + '　🪙' + v.gold + '</div>' +
        stars(gd.stars[v.id] || 0) +
        (locked ? '<button class="btn ghost" disabled>🔒 先通過普通</button>'
          : '<button class="btn primary" data-act="battle-start" data-area="' + area.id + '" data-stage="' + st.id + '"' + (hard ? ' data-hard="1"' : '') + '>⚔️ 挑戰</button>') +
        '</div>';
    };
    G.modal(
      '<div class="center"><h3>' + G.esc(st.name) + '</h3>' +
      '<div class="sub">題目：' + G.esc(st.boss ? '這個區域的全部題型' : st.topics.map((t) => pack.topics[t].name).join('、')) + '</div>' + petLine + '</div>' +
      '<div class="variants">' + card(st, false) + card(G.hardStage(st), true) + '</div>' +
      '<div class="row"><button class="btn ghost" data-act="modal-close">返回</button></div>');
  };
})(window.G);
