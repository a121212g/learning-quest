// 標題畫面、建立角色、啟動
(function (G) {
  'use strict';
  const AVATARS = ['🧒', '👦', '👧', '🧙', '🧝', '🦸', '🥷', '🤴', '👸', '🐱'];

  G.screens.title = () => {
    const slots = G.Save.list().map((s, i) => {
      const n = i + 1;
      if (!s) {
        return '<div class="card slot empty"><div class="slot-ava">➕</div><div class="task-main"><b>空的存檔 ' + n + '</b></div>' +
          '<div class="row"><button class="btn sm ghost" data-act="import-pick" data-slot="' + n + '">匯入</button>' +
          '<button class="btn sm primary" data-act="new-game" data-slot="' + n + '">新遊戲</button></div></div>';
      }
      const pack = window.PACKS[s.grade];
      return '<button class="card slot" data-act="continue" data-slot="' + n + '"><div class="slot-ava">' + G.esc(s.avatar) + '</div>' +
        '<div class="task-main"><b>' + G.esc(s.name) + '</b><div class="sub">Lv ' + s.level + '・' + G.esc(pack ? pack.name : '') + '・🪙 ' + s.gold + '</div></div>' +
        '<span class="btn sm primary">繼續 ▶</span></button>';
    }).join('');
    return '<div class="page title-page"><main>' +
      '<div class="logo"><div class="logo-icon">⚔️📚</div><h1>學習大冒險</h1><p>答對題目打倒怪物，一起升級變強！</p></div>' +
      slots + '</main></div>';
  };

  G.actions.continue = (d) => {
    if (G.Save.load(Number(d.slot))) { G.sfx('tap'); G.go('map'); }
  };

  G.actions['new-game'] = (d) => { G.ui.newSlot = Number(d.slot); G.ui.avatar = AVATARS[0]; G.go('create'); };

  G.screens.create = () => {
    const name = G.ui.newName || '';
    return '<div class="page title-page"><main><div class="card">' +
      '<h2 class="title">建立你的角色</h2>' +
      '<label class="field">名字<input id="name-input" class="text-input" maxlength="8" autocomplete="off" placeholder="輸入名字" value="' + G.esc(name) + '"></label>' +
      '<div class="field">選一個樣子</div><div class="avatars">' +
      AVATARS.map((a) => '<button class="avatar' + (a === G.ui.avatar ? ' on' : '') + '" data-act="pick-avatar" data-a="' + a + '">' + a + '</button>').join('') +
      '</div><div class="row"><button class="btn ghost" data-act="create-cancel">返回</button>' +
      '<button class="btn primary" data-act="create-ok">開始冒險！</button></div></div></main></div>';
  };

  G.actions['pick-avatar'] = (d) => {
    G.ui.newName = G.$('#name-input').value;
    G.ui.avatar = d.a;
    G.refresh();
  };
  G.actions['create-cancel'] = () => { G.ui.newName = ''; G.go('title'); };
  G.actions['create-ok'] = () => {
    const name = (G.$('#name-input').value || '').trim().slice(0, 8) || '小勇者';
    G.ui.newName = '';
    G.Save.create(G.ui.newSlot, name, G.ui.avatar);
    G.sfx('win');
    G.go('map');
    G.toast('歡迎，' + name + '！從「數字森林」的第一關開始吧');
  };

  // ---------- 啟動 ----------
  if (!window.packList().length) {
    G.$('#app').innerHTML = '<div class="page"><main><div class="card center">找不到年級內容包，請確認 data 資料夾裡的檔案。</div></main></div>';
  } else {
    G.go('title');
  }

  // 離線快取：只在正式網址啟用，本機開發時不快取，避免看到舊檔案（網址加 ?sw=1 可強制啟用）
  const host = location.hostname;
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '';
  if ('serviceWorker' in navigator && location.protocol.indexOf('http') === 0 && (!isLocal || location.search.indexOf('sw=1') >= 0)) {
    window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
  }
})(window.G);
