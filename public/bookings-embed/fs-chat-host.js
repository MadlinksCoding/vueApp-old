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
    var isLeftAligned = false;

    function injectCSS() {
      var link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = "/wp-content/plugins/fansocial/bookings-embed/fs-chat-button.css?v=" + Date.now();
      // Fallback for local dev
      if (settings.src.indexOf('localhost') !== -1 || settings.src.indexOf('192.168.1.101') ){
        link.href = new URL("./fs-chat-button.css?v=" + Date.now(), settings.src).href;
      }
      document.head.appendChild(link);
    }
    injectCSS();

    var extBtn = document.createElement("div");
    extBtn.id = "fs-chat-external-btn";
    extBtn.setAttribute("data-animation-blink-widget", "false");
    extBtn.style.display = "none"; // Hide initially until iframe is ready
    extBtn.classList.add("edge-bottom", window.innerWidth >= 768 ? "anchor-right" : "anchor-none"); // Default
    
    function snapToEdges() {
      var rect = extBtn.getBoundingClientRect();
      var centerX = rect.left + (rect.width / 2);
      var centerY = rect.top + (rect.height / 2);
      
      var finalLeft = "auto", finalRight = "auto", finalTop = "auto", finalBottom = "auto";
      var saveObj = {};
      
      if (window.innerWidth >= 768) {
        // Desktop: Horizontal along the bottom
        finalBottom = "0px";
        // Anchor to left or right to prevent width changes from pushing it offscreen
        extBtn.classList.remove("edge-left", "edge-right", "edge-top", "edge-bottom", "anchor-left", "anchor-right", "anchor-top", "anchor-bottom");
        extBtn.classList.add("edge-bottom");
        if (centerX < window.innerWidth / 2) {
          finalLeft = Math.max(8, rect.left) + "px";
          saveObj = { edge: "bottom", pos1: finalLeft, pos2: "auto", anchor: "left" };
          extBtn.classList.add("anchor-left");
        } else {
          finalRight = Math.max(8, window.innerWidth - rect.right) + "px";
          saveObj = { edge: "bottom", pos1: "auto", pos2: finalRight, anchor: "right" };
          extBtn.classList.add("anchor-right");
        }
      } else {
        // Mobile: Snap to closest side edge (Left or Right)
        var anchorTop = centerY < window.innerHeight / 2 ? Math.max(8, rect.top) + "px" : "auto";
        var anchorBottom = centerY >= window.innerHeight / 2 ? Math.max(8, window.innerHeight - rect.bottom) + "px" : "auto";
        var verticalAnchor = centerY < window.innerHeight / 2 ? "top" : "bottom";
        
        extBtn.classList.remove("edge-left", "edge-right", "edge-top", "edge-bottom", "anchor-left", "anchor-right", "anchor-top", "anchor-bottom");

        if (centerX < window.innerWidth / 2) {
          finalLeft = "8px";
          finalTop = anchorTop;
          finalBottom = anchorBottom;
          saveObj = { edge: "left", pos1: finalTop, pos2: finalBottom, anchor: verticalAnchor };
          extBtn.classList.add("edge-left", "anchor-" + verticalAnchor);
        } else {
          finalRight = "8px";
          finalTop = anchorTop;
          finalBottom = anchorBottom;
          saveObj = { edge: "right", pos1: finalTop, pos2: finalBottom, anchor: verticalAnchor };
          extBtn.classList.add("edge-right", "anchor-" + verticalAnchor);
        }
      }
      
      extBtn.style.left = finalLeft;
      extBtn.style.right = finalRight;
      extBtn.style.top = finalTop;
      extBtn.style.bottom = finalBottom;

      if (typeof isChatListOpen !== 'undefined' && isChatListOpen) {
        extBtn.classList.add("is-open");
      }

      localStorage.setItem("fs_chat_btn_pos", JSON.stringify(saveObj));
    }

    function updateDeviceClass(isResizeEvent) {
      if (window.innerWidth >= 768) {
        extBtn.classList.add("desktop");
        extBtn.classList.remove("mobile");
      } else {
        extBtn.classList.add("mobile");
        extBtn.classList.remove("desktop");
      }
      if (isResizeEvent === true && typeof snapToEdges === 'function') {
        snapToEdges();
      }
    }
    window.addEventListener("resize", function() { updateDeviceClass(true); });
    updateDeviceClass();
    extBtn.innerHTML = `
      <div id="fs-chat-external-btn-icon-wrapper">
        <svg id="fs-chat-external-btn-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 8.5H12M7 12H15M7 18V20.3355C7 20.8684 7 21.1348 7.10923 21.2716C7.20422 21.3906 7.34827 21.4599 7.50054 21.4597C7.67563 21.4595 7.88367 21.2931 8.29976 20.9602L10.6852 19.0518C11.1725 18.662 11.4162 18.4671 11.6875 18.3285C11.9282 18.2055 12.1844 18.1156 12.4492 18.0613C12.7477 18 13.0597 18 13.6837 18H16.2C17.8802 18 18.7202 18 19.362 17.673C19.9265 17.3854 20.3854 16.9265 20.673 16.362C21 15.7202 21 14.8802 21 13.2V7.8C21 6.11984 21 5.27976 20.673 4.63803C20.3854 4.07354 19.9265 3.6146 19.362 3.32698C18.7202 3 17.8802 3 16.2 3H7.8C6.11984 3 5.27976 3 4.63803 3.32698C4.07354 3.6146 3.6146 4.07354 3.32698 4.63803C3 5.27976 3 6.11984 3 7.8V14C3 14.93 3 15.395 3.10222 15.7765C3.37962 16.8117 4.18827 17.6204 5.22354 17.8978C5.60504 18 6.07003 18 7 18Z" stroke="#0C111D" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span id="fs-chat-external-btn-badge" style="display: none;">0</span>
      </div>
      <span id="fs-chat-external-btn-text">Chat</span>
      <div id="fs-chat-external-btn-chevron">
        <svg viewBox="0 0 24 24" fill="none" stroke="#667085"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>
      </div>
    `;
    document.body.appendChild(extBtn);

    var savedPos = localStorage.getItem("fs_chat_btn_pos");
    if (savedPos) {
      try {
        var pos = JSON.parse(savedPos);
        extBtn.classList.remove("edge-left", "edge-right", "edge-top", "edge-bottom", "anchor-left", "anchor-right", "anchor-top", "anchor-bottom");
        extBtn.classList.add("edge-" + (pos.edge || "bottom"));
        if (pos.anchor) {
          extBtn.classList.add("anchor-" + pos.anchor);
        }
        var isMobile = window.innerWidth < 768;
        var edgeGap = isMobile ? "8px" : "0px";
        if (pos.edge === "left") {
          extBtn.style.left = edgeGap;
          extBtn.style.top = pos.pos1;
          extBtn.style.bottom = pos.pos2;
        } else if (pos.edge === "right") {
          extBtn.style.right = edgeGap;
          extBtn.style.top = pos.pos1;
          extBtn.style.bottom = pos.pos2;
        } else if (pos.edge === "top") {
          extBtn.style.top = edgeGap;
          extBtn.style.left = pos.pos1;
          extBtn.style.right = pos.pos2;
        } else if (pos.edge === "bottom") {
          extBtn.style.bottom = edgeGap;
          extBtn.style.left = pos.pos1;
          extBtn.style.right = pos.pos2;
        } else {
          // Fallback for old format
          extBtn.style.left = pos.left + "px";
          extBtn.style.top = pos.top + "px";
        }
      } catch (e) {}
    } else {
      if (window.innerWidth >= 768) {
        extBtn.style.right = "8px";
        extBtn.style.bottom = "0px";
      } else {
        extBtn.style.right = "8px";
        extBtn.style.bottom = "8px";
      }
    }

    var isDraggingBtn = false;
    var btnHasMoved = false;

    function initBtnDrag(e) {
      var startX = e.type === "touchstart" ? e.touches[0].clientX : e.clientX;
      var startY = e.type === "touchstart" ? e.touches[0].clientY : e.clientY;
      var rect = extBtn.getBoundingClientRect();
      var offsetX = startX - rect.left;
      var offsetY = startY - rect.top;

      btnHasMoved = false;
      isDraggingBtn = true;

      function onMove(ev) {
        if (!isDraggingBtn) return;
        ev.preventDefault(); // Crucial for clean touch drag
        var clientX = ev.type === "touchmove" ? ev.touches[0].clientX : ev.clientX;
        var clientY = ev.type === "touchmove" ? ev.touches[0].clientY : ev.clientY;

        if (!btnHasMoved) {
          if (Math.abs(clientX - startX) > 3 || Math.abs(clientY - startY) > 3) {
            btnHasMoved = true;
            extBtn.classList.add("dragging");
          } else {
            return; // Ignore small movements (like a click)
          }
        }
        
        ev.preventDefault(); // Crucial for clean touch drag

        var newX = clientX - offsetX;
        var newY = clientY - offsetY;

        var isMobile = window.innerWidth < 768;
        var minX = 8, minY = isMobile ? 8 : 0;
        var maxX = window.innerWidth - extBtn.offsetWidth - 8;
        var maxY = window.innerHeight - extBtn.offsetHeight - (isMobile ? 8 : 0);

        newX = Math.max(minX, Math.min(newX, maxX));
        newY = Math.max(minY, Math.min(newY, maxY));

        if (window.innerWidth >= 768) {
          // Desktop: Strictly Horizontal
          extBtn.style.left = newX + "px";
          extBtn.style.right = "auto";
          extBtn.style.bottom = "0px";
          extBtn.style.top = "auto";
        } else {
          // Mobile: Free move (will snap on end)
          extBtn.style.left = newX + "px";
          extBtn.style.top = newY + "px";
          extBtn.style.right = "auto";
          extBtn.style.bottom = "auto";
        }
      }


      function onEnd() {
        if (!isDraggingBtn) return;
        isDraggingBtn = false;
        extBtn.classList.remove("dragging");
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onEnd);
        document.removeEventListener("touchmove", onMove);
        document.removeEventListener("touchend", onEnd);

        if (btnHasMoved) {
          snapToEdges();
        }
      }

      document.addEventListener("mousemove", onMove, { passive: false });
      document.addEventListener("mouseup", onEnd);
      document.addEventListener("touchmove", onMove, { passive: false });
      document.addEventListener("touchend", onEnd);
    }

    extBtn.addEventListener("mousedown", initBtnDrag);
    extBtn.addEventListener("touchstart", initBtnDrag, { passive: false });

    extBtn.addEventListener("click", function(e) {
      if (btnHasMoved) return; // Prevent click if it was just dragged
      
      if (isChatListOpen) {
        // Send a message to Vue to cleanly close the UI
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: "FS_CHAT_CLOSE", payload: {} }, "*");
        }
      } else {
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: "FS_CHAT_OPEN_CHAT", payload: {} }, "*");
        }
        chatContainer.style.visibility = '';
        chatContainer.style.opacity = '1';
        chatContainer.style.zIndex = '9998';
      }
    });

    function applyContainerSize(w, payload = {}) {
      return; // Disable dynamic resizing for now
      let isEventPage = /\/events\//.test(window?.parent?.location.href);
      if (!isEventPage) return;
      // console.error("Applying c÷ntainer size for width", w,payload, isEventPage);

      if (payload.is_open && w < 768) {
        chatContainer.style.bottom = "0";
        chatContainer.style.right = "0";
        return;
      }

      if (w < 768) {
        chatContainer.style.bottom = "4rem";
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
      alwaysHideFloatingButton: "1",
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

        if(window.innerWidth < 768){
          chatContainer.style.width = "100vw";
          chatContainer.style.height = "100dvh";
        } else {
          chatContainer.style.width = String(window.innerWidth / 16) + "rem";
          chatContainer.style.height = String(window.innerHeight / 16) + "rem";
        }
      } else if (data.type === "FS_CHAT_READY") {
        extBtn.style.display = "flex";
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
  
        toggleHiddenClass(data.payload.is_open);

        if (data.payload.is_open !== undefined) {
          isChatListOpen = data.payload.is_open;
          if (!data.payload.is_open) {
            chatContainer.style.visibility = 'hidden';
            chatContainer.style.opacity = '0';
            chatContainer.style.zIndex = '-1';
            extBtn.classList.remove("is-open");
          } else {
            chatContainer.style.visibility = '';
            chatContainer.style.opacity = '1';
            chatContainer.style.zIndex = '9998';
            extBtn.classList.add("is-open");
          }
        }
        applyContainerSize(window.innerWidth, data.payload);
      } else if (data.type === "FS_CHAT_UNREAD_COUNT") {
        var count = data.payload || 0;
        var badge = document.getElementById("fs-chat-external-btn-badge");
        var text = document.getElementById("fs-chat-external-btn-text");
        if (badge && text) {
          if (count > 0) {
            badge.style.display = "flex";
            badge.innerText = count;
            text.innerText = count + " NEW MESSAGE" + (count !== 1 ? "S" : "");
            extBtn.setAttribute("data-animation-blink-widget", "true");
          } else {
            badge.style.display = "none";
            text.innerText = "Chat";
            extBtn.setAttribute("data-animation-blink-widget", "false");
          }
        }
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

    function toggleHiddenClass( isChatOpen = true) {
      return; // Disable hiding the widget for now, as it causes issues with the new floating button behavior
      if (window?._fs_hide_chat_widget) {
        if (isChatOpen) {
          document.body.classList.remove('hide-chat-widget');
        } else {
          document.body.classList.add('hide-chat-widget');
        }
      } else {
        document.body.classList.remove('hide-chat-widget');
      }
    }

    function openChat(options) {
      if (!iframe.contentWindow) return;
      toggleHiddenClass();
      iframe.contentWindow.postMessage({
        type: "FS_CHAT_OPEN_CHAT",
        payload: options || {},
      }, "*");
      setFloatingButtonVisibility(!window?._fs_hide_chat_widget);
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

    function setFloatingButtonVisibility(visible) {
      if (!iframe.contentWindow) return;
      iframe.contentWindow.postMessage({
        type: "FS_CHAT_SET_FLOATING_BUTTON",
        payload: { hidden: !visible },
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
      setFloatingButtonVisibility: setFloatingButtonVisibility,
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
