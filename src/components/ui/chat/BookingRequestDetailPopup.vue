<template>
  <Teleport to="body">
    <!-- Backdrop -->
    <div
      class="fixed inset-0 z-[10001] flex items-center justify-center p-4"
      data-fs-chat-popup
      @click.self="!loading && $emit('close')"
    >
      <div class="absolute inset-0 bg-black/40" @click="!loading && $emit('close')" />

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
              <!-- {{ currentAction }}
              {{ isCreator ? 'creator' : 'fan' }} -->
              <div v-if=" currentAction != 'declined' && currentAction != 'cancelled'" class="flex items-center gap-2 shrink-0">
                <!-- Status hint -->
                <div v-if="statusHint" class="flex items-center gap-1">
                  <div class="w-1.5 h-1.5 rounded-full" :style="{ backgroundColor: statusDotColor }" />
                  <div class="text-gray-500 text-xs font-medium font-['Poppins'] leading-4">{{ statusHint }}</div>
                </div>

                <!-- Join call button -->
                <button
                  v-if="showJoinButton"
                  type="button"
                  class="px-2 py-[3px] rounded flex items-center gap-1 cursor-pointer bg-[#5549FF]"
                  @click="handleJoin"
                >
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10.9998 1L8.66645 3.33333M8.66645 3.33333L10.9998 5.66667M8.66645 3.33333H13.9998M6.8178 8.24205C6.01675 7.44099 5.38422 6.53523 4.92022 5.56882C4.88031 5.48569 4.86036 5.44413 4.84503 5.39154C4.79054 5.20463 4.82968 4.97513 4.94302 4.81684C4.97491 4.7723 5.01302 4.7342 5.08923 4.65799C5.3223 4.42492 5.43883 4.30838 5.51502 4.1912C5.80235 3.74927 5.80235 3.17955 5.51502 2.73762C5.43883 2.62044 5.3223 2.5039 5.08923 2.27083L4.95931 2.14092C4.60502 1.78662 4.42787 1.60947 4.23762 1.51324C3.85924 1.32186 3.4124 1.32186 3.03402 1.51324C2.84377 1.60947 2.66662 1.78662 2.31233 2.14092L2.20724 2.24601C1.85416 2.59909 1.67762 2.77563 1.54278 3.01565C1.39317 3.28199 1.2856 3.69565 1.2865 4.00113C1.28732 4.27643 1.34073 4.46458 1.44753 4.84087C2.02151 6.86314 3.10449 8.77138 4.69648 10.3634C6.28847 11.9554 8.19671 13.0383 10.219 13.6123C10.5953 13.7191 10.7834 13.7725 11.0587 13.7733C11.3642 13.7743 11.7779 13.6667 12.0442 13.5171C12.2842 13.3822 12.4608 13.2057 12.8138 12.8526L12.9189 12.7475C13.2732 12.3932 13.4504 12.2161 13.5466 12.0258C13.738 11.6474 13.738 11.2006 13.5466 10.8222C13.4504 10.632 13.2732 10.4548 12.9189 10.1005L12.789 9.97062C12.5559 9.73755 12.4394 9.62101 12.3222 9.54482C11.8803 9.25749 11.3106 9.2575 10.8687 9.54482C10.7515 9.62102 10.6349 9.73755 10.4019 9.97062C10.3257 10.0468 10.2875 10.0849 10.243 10.1168C10.0847 10.2302 9.85521 10.2693 9.66831 10.2148C9.61572 10.1995 9.57415 10.1795 9.49103 10.1396C8.52461 9.67562 7.61885 9.0431 6.8178 8.24205Z" stroke="white" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span class="text-white text-xs font-semibold font-['Poppins'] leading-4">Join call</span>
                </button>

                <!-- 3-dot menu -->
                <div v-if="isCreator" class="relative">
                  <button
                    type="button"
                    class="inline-flex h-8 w-8 items-center justify-center rounded hover:bg-gray-200/80"
                    :aria-expanded="menuOpen"
                    @click.stop="toggleMenu"
                  >
                    <svg width="4" height="12" viewBox="0 0 4 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2.00004 6.6665C2.36823 6.6665 2.66671 6.36803 2.66671 5.99984C2.66671 5.63165 2.36823 5.33317 2.00004 5.33317C1.63185 5.33317 1.33337 5.63165 1.33337 5.99984C1.33337 6.36803 1.63185 6.6665 2.00004 6.6665Z" stroke="#98A2B3" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M2.00004 1.99984C2.36823 1.99984 2.66671 1.70136 2.66671 1.33317C2.66671 0.964981 2.36823 0.666504 2.00004 0.666504C1.63185 0.666504 1.33337 0.964981 1.33337 1.33317C1.33337 1.70136 1.63185 1.99984 2.00004 1.99984Z" stroke="#98A2B3" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M2.00004 11.3332C2.36823 11.3332 2.66671 11.0347 2.66671 10.6665C2.66671 10.2983 2.36823 9.99984 2.00004 9.99984C1.63185 9.99984 1.33337 10.2983 1.33337 10.6665C1.33337 11.0347 1.63185 11.3332 2.00004 11.3332Z" stroke="#98A2B3" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>

                  <div
                    v-if="menuOpen"
                    class="absolute right-0 top-9 z-[1200] w-[14rem] rounded-[0.375rem] border border-[#EAECF0] bg-white shadow-[0_10px_20px_rgba(0,0,0,0.15)] overflow-hidden"
                    @click.stop
                  >
                    <button
                      v-if=" currentAction == 'accepted'"
                      type="button"
                      class="w-full flex items-center gap-2 px-3 py-3 text-left text-[0.8rem] font-semibold text-[#344054] hover:bg-[#F9FAFB]"
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
                      v-if="currentAction == 'accepted'"
                      type="button"
                      class="w-full flex items-center gap-2 px-3 py-3 text-left text-[0.8rem] font-semibold text-[#344054] border-t border-[#EAECF0] hover:bg-[#F9FAFB]"
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
              </div>
            </div>

            <!-- Loading -->
            <div v-if="fetchLoading" class="w-full flex justify-center py-6">
              <div class="w-6 h-6 border-2 border-[#5549FF] border-t-transparent rounded-full animate-spin" />
            </div>

            <!-- Error -->
            <div v-else-if="!fetchLoading && fetchError" class="text-red-500 text-sm">
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
            <div v-if="!fetchLoading && isCreator && currentAction === 'pending'" class="w-full flex items-center flex-wrap gap-x-2 gap-y-3 pt-3">
              <button
                type="button"
                :disabled="loading"
                class="px-3 py-2 rounded shadow-sm text-sm font-semibold text-gray-950 bg-[#07F468] hover:opacity-90 transition-opacity disabled:opacity-50 tracking-wide uppercase"
                @click="$emit('accept')"
              >
                {{ loading ? 'Saving...' : 'ACCEPT' }}
              </button>
              <button
                type="button"
                :disabled="loading"
                class="px-3 py-2 rounded text-sm font-semibold text-[#EE3400] bg-white border border-[#EE3400] hover:bg-[#fff5f2] transition-colors disabled:opacity-50 tracking-wide uppercase shadow-sm"
                @click="$emit('decline')"
              >
                {{ loading ? 'Saving...' : 'DECLINE' }}
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

            <!-- Counter offer: fan actions — adjust type (cost change) -->
            <div v-else-if="!fetchLoading && !isCreator && currentAction === 'counter_offer' && (!activeOfferType || activeOfferType === 'adjust')" class="w-full flex items-center flex-wrap gap-x-2 gap-y-3 pt-3">
              <button
                type="button"
                :disabled="loading"
                class="px-3 py-2 rounded shadow-sm text-sm font-semibold text-gray-950 bg-[#07F468] hover:opacity-90 transition-opacity disabled:opacity-50 tracking-wide uppercase"
                @click="$emit('confirm-counter')"
              >
                {{ loading ? 'Accepting...' : 'ACCEPT NEW Changes' }}
              </button>
              <button
                type="button"
                :disabled="loading"
                class="px-3 py-2 rounded text-sm font-semibold text-[#EE3400] bg-white border border-[#EE3400] hover:bg-[#fff5f2] transition-colors disabled:opacity-50 tracking-wide uppercase shadow-sm"
                @click="$emit('cancel-booking')"
              >
                {{ loading ? 'Cancelling...' : 'CANCEL BOOKING' }}
              </button>
            </div>

            <!-- Counter offer: fan actions — moretime / reschedule type -->
            <div v-else-if="!fetchLoading && !isCreator && currentAction === 'counter_offer' && (activeOfferType === 'moretime' || activeOfferType === 'reschedule')" class="w-full flex items-center flex-wrap gap-x-2 gap-y-3 pt-3">
              <button
                type="button"
                :disabled="loading"
                class="px-3 py-2 rounded shadow-sm text-sm font-semibold text-gray-950 bg-[#07F468] hover:opacity-90 transition-opacity disabled:opacity-50 tracking-wide uppercase"
                @click="$emit('accept-counter')"
              >
                {{ loading ? 'Accepting...' : 'ACCEPT NEW TIME' }}
              </button>
              <button
                type="button"
                :disabled="loading"
                class="px-3 py-2 rounded text-sm font-semibold text-[#EE3400] bg-white border border-[#EE3400] hover:bg-[#fff5f2] transition-colors disabled:opacity-50 tracking-wide uppercase shadow-sm"
                @click="$emit('reject-counter')"
              >
                {{ loading ? 'Rejecting...' : 'REJECT' }}
              </button>
            </div>

            <!-- Creator + counter_offer: waiting -->
            <div v-else-if="!fetchLoading && (isCreator && currentAction === 'counter_offer') || ( !isCreator && currentAction === 'pending')" class="pt-1">
              <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold bg-gray-100 text-gray-500">
                <img :src="HourglassIcon" class="w-4 h-4" alt="" />
                Waiting for fan response
              </div>
            </div>

            <!-- Accepted / declined cancelled_creator(cancelled) badge -->
            <div v-else-if="!fetchLoading && (currentAction === 'accepted' || currentAction === 'cancelled' || currentAction === 'declined' || currentAction.startsWith('cancel'))" class="pt-1">
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
                {{ currentAction === 'accepted' ? 'Accepted' : currentAction.startsWith('cancel') ? 'Cancelled' : 'Declined' }}
              </div>
            </div>
            <!-- {{ currentAction }} -->

          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import FlowHandler from '@/services/flow-system/FlowHandler'
