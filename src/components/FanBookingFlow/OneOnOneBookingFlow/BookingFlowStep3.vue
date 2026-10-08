<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount, defineAsyncComponent } from 'vue';
import OneOnOneBookingFlowLeftSideBar from '../HelperComponents/OneOnOneBookingFlowLeftSideBar.vue';
import TokenHandler from '@/utils/TokenHandler.js';
import { showToast } from '@/utils/toastBus.js';
import { mapCreateBookingToRequest, MAX_EVENT_GOAL_CONTRIBUTION_TOKENS } from '@/services/bookings/mappers/createBookingMapper.js';
import { sumEventGoalContributionsForEvent } from '@/services/bookings/utils/bookingSlotUtils.js';
import TooltipIcon from "@/components/ui/tooltip/TooltipIcon.vue";
import CheckboxGroup from '@/components/ui/form/checkbox/CheckboxGroup.vue';
import ReadAndUnderstandPopup from '@/components/ui/popup/ReadAndUnderstandPopup.vue';
import { resolveCreatorIdFromContext, resolveFanIdFromContext } from '@/utils/contextIds.js';
import { resolveParentUserData } from '@/utils/resolveParentUserData.js';
import { fetchUserProfileData } from '@/services/users/userProfileApi.js';
import { logFanBookingDebug } from '@/embeds/fanBooking/debug.js';
import {
  fireAndForgetCreateScheduleNotify,
  getCreateScheduleNotifyPayload,
  shouldFireCreateScheduleForInstantBooking,
} from '@/utils/bookingScheduleNotify.js';
import {
  bookingFlowArrowRightIcon,
  bookingFlowBackgroundImage,
  bookingFlowTokenIcon,
  bookingFlowBackarrowIcon,
  bookingFlowTruckIcon,
} from './oneOnOneBookingFlowAssets.js';
import { resolveCreatorPresentation } from './creatorPresentation.js';
import { useEventBackgroundImage } from './useEventBackgroundImage.js';
import FlowHandler from '@/services/flow-system/FlowHandler'
import { useChatSocket } from '@/composables/useChatSocket';
import { resolveGuestSessionId } from '@/utils/resolveGuestSessionId';
import { getBackendJwtToken, normalizeBackendAuthContext, setBackendJwtToken } from '@/utils/backendJwt.js';
import { getBookingsApiBaseUrl, getBookingRequiredProducts, getBookingPrerequisitePrice, fetchBookingPrerequisiteEligibility } from '@/services/bookings/bookingsApiUtils.js';
import { formatBookingValidationErrors, useBookingTranslations } from '@/i18n/bookingTranslations.js';
import { extractBackendErrorMessage } from '@/utils/backendErrorMessage.js';
import { presentBackendJwtAuthError } from '@/utils/backendJwtErrorToast.js';
import {
  formatGmtOffsetLabel,
  getBrowserOffsetMinutes,
} from '@/services/bookings/utils/fixedOffsetTimezone.js';

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
  groupReview: { type: Boolean, default: false },
  prepareGroupBooking: { type: Function, default: null },
  groupActionDisabled: { type: Boolean, default: false },
  refreshBookingContext: {
    type: Function,
    default: null,
  },
});

const emit = defineEmits(['booking-created', 'booking-failed', 'balance-changed']);
const { t } = useBookingTranslations();
const isAcceptingInvite = ref(false);
let inviteAcceptPromise = null;
const hasAcceptedAttendancePolicy = ref(false);
const isAttendancePolicyPopupOpen = ref(false);
const isResumingAttendancePolicyAction = ref(false);

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
const pendingTopUpExpectedBalance = ref(null);
const prerequisiteValidation = ref(
  props.engine.getState('fanBooking.prerequisite.eventId') === (selectedEvent.value?.eventId || selectedEvent.value?.id)
    ? props.engine.getState('fanBooking.prerequisite.validation') || null
    : null,
);
const isCheckingPrerequisite = ref(false);
const isPrerequisiteCheckoutOpen = ref(false);
const prerequisiteError = ref('');
let topUpBalanceSyncGeneration = 0;
let hasNotifiedTopUpBalanceChange = false;

const PAYMENT_SUBSTEP_SUMMARY = 'summary';
const PAYMENT_SUBSTEP_TOPUP   = 'topup';
const TOP_UP_BALANCE_SYNC_INTERVAL_MS = 1000;
const TOP_UP_BALANCE_SYNC_MAX_ATTEMPTS = 16;

const popupBackgroundStyle = computed(() => ({
  backgroundImage: `url('${resolvedBackgroundImageUrl.value}')`,
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'left 50% center',
}));

const balanceCardAvatarUrl = ref('');
const balanceCardColorScheme = ref('');
let balanceCardAvatarAbortController = null;

function normalizeAvatarUrl(...candidates) {
  const avatarUrl = candidates.find((candidate) => (
    typeof candidate === 'string' && candidate.trim()
  ));
  return avatarUrl?.trim() || '';
}

function isPlaceholderAvatar(avatarUrl) {
  return normalizeAvatarUrl(avatarUrl).toLowerCase().includes('placeholder');
}

