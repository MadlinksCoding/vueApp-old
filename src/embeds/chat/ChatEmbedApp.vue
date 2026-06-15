<template>
  <div class="w-screen h-screen overflow-hidden" style="background: transparent;">
    <ChatFloatingWidget ref="widgetRef" :user-id="uid" :hide-floating-button="hideFloatingButton" />
  </div>
</template>
<style scoped>
#__vue-devtools-container__{
  display: none !important;
}
</style>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import ChatFloatingWidget from '@/components/ui/chat/ChatFloatingWidget.vue'
import { setBackendJwtToken } from '@/utils/backendJwt.js'
import { setRuntimeTokenHandlerApiUrl } from '@/utils/TokenHandler.js'
import { useChatStore } from '@/stores/useChatStore'
import { postToParent } from '@/utils/postToParent'

const widgetRef = ref(null)
let resizeObserver   = null
let mutationObserver = null
let bodyObserver     = null
let overlayObserver  = null
let popupOpen        = false
let resizeTimer      = null

// Run synchronously during setup — before any child onMounted hooks fire
const params = new URLSearchParams(window.location.search)

const uid = params.get('currentUserId') || params.get('userId')
if (uid) {
  if (!window.userData) window.userData = {}
  window.userData.userID = uid
}

const role = params.get('userRole')
if (role) {
  if (!window.userSpecifiData) window.userSpecifiData = {}
  if (!window.userSpecifiData.currentUser) window.userSpecifiData.currentUser = {}
  window.userSpecifiData.currentUser.isCreator = role === 'creator'
}

const apiBase = params.get('apiBaseUrl')
if (apiBase) {
  window.__fsChatApiBaseUrl = apiBase
}

const tokenHandlerApiUrl = params.get('tokenHandlerApiUrl')
if (tokenHandlerApiUrl) {
  setRuntimeTokenHandlerApiUrl(tokenHandlerApiUrl)
}

const fanUid = params.get('fanUid')
if (fanUid) {
  if (!window.userData) window.userData = {}
  window.userData.fanUid = fanUid
  window.__fsChatFanUid = fanUid
}

const jwtToken = params.get('jwtToken')
if (jwtToken) {
  setBackendJwtToken(jwtToken)
}

window.__fsChatEmbed = true

const FS_CHAT_AUTH_UPDATE         = 'FS_CHAT_AUTH_UPDATE'
const FS_CHAT_OPEN_CHAT           = 'FS_CHAT_OPEN_CHAT'
const FS_CHAT_OPEN_GROUP_CHAT     = 'FS_CHAT_OPEN_GROUP_CHAT'
const FS_CHAT_OPEN_NEW_CHAT_POPUP = 'FS_CHAT_OPEN_NEW_CHAT_POPUP'
const FS_CHAT_GET_STATE           = 'FS_CHAT_GET_STATE'
const FS_CHAT_STATE_RESPONSE      = 'FS_CHAT_STATE_RESPONSE'
const FS_CHAT_SET_FLOATING_BUTTON = 'FS_CHAT_SET_FLOATING_BUTTON'

const alwaysHideFloatingButton = params.get('alwaysHideFloatingButton') === '1'
const hideFloatingButton = ref(alwaysHideFloatingButton || params.get('hideFloatingButton') === '1')

function onParentMessage(event) {
  if (event.source !== window.parent) return
  const data = event.data || {}

  if (data.type === FS_CHAT_AUTH_UPDATE) {
    const payload = data.payload || {}
    if (typeof payload.jwtToken === 'string') {
      setBackendJwtToken(payload.jwtToken)
    }
    return
  }

  if( data.type.startsWith('FS_CHAT_') && data.type !== FS_CHAT_SET_FLOATING_BUTTON && data.type !== FS_CHAT_OPEN_CHAT) {
    let parentWindow = window.parent
    if ( parentWindow ) {
      try {
        if (parentWindow.document.body.classList.contains('hide-chat-widget')) {
          if (!alwaysHideFloatingButton) hideFloatingButton.value = true
        } else {
          if (!alwaysHideFloatingButton) hideFloatingButton.value = false  
        }
      } catch (e) {
        // Handle cross-origin errors if any
      }
    }
  }

  if (data.type === FS_CHAT_SET_FLOATING_BUTTON) {
    if (alwaysHideFloatingButton) return // Ignore dynamic toggles if locked
    const payload = data.payload || {}
    hideFloatingButton.value = !!payload.hidden
    return
  }

  if (data.type === FS_CHAT_OPEN_CHAT) {
    const payload = data.payload || {}
    widgetRef.value?.openChat(payload)
  }

  if (data.type === 'FS_CHAT_CLOSE') {
    widgetRef.value?.closeAll?.()
  }

  if (data.type === FS_CHAT_OPEN_NEW_CHAT_POPUP) {
    widgetRef.value?.openNewChatPopup()
  }

  if (data.type === FS_CHAT_OPEN_GROUP_CHAT) {
    const payload = data.payload || {}
    widgetRef.value?.openGroupChat(payload)
  }

  if (data.type === FS_CHAT_GET_STATE) {
    const { requestId, only } = data.payload || {}
    const store = useChatStore()

    const allState = {
      chats:          store.userChats,
      messages:       store.messages,
      usersData:      store.chatUsersData,
      participants:   store.chatParticipants,
      pinnedMessages: store.chatPinnedMessages,
      bookings:       store.chatBookings,
      events:         store.chatEvents,
      hasMore:        store.chatsHasMore,
      nextCursor:     store.chatsNextCursor,
      total:          store.chatsTotal,
      totalUnread:    store.chatsTotalUnread,
    }

    const result = (Array.isArray(only) && only.length > 0)
      ? Object.fromEntries(only.filter(k => k in allState).map(k => [k, allState[k]]))
      : allState

    postToParent(FS_CHAT_STATE_RESPONSE, { requestId, data: JSON.parse(JSON.stringify(result)) })

  }
}

