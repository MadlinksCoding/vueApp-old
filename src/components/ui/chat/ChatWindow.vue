<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import FlexChat from '@/components/ui/chat/FlexChat.vue'
import BookingRequestBubble from '@/components/ui/chat/BookingRequestBubble.vue'
import LiveCallRequest      from '@/components/ui/chat/LiveCallRequest.vue'
import BookingRequestDetailPopup from '@/components/ui/chat/BookingRequestDetailPopup.vue'
import AdjustBookingPopup        from '@/components/ui/chat/AdjustBookingPopup.vue'
import MoreTimeRequestPopup      from '@/components/ui/chat/MoreTimeRequestPopup.vue'
import RescheduleRequestPopup    from '@/components/ui/chat/RescheduleRequestPopup.vue'
import CancelCallConfirmPopup    from '@/components/ui/chat/CancelCallConfirmPopup.vue'
import SpendingRequirementProductPopup from '@/components/ui/form/BookingForm/HelperComponents/SpendingRequirementProductPopup.vue'
import { useChatStore } from '@/stores/useChatStore'
import { resolveUserId } from '@/utils/resolveUserId'
import { resolveParentUserData } from '@/utils/resolveParentUserData'
import {
  buildProductSelectedPayload,
  extractProductRecommendation,
  isProductCtaDisabled,
  normalizeProductForChat,
  productActionFromCta,
  productPriceLabel,
  productRecommendationMessageKey,
  productRefreshMatchesMessage,
  productStatusCtaLabel,
  resolveChatFanUid,
} from '@/utils/chatProductRecommendation.js'
import FlowHandler from '@/services/flow-system/FlowHandler'
import { resolveAndSyncChat, isMessageReadByUser } from '@/services/chat/chatResolverUtils'
import TokenHandler from '@/utils/TokenHandler.js'
import { showToast } from '@/utils/toastBus.js'
import EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'
import pinkStarIcon from '@/assets/images/icons/star-07.svg'

const MAX_MESSAGE_LENGTH = 2000
const PRODUCT_PAGE_SIZE = 20
const PRODUCT_TYPES = ['media', 'subscription', 'product']

const props = defineProps({
  chatId:        { type: String, default: null },
  chatName:      { type: String, default: 'Chat' },
  avatar:        { type: String, default: null },
  socket:        { type: Object, default: null },
  targetUserId:  { type: [String, Number], default: null },
  targetUserIds: { type: Array, default: () => [] },
  groupType:     { type: String, default: null },
  currentUserId: { type: [String, Number], default: null },
})

const emit = defineEmits(['close', 'minimize', 'chat-created'])

const chatStore = useChatStore()
const currentUserId = props.currentUserId ? String(props.currentUserId) : resolveUserId()
const isCreatorAccount = computed(() => {
  const ud = resolveParentUserData()
  return ud?.accountType === 'creator'
    || window.userSpecifiData?.currentUser?.isCreator === true
    || localStorage.getItem('isCreator') === 'true'
})

// Resolve the other participant's username for "@name" in the booking bubble
const bookingSenderName = computed(() => {
  const participants = chatStore.chatParticipants[activeChatId.value] || []
  const otherId = participants.map(String).find(id => id !== String(currentUserId))
  if (otherId) {
    const ud = chatStore.chatUsersData[otherId]
    if (ud?.username) return ud.username
    if (ud?.display_name) return ud.display_name
  }
  return props.chatName
})

function getSenderName(message) {
  const senderId = String(message.senderId || message.sender_id || '')
  if (!senderId) return props.chatName
  
  if (senderId === String(currentUserId)) {
    return 'You'
  }
  const ud = chatStore.chatUsersData[senderId]
  return ud?.display_name || ud?.username || props.chatName
}

// ── Topup flow state (iframe → parent communication) ─────────────────────────
const _pendingTopupBookingId = ref(null)
const _pendingTopupMessage   = ref(null)

// ── Booking request popup ─────────────────────────────────────────────────────
const showBookingPopup        = ref(false)
const showAdjustPopup         = ref(false)
const showMoreTimePopup       = ref(false)
const showReschedulePopup     = ref(false)
const showCancelCallPopup     = ref(false)
const activeBookingMessage = ref(null)
const bookingActionLoading = ref(false)

// Pre-fetched booking for the active popup message (may be null until loaded)
const activeBookingData = computed(() => {
  const bookingId = activeBookingMessage.value?.content?.booking_id
  return bookingId ? chatStore.getBookingById(bookingId) : null
})

// Pre-fetched booking for the pinned banner message
const pinnedBookingData = computed(() => {
  const bookingId = pinnedBookingMessage.value?.content?.booking_id
  return bookingId ? chatStore.getBookingById(bookingId) : null
})

// Pre-fetched event for the active popup message
const activeEventData = computed(() => {
  const booking = activeBookingData.value
  const eventId = booking?.eventId ?? booking?.event_id
  return eventId ? chatStore.getEventById(eventId) : null
})

function openBookingDetail(message) {
  activeBookingMessage.value = message
  showBookingPopup.value = true
  // Refresh booking data in background when popup opens
  const bookingId = message?.content?.booking_id
  if (bookingId) {
    FlowHandler.run('bookings.fetchBooking', { bookingId }).then((res) => {
      if (res?.ok) chatStore.setBooking(bookingId, res.data?.item || null)
    })
  }
}

function openAdjustPopup(message) {
  activeBookingMessage.value = message
  showBookingPopup.value = false
  showAdjustPopup.value = true
}

// ── Activity log ──────────────────────────────────────────────────────────────
async function sendChatActivityLog(text, meta) {
  if (!activeChatId.value || !text) return
  const res = await FlowHandler.run('chat.sendChatActivityLog', {
    chatId:   activeChatId.value,
    senderId: currentUserId,
    text,
    meta,
  })
  if (res?.ok) {
    chatStore.addMessage(activeChatId.value, res.data.item)
    chatStore.updateChatLastMessage(activeChatId.value, res.data.item)
    const allParticipants = chatStore.chatParticipants[activeChatId.value] || []
    const recipients = allParticipants
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id) && id !== parseInt(currentUserId, 10))
    props.socket?.sendChatMessage(res.data.item, recipients)
  }
}

function broadcastBookingUpdate(item) {
  if (!item || !activeChatId.value) return
  // Update the message in the chat list in-place so the bubble re-renders
  chatStore.addMessage(activeChatId.value, item)
  chatStore.updateChatLastMessage(activeChatId.value, item)
  // Keep chatPinnedMessages in sync: if this is a pinnable type, update/clear accordingly
  const pinnableTypes = ['requestJoinCallNotification', 'booking_request']
  if (pinnableTypes.includes(item.content_type)) {
    if (item.is_pinned === false) {
      // Unpinned — clear stored pinned message only if it's the same message
      const current = chatStore.getPinnedMessageByChatId(activeChatId.value)
      if (current?.message_id === item.message_id) {
        chatStore.setPinnedMessage(activeChatId.value, null)
      }
    } else {
      chatStore.setPinnedMessage(activeChatId.value, item)
    }
  }
  const allParticipants = chatStore.chatParticipants[activeChatId.value] || []
  const recipients = allParticipants
    .map((id) => parseInt(id, 10))
    .filter((id) => !isNaN(id) && id !== parseInt(currentUserId, 10))
  props.socket?.sendChatMessage(item, recipients)
}

async function performBookingDecision(message, decision) {
  if (!activeChatId.value || !message) return
  const messageId = message.message_id
  const bookingId = message.content?.booking_id
  if (!bookingId || !messageId) return

  bookingActionLoading.value = true

  await FlowHandler.run('bookings.reviewPendingBooking', {
    bookingId,
    decision,
    actor: 'creator',
  })

  const newAction = decision === 'approve' ? 'accepted' : 'declined'
  const res = await FlowHandler.run('chat.updateBookingRequestMessage', {
    chatId:    activeChatId.value,
    messageId,
    action:    newAction,
  })

  bookingActionLoading.value = false
  showBookingPopup.value = false

  if (res?.ok) {
    broadcastBookingUpdate(res.data?.item)
    const eventTitle = message.content?.event_title || ''
    const logText = decision === 'approve'
      ? `Booking accepted${eventTitle ? `: ${eventTitle}` : ''}`
      : `Booking declined${eventTitle ? `: ${eventTitle}` : ''}`
    sendChatActivityLog(logText, {
      is_booking_request: true,
      decision,
      bookingId,
    })
  }
}

function onDirectAccept(message) {
  performBookingDecision(message, 'approve')
}

