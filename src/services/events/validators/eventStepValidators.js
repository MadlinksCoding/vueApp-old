function asNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeBookingBufferMinutes(value, unit = "minutes") {
  if (isBlank(value)) return null;

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return null;

  const normalizedUnit = String(unit || "minutes").trim().toLowerCase();
  if (normalizedUnit === "hour" || normalizedUnit === "hours") {
    return parsed * 60;
  }

  return parsed;
}

function isBlank(value) {
  return value === null || value === undefined || String(value).trim().length === 0;
}

function asError(field, translationKey, message, params = {}, meta = {}) {
  return { field, translationKey, message, params, ...meta };
}

function firstNonBlank(...values) {
  return values.find((value) => !isBlank(value));
}

function addRequiredNumberError(
  errors,
  values,
  {
    field,
    translationKey,
    message,
    min,
    max,
    integer = false,
    conditional = true,
  },
) {
  const rawValue = Array.isArray(values)
    ? firstNonBlank(...values)
    : values;
  const parsed = Number(rawValue);
  const blank = isBlank(rawValue);
  const invalid = blank
    || !Number.isFinite(parsed)
    || (integer && !Number.isInteger(parsed))
    || (min !== undefined && parsed < min)
    || (max !== undefined && parsed > max);

  if (invalid) {
    errors.push(asError(field, translationKey, message, {}, { conditional: conditional && blank }));
  }
}

function hasAnyValidSlots(slots) {
  if (!Array.isArray(slots)) return false;
  return slots.some((slot) => {
    const start = typeof slot?.startTime === "string" ? slot.startTime.trim() : "";
    const end = typeof slot?.endTime === "string" ? slot.endTime.trim() : "";
    return start.length > 0 && end.length > 0;
  });
}

