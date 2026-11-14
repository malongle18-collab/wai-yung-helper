/** Consistent 24px stroke icons. */
const paths = {
  home: `<path d="M4 11.5 12 4l8 7.5"/><path d="M6.5 10.5V20h11V10.5"/><path d="M10 20v-6h4v6"/>`,
  leaf: `<path d="M5 19c8-1 12-7 14-14-7 2-13 6-14 14Z"/><path d="M9 15c1.5-3 4-5.5 8-7"/>`,
  coin: `<ellipse cx="12" cy="12" rx="8" ry="8"/><path d="M12 8v8M9.5 10.2c.7-.8 1.6-1.2 2.5-1.2 1.8 0 3 1 3 2.4 0 2.8-6 1.2-6 4 0 1.4 1.3 2.4 3 2.4.9 0 1.8-.4 2.5-1.2"/>`,
  bell: `<path d="M6.5 16.5h11"/><path d="M7 16.5V11a5 5 0 0 1 10 0v5.5"/><path d="M10 16.5a2 2 0 0 0 4 0"/><path d="M12 4.5V6"/>`,
  more: `<path d="M5 7h14M5 12h14M5 17h14"/>`,
  person: `<circle cx="12" cy="8" r="3.2"/><path d="M5.5 19.5c1-3.6 3.2-5.4 6.5-5.4s5.5 1.8 6.5 5.4"/>`,
  plus: `<path d="M12 6v12M6 12h12"/>`,
  chevron: `<path d="M9 6l6 6-6 6"/>`,
  back: `<path d="M14 6l-6 6 6 6"/>`,
  check: `<path d="M5 12.5 9.5 17 19 7.5"/>`,
  close: `<path d="M7 7l10 10M17 7 7 17"/>`,
  calendar: `<rect x="4.5" y="6" width="15" height="14" rx="2"/><path d="M8 4v4M16 4v4M4.5 10h15"/>`,
  clock: `<circle cx="12" cy="12" r="8"/><path d="M12 8v4.5l3 2"/>`,
  doc: `<path d="M7 4.5h7l5 5V19.5H7Z"/><path d="M14 4.5V9.5h5"/><path d="M9.5 13h5M9.5 16.5h5"/>`,
  download: `<path d="M12 5v10M8 11l4 4 4-4"/><path d="M6 19h12"/>`,
  upload: `<path d="M12 15V5M8 9l4-4 4 4"/><path d="M6 19h12"/>`,
  info: `<circle cx="12" cy="12" r="8"/><path d="M12 11v5M12 7.5h.01"/>`,
  alert: `<path d="M12 4.5 20.5 19h-17Z"/><path d="M12 10v5M12 17.5h.01"/>`,
  sun: `<circle cx="12" cy="12" r="3.2"/><path d="M12 5v1.5M12 17.5V19M5 12H6.5M17.5 12H19M7.2 7.2l1.1 1.1M15.7 15.7l1.1 1.1M7.2 16.8l1.1-1.1M15.7 8.3l1.1-1.1"/>`,
  stamp: `<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="5.5"/>`,
  homeMini: `<path d="M4 11.5 12 4l8 7.5M6.5 10.5V20h11V10.5"/>`,
  list: `<path d="M8 7h12M8 12h12M8 17h12"/><path d="M4.5 7h.01M4.5 12h.01M4.5 17h.01"/>`,
  checklist: `<path d="M9 6.5h11M9 12h11M9 17.5h11"/><path d="M4.5 6.5l1.4 1.4 2.4-2.8"/><path d="M4.5 17.5l1.4 1.4 2.4-2.8"/>`,
  rule: `<path d="M7 4.5h10v15H7Z"/><path d="M10 8h4M10 11.5h4M10 15h2.5"/>`,
  share: `<circle cx="18" cy="6" r="2.4"/><circle cx="6" cy="12" r="2.4"/><circle cx="18" cy="18" r="2.4"/><path d="M8.2 10.8 15.8 7.2M8.2 13.2l7.6 3.6"/>`,
  lock: `<rect x="6.5" y="10.5" width="11" height="9" rx="1.5"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>`,
  key: `<circle cx="8.5" cy="14" r="3"/><path d="M11.2 12.8 19 5.2M16.2 5.2h2.8v2.8"/>`,
  broom: `<path d="M14.5 4.5 8 19.5"/><path d="M12.2 5.8l3 3"/><path d="M6.2 16.2c1.8 2.6 4.8 3.6 8.2 2.2"/>`,
  swap: `<path d="M7 8h10M14 5l3 3-3 3"/><path d="M17 16H7M10 13l-3 3 3 3"/>`,
  eye: `<path d="M3.5 12s3.2-5.5 8.5-5.5S20.5 12 20.5 12 17.3 17.5 12 17.5 3.5 12 3.5 12Z"/><circle cx="12" cy="12" r="2.4"/>`,
  basket: `<path d="M5 8.5h14l-1.2 10.2H6.2Z"/><path d="M9 8.5V6.2a3 3 0 0 1 6 0V8.5"/><path d="M9 13h6"/>`,
  camera: `<path d="M4.5 8.5h3l1.4-2h6.2l1.4 2H19.5v11H4.5Z"/><circle cx="12" cy="14" r="3"/>`,
  image: `<rect x="4.5" y="6" width="15" height="13" rx="2"/><path d="M7 16l3-3.2 2.2 2.2L16 11.5l3.5 4.5"/><circle cx="9" cy="10" r="1.1"/>`,
};

export function icon(name, { size = 22, label = "" } = {}) {
  const inner = paths[name] || paths.info;
  const aria = label
    ? `role="img" aria-label="${escapeAttr(label)}"`
    : `aria-hidden="true"`;
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" ${aria}>${inner}</svg>`;
}

export function escapeAttr(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
}

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
