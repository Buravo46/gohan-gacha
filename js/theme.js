/* =====================================================
   theme.js ― テーマカラー（設定画面の丸ボタン）
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
