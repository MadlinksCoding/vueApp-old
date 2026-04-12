(function (global) {
  var FS_EVENTS_BOOTSTRAP = "FS_EVENTS_BOOTSTRAP";
  var FS_EVENTS_CHILD_READY = "FS_EVENTS_CHILD_READY";
  var FS_EVENTS_RESIZE = "FS_EVENTS_RESIZE";
  var FS_EVENTS_OPEN_URL = "FS_EVENTS_OPEN_URL";
  var FS_FAN_BOOKING_BOOTSTRAP = "FS_FAN_BOOKING_BOOTSTRAP";
  var FS_FAN_BOOKING_CHILD_READY = "FS_FAN_BOOKING_CHILD_READY";
  var FS_FAN_BOOKING_CLOSE_REQUEST = "FS_FAN_BOOKING_CLOSE_REQUEST";
  var FS_FAN_BOOKING_CREATED = "FS_FAN_BOOKING_CREATED";
  var FS_FAN_BOOKING_FAILED = "FS_FAN_BOOKING_FAILED";
  var FS_FAN_BOOKING_DEBUG = "FS_FAN_BOOKING_DEBUG";

  var activeOneOnOnePopup = null;

  function isFanBookingDebugEnabled(options) {
    if (options && options.debug === true) return true;

    try {
      if (global.__FSFanBookingDebug === true) return true;
      if (global.__FSFanBookingDebug && global.__FSFanBookingDebug.enabled === true) return true;
      if (global.localStorage) {
        var stored = global.localStorage.getItem("fsFanBookingDebug");
        if (stored === "1" || stored === "true") return true;
      }
      var params = new URLSearchParams(global.location.search || "");
      return params.get("debugFanBooking") === "1"
        || params.get("debugBooking") === "1"
        || params.get("debug") === "1";
    } catch (_error) {
      return false;
    }
  }

  function logFanBookingDebug(scope, event, payload, options) {
    if (!isFanBookingDebugEnabled(options)) return;

    try {
      if (!global.__FSFanBookingDebug || global.__FSFanBookingDebug === true) {
        global.__FSFanBookingDebug = {
          enabled: true,
          entries: [],
        };
      }

      if (Array.isArray(global.__FSFanBookingDebug.entries)) {
        global.__FSFanBookingDebug.entries.push({
          at: new Date().toISOString(),
          scope: scope,
          event: event,
          payload: payload === undefined ? null : payload,
        });
      }

      console.log("[FSFanBooking][" + scope + "] " + event, payload === undefined ? "" : payload);
    } catch (_error) {
      // Ignore debug logging issues.
    }
  }

  function resolveElement(target) {
    if (!target) return null;
    if (typeof target === "string") return document.querySelector(target);
    return target.nodeType === 1 ? target : null;
  }

  function normalizeTargetOrigin(value) {
    if (typeof value === "string" && value.trim()) return value.trim();
    return window.location.origin;
  }

  function safeNumber(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function normalizeCreatorData(value) {
    var input = value && typeof value === "object" ? value : {};
    var avatar = typeof input.avatar === "string" ? input.avatar.trim() : "";
    var name = typeof input.name === "string" ? input.name.trim() : "";
    var isVerified = null;

    if (typeof input.isVerified === "boolean") {
      isVerified = input.isVerified;
    } else if (typeof input.isVerified === "number") {
      if (input.isVerified === 1) isVerified = true;
      if (input.isVerified === 0) isVerified = false;
    } else if (typeof input.isVerified === "string") {
      var normalized = input.isVerified.trim().toLowerCase();
      if (normalized === "true" || normalized === "1") isVerified = true;
      if (normalized === "false" || normalized === "0") isVerified = false;
    }

    return {
      avatar: avatar || null,
      name: name || null,
      isVerified: isVerified,
    };
  }

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

  function createElement(tagName, styles) {
    var element = document.createElement(tagName);
    if (styles) {
      Object.keys(styles).forEach(function (key) {
        element.style[key] = styles[key];
      });
    }
    return element;
  }

  function lockBodyScroll() {
    var previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return function unlockBodyScroll() {
      document.body.style.overflow = previousOverflow;
    };
  }

  function openUrl(payload, options) {
    if (!payload || !payload.url) return;

    if (typeof options.onOpenUrl === "function") {
      options.onOpenUrl(payload);
      return;
    }

    var target = payload.target || "_blank";
    if (target === "_blank") {
      window.open(payload.url, "_blank", "noopener");
      return;
    }

    if (target === "_top" && window.top) {
      window.top.location.assign(payload.url);
      return;
    }

    window.location.assign(payload.url);
  }

  function mount(target, options) {
    var container = resolveElement(target);
    if (!container) {
      throw new Error("FSEventsEmbed.mount could not find the target container.");
    }

    var settings = Object.assign({
      src: "/wp-content/plugins/fansocial/bookings-embed/index.html",
      creatorId: null,
      fanId: null,
      userRole: "creator",
      apiBaseUrl: "",
      jwtToken: "",
      initialRoute: "events",
      creatorData: null,
      targetOrigin: window.location.origin,
      iframeTitle: "Bookings Embed",
      minHeight: 720,
    }, options || {});

    var creatorData = normalizeCreatorData(settings.creatorData);

    var iframe = document.createElement("iframe");
    iframe.src = buildIframeSrcWithQuery(settings.src, {
      creatorId: safeNumber(settings.creatorId, null),
      fanId: safeNumber(settings.fanId, null),
      eventId: settings.eventId == null || settings.eventId === "" ? null : String(settings.eventId),
      apiBaseUrl: settings.apiBaseUrl || "",
      jwtToken: settings.jwtToken || "",
      creatorAvatar: creatorData.avatar,
      creatorName: creatorData.name,
      creatorVerified: creatorData.isVerified,
    });
    iframe.title = settings.iframeTitle;
    iframe.loading = "lazy";
    iframe.style.width = "100%";
    iframe.style.border = "0";
    iframe.style.display = "block";
    iframe.setAttribute("scrolling", "no");

    var targetOrigin = normalizeTargetOrigin(settings.targetOrigin);

    function sendBootstrap() {
      if (!iframe.contentWindow) return;

      iframe.contentWindow.postMessage({
        type: FS_EVENTS_BOOTSTRAP,
        payload: {
          creatorId: safeNumber(settings.creatorId, null),
          fanId: safeNumber(settings.fanId, null),
          userRole: settings.userRole || "creator",
          apiBaseUrl: settings.apiBaseUrl || "",
          jwtToken: settings.jwtToken || "",
          initialRoute: settings.initialRoute || "events",
          creatorData: creatorData,
        },
      }, targetOrigin);
    }

    function onMessage(event) {
      if (event.source !== iframe.contentWindow) return;

      var data = event.data || {};
      if (data.type === FS_EVENTS_CHILD_READY) {
        sendBootstrap();
        return;
      }

      if (data.type === FS_EVENTS_RESIZE) {
        var nextHeight = safeNumber(data.payload && data.payload.height, null);
        var resizeMode = data.payload && data.payload.mode;

        if (resizeMode === "viewport") {
          iframe.style.height = "100vh";
          return;
        }

        iframe.style.height = String(nextHeight) + "px";
        return;
      }

      if (data.type === FS_EVENTS_OPEN_URL) {
        openUrl(data.payload || {}, settings);
      }
    }

    window.addEventListener("message", onMessage);
    container.innerHTML = "";
    container.appendChild(iframe);

    return {
      iframe: iframe,
      sendBootstrap: sendBootstrap,
      destroy: function () {
        window.removeEventListener("message", onMessage);
        if (iframe.parentNode === container) {
          container.removeChild(iframe);
        }
      },
    };
  }

  function openFanBookingPopup(options) {
    if (activeOneOnOnePopup) {
      activeOneOnOnePopup.destroy({ invokeOnClose: false });
    }

    var settings = Object.assign({
      src: "/wp-content/plugins/fansocial/bookings-embed/fan-booking.html",
      creatorId: null,
      fanId: null,
      eventId: null,
      apiBaseUrl: "",
      jwtToken: "",
      creatorData: null,
      debug: false,
      targetOrigin: window.location.origin,
      iframeTitle: "One On One Booking Popup",
      closeOnOverlayClick: true,
      escToClose: true,
    }, options || {});

    if (safeNumber(settings.creatorId, null) == null) {
      throw new Error("FSEventsEmbed.openFanBookingPopup requires a creatorId.");
    }

    if (safeNumber(settings.fanId, null) == null) {
      throw new Error("FSEventsEmbed.openFanBookingPopup requires a fanId.");
    }

    var targetOrigin = normalizeTargetOrigin(settings.targetOrigin);
    var creatorData = normalizeCreatorData(settings.creatorData);
    var unlockBodyScroll = lockBodyScroll();
    var isDestroyed = false;
    var closeInvoked = false;

    var overlay = createElement("div", {
      position: "fixed",
      inset: "0",
      zIndex: "99999",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "16px",
      // background: "rgba(12, 17, 29, 0.76)",
      backdropFilter: "blur(4px)",
    });

    var modal = createElement("div", {
      position: "relative",
      width: "min(960px, calc(100vw - 32px))",
      height: "min(760px, calc(100vh - 32px))",
      maxWidth: "960px",
      maxHeight: "760px",
      borderRadius: "20px",
      overflow: "hidden",
      // background: "#0C111D",
      // boxShadow: "0 24px 80px rgba(0, 0, 0, 0.38)",
    });

    var closeButton = createElement("button", {
      position: "absolute",
      top: "12px",
      right: "12px",
      zIndex: "2",
      width: "40px",
      height: "40px",
      border: "0",
      borderRadius: "9999px",
      cursor: "pointer",
      color: "#FFFFFF",
      fontSize: "22px",
      lineHeight: "1",
      background: "rgba(12, 17, 29, 0.72)",
      backdropFilter: "blur(8px)",
    });
    closeButton.type = "button";
    closeButton.setAttribute("aria-label", "Close booking popup");
    closeButton.textContent = "×";

    var iframe = createElement("iframe", {
      width: "100%",
      height: "100%",
      border: "0",
      display: "block",
      // background: "#0C111D",
    });
    iframe.src = buildIframeSrcWithQuery(settings.src, {
      creatorId: safeNumber(settings.creatorId, null),
      fanId: safeNumber(settings.fanId, null),
      eventId: settings.eventId == null || settings.eventId === "" ? null : String(settings.eventId),
      apiBaseUrl: settings.apiBaseUrl || "",
      jwtToken: settings.jwtToken || "",
      creatorAvatar: creatorData.avatar,
      creatorName: creatorData.name,
      creatorVerified: creatorData.isVerified,
      debugFanBooking: isFanBookingDebugEnabled(settings) ? 1 : null,
    });
    iframe.title = settings.iframeTitle;
    iframe.loading = "eager";
    iframe.setAttribute("scrolling", "no");

    function sendBootstrap() {
      if (!iframe.contentWindow) return;

      logFanBookingDebug("host", "sendBootstrap", {
        creatorId: safeNumber(settings.creatorId, null),
        fanId: safeNumber(settings.fanId, null),
        eventId: settings.eventId == null || settings.eventId === "" ? null : String(settings.eventId),
        apiBaseUrl: settings.apiBaseUrl || "",
        jwtToken: settings.jwtToken || "",
        creatorData: creatorData,
        iframeSrc: iframe.src,
      }, settings);

      iframe.contentWindow.postMessage({
        type: FS_FAN_BOOKING_BOOTSTRAP,
        payload: {
          creatorId: safeNumber(settings.creatorId, null),
          fanId: safeNumber(settings.fanId, null),
          eventId: settings.eventId == null || settings.eventId === "" ? null : String(settings.eventId),
          apiBaseUrl: settings.apiBaseUrl || "",
          jwtToken: settings.jwtToken || "",
          creatorData: creatorData,
        },
      }, targetOrigin);
    }

    function invokeOnClose() {
      if (closeInvoked) return;
      closeInvoked = true;
      if (typeof settings.onClose === "function") {
        settings.onClose();
      }
    }

    function destroy(options) {
      var destroyOptions = Object.assign({ invokeOnClose: true }, options || {});
      if (isDestroyed) return;
      isDestroyed = true;
      window.removeEventListener("message", onMessage);
      window.removeEventListener("keydown", onKeyDown);
      unlockBodyScroll();

      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }

      if (activeOneOnOnePopup && activeOneOnOnePopup.iframe === iframe) {
        activeOneOnOnePopup = null;
      }

      if (destroyOptions.invokeOnClose) {
        invokeOnClose();
      }
    }

    function close() {
      logFanBookingDebug("host", "close", {}, settings);
      destroy({ invokeOnClose: true });
    }

    function onMessage(event) {
      if (event.source !== iframe.contentWindow) return;

      var data = event.data || {};
      if (data.type === FS_FAN_BOOKING_DEBUG) {
        logFanBookingDebug("child", data.payload && data.payload.event, data.payload || {}, settings);
        return;
      }

      logFanBookingDebug("host", "message", {
        type: data.type,
        payload: data.payload || {},
        origin: event.origin,
      }, settings);
      if (data.type === FS_FAN_BOOKING_CHILD_READY) {
        sendBootstrap();
        return;
      }

      if (data.type === FS_FAN_BOOKING_CLOSE_REQUEST) {
        close();
        return;
      }

      if (data.type === FS_FAN_BOOKING_CREATED) {
        if (typeof settings.onBookingCreated === "function") {
          settings.onBookingCreated(data.payload || {});
        }
        return;
      }

      if (data.type === FS_FAN_BOOKING_FAILED) {
        if (typeof settings.onBookingFailed === "function") {
          settings.onBookingFailed(data.payload || {});
        }
      }
    }

    function onKeyDown(event) {
      if (!settings.escToClose) return;
      if (event.key === "Escape") {
        close();
      }
    }

    if (settings.closeOnOverlayClick) {
      overlay.addEventListener("click", function (event) {
        if (event.target === overlay) {
          close();
        }
      });
    }

    closeButton.addEventListener("click", close);
    modal.addEventListener("click", function (event) {
      event.stopPropagation();
    });

    // modal.appendChild(closeButton);
    modal.appendChild(iframe);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    iframe.addEventListener("load", sendBootstrap);
    logFanBookingDebug("host", "popup-open", {
      iframeSrc: iframe.src,
      creatorId: safeNumber(settings.creatorId, null),
      fanId: safeNumber(settings.fanId, null),
      eventId: settings.eventId == null || settings.eventId === "" ? null : String(settings.eventId),
      creatorData: creatorData,
    }, settings);
    window.addEventListener("message", onMessage);
    window.addEventListener("keydown", onKeyDown);

    activeOneOnOnePopup = {
      iframe: iframe,
      overlay: overlay,
      close: close,
      destroy: destroy,
    };
    global.__FSFanBookingActivePopup = activeOneOnOnePopup;

    return activeOneOnOnePopup;
  }

  global.FSEventsEmbed = {
    mount: mount,
    openFanBookingPopup: openFanBookingPopup,
  };
})(window);
