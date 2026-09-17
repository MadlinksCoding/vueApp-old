import {
  BOOKING_NOTICE_PRIORITIES,
  BOOKING_NOTICE_TYPES,
  DEFAULT_BOOKING_NOTICE_CONFIG,
  formatNoticeTemplate,
} from "./bookingNoticeConfig";

const DEFAULT_PRIORITY_BY_TYPE = Object.freeze({
  [BOOKING_NOTICE_TYPES.READY_TO_JOIN]: BOOKING_NOTICE_PRIORITIES.READY,
  [BOOKING_NOTICE_TYPES.EVENTS_TODAY]: BOOKING_NOTICE_PRIORITIES.TODAY,
  [BOOKING_NOTICE_TYPES.BOOKING_REQUEST]: BOOKING_NOTICE_PRIORITIES.ACTION,
  [BOOKING_NOTICE_TYPES.PRICE_ADJUSTMENT]: BOOKING_NOTICE_PRIORITIES.ACTION,
  [BOOKING_NOTICE_TYPES.BOOKING_CANCELLED]: BOOKING_NOTICE_PRIORITIES.STATUS,
  [BOOKING_NOTICE_TYPES.BOOKING_DECLINED]: BOOKING_NOTICE_PRIORITIES.STATUS,
  [BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED]: BOOKING_NOTICE_PRIORITIES.INFO,
});

const representedItemIds = (item) => [...new Set([
  item?.id,
  ...(Array.isArray(item?.representedActivityIds) ? item.representedActivityIds : []),
].filter(Boolean))];

const numberOr = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
};

const timestamp = (value) => {
  const parsed = new Date(value || 0).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
};

function sortItems(items, sort = "soonest-first") {
  const direction = sort === "latest-first" || sort === "newest-first" ? -1 : 1;
  const field = sort === "oldest-first" || sort === "newest-first" ? "occurredAt" : "eventAt";
  return [...items].sort((left, right) => direction * (timestamp(left[field]) - timestamp(right[field])));
}

export function buildBookingNoticeSummary(sections = [], settings = {}, options = {}) {
  const config = { ...DEFAULT_BOOKING_NOTICE_CONFIG.summary, ...settings };
  const priorityOrder = new Map(config.priorityOrder.map((value, index) => [value, index]));
  const sectionOrder = new Map(config.sectionOrder.map((value, index) => [value, index]));
  const perSectionDefault = numberOr(config.perSectionLimit, 3);
  const additionalVisibleItems = Math.floor(numberOr(options.additionalVisibleItems, 0));

  const eligibleSections = sections
    .filter((section) => section
      && section.enabled !== false
      && config.sectionVisibility?.[section.type] !== false)
    .map((section, originalIndex) => {
      const sort = section.sort || config.sectionSort?.[section.type];
      const items = sortItems(section.items || [], sort);
      const totalCount = Math.max(items.length, numberOr(section.totalCount, items.length));
      const limit = numberOr(section.limit ?? config.sectionLimits?.[section.type], perSectionDefault)
        + additionalVisibleItems;
      const priority = section.priority || DEFAULT_PRIORITY_BY_TYPE[section.type] || BOOKING_NOTICE_PRIORITIES.INFO;

      return {
        ...section,
        items,
        totalCount,
        priority,
        originalIndex,
        candidates: items.slice(0, limit),
      };
    })
    .filter((section) => section.totalCount > 0)
    .sort((left, right) => {
      const priorityDifference = (priorityOrder.get(left.priority) ?? 999) - (priorityOrder.get(right.priority) ?? 999);
      if (priorityDifference !== 0) return priorityDifference;
      const sectionDifference = (sectionOrder.get(left.type) ?? 999) - (sectionOrder.get(right.type) ?? 999);
      return sectionDifference || left.originalIndex - right.originalIndex;
    });

  const totalCount = eligibleSections.reduce((sum, section) => sum + section.totalCount, 0);
  let remaining = numberOr(config.totalLimit, 6) + additionalVisibleItems;

  const visibleSections = eligibleSections
    .map((section) => {
      const visibleItems = section.candidates.slice(0, remaining);
      remaining = Math.max(0, remaining - visibleItems.length);
      return {
        id: section.id || section.type,
        type: section.type,
        variant: section.variant,
        label: section.label,
        priority: section.priority,
        totalCount: section.totalCount,
        items: visibleItems,
      };
    })
    .filter((section) => section.items.length > 0);

  const visibleItems = visibleSections.flatMap((section) => section.items);
  const visibleItemIds = [...new Set(visibleItems.flatMap(representedItemIds))];
  const visibleIdSet = new Set(visibleItemIds);
  const allItemIds = [...new Set(eligibleSections
    .flatMap((section) => section.items)
    .flatMap(representedItemIds))];
  const hiddenLoadedItems = eligibleSections.flatMap((section) => section.items).filter((item) => !visibleIdSet.has(item.id));
  const hiddenCount = Math.max(0, totalCount - visibleItems.length);

  return {
    totalCount,
    visibleCount: visibleItems.length,
    hiddenCount,
    sections: visibleSections,
    allItemIds,
    visibleItemIds,
    hiddenItemIds: [...new Set(hiddenLoadedItems.flatMap(representedItemIds))],
    overflowText: config.showOverflow && hiddenCount > 0
      ? formatNoticeTemplate(config.overflowTemplate, { count: hiddenCount })
      : "",
    isEmpty: totalCount === 0,
  };
}

export function shouldShowStandaloneNotice(notice, summary, summaryOpen = true) {
  if (!summaryOpen || !summary || !notice?.id) return true;
  const summaryItemIds = new Set(summary.allItemIds || [
    ...(summary.visibleItemIds || []),
    ...(summary.hiddenItemIds || []),
  ]);
  const itemIds = (notice.items || []).map((item) => item?.id).filter(Boolean);
  const representedIds = itemIds.length ? itemIds : [notice.id];
  return representedIds.some((id) => !summaryItemIds.has(id));
}

export function getSummaryDismissedItemIds(summary) {
  const completeItemIds = summary?.allItemIds || [
    ...(summary?.visibleItemIds || []),
    ...(summary?.hiddenItemIds || []),
  ];
  return [...new Set(completeItemIds.filter(Boolean))];
}

export function getLocalCalendarDay(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function shouldShowSummary({ settings = {}, state = {}, now = new Date(), sessionId, hasContent = true }) {
  const config = { ...DEFAULT_BOOKING_NOTICE_CONFIG.summary, ...settings };
  if (!hasContent && config.emptyBehavior === "hide") return false;
  if (state.isOpen) return true;

  if (config.trigger === "every-login") {
    return !sessionId || state.dismissedSessionId !== sessionId;
  }

  if (config.trigger === "every-x-minutes") {
    return !state.dismissedAt
      || now.getTime() >= timestamp(state.dismissedAt) + numberOr(config.intervalMinutes, 60) * 60_000;
  }

  return state.dismissedDay !== getLocalCalendarDay(now);
}

export function markSummaryOpen(state = {}, now = new Date()) {
  return { ...state, isOpen: true, openedAt: now.toISOString() };
}

export function dismissSummary({ state = {}, settings = {}, now = new Date(), sessionId }) {
  const config = { ...DEFAULT_BOOKING_NOTICE_CONFIG.summary, ...settings };
  const next = { ...state, isOpen: false, dismissedAt: now.toISOString() };
  if (config.trigger === "every-login") next.dismissedSessionId = sessionId;
  if (config.trigger === "once-per-day") next.dismissedDay = getLocalCalendarDay(now);
  return next;
}
