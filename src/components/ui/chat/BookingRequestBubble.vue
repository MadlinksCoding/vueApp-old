<template>
  <div
    class="border-l-[4px] border-[#5549FF] bg-[#F9FAFB] shadow-sm font-['Poppins'] w-full"
    :class="pinned ? 'w-full h-full flex flex-col rounded-none border-b border-b-[#E5E7EB]' : 'overflow-hidden rounded'"
  >
    <div class="p-2 flex flex-col gap-2 h-full">

      <!-- Title + expand icon -->
      <div class="flex justify-between items-start gap-1">
        <div class="text-gray-700 text-base font-semibold leading-snug">
          {{ resolvedTitle }}
        </div>
        <!-- {{ resolvedAction }} -->
        <div v-if="isPinned && isCreator && ! ['pending', 'declined', 'cancelled'].includes(resolvedAction)" class="relative">
          <button
            type="button"
            class="shrink-0 w-5 h-5 flex items-center justify-center text-[#98A2B3] hover:text-[#5549FF] mt-0.5"
            @click.stop="toggleMenu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8.00016 8.66602C8.36835 8.66602 8.66683 8.36754 8.66683 7.99935C8.66683 7.63116 8.36835 7.33268 8.00016 7.33268C7.63197 7.33268 7.3335 7.63116 7.3335 7.99935C7.3335 8.36754 7.63197 8.66602 8.00016 8.66602Z" stroke="#98A2B3" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M8.00016 3.99935C8.36835 3.99935 8.66683 3.70087 8.66683 3.33268C8.66683 2.96449 8.36835 2.66602 8.00016 2.66602C7.63197 2.66602 7.3335 2.96449 7.3335 3.33268C7.3335 3.70087 7.63197 3.99935 8.00016 3.99935Z" stroke="#98A2B3" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M8.00016 13.3327C8.36835 13.3327 8.66683 13.0342 8.66683 12.666C8.66683 12.2978 8.36835 11.9993 8.00016 11.9993C7.63197 11.9993 7.3335 12.2978 7.3335 12.666C7.3335 13.0342 7.63197 13.3327 8.00016 13.3327Z" stroke="#98A2B3" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>

          <!-- {{ isPassCall?  'Actions unavailable for this booking' : 'You can take actions on this booking'  }} -->
          <div
            v-if="menuOpen"
            class="absolute right-0 top-6 z-[1200] w-[14rem] rounded-[0.375rem] border border-[#EAECF0] bg-white shadow-[0_10px_20px_rgba(0,0,0,0.15)] overflow-hidden"
            @click.stop
          >
            <button
              v-if="resolvedAction === 'accepted'"
              type="button"
              class="w-full flex items-center gap-2 px-3 py-3 text-left text-[0.8rem] font-semibold text-[#344054] hover:bg-[#F9FAFB]"
              :class="{ 'pointer-events-none opacity-30 cursor-not-allowed': isPassCall }"
              :disabled="isPassCall"
              @click.stop="handleAskMoreTime"
            >
              <span class="inline-flex w-5 h-5 items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 7V12L15 15M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="#475467" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              Ask for more time
            </button>
            <button
              v-if="resolvedAction === 'accepted'"
              type="button"
              class="w-full flex items-center gap-2 px-3 py-3 text-left text-[0.8rem] font-semibold text-[#344054] border-t border-[#EAECF0] hover:bg-[#F9FAFB]"
              :class="{ 'pointer-events-none opacity-30 cursor-not-allowed': isPassCall }"
              :disabled="isPassCall"
              @click.stop="handleAskToReschedule"
            >
              <span class="inline-flex w-5 h-5 items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M16 2V6M8 2V6M3 10H21M7 22H17C18.6569 22 20 20.6569 20 19V7C20 5.34315 18.6569 4 17 4H7C5.34315 4 4 5.34315 4 7V19C4 20.6569 5.34315 22 7 22Z" stroke="#475467" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              Ask to reschedule
            </button>
            <button
              type="button"
              class="w-full flex items-center gap-2 px-3 py-3 text-left text-[0.8rem] font-semibold text-[#F04438] border-t border-[#EAECF0] hover:bg-[#FEF3F2]"
              :class="{ 'pointer-events-none opacity-30 cursor-not-allowed': isPassCall }"
              :disabled="isPassCall"
              @click.stop="handleCancelCall"
            >
              <span class="inline-flex w-5 h-5 items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M10 14L21 3M14 10L3 21M4.5 8.5C3.5 6.5 3.5 4.5 5 3C7 1 10 2 12.5 4.5L19.5 11.5C22 14 23 17 21 19C19.5 20.5 17.5 20.5 15.5 19.5" stroke="#F04438" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>
              Cancel Call
            </button>
          </div>
        </div>
        <button
          v-else
          type="button"
          class="shrink-0 w-5 h-5 flex items-center justify-center text-[#98A2B3] hover:text-[#5549FF] mt-0.5"
          @click.stop="$emit('view-details')"
        >
          <img :src="ExpandIcon" class="w-4 h-4" alt="" />
        </button>
      </div>

      <!-- Slot date + time range (skeleton while loading) -->
      <div v-if="loading" class="h-3 w-36 bg-gray-200 rounded animate-pulse" />
      <template v-else-if="resolvedDateTime">
        <!-- Date change row (counter_offer with new slot) -->
        <div v-if="resolvedAction === 'counter_offer' && counterSlotDate && prevSlotDateTime" class="flex flex-col gap-0.5">
          <span class="line-through text-gray-400 text-xs">{{ prevSlotDateTime }}</span>
          <span class="text-[#5549FF] font-semibold text-xs">{{ counterSlotDate }}</span>
        </div>
        <!-- Normal date row -->
        <div v-else class="text-slate-700 text-sm font-medium">
          {{ resolvedDateTime }}
        </div>
      </template>

      <!-- Price row -->
      <div v-if="resolvedAction === 'counter_offer' && counterTokens" class="flex items-baseline gap-1.5">
        <span v-if="prevTokens" class="line-through text-gray-400 text-sm">{{ prevTokens }}</span>
        <span class="text-[#5549FF] font-semibold text-sm">{{ counterTokens }} Token</span>
      </div>

      <!-- Remarks (counter_offer, creator side only) -->
      <div v-if="isCreator && resolvedAction === 'counter_offer' && counterRemarks" class="flex flex-col gap-0.5">
        <span class="text-gray-700 text-xs font-medium">Your remarks</span>
        <span ref="remarksRef" class="text-[#5549FF] text-xs leading-relaxed" :class="remarksExpanded ? '' : 'line-clamp-2'">{{ counterRemarks }}</span>
        <button
          v-if="isRemarksClamped || remarksExpanded"
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
        <div class="mt-auto flex flex-col gap-2 w-full items-start">
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
        </div>
      </template>

      <!-- Creator + counter_offer: waiting for fan to confirm -->
      <template v-else-if="isCreator && resolvedAction === 'counter_offer'">
        <div class="mt-auto flex items-center justify-between gap-1">
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

      <!-- Fan + counter_offer: time-based (moretime / reschedule) -->
      <template v-else-if="!isCreator && resolvedAction === 'counter_offer' && isTimeBasedCounter">
        <div class="mt-auto flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            :disabled="disabled"
            class="px-3 py-1 rounded text-xs font-semibold text-gray-900 bg-[#07F468] hover:opacity-90 disabled:opacity-50 transition-opacity"
            @click.stop="$emit('accept-counter')"
          >
            Accept New Time
          </button>
          <button
            type="button"
            :disabled="disabled"
            class="px-3 py-1 rounded text-xs font-semibold text-[#EE3400] bg-white border border-[#EE3400] hover:bg-red-50 disabled:opacity-50 transition-colors"
            @click.stop="$emit('reject-counter')"
          >
            Reject
          </button>
        </div>
      </template>

      <!-- Fan + counter_offer: adjust (cost change) -->
      <template v-else-if="!isCreator && resolvedAction === 'counter_offer'">
        <!-- Sender's remarks (truncated) + expand/collapse toggle -->
        <div v-if="counterRemarks" class="flex flex-col gap-0.5">
          <span class="text-gray-700 text-xs font-medium">@{{ senderName }}'s remarks:</span>
          <span ref="remarksRef" class="text-[#5549FF] text-xs leading-relaxed" :class="remarksExpanded ? '' : 'line-clamp-2'">{{ counterRemarks }}</span>
          <button
            v-if="isRemarksClamped || remarksExpanded"
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
        <div class="mt-auto flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            :disabled="disabled"
            class="px-3 py-1 rounded text-xs font-semibold text-gray-900 bg-[#07F468] hover:opacity-90 disabled:opacity-50 transition-opacity"
            @click.stop="$emit('confirm-counter')"
          >
            Accept Changes
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
      <template v-else-if="resolvedAction === 'accepted' || resolvedAction === 'cancelled' || resolvedAction === 'declined'">
        <div class="mt-auto flex items-center justify-between gap-2 flex-wrap">
          <!-- Badge -->
          <div
            class="flex items-center gap-1 text-sm font-semibold"
            :style="{ color: resolvedAction === 'accepted' ? '#15B79E' : '#DC2626' }"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"  viewBox="0 0 16 16" fill="none">
              <g clip-path="url(#clip0_1117_172996)">
                <path d="M14.6668 7.39113V8.00447C14.666 9.44208 14.2005 10.8409 13.3397 11.9924C12.4789 13.1438 11.269 13.9861 9.8904 14.3937C8.51178 14.8013 7.03834 14.7524 5.68981 14.2542C4.34128 13.756 3.18993 12.8352 2.40747 11.6292C1.62501 10.4232 1.25336 8.99651 1.34795 7.56201C1.44254 6.12751 1.9983 4.76202 2.93235 3.66918C3.8664 2.57635 5.12869 1.81472 6.53096 1.4979C7.93323 1.18107 9.40034 1.32602 10.7135 1.91113M14.6668 2.66732L8.00016 9.34065L6.00016 7.34065" stroke="currentColor" stroke-width="1.33333" stroke-linecap="round" stroke-linejoin="round"/>
              </g>
              <defs>
                <clipPath id="clip0_1117_172996">
                  <rect width="16" height="16" fill="white"/>
                </clipPath>
              </defs>
            </svg>
            {{ resolvedAction === 'accepted' ? 'Accepted' : '' }}
            {{ resolvedAction === 'declined' ? 'Declined' : '' }}
            {{ resolvedAction.startsWith('cancel') || resolvedAction.startsWith('reject') ? 'Cancelled' : '' }}
          </div>

          <!-- View in Calendar (accepted) / View Details (declined) -->
          <button
            type="button"
            class="flex items-center gap-0.5 text-[#5549FF] text-sm font-medium hover:opacity-80 shrink-0"
            @click.stop="resolvedAction === 'accepted' ? goToCalendar() : $emit('view-details')"
          >
            <template v-if="resolvedAction === 'accepted'">
              <!-- Calendar icon -->
              <svg class="w-5 h-5 shrink-0" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="1.5" y="2.5" width="13" height="12" rx="1.5" />
                <path stroke-linecap="round" d="M1.5 6h13M5 1.5v2M11 1.5v2" />
              </svg>
              View in Calendar
            </template>
            <template v-else>
              View Details
            </template>
            <img :src="ArrowRightIcon" class="w-4 h-4" alt="" />
          </button>
        </div>
      </template>

      <!-- Fan + pending: waiting for response -->
      <template v-else>
        <div class="mt-auto flex items-center justify-between gap-1">
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
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import FlowHandler    from '@/services/flow-system/FlowHandler'
import { useChatStore } from '@/stores/useChatStore'
import ArrowRightIcon  from '@/assets/images/icons/arrow-up-right.webp'
import ExpandIcon      from '@/assets/images/icons/arrow-up-right-02.webp'
import HourglassIcon   from '@/assets/images/icons/hourglass-03.webp'
import EditIcon        from '@/assets/images/icons/edit-05.webp'

