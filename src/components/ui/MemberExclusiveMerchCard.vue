<template>
  <article class="w-full overflow-hidden rounded-lg">
    <div class="relative h-[313px] md:h-[324px]">
      <img :src="image" :alt="title" class="h-full w-full object-cover" />
      <div class="absolute left-4 top-4 flex items-center gap-1 rounded-full">
        <img :src="avatar" :alt="creator" class="h-5 w-5 rounded-full object-cover" />
        <span class="max-w-[8.5rem] truncate text-xs font-medium text-white [text-shadow:0_0_8px_rgba(0,0,0,0.50)]">{{ creator }}</span>
        <img :src="VerifiedIcon" alt="" class="h-2.5 w-2.5 shrink-0" />
      </div>
      <p class="absolute bottom-4 left-4 text-xl font-medium text-white [text-shadow:0_1px_6px_rgba(0,0,0,0.65)]">
        {{ title }}
      </p>
    </div>
    <div class="relative flex h-[70px] items-stretch">
      <div class="flex min-w-0 flex-1 items-center justify-center gap-1 bg-[#0C111D] px-3 text-white">
        <span class="text-xl font-bold leading-none">{{ price }}</span>
        <span v-if="originalPrice" class="text-xs font-medium line-through opacity-80">{{ originalPrice }}</span>
      </div>
      <button
        type="button"
        class="relative flex shrink-0 items-center pl-7 pr-3.5 text-xl font-extrabold italic tracking-wide text-white"
        :class="tone === 'pink' ? 'bg-[#FF0066]' : 'bg-[#0133FB]'"
        @click="emit('action')"
      >
        <img
          :src="tone === 'pink' ? RedUnion : BlueUnion"
          alt=""
          class="pointer-events-none absolute -left-[23px] top-1/2 h-[71px] w-6 -translate-y-1/2"
        />
        {{ actionLabel }}
      </button>
      <span
        v-if="discount"
        class="absolute -top-2.5 right-3 z-10 flex items-center"
      >
        <img :src="LightningIcon" alt="" class="relative z-[1] left-1 h-4 w-4" />
        <span class="-ml-2 rounded-[0.25rem] bg-black/90 py-0.5 pl-3 pr-1.5 text-[10px] font-semibold leading-4 text-[#FCE40D]">
          {{ discount }}
        </span>
      </span>
    </div>
  </article>
</template>

<script setup>
import VerifiedIcon from "@/assets/images/icons/verified-tick-blue.svg";
import LightningIcon from "@/assets/images/icons/lightning-02.svg";
import RedUnion from "@/assets/images/icons/red-union.svg";
import BlueUnion from "@/assets/images/icons/blue-union.svg";

defineProps({
  image: { type: String, required: true },
  title: { type: String, required: true },
  creator: { type: String, required: true },
  avatar: { type: String, required: true },
  price: { type: String, required: true },
  originalPrice: { type: String, default: "" },
  discount: { type: String, default: "" },
  actionLabel: { type: String, default: "BUY NOW" },
  tone: { type: String, default: "blue" },
});

const emit = defineEmits(["action"]);
</script>
