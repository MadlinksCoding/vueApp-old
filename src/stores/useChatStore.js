import { defineStore } from "pinia";

export const useChatStore = defineStore("chat", {
  state: () => ({
    messages: {},
    pagingStates: {},
    userChats: [],
    chatParticipants: {},
  }),

  getters: {
    getMessagesByChatId: (state) => {
      return (chatId) => state.messages[chatId] || [];
    },
  },

  actions: {
    setMessages(chatId, messagesList) {
      this.messages[chatId] = messagesList;
    },

    addMessage(chatId, message) {
      if (!this.messages[chatId]) {
        this.messages[chatId] = [];
      }
      const existingIdx = this.messages[chatId].findIndex(
        (m) => (m.id || m.message_id) === (message.id || message.message_id),
      );
      console.error
      if (existingIdx !== -1) {
        this.messages[chatId][existingIdx] = message;
      } else {
        this.messages[chatId].push(message);
      }
    },

    addMessageAction({ chatId, item }) {
      this.addMessage(chatId, item);
    },

    prependMessages(chatId, historicalMessages) {
      if (!this.messages[chatId]) {
        this.messages[chatId] = [];
      }
      // Build a lookup of fetched messages so we can update existing entries (e.g. fill in message_ts)
      const fetchedById = new Map(
        historicalMessages.map((m) => [m.message_id || m.id, m])
      );
      const existingIds = new Set(this.messages[chatId].map((m) => m.message_id || m.id));

      // Update existing messages with fresh data from the fetch
      const updated = this.messages[chatId].map((m) => {
        const fresh = fetchedById.get(m.message_id || m.id);
        return fresh ? { ...m, ...fresh } : m;
      });

      // Append messages not yet in the store
      const newMessages = historicalMessages.filter(
        (m) => !existingIds.has(m.message_id || m.id)
      );

      const merged = [...updated, ...newMessages];
      // Use MAX_SAFE_INTEGER fallback so messages missing message_ts sort to the end
      merged.sort((a, b) =>
        (a.message_ts ?? Number.MAX_SAFE_INTEGER) - (b.message_ts ?? Number.MAX_SAFE_INTEGER)
      );
      this.messages[chatId] = merged;
    },

    prependMessagesAction({ chatId, items, pagingState }) {
      if (Array.isArray(items) && items.length > 0) {
        this.prependMessages(chatId, items);
      }
      if (pagingState !== undefined) {
        this.pagingStates[chatId] = pagingState;
      }
    },

    setUserChats(items) {
      this.userChats = items;
    },

    fetchUserChatsAction({ items }) {
      const list = Array.isArray(items) ? items : [];
      this.userChats = list;
      list.forEach((c) => {
        if (c.chat_id && Array.isArray(c.participants)) {
          this.chatParticipants[c.chat_id] = c.participants;
        }
      });
    },

    clearCache() {
      this.messages = {};
      this.pagingStates = {};
      this.userChats = [];
      this.chatParticipants = {};
    },
  },
});
