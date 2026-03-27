<script setup>
import TopUpForm from '../HelperComponents/TopUpForm.vue';
import OneOnOneBookingFlowLeftSideBar from '../HelperComponents/OneOnOneBookingFlowLeftSideBar.vue';
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import TokenHandler from '@/utils/TokenHandler.js';
import { showToast } from '@/utils/toastBus.js';
import { mapCreateBookingToRequest } from '@/services/bookings/mappers/createBookingMapper.js';
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
import FlowHandler from '@/services/flow-system/FlowHandler'
import { useChatSocket } from '@/composables/useChatSocket';

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
});

const emit = defineEmits(['booking-created', 'booking-failed']);

// --- RETRIEVE DATA FROM ENGINE ---
const bookingData = computed(() => {
  return props.engine.getState('bookingDetails') || {};
});

const selectedEvent = computed(() => props.engine.getState('fanBooking.context.selectedEvent') || null);
const paymentSubstep = computed(() => props.engine.substep || null);
const creatorPresentation = computed(() => resolveCreatorPresentation({
  explicitCreatorData: props.engine.getState('fanBooking.context.creatorPresentation'),
  selectedEvent: selectedEvent.value,
  bookingResult: props.engine.getState('fanBooking.booking.result'),
}));

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
  backgroundImage: `url('${bookingFlowBackgroundImage}')`,
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
const mappedPayment = computed(() => {
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
const findLineAmount = (code) => {
  const line = mappedPaymentLines.value.find((row) => String(row?.code) === code);
  return Number(line?.amount || 0);
};
const sessionCost = computed(() => {
  const mappedBase = findLineAmount("base");
  if (Number.isFinite(mappedBase) && mappedBase > 0) return mappedBase;
  return Number(bookingData.value.selectedDuration?.price || 0);
});
const bookingFeeAmount = computed(() => {
  const amount = findLineAmount("booking_fee");
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
});
const discountAmount = computed(() => {
  const amount = findLineAmount("discount");
  return amount < 0 ? Math.abs(amount) : 0;
});
const offHourSurchargeAmount = computed(() => {
  const amount = findLineAmount("off_hour_surcharge");
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
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

const formattedTime = computed(() => bookingData.value.formattedTimeRange || '-');
const headerDateDisplay = computed(() => bookingData.value.headerDateDisplay || '-');
const selectedDateDisplay = computed(() => bookingData.value.selectedDateDisplay || '-');
const showApprovalNeeded = computed(() => {
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

const compactTokenFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 0,
});
const exactTokenFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
});
const usdFormatter = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatTokenCompact(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return '0';

  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';

  if (abs < 1000) {
    return `${sign}${Math.round(abs).toLocaleString('en-US')}`;
  }

  return `${sign}${compactTokenFormatter.format(abs).toUpperCase()}`;
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
  `This booking needs to be approved by ${creatorPresentation.value.name} before your session is confirmed.`
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
  const baseMinutes = Math.round(Number(baseSessionMinutes.value || 0)) || 15;
  const totalMinutes = Math.round(Number(sessionDuration.value || 0)) || baseMinutes;
  const count = Math.max(1, Number(sessionCount.value || 1));
  const sessionLabel = count === 1 ? 'session' : 'sessions';
  return `${baseMinutes} Minute x ${count} ${sessionLabel} (${totalMinutes} Min.)`;
});

const sessionTotalTokens = computed(() => Math.max(0, Number(totalPrice.value || 0)));
const sessionTotalUsdDisplay = computed(() => tokensToUsdDisplay(sessionTotalTokens.value));
const amountDueUsdDisplay = computed(() => tokensToUsdDisplay(totalPrice.value));

function extractBackendMessage(flowResult) {
  const code = flowResult?.error?.code || "";
  const details = flowResult?.error?.details || {};
  const missingFields = Array.isArray(details?.missingFields) ? details.missingFields : [];
  if (code === "CREATE_BOOKING_MISSING_REQUIRED_FIELDS" && missingFields.length > 0) {
    return `Missing required fields: ${missingFields.join(', ')}.`;
  }
  const validationMessages = details?.validation?.messages;
  if (Array.isArray(validationMessages) && validationMessages.length > 0) {
    return validationMessages.join(' ');
  }
  return flowResult?.error?.message
    || flowResult?.meta?.uiErrors?.[0]
    || 'Could not complete booking.';
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
    return false;
  }

  return fireAndForgetCreateScheduleNotify(notify.payload);
}

