<template>
  <PopupHandler
    :modelValue="modelValue"
    @update:modelValue="handleVisibilityChange"
    @closed="emit('closed')"
    :config="popupConfig"
  >
    <div
      class="booking-adjustment-decision-card w-96 max-md:w-full p-4 bg-white/90 rounded-[5px] max-md:rounded-b-none max-md:rounded-t-3xl backdrop-blur-[50px] inline-flex flex-col justify-start items-start gap-6"
      data-test="booking-adjustment-decision-popup"
      :data-mode="normalizedMode"
    >
      <div class="self-stretch flex flex-col justify-center items-start gap-5">
        <div class="self-stretch inline-flex justify-start items-start gap-2">
          <div class="flex-1 justify-start text-slate-700 text-base font-medium leading-6" data-test="booking-adjustment-decision-heading">
            <span>{{ headingParts.before }}</span><span class="font-bold">{{ headingParts.highlight }}</span><span>{{ headingParts.after }}</span>
          </div>
          <button type="button" data-svg-wrapper class="relative cursor-pointer" :aria-label="t('common_close')" data-test="booking-adjustment-decision-close" @click="closePopup">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M18 6L6 18M6 6L18 18" stroke="#667085" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </button>
        </div>

        <div v-if="normalizedMode === 'accept'" class="self-stretch inline-flex justify-start items-center gap-2" data-test="booking-adjustment-decision-prices">
          <div class="size- px-2 inline-flex flex-col justify-center items-start gap-1">
            <div class="text-center justify-start text-slate-700 text-xs font-medium leading-4">{{ t('booking_adjustment_original_price') }}</div>
            <div class="size- inline-flex justify-start items-center gap-1">
              <div data-svg-wrapper class="relative grayscale"><img :src="TokenIcon" alt="" /></div>
              <div class="text-center justify-start text-gray-500 text-sm font-medium line-through leading-5" data-test="booking-adjustment-original-price">{{ formatAmount(originalPrice) }}</div>
            </div>
          </div>
          <div data-svg-wrapper class="relative grayscale"><img :src="ArrowBrownIcon" alt="" /></div>
          <div class="size- px-2 inline-flex flex-col justify-center items-start gap-1">
            <div class="text-center justify-start text-[#FB5BA2] text-xs font-medium leading-4">{{ t('booking_adjustment_new_price') }}</div>
            <div class="size- inline-flex justify-start items-center gap-1">
              <div data-svg-wrapper class="relative"><img :src="TokenIcon" alt="" /></div>
              <div class="text-center justify-start text-[#F06] text-sm font-semibold leading-5" data-test="booking-adjustment-new-price">{{ formatAmount(proposedPrice) }}</div>
            </div>
          </div>
        </div>

        <div v-if="isCreatorRefundDecision" class="self-stretch flex flex-col gap-3 px-2" data-test="booking-adjustment-creator-cancel-summary">
          <div class="self-stretch inline-flex justify-between items-center gap-4">
            <div class="text-slate-800 text-sm font-medium">{{ t('booking_adjustment_session_cost_refund') }}</div>
            <div class="inline-flex items-center gap-1 text-slate-800 text-base font-semibold"><img :src="TokenIcon" alt="" class="h-6 w-6" /><span data-test="booking-adjustment-creator-session-refund">{{ formatAmount(sessionRefund) }}</span></div>
          </div>
          <div class="self-stretch h-px bg-gray-300" />
          <div class="self-stretch inline-flex justify-between items-center gap-4">
            <div class="text-slate-800 text-sm font-medium">{{ t('booking_adjustment_total_refunded_to', { fan: fanLabel }) }}</div>
            <div class="inline-flex items-center gap-1 text-slate-800 text-base font-semibold"><img :src="TokenIcon" alt="" class="h-6 w-6" /><span data-test="booking-adjustment-creator-total-refund">{{ formatAmount(netRefund) }}</span></div>
          </div>
        </div>

        <div v-else-if="!isReviewRejection" class="self-stretch bg-[#182230] bg-[linear-gradient(90deg,rgba(16,24,40,0)_25%,rgba(16,24,40,0.9)_75%)] rounded-lg shadow-[0px_4px_8px_0px_rgba(255,255,255,0.05)] inline-flex flex-col justify-start items-end gap-2 overflow-hidden" data-test="booking-adjustment-balance-card">
          <div class="self-stretch relative bg-gray-800/10 flex flex-col justify-start items-end gap-2 z-[1]">
            <div data-svg-wrapper class="right-[20px] top-[8.51px] absolute z-[-1]">
              <img src="https://fansocial.app/wp-content/plugins/fansocial/dev/chimenew/assets/svgs/grey-new-icon.svg" alt="" class="h-[139px]" />
            </div>
            <div class="self-stretch p-4 flex flex-col justify-start items-start gap-3">
              <div class="self-stretch inline-flex justify-between items-center">
                <div :class="['justify-start text-sm font-medium leading-5', requiresTopup ? 'text-[#FCE40D]' : 'text-white']">{{ t('common_wallet_balance') }}</div>
                <div v-if="balanceLoading" class="justify-center text-white text-sm font-medium leading-5" data-test="booking-adjustment-balance-loading">{{ t('booking_adjustment_checking_balance') }}</div>
                <div v-else class="size- inline-flex justify-center items-center gap-1">
                  <div v-if="requiresTopup" class="h-5 px-1 bg-yellow-400 rounded-md inline-flex justify-center items-center gap-0.5" data-test="booking-adjustment-topup-needed">
                    <div data-svg-wrapper class="relative"><img :src="DotsHorizontalIcon" alt="" class="h-[24px] w-[24px]" /></div>
                    <div class="text-right justify-center text-gray-900 text-xs font-semibold font-['Poppins'] leading-4">{{ t('common_top_up_needed') }}</div>
                  </div>
                  <div class="size- inline-flex justify-start items-center gap-1">
                    <div data-svg-wrapper class="relative"><img :src="TokenIcon" alt="" class="h-[24px] w-[24px]" /></div>
                    <div :class="['justify-center text-base font-semibold leading-6', requiresTopup ? 'text-[#FCE40D]' : 'text-white']" data-test="booking-adjustment-wallet-balance">{{ balanceDisplay }}</div>
                  </div>
                </div>
              </div>

              <template v-if="!balanceLoading && !balanceError">
                <div class="self-stretch inline-flex justify-between items-center">
                  <div class="size- flex justify-start items-center gap-2">
                    <div class="justify-start text-white text-sm font-medium leading-5">{{ transactionLabel }}</div>
                    <div class="size-4 relative" />
                  </div>
                  <div class="size- inline-flex flex-col justify-center items-center gap-8">
                    <div class="size- inline-flex justify-start items-center gap-1">
                      <div :class="['justify-center text-lg font-semibold leading-7', transactionPositive ? 'text-[#07F468]' : 'text-white']">{{ transactionPositive ? '+' : '-' }}</div>
                      <div data-svg-wrapper class="relative"><img :src="TokenIcon" alt="" class="h-[24px] w-[24px]" /></div>
                      <div :class="['justify-center text-base font-semibold leading-6', transactionPositive ? 'text-[#07F468]' : 'text-white']" data-test="booking-adjustment-transaction-amount">{{ formatAmount(primaryTransactionAmount) }}</div>
                    </div>
                  </div>
                </div>

                <div v-if="isCancellationMode && retainedBookingFee > 0" class="self-stretch inline-flex justify-between items-center" data-test="booking-adjustment-booking-fee-row">
                  <div class="justify-start text-white text-sm font-medium leading-5">{{ t('booking_adjustment_booking_fee') }}</div>
                  <div class="size- inline-flex justify-start items-center gap-1">
                    <div class="justify-center text-white text-lg font-semibold leading-7">-</div>
                    <div data-svg-wrapper class="relative"><img :src="TokenIcon" alt="" class="h-[24px] w-[24px]" /></div>
                    <div class="justify-center text-white text-base font-semibold leading-6" data-test="booking-adjustment-booking-fee">{{ formatAmount(retainedBookingFee) }}</div>
                  </div>
                </div>

                <div v-if="isCancellationMode && retainedCancellationFee > 0" class="self-stretch inline-flex justify-between items-center" data-test="booking-adjustment-cancellation-fee-row">
                  <div class="justify-start text-white text-sm font-medium leading-5">{{ t('booking_adjustment_cancellation_fee') }}</div>
                  <div class="size- inline-flex justify-start items-center gap-1">
                    <div class="justify-center text-white text-lg font-semibold leading-7">-</div>
                    <div data-svg-wrapper class="relative"><img :src="TokenIcon" alt="" class="h-[24px] w-[24px]" /></div>
                    <div class="justify-center text-white text-base font-semibold leading-6" data-test="booking-adjustment-cancellation-fee">{{ formatAmount(retainedCancellationFee) }}</div>
                  </div>
                </div>

                <template v-if="!requiresTopup">
                  <div class="self-stretch h-[1px] bg-[#F2F4F7] opacity-50" />
                  <div class="self-stretch inline-flex justify-between items-center">
                    <div class="justify-start text-white text-sm font-medium leading-5">{{ projectedBalanceLabel }}</div>
                    <div class="size- inline-flex flex-col justify-center items-center gap-8">
                      <div class="size- inline-flex justify-start items-center gap-1">
                        <div data-svg-wrapper class="relative"><img :src="TokenIcon" alt="" class="h-[24px] w-[24px]" /></div>
                        <div class="justify-center text-white text-base font-semibold leading-6" data-test="booking-adjustment-projected-balance">{{ formatAmount(projectedBalance) }}</div>
                      </div>
                    </div>
                  </div>
                </template>
              </template>

              <div v-if="balanceError" class="self-stretch text-sm font-medium leading-5 text-red-300" role="alert" data-test="booking-adjustment-balance-error">{{ balanceError }}</div>
              <div v-else-if="actionError" class="self-stretch text-sm font-medium leading-5 text-red-300" role="alert" data-test="booking-adjustment-action-error">{{ actionError }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="self-stretch flex flex-col justify-center items-start gap-2">
        <button
          type="button"
          :class="['self-stretch h-10 px-2 py-1 inline-flex justify-center items-center gap-2.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60', primaryButtonClass]"
          :disabled="balanceLoading || processing"
          data-test="booking-adjustment-decision-primary"
          @click="handlePrimaryAction"
        >
          <div :class="['justify-center text-lg font-medium leading-7', isCancellationMode || isReviewRejection ? 'text-white' : 'text-black']">{{ primaryButtonText }}</div>
        </button>
      </div>
    </div>
  </PopupHandler>
</template>

<script setup>
import { computed } from 'vue';
import PopupHandler from './PopupHandler.vue';
import TokenIcon from '@/assets/images/icons/token-sm-calender.svg';
import ArrowBrownIcon from '@/assets/images/icons/arrow-right-brown.svg';
import DotsHorizontalIcon from '@/assets/images/icons/dots-horizontal.svg';
import { useBookingTranslations } from '@/i18n/bookingTranslations.js';

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: 'accept' },
  originalTokens: { type: [Number, String], default: null },
  proposedTokens: { type: [Number, String], default: null },
  walletBalance: { type: [Number, String], default: null },
  sessionRefundTokens: { type: [Number, String], default: null },
  bookingFeeTokens: { type: [Number, String], default: 0 },
  cancellationFeeTokens: { type: [Number, String], default: 0 },
  bookingFeeRefundable: { type: Boolean, default: false },
  cancellationFeeRefundable: { type: Boolean, default: false },
  creatorUsername: { type: String, default: '' },
  creatorName: { type: String, default: '' },
  eventTitle: { type: String, default: '' },
  actorRole: { type: String, default: 'fan' },
  fanUsername: { type: String, default: '' },
  netRefundTokens: { type: [Number, String], default: null },
  balanceLoading: { type: Boolean, default: false },
  balanceError: { type: String, default: '' },
  actionError: { type: String, default: '' },
  topupCompleted: { type: Boolean, default: false },
  processing: { type: Boolean, default: false },
  // Merged over the PopupHandler config (e.g. a higher zIndex inside chat).
  popupConfig: { type: Object, default: null },
});

