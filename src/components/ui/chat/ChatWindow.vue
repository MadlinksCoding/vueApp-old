<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import FlexChat from '@/components/ui/chat/FlexChat.vue'
import { useChatStore } from '@/stores/useChatStore'
import { resolveUserId } from '@/utils/resolveUserId'
import FlowHandler from '@/services/flow-system/FlowHandler'
import EmojiPicker from 'vue3-emoji-picker'
import 'vue3-emoji-picker/css'

const MAX_MESSAGE_LENGTH = 2000

const props = defineProps({
  chatId:        { type: String, default: null },
  chatName:      { type: String, default: 'Chat' },
  avatar:        { type: String, default: null },
  socket:        { type: Object, default: null },
  targetUserId:  { type: [String, Number], default: null },
  targetUserIds: { type: Array, default: () => [] },
  groupType:     { type: String, default: null },
})

const emit = defineEmits(['close', 'minimize', 'chat-created'])

const chatStore     = useChatStore()
const currentUserId = resolveUserId()

const composeText     = ref('')
const loading         = ref(false)
const hasMore         = ref(true)
const isSending       = ref(false)
const activeChatId    = ref(props.chatId)
const showEmojiPicker = ref(false)
const inputRef        = ref(null)
const currentUserAvatar = computed(() => chatStore.chatUsersData[String(currentUserId)]?.avatar || null)
const currentUserInitial = computed(() => {
  const d = chatStore.chatUsersData[String(currentUserId)]
  return (d?.display_name || d?.username || '?').charAt(0).toUpperCase()
})

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

const messages = computed(() => activeChatId.value ? chatStore.getMessagesByChatId(activeChatId.value) : [])

// ── Read receipts via IntersectionObserver ────────────────────────────────────
const flexChatRef  = ref(null)
const _markedReadIds  = new Set()
const _observedIds    = new Set()
let   _observer       = null

function _onMessageVisible(entries) {
  entries.forEach(async (entry) => {
    if (!entry.isIntersecting) return
    const el        = entry.target
    const messageId = el.dataset.messageId
    const senderId  = el.dataset.senderId

    if (!messageId || _markedReadIds.has(messageId)) return
    if (String(senderId) === String(currentUserId)) return

    _markedReadIds.add(messageId)
    _observer?.unobserve(el)

    chatStore.updateMessageStatusAction({ chatId: activeChatId.value, messageId, status: 'read' })
    chatStore.updateChatUnread(activeChatId.value, false)

    const res = await FlowHandler.run('chat.markMessageRead', {
      chatId: activeChatId.value,
      messageId,
      userId: currentUserId,
    })

    if (senderId) {
      console.error("Marking message as read", { chatId: activeChatId.value, messageId, senderId, res })
      const readReceipts = res?.data?.result?.read_receipts ?? []
      props.socket?.sendStatusUpdate(activeChatId.value, messageId, 'read', senderId, readReceipts)
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

  // Pending chat: create it first on the first message
  if (!activeChatId.value) {
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

    if (createRes?.ok) {
      activeChatId.value = createRes.data.chatId
      emit('chat-created', createRes.data.chatId)
      FlowHandler.run('chat.fetchUserChats', { userId: currentUserId })
    } else {
      composeText.value = text
      isSending.value = false
      return
    }
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

    const allParticipants = chatStore.chatParticipants[activeChatId.value] || []
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

onMounted(async () => {
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
            <svg class="w-[18px] h-[18px] cursor-pointer hover:text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586a4 4 0 00-5.656-5.656L5.757 10.757a6 6 0 008.486 8.486L20 13" />
            </svg>
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
</template>