function onDirectDecline(message) {
  performBookingDecision(message, 'reject')
}

function onMoreTimeSubmitted({ item, booking: updatedBooking }) {
  showMoreTimePopup.value = false
  broadcastBookingUpdate(item)
  if (updatedBooking) {
    const bookingId = activeBookingMessage.value?.content?.booking_id
    if (bookingId) chatStore.setBooking(bookingId, updatedBooking)
  }
  sendChatActivityLog('More time requested', {
    is_booking_request: true,
    decision: 'more_time_request_sent',
  })
}

function onRescheduleSubmitted({ item, booking: updatedBooking }) {
  showReschedulePopup.value = false
  broadcastBookingUpdate(item)
  if (updatedBooking) {
    const bookingId = activeBookingMessage.value?.content?.booking_id
    if (bookingId) chatStore.setBooking(bookingId, updatedBooking)
  }
  sendChatActivityLog('Reschedule requested', {
    is_booking_request: true,
    decision: 'reschedule_request_sent',
  })
}

function onAdjustSubmitted({ item, booking: updatedBooking }) {
  showAdjustPopup.value = false
  broadcastBookingUpdate(item)
  if (updatedBooking) {
    const bookingId = activeBookingMessage.value?.content?.booking_id
    if (bookingId) chatStore.setBooking(bookingId, updatedBooking)
  }
  const msg = activeBookingMessage.value
  sendChatActivityLog('Counter offer sent', {
    is_booking_request: true,
    decision: 'counter_offer',
    bookingId: msg?.content?.booking_id,
  })
}

// ── counter_offer responses for requestJoinCallNotification + booking_request ──
async function onAcceptCounter(message) {
  if (!activeChatId.value || !message?.message_id) return
  bookingActionLoading.value = true
  try {
    const res = message.content_type === 'booking_request'
      ? await FlowHandler.run('chat.updateBookingRequestMessage', {
          chatId:    activeChatId.value,
          messageId: message.message_id,
          action:    'accepted',
        })
      : await FlowHandler.run('chat.updateMessage', {
          chatId:    activeChatId.value,
          messageId: message.message_id,
          updates:   { action: 'accepted' },
        })
    if (res?.ok) {
      broadcastBookingUpdate(res.data?.item)
      const bookingId = message.content?.booking_id

      // Read proposed values from booking meta (stored by popup via updateMeta)
      const cachedBooking = chatStore.getBookingById(bookingId)
      const offerType = cachedBooking?.meta?.currentCounterOffer  // 'moretime' | 'reschedule'
      const proposed  = (offerType ? cachedBooking?.meta?.[offerType] : null) || {}
      const newSlot   = proposed.proposedSlotDate

      // Call booking API now that fan has accepted
      if (bookingId && newSlot) {
        const flow = offerType === 'reschedule' ? 'bookings.rescheduleBooking' : 'bookings.renegotiateBooking'
        FlowHandler.run(flow, { bookingId, startAtIso: newSlot, actor: 'user' })
      }

      const decision = offerType === 'reschedule' ? 'reschedule_request_accepted' : 'more_time_request_accepted'
      sendChatActivityLog('New time accepted', {
        is_booking_request: true,
        decision,
        bookingId,
      })

      showBookingPopup.value = false
    }
  } finally {
    bookingActionLoading.value = false
  }
}

async function onRejectCounter(message) {
  if (!activeChatId.value || !message?.message_id) return

  const bookingId = message.content?.booking_id
  bookingActionLoading.value = true
  try {
    // Cancel the booking first
    if (bookingId) {
      const cancelRes = await FlowHandler.run('bookings.cancelBooking', {
        bookingId,
        actor: 'user',
      })
      if (!cancelRes?.ok) {
        showToast({ type: 'error', title: 'Failed', message: cancelRes?.error || 'Could not cancel booking.' })
        return
      }
    }

    const res = message.content_type === 'booking_request'
      ? await FlowHandler.run('chat.updateBookingRequestMessage', {
          chatId:    activeChatId.value,
          messageId: message.message_id,
          action:    'declined',
        })
      : await FlowHandler.run('chat.updateMessage', {
          chatId:    activeChatId.value,
          messageId: message.message_id,
          updates:   { action: 'declined' },
        })
    if (res?.ok) {
      broadcastBookingUpdate(res.data?.item)
      const cachedBooking = chatStore.getBookingById(bookingId)
      const offerType = cachedBooking?.meta?.currentCounterOffer
      const decision  = offerType === 'reschedule' ? 'reschedule_request_rejected' : 'more_time_request_rejected'
      sendChatActivityLog('New time rejected', {
        is_booking_request: true,
        decision,
        bookingId,
      })
      showBookingPopup.value = false
    }
  } finally {
    bookingActionLoading.value = false
  }
}

async function _doConfirmCounter(bookingId, message) {
  bookingActionLoading.value = true

  // console.error("Confirming counter offer for bookingId", bookingId, { message })
  // Read proposed values from booking meta (stored by AdjustBookingPopup via updateMeta)
  const cachedBooking = chatStore.getBookingById(bookingId)
  const adjustMeta    = cachedBooking?.meta?.adjust || {}
  await FlowHandler.run('bookings.renegotiateBooking', {
    bookingId,
    startAtIso:          adjustMeta.proposedSlotDate  || undefined,
    costTokens:          adjustMeta.proposedTokens    || undefined,
    personalRequestText: adjustMeta.proposedRemarks   || undefined,
    actor: 'user',
    meta: {
      currentCounterOffer: '',
    }
  })

  const res = await FlowHandler.run('bookings.reviewPendingBooking', {
    bookingId,
    decision: 'approve',
    actor:    'fan',
  })

  if (!res?.ok) {
    bookingActionLoading.value = false
    showToast({ type: 'error', title: 'Failed', message: res?.error || 'Could not confirm booking.' })
    return
  }

  // Keep cached booking fresh
  if (res.data?.item) chatStore.setBooking(bookingId, res.data.item)

  // Update the chat message action to 'accepted' (mirrors performBookingDecision)
  const messageId = message?.message_id
  const updateRes = messageId
    ? await FlowHandler.run('chat.updateBookingRequestMessage', {
        chatId:    activeChatId.value,
        messageId,
        action:    'accepted',
      })
    : null

  bookingActionLoading.value = false

  broadcastBookingUpdate(updateRes?.data?.item || message)
  sendChatActivityLog('Counter offer accepted', {
    is_booking_request: true,
    decision:           'counter_offer_accepted',
    bookingId,
  })
}

async function onConfirmCounter(message) {
  const bookingId = message?.content?.booking_id
  if (!bookingId) return

  // Resolve token amounts from booking meta (stored by AdjustBookingPopup via updateMeta)
  const cachedBooking = chatStore.getBookingById(bookingId)
  const adjustMeta    = cachedBooking?.meta?.adjust || {}
  const newTokens     = Number(cachedBooking?.payment?.total ?? adjustMeta.proposedTokens ?? 0)
  const prevTokens    = Number(adjustMeta.prevTotalTokens || message?.content?.meta?.prevTotalTokens || 0)
  const diffTokens    = Math.max(0, newTokens - prevTokens)

  // Fan already covered this amount (same or cheaper counter-offer) — confirm directly
  if (diffTokens === 0) {
    await _doConfirmCounter(bookingId, message)
    showBookingPopup.value = false
    return
  }

  // Resolve creator ID (the other participant)
  const participants = chatStore.chatParticipants[activeChatId.value] || []
  const creatorId    = participants.map(String).find(id => id !== String(currentUserId)) || null

  // Fetch fan's spendable token balance
  let userBalance = 0
  if (creatorId) {
    const balance = await TokenHandler.get({ userId: currentUserId, receiverId: creatorId })
    userBalance = typeof balance === 'number' ? balance : 0
  } else {
    const res = await TokenHandler.get({ userId: currentUserId })
    userBalance = Number(res?.data?.paidTokens ?? res?.data?.balance ?? 0)
  }

  // DEV-only: override balance via localStorage for testing topup flow
  if (import.meta.env.DEV) {
    const mock = localStorage.getItem('mockTokenBalance')
    if (mock !== null) userBalance = Number(mock)
  }

  // Fan has enough balance to cover the difference — confirm directly
  if (userBalance >= diffTokens) {
    await _doConfirmCounter(bookingId, message)
    showBookingPopup.value = false
    return
  }

  // Insufficient tokens — need topup for the difference only
  const isInIframe = window.self !== window.top
  if (!isInIframe) {
    alert('The topup checkout is not available.')
    return
  }

  // Close popup and ask parent to open the topup popup
  showBookingPopup.value = false
  _pendingTopupBookingId.value = bookingId
  _pendingTopupMessage.value   = message

  window.parent.postMessage({
    type:    'FS_CHAT_TOPUP_REQUIRED',
    payload: {
      bookingId,
      requiredTokens: diffTokens,
      currentUserId:  String(currentUserId),
      creatorUserId:  String(creatorId || ''),
      topupFor:       'booking_confirm',
    },
  }, '*')
}

