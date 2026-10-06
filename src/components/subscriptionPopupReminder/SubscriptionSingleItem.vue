<template>
  <div class="subscription-single-item w-full flex flex-col gap-6 items-center">
    <!-- Header Title -->
    <div class="w-full flex justify-start">
      <h3 class="text-white text-left text-xl font-semibold tracking-tight">
      You have unlocked exclusive merch from {{ modelName }} !
      </h3>
    </div>

    <!-- Single Item Card Container -->
    <div
      class="w-full flex flex-col sm:flex-row items-stretch rounded-xl bg-white/10 overflow-hidden"
    >
      <!-- Product Image -->
      <div class="bg-[linear-gradient(180deg,rgba(0,0,0,0)_50%,rgba(0,0,0,0)_100%),rgba(0,0,0,0.05)] flex md:w-[18.25rem] h-[20.25rem] flex-col justify-end items-start gap-1">
        <img
          :src="item.image"
          :alt="item.title"
          class="w-full h-full object-cover"
        />
      </div>

      <!-- Content / Details Area -->
      <div class="flex-1 flex flex-col justify-between space-y-3 p-4">
        <!-- Title & Description -->
        <div class="flex flex-col gap-2">
          <h4 class="text-white text-base sm:text-lg font-semibold">
            {{ item.title }}
          </h4>
          <p class="text-white text-base sm:text-base leading-relaxed line-clamp-3">
            {{ item.description || 'this is Product description this is Product description this is Product description this is Product description' }}
          </p>
        </div>

        <!-- Action Bar: Price & Button -->
        <div class="w-full rounded-lg min-h-[4.375rem] overflow-hidden items-stretch select-none flex">
          <div class="w-full flex items-stretch select-none rounded-lg min-h-[4.375rem] overflow-hidden">
            <!-- Left Section: Price Display -->
            <div class="flex-1 bg-[rgba(12,17,29,0.50)] h-16 px-4 sm:px-6 py-3.5 rounded-l-lg flex items-baseline justify-center gap-1 shrink-0 mt-auto">
              <span v-if="!item.isFree && item.price !== 'FREE'" class="text-xs sm:text-sm text-[#FCE40D] tracking-wider uppercase">
                {{ item.currency || 'USD$' }}
              </span>
              <span class="text-xl sm:text-xl font-bold text-white tracking-tight leading-none">
                {{ item.price === 'FREE' ? 'FREE' : (item.price || '25').replace(/[^0-9]/g, '') }}
              </span>
              <span v-if="item.oldPrice" class="text-sm sm:text-lg font-normal text-white line-through">
                {{ item.oldPrice }}
              </span>
            </div>

            <!-- Right Section: Action Button with Slanted Cutout -->
            <button
              type="button"
              @click="$emit('action-click', item)"
              class="relative flex-1 transition-all cursor-pointer flex items-center justify-center py-2 pr-4 pl-6 group"
              :class="item.isFree || item.price === 'FREE' || item.actionType === 'claim' ? 'bg-[#FF0066]' : 'bg-[#98A2B3]'"
              aria-label="Action Button"
            >
              <span class="absolute left-[-1.5rem] top-0">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-auto h-full" width="24" height="72" viewBox="0 0 24 72" fill="none">
                  <path
                    d="M23.9525 72H14.0323H13.95H13.9607L23.9525 36H3.27564C1.84904 36 1.13454 36.0008 0.704446 35.6766C0.328997 35.3929 0.0783258 34.9532 0.011202 34.4637C-0.0655209 33.9027 0.25439 33.2106 0.893218 31.8305L14.8915 1.59258C15.0871 1.15817 15.2102 0.887062 15.3472 0.689062L15.4904 0.513281C15.6665 0.327007 15.8791 0.185456 16.112 0.0984375C16.3687 0.0028183 16.6599 7.52277e-05 17.2251 0H23.9525V72Z"
                    :fill="item.isFree || item.price === 'FREE' || item.actionType === 'claim' ? '#FF0066' : '#98A2B3'"
                  />
                </svg>
              </span>
              <span
                class="text-base sm:text-xl font-bold leading-[30px] italic uppercase tracking-wider whitespace-nowrap transition-transform"
                :class="item.isFree || item.price === 'FREE' || item.actionType === 'claim' ? 'text-white' : 'text-[#667085]'"
              >
                {{ item.buttonText || (item.isFree || item.price === 'FREE' ? 'CLAIM NOW' : 'BUY NOW') }}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Below Card Action Link -->
    <button
      type="button"
      @click="$emit('claim-later')"
      class="text-white text-base font-medium underline underline-offset-4 transition-colors cursor-pointer"
    >
      I will claim these merch later
    </button>
  </div>
</template>

<script setup>
defineProps({
  item: {
    type: Object,
    required: true,
    default: () => ({
      id: 1,
      title: '原味內衣',
      description: 'this is Product description this is Product description this is Product description this is Product description',
      price: 'FREE',
      isFree: true,
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
      buttonText: 'CLAIM NOW',
      actionType: 'claim'
    })
  },
  modelName: {
    type: String,
    default: '@model'
  }
})

defineEmits(['action-click', 'claim-later'])
</script>

<style scoped>
.subscription-single-item {
  font-family: 'Poppins', 'Inter', sans-serif;
}
</style>
