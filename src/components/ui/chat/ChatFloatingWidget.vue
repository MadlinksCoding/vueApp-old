<script setup>
import { ref, computed, onMounted } from 'vue'
import ChatListPanel from '@/components/ui/chat/ChatListPanel.vue'
import ChatWindow from '@/components/ui/chat/ChatWindow.vue'
import { useChatStore } from '@/stores/useChatStore'
import { useChatSocket } from '@/composables/useChatSocket'
import FlowHandler from '@/services/flow-system/FlowHandler'
import MessageTextIcon from '@/assets/images/icons/message-text-square-02.webp'
import ToastHost from "@/components/ui/toast/ToastHost.vue";

const props = defineProps({
  userId: { type: [String, Number], default: null },
})

const chatStore = useChatStore()

const isListOpen = ref(false)
const currentUserId = ref(null)
const chatListRef = ref(null)
// openChats: [{ chatId, chatName, avatar }]
const openChats = ref([])

const unreadCount = computed(() => {
  // Placeholder: sum unread_count from userChats
  return chatStore.userChats.reduce((sum, c) => sum + (c.unread_count || 0), 0)
})

function toggleList() {
  isListOpen.value = !isListOpen.value
}

function openChatWindow(chat) {
  isListOpen.value = false
  // Avoid duplicates: match by chatId (existing) or targetUserId (pending)
  const isDupe = openChats.value.find((c) =>
    (chat.chatId && c.chatId === chat.chatId) ||
    (chat.targetUserId && c.targetUserId === chat.targetUserId) ||
    (chat.groupType && c.groupType === chat.groupType)
  )
  if (isDupe) return
  openChats.value.push({ ...chat, uid: Date.now() })
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

async function onStartChat({ userId, userIds, displayName, username, avatar, groupType }) {
  // --- Group chat (Message All) ---
  if (userIds && userIds.length > 0) {
    // Check for existing group with same type
    const existing = groupType
      ? chatStore.userChats.find((c) => c.type === groupType)
      : null

    if (existing) {
      // Add new participants to existing group
      FlowHandler.run('chat.addChatParticipant', {
        chatId: existing.chat_id,
        userIds: userIds.map(String),
        invitedBy: String(currentUserId.value),
      })
      openChatWindow({ chatId: existing.chat_id, chatName: displayName, avatar: null, groupType })
    } else {
      // Open pending group window — chat created on first message
      openChatWindow({ chatId: null, chatName: displayName, avatar: null, targetUserIds: userIds.map(String), groupType })
    }
    chatListRef.value?.chatReady?.()
    isListOpen.value = false
    return
  }

  // --- 1-on-1: reuse existing ---
  const existing = findExistingDirectChat(userId)
  if (existing) {
    if (userId && !chatStore.chatUsersData[String(userId)]) {
      chatStore.chatUsersData[String(userId)] = {
        display_name: displayName,
        username: username || '',
        avatar: avatar || '',
      }
    }
    openChatWindow({ chatId: existing.chat_id, chatName: displayName, avatar: avatar || null })
    chatListRef.value?.chatReady?.()
    isListOpen.value = false
    return
  }

  // Store user data immediately so ChatListPanel can display name/avatar without an extra API call
  if (userId) {
    chatStore.chatUsersData[String(userId)] = {
      display_name: displayName,
      username: username || '',
      avatar: avatar || '',
    }
  }

  // --- 1-on-1: open pending window, chat created on first message ---
  openChatWindow({ chatId: null, chatName: displayName, avatar: avatar || null, targetUserId: String(userId) })
  chatListRef.value?.chatReady?.()
  isListOpen.value = false
}

const socket    = ref(null)
const widgetEl  = ref(null)

// Track host width for iframe embeds, while still allowing normal tailwind md classes
const hostWidth = ref(window.innerWidth)

async function openChat({ chatId, userId } = {}) {
  if (chatId) {
    // Resolve the chat item — from store or API
    let item = chatStore.userChats.find(c => String(c.chat_id) === String(chatId))
    if (!item) {
      const res = await FlowHandler.run('chat.getChat', { chatId })
      if (!res?.ok) return
      item = res.data?.item || {}
      chatStore.prependChat(item) // keep store + participants map in sync
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
      const udRes = await FlowHandler.run('chat.fetchChatUsersData', { userIds: missingIds })
      if (udRes?.ok) chatStore.setChatUsersDataAction({ users: udRes.data?.users })
    }

    // Resolve the other participant's avatar from the now-populated store
    const otherId = participantIds.find(id => id !== myId)
    const otherUser = otherId ? chatStore.chatUsersData[otherId] : null
    const avatar = otherUser?.avatar || null
    var chatName = otherUser?.display_name || otherUser?.username || ''
    if( item?.is_group ) {
      console.error("Group chat - using group name:", item)
      chatName = item.chat_name || item.name || otherUser?.display_name || otherUser?.username || ''
    }

    openChatWindow({ chatId, chatName, avatar })
  } else if (userId) {
    const uid = String(userId)
    let userData = chatStore.chatUsersData[uid]
    if (!userData) {
      await FlowHandler.run('chat.fetchChatUsersData', { userIds: [uid] })
      userData = chatStore.chatUsersData[uid]
    }
    const displayName = userData?.display_name || userData?.username || ''
    const username    = userData?.username || ''
    const avatar      = userData?.avatar || null
    onStartChat({ userId: uid, displayName, username, avatar })
  }
}



function openNewChatPopup() {
  isListOpen.value = true
  // Defer until ChatListPanel has mounted and its ref is populated
  setTimeout(() => {
    chatListRef.value?.openNewChatPopup?.()
  }, 0)
}

async function openGroupChat({ userIds = [], displayName = 'Group Chat', groupType = null } = {}) {
  if (!userIds.length) return
  onStartChat({ userIds: userIds.map(String), displayName, groupType })
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
    }
  }
  window.addEventListener('message', handleHostResize)

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
      FlowHandler.run('chat.fetchChatUsersData', { userIds: allParticipantIds })
    }
  }
})
</script>

