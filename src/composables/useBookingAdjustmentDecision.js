import { computed, onBeforeUnmount, ref, unref, watch } from "vue";
import { fetchUserProfileData } from "@/services/users/userProfileApi.js";
import { useBookingTranslations } from "@/i18n/bookingTranslations.js";
import TokenHandler from "@/utils/TokenHandler.js";

function finiteNonNegative(value, fallback = 0) {
  if (value === "" || value == null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
}

function firstDefined(sources, keys) {
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    for (const key of keys) {
      if (source[key] !== undefined && source[key] !== null && source[key] !== "") return source[key];
    }
  }
  return null;
}

function normalizeUsername(value) {
  const username = String(value || "").trim().replace(/^@+/, "");
  if (!username || /^user\s*#\s*\d+$/i.test(username)) return "";
  return username;
}

function truthyFlag(value) {
  return value === true || value === 1 || value === "1" || String(value || "").trim().toLowerCase() === "true";
}

/**
 * Drives `BookingAdjustmentDecisionPopup`: resolves every money figure it needs
 * (session refund, booking fee, cancellation fee, wallet balance) from a booking
 * and exposes ready-to-bind props.
 *
 * Purely presentational state — it never writes to the booking. The caller acts on
 * the popup's `confirm` payload.
 *
 * @param booking  ref/getter for the booking record
 * @param options.viewerRole  ref/getter — 'fan' | 'creator'
 * @param options.event       ref/getter for the calendar event (schedule fallback)
 * @param options.processing  ref/getter — true while the caller runs the action
 * @param options.fanId       ref/getter — fallback fan id (embed bootstrap)
 */
export function useBookingAdjustmentDecision(booking, options = {}) {
  const { t } = useBookingTranslations();
  const read = (source) => (typeof source === "function" ? source() : unref(source));

  const bookingValue = computed(() => read(booking) || null);
  const eventValue = computed(() => read(options.event) || null);
  const viewerRole = computed(() => (String(read(options.viewerRole) || "fan").toLowerCase() === "creator" ? "creator" : "fan"));
  const processing = computed(() => Boolean(read(options.processing)));

  const isOpen = ref(false);
  const mode = ref("accept");
  const decision = ref(null);
  const walletBalance = ref(null);
  const balanceLoading = ref(false);
  const balanceError = ref("");
  const fetchedCreatorUsername = ref("");
  const fetchedFanUsername = ref("");
  let profileController = null;

  const eventSources = computed(() => [
    bookingValue.value?.eventCurrent,
    bookingValue.value?.eventSnapshot,
    bookingValue.value,
    eventValue.value?.raw,
    eventValue.value,
  ].filter((source) => source && typeof source === "object"));

  const payment = computed(() => (bookingValue.value?.payment && typeof bookingValue.value.payment === "object"
    ? bookingValue.value.payment
    : {}));

  const creatorId = computed(() => firstDefined(eventSources.value, ["creatorId", "creator_id"]));
  const fanId = computed(() => firstDefined(eventSources.value, ["userId", "user_id", "fanId", "fan_id"])
    || read(options.fanId)
    || null);

  const storedCreatorUsername = computed(() => String(firstDefined(eventSources.value, ["creatorUsername", "creatorUserName", "creatorHandle"]) || "").trim());
  const creatorName = computed(() => String(firstDefined(eventSources.value, ["creatorDisplayName", "creatorName"]) || "").trim());
  const creatorUsername = computed(() => storedCreatorUsername.value || fetchedCreatorUsername.value || creatorName.value);
  const storedFanUsername = computed(() => normalizeUsername(firstDefined(eventSources.value, ["fanUsername", "fanUserName"])));
  const storedFanDisplayName = computed(() => normalizeUsername(firstDefined(eventSources.value, ["username", "userName", "fanDisplayName", "userDisplayName"])));
  const fanUsername = computed(() => fetchedFanUsername.value || storedFanUsername.value || storedFanDisplayName.value);
  const eventTitle = computed(() => String(firstDefined(eventSources.value, ["eventTitle", "title"]) || "").trim());

  const paymentTotal = computed(() => {
    const explicit = Number(payment.value?.total ?? bookingValue.value?.paymentTotal);
    if (Number.isFinite(explicit)) return Math.max(0, explicit);
    if (Array.isArray(payment.value?.lines)) {
      return payment.value.lines.reduce((sum, line) => sum + finiteNonNegative(line?.amount), 0);
    }
    return finiteNonNegative(decision.value?.originalTokens);
  });

  const bookingStatus = computed(() => String(
    bookingValue.value?.status
      ?? bookingValue.value?.bookingStatus
      ?? eventValue.value?.raw?.bookingStatus
      ?? eventValue.value?.raw?.status
      ?? eventValue.value?.bookingStatus
      ?? eventValue.value?.status
      ?? "",
  ).trim().toLowerCase());

  const advanceCancellationFeeWaived = computed(() => {
    const advanceEnabled = truthyFlag(firstDefined(eventSources.value, ["allowAdvanceCancelToAvoidMinCharge", "allowAdvanceCancellation"]));
    const advanceQuantity = finiteNonNegative(firstDefined(eventSources.value, ["advanceCancelWindowQuantity", "advanceCancelWindow", "advanceVoid"]));
    const advanceUnit = String(firstDefined(eventSources.value, ["advanceCancelWindowUnit"]) || "").trim().toLowerCase();
    const unitMs = advanceUnit.startsWith("day") ? 86400000 : advanceUnit.startsWith("hour") ? 3600000 : advanceUnit.startsWith("minute") ? 60000 : 0;
    const startAt = Date.parse(bookingValue.value?.startAtIso || eventValue.value?.start || "");
    return advanceEnabled
      && advanceQuantity > 0
      && unitMs > 0
      && Number.isFinite(startAt)
      && startAt - Date.now() >= advanceQuantity * unitMs;
  });

  const bookingFeeTokens = computed(() => {
    const allocations = payment.value?.allocations;
    if (allocations && typeof allocations === "object" && Object.prototype.hasOwnProperty.call(allocations, "bookingFee")) {
      return finiteNonNegative(allocations.bookingFee);
    }
    const stored = finiteNonNegative(firstDefined(
      [
        payment.value,
        bookingValue.value?.paymentSnapshot,
        bookingValue.value?.meta?.payment,
        bookingValue.value?.meta?.validation?.payment,
        bookingValue.value?.meta?.validation?.paymentPayload,
        bookingValue.value,
      ],
      ["bookingFeeAmountTokens", "bookingFeeAmount", "bookingFeePaidTokens"],
    ));
    if (stored > 0) return stored;
    const line = Array.isArray(payment.value?.lines)
      ? payment.value.lines.find((item) => String(item?.code || "").trim().toLowerCase() === "booking_fee")
      : null;
    const lineAmount = finiteNonNegative(line?.amount);
    if (lineAmount > 0) return lineAmount;
    const enabled = truthyFlag(firstDefined(eventSources.value, ["enableBookingFee"]));
    return enabled
      ? finiteNonNegative(firstDefined(eventSources.value, ["bookingFeeTokens", "bookingFee"]))
      : 0;
  });

  const cancellationFeeTokens = computed(() => {
    const allocated = finiteNonNegative(payment.value?.allocations?.cancellationFee);
    const configured = finiteNonNegative(firstDefined(eventSources.value, ["cancellationFeeTokens", "cancellationFee"]));
    const enabled = allocated > 0 || truthyFlag(firstDefined(eventSources.value, ["enableCancellationFee"]));
    if (!enabled) return 0;

    return allocated || configured;
  });

  // Mirror BookingsManager.paymentDecisionsForOutcome for the fan-facing preview.
  // The fee amounts remain gross allocations; these flags only say whether each
  // allocation will be released or retained during the pending action.
  const bookingFeeRefundable = computed(() => (
    viewerRole.value === "fan" && mode.value === "decline"
  ));
  const cancellationFeeRefundable = computed(() => {
    if (viewerRole.value !== "fan") return false;
    if (mode.value === "decline") return true;
    if (mode.value !== "cancel") return false;
    if (["pending", "pending_hold"].includes(bookingStatus.value)) return true;
    if (["confirmed", "accepted"].includes(bookingStatus.value)) return advanceCancellationFeeWaived.value;
    return false;
  });

  const sessionRefundTokens = computed(() => {
    const allocations = payment.value?.allocations;
    const hasV2Allocations = Number(payment.value?.paymentPolicyVersion) === 2
      || (allocations && typeof allocations === "object"
        && (Object.prototype.hasOwnProperty.call(allocations, "service")
          || Object.prototype.hasOwnProperty.call(allocations, "bookingFee")
          || Object.prototype.hasOwnProperty.call(allocations, "cancellationFee")));
    if (hasV2Allocations) {
      return finiteNonNegative(allocations?.service)
        + finiteNonNegative(allocations?.bookingFee)
        + finiteNonNegative(allocations?.cancellationFee);
    }
    return paymentTotal.value;
  });

  const netRefundTokens = computed(() => (viewerRole.value === "creator"
    ? sessionRefundTokens.value
    : Math.max(
      0,
      sessionRefundTokens.value
        - (bookingFeeRefundable.value ? 0 : bookingFeeTokens.value)
        - (cancellationFeeRefundable.value ? 0 : cancellationFeeTokens.value),
    )));

  watch([viewerRole, creatorId, fanId, storedCreatorUsername, storedFanUsername], async ([role, creator, fan, storedUsername, storedFan]) => {
    if (profileController) {
      profileController.abort();
      profileController = null;
    }
    fetchedCreatorUsername.value = "";
    fetchedFanUsername.value = "";
    const targetId = role === "creator" ? fan : creator;
    const hasStoredUsername = role === "creator" ? storedFan : storedUsername;
    if (hasStoredUsername || !targetId) return;

    const controller = new AbortController();
    profileController = controller;
    try {
      const profile = await fetchUserProfileData(targetId, { signal: controller.signal });
      if (profileController === controller) {
        if (role === "creator") fetchedFanUsername.value = normalizeUsername(profile?.username);
        else fetchedCreatorUsername.value = normalizeUsername(profile?.username);
      }
    } catch (error) {
      if (error?.name !== "AbortError" && profileController === controller) {
        if (role === "creator") fetchedFanUsername.value = "";
        else fetchedCreatorUsername.value = "";
      }
    } finally {
      if (profileController === controller) profileController = null;
    }
  }, { immediate: true });

  async function loadBalance() {
    if (!isOpen.value || balanceLoading.value || processing.value) return;
    balanceLoading.value = true;
    balanceError.value = "";

    if (!fanId.value || !creatorId.value) {
      balanceLoading.value = false;
      balanceError.value = t("booking_adjustment_balance_unavailable");
      return;
    }

    try {
      const nextBalance = await TokenHandler.get({ userId: fanId.value, receiverId: creatorId.value, defaultValue: null });
      // A failed lookup returns the null default, and `Number(null)` is 0 — which would
      // silently read as an empty wallet and force an unnecessary top-up.
      if (nextBalance === null || nextBalance === undefined || nextBalance === "" || !Number.isFinite(Number(nextBalance))) {
        balanceError.value = t("booking_adjustment_balance_unavailable");
        walletBalance.value = null;
        return;
      }
      walletBalance.value = Math.max(0, Number(nextBalance));
    } catch (_error) {
      balanceError.value = t("booking_adjustment_balance_unavailable");
      walletBalance.value = null;
    } finally {
      balanceLoading.value = false;
    }
  }

  function open(nextMode, adjustment = null) {
    mode.value = nextMode === "cancel"
      ? "cancel"
      : nextMode === "decline" ? "decline" : nextMode === "reject" ? "reject" : "accept";
    decision.value = adjustment;
    walletBalance.value = null;
    balanceError.value = "";
    isOpen.value = true;
    // A creator cancelling or rejecting never spends tokens, so skip the lookup.
    if (!(viewerRole.value === "creator" && (mode.value === "cancel" || mode.value === "reject"))) {
      void loadBalance();
    }
  }

  // `force` closes the popup from a completed action, which still holds `processing`.
  function reset({ force = false } = {}) {
    if (processing.value && !force) return;
    isOpen.value = false;
    decision.value = null;
    walletBalance.value = null;
    balanceLoading.value = false;
    balanceError.value = "";
  }

  function reportError(message) {
    balanceError.value = message || "";
  }

  const popupProps = computed(() => ({
    modelValue: isOpen.value,
    mode: mode.value,
    originalTokens: decision.value?.originalTokens ?? null,
    proposedTokens: decision.value?.proposedTokens ?? null,
    walletBalance: walletBalance.value,
    sessionRefundTokens: sessionRefundTokens.value,
    bookingFeeTokens: bookingFeeTokens.value,
    cancellationFeeTokens: cancellationFeeTokens.value,
    bookingFeeRefundable: bookingFeeRefundable.value,
    cancellationFeeRefundable: cancellationFeeRefundable.value,
    creatorUsername: creatorUsername.value,
    creatorName: creatorName.value,
    eventTitle: eventTitle.value,
    actorRole: viewerRole.value,
    fanUsername: fanUsername.value || t("common_fan"),
    netRefundTokens: netRefundTokens.value,
    balanceLoading: balanceLoading.value,
    balanceError: balanceError.value,
    processing: processing.value,
  }));

  onBeforeUnmount(() => {
    if (profileController) profileController.abort();
  });

  return {
    isOpen,
    mode,
    decision,
    popupProps,
    creatorId,
    fanId,
    creatorName,
    creatorUsername,
    fanUsername,
    open,
    reset,
    loadBalance,
    reportError,
  };
}

export default useBookingAdjustmentDecision;
