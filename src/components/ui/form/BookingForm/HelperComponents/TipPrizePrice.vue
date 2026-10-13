<script setup>
import { computed } from "vue";
import { useBookingTranslations } from "@/i18n/bookingTranslations.js";
import lightningIcon from "@/assets/images/icons/lightning-02.svg";

const props = defineProps({ item: { type: Object, required: true }, showDiscount: Boolean, loading: Boolean });
const { t } = useBookingTranslations();
function amount(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}
const source = computed(() => props.item.type === "media" ? props.item.raw?.p2v || {} : props.item.raw || {});
const price = computed(() => amount(source.value.price ?? props.item.buyPrice));
const regularPrice = computed(() => amount(source.value.regular_price));
const discount = computed(() => price.value !== null && regularPrice.value > price.value ? Math.round((1 - price.value / regularPrice.value) * 100) : 0);
function formatAmount(value) { return String(Number(value.toFixed(2))); }
</script>

<template>
  <span class="tip-prize-price">
    <template v-if="price !== null">
      <span class="tip-prize-current-price">{{ t('booking_tip_menu_usd_price', { amount: formatAmount(price) }) }}</span>
      <del v-if="discount" class="tip-prize-regular-price">{{ t('booking_tip_menu_original_price', { amount: formatAmount(regularPrice) }) }}</del>
      <span v-if="showDiscount && discount" class="tip-prize-discount"><img :src="lightningIcon" alt="" />{{ t('booking_tip_menu_discount', { percent: discount }) }}</span>
    </template>
    <span v-else class="tip-prize-price-status">{{ t(loading ? 'booking_tip_menu_loading_price' : 'booking_tip_menu_price_unavailable') }}</span>
  </span>
</template>

<style scoped>
.tip-prize-price { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; font-size: 16px; font-weight: 700; line-height: 24px; }
.tip-prize-regular-price { font-size: 12px; line-height: 18px; }
.tip-prize-discount { display: inline-flex; align-items: center; position: relative; margin-left: 3px; padding: 0 4px 0 10px; border-radius: 4px; background: #001aff; color: #fff; font-size: 12px; line-height: 20px; white-space: nowrap; }
.tip-prize-discount img { position: absolute; left: -7px; width: 20px; height: 24px; }
.tip-prize-price-status { font-size: 12px; font-weight: 400; }
</style>
