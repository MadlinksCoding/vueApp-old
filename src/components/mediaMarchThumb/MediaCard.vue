<template>
  <!-- Skeleton Loader Card -->
  <div
    v-if="skeleton"
    class="flex flex-col gap-3 rounded-lg overflow-hidden animate-pulse w-full"
  >
    <div class="w-full aspect-video rounded-lg bg-[rgba(234,236,240,0.50)]"></div>
    <div class="h-6 rounded-lg bg-[rgba(234,236,240,0.50)] w-3/4"></div>
    <div class="h-6 rounded-lg bg-[rgba(234,236,240,0.50)] w-1/3"></div>
  </div>

  <!-- Live Media Card -->
  <article
    v-else
    class="group relative flex flex-col gap-3 rounded-lg cursor-pointer overflow-visible bg-transparent isolate transition-all duration-200 origin-top hover:z-40 focus-within:z-40 w-full"
  >
    <!-- Base Thumbnail Container (Non-Hover State) -->
    <div
      class="w-full aspect-video relative rounded-lg overflow-hidden transition-all duration-200 ease-out opacity-100 group-hover:opacity-0 group-focus-within:opacity-0 bg-slate-900"
    >
      <!-- 1. Single Image Layout -->
      <div
        v-if="item.layoutType === 'single'"
        class="w-full h-full relative overflow-hidden flex items-center justify-center"
      >
        <!-- Background Image -->
        <div
          class="absolute inset-0 bg-cover bg-center bg-no-repeat"
          :style="{ backgroundImage: `url(${item.slides?.[item.activeSlide || 0] || item.slides?.[0]})` }"
        ></div>
        <!-- Blur Overlay -->
        <div class="w-full h-full backdrop-blur-[24px] absolute inset-0 z-10"></div>
        <div class="w-full h-full flex items-center justify-center z-20 relative">
          <img
            class="w-full h-full object-cover"
            :src="item.slides?.[item.activeSlide || 0] || item.slides?.[0]"
            :alt="item.title"
            @load="onImageLoad"
          />
        </div>
      </div>

      <!-- 2. Single Video Layout -->
      <div
        v-else-if="item.layoutType === 'video'"
        class="w-full h-full relative overflow-hidden flex items-center justify-center"
      >
        <!-- Background Image -->
        <div
          class="absolute inset-0 bg-cover bg-center bg-no-repeat"
          :style="{ backgroundImage: `url(${item.slides?.[item.activeSlide || 0] || item.slides?.[0]})` }"
        ></div>
        <!-- Blur Overlay -->
        <div class="w-full h-full backdrop-blur-[24px] absolute inset-0 z-10"></div>
        <div class="w-full h-full flex items-center justify-center z-20 relative">
          <img
            class="w-full h-full object-cover"
            :src="item.slides?.[item.activeSlide || 0] || item.slides?.[0]"
            :alt="item.title"
            @load="onImageLoad"
          />
        </div>
      </div>

      <!-- 3. Two-Grid Image Layout -->
      <div
        v-else-if="item.layoutType === 'two-grid'"
        class="w-full h-full grid grid-cols-2 gap-0.5 bg-slate-950"
      >
        <div class="w-full h-full relative overflow-hidden flex items-center justify-center">
          <!-- Background Image -->
          <div
            class="absolute inset-0 bg-cover bg-center bg-no-repeat"
            :style="{ backgroundImage: `url(${item.slides?.[0]})` }"
          ></div>
          <!-- Blur Overlay -->
          <div class="w-full h-full backdrop-blur-[24px] absolute inset-0 z-10"></div>
          <div class="w-full h-full flex items-center justify-center z-20 relative">
            <img
              class="w-full h-full object-cover"
              :src="item.slides?.[0]"
              :alt="item.title + ' Image 1'"
              @load="onImageLoad"
            />
          </div>
        </div>
        <div class="w-full h-full relative overflow-hidden flex items-center justify-center">
          <!-- Background Image -->
          <div
            class="absolute inset-0 bg-cover bg-center bg-no-repeat"
            :style="{ backgroundImage: `url(${item.slides?.[1] || item.slides?.[0]})` }"
          ></div>
          <!-- Blur Overlay -->
          <div class="w-full h-full backdrop-blur-[24px] absolute inset-0 z-10"></div>
          <div class="w-full h-full flex items-center justify-center z-20 relative">
            <img
              class="w-full h-full object-cover"
              :src="item.slides?.[1] || item.slides?.[0]"
              :alt="item.title + ' Image 2'"
              @load="onImageLoad"
            />
          </div>
        </div>
      </div>

      <!-- 4. Three-Grid Image Layout -->
      <div
        v-else-if="item.layoutType === 'three-grid'"
        class="w-full h-full grid grid-cols-2 gap-0.5 bg-slate-950"
      >
        <div class="w-full h-full relative overflow-hidden flex items-center justify-center">
          <!-- Background Image -->
          <div
            class="absolute inset-0 bg-cover bg-center bg-no-repeat"
            :style="{ backgroundImage: `url(${item.slides?.[0]})` }"
          ></div>
          <!-- Blur Overlay -->
          <div class="w-full h-full backdrop-blur-[24px] absolute inset-0 z-10"></div>
          <div class="w-full h-full flex items-center justify-center z-20 relative">
            <img
              class="w-full h-full object-cover"
              :src="item.slides?.[0]"
              :alt="item.title + ' Main Image'"
              @load="onImageLoad"
            />
          </div>
        </div>
        <div class="w-full h-full flex flex-col gap-0.5 overflow-hidden">
          <div class="w-full h-1/2 relative overflow-hidden flex items-center justify-center">
            <!-- Background Image -->
            <div
              class="absolute inset-0 bg-cover bg-center bg-no-repeat"
              :style="{ backgroundImage: `url(${item.slides?.[1] || item.slides?.[0]})` }"
            ></div>
            <!-- Blur Overlay -->
            <div class="w-full h-full backdrop-blur-[24px] absolute inset-0 z-10"></div>
            <div class="w-full h-full flex items-center justify-center z-20 relative">
              <img
                class="w-full h-full object-cover"
                :src="item.slides?.[1] || item.slides?.[0]"
                :alt="item.title + ' Side 1'"
                @load="onImageLoad"
              />
            </div>
          </div>
          <div class="w-full h-1/2 relative overflow-hidden flex items-center justify-center">
            <!-- Background Image -->
            <div
              class="absolute inset-0 bg-cover bg-center bg-no-repeat"
              :style="{ backgroundImage: `url(${item.slides?.[2] || item.slides?.[0]})` }"
            ></div>
            <!-- Blur Overlay -->
            <div class="w-full h-full backdrop-blur-[24px] absolute inset-0 z-10"></div>
            <div class="w-full h-full flex items-center justify-center z-20 relative">
              <img
                class="w-full h-full object-cover"
                :src="item.slides?.[2] || item.slides?.[0]"
                :alt="item.title + ' Side 2'"
                @load="onImageLoad"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Locked Overlay -->
      <div
        v-if="item.isLocked"
        class="absolute inset-0 bg-black/50 backdrop-blur-md z-30 flex items-center justify-center"
      >
        <img
          src="https://fansocial.app/wp-content/plugins/fansocial/assets/icons/svg/lock-lg.svg"
          alt="Lock Icon"
          class="w-[67px] h-[96px] drop-shadow-md"
        />
      </div>

      <!-- Top Gradient Overlay (Counts & Badges) -->
      <div
        class="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0.06)_40%,rgba(0,0,0,0.04)_100%)] p-[0.375rem] rounded-lg z-30 flex items-start justify-between pointer-events-none"
      >
        <div class="flex items-center gap-[0.375rem] opacity-90 text-white text-xs">
          <div v-if="item.likes" class="flex items-center gap-1 px-[0.375rem]">
            <img
              src="https://fansocial.app/wp-content/plugins/fansocial/assets/icons/svg/heart.svg"
              alt="Heart"
              class="w-[0.875rem] h-[0.875rem]"
            />
            <span>{{ item.likes }}</span>
          </div>
          <div v-if="item.views" class="flex items-center gap-1 px-[0.375rem]">
            <img
              src="https://fansocial.app/wp-content/plugins/fansocial/assets/icons/svg/eyeWhite.svg"
              alt="Views"
              class="w-[0.875rem] h-[0.875rem]"
            />
            <span>{{ item.views }}</span>
          </div>
        </div>
        <span
          v-if="item.badgeText"
          class="flex items-center gap-[0.375rem] px-[0.375rem] py-1 rounded bg-[rgba(24,34,48,0.75)] text-white text-xs tracking-wider uppercase"
        >
          <img
            :src="item.layoutType === 'video' ? 'https://fansocial.app/wp-content/plugins/fansocial/assets/icons/svg/play-square-1.svg' : 'https://fansocial.app/wp-content/plugins/fansocial/assets/icons/svg/image-gallery.svg'"
            :alt="item.layoutType"
            class="w-[1.125rem] h-[1.125rem]"
          />
          <span>{{ item.badgeText }}</span>
        </span>
      </div>

      <!-- Discount Flag Tag -->
      <div
        v-if="item.discountTag"
        class="absolute bottom-0 left-0 flex items-center z-30 pointer-events-none"
      >
        <div class="relative flex items-center justify-center bg-[#FFD901] py-1 pr-1 pl-2">
          <span class="text-xs font-bold text-[#182230] italic">{{ item.discountTag }}</span>
        </div>
        <img
          src="https://fansocial.app/wp-content/plugins/fansocial/assets/icons/svg/union-yellow.svg"
          alt="Flag Tag"
          class="h-6 shrink-0"
        />
      </div>
    </div>

    <!-- Base Card Bottom Content (Non-Hover State) -->
    <div
      class="w-full flex flex-col gap-3 transition-all duration-200 group-hover:opacity-0 group-focus-within:opacity-0"
    >
      <h3 class="text-white text-base font-semibold line-clamp-1">{{ item.title }}</h3>
      <div class="w-full flex items-center gap-2">
        <button
          v-for="(btn, bIdx) in item.buttons"
          :key="bIdx"
          type="button"
          class="flex rounded-md overflow-hidden shadow"
          :class="btn.type === 'p2v' ? 'bg-gradient-to-r from-[#0762FF] to-[#0018EF]' : (btn.type === 'preorder' ? 'bg-gradient-to-r from-[#07F468] to-[#00EF9B]' : 'bg-gradient-to-r from-[#FF0066] to-[#FF0004]')"
        >
          <span
            class="after:content-[''] after:bg-[url('https://fansocial.app/wp-content/plugins/fansocial/assets/icons/svg/button-union.svg')] after:bg-no-repeat after:bg-cover after:w-[8.65px] after:h-full after:absolute after:right-0 after:top-0 text-xs font-semibold uppercase flex items-center pl-[6px] pr-4 py-1 relative"
            :class="btn.type === 'preorder' ? 'text-[#0C111D] font-bold' : 'text-white'"
          >
            {{ btn.label }}
          </span>
          <span class="px-[6px] py-[3px] flex items-center gap-1 bg-[#182230]">
            <span
              class="text-sm font-medium"
              :class="btn.oldPrice ? 'text-[#FFD901]' : (btn.type === 'preorder' ? 'text-[#07F468] font-bold' : (btn.price === 'FREE' ? 'text-[#FFD901] font-bold' : 'text-white'))"
            >
              {{ btn.price.startsWith('$') || btn.price === 'FREE' ? btn.price : '$' + btn.price }}
            </span>
            <span
              v-if="btn.oldPrice"
              class="line-through text-[#FFD901] font-semibold text-[10px]"
            >
              {{ btn.oldPrice.startsWith('$') ? btn.oldPrice : '$' + btn.oldPrice }}
            </span>
            <span
              v-if="btn.subText"
              class="text-[10px] font-normal"
              :class="btn.oldPrice ? 'text-[#FFD901]' : (btn.type === 'preorder' ? 'text-[#FFD901]' : 'text-white')"
            >
              {{ btn.subText }}
            </span>
          </span>
        </button>
      </div>
    </div>

    <!-- Hover Popout Overlay (Interactive Slider Preview) -->
    <div
      class="absolute left-0 right-0 -top-10 w-full opacity-0 invisible pointer-events-none z-40 scale-125 origin-top transition-all duration-200 ease-out group-hover:opacity-100 group-hover:visible group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:visible group-focus-within:pointer-events-auto"
    >
      <div
        class="flex flex-col overflow-hidden rounded-lg bg-[rgba(12,17,29,0.90)] shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03)]"
      >
        <!-- Vue Slider Container -->
        <div class="relative w-full aspect-video group/slider overflow-hidden rounded-t-xl bg-slate-900">
          <!-- Background Image -->
          <div
            class="absolute inset-0 bg-cover bg-center bg-no-repeat"
            :style="{ backgroundImage: `url(${item.slides?.[item.activeSlide || 0] || item.slides?.[0]})` }"
          ></div>
          <!-- Blur Overlay -->
          <div class="w-full h-full backdrop-blur-[24px] absolute inset-0 z-10"></div>

          <!-- Active Slide Image -->
          <div class="w-full h-full flex items-center justify-center z-20 relative">
            <img
              class="block w-full h-full object-cover transition-opacity duration-300"
              :src="item.slides?.[item.activeSlide || 0] || item.slides?.[0]"
              :alt="item.title"
              @load="onImageLoad"
            />
          </div>

          <!-- Locked Overlay (Hover Popout) -->
          <div
            v-if="item.isLocked"
            class="absolute inset-0 bg-black/50 backdrop-blur-md z-30 flex items-center justify-center"
          >
            <img
              src="https://fansocial.app/wp-content/plugins/fansocial/assets/icons/svg/lock-lg.svg"
              alt="Lock Icon"
              class="w-[67px] h-[96px] drop-shadow-md"
            />
          </div>

          <!-- Prev Arrow Button -->
          <button
            v-if="item.slides && item.slides.length > 1"
            @click.stop="prevSlide"
            type="button"
            class="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-white z-30 transition-all cursor-pointer"
            aria-label="Previous Slide"
          >
            <img
              src="https://fansocial.app/wp-content/plugins/fansocial/assets/icons/svg/chevron-left-white.svg"
              alt=""
              class="w-full h-full object-contain"
            />
          </button>

          <!-- Next Arrow Button -->
          <button
            v-if="item.slides && item.slides.length > 1"
            @click.stop="nextSlide"
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-white z-30 transition-all cursor-pointer"
            aria-label="Next Slide"
          >
            <img
              src="https://fansocial.app/wp-content/plugins/fansocial/assets/icons/svg/chevron-right-white.svg"
              alt=""
              class="w-full h-full object-contain"
            />
          </button>

          <!-- Slide Indicators (Clickable) -->
          <div
            v-if="item.slides && item.slides.length > 1"
            class="absolute bottom-1.5 left-0 right-0 z-30 flex gap-1"
          >
            <button
              v-for="(slide, sIdx) in item.slides"
              :key="sIdx"
              @click.stop="setSlide(sIdx)"
              type="button"
              class="flex-1 h-[3px] rounded-full transition-colors duration-200 cursor-pointer border-0 p-0 outline-none"
              :class="sIdx === item.activeSlide ? 'bg-white/50' : 'bg-white/15'"
              :aria-label="'Go to slide ' + (sIdx + 1)"
            ></button>
          </div>

          <!-- Bottom Gradient Fade -->
          <div
            class="absolute bottom-0 left-0 right-0 h-6 bg-[linear-gradient(180deg,rgba(12,17,29,0)_25%,#0C111D_100%)] pointer-events-none z-30"
          ></div>
        </div>

        <!-- Card Body Section -->
        <div class="p-4 bg-[#0f172a] flex flex-col gap-4 rounded-b-xl">
          <div class="flex flex-col gap-4">
            <h3 class="m-0 text-white text-sm sm:text-base font-semibold underline leading-snug line-clamp-1 cursor-pointer">
              {{ item.title }}
            </h3>
            <p class="m-0 text-slate-300 text-sm line-clamp-2 leading-relaxed">
              {{ item.description }}
            </p>
          </div>
          <div class="flex flex-col gap-2 w-full">
            <button
              v-for="(btn, bIdx) in item.buttons"
              :key="bIdx"
              type="button"
              class="flex rounded-md overflow-hidden w-full h-8 shadow hover:brightness-110 transition-all"
              :class="btn.type === 'p2v' ? 'bg-gradient-to-r from-[#0762FF] to-[#0018EF]' : (btn.type === 'preorder' ? 'bg-gradient-to-r from-[#07F468] to-[#00EF9B]' : 'bg-gradient-to-r from-[#FF0066] to-[#FF0004]')"
            >
              <span
                class="after:content-[''] after:bg-[url('https://fansocial.app/wp-content/plugins/fansocial/assets/icons/svg/button-union.svg')] after:bg-no-repeat after:bg-cover after:w-[10.65px] after:h-full after:absolute after:right-0 after:top-0 text-xs font-semibold uppercase flex items-center pl-4 pr-6 py-[6px] relative tracking-wider"
                :class="btn.type === 'preorder' ? 'text-[#0C111D]' : 'text-white'"
              >
                {{ btn.hoverLabel || (btn.type === 'p2v' ? 'PAY TO VIEW' : btn.label) }}
              </span>
              <span class="px-2.5 py-2 flex items-center justify-end gap-2 bg-[#182230] flex-1">
                <div class="flex items-center gap-[2px]">
                  <span
                    class="text-[10px] sm:text-xs font-medium"
                    :class="btn.oldPrice ? 'text-[#FFD901]' : (btn.type === 'preorder' ? 'text-[#07F468]' : (btn.price === 'FREE' ? 'text-[#FFD901]' : 'text-white'))"
                  >
                    {{ btn.price.startsWith('$') || btn.price === 'FREE' ? btn.price : '$' + btn.price }}
                  </span>
                  <span
                    v-if="btn.oldPrice"
                    class="line-through text-[#FFD901] font-normal text-[9px] sm:text-[10px]"
                  >
                    {{ btn.oldPrice.startsWith('$') ? btn.oldPrice : '$' + btn.oldPrice }}
                  </span>
                  <span
                    v-if="btn.subText"
                    class="text-[9px] sm:text-[10px] font-normal"
                    :class="btn.oldPrice ? 'text-[#FFD901]' : (btn.type === 'preorder' ? 'text-[#FFD901]' : 'text-white')"
                  >
                    {{ btn.subText }}
                  </span>
                </div>

                <span
                  v-if="btn.discount"
                  class="bg-[#FFD901] h-4 text-[#182230] font-bold text-[10px] px-0.5 py-0 rounded-sm ml-0.5"
                >
                  {{ btn.discount }}
                </span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup>
const props = defineProps({
  item: {
    type: Object,
    default: () => ({})
  },
  skeleton: {
    type: Boolean,
    default: false
  }
});

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

const nextSlide = () => {
  if (props.item && props.item.slides && props.item.slides.length > 0) {
    const active = props.item.activeSlide || 0;
    props.item.activeSlide = (active + 1) % props.item.slides.length;
  }
};

const prevSlide = () => {
  if (props.item && props.item.slides && props.item.slides.length > 0) {
    const active = props.item.activeSlide || 0;
    props.item.activeSlide = (active - 1 + props.item.slides.length) % props.item.slides.length;
  }
};

const setSlide = (index) => {
  if (props.item) {
    props.item.activeSlide = index;
  }
};
</script>
