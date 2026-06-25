<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount, defineAsyncComponent } from 'vue';
import OneOnOneBookingFlowLeftSideBar from '../HelperComponents/OneOnOneBookingFlowLeftSideBar.vue';
import TokenHandler from '@/utils/TokenHandler.js';
import { showToast } from '@/utils/toastBus.js';
import { mapCreateBookingToRequest } from '@/services/bookings/mappers/createBookingMapper.js';
import { sumEventGoalContributionsForEvent } from '@/services/bookings/utils/bookingSlotUtils.js';
import TooltipIcon from "@/components/ui/tooltip/TooltipIcon.vue";
import { resolveCreatorIdFromContext, resolveFanIdFromContext } from '@/utils/contextIds.js';
import { logFanBookingDebug } from '@/embeds/fanBooking/debug.js';
import {
  fireAndForgetCreateScheduleNotify,
  getCreateScheduleNotifyPayload,
  shouldFireCreateScheduleForInstantBooking,
} from '@/utils/bookingScheduleNotify.js';
import {
  bookingFlowArrowRightIcon,
  bookingFlowBackgroundImage,
  bookingFlowExBalanceImage,
  bookingFlowTokenIcon,
} from './oneOnOneBookingFlowAssets.js';
import { resolveCreatorPresentation } from './creatorPresentation.js';
import { useEventBackgroundImage } from './useEventBackgroundImage.js';
import FlowHandler from '@/services/flow-system/FlowHandler'
import { useChatSocket } from '@/composables/useChatSocket';
import { resolveGuestSessionId } from '@/utils/resolveGuestSessionId';
import { getBackendJwtToken, setBackendJwtToken } from '@/utils/backendJwt.js';
import { getBookingsApiBaseUrl } from '@/services/bookings/bookingsApiUtils.js';
import { formatBookingValidationErrors, useBookingTranslations } from '@/i18n/bookingTranslations.js';
import { extractBackendErrorMessage } from '@/utils/backendErrorMessage.js';

const loadTopUpForm = () => import('../HelperComponents/TopUpForm.vue');
let topUpFormPrefetchPromise = null;

function prefetchTopUpForm(reason = 'unknown') {
  if (topUpFormPrefetchPromise) return topUpFormPrefetchPromise;

  logFanBookingDebug('step3', 'topup-prefetch:start', { reason });
  topUpFormPrefetchPromise = loadTopUpForm()
    .then((module) => {
      logFanBookingDebug('step3', 'topup-prefetch:resolved', { reason });
      return module;
    })
    .catch((error) => {
      topUpFormPrefetchPromise = null;
      logFanBookingDebug('step3', 'topup-prefetch:error', {
        reason,
        message: error?.message || String(error),
      });
      throw error;
    });

  return topUpFormPrefetchPromise;
}

function scheduleTopUpPrefetch(reason) {
  const run = () => Promise.resolve().then(() => prefetchTopUpForm(reason)).catch(() => {});

  if (typeof window === 'undefined') {
    run();
    return;
  }

  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(run, { timeout: 800 });
    return;
  }

  window.setTimeout(run, 0);
}

const TopUpForm = defineAsyncComponent({
  loader: () => prefetchTopUpForm('topup-render'),
  delay: 120,
  suspensible: false,
});

const props = defineProps({
  engine: {
    type: Object,
    required: true
  },
  apiBaseUrl: {
    type: String,
    default: '',
  },
  embedded: {
    type: Boolean,
    default: false,
  },
  refreshBookingContext: {
    type: Function,
    default: null,
  },
});

const emit = defineEmits(['booking-created', 'booking-failed']);
const { t } = useBookingTranslations();
const isAcceptingInvite = ref(false);
let inviteAcceptPromise = null;

// --- RETRIEVE DATA FROM ENGINE ---
const bookingData = computed(() => {
  return props.engine.getState('bookingDetails') || {};
});

const selectedEvent = computed(() => props.engine.getState('fanBooking.context.selectedEvent') || null);
const bookedSlotsIndex = computed(() => props.engine.getState('fanBooking.catalog.bookedSlotsIndex') || {});
const paymentSubstep = computed(() => props.engine.substep || null);
const creatorPresentation = computed(() => resolveCreatorPresentation({
  explicitCreatorData: props.engine.getState('fanBooking.context.creatorPresentation'),
  selectedEvent: selectedEvent.value,
  bookingResult: props.engine.getState('fanBooking.booking.result'),
}));
const creatorPresentationLoading = computed(() => (
  props.engine.getState('fanBooking.context.creatorPresentationLoading') === true
));
const { resolvedBackgroundImageUrl } = useEventBackgroundImage(selectedEvent, bookingFlowBackgroundImage);

const inviteSecret = computed(() => String(props.engine.getState('fanBooking.context.inviteSecret') || '').trim());

const topUpFormRef = ref(null);
const isSubmitting = ref(false);
const isCheckingBalance = ref(false);
const hasCheckedBalance = ref(false);
const balanceCheckError = ref('');
const holdLoading = ref(false);
const holdError = ref('');
const secondsRemaining = ref(0);
let holdTimerId = null;

const PAYMENT_SUBSTEP_SUMMARY = 'summary';
const PAYMENT_SUBSTEP_TOPUP   = 'topup';

const popupBackgroundStyle = computed(() => ({
  backgroundImage: `url('${resolvedBackgroundImageUrl.value}')`,
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'left 50% center',
}));

const balanceCardStyle = computed(() => ({
  backgroundImage: `url('${bookingFlowExBalanceImage}')`,
  backgroundPosition: 'right',
  backgroundRepeat: 'no-repeat',
  backgroundSize: '48% 100%',
  backgroundColor: '#FF76DD',
}));

const actionFooterClass = computed(() => (
  props.embedded
    ? 'flex-none flex justify-end z-[99] absolute bottom-0 left-0 w-full'
    : 'flex-none flex justify-end z-[99] fixed bottom-0 left-0 w-full'
));

function toBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0' || normalized === '') return false;
  }
  return fallback;
}

// --- WALLET BALANCE (Sync with Engine if exists) ---
const walletBalance = ref(Number(bookingData.value.walletBalance ?? 0));
watch(
  () => bookingData.value.walletBalance,
  (next) => {
    if (next == null || next === '') return;
    const parsed = Number(next);
    if (!Number.isNaN(parsed)) {
      walletBalance.value = parsed;
    }
  },
);

// --- COMPUTED VALUES (Derived from Engine State) ---
const sessionDuration = computed(() => bookingData.value.selectedDuration?.value || 0);
const selectedAddons = computed(() => bookingData.value.addons || []);
const contributionTokens = ref(Number(
  bookingData.value.contributionTokens
    ?? props.engine.getState('fanBooking.selection.contributionTokens')
    ?? 0,
));
const mappedPayment = computed(() => {
  contributionTokens.value;
  try {
    const payload = mapCreateBookingToRequest(props.engine.state, {
      stateEngine: props.engine,
      fanId: resolveFanId(),
      creatorId: resolveCreatorId(),
      userId: resolveFanId(),
    });
    return payload?.payment || null;
  } catch (_) {
    return null;
  }
});
const mappedPaymentLines = computed(() => (
  Array.isArray(mappedPayment.value?.lines) ? mappedPayment.value.lines : []
));
const findPaymentLine = (code) => (
  mappedPaymentLines.value.find((row) => String(row?.code) === code) || null
);
const findLineAmount = (code) => {
  const line = findPaymentLine(code);
  return Number(line?.amount || 0);
};
const sessionCost = computed(() => {
  const mappedBase = findLineAmount("base") || findLineAmount("event_goal_contribution");
  if (Number.isFinite(mappedBase) && mappedBase > 0) return mappedBase;
  return Number(bookingData.value.selectedDuration?.price || 0);
});
const bookingFeeAmount = computed(() => {
  const amount = findLineAmount("booking_fee");
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
});
const discountLineCodes = new Set([
  'discount',
  'first_time_discount',
  'recurring_event_discount',
]);
const discountLines = computed(() => (
  mappedPaymentLines.value
    .filter((row) => {
      const code = String(row?.code || '');
      return discountLineCodes.has(code) && Number(row?.amount || 0) < 0;
    })
    .map((row) => ({
      code: String(row?.code || ''),
      label: String(row?.label || t('common_discount')),
      amount: Math.abs(Number(row?.amount || 0)),
    }))
));
const totalDiscountAmount = computed(() => (
  discountLines.value.reduce((sum, row) => sum + Number(row.amount || 0), 0)
));
const firstTimeDiscountAmount = computed(() => {
  const row = discountLines.value.find((item) => item.code === 'first_time_discount');
  return Number(row?.amount || 0);
});
const offHourSurchargeAmount = computed(() => {
  const amount = findLineAmount("off_hour_surcharge");
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
});
const offHourSurchargeLabel = computed(() => {
  const label = findPaymentLine("off_hour_surcharge")?.label;
  return String(label || t("fan_booking_off_hour_surcharge"));
});
const baseTotalPrice = computed(() => Number(bookingData.value.totalPrice || 0));
const mappedPaymentTotal = computed(() => {
  const total = Number(mappedPayment.value?.total);
  return Number.isFinite(total) ? total : null;
});
const totalPrice = computed(() => (
  mappedPaymentTotal.value == null
    ? (baseTotalPrice.value + bookingFeeAmount.value)
    : mappedPaymentTotal.value
));

function toWholeTokens(value) {
  const numeric = Number(value || 0);
  return Math.ceil(Number.isFinite(numeric) ? numeric : 0);
}

const isGroupEvent = computed(() => {
  const raw = selectedEvent.value?.raw || {};
  return String(
    selectedEvent.value?.type
      || selectedEvent.value?.eventType
      || raw?.type
      || raw?.eventType
    || '',
  ).toLowerCase() === 'group-event';
});
const requiresTemporaryHold = computed(() => !isGroupEvent.value);

const isEventGoalGroupEvent = computed(() => {
  const raw = selectedEvent.value?.raw || {};
  return isGroupEvent.value && String(raw?.priceSetting || selectedEvent.value?.priceSetting || '').toLowerCase() === 'eventgoal';
});

const groupPriceSetting = computed(() => {
  const raw = selectedEvent.value?.raw || {};
  return String(raw?.priceSetting || selectedEvent.value?.priceSetting || '');
});

const eventGoalMinimumTokens = computed(() => {
  const raw = selectedEvent.value?.raw || {};
  const configured = Number(raw?.minContributionPerUser ?? selectedEvent.value?.minContributionPerUser ?? 0);
  return Number.isFinite(configured) && configured > 0 ? toWholeTokens(configured) : 1;
});

const eventGoalTokens = computed(() => {
  const raw = selectedEvent.value?.raw || {};
  return toWholeTokens(raw?.eventGoalTokens ?? selectedEvent.value?.eventGoalTokens ?? 0);
});

const eventGoalReachedTokens = computed(() => {
  const eventId = selectedEvent.value?.eventId || selectedEvent.value?.id;
  return Math.min(
    eventGoalTokens.value,
    sumEventGoalContributionsForEvent({ eventId, bookedSlotsIndex: bookedSlotsIndex.value }),
  );
});
const eventGoalPercent = computed(() => (
  eventGoalTokens.value > 0
    ? Math.min(100, Math.max(0, Math.floor((eventGoalReachedTokens.value / eventGoalTokens.value) * 100)))
    : 0
));
const eventGoalRemainingTokens = computed(() => Math.max(0, eventGoalTokens.value - eventGoalReachedTokens.value));

