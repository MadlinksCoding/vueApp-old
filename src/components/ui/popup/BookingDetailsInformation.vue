<template>
  <div class="self-stretch flex flex-col items-start gap-4" data-test="booking-details-information">
    <div v-if="compact" class="self-stretch inline-flex items-start gap-4" data-test="booking-details-compact-schedule">
      <div data-svg-wrapper class="relative size-6 shrink-0 overflow-hidden">
        <img :src="CompactClockIcon" alt="" class="size-6" />
      </div>
      <div class="min-w-0 flex-1 flex flex-col justify-center text-sm font-medium leading-5 text-[#0C111D]">
        <div class="break-words">{{ formattedDate }}</div>
        <div class="break-words">{{ formattedTimeRange }}</div>
      </div>
    </div>

    <div class="self-stretch inline-flex items-start gap-4">
      <div data-svg-wrapper class="relative size-6 shrink-0 overflow-hidden">
        <img :src="compact ? CompactUserIcon : ProfileIcon" alt="" class="size-6" :class="compact ? '' : 'filter grayscale brightness-75 opacity-100'" />
      </div>
      <div class="min-w-0 flex-1 inline-flex flex-col justify-center items-start gap-2">
        <div class="self-stretch inline-flex justify-start items-start gap-1 flex-wrap content-start">
          <div class="h-6 min-w-0 flex justify-center items-center gap-1.5">
            <div v-if="counterpartyAvatar" data-svg-wrapper class="relative shrink-0">
              <img
                :src="counterpartyAvatar"
                :alt="counterpartyName"
                class="h-[1.375rem] w-[1.375rem] object-cover [border-radius:25%_75%_50%_51%_/_45%_65%_36%_55%]"
              />
            </div>
            <span v-else-if="compact" class="size-[1.375rem] shrink-0 rounded-full bg-[#FCE40D]" aria-hidden="true" />
            <div class="min-w-0 inline-flex flex-col justify-center items-start">
              <div class="self-stretch min-w-0 inline-flex justify-start items-center gap-1">
                <div class="min-w-0 truncate text-gray-900 text-sm font-normal leading-5">{{ counterpartyName || counterpartyFallback || t('common_creator') }}</div>
                <div v-if="counterpartyVerified" data-svg-wrapper data-size="xs" class="relative shrink-0"><img :src="VerifiedBlueTickIcon" alt="" /></div>
              </div>
            </div>
          </div>
        </div>
        <button
          v-if="canOpenChat"
          type="button"
          data-color="dark"
          data-leading-icon="true"
          data-property-1="hover"
          data-size="sm"
          data-trailing-icon="true"
          class="inline-flex justify-start items-center gap-0.5"
          data-test="event-details-fan-open-chat"
          @click="emit('open-chat', chatPayload)"
        >
          <div data-svg-wrapper class="relative"><img :src="ChatBlueIcon" alt="" /></div>
          <div class="justify-start text-blue-600 text-xs font-medium leading-4">{{ t('calendar_event_open_chat') }}</div>
          <div data-svg-wrapper class="relative"><img :src="ArrowUpRightBlueIcon" alt="" /></div>
        </button>
      </div>
    </div>

    <div class="self-stretch inline-flex items-start gap-4">
      <div data-svg-wrapper class="relative size-6 shrink-0 overflow-hidden">
        <img :src="compact ? CompactRequestsIcon : RequestsIcon" alt="" class="size-6" />
      </div>
      <div class="min-w-0 flex-1 inline-flex flex-col justify-start items-start gap-2">
        <div class="justify-center text-gray-900 text-sm font-semibold leading-5">{{ t('calendar_event_additional_request') }}</div>
        <ul v-if="compact" class="w-full space-y-2 pl-[1.3125rem] text-gray-900 text-sm font-normal leading-5 list-disc" data-test="booking-details-compact-requests">
          <li v-for="line in additionalRequestLines" :key="line" class="whitespace-pre-wrap break-words">{{ line }}</li>
        </ul>
        <template v-else>
          <div v-for="line in additionalRequestLines" :key="line" class="justify-center text-gray-900 text-sm font-normal leading-5 whitespace-pre-wrap break-words">{{ line }}</div>
        </template>
      </div>
    </div>

    <template v-if="compact">
      <div class="self-stretch inline-flex items-start gap-4" data-test="booking-details-compact-costs">
        <div data-svg-wrapper class="relative size-6 shrink-0 overflow-hidden">
          <img :src="CompactCostIcon" alt="" class="size-6" />
        </div>
        <div class="min-w-0 flex-1 flex flex-row flex-wrap items-start gap-x-8 gap-y-4" data-test="booking-details-cost-tiles">
          <div class="min-w-[7rem] flex flex-col items-start gap-2" data-test="booking-details-session-cost-tile">
            <div class="text-gray-900 text-sm font-semibold leading-5">{{ t('fan_event_details_session_cost') }}</div>
            <div v-if="pendingPriceAdjustment" class="inline-flex flex-wrap items-center gap-2" data-test="event-details-fan-session-cost-adjusted">
              <div class="flex items-center gap-1 grayscale">
                <img :src="TokenIcon" alt="" class="size-5" data-test="event-details-fan-session-cost-original-icon" />
                <span class="text-gray-500 text-sm font-medium line-through leading-5" data-test="event-details-fan-session-cost-original">{{ formatTokens(adjustment.originalTokens) }}</span>
              </div>
              <img :src="PriceArrowIcon" alt="" class="size-6" data-test="event-details-fan-session-cost-arrow" />
              <div class="flex items-center gap-1">
                <img :src="TokenIcon" alt="" class="size-5" data-test="event-details-fan-session-cost-proposed-icon" />
                <span class="text-gray-900 text-sm font-semibold leading-5" data-test="event-details-fan-session-cost-proposed">{{ formatTokens(adjustment.proposedTokens) }}</span>
              </div>
            </div>
            <div v-else-if="hasAmount(sessionCost)" class="inline-flex items-center gap-1" data-test="event-details-fan-session-cost-standard">
              <img :src="TokenIcon" alt="" class="size-5" data-test="event-details-fan-session-cost-icon" />
              <span class="text-gray-900 text-sm font-semibold leading-5" data-test="event-details-fan-session-cost-value">{{ formatTokens(sessionCost) }}</span>
            </div>
            <div v-else class="text-gray-900 text-sm font-normal leading-5" data-test="event-details-fan-session-cost-missing">{{ t('calendar_event_not_set') }}</div>
          </div>
          <div v-if="positiveAmount(cancellationFee)" class="min-w-[7rem] flex flex-col items-start gap-2" data-test="booking-details-active-cancellation-fee">
            <span class="text-gray-900 text-sm font-semibold leading-5">{{ t('booking_adjustment_cancellation_fee') }}</span>
            <span class="inline-flex items-center gap-1 text-gray-900 text-sm font-semibold leading-5"><img :src="TokenIcon" alt="" class="size-5" />{{ formatTokens(cancellationFee) }}</span>
          </div>
          <div v-if="positiveAmount(bookingFee)" class="min-w-[7rem] flex flex-col items-start gap-2" data-test="booking-details-active-booking-fee">
            <span class="text-gray-900 text-sm font-semibold leading-5">{{ t('booking_adjustment_booking_fee') }}</span>
            <span class="inline-flex items-center gap-1 text-gray-900 text-sm font-semibold leading-5"><img :src="TokenIcon" alt="" class="size-5" />{{ formatTokens(bookingFee) }}</span>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="self-stretch inline-flex justify-start items-start gap-4">
        <div data-svg-wrapper class="relative"><img :src="CostIcon" alt="" /></div>
        <div class="flex-1 min-w-0 flex flex-row flex-wrap items-start gap-x-8 gap-y-4" data-test="booking-details-cost-tiles">
          <div class="min-w-[8rem] flex flex-col items-start gap-2" data-test="booking-details-session-cost-tile">
            <div class="justify-center text-gray-900 text-sm font-semibold leading-5">{{ t('fan_event_details_session_cost') }}</div>
            <div v-if="pendingPriceAdjustment" class="inline-flex justify-start items-center gap-2" data-test="event-details-fan-session-cost-adjusted">
              <div class="flex justify-start items-center gap-1 grayscale">
                <img :src="TokenIcon" alt="" class="h-6 w-6" data-test="event-details-fan-session-cost-original-icon" />
                <div class="text-center text-gray-500 text-sm font-medium line-through leading-5" data-test="event-details-fan-session-cost-original">{{ formatTokens(adjustment.originalTokens) }}</div>
              </div>
              <img :src="PriceArrowIcon" alt="" class="h-6 w-6" data-test="event-details-fan-session-cost-arrow" />
              <div class="flex justify-start items-center gap-1">
                <img :src="TokenIcon" alt="" class="h-6 w-6" data-test="event-details-fan-session-cost-proposed-icon" />
                <div class="text-center text-gray-900 text-sm font-semibold leading-5" data-test="event-details-fan-session-cost-proposed">{{ formatTokens(adjustment.proposedTokens) }}</div>
              </div>
            </div>
            <div v-else-if="hasAmount(sessionCost)" class="inline-flex justify-start items-center gap-1" data-test="event-details-fan-session-cost-standard">
              <img :src="TokenIcon" alt="" class="h-6 w-6" data-test="event-details-fan-session-cost-icon" />
              <div class="text-center text-gray-900 text-sm font-semibold leading-5" data-test="event-details-fan-session-cost-value">{{ formatTokens(sessionCost) }}</div>
            </div>
            <div v-else class="text-gray-900 text-sm font-normal leading-5" data-test="event-details-fan-session-cost-missing">{{ t('calendar_event_not_set') }}</div>
          </div>
          <div v-if="positiveAmount(cancellationFee)" class="min-w-[8rem] flex flex-col items-start gap-2" data-test="booking-details-cancellation-fee">
            <span class="text-gray-900 text-sm font-semibold leading-5">{{ t('booking_adjustment_cancellation_fee') }}</span>
            <span class="inline-flex items-center gap-1 text-gray-900 text-sm font-semibold leading-5"><img :src="TokenIcon" alt="" class="h-6 w-6" />{{ formatTokens(cancellationFee) }}</span>
          </div>
          <div v-if="positiveAmount(bookingFee)" class="min-w-[8rem] flex flex-col items-start gap-2" data-test="booking-details-booking-fee">
            <span class="text-gray-900 text-sm font-semibold leading-5">{{ t('booking_adjustment_booking_fee') }}</span>
            <span class="inline-flex items-center gap-1 text-gray-900 text-sm font-semibold leading-5"><img :src="TokenIcon" alt="" class="h-6 w-6" />{{ formatTokens(bookingFee) }}</span>
          </div>
        </div>
      </div>
    </template>

    <div class="self-stretch inline-flex justify-start items-center gap-4">
      <div data-svg-wrapper class="relative size-6 shrink-0 overflow-hidden">
        <img :src="compact ? CompactReminderIcon : ReminderIcon" alt="" class="size-6" :class="compact ? '' : 'filter grayscale brightness-75 opacity-100'" />
      </div>
      <div class="flex justify-start items-center gap-2"><div class="justify-center text-gray-900 text-sm font-normal leading-5">{{ reminderText }}</div></div>
    </div>
  </div>
