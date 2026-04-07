<template>
  <div
    class="border-l-[4px] border-[#5549FF] bg-[#F9FAFB] shadow-sm overflow-hidden font-['Poppins']"
    :class="pinned ? 'w-full rounded-none border-b border-b-[#E5E7EB]' : 'rounded'"
    :style="pinned ? '' : 'min-width: 210px; max-width: 252px;'"
  >
    <div class="p-3 flex flex-col gap-2">

      <!-- Title + expand icon -->
      <div class="flex justify-between items-start gap-1">
        <div class="text-gray-700 text-[15px] font-semibold leading-snug">
          {{ resolvedTitle }}
        </div>
        <button
          type="button"
          class="shrink-0 w-5 h-5 flex items-center justify-center text-[#98A2B3] hover:text-[#5549FF] mt-0.5"
          @click.stop="$emit('view-details')"
        >
          <img :src="ExpandIcon" class="w-4 h-4" alt="" />
        </button>
      </div>

      <!-- Slot date + time range (skeleton while loading) -->
      <div v-if="loading" class="h-3 w-36 bg-gray-200 rounded animate-pulse" />
      <div v-else-if="resolvedDateTime" class="text-slate-600 text-xs font-medium">
        {{ resolvedDateTime }}
      </div>

      <!-- Price row -->
      <div v-if="resolvedAction === 'counter_offer' && counterTokens" class="flex items-baseline gap-1.5">
        <span v-if="originalTokens" class="line-through text-gray-400 text-sm">{{ originalTokens }}</span>
        <span class="text-[#5549FF] font-semibold text-sm">{{ counterTokens }} Token</span>
      </div>

      <!-- Remarks (counter_offer, creator side only) -->
      <div v-if="isCreator && resolvedAction === 'counter_offer' && counterRemarks" class="flex flex-col gap-0.5">
        <span class="text-gray-700 text-xs font-medium">Your remarks</span>
        <span class="text-[#5549FF] text-xs leading-relaxed" :class="remarksExpanded ? '' : 'line-clamp-2'">{{ counterRemarks }}</span>
        <button
          type="button"
          class="flex items-center gap-0.5 text-[#5549FF] text-xs font-medium hover:opacity-80 self-start mt-0.5"
          @click.stop="remarksExpanded = !remarksExpanded"
        >
          View detail
          <svg
            class="w-3 h-3 shrink-0 transition-transform"
            :class="remarksExpanded ? 'rotate-180' : ''"
            viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M2 4l4 4 4-4" />
          </svg>
        </button>
      </div>

      <!-- Creator + pending: action buttons -->
      <template v-if="isCreator && resolvedAction === 'pending'">
        <div class="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            :disabled="disabled"
            class="px-3 py-1 rounded text-xs font-semibold text-gray-900 bg-[#07F468] hover:opacity-90 disabled:opacity-50 transition-opacity"
            @click.stop="$emit('accept')"
          >
            Accept
          </button>
          <button
            type="button"
            :disabled="disabled"
            class="px-3 py-1 rounded text-xs font-semibold text-[#EE3400] bg-white border border-[#EE3400] hover:bg-red-50 disabled:opacity-50 transition-colors"
            @click.stop="$emit('decline')"
          >
            Decline
          </button>
        </div>
        <button
          type="button"
          class="flex items-center gap-1 text-xs text-[#5549FF] hover:opacity-80"
          @click.stop="$emit('adjust')"
        >
          <img :src="EditIcon" class="w-3 h-3" alt="" />
          Adjust request and price
        </button>
      </template>

      <!-- Creator + counter_offer: waiting for fan to confirm -->
      <template v-else-if="isCreator && resolvedAction === 'counter_offer'">
        <div class="flex items-center justify-between gap-1">
          <div class="flex items-center gap-1">
            <img :src="HourglassIcon" class="w-3.5 h-3.5" alt="" />
            <span class="text-gray-400 text-xs">waiting for response</span>
          </div>
          <button
            type="button"
            class="flex items-center gap-0.5 text-[#5549FF] text-xs font-medium hover:opacity-80 shrink-0"
            @click.stop="$emit('view-details')"
          >
            View Details
            <img :src="ArrowRightIcon" class="w-3.5 h-3.5" alt="" />
          </button>
        </div>
      </template>

      <!-- Fan + counter_offer: confirm or cancel -->
      <template v-else-if="!isCreator && resolvedAction === 'counter_offer'">
        <!-- Sender's remarks (truncated) + expand/collapse toggle -->
        <div v-if="counterRemarks" class="flex flex-col gap-0.5">
          <span class="text-gray-700 text-xs font-medium">@{{ senderName }}'s remarks:</span>
          <span class="text-[#5549FF] text-xs leading-relaxed" :class="remarksExpanded ? '' : 'line-clamp-2'">{{ counterRemarks }}</span>
          <button
            type="button"
            class="flex items-center gap-0.5 text-[#5549FF] text-xs font-medium hover:opacity-80 self-start mt-0.5"
            @click.stop="remarksExpanded = !remarksExpanded"
          >
            View detail
            <svg
              class="w-3 h-3 shrink-0 transition-transform"
              :class="remarksExpanded ? 'rotate-180' : ''"
              viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8"
            >
              <path stroke-linecap="round" stroke-linejoin="round" d="M2 4l4 4 4-4" />
            </svg>
          </button>
        </div>
        <div class="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            :disabled="disabled"
            class="px-3 py-1 rounded text-xs font-semibold text-gray-900 bg-[#07F468] hover:opacity-90 disabled:opacity-50 transition-opacity"
            @click.stop="$emit('confirm-counter')"
          >
            Accept New Cost
          </button>
          <button
            type="button"
            :disabled="disabled"
            class="px-3 py-1 rounded text-xs font-semibold text-[#EE3400] bg-white border border-[#EE3400] hover:bg-red-50 disabled:opacity-50 transition-colors"
            @click.stop="$emit('cancel-booking')"
          >
            Cancel Booking
          </button>
        </div>
      </template>

      <!-- Accepted / declined badge + action button -->
      <template v-else-if="resolvedAction === 'accepted' || resolvedAction === 'declined'">
        <div class="flex items-center justify-between gap-2 flex-wrap">
          <!-- Badge -->
          <div
            class="flex items-center gap-1 text-xs font-semibold"
            :style="{ color: resolvedAction === 'accepted' ? '#059669' : '#DC2626' }"
          >
            <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="8" cy="8" r="6.5" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 8l2 2 4-4" />
            </svg>
            {{ resolvedAction === 'accepted' ? 'Accepted' : 'Declined' }}
          </div>

          <!-- View in Calendar (accepted) / View Details (declined) -->
          <button
            type="button"
            class="flex items-center gap-0.5 text-[#5549FF] text-xs font-medium hover:opacity-80 shrink-0"
            @click.stop="$emit('view-details')"
          >
            <template v-if="resolvedAction === 'accepted'">
              <!-- Calendar icon -->
              <svg class="w-3.5 h-3.5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="1.5" y="2.5" width="13" height="12" rx="1.5" />
                <path stroke-linecap="round" d="M1.5 6h13M5 1.5v2M11 1.5v2" />
              </svg>
              View in Calendar
            </template>
            <template v-else>
              View Details
            </template>
            <img :src="ArrowRightIcon" class="w-3 h-3" alt="" />
          </button>
        </div>
      </template>

      <!-- Fan + pending: waiting for response -->
      <template v-else>
        <div class="flex items-center justify-between gap-1">
          <div class="flex items-center gap-1">
            <img :src="HourglassIcon" class="w-3.5 h-3.5" alt="" />
            <span class="text-gray-400 text-xs">waiting for response</span>
          </div>
          <button
            type="button"
            class="flex items-center gap-0.5 text-[#5549FF] text-xs font-medium hover:opacity-80 shrink-0"
            @click.stop="$emit('view-details')"
          >
            View Details
            <img :src="ArrowRightIcon" class="w-3.5 h-3.5" alt="" />
          </button>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import FlowHandler    from '@/services/flow-system/FlowHandler'
