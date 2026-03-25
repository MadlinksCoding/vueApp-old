<script setup>
import { useChatStore } from '@/stores/useChatStore'

const emit = defineEmits(['open-chat', 'close'])

const chatStore = useChatStore()
</script>

<template>
  <div class="absolute bottom-full right-0 mb-2 w-[280px] bg-white rounded-xl shadow-2xl border border-zinc-200 flex flex-col overflow-hidden">

    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-zinc-100">
      <span class="text-sm font-semibold text-zinc-800">Chat</span>
      <button class="text-zinc-400 hover:text-zinc-600 transition-colors" title="New chat">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
    </div>

    <!-- Chat list -->
    <div class="flex-1 overflow-y-auto max-h-[340px]">

      <!-- Empty state -->
      <div v-if="chatStore.userChats.length === 0" class="flex items-center justify-center h-24 text-zinc-400 text-sm">
        No conversations yet
      </div>

      <!-- Chat rows -->
      <button
        v-for="chat in chatStore.userChats"
        :key="chat.chat_id"
        class="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors text-left border-b border-zinc-50 last:border-0"
        @click="emit('open-chat', { chatId: chat.chat_id, chatName: chat.name || 'Chat', avatar: chat.avatar || null })"
      >
        <!-- Avatar -->
        <div class="relative shrink-0">
          <img
            v-if="chat.avatar"
            :src="chat.avatar"
            class="w-9 h-9 rounded-full object-cover"
            alt="avatar"
          />
          <div v-else class="w-9 h-9 rounded-full bg-zinc-300 flex items-center justify-center text-white text-sm font-semibold">
            {{ (chat.name || '?').charAt(0).toUpperCase() }}
          </div>
          <!-- Unread dot -->
          <span
            v-if="chat.unread_count > 0"
            class="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"
          ></span>
        </div>

        <!-- Text -->
        <div class="flex-1 min-w-0">
          <div class="text-sm font-medium text-zinc-800 truncate">{{ chat.name || 'Chat' }}</div>
          <div v-if="chat.last_message" class="text-xs text-zinc-400 truncate">{{ chat.last_message }}</div>
        </div>
      </button>
    </div>

    <!-- Footer -->
    <div class="flex items-center justify-between px-4 py-2.5 border-t border-zinc-100 bg-zinc-50">
      <div class="flex items-center gap-1.5 text-xs text-zinc-500">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <span>{{ chatStore.userChats.length }} chats</span>
      </div>
      <button
        @click="emit('close')"
        class="text-zinc-400 hover:text-zinc-600 transition-colors text-xs"
        title="Close"
      >✕</button>
    </div>

  </div>
</template>
