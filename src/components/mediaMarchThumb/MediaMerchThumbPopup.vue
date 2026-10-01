<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[9999] flex items-start justify-start overflow-hidden font-['Poppins',sans-serif]"
        @click.self="close"
      >
        <!-- Modal Dialog Window -->
        <div
          class="relative w-full h-dvh flex flex-col text-white shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden"
        >
          <!-- Modal Header -->
          <header class="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-6 py-4 border-b border-slate-800/80 bg-[#101828]">
            <div class="flex flex-wrap items-center gap-4">
              <div>
                <h2 class="text-lg sm:text-xl font-semibold tracking-wide uppercase text-white">
                  MEDIA & MERCH THUMBNAILS
                </h2>
                <p class="text-xs text-slate-400 mt-0.5">
                  Interactive Vue 3 slider with media & merch grid variations
                </p>
              </div>

              <!-- Main Navigation Tabs: MEDIA / MERCH -->
              <div class="flex items-center gap-1 bg-[#182230] p-1 rounded-xl border border-slate-700/60 ml-0 sm:ml-2">
                <button
                  @click="activeMainTab = 'media'"
                  type="button"
                  class="px-4 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all tracking-wider cursor-pointer"
                  :class="activeMainTab === 'media' ? 'bg-gradient-to-r from-[#0762FF] to-[#0018EF] text-white shadow-lg' : 'text-slate-400 hover:text-white'"
                >
                  MEDIA
                </button>
                <button
                  @click="activeMainTab = 'merch'"
                  type="button"
                  class="px-4 py-1.5 rounded-lg text-xs font-semibold uppercase transition-all tracking-wider cursor-pointer"
                  :class="activeMainTab === 'merch' ? 'bg-gradient-to-r from-[#0762FF] to-[#0018EF] text-white shadow-lg' : 'text-slate-400 hover:text-white'"
                >
                  MERCH
                </button>
              </div>
            </div>

            <div class="flex items-center gap-3 w-full sm:w-auto justify-end">
              <!-- Close Modal Button -->
              <button
                @click="close"
                type="button"
                class="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer shrink-0"
                aria-label="Close Modal"
              >
                <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
          </header>

          <!-- Modal Scrollable Content Body -->
          <main class="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-8 lg:py-10 bg-[#101828]/95">
            <!-- MEDIA TAB CONTENT -->
            <template v-if="activeMainTab === 'media'">
              <!-- Filter Controls Toolbar (Layout & Sub State) -->
              <div class="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800/60">
                <!-- Media Layout Type Filters -->
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-xs uppercase font-medium text-slate-400 tracking-wider">Layout:</span>
                  <div class="flex flex-wrap items-center gap-1.5 bg-[#182230] p-1 rounded-lg border border-slate-700/50 text-xs">
                    <button
                      v-for="filter in ['all', 'three-grid', 'two-grid', 'single', 'video']"
                      :key="filter"
                      @click="activeFilter = filter"
                      type="button"
                      class="px-2.5 py-1 rounded font-medium transition-all capitalize cursor-pointer"
                      :class="activeFilter === filter ? 'bg-[#0762FF] text-white shadow' : 'text-slate-300 hover:text-white'"
                    >
                      {{ filter === 'all' ? 'All Layouts' : filter.replace('-', ' ') }}
                    </button>
                  </div>
                </div>

                <!-- Media Sub State Filters -->
                <div class="flex items-center gap-2">
                  <span class="text-xs uppercase font-medium text-slate-400 tracking-wider">Sub State:</span>
                  <div class="flex items-center gap-1.5 bg-[#182230] p-1 rounded-lg border border-slate-700/50 text-xs">
                    <button
                      v-for="subState in [
                        { key: 'all', label: 'All States' },
                        { key: 'unlocked', label: 'Unlocked' },
                        { key: 'locked', label: 'Locked' }
                      ]"
                      :key="subState.key"
                      @click="subStateFilter = subState.key"
                      type="button"
                      class="px-2.5 py-1 rounded font-medium transition-all capitalize cursor-pointer"
                      :class="subStateFilter === subState.key ? 'bg-[#0762FF] text-white shadow' : 'text-slate-300 hover:text-white'"
                    >
                      {{ subState.label }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Section Header -->
              <header class="flex justify-between md:justify-start w-full items-center border-b border-slate-800/60 pb-4 mb-8">
                  <div class="flex items-center gap-2">
                      <!-- Flash Icon -->
                      <img src="https://fansocial.app/wp-content/plugins/fansocial/assets/icons/svg/flash-green.svg"
                          alt="Flash Icon" class="w-7 h-7 shrink-0">
                      <h2 class="text-xl sm:text-2xl text-white font-semibold tracking-wide uppercase">LATEST UPLOAD</h2>
                  </div>
                  <div class="flex items-start gap-1 ml-2">
                      <a href="#" class="text-base text-[#07F468] italic font-normal hover:underline">View All</a>
                      <span class="text-xs text-[#07F468] italic font-medium">{{ filteredMediaItems.length }}</span>
                  </div>
              </header>
            <!-- Media Thumbnail Grid -->
            <div
              id="media-grid"
              class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-x-4 lg:gap-y-10 w-full"
            >
              <!-- Vue Media Thumbnail Card -->
              <article
                v-for="item in filteredMediaItems"
                :key="item.id"
                class="group relative flex flex-col gap-3 rounded-lg cursor-pointer overflow-visible bg-transparent isolate transition-all duration-200 origin-top hover:z-40 focus-within:z-40 w-full"
              >
                <!-- Base Thumbnail Container (Non-Hover State) -->
                <div
                  class="w-full aspect-video relative rounded-lg overflow-hidden transition-all duration-200 ease-out opacity-100 group-hover:opacity-0 group-focus-within:opacity-0 bg-slate-900"
                >
                  <!-- 1. Single Image Layout -->
                  <img
                    v-if="item.layoutType === 'single'"
                    class="w-full h-full object-cover"
                    :src="item.slides[item.activeSlide] || item.slides[0]"
                    :alt="item.title"
                    @load="onImageLoad"
                  />

                  <!-- 2. Single Video Layout -->
                  <div v-else-if="item.layoutType === 'video'" class="w-full h-full relative">
                    <img
                      class="w-full h-full object-cover"
                      :src="item.slides[item.activeSlide] || item.slides[0]"
                      :alt="item.title"
                      @load="onImageLoad"
                    />
                  </div>

                  <!-- 3. Two-Grid Image Layout -->
                  <div
                    v-else-if="item.layoutType === 'two-grid'"
                    class="w-full h-full grid grid-cols-2 gap-0.5 bg-slate-950"
                  >
                    <img
                      class="w-full h-full object-cover"
                      :src="item.slides[0]"
                      :alt="item.title + ' Image 1'"
                      @load="onImageLoad"
                    />
                    <img
                      class="w-full h-full object-cover"
                      :src="item.slides[1] || item.slides[0]"
                      :alt="item.title + ' Image 2'"
                      @load="onImageLoad"
                    />
                  </div>

                  <!-- 4. Three-Grid Image Layout (1 large image left 50% + 2 stacked right 50%) -->
                  <div
                    v-else-if="item.layoutType === 'three-grid'"
                    class="w-full h-full grid grid-cols-2 gap-0.5 bg-slate-950"
                  >
                    <div class="w-full h-full overflow-hidden">
                      <img
                        class="w-full h-full object-cover"
                        :src="item.slides[0]"
                        :alt="item.title + ' Main Image'"
                        @load="onImageLoad"
                      />
                    </div>
                    <div class="w-full h-full flex flex-col gap-0.5 overflow-hidden">
                      <img
                        class="w-full h-1/2 object-cover"
                        :src="item.slides[1] || item.slides[0]"
                        :alt="item.title + ' Side 1'"
                        @load="onImageLoad"
                      />
                      <img
                        class="w-full h-1/2 object-cover"
                        :src="item.slides[2] || item.slides[0]"
                        :alt="item.title + ' Side 2'"
                        @load="onImageLoad"
                      />
                    </div>
                  </div>

                  <!-- Locked Overlay -->
                  <div
                    v-if="item.isLocked"
                    class="absolute inset-0 bg-black/50 backdrop-blur-md z-10 flex items-center justify-center"
                  >
                    <img
                      src="https://fansocial.app/wp-content/plugins/fansocial/assets/icons/svg/lock-lg.svg"
                      alt="Lock Icon"
                      class="w-[67px] h-[96px] drop-shadow-md"
                    />
                  </div>

                  <!-- Top Gradient Overlay (Counts & Badges) -->
                  <div
                    class="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.35)_0%,rgba(0,0,0,0.06)_40%,rgba(0,0,0,0.04)_100%)] p-[0.375rem] rounded-lg z-20 flex items-start justify-between pointer-events-none"
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
                    class="absolute bottom-0 left-0 flex items-center z-20 pointer-events-none"
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
                      <!-- Active Slide Image -->
                      <img
                        class="block w-full h-full object-cover transition-opacity duration-300"
                        :src="item.slides[item.activeSlide]"
                        :alt="item.title"
                        @load="onImageLoad"
                      />

                      <!-- Locked Overlay (Hover Popout) -->
                      <div
                        v-if="item.isLocked"
                        class="absolute inset-0 bg-black/50 backdrop-blur-md z-10 flex items-center justify-center"
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
                        @click.stop="prevSlide(item)"
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
                        @click.stop="nextSlide(item)"
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
                        class="absolute bottom-1.5 left-0 right-0 z-20 flex gap-1"
                      >
                        <button
                          v-for="(slide, sIdx) in item.slides"
                          :key="sIdx"
                          @click.stop="setSlide(item, sIdx)"
                          type="button"
                          class="flex-1 h-[3px] rounded-full transition-colors duration-200 cursor-pointer border-0 p-0 outline-none"
                          :class="sIdx === item.activeSlide ? 'bg-white/50' : 'bg-white/15'"
                          :aria-label="'Go to slide ' + (sIdx + 1)"
                        ></button>
                      </div>

                      <!-- Bottom Gradient Fade -->
                      <div
                        class="absolute bottom-0 left-0 right-0 h-6 bg-[linear-gradient(180deg,rgba(12,17,29,0)_25%,#0C111D_100%)] pointer-events-none z-10"
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

              <!-- Skeleton Loaders (Shown during Load More) -->
              <template v-if="isLoading">
                <div
                  v-for="n in 4"
                  :key="'skeleton-' + n"
                  class="flex flex-col gap-3 rounded-lg overflow-hidden animate-pulse"
                >
                  <div class="w-full aspect-video rounded-lg bg-[rgba(234,236,240,0.50)]"></div>
                  <div class="h-6 rounded-lg bg-[rgba(234,236,240,0.50)] w-3/4"></div>
                  <div class="h-6 rounded-lg bg-[rgba(234,236,240,0.50)] w-1/3"></div>
                </div>
              </template>
            </div>

            <!-- LOAD MORE BUTTON SECTION -->
            <div class="flex flex-col items-center gap-4 mt-10 mb-4">
              <button
                @click="loadMore"
                :disabled="isLoading"
                type="button"
                class="h-10 pl-6 pr-2 py-2 border-[1.5px] border-white bg-[#182230] text-white text-base font-medium tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer hover:bg-[#202d3f]"
                :class="{ 'opacity-80 cursor-not-allowed': isLoading }"
              >
                <span>{{ isLoading ? 'Loading...' : 'LOAD MORE' }}</span>
                <span v-if="!isLoading" class="flex items-center gap-1">
                  <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
                  <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
                  <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
                </span>
              </button>
            </div>
          </template>

          <!-- MERCH TAB CONTENT -->
          <template v-else-if="activeMainTab === 'merch'">
            <!-- Filter & Display Control Toolbar -->
            <div class="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800/60">
              <!-- Merch Tier Filters -->
              <div class="flex flex-wrap items-center gap-2">
                <span class="text-xs uppercase font-medium text-slate-400 tracking-wider">Tier Filter:</span>
                <div class="flex flex-wrap items-center gap-1.5 bg-[#182230] p-1 rounded-lg border border-slate-700/50 text-xs">
                  <button
                    v-for="filter in [
                      { key: 'all', label: 'All Merch' },
                      { key: 'tier1', label: 'Tier 1' },
                      { key: 'tier2', label: 'Tier 2' },
                      { key: 'free', label: 'Free Tier' }
                    ]"
                    :key="filter.key"
                    @click="merchTierFilter = filter.key"
                    type="button"
                    class="px-2.5 py-1 rounded font-medium transition-all capitalize cursor-pointer"
                    :class="merchTierFilter === filter.key ? 'bg-[#0762FF] text-white shadow' : 'text-slate-300 hover:text-white'"
                  >
                    {{ filter.label }}
                  </button>
                </div>
              </div>

              <!-- Display Mode Toggle (Live Grid vs Skeleton View) -->
              <div class="flex items-center gap-2">
                <span class="text-xs uppercase font-medium text-slate-400 tracking-wider">Display Mode:</span>
                <div class="flex items-center gap-1.5 bg-[#182230] p-1 rounded-lg border border-slate-700/50 text-xs">
                  <button
                    @click="isMerchLoading = false"
                    type="button"
                    class="px-3 py-1 rounded font-medium transition-all cursor-pointer"
                    :class="!isMerchLoading ? 'bg-[#0762FF] text-white shadow' : 'text-slate-300 hover:text-white'"
                  >
                    Live Grid
                  </button>
                  <button
                    @click="isMerchLoading = true"
                    type="button"
                    class="px-3 py-1 rounded font-medium transition-all cursor-pointer flex items-center gap-1.5"
                    :class="isMerchLoading ? 'bg-[#0762FF] text-white shadow' : 'text-slate-300 hover:text-white'"
                  >
                    <span class="w-2 h-2 rounded-full bg-[#07F468] animate-pulse"></span>
                    Skeleton View
                  </button>
                </div>
              </div>
            </div>

            <!-- MEMBER EXCLUSIVE SECTION -->
            <div class="w-full mb-10">
              <header class="flex justify-between gap-3.5 md:justify-start w-full items-center border-l border-[#E9E5D3] mb-6 pl-4">
                <div class="flex items-center gap-2">
                  <h2 class="text-xl text-[#E9E5D3] font-medium tracking-wide uppercase">MEMBER EXCLUSIVE</h2>
                </div>
                <div class="flex items-start gap-1">
                  <a href="#" class="text-base text-[#07F468] italic font-normal hover:underline">View All</a>
                  <span class="text-xs text-[#07F468] italic font-medium">428</span>
                </div>
              </header>

              <!-- Skeleton Loader Grid (5 Columns matching design) -->
              <div
                v-if="isMerchLoading"
                class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 lg:gap-4 w-full"
              >
                <MerchCard
                  v-for="n in 10"
                  :key="'merch-skeleton-' + n"
                  skeleton
                />
              </div>

              <!-- Live Merch Grid (5 Columns matching design) -->
              <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 lg:gap-4 w-full">
                <MerchCard
                  v-for="item in filteredMerchItems"
                  :key="item.id"
                  :item="item"
                  @select="openMerchDetail"
                />
              </div>

              <!-- LOAD MORE BUTTON SECTION -->
              <div class="flex flex-col items-center gap-4 mt-8 mb-4">
                <button
                  @click="loadMoreMerch"
                  :disabled="isMerchLoading"
                  type="button"
                  class="h-10 pl-6 pr-2 py-2 border-[1.5px] border-white bg-[#182230] text-white text-base font-medium tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer hover:bg-[#202d3f]"
                  :class="{ 'opacity-80 cursor-not-allowed': isMerchLoading }"
                >
                  <span>{{ isMerchLoading ? 'Loading...' : 'LOAD MORE' }}</span>
                  <span v-if="!isMerchLoading" class="flex items-center gap-1">
                    <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
                    <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
                    <span class="w-1.5 h-1.5 rounded-full bg-white"></span>
                  </span>
                </button>
              </div>
            </div>
          </template>
        </main>
        </div>
      </div>
    </Transition>

    <!-- Merch Detail Popup Modal -->
    <MerchDetailPopup v-model="isMerchDetailOpen" :item="selectedMerchItem" />
  </Teleport>
