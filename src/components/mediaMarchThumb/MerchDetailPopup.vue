<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[99999] flex items-center justify-center overflow-y-auto font-['Poppins',sans-serif]"
        @click.self="close"
      >
        <!-- Modal Dialog Card -->
        <div
          class="relative w-full h-dvh bg-[rgba(0,0,0,0.05)] backdrop-blur-[125px] text-white overflow-hidden flex flex-col my-auto"
        >
          <!-- Close Button Top Floating (Mobile/Desktop) -->
          <button
            @click="close"
            type="button"
            class="absolute top-3 right-3 sm:top-4 sm:right-4 z-50 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm border border-slate-700/50"
            aria-label="Close Modal"
          >
            <svg class="w-4 h-4 sm:w-5 sm:h-5 fill-current" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>

          <!-- Scrollable Modal Content Grid -->
          <div class="overflow-y-auto flex-1 custom-scrollbar">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-0">
              
              <!-- LEFT COLUMN: Image Gallery Section (7 Cols on Desktop) -->
              <div class="lg:col-span-6 flex flex-col justify-between">
                <!-- Main Preview Image -->
                <div class="relative w-full h-full aspect-[4/3] sm:aspect-[16/11] overflow-hidden flex items-center justify-center group shadow-inner">
                  <img
                    :src="activeSlideImage"
                    :alt="merchData.title"
                    class="w-full h-full object-cover transition-all duration-300"
                    @load="onImageLoad"
                  />
                </div>

                <!-- Gallery Thumbnails Strip (6 Thumbnails Grid) -->
                <div class="grid grid-cols-6 gap-1.5 sm:gap-2 pt-2">
                  <div
                    v-for="(img, idx) in galleryImages"
                    :key="idx"
                    @click="activeIndex = idx"
                    class="aspect-square overflow-hidden cursor-pointer border-1 border transition-all relative"
                    :class="activeIndex === idx ? 'border-[#F5F5F4]' : 'border-transparent'"
                  >
                    <img :src="img" :alt="'Thumb ' + (idx + 1)" class="w-full h-full object-cover" @load="onImageLoad" />
                  </div>
                </div>
              </div>

              <!-- RIGHT COLUMN: Merch Info & Member Only Subscription Card (5 Cols on Desktop) -->
              <div class="lg:col-span-6 p-4 pb-0 sm:p-5 sm:pb-0 lg:p-6 lg:pb-0 flex flex-col gap-10 justify-between">
                
                <!-- Product Header Info -->
                <div class="flex flex-col gap-6">
                  <div class="pr-8">
                    <h2 class="text-[#F5F5F4] [text-shadow:0_0_10px_rgba(0,0,0,0.10)] text-[1.875rem] font-semibold leading-[2.375rem] tracking-tight line-clamp-2">
                      {{ merchData.title }}
                    </h2>
                  </div>

                  <!-- Tag Pills Row -->
                  <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <img
                          src="https://fansocial.app/wp-content/plugins/fansocial/assets/icons/svg/tag-01.svg"
                          alt="Tag Icon"
                          class="w-4 h-4 brightness-0 invert"
                        />
                    <span
                      v-for="tag in merchData.tags"
                      :key="tag"
                      class="px-2 py-1 bg-[#0C111D] text-[#F9FAFB] text-sm font-medium whitespace-nowrap"
                    >
                      {{ tag }}
                    </span>
                  </div>

                  <!-- Social Stats Row (Likes, Views, Shares) -->
                  <div class="flex items-center gap-4 text-base text-[#F2F4F7]">
                    <div class="flex items-center gap-2">
                      <span>
                        <img
                          src="https://fansocial.app/wp-content/plugins/fansocial/assets/icons/svg/heart.svg"
                          alt="heart Icon"
                          class="w-4 h-4 brightness-0 invert"
                        />
                      </span>
                      <span>{{ merchData.likes || 123 }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span>
                        <img
                          src="https://fansocial.app/wp-content/plugins/fansocial/assets/icons/svg/eyeWhite.svg"
                          alt="eye Icon"
                          class="w-4 h-4 brightness-0 invert"
                        />
                      </span>
                      <span>{{ merchData.views || '2K' }}</span>
                    </div>
                    <div class="flex items-center gap-2">
                      <span>
                        <img
                          src="https://fansocial.app/wp-content/plugins/fansocial/assets/icons/svg/shopping-cart-03.svg"
                          alt="cart Icon"
                          class="w-4 h-4 brightness-0 invert"
                        />
                      </span>
                      <span>{{ merchData.shares || 15 }}</span>
                    </div>
                  </div>
                </div>

                <!-- Custom Price & Buy Now Slanted Action Bar -->
                  <MerchBuyNowBar
                    :price="merchData.price || '25'"
                    :old-price="merchData.oldPrice || '$50'"
                    currency="USD$"
                    button-text="BUY NOW"
                    @buy="onBuyNow"
                  />

                <!-- MEMBER ONLY MERCH CARD (Pink Magenta Gradient Box) -->
                <div class="relative rounded-3xl bg-[linear-gradient(0deg,rgba(255,0,102,0.40)_0%,rgba(255,0,102,0.40)_100%),linear-gradient(0deg,rgba(12,17,29,0.75)_0%,rgba(12,17,29,0.75)_100%)] shadow-[0_0_8px_0_rgba(255,0,102,0.40)] backdrop-blur-[4px] flex flex-col gap-6 items-center text-center pt-[5rem] mt-5">
                  
                  <!-- Background Pattern Image Overlay -->
                  <img
                    src="https://fansocial.app/wp-content/plugins/fansocial/new-home/assets/images/ready-to-earn-bg.jpg"
                    alt="Background Pattern"
                    class="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay pointer-events-none z-0 rounded-3xl"
                  />
                  
                  <!-- Glowing Floating Lock Icon -->
                  <div class="absolute -top-[2.2rem] z-10 w-[6.625rem] h-[6.625rem] flex items-center justify-center">
                    <img
                    src="https://fansocial.app/wp-content/plugins/fansocial/assets/icons/lock-lg.png"
                    alt="Background Pattern"
                    class="absolute inset-0 w-full h-full object-cover mix-blend-overlay pointer-events-none z-0"
                  />
                  </div>

                  <div class="px-4 sm:px-6 flex flex-col gap-2 mb-2">

                    <h3 class="relative z-10 text-white text-base sm:leading-8 sm:text-xl font-semibold tracking-tight">
                      This is a member only merch
                    </h3>
                    <p class="relative z-10 text-white text-base font-medium">
                      you need to subscribe to <span class="font-semibold text-white underline">🌸 {{ merchData.tier || 'Tier 1 - Close Circle' }}</span> before you can buy this merch from &#64;bebe.
                    </p>

                  </div>

                  <div class="px-4 sm:px-6 flex flex-col gap-6">
                    <!-- JOIN TIER BUTTON (Custom Slanted Pink Action Bar with Chevron Notch) -->
                    <MerchJoinTierBar :tier="merchData.tier" @join="onJoinTier" />

                    <p class="relative z-10 text-xs font-medium text-white">
                      Enjoy over ## member media and # exclusive merch once you subscribed!
                    </p>
                  </div>

                  <!-- Exclusive Tier Content Preview Tracks (2 Scrollable Drag Rows) -->
                  <div class="relative z-10 w-full flex flex-col gap-2">
                    
                    <!-- Row 1: Drag / Swipe Scroll Row 1 -->
                    <div
                      ref="row1Ref"
                      @mousedown="startDrag1"
                      @mouseleave="stopDrag1"
                      @mouseup="stopDrag1"
                      @mousemove="moveDrag1"
                      class="w-full overflow-x-auto overscroll-x-contain touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing select-none"
                    >
                      <div class="flex gap-2 w-max">
                        <div
                          v-for="(post, pIdx) in memberPostsRow1"
                          :key="'r1-' + pIdx"
                          class="w-[11.063rem] aspect-video rounded-xl overflow-hidden relative group/post bg-slate-900 border border-pink-500/30 shrink-0 shadow-md transition-all hover:scale-[1.03]"
                        >
                          <img :src="post.image" :alt="'Exclusive Row 1 ' + pIdx" class="w-full h-full object-cover select-none pointer-events-none" />
                          <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.50)_100%)] flex items-start justify-start p-2">
                            <div class="rounded bg-[rgba(24,34,48,0.50)] flex py-px px-1 justify-center items-center gap-[3px]">
                              <span>
                                <img src="https://fansocial.app/wp-content/plugins/fansocial/assets/icons/svg/image-03.svg" alt="Image Icon" class="w-4 h-4 brightness-0 invert" />
                              </span>
                              <span class="text-xs text-white">{{ post.imageCount || 30 }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Row 2: Drag / Swipe Scroll Row 2 -->
                    <div
                      ref="row2Ref"
                      @mousedown="startDrag2"
                      @mouseleave="stopDrag2"
                      @mouseup="stopDrag2"
                      @mousemove="moveDrag2"
                      class="w-full overflow-x-auto overscroll-x-contain touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing select-none"
                    >
                      <div class="flex gap-2 w-max">
                        <div
                          v-for="(post, pIdx) in memberPostsRow2"
                          :key="'r2-' + pIdx"
                          class="w-[11.063rem] aspect-video rounded-xl overflow-hidden relative group/post bg-slate-900 border border-pink-500/30 shrink-0 shadow-md transition-all hover:scale-[1.03]"
                        >
                          <img :src="post.image" :alt="'Exclusive Row 2 ' + pIdx" class="w-full h-full object-cover select-none pointer-events-none" />
                          <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.50)_100%)] flex items-start justify-start p-2">
                            <div class="rounded bg-[rgba(24,34,48,0.50)] flex py-px px-1 justify-center items-center gap-[3px]">
                              <span>
                                <img src="https://fansocial.app/wp-content/plugins/fansocial/assets/icons/svg/image-03.svg" alt="Image Icon" class="w-4 h-4 brightness-0 invert" />
                              </span>
                              <span class="text-xs text-white">{{ post.imageCount || 30 }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue';
import MerchBuyNowBar from './MerchBuyNowBar.vue';
import MerchJoinTierBar from './MerchJoinTierBar.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  item: {
    type: Object,
    default: () => null
  }
});