function normalizeEventPerformer(value = {}) {
  if (!value || typeof value !== 'object') return null;
  const name = String(
    value.name
      || value.displayName
      || value.display_name
      || value.username
      || value.creatorName
      || value.hostName
      || '',
  ).trim();
  if (!name) return null;

  return {
    name,
    avatar: String(
      value.avatar
        || value.avatarUrl
        || value.avatar_url
        || value.profileImage
        || value.profileImageUrl
        || value.creatorAvatar
        || '',
    ).trim(),
    isVerified: toBoolean(value.isVerified ?? value.is_premium ?? value.verified, false),
    isHost: toBoolean(value.isHost ?? value.host, false),
  };
}

function readEventPerformerList(event = {}) {
  const raw = event?.raw || {};
  const candidates = [
    event?.coHosts,
    event?.coPerformers,
    event?.performers,
    event?.collaborators,
    raw?.coHosts,
    raw?.coPerformers,
    raw?.performers,
    raw?.collaborators,
  ];
  return candidates.find((items) => Array.isArray(items) && items.length > 0) || [];
}

const groupPerformers = computed(() => (
  readEventPerformerList(selectedEvent.value)
    .map((performer) => normalizeEventPerformer(performer))
    .filter(Boolean)
));

const eventGoalMaximumContribution = computed(() => Math.max(0, walletBalance.value, eventGoalTokens.value));
const contributionRangeMax = computed(() => Math.max(eventGoalMinimumTokens.value, eventGoalMaximumContribution.value));
const normalizedContributionTokens = computed(() => toWholeTokens(contributionTokens.value));
const contributionInvalid = computed(() => {
  if (!isEventGoalGroupEvent.value) return false;
  const amount = normalizedContributionTokens.value;
  const max = eventGoalMaximumContribution.value;
  return max <= 0 || amount < eventGoalMinimumTokens.value || amount > max;
});
const contributionSliderPercent = computed(() => {
  const min = eventGoalMinimumTokens.value;
  const max = eventGoalMaximumContribution.value;
  if (max <= min) return 0;
  const amount = Math.min(Math.max(normalizedContributionTokens.value, min), max);
  return Math.round(((amount - min) / (max - min)) * 100);
});
const contributionSliderStyle = computed(() => ({ width: `${contributionSliderPercent.value}%` }));
const contributionThumbStyle = computed(() => ({ left: `${contributionSliderPercent.value}%` }));

function syncContributionToEngine(value) {
  const next = isEventGoalGroupEvent.value ? toWholeTokens(value) : null;
  props.engine.setState('bookingDetails.contributionTokens', next, {
    reason: 'step3-event-goal-contribution',
    silent: true,
  });
  props.engine.setState('fanBooking.selection.contributionTokens', next, {
    reason: 'step3-event-goal-contribution',
    silent: true,
  });
}

function ensureContributionDefault() {
  if (!isEventGoalGroupEvent.value) {
    contributionTokens.value = 0;
    syncContributionToEngine(null);
    return;
  }

  const min = eventGoalMinimumTokens.value;
  const max = eventGoalMaximumContribution.value;
  const existing = toWholeTokens(contributionTokens.value || bookingData.value.contributionTokens);
  const next = max >= min
    ? Math.min(Math.max(existing || min, min), max)
    : min;
  contributionTokens.value = next;
  syncContributionToEngine(next);
}

const formattedTime = computed(() => bookingData.value.formattedTimeRange || '-');
const headerDateDisplay = computed(() => bookingData.value.headerDateDisplay || '-');
const selectedDateDisplay = computed(() => bookingData.value.selectedDateDisplay || '-');
const showApprovalNeeded = computed(() => {
  if (isGroupEvent.value) return false;
  const instant = toBoolean(
    selectedEvent.value?.allowInstantBooking
      ?? selectedEvent.value?.raw?.allowInstantBooking,
    false,
  );
  return !instant;
});

// --- TOP UP LOGIC ---
const isTopUpNeeded = computed(() => {
  return totalPrice.value > walletBalance.value;
});

const topUpAmount = computed(() => {
  return isTopUpNeeded.value ? (totalPrice.value - walletBalance.value) : 0;
});

const remainingBalance = computed(() => {
  return walletBalance.value - totalPrice.value;
});

const remainingBalanceAfterBooking = computed(() => walletBalance.value + topUpAmount.value - totalPrice.value);
const isTopUpSubstep = computed(() => paymentSubstep.value === PAYMENT_SUBSTEP_TOPUP);
const isGuestFlow = computed(() => resolveFanId() <= 0 || !getBackendJwtToken());
const isInviteOnlyEvent = computed(() => {
  const raw = selectedEvent.value?.raw || {};
  return String(raw?.whoCanBook || selectedEvent.value?.whoCanBook || '') === 'inviteOnly';
});

const temporaryHold = computed(() => props.engine.getState('fanBooking.temporaryHold') || {});
const hasBookingCreated = computed(() => Boolean(
  props.engine.getState('fanBooking.booking.bookingId')
  || props.engine.getState('fanBooking.booking.result.bookingId')
  || props.engine.getState('fanBooking.booking.result.item.bookingId')
));
const hasActiveHold = computed(() => Boolean(
  temporaryHold.value?.temporaryHoldId
  && temporaryHold.value?.status === 'active'
  && secondsRemaining.value > 0
));
const formattedHoldTimer = computed(() => {
  const total = Math.max(0, Number(secondsRemaining.value || 0));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

const exactTokenFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});
const usdFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const COMPACT_TOKEN_UNITS = [
  { threshold: 1_000_000_000_000, suffix: 'T' },
  { threshold: 1_000_000_000, suffix: 'B' },
  { threshold: 1_000_000, suffix: 'M' },
  { threshold: 1_000, suffix: 'K' },
];

function isInviteAcceptedForCurrentSecret() {
  const acceptedSecret = String(props.engine.getState('fanBooking.context.inviteAcceptedSecret') || '').trim();
  return Boolean(
    props.engine.getState('fanBooking.context.inviteAccepted') === true
    && acceptedSecret
    && acceptedSecret === inviteSecret.value
  );
}

async function acceptInviteForAuthenticatedFan({ silent = false } = {}) {
  if (!isInviteOnlyEvent.value || !inviteSecret.value) return true;
  if (isInviteAcceptedForCurrentSecret()) return true;

  const fanId = resolveFanId();
  const jwtToken = getBackendJwtToken();
  if (fanId <= 0 || !jwtToken) {
    if (!silent) {
      showToast({
        type: 'error',
        title: t('fan_booking_invite_accept_failed_title'),
        message: t('fan_booking_invite_login_required'),
      });
    }
    return false;
  }

  if (inviteAcceptPromise) return inviteAcceptPromise;
  isAcceptingInvite.value = true;

  inviteAcceptPromise = (async () => {
    const baseUrl = getBookingsApiBaseUrl({ apiBaseUrl: props.apiBaseUrl || undefined });
    const response = await fetch(`${baseUrl}/events/invite/accept-auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwtToken}`,
      },
      body: JSON.stringify({ inviteSecret: inviteSecret.value }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok || payload?.ok === false) {
      throw new Error(payload?.message || payload?.error || t('fan_booking_invite_accept_failed_message'));
    }

    props.engine.setState('fanBooking.context.inviteAccepted', true, { reason: 'invite-accepted', silent: true });
    props.engine.setState('fanBooking.context.inviteAcceptedSecret', inviteSecret.value, { reason: 'invite-accepted', silent: true });
    logFanBookingDebug('step3', 'invite-accept:success', {
      eventId: payload?.eventId || selectedEvent.value?.eventId || null,
      fanId,
      alreadyInvited: !!payload?.alreadyInvited,
    });
    return true;
  })();

  try {
    return await inviteAcceptPromise;
  } catch (error) {
    props.engine.setState('fanBooking.context.inviteAccepted', false, { reason: 'invite-accept-failed', silent: true });
    props.engine.setState('fanBooking.context.inviteAcceptError', error?.message || '', { reason: 'invite-accept-failed', silent: true });
    logFanBookingDebug('step3', 'invite-accept:error', {
      message: error?.message || String(error),
      fanId,
    });
    if (!silent) {
      showToast({
        type: 'error',
        title: t('fan_booking_invite_accept_failed_title'),
        message: error?.message || t('fan_booking_invite_accept_failed_message'),
      });
    }
    return false;
  } finally {
    isAcceptingInvite.value = false;
    inviteAcceptPromise = null;
  }
}

function formatTokenCompact(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';

  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (abs < 1000) {
    return `${sign}${Math.round(abs).toLocaleString('en-US')}`;
  }

  const unit = COMPACT_TOKEN_UNITS.find(({ threshold }) => abs >= threshold);
  const tenths = Math.trunc((abs / unit.threshold) * 10);
  const whole = Math.trunc(tenths / 10);
  const decimal = tenths % 10;
  const scaled = decimal > 0 ? `${whole}.${decimal}` : `${whole}`;

  return `${sign}${scaled}${unit.suffix}`;
}

function formatTokenExact(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  const rounded = Math.round(num);
  return exactTokenFormatter.format(rounded);
}

function tokensToUsdDisplay(value) {
  const num = Number(value);
  const usd = Number.isFinite(num) ? num * 0.06 : 0;
  return `USD$ ${usdFormatter.format(usd)}`;
}

function getBrowserGmtOffsetLabel() {
  if (typeof Date === 'undefined') return '';

  const offsetMinutes = -1 * new Date().getTimezoneOffset();
  if (!Number.isFinite(offsetMinutes)) return '';

  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absoluteMinutes / 60);
  const minutes = absoluteMinutes % 60;

  if (minutes === 0) {
    return `GMT${sign}${hours}`;
  }

  return `GMT${sign}${hours}:${String(minutes).padStart(2, '0')}`;
}

const bookingScheduleDateDisplay = computed(() => (
  selectedDateDisplay.value || headerDateDisplay.value || '-'
));

const bookingScheduleTimeDisplay = computed(() => {
  const timeRange = String(formattedTime.value || '').trim();
  const duration = Number(sessionDuration.value || 0);
  if (!timeRange || timeRange === '-') return '-';

  const durationSuffix = duration > 0 ? ` (${duration} min)` : '';
  const gmtOffset = getBrowserGmtOffsetLabel();
  if (!gmtOffset) {
    return `${timeRange}${durationSuffix}`;
  }

  return `${gmtOffset} ${timeRange}${durationSuffix}`;
});

const approvalMessage = computed(() => (
  t('fan_booking_approval_message', { creator: creatorPresentation.value.name })
));

const baseSessionMinutes = computed(() => {
  const eventMinutes = Number(
    selectedEvent.value?.sessionDurationMinutes
      ?? selectedEvent.value?.raw?.sessionDurationMinutes
      ?? 0,
  );
  if (Number.isFinite(eventMinutes) && eventMinutes > 0) {
    return Math.round(eventMinutes);
  }

  const selectedMinutes = Number(sessionDuration.value || 0);
  if (Number.isFinite(selectedMinutes) && selectedMinutes > 0) {
    return Math.round(selectedMinutes);
  }

  return 15;
});

