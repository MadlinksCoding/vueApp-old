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

          <!-- New event date / time -->
          <EventSlotDateTimePicker
            v-model="slotPickerValue"
            :event="event"
            :duration-ms="durationMs"
            :original-event-date="originalEventDate"
            :original-start-time="originalStartTime"
            :compact="true"
          />

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
import EventSlotDateTimePicker from '@/components/ui/chat/EventSlotDateTimePicker.vue'
import { showToast } from '@/utils/toastBus.js'
import { localDateTimeToHkt, hktDateTimeToLocalDate } from "@/services/events/eventsApiUtils.js";
import { formatLocalDateIso } from "@/services/bookings/utils/bookingSlotUtils.js";

const props = defineProps({
  message:       { type: Object, required: true },
  chatId:        { type: String, required: true },
  otherUserName: { type: String, default: 'creator' },
  event:         { type: Object, default: null },
  booking:       { type: Object, default: null },
})

const emit = defineEmits(['close', 'submitted'])

const content = computed(() => props.message?.content || {})

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
    props.booking?.startIso || props.booking?.startAtIso || content.value.start_at || content.value.slot_date
  )?.getTime() ?? null
}

// Original event date: "April 24, 2025"
const originalEventDate = computed(() => {
  const d = parseDate(content.value.start_at || content.value.slot_date)
  return d ? d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : null
})

// Original start time: "9:15pm"
const originalStartTime = computed(() => {
  const d = parseDate(content.value.start_at || content.value.slot_date)
  return d ? fmtTime(d) : null
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

// ── Original session duration ─────────────────────────────────────────────────
const durationMs = computed(() => {
  const endMs   = parseDate(props.booking?.endIso || props.booking?.endAtIso || content.value.end_at)?.getTime()
  const startMs = parseStartMs()
  if (!startMs || !endMs) return null
  return endMs - startMs
})

const slotPickerValue = computed({
  get: () => ({ date: newDate.value, startTime: newStartTime.value }),
  set: (val) => { newDate.value = val.date; newStartTime.value = val.startTime },
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
  const slotDate = localDateTimeToHkt(d.toISOString(), newStartTime.value).iso;
  console.log("Computed newSlotDate:", localDateTimeToHkt( d.toISOString(), newStartTime.value), { date: d.toISOString(), slotDate }, formatLocalDateIso(d), newStartTime.value)
  // return;
  const bookingId    = props.message?.content?.booking_id
  const prevStartAtIso = content.value.start_at || content?.value?.slot_date

  try {
    // Update chat message to reflect counter_offer state (booking API called on fan accept)
    const res = await FlowHandler.run('chat.updateMessage', {
      chatId:    props.chatId,
      messageId: props.message.message_id,
      updates: {
        action:   'counter_offer',
        slotDate,
        meta: {
          newSlotDate:   slotDate,
          prevStartAtIso,
          source:        'reschedule',
        },
      },
    })
    if (res?.ok) {
      // Store proposed values in booking meta for fan-side display + accept flow
      let updatedBooking = null
      if (bookingId) {
        const metaRes = await FlowHandler.run('bookings.updateMeta', {
          bookingId,
          meta: {
            reschedule: { proposedSlotDate: slotDate },
            currentCounterOffer: 'reschedule',
          },
          actor : "creator",
        })
        if (metaRes?.ok) updatedBooking = metaRes.data?.item
      }
      emit('submitted', { item: res.data?.item, booking: updatedBooking })
      emit('close')
    }
  } finally {
    submitting.value = false
  }
}
</script>
