<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[10002] flex items-center justify-center p-4"
      data-fs-chat-popup
      @click.self="$emit('close')"
    >
      <div class="absolute inset-0 bg-black/40" @click="$emit('close')" />

      <div class="relative z-10 w-full max-w-[380px] bg-white rounded-2xl shadow-xl flex flex-col font-['Poppins'] overflow-hidden">

        <!-- Header -->
        <div class="flex items-center justify-between px-5 pt-5 pb-4">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z"
              />
            </svg>
            <span class="text-gray-800 text-sm font-semibold">Cancel Call</span>
          </div>
          <button class="text-gray-400 hover:text-gray-600 transition-colors" @click="$emit('close')">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="px-5 pb-2">
          <p class="text-gray-700 text-sm leading-relaxed">
            Are you sure you want to cancel this event? Booking Fee will still be deducted from your wallet.
          </p>
        </div>

        <!-- Footer -->
        <div class="px-5 py-4 flex items-center gap-3">
          <button
            class="flex-1 py-2.5 rounded-lg text-sm font-semibold text-gray-700 border-2 border-gray-300 hover:bg-gray-50 transition-colors"
            @click="$emit('close')"
          >
            Back
          </button>
          <button
            :disabled="submitting"
            class="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            @click="handleConfirm"
          >
            {{ submitting ? 'Cancelling...' : 'Cancel Call' }}
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import FlowHandler from '@/services/flow-system/FlowHandler'

const props = defineProps({
  message:   { type: Object, required: true },
  chatId:    { type: String, required: true },
  isCreator: { type: Boolean, default: false },
})

const emit = defineEmits(['close', 'cancelled'])

const submitting = ref(false)

async function handleConfirm() {
  const bookingId = props.message?.content?.booking_id
  if (!bookingId) return
  submitting.value = true
  try {
    const cancelRes = await FlowHandler.run('bookings.cancelBooking', {
      bookingId,
      actor: props.isCreator ? 'creator' : 'fan',
    })
    if (cancelRes?.ok) {
      const updateRes = await FlowHandler.run('chat.updateMessage', {
        chatId:    props.chatId,
        messageId: props.message.message_id,
        updates:   { action: 'cancelled' },
      })
      emit('cancelled', updateRes?.data?.item || null)
      emit('close')
    }
  } finally {
    submitting.value = false
  }
}
</script>