function fireAndForgetBookingCreated() {
  const payload = {
    creator_id: String(resolveCreatorId() ?? ""),
    event_name: selectedEvent.value?.title || selectedEvent.value?.raw?.title || "Untitled Event",
    event_type: selectedEvent.value?.type
      || selectedEvent.value?.eventType
      || selectedEvent.value?.raw?.type
      || selectedEvent.value?.raw?.eventType
      || "1on1-call",
    action: "created",
  };

  const endpoint = import.meta.env.VITE_WEB_BASE_URL + "/wp-json/api/bookings/create";

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
    const slotDate    = props.engine.getState('fanBooking.booking.lastPreflightPayload')?.startIso
      || null;

    // Step 1 — create chat
    const chatRes = await FlowHandler.run('chat.createChat', {
      type:         'direct',
      createdBy:    String(fanUserId),
      participants: [String(fanUserId), String(creatorId)],
      name:         eventTitle || 'Booking Chat',
      description:  eventTitle ? `Booking request for ${eventTitle}` : 'Booking request',
    });
    if (!chatRes?.ok) return;
    const chatId = chatRes.data?.chatId;
    if (!chatId) return;

    // Step 2 — send booking request message
    const msgRes = await FlowHandler.run('chat.sendBookingRequestMessage', {
      chatId,
      bookingId,
      action:     'pending',
      senderId:   fanUserId,
      eventId,
      eventTitle,
      slotDate,
      text: `Booking request for "${eventTitle}" ${slotDate ? `on ${slotDate}` : ''}`.trim(),
    });
    if (!msgRes?.ok) return;
    const messageId = msgRes.data?.item?.message_id || msgRes.data?.item?.id;
    if (!messageId) return;

    // Notify participants via socket so their chat lists reload (chat:message → unknown chat_id → fetchUserChats)
    const { sendChatMessage } = useChatSocket(fanUserId)
    const recipients = [parseInt(fanUserId), parseInt(creatorId)].filter(Boolean)
    sendChatMessage(msgRes.data.item, recipients)

    // Step 3 — pin the message
    await FlowHandler.run('chat.pinMessage', { chatId, messageId });
  } catch (_) {
    // Fire-and-forget — booking is already confirmed, don't surface chat errors
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
      holdError.value = 'Your slot hold expired. Please go back and reserve again.';
    }
  };

  update();
  holdTimerId = setInterval(update, 1000);
}

function getHoldStatusMessage(result) {
  return result?.error?.details?.message
    || result?.error?.details?.error
    || result?.error?.message
    || result?.meta?.uiErrors?.[0]
    || 'Could not reserve this slot.';
}

async function refreshTemporaryHoldStatus(temporaryHoldId) {
  return props.engine.callFlow('bookings.getTemporaryHoldStatus', { temporaryHoldId }, {
    context: {
      stateEngine: props.engine,
      apiBaseUrl: props.apiBaseUrl || undefined,
    },
    forceRefresh: true,
    skipDestinationRead: true,
  });
}