</template>

<script setup>
import { ref, computed } from 'vue';
import MerchCard from './MerchCard.vue';
import MerchDetailPopup from './MerchDetailPopup.vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'close']);

const close = () => {
  emit('update:modelValue', false);
  emit('close');
};

const isLoading = ref(false);
const isMerchLoading = ref(false);
const isMerchDetailOpen = ref(false);
const selectedMerchItem = ref(null);

const openMerchDetail = (item) => {
  selectedMerchItem.value = item;
  isMerchDetailOpen.value = true;
};
const activeMainTab = ref('media');
const activeFilter = ref('all');
const subStateFilter = ref('all');
const merchTierFilter = ref('all');

const merchItems = ref([
  {
    id: 1,
    title: 'monthly stinky socks',
    price: 'FREE',
    oldPrice: null,
    discount: null,
    badgePreorder: false,
    badgeLeft: null,
    tier: "Tier 1 - 'Close Circle' Exclusive",
    tierType: 'tier-1',
    isNew: false,
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 2,
    title: "My top (washed) Get Jenny's f...",
    price: 'USD $400',
    oldPrice: '450',
    discount: '10% off',
    badgePreorder: true,
    badgeLeft: 'Only 1 left!',
    tier: "Tier 1 - 'Close Circle' Exclusive",
    tierType: 'tier-1',
    isNew: false,
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 3,
    title: "[Peach] from my farm-Peach from my farm (Autumn harvest)",
    price: 'USD $25',
    oldPrice: '50',
    discount: '50% off',
    badgePreorder: false,
    badgeLeft: null,
    tier: "Free Tier - 'Stay in the Loop' Exclusive",
    tierType: 'free',
    isNew: false,
    image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 4,
    title: 'Lingerie set',
    price: 'USD $400',
    oldPrice: null,
    discount: null,
    badgePreorder: false,
    badgeLeft: 'Only 1 left!',
    tier: "Tier 2 - 'Inner Circle' Exclusive",
    tierType: 'tier-2',
    isNew: true,
    image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 5,
    title: 'monthly Worn stockings',
    price: 'USD $400',
    oldPrice: '450',
    discount: '10% off',
    badgePreorder: false,
    badgeLeft: null,
    tier: "Tier 2 - 'Inner Circle' Exclusive",
    tierType: 'tier-2',
    isNew: false,
    image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 6,
    title: 'monthly Worn stockings',
    price: 'USD $400',
    oldPrice: '450',
    discount: null,
    badgePreorder: false,
    badgeLeft: null,
    tier: "Tier 2 - 'Inner Circle' Exclusive",
    tierType: 'tier-2',
    isNew: false,
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 7,
    title: "My top (washed) Get Jenny's f...",
    price: 'USD $25',
    oldPrice: '50',
    discount: null,
    badgePreorder: false,
    badgeLeft: null,
    tier: "Free Tier - 'Stay in the Loop' Exclusive",
    tierType: 'free',
    isNew: false,
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 8,
    title: 'Lingerie set',
    price: 'USD $400',
    oldPrice: null,
    discount: null,
    badgePreorder: false,
    badgeLeft: 'Only 1 left!',
    tier: "Tier 2 - 'Inner Circle' Exclusive",
    tierType: 'tier-2',
    isNew: false,
    image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 9,
    title: "My top (washed) Get Jenny's f...",
    price: 'USD $400',
    oldPrice: '450',
    discount: '10% off',
    badgePreorder: true,
    badgeLeft: 'Only 1 left!',
    tier: "Tier 1 - 'Close Circle' Exclusive",
    tierType: 'tier-1',
    isNew: false,
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 10,
    title: 'monthly stinky socks',
    price: 'FREE',
    oldPrice: null,
    discount: null,
    badgePreorder: false,
    badgeLeft: null,
    tier: "Tier 1 - 'Close Circle' Exclusive",
    tierType: 'tier-1',
    isNew: false,
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=600&q=80'
  }
]);

