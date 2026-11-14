import { addDays, daysBetween, toISO, todayISO } from "./dates.js";
import { annualLeaveVestDate, paidStatutoryStart, restDayGaps, isArrangedRestPolicy } from "./rules.js";

function item(partial) {
  return {
    id: "",
    helperId: "",
    helperName: "",
    type: "",
    title: "",
    body: "",
    date: "",
    urgency: "info",
    ...partial,
  };
}

function urgencyForDays(days) {
  if (days < 0) return "expired";
  if (days <= 7) return "critical";
  if (days <= 30) return "soon";
  if (days <= 90) return "watch";
  return "info";
}

/**
 * Build in-app reminders for a helper. Active window:
 * upcoming items appear 90 days ahead (contract / document expiry),
 * milestone items appear from 14 days before through 30 days after.
 */
export function buildReminders(helper, today, opts = {}) {
  if (!helper) return [];
  const name = helper.name || "外傭";
  const start = helper.startDate || helper.contractStart;
  const end = helper.contractEnd;
  const out = [];

  if (end) {
    const days = daysBetween(today, end);
    const marks = [90, 30, 7];
    for (const mark of marks) {
      if (days <= mark && days >= 0) {
        out.push(
          item({
            id: `${helper.id}:contract-${mark}`,
            helperId: helper.id,
            helperName: name,
            type: "contract",
            title: `合約尚餘 ${days} 天屆滿`,
            body: `${name} 的標準合約於 ${end.replace(/-/g, "／")} 屆滿。入境處一般建議在屆滿前約 8 星期提交續約申請。屆滿後須安排返回原居地旅費，並清付工資及應付的假期薪酬。`,
            date: end,
            urgency: urgencyForDays(days),
            mark,
          })
        );
        break;
      }
    }
    if (days < 0 && days >= -30) {
      out.push(
        item({
          id: `${helper.id}:contract-expired`,
          helperId: helper.id,
          helperName: name,
          type: "contract",
          title: "合約已經屆滿",
          body: `${name} 的合約已於 ${end.replace(/-/g, "／")} 屆滿。請確認已通知入境處、清付薪金及安排返回原居地旅費。`,
          date: end,
          urgency: "expired",
        })
      );
    }
  }

  if (start) {
    const paidFrom = paidStatutoryStart(start);
    const daysToPaid = daysBetween(today, paidFrom);
    if (daysToPaid <= 14 && daysToPaid >= -30) {
      out.push(
        item({
          id: `${helper.id}:sh-paid`,
          helperId: helper.id,
          helperName: name,
          type: "statutory-pay",
          title:
            daysToPaid > 0
              ? `${daysToPaid} 天後開始享有有薪法定假日`
              : daysToPaid === 0
                ? "今天起法定假日一般可享假日薪酬"
                : "已開始享有有薪法定假日",
          body: `按勞工處說明，外傭不論年資均可放法定假日；但須在緊接該法定假日之前，已按連續性合約受僱滿 3 個月，才享有假日薪酬。以 ${start.replace(/-/g, "／")} 入職計算，滿 3 個月之日為 ${paidFrom.replace(/-/g, "／")}。此前的法定假日仍須放假，只是一般尚未享有假日薪酬。`,
          date: paidFrom,
          urgency: daysToPaid <= 0 ? "watch" : "info",
        })
      );
    }

    const vest = annualLeaveVestDate(start);
    const daysToVest = daysBetween(today, vest);
    if (daysToVest <= 14 && daysToVest >= -30) {
      out.push(
        item({
          id: `${helper.id}:annual-vest`,
          helperId: helper.id,
          helperName: name,
          type: "annual",
          title:
            daysToVest > 0
              ? `${daysToVest} 天後有薪年假開始累算`
              : daysToVest === 0
                ? "今天起可享第一年有薪年假（7天）"
                : "有薪年假已經開始累算",
          body: `${name} 為同一僱主工作滿 12 個月（${vest.replace(/-/g, "／")}）後，可享有薪年假。第 1 及第 2 年各 7 天，其後按年增加 1 天，最多 14 天。年假須在其後 12 個月內放取，日期應雙方商議，並至少提前 14 天書面通知。`,
          date: vest,
          urgency: daysToVest <= 0 ? "watch" : "info",
        })
      );
    }
  }

  const docs = [
    { key: "visaExpiry", title: "簽證／逗留期限", noun: "簽證或逗留期限" },
    { key: "passportExpiry", title: "護照到期", noun: "護照" },
  ];
  for (const doc of docs) {
    const date = helper[doc.key];
    if (!date) continue;
    const days = daysBetween(today, date);
    if (days <= 90 && days >= -14) {
      out.push(
        item({
          id: `${helper.id}:${doc.key}`,
          helperId: helper.id,
          helperName: name,
          type: "document",
          title:
            days < 0
              ? `${doc.title}已過期`
              : days === 0
                ? `${doc.title}就在今天`
                : `${doc.title}尚餘 ${days} 天`,
          body: `${name} 的${doc.noun}記錄為 ${date.replace(/-/g, "／")}。此欄只供你自己備忘，證件應由外傭本人保管。請向外傭本人及入境處確認實際到期日。`,
          date,
          urgency: urgencyForDays(days),
        })
      );
    }
  }

  if (isArrangedRestPolicy(helper.restDay)) {
    const from = today;
    const to = toISO(addDays(today, 55));
    const arranged = Array.isArray(opts.arrangedRestDays) ? opts.arrangedRestDays : [];
    const gaps = restDayGaps(helper, arranged, from, to);
    if (gaps.length) {
      const g = gaps[0];
      out.push(
        item({
          id: `${helper.id}:rest-gap-${g.start}`,
          helperId: helper.id,
          helperName: name,
          type: "rest-gap",
          title: "有連續日子尚未安排休息日",
          body: `按《僱傭條例》，每7天須給予不少於1個連續24小時的休息日。由 ${g.start.replace(/-/g, "／")} 起的7天窗口尚未見到休息日。請在年曆上補上休息日，或對調日子。`,
          date: g.start,
          urgency: "watch",
        })
      );
    }
  }

  return out.sort((a, b) => {
    const order = { expired: 0, critical: 1, soon: 2, watch: 3, info: 4 };
    const u = (order[a.urgency] ?? 9) - (order[b.urgency] ?? 9);
    if (u !== 0) return u;
    return a.date.localeCompare(b.date);
  });
}

export function isReminderVisible(reminder, reminderState, today) {
  const st = reminderState[reminder.id];
  if (!st) return true;
  if (st.done) return false;
  if (st.snoozeUntil && st.snoozeUntil > today) return false;
  return true;
}

export function snoozeUntil(today, days) {
  return toISO(addDays(today, days));
}

export function reminderBadgeCount(helpers, reminderState, today, arrangedMap = {}) {
  return helpers
    .flatMap((h) => buildReminders(h, today, { arrangedRestDays: arrangedMap[h.id] || [] }))
    .filter((r) => isReminderVisible(r, reminderState, today)).length;
}