const chatStore = useChatStore()

const props = defineProps({
  message:    { type: Object, required: true },
  isCreator:  { type: Boolean, default: false },
  disabled:   { type: Boolean, default: false },
  senderName: { type: String, default: '' },
  pinned:     { type: Boolean, default: false },
})

const emit = defineEmits(['view-details', 'accept', 'decline', 'adjust', 'confirm-counter', 'cancel-booking', 'accept-counter', 'reject-counter', 'ask-more-time', 'ask-to-reschedule'])

const content = computed(() => props.message?.content || {})
const loading = ref(false)
const menuOpen = ref(false)
const remarksExpanded = ref(false)
const remarksRef = ref(null)
const isRemarksClamped = ref(false)
const isPinned = computed(() => props.message?.is_pinned || false)
const isPassCall = computed(() => {
  const start = parseDate( booking.value?.startAtIso );
  const end = parseDate( booking.value?.endAtIso );

  if (!start || !end) return true; // If no date info, assume passed to avoid showing action buttons

  const now = Date.now()
  const startMs = start.getTime()
  const endMs = end.getTime()
  if (now >= startMs && now < endMs) return false; // Currently within the scheduled time slot
  const msToStart = startMs - now
  if (msToStart > 0) return false; // Still have time before the slot starts

  return true;
})

