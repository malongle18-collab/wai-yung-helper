import {
  ANNUAL_LEAVE_BY_YEAR,
  GENERAL_HOLIDAYS,
  REST_DAY_ARRANGED,
  STATUTORY_HOLIDAYS,
} from "./data.js";
import {
  addDays,
  addMonths,
  addYears,
  daysBetween,
  daysInMonth,
  parseISO,
  toISO,
  weekday,
} from "./dates.js";

/** Standard ID 407 term is two years. Default end date is the day before the 2-year anniversary. */
export function defaultContractEnd(startISO) {
  if (!startISO) return "";
  return toISO(addDays(addYears(startISO, 2), -1));
}

/**
 * Date the helper completes 3 calendar months of service.
 * From this date onward, a statutory holiday generally carries holiday pay
 * ("緊接法定假日之前已按連續性合約受僱滿3個月").
 * Borderline cases (an SH falling on this exact date) should be confirmed with LD.
 */
export function paidStatutoryStart(startISO) {
  if (!startISO) return "";
  return toISO(addMonths(startISO, 3));
}

/** Paid annual leave vests after 12 months with the same employer. */
export function annualLeaveVestDate(startISO) {
  if (!startISO) return "";
  return toISO(addMonths(startISO, 12));
}

export function yearsOfServiceCompleted(startISO, onISO) {
  if (!startISO || !onISO) return 0;
  let years = 0;
  let cursor = startISO;
  while (true) {
    const next = toISO(addYears(cursor, 1));
    if (next > onISO) break;
    years += 1;
    cursor = next;
    if (years > 60) break;
  }
  return years;
}

export function annualLeaveDaysForYear(serviceYearNumber) {
  if (serviceYearNumber < 1) return 0;
  if (serviceYearNumber >= 9) return ANNUAL_LEAVE_BY_YEAR[9];
  return ANNUAL_LEAVE_BY_YEAR[serviceYearNumber] || 0;
}

/** Entitlement that vested on a given date (the leave earned by completing that service year). */
export function vestedAnnualLeaveAsOf(startISO, onISO) {
  const years = yearsOfServiceCompleted(startISO, onISO);
  let total = 0;
  const grants = [];
  for (let y = 1; y <= years; y++) {
    const days = annualLeaveDaysForYear(y);
    const vest = toISO(addYears(startISO, y));
    grants.push({ serviceYear: y, days, vestDate: vest });
    total += days;
  }
  return { years, total, grants };
}

export function currentLeaveYear(startISO, onISO) {
  const years = yearsOfServiceCompleted(startISO, onISO);
  const yearStart = toISO(addYears(startISO, years));
  const yearEnd = toISO(addDays(addYears(startISO, years + 1), -1));
  return { index: years + 1, start: yearStart, end: yearEnd };
}

export function resolveStatutoryHoliday(raw, winterChoice = "christmas") {
  if (raw.choice === "winter-or-christmas") {
    const useWinter = winterChoice === "winter";
    return {
      date: useWinter ? raw.winter : raw.christmas,
      nameZh: useWinter ? "冬節" : "聖誕節",
      nameEn: useWinter ? "Chinese Winter Solstice Festival" : "Christmas Day",
      choice: raw.choice,
      winter: raw.winter,
      christmas: raw.christmas,
      noteZh: "冬節或聖誕節由僱主選擇其中一天作為法定假日",
    };
  }
  return { ...raw };
}

export function statutoryHolidaysForYear(year, winterChoice = "christmas") {
  const list = STATUTORY_HOLIDAYS[year] || [];
  return list.map((item) => resolveStatutoryHoliday(item, winterChoice));
}

export function generalHolidaysForYear(year) {
  return (GENERAL_HOLIDAYS[year] || []).map((item) => ({ ...item, kind: "general" }));
}

/** General holidays that are not also a chosen statutory holiday date. */
export function extraGeneralHolidays(year, winterChoice = "christmas") {
  const sh = new Set(statutoryHolidaysForYear(year, winterChoice).map((h) => h.date));
  return generalHolidaysForYear(year).filter((h) => !sh.has(h.date));
}

