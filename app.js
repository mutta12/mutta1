// むった食堂 テーブルオーダー画面のロジック
const $ = (id) => document.getElementById(id);
const yen = (n) => "¥" + n.toLocaleString("ja-JP");
const RECORD_KEY = "muttaOrderRecords";
const WELCOME_SECONDS = 4;
const MAX_QTY = 20;
const MAX_SPLIT = 20;

const state = {
  category: "recommend",
  cart: [],          // { key, item, choices: [{ group, label, price }], qty }  ※ label は日本語のまま持つ
  guest: null,       // { sessionId, age (数値 or null), group (AGE_GROUPS の要素 or null), gender, allergies: [日本語名] }
  records: loadRecords(),
  editing: null,     // 商品詳細で選択中の { item, choices, qty }
  profileGender: null,
  profileAllergies: [], // 年齢・性別画面で選択中のアレルギー
  modalAllergies: [],   // アレルギー指定画面で選択中のアレルギー
  ageErrorKey: null, // 年齢入力のエラー（言語を切り替えても表示し直せるようにキーで持つ）
  splitCount: 1,
};

// ---------- 記録の保存 ----------
function loadRecords() {
  try {
    const r = JSON.parse(localStorage.getItem(RECORD_KEY));
    return Array.isArray(r) ? r : [];
  } catch {
    return [];
  }
}
function saveRecords() {
  try { localStorage.setItem(RECORD_KEY, JSON.stringify(state.records)); } catch {}
}

