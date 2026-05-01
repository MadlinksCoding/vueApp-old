<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useChatStore } from '@/stores/useChatStore'
import FlowHandler from '@/services/flow-system/FlowHandler'
import EditIcon from '@/assets/images/icons/edit-05-pink.svg'
import DropdownIcon from '@/assets/images/icons/chevron-down-gray.webp'
import NewChatPopup from '@/components/ui/chat/NewChatPopup.vue'
import PopupHandler from '@/components/ui/popup/PopupHandler.vue'
import { resolveParentUserData } from '@/utils/resolveParentUserData.js'

const props = defineProps({
  currentUserId: { type: [String, Number], default: null },
})
const emit = defineEmits(['open-chat', 'close', 'start-chat', 'chat-ready'])

const showNewChatPopup = ref(false)
const isLoadingMore = ref(false)
const listEl = ref(null)

async function loadMoreChats() {
  if (isLoadingMore.value || !chatStore.chatsHasMore) return
  isLoadingMore.value = true
  await FlowHandler.run('chat.fetchUserChats', {
    userId: props.currentUserId,
    cursor: chatStore.chatsNextCursor,
  })
  isLoadingMore.value = false
}

function onListScroll() {
  if (isLoadingMore.value || !chatStore.chatsHasMore) return
  const el = listEl.value
  if (!el) return
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - 40) {
    loadMoreChats()
  }
}

onMounted(() => {
  listEl.value?.addEventListener('scroll', onListScroll)
})

onUnmounted(() => {
  listEl.value?.removeEventListener('scroll', onListScroll)
})

function onNewChatMessage(payload) {
  emit('start-chat', payload)
}

function onChatReady() {
  showNewChatPopup.value = false
}

defineExpose({ chatReady: onChatReady })

const isCreator = computed(() => {
  const ud = resolveParentUserData()
  return ud?.accountType === 'creator' || window.userSpecifiData?.currentUser?.isCreator === true || localStorage.getItem('isCreator') === 'true'
})

const creatorId = computed(() => {
  const ud = resolveParentUserData()
  return isCreator.value ? (ud?.userID ?? props.currentUserId) : null || props.currentUserId
})

const newChatPopupConfig = {
  actionType: 'popup',
  position: window.__fsChatEmbed ? 'center' : { default: 'top-center', '>768': 'center' },
  customEffect: 'scale',
  speed: '250ms',
  effect: 'ease-in-out',
  closeSpeed: '250ms',
  showOverlay: true,
  closeOnOutside: true,
  lockScroll: false,
  escToClose: true,
  width: window.__fsChatEmbed ? '675px' : { default: '100%', '>768': '675px' },
  height: window.__fsChatEmbed ? '90vh' : { default: '100vh', '>768': '90vh' },
  scrollable: false,
  zIndex: 10000,
}

const chatStore = useChatStore()

const blobShape = (index) =>
  index % 2 === 0
    ? 'rounded-[25%_75%_50%_51%/45%_65%_36%_55%]'
    : 'rounded-[40%_60%_55%_45%/55%_45%_60%_40%]'

const rowBg = (index) =>
  index % 2 !== 0
    ? 'background-color: rgba(255,255,255,0.9); backdrop-filter: blur(12px);'
    : ''

function getOtherParticipantId(chatId) {
  const participants = chatStore.chatParticipants[chatId] || []
  const currentId = Number(props.currentUserId)
  return participants.find((id) => Number(id) !== currentId) ?? null
}

function getChatDisplayName(chat) {
  if (chat?.metadata?.is_booking_request) return chat.name || 'Chat'
  const otherId = getOtherParticipantId(chat.chat_id)
  if (otherId) {
    const userData = chatStore.chatUsersData[String(otherId)]
    if (userData) {
      return userData.display_name || userData.username || chat.name || 'Chat'
    }
  }
  return chat.name || 'Chat'
}

function getChatAvatar(chat) {
  const otherId = getOtherParticipantId(chat.chat_id)
  if (otherId) {
    const userData = chatStore.chatUsersData[String(otherId)]
    if (userData?.avatar) return userData.avatar
  }
  return chat.avatar || null
}

function getLastMessageText(chat) {
  const msg = chat.last_message
  if (!msg) return null

  const contentType = msg.content_type

  // System / special message types — show fixed label or system text, no sender prefix
  if (contentType === 'activity_log') {
    return msg.content?.text || 'Activity update'
  }
  if (contentType === 'requestJoinCallNotification') {
    return 'Session starting soon'
  }
  if (contentType === 'product_recommendation') {
    return 'Product recommendation'
  }
  // if (contentType === 'booking_request') {
  //   return 'Booking request'
  // }

  const text = typeof msg === 'string' ? msg : (msg?.content?.text ?? msg?.text)
  if (!text) return null

  const senderId = msg.sender_id || msg.senderId
  if (String(senderId) === String(props.currentUserId)) {
    return `You: ${text}`
  }
  const senderData = chatStore.chatUsersData[String(senderId)]
  const senderName = senderData?.display_name || senderData?.username || null
  return senderName ? `${senderName}: ${text}` : text
}
</script>

