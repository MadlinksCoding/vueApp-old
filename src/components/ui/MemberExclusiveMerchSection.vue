<template>
  <section class="w-full rounded-2xl bg-white p-3 md:p-5">
    <div class="mb-4 flex items-center justify-between gap-4">
      <h2 class="flex items-start md:items-center gap-2 text-xl md:text-2xl font-semibold text-[#101828]">
        <img :src="WeatherIcon" alt="" class="h-5 w-5 mt-1 md:mt-0" />
        CLAIM YOUR MEMBER EXCLUSIVE MERCH!
      </h2>
      <div class="hidden md:flex items-center gap-2">
        <button
          type="button"
          class="flex h-12 w-12 items-center justify-center rounded-full border border-black/50 text-[#344054] disabled:border-black/30 disabled:text-black/30"
          aria-label="Previous merch"
          :disabled="atStart"
          @click="prev"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M12.5 15L7.5 10L12.5 5" stroke="currentColor" stroke-width="1.67" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button
          type="button"
          class="flex h-12 w-12 items-center justify-center rounded-full border border-black/50 text-[#344054] disabled:border-black/30 disabled:text-black/30"
          aria-label="Next merch"
          :disabled="atEnd"
          @click="next"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" stroke-width="1.67" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </div>

    <Splide ref="splideRef" :options="sliderOptions" aria-label="Member exclusive merch" @splide:mounted="sync" @splide:moved="sync">
      <SplideSlide v-for="item in items" :key="item.id">
        <MemberExclusiveMerchCard
          :image="item.image"
          :title="item.title"
          :creator="item.creator"
          :avatar="item.avatar"
          :price="item.price"
          :original-price="item.originalPrice"
          :discount="item.discount"
          :action-label="item.actionLabel"
          :tone="item.tone"
          @action="emit('action', item)"
        />
      </SplideSlide>
    </Splide>
  </section>
</template>

<script setup>
import { ref } from "vue";
import { Splide, SplideSlide } from "@splidejs/vue-splide";
import "@splidejs/vue-splide/css";
import WeatherIcon from "@/assets/images/icons/Weather.svg";
import MemberExclusiveMerchCard from "@/components/ui/MemberExclusiveMerchCard.vue";

const avatar = "https://i.ibb.co/jkjtwC9C/svgviewer-png-output-17.webp";

const items = [
  {
    id: 1,
    title: "原味內衣",
    creator: "Princess Carrot Pop",
    avatar,
    image: "https://i.ibb.co.com/jk1F8MqJ/featured-media-bg.webp",
    price: "USD$25",
    actionLabel: "BUY NOW",
    tone: "blue",
  },
  {
    id: 2,
    title: "worn socks",
    creator: "Princess Carrot Pop",
    avatar,
    image: "https://i.ibb.co.com/S4vnSYPw/hero-bg-image-1-2.webp",
    price: "FREE",
    actionLabel: "CLAIM NOW",
    tone: "pink",
  },
  {
    id: 3,
    title: "原味內衣",
    creator: "Princess Carrot Pop",
    avatar,
    image: "https://i.ibb.co.com/M5Q8qb4F/hero-bg-image-2-1.webp",
    price: "USD$25",
    originalPrice: "$50",
    discount: "50% off",
    actionLabel: "BUY NOW",
    tone: "blue",
  },
  {
    id: 4,
    title: "原味內衣",
    creator: "Princess Carrot Pop",
    avatar,
    image: "https://i.ibb.co.com/j9b5wvYV/hero-bg-image-2-2.webp",
    price: "USD$25",
    actionLabel: "BUY NOW",
    tone: "blue",
  },
  {
    id: 5,
    title: "worn socks",
    creator: "Princess Carrot Pop",
    avatar,
    image: "https://i.ibb.co.com/wNtVT4r0/hero-bg-image-0-2.webp",
    price: "FREE",
    actionLabel: "CLAIM NOW",
    tone: "pink",
  },
];

const sliderOptions = {
  type: "slide",
  fixedWidth: "324px",
  gap: "1rem",
  arrows: false,
  pagination: false,
  drag: true,
  speed: 400,
  perMove: 1,
  breakpoints: {
    768: {
      fixedWidth: "324px",
      gap:"0.5rem",
    },
  },
};

const emit = defineEmits(["action"]);
const splideRef = ref(null);
const atStart = ref(true);
const atEnd = ref(false);

function sync(splide) {
  atStart.value = splide.index <= 0;
  atEnd.value = splide.index >= splide.Components.Controller.getEnd();
}

function prev() {
  splideRef.value?.go("<");
}

function next() {
  splideRef.value?.go(">");
}
</script>
