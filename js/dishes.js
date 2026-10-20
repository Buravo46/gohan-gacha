/* =====================================================
   dishes.js ― 料理リスト画面と、追加・編集シート
   ===================================================== */

/* ---------- 表示 ---------- */

/* 料理リストの1件分のHTML */
function dishItemHtml(dish, index) {
  const link = dish.u
    ? ` <a class="link-pill link-pill--small" href="${escapeHtml(dish.u)}" target="_blank" rel="noopener">🔗</a>`
    : "";
  return `
    <div class="dish-item">
      <div class="dish-name">${escapeHtml(dish.n)}${link}</div>
      <button data-edit="${index}" aria-label="編集">✏️</button>
      <button data-delete="${index}" aria-label="削除">🗑️</button>
    </div>`;
}

/* 料理リスト画面（食事タブ・一覧）と、ヘッダーの登録件数を描画する */
function renderDishList() {
  const total = MEAL_KEYS.reduce((sum, k) => sum + store.D[k].length, 0);
  $("dishCountBadge").textContent = `🍴 登録 ${total}品`;

  $("mealTabs").innerHTML = MEAL_KEYS.map(
    (k) => `
      <button data-meal="${k}" class="${k === ui.mealTab ? "is-active" : ""}">
        ${MEAL_EMOJI[k]} ${MEAL_LABEL[k]} <small>${store.D[k].length}</small>
      </button>`,
  ).join("");

  const dishes = store.D[ui.mealTab];
  $("dishList").innerHTML = dishes.length
    ? dishes.map(dishItemHtml).join("")
    : `<div class="empty">まだ${MEAL_LABEL[ui.mealTab]}の料理がありません。<br>右下の＋から追加しましょう</div>`;
}

/* ---------- 一覧の操作 ---------- */

/* 食事タブの切替 */
$("mealTabs").onclick = (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  ui.mealTab = btn.dataset.meal;
  renderDishList();
};

/* ✏️ 編集 / 🗑️ 削除 */
$("dishList").onclick = (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  if (btn.dataset.edit !== undefined) openSheet(Number(btn.dataset.edit));
  if (btn.dataset.delete !== undefined) {
    store.D[ui.mealTab].splice(Number(btn.dataset.delete), 1);
    saveStore();
    renderDishList();
    showToast("削除しました");
  }
};

/* ---------- 追加・編集シート ---------- */

/* シートを開く。index = -1 なら新規追加、0以上ならその番号の料理を編集 */
function openSheet(index) {
  ui.editIndex = index;
  const isAdd = index < 0;

  // 追加：複数行の入力欄 / 編集：1行の入力欄
  $("sheetMulti").hidden = !isAdd;
  $("sheetName").hidden = isAdd;
  $("sheetTitle").textContent = isAdd ? MEAL_LABEL[ui.mealTab] + "に料理を追加" : "料理を編集";

  if (isAdd) {
    $("sheetMulti").value = "";
    $("sheetUrl").value = "";
  } else {
    const dish = store.D[ui.mealTab][index];
    $("sheetName").value = dish.n;
    $("sheetUrl").value = dish.u || "";
  }

  $("sheetNote").innerHTML = isAdd
    ? "複数追加は改行で区切ります。<br>「料理名 URL」の形式でもOKです。（URL欄は1件のときだけ使われます）"
    : "";
  $("sheet").hidden = false;
}

/* シートを閉じる */
const closeSheet = () => ($("sheet").hidden = true);

/* 追加モード：入力を料理のリストにして登録する。登録できた件数を返す */
function addDishesFromSheet(list, urlField) {
  const lines = $("sheetMulti")
    .value.split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  let added = 0;
  for (const line of lines) {
    let name = line;
    let url = "";
    const match = line.match(/^(.*?)\s+(https?:\/\/\S+)$/); // 「料理名 URL」形式
    if (match) {
      name = match[1];
      url = match[2];
    } else if (lines.length === 1) {
      url = urlField; // 1件だけのときは、URL欄の値を使う
    }
    name = name.slice(0, MAX_NAME_LENGTH);
    if (name && !list.some((d) => d.n === name)) {
      list.push(url ? { n: name, u: url } : { n: name });
      added++;
    }
  }
  return added;
}

/* 保存ボタン：入力チェック → 追加（複数行OK）または更新 */
function saveSheet() {
  const url = $("sheetUrl").value.trim();
  if (url && !isHttpUrl(url)) {
    return showToast("URLは http:// か https:// で始まる形式にしてください");
  }
  const list = store.D[ui.mealTab];

  if (ui.editIndex >= 0) {
    // --- 編集 ---
    const name = $("sheetName").value.trim().slice(0, MAX_NAME_LENGTH);
    if (!name) return showToast("料理名を入力してください");
    const duplicated = list.some((d, i) => i !== ui.editIndex && d.n === name);
    if (duplicated) return showToast("同じ名前の料理がすでにあります");
    list[ui.editIndex] = url ? { n: name, u: url } : { n: name };
    showToast("更新しました");
  } else {
    // --- 新規追加 ---
    const added = addDishesFromSheet(list, url);
    if (!added) return showToast("追加できる料理がありません（空欄または重複）");
    showToast(`${added}件追加しました`);
  }

  saveStore();
  renderDishList();
  closeSheet();
}

$("sheetCancel").onclick = closeSheet;
$("sheetBackdrop").onclick = closeSheet; // 暗い背景をタップしても閉じる
$("addFab").onclick = () => openSheet(-1);
$("sheetSave").onclick = saveSheet;