const emit = defineEmits(['update:modelValue', 'confirm', 'retry-balance', 'retry-after-topup', 'close', 'closed']);
const { t, locale } = useBookingTranslations();

const defaultPopupConfig = {
  actionType: 'popup',
  width: 'auto',
  height: { default: 'auto' },
  customEffect: 'fade',
  containerClass: 'booking-adjustment-decision-container',
};
const popupConfig = computed(() => ({ ...defaultPopupConfig, ...props.popupConfig }));

function finiteAmount(value, fallback = 0) {
  if (value === '' || value == null) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
}

const normalizedMode = computed(() => {
  if (props.mode === 'cancel') return 'cancel';
  if (props.mode === 'reject') return 'reject';
  return props.mode === 'decline' ? 'decline' : 'accept';
});
const isCancellationMode = computed(() => normalizedMode.value === 'decline' || normalizedMode.value === 'cancel');
const isReviewRejection = computed(() => normalizedMode.value === 'reject');
const isCreatorRefundDecision = computed(() => (isCancellationMode.value || isReviewRejection.value) && String(props.actorRole).toLowerCase() === 'creator');
const originalPrice = computed(() => finiteAmount(props.originalTokens));
const proposedPrice = computed(() => finiteAmount(props.proposedTokens));
const balanceAvailable = computed(() => props.walletBalance !== '' && props.walletBalance != null && Number.isFinite(Number(props.walletBalance)));
const balance = computed(() => finiteAmount(props.walletBalance));
const bookingFee = computed(() => finiteAmount(props.bookingFeeTokens));
const cancellationFee = computed(() => finiteAmount(props.cancellationFeeTokens));
const bookingFeeRefundable = computed(() => Boolean(props.bookingFeeRefundable));
const cancellationFeeRefundable = computed(() => Boolean(props.cancellationFeeRefundable));
const retainedBookingFee = computed(() => bookingFeeRefundable.value ? 0 : bookingFee.value);
const retainedCancellationFee = computed(() => cancellationFeeRefundable.value ? 0 : cancellationFee.value);
const sessionRefund = computed(() => finiteAmount(props.sessionRefundTokens, originalPrice.value));
const netRefund = computed(() => finiteAmount(props.netRefundTokens, sessionRefund.value));
const adjustmentAmount = computed(() => isCancellationMode.value
  ? cancellationFee.value
  : Math.abs(proposedPrice.value - originalPrice.value));
