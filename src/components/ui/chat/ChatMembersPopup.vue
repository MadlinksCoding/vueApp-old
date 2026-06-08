<template>
  <div class="w-full md:w-[675px] h-full flex flex-col bg-gray-200 shadow-[0_0_10px_0_rgba(0,0,0,0.25)] font-sans relative overflow-hidden">
    
    <!-- Header -->
    <div class="self-stretch min-h-14 px-4 inline-flex justify-between items-center bg-transparent border-b border-gray-300">
      <div class="justify-start text-gray-500 text-sm font-semibold font-['Poppins'] leading-5">Members</div>
      <button @click="emit('close')" class="relative">
        <img src="https://i.ibb.co/G4Y3BB6c/Icon.png" alt="x-close"
          class="w-3 h-3 filter brightness-0 cursor-pointer" />
      </button>
    </div>

    <!-- Search Input -->
    <div class="self-stretch h-12 inline-flex flex-col justify-start items-start gap-1.5 shrink-0">
      <div class="self-stretch flex-1 flex flex-col justify-start items-start gap-1.5">
        <div
          class="self-stretch flex-1 px-4 py-2 bg-white/50 border-b-[1.50px] border-gray-900 inline-flex justify-start items-center gap-2 overflow-hidden"
        >
          <div class="flex-1 flex justify-start items-center gap-2">
            <div class="justify-start text-gray-900 text-base font-normal font-['Poppins'] leading-6 line-clamp-1">To</div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search members by username..."
              class="w-full h-full bg-transparent border-none outline-none text-gray-900 text-base font-normal font-['Poppins'] leading-6 placeholder-gray-500"
            />
          </div>
          <button v-if="searchQuery" @click="searchQuery = ''" class="relative">
            <img src="https://i.ibb.co/G4Y3BB6c/Icon.png" alt="x-close"
              class="w-2.5 h-2.5 cursor-pointer" />
          </button>
        </div>
      </div>
    </div>

    <!-- Members Scrollable Body -->
    <div class="flex-1 flex flex-col bg-[rgba(242,244,247,0.7)] overflow-y-auto p-4 gap-3" @scroll="onScroll">
      <div
        v-for="member in filteredMembers.slice(0, visibleCount)"
        :key="member.id"
        class="self-stretch px-2 py-1.5 inline-flex justify-between items-center rounded-lg transition-colors"
        :class="(!member.isCurrentUser) ? 'hover:bg-white/40 cursor-pointer' : 'cursor-default'"
        @click="(!member.isCurrentUser) ? openMenu(member) : null"
      >
        <div class="flex justify-start items-center gap-3 min-w-0">
          <div class="relative overflow-hidden rounded-[25%_75%_50%_51%/45%_65%_36%_55%] border border-white shrink-0 shadow-sm">
            <img
              v-if="member.avatar"
              :src="member.avatar"
              onerror="this.src='https://fansocial.app/wp-content/plugins/fansocial/assets/img/placeholder/placeholder-headshot-creator-trans-bg.png'"
              class="w-[3.625rem] h-[3.625rem] object-cover"
              alt="avatar"
            />
            <div
              v-else
              class="w-[3.625rem] h-[3.625rem] bg-zinc-300 flex items-center justify-center text-zinc-600 text-base font-semibold uppercase"
            >
              {{ member.initials }}
            </div>
          </div>
          <div class="inline-flex flex-col justify-center items-start gap-1 min-w-0">
            <div class="text-gray-900 text-base font-medium font-['Poppins'] leading-6 flex items-center gap-1.5">
              <span class="truncate">{{ member.displayName }}</span>
              <svg v-if="member.isCreator" class="w-4 h-4 text-blue-500 fill-current shrink-0" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="text-gray-500 text-xs font-medium font-['Poppins'] leading-4 truncate w-full">
              @{{ member.username }} <span v-if="member.isCurrentUser" class="text-[10px] text-gray-400 font-semibold bg-gray-200 px-1 py-0.5 rounded ml-1">You</span>
            </div>
          </div>
        </div>

        <!-- Vertical three-dots ⋮ action trigger -->
        <button
          v-if="!member.isCurrentUser"
          class="p-2 text-gray-400 hover:text-gray-700 transition-colors shrink-0"
          @click.stop="openMenu(member)"
          title="Actions"
        >
          <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      <div v-if="filteredMembers.length === 0" class="text-center text-gray-500 text-sm py-12 font-['Poppins']">
        No matching members
      </div>
    </div>

    <!-- Dimming Overlay inside root container (behind Bottom Drawer) -->
    <Transition name="fade">
      <div
        v-if="selectedMember"
        class="absolute inset-0 bg-black/35 z-20"
        @click="closeMenu"
      />
    </Transition>

    <!-- Bottom Sheet Action Drawer -->
    <Transition name="slide-up">
      <div
        v-if="selectedMember"
        class="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl z-30 shadow-[0_-8px_30px_rgb(0,0,0,0.12)] border-t border-gray-200 flex flex-col select-none overflow-hidden pb-4"
      >
        <!-- Message Privately -->
        <button
          v-if="isGroupChat"
          class="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-slate-50 transition-colors border-b border-gray-100 text-slate-700 font-semibold font-['Poppins'] text-sm"
          @click="handleMessagePrivately"
        >
          <svg class="w-5 h-5 text-gray-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>Message privately</span>
        </button>

        <!-- Kick Member Out (Creator accounts only) -->
        <button
          v-if="isGroupChat && isChatCreator"
          class="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-slate-50 transition-colors border-b border-gray-100 text-slate-700 font-semibold font-['Poppins'] text-sm"
          @click="handleKick"
        >
          <svg class="w-5 h-5 text-gray-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span>Kick @{{ selectedMember.username }} out</span>
        </button>

        <!-- Block/Unblock Member -->
        <button
          class="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-rose-50 transition-colors border-b border-gray-100 text-rose-600 font-semibold font-['Poppins'] text-sm"
          @click="handleBlockToggle"
          :disabled="isCheckingBlock"
        >
          <svg class="w-5 h-5 text-rose-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
          <span v-if="isCheckingBlock">Checking...</span>
          <span v-else-if="isBlocked">Unblock @{{ selectedMember.username }}</span>
          <span v-else>Block @{{ selectedMember.username }}</span>
        </button>

        <!-- Report Member -->
        <button
          class="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-slate-50 transition-colors text-slate-700 font-semibold font-['Poppins'] text-sm opacity-40 pointer-events-none cursor-not-allowed"
          @click="handleReport"
        >
          <svg class="w-5 h-5 text-gray-500 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
          </svg>
          <span>Report</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useChatStore } from '@/stores/useChatStore'

