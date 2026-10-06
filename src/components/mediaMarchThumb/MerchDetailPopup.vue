<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed max-h-dvh inset-0 z-[99999] flex items-center justify-center overflow-hidden font-['Poppins',sans-serif]"
        @click.self="close"
      >
        <!-- Modal Dialog Card -->
        <div
          class="relative w-full h-dvh md:h-auto lg:h-dvh lg:max-h-dvh bg-[rgba(0,0,0,0.05)] backdrop-blur-[125px] text-white lg:overflow-hidden flex flex-col my-auto"
        >
          <!-- Close Button Top Floating (Mobile/Desktop) -->
          <button
            @click="close"
            type="button"
            class="absolute top-3 right-3 sm:top-4 sm:right-4 z-50 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer"
            aria-label="Close Modal"
          >
            <img src="https://fansocial.app/wp-content/plugins/fansocial/assets/icons/svg/x-close.svg" alt="Close" class="w-6 h-6 sm:w-7 sm:h-7 brightness-0 invert pointer-events-none" />
          </button>

          <!-- Scrollable Modal Content Grid -->
          <div class="overflow-y-auto lg:overflow-hidden max-h-dvh h-dvh flex-1 custom-scrollbar pb-[6rem] lg:pb-0">
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-0">
              
              <!-- LEFT COLUMN: Image Gallery Section (7 Cols on Desktop) -->
              <div class="lg:col-span-6 flex flex-col justify-between lg:h-dvh">
                <!-- Main Preview Image -->
                <div class="relative w-full h-full aspect-[4/3] sm:aspect-[16/11] overflow-hidden flex items-center justify-center group shadow-inner">
                  <!-- Background Image -->
                   <div class="absolute inset-0 bg-cover bg-center bg-no-repeat" :style="{ backgroundImage: `url(${activeSlideImage})` }">
                   </div>
                   <!-- Blur Overlay -->
                  <div class="w-full h-full backdrop-blur-[24px] absolute inset-0 z-10"></div>

                  <!-- Bottom Tier Restriction Banner -->
                  <div
                    class="w-full px-2 text-xs font-semibold leading-[18px] min-h-7 text-center flex lg:hidden items-center justify-center gap-1 tracking-wider uppercase truncate bg-[rgba(255,0,102,0.65)] backdrop-blur-[5px] absolute bottom-0 left-0 z-30"
                  >
                    <div class="flex flex-col">
                      <div class="flex items-center gap-1">
                        <span>{{ merchData.tierType === 'free' ? '💫' : (merchData.tierType === 'tier-2' ? '🔥' : '🌸') }}</span>
                        <span class="truncate">{{ merchData.tier }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="w-full h-full flex items-center justify-center z-20">
                    <img
                      :src="activeSlideImage"
                      :alt="merchData.title"
                      class="w-full h-full object-contain transition-all duration-300"
                      @load="onImageLoad"
                    />
                  </div>
                </div>

                <!-- Gallery Thumbnails Strip (6 Thumbnails Grid) -->
                <div class="flex justify-center lg:grid lg:grid-cols-6 gap-1.5 sm:gap-2 pt-2">
                  <div
                    v-for="(img, idx) in galleryImages"
                    :key="idx"
                    @click="activeIndex = idx"
                    class="w-12 h-12 md:w-[4rem] md:h-[4rem] lg:w-full lg:h-full  aspect-square overflow-hidden cursor-pointer border-1 border transition-all relative"
                    :class="activeIndex === idx ? 'border-[#F5F5F4]' : 'border-transparent'"
                  >
                  <!-- Background Image -->
                   <div class="absolute inset-0 bg-cover bg-center bg-no-repeat" :style="{ backgroundImage: `url(${img})` }">
                   </div>
                   <!-- Blur Overlay -->
                  <div class="w-full h-full backdrop-blur-[24px] absolute inset-0 z-10"></div>
                  <div class="w-full h-full flex items-center justify-center z-20 relative">
                    <img :src="img" :alt="'Thumb ' + (idx + 1)" class="w-full h-full object-cover" @load="onImageLoad" />
                  </div>
                  </div>
                </div>
              </div>

              <!-- RIGHT COLUMN: Merch Info & Member Only Subscription Card (5 Cols on Desktop) -->
              <div class="lg:col-span-6 p-4 pb-0 sm:p-6 sm:pb-0 lg:p-6 lg:pb-0 flex flex-col gap-10 justify-between lg:overflow-y-auto lg:max-h-dvh">
                
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

                <!-- Mobile Price & Unlock Slanted Action Bar (Mobile Only) -->
                  <MerchBuyNowBarMobile
                    :price="merchData.price || '25'"
                    :old-price="merchData.oldPrice || '$50'"
                    currency="USD$"
                    button-text="SUBSCRIBE TO UNLOCK"
                    sub-text="starting USD$29.9/mo"
                    @click="isMobileMemberPopupOpen = true"
                  />

                <!-- MEMBER ONLY MERCH CARD (Pink Magenta Gradient Box) -->
                <div class="relative rounded-3xl bg-[linear-gradient(0deg,rgba(255,0,102,0.40)_0%,rgba(255,0,102,0.40)_100%),linear-gradient(0deg,rgba(12,17,29,0.75)_0%,rgba(12,17,29,0.75)_100%)] shadow-[0_0_8px_0_rgba(255,0,102,0.40)] backdrop-blur-[4px] hidden md:flex flex-col gap-6 items-center text-center pt-[5rem] mt-5 pb-12 lg:pb-0">
                  
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
                          <!-- Background Image -->
                          <div class="absolute inset-0 bg-cover bg-center bg-no-repeat" :style="{ backgroundImage: `url(${post.image})` }"></div>
                          <!-- Blur Overlay -->
                          <div class="w-full h-full backdrop-blur-[24px] absolute inset-0 z-10"></div>
                          <div class="w-full h-full relative z-20 flex items-center justify-center">
                            <img :src="post.image" :alt="'Exclusive Row 1 ' + pIdx" class="w-full h-full object-cover select-none pointer-events-none" @load="onImageLoad" />
                          </div>
                          <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.50)_100%)] flex items-start justify-start p-2 z-30">
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
                          <!-- Background Image -->
                          <div class="absolute inset-0 bg-cover bg-center bg-no-repeat" :style="{ backgroundImage: `url(${post.image})` }"></div>
                          <!-- Blur Overlay -->
                          <div class="w-full h-full backdrop-blur-[24px] absolute inset-0 z-10"></div>
                          <div class="w-full h-full relative z-20 flex items-center justify-center">
                            <img :src="post.image" :alt="'Exclusive Row 2 ' + pIdx" class="w-full h-full object-cover select-none pointer-events-none" @load="onImageLoad" />
                          </div>
                          <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.50)_100%)] flex items-start justify-start p-2 z-30">
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

  <!-- MOBILE MEMBER ONLY MERCH CARD POPUP MODAL (Mobile Only) -->
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="isMobileMemberPopupOpen"
        class="fixed inset-0 z-[100000] flex items-end justify-center md:hidden bg-[linear-gradient(0deg,rgba(0,0,0,0.80)_0%,rgba(0,0,0,0.80)_100%),url(<path-to-image>)] bg-center bg-cover bg-no-repeat"
        @click.self="isMobileMemberPopupOpen = false"
      >
        <!-- Close Button Floating Top Right -->
        <button
          @click="close"
          type="button"
          class="absolute top-3 right-3 sm:top-4 sm:right-4 z-50 w-8 h-8 rounded-full flex items-center justify-center transition-all cursor-pointer backdrop-blur-sm border border-slate-700/50"
          aria-label="Close Modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" fill="none">
