/* Official rates, holiday calendars, and static content.
   See /SOURCES.md for government URLs. Do not invent dates or wage rates. */

export const APP_NAME = "外傭僱傭助手";
export const DATA_VERSION = 2;

/** Minimum Allowable Wage and food allowance history (official announcements). */
export const MAW_HISTORY = [
  {
    wage: 5220,
    food: 1236,
    effectiveFrom: "2026-10-03",
    announcedOn: "2026-10-02",
    source: "https://www.info.gov.hk/gia/general/202610/02/P2026100200396.htm",
  },
  {
    wage: 5100,
    food: 1236,
    effectiveFrom: "2025-09-30",
    announcedOn: "2025-09-29",
    source: "https://www.info.gov.hk/gia/general/202509/29/P2025092900318.htm",
  },
  {
    wage: 4990,
    food: 1236,
    effectiveFrom: "2024-09-28",
    announcedOn: "2024-09-27",
    source: "https://www.info.gov.hk/gia/general/202409/27/P2024092700236.htm",
  },
];

export const CURRENT_MAW = MAW_HISTORY[0];

export const OFFICIAL_LINKS = {
  fdhPortal: "https://www.fdh.labour.gov.hk/tc/home.html",
  fdhFaq: "https://www.fdh.labour.gov.hk/tc/faq.html",
  employerCorner: "https://www.fdh.labour.gov.hk/tc/employer_corner.html",
  practicalGuide: "https://www.fdh.labour.gov.hk/res/pdf/FDHguideChinese.pdf",
  handyEmployerGuide: "https://www.fdh.labour.gov.hk/res/pdf/HandyGuideForEmployersOfFDHs_Chinese.pdf",
  employmentOrdinanceSH: "https://www.labour.gov.hk/tc/faq/cap57f_whole.htm",
  employmentOrdinanceSick: "https://www.labour.gov.hk/tc/faq/cap57g_whole.htm",
  sh2025: "https://www.labour.gov.hk/tc/news/latest_holidays2025.htm",
  sh2026: "https://www.labour.gov.hk/tc/news/latest_holidays2026.htm",
  sh2027: "https://www.labour.gov.hk/tc/news/latest_holidays2027.htm",
  shList: "https://www.labour.gov.hk/tc/news/holidays_list.htm",
  gh2025: "https://www.gov.hk/tc/about/abouthk/holiday/2025.htm",
  gh2026: "https://www.gov.hk/tc/about/abouthk/holiday/2026.htm",
  gh2027: "https://www.gov.hk/tc/about/abouthk/holiday/2027.htm",
  immdFdh: "https://www.immd.gov.hk/hkt/services/visas/foreign_domestic_helpers.html",
  id407: "https://www.immd.gov.hk/hkt/forms/forms/id407.html",
  contractTerms: "https://www.immd.gov.hk/hkt/forms/forms/fdhcontractterms.html",
  maw2026: "https://www.info.gov.hk/gia/general/202610/02/P2026100200396.htm",
  labourHotlineNote: "https://www.fdh.labour.gov.hk/tc/employer_corner.html",
};

/**
 * Official statutory holidays (法定假日) published by the Labour Department.
 * Winter Solstice or Christmas is an employer choice — one day only.
 */