import { useChatStore } from '@/stores/useChatStore'
import { getBookingJoinState } from '@/utils/bookingJoinUtils.js'
import { showToast }           from '@/utils/toastBus.js'
import MessageTextIconBlue from '@/assets/images/icons/messageblue.webp'
import ArrowRightIcon     from '@/assets/images/icons/arrow-up-right.webp'
import EditIcon           from '@/assets/images/icons/edit-05.webp'
import HourglassIcon      from '@/assets/images/icons/hourglass-03.webp'
import { localDateTimeToHkt, hktDateTimeToLocalDate } from "@/services/events/eventsApiUtils.js";

const chatStore = useChatStore()

const props = defineProps({
  message:       { type: Object, required: true },
  booking:       { type: Object, default: null },
  event:         { type: Object, default: null },
  isCreator:     { type: Boolean, default: false },
  chatId:        { type: String, default: null },
  currentUserId: { type: [String, Number], default: null },
  loading:       { type: Boolean, default: false },
})

const emit = defineEmits(['accept', 'decline', 'adjust', 'open-chat', 'close', 'confirm-counter', 'cancel-booking', 'accept-counter', 'reject-counter', 'ask-more-time', 'ask-to-reschedule'])

// ── State ────────────────────────────────────────────────────────────────────
const fetchLoading  = ref(true)
const fetchError    = ref(null)
const booking       = ref(props.booking || null)
const menuOpen      = ref(false)

