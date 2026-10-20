/* =====================================================
   app.js ― 起動処理・タブ切替（最後に読み込まれる）
   ===================================================== */

/* 表示する画面とタブバーの強調を切り替える */
function switchTab(tab) {
  ui.tab = tab;
  for (const name of ["gacha", "dishes", "settings"]) {
    $("view-" + name).hidden = name !== tab;
  }
  for (const btn of $("tabBar").children) {
    btn.classList.toggle("is-active", btn.dataset.tab === tab);
  }
  $("addFab").hidden = tab !== "dishes"; // ＋ボタンは料理リストのときだけ
  scrollTo(0, 0);
}

$("tabBar").onclick = (e) => {
  const btn = e.target.closest("button");
  if (btn) switchTab(btn.dataset.tab);
};

/* ---------- 起動 ---------- */
loadStore();                                    // 1. 保存データを読み込む
$("todayLabel").textContent = new Date().toLocaleDateString("ja-JP", {
  month: "long",
  day: "numeric",
  weekday: "short",
});                                             // 2. ヘッダーの日付
applyTheme(store.th);                           // 3. テーマカラー
applyMode(store.mode);                          //    表示モード（自動／ライト／ダーク）
renderMealCards();                              // 4. 各画面を描画
renderHistory();
renderDishList();

/* ---------- PWA：オフライン対応（Service Worker） ----------
   sw.js と同じ場所に置いて https で公開すると有効になる。
   Claude上の公開ページでは何もしない。 */
if ("serviceWorker" in navigator && !window.claude) {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
