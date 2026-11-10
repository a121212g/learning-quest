// 商店：用金幣買武器、防具、藥水
(function (G) {
  'use strict';

  function itemCard(kind, it) {
    const s = G.state;
    const ownedList = kind === 'weapon' ? s.owned.weapons : s.owned.armors;
    const owned = ownedList.indexOf(it.id) >= 0;
    const on = s.equip[kind] === it.id;
    const effect = kind === 'weapon' ? '攻擊力 +' + it.atk : '血量 +' + it.hp;
    let btn;
    if (on) btn = '<span class="tag ok">裝備中</span>';
    else if (owned) btn = '<button class="btn sm primary" data-act="shop-equip" data-kind="' + kind + '" data-id="' + it.id + '">裝備</button>';
    else btn = '<button class="btn sm gold" data-act="shop-buy" data-kind="' + kind + '" data-id="' + it.id + '"' + (s.gold >= it.price ? '' : ' disabled') + '>🪙 ' + it.price + '</button>';
    return '<div class="card item' + (on ? ' on' : '') + '"><div class="item-icon">' + it.icon + '</div>' +
      '<div class="task-main"><b>' + G.esc(it.name) + '</b><div class="sub">' + effect + '</div></div>' + btn + '</div>';
  }

  G.screens.shop = () => {
    const s = G.state, p = G.ITEMS.potion;
    return G.page('shop',
      '<h2 class="title">🛒 商店 <small>目前攻擊力 ' + G.Player.atk() + '・血量 ' + G.Player.maxHp() + '</small></h2>' +
      '<h3 class="section">道具</h3>' +
      '<div class="card item"><div class="item-icon">' + p.icon + '</div><div class="task-main"><b>' + p.name + '</b>' +
      '<div class="sub">戰鬥中回復 ' + p.heal + ' 點血量・目前有 ' + s.potions + ' 瓶</div></div>' +
      '<button class="btn sm gold" data-act="shop-potion"' + (s.gold >= p.price ? '' : ' disabled') + '>🪙 ' + p.price + '</button></div>' +
      '<h3 class="section">武器</h3>' + G.ITEMS.weapons.map((it) => itemCard('weapon', it)).join('') +
      '<h3 class="section">防具</h3>' + G.ITEMS.armors.map((it) => itemCard('armor', it)).join(''));
  };

  function listOf(kind) { return kind === 'weapon' ? G.ITEMS.weapons : G.ITEMS.armors; }

  G.actions['shop-buy'] = (d) => {
    const s = G.state;
    const it = listOf(d.kind).filter((x) => x.id === d.id)[0];
    const owned = d.kind === 'weapon' ? s.owned.weapons : s.owned.armors;
    if (!it || owned.indexOf(it.id) >= 0 || s.gold < it.price) return;
    s.gold -= it.price;
    owned.push(it.id);
    s.equip[d.kind] = it.id;
    G.Save.write();
    G.sfx('coin');
    G.toast('買到 ' + it.icon + ' ' + it.name + '，已經裝備上了！');
    G.refresh();
  };

  G.actions['shop-equip'] = (d) => {
    const s = G.state;
    const owned = d.kind === 'weapon' ? s.owned.weapons : s.owned.armors;
    if (owned.indexOf(d.id) < 0) return;
    s.equip[d.kind] = d.id;
    G.Save.write();
    G.sfx('tap');
    G.refresh();
  };

  G.actions['shop-potion'] = () => {
    const s = G.state, p = G.ITEMS.potion;
    if (s.gold < p.price) return;
    s.gold -= p.price;
    s.potions += 1;
    G.Save.write();
    G.sfx('coin');
    G.refresh();
  };
})(window.G);