function isSvgAvatar(avatarUrl) {
  const normalizedUrl = normalizeAvatarUrl(avatarUrl).split(/[?#]/, 1)[0].toLowerCase();
  return normalizedUrl.endsWith('.svg');
}

function normalizeColorScheme(colorScheme) {
  if (typeof colorScheme !== 'string') return '';
  const normalizedColor = colorScheme.trim();
  return /^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(normalizedColor)
    ? normalizedColor
    : '';
}

const showAvatarBalanceCard = computed(() => (
  Boolean(balanceCardAvatarUrl.value) && !isPlaceholderAvatar(balanceCardAvatarUrl.value)
));

const balanceCardStyle = computed(() => {
  const usesSvgAvatar = isSvgAvatar(balanceCardAvatarUrl.value);
  const style = {
    backgroundImage: `url('${balanceCardAvatarUrl.value}')`,
    backgroundPosition: usesSvgAvatar ? 'right' : 'center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: usesSvgAvatar ? '48% 100%' : 'cover',
  };

  if (usesSvgAvatar && balanceCardColorScheme.value) {
    style.backgroundColor = balanceCardColorScheme.value;
  }

  return style;
});

async function refreshBalanceCardAvatar({ userId = resolveFanId() } = {}) {
  balanceCardAvatarAbortController?.abort();
  balanceCardAvatarAbortController = null;

  const wordpressUserData = resolveParentUserData() || {};
  const wordpressAvatar = normalizeAvatarUrl(wordpressUserData.userAvatar);
  const wordpressColorScheme = normalizeColorScheme(wordpressUserData.user?.color_scheme);
  balanceCardAvatarUrl.value = wordpressAvatar;
  balanceCardColorScheme.value = wordpressColorScheme;

  if (isPlaceholderAvatar(wordpressAvatar)) return wordpressAvatar;

  const shouldFetchProfile = !wordpressAvatar
    || (isSvgAvatar(wordpressAvatar) && !wordpressColorScheme);
  if (!shouldFetchProfile) return wordpressAvatar;

  const numericUserId = Number(userId);
  if (!Number.isFinite(numericUserId) || numericUserId <= 0) return '';

  const controller = new AbortController();
  balanceCardAvatarAbortController = controller;

  try {
    const profile = await fetchUserProfileData(numericUserId, { signal: controller.signal });
    if (balanceCardAvatarAbortController !== controller || controller.signal.aborted) return '';

    const profileAvatar = normalizeAvatarUrl(
      profile?.avatar,
      profile?.avatarUrl,
      profile?.avatar_url,
      profile?.userAvatar,
    );
    const profileColorScheme = normalizeColorScheme(profile?.color_scheme);
    const resolvedAvatar = wordpressAvatar || profileAvatar;
    balanceCardAvatarUrl.value = resolvedAvatar;
    balanceCardColorScheme.value = wordpressColorScheme || profileColorScheme;
    return resolvedAvatar;
  } catch (error) {
    if (error?.name === 'AbortError') return '';
    logFanBookingDebug('step3', 'balance-avatar-fetch:error', {
      userId: numericUserId,
      message: error?.message || String(error),
    });
    return '';
  } finally {
    if (balanceCardAvatarAbortController === controller) {
      balanceCardAvatarAbortController = null;
    }
  }
}

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
const requiredProducts = computed(() => getBookingRequiredProducts(selectedEvent.value));
const hasProductPrerequisite = computed(() => requiredProducts.value.length > 0);
const prerequisiteDetail = computed(() => prerequisiteValidation.value?.prerequisite || null);
const isSubscriptionPrerequisite = computed(() => (
  prerequisiteDetail.value?.type === 'subscription'
  || Number(prerequisiteDetail.value?.product?.is_subscription_variation) === 1
  || ['subscribe', 'switch'].includes(prerequisiteDetail.value?.action)
));
const prerequisiteShippingCostLabel = computed(() => {
  const shipping = prerequisiteDetail.value?.shipping;
  if (typeof shipping?.cost === 'number') {
    return shipping.cost > 0
      ? t('fan_booking_shipping_charge', { amount: shipping.cost.toFixed(2) })
      : t('fan_booking_free_shipping');
  }
  return shipping?.cost_label || t('fan_booking_calculated_at_checkout');
});
const prerequisiteProductTitle = computed(() => {
  const product = prerequisiteDetail.value?.product || {};
  if (isSubscriptionPrerequisite.value && String(product.variation_title || '').trim()) {
    return String(product.variation_title).trim();
  }
  return String(product.title || product.name || '').trim();
});
const prerequisiteEligible = computed(() => (
  !hasProductPrerequisite.value || prerequisiteDetail.value?.eligible === true
));
const contributionTokens = computed(() => Number(
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
  const allocated = Number(mappedPayment.value?.allocations?.bookingFee);
  const amount = Number.isFinite(allocated) && allocated > 0 ? allocated : findLineAmount("booking_fee");
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
});
const discountLineCodes = new Set([
  'discount',
  'first_time_discount',
  'recurring_event_discount',
]);
const translatedPaymentLineLabel = (code) => {
  if (code === 'discount') return t('fan_booking_longer_session_discount');
  if (code === 'first_time_discount') return t('fan_booking_first_time_discount');
  if (code === 'recurring_event_discount') {
    const raw = selectedEvent.value?.raw || {};
    const percent = Number(
      raw.recurringDiscountPercentOfBase
        ?? selectedEvent.value?.recurringDiscountPercentOfBase
        ?? 0,
    );
    return t('fan_booking_recurring_event_discount', {
      percent: Number.isFinite(percent) ? percent : 0,
    });
  }
  return t('common_discount');
};
const discountLines = computed(() => (
  mappedPaymentLines.value
    .filter((row) => {
      const code = String(row?.code || '');
      return discountLineCodes.has(code) && Number(row?.amount || 0) < 0;
    })
    .map((row) => ({
      code: String(row?.code || ''),
      label: translatedPaymentLineLabel(String(row?.code || '')),
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
  return t("fan_booking_off_hour_surcharge");
});
const baseTotalPrice = computed(() => Number(bookingData.value.totalPrice || 0));
const mappedPaymentTotal = computed(() => {
  const total = Number(mappedPayment.value?.total);
  return Number.isFinite(total) ? total : null;
});
const totalPrice = computed(() => (
  mappedPaymentTotal.value == null
    ? baseTotalPrice.value
    : mappedPaymentTotal.value
));
const cancellationReserveAmount = computed(() => {
  const allocated = Number(mappedPayment.value?.allocations?.cancellationFee);
  if (Number.isFinite(allocated) && allocated > 0) return allocated;
  const hasMappedPayment = mappedPayment.value && typeof mappedPayment.value === 'object';
  const usesV2Allocations = Number(mappedPayment.value?.paymentPolicyVersion || 0) === 2
    || (!hasMappedPayment && toBoolean(import.meta.env?.VITE_BOOKING_COMPONENT_HOLDS_ENABLED, true));
  if (!usesV2Allocations) return 0;
  const raw = selectedEvent.value?.raw || {};
  const enabled = toBoolean(raw.enableCancellationFee ?? selectedEvent.value?.enableCancellationFee, false);
  const amount = Number(raw.cancellationFeeTokens ?? raw.cancellationFee ?? selectedEvent.value?.cancellationFeeTokens ?? 0);
  return enabled && Number.isFinite(amount) && amount > 0 ? Math.ceil(amount) : 0;
});
const maximumHeldAmount = computed(() => totalPrice.value);

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
  return sumEventGoalContributionsForEvent({ eventId, bookedSlotsIndex: bookedSlotsIndex.value });
});
const eventGoalPercent = computed(() => (
  eventGoalTokens.value > 0
    ? Math.min(100, Math.max(0, Math.floor((eventGoalReachedTokens.value / eventGoalTokens.value) * 100)))
    : 0
));

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

const eventGoalMaximumContribution = computed(() => MAX_EVENT_GOAL_CONTRIBUTION_TOKENS);
const normalizedContributionTokens = computed(() => toWholeTokens(contributionTokens.value));
const contributionInvalid = computed(() => {
  if (!isEventGoalGroupEvent.value) return false;
  const amount = normalizedContributionTokens.value;
  const max = eventGoalMaximumContribution.value;
  return max <= 0 || amount < eventGoalMinimumTokens.value || amount > max;
});
const formattedTime = computed(() => bookingData.value.formattedTimeRange || '-');
const isFirstBookingForCreator = computed(() => (
  props.engine.getState('fanBooking.context.isFirstBookingForCreator') === true
));
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
  return maximumHeldAmount.value > walletBalance.value;
});

const topUpAmount = computed(() => {
  return isTopUpNeeded.value ? (maximumHeldAmount.value - walletBalance.value) : 0;
});

const remainingBalance = computed(() => {
  return walletBalance.value - maximumHeldAmount.value;
});

const remainingBalanceAfterBooking = computed(() => walletBalance.value + topUpAmount.value - maximumHeldAmount.value);
const isTopUpSubstep = computed(() => !props.groupReview && paymentSubstep.value === PAYMENT_SUBSTEP_TOPUP);
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
      const error = new Error(payload?.message || payload?.error || t('fan_booking_invite_accept_failed_message'));
      error.backendJwtErrorPresented = presentBackendJwtAuthError(payload, {
        token: jwtToken,
        title: t('fan_booking_invite_accept_failed_title'),
      });
      throw error;
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
    if (!silent && !error?.backendJwtErrorPresented) {
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

function formatTokenExact(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';
  const rounded = Math.round(num);
  return exactTokenFormatter.format(rounded);
}

function tokensToUsdDisplay(value) {
  const num = Number(value);
  const usd = Number.isFinite(num) ? num * approximateTokenRate.value : 0;
  return `USD$ ${usdFormatter.format(usd)}`;
}

const bookingScheduleDateDisplay = computed(() => (
  selectedDateDisplay.value || headerDateDisplay.value || '-'
));

const bookingScheduleTimeDisplay = computed(() => {
  const timeRange = String(formattedTime.value || '').trim();
  const duration = Number(sessionDuration.value || 0);
  if (!timeRange || timeRange === '-') return '-';

  const durationSuffix = duration > 0 ? ` (${duration} min)` : '';
  const savedOffset = Number(bookingData.value.displayTimezoneOffsetMinutes);
  const gmtOffset = bookingData.value.displayTimezoneLabel
    || formatGmtOffsetLabel(
      Number.isFinite(savedOffset) ? savedOffset : getBrowserOffsetMinutes(),
    );
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
const approximateTokenRate = computed(() => {
  const rate = Number(prerequisiteValidation.value?.token_pricing?.base_price_per_token);
  return Number.isFinite(rate) && rate > 0 ? rate : 0.06;
});
const sessionTotalUsdDisplay = computed(() =>
  tokensToUsdDisplay(sessionTotalTokens.value).replace(/^USD\$\s*/, '').trim()
);
const prerequisiteAmountUsd = computed(() => (
  prerequisiteDetail.value?.product && !prerequisiteDetail.value?.eligible
    ? getBookingPrerequisitePrice(prerequisiteDetail.value)
      + Math.max(0, Number(prerequisiteDetail.value.shipping?.cost || 0))
    : 0
));
const amountDueUsdDisplay = computed(() => {
  return `USD$ ${usdFormatter.format(sessionTotalTokens.value * approximateTokenRate.value + prerequisiteAmountUsd.value)}`;
});

const BACKEND_BOOKING_ERROR_TRANSLATIONS = Object.freeze({
  missing_bearer_token: 'fan_booking_error_missing_bearer_token',
  missing_jwt_secret_key: 'fan_booking_error_missing_jwt_secret_key',
  invalid_jwt_issuer: 'fan_booking_error_invalid_jwt_issuer',
  invalid_jwt_audience: 'fan_booking_error_invalid_jwt_audience',
  jwt_missing_exp: 'fan_booking_error_jwt_missing_exp',
  jwt_invalid_exp: 'fan_booking_error_jwt_invalid_exp',
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
  if (code) return t('fan_booking_request_failed_with_code', { code });
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
  return normalizeBackendAuthContext(payload);
}

function syncCheckoutAccountPresentation(payload = {}) {
  const response = payload.response || payload;
  const checkoutUser = response.userData;
  const nonce = response.custom_checkout_params?.wp_rest_nonce;
  if (checkoutUser) {
    window.userData = { ...window.userData, ...checkoutUser };
    if (window.parent !== window) window.parent.userData = { ...window.parent.userData, ...checkoutUser };
  }
  if (nonce) {
    window.custom_checkout_params = { ...window.custom_checkout_params, ...response.custom_checkout_params };
    if (window.parent !== window) {
      window.parent.custom_checkout_params = {
        ...window.parent.custom_checkout_params, ...response.custom_checkout_params,
      };
      if (window.parent.siteData) window.parent.siteData.restNonce = nonce;
    }
  }
}

async function applyAuthenticatedFanContext(payload = {}, { refreshBalance = true } = {}) {
  const { userId, backendJwtToken } = normalizeAuthUpdatePayload(payload);

  if (backendJwtToken) {
    setBackendJwtToken(backendJwtToken);
  }

  // Logged-in checkout responses do not repeat the fan id or JWT. In that
  // case, retain the authenticated booking context already established when
  // the iframe opened. Guest checkout must still provide the newly created or
  // authenticated account details before it can continue.
  const existingFanId = Number(resolveFanId());
  const hasPayloadUserId = Number.isFinite(userId) && userId > 0;
  const authenticatedUserId = hasPayloadUserId
    ? userId
    : (getBackendJwtToken() && Number.isFinite(existingFanId) && existingFanId > 0
      ? existingFanId
      : 0);

  if (!authenticatedUserId) return false;

  syncCheckoutAccountPresentation(payload);
  window.parent?.FSEventsEmbed?.updateFanBookingAuth?.({
    fanId: authenticatedUserId, jwtToken: getBackendJwtToken(),
  });

  const checkoutUser = payload?.response?.userData || payload?.userData;
  if (checkoutUser && Number(checkoutUser.userID || checkoutUser.user_id) === authenticatedUserId) {
    // Keep the existing account's UID as well as its JWT after inline login.
    // Free-tier activation must not use an account captured by the parent page.
    window.userData = { ...window.userData, ...checkoutUser };
  }

  props.engine.setState('fanBooking.context.fanId', authenticatedUserId, { reason: 'auth-user-id', silent: true });
  props.engine.setState('userId', authenticatedUserId, { reason: 'auth-user-id', silent: true });
  props.engine.setState('fanId', authenticatedUserId, { reason: 'auth-user-id', silent: true });
  void refreshBalanceCardAvatar({ userId: authenticatedUserId });
  await acceptInviteForAuthenticatedFan({ silent: true });

  const creatorId = resolveCreatorId();
  if (Number.isFinite(Number(creatorId)) && Number(creatorId) > 0) {
    await props.engine.callFlow('bookings.fetchCreatorBookingContext', {
      creatorId,
      fanId: authenticatedUserId,
      status: 'active',
      limit: 100,
      periodMonths: 6,
      slotLimit: 2000,
    }, {
      forceRefresh: true,
      context: {
        stateEngine: props.engine,
        creatorId,
        fanId: authenticatedUserId,
        apiBaseUrl: props.apiBaseUrl || undefined,
      },
    }).catch(() => {});
  }

  const temporaryHoldId = props.engine.getState('fanBooking.temporaryHold.temporaryHoldId');
  if (temporaryHoldId && getBackendJwtToken()) {
    await FlowHandler.run('bookings.updateTemporaryHoldUser', {
      temporaryHoldId,
      userId: authenticatedUserId,
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
  const bookingTitle = selectedEvent.value?.title
    || selectedEvent.value?.raw?.title
    || t('fan_booking_untitled_event');
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
    const bookingRequestDescription = eventTitle
      ? t('fan_booking_request_description', { event: eventTitle })
      : t('fan_booking_request');
    const bookingRequestMessage = eventTitle
      ? (
        slotDate
          ? t('fan_booking_request_message_on_date', { event: eventTitle, date: slotDate })
          : t('fan_booking_request_message', { event: eventTitle })
      )
      : t('fan_booking_request');
    
    const newBookingMeta = {
      [finalBookingId]: {
        eventId: finalEventId,
        description: bookingRequestDescription,
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
        name:         eventTitle || t('fan_booking_chat_name'),
        description:  bookingRequestDescription,
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
      text: bookingRequestMessage,
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

function currentTemporaryHoldFingerprint() {
  const payload = preflightBookingPayload().previewPayload || {};
  return {
    eventId: payload.eventId || null,
    userId: isGuestFlow.value ? 0 : resolveFanId(),
    startIso: payload.startIso || null,
    endIso: payload.endIso || null,
  };
}

function isoInstantsMatch(left, right) {
  const leftMs = Date.parse(left || '');
  const rightMs = Date.parse(right || '');
  return Number.isFinite(leftMs) && Number.isFinite(rightMs) && leftMs === rightMs;
}

function temporaryHoldMatchesCurrentBooking(hold = {}) {
  const expected = currentTemporaryHoldFingerprint();
  return String(hold?.eventId || '') === String(expected.eventId || '')
    && String(hold?.userId ?? '') === String(expected.userId ?? '')
    && isoInstantsMatch(hold?.startIso, expected.startIso)
    && isoInstantsMatch(hold?.endIso, expected.endIso);
}

function clearTemporaryHoldState(reason = 'temporary-hold-cleared') {
  clearHoldTimer();
  secondsRemaining.value = 0;
  props.engine.setState('fanBooking.temporaryHold', {
    temporaryHoldId: null,
    status: 'none',
    expiresAt: null,
    secondsRemaining: 0,
    createdAt: null,
    checkedAt: null,
    guestSessionId: props.engine.getState('fanBooking.temporaryHold.guestSessionId') || null,
    guestHoldToken: null,
  }, { reason, silent: true });
}

function storeValidatedTemporaryHold(hold = {}) {
  props.engine.setState('fanBooking.temporaryHold', {
    ...temporaryHold.value,
    temporaryHoldId: hold.temporaryHoldId,
    eventId: hold.eventId,
    userId: hold.userId,
    startIso: hold.startIso,
    endIso: hold.endIso,
    status: hold.status || 'active',
    expiresAt: hold.expiresAt || null,
    secondsRemaining: Number(hold.secondsRemaining || 0),
    createdAt: hold.createdAt || null,
    checkedAt: new Date().toISOString(),
  }, { reason: 'temporary-hold-validated', silent: true });
}

async function releaseTemporaryHoldForRepair(temporaryHoldId) {
  if (!temporaryHoldId) return true;
  const result = await props.engine.callFlow('bookings.releaseTemporaryHold', { temporaryHoldId }, {
    context: {
      stateEngine: props.engine,
      apiBaseUrl: props.apiBaseUrl || undefined,
      requestHeaders: guestHoldHeaders(),
      requestTimeoutMs: 3000,
    },
    forceRefresh: true,
    skipDestinationRead: true,
  });
  if (result?.ok) clearTemporaryHoldState('temporary-hold-released-for-repair');
  return Boolean(result?.ok);
}

async function ensureTemporaryHold({ allowRepair = true } = {}) {
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
      const hold = statusResult?.data?.temporaryHold || null;
      if (statusResult?.ok && temporaryHoldMatchesCurrentBooking(hold)) {
        storeValidatedTemporaryHold(hold);
        applyHoldTimer({
          expiresAt: statusResult.data?.expiresAt || props.engine.getState('fanBooking.temporaryHold.expiresAt'),
          initialSeconds: statusResult.data?.secondsRemaining || 0,
        });
        return true;
      }
      if (statusResult?.ok && allowRepair) {
        const released = await releaseTemporaryHoldForRepair(existingId);
        if (!released) {
          holdError.value = t('fan_booking_hold_release_failed_message');
          return false;
        }
      } else {
        clearTemporaryHoldState('temporary-hold-status-invalid');
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
        const hold = statusResult?.data?.temporaryHold || null;
        if (statusResult?.ok && temporaryHoldMatchesCurrentBooking(hold)) {
          storeValidatedTemporaryHold(hold);
          applyHoldTimer({
            expiresAt: statusResult.data?.expiresAt || props.engine.getState('fanBooking.temporaryHold.expiresAt'),
            initialSeconds: statusResult.data?.secondsRemaining || 0,
          });
          return true;
        }
        if (statusResult?.ok && allowRepair) {
          const released = await releaseTemporaryHoldForRepair(existingTemporaryHoldId);
          if (!released) {
            holdError.value = t('fan_booking_hold_release_failed_message');
            return false;
          }
          return ensureTemporaryHold({ allowRepair: false });
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

    const createdHold = statusResult.data?.temporaryHold || null;
    if (!temporaryHoldMatchesCurrentBooking(createdHold)) {
      await releaseTemporaryHoldForRepair(latestHoldId);
      holdError.value = t('fan_booking_error_temporary_hold_mismatch');
      return false;
    }

    storeValidatedTemporaryHold(createdHold);

    applyHoldTimer({
      expiresAt: statusResult.data?.expiresAt || props.engine.getState('fanBooking.temporaryHold.expiresAt'),
      initialSeconds: statusResult.data?.secondsRemaining || 0,
    });
    return true;
  } finally {
    holdLoading.value = false;
  }
}

async function fetchAuthoritativeWalletBalance() {
  const fanId = resolveFanId();
  const creatorId = resolveCreatorId();

  if (fanId <= 0 || !getBackendJwtToken()) return 0;

  const response = await TokenHandler.get({
    userId: fanId,
    receiverId: Number.isFinite(Number(creatorId)) && Number(creatorId) > 0 ? Number(creatorId) : null,
    defaultValue: null,
  });

  logFanBookingDebug('step3', 'fetchAuthoritativeWalletBalance:response', { response });

  const parsedBalance = parseTokenBalance(response, creatorId);
  if (!Number.isFinite(parsedBalance)) {
    throw new Error(t('fan_booking_token_balance_failed'));
  }

  return parsedBalance;
}

function applyWalletBalance(balance, reason = 'token-balance-refresh') {
  walletBalance.value = balance;
  props.engine.setState('bookingDetails.walletBalance', balance, {
    reason,
    silent: true,
  });
}

function cancelTopUpBalanceSync() {
  topUpBalanceSyncGeneration += 1;
}

function notifyTopUpBalanceChanged() {
  if (hasNotifiedTopUpBalanceChange) return;
  hasNotifiedTopUpBalanceChange = true;
  emit('balance-changed', { reason: 'top-up' });
}

async function waitForTopUpBalance(requiredBalance) {
  const generation = ++topUpBalanceSyncGeneration;
  isCheckingBalance.value = true;
  balanceCheckError.value = '';

  try {
    for (let attempt = 0; attempt < TOP_UP_BALANCE_SYNC_MAX_ATTEMPTS; attempt += 1) {
      if (generation !== topUpBalanceSyncGeneration) return { status: 'cancelled' };

      try {
        const authoritativeBalance = await fetchAuthoritativeWalletBalance();
        logFanBookingDebug('step3', 'top-up-balance-sync:reading', `Fan ${resolveFanId()}: ${authoritativeBalance} / ${requiredBalance}`);
        if (generation !== topUpBalanceSyncGeneration) return { status: 'cancelled' };

        if (authoritativeBalance >= requiredBalance) {
          applyWalletBalance(authoritativeBalance, 'top-up-balance-synced');
          hasCheckedBalance.value = true;
          pendingTopUpExpectedBalance.value = null;
          return { status: 'ready', balance: authoritativeBalance };
        }
      } catch (error) {
        balanceCheckError.value = error?.message || t('fan_booking_check_token_balance_failed');
        logFanBookingDebug('step3', 'top-up-balance-sync:attempt-error', {
          attempt: attempt + 1,
          message: balanceCheckError.value,
        });
      }

      if (attempt < TOP_UP_BALANCE_SYNC_MAX_ATTEMPTS - 1) {
        await new Promise((resolve) => setTimeout(resolve, TOP_UP_BALANCE_SYNC_INTERVAL_MS));
      }
    }

    return { status: 'timeout' };
  } finally {
    if (generation === topUpBalanceSyncGeneration) isCheckingBalance.value = false;
  }
}

function showTopUpBalanceSyncDelayed() {
  showToast({
    type: 'warning',
    title: t('fan_booking_top_up_sync_delayed_title'),
    message: t('fan_booking_top_up_sync_delayed_message'),
  });
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
    const parsedBalance = await fetchAuthoritativeWalletBalance();
    applyWalletBalance(parsedBalance);
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

async function refreshPrerequisiteEligibility({ silent = false } = {}) {
  if (!hasProductPrerequisite.value) {
    const tokenPricing = prerequisiteValidation.value?.token_pricing;
    prerequisiteValidation.value = { prerequisite: null, must_own_products_ok: true, token_pricing: tokenPricing };
    prerequisiteError.value = '';
    // The same public presentation response supplies the highest token rate
    // for ungated bookings too. Pricing failure must not block such a booking.
    if (!tokenPricing) {
      try {
        const presentation = await fetchBookingPrerequisiteEligibility(resolveFanId(), []);
        prerequisiteValidation.value = { ...prerequisiteValidation.value, token_pricing: presentation?.token_pricing };
      } catch (_) { /* Keep the existing fallback while pricing is unavailable. */ }
    }
    return prerequisiteValidation.value;
  }

  const fanId = resolveFanId();
  isCheckingPrerequisite.value = true;
  prerequisiteError.value = '';
  try {
    const payload = await fetchBookingPrerequisiteEligibility(fanId, requiredProducts.value);

    prerequisiteValidation.value = payload;
    props.engine.setState('fanBooking.prerequisite.validation', payload, {
      reason: 'prerequisite-validation',
      silent: true,
    });
    props.engine.setState('fanBooking.prerequisite.eventId', selectedEvent.value?.eventId || selectedEvent.value?.id, {
      reason: 'prerequisite-validation',
      silent: true,
    });
    return payload;
  } catch (error) {
    prerequisiteError.value = error?.message || t('fan_booking_prerequisite_check_failed');
    if (!silent) {
      showToast({
        type: 'error',
        title: t('fan_booking_prerequisite_check_failed_title'),
        message: prerequisiteError.value,
      });
    }
    return null;
  } finally {
    isCheckingPrerequisite.value = false;
  }
}

async function purchaseMissingPrerequisite() {
  const validation = await refreshPrerequisiteEligibility();
  const detail = validation?.prerequisite;
  if (!detail) return { ok: false };
  if (detail.eligible === true) return { ok: true, toppedUp: false };
  const tierId = Number(detail?.product?.id || detail?.checkout?.variation_id || detail?.id || 0);
  const parentUserData = resolveParentUserData() || {};
  const uid = window?.userData?.UID || parentUserData.UID || '';
  if (detail.type !== 'subscription' || Number(detail.product?.price || 0) > 0 || !tierId || !uid) {
    showToast({
      type: 'error',
      title: t('fan_booking_prerequisite_checkout_failed_title'),
      message: t('fan_booking_prerequisite_checkout_unavailable'),
    });
    return { ok: false };
  }

  if (requiresTemporaryHold.value) {
    const holdOk = await ensureTemporaryHold();
    if (!holdOk) {
      showToast({
        type: 'error',
        title: t('fan_booking_could_not_hold_slot_title'),
        message: holdError.value || t('fan_booking_reserve_slot_failed'),
      });
      return { ok: false };
    }
  }

  isPrerequisiteCheckoutOpen.value = true;
  try {
    const requestId = window?.crypto?.randomUUID?.()
      || `booking-free-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const response = await fetch('/wp-json/api/subscriptions/free', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        uid,
        tier_id: tierId,
        idempotency_key: requestId,
      }),
    });
    const checkoutResult = await response.json().catch(() => ({}));

    if (!response.ok || checkoutResult?.success !== true) {
      throw new Error(checkoutResult?.message || t('fan_booking_prerequisite_checkout_failed'));
    }

    props.engine.setState('fanBooking.prerequisite.purchaseResult', {
      status: 'paid',
      orderId: checkoutResult?.order_id || null,
      subscriptionId: checkoutResult?.subscription_id || null,
      action: checkoutResult?.action || 'free_subscription',
      payment: checkoutResult,
    }, {
      reason: 'prerequisite-checkout-completed',
      silent: true,
    });

    const refreshed = await refreshPrerequisiteEligibility();
    if (refreshed?.prerequisite?.eligible !== true) {
      showToast({
        type: 'warning',
        title: t('fan_booking_prerequisite_sync_delayed_title'),
        message: t('fan_booking_prerequisite_sync_delayed_message'),
      });
      return { ok: false };
    }

    return { ok: true, toppedUp: false };
  } catch (error) {
    showToast({
      type: 'error',
      title: t('fan_booking_prerequisite_checkout_failed_title'),
      message: error?.message || t('fan_booking_prerequisite_checkout_failed'),
    });
    return { ok: false };
  } finally {
    isPrerequisiteCheckoutOpen.value = false;
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
    if (isTopUpDone && requiresTemporaryHold.value) {
      const holdOk = await ensureTemporaryHold();
      if (!holdOk) {
        showToast({
          type: 'error',
          title: t('fan_booking_could_not_hold_slot_title'),
          message: holdError.value || t('fan_booking_hold_expired_reserve_again'),
        });
        await props.engine.forceSubstep(null, { intent: 'topup-hold-revalidation-failed' });
        props.engine.goToStep(2);
        return;
      }
    }

    const preflight = preflightBookingPayload();
    if (!preflight.ok) {
      logFanBookingDebug('step3', 'booking-preflight:failed', preflight.missingFields.join(', '));
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
      logFanBookingDebug('step3', 'create-booking:failed', failureMessage);
      emit('booking-failed', {
        type: 'create-booking',
        result,
        message: failureMessage,
      });
      if (!result?.meta?.backendJwtErrorPresented) {
        showToast({
          type: 'error',
          title: t('fan_booking_booking_failed_title'),
          message: failureMessage,
        });
      }
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
      : (walletBalance.value - maximumHeldAmount.value);
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
  const currentHoldId = props.engine.getState('fanBooking.temporaryHold.temporaryHoldId');
  if (currentHoldId) {
    await releaseTemporaryHoldForRepair(currentHoldId);
  }
  await props.engine.forceSubstep(null, { intent: 'change-schedule' });
  props.engine.goToStep(2);
};

const handleBack = async () => {
  if (isSubmitting.value || isCheckingBalance.value || holdLoading.value) return;
  if (paymentSubstep.value === PAYMENT_SUBSTEP_TOPUP) {
    await goBackToPaymentSummary();
    return;
  }
  const currentHoldId = props.engine.getState('fanBooking.temporaryHold.temporaryHoldId');
  if (currentHoldId) {
    await releaseTemporaryHoldForRepair(currentHoldId);
  }
  await props.engine.forceSubstep(null, { intent: 'back' });
  props.engine.goToStep(2);
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

  if (props.groupReview) await props.engine.goToStep(3);
  await props.engine.forceSubstep(PAYMENT_SUBSTEP_TOPUP, { intent: 'topup-needed' });
  return true;
};

function validateBeforeTopUpSubmit() {
  if (isSubmitting.value || hasBookingCreated.value || contributionInvalid.value) return false;
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
  if (isGroupEvent.value) {
    await props.engine.forceSubstep(null, { intent: 'group-payment-back' });
    await props.engine.goToStep(2);
    return;
  }
  await props.engine.forceSubstep(PAYMENT_SUBSTEP_SUMMARY, { intent: 'topup-back' });
};

const onTopUpPaymentFailed = () => {
  if (!hasProductPrerequisite.value && !isGroupEvent.value) {
    props.engine.forceSubstep(PAYMENT_SUBSTEP_SUMMARY, { intent: 'topup-payment-failed' });
  }
};

const onPrerequisitePaymentSuccess = async (payload = {}) => {
  const authApplied = await applyAuthenticatedFanContext(payload, { refreshBalance: false });
  if (!authApplied || !getBackendJwtToken()) {
    showToast({
      type: 'error',
      title: t('fan_booking_account_verification_needed_title'),
      message: t('fan_booking_account_verification_needed_message'),
    });
    return false;
  }

  props.engine.setState('fanBooking.prerequisite.purchaseResult', {
    status: 'paid',
    orderId: payload?.order_id || payload?.orderId || payload?.response?.order_id || null,
    orderReceiptUrl: payload?.receipt_url || payload?.response?.order_received_url || '',
    payment: payload?.response || payload,
  }, {
    reason: 'prerequisite-checkout-completed',
    silent: true,
  });

  const refreshed = await refreshPrerequisiteEligibility();
  if (refreshed?.prerequisite?.eligible === true) return true;

  showToast({
    type: 'warning',
    title: t('fan_booking_prerequisite_sync_delayed_title'),
    message: t('fan_booking_prerequisite_sync_delayed_message'),
  });
  return false;
};

const onTopUpPaymentSuccess = async (payload = {}) => {
  const authApplied = await applyAuthenticatedFanContext(payload, { refreshBalance: false });
  if (!authApplied || !getBackendJwtToken()) {
    showToast({
      type: 'error',
      title: t('fan_booking_account_verification_needed_title'),
      message: t('fan_booking_account_verification_needed_message'),
    });
    topUpFormRef.value?.setProcessingPayment?.(false);
    return;
  }

  if (hasProductPrerequisite.value && !prerequisiteEligible.value) {
    props.engine.setState('fanBooking.prerequisite.purchaseResult', {
      status: 'paid',
      orderId: payload?.order_id || payload?.orderId || null,
      orderReceiptUrl: payload?.order_received_url || payload?.receipt_url || '',
      payment: payload,
    }, {
      reason: 'prerequisite-checkout-completed',
      silent: true,
    });

    const refreshed = await refreshPrerequisiteEligibility();
    if (refreshed?.prerequisite?.eligible !== true) {
      showToast({
        type: 'warning',
        title: t('fan_booking_prerequisite_sync_delayed_title'),
        message: t('fan_booking_prerequisite_sync_delayed_message'),
      });
      topUpFormRef.value?.setProcessingPayment?.(false);
      return;
    }
  }

  const paidTopUpAmount = topUpAmount.value;
  const toppedUpBalance = walletBalance.value + paidTopUpAmount;
  hasNotifiedTopUpBalanceChange = false;
  pendingTopUpExpectedBalance.value = toppedUpBalance;
  applyWalletBalance(toppedUpBalance, 'top-up-preview');
  hasCheckedBalance.value = true;
  try {
    const syncResult = paidTopUpAmount > 0
      ? await waitForTopUpBalance(maximumHeldAmount.value)
      : { status: 'ready', balance: walletBalance.value };
    if (syncResult.status === 'cancelled') return;
    if (syncResult.status !== 'ready') {
      await props.engine.forceSubstep(PAYMENT_SUBSTEP_SUMMARY, { intent: 'topup-balance-sync-delayed' });
      showTopUpBalanceSyncDelayed();
      return;
    }

    if (paidTopUpAmount > 0) notifyTopUpBalanceChanged();
    await finalizeBooking({
      isTopUpDone: paidTopUpAmount > 0,
      nextWalletBalance: syncResult.balance - maximumHeldAmount.value,
    });
  } finally {
    topUpFormRef.value?.setProcessingPayment?.(false);
  }
};

const onTopUpAuthUpdated = async (payload = {}) => {
  if (payload.userId === 0) {
    // A fan-owned reservation cannot be converted by the next guest account.
    // Release it while the old backend identity is still available, then
    // reserve the same selection through the existing guest hold path.
    const previousHoldId = props.engine.getState('fanBooking.temporaryHold.temporaryHoldId');
    const previousHoldReleased = !previousHoldId || await releaseTemporaryHoldForRepair(previousHoldId);
    syncCheckoutAccountPresentation(payload);
    if (window.userData) window.userData = { ...window.userData, userID: 0, UID: '', jwtToken: '' };
    setBackendJwtToken('');
    props.engine.setState('userId', 0, { reason: 'checkout-logout', silent: true });
    props.engine.setState('fanId', 0, { reason: 'checkout-logout', silent: true });
    props.engine.setState('fanBooking.context.fanId', 0, { reason: 'checkout-logout', silent: true });
    props.engine.setState('fanBooking.prerequisite.purchaseResult', null, { reason: 'checkout-logout', silent: true });
    hasCheckedBalance.value = false;
    await refreshWalletBalance({ silent: true });
    if (!previousHoldReleased || !await ensureTemporaryHold()) {
      throw new Error(holdError.value || t('fan_booking_hold_release_failed_message'));
    }
    return (await refreshPrerequisiteEligibility())?.prerequisite || null;
  }
  const authenticated = await applyAuthenticatedFanContext(payload, { refreshBalance: true });
  if (!authenticated || !getBackendJwtToken()) return null;
  return (await refreshPrerequisiteEligibility())?.prerequisite || null;
};

const activateFreeCheckoutPrerequisite = async () => {
  const result = await purchaseMissingPrerequisite();
  if (!result.ok) throw new Error(t('fan_booking_prerequisite_check_failed'));
  return (await refreshPrerequisiteEligibility())?.prerequisite || null;
};

// --- BUTTON HANDLERS ---
const continueBookingAction = async () => {
  if (isSubmitting.value || isCheckingBalance.value || isCheckingPrerequisite.value || isPrerequisiteCheckoutOpen.value) return;

  try {
    if (pendingTopUpExpectedBalance.value != null) {
      const syncResult = await waitForTopUpBalance(maximumHeldAmount.value);
      if (syncResult.status === 'cancelled') return;
      if (syncResult.status !== 'ready') {
        showTopUpBalanceSyncDelayed();
        return;
      }
      notifyTopUpBalanceChanged();
      await finalizeBooking({
        isTopUpDone: true,
        nextWalletBalance: syncResult.balance - maximumHeldAmount.value,
      });
      return;
    }

    if (!hasCheckedBalance.value) {
      const ok = await refreshWalletBalance();
      if (!ok) return;
    }

    if (hasProductPrerequisite.value && !prerequisiteEligible.value) {
      const validation = await refreshPrerequisiteEligibility();
      const detail = validation?.prerequisite;
      if (!detail) return;
      if (detail.eligible === true) {
        if (isTopUpNeeded.value) await enterTopUpSubstep();
        else await finalizeBooking();
        return;
      }

      // Free subscription changes use their existing server action and do not
      // need a payment form. Every paid prerequisite stays inside Step 3.
      if (!isGuestFlow.value && detail.type === 'subscription' && detail.action !== 'switch' && Number(detail.product?.price || 0) <= 0) {
        const prerequisiteResult = await purchaseMissingPrerequisite();
        if (!prerequisiteResult.ok) return;
        if (isTopUpNeeded.value) await enterTopUpSubstep();
        else await finalizeBooking();
        return;
      }

      await enterTopUpSubstep();
      return;
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

  if (isSubmitting.value || isCheckingBalance.value || isCheckingPrerequisite.value || isPrerequisiteCheckoutOpen.value) return;
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

  if (props.groupReview && (!props.prepareGroupBooking || !(await props.prepareGroupBooking()))) return;

  if (!isGroupEvent.value) {
    isAttendancePolicyPopupOpen.value = true;
    return;
  }

  await continueBookingAction();
};

const confirmAttendancePolicy = async () => {
  if (isResumingAttendancePolicyAction.value) return;

  isResumingAttendancePolicyAction.value = true;
  hasAcceptedAttendancePolicy.value = true;
  isAttendancePolicyPopupOpen.value = false;

  try {
    await continueBookingAction();
  } finally {
    isResumingAttendancePolicyAction.value = false;
  }
};

const actionLabel = computed(() => {
  if (isCheckingPrerequisite.value) return t('fan_booking_checking_prerequisite');
  if (isPrerequisiteCheckoutOpen.value) return t('fan_booking_processing');
  if (isCheckingBalance.value) return t('fan_booking_checking_balance');
  if (!hasCheckedBalance.value) return t('fan_booking_check_balance');
  if (hasProductPrerequisite.value && !prerequisiteEligible.value) return t('fan_booking_pay_and_complete_booking');
  return isTopUpNeeded.value ? t('fan_booking_top_up_and_pay') : t('common_complete_booking');
});

const actionButtonClass = computed(() => {
  if (isCheckingBalance.value || isCheckingPrerequisite.value || isPrerequisiteCheckoutOpen.value || !hasCheckedBalance.value || contributionInvalid.value || props.groupActionDisabled) {
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

  if (!props.groupReview && !props.engine.substep) {
    props.engine.forceSubstep(PAYMENT_SUBSTEP_SUMMARY, { intent: 'step3-default' });
  }

  scheduleTopUpPrefetch('step3-mounted');
  void refreshBalanceCardAvatar();
  acceptInviteForAuthenticatedFan({ silent: true });
  refreshWalletBalance();
  refreshPrerequisiteEligibility({ silent: true });
});

watch(
  () => selectedEvent.value?.eventId,
  () => {
    if (!selectedEvent.value) return;
    refreshWalletBalance({ silent: true });
    refreshPrerequisiteEligibility({ silent: true });
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
    if (created) {
      cancelTopUpBalanceSync();
      pendingTopUpExpectedBalance.value = null;
      clearHoldTimer();
    }
  },
);

onBeforeUnmount(() => {
  logFanBookingDebug('step3', 'before-unmount');
  cancelTopUpBalanceSync();
  balanceCardAvatarAbortController?.abort();
  balanceCardAvatarAbortController = null;
  clearHoldTimer();
});
</script>

<template>
    <div
      :class="groupReview ? 'w-full' : 'relative lg:rounded-[20px] w-full h-full md:h-dvh lg:h-auto overflow-hidden'"
      :style="groupReview ? undefined : popupBackgroundStyle"
    >
    <div v-if="!groupReview" class="absolute top-0 left-0 w-full h-full bg-[linear-gradient(0deg,rgba(12,17,29,0.5)_0%,rgba(12,17,29,0.5)_100%)]"></div>
      <div :class="groupReview ? '' : ['h-full md:h-dvh lg:h-full lg:rounded-[20px] md:px-0 md:bg-black md:py-0 lg:p-0 lg:bg-transparent', !embedded && 'md:bg-black']">
      <div :class="groupReview ? '' : 'md:rounded-bl-[20px] md:rounded-br-[0px] h-dvh md:h-full lg:overflow-visible lg:h-full md:rounded-t-[20px] flex flex-col md:flex-row md:backdrop-blur-[5px] bg-[#0C111D]/50 overflow-y-auto md:overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-order-style:none] [scrollbar-width:none]'">

            <OneOnOneBookingFlowLeftSideBar
              v-if="!groupReview"
              :time-display="formattedTime"
              :date-display="headerDateDisplay"
              :subtotal="totalPrice"
              :subtotal-display="totalPrice > 0 ? formatTokenExact(totalPrice) : '-'"
              :duration="sessionDuration"
              :selected-event="selectedEvent"
              :is-first-booking-for-creator="isFirstBookingForCreator"
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

          <div :class="groupReview ? '' : 'relative flex-1 flex w-full lg:flex-row h-auto flex-col justify-between md:min-h-0 lg:overflow-visible [&::-webkit-scrollbar]:hidden [-ms-order-style:none] [scrollbar-width:none] z-[1]'">

            <div :class="groupReview ? '' : 'flex-1 h-full flex-col px-2 pb-[5rem] lg:px-6 pt-2 lg:pt-3 lg:pb-0 gap-3 bg-[#0C111D]/50 lg:overflow-hidden h-auto md:max-h-none lg:h-[43.75rem]'">
              <template v-if="!isTopUpSubstep">
                <div :class="groupReview ? 'flex flex-col gap-8' : 'flex flex-col gap-8 pt-12 md:overflow-y-auto h-full flex-1 pb-[6.25rem] md:pb-[4.5rem] relative z-[1]'">
                  <div class="rounded-lg bg-white/10 p-3 md:p-5 hidden flex-col gap-3">
                    <div class="flex items-center justify-between gap-4">
                      <h3 class="text-sm text-[#2CE]">{{ t("fan_booking_booking_schedule") }}</h3>
                      <button
                        v-if="!isGroupEvent"
                        type="button"
                        class="px-3 py-[6px] flex items-center justify-center gap-1 rounded-3xl border border-white/50 bg-white/15"
                        @click="handleChangeSchedule"
                      >
                        <span class="text-white text-xs font-medium">{{ t("fan_booking_change_edit") }}</span>
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

                  <!-- back steps -->
                  <div v-if="!groupReview" class="flex items-center justify-between gap-4">
                    <button
                      type="button"
                      class="flex items-center justify-center gap-1 bg-transparent border-none gap-0.5"
                      @click="handleBack"
                    >
                      <img class="w-3.5 h-3.5" :src="bookingFlowBackarrowIcon" alt="">
                      <span class="text-white text-xs font-medium">{{ t("fan_booking_back") }}</span>
                    </button>
                  </div>

                  <div class="flex flex-col gap-8">
                    <div class="flex flex-col gap-4 w-full">
                      <h3 class="text-sm font-medium uppercase" :class="groupReview ? 'text-[#FB5BA2]' : 'text-[#2CE]'">{{ t(groupReview ? "fan_booking_booking_summary" : "fan_booking_payment_summary") }}</h3>
                      <div class="flex flex-col gap-4">
                        <div class="flex flex-col gap-5">
                          <div v-if="!groupReview" class="flex flex-col gap-2">
                            <h4 class="text-sm font-medium text-white">{{ t("fan_booking_session_cost") }}</h4>
                            <div class="flex flex-row justify-between items-center text-white">
                              <div class="flex items-center gap-0.5">
                                <img :src="bookingFlowTokenIcon" alt="token-icon" class="w-4 h-4" />
                                <p class="text-sm font-normal text-[#EAECF0]">{{ sessionBreakdownLabel }}</p>
                              </div>
                              <div class="flex justify-center items-center gap-0.5">
                                <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                                <p class="text-sm font-medium text-white">{{ formatTokenExact(sessionCost) }}</p>
                              </div>
                            </div>
                          </div>
                          

                          <div v-if="selectedAddons.length > 0" class="flex flex-col gap-2">
                            <h4 class="text-sm font-medium text-white">{{ t("fan_booking_add_on_service_heading") }}</h4>
                            <div
                              v-for="(addon, index) in selectedAddons"
                              :key="addon.id || index"
                              class="flex flex-row justify-between items-center text-white"
                              data-testid="booking-flow-summary-addon"
                              :data-addon-kind="addon.kind"
                            >
                              <p class="text-sm font-normal text-[#EAECF0]">{{ addon.name }}</p>
                              <div class="flex justify-center items-center gap-0.5">
                                <p class="text-sm text-white font-normal">+</p>
                                <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                                <p class="text-sm text-white font-normal">{{ formatTokenExact(addon.price) }}</p>
                              </div>
                            </div>
                          </div>

                          <div v-if="false && bookingFeeAmount > 0" class="flex flex-col gap-2">
                            <h4 class="text-sm font-medium text-white">{{ t("fan_booking_booking_fee_heading") }}</h4>
                            <div class="flex flex-row justify-between items-center text-white">
                              <p class="text-base font-normal text-[#EAECF0]">{{ t("fan_booking_booking_fee") }}</p>
                              <div class="flex justify-center items-center gap-0.5">
                                <p class="text-base text-white font-normal">+</p>
                                <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                                <p class="text-base text-white font-normal">{{ formatTokenExact(bookingFeeAmount) }}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div v-if="discountLines.length > 0" class="flex flex-col gap-2 border-t border-[#98A2B3]/50 pt-2">
                            <div class="flex gap-2 items-center">
                              <h4 class="text-sm font-medium text-white">{{ t("fan_booking_discount_heading") }}</h4>
                              <TooltipIcon 
                              class="!w-4 !h-4 relative hidden"
                              :text="t('fan_booking_discount_tooltip')" side="right" />
                            </div>
                            <div
                              v-for="row in discountLines"
                              :key="row.code"
                              class="flex flex-row justify-between items-center text-white"
                            >
                              <p class="text-sm font-normal text-[#07F468]">{{ row.label }}</p>
                              <div class="flex justify-center items-center gap-1 py-1 px-2 bg-[#07F468] rounded-[20px] h-6">
                                <p class="text-sm text-[#0C111D] font-medium">-</p>
                                <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                                <p class="text-sm text-[#0C111D] font-semibold">{{ formatTokenExact(row.amount) }}</p>
                              </div>
                            </div>
                          </div>

                          <div v-if="offHourSurchargeAmount > 0" class="flex flex-col gap-2">
                            <h4 class="text-sm font-medium text-white">{{ t("fan_booking_off_hour_surcharge_heading") }}</h4>
                            <div class="flex flex-row justify-between items-center text-white">
                              <p class="text-base font-normal text-[#EAECF0]">{{ offHourSurchargeLabel }}</p>
                              <div class="flex justify-center items-center gap-0.5">
                                <p class="text-base text-white font-normal">+</p>
                                <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                                <p class="text-base text-white font-normal">{{ formatTokenExact(offHourSurchargeAmount) }}</p>
                              </div>
                            </div>
                          </div>

                          <div v-if="bookingFeeAmount > 0" class="hidden flex-col gap-2">
                            <div class="_flex hidden gap-2 items-center">
                              <h4 class="text-xs font-normal text-[#98A2B3] flex items-center gap-1">{{ t("fan_booking_conditionally_refundable") }}</h4>
                              <TooltipIcon 
                                tooltipClass="!max-w-[14rem] md:!max-w-[16rem]"
                                class="!w-4 !h-4 relative !mt-0"
                                :text="t('fan_booking_extra_fee_tooltip')" side="right" />
                            </div>
                            <div class="hidden flex-row justify-between items-center text-white">
                              <div class="flex items-center">
                                <img :src="bookingFlowTokenIcon" alt="token-icon" class="w-4 h-4" />
                                <p class="text-base font-normal text-[#EAECF0]">{{ formatTokenExact(bookingFeeAmount) }} {{ t("fan_booking_booking_fee_included") }}</p>
                              </div>
                              <div class="flex justify-center items-center gap-0.5">
                                <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                                <p class="text-base text-white font-normal">{{ formatTokenExact(bookingFeeAmount) }}</p>
                              </div>
                            </div>
                          </div>

                          <div v-if="!isGroupEvent" class="flex flex-col gap-1 border-t border-[#98A2B3]/50 pt-2" data-testid="booking-session-total">
                            <div class="flex justify-between items-center">
                              <div class="flex flex-col gap-1">
                                <h4 class="text-sm font-semibold text-white">{{ t(groupReview ? "fan_booking_event_total" : "fan_booking_session_total") }}</h4>
                              </div>
                              <div class="flex flex-col">
                                <div class="flex justify-end items-center gap-0.5">
                                  <p v-if="!groupReview" class="text-base text-white font-normal">≈</p>
                                  <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                                  <p class="text-base font-semibold text-white">{{ formatTokenExact(sessionTotalTokens) }}</p>
                                </div>
                                <span v-if="!groupReview" class="dn text-xs font-medium text-[#98A2B3] whitespace-nowrap">={{ sessionTotalUsdDisplay }}</span>
                                <span v-else class="text-xs font-medium text-right max-w-[6.68rem]" :class="isTopUpNeeded ? 'text-[#FCE40D]' : 'text-[#07F468]'">{{ t(isTopUpNeeded ? 'common_top_up_needed' : 'fan_booking_pay_with_wallet_balance') }}</span>
                              </div>
                            </div>
                            <div v-if="bookingFeeAmount > 0" class="w-full text-sm text-[#FCE40D] flex items-center gap-2 justify-between">
                              <div class="flex items-center gap-[2px]">
                                <span class="whitespace-nowrap dn">{{ t("fan_booking_non_refundable") }}</span>
                                <span class="flex items-center gap-[2px]">
                                  <img :src="bookingFlowTokenIcon" alt="token-icon" class="w-4 h-4" />
                                  <span class="font-semibold">{{ formatTokenExact(bookingFeeAmount) }}</span>
                                </span>
                                <span class="whitespace-nowrap">{{ t("fan_booking_booking_fee_included") }}</span>
                              </div>
                            </div>
                          </div>

                          <!-- Mandatory purchase -->
                          <div
                            v-if="prerequisiteDetail?.product && !prerequisiteDetail?.eligible"
                            class="flex flex-col gap-2 border-t border-[#98A2B3]/50 pt-2"
                            data-testid="booking-mandatory-purchase"
                          >
                            <div class="flex gap-2 items-center">
                              <h4 class="text-sm font-medium text-white">{{ t(isSubscriptionPrerequisite ? 'fan_booking_mandatory_subscription' : 'fan_booking_mandatory_purchase') }}</h4>
                              <TooltipIcon 
                              class="!w-[10px] !h-[10px] relative !mt-0 tooltip-blue-icon"
                              :text="t('fan_booking_mandatory_purchase_help')" side="right" />
                            </div>
                            <!-- Content -->
                            <div class="flex items-center gap-2">
                              <div class="w-[2.625rem] h-[2.625rem] rounded-[4px] overflow-hidden">
                                <img :src="prerequisiteDetail.product.image_url" :alt="prerequisiteProductTitle" class="w-full h-full object-cover" />
                              </div>
                              <div class="flex-1 flex flex-col gap-1">
                                <div class="flex items-center justify-between">
                                  <span class="text-sm font-semibold text-white">{{ prerequisiteProductTitle }}</span>
                                  <span class="text-sm font-semibold text-white text-right" data-testid="booking-prerequisite-price">USD${{ usdFormatter.format(getBookingPrerequisitePrice(prerequisiteDetail)) }}</span>
                                </div>
                                <p v-if="prerequisiteDetail.action === 'switch'" class="text-xs text-[#FCE40D] text-right" data-testid="booking-recurring-plan-price">{{ t('fan_booking_recurring_plan_price', { amount: usdFormatter.format(Number(prerequisiteDetail.product.price || 0)) }) }}</p>
                                <div v-if="prerequisiteDetail.shipping?.required" class="flex items-center justify-between">
                                  <div class="flex items-center gap-1">
                                    <span><img :src="bookingFlowTruckIcon" alt=""></span>
                                    <span class="text-xs text-[#FCE40D]" data-testid="booking-merch-shipping-destination">
                                      <template v-if="prerequisiteDetail.shipping.is_merch && prerequisiteDetail.shipping.international">{{ t('fan_booking_ships_internationally') }}</template>
                                      <template v-else>
                                        {{ t('fan_booking_ships_to') }}
                                        <span class="underline">{{ prerequisiteDetail.shipping.country || t('fan_booking_checkout_address') }}</span>
                                        <template v-if="prerequisiteDetail.shipping.is_merch && prerequisiteDetail.shipping.international === false">{{ ' ' + t('fan_booking_shipping_only') }}</template>
                                      </template>
                                    </span>
                                  </div>
                                  <span class="text-sm text-[#FCE40D] text-right" data-testid="booking-merch-shipping-cost">{{ prerequisiteShippingCostLabel }}</span>
                                </div>
                              </div>
                            </div>
                            <!-- /Content -->
                          </div>
                          <!-- /Mandatory purchase -->
                        </div>

                        <div v-if="false && cancellationReserveAmount > 0" class="flex flex-row justify-between items-start text-white border-t border-[#98A2B3]/50 pt-2">
                          <div>
                            <p class="text-base font-semibold">{{ t("fan_booking_cancellation_fee_included") }}</p>
                            <p class="text-xs text-[#98A2B3]">{{ t("fan_booking_cancellation_allocation_help") }}</p>
                          </div>
                          <p class="text-base font-semibold">{{ formatTokenExact(cancellationReserveAmount) }}</p>
                        </div>

                        <div data-testid="booking-amount-due-today" class="flex flex-row justify-between items-start gap-2 text-white border-t border-[#98A2B3]/50 pt-2">
                          <p class="text-lg leading-7 font-bold text-white uppercase">{{ t("fan_booking_amount_due_today") }}</p>
                          <div class="flex flex-1 min-w-0 flex-col items-end gap-0.5">
                            <div class="flex flex-wrap justify-end items-center gap-0.5 text-lg leading-7 font-semibold">
                              <div class="flex items-center gap-0.5 whitespace-nowrap">
                                <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                                <p>{{ formatTokenExact(totalPrice) }}</p>
                              </div>
                              <template v-if="prerequisiteDetail?.product && !prerequisiteDetail?.eligible">
                                <span>+</span>
                                <p class="whitespace-nowrap">USD${{ usdFormatter.format(prerequisiteAmountUsd) }}</p>
                              </template>
                            </div>
                            <span data-testid="booking-amount-due-usd" class="text-sm leading-5 font-normal text-[#FCE40D] whitespace-nowrap">={{ amountDueUsdDisplay }}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p v-if="groupReview" class="text-sm italic text-[#EAECF0]">{{ t('fan_booking_session_fee_hold_notice') }}<template v-if="bookingFeeAmount > 0"> {{ t('fan_booking_non_refundable_booking_fee_applied', { tokens: formatTokenExact(bookingFeeAmount) }) }}</template></p>

                    <!-- Wallet Balance Card -->
                    <div
                      v-if="showAvatarBalanceCard"
                      class="text-white rounded-lg overflow-hidden"
                      :style="balanceCardStyle"
                      data-testid="booking-balance-avatar-card"
                    >
                      <div class="flex flex-col gap-3 p-4 rounded-lg overflow-hidden" style="background: linear-gradient(0deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.5) 100%); backdrop-filter: blur(5px);">

                        <div class="flex justify-between items-center">
                          <div class="flex items-center gap-2"><p class="text-sm font-medium leading-5" :class="isTopUpNeeded ? 'text-[#FCE40D]' : 'text-white'">{{ t("common_wallet_balance") }}</p></div>
                          <div class="flex justify-center items-center gap-0.5">

                            <div v-if="isTopUpNeeded" class="flex items-center justify-center gap-2 px-1 py-0 h-[1.25rem] rounded-[6px] bg-[#FCE40D]">
                                <span class="text-[#0C111D] text-[11px] font-semibold leading-[10px] relative top-[-2px]">...</span>
                                <p class="text-[11px] font-semibold text-[#0C111D] leading-[14px] italic tracking-wider">{{ t("common_top_up_needed") }}</p>
                                <div class="w-3 h-3 hidden justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                                <p class="text-[11px] hidden font-semibold text-[#0C111D] leading-[14px]">{{ formatTokenExact(topUpAmount) }}</p>
                            </div>

                            <div class="flex items-center justify-center gap-[2px]">
                              <div class="w-6 h-6 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                            <p class="text-base font-semibold" :class="isTopUpNeeded ? 'text-[#FCE40D]' : 'text-white'">{{ formatTokenExact(walletBalance) }}</p>
                            </div>
                          </div>
                        </div>

                        <div class="flex justify-between items-center" data-testid="booking-balance-subtotal">
                          <div class="flex items-center gap-2"><p class="text-sm font-medium leading-5 text-white">{{ t("booking_adjustment_subtotal") }}</p></div>
                          <div class="flex justify-center items-center gap-0.5">
                            <span class="text-lg font-semibold">-</span>
                            <div class="w-6 h-6 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                            <p class="text-base font-semibold text-white">{{ formatTokenExact(totalPrice) }}</p>
                          </div>
                        </div>

                        <!-- Available Balance after booking  -->
                        <div v-show="!isTopUpNeeded" class="flex justify-between items-center gap-2 border-t border-[#F2F4F7]/50 pt-3" data-testid="booking-balance-available-after-booking">
                          <div class="flex items-center gap-2"><p class="text-sm font-medium leading-5 text-white">{{ t("fan_booking_available_balance_after_booking") }}</p></div>
                          <div class="flex justify-center items-center gap-0.5">
                            <div class="w-6 h-6 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                            <p class="text-base font-semibold text-white">{{ formatTokenExact(remainingBalance) }}</p>
                          </div>
                        </div>
                        <!-- /Available Balance after booking  -->
                      </div>
                    </div>
                    <div
                      v-else
                      class="text-white rounded-lg overflow-hidden bg-[#182230] bg-[linear-gradient(90deg,rgba(16,24,40,0)_25%,rgba(16,24,40,0.9)_75%),#182230] shadow-[0_4px_8px_0_rgba(255,255,255,0.05)]"
                      data-testid="booking-balance-placeholder-card"
                    >
                      <div class="w-full relative bg-[rgba(24,34,48,0.10)]">
                        <div class="absolute right-3 top-1 z-1">
                          <svg xmlns="http://www.w3.org/2000/svg" width="108" height="96" viewBox="0 0 108 96" fill="none">
                            <path opacity="0.5" fill-rule="evenodd" clip-rule="evenodd" d="M9.28238 109.169L59.863 126.695C69.8881 130.173 79.8979 121.473 77.8907 111.076L73.0552 85.9181C71.5558 78.1298 77.13 70.8493 84.2 67.2442C93.7181 62.4149 101.459 54.0083 105.232 43.1126C112.981 20.7197 101.137 -3.66815 78.772 -11.4098C56.4068 -19.1514 31.986 -7.31763 24.2447 15.0445C20.3846 26.1794 21.3993 37.8078 26.1288 47.6259C29.5935 54.8898 29.5643 64.2732 23.4795 69.5272L4.76721 85.7353C-3.25772 92.685 -0.74977 105.722 9.28238 109.169Z" fill="#344054"/>
                          </svg>
                        </div>
                        <div class="flex flex-col gap-3 p-4 relative z-2">
                          <div class="flex justify-between items-center">
                            <div class="flex items-center gap-2"><p class="text-sm font-medium leading-5" :class="isTopUpNeeded ? 'text-[#FCE40D]' : 'text-white'">{{ t("common_wallet_balance") }}</p></div>
                            <div class="flex justify-center items-center gap-0.5">
                              <div v-if="isTopUpNeeded" class="flex items-center justify-center gap-2 px-1 py-0 h-[1.25rem] rounded-[6px] bg-[#FCE40D]">
                                <span class="text-[#0C111D] text-[11px] font-semibold leading-[10px] relative top-[-2px]">...</span>
                                <p class="text-[11px] font-semibold text-[#0C111D] leading-[14px] italic tracking-wider">{{ t("common_top_up_needed") }}</p>
                                <div class="w-3 h-3 hidden justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                                <p class="text-[11px] hidden font-semibold text-[#0C111D] leading-[14px]">{{ formatTokenExact(topUpAmount) }}</p>
                              </div>
                              <div class="flex items-center justify-center gap-[2px]">
                                <div class="w-6 h-6 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                                <p class="text-base font-semibold" :class="isTopUpNeeded ? 'text-[#FCE40D]' : 'text-white'">{{ formatTokenExact(walletBalance) }}</p>
                              </div>
                            </div>
                          </div>
                          <div class="flex justify-between items-center" data-testid="booking-balance-subtotal">
                            <p class="text-sm font-medium leading-5">{{ t("booking_adjustment_subtotal") }}</p>
                            <div class="flex justify-center items-center gap-0.5">
                              <span class="text-lg font-semibold">-</span>
                              <div class="w-6 h-6 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                              <p class="text-base font-semibold">{{ formatTokenExact(totalPrice) }}</p>
                            </div>
                          </div>
                          <div v-show="!isTopUpNeeded" class="flex justify-between items-center gap-2 border-t border-[#F2F4F7]/50 pt-3" data-testid="booking-balance-available-after-booking">
                            <div class="flex items-center gap-2"><p class="text-sm font-medium leading-5">{{ t("fan_booking_available_balance_after_booking") }}</p></div>
                            <div class="flex justify-center items-center gap-0.5">
                              <div class="w-6 h-6 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                              <p class="text-base font-semibold">{{ formatTokenExact(remainingBalance) }}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <!-- /Wallet Balance Card -->

                    <p v-if="groupReview" class="text-sm italic text-[#EAECF0]">{{ t('fan_booking_policy_agreement') }}</p>

                    <div
                      v-if="!isGroupEvent"
                      class="w-full"
                      data-testid="booking-attendance-policy-agreement"
                    >
                      <CheckboxGroup
                        v-model="hasAcceptedAttendancePolicy"
                        checkboxClass="m-0 mt-[1px] self-start border border-[#98A2B3] [appearance:none] w-5 h-5 rounded-[3px] bg-transparent relative cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#22CCEE] checked:bg-[#07F468] checked:border-[#07F468] checked:[&::after]:content-[''] checked:[&::after]:absolute checked:[&::after]:left-[0.40rem] checked:[&::after]:top-[0.20rem] checked:[&::after]:w-[0.3rem] checked:[&::after]:h-[0.6rem] checked:[&::after]:border checked:[&::after]:border-solid checked:[&::after]:border-[#0C111D] checked:[&::after]:border-r-2 checked:[&::after]:border-b-2 checked:[&::after]:border-t-0 checked:[&::after]:border-l-0 checked:[&::after]:rotate-45"
                        labelClass="flex-1 min-w-0 text-sm leading-5 text-[#EAECF0]"
                        wrapperClass="items-start"
                      >
                        <template #label>
                          <span class="mb-4 block">{{ t("fan_booking_attendance_policy_acknowledgment") }}</span>
                          <ol class="list-decimal pl-5 italic">
                            <li>{{ t("fan_booking_attendance_policy_grace_period") }}</li>
                            <li>{{ t("fan_booking_attendance_policy_creator_no_show") }}</li>
                            <li>{{ t("fan_booking_attendance_policy_fan_no_show") }}</li>
                          </ol>
                        </template>
                      </CheckboxGroup>
                    </div>
                  </div>
                </div>
              </template>

              <template v-else>
                <div
                  v-if="requiresTemporaryHold"
                  class="mb-3 rounded-[8px] bg-black/40 p-3 relative z-[1]"
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
                  :creator="creatorPresentation"
                  :event-id="selectedEvent?.eventId || selectedEvent?.id || ''"
                  :prerequisite="prerequisiteDetail"
                  :confirmed-switch="engine.getState('fanBooking.prerequisite.confirmedSwitch') || ''"
                  :after-prerequisite-payment="onPrerequisitePaymentSuccess"
                  :after-auth-update="onTopUpAuthUpdated"
                  :activate-free-prerequisite="activateFreeCheckoutPrerequisite"
                  @back="goBackToPaymentSummary"
                  @auth-updated="onTopUpAuthUpdated"
                  @success="onTopUpPaymentSuccess"
                  @payment-failed="onTopUpPaymentFailed"
                />
              </template>
            </div>

          </div>


          <div :class="groupReview ? 'absolute right-0 bottom-0 z-20' : actionFooterClass">
            <button
              v-if="!isTopUpSubstep"
              type="button"
              :disabled="isCheckingBalance || isCheckingPrerequisite || isPrerequisiteCheckoutOpen || isSubmitting || contributionInvalid || groupActionDisabled"
              @click="handleButtonClick"
              data-testid="booking-complete-button"
              class="w-auto flex justify-start items-center"
              :class="(isCheckingBalance || isCheckingPrerequisite || isPrerequisiteCheckoutOpen || isSubmitting || contributionInvalid || groupActionDisabled) ? 'pointer-events-none' : 'cursor-pointer'"
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

          <ReadAndUnderstandPopup
            v-model="isAttendancePolicyPopupOpen"
            @confirm="confirmAttendancePolicy"
          />

        </div>
      </div>
    </div>

</template>
