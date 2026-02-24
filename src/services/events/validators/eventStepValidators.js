function asNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function asError(field, message) {
  return { field, message };
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

export function step1Validator(state = {}) {
  const errors = [];

  if (!state?.eventTitle || String(state.eventTitle).trim().length === 0) {
    errors.push(asError("eventTitle", "Event title is required."));
  }

  const duration = asNumber(state?.duration);
  if (duration == null || duration < 5) {
    errors.push(asError("duration", "Session duration must be at least 5 minutes."));
  }

  const basePrice = asNumber(state?.basePrice);
  if (basePrice == null || basePrice < 0) {
    errors.push(asError("basePrice", "Base price must be 0 or higher."));
  }

  return { errors };
}

export function step2Validator(state = {}) {
  const errors = [];

  if (state?.allowRecording) {
    const recordingPrice = asNumber(state?.recordingPrice);
    if (recordingPrice == null || recordingPrice < 0) {
      errors.push(asError("recordingPrice", "Recording price must be 0 or higher."));
    }
  }

  if (state?.enableCancellationFee) {
    const cancellationFee = asNumber(state?.cancellationFee);
    if (cancellationFee == null || cancellationFee < 0) {
      errors.push(asError("cancellationFee", "Cancellation fee must be 0 or higher."));
    }
  }

  if (state?.whoCanBook === "subscribersOnly") {
    const tiers = asArray(state?.subscriptionTiers);
    if (tiers.length === 0) {
      errors.push(asError("subscriptionTiers", "Please select at least one subscription tier."));
    }
  }

  if (state?.whoCanBook === "inviteOnly") {
    const invitedUsers = asArray(state?.invitedUsers);
    if (invitedUsers.length === 0) {
      errors.push(asError("invitedUsers", "Please select at least one invited user."));
    }
  }

  return { errors };
}
