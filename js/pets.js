// 夥伴收集：打倒怪物有機會收服，帶一隻出戰可得到加成
(function (G) {
  'use strict';
  const CAPTURE_CHANCE = 0.3;

  function bonusText(b) {
    const pct = Math.round(b.value * 100);
    if (b.type === 'gold') return '金幣 +' + pct + '%';
    if (b.type === 'xp') return '經驗值 +' + pct + '%';
    if (b.type === 'power') return '攻擊力 +' + pct + '%';
    if (b.type === 'guard') return '受到的傷害 −' + pct + '%';
    if (b.type === 'heal') return '每答對一題回復 ' + b.value + ' 點血量';
    return '';
  }

  // 所有年級內容包的夥伴清單（名稱與圖示取自對應的怪物）
  function all() {
    const out = [];
    window.packList().forEach((pack) => {
      (pack.pets || []).forEach((p) => {
        pack.areas.forEach((a) => a.stages.forEach((s) => {
          if (s.monster.id === p.id) {
            out.push({
              key: pack.id + ':' + p.id, name: s.monster.name, icon: s.monster.icon, bonus: p.bonus,
              where: pack.name + '・' + a.name + '「' + s.name + '」', boss: !!s.boss
            });
          }
        }));
      });
    });
    return out;
  }

  G.Pets = {
    all: all,
    bonusText: bonusText,
    has(key) { return G.state.pets.indexOf(key) >= 0; },
    get(key) { return all().filter((p) => p.key === key)[0] || null; },
    active() { return G.state.activePet ? this.get(G.state.activePet) : null; },
    bonus(type) {
      const p = this.active();
      return p && p.bonus.type === type ? p.bonus.value : 0;
    },
    // 過關後嘗試收服這關的怪物。魔王必定收服。成功回傳夥伴資料。
    tryCapture(stage) {
      const key = G.Save.pack().id + ':' + stage.monster.id;
      const pet = this.get(key);
      if (!pet || this.has(key)) return null;
      if (!stage.boss && Math.random() >= CAPTURE_CHANCE) return null;
      G.state.pets.push(key);
      if (!G.state.activePet) G.state.activePet = key;
      return pet;
    }
  };

  G.actions['pet-set'] = (d) => {
    if (!G.Pets.has(d.key)) return;
    G.state.activePet = G.state.activePet === d.key ? null : d.key;
    G.Save.write();
    G.sfx('tap');
    G.refresh();
  };

  G.screens.pets = () => {
    const list = all();
    const owned = list.filter((p) => G.Pets.has(p.key)).length;
    const cards = list.map((p) => {
      if (!G.Pets.has(p.key)) {
        return '<div class="card pet locked"><div class="pet-icon shadow">' + p.icon + '</div><b>？？？</b>' +
          '<div class="sub">出沒地點：' + G.esc(p.where) + '</div></div>';
      }
      const on = G.state.activePet === p.key;
      return '<div class="card pet' + (on ? ' on' : '') + '"><div class="pet-icon">' + p.icon + '</div><b>' + G.esc(p.name) + '</b>' +
        '<div class="sub">' + bonusText(p.bonus) + '</div>' +
        '<button class="btn sm ' + (on ? 'ghost' : 'primary') + '" data-act="pet-set" data-key="' + p.key + '">' + (on ? '出戰中（點此休息）' : '帶去冒險') + '</button></div>';
    }).join('');
    return G.page('pets',
      '<h2 class="title">🐾 夥伴圖鑑 <small>' + owned + ' / ' + list.length + '</small></h2>' +
      '<p class="hint">打倒怪物有機會收服牠當夥伴，打倒魔王一定可以收服。一次可以帶一隻去冒險。</p>' +
      '<div class="grid pets">' + cards + '</div>');
  };
})(window.G);