import ArrowRightIcon  from '@/assets/images/icons/arrow-up-right.webp'
import ExpandIcon      from '@/assets/images/icons/arrow-up-right-02.webp'
import HourglassIcon   from '@/assets/images/icons/hourglass-03.webp'
import EditIcon        from '@/assets/images/icons/edit-05.webp'

// ── Per-session cache shared across all bubble instances ──────────────────────
const _bookingCache = new Map() // bookingId → booking item

const props = defineProps({
  message:    { type: Object, required: true },
  isCreator:  { type: Boolean, default: false },
  disabled:   { type: Boolean, default: false },
  senderName: { type: String, default: '' },
  pinned:     { type: Boolean, default: false },
})

defineEmits(['view-details', 'accept', 'decline', 'adjust', 'confirm-counter', 'cancel-booking'])

const content = computed(() => props.message?.content || {})
const loading = ref(false)
const booking = ref(null)
const remarksExpanded = ref(false)

// ── Fetch booking on mount (cached) ──────────────────────────────────────────
onMounted(async () => {
  const bookingId = content.value.booking_id
  if (!bookingId) return

  if (_bookingCache.has(bookingId)) {
    booking.value = _bookingCache.get(bookingId)
    return
  }

  loading.value = true
  const res = await FlowHandler.run('bookings.fetchBooking', { bookingId })
  loading.value = false

  if (res?.ok && res.data?.item) {
    booking.value = res.data.item
    _bookingCache.set(bookingId, res.data.item)
  }
})