export const STATUTORY_HOLIDAYS = {
  2025: [
    { date: "2025-01-01", nameZh: "1月1日", nameEn: "The first day of January" },
    { date: "2025-01-29", nameZh: "農曆年初一", nameEn: "Lunar New Year's Day" },
    { date: "2025-01-30", nameZh: "農曆年初二", nameEn: "The second day of Lunar New Year" },
    { date: "2025-01-31", nameZh: "農曆年初三", nameEn: "The third day of Lunar New Year" },
    { date: "2025-04-04", nameZh: "清明節", nameEn: "Ching Ming Festival" },
    { date: "2025-05-01", nameZh: "勞動節", nameEn: "Labour Day" },
    { date: "2025-05-05", nameZh: "佛誕", nameEn: "The Birthday of the Buddha" },
    { date: "2025-05-31", nameZh: "端午節", nameEn: "Tuen Ng Festival" },
    { date: "2025-07-01", nameZh: "香港特別行政區成立紀念日", nameEn: "HKSAR Establishment Day" },
    { date: "2025-10-01", nameZh: "國慶日", nameEn: "National Day" },
    { date: "2025-10-07", nameZh: "中秋節翌日", nameEn: "The day following the Chinese Mid-Autumn Festival" },
    { date: "2025-10-29", nameZh: "重陽節", nameEn: "Chung Yeung Festival" },
    {
      choice: "winter-or-christmas",
      winter: "2025-12-21",
      christmas: "2025-12-25",
      nameZh: "冬節或聖誕節",
      nameEn: "Chinese Winter Solstice Festival or Christmas Day",
    },
    { date: "2025-12-26", nameZh: "聖誕節後第一個周日", nameEn: "The first weekday after Christmas Day" },
  ],
  2026: [
    { date: "2026-01-01", nameZh: "1月1日", nameEn: "The first day of January" },
    { date: "2026-02-17", nameZh: "農曆年初一", nameEn: "Lunar New Year's Day" },
    { date: "2026-02-18", nameZh: "農曆年初二", nameEn: "The second day of Lunar New Year" },
    { date: "2026-02-19", nameZh: "農曆年初三", nameEn: "The third day of Lunar New Year" },
    { date: "2026-04-05", nameZh: "清明節", nameEn: "Ching Ming Festival" },
    { date: "2026-04-06", nameZh: "復活節星期一", nameEn: "Easter Monday", noteZh: "由2026年起新增為法定假日" },
    { date: "2026-05-01", nameZh: "勞動節", nameEn: "Labour Day" },
    { date: "2026-05-24", nameZh: "佛誕", nameEn: "The Birthday of the Buddha" },
    { date: "2026-06-19", nameZh: "端午節", nameEn: "Tuen Ng Festival" },
    { date: "2026-07-01", nameZh: "香港特別行政區成立紀念日", nameEn: "HKSAR Establishment Day" },
    { date: "2026-09-26", nameZh: "中秋節翌日", nameEn: "The day following the Chinese Mid-Autumn Festival" },
    { date: "2026-10-01", nameZh: "國慶日", nameEn: "National Day" },
    { date: "2026-10-18", nameZh: "重陽節", nameEn: "Chung Yeung Festival" },
    {
      choice: "winter-or-christmas",
      winter: "2026-12-22",
      christmas: "2026-12-25",
      nameZh: "冬節或聖誕節",
      nameEn: "Chinese Winter Solstice Festival or Christmas Day",
    },
    { date: "2026-12-26", nameZh: "聖誕節後第一個周日", nameEn: "The first weekday after Christmas Day" },
  ],
  2027: [
    { date: "2027-01-01", nameZh: "1月1日", nameEn: "The first day of January" },
    { date: "2027-02-06", nameZh: "農曆年初一", nameEn: "Lunar New Year's Day" },
    { date: "2027-02-08", nameZh: "農曆年初三", nameEn: "The third day of Lunar New Year" },
    {
      date: "2027-02-09",
      nameZh: "農曆年初四",
      nameEn: "The fourth day of Lunar New Year",
      noteZh: "2027年農曆年初二適逢星期日，依法以年初四作為法定假日",
    },
    { date: "2027-03-29", nameZh: "復活節星期一", nameEn: "Easter Monday" },
    { date: "2027-04-05", nameZh: "清明節", nameEn: "Ching Ming Festival" },
    { date: "2027-05-01", nameZh: "勞動節", nameEn: "Labour Day" },
    { date: "2027-05-13", nameZh: "佛誕", nameEn: "The Birthday of the Buddha" },
    { date: "2027-06-09", nameZh: "端午節", nameEn: "Tuen Ng Festival" },
    { date: "2027-07-01", nameZh: "香港特別行政區成立紀念日", nameEn: "HKSAR Establishment Day" },
    { date: "2027-09-16", nameZh: "中秋節翌日", nameEn: "The day following the Chinese Mid-Autumn Festival" },
    { date: "2027-10-01", nameZh: "國慶日", nameEn: "National Day" },
    { date: "2027-10-08", nameZh: "重陽節", nameEn: "Chung Yeung Festival" },
    {
      choice: "winter-or-christmas",
      winter: "2027-12-22",
      christmas: "2027-12-25",
      nameZh: "冬節或聖誕節",
      nameEn: "Chinese Winter Solstice Festival or Christmas Day",
    },
    { date: "2027-12-27", nameZh: "聖誕節後第一個周日", nameEn: "The first weekday after Christmas Day" },
  ],
};

export const SH_YEARS = Object.keys(STATUTORY_HOLIDAYS).map(Number).sort();