// ── Booking — reactive from store so socket updates reflect immediately ────────
const booking = computed(() => {
  const bookingId = content.value.booking_id
  return bookingId ? chatStore.getBookingById(bookingId) : null
})

function toggleMenu() { menuOpen.value = !menuOpen.value }
function handleAskMoreTime()     { menuOpen.value = false; emit('ask-more-time') }
function handleAskToReschedule() { menuOpen.value = false; emit('ask-to-reschedule') }
function handleCancelCall()      { menuOpen.value = false; emit('cancel-booking') }

function goToCalendar() {
  try {
    const topPath = window.top?.location?.pathname
    if (topPath && topPath.includes('/dashboard/events')) {
      window.dispatchEvent(new CustomEvent('fs-chat-close-all'))
      return
    }
  } catch (e) {
    console.warn("Could not read top location", e)
  }
  window.open('/dashboard/events', '_top')
}

const handleDocumentClick = () => { menuOpen.value = false }
onMounted(() => document.addEventListener('click', handleDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', handleDocumentClick))

function checkClamped() {
  nextTick(() => {
    const el = remarksRef.value
    isRemarksClamped.value = !!el && el.scrollHeight > el.clientHeight
  })
}

// ── Fetch booking on mount if not already in store ────────────────────────────
onMounted(async () => {
  const bookingId = content.value.booking_id
  if (!bookingId) return

  // Already pre-fetched by ChatWindow watcher or socket handler — skip
  if (chatStore.getBookingById(bookingId)) return

  loading.value = true
  const res = await FlowHandler.run('bookings.fetchBooking', { bookingId })
  loading.value = false

  if (res?.ok && res.data?.item) {
    chatStore.setBooking(bookingId, res.data.item)
  }

  checkClamped()
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
const prevTokens = computed(() => {
  const t = content.value.meta?.prevTotalTokens
  return Number.isFinite(Number(t)) ? Math.ceil(Number(t)) : null
})

const counterTokens = computed(() => {
  const t = content.value.meta?.totalTokens
  return Number.isFinite(Number(t)) ? Math.ceil(Number(t)) : null
})

const counterRemarks = computed(() => content.value.meta?.creatorRemarks || null)

const counterSource      = computed(() => content.value.meta?.source || null)
const isTimeBasedCounter = computed(() =>
  counterSource.value === 'reschedule' || counterSource.value === 'more_time'
)

const prevSlotDateTime = computed(() => {
  const iso = content.value.meta?.prevStartAtIso
  if (!iso) return null
  const start = parseDate(iso)
  if (!start) return null
  const datePart = start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const raw = booking.value
  const durationMs = raw?.durationMinutes ? raw.durationMinutes * 60000 : null
  const end = durationMs ? new Date(start.getTime() + durationMs) : null
  return end
    ? `${datePart} ${fmtTime(start)}-${fmtTime(end)}`
    : `${datePart} ${fmtTime(start)}`
})

const counterSlotDate = computed(() => {
  const iso = content.value.meta?.newSlotDate
  if (!iso) return null
  const start = parseDate(iso)
  if (!start) return null
  const datePart = start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  // Derive end time from booking duration (endAtIso - startAtIso)
  const raw = booking.value
  const origStart = parseDate(raw?.startIso || raw?.startAtIso)
  const origEnd   = parseDate(raw?.endIso   || raw?.endAtIso)
  const durMs = (origStart && origEnd) ? (origEnd.getTime() - origStart.getTime()) : null
  const end = durMs ? new Date(start.getTime() + durMs) : null
  return end
    ? `${datePart} ${fmtTime(start)}-${fmtTime(end)}`
    : `${datePart} ${fmtTime(start)}`
})

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

watch([counterRemarks, resolvedAction], checkClamped, { flush: 'post' })
</script>