async function onCancelBooking(message) {
  const content   = message?.content || {}
  const messageId = message?.message_id
  if (!content.booking_id || !messageId || !activeChatId.value) return

  const res = await FlowHandler.run('bookings.cancelBooking', {
    bookingId: content.booking_id,
    actor:     'user',
  })

  if (!res?.ok) {
    showToast({ type: 'error', title: 'Failed', message: res?.error || 'Could not cancel booking.' })
    return
  }

  const updateRes = await FlowHandler.run('chat.updateBookingRequestMessage', {
    chatId:    activeChatId.value,
    messageId,
    action:    'declined',
  })
  if (updateRes?.ok) {
    showBookingPopup.value = false
    broadcastBookingUpdate(updateRes.data?.item)
    sendChatActivityLog('Counter offer declined', {
      is_booking_request: true,
      decision:           'counter_offer_declined',
      bookingId:          content.booking_id,
    })
  }
}

function onCallCancelled(updatedItem) {
  const msg = activeBookingMessage.value
  showCancelCallPopup.value = false
  broadcastBookingUpdate(updatedItem || msg)
  sendChatActivityLog('Call cancelled', {
    is_booking_request: true,
    decision:           'call_cancelled',
    bookingId:          msg?.content?.booking_id,
  })
}

function variantForMessage(msg) {
  if (msg.content_type === 'booking_request') return 'system'
  if (msg.content_type === 'activity_log') return 'system'
  if (msg.content_type === 'product_recommendation') return 'system'
  return null
}
const ActivityLogTexts = {
  'accepted': {
    'creator': "You have just confirmed @{audience}'s booking",
    'audience': "@{creator} has just confirmed your booking",
  },
  'counter_offer_accepted': {
    'audience': "You have just confirmed @{creator}'s adjustment",
    'creator': "@{audience} has just confirmed your adjustment",
  },
  'counter_offer_declined': {
    'audience': "You have just declined @{creator}'s adjustment",
    'creator': "@{audience} has just declined your adjustment",
  },
  'declined': {
    'creator': "You have just declined @{audience}'s booking",
    'audience': "@{creator} has just declined your booking",
  },
  'counter_offer': {
    'creator': "You have adjust the cost of the booking",
    'audience': "@{creator} has adjust the cost of the booking",
  },
  'more_time_request_accepted': {
    'audience': "You have accepted @{creator}'s more time request",
    'creator': "@{audience} has accepted your more time request",
  },
  'more_time_request_rejected': {
    'audience': "You have rejected @{creator}'s more time request",
    'creator': "@{audience} has rejected your more time request",
  },
  'reschedule_request_accepted': {
    'audience': "You have accepted @{creator}'s reschedule request",
    'creator': "@{audience} has accepted your reschedule request",
  },
  'reschedule_request_rejected': {
    'audience': "You have rejected @{creator}'s reschedule request",
    'creator': "@{audience} has rejected your reschedule request",
  },
  'more_time_request_sent': {
    'creator': "You have requested more time",
    'audience': "@{creator} has requested more time",
  },
  'reschedule_request_sent': {
    'creator': "You have requested a reschedule",
    'audience': "@{creator} has requested a reschedule",
  },
  'call_cancelled': {
    'creator': "You have cancelled the call",
    'audience': "@{creator} has cancelled the call",
  },
};

function resolveActivityLogText(message) {
  const rawText   = message.content?.text || message.text || ''
  const meta      = message.content?.meta  || message.meta || {}
  const senderId  = String(message.sender_id || message.senderId || '')

  // ── Step 1: template resolution for booking activity logs ────────────────
  let workingText = rawText
  if (meta.is_booking_request) {
    const decisionMap = { approve: 'accepted', reject: 'declined', accepted: 'accepted', declined: 'declined', counter_offer: 'counter_offer', counter_offer_declined: 'counter_offer_declined', counter_offer_accepted: 'counter_offer_accepted', more_time_request_accepted: 'more_time_request_accepted', more_time_request_rejected: 'more_time_request_rejected', reschedule_request_accepted: 'reschedule_request_accepted', reschedule_request_rejected: 'reschedule_request_rejected', more_time_request_sent: 'more_time_request_sent', reschedule_request_sent: 'reschedule_request_sent', call_cancelled: 'call_cancelled' }
    const role     = isCreatorAccount.value ? 'creator' : 'audience'
    let action   = decisionMap[meta.decision] || null;
    const template = action ? ActivityLogTexts[action]?.[role] : null
    if (template) workingText = template
  }

  // ── Step 2: generic token replacer ───────────────────────────────────────
  // Resolve creator/audience token placeholders
  const participants = chatStore.chatParticipants[activeChatId.value] || []
  const otherParticipantId = participants.map(String).find(id => id !== String(currentUserId)) || ''

  const getName = (id) => {
    if (!id) return null
    const ud = chatStore.chatUsersData[String(id)]
    return ud?.username || ud?.display_name || null
  }

  const nameForOther = getName(otherParticipantId);
  const nameFormat   = nameForOther ? `@${nameForOther}` : `@${otherParticipantId}`

  workingText = workingText
    .replace('@{creator}',  nameFormat)
    .replace('@{audience}', nameFormat)
    .replace('@{current_user}', `@${getName(currentUserId)}`);

  // Replace any remaining @{digits},@digits tokens with @username or @userId
  workingText = workingText.replace(/@{?(\d+)}?/g, (match, userId) => {
    const name = getName(userId);
    return name ? `@${name}` : `@${userId}`;
  });
  console.log('Final resolved activity log text:', workingText)

  return workingText
}

const composeText     = ref('')
const loading         = ref(false)
const hasMore         = ref(true)
const isSending       = ref(false)
const activeChatId    = ref(props.chatId)
const showEmojiPicker = ref(false)
const inputRef        = ref(null)
const showProductPopup = ref(false)
const productCatalog = ref(emptyProductCatalogState())
const productStatusByKey = ref({})
const currentUserAvatar = computed(() => chatStore.chatUsersData[String(currentUserId)]?.avatar || null)
const currentUserInitial = computed(() => {
  const d = chatStore.chatUsersData[String(currentUserId)]
  return (d?.display_name || d?.username || '?').charAt(0).toUpperCase()
})

function emptyProductCatalogTab() {
  return {
    items: [],
    loading: false,
    error: '',
    hasMore: true,
    totalCount: null,
    offset: 0,
    count: PRODUCT_PAGE_SIZE,
    initialized: false,
  }
}

function emptyProductCatalogState() {
  return {
    media: emptyProductCatalogTab(),
    subscription: emptyProductCatalogTab(),
    product: emptyProductCatalogTab(),
  }
}

function normalizeCatalogProduct(item = {}) {
  const product = normalizeProductForChat(item)
  if (!product) return null
  return {
    id: product.id,
    type: product.type,
    title: product.title,
    buyPrice: product.buyPrice,
    subscribePrice: product.subscribePrice,
    thumbnailUrl: product.thumbnailUrl,
    tags: product.tags,
    raw: item.raw && typeof item.raw === 'object' ? item.raw : item,
  }
}

function normalizeCatalogTab(tab = {}) {
  return {
    items: Array.isArray(tab.items) ? tab.items.map(normalizeCatalogProduct).filter(Boolean) : [],
    loading: Boolean(tab.loading),
    error: String(tab.error || ''),
    hasMore: tab.hasMore !== false,
    totalCount: Number.isFinite(Number(tab.totalCount)) ? Number(tab.totalCount) : null,
    offset: Math.max(0, Number.isFinite(Number(tab.offset)) ? Number(tab.offset) : 0),
    count: Math.max(1, Number.isFinite(Number(tab.count)) ? Number(tab.count) : PRODUCT_PAGE_SIZE),
    initialized: Boolean(tab.initialized),
  }
}

function normalizeProductCatalog(value = {}) {
  return {
    media: normalizeCatalogTab(value.media),
    subscription: normalizeCatalogTab(value.subscription),
    product: normalizeCatalogTab(value.product),
  }
}

const productPopupItems = computed(() => [
  ...(productCatalog.value.media?.items || []),
  ...(productCatalog.value.subscription?.items || []),
  ...(productCatalog.value.product?.items || []),
])