/** Official general holidays (公眾假期 / 通用假期), excluding “every Sunday”. */
export const GENERAL_HOLIDAYS = {
  2025: [
    { date: "2025-01-01", nameZh: "一月一日", nameEn: "The first day of January" },
    { date: "2025-01-29", nameZh: "農曆年初一", nameEn: "Lunar New Year's Day" },
    { date: "2025-01-30", nameZh: "農曆年初二", nameEn: "The second day of Lunar New Year" },
    { date: "2025-01-31", nameZh: "農曆年初三", nameEn: "The third day of Lunar New Year" },
    { date: "2025-04-04", nameZh: "清明節", nameEn: "Ching Ming Festival" },
    { date: "2025-04-18", nameZh: "耶穌受難節", nameEn: "Good Friday" },
    { date: "2025-04-19", nameZh: "耶穌受難節翌日", nameEn: "The day following Good Friday" },
    { date: "2025-04-21", nameZh: "復活節星期一", nameEn: "Easter Monday" },
    { date: "2025-05-01", nameZh: "勞動節", nameEn: "Labour Day" },
    { date: "2025-05-05", nameZh: "佛誕", nameEn: "The Birthday of the Buddha" },
    { date: "2025-05-31", nameZh: "端午節", nameEn: "Tuen Ng Festival" },
    { date: "2025-07-01", nameZh: "香港特別行政區成立紀念日", nameEn: "HKSAR Establishment Day" },
    { date: "2025-10-01", nameZh: "國慶日", nameEn: "National Day" },
    { date: "2025-10-07", nameZh: "中秋節翌日", nameEn: "The day following the Chinese Mid-Autumn Festival" },
    { date: "2025-10-29", nameZh: "重陽節", nameEn: "Chung Yeung Festival" },
    { date: "2025-12-25", nameZh: "聖誕節", nameEn: "Christmas Day" },
    { date: "2025-12-26", nameZh: "聖誕節後第一個周日", nameEn: "The first weekday after Christmas Day" },
  ],
  2026: [
    { date: "2026-01-01", nameZh: "一月一日", nameEn: "The first day of January" },
    { date: "2026-02-17", nameZh: "農曆年初一", nameEn: "Lunar New Year's Day" },
    { date: "2026-02-18", nameZh: "農曆年初二", nameEn: "The second day of Lunar New Year" },
    { date: "2026-02-19", nameZh: "農曆年初三", nameEn: "The third day of Lunar New Year" },
    { date: "2026-04-03", nameZh: "耶穌受難節", nameEn: "Good Friday" },
    { date: "2026-04-04", nameZh: "耶穌受難節翌日", nameEn: "The day following Good Friday" },
    { date: "2026-04-06", nameZh: "清明節翌日", nameEn: "The day following Ching Ming Festival" },
    { date: "2026-04-07", nameZh: "復活節星期一翌日", nameEn: "The day following Easter Monday" },
    { date: "2026-05-01", nameZh: "勞動節", nameEn: "Labour Day" },
    { date: "2026-05-25", nameZh: "佛誕翌日", nameEn: "The day following the Birthday of the Buddha" },
    { date: "2026-06-19", nameZh: "端午節", nameEn: "Tuen Ng Festival" },
    { date: "2026-07-01", nameZh: "香港特別行政區成立紀念日", nameEn: "HKSAR Establishment Day" },
    { date: "2026-09-26", nameZh: "中秋節翌日", nameEn: "The day following the Chinese Mid-Autumn Festival" },
    { date: "2026-10-01", nameZh: "國慶日", nameEn: "National Day" },
    { date: "2026-10-19", nameZh: "重陽節翌日", nameEn: "The day following Chung Yeung Festival" },
    { date: "2026-12-25", nameZh: "聖誕節", nameEn: "Christmas Day" },
    { date: "2026-12-26", nameZh: "聖誕節後第一個周日", nameEn: "The first weekday after Christmas Day" },
  ],
  2027: [
    { date: "2027-01-01", nameZh: "一月一日", nameEn: "The first day of January" },
    { date: "2027-02-06", nameZh: "農曆年初一", nameEn: "Lunar New Year's Day" },
    { date: "2027-02-08", nameZh: "農曆年初三", nameEn: "The third day of Lunar New Year" },
    { date: "2027-02-09", nameZh: "農曆年初四", nameEn: "The fourth day of Lunar New Year" },
    { date: "2027-03-26", nameZh: "耶穌受難節", nameEn: "Good Friday" },
    { date: "2027-03-27", nameZh: "耶穌受難節翌日", nameEn: "The day following Good Friday" },
    { date: "2027-03-29", nameZh: "復活節星期一", nameEn: "Easter Monday" },
    { date: "2027-04-05", nameZh: "清明節", nameEn: "Ching Ming Festival" },
    { date: "2027-05-01", nameZh: "勞動節", nameEn: "Labour Day" },
    { date: "2027-05-13", nameZh: "佛誕", nameEn: "The Birthday of the Buddha" },
    { date: "2027-06-09", nameZh: "端午節", nameEn: "Tuen Ng Festival" },
    { date: "2027-07-01", nameZh: "香港特別行政區成立紀念日", nameEn: "HKSAR Establishment Day" },
    { date: "2027-09-16", nameZh: "中秋節翌日", nameEn: "The day following the Chinese Mid-Autumn Festival" },
    { date: "2027-10-01", nameZh: "國慶日", nameEn: "National Day" },
    { date: "2027-10-08", nameZh: "重陽節", nameEn: "Chung Yeung Festival" },
    { date: "2027-12-25", nameZh: "聖誕節", nameEn: "Christmas Day" },
    { date: "2027-12-27", nameZh: "聖誕節後第一個周日", nameEn: "The first weekday after Christmas Day" },
  ],
};

