/** PIN-encrypted helper snapshots for sharing and same-phone unlock. */

const textEnc = new TextEncoder();
const textDec = new TextDecoder();

export const SHARE_PREFIX = "v";
export const INBOX_KEY = "fdh-helper-inbox-v1";
export const SESSION_KEY = "fdh-helper-session-v1";
export const ACK_KEY = "fdh-helper-acks-v1";
export const TASK_DONE_KEY = "fdh-helper-task-done-v1";
export const ROLE_KEY = "fdh-active-role-v1";

export function randomPin() {
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const n = (bytes[0] * 2 ** 24 + bytes[1] * 2 ** 16 + bytes[2] * 2 ** 8 + bytes[3]) % 1_000_000;
  return String(n).padStart(6, "0");
}

export function bytesToB64url(bytes) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let bin = "";
  const chunk = 0x8000;
  for (let i = 0; i < arr.length; i += chunk) {
    bin += String.fromCharCode(...arr.subarray(i, i + chunk));
  }
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function b64urlToBytes(s) {
  const pad = "=".repeat((4 - (s.length % 4)) % 4);
  const b64 = (s + pad).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function deriveKey(pin, salt) {
  const base = await crypto.subtle.importKey("raw", textEnc.encode(String(pin)), "PBKDF2", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Pack a versioned ciphertext: 1 byte version, 16 salt, 12 iv, remainder ct.
 */
export async function encryptShare(payload, pin) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pin, salt);
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, textEnc.encode(JSON.stringify(payload)))
  );
  const packed = new Uint8Array(1 + salt.length + iv.length + ct.length);
  packed[0] = 1;
  packed.set(salt, 1);
  packed.set(iv, 17);
  packed.set(ct, 29);
  return bytesToB64url(packed);
}

export async function decryptShare(packedB64, pin) {
  const packed = b64urlToBytes(String(packedB64).trim());
  if (packed.length < 30 || packed[0] !== 1) throw new Error("查看方式格式不正確");
  const salt = packed.subarray(1, 17);
  const iv = packed.subarray(17, 29);
  const ct = packed.subarray(29);
  const key = await deriveKey(pin, salt);
  try {
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
    return JSON.parse(textDec.decode(pt));
  } catch {
    throw new Error("查看密碼不正確，或這份查看方式已失效");
  }
}

export function buildSharePayload({ helper, arrangedRestDays, leaveLogs, shStatuses, payments, workTasks, workRules, shopLists, shopItems, priceCatalog }) {
  const safeHelper = {
    id: helper.id,
    name: helper.name,
    nationality: helper.nationality,
    startDate: helper.startDate,
    contractStart: helper.contractStart,
    contractEnd: helper.contractEnd,
    wage: helper.wage,
    foodProvided: helper.foodProvided,
    foodAllowance: helper.foodAllowance,
    restDay: helper.restDay,
    phone: helper.phone || "",
    winterChoice: helper.winterChoice,
    grantGeneralHolidays: Boolean(helper.grantGeneralHolidays),
    visaExpiry: helper.visaExpiry || "",
    passportExpiry: helper.passportExpiry || "",
  };
  const hid = helper.id;
  const sh = {};
  Object.entries(shStatuses || {}).forEach(([key, val]) => {
    if (key.startsWith(`${hid}:`)) sh[key.slice(hid.length + 1)] = val;
  });
  return {
    v: 1,
    shareId: helper.shareIdPreview || undefined,
    generatedAt: new Date().toISOString(),
    helper: safeHelper,
    arrangedRestDays: (arrangedRestDays || []).slice(),
    leaveLogs: (leaveLogs || []).filter((l) => l.helperId === hid).map(({ helperId, ...rest }) => rest),
    shStatuses: sh,
    payments: (payments || []).filter((p) => p.helperId === hid).map(({ helperId, ...rest }) => rest),
    workTasks: (workTasks || []).filter((t) => t.helperId === hid).map(({ helperId, ...rest }) => rest),
    workRules: (workRules || []).filter((r) => r.helperId === hid).map(({ helperId, ...rest }) => rest),
    shopLists: (shopLists || []).filter((l) => l.helperId === hid).map(({ helperId, ...rest }) => rest),
    shopItems: (shopItems || []).filter((i) => i.helperId === hid).map(({ helperId, ...rest }) => rest),
    priceCatalog: (priceCatalog || []).map((c) => ({
      key: c.key,
      name: c.name,
      lastPrice: c.lastPrice,
      lastPaidOn: c.lastPaidOn,
    })),
  };
}

