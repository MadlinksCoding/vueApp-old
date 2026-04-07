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
              <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>
            </svg>
            <span class="text-gray-800 text-sm font-semibold">Ask to reschedule</span>
          </div>
          <button class="text-gray-400 hover:text-gray-600 transition-colors" @click="$emit('close')">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Body -->
        <div class="px-5 pb-5 flex flex-col gap-5">

          <!-- New event date -->
          <div class="flex flex-col gap-2">
            <span class="text-gray-500 text-xs">New event date</span>
            <div class="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-2 focus-within:border-[#07F468] transition-colors">
              <svg class="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>
              </svg>
              <input
                v-model="newDate"
                type="date"
                class="flex-1 text-sm text-gray-900 font-medium outline-none bg-transparent"
              />
            </div>
            <span v-if="originalEventDate" class="text-gray-400 text-xs">
              Original event date: {{ originalEventDate }}
            </span>
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
            :disabled="submitting || !newDate || !newStartTime"
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

// Original event date: "April 24, 2025"
const originalEventDate = computed(() => {
  const ms = parseStartMs()
  if (!ms) return null
  return new Date(ms).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
})

// Original start time: "9:15pm"
const originalStartTime = computed(() => {
  const ms = parseStartMs()
  if (!ms) return null
  return new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
})

// ── Pre-fill inputs from original start_at ────────────────────────────────────
function getInitialDate() {
  const ms = parseStartMs()
  if (!ms) return ''
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getInitialTime() {
  const ms = parseStartMs()
  if (!ms) return ''
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const newDate      = ref(getInitialDate())
const newStartTime = ref(getInitialTime())

// ── Original session duration for auto end-time calc ─────────────────────────
const durationMs = computed(() => {
  const endRaw = content.value.end_at
  if (!endRaw) return null
  const endMs   = Date.parse(endRaw)
  const startMs = parseStartMs()
  if (!startMs || isNaN(endMs)) return null
  return endMs - startMs
})

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
  if (!newDate.value || !newStartTime.value) return
  submitting.value = true

  // Combine new date + new time into ISO slot_date
  const [h, m]  = newStartTime.value.split(':').map(Number)
  const d       = new Date(newDate.value)
  d.setHours(h, m, 0, 0)
  const slotDate = d.toISOString()

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