</template>

<script setup>
import { useBookingTranslations } from '@/i18n/bookingTranslations.js';
import TokenIcon from '@/assets/images/icons/token-02.webp';
import PriceArrowIcon from '@/assets/images/icons/arrow-right-orange.svg';
import VerifiedBlueTickIcon from '@/assets/images/icons/verified-tick-blue.svg';
import ProfileIcon from '@/assets/images/icons/profile.webp';
import RequestsIcon from '@/assets/images/icons/dotpoints.png';
import CostIcon from '@/assets/images/icons/dollar.png';
import ReminderIcon from '@/assets/images/icons/bell-1.webp';
import ChatBlueIcon from '@/assets/images/icons/message-text-square-blue.svg';
import ArrowUpRightBlueIcon from '@/assets/images/icons/arrow-up-right-blue.svg';
import CompactClockIcon from '@/assets/images/icons/booking-compact-clock.svg';
import CompactUserIcon from '@/assets/images/icons/booking-compact-user.svg';
import CompactRequestsIcon from '@/assets/images/icons/booking-compact-requests.svg';
import CompactCostIcon from '@/assets/images/icons/booking-compact-cost.svg';
import CompactReminderIcon from '@/assets/images/icons/booking-compact-reminder.svg';

defineOptions({ name: 'BookingDetailsInformation' });

