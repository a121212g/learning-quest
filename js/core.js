// 共用工具：畫面切換、彈出視窗、提示訊息、音效、語音
window.G = { actions: {}, screens: {}, state: null, slot: 0, ui: {}, current: '', currentArg: null };

(function (G) {
  'use strict';

  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  G.esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ESC[c]);
  G.$ = (sel) => document.querySelector(sel);

  // ---- 本機儲存（包一層避免瀏覽器停用時整個壞掉） ----
  G.ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }
  };

  // ---- 日期 ----
  const pad = (n) => (n < 10 ? '0' + n : '' + n);
  const fmt = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  G.today = () => fmt(new Date());
  G.dateAdd = (str, n) => {
    const p = str.split('-').map(Number);
    return fmt(new Date(p[0], p[1] - 1, p[2] + n));
  };

  // ---- 畫面 ----
  G.show = (name, arg) => {
    G.current = name;
    G.currentArg = arg;
    G.$('#app').innerHTML = G.screens[name](arg);
  };
  G.go = (name, arg) => { G.show(name, arg); window.scrollTo(0, 0); };
  G.refresh = () => G.show(G.current, G.currentArg);

  // ---- 彈出視窗 ----
  G.modal = (html) => {
    const m = G.$('#modal');
    m.innerHTML = '<div class="modal-box">' + html + '</div>';
    m.hidden = false;
  };
  G.closeModal = () => { const m = G.$('#modal'); m.hidden = true; m.innerHTML = ''; };
  G.confirm = (msg, yesLabel, cb) => {
    G._confirmCb = cb;
    G.modal('<p class="modal-msg">' + G.esc(msg) + '</p><div class="row">' +
      '<button class="btn ghost" data-act="modal-close">取消</button>' +
      '<button class="btn danger" data-act="confirm-yes">' + G.esc(yesLabel) + '</button></div>');
  };
  G.actions['modal-close'] = () => G.closeModal();
  G.actions['confirm-yes'] = () => { const cb = G._confirmCb; G._confirmCb = null; G.closeModal(); if (cb) cb(); };

  // ---- 提示訊息 ----
  let toastTimer = 0;
  G.toast = (msg) => {
    const t = G.$('#toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.hidden = true; }, 2200);
  };

  // ---- 點擊事件統一處理：按鈕寫 data-act="動作名稱" ----
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    const fn = G.actions[el.dataset.act];
    if (fn) fn(el.dataset, el);
  });

  // ---- 音效（用程式合成，不需要音檔） ----
  let ctx = null;
  G.muted = () => G.ls.get('kq_mute') === '1';
  G.setMuted = (m) => G.ls.set('kq_mute', m ? '1' : '0');
  const TUNES = {
    right: [[660, 0, 0.09], [880, 0.09, 0.14]],
    wrong: [[220, 0, 0.2]],
    win: [[523, 0, 0.12], [659, 0.12, 0.12], [784, 0.24, 0.12], [1047, 0.36, 0.3]],
    lose: [[392, 0, 0.18], [330, 0.18, 0.18], [262, 0.36, 0.3]],
    level: [[523, 0, 0.1], [784, 0.1, 0.1], [1047, 0.2, 0.1], [1319, 0.3, 0.3]],
    coin: [[988, 0, 0.07], [1319, 0.07, 0.15]],
    tap: [[520, 0, 0.04]]
  };
  G.sfx = (name) => {
    if (G.muted()) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = ctx || new AC();
      if (ctx.state === 'suspended') ctx.resume();
      const now = ctx.currentTime;
      (TUNES[name] || []).forEach((n) => {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = name === 'wrong' || name === 'lose' ? 'sawtooth' : 'triangle';
        o.frequency.value = n[0];
        g.gain.setValueAtTime(0.0001, now + n[1]);
        g.gain.exponentialRampToValueAtTime(0.18, now + n[1] + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + n[1] + n[2]);
        o.connect(g); g.connect(ctx.destination);
        o.start(now + n[1]); o.stop(now + n[1] + n[2] + 0.02);
      });
    } catch (e) { /* 沒有音效不影響遊戲 */ }
  };

  // ---- 英語朗讀（瀏覽器內建語音） ----
  G.speak = (text) => {
    if (G.muted() || !window.speechSynthesis || !text) return;
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      u.rate = 0.85;
      window.speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  };

  // ---- 小工具 ----
  G.ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  G.pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  G.shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };
  G.bar = (value, max, cls) => {
    const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((value / max) * 100))) : 0;
    return '<div class="bar ' + (cls || '') + '"><i style="width:' + pct + '%"></i></div>';
  };
})(window.G);