// ── Resolved display values (fetched data > message.content fallback) ─────────
const resolvedTitle = computed(() =>
  booking.value?.eventTitle
  || content.value.event_title
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

const resolvedDateTime = computed(() => {
  const raw = booking.value

  // Use fetched startIso/endIso when available — gives full time range
  const start = parseDate(raw?.startIso || raw?.startAtIso)
  const end   = parseDate(raw?.endIso   || raw?.endAtIso)

  if (start) {
    const datePart = start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    const timePart = end
      ? `${fmtTime(start)}-${fmtTime(end)}`
      : fmtTime(start)
    return `${datePart} ${timePart}`
  }

  // Fallback: slot_date from message content (start only, date-only if no time component)
  const slotDate = content.value.slot_date
  if (!slotDate) return null
  const parsed = parseDate(slotDate)
  if (!parsed) return null

  const datePart = parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const hasTime  = slotDate.includes('T') || slotDate.includes(' ')
  return hasTime ? `${datePart} ${fmtTime(parsed)}` : datePart
})

// ── Price / counter-offer data ────────────────────────────────────────────────
const originalTokens = computed(() => {
  const t = booking.value?.payment?.total ?? booking.value?.paymentTotal
  return Number.isFinite(Number(t)) ? Math.ceil(Number(t)) : null
})

const counterTokens = computed(() => {
  const t = content.value.meta?.totalTokens
  return Number.isFinite(Number(t)) ? Math.ceil(Number(t)) : null
})

const counterRemarks = computed(() => content.value.meta?.creatorRemarks || null)

// Map booking API status to bubble action
function deriveAction(apiStatus) {
  if (!apiStatus) return null
  const s = String(apiStatus).toLowerCase()
  if (s === 'confirmed') return 'accepted'
  if (s.startsWith('cancel') || s === 'rejected' || s === 'declined') return 'declined'
  if (s === 'pending' || s === 'pending_hold') return 'pending'
  return null
}

const resolvedAction = computed(() => {
  // Chat-level action (accepted / declined / counter_offer) always takes priority —
  // these are set explicitly via PATCH and override the bookings API status.
  const chatAction = content.value.action
  if (chatAction && chatAction !== 'pending') return chatAction

  // Fall back to bookings API status (maps confirmed→accepted, cancelled→declined, etc.)
  const fromApi = deriveAction(booking.value?.status)
  if (fromApi && fromApi !== 'pending') return fromApi

  return chatAction || 'pending'
})
</script>
