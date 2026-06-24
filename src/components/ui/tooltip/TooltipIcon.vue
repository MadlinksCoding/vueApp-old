<script setup>
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
});

const sideClasses = {
  bottom: "left-auto right-0 translate-x-[0%] md:left-1/2 md:right-auto md:-translate-x-1/2 mt-2",
  top: "left-auto right-0 translate-x-[0%] md:left-1/2 md:right-auto md:-translate-x-1/2 mb-2 bottom-full",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};
</script>

<template>
  <div :class="['md:relative group/tooltip inline-block', wrapperClass]"
  @click.stop.prevent
  @mousedown.stop
  @touchstart.stop
  >
    <slot>
      <img :src="iconSrc" alt="" class="cursor-pointer" />
    </slot>
    <!-- Tooltip -->
    <div
      :class="[
        'absolute w-max max-w-[16rem] bg-[rgba(55,59,68,0.90)] text-white text-xs font-medium py-1 px-2 rounded-md shadow-lg border border-gray-200 opacity-0 group-hover/tooltip:opacity-100 transition-opacity duration-200 pointer-events-none z-50',
        sideClasses[side] || sideClasses.bottom,
        tooltipClass,
      ]"
    >
      {{ text }}
    </div>
  </div>
</template>