const sessionCount = computed(() => {
  const selectedMinutes = Number(sessionDuration.value || 0);
  const baseMinutes = Number(baseSessionMinutes.value || 0);
  if (!Number.isFinite(selectedMinutes) || selectedMinutes <= 0) return 1;
  if (!Number.isFinite(baseMinutes) || baseMinutes <= 0) return 1;
  return Math.max(1, Math.round(selectedMinutes / baseMinutes));
});

const sessionBreakdownLabel = computed(() => {
  if (isEventGoalGroupEvent.value) return t('fan_booking_event_goal_contribution');
  const baseMinutes = Math.round(Number(baseSessionMinutes.value || 0)) || 15;
  const totalMinutes = Math.round(Number(sessionDuration.value || 0)) || baseMinutes;
  const count = Math.max(1, Number(sessionCount.value || 1));
  const sessionLabel = count === 1 ? t('fan_booking_session') : t('fan_booking_sessions');
  return t('fan_booking_session_breakdown', {
    base_minutes: baseMinutes,
    count,
    session_label: sessionLabel,
    total_minutes: totalMinutes,
  });
});

const sessionTotalTokens = computed(() => Math.max(0, Number(totalPrice.value || 0)));
const sessionTotalUsdDisplay = computed(() =>
  tokensToUsdDisplay(sessionTotalTokens.value).replace(/^USD\$\s*/, '').trim()
);
const amountDueUsdDisplay = computed(() => tokensToUsdDisplay(totalPrice.value));

const BACKEND_BOOKING_ERROR_TRANSLATIONS = Object.freeze({
  missing_bearer_token: 'fan_booking_error_missing_bearer_token',
  missing_jwt_secret_key: 'fan_booking_error_missing_jwt_secret_key',
  invalid_jwt_issuer: 'fan_booking_error_invalid_jwt_issuer',
  invalid_jwt_audience: 'fan_booking_error_invalid_jwt_audience',
  jwt_expired: 'fan_booking_error_jwt_expired',
  invalid_jwt_user_id: 'fan_booking_error_invalid_jwt_user_id',
  invalid_jwt_token: 'fan_booking_error_invalid_jwt_token',
  missing_backend_auth_context: 'fan_booking_error_missing_backend_auth_context',
  auth_user_resolution_failed: 'fan_booking_error_auth_user_resolution_failed',
  missing_test_fan_id: 'fan_booking_error_missing_test_fan_id',
  'payload is required': 'fan_booking_error_payload_required',
  missing_required_fields: 'fan_booking_error_missing_required_fields',
  invalid_booking_time: 'fan_booking_error_invalid_booking_time',
  invalid_fan_timezone: 'fan_booking_error_invalid_fan_timezone',
  temporary_hold_not_found_or_expired: 'fan_booking_error_temporary_hold_not_found_or_expired',
  temporary_hold_guest_not_converted: 'fan_booking_error_temporary_hold_guest_not_converted',
  user_blocked: 'fan_booking_error_user_blocked',
  event_not_found: 'fan_booking_error_event_not_found',
  event_not_active: 'fan_booking_error_event_not_active',
  event_full: 'fan_booking_error_event_full',
  slot_already_taken: 'fan_booking_slot_already_booked_try_different_slot',
  already_booked_for_slot: 'fan_booking_error_already_booked_for_slot',
  booking_already_in_progress: 'fan_booking_error_booking_already_in_progress',
  invalid_user_event_slot_guard: 'fan_booking_error_invalid_user_event_slot_guard',
  daily_booking_limit_reached: 'fan_booking_error_daily_booking_limit_reached',
  creator_mismatch: 'fan_booking_error_creator_mismatch',
  temporary_hold_mismatch: 'fan_booking_error_temporary_hold_mismatch',
  invalid_temporary_hold_time: 'fan_booking_error_invalid_temporary_hold_time',
  event_not_available: 'fan_booking_error_event_not_available',
  slot_already_booked: 'fan_booking_slot_already_booked_try_different_slot',
  slot_already_held: 'fan_booking_error_slot_already_held',
  temporary_hold_already_exists: 'fan_booking_error_temporary_hold_already_exists',
  validation_failed: 'fan_booking_validation_failed_review',
  token_hold_failed: 'fan_booking_error_token_hold_failed',
  token_hold_missing_txid: 'fan_booking_error_token_hold_missing_txid',
  invalid_payment_total: 'fan_booking_error_invalid_payment_total',
  internal_error: 'fan_booking_error_internal_error',
});

