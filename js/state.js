/* =====================================================
   state.js ― アプリの状態と、保存・読み込み
   ===================================================== */

/* ---------- 保存されるデータ（localStorage） ----------
   store.D    : 食事ごとの料理   { b:[{n:"料理名", u:"URL(任意)"}], l:[…], d:[…] }
   store.last : 前回出た料理名   { b:"…", … }  → 同じ料理が続けて出にくくする
   store.ON   : 食べる食事       { b:1, l:1, d:1 }  （0 = 食べない）
   store.hist : 履歴            [{ t:時刻, r:{ b:"料理名"|null, … } }]
   store.th   : テーマカラー番号（未選択なら undefined）
   store.mode : 表示モード "auto" | "light" | "dark"（未選択なら自動） */
let store = {
  D: JSON.parse(JSON.stringify(DEFAULT_DISHES)), // 初期値のコピー（古いスマホでも動く書き方）
  last: {},
  ON: Object.fromEntries(MEAL_KEYS.map((k) => [k, 1])),
  hist: [],
};

/* ---------- 保存されない一時的な状態（画面を閉じると消える） ----------
   result   : 今回の結果       { b:{n,u}, … }
   locked   : ロック中の食事   { b:true, … }
   tab      : 表示中の画面     "gacha" | "dishes" | "settings"
   mealTab  : 料理リストで選んでいる食事
   busy     : 抽選アニメーション中か
   editIndex: 編集中の料理の番号（-1 = 新規追加）
   popKeys  : 結果が出た直後の食事（ポップ演出用） */
const ui = {
  result: Object.fromEntries(MEAL_KEYS.map((k) => [k, { n: UNDRAWN }])),
  locked: {},
  tab: "gacha",
  mealTab: "b",
  busy: false,
  editIndex: -1,
  popKeys: new Set(),
};

/* 保存する */
function saveStore() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (e) {
    /* 保存できない環境（プライベートモード等）でもアプリは動かす */
  }
}

/* 起動時に読み込む。足りない項目は補い、古い形式も新しい形式に直す */
function loadStore() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) store = JSON.parse(saved);
  } catch (e) {
    /* 壊れたデータは無視して初期値のまま */
  }
  store.ON = store.ON || Object.fromEntries(MEAL_KEYS.map((k) => [k, 1]));
  store.hist = store.hist || [];
  store.last = store.last || {};
  // 古い形式（料理名の文字列だけ）を {n:料理名} に変換
  for (const k of MEAL_KEYS) {
    store.D[k] = (store.D[k] || []).map((x) => (typeof x === "string" ? { n: x } : x));
  }
}
