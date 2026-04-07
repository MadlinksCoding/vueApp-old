<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <div
      class="fixed inset-0 z-[10001] flex items-center justify-center p-4"
      data-fs-chat-popup
      @click.self="$emit('close')"
    >
      <div class="absolute inset-0 bg-black/40" @click="$emit('close')" />

      <!-- Panel — mirrors DashboardEventStaticPopup layout -->
      <div
        class="relative z-10 w-full sm:w-[500px] border-l-[4px] border-[#5549FF] bg-[#F9FAFB] rounded shadow-lg inline-flex items-start overflow-hidden font-['Poppins'] max-h-[90vh]"
      >
        <div class="w-full p-4 flex items-start overflow-y-auto max-h-[90vh]">
          <div class="flex-1 inline-flex flex-col items-start gap-6">

            <!-- Header -->
            <div class="w-full inline-flex justify-between items-center">
              <div class="text-gray-700 text-xl font-semibold font-['Poppins'] leading-tight pr-4">
                {{ eventTitle }}
              </div>
              <button
                type="button"
                class="inline-flex w-6 h-6 items-center justify-center rounded hover:bg-gray-100 text-[#98A2B3] p-1 -mt-1 -mr-2 shrink-0"
                @click="$emit('close')"
              >
                <img :src="DotVerticalIcon" alt="three-dot" class="w-4 h-4">
              </button>
            </div>

            <!-- Loading -->
            <div v-if="loading" class="w-full flex justify-center py-6">
              <div class="w-6 h-6 border-2 border-[#5549FF] border-t-transparent rounded-full animate-spin" />
            </div>

            <!-- Error -->
            <div v-else-if="fetchError" class="text-red-500 text-sm">
              {{ fetchError }}
            </div>

            <div v-else class="flex flex-col gap-4 w-full">

              <!-- Date and Time -->
              <div class="inline-flex items-start gap-4">
                <div class="w-5 h-5 flex-shrink-0 relative overflow-hidden mt-0.5">
                  <img src="/images/alarmIcon.png" alt="" class="filter invert-[0.6] sepia-[0.1] saturate-[0.1] hue-rotate-[180deg] object-contain w-full h-full opacity-70">
                </div>
                <div class="inline-flex flex-col justify-center items-start gap-1">
                  <div class="text-gray-950 text-sm font-semibold leading-5">
                    {{ formattedDate }}
                  </div>
                  <div class="inline-flex items-center gap-2 mt-0.5">
                    <div class="text-gray-950 text-sm font-semibold leading-5">
                      {{ formattedTimeRange }}
                    </div>
                    <div v-if="duration > 0" class="text-gray-400 text-sm font-medium leading-5">
                      {{ duration }} minutes
                    </div>
                  </div>
                </div>
              </div>

              <!-- Guest -->
              <div v-if="guestLabel" class="inline-flex items-start gap-4">
                <div class="w-5 h-5 flex-shrink-0 relative overflow-hidden mt-0.5">
                  <img src="/images/profile.webp" alt="" class="filter invert-[0.6] sepia-[0.1] saturate-[0.1] hue-rotate-[180deg] object-contain w-full h-full opacity-70">
                </div>
                <div class="inline-flex flex-col justify-center items-start gap-2">
                  <div class="inline-flex items-center gap-2">
                    <img v-if="guestAvatar" :src="guestAvatar" class="w-5 h-5 rounded-full object-cover" alt="" />
                    <div class="text-gray-950 text-sm font-medium leading-5">
                      {{ guestLabel }}
                    </div>
                  </div>
                  <a
                    v-if="props.chatId"
                    href="#"
                    class="inline-flex items-center gap-0.5 text-blue-600 text-xs tracking-wider hover:text-blue-700 uppercase"
                    @click.prevent="$emit('open-chat')"
                  >
                    <img :src="MessageTextIconBlue" alt="" class="w-4 h-4">
                    OPEN CHAT
                    <img :src="ArrowRightIcon" alt="" class="w-4 h-4">
                  </a>
                </div>
              </div>

              <!-- Additional Request -->
              <div v-if="additionalRequestLines.length" class="inline-flex items-start gap-4 w-full">
                <div class="w-5 h-5 flex-shrink-0 relative overflow-hidden mt-0.5">
                  <img src="/images/dotpoints.png" alt="" class="filter invert-[0.6] sepia-[0.1] saturate-[0.1] hue-rotate-[180deg] object-contain w-full h-full opacity-70">
                </div>
                <div class="inline-flex flex-col items-start gap-2.5 flex-1">
                  <div class="text-gray-950 text-sm font-semibold leading-5">Additional request</div>
                  <ul class="list-disc pl-[20px] text-gray-950 text-sm font-normal leading-relaxed flex flex-col gap-1.5 w-full">
                    <li v-for="(line, i) in additionalRequestLines" :key="i">{{ line }}</li>
                  </ul>
                </div>
              </div>

              <!-- Minimum Charge -->
              <div v-if="minimumChargeLabel" class="inline-flex items-start gap-4">
                <div class="w-5 h-5 flex-shrink-0 relative overflow-hidden">
                  <img src="/images/dollar.png" alt="" class="filter invert-[0.6] sepia-[0.1] saturate-[0.1] hue-rotate-[180deg] object-contain w-full h-full opacity-70">
                </div>
                <div class="inline-flex flex-col items-start gap-1.5">
                  <div class="text-gray-950 text-sm font-semibold leading-5">Minimum charge</div>
                  <div class="text-gray-950 text-sm font-normal leading-5">{{ minimumChargeLabel }}</div>
                </div>
              </div>

              <!-- Reminder -->
              <div v-if="reminderLabel" class="inline-flex items-center gap-4">
                <div class="w-5 h-5 flex-shrink-0 relative overflow-hidden">
                  <img src="/images/bell-1.webp" alt="" class="filter invert-[0.6] sepia-[0.1] saturate-[0.1] hue-rotate-[180deg] object-contain w-full h-full opacity-70">
                </div>
                <div class="text-gray-950 text-sm font-normal leading-5">{{ reminderLabel }}</div>
              </div>

            </div>

            <!-- Actions (creator + pending) -->
            <div v-if="!loading && isCreator && currentAction === 'pending'" class="w-full flex items-center flex-wrap gap-x-2 gap-y-3 pt-3">
              <button
                type="button"
                :disabled="actionLoading"
                class="px-3 py-2 rounded shadow-sm text-sm font-semibold text-gray-950 bg-[#07F468] hover:opacity-90 transition-opacity disabled:opacity-50 tracking-wide uppercase"
                @click="handleAccept"
              >
                ACCEPT
              </button>
              <button
                type="button"
                :disabled="actionLoading"
                class="px-3 py-2 rounded text-sm font-semibold text-[#EE3400] bg-white border border-[#EE3400] hover:bg-[#fff5f2] transition-colors disabled:opacity-50 tracking-wide uppercase shadow-sm"
                @click="handleDecline"
              >
                DECLINE
              </button>
              <button
                type="button"
                class="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-[#5549FF] hover:bg-gray-50 rounded transition-colors whitespace-nowrap"
                @click="$emit('adjust')"
              >
                <img :src="EditIcon" alt="" class="w-4 h-4">
                Adjust Request and Price
              </button>
            </div>

            <!-- Counter offer: fan actions -->
            <div v-else-if="!loading && !isCreator && currentAction === 'counter_offer'" class="w-full flex items-center flex-wrap gap-x-2 gap-y-3 pt-3">
              <div class="w-full text-sm font-semibold text-[#5549FF] mb-1">Counter offer received</div>
              <button
                type="button"
                :disabled="actionLoading"
                class="px-3 py-2 rounded shadow-sm text-sm font-semibold text-gray-950 bg-[#07F468] hover:opacity-90 transition-opacity disabled:opacity-50 tracking-wide uppercase"
                @click="$emit('confirm-counter')"
              >
                ACCEPT NEW COST
              </button>
              <button
                type="button"
                :disabled="actionLoading"
                class="px-3 py-2 rounded text-sm font-semibold text-[#EE3400] bg-white border border-[#EE3400] hover:bg-[#fff5f2] transition-colors disabled:opacity-50 tracking-wide uppercase shadow-sm"
                @click="$emit('cancel-booking')"
              >
                CANCEL BOOKING
              </button>
            </div>

            <!-- Creator + counter_offer: waiting -->
            <div v-else-if="!loading && isCreator && currentAction === 'counter_offer'" class="pt-1">
              <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold bg-gray-100 text-gray-500">
                <img :src="HourglassIcon" class="w-4 h-4" alt="" />
                Waiting for fan response
              </div>
            </div>

            <!-- Accepted / declined badge -->
            <div v-else-if="!loading && (currentAction === 'accepted' || currentAction === 'declined')" class="pt-1">
              <div
                class="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold"
                :style="currentAction === 'accepted'
                  ? 'background:#ECFDF5; color:#059669'
                  : 'background:#FEF2F2; color:#DC2626'"
              >
                <svg class="w-4 h-4 shrink-0 mr-1" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="8" cy="8" r="6.5" />
                  <path stroke-linecap="round" stroke-linejoin="round" d="M5 8l2 2 4-4" />
                </svg>
                {{ currentAction === 'accepted' ? 'Accepted' : 'Declined' }}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import FlowHandler from '@/services/flow-system/FlowHandler'
