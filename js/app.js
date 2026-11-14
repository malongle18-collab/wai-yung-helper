import {
  ANNUAL_LEAVE_BY_YEAR,
  APP_NAME,
  CURRENT_MAW,
  GUIDE_SECTIONS,
  HELPER_GUIDE_SECTIONS,
  MAW_HISTORY,
  NATIONALITIES,
  OFFICIAL_LINKS,
  WEEKDAYS,
  REST_DAY_ARRANGED,
  REST_DAY_OPTIONS,
  TASK_SCHEDULES,
  LEAVE_TYPES,
  SH_STATUSES,
  SHOP_PLACES,
} from "./data.js";
import {
  addDays,
  daysBetween,
  daysInMonth,
  formatMoney,
  formatZh,
  monthKey,
  parseISO,
  toISO,
  todayISO,
  weekday,
} from "./dates.js";
import { escapeHtml, icon } from "./icons.js";
import {
  buildReminders,
  isReminderVisible,
  reminderBadgeCount,
  snoozeUntil,
} from "./reminders.js";
import {
  allObservedDatesForYear,
  annualLeaveDaysForYear,
  annualLeaveVestDate,
  contractStatus,
  currentLeaveYear,
  defaultContractEnd,
  extraGeneralHolidays,
  holidayPayEligible,
  inEmployment,
  isArrangedRestPolicy,
  isRestDayOn,
  officialYears,
  paidStatutoryStart,
  proRataMonthly,
  restDayGaps,
  simpleDailyRate,
  statutoryHolidaysForYear,
  suggestedAlternativeDateFor,
  upcomingRestDaysFor,
  vestedAnnualLeaveAsOf,
  taskAppliesOn,
} from "./rules.js";
import {
  arrangedRestList,
  currentHelper,
  demoHelper,
  emptyState,
  exportBackup,
  findCatalog,
  importBackup,
  loadState,
  normalizeHelperForm,
  newLeaveLog,
  newPayment,
  newShopItem,
  newShopList,
  newWorkRule,
  newWorkTask,
  recordCatalogPrice,
  saveState,
  shKey,
  toggleArrangedRestDay,
  uid,
} from "./storage.js";
import {
  ACK_KEY,
  buildSharePayload,
  compressImageFile,
  decryptShare,
  encryptShare,
  isAcked,
  isTaskDone,
  loadInbox,
  loadRole,
  loadSession,
  parseShareHash,
  randomPin,
  receiptPayload,
  removeInbox,
  saveRole,
  saveSession,
  setAcked,
  setTaskDone,
  shareUrl,
  upsertInbox,
} from "./share.js";

const YEARS = officialYears();
const EMPLOYER_TABS = [
  { id: "home", label: "首頁", icon: "home" },
  { id: "leave", label: "假期", icon: "leaf" },
  { id: "tasks", label: "工作安排", icon: "checklist" },
  { id: "rules", label: "工作守則", icon: "rule" },
  { id: "more", label: "更多", icon: "more" },
];
const HELPER_TABS = [
  { id: "h", label: "我的", icon: "home" },
  { id: "h-leave", label: "假期", icon: "leaf" },
  { id: "h-tasks", label: "工作安排", icon: "checklist" },
  { id: "h-rules", label: "工作守則", icon: "rule" },
  { id: "h-more", label: "更多", icon: "more" },
];

let state = loadState();
let role = loadRole();
let helperSession = loadSession();
const ui = {
  tab: "home",
  leavePane: "rest",
  year: Math.min(Math.max(new Date().getFullYear(), YEARS[0]), YEARS[YEARS.length - 1]),
  month: new Date().getMonth(),
  editingId: null,
  toast: "",
  toastTimer: 0,
  sheet: null,
  shopListId: null,
  pendingShare: "",
  shareReveal: null,
  pinError: "",
  calMode: "rest",
};

function today() {
  return todayISO();
}

function save() {
  saveState(state);
}

function helper() {
  return currentHelper(state);
}

function arrangedFor(h) {
  return h ? arrangedRestList(state, h.id) : [];
}

function arrangedMap() {
  const map = {};
  for (const h of state.helpers) map[h.id] = arrangedRestList(state, h.id);
  return map;
}

function toast(msg) {
  ui.toast = msg;
  render();
  clearTimeout(ui.toastTimer);
  ui.toastTimer = setTimeout(() => {
    ui.toast = "";
    render();
  }, 2800);
}

function isStandalone() {
  return (
    window.navigator.standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  );
}

function setRole(next) {
  role = next;
  saveRole(next);
}

function setTab(tab) {
  ui.tab = tab;
  ui.sheet = null;
  if (!String(tab).startsWith("shop")) ui.shopListId = String(tab).includes("shop-detail") ? ui.shopListId : ui.shopListId;
  if ((tab === "shop-detail" || tab === "h-shop-detail") && ui.shopListId) {
    location.hash = `#/${tab}/${ui.shopListId}`;
  } else {
    location.hash = `#/${tab}`;
  }
  document.querySelector(".main")?.scrollTo(0, 0);
  render();
}

const EMPLOYER_ROUTES = new Set([
  "home",
  "leave",
  "pay",
  "remind",
  "tasks",
  "rules",
  "shop",
  "shop-detail",
  "share",
  "more",
  "guide",
  "backup",
  "onboard",
  "helper-new",
  "helper-edit",
]);
const HELPER_ROUTES = new Set([
  "h",
  "h-leave",
  "h-tasks",
  "h-rules",
  "h-shop",
  "h-shop-detail",
  "h-pay",
  "h-remind",
  "h-rights",
  "h-more",
  "h-enter",
]);