function normalizeBackendErrorCode(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

const STALE_SLOT_ERROR_CODES = new Set([
  'booking_overlaps_existing',
  'booking_buffer_after_booked_required',
  'slot_already_taken',
  'slot_already_booked',
]);

function addNormalizedCode(codes, value) {
  const normalized = normalizeBackendErrorCode(value);
  if (normalized) codes.add(normalized);
}

function addValidationCodes(codes, value) {
  if (!Array.isArray(value)) return;
  value.forEach((item) => {
    if (typeof item === 'string') {
      addNormalizedCode(codes, item);
      return;
    }

    addNormalizedCode(codes, item?.code);
    addNormalizedCode(codes, item?.error);
  });
}

function collectBookingFailureCodes(flowResult) {
  const codes = new Set();
  const errorPayload = flowResult?.error;
  const errorObject = errorPayload && typeof errorPayload === 'object' ? errorPayload : {};
  const details = errorObject?.details && typeof errorObject.details === 'object' ? errorObject.details : {};
  const response = details?.response && typeof details.response === 'object' ? details.response : {};
  const responseData = response?.data && typeof response.data === 'object' ? response.data : {};
  const detailsData = details?.data && typeof details.data === 'object' ? details.data : {};
  const resultData = flowResult?.data && typeof flowResult.data === 'object' ? flowResult.data : {};

  [
    flowResult,
    errorObject,
    details,
    response,
    responseData,
    detailsData,
    resultData,
  ].forEach((source) => {
    if (!source || typeof source !== 'object') return;
    addNormalizedCode(codes, source.error);
    addNormalizedCode(codes, source.code);
    addValidationCodes(codes, source.failures);
    addValidationCodes(codes, source.errors);
    addValidationCodes(codes, source.validation?.failures);
    addValidationCodes(codes, source.validation?.errors);
  });

  if (typeof errorPayload === 'string') addNormalizedCode(codes, errorPayload);
  return codes;
}

function isStaleSlotConflict(flowResult) {
  const codes = collectBookingFailureCodes(flowResult);
  return Array.from(codes).some((code) => STALE_SLOT_ERROR_CODES.has(code));
}

function clearStaleSlotSelection() {
  const reason = 'step3-stale-slot-conflict';
  props.engine.setState('bookingDetails.selectedTime', null, { reason, silent: true });
  props.engine.setState('bookingDetails.selectedDuration', null, { reason, silent: true });
  props.engine.setState('bookingDetails.formattedTimeRange', '-', { reason, silent: true });
  props.engine.setState('bookingDetails.totalPrice', 0, { reason, silent: true });
  props.engine.setState('fanBooking.selection.selectedSlot', null, { reason, silent: true });
  props.engine.setState('fanBooking.selection.selectedDurationMinutes', null, { reason, silent: true });
  props.engine.setState('fanBooking.temporaryHold', {
    temporaryHoldId: null,
    status: 'none',
    expiresAt: null,
    secondsRemaining: 0,
    createdAt: null,
    checkedAt: null,
  }, { reason, silent: true });
}

async function sendBackToScheduleAfterStaleSlot() {
  clearStaleSlotSelection();
  if (typeof props.refreshBookingContext === 'function') {
    await props.refreshBookingContext({
      silent: true,
      preserveSelectedEvent: true,
    }).catch(() => null);
  }
  await props.engine.forceSubstep?.(null, { intent: 'stale-slot-conflict' });
  props.engine.goToStep(2);
}

function resolveBackendErrorTranslationKey(flowResult, wrapperCode) {
  const errorPayload = flowResult?.error;
  const errorObject = errorPayload && typeof errorPayload === 'object' ? errorPayload : {};
  const details = errorObject?.details && typeof errorObject.details === 'object' ? errorObject.details : {};
  const response = details?.response && typeof details.response === 'object' ? details.response : {};
  const responseData = response?.data && typeof response.data === 'object' ? response.data : {};
  const detailsData = details?.data && typeof details.data === 'object' ? details.data : {};
  const resultData = flowResult?.data && typeof flowResult.data === 'object' ? flowResult.data : {};

  const candidates = [
    details?.error,
    details?.code,
    responseData?.error,
    responseData?.code,
    response?.error,
    response?.code,
    detailsData?.error,
    detailsData?.code,
    resultData?.error,
    resultData?.code,
    errorObject?.error,
    errorObject?.code,
    typeof errorPayload === 'string' ? errorPayload : '',
    flowResult?.code,
    wrapperCode,
  ];

  for (const candidate of candidates) {
    const key = BACKEND_BOOKING_ERROR_TRANSLATIONS[normalizeBackendErrorCode(candidate)];
    if (key) return key;
  }

  return null;
}

function firstNonEmptyArray(...values) {
  return values.find((value) => Array.isArray(value) && value.length > 0) || [];
}

function formatValidationMessageList(errors = []) {
  return formatBookingValidationErrors(errors, t).filter(Boolean).join(' ');
}

function extractBackendMessage(flowResult) {
  const errorPayload = flowResult?.error;
  const errorObject = errorPayload && typeof errorPayload === 'object' ? errorPayload : {};
  const code = errorObject?.code || (typeof errorPayload === 'string' ? errorPayload : "");
  const details = errorObject?.details && typeof errorObject.details === 'object' ? errorObject.details : {};
  const missingFields = Array.isArray(details?.missingFields) ? details.missingFields : [];
  if (code === "CREATE_BOOKING_MISSING_REQUIRED_FIELDS" && missingFields.length > 0) {
    return t('fan_booking_missing_required_fields', { fields: missingFields.join(', ') });
  }
  if (isStaleSlotConflict(flowResult)) {
    return t('fan_booking_slot_already_booked_try_different_slot');
  }
  const validationErrors = details?.validation?.errors;
  if (Array.isArray(validationErrors) && validationErrors.length > 0) {
    return formatBookingValidationErrors(validationErrors, t).join(' ');
  }
  const validationMessages = details?.validation?.messages;
  if (Array.isArray(validationMessages) && validationMessages.length > 0) {
    return validationMessages.join(' ');
  }
  const ignoredGenericMessages = [
    t('fan_booking_booking_failed_message'),
    t('fan_booking_complete_failed_message'),
    flowResult?.meta?.uiErrors?.[0],
    'Failed to create booking.',
    'Unexpected error while creating booking.',
    'Could not create booking. Please try again.',
  ];
  const backendMessage = extractBackendErrorMessage(flowResult, {
    includeErrorValues: false,
    ignoredMessages: ignoredGenericMessages,
  });
  if (backendMessage) return backendMessage;
  const backendTranslationKey = resolveBackendErrorTranslationKey(flowResult, code);
  if (backendTranslationKey) return t(backendTranslationKey);
  const backendCodeOrError = extractBackendErrorMessage(flowResult, {
    includeErrorValues: true,
    includeCodeValues: false,
    ignoredMessages: ignoredGenericMessages,
  });
  if (backendCodeOrError) return backendCodeOrError;
  const translatedByCode = {
    HTTP_422: 'fan_booking_validation_failed_review',
    HTTP_402: 'fan_booking_insufficient_token_balance',
  }[code];
  if (translatedByCode) return t(translatedByCode);
  if (code) return `Booking request failed: ${code}`;
  return flowResult?.error?.message
    || flowResult?.meta?.uiErrors?.[0]
    || t('fan_booking_complete_failed_message');
}

function preflightBookingPayload() {
  const previewPayload = mapCreateBookingToRequest(props.engine.state, {
    stateEngine: props.engine,
    fanId: resolveFanId(),
    creatorId: resolveCreatorId(),
    userId: resolveFanId(),
  });

  const requiredFields = ['eventId', 'creatorId', 'startIso', 'endIso'];
  const missingFields = requiredFields.filter((field) => !previewPayload?.[field]);

  return {
    ok: missingFields.length === 0,
    missingFields,
    previewPayload,
  };
}

function resolveFanId() {
  const engineFanId = Number(props.engine.getState('fanBooking.context.fanId'));
  if (Number.isFinite(engineFanId) && engineFanId > 0) {
    return engineFanId;
  }

  const directUserId = Number(props.engine.getState('userId'));
  if (Number.isFinite(directUserId) && directUserId > 0) {
    return directUserId;
  }

  const resolved = resolveFanIdFromContext({
    engine: props.engine,
    fallback: 0,
  });
  return resolved;
}

function getGuestSessionId() {
  const existing = props.engine.getState('fanBooking.temporaryHold.guestSessionId');
  if (existing) return existing;

  const guestSessionId = resolveGuestSessionId();
  props.engine.setState('fanBooking.temporaryHold.guestSessionId', guestSessionId, {
    reason: 'guest-session-id',
    silent: true,
  });
  return guestSessionId;
}

function getGuestHoldToken() {
  return props.engine.getState('fanBooking.temporaryHold.guestHoldToken') || '';
}

function guestHoldHeaders() {
  const guestHoldToken = getGuestHoldToken();
  if (!isGuestFlow.value && !guestHoldToken) return {};
  return {
    ...(isGuestFlow.value ? { Authorization: null } : {}),
    ...(guestHoldToken ? { 'X-Guest-Hold-Token': String(guestHoldToken) } : {}),
  };
}

function normalizeAuthUpdatePayload(payload = {}) {
  const source = payload?.response && typeof payload.response === 'object'
    ? { ...payload.response, ...payload }
    : payload;
  const userId = source?.userId
    ?? source?.user_id
    ?? source?.userData?.userID
    ?? source?.userData?.user_id
    ?? source?.data?.userId
    ?? source?.data?.user_id
    ?? null;
  const backendJwtToken = source?.backendJwtToken
    ?? source?.jwtToken
    ?? source?.backend_jwt_token
    ?? source?.jwt_token
    ?? source?.token
    ?? source?.data?.backendJwtToken
    ?? source?.data?.jwtToken
    ?? '';

  return {
    userId: Number(userId),
    backendJwtToken: typeof backendJwtToken === 'string' ? backendJwtToken.trim() : '',
  };
}

async function applyAuthenticatedFanContext(payload = {}, { refreshBalance = true } = {}) {
  const { userId, backendJwtToken } = normalizeAuthUpdatePayload(payload);
  const hasUserId = Number.isFinite(userId) && userId > 0;

  if (backendJwtToken) {
    setBackendJwtToken(backendJwtToken);
  }

  if (!hasUserId) return false;

  props.engine.setState('fanBooking.context.fanId', userId, { reason: 'auth-user-id', silent: true });
  await acceptInviteForAuthenticatedFan({ silent: true });

  const creatorId = resolveCreatorId();
  if (Number.isFinite(Number(creatorId)) && Number(creatorId) > 0) {
    await props.engine.callFlow('bookings.fetchCreatorBookingContext', {
      creatorId,
      fanId: userId,
      status: 'active',
      limit: 100,
      periodMonths: 6,
      slotLimit: 2000,
    }, {
      forceRefresh: true,
      context: {
        stateEngine: props.engine,
        creatorId,
        fanId: userId,
        apiBaseUrl: props.apiBaseUrl || undefined,
      },
    }).catch(() => {});
  }

  const temporaryHoldId = props.engine.getState('fanBooking.temporaryHold.temporaryHoldId');
  if (temporaryHoldId && getBackendJwtToken()) {
    await FlowHandler.run('bookings.updateTemporaryHoldUser', {
      temporaryHoldId,
      userId,
    }, {
      context: {
        stateEngine: props.engine,
        apiBaseUrl: props.apiBaseUrl || undefined,
        requestHeaders: guestHoldHeaders(),
      },
      backendJwtToken: getBackendJwtToken(),
    });
  }

  if (refreshBalance) {
    hasCheckedBalance.value = false;
    await refreshWalletBalance({ silent: true });
  }

  return true;
}

function resolveCreatorId() {
  const selectedEventCreatorId = Number(
    selectedEvent.value?.creatorId
      ?? selectedEvent.value?.raw?.creatorId
      ?? props.engine.getState('fanBooking.context.creatorId')
  );
  if (Number.isFinite(selectedEventCreatorId) && selectedEventCreatorId > 0) {
    return selectedEventCreatorId;
  }

  const resolved = resolveCreatorIdFromContext({
    preferredId: selectedEvent.value?.creatorId,
    engine: props.engine,
    fallback: 0,
  });
  return resolved;
}

function parseTokenBalance(response, receiverId) {
  if (Number.isFinite(Number(response))) return Number(response);

  if (response && typeof response === 'object') {
    const data = response.data || {};
    const totalBalance = Number(data.balance);
    if (!receiverId && Number.isFinite(totalBalance)) {
      return totalBalance;
    }

    const paidTokens = Number(data.paidTokens || 0);
    const freeTokensByBeneficiary = data.freeTokensPerBeneficiary || {};
    const beneficiaryTokens = Number(freeTokensByBeneficiary?.[receiverId] || 0);
    const systemTokens = Number(freeTokensByBeneficiary?.system || 0);
    const computedBalance = paidTokens + beneficiaryTokens + systemTokens;

    if (Number.isFinite(computedBalance) && computedBalance > 0) {
      return computedBalance;
    }

    return Number.isFinite(totalBalance) ? totalBalance : null;
  }

  return null;
}

function fireAndForgetCreateSchedule({ bookingId = null, eventId = null } = {}) {
  if (!shouldFireCreateScheduleForInstantBooking(selectedEvent.value)) {
    console.warn('[create-schedule][instant-booking] gate-skipped', {
      bookingId,
      eventId,
      selectedEvent: selectedEvent.value,
    });
    return false;
  }

  const previewPayload = mapCreateBookingToRequest(props.engine.state, {
    stateEngine: props.engine,
    fanId: resolveFanId(),
    creatorId: resolveCreatorId(),
    userId: resolveFanId(),
  });

  const notify = getCreateScheduleNotifyPayload({
    event: selectedEvent.value,
    booking: {
      bookingId: bookingId || props.engine.getState('fanBooking.booking.bookingId') || null,
      eventId: eventId || previewPayload?.eventId || selectedEvent.value?.eventId || null,
      startAtIso: previewPayload?.startIso || '',
      durationMinutes: Number(sessionDuration.value || previewPayload?.durationMinutes || 0),
      userId: String(resolveFanId() ?? ''),
      creatorId: String(resolveCreatorId() ?? ''),
    },
    bookingId: bookingId || props.engine.getState('fanBooking.booking.bookingId') || null,
    eventId: eventId || previewPayload?.eventId || selectedEvent.value?.eventId || null,
    startIso: previewPayload?.startIso || '',
    fanId: String(resolveFanId() ?? ''),
    creatorId: String(resolveCreatorId() ?? ''),
    participantCount: 1,
  });

  if (!notify.shouldFire || !notify.payload) {
    console.warn('[create-schedule][instant-booking] payload-not-ready', {
      bookingId,
      eventId,
      previewPayload,
      notify,
      selectedEvent: selectedEvent.value,
    });
    return false;
  }

  return fireAndForgetCreateScheduleNotify(notify.payload);
}

function fireAndForgetBookingCreated() {
  console.error('[fireAndForgetBookingCreated] fired', { engineState: props.engine?.state });
  const engineState = props.engine?.state || {};
  const bookingTitle = selectedEvent.value?.title || selectedEvent.value?.raw?.title || "Untitled Event";
  const eventType = selectedEvent.value?.type
    || selectedEvent.value?.eventType
    || selectedEvent.value?.raw?.type
    || selectedEvent.value?.raw?.eventType
    || "1on1-call";
  const eventId = selectedEvent.value?.eventId
    || selectedEvent.value?.id
    || selectedEvent.value?.raw?.eventId
    || selectedEvent.value?.raw?.id
    || engineState.event_id
    || "";

  const payload = {
    creator_id: String(resolveCreatorId() ?? ""),
    event_name: bookingTitle,
    event_type: eventType,
    action: "created",
    event_id: String(eventId),
    booking_name: bookingTitle,
    profile_url: String(engineState.profile_url || engineState.profileUrl || ""),
    on_schedule_live: toBoolean(engineState.on_schedule_live ?? engineState.xPostLive, false),
    on_booking_received: toBoolean(engineState.on_booking_received ?? engineState.xPostBooked, false),
    on_in_session: toBoolean(engineState.on_in_session ?? engineState.xPostInSession, false),
    on_tipped_session: toBoolean(engineState.on_tipped_session ?? engineState.xPostTipped, false),
    on_purchased_in_session: toBoolean(engineState.on_purchased_in_session ?? engineState.xPostPurchase, false),
    on_schedule_live_message: String(engineState.on_schedule_live_message || ""),
    on_booking_received_message: String(engineState.on_booking_received_message || ""),
    on_in_session_message: String(engineState.on_in_session_message || ""),
    on_tipped_session_message: String(engineState.on_tipped_session_message || ""),
    on_purchased_in_session_message: String(engineState.on_purchased_in_session_message || ""),
    on_schedule_live_media_url: String(engineState.on_schedule_live_media_url || ""),
    on_booking_received_media_url: String(engineState.on_booking_received_media_url || ""),
    on_in_session_media_url: String(engineState.on_in_session_media_url || ""),
    on_tipped_session_media_url: String(engineState.on_tipped_session_media_url || ""),
    on_purchased_in_session_media_url: String(engineState.on_purchased_in_session_media_url || ""),
  };

  const endpoint = import.meta.env.VITE_WEB_BASE_URL + "/wp-json/api/bookings/create";

  console.error('[endpoint] payload', endpoint, { payload });

  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
      const queued = navigator.sendBeacon(endpoint, blob);
      if (queued) return;
    }
  } catch (_) {
    // Fire-and-forget endpoint; ignore transport errors.
  }

  fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => {
    console.error('[fireAndForgetBookingCreated] failed to send booking created payload', { endpoint, payload });
    // Fire-and-forget endpoint; ignore transport errors.
  });
}