/** Paid annual leave days after completing each year of service with the same employer. */
export const ANNUAL_LEAVE_BY_YEAR = {
  1: 7,
  2: 7,
  3: 8,
  4: 9,
  5: 10,
  6: 11,
  7: 12,
  8: 13,
  9: 14,
};

export const NATIONALITIES = [
  { id: "philippines", zh: "菲律賓", en: "Philippines" },
  { id: "indonesia", zh: "印尼", en: "Indonesia" },
  { id: "thailand", zh: "泰國", en: "Thailand" },
  { id: "india", zh: "印度", en: "India" },
  { id: "sri-lanka", zh: "斯里蘭卡", en: "Sri Lanka" },
  { id: "bangladesh", zh: "孟加拉", en: "Bangladesh" },
  { id: "myanmar", zh: "緬甸", en: "Myanmar" },
  { id: "other", zh: "其他", en: "Other" },
];

export const WEEKDAYS = [
  { id: 0, zh: "星期日", en: "Sunday", shortZh: "日", shortEn: "Sun" },
  { id: 1, zh: "星期一", en: "Monday", shortZh: "一", shortEn: "Mon" },
  { id: 2, zh: "星期二", en: "Tuesday", shortZh: "二", shortEn: "Tue" },
  { id: 3, zh: "星期三", en: "Wednesday", shortZh: "三", shortEn: "Wed" },
  { id: 4, zh: "星期四", en: "Thursday", shortZh: "四", shortEn: "Thu" },
  { id: 5, zh: "星期五", en: "Friday", shortZh: "五", shortEn: "Fri" },
  { id: 6, zh: "星期六", en: "Saturday", shortZh: "六", shortEn: "Sat" },
];

/** Sentinel value: rest days are placed on the calendar by the employer. */
export const REST_DAY_ARRANGED = "arranged";

export const REST_DAY_OPTIONS = [
  ...WEEKDAYS,
  { id: REST_DAY_ARRANGED, zh: "由僱主安排", en: "Arranged by employer", shortZh: "安排", shortEn: "Arr." },
];

export const TASK_SCHEDULES = [
  { id: "daily", zh: "每日", en: "Every day" },
  { id: "weekdays", zh: "星期一至五", en: "Weekdays" },
  { id: "weekly", zh: "每週指定日子", en: "Selected weekdays" },
  { id: "once", zh: "指定日期", en: "On a set date" },
];

export const LEAVE_TYPES = [
  { id: "statutory", zh: "法定假日", en: "Statutory holiday" },
  { id: "annual", zh: "年假", en: "Annual leave" },
  { id: "rest-swap", zh: "休息日對調", en: "Substituted rest day" },
  { id: "unpaid", zh: "無薪假", en: "Unpaid leave" },
  { id: "sick", zh: "病假", en: "Sick leave" },
  { id: "general", zh: "額外公眾假期", en: "Extra general holiday" },
];

export const SH_STATUSES = [
  { id: "pending", zh: "待安排", en: "Pending" },
  { id: "taken", zh: "已放假", en: "Taken" },
  { id: "worked-lieu", zh: "已工作，待補／已補假", en: "Worked, lieu arranged" },
];

/**
 * Practical hiring / employment checklist, grounded in official Labour and
 * Immigration materials. Copy is plain 香港書面語, not a legal restatement.
 */