function scheduleResize(el, delay = 30) {
  if (popupOpen) return
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => notifyResize(el), delay)
}

let lastW = 0
let lastH = 0
let lastIsOpen = null

function notifyResize(el) {
  if (popupOpen) return

  const root = el.getBoundingClientRect()

  // Walk all descendants — captures absolute-positioned children (chat list, chat windows)
  let minLeft  = root.left
  let minTop   = root.top
  let maxRight = root.right
  let maxBottom = root.bottom
  el.querySelectorAll('*').forEach(child => {
    const r = child.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) {
      if (r.left  < minLeft)  minLeft  = r.left
      if (r.top   < minTop)   minTop   = r.top
      if (r.right > maxRight) maxRight = r.right
      if (r.bottom > maxBottom) maxBottom = r.bottom
    }
  })

  const w = Math.ceil(maxRight - minLeft) + 32
  const h = Math.ceil(maxBottom - minTop) + 32

  const isOpen = !!(widgetRef.value?.isListOpen || (widgetRef.value?.openChats?.length > 0))
  const triggerEl = el.querySelector('.chat-panel-trigger')
  const triggerWidth = triggerEl ? triggerEl.getBoundingClientRect().width : 56

  if (w === lastW && h === lastH && isOpen === lastIsOpen) {
    return
  }

  lastW = w
  lastH = h
  lastIsOpen = isOpen

  postToParent('FS_CHAT_RESIZE', { width: w, height: h, is_open: isOpen, trigger_width: triggerWidth })
}

function sendFullViewport() {
  postToParent('FS_CHAT_FULLSCREEN')
}

function checkPopupState(el) {
  // NewChatPopup: signalled by the usePopupStack singleton overlay becoming visible
  const overlayEl = document.querySelector('[data-popup-overlay]')
  const overlayActive = overlayEl?.style.visibility === 'visible'

  // BookingDetailPopup / AdjustPopup: identified by explicit data-fs-chat-popup attribute
  const hasTeleportedPopup = Array.from(document.body.children).some(child =>
    child.hasAttribute('data-fs-chat-popup')
  )

  if (overlayActive || hasTeleportedPopup) {
    popupOpen = true
    sendFullViewport()
  } else {
    popupOpen = false
    scheduleResize(el)
  }
}

function attachObserver(el) {
  // ResizeObserver: in-flow layout changes (chat windows) — debounced
  resizeObserver = new ResizeObserver(() => scheduleResize(el))
  resizeObserver.observe(el)

  // MutationObserver on widgetEl: absolute children (chat list panel) — debounced
  mutationObserver = new MutationObserver(() => scheduleResize(el))
  mutationObserver.observe(el, { childList: true, subtree: true })

  // MutationObserver on body: watches for direct Teleport popups and the overlay element
  bodyObserver = new MutationObserver((mutations) => {
    // If the usePopupStack overlay was just added, start watching its style for visibility changes
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1 && node.hasAttribute('data-popup-overlay') && !overlayObserver) {
          overlayObserver = new MutationObserver(() => checkPopupState(el))
          overlayObserver.observe(node, { attributes: true, attributeFilter: ['style'] })
        }
      })
    }
    checkPopupState(el)
  })
  bodyObserver.observe(document.body, { childList: true })

  notifyResize(el)
}

onMounted(() => {
  window.addEventListener('message', onParentMessage)

  const stopWatch = watch(
    () => widgetRef.value?.widgetEl,
    (el) => {
      if (!el) return
      stopWatch()
      attachObserver(el)
    },
    { immediate: true }
  )

  watch(
    () => [widgetRef.value?.isListOpen, widgetRef.value?.openChats?.length],
    () => {
      if (widgetRef.value?.widgetEl) {
        notifyResize(widgetRef.value.widgetEl)
      }
    }
  )
})

onBeforeUnmount(() => {
  window.removeEventListener('message', onParentMessage)
  clearTimeout(resizeTimer)
  resizeObserver?.disconnect()
  mutationObserver?.disconnect()
  bodyObserver?.disconnect()
  overlayObserver?.disconnect()
})
</script>