const productLoadingByType = computed(() => ({
  media: Boolean(productCatalog.value.media?.loading),
  subscription: Boolean(productCatalog.value.subscription?.loading),
  product: Boolean(productCatalog.value.product?.loading),
}))

const productHasMoreByType = computed(() => ({
  media: Boolean(productCatalog.value.media?.hasMore),
  subscription: Boolean(productCatalog.value.subscription?.hasMore),
  product: Boolean(productCatalog.value.product?.hasMore),
}))

const productErrorByType = computed(() => ({
  media: String(productCatalog.value.media?.error || ''),
  subscription: String(productCatalog.value.subscription?.error || ''),
  product: String(productCatalog.value.product?.error || ''),
}))

function resolveCreatorIdForProducts() {
  const ud = resolveParentUserData()
  if (isCreatorAccount.value) return ud?.userID ?? currentUserId

  const participants = chatStore.chatParticipants[activeChatId.value] || []
  return participants.map(String).find(id => id !== String(currentUserId)) || props.targetUserId || null
}

function setProductCatalogTab(type, nextState = {}) {
  const safeType = String(type || '').toLowerCase()
  if (!PRODUCT_TYPES.includes(safeType)) return
  const current = normalizeProductCatalog(productCatalog.value || {})
  current[safeType] = normalizeCatalogTab({
    ...current[safeType],
    ...nextState,
  })
  productCatalog.value = current
}

function mergeProductCatalogItems(existing = [], incoming = []) {
  const map = new Map()
  ;[...existing, ...incoming].forEach((item) => {
    const normalized = normalizeCatalogProduct(item)
    if (!normalized) return
    map.set(`${normalized.type}:${normalized.id}`, normalized)
  })
  return Array.from(map.values())
}

async function fetchProductCatalogTab(type, { append = false } = {}) {
  const safeType = String(type || '').toLowerCase()
  if (!PRODUCT_TYPES.includes(safeType)) return

  const currentTab = normalizeCatalogTab(productCatalog.value?.[safeType] || {})
  if (currentTab.loading) return
  if (append && !currentTab.hasMore) return

  const creatorId = resolveCreatorIdForProducts()
  if (!creatorId) {
    setProductCatalogTab(safeType, {
      loading: false,
      error: 'Creator catalog is not available for this chat.',
      initialized: true,
      hasMore: false,
    })
    return
  }

  setProductCatalogTab(safeType, { loading: true, error: '' })

  const result = await FlowHandler.run('events.fetchSpendingRequirementItems', {
    creatorId,
    type: safeType,
    count: currentTab.count || PRODUCT_PAGE_SIZE,
    offset: append ? currentTab.offset : 0,
  }, {
    forceRefresh: true,
    skipDestinationRead: true,
  })

  if (!result?.ok) {
    setProductCatalogTab(safeType, {
      loading: false,
      error: result?.meta?.uiErrors?.[0] || result?.error?.message || 'Could not load products.',
      initialized: true,
    })
    return
  }

  const data = result.data || {}
  const nextItems = Array.isArray(data.items) ? data.items.map(normalizeCatalogProduct).filter(Boolean) : []
  const mergedItems = append ? mergeProductCatalogItems(currentTab.items, nextItems) : nextItems
  setProductCatalogTab(safeType, {
    loading: false,
    error: '',
    initialized: true,
    items: mergedItems,
    offset: Number.isFinite(Number(data.nextOffset)) ? Number(data.nextOffset) : mergedItems.length,
    count: Number.isFinite(Number(data.count)) ? Number(data.count) : currentTab.count,
    totalCount: Number.isFinite(Number(data.totalCount)) ? Number(data.totalCount) : null,
    hasMore: data.hasMore !== false,
  })
}

function ensureProductCatalogTabLoaded(type) {
  const safeType = String(type || '').toLowerCase()
  if (!PRODUCT_TYPES.includes(safeType)) return
  const tab = normalizeCatalogTab(productCatalog.value?.[safeType] || {})
  if (tab.initialized && tab.items.length > 0) return
  fetchProductCatalogTab(safeType, { append: false })
}

function openProductPopup() {
  if (!isCreatorAccount.value) return
  showEmojiPicker.value = false
  showProductPopup.value = true
  ensureProductCatalogTabLoaded('media')
}

function handleProductPopupTabChange(type) {
  ensureProductCatalogTabLoaded(type)
}

function handleProductPopupLoadMore(type) {
  fetchProductCatalogTab(type, { append: true })
}

function getMessageRecipients() {
  const participants = chatStore.chatParticipants[activeChatId.value] || []
  const recipients = participants
    .map((id) => parseInt(id, 10))
    .filter((id) => !Number.isNaN(id) && id !== parseInt(currentUserId, 10))
  return recipients
}

async function ensureActiveChat() {
  if (activeChatId.value) return true

  const isGroup = props.targetUserIds && props.targetUserIds.length > 0
  const createRes = isGroup
    ? await FlowHandler.run('chat.createGroupChat', {
        type:         props.groupType,
        createdBy:    String(currentUserId),
        participants: [String(currentUserId), ...props.targetUserIds],
        name:         props.chatName,
      })
    : await FlowHandler.run('chat.createChat', {
        type:         'direct',
        createdBy:    String(currentUserId),
        participants: [String(currentUserId), String(props.targetUserId)],
        name:         props.chatName,
      })

  if (!createRes?.ok) return false
  activeChatId.value = createRes.data.chatId
  emit('chat-created', createRes.data.chatId)
  resolveAndSyncChat(activeChatId.value)
  return true
}

async function onConfirmChatProducts(selectedItems = []) {
  if (!isCreatorAccount.value || isSending.value) return
  const products = Array.isArray(selectedItems)
    ? selectedItems.map((item) => normalizeProductForChat(item, { senderId: currentUserId })).filter(Boolean)
    : []
  if (products.length === 0) return

  isSending.value = true
  const hasChat = await ensureActiveChat()
  if (!hasChat) {
    showToast({ type: 'error', title: 'Product', message: 'Could not create chat for product recommendation.' })
    isSending.value = false
    return
  }

  for (const product of products) {
    const res = await FlowHandler.run('chat.sendProductRecommendation', {
      chatId: activeChatId.value,
      productData: product,
    })

    if (!res?.ok) {
      showToast({ type: 'error', title: 'Product', message: res?.error?.message || 'Could not add product to chat.' })
      continue
    }

    const item = res.data?.item
    if (!item) continue
    chatStore.updateChatLastMessage(activeChatId.value, item)
    props.socket?.sendChatMessage(item, getMessageRecipients())
  }

  isSending.value = false
}

function isOwnMessage(message) {
  return String(message?.sender_id || message?.senderId || '') === String(currentUserId)
}

function shouldFetchProductRecommendationStatus(message) {
  if (!message || message.content_type !== 'product_recommendation') return false
  if (isCreatorAccount.value || isOwnMessage(message)) return false
  return Boolean(productForMessage(message))
}

function getProductStatusKey(message) {
  return productRecommendationMessageKey(message)
}

function getProductStatusState(message) {
  const key = getProductStatusKey(message)
  return key ? productStatusByKey.value[key] || null : null
}

function setProductStatusState(message, nextState = {}) {
  const key = getProductStatusKey(message)
  if (!key) return
  productStatusByKey.value = {
    ...productStatusByKey.value,
    [key]: {
      ...(productStatusByKey.value[key] || {}),
      ...nextState,
    },
  }
}

async function fetchProductRecommendationStatus(message, { force = false } = {}) {
  if (!shouldFetchProductRecommendationStatus(message)) return

  const product = productForMessage(message)
  const current = getProductStatusState(message)
  if (!product || current?.loading) return
  if (!force && current?.loaded) return

  const fanUid = resolveChatFanUid()
  if (!fanUid) {
    setProductStatusState(message, {
      loading: false,
      loaded: true,
      error: 'Fan access could not be checked.',
      cta: 'retry',
      detail: null,
    })
    return
  }

  setProductStatusState(message, {
    loading: true,
    loaded: false,
    error: '',
    cta: 'loading',
  })

  const result = await FlowHandler.run('chat.fetchProductRecommendationStatus', {
    product,
    fanUid,
  }, {
    forceRefresh: true,
    skipDestinationRead: true,
  })

  if (!result?.ok) {
    setProductStatusState(message, {
      loading: false,
      loaded: true,
      error: result?.meta?.uiErrors?.[0] || result?.error?.message || 'Product access could not be checked.',
      cta: 'retry',
      detail: null,
    })
    return
  }

  setProductStatusState(message, {
    ...result.data,
    loading: false,
    loaded: true,
    error: '',
  })
}

