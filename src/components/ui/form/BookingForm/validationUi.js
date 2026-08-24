export const BOOKING_VALIDATION_FIELD_ALIASES = Object.freeze({
  advanceCancelWindowQuantity: "advanceVoid",
  allowFanRecordingTokens: "recordingPrice",
  bookingBufferMinutes: "bufferTime",
  bookingFeeTokens: "bookingFee",
  callReminderMinutesBefore: "remindMeTime",
  cancellationFeeTokens: "cancellationFee",
  discountMinSessions: "sessionMinimum",
  extendMaxSessions: "extendSessionMax",
  firstTimeDiscount: "firstTimeDiscountTokens",
  maxSessionMinutes: "maxSessionDuration",
  minEventsForRecurringDiscount: "discountEventsCount",
  offHourSurchargePercent: "offHourSurchargeTokens",
  offHourSurcharge: "offHourSurchargeTokens",
  recurringDiscountPercentOfBase: "discountPercentage",
  rescheduleFeeTokens: "rescheduleFee",
});

export function normalizeValidationField(field, aliases = BOOKING_VALIDATION_FIELD_ALIASES) {
  const normalized = String(field || "").trim();
  if (!normalized) return "";
  const [root, ...path] = normalized.split(".");
  return [aliases[root] || root, ...path].join(".");
}

export function createValidationFormSnapshot(value) {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(createValidationFormSnapshot);
  if (value && typeof value === "object") {
    return Object.keys(value).sort().reduce((snapshot, key) => {
      snapshot[key] = createValidationFormSnapshot(value[key]);
      return snapshot;
    }, {});
  }
  return value;
}

export function collectChangedValidationFields(previous, current, path = "") {
  if (Object.is(previous, current)) return [];

  const previousIsObject = previous !== null && typeof previous === "object";
  const currentIsObject = current !== null && typeof current === "object";
  if (!previousIsObject || !currentIsObject || Array.isArray(previous) !== Array.isArray(current)) {
    return path ? [path] : [];
  }

  const keys = new Set([
    ...Object.keys(previous),
    ...Object.keys(current),
  ]);
  return Array.from(keys).flatMap((key) => (
    collectChangedValidationFields(
      previous[key],
      current[key],
      path ? `${path}.${key}` : key,
    )
  ));
}

export function isValidationFieldTouched(field, touchedFields = []) {
  const normalizedField = normalizeValidationField(field);
  if (!normalizedField) return false;

  return Array.from(touchedFields).some((touchedField) => {
    const normalizedTouchedField = normalizeValidationField(touchedField);
    return normalizedTouchedField === normalizedField
      || normalizedTouchedField.startsWith(`${normalizedField}.`)
      || normalizedField.startsWith(`${normalizedTouchedField}.`);
  });
}

export function createValidationErrorMap(errors = [], formatError, aliases = BOOKING_VALIDATION_FIELD_ALIASES) {
  const map = {};
  (Array.isArray(errors) ? errors : []).forEach((error) => {
    const field = normalizeValidationField(error?.field, aliases);
    if (!field) return;

    const message = typeof formatError === "function"
      ? String(formatError(error) || "").trim()
      : String(error?.message || "").trim();
    if (!message) return;

    map[field] = map[field] || [];
    if (!map[field].includes(message)) {
      map[field].push(message);
    }
  });
  return map;
}

export function getValidationMessages(errorMap = {}, fields = []) {
  const list = Array.isArray(fields) ? fields : [fields];
  const seen = new Set();
  return list
    .flatMap((field) => errorMap?.[normalizeValidationField(field)] || [])
    .filter((message) => {
      if (!message || seen.has(message)) return false;
      seen.add(message);
      return true;
    });
}

export function getFirstValidationField(errors = [], aliases = BOOKING_VALIDATION_FIELD_ALIASES) {
  const first = (Array.isArray(errors) ? errors : [])
    .map((error) => normalizeValidationField(error?.field, aliases))
    .find(Boolean);
  return first || "";
}

export function createValidationTooltipItems(errors = [], formatError, aliases = BOOKING_VALIDATION_FIELD_ALIASES) {
  const seen = new Set();
  return (Array.isArray(errors) ? errors : [])
    .map((error, index) => {
      const field = normalizeValidationField(error?.field, aliases);
      const label = typeof formatError === "function"
        ? String(formatError(error) || "").trim()
        : String(error?.message || "").trim();

      return {
        id: `${field || "validation"}-${index}`,
        field,
        label,
      };
    })
    .filter((item) => {
      const key = `${item.field}:${item.label}`;
      if (!item.label || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function getScope(root = null) {
  return root?.querySelector ? root : document;
}

function getSelectorValue(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function findValidationWarning(root = null, field = "") {
  const scope = getScope(root);
  const normalizedField = normalizeValidationField(field);
  if (normalizedField) {
    const exact = scope?.querySelector?.(`[data-booking-validation-field="${getSelectorValue(normalizedField)}"]`);
    if (exact) return exact;
  }
  return scope?.querySelector?.("[data-booking-validation-warning='true']") || null;
}

function findValidationInputTarget(root = null, field = "") {
  const scope = getScope(root);
  const normalizedField = normalizeValidationField(field);
  if (!normalizedField) return null;
  return scope?.querySelector?.(`[data-booking-validation-input-field="${getSelectorValue(normalizedField)}"]`) || null;
}

function findFocusableElement(target = null) {
  if (!target) return null;
  const selector = "input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex='-1'])";
  if (target.matches?.(selector)) return target;
  return target.querySelector?.(selector) || null;
}

export function focusValidationField(root = null, field = "") {
  const target = findValidationInputTarget(root, field);
  const focusable = findFocusableElement(target);
  if (!focusable || typeof focusable.focus !== "function") return null;
  try {
    focusable.focus({ preventScroll: true });
  } catch (_) {
    focusable.focus();
  }
  return focusable;
}

export function scrollToValidationField(root = null, field = "") {
  const target = findValidationInputTarget(root, field) || findValidationWarning(root, field);
  if (target && typeof target.scrollIntoView === "function") {
    target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  }
  focusValidationField(root, field);
  return target || null;
}

export function scrollToFirstValidationWarning(root = null) {
  const scope = root?.querySelector ? root : document;
  const target = scope?.querySelector?.("[data-booking-validation-warning='true']");
  if (target && typeof target.scrollIntoView === "function") {
    target.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
  }
  return target || null;
}