<template>
  <!-- Fixed bottom-right anchor -->
  <div
    v-if="currentUserId"
    ref="widgetEl"
    class="fixed bottom-2 right-2 z-[9999] flex flex-col items-end gap-2"
    :class="[
      hostWidth >= 768 && hostWidth <= 1024 ? 'bottom-0 right-4' : '',
      hostWidth > 1024 ? 'bottom-4 right-2' : '',
      hostWidth >= 768 ? '!bottom-0' : '',
    ]"
  >

    <!-- Open chat windows (stack left of the trigger) -->
    <div class="flex items-end gap-2 absolute bottom-0 right-0 z-[1]"
         :class="[(hostWidth < 768 && openChats.length > 0) ? '!fixed !top-0 !left-0 !right-0 !bottom-0 !w-screen !h-screen' : '']">
      <ChatWindow
        v-for="chat in openChats"
        :key="chat.uid"
        :chat-id="chat.chatId"
        :chat-name="chat.chatName"
        :avatar="chat.avatar"
        :target-user-id="chat.targetUserId"
        :target-user-ids="chat.targetUserIds"
        :group-type="chat.groupType"
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
    <div class="relative flex flex-col items-end">

      <!-- Chat list panel (floats above trigger) -->
      <ChatListPanel
        v-if="isListOpen"
        ref="chatListRef"
        :current-user-id="currentUserId"
        :host-width="hostWidth"
        @open-chat="openChatWindow"
        @close="isListOpen = false"
        @start-chat="onStartChat"
      />

      <!-- Trigger button (UI-01.0) -->
      <button
        @click="toggleList"
        class="
         right-2 bottom-0
         md:right-10 md:bottom-0
         md:max-[1009px]:rounded-t-[10px]
         md:max-[1009px]:rounded-b-none
         max-[1009px]:md:right-16 max-[1009px]:md:bottom-0
         lg:right-auto lg:bottom-4
         chat-panel-trigger flex items-center gap-2 bg-white border border-zinc-200 rounded-full p-2 shadow-lg hover:shadow-xl transition-shadow text-sm font-medium text-zinc-700"
        :class="[
          hostWidth >= 768 && hostWidth <= 1009 ? '!right-16 !bottom-0' : '',
          hostWidth > 1009 && hostWidth < 1024 ? '!right-10 !bottom-0' : '',
          hostWidth >= 1024 ? '!right-auto !bottom-4' : '',
          hostWidth >= 768 ? 'rounded-t-[10px] rounded-b-none !bottom-0' : 'rounded-full',
        ]"
      >
        <!-- Chat icon with unread badge -->
        <div class="relative">
          <img :src="MessageTextIcon" alt="" class="w-6 h-6 filter brightness-0 cursor-pointer" />
          <span
            v-if="unreadCount > 0"
            class="unread-badge absolute -top-0 -right-0 bg-[#FF0066] text-white text-[9px] font-bold rounded-full w-1.5 h-1.5 items-center justify-center leading-none"
          >
          </span>
        </div>

        <span class="hidden md:flex unread-text" :class="hostWidth >= 768 ? '!flex' : ''" v-if="unreadCount > 0">{{ unreadCount }} NEW MESSAGE{{ unreadCount !== 1 ? 'S' : '' }}</span>
        <span class="hidden md:flex chat-text" :class="hostWidth >= 768 ? '!flex' : ''" v-else>Chat</span>

        <!-- Chevron -->
        <div class="hidden md:flex chat-chevron" :class="hostWidth >= 768 ? '!flex' : ''">
            <svg
              class="w-3.5 h-3.5 text-zinc-400 transition-transform"
              :class="isListOpen ? 'rotate-180' : ''"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
            </svg>
        </div>
      </button>

    </div>
  </div>
  <ToastHost />
</template>
