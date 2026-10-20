/* =====================================================
   utils.js ― 便利関数（どの画面からも使う小さな道具）
   ===================================================== */

/* idから要素を取得する。$("drawBtn") のように使う */
const $ = (id) => document.getElementById(id);

/* HTMLに文字を埋め込むとき、<  >  &  " を無害な形に変える（安全対策） */
function escapeHtml(text) {
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
  return text.replace(/[&<>"]/g, (c) => map[c]);
}

/* http:// または https:// で始まるURLか */
const isHttpUrl = (url) => /^https?:\/\//.test(url);

/* 配列からランダムに1件選ぶ（空なら undefined） */
const randomItem = (list) => list[Math.floor(Math.random() * list.length)];

/* 参照URLがある料理に付ける「🔗 レシピ…を開く」ボタンのHTML */
function linkPillHtml(dish) {
  if (!dish.u) return "";
  return `<a class="link-pill" href="${escapeHtml(dish.u)}" target="_blank" rel="noopener">🔗 レシピ・参照ページを開く</a>`;
}

/* 画面下に、数秒だけメッセージを出す */
let toastTimer;
function showToast(message) {
  const el = $("toast");
  el.textContent = message;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.textContent = ""), 3200);
}
