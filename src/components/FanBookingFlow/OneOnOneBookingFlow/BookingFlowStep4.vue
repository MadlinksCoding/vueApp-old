<script setup>
import { computed, onMounted } from 'vue';
import {
  bookingFlowBackgroundImage,
  bookingFlowCrossWhiteIcon,
  bookingFlowPendingIcon,
  bookingFlowSuccessIcon,
  bookingFlowVerifiedIcon,
  bookingFlowMessageGreenIconv2,
} from './oneOnOneBookingFlowAssets.js';
import { resolveCreatorPresentation } from './creatorPresentation.js';
import { useEventBackgroundImage } from './useEventBackgroundImage.js';
import { useBookingTranslations } from '@/i18n/bookingTranslations.js';
import { requestFanBookingOpenChat } from '@/embeds/fanBooking/bridge.js';

const props = defineProps({
  engine: {
    type: Object,
    required: true,
  },
  embedded: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close-popup']);
const { t, locale } = useBookingTranslations();
// Order details are intentionally unavailable until bookings expose a real order contract.
const showOrderDetails = false;

const bookingData = computed(() => props.engine.getState('bookingDetails') || {});
const selectedEvent = computed(() => props.engine.getState('fanBooking.context.selectedEvent') || {});
const bookingResult = computed(() => props.engine.getState('fanBooking.booking.result') || {});
const bookingItem = computed(() => bookingResult.value?.item || {});
const creatorPresentation = computed(() => resolveCreatorPresentation({
  explicitCreatorData: props.engine.getState('fanBooking.context.creatorPresentation'),
  selectedEvent: selectedEvent.value,
  bookingResult: bookingResult.value,
}));
const { resolvedBackgroundImageUrl } = useEventBackgroundImage(selectedEvent, bookingFlowBackgroundImage);

function normalizeText(value) {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function formatNumber(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '0';
  return numeric.toLocaleString(locale.value);
}

const formattedDate = computed(() => normalizeText(
  bookingData.value.headerDateDisplay || bookingData.value.selectedDateDisplay,
) || '-');
const timeRange = computed(() => normalizeText(bookingData.value.formattedTimeRange) || '-');
const durationMinutes = computed(() => {
  const numeric = Number(bookingData.value.selectedDuration?.value);
  return Number.isFinite(numeric) && numeric > 0 ? Math.round(numeric) : 0;
});
const durationDisplay = computed(() => (
  durationMinutes.value > 0
    ? t('fan_booking_duration_minutes_short', { minutes: formatNumber(durationMinutes.value) })
    : ''
));
const totalPrice = computed(() => {
  const paymentTotalValue = bookingItem.value?.payment?.total;
  const bookingPaymentTotal = Number(paymentTotalValue);
  if (
    paymentTotalValue !== null
    && paymentTotalValue !== undefined
    && String(paymentTotalValue).trim() !== ''
    && Number.isFinite(bookingPaymentTotal)
    && bookingPaymentTotal >= 0
  ) return bookingPaymentTotal;
  const fallbackTotal = Number(bookingData.value.finalTotalPrice ?? bookingData.value.totalPrice ?? 0);
  return Number.isFinite(fallbackTotal) && fallbackTotal >= 0 ? fallbackTotal : 0;
});
const totalPriceDisplay = computed(() => formatNumber(totalPrice.value));
const firstTimeDiscountAmount = computed(() => {
  const numeric = Number(bookingData.value.firstTimeDiscountAmount || 0);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
});
const firstTimeDiscountDisplay = computed(() => formatNumber(firstTimeDiscountAmount.value));

const eventTitle = computed(() => (
  bookingItem.value?.eventSnapshot?.title
  || selectedEvent.value?.title
  || t('fan_booking_untitled_event')
));

const creatorLabel = computed(() => normalizeText(creatorPresentation.value.name) || t('common_creator'));

const creatorChatId = computed(() =>
  props.engine.getState('fanBooking.booking.chatId')
  || bookingItem.value?.meta?.chatId
  || null
)
const creatorUserId = computed(() =>
  selectedEvent.value?.creatorId
  ?? selectedEvent.value?.raw?.creatorId
  ?? props.engine.getState('fanBooking.context.creatorId')
  ?? null
);
const canMessageCreator = computed(() => Boolean(creatorChatId.value || creatorUserId.value));

function handleViewCalendar() {
  window.open('/dashboard/events', '_top')
}

function handleMessageCreator() {
  if (!canMessageCreator.value) return;
  requestFanBookingOpenChat({
    chatId: creatorChatId.value || undefined,
    userId: creatorUserId.value ? String(creatorUserId.value) : undefined,
  })
  emit('close-popup');
}

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

const eventSource = computed(() => selectedEvent.value?.raw || {});
const isGroupEvent = computed(() => {
  const type = String(
    selectedEvent.value?.type
    || selectedEvent.value?.eventType
    || eventSource.value?.type
    || eventSource.value?.eventType
    || '',
  ).toLowerCase();
  return type === 'group-event' || type === 'group';
});
const isEventGoalGroup = computed(() => (
  isGroupEvent.value
  && String(selectedEvent.value?.priceSetting || eventSource.value?.priceSetting || '').toLowerCase() === 'eventgoal'
));
const eventMediaLabel = computed(() => (
  String(selectedEvent.value?.eventCallType || eventSource.value?.eventCallType || '').toLowerCase() === 'audio'
    ? t('fan_booking_audio')
    : t('fan_booking_video')
));
const eventTypeLabel = computed(() => (
  isGroupEvent.value
    ? t('fan_booking_group_call_type', { media: eventMediaLabel.value })
    : t('fan_booking_one_on_one_call_type', { media: eventMediaLabel.value })
));

const approvalStatus = computed(() => String(bookingItem.value?.approvalStatus || '').toLowerCase());
const instantFromEvent = computed(() => toBoolean(
  selectedEvent.value?.allowInstantBooking
  ?? selectedEvent.value?.raw?.allowInstantBooking,
  false,
));
const isInstantConfirmed = computed(() => (
  isGroupEvent.value
  || approvalStatus.value === 'auto'
  || approvalStatus.value === 'manual_approved'
  || (!approvalStatus.value && instantFromEvent.value)
));
const approvalLabel = computed(() => (
  isInstantConfirmed.value ? t('fan_booking_instant_approval') : t('fan_booking_approval_required')
));
const statusIcon = computed(() => (
  isInstantConfirmed.value ? bookingFlowSuccessIcon : bookingFlowPendingIcon
));
const topTitle = computed(() => (
  isInstantConfirmed.value
    ? t('fan_booking_confirmed_with_creator', { creator: creatorLabel.value })
    : t('fan_booking_request_sent_to_creator', { creator: creatorLabel.value })
));
const topMessage = computed(() => (
  isInstantConfirmed.value
    ? t('fan_booking_confirmed_message')
    : t('fan_booking_pending_message')
));

const policyTitle = computed(() => (
  isGroupEvent.value ? t('fan_booking_group_event_policy_title') : t('fan_booking_booking_policy')
));
const policyItems = computed(() => {
  if (isGroupEvent.value) {
    const items = [t('fan_booking_group_policy_hold_contribution')];
    if (isEventGoalGroup.value) items.push(t('fan_booking_group_policy_goal_not_reached'));
    items.push(
      t('fan_booking_group_policy_host_late', { creator: creatorLabel.value }),
      t('fan_booking_group_policy_coperformer_late'),
    );
    return items;
  }

  return [
    t('fan_booking_policy_hold_fee'),
    t('fan_booking_policy_creator_late_partial', { creator: creatorLabel.value }),
    t('fan_booking_policy_creator_late_full', { creator: creatorLabel.value }),
    t('fan_booking_policy_fan_late'),
  ];
});

const successBackgroundStyle = computed(() => ({
  backgroundImage: `linear-gradient(180deg, rgba(12, 17, 29, 0) 25%, #0C111D 100%), url('${resolvedBackgroundImageUrl.value}')`,
  backgroundPosition: 'center',
  backgroundSize: 'cover',
  backgroundRepeat: 'no-repeat',
}));

onMounted(() => {
  const hasBooking = Boolean(
    props.engine.getState('fanBooking.booking.bookingId')
    || props.engine.getState('fanBooking.booking.result.bookingId')
    || props.engine.getState('fanBooking.booking.result.item.bookingId'),
  );

  if (!hasBooking) {
    props.engine.goToStep(3);
  }
});
</script>

<template>
  <!-- overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] -->
  <div class="relative w-full h-full md:h-auto md:max-w-[57.563rem] min-h-0 md:rounded-[24px] h-dvh">

      <div class="md:rounded-[24px] flex flex-col h-dvh md:h-auto relative" :style="successBackgroundStyle">
        <div class="absolute inset-0 bg-black/50 md:rounded-[24px] md:hidden"></div>

          <div class="w-full md:rounded-[24px] flex-1 bg-[#0C111D]/20 md:bg-[#0C111D]/75 backdrop-blur-[5px] flex justify-center items-stretch">
            <!-- Left part -->
            <div class="p-3 md:px-6 md:pb-6 md:pt-12 md:rounded-tl-[24px] md:rounded-bl-[24px] flex flex-col gap-10 md:max-w-[25.5rem] flex-1 bg-transparent md:bg-[linear-gradient(0deg,rgba(34,204,238,0.2)_0%,rgba(34,204,238,0.2)_100%)]">
              <div class="flex flex-col justify-center items-center gap-6" data-testid="step4-status">
                <img class="w-36 h-36" :src="statusIcon" alt="" data-testid="step4-status-icon" />
                <div class="flex flex-col justify-start items-start gap-2">
                  <div class="text-center justify-center text-white text-xl md:text-2xl font-semibold" data-testid="step4-status-title">{{ topTitle }}</div>
                  <div class="text-center justify-center text-white text-sm md:text-base font-normal" data-testid="step4-status-message">{{ topMessage }}</div>
                  <div v-if="showOrderDetails" class="text-center justify-center text-white text-sm md:text-base font-normal">In the mean time, you can track progress of your mandatory purchase in order page.</div>
                </div>
              </div>
              <!-- mandatory Purchase -->
              <div v-if="showOrderDetails" class="w-full flex md:hidden px-0">
                <div class="flex w-full items-center rounded-[0.625rem] bg--gd--blue-51-251 overflow-hidden">
                  <div class="w-[3.5rem] h-full aspect-square overflow-hidden bg-white">
                    <img src="https://i.ibb.co/d0B63B18/image.png" alt="" class="w-full h-full object-cover">
                  </div>
                  <div class="flex p-[0.5rem] flex-col items-start gap-2 flex-1">
                    <div class="flex items-center gap-2 self-stretch justify-between">
                      <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-white text-[0.875rem] font-semibold leading-[1.25rem] max-w-[19ch]">Worn Socks (3 days)</span>
                      <span class="text-[#FCE40D] text-shadow-[0_0_10px_rgba(0,0,0,0.1)] font-poppins text-[0.875rem] font-semibold leading-[1.25rem]">USD$25 <span class="font-normal">$50</span></span>
                    </div>
                    <div class="w-full flex items-center justify-between gap-2">
                      <div class="flex items-center gap-1">
                        <span class="w-3 h-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
  <path d="M10 3L4.5 8.5L2 6" stroke="#07F468" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
                        </span>
                        <span class="text-[#07F468] text-[0.75rem] font-medium leading-[1.125rem] whitespace-nowrap">PURCHASED</span>
                      </div>
                      <div class="flex items-center gap-1">
                        <a href="#" target="_blank" rel="noopener noreferrer" class="flex items-center gap-1">
                          <span class="text-[#EAECF0] text-[0.75rem] font-medium leading-[1.125rem]">VIEW ORDER DETAIL</span>
                          <span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
<path d="M3.5 8.5L8.5 3.5M8.5 8.5V3.5H3.5" stroke="#EAECF0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
                          </span>
                        </a>
                      </div>
                    </div>
                </div>
                </div>
              </div>
              <!-- /Mandatory Purchase -->
              <div class="w-full hidden md:flex flex-col justify-start items-center gap-4">
                <!-- Nay Temp hide this one: -->
                <div v-if="canMessageCreator" class="self-stretch h-10 min-w-24 pl-2 pr-6 py-2 bg-[#0C111D] inline-flex justify-center items-center gap-2 cursor-pointer" data-testid="step4-message-action-desktop" @click="handleMessageCreator">
                  <div class="w-6 h-6 relative overflow-hidden">
                    <img :src="bookingFlowMessageGreenIconv2" alt="message-icon" />
                  </div>
                  <div class="text-center justify-start text-[#07F468] text-base font-medium leading-6">{{ t("fan_booking_message_creator", { creator: creatorLabel }) }}</div>
                </div>
                <div
                  v-if="isInstantConfirmed"
                  class="self-stretch h-10 min-w-24 px-4 py-2 bg-[#07F468] inline-flex justify-center items-center gap-2 cursor-pointer rounded-sm mb-6"
                  data-testid="step4-calendar-action-desktop"
                  @click="handleViewCalendar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M21 10H3M16 2V6M8 2V6M7.8 22H16.2C17.8802 22 18.7202 22 19.362 21.673C19.9265 21.3854 20.3854 20.9265 20.673 20.362C21 19.7202 21 18.8802 21 17.2V8.8C21 7.11984 21 6.27976 20.673 5.63803C20.3854 5.07354 19.9265 4.6146 19.362 4.32698C18.7202 4 17.8802 4 16.2 4H7.8C6.11984 4 5.27976 4 4.63803 4.32698C4.07354 4.6146 3.6146 5.07354 3.32698 5.63803C3 6.27976 3 7.11984 3 8.8V17.2C3 18.8802 3 19.7202 3.32698 20.362C3.6146 20.9265 4.07354 21.3854 4.63803 21.673C5.27976 22 6.11984 22 7.8 22Z" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <div class="text-center text-gray-900 text-base font-medium leading-6">{{ t("fan_booking_view_events_on_calendar") }}</div>
                </div>
                <!-- view order detail -->
                <div v-if="showOrderDetails" class="self-stretch h-10 min-w-24 pl-2 pr-6 py-2 bg-[#22CCEE] inline-flex justify-center items-center gap-2 cursor-pointer">
                  <div class="w-6 h-6 relative overflow-hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M14 2.26953V6.40007C14 6.96012 14 7.24015 14.109 7.45406C14.2049 7.64222 14.3578 7.7952 14.546 7.89108C14.7599 8.00007 15.0399 8.00007 15.6 8.00007H19.7305M16 13H8M16 17H8M10 9H8M14 2H8.8C7.11984 2 6.27976 2 5.63803 2.32698C5.07354 2.6146 4.6146 3.07354 4.32698 3.63803C4 4.27976 4 5.11984 4 6.8V17.2C4 18.8802 4 19.7202 4.32698 20.362C4.6146 20.9265 5.07354 21.3854 5.63803 21.673C6.27976 22 7.11984 22 8.8 22H15.2C16.8802 22 17.7202 22 18.362 21.673C18.9265 21.3854 19.3854 20.9265 19.673 20.362C20 19.7202 20 18.8802 20 17.2V8L14 2Z" stroke="#0C111D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                  </div>
                  <div class="text-center justify-start text-[#0C111D] text-base font-medium leading-6">View order detail</div>
                </div>
                <!-- /view order detail -->
              </div>
            </div>
            <!-- /Left part -->

            <!-- Right part -->
            <div class="flex-1 hidden md:flex flex-col p-6 rounded-r-[1.5rem] bg-[rgba(12,17,29,0.75)] h-auto items-start gap-6" data-testid="step4-summary-desktop">
              <!-- Info -->
              <div class="flex flex-col items-start gap-2 self-stretch">
                <div class="flex items-center gap-2">
                  <div class="flex py-[0.25rem] px-[0.375rem] justify-center items-center gap-[0.625rem] rounded-[0.375rem] bg-[#22CCEE]">
                    <span class="text-[#0C111D] text-[0.875rem] font-bold leading-[1.25rem]" data-testid="step4-event-type-desktop">{{ eventTypeLabel }}</span>
                  </div>
                  <div class="flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M17.5 8.33268H2.5M13.3333 1.66602V4.99935M6.66667 1.66602V4.99935M7.5 13.3327L9.16667 14.9993L12.9167 11.2493M6.5 18.3327H13.5C14.9001 18.3327 15.6002 18.3327 16.135 18.0602C16.6054 17.8205 16.9878 17.4381 17.2275 16.9677C17.5 16.4329 17.5 15.7328 17.5 14.3327V7.33268C17.5 5.93255 17.5 5.23249 17.2275 4.69771C16.9878 4.2273 16.6054 3.84485 16.135 3.60517C15.6002 3.33268 14.9001 3.33268 13.5 3.33268H6.5C5.09987 3.33268 4.3998 3.33268 3.86502 3.60517C3.39462 3.84485 3.01217 4.2273 2.77248 4.69771C2.5 5.23249 2.5 5.93255 2.5 7.33268V14.3327C2.5 15.7328 2.5 16.4329 2.77248 16.9677C3.01217 17.4381 3.39462 17.8205 3.86502 18.0602C4.3998 18.3327 5.09987 18.3327 6.5 18.3327Z" stroke="#07F468" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <span class="text-[#07F468] text-[0.875rem] font-normal leading-[1.25rem]" data-testid="step4-approval-desktop">{{ approvalLabel }}</span>
                  </div>
                </div>
                <h1 class="line-clamp-2 self-stretch text-[#F2F4F7] font-poppins text-[1.875rem] font-semibold leading-[2.375rem]" data-testid="step4-event-title-desktop">{{ eventTitle }}</h1>
                <!-- Model display -->
                <div class="flex flex-row items-center gap-2">
                  <div class="w-6 h-6 flex justify-center items-center">
                    <img :src="creatorPresentation.avatar" alt="" class="w-full h-full object-cover" style="border-radius: 50% / 60% 60% 40% 40%;">
                  </div>
                  <div class="flex flex-row items-center gap-1">
                    <p class="text-xs font-medium leading-[18px] text-white" data-testid="step4-creator-desktop">{{ creatorLabel }}</p>
                    <div v-if="creatorPresentation.isVerified" class="w-4 h-4 flex justify-center items-center">
                      <img :src="bookingFlowVerifiedIcon" alt="">
                    </div>
                  </div>
                </div>
                <!-- /Model display -->

                <!-- Date and Time -->
                <div class="flex flex-col gap-2 px-3 lg:px-0">
                  <span class="text-white text-2xl font-medium" data-testid="step4-date-desktop">{{ formattedDate }}</span>
                  <div class="flex items-center gap-2">
                    <span class="text-white text-2xl font-medium" data-testid="step4-time-desktop">{{ timeRange }}</span>
                    <span v-if="durationDisplay" class="text-[#98A2B3] text-base font-medium" data-testid="step4-duration-desktop">{{ durationDisplay }}</span>
                  </div>
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-sm font-medium leading-5 text-[#EAECF0]" data-testid="step4-total-desktop">
                    {{ t('fan_booking_total_tokens', { tokens: totalPriceDisplay }) }}
                  </span>
                  <span v-if="firstTimeDiscountAmount > 0" class="text-xs font-medium leading-5 text-[#07F468]" data-testid="step4-discount-desktop">
                    {{ t('fan_booking_first_time_discount_saved', { tokens: firstTimeDiscountDisplay }) }}
                  </span>
                </div>
                <!-- /Date and Time -->
              </div>
              <!-- /Info -->
              <!-- mandatory Purchase -->
              <div v-if="showOrderDetails" class="w-full flex px-3 lg:px-0">
                <div class="flex w-full items-center rounded-[0.625rem] bg--gd--blue-51-251 overflow-hidden">
                  <div class="w-[3.5rem] h-full aspect-square overflow-hidden bg-white">
                    <img src="https://i.ibb.co/d0B63B18/image.png" alt="" class="w-full h-full object-cover">
                  </div>
                  <div class="flex p-[0.5rem] flex-col items-start gap-2 flex-1">
                    <div class="flex items-center gap-2 self-stretch justify-between">
                      <span class="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-white text-[0.875rem] font-semibold leading-[1.25rem] max-w-[19ch]">Worn Socks (3 days)</span>
                      <span class="text-[#FCE40D] text-shadow-[0_0_10px_rgba(0,0,0,0.1)] font-poppins text-[0.875rem] font-semibold leading-[1.25rem]">USD$25 <span class="font-normal">$50</span></span>
                    </div>
                    <div class="w-full flex items-center justify-between gap-2">
                      <div class="flex items-center gap-1">
                        <span class="w-3 h-3">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
  <path d="M10 3L4.5 8.5L2 6" stroke="#07F468" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
                        </span>
                        <span class="text-[#07F468] text-[0.75rem] font-medium leading-[1.125rem] whitespace-nowrap">PURCHASED</span>
                      </div>
                      <div class="flex items-center gap-1">
                        <a href="#" target="_blank" rel="noopener noreferrer" class="flex items-center gap-1">
                          <span class="text-[#EAECF0] text-[0.75rem] font-medium leading-[1.125rem]">VIEW ORDER DETAIL</span>
                          <span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12" fill="none">
<path d="M3.5 8.5L8.5 3.5M8.5 8.5V3.5H3.5" stroke="#EAECF0" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
                          </span>
                        </a>
                      </div>
                    </div>
                </div>
                </div>
              </div>
              <!-- /Mandatory Purchase -->

              <!-- Booking Policy -->
              <div class="flex flex-col w-full gap-1 md:gap-3 px-3 pb-2 md:p-0 lg:p-0" data-testid="step4-policy">
                <div class="flex gap-1 md:gap-2 items-center justify-between">
                  <h3 class="text-sm font-medium text-[#2CE] leading-5">{{ policyTitle }}</h3>
                </div>
                <div
                  class="flex-col gap-1 md:gap-3"
                >
                  <ul class="text-sm font-normal pl-1 text-[#98A2B3] w-full list-outside wrap leading-5">
                    <li v-for="item in policyItems" :key="item" class="flex items-start gap-2" data-testid="step4-policy-item">
                      <span class="flex-none w-1 h-1 bg-[#98A2B3] rounded-full mt-2"></span>
                      <span>{{ item }}</span>
                    </li>
                  </ul>
                </div>
              </div>
              <!-- /Booking policy -->
            </div>
            <!-- /Right part -->
          </div>

          <div class="flex-1 w-full p-4 md:rounded-bl-[10px] md:rounded-br-[10px] backdrop-blur-[5px] flex md:hidden flex-col justify-between items-start" data-testid="step4-summary-mobile" style="background: linear-gradient(0deg, rgba(34, 204, 238, 0.20) 0%, rgba(34, 204, 238, 0.20) 100%), rgba(12, 17, 29, 0.20);
">
            <div class="flex flex-col justify-center items-center gap-2 w-full flex-1">
              <div class="flex flex-col justify-start items-center gap-4">
                <div class="flex flex-col justify-start items-center gap-2 w-full">
                  <div class="flex items-center gap-2">
                    <span class="rounded-md bg-[#22CCEE] px-1.5 py-1 text-sm font-bold leading-5 text-[#0C111D]" data-testid="step4-event-type-mobile">{{ eventTypeLabel }}</span>
                    <span class="text-sm font-normal leading-5 text-[#07F468]" data-testid="step4-approval-mobile">{{ approvalLabel }}</span>
                  </div>
                  <div class="inline-flex justify-center items-center gap-2">
                    <div class="size-9 relative">
                      <div data-svg-wrapper="" class="left-[0.24px] top-[2.18px] absolute overflow-hidden rounded-[40%_60%_55%_45%/55%_45%_60%_40%]">
                        <img class="w-9 h-9 object-cover" :src="creatorPresentation.avatar" alt="" />
                      </div>
                    </div>
                    <div class="flex justify-start items-center gap-1">
                      <div class="justify-start text-white text-sm font-medium leading-5 line-clamp-1" data-testid="step4-creator-mobile">{{ creatorLabel }}</div>
                      <div v-if="creatorPresentation.isVerified" data-size="sm" class="w-3 h-3 relative overflow-hidden">
                        <img :src="bookingFlowVerifiedIcon" alt="">
                      </div>
                    </div>
                  </div>
                  <div class="w-full flex flex-col gap-5">
                    <div class="text-center w-full text-gray-100 text-xl font-semibold" data-testid="step4-event-title-mobile">{{ eventTitle }}</div>
                    <div class="flex flex-col justify-center items-center">
                      <div class="justify-center text-white text-base font-medium" data-testid="step4-date-mobile">
                        {{ formattedDate }}
                      </div>
                      <div class="inline-flex justify-start items-start gap-2">
                        <div class="justify-center text-white text-base font-medium" data-testid="step4-time-mobile">
                          {{ timeRange }}
                        </div>
                        <div v-if="durationDisplay" class="justify-end text-gray-400 text-base font-normal" data-testid="step4-duration-mobile">
                          {{ durationDisplay }}
                        </div>
                      </div>
                    </div>
                    <div class="flex flex-col items-center gap-1">
                      <div class="text-sm font-medium leading-5 text-[#EAECF0]" data-testid="step4-total-mobile">
                        {{ t("fan_booking_total_tokens", { tokens: totalPriceDisplay }) }}
                      </div>
                      <div v-if="firstTimeDiscountAmount > 0" class="text-xs font-medium leading-5 text-[#07F468]" data-testid="step4-discount-mobile">
                        {{ t("fan_booking_first_time_discount_saved", { tokens: firstTimeDiscountDisplay }) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="w-full flex md:hidden flex-col justify-start items-center gap-4">
                <!-- Nay Temp hide this one: -->
                <div v-if="canMessageCreator" class="self-stretch h-10 min-w-24 pl-2 pr-6 py-2 bg-[#0C111D] inline-flex justify-center items-center gap-2 cursor-pointer" data-testid="step4-message-action-mobile" @click="handleMessageCreator">
                  <div class="w-6 h-6 relative overflow-hidden">
                    <img :src="bookingFlowMessageGreenIconv2" alt="message-icon" />
                  </div>
                  <div class="text-center justify-start text-[#07F468] text-base font-medium leading-6">{{ t("fan_booking_message_creator", { creator: creatorLabel }) }}</div>
                </div>
                <div
                  v-if="isInstantConfirmed"
                  class="self-stretch h-10 min-w-24 px-4 py-2 bg-[#07F468] inline-flex justify-center items-center gap-2 cursor-pointer rounded-sm mb-6"
                  data-testid="step4-calendar-action-mobile"
                  @click="handleViewCalendar"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M21 10H3M16 2V6M8 2V6M7.8 22H16.2C17.8802 22 18.7202 22 19.362 21.673C19.9265 21.3854 20.3854 20.9265 20.673 20.362C21 19.7202 21 18.8802 21 17.2V8.8C21 7.11984 21 6.27976 20.673 5.63803C20.3854 5.07354 19.9265 4.6146 19.362 4.32698C18.7202 4 17.8802 4 16.2 4H7.8C6.11984 4 5.27976 4 4.63803 4.32698C4.07354 4.6146 3.6146 5.07354 3.32698 5.63803C3 6.27976 3 7.11984 3 8.8V17.2C3 18.8802 3 19.7202 3.32698 20.362C3.6146 20.9265 4.07354 21.3854 4.63803 21.673C5.27976 22 6.11984 22 7.8 22Z" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <div class="text-center text-gray-900 text-base font-medium leading-6">{{ t("fan_booking_view_events_on_calendar") }}</div>
                </div>
                <!-- view order detail -->
                <div v-if="showOrderDetails" class="self-stretch h-10 min-w-24 pl-2 pr-6 py-2 bg-[#22CCEE] inline-flex justify-center items-center gap-2 cursor-pointer">
                  <div class="w-6 h-6 relative overflow-hidden">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M14 2.26953V6.40007C14 6.96012 14 7.24015 14.109 7.45406C14.2049 7.64222 14.3578 7.7952 14.546 7.89108C14.7599 8.00007 15.0399 8.00007 15.6 8.00007H19.7305M16 13H8M16 17H8M10 9H8M14 2H8.8C7.11984 2 6.27976 2 5.63803 2.32698C5.07354 2.6146 4.6146 3.07354 4.32698 3.63803C4 4.27976 4 5.11984 4 6.8V17.2C4 18.8802 4 19.7202 4.32698 20.362C4.6146 20.9265 5.07354 21.3854 5.63803 21.673C6.27976 22 7.11984 22 8.8 22H15.2C16.8802 22 17.7202 22 18.362 21.673C18.9265 21.3854 19.3854 20.9265 19.673 20.362C20 19.7202 20 18.8802 20 17.2V8L14 2Z" stroke="#0C111D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                  </div>
                  <div class="text-center justify-start text-[#0C111D] text-base font-medium leading-6">View order detail</div>
                </div>
                <!-- /view order detail -->
              </div>
          </div>
      </div>


      <div
        @click="emit('close-popup')"
        data-test="booking-flow-step4-close-button"
        class="absolute top-2 right-[2px] md:-top-4 md:-right-3 z-99 p-[8px] flex justify-center items-center bg-black/30 rounded-[50px] backdrop-blur-[10px] cursor-pointer"
      >
        <img :src="bookingFlowCrossWhiteIcon" :alt="t('fan_booking_close_popup')" class="w-4 h-4" />
      </div>

    </div>
</template>