function hmToMinutes(value) {
  const match = String(value || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return (hours * 60) + minutes;
}

function slotBoundaryMinutes(slot = {}, { inclusiveEndOfDay = false } = {}) {
  const start = hmToMinutes(slot?.startTime);
  const rawEnd = hmToMinutes(slot?.endTime);
  if (start == null || rawEnd == null) return null;
  const end = inclusiveEndOfDay && rawEnd === (24 * 60) - 1 && rawEnd >= start
    ? 24 * 60
    : rawEnd;
  return { start, end };
}

function slotDurationMinutes(slot = {}, options = {}) {
  const boundary = slotBoundaryMinutes(slot, options);
  if (!boundary || boundary.end <= boundary.start) return null;
  return boundary.end - boundary.start;
}

function hasInvalidSlotTimeOrder(slot = {}, options = {}) {
  const start = typeof slot?.startTime === "string" ? slot.startTime.trim() : "";
  const end = typeof slot?.endTime === "string" ? slot.endTime.trim() : "";
  if (!start || !end) return false;
  const boundary = slotBoundaryMinutes(slot, options);
  return Boolean(boundary && boundary.end <= boundary.start);
}

function slotTimeRange(slot = {}) {
  const boundary = slotBoundaryMinutes(slot);
  if (!boundary || boundary.end <= boundary.start) return null;
  return boundary;
}

const MINUTES_PER_DAY = 24 * 60;
const MINUTES_PER_WEEK = MINUTES_PER_DAY * 7;

function splitTimeRange(range) {
  if (!range) return [];
  if (range.end <= MINUTES_PER_DAY) return [range];
  return [
    { start: range.start, end: MINUTES_PER_DAY },
    { start: 0, end: range.end - MINUTES_PER_DAY },
  ].filter((segment) => segment.end > segment.start);
}

function timeRangesOverlap(first, second) {
  if (!first || !second) return false;
  const firstSegments = splitTimeRange(first);
  const secondSegments = splitTimeRange(second);
  return firstSegments.some((firstSegment) => secondSegments.some((secondSegment) => (
    firstSegment.start < secondSegment.end && secondSegment.start < firstSegment.end
  )));
}

function hasOverlappingSlots(slots = []) {
  const seenRanges = [];
  for (const slot of Array.isArray(slots) ? slots : []) {
    const range = slotTimeRange(slot);
    if (!range) continue;
    if (seenRanges.some((seenRange) => timeRangesOverlap(seenRange, range))) {
      return true;
    }
    seenRanges.push(range);
  }
  return false;
}

const WEEKDAY_INDEX = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
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

function getWeeklyDayIndex(day = {}, fallbackIndex = 0) {
  const key = String(day?.key || day?.day || day?.name || "").toLowerCase();
  const mapped = WEEKDAY_INDEX[key];
  return Number.isFinite(mapped) ? mapped : fallbackIndex;
}

function weeklyRangesOverlap(first, second) {
  if (!first || !second) return false;
  return [-MINUTES_PER_WEEK, 0, MINUTES_PER_WEEK].some((shift) => {
    const shiftedFirst = {
      start: first.start + shift,
      end: first.end + shift,
    };
    return shiftedFirst.start < second.end && second.start < shiftedFirst.end;
  });
}

function hasOverlappingWeeklyAvailability(state = {}) {
  const weekly = Array.isArray(state?.weeklyAvailability) ? state.weeklyAvailability : [];
  const seenRanges = [];

  for (const [dayIndexFallback, day] of weekly.entries()) {
    if (day?.unavailable) continue;
    const dayIndex = getWeeklyDayIndex(day, dayIndexFallback);
    const slots = Array.isArray(day?.slots) ? day.slots : [];
    if (hasOverlappingSlots(slots)) {
      return true;
    }

    for (const slot of slots) {
      const range = slotTimeRange(slot);
      if (!range) continue;
      const absoluteRange = {
        start: (dayIndex * MINUTES_PER_DAY) + range.start,
        end: (dayIndex * MINUTES_PER_DAY) + range.end,
      };
      if (seenRanges.some((seenRange) => weeklyRangesOverlap(seenRange, absoluteRange))) {
        return true;
      }
      seenRanges.push(absoluteRange);
    }
  }

  return false;
}

function hasSlotUnderMinimumDuration(slots = [], options = {}) {
  return (Array.isArray(slots) ? slots : []).some((slot) => {
    const start = typeof slot?.startTime === "string" ? slot.startTime.trim() : "";
    const end = typeof slot?.endTime === "string" ? slot.endTime.trim() : "";
    if (!start || !end) return false;
    const duration = slotDurationMinutes(slot, options);
    return duration == null ? !hasInvalidSlotTimeOrder(slot, options) : duration < 5;
  });
}

function hasSlotWithInvalidTimeOrder(slots = [], options = {}) {
  return (Array.isArray(slots) ? slots : []).some((slot) => hasInvalidSlotTimeOrder(slot, options));
}

function hasAtLeastOneWeeklySlot(state = {}) {
  const weekly = Array.isArray(state?.weeklyAvailability) ? state.weeklyAvailability : [];
  return weekly.some((day) => {
    if (day?.unavailable) return false;
    return hasAnyValidSlots(day?.slots);
  });
}

function hasAtLeastOneWeeklyGroupSlot(state = {}) {
  const weekly = Array.isArray(state?.weeklyAvailability) ? state.weeklyAvailability : [];
  return weekly.some((day) => {
    if (day?.unavailable) return false;
    return hasAnyValidSlots(day?.slots);
  });
}

function hasWeeklySlotUnderMinimumDuration(state = {}, options = {}) {
  const weekly = Array.isArray(state?.weeklyAvailability) ? state.weeklyAvailability : [];
  return weekly.some((day) => !day?.unavailable && hasSlotUnderMinimumDuration(day?.slots, options));
}

function hasWeeklySlotWithInvalidTimeOrder(state = {}, options = {}) {
  const weekly = Array.isArray(state?.weeklyAvailability) ? state.weeklyAvailability : [];
  return weekly.some((day) => !day?.unavailable && hasSlotWithInvalidTimeOrder(day?.slots, options));
}

function hasAtLeastOneOneTimeSlot(state = {}) {
  const oneTime = Array.isArray(state?.oneTimeAvailability) ? state.oneTimeAvailability : [];
  return oneTime.some((entry) => hasAnyValidSlots(entry?.slots));
}

function hasAtLeastOneOneTimeGroupSlot(state = {}) {
  const oneTime = Array.isArray(state?.oneTimeAvailability) ? state.oneTimeAvailability : [];
  return oneTime.some((entry) => hasAnyValidSlots(entry?.slots));
}

function hasOneTimeSlotUnderMinimumDuration(state = {}, options = {}) {
  const oneTime = Array.isArray(state?.oneTimeAvailability) ? state.oneTimeAvailability : [];
  return oneTime.some((entry) => hasSlotUnderMinimumDuration(entry?.slots, options));
}

function hasOneTimeSlotWithInvalidTimeOrder(state = {}, options = {}) {
  const oneTime = Array.isArray(state?.oneTimeAvailability) ? state.oneTimeAvailability : [];
  return oneTime.some((entry) => hasSlotWithInvalidTimeOrder(entry?.slots, options));
}

function hasOneTimeDateWithoutSlot(state = {}) {
  const oneTime = Array.isArray(state?.oneTimeAvailability) ? state.oneTimeAvailability : [];
  return oneTime.some((entry) => {
    const hasDate = typeof entry?.date === "string" && entry.date.trim().length > 0;
    if (!hasDate) return false;
    return !hasAnyValidSlots(entry?.slots);
  });
}

function findOneTimeAvailabilityDuplicates(state = {}) {
  const entries = Array.isArray(state?.oneTimeAvailability) ? state.oneTimeAvailability : [];
  const seenDates = new Set();
  let hasDuplicateDate = false;
  let hasDuplicateSlot = false;

  entries.forEach((entry) => {
    const date = typeof entry?.date === "string" ? entry.date.trim() : "";
    if (date) {
      if (seenDates.has(date)) {
        hasDuplicateDate = true;
      } else {
        seenDates.add(date);
      }
    }

    if (hasOverlappingSlots(entry?.slots)) {
      hasDuplicateSlot = true;
    }
  });

  return { hasDuplicateDate, hasDuplicateSlot };
}

function hasAtLeastOneMonthlySlot(state = {}) {
  const monthly = Array.isArray(state?.monthlyAvailability) ? state.monthlyAvailability : [];
  return hasAnyValidSlots(monthly);
}

function hasAtLeastOneMonthlyGroupSlot(state = {}) {
  const monthly = Array.isArray(state?.monthlyAvailability) ? state.monthlyAvailability : [];
  return hasAnyValidSlots(monthly);
}

function hasMonthlySlotUnderMinimumDuration(state = {}, options = {}) {
  const monthly = Array.isArray(state?.monthlyAvailability) ? state.monthlyAvailability : [];
  return hasSlotUnderMinimumDuration(monthly, options);
}

function hasMonthlySlotWithInvalidTimeOrder(state = {}, options = {}) {
  const monthly = Array.isArray(state?.monthlyAvailability) ? state.monthlyAvailability : [];
  return hasSlotWithInvalidTimeOrder(monthly, options);
}

function asArray(value) {
  if (Array.isArray(value)) return value.filter((item) => item !== null && item !== undefined && item !== "");
  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function hasAnyAddonValue(addOn = {}) {
  const title = typeof addOn?.title === "string" ? addOn.title.trim() : "";
  const description = typeof addOn?.description === "string" ? addOn.description.trim() : "";
  const priceRaw = addOn?.priceTokens;
  const hasPrice = priceRaw !== null && priceRaw !== undefined && String(priceRaw).trim() !== "";
  return Boolean(title || description || hasPrice);
}

export function step1Validator(state = {}) {
  const errors = [];

  if (!state?.eventTitle || String(state.eventTitle).trim().length === 0) {
    errors.push(asError("eventTitle", "booking_validation_event_title_required", "Event title is required."));
  }

  const isGroupEvent = state?.eventType === "group-event" || state?.type === "group-event";
  const isGroupEventGoal = isGroupEvent && state?.priceSetting === "eventGoal";

  if (!isGroupEvent) {
    const duration = asNumber(state?.duration);
    if (duration == null || duration < 5) {
      errors.push(asError("duration", "booking_validation_duration_min", "Session duration must be at least 5 minutes."));
    }

    if (state?.allowLongerSessions) {
      addRequiredNumberError(errors, [state?.maxSessionDuration, state?.maxSessionMinutes], {
        field: "maxSessionDuration",
        translationKey: "booking_validation_max_session_duration_min",
        message: "Maximum session allowed must be at least 2 sessions.",
        min: 2,
        integer: true,
      });
    }
  }

  if (isGroupEventGoal) {
    const eventGoalTokens = asNumber(state?.eventGoalTokens);
    if (eventGoalTokens == null || eventGoalTokens <= 0) {
      errors.push(asError("eventGoalTokens", "booking_validation_event_goal_required", "Event goal must be greater than 0."));
    }

    if (state?.enableMinContributionPerUser) {
      const minContributionPerUser = asNumber(state?.minContributionPerUser);
      if (minContributionPerUser == null || minContributionPerUser <= 0) {
        errors.push(asError("minContributionPerUser", "booking_validation_min_contribution_min", "Minimum contribution must be greater than 0."));
      }
    }
  } else {
    if (isBlank(state?.basePrice)) {
      errors.push(asError("basePrice", "booking_validation_base_price_required", "Base price is required."));
    } else {
      const basePrice = asNumber(state?.basePrice);
      if (basePrice == null || basePrice < 0) {
        errors.push(asError("basePrice", "booking_validation_base_price_min", "Base price must be 0 or higher."));
      }
    }
  }

  if (state?.enableFirstTimeDiscount) {
    addRequiredNumberError(errors, [state?.firstTimeDiscountTokens, state?.firstTimeDiscount], {
      field: "firstTimeDiscountTokens",
      translationKey: "booking_validation_first_time_discount_range",
      message: "First-time discount must be at least 1 token.",
      min: 1,
    });
  }

  if (!isGroupEvent && state?.enableLongerDiscount) {
    addRequiredNumberError(errors, [state?.sessionMinimum, state?.discountMinSessions], {
      field: "sessionMinimum",
      translationKey: "booking_validation_discount_min_sessions",
      message: "Longer-session discount minimum must be at least 2 sessions.",
      min: 2,
      integer: true,
    });

    addRequiredNumberError(errors, [state?.longerSessionDiscountTokens, state?.discountPercentage, state?.discountPercentOfBase], {
      field: "longerSessionDiscountTokens",
      translationKey: "booking_validation_longer_discount_tokens",
      message: "Longer-session discount must be at least 1 token.",
      min: 1,
    });
  }

  if (isGroupEvent && state?.priceSetting === "fixedPricePerUser" && (state?.enableLongerDiscount || state?.enableDiscountForRecurring)) {
    addRequiredNumberError(errors, [state?.discountEventsCount, state?.minEventsForRecurringDiscount], {
      field: "discountEventsCount",
      translationKey: "booking_validation_recurring_discount_min_events",
      message: "Recurring discount minimum must be at least 2 events.",
      min: 2,
      integer: true,
    });

    addRequiredNumberError(errors, [state?.discountPercentage, state?.recurringDiscountPercentOfBase], {
      field: "discountPercentage",
      translationKey: "booking_validation_recurring_discount_percent_range",
      message: "Recurring discount must be between 0 and 100 percent.",
      min: 0,
      max: 100,
    });
  }

  if (state?.enableBookingFee) {
    addRequiredNumberError(errors, [state?.bookingFee, state?.bookingFeeTokens], {
      field: "bookingFee",
      translationKey: "booking_validation_booking_fee_min",
      message: "Booking fee must be at least 1 token.",
      min: 1,
    });
  }

  if (state?.enableRescheduleFee) {
    addRequiredNumberError(errors, [state?.rescheduleFee, state?.rescheduleFeeTokens], {
      field: "rescheduleFee",
      translationKey: "booking_validation_reschedule_fee_min",
      message: "Reschedule fee must be at least 1 token.",
      min: 1,
    });
  }

  if (state?.enableCancellationFee) {
    addRequiredNumberError(errors, [state?.cancellationFee, state?.cancellationFeeTokens], {
      field: "cancellationFee",
      translationKey: "booking_validation_cancellation_fee_min",
      message: "Cancellation fee must be at least 1 token.",
      min: 1,
    });
  }

  if (state?.allowAdvanceCancellation || state?.allowAdvanceCancelToAvoidMinCharge) {
    addRequiredNumberError(errors, [state?.advanceVoid, state?.advanceCancelWindowQuantity], {
      field: "advanceVoid",
      translationKey: "booking_validation_advance_cancel_min",
      message: "Advance cancellation window must be at least 1.",
      min: 1,
      integer: true,
    });

    if (isBlank(state?.advanceCancelWindowUnit)) {
      errors.push(asError("advanceCancelWindowUnit", "booking_validation_advance_cancel_unit_required", "Advance cancellation unit is required.", {}, { conditional: true }));
    }
  }

  if (state?.addOffHourSurcharge || state?.offHourSurcharge === true) {
    addRequiredNumberError(errors, [state?.offHourSurcharge, state?.offHourSurchargePercent], {
      field: "offHourSurcharge",
      translationKey: "booking_validation_off_hour_surcharge_range",
      message: "Off-hour surcharge must be between 1 and 100 percent.",
      min: 1,
      max: 100,
    });
  }

  if (!isGroupEvent && (state?.requestExtendSession || state?.fanCanRequestExtend)) {
    addRequiredNumberError(errors, [state?.extendSessionMax, state?.extendMaxSessions], {
      field: "extendSessionMax",
      translationKey: "booking_validation_extend_session_max_min",
      message: "Extension session maximum must be at least 1 session.",
      min: 1,
      integer: true,
    });
  }

  if (state?.setReminders || state?.enableCallReminderMinutesBefore) {
    addRequiredNumberError(errors, [state?.remindMeTime, state?.callReminderMinutesBefore], {
      field: "remindMeTime",
      translationKey: "booking_validation_reminder_time_min",
      message: "Reminder time must be at least 1 minute.",
      min: 1,
      integer: true,
    });
  }

  if (state?.setBufferTime || state?.enableBufferTime) {
    const rawBufferTime = firstNonBlank(state?.bufferTime, state?.bookingBufferMinutes);
    const bookingBufferMinutes = normalizeBookingBufferMinutes(rawBufferTime, state?.bufferUnit);
    if (bookingBufferMinutes == null || bookingBufferMinutes < 5) {
      errors.push(asError("bookingBufferMinutes", "booking_validation_buffer_time_min", "Buffer time must be at least 5 minutes.", {}, { conditional: isBlank(rawBufferTime) }));
    }
  }

  if (!isGroupEvent && (state?.setMaxBookings || state?.enableMaxBookingsPerDay)) {
    addRequiredNumberError(errors, [state?.maxBookingsPerDay], {
      field: "maxBookingsPerDay",
      translationKey: "booking_validation_max_bookings_per_day_min",
      message: "Maximum bookings per day must be at least 1.",
      min: 1,
      integer: true,
    });
  }

  if (isGroupEvent && state?.enableMaxAttendees) {
    addRequiredNumberError(errors, [state?.maxAttendees], {
      field: "maxAttendees",
      translationKey: "booking_validation_max_attendees_min",
      message: "Maximum participants must be at least 1.",
      min: 1,
      integer: true,
    });
  }

  const repeatRule = state?.repeatRule || "weekly";
  const durationOptions = { inclusiveEndOfDay: !isGroupEvent };
  if (repeatRule === "doesNotRepeat") {
    const hasSlot = isGroupEvent ? hasAtLeastOneOneTimeGroupSlot(state) : hasAtLeastOneOneTimeSlot(state);
    if (!hasSlot) {
      errors.push(asError("oneTimeAvailability", "booking_validation_one_time_slot_required", "Add at least one available slot before continuing."));
    } else if (hasOneTimeDateWithoutSlot(state)) {
      errors.push(asError("oneTimeAvailability", "booking_validation_one_time_date_slot_required", "Each custom date must have at least one available time slot."));
    }

    if (hasOneTimeSlotWithInvalidTimeOrder(state, durationOptions)) {
      errors.push(asError("oneTimeAvailability", "booking_validation_time_slot_order", "End time must be after start time."));
    } else if (hasOneTimeSlotUnderMinimumDuration(state, durationOptions)) {
      errors.push(asError("oneTimeAvailability", "booking_validation_time_slot_duration_min", "Time slots must be at least 5 minutes."));
    }

    const { hasDuplicateDate, hasDuplicateSlot } = findOneTimeAvailabilityDuplicates(state);
    if (hasDuplicateDate) {
      errors.push(asError("oneTimeAvailability", "booking_validation_one_time_date_unique", "Each custom date can only be added once."));
    }
    if (hasDuplicateSlot) {
      errors.push(asError("oneTimeAvailability", "booking_validation_one_time_slot_unique", "Each custom time slot must be unique and cannot overlap another slot for that date."));
    }
  } else if (repeatRule === "monthly") {
    if (!state?.dateFrom || String(state.dateFrom).trim().length === 0) {
      errors.push(asError("dateFrom", "booking_validation_monthly_start_required", "Start date is required for monthly repeat."));
    }
    const hasSlot = isGroupEvent ? hasAtLeastOneMonthlyGroupSlot(state) : hasAtLeastOneMonthlySlot(state);
    if (!hasSlot) {
      errors.push(asError("monthlyAvailability", "booking_validation_monthly_slot_required", "Add at least one monthly slot before continuing."));
    }
    if (hasMonthlySlotWithInvalidTimeOrder(state, durationOptions)) {
      errors.push(asError("monthlyAvailability", "booking_validation_time_slot_order", "End time must be after start time."));
    } else if (hasMonthlySlotUnderMinimumDuration(state, durationOptions)) {
      errors.push(asError("monthlyAvailability", "booking_validation_time_slot_duration_min", "Time slots must be at least 5 minutes."));
    }
    if (hasOverlappingSlots(state?.monthlyAvailability)) {
      errors.push(asError("monthlyAvailability", "booking_validation_monthly_slot_unique", "Each monthly time slot must be unique and cannot overlap another monthly slot."));
    }
  } else if (!(isGroupEvent ? hasAtLeastOneWeeklyGroupSlot(state) : hasAtLeastOneWeeklySlot(state))) {
    errors.push(asError("weeklyAvailability", "booking_validation_weekly_slot_required", "Add at least one available slot before continuing."));
  } else {
    if (hasWeeklySlotWithInvalidTimeOrder(state, durationOptions)) {
      errors.push(asError("weeklyAvailability", "booking_validation_time_slot_order", "End time must be after start time."));
    } else if (hasWeeklySlotUnderMinimumDuration(state, durationOptions)) {
      errors.push(asError("weeklyAvailability", "booking_validation_time_slot_duration_min", "Time slots must be at least 5 minutes."));
    }
    if (hasOverlappingWeeklyAvailability(state)) {
      errors.push(asError("weeklyAvailability", "booking_validation_weekly_slot_unique", "Each weekly time slot must be unique and cannot overlap another weekly slot."));
    }
  }

  return { errors };
}

export function step2Validator(state = {}) {
  const errors = [];

  if (state?.allowRecording) {
    addRequiredNumberError(errors, [state?.recordingPrice, state?.allowFanRecordingTokens], {
      field: "recordingPrice",
      translationKey: "booking_validation_recording_price_min",
      message: "Recording price must be 0 or higher.",
      min: 0,
    });
  }

  if (state?.whoCanBook === "subscribersOnly") {
    const tiers = asArray(state?.subscriptionTiers);
    if (tiers.length === 0) {
      errors.push(asError("subscriptionTiers", "booking_validation_subscription_tiers_required", "Please select at least one subscription tier.", {}, { conditional: true }));
    }
  }

  if (state?.whoCanBook === "inviteOnly") {
    const inviteSecret = typeof state?.inviteSecret === "string"
      ? state.inviteSecret.trim()
      : "";
    if (!inviteSecret) {
      errors.push(asError("inviteSecret", "booking_validation_invite_secret_required", "Invite link is not ready yet. Please try again.", {}, { conditional: true }));
    }
  }

  if (state?.spendingRequirement === "minSpend") {
    addRequiredNumberError(errors, [state?.minSpendTokens], {
      field: "minSpendTokens",
      translationKey: "booking_validation_min_spend_tokens_min",
      message: "Minimum spend must be 0 or higher.",
      min: 0,
    });
  }

  if (state?.spendingRequirement === "mustOwnProducts") {
    const requiredProducts = Array.isArray(state?.requiredProducts)
      ? state.requiredProducts.filter((item) => item && item.id && item.type)
      : [];
    if (requiredProducts.length === 0) {
      errors.push(asError("requiredProducts", "booking_validation_required_products_required", "Please add at least one required product.", {}, { conditional: true }));
    }
  }

  const addOns = Array.isArray(state?.addOns) ? state.addOns : [];
  addOns.forEach((addOn, index) => {
    if (!hasAnyAddonValue(addOn)) return;

    const title = typeof addOn?.title === "string" ? addOn.title.trim() : "";
    if (!title) {
      errors.push(asError(`addOns.${index}.title`, "booking_validation_addon_title_required", `Add-on service ${index + 1} title is required.`, { index: index + 1 }, { conditional: true }));
    }

    if (isBlank(addOn?.priceTokens)) {
      errors.push(asError(`addOns.${index}.priceTokens`, "booking_validation_addon_price_min", `Add-on service ${index + 1} price must be 0 or higher.`, { index: index + 1 }, { conditional: true }));
      return;
    }

    const price = asNumber(addOn?.priceTokens);
    if (price == null || price < 0) {
      errors.push(asError(`addOns.${index}.priceTokens`, "booking_validation_addon_price_min", `Add-on service ${index + 1} price must be 0 or higher.`, { index: index + 1 }, { conditional: true }));
    }
  });

  return { errors };
}
