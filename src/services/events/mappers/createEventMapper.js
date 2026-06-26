import {
  resolveCreatorId,
  toNumberOr,
  stringToArray,
  buildIdempotencyKey,
  nextDateIso,
  toHm,
  addMinutesToHm,
  localDateTimeToHkt,
} from "@/services/events/eventsApiUtils.js";
import { normalizeBookingBufferMinutes } from "@/services/events/validators/eventStepValidators.js";

const HKT_TIMEZONE = "Asia/Hong_Kong";
const DEFAULT_CREATOR_TIMEZONE = HKT_TIMEZONE;
const MINUTES_PER_DAY = 24 * 60;

const DAY_KEY_TO_INDEX = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

function asBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "true") return true;
    if (normalized === "false") return false;
  }
  return fallback;
}

function nonEmptyString(value, fallback = "") {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function richTextToPlainText(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;|&#xA0;/gi, " ")
    .replace(/\u00a0/g, " ")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object || {}, key);
}

function resolveDescriptionInput(payload = {}) {
  if (hasOwn(payload, "eventDescription")) return payload.eventDescription;
  if (hasOwn(payload, "description")) return payload.description;
  return null;
}

function normalizeOptionalDescription(value) {
  if (value === null || value === undefined) return null;
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  return richTextToPlainText(trimmed) ? trimmed : null;
}

function readBrowserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch (error) {
    return "";
  }
}

function normalizeTimezoneCandidate(value) {
  return typeof value === "string" ? value.trim() : "";
}

function resolveCreatorTimezone(payload = {}, context = {}) {
  const creatorData = context.creatorData && typeof context.creatorData === "object"
    ? context.creatorData
    : {};
  const candidates = [
    payload.creatorTimezone,
    payload.creatorTimeZone,
    payload.creator_timezone,
    creatorData.timezone,
    creatorData.time_zone,
    creatorData.creatorTimezone,
    context.creatorTimezone,
    context.creatorTimeZone,
    context.creator_timezone,
    readBrowserTimezone(),
  ];

  for (const candidate of candidates) {
    const normalized = normalizeTimezoneCandidate(candidate);
    if (normalized) return normalized;
  }

  return DEFAULT_CREATOR_TIMEZONE;
}

function pickNumeric(value, fallback = null) {
  const numeric = toNumberOr(value, null);
  return numeric == null ? fallback : numeric;
}

function pickBookingBufferMinutes(payload = {}) {
  const rawBufferTime = payload.bufferTime;
  const hasBufferTime = rawBufferTime !== null
    && rawBufferTime !== undefined
    && String(rawBufferTime).trim() !== "";
  const rawValue = hasBufferTime ? rawBufferTime : payload.bookingBufferMinutes;
  const normalized = normalizeBookingBufferMinutes(rawValue, payload.bufferUnit);

  return normalized == null ? 5 : normalized;
}

function deriveEventType(payload = {}) {
  if (payload.type === "group-event" || payload.eventType === "group-event") {
    return "group-event";
  }

  if (payload.type === "1on1-call" || payload.eventType === "1on1-call") {
    return "1on1-call";
  }

  if (payload.type === "group" || payload.eventType === "group") {
    return "group-event";
  }

  return "1on1-call";
}

function hmToMinutes(value) {
  const [hours = "0", minutes = "0"] = String(value || "00:00").split(":");
  const parsedHours = Number(hours);
  const parsedMinutes = Number(minutes);
  if (!Number.isFinite(parsedHours) || !Number.isFinite(parsedMinutes)) return 0;
  return (parsedHours * 60) + parsedMinutes;
}

function inferDurationFromHm(startHm, endHm) {
  const start = hmToMinutes(startHm);
  const end = hmToMinutes(endHm);
  if (end > start) return end - start;
  return 0;
}

