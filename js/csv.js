/* =====================================================
   csv.js ― CSVの書き出し・読み込み（バックアップ・引っ越し用）
   形式：1行目 "食事,料理名,URL"  2行目以降 "朝食,納豆ご飯,https://…"
   ===================================================== */

/* ---------- 書き出し ---------- */

/* CSVの1つの値を安全な形にする（カンマ・改行・引用符を含むときは " で囲む） */
function csvQuote(value) {
  return /[",\n\r]/.test(value) ? '"' + value.replace(/"/g, '""') + '"' : value;
}

/* ファイルとして保存する。
   Claude上の公開ページでは downloads 機能、通常のWebサイトでは通常のダウンロードを使う */
async function saveFile(filename, text) {
  const downloads = await (window.claude ? window.claude.use("downloads") : null);
  if (downloads) {
    await downloads.save({ filename, data: text });
    return;
  }
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([text], { type: "text/csv" }));
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

/* 書き出しボタン */
$("exportBtn").onclick = async () => {
  const rows = ["食事,料理名,URL"];
  for (const k of MEAL_KEYS) {
    for (const dish of store.D[k]) {
      rows.push([MEAL_LABEL[k], dish.n, dish.u || ""].map(csvQuote).join(","));
    }
  }
  if (rows.length < 2) return showToast("登録済みの料理がありません");

  const filename = "kondate_" + new Date().toISOString().slice(0, 10) + ".csv";
  // 先頭の \uFEFF（BOM）を付けると、Excelで開いても文字化けしない
  const text = "\uFEFF" + rows.join("\r\n");
  try {
    await saveFile(filename, text);
    showToast("CSVを書き出しました");
  } catch (e) {
    if (e.code !== "declined") showToast("書き出せませんでした"); // 保存をやめた場合は何も出さない
  }
};

/* ---------- 読み込み ---------- */

/* CSVの文字列 → 2次元配列（引用符・改行入りの値にも対応） */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } // "" は " 1文字
        else inQuotes = false;
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++; // 改行コード CRLF
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += ch;
    }
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

/* ファイルの中身を文字列にする。まずUTF-8、失敗したらShift_JIS（Excelの古い形式） */
async function readCsvText(file) {
  const bytes = await file.arrayBuffer();
  let text;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch (e) {
    text = new TextDecoder("shift_jis").decode(bytes);
  }
  return text.replace(/^\uFEFF/, ""); // 先頭のBOMを取る
}

/* CSVの行を食事ごとの料理に分ける。形式が正しくない行は skipped に数える */
function rowsToDishes(rows) {
  const byMeal = Object.fromEntries(MEAL_KEYS.map((k) => [k, []]));
  let skipped = 0;
  let total = 0;

  rows
    .filter((r) => r.some((cell) => cell.trim())) // 空行は無視
    .forEach((r, i) => {
      const mealLabel = (r[0] || "").trim();
      const name = (r[1] || "").trim().slice(0, MAX_NAME_LENGTH);
      const url = (r[2] || "").trim();
      if (i === 0 && mealLabel === "食事") return; // ヘッダー行

      const key = MEAL_KEY_BY_LABEL[mealLabel];
      if (!key || !name || (url && !isHttpUrl(url))) {
        skipped++;
        return;
      }
      byMeal[key].push(url ? { n: name, u: url } : { n: name });
      total++;
    });
  return { byMeal, skipped, total };
}

/* 読み込んだ料理を登録する。同じ名前は重複させず、URLが未登録ならURLだけ補う */
function mergeDishes(base, byMeal) {
  let added = 0;
  for (const k of MEAL_KEYS) {
    for (const dish of byMeal[k]) {
      const existing = base[k].find((d) => d.n === dish.n);
      if (!existing) {
        base[k].push(dish);
        added++;
      } else if (!existing.u && dish.u) {
        existing.u = dish.u;
      }
    }
  }
  return added;
}

/* 「読み込む」ボタン → 見えないファイル選択を開く */
$("importBtn").onclick = () => $("csvFile").click();

/* ファイルが選ばれたら取り込む */
$("csvFile").onchange = async (e) => {
  const file = e.target.files[0];
  e.target.value = ""; // 同じファイルをもう一度選べるようにする
  if (!file) return;

  try {
    const { byMeal, skipped, total } = rowsToDishes(parseCsv(await readCsvText(file)));
    if (!total) return showToast("読み込める料理が見つかりませんでした");

    // 「置き換える」にチェックがあれば空から、なければ今の登録に追加
    const base = $("replaceCheck").checked
      ? Object.fromEntries(MEAL_KEYS.map((k) => [k, []]))
      : store.D;
    const added = mergeDishes(base, byMeal);

    store.D = base;
    saveStore();
    renderDishList();
    showToast(`${added}件を登録しました` + (skipped ? `（${skipped}行は形式不正のためスキップ）` : ""));
  } catch (err) {
    showToast("ファイルを読み込めませんでした");
  }
};
