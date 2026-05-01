function asNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asError(field, translationKey, message, params = {}) {
  return { field, translationKey, message, params };
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

function slotDurationMinutes(slot = {}) {
  const start = hmToMinutes(slot?.startTime);
  const end = hmToMinutes(slot?.endTime);
  if (start == null || end == null) return null;
  if (end > start) return end - start;
  if (end < start) return (24 * 60) - start + end;
  return 0;
}

function hasAnyValidGroupSlots(slots) {
  if (!Array.isArray(slots)) return false;
  return slots.some((slot) => {
    const duration = slotDurationMinutes(slot);
    return duration != null && duration >= 5;
  });
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
    return hasAnyValidGroupSlots(day?.slots);
  });
}

function hasAtLeastOneOneTimeSlot(state = {}) {
  const oneTime = Array.isArray(state?.oneTimeAvailability) ? state.oneTimeAvailability : [];
  return oneTime.some((entry) => hasAnyValidSlots(entry?.slots));
}

function hasAtLeastOneOneTimeGroupSlot(state = {}) {
  const oneTime = Array.isArray(state?.oneTimeAvailability) ? state.oneTimeAvailability : [];
  return oneTime.some((entry) => hasAnyValidGroupSlots(entry?.slots));
}

function hasAtLeastOneMonthlySlot(state = {}) {
  const monthly = Array.isArray(state?.monthlyAvailability) ? state.monthlyAvailability : [];
  return hasAnyValidSlots(monthly);
}

function hasAtLeastOneMonthlyGroupSlot(state = {}) {
  const monthly = Array.isArray(state?.monthlyAvailability) ? state.monthlyAvailability : [];
  return hasAnyValidGroupSlots(monthly);
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
    const basePrice = asNumber(state?.basePrice);
    if (basePrice == null || basePrice < 0) {
      errors.push(asError("basePrice", "booking_validation_base_price_min", "Base price must be 0 or higher."));
    }
  }

  if (state?.enableFirstTimeDiscount) {
    const firstTimeDiscount = asNumber(state?.firstTimeDiscount);
    if (firstTimeDiscount == null || firstTimeDiscount <= 0 || firstTimeDiscount > 100) {
      errors.push(asError("firstTimeDiscount", "booking_validation_first_time_discount_range", "First-time discount must be greater than 0 and no more than 100."));
    }
  }

  const repeatRule = state?.repeatRule || "weekly";
  if (repeatRule === "doesNotRepeat") {
    const hasSlot = isGroupEvent ? hasAtLeastOneOneTimeGroupSlot(state) : hasAtLeastOneOneTimeSlot(state);
    if (!hasSlot) {
      errors.push(asError("oneTimeAvailability", "booking_validation_one_time_slot_required", "Add at least one available slot before continuing."));
    }
  } else if (repeatRule === "monthly") {
    if (!state?.dateFrom || String(state.dateFrom).trim().length === 0) {
      errors.push(asError("dateFrom", "booking_validation_monthly_start_required", "Start date is required for monthly repeat."));
    }
    const hasSlot = isGroupEvent ? hasAtLeastOneMonthlyGroupSlot(state) : hasAtLeastOneMonthlySlot(state);
    if (!hasSlot) {
      errors.push(asError("monthlyAvailability", "booking_validation_monthly_slot_required", "Add at least one monthly slot before continuing."));
    }
  } else if (!(isGroupEvent ? hasAtLeastOneWeeklyGroupSlot(state) : hasAtLeastOneWeeklySlot(state))) {
    errors.push(asError("weeklyAvailability", "booking_validation_weekly_slot_required", "Add at least one available slot before continuing."));
  }

  return { errors };
}

export function step2Validator(state = {}) {
  const errors = [];

  if (state?.allowRecording) {
    const recordingPrice = asNumber(state?.recordingPrice);
    if (recordingPrice == null || recordingPrice < 0) {
      errors.push(asError("recordingPrice", "booking_validation_recording_price_min", "Recording price must be 0 or higher."));
    }
  }

  if (state?.enableCancellationFee) {
    const cancellationFee = asNumber(state?.cancellationFee);
    if (cancellationFee == null || cancellationFee <= 0) {
      errors.push(asError("cancellationFee", "booking_validation_cancellation_fee_min", "Cancellation fee must be greater than 0."));
    }
  }

  if (state?.allowAdvanceCancellation) {
    const advanceVoid = asNumber(state?.advanceVoid);
    if (advanceVoid == null || advanceVoid <= 0) {
      errors.push(asError("advanceVoid", "booking_validation_advance_cancel_min", "Advance cancellation window must be greater than 0."));
    }
    if (!state?.advanceCancelWindowUnit) {
      errors.push(asError("advanceCancelWindowUnit", "booking_validation_advance_cancel_unit_required", "Advance cancellation unit is required."));
    }
  }

  if (state?.whoCanBook === "subscribersOnly") {
    const tiers = asArray(state?.subscriptionTiers);
    if (tiers.length === 0) {
      errors.push(asError("subscriptionTiers", "booking_validation_subscription_tiers_required", "Please select at least one subscription tier."));
    }
  }

  if (state?.whoCanBook === "inviteOnly") {
    const inviteSecret = typeof state?.inviteSecret === "string"
      ? state.inviteSecret.trim()
      : "";
    if (!inviteSecret) {
      errors.push(asError("inviteSecret", "booking_validation_invite_secret_required", "Invite link is not ready yet. Please try again."));
    }
  }

  if (state?.spendingRequirement === "mustOwnProducts") {
    const requiredProducts = Array.isArray(state?.requiredProducts)
      ? state.requiredProducts.filter((item) => item && item.id && item.type)
      : [];
    if (requiredProducts.length === 0) {
      errors.push(asError("requiredProducts", "booking_validation_required_products_required", "Please add at least one product for spending requirement."));
    }
  }

  const addOns = Array.isArray(state?.addOns) ? state.addOns : [];
  addOns.forEach((addOn, index) => {
    if (!hasAnyAddonValue(addOn)) return;

    const title = typeof addOn?.title === "string" ? addOn.title.trim() : "";
    if (!title) {
      errors.push(asError(`addOns.${index}.title`, "booking_validation_addon_title_required", `Add-on service ${index + 1} title is required.`, { index: index + 1 }));
    }

    const price = asNumber(addOn?.priceTokens);
    if (price == null || price < 0) {
      errors.push(asError(`addOns.${index}.priceTokens`, "booking_validation_addon_price_min", `Add-on service ${index + 1} price must be 0 or higher.`, { index: index + 1 }));
    }
  });

  return { errors };
}
