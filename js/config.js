/* =====================================================
   config.js ― 設定値（ここを変えるとアプリの中身が変わる）
   ===================================================== */

/* 保存キー。変えると、これまで登録したデータが見えなくなるので注意 */
const STORAGE_KEY = "kondate-b";

/* 食事の種類。key は保存データの中でも使われる（b=朝 / l=昼 / d=夕）。
   食事を増やすときは、CSSの .meal-x の色も追加する */
const MEALS = [
  { key: "b", label: "朝食", emoji: "🌅" },
  { key: "l", label: "昼食", emoji: "🍱" },
  { key: "d", label: "夕食", emoji: "🌙" },
];
const MEAL_KEYS = MEALS.map((m) => m.key);
const MEAL_LABEL = Object.fromEntries(MEALS.map((m) => [m.key, m.label])); // b → "朝食"
const MEAL_EMOJI = Object.fromEntries(MEALS.map((m) => [m.key, m.emoji])); // b → "🌅"
const MEAL_KEY_BY_LABEL = Object.fromEntries(MEALS.map((m) => [m.label, m.key])); // "朝食" → b

/* 表示用の文字 */
const UNDRAWN = "？";            // まだ抽選していないとき
const UNREGISTERED = "（未登録）"; // 料理が1件も登録されていないとき

/* 数値の設定 */
const MAX_HISTORY = 5;       // 履歴に残す件数
const MAX_NAME_LENGTH = 30;  // 料理名の最大文字数
const SPIN_FRAMES = 12;      // 抽選中に表示が切り替わる回数
const SPIN_INTERVAL_MS = 70; // 切り替わる間隔（ミリ秒）

/* 初めて開いたときに入っているサンプル料理 */
const DEFAULT_DISHES = {
  b: ["トースト＋目玉焼き", "納豆ご飯", "おにぎり", "ヨーグルトとフルーツ"],
  l: ["うどん", "チャーハン", "カレー", "パスタ"],
  d: ["焼き魚", "唐揚げ", "鍋", "生姜焼き", "ハンバーグ"],
};

/* テーマカラー [メイン色, サブ色]。設定画面の丸ボタンの数と同じ */
const THEMES = [
  ["#ff7a45", "#ffb347"], // オレンジ
  ["#2fb67c", "#8fd694"], // グリーン
  ["#3b82f6", "#7dd3fc"], // ブルー
  ["#ec4899", "#f9a8d4"], // ピンク
  ["#8b5cf6", "#c4b5fd"], // パープル
];
