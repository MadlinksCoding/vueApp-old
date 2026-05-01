<template>
  <div
    class="relative w-full border-l-4 border-[#4F46E5] bg-white border-b border-b-[#E5E7EB] font-['Poppins']"
    @click.self="closeDropdown"
  >
    <div class="px-4 py-3 flex flex-col gap-1.5">

      <!-- Header row: title + 3-dot menu -->
      <div class="flex items-start justify-between gap-2">
        <span class="text-[#111827] text-sm font-semibold leading-5 line-clamp-2">
          {{ eventName }}
        </span>
        <button
          v-if="!isCounterOffer && !isCancelled && !isAccepted && isCreator && !isExpired"
          class="shrink-0 p-0.5 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          @click.stop="toggleDropdown"
        >
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4zm0 6a2 2 0 110-4 2 2 0 010 4z"/>
          </svg>
        </button>
      </div>

      <!-- ── Cancelled / declined state ───────────────────────────────────── -->
      <template v-if="isCancelled">
        <div v-if="formattedDateTime" class="text-gray-500 text-xs leading-4">
          {{ formattedDateTime }}
        </div>
        <div class="flex items-center justify-between mt-1">
          <div class="flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5 text-red-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z"
              />
            </svg>
            <span class="text-red-500 text-xs font-semibold">Canceled</span>
          </div>
          <button
            class="text-gray-500 text-xs font-medium flex items-center gap-0.5 hover:text-gray-700 transition-colors"
            @click.stop="emit('view-details')"
          >
            View Details
            <svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
            </svg>
          </button>
        </div>
      </template>

      <!-- ── Normal state (no counter_offer, not cancelled) ────────────────── -->
      <template v-else-if="!isCounterOffer">

        <!-- Date / time -->
        <div v-if="formattedDateTime" class="text-gray-500 text-xs leading-4">
          {{ formattedDateTime }}
        </div>

        <!-- Countdown -->
        <div class="flex items-center gap-1.5">
          <span
            class="w-2 h-2 rounded-full shrink-0"
            :class="isExpired ? 'bg-gray-400' : isLive ? 'bg-green-500' : 'bg-red-500'"
          ></span>
          <span
            class="text-xs font-medium"
            :class="isExpired ? 'text-gray-400' : isLive ? 'text-green-600' : 'text-red-500'"
          >{{ countdownText }}</span>
        </div>

        <!-- Action buttons -->
        <div class="flex items-center gap-2 mt-1">
          <a
            v-if="sessionLink"
            :href="isExpired ? undefined : sessionLink"
            :target="isExpired ? undefined : '_blank'"
            rel="noopener noreferrer"
            class="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold text-white transition-colors"
            :class="isExpired
              ? 'bg-gray-300 cursor-not-allowed pointer-events-none opacity-60'
              : 'bg-[#4F46E5] hover:bg-[#4338CA] cursor-pointer'"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z"
              />
            </svg>
            Join Call
          </a>
          <button
            class="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border text-gray-300 border-gray-200 pointer-events-none cursor-default"
          >
            <span>···</span>
            Other Options
          </button>
        </div>
      </template>

      <!-- ── Counter offer state ────────────────────────────────────────────── -->
      <template v-else-if="isCounterOffer">

        <!-- Original time (gray) -->
        <div v-if="formattedDateTime" class="text-gray-400 text-xs leading-4 line-through">
          {{ formattedDateTime }}
        </div>

        <!-- Proposed new time (indigo) -->
        <div v-if="formattedProposedDateTime" class="text-[#4F46E5] text-xs font-medium leading-4">
          {{ formattedProposedDateTime }}
        </div>

        <!-- View detail link -->
        <button
          class="text-[#4F46E5] text-xs font-medium underline text-left w-fit"
          @click.stop="emit('view-details')"
        >
          View detail ›
        </button>

        <!-- Accept / Reject — shown to fan -->
        <div v-if="!isCreator" class="flex items-center gap-2 mt-1">
          <button
            class="flex-1 py-1.5 rounded-md text-xs font-semibold text-[#059669] border border-[#059669] hover:bg-emerald-50 transition-colors"
            @click.stop="emit('accept-counter')"
          >
            Accept New Time
          </button>
          <button
            class="flex-1 py-1.5 rounded-md text-xs font-semibold text-red-500 border border-red-400 hover:bg-red-50 transition-colors"
            @click.stop="emit('reject-counter')"
          >
            Reject
          </button>
        </div>

        <!-- Creator view — pending message -->
        <div v-else class="text-gray-400 text-xs italic mt-0.5">
          Waiting for fan to respond…
        </div>

      </template>
    </div>

    <!-- Dropdown menu (creator + normal state only) -->
    <Transition name="dropdown">
      <div
        v-if="showDropdown && isCreator"
        class="absolute right-2 top-2 z-50 min-w-[180px] bg-white rounded-lg shadow-lg border border-gray-100 py-1"
      >
        <button
          class="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors text-left"
          @click.stop="emit('ask-more-time'); closeDropdown()"
        >
          <svg class="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Ask for more time
        </button>
        <button
          class="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition-colors text-left"
          @click.stop="emit('reschedule'); closeDropdown()"
        >
          <svg class="w-4 h-4 text-gray-500 shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"/>
          </svg>
          Ask to reschedule
        </button>
        <button
          class="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 transition-colors text-left"
          @click.stop="emit('cancel'); closeDropdown()"
        >
          <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z"
            />
          </svg>
          Cancel Call
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { hktDateTimeToLocalDate } from '@/services/events/eventsApiUtils.js'

