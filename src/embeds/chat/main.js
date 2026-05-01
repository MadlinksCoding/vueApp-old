import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ChatEmbedApp from '@/embeds/chat/ChatEmbedApp.vue'
import FlowHandler from '@/services/flow-system/FlowHandler'
import { useChatStore } from '@/stores/useChatStore'
import '@/assets/main.css'

const app = createApp(ChatEmbedApp)
const pinia = createPinia()

app.use(pinia)

// Must be before mount — ChatFloatingWidget.onMounted captures piniaStores at call-time
FlowHandler.configure({
  piniaStores: {
    chat: useChatStore(),
  },
})

app.mount('#chat-embed-app')
