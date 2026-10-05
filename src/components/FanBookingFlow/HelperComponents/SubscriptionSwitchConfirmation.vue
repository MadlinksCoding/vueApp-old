<script>
// An acknowledgement belongs to this account and these specific tiers, not to
// a payment. Eligibility is still checked again by checkout and booking.
export function subscriptionSwitchReviewKey(detail, fanId, eventId) {
  return JSON.stringify([
    String(fanId || 0), String(eventId || ''), detail?.product?.id,
    detail?.subscription?.current_tier?.id, detail?.checkout?.subscription_id,
    detail?.checkout?.switch_type, detail?.product?.price,
    detail?.subscription?.next_payment_date,
  ]);
}
</script>

<script setup>
import { computed, nextTick, onMounted, ref } from 'vue';
import { useBookingTranslations } from '@/i18n/bookingTranslations.js';
import { bookingFlowLightningIcon } from '../OneOnOneBookingFlow/oneOnOneBookingFlowAssets.js';
import arrowIcon from '@/assets/images/icons/booking-subscription-switch-arrow.svg';

const props = defineProps({
  prerequisite: { type: Object, required: true },
  busy: { type: Boolean, default: false },
  error: { type: String, default: '' },
});
const emit = defineEmits(['confirm', 'cancel']);
const { t } = useBookingTranslations();
const confirmButton = ref(null);
onMounted(() => nextTick(() => confirmButton.value?.focus()));
const tiers = computed(() => [
  { ...props.prerequisite.subscription?.current_tier, label: t('fan_booking_current_tier') },
  { ...props.prerequisite.product, ...props.prerequisite.subscription, label: t('fan_booking_new_subscription') },
]);
function priceLabel(tier) {
  if (Number(tier.price) === 0) return t('fan_booking_tier_free');
  return `USD$${Number(tier.price || 0).toFixed(2)}`;
}
function periodLabel(tier) {
  const period = ['day', 'week', 'month', 'year'].includes(tier.period) ? tier.period : '';
  return period ? ` / ${Number(tier.interval) > 1 ? `${Number(tier.interval)} ` : ''}${t(`fan_booking_period_${period}`)}` : '';
}
function discount(tier) {
  const regular = Number(tier.regular_price);
  const price = Number(tier.price);
  return regular > price && price >= 0 ? Math.round((1 - price / regular) * 100) : 0;
}
function handleKeydown(event) {
  if (event.key === 'Escape' && !props.busy) emit('cancel');
  if (event.key !== 'Tab') return;
  const buttons = Array.from(event.currentTarget.querySelectorAll('button:not([disabled])'));
  const first = buttons[0];
  const last = buttons[buttons.length - 1];
  if (first && ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last))) {
    event.preventDefault();
    (event.shiftKey ? last : first).focus();
  }
}
</script>

<template>
  <div role="alertdialog" aria-modal="true" :aria-label="t('fan_booking_prerequisite_review')"
    data-testid="booking-prerequisite-review" @keydown.stop="handleKeydown"
    class="flex w-full max-w-[510px] max-h-full flex-col gap-3 overflow-y-auto rounded-[15px] bg-black/50 p-4 md:p-5 font-['Poppins'] text-white">
    <p class="w-full text-base font-normal leading-6">{{ t('fan_booking_switch_tier_prompt') }}</p>
    <div class="flex w-full flex-col items-start gap-3 py-3">
      <template v-for="(tier, index) in tiers" :key="index">
        <img v-if="index" :src="arrowIcon" alt="" class="ml-[92px] h-6 w-6" />
        <div class="flex w-full items-start gap-5">
          <div class="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg bg-white/10">
            <img v-if="tier.image_url" :src="tier.image_url" :alt="tier.variation_title || tier.title || ''" class="h-full w-full object-cover" />
          </div>
          <div class="flex min-w-0 flex-1 flex-col items-start gap-2">
            <div class="flex flex-col items-start font-semibold">
              <span class="text-sm leading-5 text-[#07F468]">{{ tier.label }}</span>
              <span class="break-words text-lg leading-7">{{ tier.variation_title || tier.title }}</span>
            </div>
            <div class="flex flex-wrap items-center gap-[2px]">
              <span class="text-xl font-bold leading-[30px] text-[#FCE40D]">{{ priceLabel(tier) }}</span>
              <span v-if="Number(tier.price) > 0" class="text-xs leading-[18px] text-[#FCE40D]">{{ periodLabel(tier) }}</span>
              <span v-if="discount(tier)" class="text-xs leading-[18px] line-through">${{ Number(tier.regular_price).toFixed(2) }}</span>
              <span v-if="discount(tier)" class="relative flex items-center rounded bg-[#FF0066] py-[2px] pl-3 pr-[6px] text-[10px] font-semibold leading-[15px]">
                <img :src="bookingFlowLightningIcon" alt="" class="absolute -left-1 top-0" />{{ t('fan_booking_shipping_discount', { percent: discount(tier) }) }}
              </span>
            </div>
          </div>
        </div>
      </template>
    </div>
    <div class="flex w-full flex-col items-start gap-3">
      <button ref="confirmButton" type="button" data-testid="booking-prerequisite-review-confirm" :disabled="busy" @click="emit('confirm')"
        class="flex min-h-10 w-full items-center justify-center bg-[#FF0066] px-6 py-2 text-base font-medium leading-6 text-white disabled:opacity-50">
        {{ t('fan_booking_update_subscription_tier') }}
      </button>
      <p v-if="prerequisite.subscription?.next_payment_date" class="w-full text-center text-sm leading-5 text-[#EAECF0]">
        {{ t(prerequisite.checkout?.switch_type === 'downgrade' ? 'fan_booking_tier_updates_next_cycle' : 'fan_booking_next_billing_date', { date: prerequisite.subscription.next_payment_date }) }}
      </p>
      <button type="button" data-testid="booking-prerequisite-review-cancel" :disabled="busy" @click="emit('cancel')"
        class="flex min-h-10 w-full items-center justify-center border-[1.5px] border-white bg-[#101828] px-6 py-2 text-base font-medium leading-6 text-white disabled:opacity-50">{{ t('fan_booking_shipping_go_back') }}</button>
      <p v-if="error" role="alert" class="text-xs font-medium text-red-400">{{ error }}</p>
    </div>
  </div>
</template>