export const GUIDE_SECTIONS = [
  {
    id: "contract",
    titleZh: "標準僱傭合約（ID 407）",
    titleEn: "Standard Employment Contract (ID 407)",
    bodyZh:
      "在香港聘用外傭，必須使用入境事務處指定的「標準僱傭合約」（表格 ID 407）。這是唯一獲承認的外傭僱傭合約，其他私下另訂的合約一般不能在香港強制執行。合約期通常為兩年。僱主須向外傭支付不少於申請當日有效的規定最低工資（最低許可工資）。",
    bodyEn:
      "Hiring an FDH in Hong Kong requires the Immigration Department’s Standard Employment Contract (Form ID 407). It is the only official FDH contract. The term is usually two years. Wages must be no less than the Minimum Allowable Wage in force on the date of the application.",
    links: [
      { zh: "入境處：外籍家庭傭工", en: "ImmD: Foreign Domestic Helpers", href: OFFICIAL_LINKS.immdFdh },
      { zh: "標準僱傭合約 ID 407", en: "ID 407", href: OFFICIAL_LINKS.id407 },
    ],
  },
  {
    id: "live-in",
    titleZh: "留宿及只可在訂明住址工作",
    titleEn: "Live-in rule and workplace",
    bodyZh:
      "外傭必須在合約列明的僱主住址工作和居住（少數在2003年4月1日前已獲入境處批准在外住宿的安排除外）。「留宿規定」適用於整個受僱期間，包括在港放取休息日、法定假日和年假期間。僱主須免費提供合適、有合理私隱、並設有傢具的居所。不適當的住宿例子包括在走廊設臨時床鋪，或要求外傭與一名異性成年／青少年同房。",
    bodyEn:
      "The helper must live and work at the employer’s address stated in the contract (with limited historic exceptions). Suitable free accommodation with reasonable privacy and furniture must be provided.",
    links: [{ zh: "入境處說明", en: "ImmD guidance", href: OFFICIAL_LINKS.immdFdh }],
  },
  {
    id: "no-other-work",
    titleZh: "不得指派到其他住戶或非家務工作",
    titleEn: "No work for other households or businesses",
    bodyZh:
      "外傭只可為合約訂明的僱主，在訂明住址料理家務，不得受僱於任何其他人士或從事其他職務。僱主亦不得著令或安排外傭到其他住戶、其他地址或從事非家務／商業工作。違反逗留條件，外傭及教唆者都可能被檢控，日後聘用或簽證申請亦可能受影響。",
    bodyEn:
      "The helper may only perform domestic duties for the named employer at the contract address. Assigning the helper to another household, another address, or non-domestic work may be a criminal offence.",
    links: [{ zh: "勞工處僱主專區", en: "LD employer corner", href: OFFICIAL_LINKS.employerCorner }],
  },
  {
    id: "wages",
    titleZh: "工資、最低許可工資及食物津貼",
    titleEn: "Wages, MAW and food allowance",
    bodyZh:
      "僱主絕不可擅自或與外傭私下協議，給予低於當時規定最低工資的薪酬。工資須每月至少支付一次，並不得遲於工資期屆滿後7天。建議以銀行轉帳或支票支付，並保留紀錄，請外傭簽收。根據標準合約，僱主須提供免費膳食；如不提供免費食物，則須支付不少於官方訂明的食物津貼。現時（適用於2026年10月3日或之後簽訂的合約）最低許可工資為每月5,220元，食物津貼不少於每月1,236元。較早簽訂的合約，仍以該份合約寫明的工資及當時適用的最低許可工資為準。",
    bodyEn:
      "Never agree a wage below the prevailing Minimum Allowable Wage. Pay at least once a month, and no later than 7 days after the wage period ends. Provide free food, or a food allowance of at least the official minimum. For contracts signed on or after 3 October 2026, the MAW is $5,220 and the food allowance is at least $1,236.",
    links: [
      { zh: "2026年最低許可工資公布", en: "2026 MAW announcement", href: OFFICIAL_LINKS.maw2026 },
      { zh: "僱主專區：工資", en: "Employer corner: wages", href: OFFICIAL_LINKS.employerCorner },
    ],
  },
  {
    id: "rest-holidays",
    titleZh: "休息日、法定假日與年假",
    titleEn: "Rest days, statutory holidays and annual leave",
    bodyZh:
      "外傭享有休息日、法定假日及有薪年假，三者分開計算，不能互相取代。每7天須給予不少於1個連續24小時的休息日；僱主不可強迫外傭在休息日工作。法定假日並非自動等於所有公眾假期（銀行假）。不論年資長短，外傭都有權放法定假日；但須按連續性合約受僱滿3個月，該法定假日才享有假日薪酬。僱主不得以款項代替法定假日（不可「買假」）。如需在法定假日工作，須至少提前48小時通知，並在該日之前或之後60天內安排另定假日。外傭為同一僱主每工作滿12個月，享有有薪年假：第1及第2年各7天，其後按年增加1天，最多14天。年假期內遇上的休息日或法定假日，不應算作年假日數。",
    bodyEn:
      "Rest days, statutory holidays and paid annual leave are separate entitlements. Grant at least one 24-hour rest day in every 7 days. FDHs are entitled to statutory holidays, not automatically all general holidays. Holiday pay usually requires 3 months’ continuous service. Payment in lieu of a statutory holiday is not allowed. Paid annual leave vests after 12 months (7 days in years 1–2, then rising to 14).",
    links: [
      { zh: "《僱傭條例》法定假日說明", en: "EO statutory holidays", href: OFFICIAL_LINKS.employmentOrdinanceSH },
      { zh: "勞工處法定假日一覽", en: "LD holiday list", href: OFFICIAL_LINKS.shList },
    ],
  },
  {
    id: "insurance-medical",
    titleZh: "勞保、醫療與職業安全",
    titleEn: "Insurance, medical care and safety",
    bodyZh:
      "僱主必須為外傭投購僱員補償保險（勞保），承擔外傭因工受傷時的法律責任。除勞保外，亦應考慮投購醫療保險。根據標準合約，外傭在受僱期間（但不包括其自願因私人理由離港期間）生病或受傷，不論是否因工作引致，僱主須提供免費醫療，包括診症、住院及牙科急診。外傭須接受僱主提供的註冊醫生診治。家中應備有簡單急救用品，並告知存放位置。清潔窗外的一面須遵守標準合約的安全規定，外傭可拒絕不符合規定的外窗清潔工作。如發生工傷，須在14天內（死亡個案為7天）向勞工處呈報。",
    bodyEn:
      "Employees’ compensation insurance is mandatory. The standard contract also requires the employer to provide free medical treatment if the helper is ill or injured during employment (with limited exceptions). Follow the contract rules on cleaning external windows. Report work injuries to the Labour Department within 14 days (7 days in fatal cases).",
    links: [{ zh: "僱主專區：保險與醫療", en: "Employer corner", href: OFFICIAL_LINKS.employerCorner }],
  },
  {
    id: "documents",
    titleZh: "證件、私隱與相處",
    titleEn: "Documents, privacy and daily life",
    bodyZh:
      "僱主不應扣留外傭的護照、身分證明或其他個人證件。證件屬於外傭本人，扣留證件可構成嚴重問題，亦容易引起爭議。請尊重外傭的私隱：給予足夠空間放置私人物品，不要隨意翻查，亦避免干預休息時間的活動。外傭來自不同文化和宗教背景，安排家務和膳食時應先了解（例如是否處理豬肉、是否需要素食）。請給予足夠睡眠和休息；若需要夜間工作，應在日間提供足夠休息。僱主不應牽涉在外傭的財務借貸事宜中。",
    bodyEn:
      "Do not withhold the helper’s passport or identity documents. Respect privacy, cultural and religious needs, and provide enough rest. Employers should not get involved in the helper’s personal loans.",
    links: [
      { zh: "實用指南（PDF）", en: "Practical Guide (PDF)", href: OFFICIAL_LINKS.practicalGuide },
      { zh: "僱主專區：相處須知", en: "Getting along", href: OFFICIAL_LINKS.employerCorner },
    ],
  },
  {
    id: "end-renew",
    titleZh: "合約屆滿、終止與續約",
    titleEn: "Expiry, termination and renewal",
    bodyZh:
      "合約完成或提早終止後，僱主須提供返回原居地的免費機票和旅費，並清付工資及《僱傭條例》下應付的其他款項。非合約屆滿而終止時，任何一方一般須給予1個月書面通知，或支付1個月工資作為代通知金。雙方須在合約終止後7天內通知入境處。如雙方同意續約，外傭通常須在新合約生效前，由僱主支付費用返回原居地放取不少於7天的有薪或無薪假期（除非事先獲入境處處長批准延期逗留）。續約屬新的簽證申請，請預早準備文件；入境處一般建議在現有合約屆滿前約8星期提交申請。本應用會在屆滿前90天及30天作出規劃提醒，方便你更早開始準備。",
    bodyEn:
      "At the end of the contract, the employer must provide return passage and settle outstanding payments. Early termination usually requires one month’s notice or payment in lieu, and ImmD must be notified within 7 days. On renewal, the helper generally returns home for at least 7 days at the employer’s expense, unless ImmD approves otherwise. Start paperwork early; ImmD typically expects applications about 8 weeks before expiry.",
    links: [
      { zh: "入境處：外籍家庭傭工", en: "ImmD FDH page", href: OFFICIAL_LINKS.immdFdh },
      { zh: "常見問題：假期與續約", en: "FAQ", href: OFFICIAL_LINKS.fdhFaq },
    ],
  },
  {
    id: "eligibility",
    titleZh: "聘用資格與職業介紹所",
    titleEn: "Employer eligibility and agencies",
    bodyZh:
      "一般來說，以每聘用一名外傭計算，僱主家庭入息須不少於每月15,000元，或擁有款額相若的資產，足以在整個合約期內僱用該名外傭。此數額可由政府不時調整。並非必須經職業介紹所聘請，但如使用介紹所，應先查核是否領有勞工處有效牌照，並簽訂書面服務協議、索取收據。香港政府沒有規定必須經介紹所，但個別來源國或會有規定。",
    bodyEn:
      "As a general guide, household income should be at least $15,000 per month for each helper, or equivalent assets. This figure may be revised. Agencies must be licensed; a written service agreement and receipts are recommended.",
    links: [{ zh: "入境處申請資格", en: "ImmD eligibility", href: OFFICIAL_LINKS.immdFdh }],
  },
  {
    id: "help",
    titleZh: "遇到問題向何處求助",
    titleEn: "Where to get help",
    bodyZh:
      "本應用只是規劃工具，不是法律意見。有關僱傭合約或《僱傭條例》的問題，可向勞工處勞資關係科查詢或要求調停。勞工處熱線：2717 1771（由1823接聽）。入境簽證及聘用手續：入境處熱線 2824 6111。職業介紹所規管：2115 3667。本應用不會代你向政府提交任何申請。",
    bodyEn:
      "This app is a planning tool, not legal advice. For Employment Ordinance questions, contact the Labour Department on 2717 1771 (1823). For visas, call ImmD on 2824 6111.",
    links: [
      { zh: "勞工處外傭專頁", en: "LD FDH portal", href: OFFICIAL_LINKS.fdhPortal },
      { zh: "僱用外傭實用指南（PDF）", en: "Practical Guide (PDF)", href: OFFICIAL_LINKS.practicalGuide },
    ],
  },
];