const emit = defineEmits(['update:modelValue', 'close', 'buy', 'join']);

const close = () => {
  emit('update:modelValue', false);
  emit('close');
};

const onBuyNow = () => {
  emit('buy', merchData.value);
};

const onJoinTier = () => {
  emit('join', merchData.value);
};

const onImageLoad = (e) => {
  const img = e.target;
  if (img && img.naturalWidth && img.naturalHeight) {
    if (img.naturalHeight > img.naturalWidth) {
      img.classList.remove('object-cover');
      img.classList.add('object-contain');
    } else {
      img.classList.remove('object-contain');
      img.classList.add('object-cover');
    }
  }
};

const activeIndex = ref(0);

// Mouse Drag-to-Scroll Handlers
const row1Ref = ref(null);
const row2Ref = ref(null);

let isDragging1 = false;
let startX1 = 0;
let scrollLeft1 = 0;

const startDrag1 = (e) => {
  isDragging1 = true;
  if (!row1Ref.value) return;
  startX1 = e.pageX - row1Ref.value.offsetLeft;
  scrollLeft1 = row1Ref.value.scrollLeft;
};
const stopDrag1 = () => { isDragging1 = false; };
const moveDrag1 = (e) => {
  if (!isDragging1 || !row1Ref.value) return;
  e.preventDefault();
  const x = e.pageX - row1Ref.value.offsetLeft;
  const walk = (x - startX1) * 1.5;
  row1Ref.value.scrollLeft = scrollLeft1 - walk;
};

