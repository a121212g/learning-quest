// 「更多」頁、錯題本、家長專區（學習報表、切換年級、備份）
(function (G) {
  'use strict';

  // ---------- 更多 ----------
  G.screens.more = () => {
    const n = G.Save.gradeData().wrong.length;
    return G.page('more',
      '<h2 class="title">⚙️ 更多</h2>' +
      '<div class="col">' +
      '<button class="btn list" data-act="nav" data-to="wrongbook">📕 錯題本 <small>' + n + ' 題待複習</small></button>' +
      '<button class="btn list" data-act="toggle-mute">' + (G.muted() ? '🔇 音效與朗讀：關' : '🔊 音效與朗讀：開') + '</button>' +
      '<button class="btn list" data-act="parent-gate">👨‍👩‍👧 家長專區 <small>學習報表、切換年級、備份進度</small></button>' +
      '<button class="btn list" data-act="to-title">🚪 回到標題畫面 <small>切換存檔</small></button>' +
      '</div>');
  };

  G.actions['toggle-mute'] = () => { G.setMuted(!G.muted()); G.sfx('tap'); G.refresh(); };
  G.actions['to-title'] = () => { G.Save.write(); G.state = null; G.slot = 0; G.go('title'); };

  // ---------- 錯題本 ----------
  G.screens.wrongbook = () => {
    const pack = G.Save.pack();
    const list = G.Save.gradeData().wrong.slice().sort((a, b) => b.wrong - a.wrong);
    const rows = list.map((w) => {
      const t = pack.topics[w.topic];
      return '<div class="card wrong-item"><div class="q-meta"><span class="tag">' + G.esc(t ? t.name : w.topic) + '</span>' +
        '<span class="tag warn">答錯 ' + w.wrong + ' 次</span>' + (w.streak ? '<span class="tag ok">已答對 1 次</span>' : '') + '</div>' +
        '<div class="wrong-q">' + G.esc(w.text) + '</div><div class="sub">正確答案：<b>' + G.esc(w.answerText) + '</b></div></div>';
    }).join('');
    return G.page('more',
      '<h2 class="title">📕 錯題本 <small>' + list.length + ' 題</small></h2>' +
      '<p class="hint">答錯的題目會記在這裡，並在之後的戰鬥中再次出現。連續答對兩次就會從錯題本畢業。</p>' +
      (rows || '<div class="card center"><div class="big-icon">🌟</div><b>目前沒有錯題，太棒了！</b></div>') +
      '<div class="col"><button class="btn ghost" data-act="nav" data-to="more">← 返回</button></div>');
  };

  // ---------- 家長驗證 ----------
  let gate = null;
  G.actions['parent-gate'] = () => {
    const a = G.ri(12, 49), b = G.ri(12, 29);
    gate = a * b;
    G.modal('<h3>家長驗證</h3><p class="modal-msg">請回答：' + a + ' × ' + b + ' = ?</p>' +
      '<input id="gate-input" class="text-input" inputmode="numeric" autocomplete="off" placeholder="輸入答案">' +
      '<div class="row"><button class="btn ghost" data-act="modal-close">取消</button>' +
      '<button class="btn primary" data-act="gate-check">確定</button></div>');
  };
  G.actions['gate-check'] = () => {
    const v = Number((G.$('#gate-input').value || '').trim());
    if (v === gate) { G.closeModal(); G.go('parent'); }
    else G.toast('答案不對喔');
  };

  // ---------- 家長專區 ----------
  const pct = (c, q) => (q ? Math.round((c / q) * 100) + '%' : '—');

  function reportHtml() {
    const s = G.state, pack = G.Save.pack(), gd = G.Save.gradeData();
    // 近 7 天
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const key = G.dateAdd(G.today(), -i);
      days.push({ key: key, d: s.days[key] || { sec: 0, q: 0, correct: 0 } });
    }
    const maxQ = Math.max(1, Math.max.apply(null, days.map((x) => x.d.q)));
    const chart = '<div class="chart">' + days.map((x) =>
      '<div class="chart-col"><small>' + (x.d.q || '') + '</small><div class="chart-bar"><i style="height:' + Math.round((x.d.q / maxQ) * 100) + '%"></i></div>' +
      '<small>' + x.key.slice(5).replace('-', '/') + '</small></div>').join('') + '</div>';
    const dayRows = days.slice().reverse().map((x) =>
      '<tr><td>' + x.key.slice(5).replace('-', '/') + '</td><td>' + Math.round(x.d.sec / 60) + ' 分</td><td>' + x.d.q + '</td><td>' + pct(x.d.correct, x.d.q) + '</td></tr>').join('');

    // 各科與各題型
    let topicRows = '';
    Object.keys(pack.subjects || {}).forEach((sub) => {
      const ids = Object.keys(pack.topics).filter((t) => pack.topics[t].subject === sub);
      let q = 0, c = 0;
      ids.forEach((t) => { const x = gd.topics[t]; if (x) { q += x.q; c += x.correct; } });
      topicRows += '<tr class="sub-row"><td>' + G.esc(pack.subjects[sub]) + '</td><td>' + q + '</td><td>' + pct(c, q) + '</td><td></td></tr>';
      ids.forEach((t) => {
        const x = gd.topics[t] || { q: 0, correct: 0 };
        topicRows += '<tr><td>　' + G.esc(pack.topics[t].name) + '</td><td>' + x.q + '</td><td>' + pct(x.correct, x.q) + '</td><td>' + G.Q.level(t) + ' / 5</td></tr>';
      });
    });

    // 最常錯的 10 題
    const misses = Object.keys(gd.misses).map((k) => gd.misses[k]).sort((a, b) => b.n - a.n).slice(0, 10);
    const missRows = misses.map((m) => {
      const t = pack.topics[m.topic];
      return '<tr><td>' + G.esc(m.text) + '<div class="sub">' + G.esc(t ? t.name : '') + '・答案：' + G.esc(m.answer) + '</div></td><td>' + m.n + ' 次</td></tr>';
    }).join('');

    return '<h3 class="section">近 7 天練習題數</h3><div class="card">' + chart +
      '<table class="tbl"><tr><th>日期</th><th>練習時間</th><th>題數</th><th>答對率</th></tr>' + dayRows + '</table></div>' +
      '<h3 class="section">' + G.esc(pack.name) + '各題型表現</h3><div class="card"><table class="tbl">' +
      '<tr><th>題型</th><th>題數</th><th>答對率</th><th>目前難度</th></tr>' + topicRows + '</table>' +
      '<p class="sub">難度 1 最簡單、5 最難，系統會依最近的答對率自動升降。</p></div>' +
      '<h3 class="section">最常答錯的題目</h3><div class="card">' +
      (missRows ? '<table class="tbl"><tr><th>題目</th><th>答錯</th></tr>' + missRows + '</table>' : '<p class="sub">還沒有答錯的紀錄。</p>') + '</div>';
  }

  G.screens.parent = () => {
    const s = G.state;
    const packs = window.packList();
    const grades = packs.map((p) =>
      '<button class="btn sm ' + (p.id === s.grade ? 'primary' : 'ghost') + '" data-act="set-grade" data-id="' + p.id + '">' + G.esc(p.name) + (p.id === s.grade ? '（目前）' : '') + '</button>').join('');
    return '<div class="page"><main>' +
      '<h2 class="title">👨‍👩‍👧 家長專區 <small>' + G.esc(s.name) + '・Lv ' + s.level + '</small></h2>' +
      reportHtml() +
      '<h3 class="section">年級</h3><div class="card"><div class="row wrap">' + grades + '</div>' +
      '<p class="sub">切換年級後地圖會換成該年級的內容；角色等級、金幣、裝備與夥伴都會保留，各年級的關卡進度分開記錄。' +
      (packs.length < 2 ? '目前只安裝了一個年級的內容包，新增方式請看「使用說明」。' : '') + '</p></div>' +
      '<h3 class="section">備份與還原</h3><div class="card"><div class="col">' +
      '<button class="btn primary" data-act="export">💾 匯出進度（下載備份檔）</button>' +
      '<button class="btn ghost" data-act="import-pick" data-slot="' + G.slot + '">📂 匯入進度（覆蓋目前這個存檔）</button>' +
      '<button class="btn danger" data-act="delete-save">🗑️ 刪除這個存檔</button></div>' +
      '<p class="sub">進度只存在這台裝置的這個瀏覽器裡。清除瀏覽資料前、或要換裝置時，請先匯出備份。</p></div>' +
      '<div class="col"><button class="btn ghost" data-act="nav" data-to="more">← 返回遊戲</button></div>' +
      '</main></div>';
  };

  G.actions['set-grade'] = (d) => {
    if (!window.PACKS[d.id] || d.id === G.state.grade) return;
    G.state.grade = d.id;
    G.ui.area = null;
    G.state.daily.date = ''; // 換年級後重新產生每日任務
    G.Save.write();
    G.toast('已切換到' + window.PACKS[d.id].name);
    G.refresh();
  };

  G.actions.export = () => { G.Save.write(); G.Save.download(); G.toast('已產生備份檔，請到「下載」資料夾查看'); };

  G.actions['delete-save'] = () => {
    G.confirm('確定要刪除「' + G.state.name + '」的存檔嗎？刪除後無法復原。', '刪除', () => {
      G.Save.remove(G.slot);
      G.go('title');
    });
  };

  // ---------- 匯入 ----------
  G.actions['import-pick'] = (d) => {
    const slot = Number(d.slot);
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json,application/json,text/plain';
    inp.onchange = () => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      const reader = new FileReader();
      reader.onload = () => {
        const run = () => {
          if (G.Save.importText(String(reader.result), slot)) { G.toast('匯入成功！'); G.go('map'); }
          else G.toast('這個檔案不是有效的進度備份');
        };
        if (G.Save.read(slot)) G.confirm('匯入會覆蓋這個欄位原本的進度，確定嗎？', '覆蓋', run);
        else run();
      };
      reader.readAsText(f);
    };
    inp.click();
  };
})(window.G);