const props = defineProps({
  chatId: { type: String, required: true },
  currentUserId: { type: [String, Number], required: true },
  isCreator: { type: Boolean, default: false },
  isGroupChat: { type: Boolean, default: false }
})

const emit = defineEmits(['close', 'message-privately', 'kick', 'block', 'unblock', 'report'])

const chatStore = useChatStore()
import FlowHandler from '@/services/flow-system/FlowHandler'
const searchQuery = ref('')
const selectedMember = ref(null)
const visibleCount = ref(50)
const isBlocked = ref(false)
const isCheckingBlock = ref(false)

watch(searchQuery, () => {
  visibleCount.value = 50
})

function onScroll(e) {
  const target = e.target
  if (target.scrollHeight - target.scrollTop <= target.clientHeight + 150) {
    if (visibleCount.value < filteredMembers.value.length) {
      visibleCount.value += 50
    }
  }
}

const isChatCreator = computed(() => {
  const chat = chatStore.userChats.find(c => c.chat_id === props.chatId)
  if (!chat) return false
  
  const settings = chat.visibility_settings || chat.visibilitySettings || {}
  const creatorId = settings.chatOwner || chat.created_by || chat.creator_id || chat.created_by_id
  
  return String(props.currentUserId) === String(creatorId)
})

const participants = computed(() => {
  return chatStore.chatParticipants[props.chatId] || []
})

const membersList = computed(() => {
  const ids = Array.from(new Set(participants.value.map(String)))
  
  // Ensure current user is in the list
  const currentIdStr = String(props.currentUserId)
  if (!ids.includes(currentIdStr)) {
    ids.push(currentIdStr)
  }
  
  return ids.map(id => {
    const ud = chatStore.chatUsersData[id]
    const username = ud?.username || `user-${id}`
    const displayName = ud?.display_name || ud?.username || `User ${id}`
    
    const isCreatorMember = ud?.accountType === 'creator' || id === String(chatStore.userChats.find(c => c.chat_id === props.chatId)?.creator_id)
    
    return {
      id,
      avatar: ud?.avatar || null,
      displayName,
      username,
      initials: displayName.charAt(0).toUpperCase(),
      isCreator: isCreatorMember,
      isCurrentUser: id === currentIdStr
    }
  })
})

const filteredMembers = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return membersList.value
  return membersList.value.filter(m => 
    m.displayName.toLowerCase().includes(q) || 
    m.username.toLowerCase().includes(q)
  )
})

async function openMenu(member) {
  selectedMember.value = member
  isCheckingBlock.value = true
  isBlocked.value = false
  
  const res = await FlowHandler.run('blocks.isUserBlocked', {
    from: props.currentUserId,
    to: member.id,
    scope: 'private_chat',
  })
  
  if (res?.ok) {
    isBlocked.value = res.data?.blocked === true
  }
  isCheckingBlock.value = false
}

function closeMenu() {
  selectedMember.value = null
}

function handleMessagePrivately() {
  if (selectedMember.value) {
    emit('message-privately', selectedMember.value)
    closeMenu()
  }
}

function handleKick() {
  if (selectedMember.value) {
    emit('kick', selectedMember.value)
    closeMenu()
  }
}

function handleBlockToggle() {
  if (selectedMember.value && !isCheckingBlock.value) {
    if (isBlocked.value) {
      emit('unblock', selectedMember.value)
    } else {
      emit('block', selectedMember.value)
    }
    closeMenu()
  }
}

function handleReport() {
  if (selectedMember.value) {
    emit('report', selectedMember.value)
    closeMenu()
  }
}
</script>

<style scoped>
/* Slide-up transition for the drawer */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(100%);
}

.slide-up-enter-to,
.slide-up-leave-from {
  transform: translateY(0);
}

/* Fade transition for internal dimmer */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.22s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
}
</style>
