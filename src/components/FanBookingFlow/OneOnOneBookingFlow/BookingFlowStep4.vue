<script setup>
import { computed, onMounted } from 'vue';
import {
  bookingFlowBackgroundImage,
  bookingFlowCrossWhiteIcon,
  bookingFlowMessageGreenIcon,
  bookingFlowPendingIcon,
  bookingFlowVerifiedIcon,
} from './oneOnOneBookingFlowAssets.js';
import { resolveCreatorPresentation } from './creatorPresentation.js';
import { useEventBackgroundImage } from './useEventBackgroundImage.js';
import { useBookingTranslations } from '@/i18n/bookingTranslations.js';

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
const { t } = useBookingTranslations();

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

const formattedDate = computed(() => bookingData.value.headerDateDisplay || '-');
const timeRange = computed(() => bookingData.value.formattedTimeRange || '-');
const duration = computed(() => bookingData.value.selectedDuration?.value || '15');
const totalPrice = computed(() => Number(bookingData.value.totalPrice || 0));
const firstTimeDiscountAmount = computed(() => Number(bookingData.value.firstTimeDiscountAmount || 0));

const eventTitle = computed(() => (
  bookingItem.value?.eventSnapshot?.title
  || selectedEvent.value?.title
  || t('fan_booking_untitled_event')
));

const creatorLabel = computed(() => creatorPresentation.value.name);

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

const approvalStatus = computed(() => bookingItem.value?.approvalStatus || 'manual_required');
const instantFromEvent = computed(() => toBoolean(
  selectedEvent.value?.allowInstantBooking
  ?? selectedEvent.value?.raw?.allowInstantBooking,
  false,
));
const isInstantConfirmed = computed(() => approvalStatus.value === 'auto' || instantFromEvent.value);
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
  <div class="relative w-full h-full md:h-auto max-w-[27rem] min-h-0 md:rounded-[10px] ">

      <div class="backdrop-blur-[1rem] md:rounded-[10px] h-full md:h-auto flex flex-col" :style="successBackgroundStyle">

          <div class="flex-1 p-6 bg-[#00000080] backdrop-blur-[10px] flex flex-col justify-center items-center gap-6 md:rounded-tl-[10px] md:rounded-tr-[10px]">
            <div class="flex flex-col justify-center items-center gap-6">
              <img class="w-36 h-36" :src="bookingFlowPendingIcon" alt="" />
              <div class="flex flex-col justify-start items-start gap-2">
                <div class="text-center justify-center text-white text-2xl font-semibold leading-8">{{ topTitle }}</div>
                <div class="text-center justify-center text-white text-base font-normal leading-6">{{ topMessage }}</div>
              </div>
            </div>
          </div>

          <div class="flex-1 w-full p-4 bg-cyan-400/20 md:rounded-bl-[10px] md:rounded-br-[10px] backdrop-blur-[5px] flex flex-col justify-between items-start">
            <div class="flex flex-col justify-start items-center gap-2 w-full">
              <div class="flex flex-col justify-start items-center gap-4">
                <div class="flex flex-col justify-start items-center gap-2 w-full">
                  <div class="inline-flex justify-center items-center gap-2">
                    <img class="w-8 h-8" :src="creatorPresentation.avatar" alt="" />
                    <div class="flex justify-start items-center gap-1">
                      <div class="justify-start text-white text-sm font-medium leading-5 line-clamp-1">{{ creatorLabel }}</div>
                      <div v-if="creatorPresentation.isVerified" data-size="sm" class="w-3 h-3 relative overflow-hidden">
                        <img :src="bookingFlowVerifiedIcon" alt="">
                      </div>
                    </div>
                  </div>
                  <div class="w-full flex flex-col gap-5">
                    <div class="text-center w-full text-gray-100 text-2xl font-semibold leading-9">{{ eventTitle }}</div>
                    <div class="flex flex-col justify-center items-center">
                      <div class="justify-center text-white text-2xl font-medium leading-8">
                        {{ formattedDate }}
                      </div>
                      <div class="inline-flex justify-start items-start gap-2">
                        <div class="justify-center text-white text-2xl font-medium leading-8">
                          {{ timeRange }}
                        </div>
                        <div class="justify-end text-gray-400 text-lg font-normal leading-7">
                          {{ duration }} min.
                        </div>
                      </div>
                    </div>
                    <div class="flex flex-col items-center gap-1">
                      <div class="text-sm font-medium leading-5 text-[#EAECF0]">
                        {{ t("fan_booking_total_tokens", { tokens: totalPrice }) }}
                      </div>
                      <div v-if="firstTimeDiscountAmount > 0" class="text-xs font-medium leading-5 text-[#07F468]">
                        {{ t("fan_booking_first_time_discount_saved", { tokens: firstTimeDiscountAmount }) }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div class="w-full flex flex-col justify-start items-center gap-2 mt-[50px]">
              <div class="self-stretch h-10 min-w-24 pl-2 pr-6 py-2 bg-gray-900 inline-flex justify-center items-center gap-2 cursor-pointer">
                <div class="w-6 h-6 relative overflow-hidden">
                  <img :src="bookingFlowMessageGreenIcon" alt="message-icon" />
                </div>
                <div class="text-center justify-start text-green-500 text-base font-medium leading-6">{{ t("fan_booking_message_creator", { creator: creatorLabel }) }}</div>
              </div>
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