const messageContent = computed(() => props.message?.content || {})
const currentAction  = ref(messageContent.value.action || 'pending')

function deriveAction(apiStatus) {
  // console.error("deriveAction", apiStatus, messageContent.value, currentAction.value)
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
  // Don't let API-derived status override a message-set action like 'counter_offer'
  const msgAction = messageContent.value.action
  const skipOverride = msgAction && msgAction !== 'pending' && msgAction !== 'accepted'
  if (!skipOverride && derived && derived !== 'pending') {
    // console.error(`Updating status from API-derived value: ${derived}`)
    currentAction.value = derived
  }
}

// ── Fetch booking on mount ───────────────────────────────────────────────────
onMounted(async () => {
  const bookingId = messageContent.value.booking_id
  if (!bookingId) {
    fetchError.value = 'No booking ID found.'
    fetchLoading.value = false
    return
  }

  // If pre-fetched booking was passed via prop — show immediately, no spinner
  if (props.booking) {
    applyBookingData(props.booking)
    fetchLoading.value = false
    // Silently refresh in background to get latest status
    FlowHandler.run('bookings.fetchBooking', { bookingId }).then((res) => {
      if (res?.ok) applyBookingData(res.data?.item || null)
    })
    return
  }

  // No pre-fetched data — fetch with loading spinner
  const res = await FlowHandler.run('bookings.fetchBooking', { bookingId })
  fetchLoading.value = false

  if (!res?.ok) {
    fetchError.value = res?.error?.message || 'Could not load booking details.'
    return
  }

  applyBookingData(res.data?.item || null)
})

