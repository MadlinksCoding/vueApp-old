<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[10002] flex items-center justify-center p-4"
      data-fs-chat-popup
      @click.self="$emit('close')"
    >
      <div class="absolute inset-0 bg-black/40" @click="$emit('close')" />

      <div
        class="relative z-10 p-4 gap-6 rounded-lg shadow-xl w-full max-w-[460px] bg-white flex flex-col font-['Poppins']"
      >
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h2 class="text-gray-700 text-sm font-semibold">Adjust Event Details</h2>
          <button
            type="button"
            class="text-[#98A2B3] hover:text-gray-700 transition-colors"
            @click="$emit('close')"
          >
            <img :src="CloseIcon" alt="close" class="w-2.5 h-2.5" />
          </button>
        </div>

        <!-- Loading -->
        <div v-if="loading" class="flex justify-center py-10">
          <div class="w-6 h-6 border-2 border-[#5549FF] border-t-transparent rounded-full animate-spin" />
        </div>

        <!-- Content -->
        <div v-else class="pb-6 overflow-y-auto max-h-[85vh] flex flex-col gap-6">

          <!-- Personal Request (read-only) -->
          <div v-if="personalRequestText" class="flex flex-col gap-2">
            <label class="text-gray-700 text-base font-medium">Personal request</label>
            <div class="bg-white p-3.5 border border-[#EAECF0] rounded text-[13.5px] text-[#344054] leading-relaxed break-words shadow-sm">
              {{ personalRequestText }}
            </div>
          </div>

          <!-- Session Duration (read-only) -->
          <div class="flex flex-col gap-2">
            <label class="text-gray-700 text-base font-medium">Session duration</label>
            <div class="flex items-center gap-2 mt-3">
              <BaseInput
                v-model="form.durationMinutes"
                type="number"
                placeholder=""
                :disabled="true"
                inputClass="px-3.5 text-gray-900 placeholder:text-gray-900 w-full text-base font-normal outline-none py-2.5 bg-white/30 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300 cursor-default"
              />
              <div class="text-black text-base font-medium leading-normal">Minutes</div>
            </div>
          </div>

          <!-- Additional Requests (read-only) -->
          <div v-if="selectedAddOnOptions.length" class="flex flex-col gap-3">
            <label class="text-gray-700 text-base font-medium">Additional request</label>
            <div class="flex flex-col gap-3.5 mt-0.5">
              <div
                v-for="opt in selectedAddOnOptions"
                :key="opt.key"
                class="flex items-center justify-between"
              >
                <span class="text-gray-950 text-base font-medium">{{ opt.label }}</span>
                <span class="text-[#4640FF] font-semibold text-[14px] tracking-wide">+ {{ opt.tokens }} Tokens</span>
              </div>
            </div>
          </div>


          <!-- New event date / time (optional) -->
          <EventSlotDateTimePicker v-model="slotPickerValue" :event="event" :duration-ms="originalDurationMs"
            :original-event-date="originalEventDate" :original-start-time="originalStartTime" :optional="true" />

          <!-- Creator's Remarks -->
          <div class="flex flex-col gap-2 mt-1">
            <label class="text-gray-700 text-base font-medium flex items-baseline gap-1.5">
              Your remarks <span class="text-gray-700 font-normal italic text-xs">Optional</span>
            </label>
            <textarea
              v-model="form.remarks"
              rows="4"
              placeholder="Add notes for the fan..."
              class="w-full bg-white border border-[#EAECF0] shadow-sm rounded-md p-3.5 text-[13.5px] text-[#344054] outline-none focus:border-gray-300 resize-none leading-relaxed"
            />
          </div>

          <!-- Adjustment -->
          <div class="flex flex-col gap-2">
            <label class="text-gray-700 text-base font-medium">Adjustment</label>
            <BaseInput
              v-model="form.adjustmentTokens"
              type="number"
              placeholder=""
              inputClass="px-3.5 text-gray-900 placeholder:text-gray-900 w-full text-base font-normal outline-none py-2.5 bg-white/30 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300"
            />
          </div>

          <!-- Footer / Total Price -->
          <div class="flex flex-col gap-0.5 mb-1">
            <div class="text-gray-700 text-base font-medium">Total price after adjustment</div>
            <div class="flex items-end justify-between w-full mt-1">
              <div class="flex flex-col gap-0">
                <div class="text-xl font-bold text-gray-950 leading-[1.2] tracking-tight">
                  {{ totalTokens }} Tokens
                </div>
                <div v-if="baseTokens > 0" class="text-gray-950 text-base font-medium">
                  (<span class="text-gray-950 font-bold">{{ baseTokens }} Tokens</span> before adjustment)
                </div>
              </div>
              <ButtonComponent
                :text="submitting ? 'Saving...' : 'SUBMIT'"
                variant="polygonLeft"
                btnBg="#07f468"
                btnHoverBg="black"
                btnText="black"
                btnHoverText="#07f468"
                :disabled="isSubmitDisabled"
                @click="handleSubmit"
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import FlowHandler    from '@/services/flow-system/FlowHandler'
import BaseInput               from '@/components/dev/input/BaseInput.vue'
import CloseIcon               from '@/assets/images/icons/cross-white.webp'
import ButtonComponent         from '@/components/dev/button/ButtonComponent.vue'
import EventSlotDateTimePicker from '@/components/ui/chat/EventSlotDateTimePicker.vue'
import { showToast }           from '@/utils/toastBus.js'

