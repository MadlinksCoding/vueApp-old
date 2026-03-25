<script setup>
import { ref, computed, onMounted } from 'vue'
import ChatListPanel from '@/components/ui/chat/ChatListPanel.vue'
import ChatWindow from '@/components/ui/chat/ChatWindow.vue'
import { useChatStore } from '@/stores/useChatStore'
import { resolveUserId } from '@/utils/resolveUserId'
import { useChatSocket } from '@/composables/useChatSocket'
import FlowHandler from '@/services/flow-system/FlowHandler'

const chatStore = useChatStore()

const isListOpen = ref(false)
const currentUserId = ref(null)
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
  // Avoid duplicates
  if (!openChats.value.find((c) => c.chatId === chat.chatId)) {
    openChats.value.push(chat)
  }
}

function closeChatWindow(chatId) {
  openChats.value = openChats.value.filter((c) => c.chatId !== chatId)
}

const socket = ref(null)

onMounted(() => {
  currentUserId.value = resolveUserId()
  if (currentUserId.value) {
    const s = useChatSocket(currentUserId.value)
    s.init()
    socket.value = s
    FlowHandler.run('chat.fetchUserChats', { userId: currentUserId.value })
  }
})
</script>

<template>
  <!-- Fixed bottom-right anchor -->
  <div class="fixed bottom-4 right-4 z-[9999] flex flex-col items-end gap-2">

    <!-- Open chat windows (stack left of the trigger) -->
    <div class="flex items-end gap-2">
      <ChatWindow
        v-for="chat in openChats"
        :key="chat.chatId"
        :chat-id="chat.chatId"
        :chat-name="chat.chatName"
        :avatar="chat.avatar"
        :socket="socket"
        @close="closeChatWindow(chat.chatId)"
        @minimize="closeChatWindow(chat.chatId)"
      />
    </div>

    <!-- Anchor: chat list panel + trigger button -->
    <div class="relative flex flex-col items-end">

      <!-- Chat list panel (floats above trigger) -->
      <ChatListPanel
        v-if="isListOpen"
        @open-chat="openChatWindow"
        @close="isListOpen = false"
      />

      <!-- Trigger button (UI-01.0) -->
      <button
        @click="toggleList"
        class="flex items-center gap-2 bg-white border border-zinc-200 rounded-full px-4 py-2 shadow-lg hover:shadow-xl transition-shadow text-sm font-medium text-zinc-700"
      >
        <!-- Chat icon with unread badge -->
        <div class="relative">
          <svg class="w-5 h-5 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span
            v-if="unreadCount > 0"
            class="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none"
          >{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
        </div>

        <span v-if="unreadCount > 0">{{ unreadCount }} NEW MESSAGE{{ unreadCount !== 1 ? 'S' : '' }}</span>
        <span v-else>Chat</span>

        <!-- Chevron -->
        <svg
          class="w-3.5 h-3.5 text-zinc-400 transition-transform"
          :class="isListOpen ? 'rotate-180' : ''"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
        </svg>
      </button>

    </div>
  </div>
</template>
