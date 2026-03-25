import { ref, onUnmounted } from 'vue';
import { useChatStore } from '@/stores/useChatStore';

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

  function _handleIncomingChatMessage(body) {
    console.error('[ChatSocket] Received message:', body);
    if (!body?.chat_id) return;
    chatStore.addMessage(body.chat_id, body);
  }

  // ── Own SocketHandler (fallback) ───────────────────────────────────────────
  function _attachOwnSocket(SH) {
    SH.identifyCurrentUser(userId);
    if (typeof SH._initializeSocketConnection === 'function') SH._initializeSocketConnection();

    _ownSocketHandler = (e) => {
      const { flag, body } = e.detail || {};
      if (flag === 'chat:message') _handleIncomingChatMessage(body);
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
    if (e.data?.type === PARENT_INCOMING_MSG && e.data.payload) {
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
  function sendChatMessage(item, recipients) {
    const list = Array.isArray(recipients) ? recipients : [];
    const targets = list.length > 0 ? list : [null];

    targets.forEach((to) => {
      const payload = { ...item, ...(to !== null && { to }) };

      if (_mode === 'parent') {
        try {
          window.parent.postMessage({ type: PARENT_SEND_MSG, payload }, '*');
        } catch {
          console.warn('[ChatSocket] postMessage to parent failed.');
        }
      } else if (_mode === 'own') {
        const SH = window.parent?.SocketHandler || window.SocketHandler;
        if (SH && typeof SH.sendSocketMessage === 'function') {
          SH.sendSocketMessage({ flag: 'chat:message', payload }).catch(() => {
            console.warn('[ChatSocket] sendSocketMessage failed.');
          });
        }
      }
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

  return { init, sendChatMessage, isReady: _isReady };
}
