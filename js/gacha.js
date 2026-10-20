/* =====================================================
   gacha.js ― ガチャ画面（抽選・食事カード・履歴・共有）
   ===================================================== */

/* ---------- 抽選 ---------- */

/* 食事 key の料理から1件選ぶ。前回と同じ料理は避ける（候補が他に無ければ許可） */
function pickDish(key) {
  const dishes = store.D[key];
  if (!dishes.length) return { n: UNREGISTERED };
  const others = dishes.filter((d) => d.n !== store.last[key]);
  return randomItem(others.length ? others : dishes);
}

/* 抽選を実行する。
   onlyKey を渡すと、その食事だけ引き直す。
   ロック中・「食べない」の食事は対象外。 */
function drawGacha(onlyKey) {
  if (ui.busy) return;

  const targets = onlyKey
    ? [onlyKey]
    : MEAL_KEYS.filter((k) => !ui.locked[k] && store.ON[k]);
  if (!targets.length) return showToast("引き直せる食事がありません");

  ui.busy = true;
  let frame = 0;
  const timer = setInterval(() => {
    // 抽選中の演出：候補をランダムに次々表示する（まだ確定ではない）
    for (const k of targets) {
      ui.result[k] = randomItem(store.D[k]) || { n: UNREGISTERED };
    }
    renderMealCards(true);

    if (++frame <= SPIN_FRAMES) return;
    clearInterval(timer);
    finishDraw(targets, !onlyKey);
  }, SPIN_INTERVAL_MS);
}

/* 抽選の確定：結果を決めて、保存・表示・演出を行う */
function finishDraw(targets, addToHistory) {
  for (const k of targets) {
    ui.result[k] = pickDish(k);
    store.last[k] = ui.result[k].n;
  }

  // 全体のガチャのときだけ履歴に残す（食べない食事は null）
  if (addToHistory) {
    const record = Object.fromEntries(
      MEAL_KEYS.map((k) => [k, store.ON[k] ? ui.result[k].n : null]),
    );
    store.hist.unshift({ t: Date.now(), r: record });
    store.hist = store.hist.slice(0, MAX_HISTORY);
  }

  ui.popKeys = new Set(targets); // この描画のときだけポップ演出
  saveStore();
  renderMealCards();
  ui.popKeys = new Set();
  renderHistory();

  ui.busy = false;
  if (navigator.vibrate) navigator.vibrate(30); // 対応スマホなら軽く振動
  launchConfetti();
}

/* ---------- 表示 ---------- */

/* 食事カード1枚分のHTML（spinning = 抽選中の見た目にするか） */
function mealCardHtml(key, spinning) {
  const enabled = store.ON[key];
  const locked = ui.locked[key];
  const dish = ui.result[key];

  // 状態に応じてクラスを付ける（見た目はCSS側で定義）
  const classes = ["meal-card", `meal-${key}`];
  if (locked) classes.push("is-locked");
  if (enabled && spinning && !locked) classes.push("is-spinning");
  if (!enabled) classes.push("is-off");
  if (ui.popKeys.has(key)) classes.push("is-popping");


  return `
    <div class="${classes.join(" ")}">
      <div class="meal-head">
        <span class="meal-icon">${MEAL_EMOJI[key]}</span>
        <b>${MEAL_LABEL[key]}</b>
        <span class="switch-label">${enabled ? "食べる" : "食べない"}</span>
        <label class="switch">
          <input type="checkbox" data-toggle="${key}" ${enabled ? "checked" : ""}>
          <i></i>
        </label>
      </div>
      <div class="meal-name">${enabled ? escapeHtml(dish.n) : "お休み 😴"}</div>
      ${enabled ? linkPillHtml(dish) : ""}
      ${
        enabled
          ? `<div class="meal-actions">
               <button data-lock="${key}">${locked ? "🔒 固定中" : "🔓 ロック"}</button>
               <button data-redraw="${key}">🔄 引き直し</button>
             </div>`
          : ""
      }
    </div>`;
}

/* 3枚の食事カードを描画する */
function renderMealCards(spinning) {
  $("mealCards").innerHTML = MEAL_KEYS.map((k) => mealCardHtml(k, spinning)).join("");
}

/* 最近の献立（履歴）を描画する */
function renderHistory() {
  if (!store.hist.length) {
    $("historyList").innerHTML = '<p class="empty">まだ履歴がありません</p>';
    return;
  }
  $("historyList").innerHTML = store.hist
    .slice(0, MAX_HISTORY) // 以前の7件分が残っていても、表示は新しい順に5件まで
    .map((h) => {
      const date = new Date(h.t);
      const names = MEAL_KEYS.map((k) => (h.r[k] ? escapeHtml(h.r[k]) : "―")).join(" ／ ");
      return `
        <div class="history-row">
          <small>${date.getMonth() + 1}/${date.getDate()}</small>
          <span>${names}</span>
        </div>`;
    })
    .join("");
}

/* 紙吹雪の演出：絵文字を上から降らせて、1.9秒後に消す */
function launchConfetti() {
  const pieces = ["🎉", "✨", "🍚", "🍜", "🍣"];
  for (let i = 0; i < 18; i++) {
    const span = document.createElement("span");
    span.className = "confetti";
    span.textContent = pieces[i % pieces.length];
    span.style.left = `${Math.random() * 100}%`;
    span.style.animationDelay = `${Math.random() * 0.3}s`;
    document.body.appendChild(span);
    setTimeout(() => span.remove(), 1900);
  }
}

/* ---------- 操作 ---------- */

/* カード内のボタン：ロック／引き直し */
$("mealCards").onclick = (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  if (btn.dataset.lock) {
    ui.locked[btn.dataset.lock] = !ui.locked[btn.dataset.lock];
    renderMealCards();
  }
  if (btn.dataset.redraw) drawGacha(btn.dataset.redraw);
};

/* 「食べる／食べない」スイッチ */
$("mealCards").onchange = (e) => {
  const key = e.target.dataset.toggle;
  if (!key) return;
  store.ON[key] = e.target.checked ? 1 : 0;
  saveStore();
  renderMealCards();
};

/* ガチャを回すボタン */
$("drawBtn").onclick = () => drawGacha();

/* 結果をテキストで共有する（共有メニューが無い環境ではクリップボードにコピー） */
$("shareBtn").onclick = async () => {
  const notDrawn = MEAL_KEYS.some((k) => store.ON[k] && ui.result[k].n === UNDRAWN);
  if (notDrawn) return showToast("先にガチャを回してください");

  const lines = MEAL_KEYS.map((k) => {
    const dish = ui.result[k];
    const text = store.ON[k] ? dish.n + (dish.u ? " " + dish.u : "") : "なし";
    return `${MEAL_LABEL[k]}：${text}`;
  });
  const message = "今日の献立\n" + lines.join("\n");

  try {
    if (navigator.share) {
      await navigator.share({ text: message });
    } else {
      await navigator.clipboard.writeText(message);
      showToast("コピーしました");
    }
  } catch (e) {
    showToast("コピーできませんでした");
  }
};