async function ensureTemporaryHold() {
  if (hasBookingCreated.value) return true;

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

    const latestHoldId = createResult.data?.temporaryHoldId || props.engine.getState('fanBooking.temporaryHold.temporaryHoldId');
    if (!latestHoldId) {
      holdError.value = 'Temporary hold was created but id is missing.';
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

  if (fanId == null) {
    hasCheckedBalance.value = false;
    balanceCheckError.value = 'Could not resolve user for balance check.';
    logFanBookingDebug('step3', 'refreshWalletBalance:missing-user', {
      balanceCheckError: balanceCheckError.value,
    });
    return false;
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
      throw new Error('Could not retrieve token balance.');
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
    balanceCheckError.value = error?.message || 'Could not check token balance.';
    logFanBookingDebug('step3', 'refreshWalletBalance:error', {
      message: balanceCheckError.value,
      error,
    });
    if (!silent) {
      showToast({
        type: 'error',
        title: 'Balance Check Failed',
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
      message: 'Please select an event before completing booking.',
    });
    showToast({
      type: 'error',
      title: 'Event Missing',
      message: 'Please select an event before completing booking.',
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
        message: `Missing required fields: ${preflight.missingFields.join(', ')}.`,
      });
      showToast({
        type: 'error',
        title: 'Booking Data Missing',
        message: `Missing required fields: ${preflight.missingFields.join(', ')}.`,
      });
      props.engine.setState('fanBooking.booking.lastPreflightPayload', preflight.previewPayload, { reason: 'booking-preflight', silent: true });
      return;
    }

    const result = await props.engine.callFlow('bookings.createBooking', null, {
      context: {
        stateEngine: props.engine,
        apiBaseUrl: props.apiBaseUrl || undefined,
      },
    });

    if (!result?.ok) {
      emit('booking-failed', {
        type: 'create-booking',
        result,
        message: extractBackendMessage(result),
      });
      showToast({
        type: 'error',
        title: 'Booking Failed',
        message: extractBackendMessage(result),
      });
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

    fireAndForgetCreateSchedule({ bookingId, eventId });
    fireAndForgetBookingCreated();
    fireAndForgetPostBookingChat({ bookingId, eventId });

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
        title: 'Booking Created',
        message: 'Your booking request has been submitted.',
      });
    }
  } catch (error) {
    emit('booking-failed', {
      type: 'create-booking-exception',
      error,
      message: error?.message || 'Could not complete booking.',
    });
    showToast({
      type: 'error',
      title: 'Booking Failed',
      message: error?.message || 'Could not complete booking.',
    });
    if (isTopUpDone) props.engine.forceSubstep(PAYMENT_SUBSTEP_SUMMARY, { intent: 'topup-retry' });
  } finally {
    isSubmitting.value = false;
  }
};

const handleChangeSchedule = async () => {
  if (isSubmitting.value || isCheckingBalance.value || holdLoading.value) return;
  await props.engine.forceSubstep(null, { intent: 'change-schedule' });
  props.engine.goToStep(2);
};

const enterTopUpSubstep = async () => {
  const holdOk = await ensureTemporaryHold();
  if (!holdOk) {
    showToast({
      type: 'error',
      title: 'Could Not Hold Slot',
      message: holdError.value || 'Could not reserve this slot.',
    });
    return false;
  }

  await props.engine.forceSubstep(PAYMENT_SUBSTEP_TOPUP, { intent: 'topup-needed' });
  return true;
};

function validateBeforeTopUpSubmit() {
  if (isSubmitting.value || holdLoading.value || hasBookingCreated.value) return false;
  if (!hasActiveHold.value) {
    showToast({
      type: 'error',
      title: 'Slot Hold Expired',
      message: 'Your slot hold expired. Please go back and reserve the slot again.',
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

const onTopUpPaymentSuccess = async () => {
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
      title: 'Action Failed',
      message: error?.message || 'Could not continue booking.',
    });
  }
};

const actionLabel = computed(() => {
  if (isCheckingBalance.value) return 'CHECKING BALANCE';
  if (!hasCheckedBalance.value) return 'CHECK BALANCE';
  return isTopUpNeeded.value ? 'TOP-UP AND PAY' : 'COMPLETE BOOKING';
});

const actionButtonClass = computed(() => {
  if (isCheckingBalance.value || !hasCheckedBalance.value) {
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
      title: 'Event Missing',
      message: 'Please pick an event first.',
    });
    return;
  }

  if (!props.engine.substep) {
    props.engine.forceSubstep(PAYMENT_SUBSTEP_SUMMARY, { intent: 'step3-default' });
  }

  refreshWalletBalance();
});

