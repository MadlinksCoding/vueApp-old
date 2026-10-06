<template>
  <div
    class="subscription-merch-card group relative flex flex-col justify-between rounded-xl bg-[#1e293b] border border-slate-700/60 overflow-hidden shadow-lg transition-all duration-200 hover:border-slate-500/80 w-full select-none"
  >
    <!-- Image & Title Container -->
    <div class="relative w-full aspect-[4/5] bg-slate-900 overflow-hidden">
      <img
        :src="item.image"
        :alt="item.title"
        class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
      <!-- Gradient overlay at bottom of image -->
      <div
        class="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none"
      ></div>

      <!-- Item Title Overlay on Bottom of Image -->
      <div class="absolute bottom-2.5 left-3 right-3 z-10">
        <h4 class="text-white text-sm sm:text-base font-semibold tracking-wide truncate drop-shadow-md">
          {{ item.title }}
        </h4>
      </div>
    </div>

    <!-- Bottom Action Bar (Price & Button) -->
    <div class="flex items-center w-full bg-[#111827] border-t border-slate-800">
      <!-- Price Box -->
      <div class="flex-1 py-2.5 px-3 flex items-center justify-center bg-[#0d131f]">
        <span
          class="text-xs sm:text-sm font-bold tracking-tight"
          :class="item.isFree || item.price === 'FREE' ? 'text-[#fce40d]' : 'text-white'"
        >
          {{ item.price }}
        </span>
      </div>

      <!-- Action Button (BUY NOW or CLAIM NOW) -->
      <button
        type="button"
        @click.stop="$emit('action-click', item)"
        class="py-2.5 px-4 font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 shrink-0 flex items-center justify-center cursor-pointer"
        :class="
          item.isFree || item.price === 'FREE' || item.actionType === 'claim'
            ? 'bg-gradient-to-r from-[#ff0066] to-[#e6005c] hover:from-[#e6005c] hover:to-[#cc0052] text-white shadow-[0_0_12px_rgba(255,0,102,0.4)]'
            : 'bg-[#0055ff] hover:bg-[#0044cc] text-white shadow-[0_0_12px_rgba(0,85,255,0.4)]'
        "
      >
        {{ item.buttonText || (item.isFree || item.price === 'FREE' ? 'CLAIM NOW' : 'BUY NOW') }}
      </button>
    </div>
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
      price: 'FREE',
      isFree: true,
      image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
      buttonText: 'CLAIM NOW',
      actionType: 'claim'
    })
  }
})

defineEmits(['action-click'])
</script>

<style scoped>
.subscription-merch-card {
  font-family: 'Poppins', 'Inter', sans-serif;
}
</style>