export const DEMO_HELPER = {
  name: "Maria Santos",
  nationality: "philippines",
  startDate: "2026-02-01",
  contractStart: "2026-02-01",
  contractEnd: "2028-01-31",
  wage: 5220,
  foodProvided: true,
  foodAllowance: 1236,
  restDay: 0,
  phone: "",
  notes: "示範資料：2026年2月1日開始的兩年合約，可隨意修改或刪除。",
  winterChoice: "christmas",
  grantGeneralHolidays: false,
};

export const GUIDE_CHECKLIST_DEFAULTS = GUIDE_SECTIONS.map((s) => s.id);

export const SHOP_PLACES = [
  { id: "market", zh: "街市" },
  { id: "supermarket", zh: "超市" },
  { id: "other", zh: "其他" },
];

/**
 * Rights and notes written for the helper, grounded in the same official
 * Labour Department and Immigration materials as GUIDE_SECTIONS.
 * This is not legal advice and does not add unofficial rules.
 */
export const HELPER_GUIDE_SECTIONS = [
  {
    id: "contract",
    titleZh: "你的僱傭合約",
    bodyZh:
      "在香港工作，你與僱主必須簽署入境事務處指定的「標準僱傭合約」（表格 ID 407）。這是唯一獲承認的外傭僱傭合約。合約期通常為兩年。合約寫明的每月工資，不可低於簽署／申請當時的最低許可工資。請自行保管合約副本，方便核對工資、休息日、住址和到期日。",
    links: [
      { zh: "入境處：外籍家庭傭工", href: OFFICIAL_LINKS.immdFdh },
      { zh: "標準僱傭合約 ID 407", href: OFFICIAL_LINKS.id407 },
    ],
  },
  {
    id: "live-in",
    titleZh: "住所與工作地點",
    bodyZh:
      "你須在合約列明的僱主住址工作和居住（少數在2003年4月1日前已獲入境處批准在外住宿的安排除外）。即使在港放取休息日、法定假日或年假，一般仍須遵守留宿規定。僱主須免費提供合適、有合理私隱、並設有傢具的居所。不適當的住宿例如在走廊設臨時床鋪，或要求你與一名異性成年／青少年同房。",
    links: [{ zh: "入境處說明", href: OFFICIAL_LINKS.immdFdh }],
  },
  {
    id: "no-other-work",
    titleZh: "只可為這份合約工作",
    bodyZh:
      "你只可為合約訂明的僱主，在訂明住址料理家務，不得受僱於其他人士或從事其他職務。僱主亦不得安排你到其他住戶、其他地址，或做非家務／商業工作。違反逗留條件，外傭及教唆者都可能被檢控，日後的簽證申請亦可能受影響。",
    links: [{ zh: "勞工處外傭專頁", href: OFFICIAL_LINKS.fdhPortal }],
  },
  {
    id: "wages",
    titleZh: "工資與食物",
    bodyZh:
      "僱主不可與你私下協議，給予低於當時最低許可工資的薪酬。工資須每月至少支付一次，並不得遲於工資期屆滿後7天。建議以銀行轉帳或支票收取，並保留紀錄、簽署收條。根據標準合約，僱主須提供免費膳食；如不提供免費食物，則須支付不少於官方訂明的食物津貼。現時（適用於2026年10月3日或之後簽訂的合約）最低許可工資為每月5,220元，食物津貼不少於每月1,236元。較早簽訂的合約，仍以該份合約寫明的工資為準。",
    links: [
      { zh: "2026年最低許可工資公布", href: OFFICIAL_LINKS.maw2026 },
      { zh: "勞工處常見問題", href: OFFICIAL_LINKS.fdhFaq },
    ],
  },
  {
    id: "rest-holidays",
    titleZh: "休息日、法定假日與年假",
    bodyZh:
      "休息日、法定假日及有薪年假是三項分開的權利，不能互相取代。每7天你應享有不少於1個連續24小時的休息日；僱主不可強迫你在休息日工作。你享有的是《僱傭條例》下的法定假日，並非自動享有所有公眾假期（銀行假）。不論年資長短，你都有權放法定假日；但須在緊接該法定假日之前已按連續性合約受僱滿3個月，才享有假日薪酬。僱主不得以款項代替法定假日。如須在法定假日工作，僱主須至少提前48小時通知，並在該日之前或之後60天內安排另定假日。為同一僱主工作滿12個月後，可享有薪年假：第1及第2年各7天，其後按年增加1天，最多14天。年假期內遇上的休息日或法定假日，不應算作年假日數。年假日期應雙方商議，僱主須至少提前14天書面通知。",
    links: [
      { zh: "《僱傭條例》法定假日說明", href: OFFICIAL_LINKS.employmentOrdinanceSH },
      { zh: "勞工處法定假日一覽", href: OFFICIAL_LINKS.shList },
    ],
  },
  {
    id: "insurance-medical",
    titleZh: "勞保、醫療與安全",
    bodyZh:
      "僱主必須為你投購僱員補償保險（勞保）。根據標準合約，你在受僱期間（但不包括自願因私人理由離港期間）生病或受傷，不論是否因工作引致，僱主須提供免費醫療，包括診症、住院及牙科急診。你須接受僱主提供的註冊醫生診治。清潔窗外的一面須遵守標準合約的安全規定，你可拒絕不符合規定的外窗清潔工作。如發生工傷，僱主須在14天內（死亡個案為7天）向勞工處呈報。",
    links: [{ zh: "勞工處外傭專頁", href: OFFICIAL_LINKS.fdhPortal }],
  },
  {
    id: "documents",
    titleZh: "證件與私隱",
    bodyZh:
      "護照、身分證明和其他個人證件屬於你本人，僱主不應扣留。你應有足夠空間放置私人物品，僱主不應隨意翻查，亦應尊重你的文化和宗教需要（例如膳食安排），並給予足夠睡眠和休息。若需要夜間工作，應在日間提供足夠休息。",
    links: [{ zh: "僱用外傭實用指南（PDF）", href: OFFICIAL_LINKS.practicalGuide }],
  },
  {
    id: "end-renew",
    titleZh: "合約屆滿、終止與續約",
    bodyZh:
      "合約完成或提早終止後，僱主須提供返回原居地的免費機票和旅費，並清付工資及《僱傭條例》下應付的其他款項。非合約屆滿而終止時，任何一方一般須給予1個月書面通知，或支付1個月工資作為代通知金。雙方須在合約終止後7天內通知入境處。如雙方同意續約，你通常須在新合約生效前，由僱主支付費用返回原居地放取不少於7天假期（除非事先獲入境處處長批准延期逗留）。續約是新的簽證申請，入境處一般建議在現有合約屆滿前約8星期提交。",
    links: [
      { zh: "入境處：外籍家庭傭工", href: OFFICIAL_LINKS.immdFdh },
      { zh: "常見問題", href: OFFICIAL_LINKS.fdhFaq },
    ],
  },
  {
    id: "help",
    titleZh: "遇到問題可以向哪裏求助",
    bodyZh:
      "本應用只是規劃工具，不是法律意見。有關僱傭合約或《僱傭條例》的問題，可向勞工處勞資關係科查詢或要求調停。勞工處熱線：2717 1771（由1823接聽）。入境簽證事宜：入境處熱線 2824 6111。你亦可參閱勞工處外傭專頁及《僱用外籍家庭傭工實用指南》。",
    links: [
      { zh: "勞工處外傭專頁", href: OFFICIAL_LINKS.fdhPortal },
      { zh: "僱用外傭實用指南（PDF）", href: OFFICIAL_LINKS.practicalGuide },
    ],
  },
];