const pad = (n) => String(n).padStart(2, "0");
const formatDateTime = (d) =>
  `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
const formatTime = (d) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;

const unitPrice = (line) => line.item.price + line.choices.reduce((s, c) => s + c.price, 0);
const lineTotal = (line) => unitPrice(line) * line.qty;
const optTextJa = (choices) => choices.map((c) => c.label).join("・");
const optText = (choices) => choices.map((c) => tr(c.label)).join(" / ");
const optTextFromJa = (ja) => (ja ? ja.split("・").map(tr).join(" / ") : "");

// 注文全体の提供目安は、いちばん時間のかかる料理に合わせる
const estimateOf = (lines) => Math.max(0, ...lines.map((l) => l.item.time || 0));
const findItem = (id) => MENU_ITEMS.find((i) => i.id === id);

// ---------- アレルギー ----------
const allergensOf = (item) => ITEM_ALLERGENS[item.id] || [];
const guestAllergies = () => (state.guest ? state.guest.allergies : []);
const isExcluded = (item) => allergensOf(item).some((a) => guestAllergies().includes(a));
const sortAllergens = (list) => ALLERGENS.filter((a) => list.includes(a));
const toggleIn = (list, a) => (list.includes(a) ? list.filter((x) => x !== a) : [...list, a]);

function renderAllergyChips(containerId, selected) {
  $(containerId).innerHTML = ALLERGENS.map((a) =>
    `<button type="button" class="choice chip ${selected.includes(a) ? "selected" : ""}" data-allergen="${a}">${tr(a)}</button>`).join("");
}

// かごから食べられない料理を外し、外した品数を返す
function removeExcludedFromCart() {
  const before = state.cart.length;
  state.cart = state.cart.filter((l) => !isExcluded(l.item));
  return before - state.cart.length;
}

$("profileAllergies").addEventListener("click", (e) => {
  const b = e.target.closest("[data-allergen]");
  if (!b) return;
  state.profileAllergies = toggleIn(state.profileAllergies, b.dataset.allergen);
  renderAllergyChips("profileAllergies", state.profileAllergies);
});

$("btnAllergy").addEventListener("click", () => {
  state.modalAllergies = [...guestAllergies()];
  renderAllergyChips("modalAllergies", state.modalAllergies);
  $("allergyModal").hidden = false;
});

$("modalAllergies").addEventListener("click", (e) => {
  const b = e.target.closest("[data-allergen]");
  if (!b) return;
  state.modalAllergies = toggleIn(state.modalAllergies, b.dataset.allergen);
  renderAllergyChips("modalAllergies", state.modalAllergies);
});

$("btnAllergyApply").addEventListener("click", () => {
  if (!state.guest) return;
  state.guest.allergies = sortAllergens(state.modalAllergies);
  const removed = removeExcludedFromCart();
  $("allergyModal").hidden = true;
  toast(removed ? t("allergyRemoved", { n: removed }) : t("allergySaved"));
  renderGuestInfo();
  renderAll();
});

// ---------- 言語 ----------
function applyStaticTexts() {
  document.documentElement.lang = LANGUAGES.find((l) => l.id === currentLang).htmlLang;
  document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t(el.dataset.i18n)));
  document.querySelectorAll("[data-i18n-html]").forEach((el) => (el.innerHTML = t(el.dataset.i18nHtml)));
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => (el.placeholder = t(el.dataset.i18nPlaceholder)));
  document.querySelectorAll("[data-i18n-term]").forEach((el) => (el.textContent = tr(el.dataset.i18nTerm)));
  ["qtyMinus", "splitMinus"].forEach((id) => $(id) && $(id).setAttribute("aria-label", t("decrease")));
  ["qtyPlus", "splitPlus"].forEach((id) => $(id) && $(id).setAttribute("aria-label", t("increase")));
  $("btnLang").textContent = "🌐 " + LANGUAGES.find((l) => l.id === currentLang).label;
  $("tableNo").textContent = t("tableNo", { n: TABLE_NUMBER });
  $("welcomeTable").textContent = t("tableNo", { n: TABLE_NUMBER });
  $("ageError").textContent = state.ageErrorKey ? t(state.ageErrorKey) : "";
  renderAllergyChips("profileAllergies", state.profileAllergies);
  renderAllergyChips("modalAllergies", state.modalAllergies);
  renderLangButtons();
}

function renderLangButtons() {
  const html = LANGUAGES.map((l) =>
    `<button class="lang-btn ${l.id === currentLang ? "active" : ""}" data-lang="${l.id}">${l.label}</button>`).join("");
  $("welcomeLangs").innerHTML = html;
  $("langList").innerHTML = html;
}

function setLang(id) {
  if (!LANGUAGES.some((l) => l.id === id)) return;
  currentLang = id;
  applyStaticTexts();
  renderGuestInfo();
  renderCategories();
  renderAll();
}

// 起動画面で言語を選んだら、その言語で次へ進む
$("welcomeLangs").addEventListener("click", (e) => {
  const b = e.target.closest("[data-lang]");
  if (!b) return;
  e.stopPropagation();
  setLang(b.dataset.lang);
  leaveWelcome();
});

$("btnLang").addEventListener("click", () => {
  renderLangButtons();
  $("langModal").hidden = false;
});
$("langList").addEventListener("click", (e) => {
  const b = e.target.closest("[data-lang]");
  if (!b) return;
  setLang(b.dataset.lang);
  $("langModal").hidden = true;
});

// ---------- 起動画面 ----------
let welcomeTimer;
function showWelcome() {
  document.querySelectorAll(".overlay").forEach((o) => (o.hidden = true));
  $("profile").hidden = true;
  $("welcome").hidden = false;
  clearTimeout(welcomeTimer);
  welcomeTimer = setTimeout(leaveWelcome, WELCOME_SECONDS * 1000);
}
function leaveWelcome() {
  if ($("welcome").hidden) return;
  clearTimeout(welcomeTimer);
  $("welcome").hidden = true;
  showProfile();
}
$("welcome").addEventListener("click", leaveWelcome);

// ---------- 年齢・性別 ----------
// 入力文字列を年齢に変換する。どんな入力でも例外は出さず、{ age } か { error: 文言キー } を返す。
function parseAge(raw) {
  const s = String(raw ?? "")
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[－−‐ー]/g, "-")
    .trim();
  if (s === "") return { error: "errEmpty" };
  if (/^-\s*\d/.test(s)) return { error: "errNegative" };
  if (!/^\d+$/.test(s)) return { error: "errNotNumber" };
  const n = Number(s);
  if (!Number.isSafeInteger(n) || n > 120) return { error: "errRange" };
  return { age: n };
}

const ageGroupOf = (age) => AGE_GROUPS.find((g) => age <= g.max);

function showProfile() {
  const g = state.guest;
  $("ageInput").value = g && g.age !== null ? g.age : "";
  setAgeError(null);
  state.profileGender = g ? g.gender : null;
  state.profileAllergies = g ? [...g.allergies] : [];
  renderGender();
  renderAllergyChips("profileAllergies", state.profileAllergies);
  $("profile").hidden = false;
}

function setAgeError(key) {
  state.ageErrorKey = key;
  $("ageError").textContent = key ? t(key) : "";
  $("ageInput").classList.toggle("invalid", Boolean(key));
}

function renderGender() {
  document.querySelectorAll("[data-gender]").forEach((b) =>
    b.classList.toggle("selected", b.dataset.gender === state.profileGender));
}

$("genderRow").addEventListener("click", (e) => {
  const b = e.target.closest("[data-gender]");
  if (!b) return;
  state.profileGender = b.dataset.gender;
  renderGender();
});

$("ageInput").addEventListener("input", () => setAgeError(null));

$("profileForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const result = parseAge($("ageInput").value);
  if (result.error) {
    setAgeError(result.error);
    $("ageInput").focus();
    return;
  }
  setGuest(result.age, state.profileGender || "none", state.profileAllergies);
});

$("btnSkip").addEventListener("click", () => setGuest(null, state.profileGender || "none", state.profileAllergies));
$("btnChangeProfile").addEventListener("click", showProfile);

function setGuest(age, gender, allergies = []) {
  const sessionId = state.guest ? state.guest.sessionId : "S" + Date.now();
  state.guest = {
    sessionId, age, group: age === null ? null : ageGroupOf(age), gender, allergies: sortAllergens(allergies),
  };
  const messages = [];
  // 20 歳未満ならかごのお酒を外す
  if (isMinor()) {
    const before = state.cart.length;
    state.cart = state.cart.filter((l) => !l.item.alcohol);
    if (state.cart.length < before) messages.push(t("minorRemoved"));
  }
  const removed = removeExcludedFromCart();
  if (removed) messages.push(t("allergyRemoved", { n: removed }));
  if (messages.length) toast(messages.join(" / "));
  $("profile").hidden = true;
  state.category = "recommend";
  renderGuestInfo();
  renderCategories();
  renderAll();
}

const isMinor = () => state.guest && state.guest.age !== null && state.guest.age < 20;

function renderGuestInfo() {
  const g = state.guest;
  const parts = [];
  if (g && g.age !== null) parts.push(t("ageLabel", { n: g.age }));
  if (g && g.gender !== "none") parts.push(tr(GENDERS[g.gender]));
  if (g && g.allergies.length) parts.push(`${t("allergy")}: ${trList(g.allergies)}`);
  $("guestInfo").textContent = parts.length ? t("guest", { label: parts.join(" / ") }) : "";
}

// ---------- カテゴリ ----------
function renderCategories() {
  $("categories").innerHTML = CATEGORIES.map((c) => `
    <button class="cat ${c.id === state.category ? "active" : ""}" data-cat="${c.id}">${tr(c.name)}</button>`).join("");
}

$("categories").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-cat]");
  if (!btn) return;
  state.category = btn.dataset.cat;
  renderCategories();
  renderMenu();
  document.querySelector(".menu").scrollTop = 0;
});

// ---------- メニュー一覧 ----------
function recommendIds() {
  const g = state.guest;
  const base = !g || !g.group
    ? DEFAULT_RECOMMENDATIONS
    : RECOMMENDATIONS[g.group.id][g.gender] || RECOMMENDATIONS[g.group.id].none;
  const canEat = (item) => item && !item.soldOut && !isExcluded(item) && !(item.alcohol && isMinor());
  const ids = base.filter((id) => canEat(findItem(id)));
  // アレルギーなどで減った分は、食べられる人気料理で補う
  const fillers = [
    ...DEFAULT_RECOMMENDATIONS,
    ...MENU_ITEMS.filter((i) => (i.tags || []).includes("人気")).map((i) => i.id),
    ...MENU_ITEMS.map((i) => i.id),
  ];
  for (const id of fillers) {
    if (ids.length >= base.length) break;
    if (!ids.includes(id) && canEat(findItem(id))) ids.push(id);
  }
  return ids;
}

function itemsInCategory() {
  if (state.category === "recommend") return recommendIds().map(findItem).filter(Boolean);
  return MENU_ITEMS.filter((i) => i.category === state.category && !isExcluded(i));
}

// アレルギーの指定で隠している品数（おすすめではメニュー全体、それ以外はそのカテゴリ）
function hiddenCount() {
  const pool = state.category === "recommend" ? MENU_ITEMS : MENU_ITEMS.filter((i) => i.category === state.category);
  return pool.filter(isExcluded).length;
}

function recommendSubtitle() {
  const g = state.guest;
  if (!g || !g.group) return t("recDefault");
  const who = g.gender === "none"
    ? tr(g.group.label)
    : t("whoWithGender", { group: tr(g.group.label), gender: tr(GENDERS[g.gender]) });
  return t("recFor", { who });
}

function renderMenu() {
  const isRec = state.category === "recommend";
  $("menuTitle").textContent = tr(CATEGORIES.find((c) => c.id === state.category).name);
  $("menuSub").textContent = isRec ? recommendSubtitle() : "";
  $("btnChangeProfile").hidden = !isRec;
  const hidden = hiddenCount();
  $("menuNote").hidden = hidden === 0;
  $("menuNote").textContent = hidden ? t("allergyHidden", { list: trList(guestAllergies()), n: hidden }) : "";

  const items = itemsInCategory();
  if (items.length === 0) {
    $("grid").innerHTML = `<p class="grid-empty">${t("emptyCategory")}</p>`;
    return;
  }
  $("grid").innerHTML = items.map((i, idx) => {
    const inCart = state.cart.filter((l) => l.item.id === i.id).reduce((s, l) => s + l.qty, 0);
    const tags = [...(i.tags || [])];
    if (i.alcohol) tags.push("20歳以上");
    return `
      <button class="card washi ${i.soldOut ? "soldout" : ""}" data-item="${i.id}" data-soldout="${t("soldOut")}">
        <div class="card-img lacquer"><span class="plate">${i.emoji}</span></div>
        ${isRec ? `<span class="rank">${idx + 1}</span>` : ""}
        <div class="tags">${tags.map((tag) => `<span class="tag ${tag === "20歳以上" ? "tag-age" : ""}">${tr(tag)}</span>`).join("")}</div>
        ${inCart ? `<span class="badge-in-cart">${inCart}</span>` : ""}
        <div class="card-info">
          <div class="card-name">${itemName(i)}</div>
          <div class="card-meta">
            <span class="card-price">${yen(i.price)}<small>${t("taxIncl")}</small></span>
            <span class="card-time">⏱ ${t("aboutMin", { n: i.time })}</span>
          </div>
        </div>
      </button>`;
  }).join("");
}

$("grid").addEventListener("click", (e) => {
  const card = e.target.closest("[data-item]");
  if (card) openItem(MENU_ITEMS.find((i) => i.id === Number(card.dataset.item)));
});

// ---------- 商品詳細 ----------
function openItem(item) {
  if (!item || item.soldOut) return;
  state.editing = {
    item,
    choices: (item.options || []).map((g) => ({ group: g.name, ...g.choices[0] })),
    qty: 1,
  };
  $("itemEmoji").textContent = item.emoji;
  renderItemModal();
  $("itemModal").hidden = false;
}

function renderItemModal() {
  const ed = state.editing;
  $("itemName").textContent = itemName(ed.item);
  $("itemPrice").textContent = yen(ed.item.price) + t("taxInclParen");
  $("itemTime").textContent = "⏱ " + t("serveTime", { n: ed.item.time });
  $("itemDesc").textContent = itemDesc(ed.item) || "";
  const allergens = allergensOf(ed.item);
  $("itemAllergy").textContent = allergens.length ? t("allergyLine", { list: trList(allergens) }) : t("allergyNone");
  $("itemOptions").innerHTML = (ed.item.options || []).map((g, gi) => `
    <div class="opt-group">
      <div class="opt-group-name">${tr(g.name)}</div>
      <div class="opt-choices">
        ${g.choices.map((c, ci) => `
          <button class="choice ${ed.choices[gi].label === c.label ? "selected" : ""}" data-g="${gi}" data-c="${ci}">
            ${tr(c.label)}${c.price ? `（${c.price > 0 ? "+" : ""}${yen(c.price)}）` : ""}
          </button>`).join("")}
      </div>
    </div>`).join("");
  $("qtyValue").textContent = ed.qty;
  const blocked = ed.item.alcohol && isMinor();
  $("itemNotice").textContent = blocked ? t("minorAlcohol") : "";
  $("btnAdd").disabled = blocked;
  $("btnAdd").textContent = blocked ? t("cannotOrder") : t("addToCart", { price: yen(lineTotal(ed)) });
}

$("itemOptions").addEventListener("click", (e) => {
  const b = e.target.closest("[data-g]");
  if (!b) return;
  const g = state.editing.item.options[b.dataset.g];
  state.editing.choices[b.dataset.g] = { group: g.name, ...g.choices[b.dataset.c] };
  renderItemModal();
});
$("qtyMinus").addEventListener("click", () => {
  if (state.editing.qty > 1) state.editing.qty--;
  renderItemModal();
});
$("qtyPlus").addEventListener("click", () => {
  if (state.editing.qty < MAX_QTY) state.editing.qty++;
  renderItemModal();
});
$("btnAdd").addEventListener("click", () => {
  const ed = state.editing;
  const key = ed.item.id + "|" + optTextJa(ed.choices);
  const existing = state.cart.find((l) => l.key === key);
  if (existing) existing.qty = Math.min(existing.qty + ed.qty, MAX_QTY);
  else state.cart.push({ key, item: ed.item, choices: ed.choices, qty: ed.qty });
  $("itemModal").hidden = true;
  toast(t("added", { name: itemName(ed.item) }));
  renderAll();
});

// ---------- かご ----------
const cartTotal = () => state.cart.reduce((s, l) => s + lineTotal(l), 0);

function renderCart() {
  if (state.cart.length === 0) {
    $("cartItems").innerHTML = `<p class="cart-empty">${t("cartEmpty")}</p>`;
  } else {
    $("cartItems").innerHTML = state.cart.map((l, idx) => `
      <div class="cart-row">
        <span class="plate">${l.item.emoji}</span>
        <div class="info">
          <div class="name">${itemName(l.item)}</div>
          ${l.choices.length ? `<span class="opt">${optText(l.choices)}</span>` : ""}
          <div class="line">
            <div class="mini-qty">
              <button data-dec="${idx}" aria-label="${t("decrease")}">${l.qty === 1 ? "✕" : "−"}</button>
              <span>${l.qty}</span>
              <button data-inc="${idx}" aria-label="${t("increase")}">＋</button>
            </div>
            <span class="price">${yen(lineTotal(l))}</span>
          </div>
        </div>
      </div>`).join("");
  }
  const count = state.cart.reduce((s, l) => s + l.qty, 0);
  $("cartCount").textContent = count ? t("itemCount", { n: count }) : "";
  $("cartTotal").textContent = yen(cartTotal());
  $("btnOrder").disabled = state.cart.length === 0;
}

$("cartItems").addEventListener("click", (e) => {
  const inc = e.target.closest("[data-inc]");
  const dec = e.target.closest("[data-dec]");
  if (inc) {
    const l = state.cart[inc.dataset.inc];
    if (l.qty < MAX_QTY) l.qty++;
  }
  if (dec) {
    const l = state.cart[dec.dataset.dec];
    if (--l.qty <= 0) state.cart.splice(dec.dataset.dec, 1);
  }
  if (inc || dec) renderAll();
});

// ---------- 注文 ----------
$("btnOrder").addEventListener("click", () => {
  $("confirmList").innerHTML = state.cart.map((l) => `
    <li><span>${itemName(l.item)} × ${l.qty}${l.choices.length ? `<span class="opt">${optText(l.choices)}</span>` : ""}</span>
    <span class="right">${yen(lineTotal(l))}</span></li>`).join("");
  $("confirmTotal").textContent = yen(cartTotal());
  $("confirmEstimate").textContent = "⏱ " + t("confirmEstimate", { n: estimateOf(state.cart) });
  $("confirmModal").hidden = false;
});

$("btnConfirm").addEventListener("click", () => {
  const g = state.guest;
  const now = new Date();
  const orderId = "O" + now.getTime();
  const estimateMin = estimateOf(state.cart);
  state.cart.forEach((l, i) => {
    state.records.push({
      id: `${orderId}-${i + 1}`,
      orderId,
      sessionId: g.sessionId,
      datetime: formatDateTime(now),
      orderedAtMs: now.getTime(),
      table: TABLE_NUMBER,
      age: g.age === null ? "未選択" : g.age,
      ageGroup: g.group ? g.group.label : "未選択",
      gender: g.gender === "none" ? "未選択" : GENDERS[g.gender],
      lang: LANGUAGES.find((x) => x.id === currentLang).label,
      allergies: g.allergies.length ? g.allergies.join("・") : "なし",
      name: l.item.name,
      itemId: l.item.id,
      option: optTextJa(l.choices),
      qty: l.qty,
      unitPrice: unitPrice(l),
      amount: lineTotal(l),
      estimateMin,
      status: "注文",
    });
  });
  saveRecords();
  state.cart = [];
  $("confirmModal").hidden = true;
  toast(t("ordered", { n: estimateMin }));
  renderAll();
});

// ---------- 注文履歴・取消 ----------
const sessionRecords = () =>
  state.guest ? state.records.filter((r) => r.sessionId === state.guest.sessionId && r.status !== "会計済") : [];
const activeTotal = () => sessionRecords().filter((r) => r.status === "注文").reduce((s, r) => s + r.amount, 0);
const recordName = (r) => {
  const item = MENU_ITEMS.find((i) => i.id === r.itemId);
  return item ? itemName(item) : r.name;
};

function renderHistory() {
  const recs = sessionRecords();
  if (recs.length === 0) {
    $("historyList").innerHTML = `<li class="empty">${t("noOrders")}</li>`;
  } else {
    const orders = new Map();
    recs.forEach((r) => {
      if (!orders.has(r.orderId)) orders.set(r.orderId, []);
      orders.get(r.orderId).push(r);
    });
    let n = 0;
    $("historyList").innerHTML = [...orders.entries()].map(([orderId, lines]) => {
      n++;
      const first = lines[0];
      const anyActive = lines.some((r) => r.status === "注文");
      const ready = first.orderedAtMs && first.estimateMin
        ? t("estimate", { n: first.estimateMin, time: formatTime(new Date(first.orderedAtMs + first.estimateMin * 60000)) })
        : "";
      return `
        <li class="order-head">
          <span>${t("nthOrder", { n, time: first.datetime.slice(11, 16) })}
            ${anyActive && ready ? `<span class="order-estimate">⏱ ${ready}</span>` : ""}</span>
          ${anyActive ? `<button class="btn-cancel" data-cancel-order="${orderId}">${t("cancelAll")}</button>` : ""}
        </li>
        ${lines.map((r) => `
          <li class="${r.status === "取消" ? "cancelled" : ""}">
            <span>${recordName(r)} × ${r.qty}${r.option ? `<span class="opt">${optTextFromJa(r.option)}</span>` : ""}</span>
            <span class="right">
              <span class="amount">${yen(r.amount)}</span>
              ${r.status === "取消"
                ? `<span class="cancelled-mark">${t("cancelled")}</span>`
                : `<button class="btn-cancel" data-cancel-line="${r.id}">${t("cancel")}</button>`}
            </span>
          </li>`).join("")}`;
    }).join("");
  }
  $("historyTotal").textContent = yen(activeTotal());
}

$("btnHistory").addEventListener("click", () => {
  renderHistory();
  $("historyModal").hidden = false;
});

$("historyList").addEventListener("click", (e) => {
  const btn = e.target.closest("[data-cancel-line], [data-cancel-order]");
  if (!btn) return;
  // 1 回目のタップでは確認表示にするだけ。2 回目で取り消す。
  if (!btn.classList.contains("armed")) {
    document.querySelectorAll("#historyList .armed").forEach((b) => {
      b.classList.remove("armed");
      b.textContent = b.dataset.cancelOrder ? t("cancelAll") : t("cancel");
    });
    btn.classList.add("armed");
    btn.textContent = t("cancelArmed");
    return;
  }
  const cancelledAt = formatDateTime(new Date());
  state.records.forEach((r) => {
    const hit = btn.dataset.cancelLine ? r.id === btn.dataset.cancelLine : r.orderId === btn.dataset.cancelOrder;
    if (hit && r.status === "注文") {
      r.status = "取消";
      r.cancelledAt = cancelledAt;
    }
  });
  saveRecords();
  renderHistory();
  toast(t("cancelDone"));
});

// ---------- お会計・割り勘 ----------
// 1 人分は 1 円未満を切り捨て、余りは幹事の分に足す
function splitAmounts(total, people) {
  const each = Math.floor(total / people);
  return { each, organizer: each + (total - each * people) };
}

function splitHtml(total, people) {
  if (people <= 1) return `<p class="split-result">${t("splitAlone")}</p>`;
  const { each, organizer } = splitAmounts(total, people);
  if (each === organizer) {
    return `<p class="split-result">${t("splitHeader", { n: people })}<br>
      ${t("splitEach")} <strong>${yen(each)}</strong></p>`;
  }
  return `<p class="split-result">${t("splitHeader", { n: people })}<br>
    ${t("splitEach")} <strong>${yen(each)}</strong> ${t("splitTimes", { n: people - 1 })}<br>
    ${t("splitOrganizer")} <strong>${yen(organizer)}</strong>${t("splitRemainder", { r: yen(organizer - each) })}</p>`;
}

function renderSplit() {
  $("splitValue").textContent = state.splitCount;
  $("splitMinus").disabled = state.splitCount <= 1;
  $("splitPlus").disabled = state.splitCount >= MAX_SPLIT;
  $("splitResult").innerHTML = splitHtml(activeTotal(), state.splitCount);
}

$("btnCheckout").addEventListener("click", () => {
  const total = activeTotal();
  state.splitCount = 1;
  const cartWarn = state.cart.length ? `<p class="warn">${t("cartNotOrdered")}</p>` : "";
  $("checkoutBody").innerHTML = total === 0
    ? `<h3>${t("checkoutTitle")}</h3>
       <p class="thanks">${t("noOrdersYet")}</p>
       ${cartWarn}
       <div class="modal-actions"><button class="btn-gold" data-close>${t("close")}</button></div>`
    : `<h3>${t("checkoutTitle")}</h3>
       ${cartWarn}
       <div class="sum">${t("payAmount")} <strong>${yen(total)}</strong></div>
       <div class="split">
         <span class="split-label">${t("splitPeople")}</span>
         <div class="qty">
           <button id="splitMinus" aria-label="${t("decrease")}">−</button>
           <span id="splitValue">1</span>
           <button id="splitPlus" aria-label="${t("increase")}">＋</button>
         </div>
       </div>
       <div id="splitResult"></div>
       <p class="modal-note">${t("checkoutNote")}</p>
       <div class="modal-actions">
         <button class="btn-ghost" data-close>${t("back")}</button>
         <button class="btn-gold" id="btnPay">${t("pay")}</button>
       </div>`;
  if (total > 0) renderSplit();
  $("checkoutModal").hidden = false;
});

$("checkoutBody").addEventListener("click", (e) => {
  if (e.target.id === "splitMinus" || e.target.id === "splitPlus") {
    state.splitCount += e.target.id === "splitPlus" ? 1 : -1;
    state.splitCount = Math.min(MAX_SPLIT, Math.max(1, state.splitCount));
    renderSplit();
  } else if (e.target.id === "btnPay") {
    const total = activeTotal();
    const paidAt = formatDateTime(new Date());
    sessionRecords().forEach((r) => {
      if (r.status === "注文") {
        r.status = "会計済";
        r.paidAt = paidAt;
        r.splitCount = state.splitCount;
      }
    });
    saveRecords();
    $("checkoutModal").dataset.paid = "1"; // 会計後は背景タップで閉じない
    $("checkoutBody").innerHTML = `
      <div class="thanks">
        <div class="mark">${t("thanksMark")}</div>
        <p>${t("payAmount")} <strong>${yen(total)}</strong></p>
        ${splitHtml(total, state.splitCount)}
        <p>${t("thanksText")}</p>
      </div>
      <div class="modal-actions"><button class="btn-gold" id="btnFinish">${t("close")}</button></div>`;
  } else if (e.target.id === "btnFinish") {
    // 次のお客様のために、日本語の最初の画面へ戻る
    delete $("checkoutModal").dataset.paid;
    state.cart = [];
    state.guest = null;
    state.category = "recommend";
    setLang("ja");
    showWelcome();
  }
});

$("btnCall").addEventListener("click", () => toast(t("called")));

// ---------- 注文記録（店舗用・日本語のみ）・CSV ----------
$("btnRecords").addEventListener("click", () => {
  const recs = state.records;
  const active = recs.filter((r) => r.status !== "取消");
  $("recordsSummary").textContent =
    `記録 ${recs.length} 件（取消 ${recs.length - active.length} 件）／取消を除いた売上合計 ${yen(active.reduce((s, r) => s + r.amount, 0))}`;
  $("recordsBody").innerHTML = recs.length
    ? recs.slice().reverse().map((r) => `
      <tr>
        <td>${r.datetime}</td><td>${r.table}</td><td>${r.age}</td><td>${r.gender}</td><td>${r.lang || "日本語"}</td><td>${r.allergies || "なし"}</td>
        <td>${r.name}${r.option ? `（${r.option}）` : ""}</td>
        <td class="num">${r.qty}</td><td class="num">${yen(r.amount)}</td>
        <td class="st-${r.status}">${r.status}</td>
      </tr>`).join("")
    : `<tr><td colspan="10">まだ記録はありません</td></tr>`;
  $("recordsModal").hidden = false;
});

const CSV_HEADER = ["記録ID", "注文番号", "注文日時", "テーブル", "年齢", "年代", "性別", "注文言語", "アレルギー指定", "商品名", "オプション", "数量", "単価", "金額", "提供目安(分)", "状態", "取消日時", "会計日時", "割り勘人数"];
const csvCell = (v) => {
  const s = String(v ?? "");
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

$("btnCsv").addEventListener("click", () => {
  if (state.records.length === 0) {
    toast("書き出す記録がありません");
    return;
  }
  const rows = state.records.map((r) => [
    r.id, r.orderId, r.datetime, r.table, r.age, r.ageGroup, r.gender, r.lang || "日本語", r.allergies || "なし",
    r.name, r.option, r.qty, r.unitPrice, r.amount, r.estimateMin, r.status, r.cancelledAt, r.paidAt, r.splitCount,
  ]);
  // 先頭の BOM で Excel でも文字化けしない
  const csv = "﻿" + [CSV_HEADER, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const d = new Date();
  const a = document.createElement("a");
  a.href = url;
  a.download = `mutta_orders_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast("CSVファイルを書き出しました");
});

// ---------- モーダル共通 ----------
document.addEventListener("click", (e) => {
  const overlay = e.target.closest(".overlay");
  if (!overlay || overlay.dataset.paid) return;
  if (e.target.closest("[data-close]") || e.target === overlay) overlay.hidden = true;
});

let toastTimer;
function toast(msg) {
  $("toast").textContent = msg;
  $("toast").hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($("toast").hidden = true), 2600);
}

function renderAll() {
  renderMenu();
  renderCart();
}

// ---------- 起動 ----------
$("storeName").textContent = STORE_NAME;
$("welcomeName").textContent = STORE_NAME;
setLang("ja");
showWelcome();