import DotVerticalIcon    from '@/assets/images/icons/dots-vertical.webp'
import MessageTextIconBlue from '@/assets/images/icons/messageblue.webp'
import ArrowRightIcon     from '@/assets/images/icons/arrow-up-right.webp'
import EditIcon           from '@/assets/images/icons/edit-05.webp'
import HourglassIcon      from '@/assets/images/icons/hourglass-03.webp'

const props = defineProps({
  message:       { type: Object, required: true },
  booking:       { type: Object, default: null },
  event:         { type: Object, default: null },
  isCreator:     { type: Boolean, default: false },
  chatId:        { type: String, default: null },
  currentUserId: { type: [String, Number], default: null },
})

const emit = defineEmits(['action-complete', 'adjust', 'open-chat', 'close', 'confirm-counter', 'cancel-booking'])

// ── State ────────────────────────────────────────────────────────────────────
const loading       = ref(true)
const fetchError    = ref(null)
const booking       = ref(props.booking || null)
const actionLoading = ref(false)

const messageContent = computed(() => props.message?.content || {})
const currentAction  = ref(messageContent.value.action || 'pending')

function deriveAction(apiStatus) {
  if (!apiStatus) return null
  const s = String(apiStatus).toLowerCase()
  if (s === 'confirmed') return 'accepted'
  if (s.startsWith('cancel') || s === 'rejected' || s === 'declined') return 'declined'
  if (s === 'pending' || s === 'pending_hold') return 'pending'
  return null
}

