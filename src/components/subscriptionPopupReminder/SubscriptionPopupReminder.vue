<template>
  <Teleport to="body">
    <Transition name="subscription-popup-fade">
      <div
        v-if="modelValue"
        class="fixed inset-0 z-[9999] flex flex-col md:p-6 items-center justify-center bg-[linear-gradient(0deg,rgba(255,255,255,0.70)_0%,rgba(255,255,255,0.70)_100%)] overflow-hidden"
        @click.self="close"
      >

      <!-- Optional Demo Mode Switcher Bar -->
      <div v-if="showModeToggle" class="flex justify-center mb-6 absolute z-10 top-0 md:relative">
        <div class="inline-flex bg-[#1a2332] p-1 rounded-xl border border-slate-700/60 text-xs font-semibold uppercase tracking-wider">
          <button
            type="button"
            @click="currentMode = 'single'"
            class="px-4 py-1.5 rounded-lg transition-all cursor-pointer"
            :class="currentMode === 'single' ? 'bg-gradient-to-r from-[#ff0066] to-[#e6005c] text-white shadow-md' : 'text-slate-400 hover:text-white'"
          >
            Single Item
          </button>
          <button
            type="button"
            @click="currentMode = 'multiple'"
            class="px-4 py-1.5 rounded-lg transition-all cursor-pointer"
            :class="currentMode === 'multiple' ? 'bg-gradient-to-r from-[#ff0066] to-[#e6005c] text-white shadow-md' : 'text-slate-400 hover:text-white'"
          >
            Multiple Item
          </button>
        </div>
      </div>
        <!-- Modal Dialog Window -->
        <div
          class="relative w-full h-dvh md:h-auto max-w-[49.125rem] text-white flex flex-col md:my-auto transition-all"
        >
          <!-- Top Right Close Button -->
          <button
            type="button"
            @click.stop.prevent="close"
            class="absolute top-2 right-2 sm:-top-5 sm:right-8 z-50 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-[rgba(16,24,40,0.85)] hover:bg-slate-800 backdrop-blur-[10px] flex items-center justify-center transition-all cursor-pointer border border-slate-700/50"
            aria-label="Close Popup"
          >
            <img src="https://fansocial.app/wp-content/plugins/fansocial/assets/icons/svg/x-close.svg" alt="Close" class="w-6 h-6 sm:w-7 sm:h-7 brightness-0 invert pointer-events-none" />
          </button>

          

          <!-- Modal Inner -->
           <div
             class="w-full h-dvh md:h-auto max-w-[46.125rem] flex-1 flex flex-col gap-6 md:rounded-lg bg-[rgba(12,17,29,0.90)]"
             :class="currentMode === 'single' ? 'p-3 pt-14 lg:p-6' : 'p-2 lg:px-6 lg:py-10'"
           >
            <!-- Component Body View -->
            <div class="w-full flex-1 flex flex-col items-center md:justify-center">
              <!-- Single Item View -->
              <SubscriptionSingleItem
                v-if="currentMode === 'single'"
                :item="activeSingleItem"
                :model-name="modelName"
                @action-click="handleAction"
                @claim-later="handleClaimLater"
              />

              <!-- Multiple Item View -->
              <SubscriptionMultipleItem
                v-else
                :items="items"
                :model-name="modelName"
                :dont-show-again="dontShowAgain"
                @action-click="handleAction"
                @claim-later="handleClaimLater"
                @update:dont-show-again="val => $emit('update:dontShowAgain', val)"
              />
            </div>
           </div>
          <!-- /Modal inner -->
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import SubscriptionSingleItem from './SubscriptionSingleItem.vue'
import SubscriptionMultipleItem from './SubscriptionMultipleItem.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
    default: false
  },
  mode: {
    type: String,
    default: 'multiple', // 'single' or 'multiple'
    validator: (v) => ['single', 'multiple'].includes(v)
  },
  modelName: {
    type: String,
    default: '@model'
  },
  showModeToggle: {
    type: Boolean,
    default: true
  },
  dontShowAgain: {
    type: Boolean,
    default: false
  },
  singleItem: {
    type: Object,
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
  items: {
    type: Array,
    default: () => [
      {
        id: 1,
        title: '原味內衣',
        price: 'USD$25',
        isFree: false,
        image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=800&auto=format&fit=crop',
        buttonText: 'BUY NOW',
        actionType: 'buy'
      },
      {
        id: 2,
        title: 'worn socks',
        price: 'FREE',
        isFree: true,
        image: 'https://images.unsplash.com/photo-1582966772680-860e372bb558?q=80&w=800&auto=format&fit=crop',
        buttonText: 'CLAIM NOW',
        actionType: 'claim'
      },
      {
        id: 3,
        title: '原味內衣',
        price: 'USD$25',
        isFree: false,
        image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=800&auto=format&fit=crop',
        buttonText: 'BUY NOW',
        actionType: 'buy'
      }
    ]
  }
})

const emit = defineEmits([
  'update:modelValue',
  'claim',
  'buy',
  'claim-later',
  'update:dontShowAgain',
  'action-click'
])

const currentMode = ref(props.mode)

watch(
  () => props.mode,
  (newMode) => {
    currentMode.value = newMode
  }
)

const activeSingleItem = computed(() => props.singleItem || props.items[0])

const close = () => {
  emit('update:modelValue', false)
}

const handleAction = (item) => {
  emit('action-click', item)
  if (item.isFree || item.actionType === 'claim') {
    emit('claim', item)
  } else {
    emit('buy', item)
  }
}

const handleClaimLater = () => {
  emit('claim-later')
  close()
}
</script>

<style scoped>
.subscription-popup-fade-enter-active,
.subscription-popup-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.subscription-popup-fade-enter-from,
.subscription-popup-fade-leave-to {
  opacity: 0;
  transform: scale(0.96);
}
</style>