const filteredMerchItems = computed(() => {
  return merchItems.value.filter(item => {
    if (merchTierFilter.value === 'tier1') return item.tier.includes('Tier 1');
    if (merchTierFilter.value === 'tier2') return item.tier.includes('Tier 2');
    if (merchTierFilter.value === 'free') return item.tier.includes('Free');
    return true;
  });
});

const loadMoreMerch = () => {
  if (isMerchLoading.value) return;
  isMerchLoading.value = true;
  setTimeout(() => {
    const newItems = [
      {
        id: merchItems.value.length + 1,
        title: 'Custom Signed Poster',
        price: 'USD $150',
        oldPrice: '200',
        discount: '25% off',
        badgePreorder: false,
        badgeLeft: 'Only 2 left!',
        tier: "Tier 1 - 'Close Circle' Exclusive",
        tierType: 'tier-1',
        isNew: false,
        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80'
      },
      {
        id: merchItems.value.length + 2,
        title: 'Exclusive Voice Note Keychain',
        price: 'FREE',
        oldPrice: null,
        discount: null,
        badgePreorder: true,
        badgeLeft: null,
        tier: "Free Tier - 'Stay in the Loop' Exclusive",
        tierType: 'free',
        isNew: false,
        image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=600&q=80'
      }
    ];
    merchItems.value.push(...newItems);
    isMerchLoading.value = false;
  }, 1200);
};