const props = defineProps({
  message:   { type: Object,  required: true },
  booking:   { type: Object,  default: null },
  isCreator: { type: Boolean, default: false },
})

const emit = defineEmits(['ask-more-time', 'reschedule', 'cancel', 'accept-counter', 'reject-counter', 'view-details'])

const content = computed(() => props.message?.content || {})

const eventName    = computed(() => content.value.event_name   || 'Upcoming Session')
const sessionLink  = computed(() => content.value.session_link || null)
const isCounterOffer = computed(() => content.value.action === 'counter_offer')
const isCancelled    = computed(() => {
  if (['cancelled', 'declined'].includes(content.value.action)) return true
  const status = String(props.booking?.status || '').toLowerCase()
  return status.startsWith('cancel') || status === 'rejected' || status === 'declined'
})
const isAccepted     = computed(() => content.value.action === 'accepted')
const startDateIso = computed(() => props.booking?.startIso || props.booking?.startAtIso || content.value.start_at || content.value.slot_date)
// ── Dropdown ──────────────────────────────────────────────────────────────────
const showDropdown = ref(false)

function toggleDropdown() { showDropdown.value = !showDropdown.value }
function closeDropdown()  { showDropdown.value = false }

function onDocClick() { closeDropdown() }
onMounted(()   => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))

// ── Countdown clock ───────────────────────────────────────────────────────────
const now   = ref(Date.now())
let _ticker = null
onMounted(()   => { _ticker = setInterval(() => { now.value = Date.now() }, 1000) })
onUnmounted(() => clearInterval(_ticker))

function parseStartMs() {
  return parseHkt(startDateIso.value)?.getTime() ?? null
}

function parseEndMs() {
  return (parseDate(props.booking?.endIso || props.booking?.endAtIso) ?? parseHkt(content.value.end_at))?.getTime() ?? null
}

const isLive = computed(() => {
  const startMs = parseStartMs()
  const endMs   = parseEndMs()
  return startMs ? now.value >= startMs && (!endMs || now.value <= endMs) : false
})

const isExpired = computed(() => {
  const endMs = parseEndMs()
  return endMs ? now.value > endMs : false
})

const countdownText = computed(() => {
  if (isLive.value) return 'Live now'
  const startMs = parseStartMs()
  if (!startMs) return '—'
  const diff = startMs - now.value
  if (diff <= 0) return 'Session expired'
  const totalSec = Math.floor(diff / 1000)
  const mins     = Math.floor(totalSec / 60)
  const secs     = totalSec % 60
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60)
    return `in ${hrs}h ${mins % 60}m`
  }
  return mins > 0 ? `in ${mins}m ${String(secs).padStart(2, '0')}s` : `in ${secs}s`
})

// ── Date/time helpers (same pattern as BookingRequestBubble) ──────────────────
function parseDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return isNaN(d.getTime()) ? null : d
}

// Treat a naive HKT ISO string as HKT and return the correct local Date
function parseHkt(iso) {
  if (!iso) return null
  const d = hktDateTimeToLocalDate(iso.slice(0, 10), iso.slice(11, 16))
  return d ?? parseDate(iso)
}

function fmtTime(d) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
}

function fmtDateTimeRange(start, end) {
  if (!start) return null
  const datePart = start.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  return end
    ? `${datePart} ${fmtTime(start)}–${fmtTime(end)}`
    : `${datePart} ${fmtTime(start)}`
}

// Original scheduled time — prefer booking ISO fields (offset-aware), fall back to HKT-converted content
const formattedDateTime = computed(() => {
  const start = parseDate(props.booking?.startIso || props.booking?.startAtIso) ?? parseHkt(content.value.start_at)
  const end   = parseDate(props.booking?.endIso   || props.booking?.endAtIso)   ?? parseHkt(content.value.end_at)
  return fmtDateTimeRange(start, end)
})

// Proposed new time from counter_offer — duration derived from booking prop
const formattedProposedDateTime = computed(() => {
  const proposed  = parseHkt(content.value.slot_date || content.value?.meta?.newSlotDate)
  if (!proposed) return null
  const origStart = parseDate(props.booking?.startIso || props.booking?.startAtIso) ?? parseHkt(content.value.start_at)
  const origEnd   = parseDate(props.booking?.endIso   || props.booking?.endAtIso)   ?? parseHkt(content.value.end_at)
  const durMs     = origStart && origEnd ? origEnd.getTime() - origStart.getTime() : null
  const end       = durMs ? new Date(proposed.getTime() + durMs) : null
  return fmtDateTimeRange(proposed, end)
})
</script>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active { transition: opacity 0.1s ease, transform 0.1s ease; }
.dropdown-enter-from,
.dropdown-leave-to    { opacity: 0; transform: scale(0.95) translateY(-4px); }
</style>