async function fireAndForgetPostBookingChat({ bookingId = null, eventId = null } = {}) {
  try {
    const allowInstantBooking    = toBoolean(selectedEvent.value?.allowInstantBooking    ?? selectedEvent.value?.raw?.allowInstantBooking,    false);
    const allowPersonalRequest   = toBoolean(selectedEvent.value?.allowPersonalRequestRequired ?? selectedEvent.value?.raw?.allowPersonalRequestRequired, false);

    const shouldCreateChat =
      (allowInstantBooking && allowPersonalRequest) ||
      (!allowInstantBooking);

    if (!shouldCreateChat) return;

    const fanUserId   = resolveFanId();
    const creatorId   = resolveCreatorId();
    const eventTitle  = selectedEvent.value?.title || selectedEvent.value?.raw?.title || null;
    const slotDate    = props.engine.getState('fanBooking.booking.result.item.startAtIso') || null;
    const start_at     = props.engine.getState('fanBooking.booking.result.item.startAtIso') || null;
    const end_at       = props.engine.getState('fanBooking.booking.result.item.endAtIso') || null;
    console.error('[fireAndForgetPostBookingChat] resolved IDs', { slotDate,fanUserId, creatorId, eventTitle }, props.engine.getState('fanBooking.booking.result.item.startAtIso'), props.engine.getState('fanBooking.booking.result'));

    // Step 1 — check if chat exists, otherwise create
    const finalBookingId = String(bookingId || props.engine.getState('fanBooking.booking.bookingId') || '');
    const finalEventId = String(eventId || selectedEvent.value?.eventId || selectedEvent.value?.raw?.eventId || '');
    
    const newBookingMeta = {
      [finalBookingId]: {
        eventId: finalEventId,
        description: eventTitle ? `Booking request for ${eventTitle}` : 'Booking request',
      },
      is_booking_request: true
    };

    let chatId = null;
    const fetchRes = await FlowHandler.run('chat.fetchUserChats', { 
      userId: fanUserId, 
      chatOwner: creatorId, 
      limit: 100 
    });

    if (fetchRes?.ok && Array.isArray(fetchRes.data?.items)) {
      const existing = fetchRes.data.items.find(chat => {
        if (chat.type === 'group' || chat.is_group === true || chat.is_group === 1) return false;
        const parts = (chat.participants || []).map(p => Number(p.user_id ?? p.userId ?? p.id ?? p));
        return parts.length === 2 && parts.includes(Number(fanUserId)) && parts.includes(Number(creatorId));
      });
      if (existing) {
        chatId = existing.chat_id || existing.id;
        const mergedMetadata = {
          ...(existing.metadata || {}),
          ...newBookingMeta
        };
        await FlowHandler.run('chat.updateChatMetadata', {
          chatId,
          metadata: mergedMetadata
        });
      }
    }

    if (!chatId) {
      const chatRes = await FlowHandler.run('chat.createChat', {
        chatType:         'private',
        chatSubtype:      'standard',
        contextFlags:     ['booking'],
        visibilitySettings: {
          chatOwner: String(creatorId),
          chatVisibility: null,
          fullAccessUsers: [String(creatorId)]
        },
        participants: [String(fanUserId), String(creatorId)],
        name:         eventTitle || 'Booking Chat',
        description:  eventTitle ? `Booking request for ${eventTitle}` : 'Booking request',
        metadata: newBookingMeta,
      });
      if (!chatRes?.ok) return;
      chatId = chatRes.data?.chatId;
      if (!chatId) return;
    }

    // Step 2a — activity log: fan sent a live call request
    const fanUsername = props.engine.getState?.('fanBooking.fan.username')
      || String(fanUserId)
    await FlowHandler.run('chat.sendChatActivityLog', {
      chatId,
      senderId: fanUserId,
      // text: `@${fanUsername} has just sent you a live call request.`,
      text: "send_live_call_request",
      meta: { bookingId, eventTitle },
    })

    // Step 2b — send booking request message
    const msgRes = await FlowHandler.run('chat.sendBookingRequestMessage', {
      chatId,
      bookingId,
      action:     'pending',
      senderId:   fanUserId,
      eventId,
      eventTitle,
      slotDate,
      start_at: start_at,
      end_at: end_at,
      text: `Booking request for "${eventTitle}" ${slotDate ? `on ${slotDate}` : ''}`.trim(),
    });
    if (!msgRes?.ok) return;
    const messageId = msgRes.data?.item?.message_id || msgRes.data?.item?.id;
    if (!messageId) return;

    // Notify participants via socket so their chat lists reload (chat:message → unknown chat_id → fetchUserChats)
    try {
      const { sendChatMessage } = useChatSocket(fanUserId)
      const recipients = [parseInt(fanUserId), parseInt(creatorId)].filter(Boolean)
      sendChatMessage(msgRes.data.item, recipients)
    } catch (socketError) {
      logFanBookingDebug('step3', 'chat-socket-send:error', {
        fanId: fanUserId,
        creatorId,
        message: socketError?.message || String(socketError),
      });
    }

    // Step 3 — store chatId and booking message id in booking meta
    await FlowHandler.run('bookings.updateMeta', {
      bookingId,
      meta: {
        chatId,
        bookingMessageId: messageId,
      },
      actor: 'fan',
    });

    // Mirror into engine state so Step 4 can read without a backend round-trip
    props.engine.setState('fanBooking.booking.chatId', chatId, { reason: 'post-booking-chat', silent: true })
    props.engine.setState('fanBooking.booking.bookingMessageId', messageId, { reason: 'post-booking-chat', silent: true })

    // Step 4 — pin the message
    await FlowHandler.run('chat.pinMessage', { chatId, messageId });
  } catch (_) {
    console.error('[fireAndForgetPostBookingChat] error during post-booking chat setup', { bookingId, eventId, error: _ });
    // Fire-and-forget — booking is already confirmed, don't surface chat errors
    logFanBookingDebug('step3', 'post-booking-chat:error', {
      bookingId,
      eventId,
      message: _.message || String(_),
    });
  }
}

function clearHoldTimer() {
  if (holdTimerId) {
    clearInterval(holdTimerId);
    holdTimerId = null;
  }
}

function applyHoldTimer({ expiresAt, initialSeconds = 0 } = {}) {
  clearHoldTimer();

  if (!expiresAt && (!Number.isFinite(Number(initialSeconds)) || Number(initialSeconds) <= 0)) {
    secondsRemaining.value = 0;
    return;
  }

  const expiresAtMs = expiresAt ? new Date(expiresAt).getTime() : null;
  const fallbackSeconds = Math.max(0, Number(initialSeconds || 0));

  const update = () => {
    let nextSeconds = fallbackSeconds;
    if (Number.isFinite(expiresAtMs)) {
      nextSeconds = Math.max(0, Math.floor((expiresAtMs - Date.now()) / 1000));
    }

    secondsRemaining.value = nextSeconds;

    if (nextSeconds <= 0) {
      clearHoldTimer();
      props.engine.setState('fanBooking.temporaryHold.status', 'expired', { reason: 'temporary-hold-expired', silent: true });
      holdError.value = t('fan_booking_hold_expired_message');
    }
  };

  update();
  holdTimerId = setInterval(update, 1000);
}

function getHoldStatusMessage(result) {
  const errorPayload = result?.error;
  const errorObject = errorPayload && typeof errorPayload === 'object' ? errorPayload : {};
  const code = errorObject?.code || (typeof errorPayload === 'string' ? errorPayload : '');
  const details = errorObject?.details && typeof errorObject.details === 'object' ? errorObject.details : {};
  const detailsData = details?.data && typeof details.data === 'object' ? details.data : {};
  const response = details?.response && typeof details.response === 'object' ? details.response : {};
  const responseData = response?.data && typeof response.data === 'object' ? response.data : {};
  const resultData = result?.data && typeof result.data === 'object' ? result.data : {};

  const validationErrors = firstNonEmptyArray(
    details?.validation?.errors,
    details?.errors,
    detailsData?.validation?.errors,
    detailsData?.errors,
    responseData?.validation?.errors,
    responseData?.errors,
    resultData?.validation?.errors,
    resultData?.errors,
  );
  const validationMessage = formatValidationMessageList(validationErrors);
  if (validationMessage) return validationMessage;

  const validationFailures = firstNonEmptyArray(
    details?.validation?.failures,
    details?.failures,
    detailsData?.validation?.failures,
    detailsData?.failures,
    responseData?.validation?.failures,
    responseData?.failures,
    resultData?.validation?.failures,
    resultData?.failures,
  );
  const failureMessage = formatValidationMessageList(validationFailures);
  if (failureMessage) return failureMessage;

  const backendTranslationKey = resolveBackendErrorTranslationKey(result, code);
  if (backendTranslationKey) return t(backendTranslationKey);

  const validationMessages = firstNonEmptyArray(
    details?.validation?.messages,
    details?.messages,
    detailsData?.validation?.messages,
    detailsData?.messages,
    responseData?.validation?.messages,
    responseData?.messages,
    resultData?.validation?.messages,
    resultData?.messages,
  );
  if (validationMessages.length > 0) return validationMessages.join(' ');

  return details?.message
    || errorObject?.message
    || result?.meta?.uiErrors?.[0]
    || t('fan_booking_reserve_slot_failed');
}

async function refreshTemporaryHoldStatus(temporaryHoldId) {
  return props.engine.callFlow('bookings.getTemporaryHoldStatus', { temporaryHoldId }, {
    context: {
      stateEngine: props.engine,
      apiBaseUrl: props.apiBaseUrl || undefined,
      requestHeaders: guestHoldHeaders(),
    },
    forceRefresh: true,
    skipDestinationRead: true,
  });
}

async function ensureTemporaryHold() {
  if (hasBookingCreated.value) return true;
  if (!requiresTemporaryHold.value) {
    clearHoldTimer();
    secondsRemaining.value = 0;
    holdLoading.value = false;
    holdError.value = '';
    return true;
  }

  holdLoading.value = true;
  holdError.value = '';

  try {
    const existingId = props.engine.getState('fanBooking.temporaryHold.temporaryHoldId');

    if (existingId) {
      const statusResult = await refreshTemporaryHoldStatus(existingId);
      if (statusResult?.ok) {
        applyHoldTimer({
          expiresAt: statusResult.data?.expiresAt || props.engine.getState('fanBooking.temporaryHold.expiresAt'),
          initialSeconds: statusResult.data?.secondsRemaining || 0,
        });
        return true;
      }
    }

    const createResult = await props.engine.callFlow('bookings.createTemporaryHold', null, {
      context: {
        stateEngine: props.engine,
        apiBaseUrl: props.apiBaseUrl || undefined,
        userId: isGuestFlow.value ? 0 : resolveFanId(),
        fanId: isGuestFlow.value ? 0 : resolveFanId(),
        guestSessionId: isGuestFlow.value ? getGuestSessionId() : null,
        isGuestHold: isGuestFlow.value,
        requestHeaders: isGuestFlow.value ? { Authorization: null } : {},
      },
    });

    if (!createResult?.ok) {
      const existingTemporaryHoldId = createResult?.error?.details?.existingTemporaryHoldId || null;
      if (existingTemporaryHoldId) {
        const statusResult = await refreshTemporaryHoldStatus(existingTemporaryHoldId);
        if (statusResult?.ok) {
          applyHoldTimer({
            expiresAt: statusResult.data?.expiresAt || props.engine.getState('fanBooking.temporaryHold.expiresAt'),
            initialSeconds: statusResult.data?.secondsRemaining || 0,
          });
          return true;
        }
      }

      holdError.value = getHoldStatusMessage(createResult);
      return false;
    }

    if (createResult.data?.guestHoldToken) {
      props.engine.setState('fanBooking.temporaryHold.guestHoldToken', createResult.data.guestHoldToken, {
        reason: 'temporary-hold-guest-token',
        silent: true,
      });
    }

    const latestHoldId = createResult.data?.temporaryHoldId || props.engine.getState('fanBooking.temporaryHold.temporaryHoldId');
    if (!latestHoldId) {
      holdError.value = t('fan_booking_hold_missing_id');
      return false;
    }

    const statusResult = await refreshTemporaryHoldStatus(latestHoldId);
    if (!statusResult?.ok) {
      holdError.value = getHoldStatusMessage(statusResult);
      return false;
    }

    applyHoldTimer({
      expiresAt: statusResult.data?.expiresAt || props.engine.getState('fanBooking.temporaryHold.expiresAt'),
      initialSeconds: statusResult.data?.secondsRemaining || 0,
    });
    return true;
  } finally {
    holdLoading.value = false;
  }
}

