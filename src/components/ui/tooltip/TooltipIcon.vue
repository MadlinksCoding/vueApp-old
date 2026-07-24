<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

defineProps({
  text: {
    type: String,
    required: true,
  },
  tooltipClass: {
    type: String,
    default: "",
  },
  wrapperClass: {
    type: String,
    default: "mt-[2px]",
  },
  iconSrc: {
    type: String,
    default: "https://i.ibb.co/HD78k3Sf/Icon.png",
  },
  side: {
    type: String,
    default: "bottom",
    validator: (value) => ["top", "bottom", "left", "right"].includes(value),
  },
  iconClass: {
    type: String,
    default: "",
  },
});

const sideClasses = {
  bottom: "left-auto right-0 translate-x-[0%] md:left-1/2 md:right-auto md:-translate-x-1/2 mt-2",
  top: "left-auto right-0 translate-x-[0%] md:left-1/2 md:right-auto md:-translate-x-1/2 mb-2 bottom-full",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

const containerRef = ref(null);
const isVisible = ref(false);
const isTouch = ref(false);

const checkDevice = () => {
  isTouch.value = window.matchMedia('(max-width: 1023px)').matches || ('ontouchstart' in window);
};

const toggleTooltip = () => {
  if (!isTouch.value) return;
  isVisible.value = !isVisible.value;
};

const closeTooltip = (event) => {
  if (!isTouch.value) return;
  if (event && event.target && containerRef.value && containerRef.value.contains(event.target)) {
    return;
  }
  isVisible.value = false;
};

onMounted(() => {
  checkDevice();
  window.addEventListener('resize', checkDevice);
  document.addEventListener('click', closeTooltip);
  document.addEventListener('touchstart', closeTooltip);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkDevice);
  document.removeEventListener('click', closeTooltip);
  document.removeEventListener('touchstart', closeTooltip);
});
</script>


<template>
  <div
    ref="containerRef"
    :class="['md:relative group/tooltip inline-block w-6 h-6', wrapperClass]"
    @click.prevent="toggleTooltip"
  >
    <slot>
      <img :src="iconSrc" alt="" :class="['cursor-pointer', iconClass]" />
    </slot>
    <!-- Tooltip -->
    <div
      :class="[
        'absolute w-max max-w-[16rem] bg-[rgba(55,59,68,0.90)] text-white text-xs font-medium py-1 px-2 rounded-md shadow-lg border border-gray-200 transition-opacity duration-200 pointer-events-none z-50',
        isVisible ? 'opacity-100' : 'opacity-0 group-hover/tooltip:opacity-100',
        sideClasses[side] || sideClasses.bottom,
        tooltipClass,
      ]"
    >
      {{ text }}
    </div>
  </div>
</template>



