<template>
  <div class="w-screen h-screen overflow-hidden" style="background: transparent;">
    <ChatFloatingWidget ref="widgetRef" :user-id="uid" />
  </div>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import ChatFloatingWidget from '@/components/ui/chat/ChatFloatingWidget.vue'
import { setBackendJwtToken } from '@/utils/backendJwt.js'

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

const FS_CHAT_AUTH_UPDATE = 'FS_CHAT_AUTH_UPDATE'

function onAuthUpdateMessage(event) {
  if (event.source !== window.parent) return
  const data = event.data || {}
  if (data.type !== FS_CHAT_AUTH_UPDATE) return
  const payload = data.payload || {}
  if (typeof payload.jwtToken === 'string') {
    setBackendJwtToken(payload.jwtToken)
  }
}

function scheduleResize(el, delay = 30) {
  if (popupOpen) return
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(() => notifyResize(el), delay)
}

function notifyResize(el) {
  if (popupOpen) return
  console.log("Calculating chat embed size...") // Debug log to trace resize events
  const root = el.getBoundingClientRect()

  // Walk all descendants — captures absolute-positioned children (chat list, chat windows)
  let minLeft  = root.left
  let minTop   = root.top
  let maxRight = root.right
  el.querySelectorAll('*').forEach(child => {
    const r = child.getBoundingClientRect()
    if (r.width > 0 && r.height > 0) {
      if (r.left  < minLeft)  minLeft  = r.left
      if (r.top   < minTop)   minTop   = r.top
      if (r.right > maxRight) maxRight = r.right
    }
  })

  // Use full visual span including left overflow (chat list extends left of widgetEl)
  const w = Math.ceil(maxRight - minLeft) + 32
  const h = Math.ceil(root.bottom - minTop) + 32
  window.parent.postMessage({ type: 'FS_CHAT_RESIZE', payload: { width: w, height: h } }, '*')
}

function sendFullViewport() {
  window.parent.postMessage({ type: 'FS_CHAT_FULLSCREEN' }, '*')
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
  window.addEventListener('message', onAuthUpdateMessage)

  const stopWatch = watch(
    () => widgetRef.value?.widgetEl,
    (el) => {
      if (!el) return
      stopWatch()
      attachObserver(el)
    },
    { immediate: true }
  )
})

onBeforeUnmount(() => {
  window.removeEventListener('message', onAuthUpdateMessage)
  clearTimeout(resizeTimer)
  resizeObserver?.disconnect()
  mutationObserver?.disconnect()
  bodyObserver?.disconnect()
  overlayObserver?.disconnect()
})
</script>