const handleDocumentClick = () => { menuOpen.value = false }
onMounted(() => document.addEventListener('click', handleDocumentClick))
onBeforeUnmount(() => document.removeEventListener('click', handleDocumentClick))

// ── Display computed ─────────────────────────────────────────────────────────
const raw = computed(() => booking.value || {})

// watch(() => booking.value., (newAction) => {
//   if (newAction) {
//     console.error("Meta changed, updating booking with new meta", { newAction, booking: booking.value })
//     booking.value = newAction
//   }
// })
// watch(() => messageContent.value, (newAction) => {
//   if (newAction) {
//     console.error("Message content changed, updating booking with new message content", { newAction, messageContent: messageContent.value })
//   }
// })
const eventTitle = computed(() =>
  raw.value.eventTitle
  || messageContent.value.event_title
  || 'Booking Request'
)

// ── Menu ──────────────────────────────────────────────────────────────────────
function toggleMenu() { menuOpen.value = !menuOpen.value }

function handleAskMoreTime() {
  menuOpen.value = false
  emit('ask-more-time')
}

function handleAskToReschedule() {
  menuOpen.value = false
  emit('ask-to-reschedule')
}

function handleCancelCall() {
  menuOpen.value = false
  emit('cancel-booking')
}

// ── Status hint ───────────────────────────────────────────────────────────────
const statusLabel = computed(() => String(raw.value.status || currentAction.value || '').toLowerCase())

const statusHint = computed(() => {
  // console.error("statusLabel", statusLabel, raw)
  const start = startDate.value
  const end   = endDate.value
  if (!start || !end) return statusLabel.value ? titleCaseFromKey(statusLabel.value) : ''
  const now     = Date.now()
  const startMs = start.getTime()
  const endMs   = end.getTime()
  if (now >= startMs && now < endMs) return 'live now'
  const msToStart = startMs - now
  if (msToStart > 0) {
    const mins = Math.ceil(msToStart / 60000)
    if (mins < 60) return `in ${mins} ${mins === 1 ? 'min' : 'mins'}`
    const hrs = Math.ceil(msToStart / 3600000)
    if (hrs < 24) return `in ${hrs} ${hrs === 1 ? 'hr' : 'hrs'}`
    const weekday = start.toLocaleDateString('en-US', { weekday: 'short' })
    const day     = start.toLocaleDateString('en-US', { day: '2-digit' })
    const month   = start.toLocaleDateString('en-US', { month: 'short' })
    const year    = start.toLocaleDateString('en-US', { year: 'numeric' })
    const time    = start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    return `${weekday} ${day} ${month} ${year} ${time}`
  }
  return statusLabel.value ? titleCaseFromKey(statusLabel.value) : ''
})

