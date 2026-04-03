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

          <!-- Session Duration -->
          <div class="flex flex-col gap-2">
            <label class="text-gray-700 text-base font-medium">Session duration</label>
            <div class="flex items-center gap-2 mt-3">
              <BaseInput
                v-model="form.durationMinutes"
                type="number"
                placeholder=""
                inputClass="px-3.5 text-gray-900 placeholder:text-gray-900 w-full text-base font-normal outline-none py-2.5 bg-white/30 rounded-tl-sm rounded-tr-sm shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] border-b border-gray-300"
              />
              <div class="text-black text-base font-medium leading-normal">Minutes</div>
            </div>
          </div>

          <!-- Additional Requests -->
          <div v-if="addOnOptions.length" class="flex flex-col gap-3">
            <label class="text-gray-700 text-base font-medium">Additional request</label>
            <div class="flex flex-col gap-3.5 mt-0.5">
              <label
                v-for="opt in addOnOptions"
                :key="opt.key"
                class="flex items-center justify-between cursor-pointer group"
              >
                <div class="flex items-center gap-2.5">
                  <CheckboxGroup v-model="form.selectedAddOns" :value="opt.key" />
                  <span class="text-gray-950 text-base font-medium transition-colors">{{ opt.label }}</span>
                </div>
                <span class="text-[#4640FF] font-semibold text-[14px] tracking-wide">+ {{ opt.tokens }} Tokens</span>
              </label>
            </div>
          </div>

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
                :disabled="submitting"
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
import CloseIcon      from '@/assets/images/icons/cross-white.webp'
import BaseInput      from '@/components/dev/input/BaseInput.vue'
import CheckboxGroup  from '@/components/ui/form/checkbox/CheckboxGroup.vue'
import ButtonComponent from '@/components/dev/button/ButtonComponent.vue'

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
  durationMinutes: 30,
  selectedAddOns:  [],
  remarks:         '',
  adjustmentTokens: 0,
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
    const mins = Number(bookingRes.data.item.durationMinutes || 0)
    if (mins > 0) form.durationMinutes = mins
  }

  if (eventRes?.ok && eventRes.data?.item) {
    event.value = eventRes.data.item
  }

  console.error('[AdjustBookingPopup] fetched booking and event data', { booking: booking.value, event: event.value })
})

const raw = computed(() => booking.value || {})

const personalRequestText = computed(() =>
  String(raw.value.personalRequestText || '').trim() || null
)

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

const baseTokens = computed(() => {
  const payment = raw.value.payment || {}
  const total = Number(payment.total ?? raw.value.paymentTotal ?? 0)
  return Number.isFinite(total) ? Math.ceil(total) : 0
})

const addOnTokens = computed(() =>
  addOnOptions.value
    .filter(o => form.selectedAddOns.includes(o.key))
    .reduce((sum, o) => sum + o.tokens, 0)
)

const totalTokens = computed(() =>
  Math.max(0, baseTokens.value + addOnTokens.value + (Number(form.adjustmentTokens) || 0))
)

async function handleSubmit() {
  if (submitting.value) return
  submitting.value = true

  const meta = {
    adjustedDurationMinutes: form.durationMinutes,
    selectedAddOns:          form.selectedAddOns,
    creatorRemarks:          form.remarks.trim() || null,
    adjustmentTokens:        Number(form.adjustmentTokens) || 0,
    totalTokens:             totalTokens.value,
  }

  const res = await FlowHandler.run('chat.updateBookingRequestMessage', {
    chatId:    props.chatId,
    messageId: props.message.message_id,
    action:    'counter_offer',
    meta,
  })

  submitting.value = false

  if (res?.ok) {
    emit('submitted', { item: res.data?.item, meta })
  }
}
</script>