const mediaItems = ref([
  {
    id: 1,
    layoutType: 'three-grid',
    title: '[R18] Dance of the Blue Lotus - Exclusive Photo Set',
    description: 'Step onto the stage with this exclusive 10-photo set inspired by Sua from Alien Stage — the idol who shines even in a world falli...',
    likes: 50,
    views: 50,
    type: 'image',
    badgeText: '56 IMAGES',
    discountTag: null,
    isLocked: false,
    slides: [
      'https://fansocial.app/wp-content/plugins/fansocial/new-home/assets/images/ready-to-earn-bg.jpg',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80'
    ],
    activeSlide: 0,
    buttons: [
      { type: 'p2v', label: 'P2V', hoverLabel: 'PAY TO VIEW', price: '9.99', oldPrice: '69.99', discount: '-5%', subText: null },
      { type: 'sub', label: 'SUBSCRIBE', price: '9.99', oldPrice: '29.99', discount: '-5%', subText: '/mo' }
    ]
  },
  {
    id: 2,
    layoutType: 'two-grid',
    title: '[R18] Exclusive Costume Set - Special Edition',
    description: 'Special edition costume set featuring exclusive high-resolution photos and behind-the-scenes content...',
    likes: 50,
    views: 50,
    type: 'image',
    badgeText: '56 IMAGES',
    discountTag: '20% OFF',
    isLocked: false,
    slides: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80'
    ],
    activeSlide: 0,
    buttons: [
      { type: 'p2v', label: 'P2V', hoverLabel: 'PAY TO VIEW', price: '9.99', oldPrice: '9.99', discount: '-20%', subText: null },
      { type: 'sub', label: 'SUBSCRIBE', price: '9.99', oldPrice: '29.99', discount: '-5%', subText: '/mo' }
    ]
  },
  {
    id: 3,
    layoutType: 'single',
    title: '[R18] Midnight Romance - Premium Photo Gallery',
    description: 'Midnight romance gallery with vivid atmosphere and stunning aesthetics...',
    likes: 50,
    views: 50,
    type: 'image',
    badgeText: '56 IMAGES',
    discountTag: '50% OFF',
    isLocked: false,
    slides: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80'
    ],
    activeSlide: 0,
    buttons: [
      { type: 'p2v', label: 'P2V', hoverLabel: 'PAY TO VIEW', price: '9.99', oldPrice: '9.99', discount: '-50%', subText: null }
    ]
  },
  {
    id: 4,
    layoutType: 'video',
    title: '[R18] Moonlight Secret - Exclusive Video Clip',
    description: 'Exclusive video clip full length HD streaming access...',
    likes: 50,
    views: 50,
    type: 'video',
    badgeText: '15:20',
    discountTag: null,
    isLocked: false,
    slides: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80'
    ],
    activeSlide: 0,
    buttons: [
      { type: 'p2v', label: 'P2V', hoverLabel: 'PAY TO VIEW', price: '9.99', oldPrice: null, discount: null, subText: null }
    ]
  },
  {
    id: 5,
    layoutType: 'three-grid',
    title: '[R18] Celestial Dream - Digital Artwork Collection',
    description: 'Digital artwork collection inspired by cosmic dreams and ethereal visions...',
    likes: 50,
    views: 50,
    type: 'image',
    badgeText: '56 IMAGES',
    discountTag: null,
    isLocked: false,
    slides: [
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80'
    ],
    activeSlide: 0,
    buttons: [
      { type: 'p2v', label: 'P2V', hoverLabel: 'PAY TO VIEW', price: '9.99', oldPrice: null, discount: null, subText: null },
      { type: 'sub', label: 'SUBSCRIBE', price: '9.99', oldPrice: null, discount: null, subText: '/mo' }
    ]
  },
  {
    id: 6,
    layoutType: 'two-grid',
    title: '[R18] Golden Hour - Sunset Portrait Series',
    description: 'Sunset portrait series capturing warm natural lighting and artistic poses...',
    likes: 50,
    views: 50,
    type: 'image',
    badgeText: '56 IMAGES',
    discountTag: '15% OFF',
    isLocked: false,
    slides: [
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80'
    ],
    activeSlide: 0,
    buttons: [
      { type: 'p2v', label: 'P2V', hoverLabel: 'PAY TO VIEW', price: '9.49', oldPrice: '9.99', discount: '-15%', subText: null }
    ]
  },
  {
    id: 7,
    layoutType: 'single',
    title: '[R18] Path of Dreams - Original Style Set',
    description: 'Path of Dreams original style photo set...',
    likes: 50,
    views: 50,
    type: 'image',
    badgeText: null,
    discountTag: null,
    isLocked: false,
    slides: [
      'https://fansocial.app/wp-content/plugins/fansocial/new-home/assets/images/ready-to-earn-bg.jpg',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80'
    ],
    activeSlide: 0,
    buttons: [
      { type: 'p2v', label: 'P2V', hoverLabel: 'PAY TO VIEW', price: '9.99', oldPrice: null, discount: null, subText: null },
      { type: 'sub', label: 'SUBSCRIBE', price: '9.99', oldPrice: null, discount: null, subText: '/mo' }
    ]
  },
  {
    id: 8,
    layoutType: 'video',
    title: '[R18] Forbidden Peak - Special Edition',
    description: 'Forbidden Peak video special edition...',
    likes: 50,
    views: 50,
    type: 'video',
    badgeText: '12:03',
    discountTag: '80% OFF',
    isLocked: true,
    slides: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80'
    ],
    activeSlide: 0,
    buttons: [
      { type: 'sub', label: 'SUBSCRIBE', price: 'FREE', oldPrice: null, discount: null, subText: null }
    ]
  }
]);

