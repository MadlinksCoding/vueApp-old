<script setup>
import { useBookingTranslations } from "@/i18n/bookingTranslations.js";

defineProps({ item: { type: Object, required: true }, selected: Boolean, showSelectAction: Boolean });
const emit = defineEmits(["select"]);
const { t } = useBookingTranslations();
</script>

<template>
  <button
    type="button"
    class="spending-product-card text-left rounded overflow-hidden transition p-[0.375rem] flex flex-col gap-1 min-w-0"
    :class="[{ 'product-select-enabled': showSelectAction }, selected ? 'border border-[#FF0080] bg-[rgba(255,0,102,0.10)]' : '']"
    :aria-pressed="selected"
    @click="emit('select', item)"
  >
    <div class="product-thumbnail relative w-full">
      <img :src="item.thumbnailUrl" :alt="item.title" class="w-full aspect-[179/103] object-cover" />
      <span v-if="showSelectAction" class="product-select-action">{{ t(selected ? 'booking_tip_menu_selected' : 'common_select') }}</span>
    </div>
    <div class="text-sm font-semibold text-gray-950 line-clamp-2">{{ item.title }}</div>
  </button>
</template>

<style scoped>
.product-select-enabled:hover,
.product-select-enabled:focus-visible { background: #fb5ba226; border-radius: 6px; }
.product-select-action { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); padding: 8px; border-radius: 6px; background: #ff0066; color: #fff; font-size: 16px; font-weight: 600; line-height: 24px; text-transform: uppercase; opacity: 0; pointer-events: none; }
.product-select-enabled:hover .product-select-action,
.product-select-enabled:focus-visible .product-select-action,
.product-select-enabled[aria-pressed="true"] .product-select-action { opacity: 1; }
.product-select-enabled:hover .product-thumbnail > img,
.product-select-enabled:focus-visible .product-thumbnail > img,
.product-select-enabled[aria-pressed="true"] .product-thumbnail > img { opacity: .7; }
</style>
