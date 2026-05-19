<template>
  <div v-show="visible" :class="['flex gap-4 relative', classnames]">
    <!-- Left Icon -->
    <div v-if="leftIcon" :class="leftIconClass + ' hidden md:block'">
      <img :src="leftIcon" alt="left icon" />
    </div>

    <!-- Title + Body + Optional Accordion Icon -->
    <div class="flex w-full relative">
      <div class='w-full'>
        <div class="flex gap-2 items-center">
          <div v-if="leftIcon" :class="leftIconClass + 'block md:hidden'">
            <img :src="leftIcon" alt="left icon" />
          </div>
          <div
            class="justify-start text-gray-700 text-base font-medium leading-normal"
          >
            {{ title }} <span v-if="isOptional" class="text-gray-500 text-xs italic font-normal font-['Poppins'] leading-none ml-1">{{ t("common_optional") }}</span>
          </div>
          <div v-if="titleIcon && !tooltipText">
            <img :src="titleIcon" alt="titleIcon" />
          </div>
          <TooltipIcon v-if="tooltipText" :text="tooltipText" />
        </div>

        <!-- Slot for body content -->
        <slot></slot>
      </div>

      <!-- Optional Accordion Icon -->
      <div v-if="accordionIcon" class="cursor-pointer absolute top-0 right-0"
      @click="$emit('toggle')">
        <img :src="accordionIcon" alt="accordion icon" />
      </div>
    </div>
  </div>
</template>

<script>
import TooltipIcon from "@/components/ui/tooltip/TooltipIcon.vue";
import { useBookingTranslations } from "@/i18n/bookingTranslations.js";

export default {
  name: "WrapperContainer",
  components: {
    TooltipIcon,
  },
  setup() {
    const { t } = useBookingTranslations();
    return { t };
  },
  props: {
    title: {
      type: String,
      required: true,
    },
    leftIcon: {
      type: String,
      default: null,
    },
    accordionIcon: {
      type: String,
      default: null, // optional icon
    },
    titleIcon: {
      type: String,
      default: null, // optional icon next to title
    },
    leftIconClass:{
       type: String,
      default: null,
    },
    tooltipText: {
      type: String,
      default: null,
    },
    classnames: {
      type: [String, Array, Object],
      default: "",
    },
    visible: {
      type: Boolean,
      default: true,
    },
    isOptional: {
      type: Boolean,
      default: false,
    },
  },
};
</script>
