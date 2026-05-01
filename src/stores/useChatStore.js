import { defineStore } from "pinia";

export const useChatStore = defineStore("chat", {
  state: () => ({
    messages: {},
    pagingStates: {},
    userChats: [],
    chatsNextCursor: null,
    chatsHasMore: false,
    chatParticipants: {},
    chatUsersData: {},
    chatPinnedMessages: {},
    chatBookings: {},
    chatEvents: {},
  }),

  getters: {
    getMessagesByChatId: (state) => {
      return (chatId) => state.messages[chatId] || [];
    },
    getPinnedMessageByChatId: (state) => {
      return (chatId) => state.chatPinnedMessages[chatId] ?? null;
    },
    getBookingById: (state) => {
      return (bookingId) => state.chatBookings[bookingId] ?? null;
    },
    getEventById: (state) => {
      return (eventId) => state.chatEvents[eventId] ?? null;
    },
    sortedUserChats: (state) => {
      return [...state.userChats].sort((a, b) => {
        const tsA = a.last_message?.message_ts ?? a.last_message?.time ?? a.last_activity ?? 0
        const tsB = b.last_message?.message_ts ?? b.last_message?.time ?? b.last_activity ?? 0
        return tsB - tsA
      })
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

    fetchUserChatsAction({ items, nextCursor = null, append = false }) {
      const incoming = Array.isArray(items) ? items : [];

      if (append) {
        const existingIndex = new Map(this.userChats.map((c, i) => [c.chat_id, i]));
        const toAppend = [];
        for (const c of incoming) {
          const idx = existingIndex.get(c.chat_id);
          if (idx !== undefined) {
            this.userChats[idx] = { ...this.userChats[idx], ...c };
          } else {
            toAppend.push(c);
          }
        }
        this.userChats.push(...toAppend);
      } else {
        this.userChats = incoming;
      }

      this.chatsNextCursor = nextCursor;
      this.chatsHasMore = !!nextCursor;

      incoming.forEach((c) => {
        if (c.chat_id && Array.isArray(c.participants)) {
          this.chatParticipants[c.chat_id] = c.participants;
        }
        if (c.chat_id && c.pinned_message) {
          this.chatPinnedMessages[c.chat_id] = c.pinned_message;
        }
      });
    },

    setPinnedMessage(chatId, message) {
      if (!chatId) return;
      this.chatPinnedMessages[chatId] = message ?? null;
    },

    setBooking(bookingId, data) {
      if (!bookingId) return;
      this.chatBookings[bookingId] = data ?? null;
    },

    setEvent(eventId, data) {
      if (!eventId) return;
      this.chatEvents[eventId] = data ?? null;
    },

    setChatUsersDataAction({ users }) {
      if (users && typeof users === "object") {
        this.chatUsersData = { ...this.chatUsersData, ...users };
      }
    },

    updateChatLastMessage(chatId, message) {
      const idx = this.userChats.findIndex((c) => c.chat_id === chatId)
      if (idx === -1) return
      this.userChats[idx].last_message = message
      const ts = message?.message_ts ?? message?.time ?? null
      if (ts) this.userChats[idx].last_activity = ts
      // Move chat to front so the array mutation triggers Vue re-render
      if (idx > 0) {
        const [moved] = this.userChats.splice(idx, 1)
        this.userChats.unshift(moved)
      }
    },

    updateChatUnread(chatId, hasUnread) {
      const chat = this.userChats.find((c) => c.chat_id === chatId);
      if (!chat) return;
      chat.unread_count = hasUnread ? Math.max((chat.unread_count || 0) + 1, 1) : 0;
    },

    setChatUnreadCount(chatId, count) {
      const chat = this.userChats.find((c) => c.chat_id === chatId);
      if (chat) chat.unread_count = count ?? 0;
    },

    prependChat(item) {
      if (!item?.chat_id) return;
      const exists = this.userChats.some((c) => c.chat_id === item.chat_id);
      if (!exists) {
        this.userChats.unshift(item);
      }
      if (item.chat_id && Array.isArray(item.participants)) {
        this.chatParticipants[item.chat_id] = item.participants;
      }
      if (item.chat_id && item.pinned_message) {
        this.chatPinnedMessages[item.chat_id] = item.pinned_message;
      }
    },

    updateMessageStatusAction({ chatId, messageId, status }) {
      const msgs = this.messages[chatId];
      if (!msgs) return;
      const idx = msgs.findIndex(
        (m) => (m.id || m.message_id) === messageId
      );
      if (idx !== -1) {
        msgs[idx] = { ...msgs[idx], status };
      }
    },

    updateMessageReadReceiptsAction({ chatId, messageId, readReceipts }) {
      console.error("Updating read receipts for message", { chatId, messageId, readReceipts });
      const msgs = this.messages[chatId];
      if (!msgs) return;
      const idx = msgs.findIndex((m) => (m.id || m.message_id) === messageId);
      if (idx === -1) return;
      const existing = Array.isArray(msgs[idx].read_receipts) ? msgs[idx].read_receipts : [];
      const merged = [...existing];
      for (const receipt of readReceipts) {
        if (!merged.some((r) => String(r.user_id) === String(receipt.user_id))) {
          merged.push(receipt);
        }
      }
      msgs[idx] = { ...msgs[idx], status: 'read', read_receipts: merged };
    },

    clearCache() {
      this.messages = {};
      this.pagingStates = {};
      this.userChats = [];
      this.chatsNextCursor = null;
      this.chatsHasMore = false;
      this.chatParticipants = {};
      this.chatUsersData = {};
      this.chatPinnedMessages = {};
      this.chatBookings = {};
      this.chatEvents = {};
    },
  },
});
