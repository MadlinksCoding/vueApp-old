import {
  extractDateIso,
  extractHm,
  hktDateTimeToLocalDate,
  toHm,
} from "@/services/events/eventsApiUtils.js";

const DEFAULT_EVENT_COLOR = "#5549FF";
const DEFAULT_RINGTONE_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";
const DAY_INDEX_TO_KEY = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const DAY_NAME_TO_KEY = {
  sunday: "sun",
  monday: "mon",
  tuesday: "tue",
  wednesday: "wed",
  thursday: "thu",
  friday: "fri",
  saturday: "sat",
};

function bool(value, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes"].includes(normalized)) return true;
    if (["false", "0", "no", ""].includes(normalized)) return false;
  }
  return fallback;
}

function stringValue(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  const normalized = String(value).trim();
  return normalized || fallback;
}

function fieldNumber(value, fallback = "") {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? String(parsed) : fallback;
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function formatLocalDateIso(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateFromHktDateLike(value, fallback = "") {
  const dateIso = extractDateIso(value, null);
  if (!dateIso) return fallback;
  const local = hktDateTimeToLocalDate(dateIso, "12:00");
  return formatLocalDateIso(local) || dateIso || fallback;
}

function localTimeFromHktParts(dateIso, hm, fallback = "15:00") {
  const safeDateIso = extractDateIso(dateIso, null);
  const safeHm = toHm(hm, "");
  if (!safeDateIso || !safeHm) return fallback;
  const local = hktDateTimeToLocalDate(safeDateIso, safeHm);
  if (!local) return safeHm || fallback;
  return `${String(local.getHours()).padStart(2, "0")}:${String(local.getMinutes()).padStart(2, "0")}`;
}

function localPartsFromHktParts(dateIso, hm, fallbackHm = "15:00") {
  const safeDateIso = extractDateIso(dateIso, null);
  const safeHm = toHm(hm, "");
  if (!safeDateIso || !safeHm) {
    return {
      dateIso: safeDateIso || "",
      dayKey: "",
      hm: safeHm || fallbackHm,
    };
  }

  const local = hktDateTimeToLocalDate(safeDateIso, safeHm);
  if (!local) {
    return {
      dateIso: safeDateIso,
      dayKey: "",
      hm: safeHm || fallbackHm,
    };
  }

  return {
    dateIso: formatLocalDateIso(local),
    dayKey: DAY_INDEX_TO_KEY[local.getDay()] || "",
    hm: `${String(local.getHours()).padStart(2, "0")}:${String(local.getMinutes()).padStart(2, "0")}`,
  };
}

function localPartsFromAbsoluteIso(value, fallbackHm = "15:00") {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return {
      dateIso: dateFromHktDateLike(value, ""),
      hm: extractHm(value, fallbackHm),
    };
  }

  return {
    dateIso: formatLocalDateIso(parsed),
    hm: `${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(2, "0")}`,
  };
}

function addDaysToDateIso(dateIso, days = 0) {
  const parsed = new Date(`${dateIso}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) return dateIso;
  parsed.setDate(parsed.getDate() + days);
  return formatLocalDateIso(parsed) || dateIso;
}

function resolveHktDateForWeeklySlot(event = {}, slot = {}) {
  const baseDate = extractDateIso(event.dateFrom, extractDateIso(event.eventTime?.start, ""));
  if (!baseDate) return "";

  const targetKey = DAY_NAME_TO_KEY[String(slot?.day || "").toLowerCase()];
  const targetIndex = DAY_INDEX_TO_KEY.indexOf(targetKey);
  if (targetIndex < 0) return baseDate;

  const parsed = new Date(`${baseDate}T12:00:00+08:00`);
  if (Number.isNaN(parsed.getTime())) return baseDate;

  const hktWeekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Hong_Kong",
    weekday: "long",
  }).format(parsed).toLowerCase();
  const baseIndex = DAY_INDEX_TO_KEY.indexOf(DAY_NAME_TO_KEY[hktWeekday]);
  if (baseIndex < 0) return baseDate;

  return addDaysToDateIso(baseDate, ((targetIndex - baseIndex) + 7) % 7);
}

function makeDefaultWeeklyAvailability() {
  return [
    { key: "sun", name: "Sun", unavailable: true, offHours: false, slots: [] },
    { key: "mon", name: "Mon", unavailable: true, offHours: false, slots: [] },
    { key: "tue", name: "Tue", unavailable: true, offHours: false, slots: [] },
    { key: "wed", name: "Wed", unavailable: true, offHours: false, slots: [] },
    { key: "thu", name: "Thu", unavailable: true, offHours: false, slots: [] },
    { key: "fri", name: "Fri", unavailable: true, offHours: false, slots: [] },
    { key: "sat", name: "Sat", unavailable: true, offHours: false, slots: [] },
  ];
}

function normalizeSocialAutoPost(event = {}) {
  const social = event.socialAutoPost && typeof event.socialAutoPost === "object"
    ? event.socialAutoPost
    : {};

  return {
    xPostLive: bool(social.onScheduleLive ?? event.xPostLive, false),
    xPostBooked: bool(social.onBookingReceived ?? event.xPostBooked, false),
    xPostInSession: bool(social.onInSession ?? event.xPostInSession, false),
    xPostTipped: bool(social.onTipped ?? event.xPostTipped, false),
    xPostPurchase: bool(social.onPurchased ?? event.xPostPurchase, false),
    on_schedule_live: bool(social.onScheduleLive ?? event.on_schedule_live, false),
    on_booking_received: bool(social.onBookingReceived ?? event.on_booking_received, false),
    on_in_session: bool(social.onInSession ?? event.on_in_session, false),
    on_tipped_session: bool(social.onTipped ?? event.on_tipped_session, false),
    on_purchased: bool(social.onPurchased ?? event.on_purchased, false),
  };
}

function normalizeAddOns(addOns = []) {
  return normalizeArray(addOns).map((item) => ({
    title: stringValue(item?.title || item?.name, ""),
    description: stringValue(item?.description, ""),
    priceTokens: fieldNumber(item?.priceTokens ?? item?.tokens ?? item?.price, ""),
  })).filter((item) => item.title);
}

function normalizeRepeatRule(value) {
  const normalized = String(value || "").trim();
  if (normalized === "doesNotRepeat" || normalized === "monthly" || normalized === "daily") return normalized;
  return "weekly";
}

function normalizeWeeklyAvailability(event = {}) {
  const days = makeDefaultWeeklyAvailability();
  const slots = normalizeArray(event.slots);

  slots.forEach((slot) => {
    const slotDate = resolveHktDateForWeeklySlot(event, slot);
    const endSlotDate = addDaysToDateIso(slotDate, Number(slot?.endDayOffset) > 0 ? 1 : 0);
    const localStart = localPartsFromHktParts(slotDate, slot?.startTime, toHm(slot?.startTime, "15:00"));
    const localEnd = localPartsFromHktParts(endSlotDate, slot?.endTime, toHm(slot?.endTime, "16:00"));
    const key = localStart.dayKey || DAY_NAME_TO_KEY[String(slot?.day || "").toLowerCase()];
    const target = days.find((day) => day.key === key);
    if (!target) return;
    target.unavailable = false;
    target.slots.push({
      startTime: localStart.hm,
      endTime: localEnd.hm,
      offHours: bool(slot.offHours, false),
    });
    target.offHours = target.slots.some((item) => item.offHours);
  });

  return days.map((day) => (day.slots.length > 0 ? day : { ...day, unavailable: true, slots: [], offHours: false }));
}

function normalizeOneTimeAvailability(event = {}) {
  const slots = normalizeArray(event.slots);
  if (slots.length === 0) {
    return [{
      id: "date_edit_0",
      date: dateFromHktDateLike(event.eventTime?.start || event.dateFrom, ""),
      slots: [{
        startTime: extractHm(event.eventTime?.start, "15:00"),
        endTime: extractHm(event.eventTime?.end, "16:00"),
      }],
    }];
  }

  return slots.map((entry, index) => {
    const date = dateFromHktDateLike(entry?.date, "");
    const times = normalizeArray(entry?.times);
    return {
      id: entry?.id || `date_edit_${index}`,
      date,
      slots: times.map((time) => ({
        startTime: localTimeFromHktParts(entry?.date, time?.startTime, toHm(time?.startTime, "12:00")),
        endTime: localTimeFromHktParts(entry?.date, time?.endTime, toHm(time?.endTime, "15:00")),
      })),
    };
  }).filter((entry) => entry.date);
}

function normalizeMonthlyAvailability(event = {}) {
  const slots = normalizeArray(event.slots);
  const dateFrom = extractDateIso(event.dateFrom, extractDateIso(event.eventTime?.start, ""));
  if (slots.length === 0) {
    return [{
      startTime: extractHm(event.eventTime?.start, "15:00"),
      endTime: extractHm(event.eventTime?.end, "16:00"),
      offHours: false,
    }];
  }

  return slots.map((slot) => {
    const endDate = addDaysToDateIso(dateFrom, Number(slot?.endDayOffset) > 0 ? 1 : 0);
    return {
      startTime: localTimeFromHktParts(dateFrom, slot?.startTime, toHm(slot?.startTime, "15:00")),
      endTime: localTimeFromHktParts(endDate, slot?.endTime, toHm(slot?.endTime, "16:00")),
      offHours: bool(slot?.offHours, false),
    };
  });
}

function derivePrimaryLocalSlot(event = {}) {
  const repeatRule = normalizeRepeatRule(event.repeatRule);

  if (event.eventTime?.start || event.eventTime?.end) {
    const start = localPartsFromAbsoluteIso(event.eventTime?.start, "15:00");
    const end = localPartsFromAbsoluteIso(event.eventTime?.end, "16:00");
    return {
      selectedDate: start.dateIso,
      selectedStartTime: start.hm,
      selectedEndTime: end.hm,
    };
  }

  if (repeatRule === "doesNotRepeat") {
    const firstDate = normalizeOneTimeAvailability(event)[0];
    const firstSlot = firstDate?.slots?.[0];
    return {
      selectedDate: firstDate?.date || dateFromHktDateLike(event.dateFrom, ""),
      selectedStartTime: firstSlot?.startTime || "15:00",
      selectedEndTime: firstSlot?.endTime || "16:00",
    };
  }

  if (repeatRule === "monthly") {
    const firstSlot = normalizeMonthlyAvailability(event)[0];
    return {
      selectedDate: dateFromHktDateLike(event.dateFrom, ""),
      selectedStartTime: firstSlot?.startTime || "15:00",
      selectedEndTime: firstSlot?.endTime || "16:00",
    };
  }

  const firstOpenDay = normalizeWeeklyAvailability(event).find((day) => !day.unavailable && day.slots.length > 0);
  const firstSlot = firstOpenDay?.slots?.[0];
  const dateFrom = dateFromHktDateLike(event.dateFrom, "");
  if (dateFrom && firstOpenDay?.key) {
    const base = new Date(`${dateFrom}T12:00:00`);
    const targetIndex = DAY_INDEX_TO_KEY.indexOf(firstOpenDay.key);
    if (!Number.isNaN(base.getTime()) && targetIndex >= 0) {
      const shift = ((targetIndex - base.getDay()) + 7) % 7;
      base.setDate(base.getDate() + shift);
      return {
        selectedDate: formatLocalDateIso(base) || dateFrom,
        selectedStartTime: firstSlot?.startTime || "15:00",
        selectedEndTime: firstSlot?.endTime || "16:00",
      };
    }
  }

  return {
    selectedDate: dateFrom,
    selectedStartTime: firstSlot?.startTime || "15:00",
    selectedEndTime: firstSlot?.endTime || "16:00",
  };
}

export function mapEventToBookingFormState(event = {}) {
  const type = String(event.type || event.eventType || "").toLowerCase() === "group-event"
    ? "group"
    : "private";
  const repeatRule = normalizeRepeatRule(event.repeatRule);
  const primary = derivePrimaryLocalSlot(event);

  return {
    editEventId: event.eventId || event.id || "",
    eventId: event.eventId || event.id || "",
    eventType: type === "group" ? "group-event" : "1on1-call",
    eventTitle: stringValue(event.title || event.name, ""),
    eventDescription: stringValue(event.description, ""),
    eventColorSkin: stringValue(event.eventColorSkin, DEFAULT_EVENT_COLOR),
    eventCallType: stringValue(event.eventCallType, "video"),
    eventRingtoneUrl: stringValue(event.eventRingtoneUrl, DEFAULT_RINGTONE_URL),
    eventImageUrl: stringValue(event.eventImageUrl, ""),
    creatorTimezone: stringValue(event.creatorTimezone, "Asia/Hong_Kong"),
    repeatRule,
    repeatX: Number(event.repeatX) || 2,
    selectedDate: primary.selectedDate,
    selectedStartTime: primary.selectedStartTime,
    selectedEndTime: primary.selectedEndTime,
    dateFrom: dateFromHktDateLike(event.dateFrom, primary.selectedDate),
    dateTo: dateFromHktDateLike(event.dateTo, ""),
    weeklyAvailability: normalizeWeeklyAvailability(event),
    monthlyAvailability: normalizeMonthlyAvailability(event),
    oneTimeAvailability: normalizeOneTimeAvailability(event),
    duration: fieldNumber(event.sessionDurationMinutes, ""),
    maxSessionDuration: fieldNumber(event.maxSessionMinutes, ""),
    basePrice: fieldNumber(event.basePriceTokens, ""),
    sessionMinimum: fieldNumber(event.discountMinSessions, ""),
    longerSessionDiscountTokens: fieldNumber(event.longerSessionDiscountTokens ?? event.discountPercentOfBase, ""),
    discountPercentage: fieldNumber(event.recurringDiscountPercentOfBase ?? event.discountPercentOfBase, ""),
    firstTimeDiscountTokens: fieldNumber(event.firstTimeDiscountTokens ?? event.firstTimeDiscount, ""),
    firstTimeDiscount: fieldNumber(event.firstTimeDiscountTokens ?? event.firstTimeDiscount, ""),
    bookingFee: fieldNumber(event.bookingFeeTokens, ""),
    advanceVoid: fieldNumber(event.advanceCancelWindowQuantity, ""),
    advanceCancelWindowUnit: stringValue(event.advanceCancelWindowUnit, "day"),
    offHourSurcharge: fieldNumber(event.offHourSurchargePercent, ""),
    remindMeTime: fieldNumber(event.callReminderMinutesBefore, ""),
    bufferTime: fieldNumber(event.bookingBufferMinutes, ""),
    bufferUnit: "minutes",
    maxBookingsPerDay: fieldNumber(event.maxBookingsPerDay, ""),
    rescheduleFee: fieldNumber(event.rescheduleFeeTokens, ""),
    cancellationFee: fieldNumber(event.cancellationFeeTokens, ""),
    extendSessionMax: fieldNumber(event.extendMaxSessions, ""),
    allowLongerSessions: bool(event.allowLongerSessions, false),
    enableLongerDiscount: bool(event.enableDiscountForLonger ?? event.enableDiscountForRecurring, false),
    enableFirstTimeDiscount: bool(event.enableFirstTimeDiscount, false),
    enableBookingFee: bool(event.enableBookingFee, false),
    allowInstantBooking: bool(event.allowInstantBooking, type === "group"),
    disableChatBeforeCall: bool(event.disableChatBeforeCall, false),
    disableChatAllowEmoji: bool(event.disableChatAllowEmoji, false),
    enableRescheduleFee: bool(event.enableRescheduleFee, false),
    enableCancellationFee: bool(event.enableCancellationFee, false),
    allowAdvanceCancellation: bool(event.allowAdvanceCancelToAvoidMinCharge, false),
    addOffHourSurcharge: bool(event.offHourSurcharge, false),
    disableChatDuringCall: bool(event.disableChatDuringCall, false),
    disableChatDuringCallAllowEmoji: bool(event.disableChatDuringCallAllowEmoji, false),
    requestExtendSession: bool(event.fanCanRequestExtend, false),
    setBufferTime: bool(event.enableBufferTime, false),
    setMaxBookings: bool(event.enableMaxBookingsPerDay, false),
    eventGoalTokens: fieldNumber(event.eventGoalTokens, ""),
    enableMinContributionPerUser: event.minContributionPerUser !== null && event.minContributionPerUser !== undefined,
    minContributionPerUser: fieldNumber(event.minContributionPerUser, ""),
    goalNotMet: stringValue(event.goalNotMet, "cancelEvent"),
    priceSetting: stringValue(event.priceSetting || event.priceSettings, type === "group" ? "eventGoal" : "fixedPricePerUser"),
    enableMaxAttendees: bool(event.enableMaxAttendees, false),
    maxAttendees: fieldNumber(event.maxAttendees, ""),
    allowRecording: bool(event.allowFanRecordingEnabled, false),
    recordingPrice: fieldNumber(event.allowFanRecordingTokens, ""),
    allowPersonalRequest: bool(event.allowPersonalRequestRequired, false),
    personalRequestNote: stringValue(event.personalRequestNote, ""),
    addOns: normalizeAddOns(event.addOns),
    blockedUsers: normalizeArray(event.blockedUsers),
    coPerformerSearch: "",
    whoCanBook: stringValue(event.whoCanBook, "everyone"),
    subscriptionTiers: normalizeArray(event.subscriptionTiers),
    invitedUsers: normalizeArray(event.invitedUsers),
    inviteSecret: stringValue(event.inviteSecret, ""),
    spendingRequirement: stringValue(event.spendingRequirement, "none"),
    minSpendTokens: fieldNumber(event.minSpendTokens, ""),
    requiredProducts: normalizeArray(event.requiredProducts),
    setReminders: bool(event.enableCallReminderMinutesBefore ?? event.setReminders, false),
    status: stringValue(event.status, "active"),
    originalEvent: event,
    formMode: "edit",
    isEditMode: true,
    ...normalizeSocialAutoPost(event),
  };
}