const priceIncrease = computed(() => Math.max(0, proposedPrice.value - originalPrice.value));
const priceRefund = computed(() => Math.max(0, originalPrice.value - proposedPrice.value));
const requiresTopup = computed(() => normalizedMode.value === 'accept'
  && !props.balanceLoading
  && !props.balanceError
  && balanceAvailable.value
  && priceIncrease.value > balance.value);
const transactionPositive = computed(() => isCancellationMode.value || priceRefund.value > 0);
const primaryTransactionAmount = computed(() => isCancellationMode.value
  ? sessionRefund.value
  : (priceRefund.value || priceIncrease.value));
const projectedBalance = computed(() => isCancellationMode.value
  ? balance.value + sessionRefund.value - retainedBookingFee.value - retainedCancellationFee.value
  : balance.value + priceRefund.value - priceIncrease.value);
const creatorLabel = computed(() => props.creatorUsername || props.creatorName || t('common_creator'));
const eventLabel = computed(() => props.eventTitle || t('common_booking'));
const fanLabel = computed(() => {
  const username = String(props.fanUsername || '').trim().replace(/^@+/, '');
  return username && !/^user\s*#\s*\d+$/i.test(username) ? username : t('common_fan');
});
const balanceDisplay = computed(() => balanceAvailable.value ? formatAmount(balance.value) : '—');
const headingKey = computed(() => {
  if (isCreatorRefundDecision.value) return 'booking_adjustment_creator_cancel_heading';
  if (isReviewRejection.value) return 'calendar_event_decline_confirm';
  if (isCancellationMode.value) {
    return retainedBookingFee.value > 0 || retainedCancellationFee.value > 0
      ? 'booking_adjustment_cancel_fee_heading'
      : 'booking_adjustment_cancel_heading';
  }
  if (priceRefund.value > 0) return 'booking_adjustment_refund_heading';
  if (requiresTopup.value) return 'booking_adjustment_difference_heading';
  return 'booking_adjustment_increase_heading';
});
const headingParts = computed(() => {
  if (isReviewRejection.value && !isCreatorRefundDecision.value) {
    return { before: t(headingKey.value), highlight: '', after: '' };
  }
  const marker = '__FS_BOOKING_HIGHLIGHT__';
  const highlight = isCancellationMode.value
    ? (isCreatorRefundDecision.value ? eventLabel.value : creatorLabel.value)
    : (isCreatorRefundDecision.value ? eventLabel.value : `${formatAmount(adjustmentAmount.value)} ${t('common_tokens')}`);
  const message = t(headingKey.value, {
    tokens: marker,
    creator: isCancellationMode.value ? marker : creatorLabel.value,
    event: isCreatorRefundDecision.value ? marker : eventLabel.value,
    fan: fanLabel.value,
  });
  const markerIndex = message.indexOf(marker);
  if (markerIndex < 0) return { before: message, highlight: '', after: '' };
  return {
    before: message.slice(0, markerIndex),
    highlight,
    after: message.slice(markerIndex + marker.length),
  };
});
const transactionLabel = computed(() => {
  if (isCancellationMode.value) return t('booking_adjustment_session_cost_refund');
  return priceRefund.value > 0 ? t('booking_adjustment_refund_from_price') : t('booking_adjustment_subtotal');
});
const projectedBalanceLabel = computed(() => isCancellationMode.value
  ? t('booking_adjustment_balance_after_cancellation')
  : t('booking_adjustment_balance_after_adjustment'));