function applyBookingData(data) {
  booking.value = data
  const derived = deriveAction(data?.status)
  if (derived && derived !== 'pending') currentAction.value = derived
}

// ── Fetch booking on mount ───────────────────────────────────────────────────
onMounted(async () => {
  const bookingId = messageContent.value.booking_id
  if (!bookingId) {
    fetchError.value = 'No booking ID found.'
    loading.value = false
    return
  }

  // If pre-fetched booking was passed via prop — show immediately, no spinner
  if (props.booking) {
    applyBookingData(props.booking)
    loading.value = false
    // Silently refresh in background to get latest status
    FlowHandler.run('bookings.fetchBooking', { bookingId }).then((res) => {
      if (res?.ok) applyBookingData(res.data?.item || null)
    })
    return
  }

  // No pre-fetched data — fetch with loading spinner
  const res = await FlowHandler.run('bookings.fetchBooking', { bookingId })
  loading.value = false

  if (!res?.ok) {
    fetchError.value = res?.error?.message || 'Could not load booking details.'
    return
  }

  applyBookingData(res.data?.item || null)
})

// ── Display computed ─────────────────────────────────────────────────────────
const raw = computed(() => booking.value || {})

const eventTitle = computed(() =>
  raw.value.eventTitle
  || messageContent.value.event_title
  || 'Booking Request'
)

function parseDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return isNaN(d.getTime()) ? null : d
}

function fmtTime(d) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
}

const startDate = computed(() =>
  parseDate(raw.value.startIso || raw.value.startAtIso || messageContent.value.slot_date)
)
const endDate = computed(() =>
  parseDate(raw.value.endIso || raw.value.endAtIso)
)