watch(
  () => selectedEvent.value?.eventId,
  () => {
    if (!selectedEvent.value) return;
    refreshWalletBalance({ silent: true });
  },
);

watch(
  () => isTopUpSubstep.value,
  async (isTopUp) => {
    if (!isTopUp) return;
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
      class="relative lg:rounded-[20px] w-full h-full md:h-dvh lg:h-auto lg:w-[852px] overflow-hidden"
      :style="popupBackgroundStyle"
    >
      <div class="h-full md:h-dvh lg:h-full lg:rounded-[20px] md:px-[10px] md:py-6 lg:p-0 md:bg-black lg:bg-transparent">
      <div class="md:rounded-b-[20px] h-dvh md:h-full overflow-hidden lg:overflow-visible lg:h-full md:rounded-t-[20px] flex flex-col md:flex-row backdrop-blur-[5px] bg-black/75">

            <OneOnOneBookingFlowLeftSideBar
              :time-display="formattedTime"
              :date-display="headerDateDisplay"
              :subtotal="totalPrice"
              :subtotal-display="totalPrice > 0 ? formatTokenCompact(totalPrice) : '-'"
              :duration="sessionDuration"
              :creator-avatar="creatorPresentation.avatar"
              :creator-name="creatorPresentation.name"
              :creator-is-verified="creatorPresentation.isVerified"
              :show-approval-needed="showApprovalNeeded"
            />

          <div class="flex-1 flex w-full lg:flex-row h-auto flex-col justify-between min-h-0 lg:overflow-visible [&::-webkit-scrollbar]:hidden [-ms-order-style:none] [scrollbar-width:none]">

            <div class="flex-1 h-full md:h-auto flex-col px-2 lg:px-3 pt-2 lg:pt-3 lg:pb-0 gap-3 backdrop-blur-[5px] lg:overflow-hidden">
              <template v-if="!isTopUpSubstep">
                <div class="flex flex-col gap-3 overflow-y-auto lg:overflow-visible h-full flex-1">
                  <div class="rounded-lg bg-white/10 p-5 flex flex-col gap-3">
                    <div class="flex items-center justify-between">
                      <h3 class="text-sm text-[#22CCEE] leading-[20px]">BOOKING SCHEDULE</h3>
                      <button
                        type="button"
                        class="px-3 py-[6px] flex items-center justify-center gap-1 rounded-3xl border border-white/50 bg-white/15"
                        @click="handleChangeSchedule"
                      >
                        <span class="text-white text-xs font-medium leading-4">Change Schedule</span>
                      </button>
                    </div>
                    <p class="text-[#FCE40D] text-sm leading-5">{{ approvalMessage }}</p>
                    <div class="flex gap-2 justify-between">
                      <div class="flex flex-col flex-1">
                        <span class="text-xs text-[#98A2B3]">DATE</span>
                        <span class="text-base text-white">{{ bookingScheduleDateDisplay }}</span>
                      </div>
                      <div class="flex flex-col flex-1">
                        <span class="text-xs text-[#98A2B3]">TIME</span>
                        <span class="text-base text-white">{{ bookingScheduleTimeDisplay }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="rounded-lg bg-white/10 flex flex-col  mb-14 lg:mb-0">
                    <div class="flex flex-col gap-3 w-full p-5">
                      <h3 class="text-sm text-[#22CCEE] leading-[20px]">PAYMENT SUMMARY</h3>
                      <div class="flex flex-col gap-4">
                        <div class="flex flex-col gap-3">
                          <div class="flex flex-col gap-2">
                            <h4 class="text-xs leading-[18px] text-[#98A2B3]">SESSION COST</h4>
                            <div class="flex flex-row justify-between items-center text-white">
                              <div class="flex items-center">
                                <img :src="bookingFlowTokenIcon" alt="token-icon" class="w-4 h-4" />
                                <p class="text-base font-normal leading-[24px] text-[#EAECF0]">{{ sessionBreakdownLabel }}</p>
                              </div>
                              <div class="flex justify-center items-center gap-0.5">
                                <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                                <p class="text-sm leading-[20px]">{{ formatTokenCompact(sessionCost) }}</p>
                              </div>
                            </div>
                          </div>

                          <div v-if="selectedAddons.length > 0" class="flex flex-col gap-2">
                            <h4 class="text-xs leading-[18px] text-[#98A2B3]">ADD-ON SERVICE</h4>
                            <div v-for="(addon, index) in selectedAddons" :key="index" class="flex flex-row justify-between items-center text-white">
                              <p class="text-base font-normal leading-[24px] text-[#EAECF0]">{{ addon.name }}</p>
                              <div class="flex justify-center items-center gap-0.5">
                                <p class="text-sm leading-[20px]">+</p>
                                <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                                <p class="text-sm leading-[20px]">{{ formatTokenCompact(addon.price) }}</p>
                              </div>
                            </div>
                          </div>

                          <div v-if="offHourSurchargeAmount > 0" class="flex flex-col gap-2">
                            <h4 class="text-xs leading-[18px] text-[#98A2B3]">OFF-HOUR SURCHARGE</h4>
                            <div class="flex flex-row justify-between items-center text-white">
                              <p class="text-base font-normal leading-[24px] text-[#EAECF0]">Off-hour surcharge</p>
                              <div class="flex justify-center items-center gap-0.5">
                                <p class="text-sm leading-[20px]">+</p>
                                <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                                <p class="text-sm leading-[20px]">{{ formatTokenCompact(offHourSurchargeAmount) }}</p>
                              </div>
                            </div>
                          </div>

                          <div v-if="false && bookingFeeAmount > 0" class="flex flex-col gap-2">
                            <h4 class="text-xs leading-[18px] text-[#98A2B3]">BOOKING FEE</h4>
                            <div class="flex flex-row justify-between items-center text-white">
                              <p class="text-base font-normal leading-[24px] text-[#EAECF0]">Booking Fee</p>
                              <div class="flex justify-center items-center gap-0.5">
                                <p class="text-sm leading-[20px]">+</p>
                                <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                                <p class="text-sm leading-[20px]">{{ formatTokenCompact(bookingFeeAmount) }}</p>
                              </div>
                            </div>
                          </div>

                          <div v-if="discountAmount > 0" class="flex flex-col gap-2">
                            <h4 class="text-xs leading-[18px] text-[#98A2B3]">DISCOUNT</h4>
                            <div class="flex flex-row justify-between items-center text-white">
                              <p class="text-base font-normal leading-[24px] text-[#EAECF0]">Longer Session Discount</p>
                              <div class="flex justify-center items-center gap-0.5">
                                <p class="text-sm leading-[20px]">-</p>
                                <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                                <p class="text-sm leading-[20px]">{{ formatTokenCompact(discountAmount) }}</p>
                              </div>
                            </div>
                          </div>

                          <div class="flex gap-3 justify-between">
                            <div class="flex flex-col gap-1">
                              <h4 class="text-base font-semibold text-white">Session Total</h4>
                              <p v-if="bookingFeeAmount > 0" class="text-xs font-semibold leading-[18px] text-[#98A2B3] flex">
                                <span class="whitespace-nowrap">A non-refundable</span>
                                <span class="flex items-center gap-[2px] mx-1">
                                  <img :src="bookingFlowTokenIcon" alt="token-icon" class="w-4 h-4" />
                                  <span class="">{{ formatTokenCompact(bookingFeeAmount) }}</span>
                                </span>
                                <span class="whitespace-nowrap">booking fee included</span>
                              </p>
                            </div>
                            <div class="flex flex-col">
                              <div class="flex justify-end items-center gap-0.5">
                                <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                                <p class="text-base lfont-semibold text-white">{{ formatTokenExact(sessionTotalTokens) }}</p>
                              </div>
                              <span class="text-xs font-medium text-[#98A2B3] whitespace-nowrap">={{ sessionTotalUsdDisplay }}</span>
                            </div>
                          </div>
                        </div>

                        <hr class="border-[#F2F4F7] opacity-50" />

                        <div class="flex flex-row justify-between items-start text-white">
                          <p class="text-xl font-semibold leading-[30px] text-white">Amount Due Today</p>
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
                          <div class="flex items-center gap-2"><p class="text-base font-semibold text-white">Your Token Balance</p></div>
                          <div class="flex justify-center items-center gap-0.5">

                            <div v-if="isTopUpNeeded" class="flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-[#0C111D] border border-[#1D2939]">
                                <span class="text-yellow-300 text-[10px] leading-[10px] relative top-[-2px]">...</span>
                                <p class="text-[10px] font-semibold text-yellow-300 leading-[14px] italic tracking-wider">TOP UP NEEDED</p>
                                <div class="w-3 h-3 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                                <p class="text-[10px] font-bold text-[#FFED29] leading-[14px]">{{ formatTokenCompact(topUpAmount) }}</p>
                            </div>

                            <div class="w-4 h-4 flex justify-center items-center"><img :src="bookingFlowTokenIcon" alt="token-icon" /></div>
                            <p class="text-xl font-semibold">{{ formatTokenCompact(walletBalance) }}</p>
                          </div>
                        </div>
                        <hr class="border-white/20" />
                        <div class="flex justify-between items-center">
                          <div class="flex items-center gap-2"><p class="text-xl font-semibold">Balance After Booking</p></div>
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
                <div class="mb-3 rounded-[8px] border border-white/20 bg-black/40 p-3">
                  <p v-if="holdLoading" class="text-xs text-yellow-200 font-medium">Reserving your selected slot...</p>
                  <p v-else-if="holdError" class="text-xs text-red-300 font-medium">{{ holdError }}</p>
                  <p v-else class="text-xs text-[#07F468] font-semibold">Slot reserved for {{ formattedHoldTimer }}</p>
                  <button
                    v-if="holdError && !holdLoading"
                    type="button"
                    class="mt-2 text-[11px] underline text-[#22CCEE]"
                    @click="ensureTemporaryHold"
                  >
                    Retry hold
                  </button>
                </div>

                <TopUpForm
                  ref="topUpFormRef"
                  :wallet-balance="walletBalance"
                  :top-up-amount="topUpAmount"
                  :total-price="totalPrice"
                  :remaining-balance="remainingBalanceAfterBooking"
                  :before-submit="validateBeforeTopUpSubmit"
                  @back="goBackToPaymentSummary"
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
              :disabled="isCheckingBalance || isSubmitting"
              @click="handleButtonClick"
              class="w-auto flex justify-start items-center"
              :class="(isCheckingBalance || isSubmitting) ? 'pointer-events-none' : 'cursor-pointer'"
            >
              <div class="relative w-full p-[12px] md:rounded-br-[20px] flex justify-between items-center
                gap-2 after:content-[''] after:absolute after:right-full after:top-0 after:w-0
                after:h-0 after:border-t-[3.3125rem] after:border-t-transparent after:border-r-[1rem]
                  after:border-b-0"
                :class="actionButtonClass">
              <p class="text-lg w-full leading-[28px] text-black text-center font-medium">{{ isSubmitting ? 'PROCESSING...' : actionLabel }}</p>
              <div v-if="isCheckingBalance" class="w-5 h-5 border-2 border-black/40 border-t-black rounded-full animate-spin"></div>
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
