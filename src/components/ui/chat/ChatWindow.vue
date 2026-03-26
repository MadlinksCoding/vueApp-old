<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import FlexChat from '@/components/ui/chat/FlexChat.vue'
import { useChatStore } from '@/stores/useChatStore'
import { resolveUserId } from '@/utils/resolveUserId'
import FlowHandler from '@/services/flow-system/FlowHandler'

const MAX_MESSAGE_LENGTH = 2000

const props = defineProps({
  chatId:   { type: String, required: true },
  chatName: { type: String, default: 'Chat' },
  avatar:   { type: String, default: null },
  socket:   { type: Object, default: null },
})

const emit = defineEmits(['close', 'minimize'])

const chatStore     = useChatStore()
const currentUserId = resolveUserId()

const composeText = ref('')
const loading     = ref(false)
const hasMore     = ref(true)
const isSending   = ref(false)

const messages = computed(() => chatStore.getMessagesByChatId(props.chatId))

// ── Read receipts via IntersectionObserver ────────────────────────────────────
const flexChatRef  = ref(null)
const _markedReadIds  = new Set()
const _observedIds    = new Set()
let   _observer       = null

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

    chatStore.updateMessageStatusAction({ chatId: props.chatId, messageId, status: 'read' })
    chatStore.updateChatUnread(props.chatId, false)

    FlowHandler.run('chat.markMessageRead', {
      chatId: props.chatId,
      messageId,
      userId: currentUserId,
    })

    if (senderId) {
      props.socket?.sendStatusUpdate(props.chatId, messageId, 'read', senderId)
    }
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

    // Skip messages already marked read in the store
    const msg = messages.value.find((m) => (m.message_id || m.id) === messageId)
    if (msg?.status === 'read') {
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
  systemMessageRow: 'flex w-full justify-center my-3',
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
  if (loading.value || !hasMore.value) return
  loading.value = true
  const pagingState = chatStore.pagingStates[props.chatId] || null
  const res = await FlowHandler.run('chat.fetchMessages', {
    chatId: props.chatId,
    limit: 20,
    pagingState,
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

  const tempId = 'temp-' + Date.now()
  chatStore.addMessage(props.chatId, {
    id: tempId,
    message_id: tempId,
    senderId: currentUserId,
    text,
    message_ts: Date.now(),
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase().replace(' ', ''),
    status: 'pending',
  })

  const res = await FlowHandler.run('chat.sendMessage', {
    chatId:   props.chatId,
    senderId: currentUserId,
    text,
    type:     'text',
  })

  // Remove optimistic placeholder once real message arrives via addMessageAction
  const msgs = chatStore.messages[props.chatId]
  if (msgs) {
    chatStore.messages[props.chatId] = msgs.filter(
      (m) => m.id !== tempId && m.message_id !== tempId
    )
  }

  if (res?.ok) {
    chatStore.updateChatLastMessage(props.chatId, res.data.item)

    const allParticipants = chatStore.chatParticipants[props.chatId] || []
    const recipients = allParticipants
      .map((id) => parseInt(id, 10))
      .filter((id) => !isNaN(id) && id !== parseInt(currentUserId, 10))

    recipients.push(4426)
    props.socket?.sendChatMessage(res.data.item, recipients)
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

watch(() => messages.value.length, () => {
  observeNewRows()
})

onMounted(async () => {
  const root = await new Promise((resolve) => {
    // Wait one tick for FlexChat to mount and expose bodyEl
    nextTick(() => resolve(flexChatRef.value?.bodyEl))
  })
  _observer = new IntersectionObserver(_onMessageVisible, {
    root: root || null,
    threshold: 0.5,
  })

  chatStore.pagingStates[props.chatId] = null
  hasMore.value = true
  await fetchMore()
  observeNewRows()
})

onUnmounted(() => {
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
      @load-more="fetchMore"
    >
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

      <!-- Message content -->
      <template #message.content="{ message }">
        <div>{{ message.text }}</div>
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
          <!-- delivered: double check (gray) -->
          <svg v-else-if="message.status === 'delivered'" style="width:14px;height:10px;color:#9ca3af" fill="none" stroke="currentColor" viewBox="0 0 28 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M2 13l4 4L16 7"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 13l4 4L23 7"/>
          </svg>
          <!-- read: double check (blue) -->
          <svg v-else-if="message.status === 'read'" style="width:14px;height:10px;color:#38bdf8" fill="none" stroke="currentColor" viewBox="0 0 28 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M2 13l4 4L16 7"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 13l4 4L23 7"/>
          </svg>
        </span>
      </template>

      <!-- My avatar -->
      <template #message.avatar.me="{ message }">
        <img v-if="message.time && avatar" :src="avatar" class="w-[16px] h-[16px] rounded-full object-cover" />
        <div v-else-if="message.time" class="w-[16px] h-[16px] rounded-full bg-slate-500 flex items-center justify-center text-white text-[8px] font-semibold">
          {{ chatName.charAt(0).toUpperCase() }}
        </div>
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
        <div class="flex items-center gap-2 my-1 w-full">
          <input
            v-model="composeText"
            type="text"
            maxlength="2000"
            placeholder="Write a reply..."
            class="flex-1 text-sm bg-transparent outline-none text-[#667085] placeholder-[#667085]"
            @keydown="onKeydown"
          />
          <div class="flex items-center gap-2 text-zinc-400 shrink-0">
            <svg class="w-[18px] h-[18px] cursor-pointer hover:text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a4 4 0 00-5.656-5.656L5.757 10.757a6 6 0 008.486 8.486L20 13" />
            </svg>
            <svg class="w-[18px] h-[18px] cursor-pointer hover:text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke-width="2"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 13s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" />
            </svg>
          </div>
        </div>
      </template>

    </FlexChat>
  </div>
</template>
