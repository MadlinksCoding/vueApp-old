<script setup>
import TopUpForm from '../HelperComponents/TopUpForm.vue';
import OneOnOneBookingFlowHeader from '../HelperComponents/OneOnOneBookingFlowHeader.vue';
import { computed, ref, watch, onMounted, onBeforeUnmount } from 'vue';
import TokenHandler from '@/utils/TokenHandler.js';
import { showToast } from '@/utils/toastBus.js';
import { mapCreateBookingToRequest } from '@/services/bookings/mappers/createBookingMapper.js';

const props = defineProps({
  engine: {
    type: Object,
    required: true
  }
});

// --- RETRIEVE DATA FROM ENGINE ---
const bookingData = computed(() => {
  return props.engine.getState('bookingDetails') || {};
});

const selectedEvent = computed(() => props.engine.getState('fanBooking.context.selectedEvent') || null);
const paymentSubstep = computed(() => props.engine.substep || null);

const isSubmitting = ref(false);
const isCheckingBalance = ref(false);
const hasCheckedBalance = ref(false);
const balanceCheckError = ref('');
const holdLoading = ref(false);
const holdError = ref('');
const secondsRemaining = ref(0);
let holdTimerId = null;

const PAYMENT_SUBSTEP_SUMMARY = 'summary';
const PAYMENT_SUBSTEP_TOPUP = 'topup';

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
      fanUserId: resolveFanUserId(),
      creatorId: resolveCreatorId(),
      userId: resolveFanUserId(),
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
    fanUserId: resolveFanUserId(),
    creatorId: resolveCreatorId(),
    userId: resolveFanUserId(),
  });

  const requiredFields = ['eventId', 'userId', 'creatorId', 'startIso', 'endIso'];
  const missingFields = requiredFields.filter((field) => !previewPayload?.[field]);

  return {
    ok: missingFields.length === 0,
    missingFields,
    previewPayload,
  };
}

function resolveFanUserId() {
  return localStorage.getItem('userId') ?? 2;
  return Number(
    props.engine.getState('fanBooking.context.fanUserId')
    || props.engine.getState('userId')
    || 0
  );
}

function resolveCreatorId() {
  return 1;
  return Number(
    selectedEvent.value?.creatorId
    || props.engine.getState('fanBooking.context.creatorId')
    || 0
  );
}

function parseTokenBalance(response, receiverId) {
  if (Number.isFinite(Number(response))) return Number(response);

  if (response && typeof response === 'object') {
    const data = response.data || {};
    const paidTokens = Number(data.paidTokens || 0);
    const freeTokensByBeneficiary = data.freeTokensPerBeneficiary || {};
    const beneficiaryTokens = Number(freeTokensByBeneficiary?.[receiverId] || 0);
    const systemTokens = Number(freeTokensByBeneficiary?.system || 0);
    return paidTokens + beneficiaryTokens + systemTokens;
  }

  return null;
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
    context: { stateEngine: props.engine },
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
      context: { stateEngine: props.engine },
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
  const fanUserId = resolveFanUserId();
  const creatorId = resolveCreatorId();

  if (!fanUserId || !creatorId) {
    hasCheckedBalance.value = false;
    balanceCheckError.value = 'Could not resolve user/creator for balance check.';
    return false;
  }

  isCheckingBalance.value = true;
  balanceCheckError.value = '';

  try {
    const response = await TokenHandler.get({
      userId: fanUserId,
      receiverId: creatorId,
      defaultValue: null,
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
    return true;
  } catch (error) {
    hasCheckedBalance.value = false;
    balanceCheckError.value = error?.message || 'Could not check token balance.';
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
  }
}

// --- SHARED FUNCTION TO SUBMIT BOOKING & GO TO STEP 4 ---
const finalizeBooking = async ({ isTopUpDone = false, nextWalletBalance = null } = {}) => {
  if (isSubmitting.value) return;

  if (!selectedEvent.value) {
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
      },
    });

    if (!result?.ok) {
      showToast({
        type: 'error',
        title: 'Booking Failed',
        message: extractBackendMessage(result),
      });
      return;
    }

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

    showToast({
      type: 'success',
      title: 'Booking Created',
      message: 'Your booking request has been submitted.',
    });
  } catch (error) {
    showToast({
      type: 'error',
      title: 'Booking Failed',
      message: error?.message || 'Could not complete booking.',
    });
  } finally {
    isSubmitting.value = false;
  }
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

const goBackToPaymentSummary = async () => {
  if (isSubmitting.value || holdLoading.value) return;
  await props.engine.forceSubstep(PAYMENT_SUBSTEP_SUMMARY, { intent: 'topup-back' });
};