async function refreshWalletBalance({ silent = false } = {}) {
  const fanId = resolveFanId();
  const creatorId = resolveCreatorId();

  logFanBookingDebug('step3', 'refreshWalletBalance:start', {
    silent,
    fanId,
    creatorId,
    selectedEventId: selectedEvent.value?.eventId || selectedEvent.value?.id || null,
    engineContext: {
      creatorId: props.engine.getState('fanBooking.context.creatorId'),
      fanId: props.engine.getState('fanBooking.context.fanId'),
    },
  });

  if (fanId <= 0 || !getBackendJwtToken()) {
    walletBalance.value = 0;
    props.engine.setState('bookingDetails.walletBalance', 0, {
      reason: 'guest-token-balance-default',
      silent: true,
    });
    hasCheckedBalance.value = true;
    balanceCheckError.value = '';
    logFanBookingDebug('step3', 'refreshWalletBalance:guest-default', {
      fanId,
      hasBackendJwtToken: !!getBackendJwtToken(),
    });
    return true;
  }

  isCheckingBalance.value = true;
  balanceCheckError.value = '';

  try {
    const response = await TokenHandler.get({
      userId: fanId,
      receiverId: Number.isFinite(Number(creatorId)) && Number(creatorId) > 0 ? Number(creatorId) : null,
      defaultValue: null,
    });

    logFanBookingDebug('step3', 'refreshWalletBalance:response', {
      response,
    });

    const parsedBalance = parseTokenBalance(response, creatorId);

    if (!Number.isFinite(parsedBalance)) {
      throw new Error(t('fan_booking_token_balance_failed'));
    }

    walletBalance.value = parsedBalance;
    props.engine.setState('bookingDetails.walletBalance', parsedBalance, {
      reason: 'token-balance-refresh',
      silent: true,
    });
    hasCheckedBalance.value = true;
    logFanBookingDebug('step3', 'refreshWalletBalance:success', {
      parsedBalance,
      walletBalance: walletBalance.value,
    });
    return true;
  } catch (error) {
    hasCheckedBalance.value = false;
    balanceCheckError.value = error?.message || t('fan_booking_check_token_balance_failed');
    logFanBookingDebug('step3', 'refreshWalletBalance:error', {
      message: balanceCheckError.value,
      error,
    });
    if (!silent) {
      showToast({
        type: 'error',
        title: t('fan_booking_balance_check_failed_title'),
        message: balanceCheckError.value,
      });
    }
    return false;
  } finally {
    isCheckingBalance.value = false;
    logFanBookingDebug('step3', 'refreshWalletBalance:finally', {
      isCheckingBalance: isCheckingBalance.value,
      hasCheckedBalance: hasCheckedBalance.value,
      balanceCheckError: balanceCheckError.value,
    });
  }
}

// --- SHARED FUNCTION TO SUBMIT BOOKING & GO TO STEP 4 ---
const finalizeBooking = async ({ isTopUpDone = false, nextWalletBalance = null } = {}) => {
  if (isSubmitting.value) return;

  if (!selectedEvent.value) {
    emit('booking-failed', {
      type: 'event-missing',
      message: t('fan_booking_select_event_before_complete'),
    });
    showToast({
      type: 'error',
      title: t('fan_booking_event_missing_title'),
      message: t('fan_booking_select_event_before_complete'),
    });
    props.engine.goToStep(1);
    return;
  }

  isSubmitting.value = true;

  try {
    const preflight = preflightBookingPayload();
    if (!preflight.ok) {
      emit('booking-failed', {
        type: 'booking-preflight',
        missingFields: preflight.missingFields,
        previewPayload: preflight.previewPayload,
        message: t('fan_booking_missing_required_fields', { fields: preflight.missingFields.join(', ') }),
      });
      showToast({
        type: 'error',
        title: t('fan_booking_booking_data_missing_title'),
        message: t('fan_booking_missing_required_fields', { fields: preflight.missingFields.join(', ') }),
      });
      props.engine.setState('fanBooking.booking.lastPreflightPayload', preflight.previewPayload, { reason: 'booking-preflight', silent: true });
      return;
    }

    const inviteAccepted = await acceptInviteForAuthenticatedFan();
    if (!inviteAccepted) {
      emit('booking-failed', {
        type: 'invite-accept',
        message: t('fan_booking_invite_accept_failed_message'),
      });
      return;
    }

    const result = await props.engine.callFlow('bookings.createBooking', null, {
      context: {
        stateEngine: props.engine,
        apiBaseUrl: props.apiBaseUrl || undefined,
      },
    });

    if (!result?.ok) {
      const staleSlotConflict = isStaleSlotConflict(result);
      const failureMessage = staleSlotConflict
        ? t('fan_booking_slot_already_booked_try_different_slot')
        : extractBackendMessage(result);
      emit('booking-failed', {
        type: 'create-booking',
        result,
        message: failureMessage,
      });
      showToast({
        type: 'error',
        title: t('fan_booking_booking_failed_title'),
        message: failureMessage,
      });
      if (staleSlotConflict) {
        await sendBackToScheduleAfterStaleSlot();
        return;
      }
      if (isTopUpDone) props.engine.forceSubstep(PAYMENT_SUBSTEP_SUMMARY, { intent: 'topup-retry' });
      return;
    }

    const bookingId = result?.data?.bookingId
      || result?.data?.id
      || result?.data?.item?.bookingId
      || result?.data?.booking?.bookingId
      || props.engine.getState('fanBooking.booking.bookingId')
      || props.engine.getState('fanBooking.booking.result.bookingId')
      || props.engine.getState('fanBooking.booking.result.item.bookingId')
      || null;
    const eventId = result?.data?.eventId
      || result?.data?.item?.eventId
      || selectedEvent.value?.eventId
      || null;

    fireAndForgetPostBookingChat({ bookingId, eventId });
    console.error('[finalizeBooking] fired post-booking chat creation');
    fireAndForgetCreateSchedule({ bookingId, eventId });
    console.error('[finalizeBooking] booking created successfully', { bookingId, eventId, result });
    fireAndForgetBookingCreated();
    console.error('[finalizeBooking] fired booking created analytics');

    const currentData = props.engine.getState('bookingDetails') || {};
    const walletAfterBooking = Number.isFinite(Number(nextWalletBalance))
      ? Number(nextWalletBalance)
      : (walletBalance.value - totalPrice.value);
    const finalBookingData = {
      ...currentData,
      formattedTimeRange: formattedTime.value,
      selectedDateDisplay: selectedDateDisplay.value,
      headerDateDisplay: headerDateDisplay.value,
      finalTotalPrice: totalPrice.value,
      walletBalance: walletAfterBooking,
      isTopUpDone,
    };

    props.engine.setState('bookingDetails', finalBookingData);
    props.engine.setState('fanBooking.booking.lastStatus', 'created', { reason: 'booking-success', silent: true });

    props.engine.forceSubstep(null, { intent: 'booking-success' });
    props.engine.goToStep(4);
    emit('booking-created', {
      bookingId,
      eventId,
      result: result?.data || result,
    });

    if (!props.embedded) {
      showToast({
        type: 'success',
        title: t('fan_booking_created_title'),
        message: t('fan_booking_created_message'),
      });
    }
  } catch (error) {
    emit('booking-failed', {
      type: 'create-booking-exception',
      error,
      message: error?.message || t('fan_booking_complete_failed_message'),
    });
    showToast({
      type: 'error',
      title: t('fan_booking_booking_failed_title'),
      message: error?.message || t('fan_booking_complete_failed_message'),
    });
    if (isTopUpDone) props.engine.forceSubstep(PAYMENT_SUBSTEP_SUMMARY, { intent: 'topup-retry' });
  } finally {
    isSubmitting.value = false;
  }
};

const handleChangeSchedule = async () => {
  if (isSubmitting.value || isCheckingBalance.value || holdLoading.value) return;
  await props.engine.forceSubstep(null, { intent: 'change-schedule' });
  props.engine.goToStep(isGroupEvent.value ? 1 : 2);
};

const enterTopUpSubstep = async () => {
  const holdOk = await ensureTemporaryHold();
  if (!holdOk) {
    showToast({
      type: 'error',
      title: t('fan_booking_could_not_hold_slot_title'),
      message: holdError.value || t('fan_booking_reserve_slot_failed'),
    });
    return false;
  }

  await props.engine.forceSubstep(PAYMENT_SUBSTEP_TOPUP, { intent: 'topup-needed' });
  return true;
};

function validateBeforeTopUpSubmit() {
  if (isSubmitting.value || hasBookingCreated.value) return false;
  if (requiresTemporaryHold.value && holdLoading.value) return false;
  if (requiresTemporaryHold.value && !hasActiveHold.value) {
    showToast({
      type: 'error',
      title: t('fan_booking_slot_hold_expired_title'),
      message: t('fan_booking_hold_expired_reserve_again'),
    });
    return false;
  }
  console.log('Top-up form validation passed');
  return true;
}

const goBackToPaymentSummary = async () => {
  if (isSubmitting.value || holdLoading.value) return;
  await props.engine.forceSubstep(PAYMENT_SUBSTEP_SUMMARY, { intent: 'topup-back' });
};

const onTopUpPaymentFailed = () => {
  props.engine.forceSubstep(PAYMENT_SUBSTEP_SUMMARY, { intent: 'topup-payment-failed' });
};

const onTopUpPaymentSuccess = async (payload = {}) => {
  const authApplied = await applyAuthenticatedFanContext(payload, { refreshBalance: false });
  if (!authApplied || !getBackendJwtToken()) {
    showToast({
      type: 'error',
      title: t('fan_booking_account_verification_needed_title'),
      message: t('fan_booking_account_verification_needed_message'),
    });
    topUpFormRef.value?.setProcessingPayment(false);
    return;
  }

  const toppedUpBalance = walletBalance.value + topUpAmount.value;
  walletBalance.value = toppedUpBalance;
  props.engine.setState('bookingDetails.walletBalance', toppedUpBalance, { reason: 'top-up-preview', silent: true });
  try {
    await finalizeBooking({
      isTopUpDone: true,
      nextWalletBalance: toppedUpBalance - totalPrice.value,
    });
  } finally {
    topUpFormRef.value?.setProcessingPayment(false);
  }
};

const onTopUpAuthUpdated = async (payload = {}) => {
  await applyAuthenticatedFanContext(payload, { refreshBalance: true });
};