<path d="M24 8L8 24M8 8L24 24" stroke="#D0D5DD" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
        </button>
        <div
          class="relative w-full max-w-md max-h-[92dvh] mt-auto rounded-t-[20px] bg-[linear-gradient(0deg,rgba(255,0,102,0.40)_0%,rgba(255,0,102,0.40)_100%),linear-gradient(0deg,rgba(12,17,29,0.75)_0%,rgba(12,17,29,0.75)_100%)] bg-center bg-cover bg-no-repeat shadow-[0_0_8px_0_rgba(255,0,102,0.40)] backdrop-blur-[4px] pt-[4.5rem] text-white flex flex-col gap-6 items-center text-center"
        >

          <!-- Background Pattern Image Overlay -->
          <img
            src="https://fansocial.app/wp-content/plugins/fansocial/new-home/assets/images/ready-to-earn-bg.jpg"
            alt="Background Pattern"
            class="absolute inset-0 w-full h-full object-cover opacity-30 mix-blend-overlay pointer-events-none z-0 rounded-3xl"
          />

          <!-- Glowing Floating Lock Icon -->
          <div class="absolute -top-[2.2rem] z-10 w-[5.5rem] h-[5.5rem] flex items-center justify-center">
            <img
              src="https://fansocial.app/wp-content/plugins/fansocial/assets/icons/lock-lg.png"
              alt="Lock Icon"
              class="absolute inset-0 w-full h-full object-cover mix-blend-overlay pointer-events-none z-0"
            />
          </div>

          <div class="w-full flex flex-col gap-6 items-center text-center overflow-y-auto custom-scrollbar max-h-[85dvh]">
            <div class="px-3 flex flex-col gap-2 mb-1">
              <h3 class="relative z-10 text-white text-base font-semibold tracking-tight">
                This is a member only merch
              </h3>
              <p class="relative z-10 text-white text-sm font-medium">
                you need to subscribe to <span class="font-semibold text-white underline">🌸 {{ merchData.tier || 'Tier 1 - Close Circle' }}</span> before you can buy this merch from &#64;bebe.
              </p>
            </div>

            <div class="w-full px-2 flex flex-col gap-4">
              <!-- JOIN TIER BUTTON -->
              <MerchJoinTierBar :tier="merchData.tier" @join="onJoinTier" />

              <p class="relative z-10 text-xs font-medium text-white">
                Enjoy over ## member media and # exclusive merch once you subscribed!
              </p>
            </div>

            <!-- Exclusive Tier Content Preview Tracks (2 Scrollable Drag Rows) -->
            <div class="relative z-10 w-full flex flex-col gap-2">
              <!-- Row 1: Mobile Drag / Swipe Scroll Row 1 -->
              <div
                ref="mobileRow1Ref"
                @mousedown="startMobileDrag1"
                @mouseleave="stopMobileDrag1"
                @mouseup="stopMobileDrag1"
                @mousemove="moveMobileDrag1"
                class="w-full overflow-x-auto overscroll-x-contain touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing select-none"
              >
                <div class="flex gap-2 w-max">
                  <div
                    v-for="(post, pIdx) in memberPostsRow1"
                    :key="'m-r1-' + pIdx"
                    class="w-[9.5rem] aspect-video rounded-xl overflow-hidden relative group/post bg-slate-900 border border-pink-500/30 shrink-0 shadow-md transition-all hover:scale-[1.03]"
                  >
                    <!-- Background Image -->
                    <div class="absolute inset-0 bg-cover bg-center bg-no-repeat" :style="{ backgroundImage: `url(${post.image})` }"></div>
                    <!-- Blur Overlay -->
                    <div class="w-full h-full backdrop-blur-[24px] absolute inset-0 z-10"></div>
                    <div class="w-full h-full relative z-20 flex items-center justify-center">
                      <img :src="post.image" :alt="'Exclusive Row 1 ' + pIdx" class="w-full h-full object-cover select-none pointer-events-none" @load="onImageLoad" />
                    </div>
                    <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.50)_100%)] flex items-start justify-start p-2 z-30">
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

              <!-- Row 2: Mobile Drag / Swipe Scroll Row 2 -->
              <div
                ref="mobileRow2Ref"
                @mousedown="startMobileDrag2"
                @mouseleave="stopMobileDrag2"
                @mouseup="stopMobileDrag2"
                @mousemove="moveMobileDrag2"
                class="w-full overflow-x-auto overscroll-x-contain touch-pan-x [scrollbar-width:none] [&::-webkit-scrollbar]:hidden cursor-grab active:cursor-grabbing select-none"
              >
                <div class="flex gap-2 w-max">
                  <div
                    v-for="(post, pIdx) in memberPostsRow2"
                    :key="'m-r2-' + pIdx"
                    class="w-[9.5rem] aspect-video rounded-xl overflow-hidden relative group/post bg-slate-900 border border-pink-500/30 shrink-0 shadow-md transition-all hover:scale-[1.03]"
                  >
                    <!-- Background Image -->
                    <div class="absolute inset-0 bg-cover bg-center bg-no-repeat" :style="{ backgroundImage: `url(${post.image})` }"></div>
                    <!-- Blur Overlay -->
                    <div class="w-full h-full backdrop-blur-[24px] absolute inset-0 z-10"></div>
                    <div class="w-full h-full relative z-20 flex items-center justify-center">
                      <img :src="post.image" :alt="'Exclusive Row 2 ' + pIdx" class="w-full h-full object-cover select-none pointer-events-none" @load="onImageLoad" />
                    </div>
                    <div class="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0.50)_100%)] flex items-start justify-start p-2 z-30">
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
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue';
import MerchBuyNowBar from './MerchBuyNowBar.vue';
import MerchBuyNowBarMobile from './MerchBuyNowBarMobile.vue';
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