const finalizeBookingFromTopUp = async () => {
  if (isSubmitting.value || holdLoading.value || hasBookingCreated.value) return;

  if (!hasActiveHold.value) {
    showToast({
      type: 'error',
      title: 'Slot Hold Expired',
      message: 'Your slot hold expired. Please go back and reserve the slot again.',
    });
    return;
  }

  const toppedUpBalance = walletBalance.value + topUpAmount.value;
  walletBalance.value = toppedUpBalance;
  props.engine.setState('bookingDetails.walletBalance', toppedUpBalance, { reason: 'top-up-preview', silent: true });

  await finalizeBooking({
    isTopUpDone: true,
    nextWalletBalance: toppedUpBalance - totalPrice.value,
  });
};

// --- BUTTON HANDLERS ---
const handleButtonClick = async () => {
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
  return isTopUpNeeded.value ? 'TOP-UP AND COMPLETE BOOKING' : 'COMPLETE BOOKING';
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
  clearHoldTimer();
});
</script>

<template>
    <div
      class="rounded-[20px] h-full lg:w-[852px] overflow-hidden"
      style="
        background-image: url('/images/background.png');
        background-size: cover;
        background-repeat: no-repeat;
        background-position: left 50% center;
      "
    >
      <div class="backdrop-blur-[10px] h-full rounded-[20px] bg-[#0C111D96]">

        <div class="rounded-b-[20px] h-full rounded-t-[20px] flex flex-col bg-black/50">

            <OneOnOneBookingFlowHeader
              :time-display="formattedTime"
              :date-display="headerDateDisplay"
              :subtotal="totalPrice"
              :subtotal-display="totalPrice > 0 ? formatTokenCompact(totalPrice) : '-'"
              :duration="sessionDuration"
              :show-approval-needed="showApprovalNeeded"
            />

          <div class="flex-1 flex w-full lg:flex-row h-full flex-col justify-between min-h-0 overflow-y-auto lg:overflow-visible [&::-webkit-scrollbar]:hidden [-ms-order-style:none] [scrollbar-width:none]">

            <div class="flex-1 flex-col w-full p-4 lg:overflow-hidden">
              <div class="flex flex-col gap-3">
                <h3 class="text-sm text-[#22CCEE] leading-[20px]">BOOKING POLICY</h3>
                <ul class="text-sm text-[#EAECF0] list-disc list-outside pl-6">
                  <li>A booking fee of 100 tokens will be on hold in your balance until the call starts.</li>
                  <li>If Princess Carrot Pop does not show up to the confirm call on time, you will be refund partially.</li>
                  <li>If Princess Carrot Pop does not show up to the confirm call within a buffer time of 5 minutes, you will be refunded fully.</li>
                  <li>If you do to show up to the confirm call within a buffer time of 5 minutes, the session will be canceled and minimum charge will be deducted from your account. Cancel the session 1 day in advance to avoid panelty.</li>
                </ul>
              </div>
            </div>


            <div class="flex-1 flex-col p-[1.5rem_1rem] gap-2 bg-gray-950/10 lg:overflow-hidden lg:overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-order-style:none] [scrollbar-width:none]">
              <template v-if="!isTopUpSubstep">
                <div>
                  <div class="flex flex-col gap-6 w-full">
                    <h3 class="text-sm text-[#22CCEE] leading-[20px]">PAYMENT SUMMARY</h3>
                    <div class="flex flex-col gap-3">

                      <div class="flex flex-col gap-2">
                        <h4 class="text-xs leading-[18px] text-[#D0D5DD]">SESSION COST</h4>
                        <div class="flex flex-row justify-between items-center text-white">
                          <p class="text-base font-normal leading-[24px]">{{ sessionDuration }} Minute x 1 session</p>
                          <div class="flex justify-center items-center gap-0.5">
                            <div class="w-4 h-4 flex justify-center items-center"><img src="/images/token.svg" alt="token-icon" /></div>
                            <p class="text-sm leading-[20px]">{{ formatTokenCompact(sessionCost) }}</p>
                          </div>
                        </div>
                      </div>

                      <div v-if="selectedAddons.length > 0" class="flex flex-col gap-2">
                        <h4 class="text-xs leading-[18px] text-[#D0D5DD]">ADD-ON SERVICE</h4>
                        <div v-for="(addon, index) in selectedAddons" :key="index" class="flex flex-row justify-between items-center text-white">
                          <p class="text-base font-normal leading-[24px]">{{ addon.name }}</p>
                          <div class="flex justify-center items-center gap-0.5">
                            <p class="text-sm leading-[20px]">+</p>
                            <div class="w-4 h-4 flex justify-center items-center"><img src="/images/token.svg" alt="token-icon" /></div>
                            <p class="text-sm leading-[20px]">{{ formatTokenCompact(addon.price) }}</p>
                          </div>
                        </div>
                      </div>

                      <div v-if="offHourSurchargeAmount > 0" class="flex flex-col gap-2">
                        <h4 class="text-xs leading-[18px] text-[#D0D5DD]">OFF-HOUR SURCHARGE</h4>
                        <div class="flex flex-row justify-between items-center text-white">
                          <p class="text-base font-normal leading-[24px]">Off-hour surcharge</p>
                          <div class="flex justify-center items-center gap-0.5">
                            <p class="text-sm leading-[20px]">+</p>
                            <div class="w-4 h-4 flex justify-center items-center"><img src="/images/token.svg" alt="token-icon" /></div>
                            <p class="text-sm leading-[20px]">{{ formatTokenCompact(offHourSurchargeAmount) }}</p>
                          </div>
                        </div>
                      </div>

                      <div v-if="bookingFeeAmount > 0" class="flex flex-col gap-2">
                        <h4 class="text-xs leading-[18px] text-[#D0D5DD]">BOOKING FEE</h4>
                        <div class="flex flex-row justify-between items-center text-white">
                          <p class="text-base font-normal leading-[24px]">Booking Fee</p>
                          <div class="flex justify-center items-center gap-0.5">
                            <p class="text-sm leading-[20px]">+</p>
                            <div class="w-4 h-4 flex justify-center items-center"><img src="/images/token.svg" alt="token-icon" /></div>
                            <p class="text-sm leading-[20px]">{{ formatTokenCompact(bookingFeeAmount) }}</p>
                          </div>
                        </div>
                      </div>

                      <div v-if="discountAmount > 0" class="flex flex-col gap-2">
                        <h4 class="text-xs leading-[18px] text-[#D0D5DD]">DISCOUNT</h4>
                        <div class="flex flex-row justify-between items-center text-white">
                          <p class="text-base font-normal leading-[24px]">Longer Session Discount</p>
                          <div class="flex justify-center items-center gap-0.5">
                            <p class="text-sm leading-[20px]">-</p>
                            <div class="w-4 h-4 flex justify-center items-center"><img src="/images/token.svg" alt="token-icon" /></div>
                            <p class="text-sm leading-[20px]">{{ formatTokenCompact(discountAmount) }}</p>
                          </div>
                        </div>
                      </div>

                      <hr class="border-[#D0D5DD]" />

                      <div class="flex flex-row justify-between items-center text-white">
                        <p class="text-lg font-medium leading-[28px]">TOTAL</p>
                        <div class="flex justify-center items-center gap-0.5">
                          <div class="w-6 h-6 flex justify-center items-center"><img src="/images/token.svg" alt="token-icon" /></div>
                          <p class="text-2xl leading-[32px] font-semibold">{{ formatTokenCompact(totalPrice) }}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="rounded-[8px] text-white mt-4" style="background-image: url('/images/ex-balance.png'); background-position: right; background-repeat: no-repeat; background-size: 48% 100%; background-color: #FF76DD;">
                    <div class="flex flex-col gap-3 p-2 rounded-[8px]" style="background: linear-gradient(0deg, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.2)), linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.5) 100%); backdrop-filter: blur(0.5rem);">

                      <div class="flex justify-between items-center">
                        <div class="flex items-center gap-2"><p class="text-sm font-medium leading-[20px]">Wallet Balance</p></div>
                        <div class="flex justify-center items-center gap-0.5">

                          <div v-if="isTopUpNeeded" class="flex items-center justify-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-[#0C111D] border border-[#1D2939]">
                              <span class="text-yellow-300 text-[10px] leading-[10px] relative top-[-2px]">...</span>
                              <p class="text-[10px] font-semibold text-yellow-300 leading-[14px] italic tracking-wider">TOP UP NEEDED</p>
                              <div class="w-3 h-3 flex justify-center items-center"><img src="/images/token.svg" alt="token-icon" /></div>
                              <p class="text-[10px] font-bold text-[#FFED29] leading-[14px]">{{ formatTokenCompact(topUpAmount) }}</p>
                          </div>

                          <div class="w-4 h-4 flex justify-center items-center"><img src="/images/token.svg" alt="token-icon" /></div>
                          <p class="text-base leading-[24px] font-semibold">{{ formatTokenCompact(walletBalance) }}</p>
                        </div>
                      </div>

                      <div class="flex justify-between items-center">
                        <div class="relative flex items-center gap-2">
                          <p class="text-sm font-medium leading-[20px]">Total</p>
                          <div class="w-4 h-4 flex justify-center items-center cursor-pointer relative group">
                            <img src="/images/Help icon.svg" alt="help-icon" />
                            <div class="absolute -top-[122px] left-[20px] hidden group-hover:flex rounded-[8px] w-[242px] z-10" style="box-shadow: 0px 2px 4px -2px #1018280F; box-shadow: 0px 4px 8px -2px #1018281A; backdrop-filter: blur(50px)">
                              <div class="py-2 px-3 rounded-[8px] bg-black/70">
                                <p class="text-xs font-medium leading-[18px]"> This amount will be on hold in your wallet until event start date...</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="flex justify-center items-center gap-0.5">
                          <p class="text-lg leading-[20px]">-</p>
                          <div class="w-4 h-4 flex justify-center items-center"><img src="/images/token.svg" alt="token-icon" /></div>
                          <p class="text-base leading-[24px] font-semibold">{{ formatTokenCompact(totalPrice) }}</p>
                        </div>
                      </div>
                      <hr class="border-white/20" />
                      <div class="flex justify-between items-center">
                        <div class="flex items-center gap-2"><p class="text-sm font-medium leading-[20px]">Available Balance after booking</p></div>
                        <div class="flex justify-center items-center gap-0.5">
                          <div class="w-4 h-4 flex justify-center items-center"><img src="/images/token.svg" alt="token-icon" /></div>
                          <p class="text-base leading-[24px] font-semibold">{{ formatTokenCompact(remainingBalance) }}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="mt-2">
                    <p class="text-xs text-white font-normal leading-[18px]">Completeing this booking means you agree to the event's booking policy</p>
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
                  :wallet-balance="walletBalance"
                  :top-up-amount="topUpAmount"
                  :total-price="totalPrice"
                  :remaining-balance="remainingBalanceAfterBooking"
                  @back="goBackToPaymentSummary"
                />
              </template>
            </div>

          </div>


          <div class="flex-none flex w-full justify-end">
            <button
              v-if="!isTopUpSubstep"
              type="button"
              :disabled="isCheckingBalance || isSubmitting"
              @click="handleButtonClick"
              class="w-4/5 lg:w-1/2 flex justify-start items-center"
              :class="(isCheckingBalance || isSubmitting) ? 'pointer-events-none' : 'cursor-pointer'"
            >
              <div class="relative w-full p-[12px] rounded-br-[20px] flex justify-between items-center
                gap-2 after:content-[''] after:absolute after:right-full after:top-0 after:w-0
                after:h-0 after:border-t-[3.3125rem] after:border-t-transparent after:border-r-[1rem]
                  after:border-b-0"
                :class="actionButtonClass">
              <p class="text-lg w-full leading-[28px] text-black text-center font-medium">{{ isSubmitting ? 'PROCESSING...' : actionLabel }}</p>
              <div v-if="isCheckingBalance" class="w-5 h-5 border-2 border-black/40 border-t-black rounded-full animate-spin"></div>
              <div class="w-6 h-6 flex justify-center items-center">
                <img src="/images/arrow-right.svg" alt="arrow-right-icon" />
              </div>
            </div>
            </button>

            <button
              v-else
              type="button"
              :disabled="isSubmitting || holdLoading || !hasActiveHold"
              @click="finalizeBookingFromTopUp"
              class="w-4/5 lg:w-1/2 flex justify-start items-center"
              :class="(isSubmitting || holdLoading || !hasActiveHold) ? 'pointer-events-none opacity-70' : 'cursor-pointer'"
            >
              <div class="relative w-full p-[12px] rounded-br-[20px] flex justify-between items-center
                gap-2 bg-[#07F468] after:content-[''] after:absolute after:right-full after:top-0 after:w-0
                after:h-0 after:border-t-[3.3125rem] after:border-t-transparent after:border-r-[1rem]
                after:border-r-[#07F468] after:border-b-0">
                <p class="text-lg w-full leading-[28px] text-black text-center font-medium">
                  {{ isSubmitting ? 'PROCESSING...' : (holdLoading ? 'HOLDING SLOT...' : 'TOP UP & COMPLETE BOOKING') }}
                </p>
                <div class="w-6 h-6 flex justify-center items-center">
                  <img src="/images/arrow-right.svg" alt="arrow-right-icon" />
                </div>
              </div>
            </button>

          </div>

        </div>
      </div>
    </div>

</template>