const props = defineProps({
  message:   { type: Object, required: true },
  chatId:    { type: String, required: true },
})

const emit = defineEmits(['close', 'submitted'])

const loading    = ref(false)
const submitting = ref(false)
const booking    = ref(null)
const event      = ref(null)

const form = reactive({
  durationMinutes:  30,
  remarks:          '',
  adjustmentTokens: 0,
  newDate:          '',
  newStartTime:     '',
})

const messageContent = computed(() => props.message?.content || {})

onMounted(async () => {
  const bookingId = messageContent.value.booking_id
  const eventId   = messageContent.value.event_id
  if (!bookingId) return

  loading.value = true
  const [bookingRes, eventRes] = await Promise.all([
    FlowHandler.run('bookings.fetchBooking', { bookingId }),
    eventId ? FlowHandler.run('events.fetchEvent', { eventId }) : Promise.resolve(null),
  ])
  loading.value = false

  if (bookingRes?.ok && bookingRes.data?.item) {
    booking.value = bookingRes.data.item
    const item = bookingRes.data.item

    // Resolve duration: top-level → meta paymentPayload → calculate from start/end
    let mins = Number(item.durationMinutes || item.sessionDurationMinutes || 0)
    if (!mins) mins = Number(item.meta?.validation?.paymentPayload?.durationMinutes || 0)
    if (!mins && item.startAtIso && item.endAtIso) {
      mins = Math.round((Date.parse(item.endAtIso) - Date.parse(item.startAtIso)) / 60000)
    }
    if (mins > 0) form.durationMinutes = mins
  }

  if (eventRes?.ok && eventRes.data?.item) {
    event.value = eventRes.data.item
  }

})

const raw = computed(() => booking.value || {})

// ── Original date/time helpers ────────────────────────────────────────────────
function parseOriginalStartMs() {
  const iso = raw.value.startIso || raw.value.startAtIso || messageContent.value.slot_date
  if (!iso) return null
  const ms = Date.parse(iso)
  return isNaN(ms) ? null : ms
}

const originalEventDate = computed(() => {
  const ms = parseOriginalStartMs()
  if (!ms) return null
  return new Date(ms).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
})

const originalStartTime = computed(() => {
  const ms = parseOriginalStartMs()
  if (!ms) return null
  return new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
})

const originalDurationMs = computed(() => {
  const endIso = raw.value.endIso || raw.value.endAtIso
  if (!endIso) return null
  const endMs   = Date.parse(endIso)
  const startMs = parseOriginalStartMs()
  if (!startMs || isNaN(endMs)) return null
  return endMs - startMs
})


const personalRequestText = computed(() =>
  String(raw.value.personalRequestText || '').trim() || null
)

const slotPickerValue = computed({
  get: () => ({ date: form.newDate, startTime: form.newStartTime }),
  set: (val) => { form.newDate = val.date; form.newStartTime = val.startTime },
})

// Add-ons come from the event; fall back to booking's addOnsCatalog
const addOnOptions = computed(() => {
  const fromEvent   = Array.isArray(event.value?.addOns) ? event.value.addOns : null
  const fromBooking = Array.isArray(raw.value.addOnsCatalog) ? raw.value.addOnsCatalog : []
  const available   = fromEvent ?? fromBooking
  return available.map((a, i) => ({
    key:    a?.key || a?.id || String(i),
    label:  a?.title || a?.name || String(a),
    tokens: Number(a?.priceTokens || a?.tokens || a?.price || 0),
  }))
})