// --- BUTTON HANDLERS ---
const handleButtonClick = async () => {
  logFanBookingDebug('step3', 'handleButtonClick', {
    isSubmitting: isSubmitting.value,
    isCheckingBalance: isCheckingBalance.value,
    hasCheckedBalance: hasCheckedBalance.value,
    totalPrice: totalPrice.value,
    walletBalance: walletBalance.value,
    creatorId: resolveCreatorId(),
    fanId: resolveFanId(),
  });

  if (isSubmitting.value || isCheckingBalance.value) return;
  if (contributionInvalid.value) {
    showToast({
      type: 'error',
      title: t('common_validation_failed'),
      message: t(
        'fan_booking_contribution_invalid',
        {
          min: eventGoalMinimumTokens.value,
          max: eventGoalMaximumContribution.value,
        },
      ),
    });
    return;
  }

  try {
    if (!hasCheckedBalance.value) {
      const ok = await refreshWalletBalance();
      if (!ok) return;
    }

    if (isTopUpNeeded.value) {
      await enterTopUpSubstep();
    } else {
      await finalizeBooking();
    }
  } catch (error) {
    showToast({
      type: 'error',
      title: t('fan_booking_action_failed_title'),
      message: error?.message || t('fan_booking_continue_failed_message'),
    });
  }
};

const actionLabel = computed(() => {
  if (isCheckingBalance.value) return t('fan_booking_checking_balance');
  if (!hasCheckedBalance.value) return t('fan_booking_check_balance');
  return isTopUpNeeded.value ? t('fan_booking_top_up_and_pay') : t('common_complete_booking');
});

const actionButtonClass = computed(() => {
  if (isCheckingBalance.value || !hasCheckedBalance.value || contributionInvalid.value) {
    return 'bg-[#9CA3AF] after:border-r-[#9CA3AF] cursor-not-allowed';
  }
  return isTopUpNeeded.value
    ? 'bg-[#FFED29] after:border-r-[#FFED29]'
    : 'bg-[#07F468] after:border-r-[#07F468]';
});

onMounted(() => {
  logFanBookingDebug('step3', 'mounted', {
    embedded: props.embedded,
    selectedEventId: selectedEvent.value?.eventId || selectedEvent.value?.id || null,
    engineContext: {
      creatorId: props.engine.getState('fanBooking.context.creatorId'),
      fanId: props.engine.getState('fanBooking.context.fanId'),
    },
    bookingData: bookingData.value,
  });

  if (!selectedEvent.value) {
    props.engine.goToStep(1);
    showToast({
      type: 'error',
      title: t('fan_booking_event_missing_title'),
      message: t('fan_booking_pick_event_first'),
    });
    return;
  }

  if (!props.engine.substep) {
    props.engine.forceSubstep(PAYMENT_SUBSTEP_SUMMARY, { intent: 'step3-default' });
  }

  scheduleTopUpPrefetch('step3-mounted');
  ensureContributionDefault();
  acceptInviteForAuthenticatedFan({ silent: true });
  refreshWalletBalance();
});

watch(
  () => selectedEvent.value?.eventId,
  () => {
    if (!selectedEvent.value) return;
    ensureContributionDefault();
    refreshWalletBalance({ silent: true });
  },
);

watch(
  () => [isEventGoalGroupEvent.value, eventGoalMinimumTokens.value, eventGoalMaximumContribution.value],
  () => {
    ensureContributionDefault();
  },
  { immediate: true },
);

watch(
  () => contributionTokens.value,
  (next) => {
    if (!isEventGoalGroupEvent.value) return;
    const min = eventGoalMinimumTokens.value;
    const max = eventGoalMaximumContribution.value;
    const normalized = toWholeTokens(next);
    if (max >= min) {
      const clamped = Math.min(Math.max(normalized || min, min), max);
      if (String(clamped) !== String(next)) {
        contributionTokens.value = clamped;
        return;
      }
    }
    syncContributionToEngine(normalized || min);
  },
);

watch(
  () => isTopUpSubstep.value,
  async (isTopUp) => {
    if (!isTopUp || !requiresTemporaryHold.value) return;
    await ensureTemporaryHold();
  },
  { immediate: true },
);

watch(
  () => hasBookingCreated.value,
  (created) => {
    if (created) clearHoldTimer();
  },
);

onBeforeUnmount(() => {
  logFanBookingDebug('step3', 'before-unmount');
  clearHoldTimer();
});
</script>

<template>
    <div
      class="relative lg:rounded-[20px] w-full h-full md:h-dvh lg:h-[41rem] lg:w-[852px] overflow-hidden"
      :style="popupBackgroundStyle"
    >
      <div :class="['h-full md:h-dvh lg:h-full lg:rounded-[20px] md:px-[10px] md:bg-black md:py-6 lg:p-0 lg:bg-transparent', !embedded && 'md:bg-black']">
      <div class="md:rounded-bl-[20px] md:rounded-br-[0px] h-dvh md:h-full lg:overflow-visible lg:h-full md:rounded-t-[20px] flex flex-col md:flex-row md:backdrop-blur-[5px] bg-black/75 before:content-['']
before:absolute
before:inset-0
before:bg-[rgba(0,0,0,0.75)]
before:backdrop-blur-sm
md:before:backdrop-blur-none md:backdrop-blur-sm overflow-y-auto md:overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-order-style:none] [scrollbar-width:none]">

            <OneOnOneBookingFlowLeftSideBar
              :time-display="formattedTime"
              :date-display="headerDateDisplay"
              :subtotal="totalPrice"
              :subtotal-display="totalPrice > 0 ? formatTokenCompact(totalPrice) : '-'"
              :duration="sessionDuration"
              :title-display="selectedEvent?.title || t('fan_booking_untitled_event')"
              :creator-avatar="creatorPresentation.avatar"
              :creator-name="creatorPresentation.name"
              :creator-is-verified="creatorPresentation.isVerified"
              :creator-loading="creatorPresentationLoading"
              :show-approval-needed="showApprovalNeeded"
              :is-group-event="isGroupEvent"
              :price-setting="groupPriceSetting"
              :group-performers="groupPerformers"
              :event-goal-reached-tokens="eventGoalReachedTokens"
              :event-goal-tokens="eventGoalTokens"
              :event-goal-percent="eventGoalPercent"
            />

          <div class="relative flex-1 flex w-full lg:flex-row h-auto flex-col justify-between md:min-h-0 lg:overflow-visible [&::-webkit-scrollbar]:hidden [-ms-order-style:none] [scrollbar-width:none] z-[1]">

            <div class="flex-1 h-full  flex-col px-2 lg:px-3 pt-2 lg:pt-3 lg:pb-0 gap-3 md:backdrop-blur-[5px] before:content-['']
