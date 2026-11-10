// 年級內容包登記表。
// 每個年級的資料檔呼叫 registerPack('年級代號', {...})，可分多個檔案登記，內容會自動合併。
// 遊戲引擎只讀這張表，不寫死任何年級的內容。
(function () {
  'use strict';
  const PACKS = (window.PACKS = {});

  window.registerPack = function (id, part) {
    const p = PACKS[id] || (PACKS[id] = { id: id, name: id, order: 0, areas: [], topics: {}, math: {}, banks: {}, pets: [] });
    Object.keys(part).forEach((k) => {
      if (k === 'topics' || k === 'math' || k === 'banks') Object.assign(p[k], part[k]);
      else p[k] = part[k];
    });
  };

  // 依年級順序排列的內容包清單
  window.packList = function () {
    return Object.keys(PACKS).map((k) => PACKS[k]).sort((a, b) => a.order - b.order);
  };
})();