export function shareUrl(packed) {
  const hash = `#/${SHARE_PREFIX}/${packed}`;
  if (location.protocol === "http:" || location.protocol === "https:") {
    return `${location.origin}${location.pathname}${hash}`;
  }
  return packed;
}

export function parseShareHash(hash = location.hash) {
  const raw = String(hash || "").replace(/^#\/?/, "");
  const parts = raw.split("/");
  if (parts[0] === SHARE_PREFIX && parts[1]) return parts.slice(1).join("/");
  return "";
}

export function loadJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadInbox() {
  const raw = loadJson(INBOX_KEY, []);
  return Array.isArray(raw) ? raw : [];
}

export function upsertInbox(entry) {
  const list = loadInbox().filter((x) => x.shareId !== entry.shareId && x.helperId !== entry.helperId);
  list.unshift(entry);
  saveJson(INBOX_KEY, list);
  return list;
}

export function removeInbox(helperId) {
  saveJson(INBOX_KEY, loadInbox().filter((x) => x.helperId !== helperId));
}

export function loadSession() {
  return loadJson(SESSION_KEY, null);
}

export function saveSession(session) {
  if (!session) localStorage.removeItem(SESSION_KEY);
  else saveJson(SESSION_KEY, session);
}

export function isAcked(shareId) {
  const map = loadJson(ACK_KEY, {});
  return Boolean(map[shareId]);
}

export function setAcked(shareId, on) {
  const map = loadJson(ACK_KEY, {});
  if (on) map[shareId] = new Date().toISOString();
  else delete map[shareId];
  saveJson(ACK_KEY, map);
}

export function taskDoneMap(shareId) {
  const all = loadJson(TASK_DONE_KEY, {});
  return all[shareId] && typeof all[shareId] === "object" ? all[shareId] : {};
}

export function setTaskDone(shareId, taskId, iso, done) {
  const all = loadJson(TASK_DONE_KEY, {});
  const one = { ...(all[shareId] || {}) };
  const days = { ...(one[taskId] || {}) };
  if (done) days[iso] = true;
  else delete days[iso];
  one[taskId] = days;
  all[shareId] = one;
  saveJson(TASK_DONE_KEY, all);
}

export function isTaskDone(shareId, taskId, iso) {
  return Boolean(taskDoneMap(shareId)[taskId]?.[iso]);
}

export function loadRole() {
  const r = localStorage.getItem(ROLE_KEY);
  return r === "employer" || r === "helper" ? r : null;
}

export function saveRole(role) {
  if (!role) localStorage.removeItem(ROLE_KEY);
  else localStorage.setItem(ROLE_KEY, role);
}

const RETURN_PREFIX = "r";

/** Resize and JPEG-compress a picked/captured image for local storage and share. */
export async function compressImageFile(file, { maxSize = 720, quality = 0.72 } = {}) {
  if (!file) throw new Error("未選擇相片");
  let bitmap = null;
  if (typeof createImageBitmap === "function") {
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      bitmap = null;
    }
  }
  if (!bitmap) {
    const url = URL.createObjectURL(file);
    try {
      bitmap = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("無法讀取相片"));
        img.src = url;
      });
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  const w = bitmap.width || 1;
  const h = bitmap.height || 1;
  const scale = Math.min(1, maxSize / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * scale));
  const ch = Math.max(1, Math.round(h * scale));
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(bitmap, 0, 0, cw, ch);
  if (bitmap.close) bitmap.close();
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  if (!dataUrl || dataUrl === "data:,") throw new Error("相片處理失敗");
  return dataUrl;
}

export function receiptPayload(shareId, lists, items) {
  return {
    kind: "shop-return",
    v: 1,
    shareId,
    returnedAt: new Date().toISOString(),
    lists: (lists || []).map((l) => ({ id: l.id, title: l.title, place: l.place, status: l.status })),
    items: (items || []).map((i) => ({
      id: i.id,
      listId: i.listId,
      name: i.name,
      bought: Boolean(i.bought),
      paidPrice: i.paidPrice,
    })),
  };
}

export { RETURN_PREFIX };
