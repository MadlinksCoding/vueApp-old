export const BOOKING_NOTICE_TYPES = Object.freeze({
  BOOKING_REQUEST: "booking-request",
  BOOKING_CONFIRMED: "booking-confirmed",
  BOOKING_DECLINED: "booking-declined",
  BOOKING_CANCELLED: "booking-cancelled",
  PRICE_ADJUSTMENT: "price-adjustment",
  READY_TO_JOIN: "ready-to-join",
  EVENTS_TODAY: "events-today",
  SUMMARY: "summary",
});

export const BOOKING_NOTICE_PRIORITIES = Object.freeze({
  READY: "ready-to-join",
  TODAY: "events-today",
  ACTION: "action-required",
  STATUS: "status-change",
  INFO: "general-information",
});

export const DEFAULT_BOOKING_NOTICE_CONFIG = Object.freeze({
  desktopPosition: "top-right",
  mobilePosition: "top",
  durationSeconds: 0,
  initialDelaySeconds: 0,
  enabled: true,
  maxVisibleNotices: 3,
  groupRelatedChanges: true,
  attentionAnimation: "pulse",
  entranceEffect: "fade",
  exitEffect: "fade",
  readyToJoinLeadMinutes: 5,
  refreshIntervalSeconds: 10,
  summary: Object.freeze({
    desktopPosition: "top-right",
    mobilePosition: "bottom",
    trigger: "once-per-day",
    intervalMinutes: 60,
    showGreeting: true,
    greetingTemplate: "Welcome back, {displayName}!",
    perSectionLimit: 3,
    totalLimit: 6,
    showOverflow: true,
    overflowTemplate: "and {count} more",
    sectionVisibility: Object.freeze({}),
    sectionLimits: Object.freeze({}),
    sectionSort: Object.freeze({}),
    sectionOrder: Object.freeze([
      BOOKING_NOTICE_TYPES.READY_TO_JOIN,
      BOOKING_NOTICE_TYPES.EVENTS_TODAY,
      BOOKING_NOTICE_TYPES.BOOKING_REQUEST,
      BOOKING_NOTICE_TYPES.PRICE_ADJUSTMENT,
      BOOKING_NOTICE_TYPES.BOOKING_CANCELLED,
      BOOKING_NOTICE_TYPES.BOOKING_DECLINED,
      BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED,
    ]),
    priorityOrder: Object.freeze([
      BOOKING_NOTICE_PRIORITIES.READY,
      BOOKING_NOTICE_PRIORITIES.TODAY,
      BOOKING_NOTICE_PRIORITIES.ACTION,
      BOOKING_NOTICE_PRIORITIES.STATUS,
      BOOKING_NOTICE_PRIORITIES.INFO,
    ]),
    emptyBehavior: "hide",
    emptyMessage: "You have no booking updates.",
    initialDelaySeconds: 0,
    contentRefresh: "live",
  }),
  noticeTypes: Object.freeze({}),
});

const mergeSummary = (base, override) => ({
  ...base,
  ...(override || {}),
});

export function resolveBookingNoticeConfig(type, overrides = {}) {
  const typeOverride = overrides.noticeTypes?.[type] || {};
  const merged = {
    ...DEFAULT_BOOKING_NOTICE_CONFIG,
    ...overrides,
    ...typeOverride,
  };

  merged.summary = mergeSummary(
    DEFAULT_BOOKING_NOTICE_CONFIG.summary,
    mergeSummary(overrides.summary, typeOverride.summary),
  );

  return merged;
}

export function formatNoticeTemplate(template, values = {}) {
  return String(template || "").replace(/\{(\w+)\}/g, (_, key) => values[key] ?? `{${key}}`);
}
