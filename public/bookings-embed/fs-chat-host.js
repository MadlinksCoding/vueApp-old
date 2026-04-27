(function (global) {
  var CHAT_EMBED_WIDTH  = 360;
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
      src:           "/wp-content/plugins/fansocial/bookings-embed/chat.html",
      currentUserId: null,
      userRole:      "fan",
      apiBaseUrl:    "https://fs-bookings-backend.onrender.com",
      openChatId:    null,
      fanUid:        null,
      jwtToken:      defaultJwtToken,
      iframeTitle:   "Chat",
      width:         CHAT_EMBED_WIDTH,
      height:        CHAT_EMBED_HEIGHT,
    }, options || {});

    if (!settings.currentUserId) {
      throw new Error("FSChatEmbed.mountChatEmbed requires a currentUserId.");
    }

    settings.fanUid = resolveFanUid(settings.fanUid);

    var chatContainer = document.createElement("div");
    Object.assign(chatContainer.style, {
      position:      "fixed",
      bottom:        "0",
      right:         "0",
      width:         String(settings.width)  + "px",
      height:        String(settings.height) + "px",
      zIndex:        "9998",
      background:    "transparent",
      overflow:      "visible",
      pointerEvents: "none",
    });

    function applyContainerSize(w, payload ={}) {
      let isEventPage = /\/events\//.test(window?.parent?.location.href);
      if ( !isEventPage ) return;
      // console.error("Applying c÷ntainer size for width", w,payload, isEventPage);

      if (w < 768) {
        // if( payload?.width &&
        // chatContainer.style.width  = "60px";
        // chatContainer.style.height = "40px";
        chatContainer.style.bottom = "4.5rem";
      } else {
        // chatContainer.style.width  = String(settings.width)  + "px";
        // chatContainer.style.height = String(settings.height) + "px";
        chatContainer.style.bottom = "0";
      }
    }

    var iframe = document.createElement("iframe");
    iframe.src = buildIframeSrcWithQuery(settings.src, {
      currentUserId: String(settings.currentUserId),
      userRole:      settings.userRole || "fan",
      apiBaseUrl:    settings.apiBaseUrl || null,
      openChatId:    settings.openChatId || null,
      fanUid:        settings.fanUid || null,
      jwtToken:      settings.jwtToken || null,
      hostWidth:     window.innerWidth,
    });
    iframe.title                = settings.iframeTitle;
    iframe.style.width          = "100%";
    iframe.style.height         = "100%";
    iframe.style.border         = "0";
    iframe.style.background     = "transparent";
    iframe.style.display        = "block";
    iframe.style.pointerEvents  = "auto";
    iframe.allowTransparency    = "true";
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
      if (data.type === "FS_CHAT_FULLSCREEN") {
        chatContainer.style.width  = String(window.innerWidth)  + "px";
        chatContainer.style.height = String(window.innerHeight) + "px";
      } else if (data.type === "FS_CHAT_RESIZE" && data.payload) {
        var w = data.payload.width;
        var h = data.payload.height;
        if (w > 0) chatContainer.style.width  = String(w) + "px";
        if (h > 0) chatContainer.style.height = String(h) + "px";
        applyContainerSize(window.innerWidth, data.payload);
      } else if (data.type === "FS_CHAT_TOPUP_REQUIRED") {
        var p = data.payload || {};
        if (typeof window.openTipPopup === "function") {
          window.openTipPopup({
            creator_id:            p.creatorUserId  || 0,
            user_id:               p.currentUserId  || 0,
            tip_type:              "token",
            topup_amount:          p.requiredTokens || 0,
            is_call_topup_and_tip: true,
            is_tip_from_php:       true,
            topupFor:              p.topupFor || "booking_confirm",
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

    window.addEventListener("message", onMessage);
    window.addEventListener("resize", onHostResize);

    return {
      iframe:      iframe,
      container:   chatContainer,
      updateAuth:  updateAuth,
      refreshProductRecommendation: function (payload) {
        iframe.contentWindow.postMessage({
          type: "FS_CHAT_PRODUCT_REFRESH",
          payload: Object.assign({ reason: "purchase_success" }, payload || {}),
        }, "*");
      },
      destroy: function () {
        window.removeEventListener("message", onMessage);
        window.removeEventListener("resize", onHostResize);
        if (chatContainer.parentNode) {
          chatContainer.parentNode.removeChild(chatContainer);
        }
      },
    };
  }

  global.FSChatEmbed = { mountChatEmbed: mountChatEmbed };
})(window);