const filteredMediaItems = computed(() => {
  return mediaItems.value.filter(item => {
    const matchesLayout = activeFilter.value === 'all' || item.layoutType === activeFilter.value;
    const matchesSubState =
      subStateFilter.value === 'all' ||
      (subStateFilter.value === 'locked' && item.isLocked) ||
      (subStateFilter.value === 'unlocked' && !item.isLocked);
    return matchesLayout && matchesSubState;
  });
});

const nextSlide = (item) => {
  if (item.slides && item.slides.length > 0) {
    item.activeSlide = (item.activeSlide + 1) % item.slides.length;
  }
};

const prevSlide = (item) => {
  if (item.slides && item.slides.length > 0) {
    item.activeSlide = (item.activeSlide - 1 + item.slides.length) % item.slides.length;
  }
};

const setSlide = (item, index) => {
  item.activeSlide = index;
};

const loadMore = () => {
  if (isLoading.value) return;
  isLoading.value = true;

  setTimeout(() => {
    const newItems = [
      {
        id: 9,
        layoutType: 'three-grid',
        title: '[R18] Dreamy Attire - Creative Photo Set',
        description: 'Step onto the stage with this exclusive photo set...',
        likes: 50,
        views: 50,
        type: 'image',
        badgeText: null,
        discountTag: null,
        isLocked: false,
        slides: [
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80'
        ],
        activeSlide: 0,
        buttons: [
          { type: 'p2v', label: 'P2V', hoverLabel: 'PAY TO VIEW', price: '9.99', oldPrice: null, discount: null, subText: null },
          { type: 'sub', label: 'SUBSCRIBE', price: '9.99', oldPrice: null, discount: null, subText: '/mo' }
        ]
      },
      {
        id: 10,
        layoutType: 'two-grid',
        title: '[R18] Captivating Smile - Classic Photo Set',
        description: 'Captivating smile photo set collection...',
        likes: 50,
        views: null,
        type: 'image',
        badgeText: '56 IMAGES',
        discountTag: null,
        isLocked: false,
        slides: [
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80'
        ],
        activeSlide: 0,
        buttons: [
          { type: 'preorder', label: 'PREORDER', price: '9.99', oldPrice: null, discount: null, subText: null }
        ]
      },
      {
        id: 11,
        layoutType: 'video',
        title: '[R18] Forbidden Peak - Special Edition',
        description: 'Forbidden Peak video special edition...',
        likes: null,
        views: null,
        type: 'video',
        badgeText: null,
        discountTag: '80% OFF',
        isLocked: true,
        slides: [
          'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=900&q=80'
        ],
        activeSlide: 0,
        buttons: [
          { type: 'sub', label: 'SUBSCRIBE', price: 'FREE', oldPrice: null, discount: null, subText: null }
        ]
      },
      {
        id: 12,
        layoutType: 'single',
        title: '[R18] Gorgeous Beauty - Artistic Photo Set',
        description: 'Gorgeous beauty artistic photo set...',
        likes: null,
        views: null,
        type: 'image',
        badgeText: null,
        discountTag: '50% OFF',
        isLocked: false,
        slides: [
          'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&q=80',
          'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80'
        ],
        activeSlide: 0,
        buttons: [
          { type: 'p2v', label: 'P2V', hoverLabel: 'PAY TO VIEW', price: '9.99', oldPrice: '9.99', discount: null, subText: null }
        ]
      }
    ];

    mediaItems.value.push(...newItems);
    isLoading.value = false;
  }, 1500);
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
</style>
