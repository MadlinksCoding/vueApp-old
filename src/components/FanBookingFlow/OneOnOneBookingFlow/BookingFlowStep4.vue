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

const formattedDate = computed(() => bookingData.value.headerDateDisplay || 'Tomorrow April 27, 2025');
const timeRange = computed(() => bookingData.value.formattedTimeRange || '4:00pm-4:15pm');
const duration = computed(() => bookingData.value.selectedDuration?.value || '15');
const totalPrice = computed(() => Number(bookingData.value.totalPrice || 0));
const firstTimeDiscountAmount = computed(() => Number(bookingData.value.firstTimeDiscountAmount || 0));

const eventTitle = computed(() => (
  bookingItem.value?.eventSnapshot?.title
  || selectedEvent.value?.title
  || 'High School Life Simulator'
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
    ? `Booking confirmed with ${creatorLabel.value} !`
    : `Booking request sent to ${creatorLabel.value} !`
));
const topMessage = computed(() => (
  isInstantConfirmed.value
    ? 'Your booking is confirmed. See you at your selected time.'
    : 'Sit tight - your request is pending approval from creator.'
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
  <div class="relative w-full max-w-[27rem] min-h-0 rounded-[10px] ">

      <div class="backdrop-blur-[1rem] rounded-[10px]" :style="successBackgroundStyle">

          <div class="p-6 bg-[#00000080] backdrop-blur-[10px] flex flex-col justify-center items-center gap-6 rounded-tl-[10px] rounded-tr-[10px]">
            <div class="flex flex-col justify-center items-center gap-6">
              <img class="w-36 h-36" :src="bookingFlowPendingIcon" alt="" />
              <div class="flex flex-col justify-start items-start gap-2">
                <div class="text-center justify-center text-white text-2xl font-semibold leading-8">{{ topTitle }}</div>
                <div class="text-center justify-center text-white text-base font-normal leading-6">{{ topMessage }}</div>
              </div>
            </div>
          </div>

          <div class="w-full p-4 bg-cyan-400/20 rounded-bl-[10px] rounded-br-[10px] backdrop-blur-[5px] flex flex-col justify-between items-start">
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
                        Total: {{ totalPrice }} tokens
                      </div>
                      <div v-if="firstTimeDiscountAmount > 0" class="text-xs font-medium leading-5 text-[#07F468]">
                        First-time discount applied: saved {{ firstTimeDiscountAmount }} tokens
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
                <div class="text-center justify-start text-green-500 text-base font-medium leading-6">Message {{ creatorLabel }}</div>
              </div>
            </div>
          </div>
      </div>


      <div
        @click="emit('close-popup')"
        data-test="booking-flow-step4-close-button"
        class="absolute -top-4 -right-3 z-99 p-[8px] flex justify-center items-center bg-black/30 rounded-[50px] backdrop-blur-[10px] cursor-pointer"
      >
        <img :src="bookingFlowCrossWhiteIcon" alt="cross-white" class="w-4 h-4" />
      </div>

    </div>
</template>
