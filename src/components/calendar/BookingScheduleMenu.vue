<template>
  <div
    v-if="open"
    :class="[
      positionClass,
      'z-[1200] w-[12.25rem] overflow-hidden rounded-[0.125rem] border border-[#EAECF0] bg-white shadow-[0_12px_24px_rgba(15,23,42,0.18)]',
    ]"
    :style="menuStyle"
    data-test="booking-schedule-menu"
    @click.stop
  >
    <button
      type="button"
      class="w-full flex p-2 items-center gap-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
      @click.stop="selectAction('edit')"
    >
      <img :src="editIcon" alt="edit" class="w-4 h-4" />
      {{ t("common_edit") }}
    </button>
    <button
      type="button"
      class="w-full flex p-2 items-center gap-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
      @click.stop="selectAction('view-card')"
    >
      <img :src="externalLinkIcon" alt="view schedule card" class="w-4 h-4" />
      {{ t("dashboard_booking_schedule_view_card") }}
    </button>
    <button
      type="button"
      disabled
      class="w-full flex p-2 items-center gap-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 cursor-not-allowed text-slate-500 opacity-40"
    >
      <img :src="externalLinkIcon" alt="external link" class="w-4 h-4" />
      {{ t("dashboard_booking_schedule_view_profile") }}
    </button>
    <button
      type="button"
      disabled
      class="w-full flex p-2 items-center gap-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 cursor-not-allowed text-slate-500 opacity-40"
    >
      <img :src="shareIcon" alt="share" class="w-4 h-4" />
      {{ t("dashboard_booking_schedule_share_booking_page") }}
    </button>
    <button
      type="button"
      class="w-full flex p-2 items-center gap-2 text-xs font-semibold text-[#FF4405] hover:bg-[#fff4ef]"
      @click.stop="selectAction('delete')"
    >
      <img :src="deleteIcon" alt="delete" class="w-4 h-4" />
      {{ t("common_delete") }}
    </button>
  </div>
</template>

<script setup>
import { useBookingTranslations } from "@/i18n/bookingTranslations.js";
import editIcon from "@/assets/images/icons/edit-02-gray.svg";
import shareIcon from "@/assets/images/icons/share-06.svg";
import externalLinkIcon from "@/assets/images/icons/link-external-02-gray.svg";
import deleteIcon from "@/assets/images/icons/trash-01.svg";

const props = defineProps({
  event: {
    type: Object,
    default: null,
  },
  open: {
    type: Boolean,
    default: false,
  },
  positionClass: {
    type: String,
    default: "absolute right-0 top-8",
  },
  menuStyle: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(["edit", "view-card", "delete", "close"]);
const { t } = useBookingTranslations();

function selectAction(action) {
  emit(action, props.event);
  emit("close");
}
</script>
