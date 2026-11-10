// 角色：等級、經驗值、血量、攻擊力、金幣、裝備
(function (G) {
  'use strict';

  G.ITEMS = {
    weapons: [
      { id: 'w1', name: '木劍', icon: '🗡️', atk: 3, price: 60 },
      { id: 'w2', name: '鐵劍', icon: '⚔️', atk: 6, price: 150 },
      { id: 'w3', name: '魔法杖', icon: '🪄', atk: 10, price: 320 },
      { id: 'w4', name: '勇者之劍', icon: '🔱', atk: 15, price: 600 }
    ],
    armors: [
      { id: 'a1', name: '布衣', icon: '👕', hp: 15, price: 60 },
      { id: 'a2', name: '皮甲', icon: '🦺', hp: 30, price: 150 },
      { id: 'a3', name: '騎士盾', icon: '🛡️', hp: 50, price: 320 },
      { id: 'a4', name: '王者皇冠', icon: '👑', hp: 80, price: 600 }
    ],
    potion: { name: '回復藥水', icon: '🧪', heal: 30, price: 15 }
  };

  const find = (list, id) => list.filter((x) => x.id === id)[0] || null;

  G.Player = {
    xpNeed(level) { return 50 * (level || G.state.level); },

    weapon() { return find(G.ITEMS.weapons, G.state.equip.weapon); },
    armor() { return find(G.ITEMS.armors, G.state.equip.armor); },

    maxHp() {
      const a = this.armor();
      return 50 + 10 * (G.state.level - 1) + (a ? a.hp : 0);
    },

    atk() {
      const w = this.weapon();
      return 10 + 2 * (G.state.level - 1) + (w ? w.atk : 0);
    },

    // 增加經驗值，回傳升了幾級
    addXp(n) {
      const s = G.state;
      let ups = 0;
      s.xp += Math.max(0, Math.round(n));
      while (s.xp >= this.xpNeed(s.level)) {
        s.xp -= this.xpNeed(s.level);
        s.level += 1;
        ups += 1;
      }
      return ups;
    },

    addGold(n) { G.state.gold += Math.max(0, Math.round(n)); }
  };
})(window.G);