function parseHash() {
  const raw = (location.hash || "").replace(/^#\/?/, "");
  const incoming = parseShareHash(location.hash);
  if (incoming) {
    ui.pendingShare = incoming;
    role = "helper";
    ui.tab = "h-enter";
    return;
  }
  const [tab, extra] = raw.split("/");
  if (!tab) {
    if (!role) ui.tab = "role";
    else if (role === "helper") ui.tab = helperSession ? "h" : "h-enter";
    else ui.tab = state.helpers.length ? "home" : "onboard";
    return;
  }
  if (tab === "role") {
    ui.tab = "role";
    return;
  }
  if (HELPER_ROUTES.has(tab)) {
    ui.tab = tab;
    if (tab === "h-shop-detail" && extra) ui.shopListId = extra;
    return;
  }
  if (EMPLOYER_ROUTES.has(tab)) {
    ui.tab = tab;
    if (tab === "shop-detail" && extra) ui.shopListId = extra;
    return;
  }
  ui.tab = role === "helper" ? "h" : "home";
}

function nationalityLabel(id) {
  return NATIONALITIES.find((n) => n.id === id)?.zh || "—";
}

function weekdayLabel(id) {
  if (isArrangedRestPolicy(id)) return "由僱主安排";
  return WEEKDAYS.find((w) => w.id === Number(id))?.zh || "—";
}

function placeLabel(id) {
  return SHOP_PLACES.find((p) => p.id === id)?.zh || "購物";
}

function badgeCount() {
  return reminderBadgeCount(state.helpers, state.reminderState, today(), arrangedMap());
}

function leaveLogsFor(h, type) {
  return state.leaveLogs.filter((l) => l.helperId === h.id && (!type || l.type === type));
}

function leaveDays(logs) {
  return logs.reduce((s, l) => s + (Number(l.days) || 0), 0);
}

function annualBalance(h, on = today()) {
  const vested = vestedAnnualLeaveAsOf(h.startDate || h.contractStart, on);
  const taken = leaveDays(leaveLogsFor(h, "annual").filter((l) => l.startDate && l.startDate <= on));
  return { ...vested, taken, remaining: Math.max(0, vested.total - taken) };
}

function holidayList(h, year) {
  const winter = h?.winterChoice || "christmas";
  const include = Boolean(h?.grantGeneralHolidays);
  return allObservedDatesForYear(year, winter, include).filter((d) => !h || inEmployment(h, d.date));
}

function shStatus(h, date) {
  return state.shStatuses[shKey(h.id, date)] || { status: "pending", lieuDate: "", note: "" };
}

function setShStatus(h, date, patch) {
  const key = shKey(h.id, date);
  state.shStatuses[key] = { ...shStatus(h, date), ...patch };
  save();
  render();
}

function urgencyWord(u) {
  return { expired: "已過期", critical: "7天內", soon: "30天內", watch: "請留意", info: "備忘" }[u] || "備忘";
}

function tasksFor(h) {
  return state.workTasks.filter((t) => t.helperId === h.id);
}

function rulesFor(h) {
  return state.workRules.filter((r) => r.helperId === h.id);
}

function listsFor(h) {
  return state.shopLists.filter((l) => l.helperId === h.id);
}

function itemsForList(listId) {
  return state.shopItems.filter((i) => i.listId === listId);
}

function scheduleLabel(task) {
  const base = TASK_SCHEDULES.find((s) => s.id === task.schedule)?.zh || "";
  if (task.schedule === "weekly") {
    const days = (task.weekdays || [])
      .map((d) => WEEKDAYS.find((w) => w.id === Number(d))?.shortZh)
      .filter(Boolean);
    return days.length ? `每週星期${days.join("、")}` : base;
  }
  if (task.schedule === "once" && task.onceDate) return `${base}：${formatZh(task.onceDate, { short: true })}`;
  return base;
}

function timeLabel(task) {
  if (task.timeFrom && task.timeTo) return `${task.timeFrom}–${task.timeTo}`;
  if (task.timeFrom) return task.timeFrom;
  return "";
}

/* ---------- layout ---------- */

function header(titleSub) {
  const h = role === "helper" ? helperSession?.payload?.helper : helper();
  const count = role === "employer" ? badgeCount() : helperReminderList().filter((r) => isReminderVisible(r, {}, today())).length;
  const sub = titleSub || (h ? escapeHtml(h.name || "") : role === "helper" ? "外傭版面" : "僱主版面");
  const home = role === "helper" ? "h" : "home";
  const remind = role === "helper" ? "h-remind" : "remind";
  return `
    <header class="app-header">
      <a class="brand" href="#/${home}">
        <div class="brand-mark" aria-hidden="true">傭</div>
        <div class="brand-text">
          <strong>${APP_NAME}</strong>
          <span>${sub}</span>
        </div>
      </a>
      <div class="header-actions">
        <button class="icon-btn" type="button" data-go="${remind}" aria-label="提醒${count ? `，${count}則未處理` : ""}">
          <span class="icon-wrap">${icon("bell")}${count ? `<span class="badge">${count > 9 ? "9+" : count}</span>` : ""}</span>
        </button>
      </div>
    </header>
  `;
}

function tabbar() {
  const hidden = ["role", "onboard", "helper-new", "helper-edit", "h-enter"];
  if (hidden.includes(ui.tab)) return "";
  const tabs = role === "helper" ? HELPER_TABS : EMPLOYER_TABS;
  const count = role === "employer" ? badgeCount() : 0;
  const moreIds = role === "helper"
    ? ["h-more", "h-pay", "h-remind", "h-rights", "h-shop", "h-shop-detail"]
    : ["more", "guide", "backup", "pay", "remind", "share", "shop", "shop-detail"];
  return `
    <nav class="tabbar" aria-label="主要分頁">
      ${tabs
        .map((t) => {
          const current =
            ui.tab === t.id ||
            (t.id === "more" && moreIds.includes(ui.tab) && role === "employer") ||
            (t.id === "h-more" && moreIds.includes(ui.tab) && role === "helper") ||
            (t.id === "leave" && ui.tab === "leave") ||
            (t.id === "h" && ui.tab === "h");
          const badge = t.id === "more" && count ? `<span class="badge">${count > 9 ? "9+" : count}</span>` : "";
          return `<button class="tab-btn" type="button" data-go="${t.id}" aria-current="${current ? "page" : "false"}">
            <span class="icon-wrap">${icon(t.icon, { size: 22 })}${badge}</span>
            ${t.label}
          </button>`;
        })
        .join("")}
    </nav>
  `;
}

function helperSwitcher() {
  if (!state.helpers.length) return "";
  return `
    <div class="helper-switcher" role="tablist" aria-label="選擇外傭">
      ${state.helpers
        .map(
          (h) => `
        <button class="helper-pill" type="button" data-switch="${escapeHtml(h.id)}" aria-current="${h.id === state.currentHelperId}">
          ${escapeHtml(h.name || "未命名")}
        </button>`
        )
        .join("")}
      <button class="helper-pill" type="button" data-go="helper-new" aria-label="新增外傭">${icon("plus", { size: 18 })}</button>
    </div>
  `;
}

function emptyHelperPrompt(title) {
  return `
    <div class="empty">
      ${icon("person", { size: 36 })}
      <p class="screen-title" style="font-size:1.5rem">${title}</p>
      <p class="lede">先新增一位外傭的資料，便可計算合約、假期、薪金，並把工作安排、工作守則和買餸清單分享給對方查看。所有資料只存在你的裝置上。</p>
      <div class="btn-row">
        <button class="btn" type="button" data-go="helper-new">新增外傭</button>
        <button class="btn secondary" type="button" data-action="load-demo">載入示範資料</button>
      </div>
    </div>
  `;
}

function disclaimer() {
  return `
    <p class="disclaimer">
      本應用是規劃工具，不是法律意見，亦不能取代勞工處或入境處的指引。假期、薪金和合約安排請以標準僱傭合約（ID 407）及當時法例為準，並向
      <a href="${OFFICIAL_LINKS.fdhPortal}" target="_blank" rel="noopener">勞工處外傭專頁</a>
      或入境處確認。勞工處熱線 2717 1771（1823）。
    </p>
  `;
}

function installTip() {
  if (isStandalone() || location.protocol === "file:") {
    return location.protocol === "file:"
      ? `<div class="note-box">此單一檔案可在 Safari 離線使用。點底部分享按鈕，選擇「加到主畫面」，之後就不必再從檔案開啟。</div>`
      : "";
  }
  return `<div class="note-box">用 Safari 開啟本頁，點底部分享按鈕，選擇「加到主畫面」，即可像一般 App 使用，亦不必再儲存檔案。</div>`;
}

/* ---------- role / onboard ---------- */

function viewRole() {
  return `
    <div class="role-screen">
      <h1 class="screen-title">${APP_NAME}</h1>
      <p class="lede">香港外傭與僱主共用的本機規劃工具。兩邊版面分開：僱主記入和安排，外傭用僱主提供的查看方式，只看自己的資料。</p>
      <div class="role-choice">
        <button class="role-card employer" type="button" data-action="choose-role" data-role="employer">
          <span class="who">我是僱主</span>
          <p>管理合約、假期、工作安排、工作守則和買餸清單，並產生外傭查看方式。</p>
        </button>
        <button class="role-card" type="button" data-action="choose-role" data-role="helper">
          <span class="who">我是外傭</span>
          <p>用僱主提供的連結或 6 位查看密碼，查看自己的合約、假期、工作安排、工作守則和買餸清單。</p>
        </button>
      </div>
      ${installTip()}
      ${disclaimer()}
    </div>
  `;
}

function viewOnboard() {
  return `
    <div class="onboard">
      <h1 class="screen-title">先加入外傭資料</h1>
      <p class="lede">新增之後，你可以安排休息日和假期，並把查看方式交給對方，讓外傭在自己的版面看到有關資料。</p>
      <div class="note-box">
        外傭享有的是《僱傭條例》下的<strong>法定假日</strong>，並非自動享有所有銀行／政府的公眾假期。不論年資均可放法定假日；受僱滿 3 個月後，該等法定假日一般才享有假日薪酬。
      </div>
      <div class="btn-row">
        <button class="btn" type="button" data-go="helper-new">開始新增外傭</button>
        <button class="btn secondary" type="button" data-action="load-demo">載入示範資料</button>
      </div>
      <button class="linkish" type="button" data-action="choose-role" data-role="">返回選擇身分</button>
      ${disclaimer()}
    </div>
  `;
}

function entryCards(h, prefix) {
  const taskN = (h ? (prefix === "h-" ? (helperSession.payload.workTasks || []) : tasksFor(h)) : []).length;
  const ruleN = (h ? (prefix === "h-" ? (helperSession.payload.workRules || []) : rulesFor(h)) : []).length;
  const openLists = h
    ? (prefix === "h-" ? (helperSession.payload.shopLists || []) : listsFor(h)).filter((l) => l.status !== "done").length
    : 0;
  const shopN = openLists;
  return `
    <div class="entry-grid">
      <button class="entry" type="button" data-go="${prefix}tasks">
        <span class="mark">${icon("checklist")}</span>
        <span class="txt"><strong>工作安排</strong><span>${taskN ? `${taskN} 項日常或定期工作` : "尚未加入工作安排"}</span></span>
      </button>
      <button class="entry rules" type="button" data-go="${prefix}rules">
        <span class="mark">${icon("rule")}</span>
        <span class="txt"><strong>工作守則</strong><span>${ruleN ? `${ruleN} 項家務及處事守則` : "尚未加入工作守則"}</span></span>
      </button>
      <button class="entry shop" type="button" data-go="${prefix}shop">
        <span class="mark">${icon("basket")}</span>
        <span class="txt"><strong>買餸清單</strong><span>${shopN ? `${shopN} 份進行中的清單` : "街市或超市要買的物品"}</span></span>
      </button>
    </div>
  `;
}

/* ---------- employer home ---------- */

function viewHome() {
  const h = helper();
  if (!h) return emptyHelperPrompt("先加入外傭資料");
  const t = today();
  const cs = contractStatus(h, t);
  const start = h.contractStart || h.startDate;
  const paidFrom = paidStatutoryStart(h.startDate || h.contractStart);
  const vest = annualLeaveVestDate(h.startDate || h.contractStart);
  const reminders = buildReminders(h, t, { arrangedRestDays: arrangedFor(h) }).filter((r) =>
    isReminderVisible(r, state.reminderState, t)
  );
  const year = ui.year;
  const monthHolidays = holidayList(h, year).filter((d) => d.date.startsWith(monthKey(t)));
  const pay = monthPaySnapshot(h, t);
  const al = annualBalance(h, t);
  const daysWord = cs.daysLeft < 0 ? "已過" : "尚餘";
  const daysNum = Math.abs(cs.daysLeft ?? 0);
  const pillClass =
    cs.key === "ok" ? "" : cs.key === "watch" || cs.key === "soon" ? "warn" : cs.key === "expired" || cs.key === "critical" ? "danger" : "warn";
  const restText = isArrangedRestPolicy(h.restDay)
    ? "休息日由僱主安排"
    : `休息日：每週${weekdayLabel(h.restDay)}`;

  return `
    ${helperSwitcher()}
    ${installTip()}
    <h1 class="screen-title">${escapeHtml(h.name)}</h1>
    <p class="lede">${nationalityLabel(h.nationality)}　${restText}　月薪 ${formatMoney(h.wage)}</p>

    <section class="contract-rail">
      <div class="rail-status"><span class="status-pill ${pillClass}">${cs.label}</span></div>
      <div class="rail">
        <div><span>開始</span><strong>${start ? formatZh(start, { short: true }) : "—"}</strong></div>
        <div class="mid"><span>今天</span><strong>${formatZh(t, { short: true })}</strong></div>
        <div class="end"><span>屆滿</span><strong>${h.contractEnd ? formatZh(h.contractEnd, { short: true }) : "—"}</strong></div>
        <div class="rail-track" aria-hidden="true"><span style="width:${Math.round((cs.progress || 0) * 100)}%"></span></div>
      </div>
      <p class="rail-note">${cs.daysLeft == null ? "請先填寫合約日期。" : `${daysWord} <span class="num">${daysNum}</span> 日`}</p>
    </section>

    <div class="fact-list">
      <div class="fact">
        <div class="k">有薪法定假日起點</div>
        <div class="v">${paidFrom ? formatZh(paidFrom, { short: true }) : "—"}</div>
        <div class="tiny muted">${!paidFrom ? "" : t < paidFrom ? "此前仍須放假，一般尚未有假日薪酬" : "其後的法定假日一般享有假日薪酬"}</div>
      </div>
      <div class="fact">
        <div class="k">有薪年假</div>
        <div class="v">${t < vest ? "未屆滿12個月" : `${al.remaining}／${al.total} 天`}</div>
        <div class="tiny muted">${vest ? (t < vest ? `將於 ${formatZh(vest, { short: true })} 起享有` : "已開始累算，須於其後12個月內放取") : "—"}</div>
      </div>
    </div>

    <section class="section">
      <div class="section-head"><h2>要對外傭說明的事</h2></div>
      ${entryCards(h, "")}
    </section>

    <section class="section">
      <div class="section-head">
        <h2>事項提醒</h2>
        <button class="linkish" type="button" data-go="remind">全部</button>
      </div>
      ${
        reminders.length
          ? `<div class="card">${reminders
              .slice(0, 3)
              .map(
                (r) => `
            <button class="row" type="button" data-go="remind">
              <div class="grow">
                <div class="title">${escapeHtml(r.title)}</div>
                <div class="sub">${formatZh(r.date)}</div>
              </div>
              <span class="status-pill ${r.urgency}">${urgencyWord(r.urgency)}</span>
            </button>`
              )
              .join("")}</div>`
          : `<div class="card muted">暫時沒有未處理的提醒。</div>`
      }
    </section>

    <section class="section">
      <div class="section-head">
        <h2>本月假期</h2>
        <button class="linkish" type="button" data-go="leave">查看年曆</button>
      </div>
      <div class="card">
        ${
          monthHolidays.length
            ? monthHolidays.map((d) => holidayRow(h, d, true)).join("")
            : `<p class="muted" style="margin:0">這個月沒有在合約期內的法定假日${h.grantGeneralHolidays ? "或額外公眾假期" : ""}。</p>`
        }
      </div>
    </section>

    <section class="section">
      <div class="section-head">
        <h2>本月薪金估算</h2>
        <button class="linkish" type="button" data-go="pay">詳細計算</button>
      </div>
      <div class="card">
        <div class="pay-total">${formatMoney(pay.total)}</div>
        <p class="tiny muted" style="margin:0.4rem 0 0">${pay.label}</p>
      </div>
    </section>

    <div class="btn-row">
      <button class="btn" type="button" data-go="share">產生外傭查看方式</button>
      <button class="btn secondary" type="button" data-go="helper-edit">編輯資料</button>
    </div>
    ${disclaimer()}
  `;
}

function holidayRow(h, d, compact = false, arranged = null) {
  const dates = arranged || arrangedFor(h);
  const paid = d.kind === "statutory" && holidayPayEligible(h, d.date);
  const st = d.kind === "statutory" ? shStatus(h, d.date) : null;
  const restHit = isRestDayOn(h, d.date, dates);
  const alt = restHit
    ? suggestedAlternativeDateFor(
        d.date,
        h,
        statutoryHolidaysForYear(parseISO(d.date).getFullYear(), h.winterChoice),
        dates
      )
    : null;
  const statusLabel = SH_STATUSES.find((s) => s.id === st?.status)?.zh || "";
  const dt = parseISO(d.date);
  return `
    <div class="holiday-item" ${compact ? "" : `data-holiday="${d.date}" data-kind="${d.kind}"`}>
      <div class="date-block">
        <div class="m">${dt.getMonth() + 1}月</div>
        <div class="d">${dt.getDate()}</div>
      </div>
      <div>
        <div class="title" style="font-weight:650">${escapeHtml(d.nameZh)}</div>
        <div class="sub muted tiny">${formatZh(d.date, { shortWeek: true })}${restHit ? "　適逢休息日" : ""}</div>
        ${restHit && alt ? `<div class="tiny">休息日翌日補假建議：${formatZh(alt, { shortWeek: true })}</div>` : ""}
        <div class="chip-row" style="margin-top:0.35rem">
          <span class="tag ${d.kind === "general" ? "extra" : paid ? "paid" : "unpaid"}">
            ${d.kind === "general" ? "額外公眾假期" : paid ? "有薪法定假日" : "須放假，一般尚未有假日薪酬"}
          </span>
          ${st && st.status !== "pending" ? `<span class="tag">${statusLabel}</span>` : ""}
          ${st?.lieuDate ? `<span class="tag brass">另定 ${formatZh(st.lieuDate, { short: true })}</span>` : ""}
        </div>
      </div>
      ${
        d.kind === "statutory" && !compact && role === "employer"
          ? `<button class="btn secondary" type="button" style="min-height:2.4rem;padding:0.3rem 0.7rem" data-action="sh-edit" data-date="${d.date}">安排</button>`
          : `<span class="muted tiny">${st && compact ? statusLabel : ""}</span>`
      }
    </div>
  `;
}

function viewLeave() {
  const h = helper();
  if (!h) return emptyHelperPrompt("尚未有外傭資料");
  const t = today();
  const pane = ui.leavePane;
  if (isArrangedRestPolicy(h.restDay) && !["rest", "holidays", "calc"].includes(pane)) ui.leavePane = "rest";
  return `
    ${helperSwitcher()}
    <h1 class="screen-title">假期</h1>
    <div class="chip-row" style="margin-bottom:0.9rem">
      <button class="chip ${pane === "rest" ? "is-on" : ""}" type="button" data-pane="rest" aria-pressed="${pane === "rest"}">休息日</button>
      <button class="chip ${pane === "holidays" ? "is-on" : ""}" type="button" data-pane="holidays" aria-pressed="${pane === "holidays"}">法定假日</button>
      <button class="chip ${pane === "calc" ? "is-on" : ""}" type="button" data-pane="calc" aria-pressed="${pane === "calc"}">年假及其他</button>
    </div>
    ${pane === "rest" ? leaveRest(h, t) : pane === "calc" ? leaveCalc(h, t) : leaveHolidays(h, t)}
  `;
}

function monthGrid(year, month, marks, interactive) {
  const first = new Date(year, month, 1);
  const start = first.getDay();
  const dim = daysInMonth(year, month);
  const cells = [];
  for (let i = 0; i < start; i++) cells.push(`<div class="day out"></div>`);
  const t = today();
  for (let d = 1; d <= dim; d++) {
    const iso = toISO(new Date(year, month, d));
    const mark = marks[iso] || {};
    const cls = [
      "day",
      iso === t ? "is-today" : "",
      mark.sh ? "is-sh" : "",
      mark.gh ? "is-gh" : "",
      mark.rest ? "is-rest" : "",
      mark.annual ? "is-annual" : "",
    ]
      .filter(Boolean)
      .join(" ");
    const label = `${iso}${mark.rest ? "，休息日" : ""}${mark.sh ? "，法定假日" : ""}${mark.annual ? "，年假" : ""}`;
    if (interactive) {
      cells.push(
        `<button class="${cls}" type="button" data-action="cal-day" data-date="${iso}" aria-label="${label}">${d}</button>`
      );
    } else {
      cells.push(`<div class="${cls}" aria-label="${label}">${d}</div>`);
    }
  }
  const dow = WEEKDAYS.map((w) => `<div class="dow">${w.shortZh}</div>`).join("");
  return `<div class="cal" role="grid">${dow}${cells.join("")}</div>`;
}

function calendarMarks(h, year, month) {
  const winter = h.winterChoice || "christmas";
  const arranged = arrangedFor(h);
  const marks = {};
  statutoryHolidaysForYear(year, winter).forEach((d) => {
    marks[d.date] = { ...(marks[d.date] || {}), sh: true };
  });
  if (h.grantGeneralHolidays) {
    extraGeneralHolidays(year, winter).forEach((d) => {
      marks[d.date] = { ...(marks[d.date] || {}), gh: true };
    });
  }
  const dim = daysInMonth(year, month);
  for (let d = 1; d <= dim; d++) {
    const iso = toISO(new Date(year, month, d));
    if (isRestDayOn(h, iso, arranged)) marks[iso] = { ...(marks[iso] || {}), rest: true };
  }
  leaveLogsFor(h, "annual").forEach((log) => {
    if (!log.startDate) return;
    const end = log.endDate || log.startDate;
    let c = parseISO(log.startDate);
    const last = parseISO(end);
    while (c && last && c <= last) {
      const iso = toISO(c);
      marks[iso] = { ...(marks[iso] || {}), annual: true };
      c = addDays(c, 1);
    }
  });
  return marks;
}

function monthNav() {
  return `
    <div class="month-nav">
      <button class="icon-btn" type="button" data-action="month-prev" aria-label="上一個月">${icon("back")}</button>
      <strong>${ui.year}年${ui.month + 1}月</strong>
      <button class="icon-btn" type="button" data-action="month-next" aria-label="下一個月">${icon("chevron")}</button>
    </div>
  `;
}

function leaveRest(h, t) {
  const arranged = arrangedFor(h);
  const gaps = isArrangedRestPolicy(h.restDay) ? restDayGaps(h, arranged, t, toISO(addDays(t, 55))) : [];
  const upcoming = upcomingRestDaysFor(h, arranged, t, 6);
  const marks = calendarMarks(h, ui.year, ui.month);
  return `
    <div class="note-box">
      按《僱傭條例》，每 7 天須給予不少於 1 個連續 24 小時的休息日；僱主不可強迫外傭在休息日工作。可選擇固定每週一天，或「由僱主安排」後在年曆上指定日子，亦可對調。
    </div>
    <div class="card" style="margin-top:0.85rem">
      <p style="margin:0 0 0.6rem"><strong>休息日政策</strong></p>
      <div class="chip-row">
        ${REST_DAY_OPTIONS.map(
          (opt) => `
          <button class="chip ${String(h.restDay) === String(opt.id) ? "is-on" : ""}" type="button"
            data-action="set-rest-policy" data-value="${opt.id}" aria-pressed="${String(h.restDay) === String(opt.id)}">${opt.zh}</button>`
        ).join("")}
      </div>
    </div>
    ${
      isArrangedRestPolicy(h.restDay)
        ? `<p class="tiny muted" style="margin:0.8rem 0 0.4rem">點選日期即可加上或取消休息日（朱印標記）。對調時，取消原來的日子，再點另一天即可。</p>`
        : `<p class="tiny muted" style="margin:0.8rem 0 0.4rem">固定每週${weekdayLabel(h.restDay)}。如需對調，可在「年假及其他」登記休息日對調，或改為由僱主安排後在年曆指定。</p>`
    }
    <div class="card">
      ${monthNav()}
      ${monthGrid(ui.year, ui.month, marks, isArrangedRestPolicy(h.restDay))}
      <div class="cal-legend">
        <span><i class="seal"></i>休息日</span>
        <span><i></i>法定假日</span>
        <span><i class="brass"></i>已安排年假</span>
        <span><i class="today"></i>今天</span>
      </div>
    </div>
    ${
      gaps.length
        ? `<div class="note-box warn" style="margin-top:0.8rem">以下時段的 7 天窗口尚未見到休息日：${gaps
            .slice(0, 3)
            .map((g) => `${formatZh(g.start, { short: true })} 至 ${formatZh(g.end, { short: true })}`)
            .join("、")}。請補上或對調。</div>`
        : ""
    }
    <section class="section">
      <div class="section-head"><h2>即將到來的休息日</h2></div>
      <div class="card">
        ${
          upcoming.length
            ? upcoming
                .map(
                  (iso) => `
          <div class="row">
            <div class="grow">
              <div class="title">${formatZh(iso, { weekday: true })}</div>
            </div>
            ${
              isArrangedRestPolicy(h.restDay)
                ? `<button class="btn secondary" type="button" style="min-height:2.4rem;padding:0.3rem 0.7rem" data-action="cal-day" data-date="${iso}">取消</button>`
                : ""
            }
          </div>`
                )
                .join("")
            : `<p class="muted" style="margin:0">${isArrangedRestPolicy(h.restDay) ? "尚未在年曆上安排未來的休息日。" : "—"}</p>`
        }
      </div>
    </section>
  `;
}

function leaveHolidays(h, t) {
  const year = ui.year;
  const winter = h.winterChoice || "christmas";
  const list = holidayList(h, year);
  const marks = calendarMarks(h, year, ui.month);
  const shAll = statutoryHolidaysForYear(year, winter).filter((d) => inEmployment(h, d.date));
  const paid = shAll.filter((d) => holidayPayEligible(h, d.date));
  const taken = paid.filter((d) => ["taken", "worked-lieu"].includes(shStatus(h, d.date).status));
  const pendingPaid = paid.filter((d) => shStatus(h, d.date).status === "pending");
  return `
    <div class="note-box">
      香港外傭一般享有《僱傭條例》的<strong>法定假日</strong>，不是自動享有所有公眾假期（銀行假）。不論年資長短都須給予法定假日；只有在緊接該假日之前已連續受僱滿 3 個月，才享有假日薪酬。僱主不可「買假」；如需在法定假日工作，須至少提前 48 小時通知，並在 60 天內安排另定假日。
      <div style="margin-top:0.45rem">
        <a href="${OFFICIAL_LINKS.shList}" target="_blank" rel="noopener">勞工處法定假日一覽</a>
        　·　
        <a href="${OFFICIAL_LINKS.employmentOrdinanceSH}" target="_blank" rel="noopener">法定假日說明</a>
      </div>
    </div>
    <div class="chip-row" style="margin:1rem 0 0.8rem">
      ${YEARS.map(
        (y) => `<button class="chip ${year === y ? "is-on" : ""}" type="button" data-year="${y}" aria-pressed="${year === y}">${y}</button>`
      ).join("")}
    </div>
    ${year >= 2028 ? `<p class="tiny muted">2028 年起會再新增法定假日，本應用暫未收錄未公布年份。</p>` : ""}
    <div class="card">
      ${monthNav()}
      ${monthGrid(year, ui.month, marks, false)}
      <div class="cal-legend">
        <span><i class="seal"></i>休息日</span>
        <span><i></i>法定假日</span>
        <span><i class="today"></i>今天</span>
      </div>
    </div>
    <div class="fact-list">
      <div class="fact"><div class="k">本年合約內法定假日</div><div class="v">${shAll.length} 天</div></div>
      <div class="fact"><div class="k">已滿3個月、待安排</div><div class="v">${pendingPaid.length} 天</div></div>
    </div>
    <p class="tiny muted">已記錄已放／已補：${taken.length}　有薪法定假日共 ${paid.length} 天（本年、合約期內）。</p>
    <div class="card" style="margin-top:0.75rem">
      <label class="switch-field">
        <span>
          <strong>同時顯示公眾假期作為額外假期</strong>
          <span class="hint">只供你自願額外給予時對照，並非法例規定。</span>
        </span>
        <span class="switch">
          <input type="checkbox" data-action="toggle-gh" ${h.grantGeneralHolidays ? "checked" : ""}>
          <span></span>
        </span>
      </label>
      <label class="field" style="margin:0.4rem 0 0">
        <span>冬節或聖誕節，選擇其中一天作為法定假日</span>
        <select data-action="winter-choice">
          <option value="christmas" ${h.winterChoice !== "winter" ? "selected" : ""}>聖誕節</option>
          <option value="winter" ${h.winterChoice === "winter" ? "selected" : ""}>冬節</option>
        </select>
      </label>
    </div>
    <div class="card" style="margin-top:0.75rem">
      ${list.length ? list.map((d) => holidayRow(h, d, false)).join("") : `<p class="muted" style="margin:0">這一年沒有在合約期內的法定假日。</p>`}
    </div>
  `;
}

function leaveCalc(h, t) {
  const start = h.startDate || h.contractStart;
  const vest = annualLeaveVestDate(start);
  const al = annualBalance(h, t);
  const yearInfo = start ? currentLeaveYear(start, t) : null;
  const logs = leaveLogsFor(h);
  const marks = calendarMarks(h, ui.year, ui.month);
  return `
    <div class="note-box">
      外傭為同一僱主工作滿 12 個月後可享有薪年假：第 1 及第 2 年各 7 天，其後按年增加 1 天，最多 14 天。年假須在其後 12 個月內放取，日期由僱主安排並雙方商議，須至少提前 14 天書面通知。年假期內的休息日或法定假日不應算作年假日數。
    </div>
    <div class="fact-list">
      <div class="fact">
        <div class="k">有薪年假累算日</div>
        <div class="v">${vest ? formatZh(vest) : "—"}</div>
      </div>
      <div class="fact">
        <div class="k">已累算／已放／剩餘</div>
        <div class="v">${al.total}／${al.taken}／${al.remaining} 天</div>
        <div class="tiny muted">${yearInfo ? `目前服務年第 ${yearInfo.index} 年（滿 9 年後每年 14 天；本年為 ${annualLeaveDaysForYear(yearInfo.index) || 0} 天）` : ""}</div>
      </div>
    </div>
    <p class="tiny muted" style="margin:0.8rem 0 0.4rem">在年曆上點選日期，即可安排或取消一天年假（由僱主安排）。</p>
    <div class="card">
      ${monthNav()}
      ${monthGrid(ui.year, ui.month, marks, true)}
      <div class="cal-legend">
        <span><i class="seal"></i>休息日</span>
        <span><i class="brass"></i>已安排年假</span>
        <span><i></i>法定假日</span>
      </div>
    </div>
    <div class="btn-row">
      <button class="btn" type="button" data-action="leave-new">登記其他假期</button>
    </div>
    <section class="section">
      <div class="section-head"><h2>已登記的假期</h2></div>
      <div class="card">
        ${
          logs.length
            ? logs
                .slice()
                .sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""))
                .map((l) => {
                  const typ = LEAVE_TYPES.find((x) => x.id === l.type)?.zh || l.type;
                  return `<div class="row">
                    <div class="grow">
                      <div class="title">${escapeHtml(typ)}　${l.days} 天</div>
                      <div class="sub">${formatZh(l.startDate, { short: true })}${l.endDate && l.endDate !== l.startDate ? ` 至 ${formatZh(l.endDate, { short: true })}` : ""}${l.note ? "　" + escapeHtml(l.note) : ""}</div>
                    </div>
                    <button class="icon-btn" type="button" data-action="leave-del" data-id="${l.id}" aria-label="刪除">${icon("close", { size: 18 })}</button>
                  </div>`;
                })
                .join("")
            : `<p class="muted" style="margin:0">尚未登記年假、對調、病假或其他假期。</p>`
        }
      </div>
    </section>
  `;
}

function monthPaySnapshot(h, iso) {
  const d = parseISO(iso);
  const year = d.getFullYear();
  const month = d.getMonth();
  const start = h.startDate || h.contractStart;
  const end = h.contractEnd;
  const first = `${year}-${String(month + 1).padStart(2, "0")}-01`;
  const last = toISO(new Date(year, month + 1, 0));
  const fromISO = start && start > first ? start : first;
  const toISOMonth = end && end < last ? end : last;
  if (end && last < (start || first)) return { total: 0, label: "本月不在合約期內" };
  if (start && first > (end || last)) return { total: 0, label: "本月不在合約期內" };
  const fromDay = parseISO(fromISO).getDate();
  const toDay = parseISO(toISOMonth).getDate();
  const wage = proRataMonthly(h.wage, year, month, fromDay, toDay);
  const food = h.foodProvided ? { pay: 0, days: wage.days, dim: wage.dim } : proRataMonthly(h.foodAllowance, year, month, fromDay, toDay);
  const full = fromDay === 1 && toDay === wage.dim;
  const total = wage.pay + food.pay;
  const foodBit = h.foodProvided ? "已提供免費食物，不另發津貼" : `食物津貼 ${formatMoney(food.pay)}`;
  const label = full
    ? `完整月份：工資 ${formatMoney(wage.pay)}，${foodBit}`
    : `按本月 ${wage.days}／${wage.dim} 日比例估算：工資 ${formatMoney(wage.pay)}，${foodBit}`;
  return { total, label, wage, food, full };
}

function viewPay() {
  const h = helper();
  if (!h) return emptyHelperPrompt("尚未有外傭資料");
  const t = today();
  const d = parseISO(t);
  const snap = monthPaySnapshot(h, t);
  const daily = simpleDailyRate(h.wage);
  const pays = state.payments.filter((p) => p.helperId === h.id).slice().reverse();
  const yearPays = pays.filter((p) => (p.month || "").startsWith(String(d.getFullYear())));
  const yearTotal = yearPays.reduce((s, p) => s + Number(p.wage || 0) + Number(p.food || 0) + Number(p.adjustments || 0), 0);
  return `
    ${helperSwitcher()}
    <h1 class="screen-title">薪金</h1>
    <p class="lede">月薪 ${formatMoney(h.wage)}${h.foodProvided ? "　僱主提供免費食物" : `　食物津貼 ${formatMoney(h.foodAllowance)}`}。現時最低許可工資（2026年10月3日或之後簽約）為每月 ${formatMoney(CURRENT_MAW.wage)}，食物津貼不少於 ${formatMoney(CURRENT_MAW.food)}。</p>
    <div class="card">
      <div class="pay-total">${formatMoney(snap.total)}</div>
      <p class="tiny muted" style="margin:0.4rem 0 0">${snap.label}</p>
    </div>
    <div class="note-box" style="margin-top:0.8rem">
      以下只供規劃估算。法例上的假日薪酬、代通知金等，一般以過去 12 個月的平均工資計算，並非簡單把月薪除以 30。本應用的每日參考數字 ${formatMoney(daily)} 不能代替法定計算。
    </div>
    <div class="fact-list">
      <div class="fact"><div class="k">本年度已登記發薪合計</div><div class="v">${formatMoney(yearTotal)}</div></div>
    </div>
    <div class="btn-row">
      <button class="btn" type="button" data-action="pay-new">登記發薪記錄</button>
    </div>
    <section class="section">
      <div class="section-head"><h2>發薪記錄</h2></div>
      <div class="card">
        ${
          pays.length
            ? pays
                .map((p) => {
                  const sum = Number(p.wage || 0) + Number(p.food || 0) + Number(p.adjustments || 0);
                  return `<div class="row">
                    <div class="grow">
                      <div class="title">${escapeHtml(p.month || "—")}　${formatMoney(sum)}</div>
                      <div class="sub">${p.paidOn ? formatZh(p.paidOn, { short: true }) : "未填發薪日"}${p.note ? "　" + escapeHtml(p.note) : ""}</div>
                    </div>
                    <button class="icon-btn" type="button" data-action="pay-del" data-id="${p.id}" aria-label="刪除">${icon("close", { size: 18 })}</button>
                  </div>`;
                })
                .join("")
            : `<p class="muted" style="margin:0">尚未登記發薪記錄。</p>`
        }
      </div>
    </section>
    <p class="tiny muted">近年最低許可工資：${MAW_HISTORY.map((m) => `${m.effectiveFrom.replace(/-/g, "／")} 起 ${formatMoney(m.wage)}`).join("；")}。</p>
    ${disclaimer()}
  `;
}

function viewRemind() {
  const h = helper();
  if (!h) return emptyHelperPrompt("尚未有外傭資料");
  const t = today();
  const all = state.helpers.flatMap((x) => buildReminders(x, t, { arrangedRestDays: arrangedFor(x) }));
  const visible = all.filter((r) => isReminderVisible(r, state.reminderState, t));
  const hidden = all.filter((r) => !isReminderVisible(r, state.reminderState, t));
  return `
    ${helperSwitcher()}
    <h1 class="screen-title">事項提醒</h1>
    <p class="lede">合約即將屆滿、滿 3 個月後的有薪法定假日、年假開始累算，以及休息日安排缺口，都會在這裏列出。</p>
    <div class="card">
      <label class="switch-field">
        <span>
          <strong>系統通知</strong>
          <span class="hint">只在本裝置顯示。即使關閉，應用內仍可查看提醒。</span>
        </span>
        <span class="switch">
          <input type="checkbox" data-action="toggle-notify" ${state.settings.notifications ? "checked" : ""}>
          <span></span>
        </span>
      </label>
    </div>
    <section class="section">
      <div class="card">
        ${
          visible.length
            ? visible
                .map(
                  (r) => `
          <div class="row">
            <div class="grow">
              <div class="title">${escapeHtml(r.title)}</div>
              <div class="sub">${formatZh(r.date)}${state.helpers.length > 1 ? "　" + escapeHtml(r.helperName) : ""}</div>
              <p class="tiny muted" style="margin:0.35rem 0 0">${escapeHtml(r.body)}</p>
              <div class="btn-row" style="margin-top:0.45rem">
                <button class="btn secondary" type="button" data-action="remind-snooze" data-id="${r.id}" style="min-height:2.4rem">7 天後再提</button>
                <button class="btn ghost" type="button" data-action="remind-done" data-id="${r.id}" style="min-height:2.4rem">標為已處理</button>
              </div>
            </div>
            <span class="status-pill ${r.urgency}">${urgencyWord(r.urgency)}</span>
          </div>`
                )
                .join("")
            : `<p class="muted" style="margin:0">暫時沒有未處理的提醒。</p>`
        }
      </div>
    </section>
    ${
      hidden.length
        ? `<p class="tiny muted">已隱藏或稍後再提：${hidden.length} 則。</p>`
        : ""
    }
  `;
}

function viewTasks() {
  const h = helper();
  if (!h) return emptyHelperPrompt("尚未有外傭資料");
  const list = tasksFor(h);
  const t = today();
  const todayTasks = list.filter((task) => taskAppliesOn(task, t));
  return `
    ${helperSwitcher()}
    <h1 class="screen-title">工作安排</h1>
    <p class="lede">記下外傭日常或定期要完成的工作，例如打掃時段、煮飯、出門買餸以外的家務。與「工作守則」分開；守則請到另一頁編寫。</p>
    ${
      todayTasks.length
        ? `<div class="note-box">今天適用：${todayTasks.map((x) => escapeHtml(x.title)).join("、")}。</div>`
        : ""
    }
    <div class="btn-row">
      <button class="btn" type="button" data-action="task-new">新增工作安排</button>
    </div>
    <div class="card" style="margin-top:0.9rem">
      ${
        list.length
          ? list
              .map((task) => {
                const time = timeLabel(task);
                return `<div class="row">
                  <div class="grow">
                    <div class="title">${escapeHtml(task.title)}</div>
                    <div class="sub">${escapeHtml(scheduleLabel(task))}${time ? "　" + escapeHtml(time) : ""}</div>
                    ${task.detail ? `<p class="tiny muted" style="margin:0.3rem 0 0">${escapeHtml(task.detail)}</p>` : ""}
                  </div>
                  <button class="btn secondary" type="button" data-action="task-edit" data-id="${task.id}" style="min-height:2.4rem;padding:0.3rem 0.7rem">編輯</button>
                </div>`;
              })
              .join("")
          : `<div class="empty" style="padding:0.4rem 0"><p class="muted" style="margin:0">尚未加入工作安排。例如：「平日早上8時至10時打掃客廳和廚房」。</p></div>`
      }
    </div>
  `;
}

function viewRules() {
  const h = helper();
  if (!h) return emptyHelperPrompt("尚未有外傭資料");
  const list = rulesFor(h);
  return `
    ${helperSwitcher()}
    <h1 class="screen-title">工作守則</h1>
    <p class="lede">寫下家中的處事守則，例如休息日外出預計、客人來訪、廚房使用或不要做的事。與「工作安排」分開；每日要做的工作請到工作安排登記。</p>
    <div class="btn-row">
      <button class="btn" type="button" data-action="rule-new">新增工作守則</button>
    </div>
    <div style="margin-top:0.6rem">
      ${
        list.length
          ? list
              .map(
                (rule) => `
        <article class="card" style="margin-top:0.65rem">
          <div class="section-head">
            <h2>${escapeHtml(rule.title)}</h2>
            <button class="linkish" type="button" data-action="rule-edit" data-id="${rule.id}">編輯</button>
          </div>
          <p style="margin:0;white-space:pre-wrap">${escapeHtml(rule.body)}</p>
        </article>`
              )
              .join("")
          : `<div class="card"><p class="muted" style="margin:0">尚未加入工作守則。例如：「休息日如需通宵外出，請先告知」或「請不要讓陌生人進入單位」。</p></div>`
      }
    </div>
  `;
}

function viewShop() {
  const h = helper();
  if (!h) return emptyHelperPrompt("尚未有外傭資料");
  const lists = listsFor(h).slice().sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  return `
    ${helperSwitcher()}
    <h1 class="screen-title">買餸清單</h1>
    <p class="lede">若要外傭到街市或超市買東西，可在這裏開清單、自行加相片說明要買哪一樣。買完後記入價錢；下次加入同一物品時會帶出上次價錢，也可改，因為今次未必再有特價。</p>
    <div class="btn-row">
      <button class="btn" type="button" data-action="shop-new">新增清單</button>
    </div>
    <div class="card" style="margin-top:0.9rem">
      ${
        lists.length
          ? lists
              .map((list) => {
                const items = itemsForList(list.id);
                const bought = items.filter((i) => i.bought).length;
                return `<button class="row" type="button" data-go="shop-detail" data-list="${list.id}">
                  <div class="grow">
                    <div class="title">${escapeHtml(list.title || placeLabel(list.place))}</div>
                    <div class="sub">${placeLabel(list.place)}　${items.length ? `${bought}／${items.length} 項` : "尚未加入物品"}</div>
                  </div>
                  <span class="status-pill ${list.status === "done" ? "" : "watch"}">${list.status === "done" ? "已完成" : "進行中"}</span>
                </button>`;
              })
              .join("")
          : `<p class="muted" style="margin:0">尚未開立買餸清單。</p>`
      }
    </div>
  `;
}

function viewShopDetail() {
  const h = helper();
  if (!h) return emptyHelperPrompt("尚未有外傭資料");
  const list = state.shopLists.find((l) => l.id === ui.shopListId && l.helperId === h.id);
  if (!list) {
    return `<button class="linkish back-row" type="button" data-go="shop">返回買餸清單</button>
      <div class="error-state"><h1 class="screen-title">找不到這份清單</h1><p class="lede">它可能已被刪除。</p></div>`;
  }
  const items = itemsForList(list.id);
  return `
    <button class="linkish back-row" type="button" data-go="shop">返回買餸清單</button>
    <h1 class="screen-title">${escapeHtml(list.title || placeLabel(list.place))}</h1>
    <p class="lede">${placeLabel(list.place)}${list.note ? "　" + escapeHtml(list.note) : ""}。加入相片，方便外傭認出要買的物品。</p>
    <div class="btn-row">
      <button class="btn" type="button" data-action="item-new" data-list="${list.id}">加入物品</button>
      ${
        list.status !== "done"
          ? `<button class="btn secondary" type="button" data-action="shop-complete" data-list="${list.id}">完成並記下價錢</button>`
          : `<button class="btn secondary" type="button" data-action="shop-reopen" data-list="${list.id}">重新開啟</button>`
      }
    </div>
    <div style="margin-top:0.5rem">
      ${
        items.length
          ? items
              .map((item) => {
                const cat = findCatalog(state, item.name);
                const hint = cat
                  ? `上次 ${formatMoney(cat.lastPrice)}${cat.lastPaidOn ? "（" + formatZh(cat.lastPaidOn, { short: true }) + "）" : ""}，可改`
                  : "";
                return `<div class="shop-item">
                  <div class="thumb">${item.photo ? `<img src="${item.photo}" alt="">` : icon("image", { size: 22 })}</div>
                  <div>
                    <div class="title" style="font-weight:650">${escapeHtml(item.name)}${item.qty ? `　${escapeHtml(item.qty)}` : ""}</div>
                    ${item.note ? `<div class="tiny muted">${escapeHtml(item.note)}</div>` : ""}
                    ${hint ? `<div class="price-hint">${hint}</div>` : ""}
                    <div class="chip-row" style="margin-top:0.4rem">
                      ${item.bought ? `<span class="tag ok">已買</span>` : `<span class="tag">未買</span>`}
                      ${item.paidPrice !== "" && item.paidPrice != null ? `<span class="tag brass">今次 ${formatMoney(item.paidPrice)}</span>` : ""}
                    </div>
                    <div class="btn-row" style="margin-top:0.35rem">
                      <button class="btn secondary" type="button" data-action="item-edit" data-id="${item.id}" style="min-height:2.4rem;padding:0.3rem 0.7rem">編輯／入價</button>
                    </div>
                  </div>
                </div>`;
              })
              .join("")
          : `<div class="card"><p class="muted" style="margin:0">清單還是空的。點「加入物品」，可拍照或從相簿選圖。</p></div>`
      }
    </div>
    <div class="btn-row">
      <button class="btn danger" type="button" data-action="shop-del" data-list="${list.id}">刪除這份清單</button>
    </div>
  `;
}

async function generateShare() {
  const h = helper();
  if (!h) return toast("請先新增外傭");
  const pin = randomPin();
  const shareId = uid("share");
  const payload = buildSharePayload({
    helper: h,
    arrangedRestDays: arrangedFor(h),
    leaveLogs: state.leaveLogs,
    shStatuses: state.shStatuses,
    payments: state.payments,
    workTasks: state.workTasks,
    workRules: state.workRules,
    shopLists: state.shopLists,
    shopItems: state.shopItems,
    priceCatalog: state.priceCatalog,
  });
  payload.shareId = shareId;
  let packed;
  try {
    packed = await encryptShare(payload, pin);
  } catch (err) {
    console.warn(err);
    return toast("無法產生查看方式，請稍後再試");
  }
  state.helperAccess[h.id] = {
    shareId,
    packed,
    generatedAt: payload.generatedAt,
    revoked: false,
    helperName: h.name,
  };
  save();
  upsertInbox({
    shareId,
    helperId: h.id,
    packed,
    generatedAt: payload.generatedAt,
    label: h.name,
  });
  ui.shareReveal = { pin, packed, url: shareUrl(packed), helperName: h.name, shareId };
  ui.tab = "share";
  location.hash = "#/share";
  render();
}

function viewShare() {
  const h = helper();
  if (!h) return emptyHelperPrompt("尚未有外傭資料");
  const access = state.helperAccess[h.id];
  const reveal = ui.shareReveal;
  return `
    ${helperSwitcher()}
    <h1 class="screen-title">外傭查看方式</h1>
    <p class="lede">產生後，把 6 位查看密碼連同連結或複製的查看方式交給外傭。對方只能看到這位外傭的資料，不會看到你的私人備註。這是一份當時的副本；你其後有改動，需要重新產生並再交給對方。</p>
    ${
      reveal
        ? `<div class="card">
            <p style="margin:0 0 0.3rem">請立即把這組密碼交給 ${escapeHtml(reveal.helperName)}，離開此頁後不會再完整顯示。</p>
            <div class="share-pin" aria-label="查看密碼">${escapeHtml(reveal.pin)}</div>
            <div class="btn-row">
              <button class="btn" type="button" data-action="copy-pin">複製密碼</button>
              ${
                location.protocol === "http:" || location.protocol === "https:"
                  ? `<button class="btn secondary" type="button" data-action="copy-link">複製連結</button>
                     <button class="btn secondary" type="button" data-action="share-native">分享</button>`
                  : `<button class="btn secondary" type="button" data-action="copy-packed">複製查看方式</button>`
              }
            </div>
            <p class="tiny muted" style="margin:0.8rem 0 0.3rem">若無法開啟連結（例如以檔案傳送本應用），請把查看方式連同密碼一併交給對方，對方可在外傭版面貼上。</p>
            <div class="share-box"><textarea id="share-packed" readonly rows="6">${escapeHtml(reveal.packed)}</textarea></div>
          </div>`
        : access && !access.revoked
          ? `<div class="card">
              <p style="margin:0">已於 ${access.generatedAt ? formatZh(access.generatedAt.slice(0, 10)) : "較早前"} 產生過查看方式。密碼只在產生當下顯示。若資料有更新，或密碼已遺失，請重新產生。</p>
              <div class="btn-row">
                <button class="btn" type="button" data-action="share-generate">重新產生</button>
                <button class="btn danger" type="button" data-action="share-revoke">撤銷此部手機的查看</button>
              </div>
            </div>`
          : `<div class="card">
              <p style="margin:0">尚未產生查看方式。產生後，外傭可在另一部手機開啟連結，或在同一部手機進入外傭版面並輸入密碼。</p>
              <div class="btn-row"><button class="btn" type="button" data-action="share-generate">產生外傭查看方式</button></div>
            </div>`
    }
    <div class="note-box" style="margin-top:0.9rem">
      撤銷只會取消此部手機上已儲存的查看方式。已經送出的連結仍會顯示當時的加密副本，請向對方說明並改發新的查看方式。查看方式以密碼加密，請不要把密碼寫在未加密的短訊同一句，亦請不要把不必要的敏感備註放進可轉發的內容。
    </div>
  `;
}

function viewMore() {
  const h = helper();
  return `
    ${helperSwitcher()}
    <h1 class="screen-title">更多</h1>
    <div class="card">
      <button class="row" type="button" data-go="pay"><div class="grow"><div class="title">薪金計算</div><div class="sub">月薪估算、比例及發薪記錄</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="remind"><div class="grow"><div class="title">事項提醒</div><div class="sub">合約、假期及休息日安排</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="tasks"><div class="grow"><div class="title">工作安排</div><div class="sub">每日或定期要完成的工作</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="rules"><div class="grow"><div class="title">工作守則</div><div class="sub">家中處事守則，與工作安排分開</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="shop"><div class="grow"><div class="title">買餸清單</div><div class="sub">街市或超市購物，可加相片及上次價錢</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="share"><div class="grow"><div class="title">產生外傭查看方式</div><div class="sub">密碼及可分享的加密副本</div></div>${icon("chevron")}</button>
      ${
        h
          ? `<button class="row" type="button" data-go="helper-edit"><div class="grow"><div class="title">外傭資料與合約</div><div class="sub">${escapeHtml(h.name)}</div></div>${icon("chevron")}</button>`
          : `<button class="row" type="button" data-go="helper-new"><div class="grow"><div class="title">新增外傭</div><div class="sub">先加入資料才能使用各項功能</div></div>${icon("chevron")}</button>`
      }
      <button class="row" type="button" data-go="guide"><div class="grow"><div class="title">聘用外傭注意事項</div><div class="sub">根據勞工處及入境處公開資料</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="backup"><div class="grow"><div class="title">備份與還原</div><div class="sub">把資料匯出為 JSON 檔</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-action="choose-role" data-role="helper"><div class="grow"><div class="title">切換至外傭版面</div><div class="sub">用查看密碼開啟已分享的資料</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-action="choose-role" data-role=""><div class="grow"><div class="title">返回選擇身分</div></div>${icon("chevron")}</button>
    </div>
    ${disclaimer()}
  `;
}

function viewGuide() {
  return `
    <button class="linkish back-row" type="button" data-go="more">返回更多</button>
    <h1 class="screen-title">聘用外傭注意事項</h1>
    <p class="lede">以下整理自勞工處及入境處的公開說明，供僱主備忘，不是法律意見。</p>
    ${GUIDE_SECTIONS.map((s) => {
      const checked = state.guideChecks[s.id] !== false;
      return `<article class="guide-block">
        <label class="switch-field" style="border:0;padding:0 0 0.5rem">
          <span><strong>${escapeHtml(s.titleZh)}</strong></span>
          <span class="switch">
            <input type="checkbox" data-action="guide-check" data-id="${s.id}" ${checked ? "checked" : ""}>
            <span></span>
          </span>
        </label>
        <p style="margin:0 0 0.4rem">${escapeHtml(s.bodyZh)}</p>
        <p class="tiny">${(s.links || [])
          .map((l) => `<a href="${l.href}" target="_blank" rel="noopener">${escapeHtml(l.zh)}</a>`)
          .join("　·　")}</p>
      </article>`;
    }).join("")}
    ${disclaimer()}
  `;
}

function viewBackup() {
  return `
    <button class="linkish back-row" type="button" data-go="more">返回更多</button>
    <h1 class="screen-title">備份與還原</h1>
    <p class="lede">所有個人資料只存在這部裝置。建議不時匯出備份。清除 Safari 網站資料、換機或刪除主畫面圖示前，請先備份。</p>
    <div class="btn-row">
      <button class="btn" type="button" data-action="do-export">匯出 JSON 備份</button>
      <label class="btn secondary" style="cursor:pointer">還原備份
        <input type="file" accept="application/json,.json" data-action="do-import" hidden>
      </label>
    </div>
    <div class="btn-row">
      <button class="btn secondary" type="button" data-action="load-demo">載入示範資料</button>
    </div>
    ${disclaimer()}
  `;
}

function viewHelperForm(mode) {
  const editing = mode === "edit" ? helper() : null;
  const form = editing || {
    name: "",
    nationality: "philippines",
    startDate: "",
    contractStart: "",
    contractEnd: "",
    wage: CURRENT_MAW.wage,
    foodProvided: true,
    foodAllowance: CURRENT_MAW.food,
    restDay: 0,
    phone: "",
    notes: "",
    visaExpiry: "",
    passportExpiry: "",
    winterChoice: "christmas",
  };
  return `
    <button class="linkish back-row" type="button" data-go="${editing ? "home" : "onboard"}">返回</button>
    <h1 class="screen-title">${editing ? "編輯外傭資料" : "新增外傭"}</h1>
    <form id="helper-form" data-mode="${mode}">
      <input type="hidden" name="id" value="${escapeHtml(form.id || "")}">
      <label class="field"><span>姓名</span>
        <input name="name" required autocomplete="name" value="${escapeHtml(form.name || "")}" maxlength="80">
      </label>
      <label class="field"><span>國籍／來源地</span>
        <select name="nationality">
          ${NATIONALITIES.map((n) => `<option value="${n.id}" ${form.nationality === n.id ? "selected" : ""}>${n.zh}</option>`).join("")}
        </select>
      </label>
      <label class="field"><span>開始受僱日期</span>
        <input type="date" name="startDate" required value="${escapeHtml(form.startDate || "")}">
      </label>
      <label class="field"><span>合約開始日期<span class="hint">如與開始受僱日相同，可留空後自動填入</span></span>
        <input type="date" name="contractStart" value="${escapeHtml(form.contractStart || "")}">
      </label>
      <label class="field"><span>合約屆滿日期<span class="hint">標準合約一般為兩年，可自動計算</span></span>
        <input type="date" name="contractEnd" value="${escapeHtml(form.contractEnd || "")}">
      </label>
      <label class="field"><span>每月工資（港元）</span>
        <input type="number" name="wage" inputmode="decimal" min="0" step="1" value="${escapeHtml(form.wage ?? CURRENT_MAW.wage)}">
      </label>
      <label class="switch-field">
        <span><strong>提供免費食物</strong><span class="hint">若不提供，須支付不少於官方食物津貼。</span></span>
        <span class="switch"><input type="checkbox" name="foodProvided" ${form.foodProvided ? "checked" : ""}><span></span></span>
      </label>
      <label class="field"><span>每月食物津貼（港元）</span>
        <input type="number" name="foodAllowance" inputmode="decimal" min="0" step="1" value="${escapeHtml(form.foodAllowance ?? CURRENT_MAW.food)}">
      </label>
      <fieldset class="field">
        <legend class="lbl">休息日</legend>
        <p class="hint" style="margin:0 0 0.4rem">可揀固定每週一天，或「由僱主安排」後在假期年曆上指定日子。</p>
        <select name="restDay">
          ${REST_DAY_OPTIONS.map(
            (o) => `<option value="${o.id}" ${String(form.restDay) === String(o.id) ? "selected" : ""}>${o.zh}</option>`
          ).join("")}
        </select>
      </fieldset>
      <label class="field"><span>聯絡電話（可選）</span>
        <input type="tel" name="phone" autocomplete="tel" inputmode="tel" value="${escapeHtml(form.phone || "")}">
      </label>
      <label class="field"><span>簽證／逗留期限（可選，只供提醒）</span>
        <input type="date" name="visaExpiry" value="${escapeHtml(form.visaExpiry || "")}">
      </label>
      <label class="field"><span>護照到期日（可選，只供提醒）</span>
        <input type="date" name="passportExpiry" value="${escapeHtml(form.passportExpiry || "")}">
      </label>
      <label class="field"><span>僱主私人備註<span class="hint">不會放入外傭查看方式。</span></span>
        <textarea name="notes" maxlength="2000">${escapeHtml(form.notes || "")}</textarea>
      </label>
      <div class="btn-row">
        <button class="btn" type="submit">儲存</button>
        ${editing ? `<button class="btn danger" type="button" data-action="helper-delete">刪除此外傭</button>` : ""}
      </div>
    </form>
    ${disclaimer()}
  `;
}

/* ---------- helper surfaces ---------- */

function sessionPayload() {
  return helperSession?.payload || null;
}

function sessionHelper() {
  return sessionPayload()?.helper || null;
}

function helperReminderList() {
  const p = sessionPayload();
  if (!p?.helper) return [];
  const h = { ...p.helper };
  return buildReminders(h, today(), { arrangedRestDays: p.arrangedRestDays || [] }).map((r) => ({
    ...r,
    title: r.title.replaceAll(h.name || "外傭", "你"),
    body: (r.body || "").replaceAll(h.name || "外傭", "你"),
  }));
}

function sameDeviceWriteback() {
  const p = sessionPayload();
  if (!p?.helper?.id || !p.shareId) return false;
  const access = state.helperAccess[p.helper.id];
  return Boolean(access && access.shareId === p.shareId && !access.revoked);
}

function viewHelperEnter() {
  const inbox = loadInbox().filter((x) => {
    const acc = state.helperAccess[x.helperId];
    return !acc || !acc.revoked || acc.shareId !== x.shareId;
  });
  return `
    <h1 class="screen-title">用僱主提供的查看方式</h1>
    <p class="lede">開啟僱主傳來的連結，或輸入 6 位查看密碼。若收到的是一串查看方式文字，可貼在下面。</p>
    ${
      ui.pinError
        ? `<div class="note-box danger">${escapeHtml(ui.pinError)}</div>`
        : ""
    }
    <form id="helper-unlock">
      <label class="field"><span>6 位查看密碼</span>
        <input class="pin-boxes" name="pin" inputmode="numeric" pattern="[0-9]*" maxlength="6" autocomplete="one-time-code" required placeholder="••••••">
      </label>
      <label class="field"><span>查看方式（如沒有開啟連結，請貼上）</span>
        <textarea name="packed" rows="5" placeholder="由僱主複製給你的一串文字">${escapeHtml(ui.pendingShare || "")}</textarea>
      </label>
      <div class="btn-row">
        <button class="btn" type="submit">開啟我的資料</button>
      </div>
    </form>
    ${
      inbox.length
        ? `<section class="section">
            <div class="section-head"><h2>此部手機已儲存的查看方式</h2></div>
            <div class="card">
              ${inbox
                .map(
                  (x) => `<p class="tiny muted" style="margin:0 0 0.35rem">「${escapeHtml(x.label || "外傭")}」於 ${x.generatedAt ? formatZh(String(x.generatedAt).slice(0, 10)) : "較早前"} 儲存。輸入上面的密碼即可開啟。</p>`
                )
                .join("")}
            </div>
          </section>`
        : ""
    }
    <button class="linkish" type="button" data-action="choose-role" data-role="">返回選擇身分</button>
    ${disclaimer()}
  `;
}

function viewHelperHome() {
  const p = sessionPayload();
  const h = sessionHelper();
  if (!p || !h) return viewHelperEnter();
  const t = today();
  const cs = contractStatus(h, t);
  const start = h.contractStart || h.startDate;
  const paidFrom = paidStatutoryStart(h.startDate || h.contractStart);
  const vest = annualLeaveVestDate(h.startDate || h.contractStart);
  const al = helperAnnualBalance(h, p, t);
  const daysWord = cs.daysLeft < 0 ? "已過" : "尚餘";
  const daysNum = Math.abs(cs.daysLeft ?? 0);
  const pillClass =
    cs.key === "ok" ? "" : cs.key === "watch" || cs.key === "soon" ? "warn" : cs.key === "expired" || cs.key === "critical" ? "danger" : "warn";
  const restText = isArrangedRestPolicy(h.restDay)
    ? "休息日由僱主安排"
    : `休息日：每週${weekdayLabel(h.restDay)}`;
  const reminders = helperReminderList().slice(0, 3);
  const acked = isAcked(p.shareId);
  return `
    <h1 class="screen-title">${escapeHtml(h.name)}</h1>
    <p class="lede">這是僱主提供的資料副本，供你查看自己的合約、假期和安排。${p.generatedAt ? `產生於 ${formatZh(p.generatedAt.slice(0, 10))}。` : ""}如資料有更新，請向僱主要最新的查看方式。</p>
    <section class="contract-rail">
      <div class="rail-status"><span class="status-pill ${pillClass}">${cs.label}</span></div>
      <div class="rail">
        <div><span>開始</span><strong>${start ? formatZh(start, { short: true }) : "—"}</strong></div>
        <div class="mid"><span>今天</span><strong>${formatZh(t, { short: true })}</strong></div>
        <div class="end"><span>屆滿</span><strong>${h.contractEnd ? formatZh(h.contractEnd, { short: true }) : "—"}</strong></div>
        <div class="rail-track" aria-hidden="true"><span style="width:${Math.round((cs.progress || 0) * 100)}%"></span></div>
      </div>
      <p class="rail-note">${cs.daysLeft == null ? "合約日期尚未填寫。" : `${daysWord} <span class="num">${daysNum}</span> 日`}</p>
    </section>
    <div class="fact-list">
      <div class="fact"><div class="k">休息日</div><div class="v">${restText}</div></div>
      <div class="fact">
        <div class="k">有薪法定假日起點</div>
        <div class="v">${paidFrom ? formatZh(paidFrom, { short: true }) : "—"}</div>
      </div>
      <div class="fact">
        <div class="k">有薪年假</div>
        <div class="v">${t < vest ? "未屆滿12個月" : `${al.remaining}／${al.total} 天`}</div>
      </div>
    </div>
    <section class="section">
      <div class="section-head"><h2>僱主給你的安排</h2></div>
      ${entryCards(h, "h-")}
    </section>
    <section class="section">
      <div class="section-head">
        <h2>事項提醒</h2>
        <button class="linkish" type="button" data-go="h-remind">全部</button>
      </div>
      <div class="card">
        ${
          reminders.length
            ? reminders
                .map(
                  (r) => `<button class="row" type="button" data-go="h-remind">
                    <div class="grow"><div class="title">${escapeHtml(r.title)}</div><div class="sub">${formatZh(r.date)}</div></div>
                    <span class="status-pill ${r.urgency}">${urgencyWord(r.urgency)}</span>
                  </button>`
                )
                .join("")
            : `<p class="muted" style="margin:0">暫時沒有提醒。</p>`
        }
      </div>
    </section>
    <div class="card" style="margin-top:1rem">
      <label class="switch-field">
        <span>
          <strong>已看過這次安排</strong>
          <span class="hint">只記錄在你這部裝置，不會傳回僱主。</span>
        </span>
        <span class="switch">
          <input type="checkbox" data-action="helper-ack" ${acked ? "checked" : ""}>
          <span></span>
        </span>
      </label>
    </div>
    ${disclaimer()}
  `;
}

function helperAnnualBalance(h, p, on) {
  const vested = vestedAnnualLeaveAsOf(h.startDate || h.contractStart, on);
  const logs = (p.leaveLogs || []).filter((l) => l.type === "annual" && l.startDate && l.startDate <= on);
  const taken = logs.reduce((s, l) => s + (Number(l.days) || 0), 0);
  return { ...vested, taken, remaining: Math.max(0, vested.total - taken) };
}

function helperShStatus(p, date) {
  return (p.shStatuses || {})[date] || { status: "pending", lieuDate: "", note: "" };
}

function viewHelperLeave() {
  const p = sessionPayload();
  const h = sessionHelper();
  if (!p || !h) return viewHelperEnter();
  const t = today();
  const arranged = p.arrangedRestDays || [];
  const upcoming = upcomingRestDaysFor(h, arranged, t, 8);
  const year = ui.year;
  const list = allObservedDatesForYear(year, h.winterChoice || "christmas", Boolean(h.grantGeneralHolidays)).filter((d) =>
    inEmployment(h, d.date)
  );
  const marks = {};
  const winter = h.winterChoice || "christmas";
  statutoryHolidaysForYear(year, winter).forEach((d) => {
    marks[d.date] = { ...(marks[d.date] || {}), sh: true };
  });
  if (h.grantGeneralHolidays) {
    extraGeneralHolidays(year, winter).forEach((d) => {
      marks[d.date] = { ...(marks[d.date] || {}), gh: true };
    });
  }
  const dim = daysInMonth(year, ui.month);
  for (let d = 1; d <= dim; d++) {
    const iso = toISO(new Date(year, ui.month, d));
    if (isRestDayOn(h, iso, arranged)) marks[iso] = { ...(marks[iso] || {}), rest: true };
  }
  (p.leaveLogs || [])
    .filter((l) => l.type === "annual")
    .forEach((log) => {
      if (!log.startDate) return;
      const end = log.endDate || log.startDate;
      let c = parseISO(log.startDate);
      const last = parseISO(end);
      while (c && last && c <= last) {
        const iso = toISO(c);
        marks[iso] = { ...(marks[iso] || {}), annual: true };
        c = addDays(c, 1);
      }
    });
  const al = helperAnnualBalance(h, p, t);
  return `
    <h1 class="screen-title">我的假期</h1>
    <p class="lede">${isArrangedRestPolicy(h.restDay) ? "休息日由僱主在年曆上安排，你可在下面查看。" : `固定休息日為每週${weekdayLabel(h.restDay)}。`} 法定假日與年假的日期亦由僱主安排後在此顯示。</p>
    <div class="chip-row" style="margin-bottom:0.8rem">
      ${YEARS.map((y) => `<button class="chip ${year === y ? "is-on" : ""}" type="button" data-year="${y}">${y}</button>`).join("")}
    </div>
    <div class="card">
      ${monthNav()}
      ${monthGrid(year, ui.month, marks, false)}
      <div class="cal-legend">
        <span><i class="seal"></i>休息日</span>
        <span><i></i>法定假日</span>
        <span><i class="brass"></i>已安排年假</span>
        <span><i class="today"></i>今天</span>
      </div>
    </div>
    <section class="section">
      <div class="section-head"><h2>即將到來的休息日</h2></div>
      <div class="card">
        ${upcoming.length ? upcoming.map((iso) => `<div class="row"><div class="grow"><div class="title">${formatZh(iso, { weekday: true })}</div></div></div>`).join("") : `<p class="muted" style="margin:0">暫時未有即將到來的休息日資料。</p>`}
      </div>
    </section>
    <section class="section">
      <div class="section-head"><h2>法定假日</h2></div>
      <div class="card">
        ${
          list.length
            ? list
                .map((d) => {
                  const st = d.kind === "statutory" ? helperShStatus(p, d.date) : null;
                  const fakeH = h;
                  // reuse row in read-only by temporarily mapping shStatuses is hard; inline compact
                  const paid = d.kind === "statutory" && holidayPayEligible(h, d.date);
                  const restHit = isRestDayOn(h, d.date, arranged);
                  const statusLabel = SH_STATUSES.find((s) => s.id === st?.status)?.zh || "";
                  const dt = parseISO(d.date);
                  return `<div class="holiday-item">
                    <div class="date-block"><div class="m">${dt.getMonth() + 1}月</div><div class="d">${dt.getDate()}</div></div>
                    <div>
                      <div class="title" style="font-weight:650">${escapeHtml(d.nameZh)}</div>
                      <div class="tiny muted">${formatZh(d.date, { shortWeek: true })}${restHit ? "　適逢休息日" : ""}</div>
                      <div class="chip-row" style="margin-top:0.35rem">
                        <span class="tag ${d.kind === "general" ? "extra" : paid ? "paid" : "unpaid"}">${d.kind === "general" ? "額外公眾假期" : paid ? "有薪法定假日" : "須放假，一般尚未有假日薪酬"}</span>
                        ${st && st.status !== "pending" ? `<span class="tag">${statusLabel}</span>` : st ? `<span class="tag">待安排</span>` : ""}
                        ${st?.lieuDate ? `<span class="tag brass">另定 ${formatZh(st.lieuDate, { short: true })}</span>` : ""}
                      </div>
                    </div>
                  </div>`;
                })
                .join("")
            : `<p class="muted" style="margin:0">這一年沒有在合約期內的法定假日。</p>`
        }
      </div>
    </section>
    <section class="section">
      <div class="section-head"><h2>年假</h2></div>
      <div class="card">
        <p style="margin:0">已累算 ${al.total} 天，已放 ${al.taken} 天，剩餘 ${al.remaining} 天。日期由僱主安排，請以年曆上的標記為準。</p>
      </div>
    </section>
    ${disclaimer()}
  `;
}

function viewHelperTasks() {
  const p = sessionPayload();
  const h = sessionHelper();
  if (!p || !h) return viewHelperEnter();
  const list = p.workTasks || [];
  const t = today();
  const shareId = p.shareId;
  return `
    <h1 class="screen-title">工作安排</h1>
    <p class="lede">以下是僱主要你日常或定期完成的工作。這頁只顯示工作安排；家中守則請到「工作守則」查看。</p>
    <div class="card">
      ${
        list.length
          ? list
              .map((task) => {
                const applies = taskAppliesOn(task, t);
                const done = isTaskDone(shareId, task.id, t);
                const time = timeLabel(task);
                return `<div class="row">
                  <div class="grow">
                    <div class="title">${escapeHtml(task.title)}</div>
                    <div class="sub">${escapeHtml(scheduleLabel(task))}${time ? "　" + escapeHtml(time) : ""}${applies ? "　今天適用" : ""}</div>
                    ${task.detail ? `<p class="tiny muted" style="margin:0.3rem 0 0">${escapeHtml(task.detail)}</p>` : ""}
                    ${
                      applies
                        ? `<label class="switch-field" style="padding-bottom:0">
                            <span><strong>今天已完成</strong><span class="hint">只記錄在你這部裝置。</span></span>
                            <span class="switch"><input type="checkbox" data-action="task-done" data-id="${task.id}" ${done ? "checked" : ""}><span></span></span>
                          </label>`
                        : ""
                    }
                  </div>
                </div>`;
              })
              .join("")
          : `<p class="muted" style="margin:0">僱主尚未加入工作安排。</p>`
      }
    </div>
  `;
}

function viewHelperRules() {
  const p = sessionPayload();
  if (!p) return viewHelperEnter();
  const list = p.workRules || [];
  return `
    <h1 class="screen-title">工作守則</h1>
    <p class="lede">以下是僱主訂下的家務及處事守則。這頁只顯示守則；每日要做的工作請到「工作安排」查看。</p>
    ${
      list.length
        ? list
            .map(
              (rule) => `<article class="card" style="margin-top:0.65rem">
                <h2>${escapeHtml(rule.title)}</h2>
                <p style="margin:0.45rem 0 0;white-space:pre-wrap">${escapeHtml(rule.body)}</p>
              </article>`
            )
            .join("")
        : `<div class="card"><p class="muted" style="margin:0">僱主尚未加入工作守則。</p></div>`
    }
  `;
}

function viewHelperShop() {
  const p = sessionPayload();
  if (!p) return viewHelperEnter();
  const lists = (p.shopLists || []).slice().sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
  return `
    <h1 class="screen-title">買餸清單</h1>
    <p class="lede">僱主要你到街市或超市購買的物品。相片由僱主提供，方便你認出要買哪一樣。買完可記入價錢；若在同一部手機開啟，價錢會寫回僱主的清單。</p>
    <div class="card">
      ${
        lists.length
          ? lists
              .map((list) => {
                const items = (p.shopItems || []).filter((i) => i.listId === list.id);
                const bought = items.filter((i) => i.bought).length;
                return `<button class="row" type="button" data-go="h-shop-detail" data-list="${list.id}">
                  <div class="grow">
                    <div class="title">${escapeHtml(list.title || placeLabel(list.place))}</div>
                    <div class="sub">${placeLabel(list.place)}　${items.length ? `${bought}／${items.length} 項` : "未有物品"}</div>
                  </div>
                  <span class="status-pill ${list.status === "done" ? "" : "watch"}">${list.status === "done" ? "已完成" : "進行中"}</span>
                </button>`;
              })
              .join("")
          : `<p class="muted" style="margin:0">暫時沒有買餸清單。</p>`
      }
    </div>
  `;
}

function viewHelperShopDetail() {
  const p = sessionPayload();
  if (!p) return viewHelperEnter();
  const list = (p.shopLists || []).find((l) => l.id === ui.shopListId);
  if (!list) {
    return `<button class="linkish back-row" type="button" data-go="h-shop">返回買餸清單</button>
      <div class="error-state"><h1 class="screen-title">找不到這份清單</h1></div>`;
  }
  const items = (p.shopItems || []).filter((i) => i.listId === list.id);
  const catOf = (name) => (p.priceCatalog || []).find((c) => c.key === String(name || "").trim().toLowerCase());
  return `
    <button class="linkish back-row" type="button" data-go="h-shop">返回買餸清單</button>
    <h1 class="screen-title">${escapeHtml(list.title || placeLabel(list.place))}</h1>
    <p class="lede">${placeLabel(list.place)}${list.note ? "　" + escapeHtml(list.note) : ""}。</p>
    ${items
      .map((item) => {
        const cat = catOf(item.name);
        const hint = cat ? `上次 ${formatMoney(cat.lastPrice)}，如今次不同可改` : "買完後可記入價錢";
        return `<div class="shop-item">
          <div class="thumb">${item.photo ? `<img src="${item.photo}" alt="${escapeHtml(item.name)}">` : icon("image", { size: 22 })}</div>
          <div>
            <div class="title" style="font-weight:650">${escapeHtml(item.name)}${item.qty ? `　${escapeHtml(item.qty)}` : ""}</div>
            ${item.note ? `<div class="tiny muted">${escapeHtml(item.note)}</div>` : ""}
            <div class="price-hint">${hint}</div>
            <label class="switch-field">
              <span>已買到</span>
              <span class="switch"><input type="checkbox" data-action="h-item-bought" data-id="${item.id}" ${item.bought ? "checked" : ""}><span></span></span>
            </label>
            <label class="field" style="margin:0">
              <span>今次價錢（港元）</span>
              <input type="number" inputmode="decimal" min="0" step="0.1" data-action="h-item-price" data-id="${item.id}" value="${item.paidPrice ?? ""}" placeholder="${cat ? cat.lastPrice : ""}">
            </label>
          </div>
        </div>`;
      })
      .join("") || `<div class="card"><p class="muted" style="margin:0">這份清單尚未加入物品。</p></div>`}
    ${sameDeviceWriteback() ? `<p class="tiny muted">你正在此部手機查看，記入的價錢會寫回僱主的清單，並記住作下次參考。</p>` : `<p class="tiny muted">你在另一部手機查看時，價錢只先記在這份副本。請告知僱主，或請僱主在僱主版面補記入價。</p>`}
  `;
}

function viewHelperPay() {
  const p = sessionPayload();
  const h = sessionHelper();
  if (!p || !h) return viewHelperEnter();
  const snap = monthPaySnapshot(h, today());
  return `
    <button class="linkish back-row" type="button" data-go="h-more">返回更多</button>
    <h1 class="screen-title">薪金</h1>
    <p class="lede">月薪 ${formatMoney(h.wage)}${h.foodProvided ? "　僱主提供免費食物" : `　食物津貼 ${formatMoney(h.foodAllowance)}`}。此頁只供查看，不能在這裏更改合約工資。</p>
    <div class="card">
      <div class="pay-total">${formatMoney(snap.total)}</div>
      <p class="tiny muted" style="margin:0.4rem 0 0">${snap.label}</p>
    </div>
    <div class="note-box" style="margin-top:0.8rem">估算只供參考，不能代替《僱傭條例》的法定計算。現時最低許可工資（2026年10月3日或之後簽約）為每月 ${formatMoney(CURRENT_MAW.wage)}，食物津貼不少於 ${formatMoney(CURRENT_MAW.food)}。</div>
    ${disclaimer()}
  `;
}

function viewHelperRemind() {
  const list = helperReminderList();
  return `
    <button class="linkish back-row" type="button" data-go="h-more">返回更多</button>
    <h1 class="screen-title">事項提醒</h1>
    <div class="card">
      ${
        list.length
          ? list
              .map(
                (r) => `<div class="row">
                  <div class="grow">
                    <div class="title">${escapeHtml(r.title)}</div>
                    <div class="sub">${formatZh(r.date)}</div>
                    <p class="tiny muted" style="margin:0.35rem 0 0">${escapeHtml(r.body)}</p>
                  </div>
                  <span class="status-pill ${r.urgency}">${urgencyWord(r.urgency)}</span>
                </div>`
              )
              .join("")
          : `<p class="muted" style="margin:0">暫時沒有提醒。</p>`
      }
    </div>
  `;
}

function viewHelperRights() {
  return `
    <button class="linkish back-row" type="button" data-go="h-more">返回更多</button>
    <h1 class="screen-title">你的權利與注意事項</h1>
    <p class="lede">以下根據勞工處及入境處公開資料，以你（外傭）的角度整理，不是法律意見。</p>
    ${HELPER_GUIDE_SECTIONS.map(
      (s) => `<article class="guide-block">
        <h3>${escapeHtml(s.titleZh)}</h3>
        <p style="margin:0 0 0.4rem">${escapeHtml(s.bodyZh)}</p>
        <p class="tiny">${(s.links || [])
          .map((l) => `<a href="${l.href}" target="_blank" rel="noopener">${escapeHtml(l.zh)}</a>`)
          .join("　·　")}</p>
      </article>`
    ).join("")}
    ${disclaimer()}
  `;
}

function viewHelperMore() {
  const h = sessionHelper();
  return `
    <h1 class="screen-title">更多</h1>
    <div class="card">
      <button class="row" type="button" data-go="h-pay"><div class="grow"><div class="title">薪金</div><div class="sub">查看工資及本月估算</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="h-remind"><div class="grow"><div class="title">事項提醒</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="h-tasks"><div class="grow"><div class="title">工作安排</div><div class="sub">每日或定期要完成的工作</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="h-rules"><div class="grow"><div class="title">工作守則</div><div class="sub">家中處事守則，與工作安排分開</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="h-shop"><div class="grow"><div class="title">買餸清單</div><div class="sub">街市或超市要買的物品及相片</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-go="h-rights"><div class="grow"><div class="title">你的權利與注意事項</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-action="helper-lock"><div class="grow"><div class="title">鎖定此查看</div><div class="sub">下次需再次輸入密碼</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-action="choose-role" data-role="employer"><div class="grow"><div class="title">切換至僱主版面</div></div>${icon("chevron")}</button>
      <button class="row" type="button" data-action="choose-role" data-role=""><div class="grow"><div class="title">返回選擇身分</div></div>${icon("chevron")}</button>
    </div>
    ${h ? "" : ""}
    ${disclaimer()}
  `;
}

/* ---------- sheets ---------- */

function sheetHtml() {
  const sheet = ui.sheet;
  if (!sheet) return "";
  let body = "";
  if (sheet.type === "sh") {
    const h = helper();
    const st = shStatus(h, sheet.date);
    body = `
      <h2>安排法定假日</h2>
      <p class="lede" style="margin-bottom:0.8rem">${formatZh(sheet.date, { weekday: true })}</p>
      <form id="sh-form" data-date="${sheet.date}">
        <label class="field"><span>狀況</span>
          <select name="status">
            ${SH_STATUSES.map((s) => `<option value="${s.id}" ${st.status === s.id ? "selected" : ""}>${s.zh}</option>`).join("")}
          </select>
        </label>
        <label class="field"><span>另定／代替假日日期</span>
          <input type="date" name="lieuDate" value="${escapeHtml(st.lieuDate || "")}">
        </label>
        <label class="field"><span>備註</span>
          <textarea name="note">${escapeHtml(st.note || "")}</textarea>
        </label>
        <div class="btn-row"><button class="btn" type="submit">儲存</button></div>
      </form>
    `;
  } else if (sheet.type === "leave") {
    body = `
      <h2>登記假期</h2>
      <form id="leave-form">
        <label class="field"><span>類別</span>
          <select name="type">
            ${LEAVE_TYPES.map((t) => `<option value="${t.id}">${t.zh}</option>`).join("")}
          </select>
        </label>
        <label class="field"><span>開始日期</span><input type="date" name="startDate" required></label>
        <label class="field"><span>結束日期</span><input type="date" name="endDate"></label>
        <label class="field"><span>備註</span><textarea name="note"></textarea></label>
        <div class="btn-row"><button class="btn" type="submit">儲存</button></div>
      </form>
    `;
  } else if (sheet.type === "pay") {
    const h = helper();
    const t = today();
    const month = t.slice(0, 7);
    body = `
      <h2>登記發薪</h2>
      <form id="pay-form">
        <label class="field"><span>月份</span><input type="month" name="month" required value="${month}"></label>
        <label class="field"><span>工資</span><input type="number" name="wage" inputmode="decimal" step="1" value="${h?.wage ?? 0}"></label>
        <label class="field"><span>食物津貼</span><input type="number" name="food" inputmode="decimal" step="1" value="${h?.foodProvided ? 0 : h?.foodAllowance ?? 0}"></label>
        <label class="field"><span>其他增減</span><input type="number" name="adjustments" inputmode="decimal" step="1" value="0"></label>
        <label class="field"><span>發薪日</span><input type="date" name="paidOn" value="${t}"></label>
        <label class="field"><span>備註</span><textarea name="note"></textarea></label>
        <div class="btn-row"><button class="btn" type="submit">儲存</button></div>
      </form>
    `;
  } else if (sheet.type === "task") {
    const task = sheet.id ? state.workTasks.find((t) => t.id === sheet.id) : newWorkTask({ helperId: helper()?.id, schedule: "daily" });
    const weekly = (task.weekdays || []).map(Number);
    body = `
      <h2>${sheet.id ? "編輯工作安排" : "新增工作安排"}</h2>
      <form id="task-form" data-id="${escapeHtml(task.id)}">
        <label class="field"><span>工作名稱</span><input name="title" required maxlength="80" value="${escapeHtml(task.title || "")}" placeholder="例如：打掃客廳和廚房"></label>
        <label class="field"><span>說明</span><textarea name="detail" maxlength="1000" placeholder="例如：先客廳後廚房，不要用漂白水清洗木地板">${escapeHtml(task.detail || "")}</textarea></label>
        <label class="field"><span>何時進行</span>
          <select name="schedule">
            ${TASK_SCHEDULES.map((s) => `<option value="${s.id}" ${task.schedule === s.id ? "selected" : ""}>${s.zh}</option>`).join("")}
          </select>
        </label>
        <fieldset class="field" data-weekly-only ${task.schedule === "weekly" ? "" : "hidden"}>
          <legend class="lbl">每週哪幾天</legend>
          <div class="weekday-picks">
            ${WEEKDAYS.map((w) => `<label><input type="checkbox" name="weekdays" value="${w.id}" ${weekly.includes(w.id) ? "checked" : ""}><span>${w.shortZh}</span></label>`).join("")}
          </div>
        </fieldset>
        <label class="field" data-once-only ${task.schedule === "once" ? "" : "hidden"}>
          <span>指定日期</span><input type="date" name="onceDate" value="${escapeHtml(task.onceDate || "")}">
        </label>
        <label class="field"><span>時段（可選）</span>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.5rem">
            <input type="time" name="timeFrom" value="${escapeHtml(task.timeFrom || "")}">
            <input type="time" name="timeTo" value="${escapeHtml(task.timeTo || "")}">
          </div>
        </label>
        <div class="btn-row">
          <button class="btn" type="submit">儲存</button>
          ${sheet.id ? `<button class="btn danger" type="button" data-action="task-del" data-id="${task.id}">刪除</button>` : ""}
        </div>
      </form>
    `;
  } else if (sheet.type === "rule") {
    const rule = sheet.id ? state.workRules.find((r) => r.id === sheet.id) : newWorkRule({ helperId: helper()?.id });
    body = `
      <h2>${sheet.id ? "編輯工作守則" : "新增工作守則"}</h2>
      <form id="rule-form" data-id="${escapeHtml(rule.id)}">
        <label class="field"><span>標題</span><input name="title" required maxlength="80" value="${escapeHtml(rule.title || "")}" placeholder="例如：休息日外出"></label>
        <label class="field"><span>守則內容</span><textarea name="body" required maxlength="2000" placeholder="寫下家中希望外傭遵守的處事方式">${escapeHtml(rule.body || "")}</textarea></label>
        <div class="btn-row">
          <button class="btn" type="submit">儲存</button>
          ${sheet.id ? `<button class="btn danger" type="button" data-action="rule-del" data-id="${rule.id}">刪除</button>` : ""}
        </div>
      </form>
    `;
  } else if (sheet.type === "shop-list") {
    body = `
      <h2>新增買餸清單</h2>
      <form id="shop-list-form">
        <label class="field"><span>清單名稱</span><input name="title" required maxlength="80" placeholder="例如：今日街市"></label>
        <label class="field"><span>地點</span>
          <select name="place">
            ${SHOP_PLACES.map((p) => `<option value="${p.id}">${p.zh}</option>`).join("")}
          </select>
        </label>
        <label class="field"><span>備註</span><textarea name="note" maxlength="500"></textarea></label>
        <div class="btn-row"><button class="btn" type="submit">建立清單</button></div>
      </form>
    `;
  } else if (sheet.type === "shop-item") {
    const item = sheet.id ? state.shopItems.find((i) => i.id === sheet.id) : newShopItem({ listId: sheet.listId, helperId: helper()?.id });
    const cat = findCatalog(state, item.name);
    const suggest = item.name && cat ? cat.lastPrice : "";
    body = `
      <h2>${sheet.id ? "編輯物品" : "加入物品"}</h2>
      <form id="shop-item-form" data-id="${escapeHtml(item.id)}" data-list="${escapeHtml(item.listId)}">
        <label class="field"><span>物品名稱</span>
          <input name="name" required maxlength="80" list="catalog-names" value="${escapeHtml(item.name || "")}" placeholder="例如：菜心">
          <datalist id="catalog-names">${(state.priceCatalog || []).map((c) => `<option value="${escapeHtml(c.name)}">`).join("")}</datalist>
        </label>
        <p class="price-hint" data-suggest>${cat ? `上次 ${formatMoney(cat.lastPrice)}${cat.lastPaidOn ? "（" + formatZh(cat.lastPaidOn, { short: true }) + "）" : ""}，可改` : "若以前買過同樣的東西，輸入名稱後會顯示上次價錢。"}</p>
        <label class="field"><span>數量或說明（可選）</span><input name="qty" maxlength="40" value="${escapeHtml(item.qty || "")}" placeholder="例如：兩斤"></label>
        <label class="field"><span>備註</span><textarea name="note" maxlength="400">${escapeHtml(item.note || "")}</textarea></label>
        <div class="field">
          <span>相片（由僱主加入，讓外傭知道要買哪一樣）</span>
          <input type="hidden" name="photo" value="${escapeHtml(item.photo || "")}">
          <button class="photo-btn" type="button" data-action="pick-photo" aria-label="加入相片">
            ${item.photo ? `<img src="${item.photo}" alt="">` : icon("camera", { size: 22 })}
          </button>
          <input type="file" accept="image/*" data-role="photo-input" hidden>
        </div>
        <label class="switch-field">
          <span>已買到</span>
          <span class="switch"><input type="checkbox" name="bought" ${item.bought ? "checked" : ""}><span></span></span>
        </label>
        <label class="field"><span>今次價錢（港元）<span class="hint">買完再入即可。下次加入同一物品會帶出上次價錢。</span></span>
          <input type="number" name="paidPrice" inputmode="decimal" min="0" step="0.1" value="${item.paidPrice ?? ""}" placeholder="${suggest}">
        </label>
        <div class="btn-row">
          <button class="btn" type="submit">儲存</button>
          ${sheet.id ? `<button class="btn danger" type="button" data-action="item-del" data-id="${item.id}">刪除</button>` : ""}
        </div>
      </form>
    `;
  }
  return `<button class="sheet-back" type="button" data-action="sheet-close" aria-label="關閉"></button>
    <div class="sheet" role="dialog" aria-modal="true">
      <div class="sheet-handle" aria-hidden="true"></div>
      ${body}
    </div>`;
}

function mainContent() {
  if (ui.tab === "role") return viewRole();
  if (role === "helper") {
    const needSession = !["h-enter", "role"].includes(ui.tab);
    if (needSession && !sessionHelper()) return viewHelperEnter();
    switch (ui.tab) {
      case "h-enter":
        return viewHelperEnter();
      case "h":
        return viewHelperHome();
      case "h-leave":
        return viewHelperLeave();
      case "h-tasks":
        return viewHelperTasks();
      case "h-rules":
        return viewHelperRules();
      case "h-shop":
        return viewHelperShop();
      case "h-shop-detail":
        return viewHelperShopDetail();
      case "h-pay":
        return viewHelperPay();
      case "h-remind":
        return viewHelperRemind();
      case "h-rights":
        return viewHelperRights();
      case "h-more":
        return viewHelperMore();
      default:
        return viewHelperHome();
    }
  }
  switch (ui.tab) {
    case "onboard":
      return viewOnboard();
    case "home":
      return viewHome();
    case "leave":
      return viewLeave();
    case "pay":
      return viewPay();
    case "remind":
      return viewRemind();
    case "tasks":
      return viewTasks();
    case "rules":
      return viewRules();
    case "shop":
      return viewShop();
    case "shop-detail":
      return viewShopDetail();
    case "share":
      return viewShare();
    case "more":
      return viewMore();
    case "guide":
      return viewGuide();
    case "backup":
      return viewBackup();
    case "helper-new":
      return viewHelperForm("new");
    case "helper-edit":
      return viewHelperForm("edit");
    default:
      return viewHome();
  }
}

function render() {
  const app = document.getElementById("app");
  if (!app) return;
  const showChrome = ui.tab !== "role" && ui.tab !== "h-enter" && !(ui.tab === "onboard" && !state.helpers.length && role === "employer");
  const sub =
    role === "helper" ? (sessionHelper()?.name ? escapeHtml(sessionHelper().name) + "　外傭版面" : "外傭版面") : "僱主版面";
  app.innerHTML = `
    ${ui.tab === "role" ? "" : header(sub)}
    <main class="main">${mainContent()}</main>
    ${tabbar()}
    ${sheetHtml()}
    ${ui.toast ? `<div class="toast" role="status">${escapeHtml(ui.toast)}</div>` : ""}
  `;
  bindAfterRender();
}

function bindAfterRender() {
  const form = document.getElementById("task-form");
  const schedule = form?.elements?.schedule;
  if (schedule) {
    schedule.addEventListener("change", () => {
      form.querySelector("[data-weekly-only]")?.toggleAttribute("hidden", schedule.value !== "weekly");
      form.querySelector("[data-once-only]")?.toggleAttribute("hidden", schedule.value !== "once");
    });
  }
  const nameInput = document.querySelector("#shop-item-form [name=name]");
  if (nameInput) {
    nameInput.addEventListener("input", () => {
      const cat = findCatalog(state, nameInput.value);
      const hint = document.querySelector("[data-suggest]");
      const price = document.querySelector("#shop-item-form [name=paidPrice]");
      if (hint) {
        hint.textContent = cat
          ? `上次 ${formatMoney(cat.lastPrice)}${cat.lastPaidOn ? "（" + formatZh(cat.lastPaidOn, { short: true }) + "）" : ""}，可改`
          : "若以前買過同樣的東西，輸入名稱後會顯示上次價錢。";
      }
      if (price && cat && (price.value === "" || price.dataset.autofilled === "1")) {
        price.placeholder = String(cat.lastPrice);
        price.dataset.autofilled = "1";
      }
    });
  }
}

function loadDemo() {
  const h = demoHelper();
  state.helpers.push(h);
  state.currentHelperId = h.id;
  save();
  toast("已載入示範資料，可隨時修改或刪除");
  setTab("home");
}

function collectHelperForm(form) {
  const fd = new FormData(form);
  const restRaw = String(fd.get("restDay") || "0");
  return normalizeHelperForm({
    id: String(fd.get("id") || "") || uid("helper"),
    name: String(fd.get("name") || ""),
    nationality: String(fd.get("nationality") || "other"),
    startDate: String(fd.get("startDate") || ""),
    contractStart: String(fd.get("contractStart") || ""),
    contractEnd: String(fd.get("contractEnd") || ""),
    wage: Number(fd.get("wage") || 0),
    foodProvided: form.elements.foodProvided?.checked,
    foodAllowance: Number(fd.get("foodAllowance") || 0),
    restDay: restRaw,
    phone: String(fd.get("phone") || ""),
    notes: String(fd.get("notes") || ""),
    visaExpiry: String(fd.get("visaExpiry") || ""),
    passportExpiry: String(fd.get("passportExpiry") || ""),
    winterChoice: helper()?.winterChoice || "christmas",
    grantGeneralHolidays: helper()?.grantGeneralHolidays || false,
  });
}

function persistSessionPayload() {
  if (helperSession) saveSession(helperSession);
}

function writeShopBackToEmployer() {
  if (!sameDeviceWriteback()) return;
  const p = sessionPayload();
  const items = p.shopItems || [];
  for (const it of items) {
    const idx = state.shopItems.findIndex((s) => s.id === it.id);
    if (idx >= 0) {
      state.shopItems[idx] = { ...state.shopItems[idx], bought: it.bought, paidPrice: it.paidPrice };
      if (it.paidPrice !== "" && it.paidPrice != null && Number(it.paidPrice) >= 0) {
        recordCatalogPrice(state, it.name, it.paidPrice, today(), "");
      }
    }
  }
  for (const list of p.shopLists || []) {
    const idx = state.shopLists.findIndex((s) => s.id === list.id);
    if (idx >= 0) state.shopLists[idx] = { ...state.shopLists[idx], status: list.status };
  }
  save();
}

async function onClick(ev) {
  const go = ev.target.closest("[data-go]");
  if (go) {
    ev.preventDefault();
    if (go.dataset.list) ui.shopListId = go.dataset.list;
    setTab(go.getAttribute("data-go"));
    return;
  }
  const sw = ev.target.closest("[data-switch]");
  if (sw) {
    state.currentHelperId = sw.getAttribute("data-switch");
    save();
    render();
    return;
  }
  const pane = ev.target.closest("[data-pane]");
  if (pane) {
    ui.leavePane = pane.getAttribute("data-pane");
    render();
    return;
  }
  const yearBtn = ev.target.closest("[data-year]");
  if (yearBtn) {
    ui.year = Number(yearBtn.getAttribute("data-year"));
    render();
    return;
  }
  const act = ev.target.closest("[data-action]");
  if (!act) return;
  const action = act.getAttribute("data-action");
  const id = act.getAttribute("data-id");
  if (action === "choose-role") {
    const next = act.getAttribute("data-role");
    if (!next) {
      setRole(null);
      ui.tab = "role";
      location.hash = "#/role";
      render();
      return;
    }
    setRole(next);
    if (next === "helper") {
      ui.tab = sessionHelper() ? "h" : "h-enter";
      location.hash = `#/${ui.tab}`;
    } else {
      ui.tab = state.helpers.length ? "home" : "onboard";
      location.hash = `#/${ui.tab}`;
    }
    render();
    return;
  }
  if (action === "load-demo") return loadDemo();
  if (action === "month-prev") {
    const d = new Date(ui.year, ui.month - 1, 1);
    ui.year = d.getFullYear();
    ui.month = d.getMonth();
    if (ui.year < YEARS[0]) ui.year = YEARS[0];
    render();
    return;
  }
  if (action === "month-next") {
    const d = new Date(ui.year, ui.month + 1, 1);
    ui.year = d.getFullYear();
    ui.month = d.getMonth();
    if (ui.year > YEARS[YEARS.length - 1] && ui.month > 0 && d.getFullYear() > YEARS[YEARS.length - 1]) {
      /* allow navigating months even around official year edges */
    }
    render();
    return;
  }
  if (action === "set-rest-policy") {
    const h = helper();
    if (!h) return;
    const value = act.getAttribute("data-value");
    h.restDay = value === REST_DAY_ARRANGED ? REST_DAY_ARRANGED : Number(value);
    save();
    toast(isArrangedRestPolicy(h.restDay) ? "已改為由僱主安排，請在年曆上點選休息日" : `已設為每週${weekdayLabel(h.restDay)}`);
    render();
    return;
  }
  if (action === "cal-day") {
    const iso = act.getAttribute("data-date");
    const h = helper();
    if (!h || !iso) return;
    if (ui.leavePane === "calc") {
      const existing = leaveLogsFor(h, "annual").find((l) => l.startDate === iso && (l.endDate || l.startDate) === iso);
      if (existing) {
        state.leaveLogs = state.leaveLogs.filter((l) => l.id !== existing.id);
        toast("已取消這一天年假");
      } else {
        state.leaveLogs.push(newLeaveLog({ helperId: h.id, type: "annual", startDate: iso, endDate: iso, days: 1 }));
        toast("已安排這一天年假");
      }
      save();
      render();
      return;
    }
    if (isArrangedRestPolicy(h.restDay)) {
      toggleArrangedRestDay(state, h.id, iso);
      save();
      render();
    }
    return;
  }
  if (action === "sh-edit") {
    ui.sheet = { type: "sh", date: act.getAttribute("data-date") };
    render();
    return;
  }
  if (action === "leave-new") {
    ui.sheet = { type: "leave" };
    render();
    return;
  }
  if (action === "leave-del") {
    state.leaveLogs = state.leaveLogs.filter((l) => l.id !== id);
    save();
    render();
    return;
  }
  if (action === "pay-new") {
    ui.sheet = { type: "pay" };
    render();
    return;
  }
  if (action === "pay-del") {
    state.payments = state.payments.filter((p) => p.id !== id);
    save();
    render();
    return;
  }
  if (action === "remind-snooze") {
    state.reminderState[id] = { ...(state.reminderState[id] || {}), snoozeUntil: snoozeUntil(today(), 7) };
    save();
    toast("7 天後再提醒");
    render();
    return;
  }
  if (action === "remind-done") {
    state.reminderState[id] = { ...(state.reminderState[id] || {}), done: true };
    save();
    render();
    return;
  }
  if (action === "task-new") {
    ui.sheet = { type: "task" };
    render();
    return;
  }
  if (action === "task-edit") {
    ui.sheet = { type: "task", id };
    render();
    return;
  }
  if (action === "task-del") {
    state.workTasks = state.workTasks.filter((t) => t.id !== id);
    save();
    ui.sheet = null;
    toast("已刪除工作安排");
    render();
    return;
  }
  if (action === "rule-new") {
    ui.sheet = { type: "rule" };
    render();
    return;
  }
  if (action === "rule-edit") {
    ui.sheet = { type: "rule", id };
    render();
    return;
  }
  if (action === "rule-del") {
    state.workRules = state.workRules.filter((r) => r.id !== id);
    save();
    ui.sheet = null;
    toast("已刪除工作守則");
    render();
    return;
  }
  if (action === "shop-new") {
    ui.sheet = { type: "shop-list" };
    render();
    return;
  }
  if (action === "item-new") {
    ui.sheet = { type: "shop-item", listId: act.getAttribute("data-list") };
    render();
    return;
  }
  if (action === "item-edit") {
    ui.sheet = { type: "shop-item", id };
    render();
    return;
  }
  if (action === "item-del") {
    state.shopItems = state.shopItems.filter((i) => i.id !== id);
    save();
    ui.sheet = null;
    render();
    return;
  }
  if (action === "shop-del") {
    const listId = act.getAttribute("data-list");
    state.shopLists = state.shopLists.filter((l) => l.id !== listId);
    state.shopItems = state.shopItems.filter((i) => i.listId !== listId);
    save();
    ui.shopListId = null;
    toast("已刪除清單");
    setTab("shop");
    return;
  }
  if (action === "shop-complete") {
    const listId = act.getAttribute("data-list");
    const list = state.shopLists.find((l) => l.id === listId);
    if (list) {
      list.status = "done";
      list.completedAt = new Date().toISOString();
      itemsForList(listId).forEach((item) => {
        if (item.paidPrice !== "" && item.paidPrice != null) {
          recordCatalogPrice(state, item.name, item.paidPrice, today(), list.place);
        }
      });
      save();
      toast("已完成，已記下今次價錢供下次參考");
      render();
    }
    return;
  }
  if (action === "shop-reopen") {
    const list = state.shopLists.find((l) => l.id === act.getAttribute("data-list"));
    if (list) {
      list.status = "open";
      list.completedAt = "";
      save();
      render();
    }
    return;
  }
  if (action === "pick-photo") {
    document.querySelector("[data-role=photo-input]")?.click();
    return;
  }
  if (action === "share-generate") {
    act.disabled = true;
    await generateShare();
    return;
  }
  if (action === "share-revoke") {
    const h = helper();
    if (!h) return;
    if (state.helperAccess[h.id]) state.helperAccess[h.id].revoked = true;
    removeInbox(h.id);
    if (helperSession?.payload?.helper?.id === h.id) {
      helperSession = null;
      saveSession(null);
    }
    ui.shareReveal = null;
    save();
    toast("已撤銷此部手機的查看方式");
    render();
    return;
  }
  if (action === "copy-pin" && ui.shareReveal) {
    try {
      await navigator.clipboard.writeText(ui.shareReveal.pin);
      toast("已複製查看密碼");
    } catch {
      toast("請手動抄下密碼");
    }
    return;
  }
  if (action === "copy-link" && ui.shareReveal) {
    try {
      await navigator.clipboard.writeText(ui.shareReveal.url);
      toast("已複製連結");
    } catch {
      toast("請手動複製連結");
    }
    return;
  }
  if (action === "copy-packed" && ui.shareReveal) {
    try {
      await navigator.clipboard.writeText(ui.shareReveal.packed);
      toast("已複製查看方式");
    } catch {
      document.getElementById("share-packed")?.select();
      toast("請長按以複製");
    }
    return;
  }
  if (action === "share-native" && ui.shareReveal) {
    const text = `請用「${APP_NAME}」開啟，查看密碼是 ${ui.shareReveal.pin}。這是你的合約、假期和工作安排副本。`;
    try {
      if (navigator.share) {
        await navigator.share({ title: APP_NAME, text, url: ui.shareReveal.url });
      } else {
        await navigator.clipboard.writeText(`${text}\n${ui.shareReveal.url}`);
        toast("已複製分享內容");
      }
    } catch {
      /* user cancelled */
    }
    return;
  }
  if (action === "sheet-close") {
    ui.sheet = null;
    render();
    return;
  }
  if (action === "do-export") return doExport();
  if (action === "helper-delete") {
    const h = helper();
    if (!h) return;
    state.helpers = state.helpers.filter((x) => x.id !== h.id);
    state.leaveLogs = state.leaveLogs.filter((l) => l.helperId !== h.id);
    state.payments = state.payments.filter((p) => p.helperId !== h.id);
    state.workTasks = state.workTasks.filter((t) => t.helperId !== h.id);
    state.workRules = state.workRules.filter((r) => r.helperId !== h.id);
    state.shopLists = state.shopLists.filter((l) => l.helperId !== h.id);
    state.shopItems = state.shopItems.filter((i) => i.helperId !== h.id);
    delete state.helperAccess[h.id];
    delete state.arrangedRestDays[h.id];
    state.currentHelperId = state.helpers[0]?.id || null;
    save();
    toast("已刪除此外傭資料");
    setTab(state.helpers.length ? "home" : "onboard");
    return;
  }
  if (action === "helper-ack") {
    const p = sessionPayload();
    if (p?.shareId) setAcked(p.shareId, act.checked);
    return;
  }
  if (action === "helper-lock") {
    helperSession = null;
    saveSession(null);
    ui.tab = "h-enter";
    location.hash = "#/h-enter";
    toast("已鎖定");
    render();
    return;
  }
  if (action === "task-done") {
    const p = sessionPayload();
    if (p?.shareId) setTaskDone(p.shareId, id, today(), act.checked);
    return;
  }
}

async function onChange(ev) {
  const el = ev.target;
  const action = el.getAttribute("data-action");
  if (action === "toggle-gh") {
    const h = helper();
    if (!h) return;
    h.grantGeneralHolidays = el.checked;
    save();
    render();
    return;
  }
  if (action === "winter-choice") {
    const h = helper();
    if (!h) return;
    h.winterChoice = el.value;
    save();
    render();
    return;
  }
  if (action === "toggle-notify") {
    await toggleNotify(el.checked);
    return;
  }
  if (action === "guide-check") {
    state.guideChecks[el.getAttribute("data-id")] = el.checked;
    save();
    return;
  }
  if (action === "do-import" && el.files?.[0]) {
    const text = await el.files[0].text();
    try {
      state = importBackup(text);
      save();
      toast("已還原備份");
      setTab("home");
    } catch (err) {
      toast(err.message || "無法還原備份");
    }
    return;
  }
  if (el.getAttribute("data-role") === "photo-input" && el.files?.[0]) {
    try {
      const dataUrl = await compressImageFile(el.files[0]);
      const hidden = document.querySelector("#shop-item-form [name=photo]");
      if (hidden) hidden.value = dataUrl;
      const btn = document.querySelector("[data-action=pick-photo]");
      if (btn) btn.innerHTML = `<img src="${dataUrl}" alt="">`;
    } catch (err) {
      toast(err.message || "無法加入相片");
    }
    return;
  }
  if (action === "h-item-bought" || action === "h-item-price") {
    const p = sessionPayload();
    if (!p) return;
    const item = (p.shopItems || []).find((i) => i.id === el.getAttribute("data-id"));
    if (!item) return;
    if (action === "h-item-bought") item.bought = el.checked;
    if (action === "h-item-price") item.paidPrice = el.value === "" ? "" : Number(el.value);
    persistSessionPayload();
    writeShopBackToEmployer();
    return;
  }
}

function onSubmit(ev) {
  const form = ev.target;
  if (!(form instanceof HTMLFormElement)) return;
  if (form.id === "helper-form") {
    ev.preventDefault();
    const data = collectHelperForm(form);
    if (!data.name) return toast("請填寫姓名");
    if (!data.startDate) return toast("請填寫開始受僱日期");
    const idx = state.helpers.findIndex((x) => x.id === data.id);
    if (idx >= 0) state.helpers[idx] = { ...state.helpers[idx], ...data };
    else state.helpers.push(data);
    state.currentHelperId = data.id;
    save();
    toast("已儲存");
    setTab("home");
  }
  if (form.id === "leave-form") {
    ev.preventDefault();
    const fd = new FormData(form);
    const start = String(fd.get("startDate") || "");
    const end = String(fd.get("endDate") || start);
    if (!start) return toast("請選擇日期");
    const days = Math.max(1, daysBetween(start, end) + 1);
    state.leaveLogs.push(
      newLeaveLog({
        helperId: helper().id,
        type: String(fd.get("type") || "annual"),
        startDate: start,
        endDate: end,
        days,
        note: String(fd.get("note") || ""),
      })
    );
    save();
    ui.sheet = null;
    toast(`已登記 ${days} 天假期`);
    render();
  }
  if (form.id === "pay-form") {
    ev.preventDefault();
    const fd = new FormData(form);
    state.payments.push(
      newPayment({
        helperId: helper().id,
        month: String(fd.get("month") || ""),
        wage: Number(fd.get("wage") || 0),
        food: Number(fd.get("food") || 0),
        adjustments: Number(fd.get("adjustments") || 0),
        paidOn: String(fd.get("paidOn") || ""),
        note: String(fd.get("note") || ""),
      })
    );
    save();
    ui.sheet = null;
    toast("已登記發薪記錄");
    render();
  }
  if (form.id === "sh-form") {
    ev.preventDefault();
    const fd = new FormData(form);
    setShStatus(helper(), form.getAttribute("data-date"), {
      status: String(fd.get("status") || "pending"),
      lieuDate: String(fd.get("lieuDate") || ""),
      note: String(fd.get("note") || ""),
    });
    ui.sheet = null;
    toast("已儲存假日安排");
    render();
  }
  if (form.id === "task-form") {
    ev.preventDefault();
    const fd = new FormData(form);
    const weekdays = [...form.querySelectorAll("[name=weekdays]:checked")].map((x) => Number(x.value));
    const rec = newWorkTask({
      id: form.getAttribute("data-id") || uid("task"),
      helperId: helper().id,
      title: String(fd.get("title") || "").trim(),
      detail: String(fd.get("detail") || "").trim(),
      schedule: String(fd.get("schedule") || "daily"),
      weekdays,
      onceDate: String(fd.get("onceDate") || ""),
      timeFrom: String(fd.get("timeFrom") || ""),
      timeTo: String(fd.get("timeTo") || ""),
      updatedAt: new Date().toISOString(),
    });
    if (!rec.title) return toast("請填寫工作名稱");
    const idx = state.workTasks.findIndex((t) => t.id === rec.id);
    if (idx >= 0) state.workTasks[idx] = { ...state.workTasks[idx], ...rec };
    else state.workTasks.push(rec);
    save();
    ui.sheet = null;
    toast("已儲存工作安排");
    render();
  }
  if (form.id === "rule-form") {
    ev.preventDefault();
    const fd = new FormData(form);
    const rec = newWorkRule({
      id: form.getAttribute("data-id") || uid("rule"),
      helperId: helper().id,
      title: String(fd.get("title") || "").trim(),
      body: String(fd.get("body") || "").trim(),
      updatedAt: new Date().toISOString(),
    });
    if (!rec.title || !rec.body) return toast("請填寫標題和內容");
    const idx = state.workRules.findIndex((r) => r.id === rec.id);
    if (idx >= 0) state.workRules[idx] = { ...state.workRules[idx], ...rec };
    else state.workRules.push(rec);
    save();
    ui.sheet = null;
    toast("已儲存工作守則");
    render();
  }
  if (form.id === "shop-list-form") {
    ev.preventDefault();
    const fd = new FormData(form);
    const rec = newShopList({
      helperId: helper().id,
      title: String(fd.get("title") || "").trim(),
      place: String(fd.get("place") || "market"),
      note: String(fd.get("note") || "").trim(),
    });
    state.shopLists.push(rec);
    save();
    ui.sheet = null;
    ui.shopListId = rec.id;
    toast("已建立清單，可以加入物品和相片");
    setTab("shop-detail");
  }
  if (form.id === "shop-item-form") {
    ev.preventDefault();
    const fd = new FormData(form);
    const listId = form.getAttribute("data-list");
    const rec = newShopItem({
      id: form.getAttribute("data-id") || uid("item"),
      listId,
      helperId: helper().id,
      name: String(fd.get("name") || "").trim(),
      note: String(fd.get("note") || "").trim(),
      qty: String(fd.get("qty") || "").trim(),
      photo: String(fd.get("photo") || ""),
      bought: form.elements.bought?.checked,
      paidPrice: String(fd.get("paidPrice") || "") === "" ? "" : Number(fd.get("paidPrice")),
    });
    if (!rec.name) return toast("請填寫物品名稱");
    const idx = state.shopItems.findIndex((i) => i.id === rec.id);
    if (idx >= 0) state.shopItems[idx] = { ...state.shopItems[idx], ...rec };
    else state.shopItems.push(rec);
    if (rec.paidPrice !== "" && rec.paidPrice != null) {
      const list = state.shopLists.find((l) => l.id === listId);
      recordCatalogPrice(state, rec.name, rec.paidPrice, today(), list?.place || "");
    }
    save();
    ui.sheet = null;
    toast("已加入物品");
    render();
  }
  if (form.id === "helper-unlock") {
    ev.preventDefault();
    unlockHelper(form);
  }
}

async function unlockHelper(form) {
  const fd = new FormData(form);
  const pin = String(fd.get("pin") || "").trim();
  let packed = String(fd.get("packed") || "").trim() || ui.pendingShare;
  ui.pinError = "";
  if (!/^\d{6}$/.test(pin)) {
    ui.pinError = "請輸入僱主提供的 6 位查看密碼。";
    render();
    return;
  }
  const tries = [];
  if (packed) tries.push(packed);
  for (const item of loadInbox()) {
    if (item.packed && !tries.includes(item.packed)) tries.push(item.packed);
  }
  if (!tries.length) {
    ui.pinError = "尚未收到查看方式。請開啟僱主傳來的連結，或把查看方式文字貼在上面。";
    render();
    return;
  }
  for (const pack of tries) {
    try {
      const payload = await decryptShare(pack, pin);
      if (!payload?.helper) continue;
      helperSession = { payload, unlockedAt: new Date().toISOString() };
      saveSession(helperSession);
      setRole("helper");
      ui.pendingShare = "";
      ui.pinError = "";
      if (location.hash.startsWith("#/v/")) history.replaceState(null, "", "#/h");
      ui.tab = "h";
      location.hash = "#/h";
      toast(`已開啟 ${payload.helper.name || "你的資料"}`);
      render();
      return;
    } catch {
      /* try next */
    }
  }
  ui.pinError = "查看密碼不正確，或這份查看方式已失效。請向僱主確認是否已重新產生。";
  render();
}

function doExport() {
  const { blob, filename } = exportBackup(state);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast("已匯出備份");
}

async function toggleNotify(on) {
  if (!("Notification" in window)) {
    toast("這個瀏覽器不支援系統通知");
    state.settings.notifications = false;
    save();
    render();
    return;
  }
  if (!on) {
    state.settings.notifications = false;
    save();
    render();
    return;
  }
  const perm = await Notification.requestPermission();
  state.settings.notifications = perm === "granted";
  save();
  if (perm === "granted") {
    try {
      new Notification(APP_NAME, { body: "已開啟通知。有重要日子時會在這裏提示你。", lang: "zh-HK" });
    } catch {
      /* ignore */
    }
    toast("已開啟系統通知");
  } else {
    toast("未取得通知權限，仍可在應用內查看提醒");
  }
  render();
}

function maybeNotify() {
  if (!state.settings.notifications || !("Notification" in window) || Notification.permission !== "granted") return;
  const t = today();
  const key = `fdh-notified-${t}`;
  if (sessionStorage.getItem(key)) return;
  const items = state.helpers
    .flatMap((h) => buildReminders(h, t, { arrangedRestDays: arrangedFor(h) }))
    .filter((r) => isReminderVisible(r, state.reminderState, t) && ["expired", "critical", "soon"].includes(r.urgency));
  if (!items.length) return;
  sessionStorage.setItem(key, "1");
  try {
    new Notification(APP_NAME, { body: items[0].title, lang: "zh-HK" });
  } catch {
    /* ignore */
  }
}

function registerSW() {
  if (!("serviceWorker" in navigator)) return;
  if (location.protocol === "file:") return;
  navigator.serviceWorker.register("./sw.js").catch(() => {});
}

window.addEventListener("hashchange", () => {
  parseHash();
  render();
});
document.addEventListener("click", onClick);
document.addEventListener("change", onChange);
document.addEventListener("submit", onSubmit);

parseHash();
if (!role && ui.tab !== "h-enter") ui.tab = "role";
if (role === "employer" && !state.helpers.length && !["helper-new", "onboard", "role"].includes(ui.tab)) ui.tab = "onboard";
if (role === "helper" && !sessionHelper() && ui.tab !== "role") ui.tab = "h-enter";
render();
registerSW();
maybeNotify();
