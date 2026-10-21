/* =====================================================
   theme.js ― 見た目の設定：テーマカラー・表示モード（自動／ライト／ダーク）・文字サイズ
   ===================================================== */

/* テーマを適用し、選択ボタンを描画する。index が未指定ならCSSの初期色のまま */
function applyTheme(index) {
  if (index != null) {
    const [main, sub] = THEMES[index];
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty("--accent", main);
    rootStyle.setProperty("--grad-1", main);
    rootStyle.setProperty("--grad-2", sub);
    document.querySelector("meta[name=theme-color]").content = main; // スマホの上部バーの色
  }
  const selected = index ?? 0;
  $("themePicker").innerHTML = THEMES.map(
    ([main, sub], i) => `
      <button data-theme-index="${i}"
              class="${i === selected ? "is-active" : ""}"
              style="background: linear-gradient(135deg, ${main}, ${sub})"
              aria-label="テーマ${i + 1}"></button>`,
  ).join("");
}

/* 丸ボタンを押したとき */
$("themePicker").onclick = (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  store.th = Number(btn.dataset.themeIndex);
  saveStore();
  applyTheme(store.th);
};

/* ---------- 表示モード ---------- */
const MODES = [
  ["auto", "自動"],
  ["light", "ライト"],
  ["dark", "ダーク"],
];

/* モードを適用し、選択ボタンを描画する。
   「自動」のときは data-theme を外し、スマホの設定（CSSの prefers-color-scheme）に任せる */
function applyMode(mode) {
  const current = mode || "auto";
  if (current === "auto") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", current);

  $("modePicker").innerHTML = MODES.map(
    ([value, label]) =>
      `<button data-mode="${value}" class="${value === current ? "is-active" : ""}">${label}</button>`,
  ).join("");
}

/* モードのボタンを押したとき */
$("modePicker").onclick = (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  store.mode = btn.dataset.mode;
  saveStore();
  applyMode(store.mode);
};

/* ---------- 文字サイズ ---------- */

/* 「大きい文字」を適用する。large が true なら <html data-text="large"> にする（倍率はCSS側で定義） */
function applyTextSize(large) {
  if (large) document.documentElement.setAttribute("data-text", "large");
  else document.documentElement.removeAttribute("data-text");
  $("largeTextToggle").checked = !!large; // スイッチの見た目を保存内容に合わせる
}

/* スイッチを切り替えたとき */
$("largeTextToggle").onchange = (e) => {
  store.large = e.target.checked ? 1 : 0;
  saveStore();
  applyTextSize(store.large);
};
