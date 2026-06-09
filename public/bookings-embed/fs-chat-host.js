(function (global) {
  var CHAT_EMBED_WIDTH = 360;
  var CHAT_EMBED_HEIGHT = 600;

  function buildIframeSrcWithQuery(src, query) {
    var baseUrl = typeof src === "string" && src ? src : "";
    var hashIndex = baseUrl.indexOf("#");
    var hash = hashIndex >= 0 ? baseUrl.slice(hashIndex) : "";
    var withoutHash = hashIndex >= 0 ? baseUrl.slice(0, hashIndex) : baseUrl;
    var queryIndex = withoutHash.indexOf("?");
    var pathname = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
    var search = queryIndex >= 0 ? withoutHash.slice(queryIndex + 1) : "";
    var params = new URLSearchParams(search);

    Object.keys(query || {}).forEach(function (key) {
      var value = query[key];
      if (value === null || value === undefined || value === "") return;
      params.set(key, String(value));
    });

    var nextSearch = params.toString();
    return pathname + (nextSearch ? "?" + nextSearch : "") + hash;
  }

  function firstNonEmpty() {
    for (var i = 0; i < arguments.length; i += 1) {
      var value = arguments[i];
      if (value !== null && value !== undefined && String(value).trim() !== "") {
        return String(value);
      }
    }
    return null;
  }

  function resolveFanUid(explicitValue) {
    var userData = global.userData || {};
    var currentUser = userData.user || {};
    return firstNonEmpty(
      explicitValue,
      global.__fsChatFanUid,
      userData.fanUid,
      userData.fan_uid,
      userData.encryptedUid,
      userData.encrypted_uid,
      userData.uid,
      currentUser.fanUid,
      currentUser.fan_uid,
      currentUser.encryptedUid,
      currentUser.encrypted_uid,
      currentUser.uid
    );
  }

  function mountChatEmbed(target, options) {
    var container = typeof target === "string"
      ? document.querySelector(target)
      : (target && target.nodeType === 1 ? target : null);

    if (!container) {
      throw new Error("FSChatEmbed.mountChatEmbed could not find the target container.");
    }

    const defaultJwtToken = window?.userData?.jwtToken || null;
    var settings = Object.assign({
      src: "/wp-content/plugins/fansocial/bookings-embed/chat.html",
      currentUserId: null,
      userRole: "fan",
      apiBaseUrl: "https://fs-bookings-backend.onrender.com",
      tokenHandlerApiUrl: "",
      openChatId: null,
      fanUid: null,
      jwtToken: defaultJwtToken,
      iframeTitle: "Chat",
      width: CHAT_EMBED_WIDTH,
      height: CHAT_EMBED_HEIGHT,
    }, options || {});

    if (!settings.currentUserId) {
      throw new Error("FSChatEmbed.mountChatEmbed requires a currentUserId.");
    }

    settings.fanUid = resolveFanUid(settings.fanUid);

    var chatContainer = document.createElement("div");
    chatContainer.className = "fs-chat-embed-container";
    Object.assign(chatContainer.style, {
      position: "fixed",
      bottom: "0",
      right: "0",
      width: String(settings.width / 16) + "rem",
      height: String(settings.height / 16) + "rem",
      zIndex: "9998",
      background: "transparent",
      overflow: "visible",
      pointerEvents: "none",
    });

    var isChatListOpen = false;
    var isChatHovered = false;
    var isLeftAligned = false;
    var hoverTimeout = null;

    var dragHandle = document.createElement("div");
    dragHandle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="5 9 2 12 5 15"></polyline><polyline points="9 5 12 2 15 5"></polyline><polyline points="19 9 22 12 19 15"></polyline><polyline points="9 19 12 22 15 19"></polyline><line x1="2" y1="12" x2="22" y2="12"></line><line x1="12" y1="2" x2="12" y2="22"></line></svg>';
    Object.assign(dragHandle.style, {
      position: "absolute",
      bottom: "16px",
      width: "24px",
      height: "24px",
      background: "transparent",
      color: "#4B5563",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "move",
      opacity: "0",
      transition: "opacity 0.2s",
      zIndex: "9999",
      pointerEvents: "auto",
      left: "-10px" // Initial position assuming right aligned
    });

    function updateDragHandleVisibility() {
      dragHandle.style.display = "flex";

      clearTimeout(hoverTimeout);
      var isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
      if (!isChatListOpen && (isChatHovered || isTouchDevice)) {
        dragHandle.style.opacity = "1";
      } else {
        hoverTimeout = setTimeout(function() {
          dragHandle.style.opacity = "0";
        }, 300);
      }
    }

    dragHandle.addEventListener("mouseenter", function() {
      isChatHovered = true;
      updateDragHandleVisibility();
    });
    dragHandle.addEventListener("mouseleave", function() {
      isChatHovered = false;
      updateDragHandleVisibility();
    });

    dragHandle.addEventListener("mousedown", function(e) {
      if (e.button !== 0) return;
      var rect = chatContainer.getBoundingClientRect();
      initHostDrag(e.clientX - rect.left, e.clientY - rect.top);
    });
    dragHandle.addEventListener("touchstart", function(e) {
      var rect = chatContainer.getBoundingClientRect();
      var touch = e.touches[0];
      initHostDrag(touch.clientX - rect.left, touch.clientY - rect.top);
    });

    chatContainer.appendChild(dragHandle);

    function initHostDrag(mouseOffsetX, mouseOffsetY) {
      var overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.width = "100vw";
      overlay.style.height = "100vh";
      overlay.style.zIndex = "999999";
      overlay.style.cursor = "grabbing";
      document.body.appendChild(overlay);

      function onHostDragMove(e) {
        e.preventDefault();
        var clientX = e.type === "touchmove" ? e.touches[0].clientX : e.clientX;
        var clientY = e.type === "touchmove" ? e.touches[0].clientY : e.clientY;

        var newX = clientX - mouseOffsetX;
        var newY = clientY - mouseOffsetY;

        var maxX = window.innerWidth - chatContainer.offsetWidth;
        var maxY = window.innerHeight - chatContainer.offsetHeight;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(0, Math.min(newY, Math.max(0, maxY)));

        chatContainer.style.left = newX + "px";
        chatContainer.style.top = newY + "px";
        chatContainer.style.right = "auto";
        chatContainer.style.bottom = "auto";
      }

      function onHostDragEnd(e) {
        document.removeEventListener("mousemove", onHostDragMove);
        document.removeEventListener("mouseup", onHostDragEnd);
        document.removeEventListener("touchmove", onHostDragMove);
        document.removeEventListener("touchend", onHostDragEnd);
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);

        var rect = chatContainer.getBoundingClientRect();
        var centerX = rect.left + (rect.width / 2);
        var centerY = rect.top + (rect.height / 2);

        isLeftAligned = centerX < (window.innerWidth / 2);
        var isTopAligned = centerY < (window.innerHeight / 2);

        var snapX = 0;
        
        var defaultTw = dragHandle.dataset.triggerWidth ? parseFloat(dragHandle.dataset.triggerWidth) : 56;
        var offset = defaultTw + 8;
        if (isLeftAligned) {
          chatContainer.style.left = snapX + "px";
          chatContainer.style.right = "auto";
          dragHandle.style.left = offset + "px";
          dragHandle.style.right = "auto";
        } else {
          chatContainer.style.right = snapX + "px";
          chatContainer.style.left = "auto";
          dragHandle.style.right = offset + "px";
          dragHandle.style.left = "auto";
        }

        var snapY = 0;
        if (isTopAligned) {
          chatContainer.style.top = snapY + "px";
          chatContainer.style.bottom = "auto";
          dragHandle.style.top = "16px";
          dragHandle.style.bottom = "auto";
        } else {
          chatContainer.style.bottom = snapY + "px";
          chatContainer.style.top = "auto";
          dragHandle.style.bottom = "16px";
          dragHandle.style.top = "auto";
        }

        iframe.contentWindow.postMessage({
          type: "FS_CHAT_DRAG_END",
          payload: { isLeftAligned: isLeftAligned, isTopAligned: isTopAligned }
        }, "*");
      }

      document.addEventListener("mousemove", onHostDragMove, { passive: false });
      document.addEventListener("mouseup", onHostDragEnd);
      document.addEventListener("touchmove", onHostDragMove, { passive: false });
      document.addEventListener("touchend", onHostDragEnd);
    }

    function applyContainerSize(w, payload = {}) {
      let isEventPage = /\/events\//.test(window?.parent?.location.href);
      if (!isEventPage) return;
      // console.error("Applying c÷ntainer size for width", w,payload, isEventPage);

      if (payload.is_open && w < 768) {
        chatContainer.style.bottom = "0";
        chatContainer.style.right = "0";
        return;
      }

      if (w < 768) {
        chatContainer.style.bottom = "3rem";
      }
      else if (w > 768 && w < 1024) {
        chatContainer.style.right = "4rem";
      }
      else {
        chatContainer.style.bottom = "0";
      }
    }

    var iframe = document.createElement("iframe");
    iframe.src = buildIframeSrcWithQuery(settings.src, {
      currentUserId: String(settings.currentUserId),
      userRole: settings.userRole || "fan",
      apiBaseUrl: settings.apiBaseUrl || null,
      tokenHandlerApiUrl: settings.tokenHandlerApiUrl || null,
      openChatId: settings.openChatId || null,
      fanUid: settings.fanUid || null,
      jwtToken: settings.jwtToken || null,
      hostWidth: window.innerWidth,
    });
    iframe.title = settings.iframeTitle;
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.border = "0";
    iframe.style.background = "transparent";
    iframe.style.display = "block";
    iframe.style.pointerEvents = "auto";
    iframe.allowTransparency = "true";
    iframe.setAttribute("scrolling", "no");

    chatContainer.appendChild(iframe);
    document.body.appendChild(chatContainer);
    applyContainerSize(window.innerWidth);

    function updateAuth(authOptions) {
      var a = authOptions || {};
      if (typeof a.jwtToken === "string") settings.jwtToken = a.jwtToken;
      if (!iframe.contentWindow) return;
      iframe.contentWindow.postMessage({
        type: "FS_CHAT_AUTH_UPDATE",
        payload: { jwtToken: settings.jwtToken || "" },
      }, "*");
    }

    function onMessage(event) {
      if (event.source !== iframe.contentWindow) return;
      var data = event.data || {};

      // State response — resolve a pending getState() Promise
      if (data.type === "FS_CHAT_STATE_RESPONSE") {
        var pending = pendingStateRequests[data.payload && data.payload.requestId];
        if (pending) {
          clearTimeout(pending.timer);
          delete pendingStateRequests[data.payload.requestId];
          pending.resolve(data.payload.data || {});
        }
        return;
      }
      if (data.type === "FS_CHAT_FULLSCREEN") {
        chatContainer.style.width = String(window.innerWidth / 16) + "rem";
        chatContainer.style.height = String(window.innerHeight / 16) + "rem";
      } else if (data.type === "FS_CHAT_RESIZE" && data.payload) {
        var w = data.payload.width;
        var h = data.payload.height;
        if (data.payload.is_open && window.innerWidth < 768) {
          chatContainer.style.width = "100vw";
          chatContainer.style.height = "100dvh";
        } else {
          if (w > 0) chatContainer.style.width = String(w / 16) + "rem";
          if (h > 0) chatContainer.style.height = String(h / 16) + "rem";
        }
        if (data.payload.is_open !== undefined) {
          isChatListOpen = data.payload.is_open;
          updateDragHandleVisibility();
        }
        var tW = data.payload.trigger_width || 56;
        dragHandle.dataset.triggerWidth = tW;
        if (isLeftAligned) {
          dragHandle.style.left = (tW + 8) + "px";
          dragHandle.style.right = "auto";
        } else {
          dragHandle.style.right = (tW + 8) + "px";
          dragHandle.style.left = "auto";
        }
        applyContainerSize(window.innerWidth, data.payload);
      } else if (data.type === "FS_CHAT_HOVER_STATE") {
        isChatHovered = data.payload && data.payload.isHovered;
        updateDragHandleVisibility();
      } else if (data.type === "FS_CHAT_DRAG_START") {
        var p = data.payload || {};
        initHostDrag(p.mouseX || 0, p.mouseY || 0);
      } else if (data.type === "FS_CHAT_TOPUP_REQUIRED") {
        var p = data.payload || {};
        if (typeof window.openTipPopup === "function") {
          window.openTipPopup({
            creator_id: p.creatorUserId || 0,
            user_id: p.currentUserId || 0,
            tip_type: "token",
            topup_amount: p.requiredTokens || 0,
            is_call_topup_and_tip: true,
            is_tip_from_php: true,
            topupFor: p.topupFor || "booking_confirm",
            successCallback: function () {
              iframe.contentWindow.postMessage({ type: "FS_CHAT_TOPUP_SUCCESS", payload: { bookingId: p.bookingId } }, "*");
            },
            failureCallback: function () {
              iframe.contentWindow.postMessage({ type: "FS_CHAT_TOPUP_FAILED" }, "*");
            },
          });
        }
      } else if (data.type === "FS_CHAT_PRODUCT_SELECTED") {
        var productPayload = data.payload || {};
        if (typeof settings.onProductSelected === "function") {
          settings.onProductSelected(productPayload);
        }
        window.dispatchEvent(new CustomEvent("FS_CHAT_PRODUCT_SELECTED", {
          detail: productPayload,
        }));
      } else if (data.type === "FS_CHAT_EVENT") {
        var eventPayload = data.payload || {};
        // Stamp the last activity timestamp on the parent window
        window._fsChatLastTimestamp = eventPayload.timestamp || Date.now();
        // Dispatch a single event — listeners branch on e.detail.type
        window.dispatchEvent(new CustomEvent("FS_CHAT_EVENT", {
          bubbles: true,
          detail: eventPayload,
        }));
        // Keep DOM attributes in sync after any chat activity
        refreshStats();
      }
    }

    function onHostResize() {
      applyContainerSize(window.innerWidth);
      if (!iframe.contentWindow) return;
      iframe.contentWindow.postMessage({
        type: "FS_CHAT_HOST_RESIZE",
        payload: { width: window.innerWidth, height: window.innerHeight }
      }, "*");
    }

    function onFanBookingMessage(event) {
      var data = event.data || {};
      if (data.type !== "FS_FAN_BOOKING_OPEN_CHAT") return;
      openChat(data.payload || {});
    }

    window.addEventListener("message", onMessage);
    window.addEventListener("message", onFanBookingMessage);
    window.addEventListener("resize", onHostResize);

    // Pending getState() requests keyed by requestId
    var pendingStateRequests = {};

    function openChat(options) {
      if (!iframe.contentWindow) return;
      iframe.contentWindow.postMessage({
        type: "FS_CHAT_OPEN_CHAT",
        payload: options || {},
      }, "*");
    }

    function openGroupChat(options) {
      if (!iframe.contentWindow) return;
      iframe.contentWindow.postMessage({
        type: 'FS_CHAT_OPEN_GROUP_CHAT',
        payload: options || {},
      }, '*');
    }

    function openNewChatPopup() {
      if (!iframe.contentWindow) return;
      iframe.contentWindow.postMessage({
        type: "FS_CHAT_OPEN_NEW_CHAT_POPUP",
      }, "*");
    }

    function getState(options) {
      return new Promise(function (resolve, reject) {
        if (!iframe.contentWindow) {
          return reject(new Error("FSChatEmbed: iframe not ready"));
        }
        var requestId = Math.random().toString(36).slice(2) + Date.now().toString(36);
        var timer = setTimeout(function () {
          delete pendingStateRequests[requestId];
          reject(new Error("FSChatEmbed.getState: timed out after 5s"));
        }, 5000);
        pendingStateRequests[requestId] = { resolve: resolve, timer: timer };
        iframe.contentWindow.postMessage({
          type: "FS_CHAT_GET_STATE",
          payload: {
            requestId: requestId,
            only: (options && Array.isArray(options.only)) ? options.only : null,
          },
        }, "*");
      });
    }

    function refreshStats() {
      return getState({ only: ['total', 'totalUnread'] }).then(function (state) {
        var total = state.total !== null && state.total !== undefined ? String(state.total) : null;
        var totalUnread = state.totalUnread !== null && state.totalUnread !== undefined ? String(state.totalUnread) : null;

        if (total !== null) {
          document.querySelectorAll('[data-header-chats-total]').forEach(function (el) {
            el.textContent = total;
            el.setAttribute('data-header-chats-total', total);
          });
        }
        if (totalUnread !== null) {
          document.querySelectorAll('[data-header-user-chats-unread-count]').forEach(function (el) {
            el.textContent = totalUnread;
            el.setAttribute('data-header-user-chats-unread-count', totalUnread);
            if (totalUnread > 0) {
              el.removeAttribute('hidden');
              el.closest(".target-id")?.setAttribute('data-has-unread-chats', 'true');
            } else {
              el.setAttribute('hidden', '');
              el.closest(".target-id")?.setAttribute('data-has-unread-chats', 'false');
            }
          });
        }
        console.log("Refreshed chat stats:", { total, totalUnread });

        return { total: state.total, totalUnread: state.totalUnread };
      }).catch(function () { }); // silent fail — never crash the host page
    }

    return {
      iframe: iframe,
      container: chatContainer,
      updateAuth: updateAuth,
      openChat: openChat,
      openGroupChat: openGroupChat,
      openNewChatPopup: openNewChatPopup,
      getState: getState,
      refreshStats: refreshStats,
      refreshProductRecommendation: function (payload) {
        iframe.contentWindow.postMessage({
          type: "FS_CHAT_PRODUCT_REFRESH",
          payload: Object.assign({ reason: "purchase_success" }, payload || {}),
        }, "*");
      },
      destroy: function () {
        window.removeEventListener("message", onMessage);
        window.removeEventListener("message", onFanBookingMessage);
        window.removeEventListener("resize", onHostResize);
        if (chatContainer.parentNode) {
          chatContainer.parentNode.removeChild(chatContainer);
        }
      },
    };
  }

  global.FSChatEmbed = { mountChatEmbed: mountChatEmbed };
})(window);