const isMobileMemberPopupOpen = ref(false);

const close = () => {
  isMobileMemberPopupOpen.value = false;
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

// Mobile Popup Drag Handlers
const mobileRow1Ref = ref(null);
const mobileRow2Ref = ref(null);

let isMobileDragging1 = false;
let startXMobile1 = 0;
let scrollLeftMobile1 = 0;

const startMobileDrag1 = (e) => {
  isMobileDragging1 = true;
  if (!mobileRow1Ref.value) return;
  startXMobile1 = e.pageX - mobileRow1Ref.value.offsetLeft;
  scrollLeftMobile1 = mobileRow1Ref.value.scrollLeft;
};
const stopMobileDrag1 = () => { isMobileDragging1 = false; };
const moveMobileDrag1 = (e) => {
  if (!isMobileDragging1 || !mobileRow1Ref.value) return;
  e.preventDefault();
  const x = e.pageX - mobileRow1Ref.value.offsetLeft;
  const walk = (x - startXMobile1) * 1.5;
  mobileRow1Ref.value.scrollLeft = scrollLeftMobile1 - walk;
};

let isMobileDragging2 = false;
let startXMobile2 = 0;
let scrollLeftMobile2 = 0;

const startMobileDrag2 = (e) => {
  isMobileDragging2 = true;
  if (!mobileRow2Ref.value) return;
  startXMobile2 = e.pageX - mobileRow2Ref.value.offsetLeft;
  scrollLeftMobile2 = mobileRow2Ref.value.scrollLeft;
};
const stopMobileDrag2 = () => { isMobileDragging2 = false; };
const moveMobileDrag2 = (e) => {
  if (!isMobileDragging2 || !mobileRow2Ref.value) return;
  e.preventDefault();
  const x = e.pageX - mobileRow2Ref.value.offsetLeft;
  const walk = (x - startXMobile2) * 1.5;
  mobileRow2Ref.value.scrollLeft = scrollLeftMobile2 - walk;
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
