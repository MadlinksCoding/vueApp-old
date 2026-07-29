function asValidDate(value) {
  const date = value instanceof Date ? new Date(value) : new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function startOfLocalDay(value) {
  const date = asValidDate(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function addLocalDays(value, amount) {
  const date = startOfLocalDay(value);
  date.setDate(date.getDate() + amount);
  return date;
}

export function formatBookedSlotRangeDate(value) {
  const date = startOfLocalDay(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function resolveVisibleBookedSlotRange({
  focusDate = new Date(),
  view = "week",
} = {}) {
  const focus = startOfLocalDay(focusDate);
  const normalizedView = String(view || "week").toLowerCase();
  let visibleStart = focus;
  let visibleEnd = focus;

  if (normalizedView === "week") {
    visibleStart = addLocalDays(focus, -focus.getDay());
    visibleEnd = addLocalDays(visibleStart, 6);
  } else if (normalizedView === "month") {
    const monthStart = new Date(focus.getFullYear(), focus.getMonth(), 1);
    visibleStart = addLocalDays(monthStart, -monthStart.getDay());
    visibleEnd = addLocalDays(visibleStart, 41);
  }

  const queryStart = addLocalDays(visibleStart, -1);

  return {
    fromIso: formatBookedSlotRangeDate(queryStart),
    toIso: formatBookedSlotRangeDate(visibleEnd),
    visibleFromIso: formatBookedSlotRangeDate(visibleStart),
    visibleToIso: formatBookedSlotRangeDate(visibleEnd),
    key: `${normalizedView}:${formatBookedSlotRangeDate(visibleStart)}:${formatBookedSlotRangeDate(visibleEnd)}`,
  };
}

export function resolveUpcomingWidgetBookedSlotRange({
  now = new Date(),
  months = 6,
} = {}) {
  const start = startOfLocalDay(now);
  const end = startOfLocalDay(now);
  end.setMonth(end.getMonth() + months);

  return {
    fromIso: formatBookedSlotRangeDate(start),
    toIso: formatBookedSlotRangeDate(end),
    key: `widget:${formatBookedSlotRangeDate(start)}:${formatBookedSlotRangeDate(end)}`,
  };
}