export function allObservedDatesForYear(year, winterChoice, includeGeneral) {
  const sh = statutoryHolidaysForYear(year, winterChoice).map((h) => ({
    ...h,
    kind: "statutory",
  }));
  if (!includeGeneral) return sh;
  const extras = extraGeneralHolidays(year, winterChoice).map((h) => ({
    ...h,
    kind: "general",
  }));
  return [...sh, ...extras].sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * If a statutory holiday falls on the helper's weekly rest day, an alternative
 * holiday should be granted on the following day that is not an SH, alternative
 * holiday, substituted holiday, or rest day.
 */
export function suggestedAlternativeDate(holidayISO, restDay, yearHolidays) {
  if (restDay == null || restDay === "" || weekday(holidayISO) !== Number(restDay)) {
    return null;
  }
  const blocked = new Set(yearHolidays.map((h) => h.date));
  let cursor = addDays(holidayISO, 1);
  for (let i = 0; i < 14; i++) {
    const iso = toISO(cursor);
    if (weekday(iso) !== Number(restDay) && !blocked.has(iso)) return iso;
    cursor = addDays(cursor, 1);
  }
  return toISO(addDays(holidayISO, 1));
}

export function inEmployment(helper, iso) {
  const start = helper.startDate || helper.contractStart;
  const end = helper.contractEnd;
  if (!start) return false;
  if (iso < start) return false;
  if (end && iso > end) return false;
  return true;
}

export function holidayPayEligible(helper, holidayISO) {
  const start = helper.startDate || helper.contractStart;
  const paidFrom = paidStatutoryStart(start);
  return Boolean(paidFrom && holidayISO >= paidFrom);
}

export function contractStatus(helper, today) {
  const start = helper.contractStart || helper.startDate;
  const end = helper.contractEnd;
  if (!start || !end) {
    return { key: "unknown", label: "尚未填寫合約日期", daysLeft: null, progress: 0, total: 0 };
  }
  const total = Math.max(1, daysBetween(start, end));
  const elapsed = daysBetween(start, today);
  const daysLeft = daysBetween(today, end);
  const progress = Math.min(1, Math.max(0, elapsed / total));
  if (daysLeft < 0) {
    return { key: "expired", label: "合約已屆滿", daysLeft, progress: 1, total, start, end };
  }
  if (daysLeft <= 7) {
    return { key: "critical", label: "即將屆滿（7天內）", daysLeft, progress, total, start, end };
  }
  if (daysLeft <= 30) {
    return { key: "soon", label: "即將屆滿（30天內）", daysLeft, progress, total, start, end };
  }
  if (daysLeft <= 90) {
    return { key: "watch", label: "準備續約或結束", daysLeft, progress, total, start, end };
  }
  return { key: "ok", label: "合約進行中", daysLeft, progress, total, start, end };
}

export function proRataMonthly(amount, year, monthIndex, fromDay, toDay) {
  const dim = daysInMonth(year, monthIndex);
  const start = Math.max(1, fromDay);
  const end = Math.min(dim, toDay);
  const days = Math.max(0, end - start + 1);
  const pay = (Number(amount) || 0) * (days / dim);
  return { days, dim, pay };
}

/** Simplified daily rate for illustration only — official holiday pay uses 12-month average daily wages. */
export function simpleDailyRate(monthlyWage) {
  return (Number(monthlyWage) || 0) / 30;
}

export function upcomingRestDays(restDay, fromISO, count = 8) {
  if (restDay == null || restDay === "") return [];
  const rd = Number(restDay);
  const out = [];
  let cursor = parseISO(fromISO);
  for (let i = 0; i < 60 && out.length < count; i++) {
    if (cursor.getDay() === rd) out.push(toISO(cursor));
    cursor = addDays(cursor, 1);
  }
  return out;
}

export function officialYears() {
  return Object.keys(STATUTORY_HOLIDAYS)
    .map(Number)
    .sort((a, b) => a - b);
}


export function isArrangedRestPolicy(restDay) {
  return restDay === REST_DAY_ARRANGED || restDay === "arranged";
}

export function isRestDayOn(helper, iso, arrangedDates = []) {
  if (!helper || !iso) return false;
  if (isArrangedRestPolicy(helper.restDay)) {
    return arrangedDates.includes(iso);
  }
  if (helper.restDay == null || helper.restDay === "") return false;
  return weekday(iso) === Number(helper.restDay);
}

/**
 * Rolling 7-day windows (inclusive) inside [fromISO, toISO] that contain
 * no rest day. Employment Ordinance: at least one rest day of 24 hours
 * in every period of 7 days.
 */
export function restDayGaps(helper, arrangedDates, fromISO, toISO) {
  if (!helper || !fromISO || !toISO || fromISO > toISO) return [];
  const startBound = helper.startDate || helper.contractStart;
  const endBound = helper.contractEnd;
  const from = startBound && fromISO < startBound ? startBound : fromISO;
  let to = toISO;
  if (endBound && to > endBound) to = endBound;
  if (!from || from > to) return [];

  const rest = new Set();
  let cursor = parseISO(from);
  const last = parseISO(to);
  if (!cursor || !last) return [];
  while (cursor <= last) {
    const iso = toISO(cursor);
    if (isRestDayOn(helper, iso, arrangedDates)) rest.add(iso);
    cursor = addDays(cursor, 1);
  }

  const gaps = [];
  let windowStart = parseISO(from);
  const lastStart = addDays(to, -6);
  while (windowStart <= lastStart) {
    const startISO = toISO(windowStart);
    const endISO = toISO(addDays(windowStart, 6));
    let hasRest = false;
    for (let i = 0; i < 7; i++) {
      if (rest.has(toISO(addDays(windowStart, i)))) {
        hasRest = true;
        break;
      }
    }
    if (!hasRest) {
      const prev = gaps[gaps.length - 1];
      if (prev && daysBetween(prev.start, startISO) === 1) {
        prev.end = endISO;
        prev.windows += 1;
      } else {
        gaps.push({ start: startISO, end: endISO, windows: 1 });
      }
    }
    windowStart = addDays(windowStart, 1);
  }
  return gaps;
}

export function upcomingArrangedRestDays(arrangedDates, fromISO, count = 8) {
  if (!Array.isArray(arrangedDates)) return [];
  return arrangedDates.filter((d) => d >= fromISO).sort().slice(0, count);
}

export function upcomingRestDaysFor(helper, arrangedDates, fromISO, count = 8) {
  if (isArrangedRestPolicy(helper?.restDay)) {
    return upcomingArrangedRestDays(arrangedDates, fromISO, count);
  }
  return upcomingRestDays(helper?.restDay, fromISO, count);
}

/**
 * Alternative holiday suggestion when a statutory holiday falls on a rest day.
 * Accepts a fixed weekday or the "arranged" policy plus concrete dates.
 */
export function suggestedAlternativeDateFor(holidayISO, helper, yearHolidays, arrangedDates = []) {
  if (!isRestDayOn(helper, holidayISO, arrangedDates)) return null;
  const blocked = new Set((yearHolidays || []).map((h) => h.date));
  let cursor = addDays(holidayISO, 1);
  for (let i = 0; i < 14; i++) {
    const iso = toISO(cursor);
    if (!isRestDayOn(helper, iso, arrangedDates) && !blocked.has(iso)) return iso;
    cursor = addDays(cursor, 1);
  }
  return toISO(addDays(holidayISO, 1));
}

/** Whether a recurring work task applies on a given calendar date. */
export function taskAppliesOn(task, iso) {
  if (!task || !iso) return false;
  const dow = weekday(iso);
  if (task.schedule === "daily") return true;
  if (task.schedule === "weekdays") return dow >= 1 && dow <= 5;
  if (task.schedule === "weekly") {
    const days = Array.isArray(task.weekdays) ? task.weekdays.map(Number) : [];
    return days.includes(dow);
  }
  if (task.schedule === "once") return task.onceDate === iso;
  return false;
}
