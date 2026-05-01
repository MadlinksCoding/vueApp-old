<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[10002] flex items-center justify-center p-4"
      data-fs-chat-popup
      @click.self="$emit('close')"
    >
      <div class="absolute inset-0 bg-black/40" @click="$emit('close')" />

      <div class="relative z-10 w-full max-w-[400px] bg-white rounded-2xl shadow-xl flex flex-col font-['Poppins']">

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

          <!-- New start time (date fixed) -->
          <EventSlotDateTimePicker
            v-model="slotPickerValue"
            :event="event"
            :duration-ms="durationMs"
            :original-start-time="originalStartTime"
            :date-readonly="true"
            :compact="true"
          />

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
import EventSlotDateTimePicker from '@/components/ui/chat/EventSlotDateTimePicker.vue'
import { showToast } from '@/utils/toastBus.js'
import { localDateTimeToHkt, hktDateTimeToLocalDate, toLocalISOString } from "@/services/events/eventsApiUtils.js";

const props = defineProps({
  message:       { type: Object, required: true },
  chatId:        { type: String, required: true },
  otherUserName: { type: String, default: 'creator' },
  event:         { type: Object, default: null },
  booking:       { type: Object, default: null },
})

const emit = defineEmits(['close', 'submitted'])

const content = computed(() => props.message?.content || {})

const startDateIso = computed(() => props.booking?.startIso || props.booking?.startAtIso || content.value.start_at || content.value.slot_date)

// ── Parse original start_at ───────────────────────────────────────────────────
function parseDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return isNaN(d.getTime()) ? null : d
}

function fmtTime(d) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
}

function parseStartMs() {
  return parseDate(
    startDateIso.value
  )?.getTime() ?? null
}

const formattedEventDate = computed(() => {
  const d = parseDate(startDateIso.value)
  return d ? d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'
})

// Original start time as "9:15pm"
const originalStartTime = computed(() => {
  const d = parseDate(startDateIso.value)
  return d ? fmtTime(d) : null
})

// Pre-fill initial date as YYYY-MM-DD
function getInitialDate() {
  const ms = parseStartMs()
  if (!ms) return ''
  const d = new Date(ms)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Pre-fill new start time input (HH:MM for <input type="time">)
function getInitialStartTime() {
  const ms = parseStartMs()
  if (!ms) return ''
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
const newStartTime = ref(getInitialStartTime())

// Original session duration (if end_at is available)
const durationMs = computed(() => {
  const endMs   = parseDate(props.booking?.endIso || props.booking?.endAtIso || content.value.end_at)?.getTime()
  const startMs = parseStartMs()
  if (!startMs || !endMs) return null
  return endMs - startMs
})

const fixedDate = getInitialDate()

const slotPickerValue = computed({
  get: () => ({ date: fixedDate, startTime: newStartTime.value }),
  set: (val) => { newStartTime.value = val.startTime },
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
  const slotDate = localDateTimeToHkt(toLocalISOString(base), newStartTime.value).iso
  console.log("base.toISOString()", toLocalISOString(base))
  console.log("Computed newSlotDate:", base,  toLocalISOString(base) , localDateTimeToHkt(toLocalISOString(base), newStartTime.value), { slotDate } )
  // return;
  const bookingId    = props.message?.content?.booking_id
  const prevStartAtIso = startDateIso.value

  if (!bookingId) {
    showToast('Booking information is missing. Cannot send reschedule request.', { type: 'error' })
    submitting.value = false
    return
  }

  try {
    const metaRes = await FlowHandler.run('bookings.updateMeta', {
      bookingId,
      meta: {
        moretime: { proposedSlotDate: slotDate },
        currentCounterOffer: 'moretime',
      },
      actor: 'creator',
    })
    if (metaRes?.ok) {
      // Store proposed values in booking meta for fan-side display + accept flow
      let updatedBooking = null
  
      if (metaRes?.ok) updatedBooking = metaRes.data?.item

      // Update chat message to reflect counter_offer state (booking API called on fan accept)
      const res = await FlowHandler.run('chat.updateMessage', {
        chatId: props.chatId,
        messageId: props.message.message_id,
        updates: {
          action: 'counter_offer',
          slotDate,
          meta: {
            newSlotDate: slotDate,
            prevStartAtIso,
            source: 'more_time',
          },
        },
      })

      if( res?.ok ){
        emit('submitted', { item: res.data?.item, booking: updatedBooking })
        emit('close')
      } else {
        showToast('Failed to send request. Please try again.', { type: 'error' })
      }
    }
  } finally {
    submitting.value = false
  }
}
</script>