const statusDotColor = computed(() => {
  if (statusHint.value === 'live now') return '#22C55E'
  const label = statusLabel.value
  if (label === 'confirmed' || label === 'completed' || label === 'accepted') return '#22C55E'
  if (label === 'pending' || label === 'pending_hold' || label === 'counter_offer') return '#F59E0B'
  if (label.startsWith('cancel') || label === 'declined' || label === 'rejected') return '#EF4444'
  return '#6B7280'
})

// ── Join button ───────────────────────────────────────────────────────────────
const bookingIdComputed = computed(() => raw.value.bookingId || messageContent.value.booking_id || null)
const eventIdComputed   = computed(() => raw.value.eventId   || messageContent.value.event_id   || null)

const joinState = computed(() => getBookingJoinState({
  bookingId:                       bookingIdComputed.value,
  startAt:                         startDate.value,
  endAt:                           endDate.value,
  status:                          statusLabel.value,
  enableCallReminderMinutesBefore: raw.value.enableCallReminderMinutesBefore ?? raw.value.setReminders,
  callReminderMinutesBefore:       raw.value.callReminderMinutesBefore ?? raw.value.reminderMinutes,
  reminderMinutes:                 raw.value.reminderMinutes,
  extensions:                      raw.value.extensions ?? [],
}))

const showJoinButton = computed(() => joinState.value.canJoin)

function handleJoin() {
  menuOpen.value = false
  if (!joinState.value.canJoin || !joinState.value.joinUrl) {
    showToast({ type: 'error', message: 'Call is not available to join yet.' })
    return
  }
  window.open(joinState.value.joinUrl, '_blank', 'noopener,noreferrer')
}

function parseDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return isNaN(d.getTime()) ? null : d
}

function fmtTime(d) {
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()
}

// During counter_offer, read proposed values from booking.meta (written by updateMeta in each popup)
const activeOfferType = computed(() => {
  // console.error("Determining activeOfferType", { currentAction: currentAction.value, meta: raw.value.meta }, raw.value)
  if (currentAction.value !== 'counter_offer') return null
  return raw.value.meta?.currentCounterOffer || null
})
const proposedValues = computed(() =>
  activeOfferType.value ? (raw.value.meta?.[activeOfferType.value] || {}) : {}
)

const startDate = computed(() => {
  const proposed = proposedValues.value.proposedSlotDate
  // console.error("Computing startDate", { proposed, raw: raw.value, messageContent: messageContent.value })
  return parseDate(proposed || raw.value.startIso || raw.value.startAtIso || messageContent.value.slot_date)
})
const endDate = computed(() => {
  if (proposedValues.value.proposedSlotDate && startDate.value) {
    const origStart = parseDate(raw.value.startIso || raw.value.startAtIso)
    const origEnd   = parseDate(raw.value.endIso   || raw.value.endAtIso)
    if (origStart && origEnd) {
      return new Date(startDate.value.getTime() + (origEnd - origStart))
    }
  }
  return parseDate(raw.value.endIso || raw.value.endAtIso)
})

const formattedDate = computed(() => {
  if (!startDate.value) return ''
  let localDate = hktDateTimeToLocalDate( startDate.value, "12:00" );
  // console.error("Computing formattedDate", { startDate: startDate.value, localDate })
  // return localDate.toLocaleDateString('en-US', {
  //   weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
  // })
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

const guestLabel = computed(() => {
  if (raw.value.userDisplayName) return raw.value.userDisplayName
  if (raw.value.userName)        return raw.value.userName
  if (raw.value.userUsername)    return raw.value.userUsername
  const userId = raw.value.userId
  if (userId) {
    const ud = chatStore.chatUsersData[String(userId)]
    if (ud?.username || ud?.display_name) return "@"+ud.username || ud.display_name
    return `User #${userId}`
  }
  return null
})

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
  const proposedTotal = proposedValues.value.proposedTokens
  const total = Number(proposedTotal ?? payment.total ?? raw.value.paymentTotal ?? lineTotal ?? 0)
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

</script>
