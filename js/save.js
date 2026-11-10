// 存檔：自動儲存在瀏覽器（localStorage），支援 3 個欄位與匯出／匯入備份
(function (G) {
  'use strict';
  const PREFIX = 'kq_save_';
  const VERSION = 1;
  const SLOTS = 3;

  function blankGrade() {
    return { stars: {}, diff: {}, wrong: [], topics: {}, misses: {} };
  }

  function blank(name, avatar) {
    const first = window.packList()[0];
    return {
      version: VERSION,
      name: name, avatar: avatar,
      level: 1, xp: 0, gold: 0, potions: 1,
      owned: { weapons: [], armors: [] },
      equip: { weapon: null, armor: null },
      pets: [], activePet: null,
      grade: first ? first.id : '',
      daily: { date: '', tasks: [], chest: false, streak: 0, lastPlay: '' },
      days: {},
      grades: {},
      created: Date.now(), updated: Date.now()
    };
  }

  // 舊版存檔轉成新版，並補齊缺少的欄位。日後改存檔格式時在這裡加轉換步驟。
  function migrate(s) {
    if (!s || typeof s !== 'object' || typeof s.level !== 'number') return null;
    if (!s.version) s.version = 1;
    // if (s.version === 1) { ...轉換...; s.version = 2; }
    const d = blank(s.name || '勇者', s.avatar || '🧒');
    Object.keys(d).forEach((k) => { if (s[k] === undefined || s[k] === null && d[k] !== null) s[k] = d[k]; });
    ['owned', 'equip', 'daily'].forEach((k) => {
      Object.keys(d[k]).forEach((kk) => { if (s[k][kk] === undefined) s[k][kk] = d[k][kk]; });
    });
    Object.keys(s.grades).forEach((g) => {
      const b = blankGrade();
      Object.keys(b).forEach((k) => { if (s.grades[g][k] === undefined) s.grades[g][k] = b[k]; });
    });
    if (!window.PACKS[s.grade]) { const f = window.packList()[0]; if (f) s.grade = f.id; }
    return s;
  }

  function read(slot) {
    const raw = G.ls.get(PREFIX + slot);
    if (!raw) return null;
    try { return migrate(JSON.parse(raw)); } catch (e) { return null; }
  }

  G.Save = {
    SLOTS: SLOTS,
    read: read,
    list() { const out = []; for (let i = 1; i <= SLOTS; i++) out.push(read(i)); return out; },

    load(slot) {
      const s = read(slot);
      if (!s) return false;
      G.state = s; G.slot = slot;
      G.ls.set('kq_last', String(slot));
      return true;
    },

    create(slot, name, avatar) {
      G.state = blank(name, avatar);
      G.slot = slot;
      G.ls.set('kq_last', String(slot));
      return this.write();
    },

    write() {
      if (!G.state || !G.slot) return false;
      G.state.updated = Date.now();
      const ok = G.ls.set(PREFIX + G.slot, JSON.stringify(G.state));
      if (!ok) G.toast('⚠️ 進度無法儲存，請確認瀏覽器沒有停用網站資料');
      return ok;
    },

    remove(slot) {
      G.ls.del(PREFIX + slot);
      if (G.slot === slot) { G.state = null; G.slot = 0; }
    },

    pack() { return window.PACKS[G.state.grade] || window.packList()[0]; },

    // 目前年級的進度（星數、難度、錯題本等，依年級分開記錄）
    gradeData() {
      const id = this.pack().id;
      return G.state.grades[id] || (G.state.grades[id] = blankGrade());
    },

    // 今天的練習紀錄
    day() {
      const t = G.today();
      return G.state.days[t] || (G.state.days[t] = { sec: 0, q: 0, correct: 0 });
    },

    exportText() {
      return JSON.stringify({ app: 'learning-quest', exported: new Date().toISOString(), save: G.state }, null, 1);
    },

    download() {
      const name = '學習大冒險-進度-' + G.state.name + '-' + G.today() + '.json';
      const blob = new Blob([this.exportText()], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = name;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    },

    // 讀入備份文字並寫進指定欄位。成功回傳 true。
    importText(text, slot) {
      let obj;
      try { obj = JSON.parse(text); } catch (e) { return false; }
      const s = migrate(obj && obj.save ? obj.save : obj);
      if (!s) return false;
      G.state = s; G.slot = slot;
      G.ls.set('kq_last', String(slot));
      return this.write();
    }
  };

  // 請瀏覽器不要自動清掉存檔
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(() => {});
  }
})(window.G);
