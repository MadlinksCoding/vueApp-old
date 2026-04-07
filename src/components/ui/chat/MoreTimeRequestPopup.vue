<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[10002] flex items-center justify-center p-4"
      data-fs-chat-popup
      @click.self="$emit('close')"
    >
      <div class="absolute inset-0 bg-black/40" @click="$emit('close')" />

      <div class="relative z-10 w-full max-w-[400px] bg-white rounded-2xl shadow-xl flex flex-col font-['Poppins'] overflow-hidden">

        <!-- Header -->
        <div class="flex items-center justify-between px-5 pt-5 pb-4">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <span class="text-gray-800 text-sm font-semibold">Ask for more time</span>
          </div>
          <button class="text-gray-400 hover:text-gray-600 transition-colors" @click="$emit('close')">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="px-5 pb-5 flex flex-col gap-5">

          <!-- Event date -->
          <div class="flex flex-col gap-1">
            <span class="text-gray-500 text-xs">Event date</span>
            <span class="text-gray-900 text-sm font-bold">{{ formattedEventDate }}</span>
          </div>

          <!-- New start time -->
          <div class="flex flex-col gap-2">
            <span class="text-gray-500 text-xs">New start time</span>
            <div class="flex items-center gap-3">
              <input
                v-model="newStartTime"
                type="time"
                class="border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#07F468] transition-colors w-32"
              />
              <span v-if="newEndTime" class="text-gray-600 text-sm font-medium">–{{ newEndTime }}</span>
            </div>
            <span v-if="originalStartTime" class="text-gray-400 text-xs">
              Original start time: {{ originalStartTime }}
            </span>
          </div>

          <!-- Send button -->
          <button
            :disabled="submitting || !newStartTime"
            class="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-black bg-[#07F468] hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
            @click="handleSubmit"
          >
            {{ submitting ? 'Sending...' : `Send request to @${otherUserName}` }}
            <svg v-if="!submitting" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
            </svg>
          </button>

        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref } from 'vue'
import FlowHandler from '@/services/flow-system/FlowHandler'

const props = defineProps({
  message:       { type: Object, required: true },
  chatId:        { type: String, required: true },
  otherUserName: { type: String, default: 'creator' },
})

const emit = defineEmits(['close', 'submitted'])

const content = computed(() => props.message?.content || {})

// ── Parse original start_at ───────────────────────────────────────────────────
function parseStartMs() {
  const raw = content.value.start_at
  if (!raw) return null
  const ms = Date.parse(raw)
  return isNaN(ms) ? null : ms
}

const formattedEventDate = computed(() => {
  const ms = parseStartMs()
  if (!ms) return '—'
  return new Date(ms).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
})

// Original start time as "9:15pm"
const originalStartTime = computed(() => {
  const ms = parseStartMs()
  if (!ms) return null
  return new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
})

// Pre-fill new start time input (HH:MM for <input type="time">)
function getInitialStartTime() {
  const ms = parseStartMs()
  if (!ms) return ''
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
const newStartTime = ref(getInitialStartTime())

// Original session duration in minutes (if end_at is available)
const durationMs = computed(() => {
  const endRaw = content.value.end_at
  if (!endRaw) return null
  const endMs = Date.parse(endRaw)
  const startMs = parseStartMs()
  if (!startMs || isNaN(endMs)) return null
  return endMs - startMs
})

// Auto-calculated new end time based on original duration
const newEndTime = computed(() => {
  if (!newStartTime.value || !durationMs.value) return null
  const [h, m] = newStartTime.value.split(':').map(Number)
  const startMs = h * 3600000 + m * 60000
  const endMs   = startMs + durationMs.value
  const endH    = Math.floor(endMs / 3600000) % 24
  const endM    = Math.floor((endMs % 3600000) / 60000)
  const suffix  = endH >= 12 ? 'pm' : 'am'
  const h12     = endH % 12 || 12
  return `${h12}:${String(endM).padStart(2, '0')}${suffix}`
})

// ── Submit ────────────────────────────────────────────────────────────────────
const submitting = ref(false)

async function handleSubmit() {
  if (!newStartTime.value) return
  submitting.value = true

  // Build ISO slot_date by combining original event date with new time
  const startMs = parseStartMs()
  const base    = startMs ? new Date(startMs) : new Date()
  const [h, m]  = newStartTime.value.split(':').map(Number)
  base.setHours(h, m, 0, 0)
  const slotDate = base.toISOString()

  try {
    const res = await FlowHandler.run('chat.updateMessage', {
      chatId:    props.chatId,
      messageId: props.message.message_id,
      updates: {
        action:    'counter_offer',
        slot_date: slotDate,
      },
    })
    if (res?.ok) {
      emit('submitted', res.data?.item)
      emit('close')
    }
  } finally {
    submitting.value = false
  }
}
</script>