const formattedDate = computed(() => {
  if (!startDate.value) return ''
  return startDate.value.toLocaleDateString('en-US', {
    weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
  })
})

const formattedTimeRange = computed(() => {
  if (!startDate.value) return ''
  if (!endDate.value) return fmtTime(startDate.value)
  return `${fmtTime(startDate.value)}-${fmtTime(endDate.value)}`
})

const duration = computed(() => {
  if (!startDate.value || !endDate.value) return Number(raw.value.durationMinutes || 0)
  return Math.max(0, Math.floor((endDate.value - startDate.value) / 60000))
})

const guestLabel = computed(() =>
  raw.value.userDisplayName
  || raw.value.userName
  || raw.value.userUsername
  || (raw.value.userId ? `User #${raw.value.userId}` : null)
)

const guestAvatar = computed(() => raw.value.userAvatarUrl || null)

function titleCaseFromKey(key = '') {
  return String(key).replace(/[_-]+/g, ' ').trim().replace(/\b\w/g, c => c.toUpperCase())
}

const additionalRequestLines = computed(() => {
  if (!booking.value) return []
  const lines = []

  const addOns = Array.isArray(raw.value.requestedAddOns) ? raw.value.requestedAddOns : []
  addOns.forEach(item => {
    if (typeof item === 'string' && item.trim()) { lines.push(item.trim()); return }
    const label = item?.title || item?.name || item?.label
    if (typeof label === 'string' && label.trim()) lines.push(label.trim())
  })

  const additionalRequests = raw.value.additionalRequests || {}
  Object.entries(additionalRequests).forEach(([key, value]) => {
    if (value === true) { lines.push(titleCaseFromKey(key)); return }
    if (typeof value === 'string' && value.trim()) { lines.push(`${titleCaseFromKey(key)}: ${value.trim()}`); return }
    if (typeof value === 'number' && Number.isFinite(value)) lines.push(`${titleCaseFromKey(key)}: ${value}`)
  })

  const personalText = String(raw.value.personalRequestText || '').trim()
  if (personalText) lines.push(personalText)

  return lines
})

const minimumChargeLabel = computed(() => {
  if (!booking.value) return null
  const payment = raw.value.payment || {}
  const lineTotal = Array.isArray(payment.lines)
    ? payment.lines.reduce((sum, l) => sum + Number(l?.amount || 0), 0)
    : 0
  const total = Number(payment.total ?? raw.value.paymentTotal ?? lineTotal ?? 0)
  if (!Number.isFinite(total) || total <= 0) return null
  const currency = String(payment.currency || raw.value.paymentCurrency || 'TOKENS').toUpperCase()
  return currency === 'TOKENS' ? `${Math.ceil(total)} Tokens` : `${currency} ${total}`
})

const reminderLabel = computed(() => {
  if (!props.event) return null
  const eventRaw = props.event?.raw || props.event || {}
  const merged = { ...(eventRaw.eventCurrent || {}), ...(eventRaw.eventSnapshot || {}), ...eventRaw }
  const mins = Number(
    merged.callReminderMinutesBefore
    ?? merged.remindBeforeMinutes
    ?? merged.reminderMinutes
    ?? merged.reminder_minutes
  )
  if (!Number.isFinite(mins) || mins <= 0) return null
  return `${mins} minutes before`
})

// ── Actions ──────────────────────────────────────────────────────────────────
async function handleAccept() {
  if (actionLoading.value) return
  actionLoading.value = true

  const res = await FlowHandler.run('bookings.reviewPendingBooking', {
    bookingId: messageContent.value.booking_id,
    decision:  'approve',
    actor:     'creator',
  })

  actionLoading.value = false

  if (res?.ok) {
    currentAction.value = 'accepted'
    emit('action-complete', { decision: 'approve', bookingId: messageContent.value.booking_id })
  }
}

async function handleDecline() {
  if (actionLoading.value) return
  actionLoading.value = true

  const res = await FlowHandler.run('bookings.reviewPendingBooking', {
    bookingId: messageContent.value.booking_id,
    decision:  'reject',
    actor:     'creator',
  })

  actionLoading.value = false

  if (res?.ok) {
    currentAction.value = 'declined'
    emit('action-complete', { decision: 'reject', bookingId: messageContent.value.booking_id })
  }
}
</script>