let isDragging2 = false;
let startX2 = 0;
let scrollLeft2 = 0;

const startDrag2 = (e) => {
  isDragging2 = true;
  if (!row2Ref.value) return;
  startX2 = e.pageX - row2Ref.value.offsetLeft;
  scrollLeft2 = row2Ref.value.scrollLeft;
};
const stopDrag2 = () => { isDragging2 = false; };
const moveDrag2 = (e) => {
  if (!isDragging2 || !row2Ref.value) return;
  e.preventDefault();
  const x = e.pageX - row2Ref.value.offsetLeft;
  const walk = (x - startX2) * 1.5;
  row2Ref.value.scrollLeft = scrollLeft2 - walk;
};

const defaultMerchData = {
  title: '[Peach] from my farm-Peach from my farm (Autumn harvest)',
  tags: ['Preorder', 'Best Seller', 'Seasonal Offer'],
  price: 'USD $25',
  oldPrice: 'USD $50',
  likes: 123,
  views: '2K',
  shares: 15,
  tier: 'Tier 1 - "Close Circle"',
  slides: [
    'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1000&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1000&q=80'
  ]
};

const merchData = computed(() => {
  return props.item ? { ...defaultMerchData, ...props.item } : defaultMerchData;
});

const galleryImages = computed(() => {
  if (merchData.value.slides && merchData.value.slides.length > 0) {
    return merchData.value.slides;
  }
  if (merchData.value.image) {
    return [merchData.value.image, ...defaultMerchData.slides.slice(1)];
  }
  return defaultMerchData.slides;
});

const activeSlideImage = computed(() => {
  return galleryImages.value[activeIndex.value] || galleryImages.value[0];
});

const prevSlide = () => {
  activeIndex.value = (activeIndex.value - 1 + galleryImages.value.length) % galleryImages.value.length;
};

const nextSlide = () => {
  activeIndex.value = (activeIndex.value + 1) % galleryImages.value.length;
};

const memberPostsRow1 = [
  { image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80' },
  { image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80' },
  { image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80' },
  { image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=400&q=80' },
  { image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=400&q=80' },
  { image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' }
];

const memberPostsRow2 = [
  { image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80' },
  { image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=400&q=80' },
  { image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=400&q=80' },
  { image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80' },
  { image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80' },
  { image: 'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?auto=format&fit=crop&w=400&q=80' }
];
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(16, 24, 40, 0.5);
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.4);
}
</style>