before:absolute
before:inset-0
before:backdrop-blur-sm
md:before:backdrop-blur-none lg:overflow-hidden">
              <template v-if="!isTopUpSubstep">
                <div class="flex flex-col gap-3 md:overflow-y-auto h-full flex-1 pb-[6.25rem] md:pb-[4.5rem] relative z-[1]">
                  <div class="rounded-lg bg-white/10 p-3 md:p-5 flex flex-col gap-3">
                    <div class="flex items-center justify-between gap-4">
                      <h3 class="text-sm text-[#2CE]">{{ t("fan_booking_booking_schedule") }}</h3>
                      <button
                        v-if="!isGroupEvent"
                        type="button"
                        class="px-3 py-[6px] flex items-center justify-center gap-1 rounded-3xl border border-white/50 bg-white/15"
                        @click="handleChangeSchedule"
                      >
                        <span class="text-white text-xs font-medium">{{ t("fan_booking_change_schedule") }}</span>
                      </button>
                    </div>
                    <p v-if="!isGroupEvent && showApprovalNeeded" class="text-[#FCE40D] text-sm leading-5">{{ approvalMessage }}</p>
                    <div class="flex gap-2 justify-between">
                      <div class="flex flex-col flex-1">
                        <span class="text-xs font-normal text-[#98A2B3]">{{ t("fan_booking_date") }}</span>
                        <span class="text-base font-normal text-white">{{ bookingScheduleDateDisplay }}</span>
                      </div>
                      <div class="flex flex-col flex-1">
                        <span class="text-xs font-normal text-[#98A2B3]">{{ t("common_time") }}</span>
                        <span class="text-base font-normal text-white">{{ bookingScheduleTimeDisplay }}</span>
                      </div>
                    </div>
                  </div>

                  <div
                    v-if="isEventGoalGroupEvent"
                    class="rounded-lg bg-white/10 p-3 md:p-5 text-white"
                    data-testid="step3-event-goal-contribution-panel"
                  >
                    <div class="flex flex-col gap-5">
                      <label for="step3-event-goal-contribution" class="text-sm leading-[20px] text-white">
                        {{ t("fan_booking_your_contribution_minimum", { min: eventGoalMinimumTokens }) }}
                      </label>

                      <div
                        class="flex items-center gap-3 border-b pb-2"
                        :class="contributionInvalid ? 'border-[#FF5CA8]' : 'border-[#98A2B3]'"
                      >
                        <img :src="bookingFlowTokenIcon" alt="token-icon" class="h-8 w-8 shrink-0" />
                        <input
                          id="step3-event-goal-contribution"
                          v-model="contributionTokens"
                          type="number"
                          inputmode="numeric"
                          :min="eventGoalMinimumTokens"
                          :max="contributionRangeMax"
                          class="min-w-0 flex-1 bg-transparent text-[2rem] font-normal leading-[2.5rem] text-white outline-none"
                        />
                        <span class="text-base font-medium text-white">{{ t("common_tokens") }}</span>
                      </div>

                      <div class="relative flex h-8 items-center">
                        <div class="absolute left-0 top-1/2 h-2 w-full -translate-y-1/2 rounded-full bg-white"></div>
                        <div
                          class="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-[#37FFD7]"
                          :style="contributionSliderStyle"
                        ></div>
                        <input
                          v-model="contributionTokens"
                          type="range"
                          :min="eventGoalMinimumTokens"
                          :max="contributionRangeMax"
                          class="relative z-10 h-8 w-full cursor-pointer appearance-none bg-transparent opacity-0"
                          data-testid="step3-event-goal-contribution-range"
                        />
                        <div
                          class="pointer-events-none absolute top-1/2 z-20 h-8 w-8 -translate-x-1/2 -translate-y-1/2"
                          :style="contributionThumbStyle"
                        >
                          <img :src="bookingFlowTokenIcon" alt="token-icon" class="h-full w-full" />
                        </div>
                      </div>

                      <div class="flex items-center justify-between gap-3 text-xs leading-[18px] text-[#D0D5DD]">
                        <span>{{ t("fan_booking_contribution_bounds", { min: eventGoalMinimumTokens, max: eventGoalMaximumContribution }) }}</span>
                        <span>{{ t("fan_booking_event_goal_remaining", { tokens: formatTokenExact(eventGoalRemainingTokens) }) }}</span>
                      </div>

                      <p
                        v-if="contributionInvalid"
                        class="text-xs leading-[18px] text-[#FF99C9]"
                        data-testid="step3-event-goal-contribution-error"
                      >
                        {{
                          t(
                            "fan_booking_contribution_invalid",
                            { min: eventGoalMinimumTokens, max: eventGoalMaximumContribution },
                          )
                        }}
                      </p>
                    </div>
                  </div>

                  <div class="rounded-lg bg-white/10 flex flex-col  md:mb-14 lg:mb-0">
                    <div class="flex flex-col gap-3 w-full p-3 md:p-5">
                      <h3 class="text-sm text-[#2CE]">{{ t("fan_booking_payment_summary") }}</h3>
                      <div class="flex flex-col gap-4">
                        <div class="flex flex-col gap-3">
                          <div class="flex flex-col gap-2">
                            <h4 class="text-xs font-normal text-[#98A2B3]">{{ t("fan_booking_session_cost") }}</h4>
                            <div class="flex flex-row justify-between items-center text-white">
                              <div class="flex items-center">
                                <img :src="bookingFlowTokenIcon" alt="token-icon" class="w-4 h-4" />
                                <p class="text-base font-normal text-[#EAECF0]">{{ sessionBreakdownLabel }}</p>
                              </div>
                              <div class="flex justify-center items-center gap-0.5">
                                <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                                <p class="text-base font-normal text-white">{{ formatTokenCompact(sessionCost) }}</p>
                              </div>
                            </div>
                          </div>
                          

                          <div v-if="selectedAddons.length > 0" class="flex flex-col gap-2">
                            <h4 class="text-xs font-normal text-[#98A2B3]">{{ t("fan_booking_add_on_service_heading") }}</h4>
                            <div v-for="(addon, index) in selectedAddons" :key="index" class="flex flex-row justify-between items-center text-white">
                              <p class="text-base font-normal text-[#EAECF0]">{{ addon.name }}</p>
                              <div class="flex justify-center items-center gap-0.5">
                                <p class="text-base text-white font-normal">+</p>
                                <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                                <p class="text-base text-white font-normal">{{ formatTokenCompact(addon.price) }}</p>
                              </div>
                            </div>
                          </div>

                          <div v-if="false && bookingFeeAmount > 0" class="flex flex-col gap-2">
                            <h4 class="text-xs font-normal text-[#98A2B3]">{{ t("fan_booking_booking_fee_heading") }}</h4>
                            <div class="flex flex-row justify-between items-center text-white">
                              <p class="text-base font-normal text-[#EAECF0]">{{ t("fan_booking_booking_fee") }}</p>
                              <div class="flex justify-center items-center gap-0.5">
                                <p class="text-base text-white font-normal">+</p>
                                <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                                <p class="text-base text-white font-normal">{{ formatTokenCompact(bookingFeeAmount) }}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div v-if="discountLines.length > 0" class="flex flex-col gap-2">
                            <h4 class="text-xs font-normal text-[#98A2B3] flex items-center gap-1">{{ t("fan_booking_discount_heading") }}
                              <TooltipIcon :text="t('Creators can offer different discounts to their fans. This is optional and varies by creator.')" side="right" />
                            </h4>
                            <div
                              v-for="row in discountLines"
                              :key="row.code"
                              class="flex flex-row justify-between items-center text-white"
                            >
                              <p class="text-base font-normal text-[#EAECF0]">{{ row.label }}</p>
                              <div class="flex justify-center items-center gap-0.5">
                                <p class="text-base text-white font-normal">-</p>
                                <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                                <p class="text-base text-white font-normal">{{ formatTokenCompact(row.amount) }}</p>
                              </div>
                            </div>
                          </div>

                          <div v-if="offHourSurchargeAmount > 0" class="flex flex-col gap-2">
                            <h4 class="text-xs font-normal text-[#98A2B3]">{{ t("fan_booking_off_hour_surcharge_heading") }}</h4>
                            <div class="flex flex-row justify-between items-center text-white">
                              <p class="text-base font-normal text-[#EAECF0]">{{ offHourSurchargeLabel }}</p>
                              <div class="flex justify-center items-center gap-0.5">
                                <p class="text-base text-white font-normal">+</p>
                                <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                                <p class="text-base text-white font-normal">{{ formatTokenCompact(offHourSurchargeAmount) }}</p>
                              </div>
                            </div>
                          </div>

                          <div v-if="bookingFeeAmount > 0" class="flex flex-col gap-2">
                            <h4 class="text-xs font-normal text-[#98A2B3] flex items-center gap-1">{{ t("fan_booking_Non_Refundable") }}
                              <TooltipIcon :text="t('Creators may charge extra fees in certain cases (optional & varies by creator). These fees are non-refundable, even if the booking is rejected.')" side="right" />
                            </h4>
                            <div class="flex flex-row justify-between items-center text-white">
                              <div class="flex items-center">
                                <img :src="bookingFlowTokenIcon" alt="token-icon" class="w-4 h-4" />
                                <p class="text-base font-normal text-[#EAECF0]">{{ formatTokenCompact(bookingFeeAmount) }} {{ t("fan_booking_booking_fee_included") }}</p>
                              </div>
                              <div class="flex justify-center items-center gap-0.5">
                                <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                                <p class="text-base text-white font-normal">{{ sessionTotalUsdDisplay }}</p>
                              </div>
                            </div>
                          </div>

                          <div class="flex gap-3 justify-between">
                            <div class="flex flex-col gap-1">
                              <h4 class="text-base font-semibold text-white">{{ t("fan_booking_session_total") }}</h4>
                              <p v-if="bookingFeeAmount > 0" class="text-xs font-semibold leading-[18px] text-[#98A2B3] dn">
                                <span class="whitespace-nowrap">{{ t("fan_booking_non_refundable") }}</span>
                                <span class="flex items-center gap-[2px] mx-1">
                                  <img :src="bookingFlowTokenIcon" alt="token-icon" class="w-4 h-4" />
                                  <span class="">{{ formatTokenCompact(bookingFeeAmount) }}</span>
                                </span>
                                <span class="whitespace-nowrap">{{ t("fan_booking_booking_fee_included") }}</span>
                              </p>
                            </div>
                            <div class="flex flex-col">
                              <div class="flex justify-end items-center gap-0.5">
                                <p class="text-base text-white font-normal">≈</p>
                                <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                                <p class="text-base font-semibold text-white">{{ formatTokenExact(sessionTotalTokens) }}</p>
                              </div>
                              <span class="dn text-xs font-medium text-[#98A2B3] whitespace-nowrap">={{ sessionTotalUsdDisplay }}</span>
                            </div>
                          </div>
                        </div>

                        <hr class="border-[#F2F4F7] opacity-50" />

                        <div class="flex flex-row justify-between items-start text-white">
                          <p class="text-xl font-semibold text-white">{{ t("fan_booking_amount_due_today") }}</p>
                          <div class="flex flex-col">
                            <div class="flex justify-end items-center gap-0.5">
                              <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                              <p class="text-xl font-semibold">{{ formatTokenExact(totalPrice) }}</p>
                            </div>
                            <span class="text-xs font-medium text-[#98A2B3] whitespace-nowrap">={{ amountDueUsdDisplay }}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="text-white rounded-bl-lg rounded-br-lg overflow-hidden" :style="balanceCardStyle">
                      <div class="flex flex-col gap-2 p-5" style="background: linear-gradient(0deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.5) 100%); backdrop-filter: blur(5px);">

                        <div class="flex justify-between items-center">
                          <div class="flex items-center gap-2"><p class="text-base font-semibold text-[#FCE40D]">{{ t("fan_booking_your_token_balance") }}</p></div>
                          <div class="flex justify-center items-center gap-0.5">

                            <div v-if="isTopUpNeeded" class="flex items-center justify-center gap-2 px-1 py-0 h-[1.25rem] rounded-[6px] bg-[#FCE40D]">
                                <span class="text-[#0C111D] text-[11px] font-semibold leading-[10px] relative top-[-2px]">...</span>
                                <p class="text-[11px] font-semibold text-[#0C111D] leading-[14px] italic tracking-wider">{{ t("common_top_up_needed") }}</p>
                                <div class="w-3 h-3 hidden justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                                <p class="text-[11px] hidden font-semibold text-[#0C111D] leading-[14px]">{{ formatTokenCompact(topUpAmount) }}</p>
                            </div>

                            <div class="flex items-center justify-center gap-[2px]">
                              <div class="w-6 h-6 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                            <p class="text-xl font-semibold text-[#FCE40D]">{{ formatTokenCompact(walletBalance) }}</p>
                            </div>
                          </div>
                        </div>
                        <hr class="hidden border-white/20" />
                        <div class="hidden justify-between items-center">
                          <div class="flex items-center gap-2"><p class="text-xl font-semibold">{{ t("fan_booking_balance_after_booking") }}</p></div>
                          <div class="flex justify-center items-center gap-0.5">
                            <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                            <p class="text-2xl font-semibold">{{ formatTokenCompact(remainingBalance) }}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </template>

              <template v-else>
                <div
                  v-if="requiresTemporaryHold"
                  class="mb-3 rounded-[8px] border border-white/20 bg-black/40 p-3 relative z-[1]"
                  data-testid="temporary-hold-banner"
                >
                  <p v-if="holdLoading" class="text-xs text-yellow-200 font-medium">{{ t("fan_booking_reserving_slot") }}</p>
                  <p v-else-if="holdError" class="text-xs text-red-300 font-medium">{{ holdError }}</p>
                  <p v-else class="text-xs text-[#07F468] font-semibold">{{ t("fan_booking_slot_reserved_for", { time: formattedHoldTimer }) }}</p>
                  <button
                    v-if="holdError && !holdLoading"
                    type="button"
                    class="mt-2 text-[11px] underline text-[#22CCEE]"
                    @click="ensureTemporaryHold"
                  >
                    {{ t("fan_booking_retry_hold") }}
                  </button>
                </div>

                <TopUpForm
                  ref="topUpFormRef"
                  :wallet-balance="walletBalance"
                  :top-up-amount="topUpAmount"
                  :total-price="totalPrice"
                  :remaining-balance="remainingBalanceAfterBooking"
                  :before-submit="validateBeforeTopUpSubmit"
                  :fan-id="resolveFanId()"
                  :creator-id="resolveCreatorId()"
                  @back="goBackToPaymentSummary"
                  @auth-updated="onTopUpAuthUpdated"
                  @success="onTopUpPaymentSuccess"
                  @payment-failed="onTopUpPaymentFailed"
                />
              </template>
            </div>

          </div>


          <div :class="actionFooterClass">
            <button
              v-if="!isTopUpSubstep"
              type="button"
              :disabled="isCheckingBalance || isSubmitting || contributionInvalid"
              @click="handleButtonClick"
              class="w-auto flex justify-start items-center"
              :class="(isCheckingBalance || isSubmitting || contributionInvalid) ? 'pointer-events-none' : 'cursor-pointer'"
            >
              <div class="relative w-full p-[12px] md:rounded-br-[0px] flex justify-between items-center
                gap-2 after:content-[''] after:absolute after:right-full after:top-0 after:w-0
                after:h-0 after:border-t-[3.3125rem] after:border-t-transparent after:border-r-[1rem]
                  after:border-b-0"
                :class="actionButtonClass">
              <p class="text-lg w-full leading-[28px] text-black text-center font-medium">{{ isSubmitting ? t('fan_booking_processing') : actionLabel }}</p>
              <div v-if="isCheckingBalance" class="w-5 h-5 border-2 border-black/40 border-t-black rounded-full animate-spin flex-none"></div>
              <div class="w-6 h-6 flex justify-center items-center">
                <img :src="bookingFlowArrowRightIcon" alt="arrow-right-icon" />
              </div>
            </div>
            </button>

          </div>

        </div>
      </div>
    </div>

</template>