function productCardStatus(message) {
  const state = getProductStatusState(message)
  if (state) return state
  if (shouldFetchProductRecommendationStatus(message)) return { loading: true, cta: 'loading' }
  return null
}

function productCardCta(message) {
  return productCardStatus(message)?.cta || ''
}

function productCardCtaLabel(message) {
  return productStatusCtaLabel(productCardStatus(message) || { cta: productCardCta(message) })
}

function productCardCtaDisabled(message) {
  return isProductCtaDisabled(productCardCta(message))
}

function shouldShowProductCardCta(message) {
  return shouldFetchProductRecommendationStatus(message) || Boolean(getProductStatusState(message))
}

function onProductShellClick(message) {
  if (shouldShowProductCardCta(message)) return
  onProductCardClick(message)
}

async function onProductCtaClick(message) {
  const cta = productCardCta(message)
  if (cta === 'retry') {
    await fetchProductRecommendationStatus(message, { force: true })
    return
  }
  if (productCardCtaDisabled(message)) return
  const action = productActionFromCta(cta)
  if (!action) return
  onProductCardClick(message, { action })
}

function onProductCardClick(message, { action = '' } = {}) {
  const product = extractProductRecommendation(message)
  if (!product) return
  if (window.self === window.top && !window.parent) return

  const status = productCardStatus(message) || {}
  const payload = buildProductSelectedPayload({
    message,
    chatId: activeChatId.value,
    product,
    status,
    action,
  })
  if (!payload) return

  const parentMessage = {
    type: 'FS_CHAT_PRODUCT_SELECTED',
    payload,
  }

  try {
    if (typeof structuredClone === 'function') structuredClone(parentMessage)
    window.parent.postMessage(parentMessage, '*')
  } catch (error) {
    console.error('[ChatWindow] Product recommendation payload could not be posted', error)
    showToast({ type: 'error', title: 'Product', message: 'Product details could not be sent.' })
  }
}

function productForMessage(message) {
  return extractProductRecommendation(message)
}

async function refreshProductRecommendationMessages(payload = {}) {
  const targetMessages = messages.value.filter((message) =>
    message.content_type === 'product_recommendation' && productRefreshMatchesMessage(message, payload)
  )
  await Promise.all(targetMessages.map((message) =>
    fetchProductRecommendationStatus(message, { force: true })
  ))
}

// Returns true only when every non-sender participant has a read receipt
function allParticipantsRead(msg) {
  const participants = chatStore.chatParticipants[activeChatId.value] || []
  const others = participants.map(String).filter(id => id !== String(currentUserId))
  if (others.length === 0) return false
  const receipts = Array.isArray(msg.read_receipts) ? msg.read_receipts : []
  const readerIds = new Set(receipts.map(r => String(r.user_id || r.userId || '')))
  return others.every(id => readerIds.has(id))
}

// Readers of a message — returns array of { id, avatar, initial } for all non-current-user readers
function getMessageReaders(msg) {
  const receipts = msg.read_receipts
  if (!receipts) return []

  let readerIds = []
  if (Array.isArray(receipts)) {
    readerIds = receipts
      .map(r => String(r.user_id || r.userId || ''))
      .filter(id => id && id !== String(currentUserId))
  } else if (typeof receipts === 'object') {
    readerIds = Object.keys(receipts).filter(id => id !== String(currentUserId))
  }

  return readerIds.map(id => {
    const d = chatStore.chatUsersData[id]
    return {
      id,
      avatar: d?.avatar || null,
      initial: (d?.display_name || d?.username || '?').charAt(0).toUpperCase(),
    }
  })
}

const allMessages = computed(() => activeChatId.value ? chatStore.getMessagesByChatId(activeChatId.value) : [])

// Exclude from scroll list while pinned — show in banner instead.
// booking_request: excluded only while still pinned (is_pinned !== false); once unpinned it appears in chat.
// requestJoinCallNotification: always in banner only.
const messages = computed(() => allMessages.value.filter(m => {
  if (m.content_type === 'requestJoinCallNotification') return false
  if (m.content_type === 'booking_request' && m.is_pinned !== false) return false
  return true
}))

const productRecommendationStatusWatchKey = computed(() =>
  messages.value
    .filter((message) => message.content_type === 'product_recommendation' && shouldFetchProductRecommendationStatus(message))
    .map((message) => {
      const product = productForMessage(message)
      return `${getProductStatusKey(message)}:${product?.productId || ''}`
    })
    .join('|')
)

watch(productRecommendationStatusWatchKey, () => {
  messages.value
    .filter((message) => message.content_type === 'product_recommendation')
    .forEach((message) => fetchProductRecommendationStatus(message))
}, { immediate: true })

// The pinned banner message — requestJoinCallNotification takes priority over booking_request.
// First checks store's chatPinnedMessages (populated from getChat API, available immediately on open).
// Falls back to scanning loaded messages (populated as messages stream in).
// booking_request messages with is_pinned === false (explicitly unpinned) are excluded.
const pinnedBookingMessage = computed(() => {
  const chatId = activeChatId.value
  // Prefer the pre-fetched pinned message from getChat (available before messages load)
  const stored = chatId ? chatStore.getPinnedMessageByChatId(chatId) : null
  if (stored && stored.is_pinned !== false) return stored

  // Fallback: scan messages already in store (catches real-time pin events)
  const list = allMessages.value
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].content_type === 'requestJoinCallNotification') return list[i]
  }
  for (let i = list.length - 1; i >= 0; i--) {
    if (list[i].content_type === 'booking_request' && list[i].is_pinned !== false) return list[i]
  }
  return null
})

// ── Read receipts via IntersectionObserver ────────────────────────────────────
const flexChatRef  = ref(null)
const _markedReadIds  = new Set()
const _observedIds    = new Set()
let   _observer       = null

// Pending batch of visible messages accumulated within a single microtask tick.
// We only call markMessageRead once per batch — for the message with the highest
// message_ts — to avoid concurrent writes racing and stomping a newer timestamp
// with an older one.
let _pendingVisibleBatch = null

function _flushVisibleBatch() {
  const batch = _pendingVisibleBatch
  _pendingVisibleBatch = null
  if (!batch || batch.length === 0) return

  // Update local store and pick the entry with the highest timestamp for the API call.
  let latestEntry = null
  for (const entry of batch) {
    chatStore.updateMessageStatusAction({ chatId: activeChatId.value, messageId: entry.messageId, status: 'read' })
    chatStore.updateChatUnread(activeChatId.value, false)
    const msg = messages.value.find(m => (m.message_id || m.id) === entry.messageId)
    const ts = msg?.message_ts ?? msg?.time ?? 0
    if (!latestEntry || ts > latestEntry.ts) {
      latestEntry = { ...entry, ts }
    }
  }

  if (!latestEntry) return
  const { messageId, senderId } = latestEntry

  FlowHandler.run('chat.markMessageRead', {
    chatId: activeChatId.value,
    messageId,
    userId: currentUserId,
  }).then(res => {
    if (senderId) {
      const readReceipts = res?.data?.result?.read_receipts ?? []
      props.socket?.sendStatusUpdate(activeChatId.value, messageId, 'read', senderId, readReceipts)
    }
  })
}

function _onMessageVisible(entries) {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return
    const el        = entry.target
    const messageId = el.dataset.messageId
    const senderId  = el.dataset.senderId

    if (!messageId || _markedReadIds.has(messageId)) return
    if (String(senderId) === String(currentUserId)) return

    _markedReadIds.add(messageId)
    _observer?.unobserve(el)

    if (!_pendingVisibleBatch) {
      _pendingVisibleBatch = []
      queueMicrotask(_flushVisibleBatch)
    }
    _pendingVisibleBatch.push({ messageId, senderId })
  })
}

async function observeNewRows() {
  await nextTick()
  const root = flexChatRef.value?.bodyEl
  if (!root || !_observer) return
  root.querySelectorAll('[data-message-id]').forEach((el) => {
    const messageId = el.dataset.messageId
    const senderId  = el.dataset.senderId
    if (!messageId || _observedIds.has(messageId)) return

    // Skip own messages — they're never marked as read by us
    if (String(senderId) === String(currentUserId)) return

    // Skip messages the current user has already read (present in read_receipts)
    const msg = messages.value.find((m) => (m.message_id || m.id) === messageId)
    if (isMessageReadByUser(msg, currentUserId)) {
      _markedReadIds.add(messageId)
      return
    }

    _observedIds.add(messageId)
    _observer.observe(el)
  })
}

