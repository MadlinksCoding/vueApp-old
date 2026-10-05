<script setup>
import { computed, onMounted, ref } from 'vue';
import { useBookingTranslations } from '@/i18n/bookingTranslations.js';
import { bookingFlowLightningIcon } from '../OneOnOneBookingFlow/oneOnOneBookingFlowAssets.js';
import shippingTruckIcon from '@/assets/images/icons/booking-shipping-truck.svg';

const props = defineProps({
  prerequisite: { type: Object, required: true },
  autoFocus: { type: Boolean, default: false },
});
defineEmits(['confirm', 'cancel']);
const { t } = useBookingTranslations();
const confirmButton = ref(null);
onMounted(() => {
  if (props.autoFocus) confirmButton.value?.focus();
});
const product = computed(() => props.prerequisite.product || {});
const country = computed(() => props.prerequisite.shipping?.country || t('fan_booking_shipping_seller_country'));
const discount = computed(() => {
  const price = Number(product.value.price);
  const regular = Number(product.value.regular_price);
  return regular > price && price >= 0 ? Math.round((1 - price / regular) * 100) : 0;
});
const priceLabel = computed(() => Number.isFinite(Number(product.value.price))
  ? `USD$${Number(product.value.price).toFixed(2)}` : t('fan_booking_calculated_at_checkout'));
</script>

<template>
  <div role="alertdialog" aria-modal="true" :aria-label="t('fan_booking_shipping_confirmation_title')"
    data-testid="merch-shipping-confirmation"
    class="flex w-full max-w-[510px] flex-col items-center gap-3 rounded-[15px] bg-black/90 p-4 md:p-5">
    <p class="w-full text-base font-normal leading-6 text-white">{{ t('fan_booking_domestic_merch_prompt') }}</p>
    <div class="flex items-center gap-5 self-stretch rounded-xl bg-[rgba(16,24,40,0.6)] p-3">
      <div class="h-[121px] w-[121px] shrink-0 overflow-hidden rounded-lg bg-white/10">
        <img v-if="product.image_url" :src="product.image_url" :alt="product.title || ''" class="h-full w-full object-cover" />
      </div>
      <div class="flex min-w-0 flex-1 flex-col items-start justify-center gap-2 self-stretch">
        <h3 class="break-words text-lg font-semibold leading-7 text-white">{{ product.title }}</h3>
        <div class="flex flex-wrap items-center gap-[2px]">
          <span class="text-xl font-bold leading-[30px] text-[#FCE40D]">{{ priceLabel }}</span>
          <span v-if="discount" class="text-xs font-normal leading-[18px] text-white line-through">${{ Number(product.regular_price).toFixed(2) }}</span>
          <div v-if="discount" class="relative flex items-center rounded bg-[#0133FB] py-[2px] pl-3 pr-[6px]">
            <img :src="bookingFlowLightningIcon" alt="" class="absolute -left-1 top-0" />
            <span class="text-[10px] font-semibold leading-[15px] text-white">{{ t('fan_booking_shipping_discount', { percent: discount }) }}</span>
          </div>
        </div>
        <div class="flex items-center gap-[6px] text-sm font-normal leading-5 text-[#FCE40D]">
          <img :src="shippingTruckIcon" alt="" class="shrink-0" />
          <span>{{ t('fan_booking_ships_to') }} <span class="underline">{{ country }}</span> {{ t('fan_booking_shipping_only') }}</span>
        </div>
      </div>
    </div>
    <div class="flex w-full flex-col items-start gap-3">
      <button ref="confirmButton" type="button" data-testid="merch-shipping-confirm" @click="$emit('confirm')"
        class="flex min-h-10 w-full min-w-[100px] items-center justify-center bg-[#07F468] px-6 py-2 text-base font-medium leading-6 text-[#0C111D]">
        {{ t('fan_booking_domestic_merch_confirm', { country }) }}
      </button>
      <button type="button" data-testid="merch-shipping-cancel" @click="$emit('cancel')"
        class="flex min-h-10 w-full min-w-[100px] items-center justify-center border-[1.5px] border-white bg-[#101828] px-6 py-2 text-base font-medium leading-6 text-white">
        {{ t('fan_booking_shipping_go_back') }}
      </button>
    </div>
  </div>
</template>