const selectedAddOnOptions = computed(() => {
  const requested = Array.isArray(raw.value.requestedAddOns) ? raw.value.requestedAddOns : []
  return requested.map(addon => {
    const title = addon?.title || addon?.name || String(addon)
    const match = addOnOptions.value.find(o => o.label === title)
    return { label: title, tokens: match?.tokens ?? 0 }
  })
})

const baseTokens = computed(() => {
  const payment = raw.value.payment || {}
  const total = Number(payment.total ?? raw.value.paymentTotal ?? 0)
  return Number.isFinite(total) ? Math.ceil(total) : 0
})

const totalTokens = computed(() =>
  Math.max(0, baseTokens.value + (Number(form.adjustmentTokens) || 0))
)

const isDateTimeValid = computed(() => {
  const hasDate = !!form.newDate
  const hasTime = !!form.newStartTime
  if (!hasDate && !hasTime) return true
  if (hasDate && !hasTime) return false
  if (hasTime && !hasDate) return false
  if (hasDate && event.value?.slots?.length) {
    const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const [y, m, d] = form.newDate.split('-').map(Number)
    const dayName = DAY_NAMES[new Date(y, m - 1, d).getDay()]
    const allowed = new Set(event.value.slots.map(s => String(s?.day || '').toLowerCase()).filter(Boolean))
    if (allowed.size > 0 && !allowed.has(dayName)) return false
  }
  return true
})

const isSubmitDisabled = computed(() =>
  submitting.value ||
  !isDateTimeValid.value ||
  (!form.newDate && !form.newStartTime && Number(form.adjustmentTokens) === 0)
)

async function handleSubmit() {
  if (isSubmitDisabled.value) return
  submitting.value = true

  const bookingId = messageContent.value.booking_id

  try {
    // 1. Compute new slot ISO (used for reschedule + meta)
    let newSlotDate = null
    if (form.newDate && form.newStartTime) {
      const [h, m] = form.newStartTime.split(':').map(Number)
      const d      = new Date(form.newDate)
      d.setHours(h, m, 0, 0)
      newSlotDate = d.toISOString()
    }

    // Capture previous values before renegotiation overwrites them
    const prevStartAtIso  = newSlotDate ? (raw.value.startIso || raw.value.startAtIso || null) : null
    const prevTotalTokens = baseTokens.value > 0 ? baseTokens.value : null

    // 2. Renegotiate cost + optional reschedule in one call
    if (bookingId) {
      const renegotiateRes = await FlowHandler.run('bookings.renegotiateBooking', {
        bookingId,
        startAtIso:          newSlotDate || undefined,
        costTokens:          totalTokens.value > 0 ? totalTokens.value : undefined,
        personalRequestText: form.remarks.trim() || undefined,
        actor: 'system',
        args: {
          source:    'chat_adjust',
          action:    'counter_offer',
          chatId:    props.chatId,
          messageId: props.message.message_id,
          prevTotalTokens,
          prevStartAtIso
        },
      })
      if (!renegotiateRes?.ok) {
        console.error('Renegotiation failed', renegotiateRes)
        showToast({ type: 'error', title: 'Failed', message:  renegotiateRes?.message || renegotiateRes?.error || 'Could not adjust booking.' })
        return
      }
    }

    // 4. Update chat message
    const meta = {
      adjustedDurationMinutes: form.durationMinutes,
      selectedAddOns:          selectedAddOnOptions.value.map(o => o.label),
      creatorRemarks:          form.remarks.trim() || null,
      adjustmentTokens:        Number(form.adjustmentTokens) || 0,
      totalTokens:             totalTokens.value,
      newSlotDate,
      prevStartAtIso,
      prevTotalTokens,
    }

    const res = await FlowHandler.run('chat.updateBookingRequestMessage', {
      chatId:    props.chatId,
      messageId: props.message.message_id,
      action:    'counter_offer',
      meta,
    })

    if (res?.ok) {
      emit('submitted', { item: res.data?.item, meta })
    }
  } finally {
    submitting.value = false
  }
}
</script>