function messageAttrs(msg) {
  return {
    'data-message-id': msg.message_id || msg.id,
    'data-sender-id':  msg.senderId   || msg.sender_id,
  }
}

// ── Same theme as DemoChats ───────────────────────────────────────────────────
const chatTheme = {
  container:        'relative bg-[#f4f4f5] rounded-tl rounded-tr flex flex-col h-full overflow-hidden',
  header:           'bg-[#2d3142] px-3 py-2.5 shrink-0 z-10 shadow-sm relative',
  body:             'flex-1 overflow-y-auto px-4 py-2 space-y-1.5 scroll-smooth flex flex-col',
  compose:          'bg-white px-4 py-3 shrink-0',
  myMessageRow:     'flex w-full justify-end mt-1',
  otherMessageRow:  'flex w-full justify-start mt-1',
  systemMessageRow: 'flex w-full justify-center my-1',
  myBubble:         'text-white text-sm font-normal max-w-[220px] min-w-16 min-h-8 px-3 py-1.5 bg-slate-600 rounded-tl-2xl rounded-tr-2xl rounded-br-2xl shadow-sm inline-flex justify-center items-center gap-2.5',
  otherBubble:      'text-[#344054] text-sm font-normal max-w-[220px] min-w-16 min-h-8 px-3 py-1.5 bg-gray-50 rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl shadow-sm inline-flex justify-center items-center gap-2.5',
  systemBubble:     'w-full',
  metaWrapper:      'opacity-90',
  myNameMeta:       'hidden',
  myTimeMeta:       'text-[10px] text-zinc-400 font-semibold',
  otherNameMeta:    'hidden',
  otherTimeMeta:    'text-[10px] text-zinc-400 font-semibold',
  avatarWrapper:    'flex shrink-0 items-end',
  avatarImg:        'w-4 h-4 rounded-full object-cover',
  loaderWrapper:    'p-2 flex justify-center shrink-0 w-full',
}

// ── Fetch ────────────────────────────────────────────────────────────────────
async function fetchMore() {
  if (loading.value || !hasMore.value || !activeChatId.value) return
  loading.value = true
  const pagingState = chatStore.pagingStates[activeChatId.value] || null
  const res = await FlowHandler.run('chat.fetchMessages', {
    chatId: activeChatId.value,
    limit: 20,
    pagingState,
    currentUserId,
  })
  if (!res?.ok || !res.data?.pagingState) {
    hasMore.value = false
  }
  loading.value = false
}

// ── Send ─────────────────────────────────────────────────────────────────────
async function sendMessage() {
  const text = composeText.value.trim().slice(0, MAX_MESSAGE_LENGTH)
  if (!text || isSending.value) return

  isSending.value = true
  composeText.value = ''
  showEmojiPicker.value = false

  if (!(await ensureActiveChat())) {
    composeText.value = text
    isSending.value = false
    return
  }

  const tempId = 'temp-' + Date.now()
  chatStore.addMessage(activeChatId.value, {
    id: tempId,
    message_id: tempId,
    senderId: currentUserId,
    text,
    message_ts: Date.now(),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase().replace(' ', ''),
    status: 'pending',
  })

  const res = await FlowHandler.run('chat.sendMessage', {
    chatId:   activeChatId.value,
    senderId: currentUserId,
    text,
    type:     'text',
  })

  // Remove optimistic placeholder once real message arrives via addMessageAction
  const msgs = chatStore.messages[activeChatId.value]
  if (msgs) {
    chatStore.messages[activeChatId.value] = msgs.filter(
      (m) => m.id !== tempId && m.message_id !== tempId
    )
  }

  if (res?.ok) {
    chatStore.updateChatLastMessage(activeChatId.value, res.data.item)

    props.socket?.sendChatMessage(res.data.item, getMessageRecipients())
  } else {
    composeText.value = text
  }
  isSending.value = false
}

function onKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    sendMessage()
  }
}

function onEmojiSelect(emoji) {
  const char = emoji.i
  const el = inputRef.value
  if (el && el.selectionStart !== undefined) {
    const start = el.selectionStart
    const end   = el.selectionEnd
    composeText.value = composeText.value.slice(0, start) + char + composeText.value.slice(end)
    nextTick(() => {
      el.focus()
      el.setSelectionRange(start + char.length, start + char.length)
    })
  } else {
    composeText.value += char
  }
}

function onEmojiPickerOutside(e) {
  if (showEmojiPicker.value) showEmojiPicker.value = false
}

watch(() => messages.value.length, () => {
  observeNewRows()
})

// Fetch and cache booking + event details as soon as a pinned booking message is available.
// This means both are ready before the user opens the detail popup.
watch(pinnedBookingMessage, (msg) => {
  const bookingId = msg?.content?.booking_id
  if (!bookingId) return

  FlowHandler.run('bookings.fetchBooking', { bookingId }).then((res) => {
    if (!res?.ok) return
    const bookingItem = res.data?.item || null
    chatStore.setBooking(bookingId, bookingItem)

    // Fetch event once booking is loaded (event id comes from booking)
    const eventId = bookingItem?.eventId ?? bookingItem?.event_id
    if (eventId && !chatStore.getEventById(eventId)) {
      FlowHandler.run('events.fetchEvent', { eventId }).then((evRes) => {
        if (evRes?.ok) chatStore.setEvent(eventId, evRes.data?.item || null)
      })
    }
  })
}, { immediate: true })

// Mark the pinned booking message as read as soon as it becomes visible
// (it lives outside the IntersectionObserver's scrollable root)
watch(pinnedBookingMessage, async (msg) => {
  if (!msg) return
  const messageId = msg.message_id
  const senderId  = String(msg.sender_id || msg.senderId || '')
  if (!messageId) return
  if (senderId === String(currentUserId)) return   // own message
  if (_markedReadIds.has(messageId)) return        // already handled
  if (isMessageReadByUser(msg, currentUserId)) {
    _markedReadIds.add(messageId)
    return
  }

  _markedReadIds.add(messageId)
  chatStore.updateMessageStatusAction({ chatId: activeChatId.value, messageId, status: 'read' })
  chatStore.updateChatUnread(activeChatId.value, false)

  const res = await FlowHandler.run('chat.markMessageRead', {
    chatId:    activeChatId.value,
    messageId,
    userId:    currentUserId,
  })

  if (senderId) {
    const readReceipts = res?.data?.result?.read_receipts ?? []
    props.socket?.sendStatusUpdate(activeChatId.value, messageId, 'read', senderId, readReceipts)
  }
}, { immediate: true })

function _onTopupMessage(e) {
  if (!e.data || typeof e.data !== 'object') return
  if (e.data.type === 'FS_CHAT_TOPUP_SUCCESS') {
    const bookingId = _pendingTopupBookingId.value
    const message   = _pendingTopupMessage.value
    _pendingTopupBookingId.value = null
    _pendingTopupMessage.value   = null
    if (bookingId) _doConfirmCounter(bookingId, message)
  } else if (e.data.type === 'FS_CHAT_TOPUP_FAILED') {
    _pendingTopupBookingId.value = null
    _pendingTopupMessage.value   = null
    showToast({ type: 'error', title: 'Top-up failed', message: 'Booking was not confirmed.' })
  } else if (e.data.type === 'FS_CHAT_PRODUCT_REFRESH') {
    refreshProductRecommendationMessages(e.data.payload || {})
  }
}

onMounted(async () => {
  window.addEventListener('message', _onTopupMessage)

  const root = await new Promise((resolve) => {
    // Wait one tick for FlexChat to mount and expose bodyEl
    nextTick(() => resolve(flexChatRef.value?.bodyEl))
  })
  _observer = new IntersectionObserver(_onMessageVisible, {
    root: root || null,
    threshold: 0.5,
  })

  const isPending = !activeChatId.value && (props.targetUserId || props.targetUserIds?.length > 0)
  if (activeChatId.value) {
    chatStore.pagingStates[activeChatId.value] = null
    hasMore.value = true
    await fetchMore()
    observeNewRows()
  } else if (isPending) {
    hasMore.value = false
  }
})

onUnmounted(() => {
  window.removeEventListener('message', _onTopupMessage)
  _observer?.disconnect()
  _observer = null
})
</script>