const props = defineProps({
  compact: { type: Boolean, default: false },
  formattedDate: { type: String, default: '' },
  formattedTimeRange: { type: String, default: '' },
  counterpartyName: { type: String, default: '' },
  counterpartyFallback: { type: String, default: '' },
  counterpartyAvatar: { type: String, default: '' },
  counterpartyVerified: { type: Boolean, default: false },
  canOpenChat: { type: Boolean, default: false },
  chatPayload: { type: Object, default: () => ({}) },
  additionalRequestLines: { type: Array, default: () => [] },
  sessionCost: { type: [Number, String], default: null },
  cancellationFee: { type: [Number, String], default: null },
  bookingFee: { type: [Number, String], default: null },
  pendingPriceAdjustment: { type: Boolean, default: false },
  adjustment: { type: Object, default: () => ({}) },
  reminderText: { type: String, default: '' },
});

const emit = defineEmits(['open-chat']);
const { t, locale } = useBookingTranslations();

function numericAmount(value) {
  if (value === '' || value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function hasAmount(value) {
  return numericAmount(value) != null;
}

function positiveAmount(value) {
  return (numericAmount(value) ?? 0) > 0;
}

function formatTokens(value) {
  const amount = numericAmount(value);
  return amount == null ? t('calendar_event_not_set') : new Intl.NumberFormat(locale.value).format(amount);
}
</script>
