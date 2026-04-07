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

  function mountChatEmbed(target, options) {
    var container = typeof target === "string"
      ? document.querySelector(target)
      : (target && target.nodeType === 1 ? target : null);

    if (!container) {
      throw new Error("FSChatEmbed.mountChatEmbed could not find the target container.");
    }

    var settings = Object.assign({
      src:           "/wp-content/plugins/fansocial/bookings-embed/chat.html",
      currentUserId: null,
      userRole:      "fan",
      apiBaseUrl:    "",
      openChatId:    null,
      iframeTitle:   "Chat",
      width:         CHAT_EMBED_WIDTH,
      height:        CHAT_EMBED_HEIGHT,
    }, options || {});

    if (!settings.currentUserId) {
      throw new Error("FSChatEmbed.mountChatEmbed requires a currentUserId.");
    }

    var chatContainer = document.createElement("div");
    Object.assign(chatContainer.style, {
      position:      "fixed",
      bottom:        "0",
      right:         "0",
      width:         String(settings.width)  + "px",
      height:        String(settings.height) + "px",
      zIndex:        "99999",
      background:    "transparent",
      overflow:      "visible",
      pointerEvents: "none",
    });

    var iframe = document.createElement("iframe");
    iframe.src = buildIframeSrcWithQuery(settings.src, {
      currentUserId: String(settings.currentUserId),
      userRole:      settings.userRole || "fan",
      apiBaseUrl:    settings.apiBaseUrl || null,
      openChatId:    settings.openChatId || null,
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
      }
    }

    window.addEventListener("message", onMessage);

    return {
      iframe:    iframe,
      container: chatContainer,
      destroy: function () {
        window.removeEventListener("message", onMessage);
        if (chatContainer.parentNode) {
          chatContainer.parentNode.removeChild(chatContainer);
        }
      },
    };
  }

  global.FSChatEmbed = { mountChatEmbed: mountChatEmbed };
})(window);