<template>
  <div class="flex flex-col w-[300px] h-[480px] rounded-t-xl shadow-2xl overflow-hidden border border-zinc-200">
    <FlexChat
      ref="flexChatRef"
      :messages="messages"
      :current-user-id="currentUserId"
      :theme="chatTheme"
      :loading="loading"
      :has-more="hasMore"
      :infinite="true"
      row-key="message_id"
      :message-attrs="messageAttrs"
      :variant-for-message="variantForMessage"
      @load-more="fetchMore"
    >
      <!-- Pinned booking banner -->
      <template v-if="pinnedBookingMessage" #pinned-banner>
        <!-- Call starting soon — shown when scheduler sends requestJoinCallNotification -->
        <LiveCallRequest
          v-if="pinnedBookingMessage.content_type === 'requestJoinCallNotification'"
          :message="pinnedBookingMessage"
          :booking="pinnedBookingData"
          :is-creator="isCreatorAccount"
          @ask-more-time="activeBookingMessage = pinnedBookingMessage; showMoreTimePopup = true"
          @reschedule="activeBookingMessage = pinnedBookingMessage; showReschedulePopup = true"
          @cancel="activeBookingMessage = pinnedBookingMessage; showCancelCallPopup = true"
          @accept-counter="onAcceptCounter(pinnedBookingMessage)"
          @reject-counter="onRejectCounter(pinnedBookingMessage)"
          @view-details="openBookingDetail(pinnedBookingMessage)"
        />
        <!-- Normal booking request card -->
        <BookingRequestBubble
          v-else
          :message="pinnedBookingMessage"
          :is-creator="isCreatorAccount"
          :disabled="bookingActionLoading"
          :sender-name="bookingSenderName"
          pinned
          @view-details="openBookingDetail(pinnedBookingMessage)"
          @accept="onDirectAccept(pinnedBookingMessage)"
          @decline="onDirectDecline(pinnedBookingMessage)"
          @adjust="openAdjustPopup(pinnedBookingMessage)"
          @confirm-counter="onConfirmCounter(pinnedBookingMessage)"
          @cancel-booking="onCancelBooking(pinnedBookingMessage)"
        />
      </template>

      <!-- Header -->
      <template #header>
        <div class="flex items-center gap-2.5">
          <img v-if="avatar" :src="avatar" class="w-8 h-8 rounded-full object-cover shrink-0" alt="avatar" />
          <div v-else class="w-8 h-8 rounded-full bg-zinc-500 shrink-0 flex items-center justify-center text-white text-xs font-semibold">
            {{ chatName.charAt(0).toUpperCase() }}
          </div>

          <div class="flex-1 min-w-0">
            <div class="text-white text-sm font-semibold truncate">{{ chatName }} <span class="text-zinc-400">•••</span></div>
            <div class="flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block"></span>
              <span class="text-zinc-400 text-[10px]">online</span>
            </div>
          </div>

          <div class="flex items-center gap-3 text-zinc-400 shrink-0">
            <svg class="w-4 h-4 cursor-pointer hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M20 12H4" />
            </svg>
            <svg @click="emit('close')" class="w-4 h-4 cursor-pointer hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="square" stroke-linejoin="miter" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
      </template>

      <!-- Booking request & other system messages -->
      <template #message.system="{ message }">
        <BookingRequestBubble
          v-if="message.content_type === 'booking_request'"
          :message="message"
          :is-creator="isCreatorAccount"
          :disabled="bookingActionLoading"
          :sender-name="bookingSenderName"
          @view-details="openBookingDetail(message)"
          @accept="onDirectAccept(message)"
          @decline="onDirectDecline(message)"
          @adjust="openAdjustPopup(message)"
          @confirm-counter="onConfirmCounter(message)"
          @cancel-booking="onCancelBooking(message)"
        />
        <!-- Product Recommendation -->
        <div
          v-else-if="message.content_type === 'product_recommendation' && productForMessage(message)"
          class="w-full overflow-hidden bg-[#1A1A1A] border-l-[3px] border-[#FF0080] text-left shadow-lg transition mb-1 flex flex-col gap-2.5 p-3 bg-gradient-to-r from-pink-500/20 via-pink-500/10 to-transparent"
          :class="{ '': !shouldShowProductCardCta(message) }"
          @click.stop="onProductShellClick(message)"
        >
          <!-- Header -->
          <div class="flex items-center gap-1.5 text-[13px]">
            <div class="">
              <img :src="pinkStarIcon" alt="pink star icon">
            </div>
            <span class="text-[#FB5BA2] text-sm font-bold italic truncate">{{ getSenderName(message) }}</span>
            <span class="text-gray-300 text-sm shrink-0">shared a {{ productForMessage(message).type || 'media' }}:</span>
          </div>

          <!-- Media -->
          <div class="relative bg-black w-full">
            <video
              v-if="productForMessage(message).preview?.type === 'video' && productForMessage(message).preview?.url"
              :src="productForMessage(message).preview.url"
              :poster="productForMessage(message).preview.posterUrl || productForMessage(message).thumbnailUrl"
              class="w-full aspect-video object-cover"
              muted
              playsinline
              controls
              @click.stop
            />
            <audio
              v-else-if="productForMessage(message).preview?.type === 'audio' && productForMessage(message).preview?.url"
              :src="productForMessage(message).preview.url"
              class="w-full h-10 px-2 bg-black"
              controls
              @click.stop
            />
            <img
              v-else-if="productForMessage(message).thumbnailUrl || productForMessage(message).imageUrl"
              :src="productForMessage(message).thumbnailUrl || productForMessage(message).imageUrl"
              :alt="productForMessage(message).title"
              class="w-full aspect-video object-cover"
            />

            <div class="absolute top-1 left-1 flex px-1 py-[1px] gap-[3px] items-center justify-center bg-[rgba(24,34,48,0.50)]">
                <div class="">
                    
                </div>
                <span class="text-white text-xs">Count</span>
            </div>
          </div>

          <!-- Title -->
          <div class=" text-[14px] font-medium leading-5 text-white line-clamp-2">
            {{ productForMessage(message).title }}
          </div>

          <!-- Buttons -->
          <div class="flex items-center w-full gap-1">
            <button
              v-if="productForMessage(message).subscribePrice > 0"
              type="button"
              class="flex-1 flex items-center justify-between bg-[#F06] px-2 py-1 text-white font-semibold text-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="productCardCtaDisabled(message)"
              @click.stop="onProductCtaClick(message)"
            >
              <span>Subscribe</span>
              <span>${{ productForMessage(message).subscribePrice }}</span>
            </button>
            <button
              v-if="productForMessage(message).buyPrice > 0 || productForMessage(message).subscribePrice <= 0"
              type="button"
              class="flex-1 flex items-center justify-between bg-[#0133FB] px-2 py-1 text-white font-semibold text-xs transition disabled:opacity-50 disabled:cursor-not-allowed"
              :disabled="productCardCtaDisabled(message)"
              @click.stop="onProductCtaClick(message)"
            >
              <span>Buy</span>
              <span>${{ productForMessage(message).buyPrice > 0 ? productForMessage(message).buyPrice : productForMessage(message).price }}</span>
            </button>
          </div>

          <!-- Error Status -->
          <div
            v-if="productCardStatus(message)?.error"
            class="px-3 pb-2 text-[11px] leading-tight text-red-400"
          >
            {{ productCardStatus(message).error }}
          </div>
        </div>
        <!-- Activity log: centered italic text + divider -->
        <div v-else-if="message.content_type === 'activity_log'" class="w-full flex flex-col items-center gap-1 ">
          <span class="text-xs text-zinc-400 italic text-center">{{ resolveActivityLogText(message) }}</span>
        </div>
        <div v-else class="text-xs text-zinc-400 text-center px-2 py-1 w-full">{{ message.text }}</div>
      </template>

      <!-- Message content -->
      <template #message.content="{ message }">
        <div v-if="message.text">{{ message.text }}</div>
        <span
          v-if="(message.senderId || message.sender_id) === currentUserId"
          class="shrink-0 ml-1 inline-flex items-center"
          style="line-height:1"
        >
          <!-- pending: clock -->
          <svg v-if="message.status === 'pending'" style="width:10px;height:10px;color:#9ca3af" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="10" stroke-width="2"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6l4 2"/>
          </svg>
          <!-- sent: single check -->
          <svg v-else-if="message.status === 'sent'" style="width:10px;height:10px;color:#9ca3af" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
          </svg>
          <!-- delivered or partial read: double check (gray) -->
          <svg v-else-if="message.status === 'delivered' || (message.status === 'read' && !allParticipantsRead(message))" style="width:14px;height:10px;color:#9ca3af" fill="none" stroke="currentColor" viewBox="0 0 28 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M2 13l4 4L16 7"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 13l4 4L23 7"/>
          </svg>
          <!-- all participants read: double check (blue) -->
          <svg v-else-if="message.status === 'read' && allParticipantsRead(message)" style="width:14px;height:10px;color:#38bdf8" fill="none" stroke="currentColor" viewBox="0 0 28 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M2 13l4 4L16 7"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 13l4 4L23 7"/>
          </svg>
        </span>
      </template>

      <!-- My avatar — shows reader avatars from read_receipts -->
      <template #message.avatar.me="{ message }">
        <template v-if="message.time || message.message_ts">
          <div v-if="getMessageReaders(message).length > 0" class="flex items-center gap-0.5">
            <div
              v-for="reader in getMessageReaders(message)"
              :key="reader.id"
              class="overflow-hidden rounded-[25%_75%_50%_51%/45%_65%_36%_55%]"
            >
              <img v-if="reader.avatar" :src="reader.avatar" class="w-[16px] h-[16px] object-cover" alt="" />
              <div v-else class="w-[16px] h-[16px] bg-zinc-400 flex items-center justify-center text-white text-[7px] font-semibold">
                {{ reader.initial }}
              </div>
            </div>
          </div>
          <div v-else class="w-[16px] h-[16px]"></div>
        </template>
        <div v-else class="w-[16px] h-[16px]"></div>
      </template>

      <!-- Other avatar -->
      <template #message.avatar="{ message }">
        <img v-if="message.time && avatar" :src="avatar" class="w-[16px] h-[16px] rounded-full object-cover" />
        <div v-else-if="message.time" class="w-[16px] h-[16px] rounded-full bg-zinc-300 flex items-center justify-center text-zinc-600 text-[8px] font-semibold">
          {{ chatName.charAt(0).toUpperCase() }}
        </div>
        <div v-else class="w-[16px] h-[16px]"></div>
      </template>

      <!-- Compose -->
      <template #compose>
        <div class="relative flex items-center gap-2 my-1 w-full">
          <!-- Current user avatar -->
          <div class="shrink-0 overflow-hidden rounded-[25%_75%_50%_51%/45%_65%_36%_55%]">
            <img v-if="currentUserAvatar" :src="currentUserAvatar" class="w-7 h-7 object-cover" alt="" />
            <div v-else class="w-7 h-7 bg-slate-500 flex items-center justify-center text-white text-[10px] font-semibold">
              {{ currentUserInitial }}
            </div>
          </div>
          <input
            ref="inputRef"
            v-model="composeText"
            type="text"
            maxlength="2000"
            placeholder="Write a reply..."
            class="flex-1 text-sm bg-transparent outline-none text-[#667085] placeholder-[#667085]"
            @keydown="onKeydown"
          />
          <div class="flex items-center gap-2 text-zinc-400 shrink-0">
            <!-- Start: Add product button -->
            <button
              v-if="isCreatorAccount"
              type="button"
              title="Add product"
              class="inline-flex h-5 w-5 items-center justify-center text-[#0C111D] hover:text-[#FF0080]"
              @click.stop="openProductPopup"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M17.3294 5.4379L9.27678 9.74997M9.27678 9.74997L1.22414 5.4379M9.27678 9.74997L9.2768 18.4249M11.1715 17.8668L10.0129 18.4873C9.74426 18.6311 9.60992 18.7031 9.46765 18.7313C9.34174 18.7562 9.21187 18.7562 9.08596 18.7313C8.94369 18.7031 8.80935 18.6311 8.54067 18.4873L1.53015 14.7332C1.2464 14.5813 1.1045 14.5053 1.00119 14.3972C0.909796 14.3016 0.840628 14.1883 0.798316 14.0649C0.750488 13.9254 0.750488 13.7689 0.750488 13.4561V6.04395C0.750488 5.73107 0.750488 5.57463 0.798316 5.4351C0.840628 5.31166 0.909795 5.19836 1.00119 5.10276C1.10451 4.9947 1.24639 4.91873 1.53015 4.76678L8.54067 1.01273C8.80935 0.868863 8.94369 0.796923 9.08596 0.768721C9.21187 0.74376 9.34174 0.74376 9.46765 0.768721C9.60992 0.796924 9.74426 0.86886 10.0129 1.01273L17.0235 4.76678C17.3072 4.91873 17.4491 4.9947 17.5524 5.10276C17.6438 5.19836 17.713 5.31166 17.7553 5.4351C17.8031 5.57462 17.8031 5.73107 17.8031 6.04395L17.8031 10.2066M5.01365 2.90141L13.54 7.46714M15.9084 17.9683V12.4894M13.0663 15.2289H18.7505" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
            <!-- End: Add product button -->
            <!-- Emoji toggle button -->
            <svg
              @click.stop="showEmojiPicker = !showEmojiPicker"
              class="w-[18px] h-[18px] cursor-pointer hover:text-zinc-600"
              :class="showEmojiPicker ? 'text-zinc-600' : ''"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" stroke-width="2"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 13s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
            </svg>
          </div>

          <!-- Emoji picker -->
          <div
            v-if="showEmojiPicker"
            class="absolute bottom-full right-0 mb-2 z-50"
            @click.stop
          >
            <EmojiPicker
              :native="true"
              :hide-group-icons="false"
              :disable-skin-tones="false"
              theme="light"
              @select="onEmojiSelect"
            />
          </div>
        </div>

        <!-- Outside click overlay to close picker -->
        <div
          v-if="showEmojiPicker"
          class="fixed inset-0 z-40"
          @click="showEmojiPicker = false"
        />
      </template>

    </FlexChat>
  </div>

  <!-- Booking request detail popup -->
  <BookingRequestDetailPopup
    v-if="showBookingPopup && activeBookingMessage"
    :message="activeBookingMessage"
    :booking="activeBookingData"
    :event="activeEventData"
    :is-creator="isCreatorAccount"
    :chat-id="activeChatId"
    :current-user-id="currentUserId"
    :loading="bookingActionLoading"
    @accept="onDirectAccept(activeBookingMessage)"
    @decline="onDirectDecline(activeBookingMessage)"
    @adjust="openAdjustPopup(activeBookingMessage)"
    @confirm-counter="onConfirmCounter(activeBookingMessage)"
    @cancel-booking="onCancelBooking(activeBookingMessage)"
    @accept-counter="onAcceptCounter(activeBookingMessage)"
    @reject-counter="onRejectCounter(activeBookingMessage)"
    @ask-more-time="showMoreTimePopup = true"
    @ask-to-reschedule="showReschedulePopup = true"
    @open-chat="showBookingPopup = false"
    @close="showBookingPopup = false"
  />

  <!-- Adjust booking popup -->
  <AdjustBookingPopup
    v-if="showAdjustPopup && activeBookingMessage"
    :message="activeBookingMessage"
    :chat-id="activeChatId"
    @submitted="onAdjustSubmitted"
    @close="showAdjustPopup = false"
  />

  <!-- Ask for more time popup (requestJoinCallNotification) -->
  <MoreTimeRequestPopup
    v-if="showMoreTimePopup && activeBookingMessage"
    :message="activeBookingMessage"
    :booking="activeBookingData"
    :chat-id="activeChatId"
    :other-user-name="bookingSenderName"
    :event="activeEventData"
    @submitted="onMoreTimeSubmitted($event)"
    @close="showMoreTimePopup = false"
  />

  <!-- Ask to reschedule popup (requestJoinCallNotification) -->
  <RescheduleRequestPopup
    v-if="showReschedulePopup && activeBookingMessage"
    :message="activeBookingMessage"
    :booking="activeBookingData"
    :chat-id="activeChatId"
    :other-user-name="bookingSenderName"
    :event="activeEventData"
    @submitted="onRescheduleSubmitted($event)"
    @close="showReschedulePopup = false"
  />

  <!-- Cancel call confirmation popup (requestJoinCallNotification) -->
  <CancelCallConfirmPopup
    v-if="showCancelCallPopup && activeBookingMessage"
    :message="activeBookingMessage"
    :chat-id="activeChatId"
    :is-creator="isCreatorAccount"
    @cancelled="onCallCancelled"
    @close="showCancelCallPopup = false"
  />

  <SpendingRequirementProductPopup
    v-if="isCreatorAccount"
    v-model="showProductPopup"
    :items="productPopupItems"
    :selected-items="[]"
    :loading-by-type="productLoadingByType"
    :has-more-by-type="productHasMoreByType"
    :error-by-type="productErrorByType"
    confirm-label="Add to Chat"
    mark-as-chat-popup
    include-raw-item-data
    @tab-change="handleProductPopupTabChange"
    @load-more="handleProductPopupLoadMore"
    @confirm="onConfirmChatProducts"
  />
</template>
