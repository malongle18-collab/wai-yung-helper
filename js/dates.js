/** Local-date helpers. All ISO strings are calendar dates in the user's local zone (Hong Kong). */

export function parseISO(iso) {
  if (!iso) return null;
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
}

export function toISO(date) {
  if (!date || Number.isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayISO(now = new Date()) {
  return toISO(now);
}

export function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function addDays(isoOrDate, days) {
  const d =
    typeof isoOrDate === "string" ? parseISO(isoOrDate) : new Date(isoOrDate.getTime());
  d.setDate(d.getDate() + days);
  return d;
}

export function addMonths(isoOrDate, months) {
  const d =
    typeof isoOrDate === "string" ? parseISO(isoOrDate) : new Date(isoOrDate.getTime());
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + months);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return d;
}

export function addYears(isoOrDate, years) {
  return addMonths(isoOrDate, years * 12);
}

export function daysBetween(a, b) {
  const da = startOfDay(typeof a === "string" ? parseISO(a) : a);
  const db = startOfDay(typeof b === "string" ? parseISO(b) : b);
  return Math.round((db - da) / 86400000);
}

export function daysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

export function weekday(isoOrDate) {
  const d = typeof isoOrDate === "string" ? parseISO(isoOrDate) : isoOrDate;
  return d.getDay();
}

export function formatZh(isoOrDate, opts = {}) {
  const d = typeof isoOrDate === "string" ? parseISO(isoOrDate) : isoOrDate;
  if (!d) return "—";
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
  if (opts.weekday) return `${y}年${m}月${day}日（星期${weekdays[d.getDay()]}）`;
  if (opts.medium) return `${y}年${m}月${day}日　星期${weekdays[d.getDay()]}`;
  if (opts.shortWeek) return `${m}月${day}日（${weekdays[d.getDay()]}）`;
  if (opts.short) return `${m}月${day}日`;
  return `${y}年${m}月${day}日`;
}

export function formatMoney(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "—";
  return `$${v.toLocaleString("en-HK", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function clampDateISO(iso) {
  const d = parseISO(iso);
  return d ? toISO(d) : "";
}

export function monthKey(isoOrDate) {
  const d = typeof isoOrDate === "string" ? parseISO(isoOrDate) : isoOrDate;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function compareISO(a, b) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

export function isWithin(iso, start, end) {
  if (!iso) return false;
  if (start && iso < start) return false;
  if (end && iso > end) return false;
  return true;
}