<template>
  <div
    class="absolute bottom-full right-0 mb-2 w-72 h-[480px] z-[9999] rounded-[0.625rem] flex flex-col overflow-hidden shadow-[0_0_8px_0_rgba(0,0,0,0.25)]"
    style="background-color: #F2F4F7;"
  >

    <!-- Header -->
    <div class="px-2 py-1 flex justify-center items-center gap-2.5">
      <div class="flex-1 text-gray-500 text-sm font-medium font-['Poppins'] leading-5">Chat</div>
      <button v-if="isCreator" title="New chat" @click="showNewChatPopup = true">
        <img :src="EditIcon" alt="edit" class="w-5 h-5" />
      </button>
      <button @click="emit('close')" title="Close">
        <img :src="DropdownIcon" alt="close" class="w-5 h-5" />
      </button>
    </div>

    <!-- Chat list -->
    <div ref="listEl" class="flex flex-col flex-1 overflow-y-auto">

      <!-- Empty state -->
      <div v-if="chatStore.userChats.length === 0" class="flex items-center justify-center w-full h-24 text-gray-500 text-sm font-['Poppins']">
        No conversations yet
      </div>

      <!-- Chat rows -->
      <button
        v-for="(chat, index) in chatStore.sortedUserChats"
        :key="chat.chat_id"
        class="pl-3 pr-2 py-3 flex justify-start items-center gap-2 text-left w-full border-b border-gray-200/60 last:border-0 transition-colors"
        :style="rowBg(index)"
        @click="emit('open-chat', { chatId: chat.chat_id, chatName: getChatDisplayName(chat), avatar: getChatAvatar(chat) })"
      >
        <!-- Avatar -->
        <div class="w-9 h-9 relative shrink-0">
          <div class="overflow-hidden w-9 h-9" :class="blobShape(index)">
            <img
              v-if="getChatAvatar(chat)"
              :src="getChatAvatar(chat)"
              class="w-9 h-9 object-cover"
              alt="avatar"
            />
            <div
              v-else
              class="w-9 h-9 bg-zinc-300 flex items-center justify-center text-white text-sm font-semibold"
            >
              {{ getChatDisplayName(chat).charAt(0).toUpperCase() }}
            </div>
          </div>
          <!-- Status dot -->
          <div
            class="w-2 h-2 rounded-full absolute"
            style="left: 1.688rem; top: 1.688rem;"
            :style="chat.unread_count > 0 ? 'background-color: #FF0464;' : 'background-color: #14E04D;'"
          ></div>
        </div>

        <!-- Text -->
        <div class="flex-1 flex flex-col justify-start items-start min-w-0">
          <div
            class="text-sm font-['Poppins'] leading-5 truncate w-full"
            :class="chat.unread_count > 0 ? 'text-gray-900 font-medium' : 'text-gray-900 font-normal'"
          >
            {{ getChatDisplayName(chat) }}
          </div>
          <div class="w-full flex justify-start items-center gap-1">
            <div
              v-if="getLastMessageText(chat)"
              class="flex-1 text-xs font-['Poppins'] leading-4 line-clamp-1"
              :class="chat.unread_count > 0 ? 'text-gray-900 font-medium' : 'text-slate-600 font-normal'"
            >
              {{ getLastMessageText(chat) }}
            </div>
            <div v-if="chat.unread_count > 0" class="w-2 h-2 rounded-full shrink-0" style="background-color: #FF0464;"></div>
          </div>
        </div>
      </button>

      <!-- Load more indicator -->
      <div
        v-if="isLoadingMore"
        class="w-full py-3 flex justify-center items-center border-t border-gray-200/60"
      >
        <svg class="w-4 h-4 animate-spin text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      </div>

    </div>

  </div>

  <!-- New Chat Popup — slide-in via PopupHandler -->
  <PopupHandler
    v-if="isCreator"
    v-model="showNewChatPopup"
    :config="newChatPopupConfig"
    @closed="showNewChatPopup = false"
  >
    <NewChatPopup
      :creator-id="creatorId"
      :current-user-id="currentUserId"
      :visible="showNewChatPopup"
      @start-chat="onNewChatMessage"
      @close="showNewChatPopup = false"
    />
  </PopupHandler>

</template>
