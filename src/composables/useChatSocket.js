import { ref, onUnmounted } from 'vue';
import { useChatStore } from '@/stores/useChatStore';
import FlowHandler from '@/services/flow-system/FlowHandler';

const PARENT_CHECK_MSG  = 'FANSOCIAL_SOCKET_CHECK';
const PARENT_STATUS_MSG = 'FANSOCIAL_SOCKET_STATUS';
const PARENT_SEND_MSG   = 'FANSOCIAL_SOCKET_SEND';
const PARENT_INCOMING_MSG = 'FANSOCIAL_CHAT_INCOMING';
const PARENT_TIMEOUT_MS = 1000;

// Singleton: socket is initialised once for the widget lifetime
let _mode = null; // 'parent' | 'own' | null
const _isReady = ref(false);

let _parentMessageHandler = null;
let _ownSocketHandler = null;

export function useChatSocket(userId) {
  const chatStore = useChatStore();

  async function _handleIncomingChatMessage(body) {
    if (!body?.chat_id) return;

    // If this chat isn't in the list yet, re-fetch so it appears without a page refresh
    const knownChat = chatStore.userChats.find((c) => c.chat_id === body.chat_id)
    if (!knownChat && userId) {
      await FlowHandler.run('chat.fetchUserChats', { userId: String(userId) })
    }

    // Fetch user data for any participant not yet in the store (fire-and-forget)
    const chat = chatStore.userChats.find((c) => c.chat_id === body.chat_id)
    const participants = chatStore.chatParticipants[body.chat_id] || chat?.participants || []
    const msgSenderId = String(body.sender_id || body.senderId || '')
    const candidateIds = [...new Set([...participants.map(String), msgSenderId].filter(Boolean))]
    const missingIds = candidateIds.filter(id => !chatStore.chatUsersData[id])
    if (missingIds.length > 0) {
      FlowHandler.run('chat.fetchChatUsersData', { userIds: missingIds }).then((res) => {
        if (res?.ok) chatStore.setChatUsersDataAction({ users: res.data?.users })
      })
    }

    chatStore.addMessage(body.chat_id, body);
    chatStore.updateChatLastMessage(body.chat_id, body);
    chatStore.updateChatUnread(body.chat_id, true);

    const messageId = body.message_id || body.id;
    if (!messageId) return;

    // Mark as delivered on the API side (fire-and-forget)
    FlowHandler.run('chat.markMessageDelivered', {
      chatId: body.chat_id,
      messageId,
    });

    // Notify the sender that their message was delivered
    const senderId = body.sender_id || body.senderId;
    if (senderId) {
      sendStatusUpdate(body.chat_id, messageId, 'delivered', senderId);
    }

    // Refetch booking + event when a booking-related message arrives so cached
    // data stays fresh regardless of which view is currently mounted.
    const BOOKING_REFETCH_TYPES = new Set(['booking_request', 'requestJoinCallNotification']);
    if (BOOKING_REFETCH_TYPES.has(body.content_type)) {
      // Keep the pinned message store in sync so pinnedBookingMessage computed
      // in ChatWindow immediately reflects the updated action/meta from the new message.
      if (body.is_pinned !== false) {
        chatStore.setPinnedMessage(body.chat_id, body);
      }

      const bookingId = body.content?.booking_id;
      if (bookingId) {
        FlowHandler.run('bookings.fetchBooking', { bookingId }).then((res) => {
          if (!res?.ok) return;
          const bookingItem = res.data?.item || null;
          chatStore.setBooking(bookingId, bookingItem);

          const eventId = bookingItem?.eventId ?? bookingItem?.event_id;
          if (eventId) {
            FlowHandler.run('events.fetchEvent', { eventId }).then((evRes) => {
              if (evRes?.ok) chatStore.setEvent(eventId, evRes.data?.item || null);
            });
          }
        });
      }
    }
  }

  function _handleIncomingStatusUpdate(body) {
    if (!body?.chat_id || !body?.message_id || !body?.status) return;
    if (body.status === 'read' && Array.isArray(body.read_receipts) && body.read_receipts.length > 0) {
      chatStore.updateMessageReadReceiptsAction({
        chatId: body.chat_id,
        messageId: body.message_id,
        readReceipts: body.read_receipts,
      });
    } else {
      chatStore.updateMessageStatusAction({
        chatId: body.chat_id,
        messageId: body.message_id,
        status: body.status,
      });
    }
  }

  // ── Own SocketHandler (fallback) ───────────────────────────────────────────
  function _attachOwnSocket(SH) {
    SH.identifyCurrentUser(userId);
    if (typeof SH._initializeSocketConnection === 'function') SH._initializeSocketConnection();

    _ownSocketHandler = (e) => {
      const { flag, body } = e.detail || {};
      if (flag === 'chat:message') _handleIncomingChatMessage(body);
      else if (flag === 'chat:status') _handleIncomingStatusUpdate(body);
    };
    window.addEventListener('SocketHandler:Incoming', _ownSocketHandler);

    _mode = 'own';
    _isReady.value = true;
  }

  function _initOwnSocket() {
    // 1. Try parent window's SocketHandler
    try {
      const parentSH = window.parent?.SocketHandler;
      if (parentSH) {
        console.log('[ChatSocket] Using parent window SocketHandler for user:', userId);
        _attachOwnSocket(parentSH);
        return;
      }
    } catch {
      // cross-origin parent — not accessible
    }

    // 2. Try current window's SocketHandler
    if (window.SocketHandler) {
      console.log('[ChatSocket] Using own SocketHandler for user:', userId);
      _attachOwnSocket(window.SocketHandler);
      return;
    }

    // 3. Inject SocketHandler script dynamically
    console.log('[ChatSocket] Injecting SocketHandler script...');
    const script = document.createElement('script');
    script.src = 'https://fansocial.app/wp-content/calls/NEWSOCKET/SocketHandler.js';
    script.onload = () => {
      if (window.SocketHandler) {
        console.log('[ChatSocket] Injected SocketHandler ready for user:', userId);
        _attachOwnSocket(window.SocketHandler);
      } else {
        console.warn('[ChatSocket] SocketHandler script loaded but global not found. Real-time disabled.');
        _mode = 'own';
        _isReady.value = true;
      }
    };
    script.onerror = () => {
      console.warn('[ChatSocket] Failed to load SocketHandler script. Real-time disabled.');
      _mode = 'own';
      _isReady.value = true;
    };
    document.head.appendChild(script);
  }

  // ── Parent socket bridge (iframe postMessage) ──────────────────────────────
  function _onParentMessage(e) {
    if (!e.data || typeof e.data !== 'object') return;
    const { type, payload } = e.data;

    if (type === PARENT_STATUS_MSG) {
      // Remove the bootstrap listener; replace with permanent incoming listener
      window.removeEventListener('message', _onParentMessage);
      if (payload?.connected) {
        _parentMessageHandler = _onParentIncoming;
        window.addEventListener('message', _parentMessageHandler);
        _mode = 'parent';
        _isReady.value = true;
        console.log('[ChatSocket] Using parent window socket.');
      } else {
        _initOwnSocket();
      }
    }
  }

  function _onParentIncoming(e) {
    if (e.data?.type !== PARENT_INCOMING_MSG || !e.data.payload) return;
    const { flag, body } = e.data.payload;
    if (flag === 'chat:status') {
      _handleIncomingStatusUpdate(body ?? e.data.payload);
    } else {
      _handleIncomingChatMessage(e.data.payload);
    }
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  function init() {
    if (_mode !== null) return; // already initialised

    window.addEventListener('message', _onParentMessage);

    try {
      window.parent.postMessage({ type: PARENT_CHECK_MSG }, '*');
    } catch {
      // window.parent not accessible — same origin or sandboxed; skip
    }

    setTimeout(() => {
      if (_mode === null) {
        window.removeEventListener('message', _onParentMessage);
        _initOwnSocket();
      }
    }, PARENT_TIMEOUT_MS);
  }

  // ── Send ───────────────────────────────────────────────────────────────────
  function sendSocket(flag, payload) {
    if (_mode === 'parent') {
      try {
        window.parent.postMessage({ type: PARENT_SEND_MSG, flag, payload }, '*');
      } catch {
        console.warn('[ChatSocket] postMessage to parent failed.');
      }
    } else if (_mode === 'own') {
      const SH = window.parent?.SocketHandler || window.SocketHandler;
      if (SH && typeof SH.sendSocketMessage === 'function') {
        SH.sendSocketMessage({ flag, payload }).catch(() => {
          console.warn('[ChatSocket] sendSocketMessage failed.');
        });
      }
    }
  }

  function sendChatMessage(item, recipients) {
    const list = Array.isArray(recipients) ? recipients : [];
    const targets = list.length > 0 ? list : [null];
    targets.forEach((to) => {
      sendSocket('chat:message', { ...item, ...(to !== null && { to }) });
    });
  }

  function sendStatusUpdate(chatId, messageId, status, recipientId, readReceipts = []) {
    console.error("Sending status update", { chatId, messageId, status, recipientId, readReceipts });
    sendSocket('chat:status', {
      chat_id: chatId,
      message_id: messageId,
      status,
      to: recipientId,
      read_receipts: Array.isArray(readReceipts) && readReceipts.length > 0 ? readReceipts : undefined,
    });
  }

  // ── Cleanup ────────────────────────────────────────────────────────────────
  onUnmounted(() => {
    if (_ownSocketHandler) {
      window.removeEventListener('SocketHandler:Incoming', _ownSocketHandler);
      _ownSocketHandler = null;
    }
    if (_parentMessageHandler) {
      window.removeEventListener('message', _parentMessageHandler);
      _parentMessageHandler = null;
    }
    _mode = null;
    _isReady.value = false;
  });

  return { init, sendChatMessage, sendStatusUpdate, isReady: _isReady };
}