const primaryButtonClass = computed(() => {
  if (isReviewRejection.value) return 'bg-[#FF4405]';
  if (isCancellationMode.value) return 'bg-[#FF4405]';
  if (requiresTopup.value) return 'bg-[#facc15]';
  return 'bg-[#07F468]';
});
const primaryButtonText = computed(() => {
  if (props.processing) return t('fan_booking_processing');
  if (props.balanceLoading) return t('booking_adjustment_checking_balance');
  if (props.topupCompleted) return t('booking_adjustment_check_again');
  if (props.balanceError) return t('booking_adjustment_retry_balance');
  if (isCreatorRefundDecision.value) return t('booking_adjustment_creator_cancel_action', { fan: fanLabel.value });
  if (isReviewRejection.value) return t('calendar_event_decline_booking');
  if (isCancellationMode.value) return t('booking_adjustment_proceed_cancel');
  if (requiresTopup.value) return t('booking_adjustment_top_up_pay');
  return t('common_continue');
});

function formatAmount(value) {
  return new Intl.NumberFormat(locale?.value || undefined).format(finiteAmount(value));
}

function handleVisibilityChange(value) {
  if (!value && props.processing) {
    emit('update:modelValue', true);
    return;
  }
  emit('update:modelValue', value);
  if (!value) emit('close');
}

function closePopup() {
  if (props.processing) return;
  emit('update:modelValue', false);
  emit('close');
}

function handlePrimaryAction() {
  if (props.balanceLoading || props.processing) return;
  if (props.topupCompleted) {
    emit('retry-after-topup');
    return;
  }
  if (props.balanceError) {
    emit('retry-balance');
    return;
  }
  emit('confirm', {
    mode: normalizedMode.value,
    requiresTopup: requiresTopup.value,
    shortfallTokens: requiresTopup.value ? Math.max(0, priceIncrease.value - balance.value) : 0,
    requiredBalanceTokens: normalizedMode.value === 'accept' ? priceIncrease.value : 0,
  });
}
</script>

<style>
.booking-adjustment-decision-container {
  height: auto !important;
}

@media (max-width: 767px) {
  .booking-adjustment-decision-container {
    top: auto !important;
    bottom: 0 !important;
    left: 50% !important;
    width: 100% !important;
    height: auto !important;
    transform: translateX(-50%) !important;
  }

  .booking-adjustment-decision-card {
    width: 100% !important;
    border-radius: 1.5rem 1.5rem 0 0 !important;
  }
}
</style>