function minutesToSameDayHm(totalMinutes) {
  const clamped = Math.min(Math.max(Number(totalMinutes) || 0, 0), MINUTES_PER_DAY - 1);
  const hours = Math.floor(clamped / 60);
  const minutes = clamped % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function resolveSameDayEndHm(startHm, endHm, duration = 15) {
  const startMinutes = hmToMinutes(startHm);
  const endMinutes = hmToMinutes(endHm);
  if (endMinutes > startMinutes) return endHm;

  const safeDuration = Math.max(5, Number(duration) || 15);
  const fallbackEndMinutes = Math.min(startMinutes + safeDuration, MINUTES_PER_DAY - 1);
  return fallbackEndMinutes > startMinutes ? minutesToSameDayHm(fallbackEndMinutes) : "";
}

function inferFirstAvailabilityDuration(payload = {}) {
  const sources = [];

  if (Array.isArray(payload.weeklyAvailability)) {
    payload.weeklyAvailability.forEach((day) => {
      if (day?.unavailable) return;
      if (Array.isArray(day?.slots)) sources.push(...day.slots);
    });
  }

  if (Array.isArray(payload.oneTimeAvailability)) {
    payload.oneTimeAvailability.forEach((entry) => {
      if (Array.isArray(entry?.slots)) sources.push(...entry.slots);
    });
  }

  if (Array.isArray(payload.monthlyAvailability)) {
    sources.push(...payload.monthlyAvailability);
  }

  for (const slot of sources) {
    const startHm = toHm(slot?.startTime, "");
    const endHm = toHm(slot?.endTime, "");
    if (!startHm || !endHm) continue;
    const duration = inferDurationFromHm(startHm, endHm);
    if (duration >= 5) return duration;
  }

  const selectedStart = toHm(payload.selectedStartTime || payload.startTime, "");
  const selectedEnd = toHm(payload.selectedEndTime || payload.endTime, "");
  if (selectedStart && selectedEnd) {
    const duration = inferDurationFromHm(selectedStart, selectedEnd);
    if (duration >= 5) return duration;
  }

  return 15;
}

function addDaysToDateIso(dateIso, days) {
  const [year, month, day] = String(dateIso || "").split("-").map((part) => Number(part));
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return dateIso;

  const next = new Date(year, month - 1, day);
  if (Number.isNaN(next.getTime())) return dateIso;
  next.setDate(next.getDate() + days);

  const y = String(next.getFullYear());
  const m = String(next.getMonth() + 1).padStart(2, "0");
  const d = String(next.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function diffDateIsoDays(fromDateIso, toDateIso) {
  const from = new Date(`${fromDateIso}T00:00:00`);
  const to = new Date(`${toDateIso}T00:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;
  return Math.floor((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}

function normalizeEndDayOffset(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return 0;
  return 1;
}

function localDateIsoToHktDateIso(localDateIso, anchorHm = "12:00") {
  const converted = localDateTimeToHkt(localDateIso, anchorHm);
  return converted?.dateIso || localDateIso;
}

function normalizeRepeatRule(value) {
  const allowed = new Set(["doesNotRepeat", "weekly", "everyXWeeks", "daily", "monthly"]);
  if (!allowed.has(value)) return "weekly";
  return value;
}

function resolveDayIndex(dayLike) {
  const normalized = nonEmptyString(dayLike, "").toLowerCase();
  if (!normalized) return null;
  return DAY_KEY_TO_INDEX[normalized] ?? null;
}

function getWeekdayIndexFromDateIso(dateIso) {
  const parsed = new Date(`${dateIso}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return 0;
  return parsed.getDay();
}

function resolveDateForWeekday(baseDateIso, targetDayIndex) {
  const baseDayIndex = getWeekdayIndexFromDateIso(baseDateIso);
  const safeTargetDayIndex = Number.isFinite(targetDayIndex) ? targetDayIndex : baseDayIndex;
  const shift = ((safeTargetDayIndex - baseDayIndex) + 7) % 7;
  return addDaysToDateIso(baseDateIso, shift);
}

function derivePrimarySlot(payload = {}, duration) {
  const selectedDateLocal = nonEmptyString(payload.selectedDate, "")
    || nonEmptyString(payload.dateFrom, "")
    || nextDateIso(1);

  const startTimeLocal = toHm(payload.selectedStartTime || payload.startTime, "15:00");
  const requestedEndTimeLocal = toHm(
    payload.selectedEndTime || payload.endTime,
    addMinutesToHm(startTimeLocal, duration)
  );
  const endTimeLocal = resolveSameDayEndHm(startTimeLocal, requestedEndTimeLocal, duration)
    || requestedEndTimeLocal;

  const explicitEndDateLocal = nonEmptyString(payload.selectedEndDate || payload.endDate, "");
  const endDateLocal = explicitEndDateLocal || selectedDateLocal;

  const startHkt = localDateTimeToHkt(selectedDateLocal, startTimeLocal);
  const endHkt = localDateTimeToHkt(endDateLocal, endTimeLocal);

  return {
    local: {
      dateIso: selectedDateLocal,
      endDateIso: endDateLocal,
      startTime: startTimeLocal,
      endTime: endTimeLocal,
    },
    hkt: {
      dateIso: startHkt.dateIso,
      endDateIso: endHkt.dateIso,
      eventTime: {
        start: startHkt.iso,
        end: endHkt.iso,
      },
      slot: {
        day: startHkt.weekday,
        startTime: startHkt.hm,
        endTime: endHkt.hm,
        endDayOffset: normalizeEndDayOffset(diffDateIsoDays(startHkt.dateIso, endHkt.dateIso)),
      },
    },
  };
}

function buildWeeklySlotsInHkt(payload = {}, primarySlot = {}, duration = 15) {
  const availability = Array.isArray(payload.weeklyAvailability) ? payload.weeklyAvailability : [];

  if (availability.length === 0) {
    return [primarySlot?.hkt?.slot].filter(Boolean);
  }

  const baseDateIso = primarySlot?.local?.dateIso || nextDateIso(1);
  const fallbackStart = primarySlot?.local?.startTime || "15:00";
  const fallbackEnd = primarySlot?.local?.endTime || addMinutesToHm(fallbackStart, duration);
  const slots = [];

  availability.forEach((dayEntry) => {
    if (!dayEntry || dayEntry.unavailable) return;

    const dayIndex = resolveDayIndex(dayEntry.key || dayEntry.name);
    if (dayIndex == null) return;

    const localDateIso = resolveDateForWeekday(baseDateIso, dayIndex);
    const daySlots = Array.isArray(dayEntry.slots) && dayEntry.slots.length > 0
      ? dayEntry.slots
      : [{ startTime: fallbackStart, endTime: fallbackEnd }];

    daySlots.forEach((slotEntry) => {
      const startLocalHm = toHm(slotEntry?.startTime, fallbackStart);
      const requestedEndLocalHm = toHm(slotEntry?.endTime, fallbackEnd);
      const endLocalHm = resolveSameDayEndHm(startLocalHm, requestedEndLocalHm, duration);
      if (!endLocalHm) return;

      const startHkt = localDateTimeToHkt(localDateIso, startLocalHm);
      const endHkt = localDateTimeToHkt(localDateIso, endLocalHm);

      slots.push({
        day: startHkt.weekday,
        startTime: startHkt.hm,
        endTime: endHkt.hm,
        endDayOffset: normalizeEndDayOffset(diffDateIsoDays(startHkt.dateIso, endHkt.dateIso)),
        offHours: asBoolean(slotEntry?.offHours, asBoolean(dayEntry?.offHours, false)),
      });
    });
  });

  return slots.length > 0 ? slots : [primarySlot?.hkt?.slot].filter(Boolean);
}

function buildOneTimeSlotsInHkt(payload = {}, primarySlot = {}, duration = 15) {
  const inputDates = Array.isArray(payload.oneTimeAvailability) ? payload.oneTimeAvailability : [];
  const outputMap = new Map();

  const fallbackDate = primarySlot?.local?.dateIso || nextDateIso(1);
  const fallbackStart = primarySlot?.local?.startTime || "12:00";
  const fallbackEnd = primarySlot?.local?.endTime || addMinutesToHm(fallbackStart, duration);

  const normalizedDates = inputDates.length > 0
    ? inputDates
    : [{ date: fallbackDate, slots: [{ startTime: fallbackStart, endTime: fallbackEnd }] }];

  normalizedDates.forEach((entry) => {
    const localDate = nonEmptyString(entry?.date, fallbackDate);
    const localSlots = Array.isArray(entry?.slots) && entry.slots.length > 0
      ? entry.slots
      : [{ startTime: fallbackStart, endTime: fallbackEnd }];

    localSlots.forEach((slot) => {
      const startLocalHm = toHm(slot?.startTime, fallbackStart);
      const requestedEndLocalHm = toHm(slot?.endTime, fallbackEnd);
      const endLocalHm = resolveSameDayEndHm(startLocalHm, requestedEndLocalHm, duration);
      if (!endLocalHm) return;

      const startHkt = localDateTimeToHkt(localDate, startLocalHm);
      const endHkt = localDateTimeToHkt(localDate, endLocalHm);
      const dateKey = startHkt.dateIso;

      if (!outputMap.has(dateKey)) {
        outputMap.set(dateKey, { date: dateKey, times: [] });
      }

      outputMap.get(dateKey).times.push({
        startTime: startHkt.hm,
        endTime: endHkt.hm,
        endDayOffset: normalizeEndDayOffset(diffDateIsoDays(startHkt.dateIso, endHkt.dateIso)),
        offHours: asBoolean(slot?.offHours, false),
      });
    });
  });

  return Array.from(outputMap.values());
}

function buildMonthlySlotsInHkt(payload = {}, primarySlot = {}, duration = 15) {
  const source = Array.isArray(payload.monthlyAvailability) ? payload.monthlyAvailability : [];
  const fallbackStart = primarySlot?.local?.startTime || "15:00";
  const fallbackEnd = primarySlot?.local?.endTime || addMinutesToHm(fallbackStart, duration);
  const anchorDate = nonEmptyString(payload.dateFrom, "")
    || primarySlot?.local?.dateIso
    || nextDateIso(1);

  const monthlyRows = source.length > 0 ? source : [{ startTime: fallbackStart, endTime: fallbackEnd, offHours: false }];

  return monthlyRows
    .map((slot) => {
      const startLocalHm = toHm(slot?.startTime, fallbackStart);
      const requestedEndLocalHm = toHm(slot?.endTime, fallbackEnd);
      const endLocalHm = resolveSameDayEndHm(startLocalHm, requestedEndLocalHm, duration);
      if (!endLocalHm) return null;

      const startHkt = localDateTimeToHkt(anchorDate, startLocalHm);
      const endHkt = localDateTimeToHkt(anchorDate, endLocalHm);

      return {
        startTime: startHkt.hm,
        endTime: endHkt.hm,
        endDayOffset: normalizeEndDayOffset(diffDateIsoDays(startHkt.dateIso, endHkt.dateIso)),
        offHours: asBoolean(slot?.offHours, false),
      };
    })
    .filter((slot) => slot?.startTime && slot?.endTime);
}

function buildRepeatSlots(repeatRule, payload = {}, primarySlot = {}, duration = 15) {
  if (repeatRule === "doesNotRepeat") {
    return buildOneTimeSlotsInHkt(payload, primarySlot, duration);
  }

  if (repeatRule === "monthly") {
    return buildMonthlySlotsInHkt(payload, primarySlot, duration);
  }

  const weeklySlots = buildWeeklySlotsInHkt(payload, primarySlot, duration);

  if (repeatRule === "daily") {
    const byTime = new Map();
    weeklySlots.forEach((slot) => {
      const key = `${slot.startTime}-${slot.endTime}`;
      if (!byTime.has(key)) {
        byTime.set(key, {
          startTime: slot.startTime,
          endTime: slot.endTime,
          endDayOffset: normalizeEndDayOffset(slot?.endDayOffset),
          offHours: asBoolean(slot?.offHours, false),
        });
        return;
      }
      const existing = byTime.get(key);
      existing.offHours = asBoolean(existing.offHours, false) || asBoolean(slot?.offHours, false);
    });

    const uniqueSlots = Array.from(byTime.values());
    return uniqueSlots.length > 0
      ? uniqueSlots
      : [{
        startTime: primarySlot?.hkt?.slot?.startTime,
        endTime: primarySlot?.hkt?.slot?.endTime,
        endDayOffset: normalizeEndDayOffset(primarySlot?.hkt?.slot?.endDayOffset),
        offHours: false,
      }];
  }

  return weeklySlots;
}

function deriveOneTimeHktDateBounds(slots = []) {
  const dates = [];

  (Array.isArray(slots) ? slots : []).forEach((entry) => {
    const startDate = nonEmptyString(entry?.date, "");
    if (!startDate) return;
    dates.push(startDate);

    const times = Array.isArray(entry?.times)
      ? entry.times
      : (Array.isArray(entry?.slots) ? entry.slots : []);

    times.forEach((time) => {
      const endOffset = normalizeEndDayOffset(time?.endDayOffset);
      dates.push(endOffset > 0 ? addDaysToDateIso(startDate, endOffset) : startDate);
    });
  });

  const sortedDates = Array.from(new Set(dates)).sort();

  return {
    hktDateFrom: sortedDates[0] || null,
    hktDateTo: sortedDates.at(-1) || sortedDates[0] || null,
  };
}

function deriveDateRange(payload = {}, primarySlot = {}, repeatRule = "weekly", repeatSlots = []) {
  const oneTimeDates = Array.isArray(payload.oneTimeAvailability)
    ? payload.oneTimeAvailability
      .map((entry) => nonEmptyString(entry?.date, ""))
      .filter(Boolean)
      .sort()
    : [];

  const localDateFrom = nonEmptyString(payload.dateFrom, "")
    || oneTimeDates[0]
    || primarySlot?.local?.dateIso;
  const explicitLocalDateTo = nonEmptyString(payload.dateTo, "");
  const localDateTo = explicitLocalDateTo || null;
  const rangeAnchorHm = primarySlot?.local?.startTime || "12:00";

  if (repeatRule === "doesNotRepeat") {
    const oneTimeBounds = deriveOneTimeHktDateBounds(repeatSlots);
    if (oneTimeBounds.hktDateFrom) {
      return {
        localDateFrom,
        localDateTo,
        hktDateFrom: oneTimeBounds.hktDateFrom,
        hktDateTo: oneTimeBounds.hktDateTo,
      };
    }
  }

  return {
    localDateFrom,
    localDateTo,
    hktDateFrom: localDateIsoToHktDateIso(localDateFrom, rangeAnchorHm),
    hktDateTo: localDateTo
      ? localDateIsoToHktDateIso(localDateTo, rangeAnchorHm)
      : null,
  };
}

function buildSocialAutoPost(payload = {}) {
  return {
    onScheduleLive: asBoolean(payload.xPostLive, false),
    onBookingReceived: asBoolean(payload.xPostBooked, false),
    onInSession: asBoolean(payload.xPostInSession, false),
    onTipped: asBoolean(payload.xPostTipped, false),
    onPurchased: asBoolean(payload.xPostPurchase, false),
  };
}

function withOptionalField(target, key, value) {
  if (value === undefined || value === null || value === "") return;
  target[key] = value;
}

function applyAudienceConstraints(mapped, payload = {}) {
  if (mapped.whoCanBook === "subscribersOnly") {
    mapped.subscriptionTiers = stringToArray(payload.subscriptionTiers);
  }

  if (mapped.whoCanBook === "inviteOnly") {
    mapped.invitedUsers = stringToArray(payload.invitedUsers);
    withOptionalField(mapped, "inviteSecret", nonEmptyString(payload.inviteSecret, ""));
  }
}

function applySpendingConstraints(mapped, payload = {}) {
  if (mapped.spendingRequirement === "minSpend") {
    withOptionalField(mapped, "minSpendTokens", pickNumeric(payload.minSpendTokens, 0));
  }

  if (mapped.spendingRequirement === "mustOwnProducts") {
    const source = Array.isArray(payload.requiredProducts) ? payload.requiredProducts : [];
    const normalized = [];
    const seen = new Set();

    source.forEach((item) => {
      if (!item || typeof item !== "object") return;
      const id = toNumberOr(item.id, null);
      const type = nonEmptyString(item.type, "").toLowerCase();
      if (id == null || !type) return;

      const key = `${type}:${id}`;
      if (seen.has(key)) return;
      seen.add(key);

      const normalizedItem = {
        id,
        type,
        title: nonEmptyString(item.title, `Product ${id}`),
        tags: Array.isArray(item.tags)
          ? item.tags.map((tag) => nonEmptyString(tag, "")).filter(Boolean)
          : [],
      };

      const buyPrice = pickNumeric(item?.buyPrice, null);
      if (buyPrice != null) {
        normalizedItem.buyPrice = buyPrice;
      }

      const subscribePrice = pickNumeric(item?.subscribePrice, null);
      if (subscribePrice != null) {
        normalizedItem.subscribePrice = subscribePrice;
      }

      const thumbnailUrl = nonEmptyString(item.thumbnailUrl, "");
      if (thumbnailUrl) {
        normalizedItem.thumbnailUrl = thumbnailUrl;
      }

      normalized.push(normalizedItem);
    });

    mapped.requiredProducts = normalized;
  }
}

function normalizeAddOns(addOns = []) {
  const source = Array.isArray(addOns) ? addOns : [];
  const normalized = [];

  source.forEach((item) => {
    if (!item || typeof item !== "object") return;

    const title = nonEmptyString(item.title || item.name, "");
    const description = typeof item.description === "string"
      ? item.description.trim()
      : "";
    const priceTokens = pickNumeric(item.priceTokens ?? item.tokens ?? item.price, null);

    const hasAnyValue = title || description || priceTokens !== null;
    if (!hasAnyValue) return;
    if (!title) return;
    if (priceTokens === null || priceTokens < 0) return;

    normalized.push({
      title,
      description,
      priceTokens,
    });
  });

  return normalized;
}

function buildLateStartPolicy(payload = {}) {
  const action = nonEmptyString(payload.lateStartAction, "reschedule");
  const policy = { action };

  if (action === "nextDiscount") {
    withOptionalField(policy, "discountPercent", pickNumeric(payload.lateStartDiscountPercent, 0));
  }

  return policy;
}

function mapBasePayload(payload = {}, context = {}) {
  const creatorId = resolveCreatorId(payload, context);
  const type = deriveEventType(payload);
  const durationRaw = payload.duration ?? payload.sessionDurationMinutes;
  const explicitDuration = String(durationRaw ?? "").trim() === ""
    ? null
    : pickNumeric(durationRaw, null);
  const duration = explicitDuration != null
    ? explicitDuration
    : (type === "group-event" ? inferFirstAvailabilityDuration(payload) : 15);
  const priceSetting = nonEmptyString(payload.priceSetting ?? payload.priceSettings, "fixedPricePerUser");
  const isGroupEventGoal = type === "group-event" && priceSetting === "eventGoal";
  const basePrice = isGroupEventGoal
    ? 0
    : pickNumeric(payload.basePrice ?? payload.basePriceTokens, 0);
  const primarySlot = derivePrimarySlot(payload, duration);
  const repeatRule = normalizeRepeatRule(nonEmptyString(payload.repeatRule, "weekly"));
  const repeatSlots = buildRepeatSlots(repeatRule, payload, primarySlot, duration);
  const dateRange = deriveDateRange(payload, primarySlot, repeatRule, repeatSlots);
  const creatorTimezone = resolveCreatorTimezone(payload, context);

  const mapped = {
    creatorId,
    creatorTimezone,
    type,
    title: nonEmptyString(payload.eventTitle || payload.title, "Untitled Event"),
    description: normalizeOptionalDescription(resolveDescriptionInput(payload)),
    eventColorSkin: nonEmptyString(payload.eventColorSkin, "#5549FF"),
    eventCallType: nonEmptyString(payload.eventCallType, "video"),
    eventRingtoneUrl: nonEmptyString(payload.eventRingtoneUrl, "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"),
    sessionDurationMinutes: duration,
    basePriceTokens: basePrice,
    whoCanBook: nonEmptyString(payload.whoCanBook, "everyone"),
    spendingRequirement: nonEmptyString(payload.spendingRequirement, "none"),
    repeatRule,
    slots: repeatSlots,

    allowLongerSessions: asBoolean(payload.allowLongerSessions, false),
    enableDiscountForLonger: type !== "group-event" && asBoolean(payload.enableLongerDiscount, false),
    enableFirstTimeDiscount: asBoolean(payload.enableFirstTimeDiscount, false),
    enableBookingFee: asBoolean(payload.enableBookingFee, false),
    allowInstantBooking: type === "group-event" ? true : asBoolean(payload.allowInstantBooking, false),
    disableChatBeforeCall: asBoolean(payload.disableChatBeforeCall, false),
    disableChatAllowEmoji: asBoolean(payload.disableChatAllowEmoji, false),
    enableRescheduleFee: asBoolean(payload.enableRescheduleFee, false),
    enableCancellationFee: asBoolean(payload.enableCancellationFee, false),
    allowAdvanceCancelToAvoidMinCharge: asBoolean(payload.allowAdvanceCancellation, false),
    offHourSurcharge: asBoolean(payload.addOffHourSurcharge, false),
    enableBufferTime: asBoolean(payload.setBufferTime, false),

    socialAutoPost: buildSocialAutoPost(payload),
    blockedUsers: stringToArray(payload.blockedUsers || payload.blockedUserSearch),
    coHosts: stringToArray(payload.coHosts || payload.coPerformerSearch),

    idempotencyKey: nonEmptyString(payload.idempotencyKey, "") || buildIdempotencyKey("create_event"),
  };

  if (type !== "group-event") {
    const disableChatDuringCall = asBoolean(payload.disableChatDuringCall, false);
    mapped.disableChatDuringCall = disableChatDuringCall;
    mapped.disableChatDuringCallAllowEmoji = disableChatDuringCall && asBoolean(payload.disableChatDuringCallAllowEmoji, false);
    mapped.fanCanRequestExtend = asBoolean(payload.requestExtendSession, false);
    mapped.lateStartPolicy = buildLateStartPolicy(payload);
    mapped.addOns = normalizeAddOns(payload.addOns);
    mapped.allowFanRecordingEnabled = asBoolean(payload.allowRecording, false);
    mapped.allowPersonalRequestRequired = asBoolean(payload.allowPersonalRequest, false);
  }

  if (repeatRule === "everyXWeeks") {
    withOptionalField(mapped, "repeatX", pickNumeric(payload.repeatX, 2));
  }

  withOptionalField(mapped, "dateFrom", dateRange.hktDateFrom);
  withOptionalField(mapped, "dateTo", dateRange.hktDateTo);
  withOptionalField(mapped, "eventImageUrl", nonEmptyString(payload.eventImageUrl || payload.imageUrl, ""));
  withOptionalField(mapped, "mediaId", pickNumeric(payload.mediaId, null));

  applyAudienceConstraints(mapped, payload);
  applySpendingConstraints(mapped, payload);

  if (mapped.allowLongerSessions) {
    withOptionalField(mapped, "maxSessionMinutes", pickNumeric(payload.maxSessionDuration || payload.maxSessionMinutes, duration));
  }

  if (mapped.enableDiscountForLonger) {
    withOptionalField(mapped, "discountMinSessions", pickNumeric(payload.sessionMinimum || payload.discountMinSessions || payload.discountEventsCount, 2));
    withOptionalField(mapped, "longerSessionDiscountTokens", pickNumeric(payload.longerSessionDiscountTokens || payload.discountPercentage || payload.discountPercentOfBase, 0));
  }

  if (mapped.enableFirstTimeDiscount) {
    withOptionalField(mapped, "firstTimeDiscountTokens", pickNumeric(payload.firstTimeDiscountTokens || payload.firstTimeDiscount, 0));
  }

  if (mapped.enableBookingFee) {
    withOptionalField(mapped, "bookingFeeTokens", pickNumeric(payload.bookingFee || payload.bookingFeeTokens, 0));
  }

  if (mapped.enableRescheduleFee) {
    withOptionalField(mapped, "rescheduleFeeTokens", pickNumeric(payload.rescheduleFee || payload.rescheduleFeeTokens, 0));
  }

  if (mapped.enableCancellationFee) {
    withOptionalField(mapped, "cancellationFeeTokens", pickNumeric(payload.cancellationFee || payload.cancellationFeeTokens, 0));
  }

  if (mapped.allowAdvanceCancelToAvoidMinCharge) {
    withOptionalField(mapped, "advanceCancelWindowQuantity", pickNumeric(payload.advanceVoid || payload.advanceCancelWindowQuantity, 1));
    withOptionalField(mapped, "advanceCancelWindowUnit", nonEmptyString(payload.advanceCancelWindowUnit, "day"));
  }

  if (mapped.offHourSurcharge) {
    withOptionalField(mapped, "offHourSurchargePercent", pickNumeric(payload.offHourSurchargePercent || payload.offHourSurcharge, 0));
  }

  if (type !== "group-event" && mapped.fanCanRequestExtend) {
    withOptionalField(mapped, "extendMaxSessions", pickNumeric(payload.extendSessionMax ?? payload.extendMaxSessions, null));
  }

  const reminderEnabled = asBoolean(payload.setReminders ?? payload.enableCallReminderMinutesBefore, false);
  const reminderMinutes = pickNumeric(payload.remindMeTime || payload.callReminderMinutesBefore, null);
  if (reminderEnabled && reminderMinutes != null) {
    mapped.enableCallReminderMinutesBefore = true;
    mapped.callReminderMinutesBefore = reminderMinutes;
  } else {
    mapped.enableCallReminderMinutesBefore = false;
  }

  if (mapped.enableBufferTime) {
    withOptionalField(mapped, "bookingBufferMinutes", pickBookingBufferMinutes(payload));
  }

  if (type !== "group-event") {
    mapped.enableMaxBookingsPerDay = asBoolean(payload.setMaxBookings, false);

    if (mapped.enableMaxBookingsPerDay) {
      withOptionalField(mapped, "maxBookingsPerDay", pickNumeric(payload.maxBookingsPerDay, 1));
    }
  }

  if (mapped.allowFanRecordingEnabled) {
    withOptionalField(mapped, "allowFanRecordingTokens", pickNumeric(payload.recordingPrice || payload.allowFanRecordingTokens, 0));
  }

  if (type === "group-event") {
    mapped.priceSetting = priceSetting;

    if (mapped.priceSetting === "eventGoal") {
      withOptionalField(mapped, "eventGoalTokens", pickNumeric(payload.eventGoalTokens ?? payload.basePriceTokens, null));
      mapped.goalNotMet = nonEmptyString(payload.goalNotMet, "cancelEvent");

      if (asBoolean(payload.enableMinContributionPerUser, false)) {
        withOptionalField(mapped, "minContributionPerUser", pickNumeric(payload.minContributionPerUser, 0));
      }
    }

    mapped.enableMaxAttendees = asBoolean(payload.enableMaxAttendees, false);

    if (mapped.enableMaxAttendees) {
      withOptionalField(mapped, "maxAttendees", pickNumeric(payload.maxAttendees, 2));
    }

    mapped.enableDiscountForRecurring = mapped.priceSetting === "fixedPricePerUser"
      && asBoolean(payload.enableLongerDiscount || payload.enableDiscountForRecurring, false);

    if (mapped.enableDiscountForRecurring) {
      withOptionalField(mapped, "minEventsForRecurringDiscount", pickNumeric(payload.discountEventsCount || payload.minEventsForRecurringDiscount, 2));
      withOptionalField(mapped, "recurringDiscountPercentOfBase", pickNumeric(payload.discountPercentage || payload.recurringDiscountPercentOfBase, 0));
    }

    mapped.eventTime = {
      start: primarySlot.hkt.eventTime.start,
      end: primarySlot.hkt.eventTime.end,
      timezone: HKT_TIMEZONE,
    };
  }

  return mapped;
}

export function createEventMapper(payload = {}, context = {}) {
  return mapBasePayload(payload, context);
}
