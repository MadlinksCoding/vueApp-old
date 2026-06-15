<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import ChatListPanel from '@/components/ui/chat/ChatListPanel.vue'
import ChatWindow from '@/components/ui/chat/ChatWindow.vue'
import { useChatStore } from '@/stores/useChatStore'
import { useChatSocket } from '@/composables/useChatSocket'
import FlowHandler from '@/services/flow-system/FlowHandler'
import { ensureChatUsersData, resolveAndSyncChat } from '@/services/chat/chatResolverUtils'
import { addParticipantsInChunks } from '@/services/chat/chatParticipantUtils'
import MessageTextIcon from '@/assets/images/icons/message-text-square.svg'
import MessageTextIconPink from '@/assets/images/icons/message-text-square-pink.svg'
import ToastHost from "@/components/ui/toast/ToastHost.vue";

const props = defineProps({
  userId: { type: [String, Number], default: null },
  hideFloatingButton: { type: Boolean, default: false },
})

const chatStore = useChatStore()

const isListOpen = ref(false)
const currentUserId = ref(null)
const chatListRef = ref(null)
// openChats: [{ chatId, chatName, avatar }]
const openChats = ref([])

function toNonEmptyString(value) {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function getFanViewUid(user = {}) {
  return toNonEmptyString(
    user?.fanViewUid
    || user?.UID
    || user?.userUid
    || user?.userUID
    || user?.encodedUid
    || user?.encodedUID
    || user?.encryptedUid
    || user?.encryptedUID
    || user?.encrypted_uid
  )
}

function getFanViewUserId({ userId, fanViewUserId, targetUserData } = {}) {
  return toNonEmptyString(
    fanViewUserId
    || targetUserData?.fanViewUserId
    || targetUserData?.fanUserId
    || targetUserData?.userId
    || targetUserData?.userID
    || targetUserData?.id
    || targetUserData?.ID
    || userId
  )
}

function buildTargetUserData({ userId, displayName, username, avatar, targetUserData, fanViewUid } = {}) {
  const existing = targetUserData && typeof targetUserData === 'object' ? { ...targetUserData } : {}
  const resolvedFanViewUid = toNonEmptyString(fanViewUid) || getFanViewUid(existing)
  const normalized = {
    ...existing,
    ...(userId ? { id: existing.id ?? userId } : {}),
    display_name: displayName || existing.display_name || existing.displayName || '',
    username: username || existing.username || '',
    avatar: avatar || existing.avatar || '',
  }

  if (resolvedFanViewUid) {
    normalized.UID = resolvedFanViewUid
    normalized.userUid = resolvedFanViewUid
    normalized.fanViewUid = resolvedFanViewUid
  }

  return normalized
}

function rememberChatUserData(userId, userData) {
  const key = toNonEmptyString(userId)
  if (!key || !userData) return
  chatStore.chatUsersData[key] = {
    ...(chatStore.chatUsersData[key] || {}),
    ...userData,
  }
}

const isEmbedded = window.self !== window.top

function postToParent(type, payload = {}) {
  if (isEmbedded && window.parent) {
    window.parent.postMessage({ type, payload }, '*')
  }
}

const isDragging = ref(false)
const isLeftAligned = ref(false)
const isTopAligned = ref(false)
const position = ref({ x: null, y: null })
const isFloating = computed(() => position.value.x !== null && position.value.y !== null)

const widgetStyle = computed(() => {
  if (isEmbedded) {
    const offset = hostWidth.value < 768 ? '0.5rem' : '0px';
    return {
      top: isTopAligned.value ? offset : 'auto',
      bottom: !isTopAligned.value ? offset : 'auto',
      left: isLeftAligned.value ? offset : 'auto',
      right: !isLeftAligned.value ? offset : 'auto'
    }
  }
  return position.value.x !== null ? { left: `${position.value.x}px`, top: `${position.value.y}px`, right: 'auto', bottom: 'auto' } : {}
})

let startX = 0, startY = 0
let initialX = 0, initialY = 0
let moved = false

function onHover(isHovered) {
  if (isEmbedded) {
    postToParent('FS_CHAT_HOVER_STATE', { isHovered })
  }
}

let isPointerDragging = false
let lastPointerScreenX = 0
let lastPointerScreenY = 0

function onPointerDown(e) {
  if (e.pointerType === 'mouse' && e.button !== 0) return
  isPointerDragging = true
  moved = false
  lastPointerScreenX = e.screenX
  lastPointerScreenY = e.screenY

  if (widgetEl.value && !isEmbedded) {
    const rect = widgetEl.value.getBoundingClientRect()
    initialX = rect.left
    initialY = rect.top
    position.value = { x: initialX, y: initialY }
  }

  if (isEmbedded) {
    position.value = { x: 1, y: 1 } // Trigger isFloating styles
  }

  e.currentTarget.setPointerCapture(e.pointerId)
}

function onPointerMove(e) {
  if (!isPointerDragging || !widgetEl.value) return

  const dx = e.screenX - lastPointerScreenX
  const dy = e.screenY - lastPointerScreenY

  if (!moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
    moved = true
    isDragging.value = true
  }

  if (moved) {
    e.preventDefault()

    if (isEmbedded) {
      postToParent('FS_CHAT_DRAG_DELTA', { dx, dy })
    } else {
      const widgetWidth = widgetEl.value.offsetWidth
      const widgetHeight = widgetEl.value.offsetHeight
      const maxX = window.innerWidth - widgetWidth
      const maxY = window.innerHeight - widgetHeight

      let newX = Math.max(0, Math.min(position.value.x + dx, maxX))
      let newY = Math.max(0, Math.min(position.value.y + dy, maxY))
      position.value = { x: newX, y: newY }
    }

    lastPointerScreenX = e.screenX
    lastPointerScreenY = e.screenY
  }
}

function onPointerUp(e) {
  if (!isPointerDragging) return
  isPointerDragging = false
  isDragging.value = false
  e.currentTarget.releasePointerCapture(e.pointerId)

  if (moved) {
    if (isEmbedded) {
      postToParent('FS_CHAT_DRAG_END_TOUCH')
    } else {
      if (widgetEl.value) {
        const widgetWidth = widgetEl.value.offsetWidth
        const widgetHeight = widgetEl.value.offsetHeight
        const centerX = position.value.x + (widgetWidth / 2)
        const centerY = position.value.y + (widgetHeight / 2)
        const windowCenterX = window.innerWidth / 2
        const windowCenterY = window.innerHeight / 2

        isLeftAligned.value = centerX < windowCenterX
        isTopAligned.value = centerY < windowCenterY

        const distLeft = centerX
        const distRight = window.innerWidth - centerX
        const distTop = centerY
        const distBottom = window.innerHeight - centerY
        const minDist = Math.min(distLeft, distRight, distTop, distBottom)

        const horizontalOffset = hostWidth.value >= 768 ? 16 : 8
        const verticalOffset = hostWidth.value >= 768 ? 16 : 8

        if (minDist === distLeft || minDist === distRight) {
          if (isLeftAligned.value) {
            position.value.x = horizontalOffset
          } else {
            position.value.x = window.innerWidth - widgetWidth - horizontalOffset
          }
        } else {
          if (isTopAligned.value) {
            position.value.y = verticalOffset
          } else {
            position.value.y = window.innerHeight - widgetHeight - verticalOffset
          }
        }
      }
    }
  }
}

const unreadCount = computed(() => {
  // Placeholder: sum unread_count from userChats
  return chatStore.userChats.reduce((sum, c) => sum + (c.unread_count || 0), 0)
})

function toggleList(e) {
  if (moved) {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    moved = false
    return
  }
  isListOpen.value = !isListOpen.value
}

function openChatWindow(chat) {
  isListOpen.value = false
  console.log("Attempting to open chat window with:", chat)
  // Avoid duplicates: match by chatId (existing) or targetUserId (pending)
  const isDupe = openChats.value.find((c) =>
    (chat.chatId && c.chatId === chat.chatId) ||
    (chat.chatId && chat.targetUserId && c.targetUserId === chat.targetUserId) ||
    (chat.groupType && c.groupType === chat.groupType)
  )
  if (isDupe) {
    console.log("Chat window already open for this chat/user/group - skipping:", isDupe)
    return
  }

  const newChat = { ...chat, uid: Date.now() + Math.random() }

  const limit = hostWidth.value >= 768 ? 3 : 1
  if (openChats.value.length >= limit) {
    const toKeep = limit - 1
    openChats.value = toKeep > 0 ? [...openChats.value.slice(-toKeep), newChat] : [newChat]
  } else {
    openChats.value = [...openChats.value, newChat]
  }
}

function closeChatWindow(uid) {
  openChats.value = openChats.value.filter((c) => c.uid !== uid)
}

function onChatCreated(uid, newChatId) {
  const entry = openChats.value.find((c) => c.uid === uid)
  if (entry) entry.chatId = newChatId
}

function findExistingDirectChat(targetUserId, isBookingRequest = false) {
  const targetId = Number(targetUserId)
  const myId = Number(currentUserId.value)
  return chatStore.userChats.find(chat => {
    if (chat.is_group === true || chat.is_group === 1 || chat.type === 'group') return false
    const parts = (chatStore.chatParticipants[chat.chat_id] || []).map(Number)
    if (parts.length !== 2 || !parts.includes(myId) || !parts.includes(targetId)) return false
    const bookingFlag = chat.metadata?.is_booking_request === true
    return isBookingRequest ? bookingFlag : !bookingFlag
  })
}

async function onStartChat({ userId, userIds, displayName, username, avatar, groupType, chatType, chatSubtype, contextFlags, metadata, groupCategory, coverImageUrl, visibilitySettings, targetUserData, fanViewUid, fanViewUserId }) {
  console.log("onStartChat called with:", { userId, userIds, displayName, username, avatar, groupType, chatType, chatSubtype, contextFlags, metadata, groupCategory, coverImageUrl, visibilitySettings, targetUserData, fanViewUid, fanViewUserId })
  // --- Group chat (Message All) ---
  if (userIds && userIds.length > 0) {
    // Check for existing group with same type
    const existing = groupType
      ? chatStore.userChats.find((c) => c.type === groupType || c.metadata?.nativeType === groupType)
      : null

    if (existing) {
      console.log("Existing group chat found - adding participants if needed and opening:", existing)
      // Add new participants to existing group using the chunking helper
      await addParticipantsInChunks({
        chatId: existing.chat_id,
        userIds,
        currentUserId: currentUserId.value,
        chatStore,
        role: 'member',
        updateChat: true,
      })

      if (socket.value?.sendChatSettingUpdate) {
        socket.value.sendChatSettingUpdate(
          existing.chat_id, 
          chatStore.chatParticipants[existing.chat_id] || []
        )
      }

      openChatWindow({ chatId: existing.chat_id, chatName: displayName, avatar: null, groupType, chatType, chatSubtype, contextFlags, metadata, groupCategory, coverImageUrl, visibilitySettings })
    } else {
      // Open pending group window — chat created on first message
      openChatWindow({ chatId: null, chatName: displayName, avatar: null, targetUserIds: userIds.map(String), groupType, chatType, chatSubtype, contextFlags, metadata, groupCategory, coverImageUrl, visibilitySettings })
    }
    chatListRef.value?.chatReady?.()
    return
  }

  // --- 1-on-1: reuse existing ---
  const directUserData = buildTargetUserData({ userId, displayName, username, avatar, targetUserData, fanViewUid })
  const directFanViewUid = getFanViewUid(directUserData)
  const directFanViewUserId = getFanViewUserId({ userId, fanViewUserId, targetUserData: directUserData })

  const existing = findExistingDirectChat(userId)
  if (existing) {
    rememberChatUserData(userId, directUserData)
    openChatWindow({
      chatId: existing.chat_id,
      chatName: directUserData.display_name || displayName,
      avatar: directUserData.avatar || avatar || null,
      targetUserId: String(userId),
      targetUserData: directUserData,
      fanViewUid: directFanViewUid,
      fanViewUserId: directFanViewUserId,
    })
    chatListRef.value?.chatReady?.()
    return
  }

  // Store user data immediately so ChatListPanel can display name/avatar without an extra API call
  if (userId) {
    rememberChatUserData(userId, directUserData)
  }

  // --- 1-on-1: open pending window, chat created on first message ---
  openChatWindow({
    chatId: null,
    chatName: directUserData.display_name || displayName,
    avatar: directUserData.avatar || avatar || null,
    targetUserId: String(userId),
    targetUserData: directUserData,
    fanViewUid: directFanViewUid,
    fanViewUserId: directFanViewUserId,
  })
  chatListRef.value?.chatReady?.()
}

const socket    = ref(null)
const widgetEl  = ref(null)

// Track host width for iframe embeds, while still allowing normal tailwind md classes
const hostWidth = ref(window.innerWidth)

watch(hostWidth, (newWidth) => {
  const limit = newWidth >= 768 ? 3 : 1
  if (openChats.value.length > limit) {
    const toRemove = openChats.value.length - limit
    openChats.value.splice(0, toRemove)
  }
})

async function openChat({ chatId, userId, targetUserData, fanViewUid, fanViewUserId } = {}) {
  if (chatId) {
    // Resolve the chat item — from store or API
    let item = chatStore.userChats.find(c => String(c.chat_id) === String(chatId))
    if (!item) {
      item = await resolveAndSyncChat(chatId)
      if (!item) return
    }

    // Participants may be plain IDs (numbers) or objects with a user_id field
    const rawParticipants = chatStore.chatParticipants[chatId]
      || item.participants
      || []
    const myId = String(currentUserId.value)
    const participantIds = rawParticipants.map(p =>
      String(typeof p === 'object' ? (p.user_id ?? p.userId ?? p.id) : p)
    )

    // Fetch user data for any participant not yet in the store
    const missingIds = participantIds.filter(id => id !== myId && !chatStore.chatUsersData[id])
    if (missingIds.length > 0) {
      await ensureChatUsersData(missingIds)
    }

    // Resolve the other participant's avatar from the now-populated store
    const otherId = participantIds.find(id => id !== myId)
    const otherUser = otherId ? chatStore.chatUsersData[otherId] : null
    const avatar = otherUser?.avatar || null
    const targetData = buildTargetUserData({
      userId: otherId,
      displayName: otherUser?.display_name || otherUser?.displayName || '',
      username: otherUser?.username || '',
      avatar,
      targetUserData: targetUserData || otherUser,
      fanViewUid,
    })
    const resolvedFanViewUid = getFanViewUid(targetData)
    const resolvedFanViewUserId = getFanViewUserId({ userId: otherId, fanViewUserId, targetUserData: targetData })
    var chatName = otherUser?.display_name || otherUser?.username || ''
    if( item?.is_group ) {
      console.error("Group chat - using group name:", item)
      chatName = item.chat_name || item.name || otherUser?.display_name || otherUser?.username || ''
    }

    openChatWindow({
      chatId,
      chatName,
      avatar,
      targetUserId: otherId || null,
      targetUserData: targetData,
      fanViewUid: resolvedFanViewUid,
      fanViewUserId: resolvedFanViewUserId,
    })
  } else if (userId) {
    const uid = String(userId)
    let userData = chatStore.chatUsersData[uid]
    if (!userData) {
      await ensureChatUsersData([uid])
      userData = chatStore.chatUsersData[uid]
    }
    const displayName = userData?.display_name || userData?.username || ''
    const username    = userData?.username || ''
    const avatar      = userData?.avatar || null
    onStartChat({ userId: uid, displayName, username, avatar, targetUserData: userData })
  }
}



function openNewChatPopup() {
  isListOpen.value = true
  // Defer until ChatListPanel has mounted and its ref is populated
  setTimeout(() => {
    chatListRef.value?.openNewChatPopup?.()
  }, 0)
}

async function openGroupChat({ 
  userIds = [], 
  displayName = 'Group Chat', 
  groupType = null, 
  chatType, 
  chatSubtype, 
  contextFlags, 
  metadata, 
  visibilitySettings = null 
} = {}) {
  if (!userIds.length) return
  onStartChat({ 
    userIds: userIds.map(String), 
    displayName, 
    groupType, 
    chatType, 
    chatSubtype, 
    contextFlags, 
    metadata, 
    visibilitySettings 
  })
}

defineExpose({ widgetEl, openChat, openGroupChat, openNewChatPopup, isListOpen, openChats })

onMounted(async () => {
  const params = new URLSearchParams(window.location.search)
  if (params.get('hostWidth')) {
    hostWidth.value = parseInt(params.get('hostWidth'), 10)
  }

  const handleHostResize = (e) => {
    if (e.data?.type === 'FS_CHAT_HOST_RESIZE') {
      hostWidth.value = e.data.payload.width
    } else if (e.data?.type === 'FS_CHAT_DRAG_END' && e.data.payload) {
      isLeftAligned.value = e.data.payload.isLeftAligned
      isTopAligned.value = e.data.payload.isTopAligned
      isDragging.value = false
      moved = false

    }
  }
  window.addEventListener('message', handleHostResize)

  const handleCloseAllChats = () => {
    isListOpen.value = false
    openChats.value = []
  }
  window.addEventListener('fs-chat-close-all', handleCloseAllChats)

  onBeforeUnmount(() => {
    window.removeEventListener('message', handleHostResize)
    window.removeEventListener('fs-chat-close-all', handleCloseAllChats)
  })

  if (props.userId) {
    currentUserId.value = String(props.userId)
  } else {
    const { resolveUserId } = await import('@/utils/resolveUserId')
    currentUserId.value = resolveUserId()
  }
  if (currentUserId.value) {
    const s = useChatSocket(currentUserId.value)
    s.init()
    socket.value = s
    await FlowHandler.run('chat.fetchUserChats', { userId: currentUserId.value })

    // Collect all unique participant IDs across all chats, including current user
    const allParticipantIds = [
      ...new Set(
        Object.values(chatStore.chatParticipants)
          .flat()
          .map(Number)
          .filter((id) => id)
      ),
    ]
    if (allParticipantIds.length > 0) {
      ensureChatUsersData(allParticipantIds)
    }
  }
})
</script>

<template>
  <!-- Fixed bottom-right anchor -->
  <div
    v-if="currentUserId"
    ref="widgetEl"
    class="fixed z-[9999] flex flex-col gap-2"
    :class="[
      isLeftAligned ? 'items-start' : 'items-end',
      !isDragging ? 'transition-all duration-300' : '',
      (!isEmbedded && position.x === null) ? [
        hostWidth >= 768 && hostWidth <= 1024 ? 'bottom-0 right-4' : '',
        hostWidth > 1024 ? 'bottom-4 right-2' : '',
        hostWidth >= 768 ? '!bottom-0' : '',
        'bottom-2 right-2'
      ] : ''
    ]"
    :style="widgetStyle"
  >

    <!-- Open chat windows (stack left or right of the trigger depending on alignment) -->
    <div class="flex gap-2 absolute z-[10000]"
         :class="[
           isTopAligned ? 'items-start top-0' : 'items-end bottom-0',
           (hostWidth < 768 && openChats.length > 0) ? '!fixed !top-0 !left-0 !right-0 !bottom-0 !w-screen !h-screen' : '',
           isLeftAligned ? 'left-0 flex-row-reverse' : 'right-0'
         ]"
         :style="{ pointerEvents: isDragging ? 'none' : 'auto' }">
      <ChatWindow
        v-for="(chat, index) in openChats"
        :key="chat.uid"
        :index="index"
        :chat-id="chat.chatId"
        :chat-name="chat.chatName"
        :avatar="chat.avatar"
        :target-user-id="chat.targetUserId"
        :target-user-ids="chat.targetUserIds"
        :target-user-data="chat.targetUserData"
        :fan-view-uid="chat.fanViewUid"
        :fan-view-user-id="chat.fanViewUserId"
        :group-type="chat.groupType"
        :chat-type="chat.chatType"
        :chat-subtype="chat.chatSubtype"
        :context-flags="chat.contextFlags"
        :metadata="chat.metadata"
        :group-category="chat.groupCategory"
        :cover-image-url="chat.coverImageUrl"
        :visibility-settings="chat.visibilitySettings"
        :socket="socket"
        :current-user-id="currentUserId"
        :host-width="hostWidth"
        @close="closeChatWindow(chat.uid)"
        @minimize="closeChatWindow(chat.uid)"
        @chat-created="(id) => onChatCreated(chat.uid, id)"
        @start-chat="onStartChat"
      />
    </div>

    <!-- Anchor: chat list panel + trigger button -->
    <div class="relative flex items-end" :class="isTopAligned ? 'flex-col-reverse' : 'flex-col'">

      <!-- Chat list panel (floats above trigger) -->
      <ChatListPanel
        v-if="isListOpen"
        ref="chatListRef"
        :current-user-id="currentUserId"
        :host-width="hostWidth"
        :is-left-aligned="isLeftAligned"
        :is-top-aligned="isTopAligned"
        @open-chat="openChatWindow"
        @close="isListOpen = false"
        @start-chat="onStartChat"
        :style="{ pointerEvents: isDragging ? 'none' : 'auto' }"
      />

      <!-- Trigger button (UI-01.0) -->
      <button
        v-show="!hideFloatingButton"
        @click="toggleList($event)"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @mouseenter="onHover(true)"
        @mouseleave="onHover(false)"
        class="
         right-2 bottom-0
         md:right-10 md:bottom-0
         md:max-[1009px]:rounded-t-[10px]
         md:max-[1009px]:rounded-b-none
         max-[1009px]:md:right-16 max-[1009px]:md:bottom-0
         lg:right-auto lg:bottom-4
         touch-none select-none chat-panel-trigger flex items-center gap-2 bg-white border border-zinc-200 p-2 shadow-lg hover:shadow-xl transition-shadow text-sm font-medium text-zinc-700"
        :class="[
          !isFloating ? [
            hostWidth >= 768 && hostWidth <= 1009 ? '!right-16 !bottom-0 p-3' : '',
            hostWidth > 1009 && hostWidth < 1024 ? '!right-10 !bottom-0 p-3' : '',
            hostWidth >= 1024 ? '!right-auto !bottom-4 p-3' : '',
            hostWidth >= 768 ? 'rounded-t-[10px] rounded-b-none !bottom-0 p-3' : 'rounded-full',
          ] : [
            hostWidth >= 768 ? 'rounded-[10px] p-3' : 'rounded-full'
          ]
        ]"
      >
        <!-- Chat icon with unread badge -->
        <div class="relative">
          <img
            draggable="false"
            :src="hostWidth < 768 ? MessageTextIconPink : MessageTextIcon"
            alt=""
            class="cursor-pointer"
            :class="[
              hostWidth > 768 ? 'w-[2.25rem] h-[2.25rem] filter brightness-0' : 'w-[1.875rem] h-[1.875rem]'
            ]"
          />
          <span
            v-if="unreadCount > 0"
            class="unread-badge absolute -top-0.5 -right-0.5 bg-[#FF0066] text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none"
            :class="[
              hostWidth < 768 ? 'p-[3px] !-top-[0.75rem] !-right-[0.5rem]' : 'w-1.5 h-1.5'
            ]"
          >
            {{ hostWidth < 768 ? unreadCount : '' }}
          </span>
        </div>

        <span class="hidden md:flex unread-text text-gray-500 text-sm font-medium" :class="hostWidth >= 768 ? '!flex !text-lg' : ''" v-if="unreadCount > 0">{{ unreadCount }} NEW MESSAGE{{ unreadCount !== 1 ? 'S' : '' }}</span>
        <span class="hidden md:flex chat-text text-gray-500 text-sm font-medium" :class="hostWidth >= 768 ? '!flex !text-lg' : ''" v-else>Chat</span>

        <!-- Chevron -->
        <div class="hidden md:flex chat-chevron" :class="hostWidth >= 768 ? '!flex' : ''">
            <svg
              class="w-5 h-5 text-zinc-400 transition-transform"
              :class="[
                hostWidth >= 768 ? '!w-6 !h-6' : '',
                isTopAligned ? (isListOpen ? '' : 'rotate-180') : (isListOpen ? 'rotate-180' : ''
              ])"
              fill="none" stroke="#667085" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
            </svg>
        </div>
      </button>

    </div>
  </div>
  <ToastHost />
</template>
