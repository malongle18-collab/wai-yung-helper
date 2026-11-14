import { DATA_VERSION, DEMO_HELPER } from "./data.js";
import { defaultContractEnd } from "./rules.js";

export const STORAGE_KEY = "fdh-employer-v1";

function uid(prefix = "id") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function blankHelper(overrides = {}) {
  return {
    id: uid("helper"),
    name: "",
    nationality: "philippines",
    startDate: "",
    contractStart: "",
    contractEnd: "",
    wage: 5220,
    foodProvided: true,
    foodAllowance: 1236,
    restDay: 0,
    phone: "",
    notes: "",
    dob: "",
    visaExpiry: "",
    passportExpiry: "",
    winterChoice: "christmas",
    grantGeneralHolidays: false,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

export function demoHelper() {
  return blankHelper({
    ...DEMO_HELPER,
    id: uid("helper"),
    notes: DEMO_HELPER.notes,
  });
}

export function emptyState() {
  return {
    version: DATA_VERSION,
    currentHelperId: null,
    helpers: [],
    leaveLogs: [],
    shStatuses: {},
    payments: [],
    reminderState: {},
    guideChecks: {},
    arrangedRestDays: {},
    workTasks: [],
    workRules: [],
    shopLists: [],
    shopItems: [],
    priceCatalog: [],
    helperAccess: {},
    settings: {
      notifications: false,
    },
  };
}

function migrate(raw) {
  const state = { ...emptyState(), ...(raw || {}) };
  state.version = DATA_VERSION;
  state.helpers = Array.isArray(state.helpers) ? state.helpers : [];
  state.leaveLogs = Array.isArray(state.leaveLogs) ? state.leaveLogs : [];
  state.payments = Array.isArray(state.payments) ? state.payments : [];
  state.shStatuses = state.shStatuses && typeof state.shStatuses === "object" ? state.shStatuses : {};
  state.reminderState =
    state.reminderState && typeof state.reminderState === "object" ? state.reminderState : {};
  state.guideChecks =
    state.guideChecks && typeof state.guideChecks === "object" ? state.guideChecks : {};
  state.settings = { notifications: false, ...(state.settings || {}) };
  state.arrangedRestDays =
    state.arrangedRestDays && typeof state.arrangedRestDays === "object" ? state.arrangedRestDays : {};
  state.workTasks = Array.isArray(state.workTasks) ? state.workTasks : [];
  state.workRules = Array.isArray(state.workRules) ? state.workRules : [];
  state.shopLists = Array.isArray(state.shopLists) ? state.shopLists : [];
  state.shopItems = Array.isArray(state.shopItems) ? state.shopItems : [];
  state.priceCatalog = Array.isArray(state.priceCatalog) ? state.priceCatalog : [];
  state.helperAccess =
    state.helperAccess && typeof state.helperAccess === "object" ? state.helperAccess : {};
  if (state.currentHelperId && !state.helpers.some((h) => h.id === state.currentHelperId)) {
    state.currentHelperId = state.helpers[0]?.id || null;
  }
  if (!state.currentHelperId && state.helpers[0]) state.currentHelperId = state.helpers[0].id;
  return state;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    return migrate(JSON.parse(raw));
  } catch (err) {
    console.warn("無法讀取本機資料", err);
    return emptyState();
  }
}

export function saveState(state) {
  const payload = JSON.stringify(state);
  localStorage.setItem(STORAGE_KEY, payload);
  return state;
}

export function exportBackup(state) {
  const blob = new Blob(
    [
      JSON.stringify(
        {
          app: "外傭僱傭助手",
          exportedAt: new Date().toISOString(),
          data: state,
        },
        null,
        2
      ),
    ],
    { type: "application/json" }
  );
  const stamp = new Date().toISOString().slice(0, 10);
  return { blob, filename: `外傭僱傭助手-備份-${stamp}.json` };
}

export function importBackup(text) {
  const parsed = JSON.parse(text);
  const data = parsed.data || parsed.state || parsed;
  if (!data || typeof data !== "object") throw new Error("檔案格式不正確");
  if (!Array.isArray(data.helpers)) throw new Error("找不到外傭資料");
  return migrate(data);
}

export function currentHelper(state) {
  return state.helpers.find((h) => h.id === state.currentHelperId) || null;
}

export function shKey(helperId, date) {
  return `${helperId}:${date}`;
}

export function normalizeHelperForm(form) {
  const start = form.startDate || form.contractStart;
  const contractStart = form.contractStart || form.startDate;
  const contractEnd = form.contractEnd || defaultContractEnd(contractStart);
  return blankHelper({
    ...form,
    name: String(form.name || "").trim(),
    startDate: start,
    contractStart,
    contractEnd,
    wage: Number(form.wage) || 0,
    foodAllowance: Number(form.foodAllowance) || 0,
    foodProvided: Boolean(form.foodProvided),
    restDay:
      form.restDay === "arranged"
        ? "arranged"
        : form.restDay === "" || form.restDay == null
          ? 0
          : Number(form.restDay),
    phone: String(form.phone || "").trim(),
    notes: String(form.notes || "").trim(),
  });
}

export function newLeaveLog(partial) {
  return {
    id: uid("leave"),
    helperId: "",
    type: "annual",
    startDate: "",
    endDate: "",
    days: 1,
    note: "",
    createdAt: new Date().toISOString(),
    ...partial,
  };
}

export function newPayment(partial) {
  return {
    id: uid("pay"),
    helperId: "",
    month: "",
    wage: 0,
    food: 0,
    adjustments: 0,
    note: "",
    paidOn: "",
    createdAt: new Date().toISOString(),
    ...partial,
  };
}


export function arrangedRestList(state, helperId) {
  const list = state.arrangedRestDays?.[helperId];
  return Array.isArray(list) ? [...list].sort() : [];
}

export function toggleArrangedRestDay(state, helperId, iso) {
  const cur = new Set(arrangedRestList(state, helperId));
  if (cur.has(iso)) cur.delete(iso);
  else cur.add(iso);
  state.arrangedRestDays = { ...(state.arrangedRestDays || {}), [helperId]: [...cur].sort() };
  return arrangedRestList(state, helperId);
}

export function newWorkTask(partial = {}) {
  return {
    id: uid("task"),
    helperId: "",
    title: "",
    detail: "",
    schedule: "daily",
    weekdays: [],
    timeFrom: "",
    timeTo: "",
    onceDate: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  };
}

export function newWorkRule(partial = {}) {
  return {
    id: uid("rule"),
    helperId: "",
    title: "",
    body: "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...partial,
  };
}


export function normalizeItemName(name) {
  return String(name || "").trim().replace(/\s+/g, " ");
}

export function catalogKey(name) {
  return normalizeItemName(name).toLowerCase();
}

export function findCatalog(state, name) {
  const k = catalogKey(name);
  if (!k) return null;
  return (state.priceCatalog || []).find((c) => c.key === k) || null;
}

export function recordCatalogPrice(state, name, price, whenISO, place = "") {
  const k = catalogKey(name);
  const amount = Number(price);
  if (!k || !Number.isFinite(amount)) return null;
  const entry = { price: amount, date: whenISO, place: place || "" };
  const list = Array.isArray(state.priceCatalog) ? state.priceCatalog : [];
  let row = list.find((c) => c.key === k);
  if (!row) {
    row = { key: k, name: normalizeItemName(name), lastPrice: amount, lastPaidOn: whenISO, history: [entry] };
    list.push(row);
  } else {
    row.name = normalizeItemName(name);
    row.lastPrice = amount;
    row.lastPaidOn = whenISO;
    row.history = [...(row.history || []), entry].slice(-20);
  }
  state.priceCatalog = list;
  return row;
}

export function newShopList(partial = {}) {
  return {
    id: uid("shop"),
    helperId: "",
    title: "",
    place: "market",
    status: "open",
    note: "",
    createdAt: new Date().toISOString(),
    completedAt: "",
    ...partial,
  };
}

export function newShopItem(partial = {}) {
  return {
    id: uid("item"),
    listId: "",
    helperId: "",
    name: "",
    note: "",
    photo: "",
    qty: "",
    suggestedPrice: null,
    paidPrice: "",
    bought: false,
    createdAt: new Date().toISOString(),
    ...partial,
  };
}

export { uid };
