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
  var EVENTS_EMBED_ROOT_CLASS = "fs-events-embed";
  var EVENTS_EMBED_IFRAME_CLASS = "fs-events-embed__iframe";
  var EVENTS_EMBED_IFRAME_CONTENT_CLASS = "fs-events-embed__iframe--content";
  var EVENTS_EMBED_IFRAME_VIEWPORT_CLASS = "fs-events-embed__iframe--viewport";
  var FAN_BOOKING_POPUP_CLASS = "fs-fan-booking-popup";
  var FAN_BOOKING_POPUP_OVERLAY_CLASS = "fs-fan-booking-popup__overlay";
  var FAN_BOOKING_POPUP_MODAL_CLASS = "fs-fan-booking-popup__modal";
  var FAN_BOOKING_POPUP_IFRAME_CLASS = "fs-fan-booking-popup__iframe";
  var FAN_BOOKING_POPUP_CLOSE_CLASS = "fs-fan-booking-popup__close";
  var FAN_BOOKING_POPUP_LOADING_CLASS = "fs-fan-booking-popup__loading";
  var FAN_BOOKING_POPUP_LOADING_VISIBLE_CLASS = "fs-fan-booking-popup__loading--visible";
  var FAN_BOOKING_POPUP_LOADING_HIDDEN_CLASS = "fs-fan-booking-popup__loading--hidden";
  var FAN_BOOKING_SKELETON_TEMPLATE_PATH = "fan-booking-loading-skeleton.html";
  var FAN_BOOKING_LOADING_FALLBACK_DELAY_MS = 180;
  var fanBookingSkeletonTemplateCache = null;
  var fanBookingSkeletonTemplatePromise = null;

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

  function safePositiveNumber(value, fallback) {
    var parsed = safeNumber(value, fallback);
    if (parsed === null || parsed === undefined) return fallback;
    return parsed > 0 ? parsed : fallback;
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

  function createElement(tagName, classNames, attributes) {
    var element = document.createElement(tagName);

    if (Array.isArray(classNames)) {
      classNames.forEach(function (className) {
        if (!className) return;
        element.classList.add(className);
      });
    } else if (typeof classNames === "string" && classNames.trim()) {
      element.className = classNames.trim();
    }

    if (attributes && typeof attributes === "object") {
      Object.keys(attributes).forEach(function (key) {
        var value = attributes[key];
        if (value === null || value === undefined || value === false) return;
        if (value === true) {
          element.setAttribute(key, "");
          return;
        }
        element.setAttribute(key, String(value));
      });
    }

    return element;
  }

  function getHostScriptUrl() {
    if (typeof document === "undefined") return "";

    if (document.currentScript && document.currentScript.src) {
      return document.currentScript.src;
    }

    var scripts = document.getElementsByTagName("script");
    for (var index = scripts.length - 1; index >= 0; index -= 1) {
      var src = scripts[index] && scripts[index].src;
      if (typeof src === "string" && src.indexOf("fs-events-host.js") !== -1) {
        return src;
      }
    }

    return "";
  }

  function resolveHostAssetUrl(fileName) {
    if (typeof fileName !== "string" || !fileName) return "";

    var hostScriptUrl = getHostScriptUrl();
    if (!hostScriptUrl) return fileName;

    try {
      return new URL(fileName, hostScriptUrl).toString();
    } catch (_error) {
      return fileName;
    }
  }

  function getFallbackFanBookingSkeletonHtml() {
    return [
      '<div class="fs-fan-booking-skeleton" aria-hidden="true">',
      '  <div class="fs-fan-booking-skeleton__header">',
      '    <div class="fs-fan-booking-skeleton__chip"></div>',
      '    <div class="fs-fan-booking-skeleton__pager"></div>',
      "  </div>",
      '  <div class="fs-fan-booking-skeleton__hero">',
      '    <div class="fs-fan-booking-skeleton__title fs-fan-booking-skeleton__line"></div>',
      '    <div class="fs-fan-booking-skeleton__price fs-fan-booking-skeleton__line"></div>',
      "  </div>",
      '  <div class="fs-fan-booking-skeleton__content">',
      '    <div class="fs-fan-booking-skeleton__line"></div>',
      '    <div class="fs-fan-booking-skeleton__line fs-fan-booking-skeleton__line--short"></div>',
      '    <div class="fs-fan-booking-skeleton__line"></div>',
      "  </div>",
      '  <div class="fs-fan-booking-skeleton__footer">',
      '    <div class="fs-fan-booking-skeleton__button"></div>',
      "  </div>",
      "</div>",
    ].join("");
  }

  function preloadFanBookingSkeletonTemplate() {
    if (fanBookingSkeletonTemplatePromise) return fanBookingSkeletonTemplatePromise;

    if (typeof fetch !== "function") {
      fanBookingSkeletonTemplatePromise = Promise.resolve(null);
      return fanBookingSkeletonTemplatePromise;
    }

    fanBookingSkeletonTemplatePromise = fetch(resolveHostAssetUrl(FAN_BOOKING_SKELETON_TEMPLATE_PATH), {
      credentials: "same-origin",
    })
      .then(function (response) {
        if (!response.ok) return null;
        return response.text();
      })
      .then(function (html) {
        var normalized = typeof html === "string" ? html.trim() : "";
        fanBookingSkeletonTemplateCache = normalized || null;
        return fanBookingSkeletonTemplateCache;
      })
      .catch(function () {
        fanBookingSkeletonTemplateCache = null;
        return null;
      });

    return fanBookingSkeletonTemplatePromise;
  }

  function createFanBookingLoadingLayer() {
    var loadingLayer = createElement("div", [
      FAN_BOOKING_POPUP_LOADING_CLASS,
      FAN_BOOKING_POPUP_LOADING_VISIBLE_CLASS,
    ]);
    loadingLayer.innerHTML = fanBookingSkeletonTemplateCache || getFallbackFanBookingSkeletonHtml();
    return loadingLayer;
  }

  function applyFanBookingSkeletonTemplate(loadingLayer, html) {
    if (!loadingLayer || !loadingLayer.parentNode) return;
    if (loadingLayer.classList.contains(FAN_BOOKING_POPUP_LOADING_HIDDEN_CLASS)) return;
    if (typeof html !== "string" || !html.trim()) return;
    loadingLayer.innerHTML = html;
  }

  function hideFanBookingLoadingLayer(loadingLayer) {
    if (!loadingLayer || !loadingLayer.parentNode) return;

    loadingLayer.classList.remove(FAN_BOOKING_POPUP_LOADING_VISIBLE_CLASS);
    loadingLayer.classList.add(FAN_BOOKING_POPUP_LOADING_HIDDEN_CLASS);

    global.setTimeout(function () {
      if (loadingLayer.parentNode) {
        loadingLayer.parentNode.removeChild(loadingLayer);
      }
    }, 220);
  }

  function setIframeHeightMode(iframe, mode, nextHeight) {
    if (!iframe) return;

    iframe.classList.remove(EVENTS_EMBED_IFRAME_CONTENT_CLASS, EVENTS_EMBED_IFRAME_VIEWPORT_CLASS);

    if (mode === "viewport") {
      iframe.classList.add(EVENTS_EMBED_IFRAME_VIEWPORT_CLASS);
      iframe.style.removeProperty("--fs-events-embed-height");
      return;
    }

    iframe.classList.add(EVENTS_EMBED_IFRAME_CONTENT_CLASS);
    if (Number.isFinite(Number(nextHeight))) {
      iframe.style.setProperty("--fs-events-embed-height", String(Number(nextHeight)) + "px");
    } else {
      iframe.style.removeProperty("--fs-events-embed-height");
    }
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

    var wrapper = createElement("div", EVENTS_EMBED_ROOT_CLASS);
    wrapper.style.setProperty("--fs-events-embed-min-height", String(Math.max(320, safeNumber(settings.minHeight, 720))) + "px");

    var iframe = createElement("iframe", [
      EVENTS_EMBED_IFRAME_CLASS,
      EVENTS_EMBED_IFRAME_CONTENT_CLASS,
    ]);
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
    iframe.setAttribute("scrolling", "no");
    setIframeHeightMode(iframe, "content", settings.minHeight);

    var targetOrigin = normalizeTargetOrigin(settings.targetOrigin);

    function sendBootstrap() {
      if (!iframe.contentWindow) return;

      iframe.contentWindow.postMessage({
        type: FS_EVENTS_BOOTSTRAP,
        payload: {
          creatorId: safePositiveNumber(settings.creatorId, null),
          fanId: safePositiveNumber(settings.fanId, null),
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
        setIframeHeightMode(iframe, resizeMode === "viewport" ? "viewport" : "content", nextHeight);
        return;
      }

      if (data.type === FS_EVENTS_OPEN_URL) {
        openUrl(data.payload || {}, settings);
      }
    }

    window.addEventListener("message", onMessage);
    container.innerHTML = "";
    wrapper.appendChild(iframe);
    container.appendChild(wrapper);

    return {
      root: wrapper,
      iframe: iframe,
      sendBootstrap: sendBootstrap,
      destroy: function () {
        window.removeEventListener("message", onMessage);
        if (wrapper.parentNode === container) {
          container.removeChild(wrapper);
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

    if (safePositiveNumber(settings.creatorId, null) == null) {
      throw new Error("FSEventsEmbed.openFanBookingPopup requires a positive creatorId.");
    }

    if (safePositiveNumber(settings.fanId, null) == null) {
      throw new Error("FSEventsEmbed.openFanBookingPopup requires a positive fanId.");
    }

    var targetOrigin = normalizeTargetOrigin(settings.targetOrigin);
    var creatorData = normalizeCreatorData(settings.creatorData);
    var unlockBodyScroll = lockBodyScroll();
    var isDestroyed = false;
    var closeInvoked = false;
    var isChildReady = false;
    var isLoadingLayerHidden = false;
    var loadingFallbackTimer = null;

    var overlay = createElement("div", [
      FAN_BOOKING_POPUP_CLASS,
      FAN_BOOKING_POPUP_OVERLAY_CLASS,
    ]);

    var modal = createElement("div", FAN_BOOKING_POPUP_MODAL_CLASS);
    modal.style.setProperty("--fs-fan-booking-popup-width", "min(960px, calc(100vw - 32px))");
    modal.style.setProperty("--fs-fan-booking-popup-height", "min(760px, calc(100vh - 32px))");

    var iframe = createElement("iframe", FAN_BOOKING_POPUP_IFRAME_CLASS);
    var loadingLayer = createFanBookingLoadingLayer();
    iframe.title = settings.iframeTitle;
    iframe.loading = "eager";
    iframe.setAttribute("scrolling", "no");

    var iframeSrc = buildIframeSrcWithQuery(settings.src, {
      creatorId: safePositiveNumber(settings.creatorId, null),
      fanId: safePositiveNumber(settings.fanId, null),
      eventId: settings.eventId == null || settings.eventId === "" ? null : String(settings.eventId),
      apiBaseUrl: settings.apiBaseUrl || "",
      jwtToken: settings.jwtToken || "",
      creatorAvatar: creatorData.avatar,
      creatorName: creatorData.name,
      creatorVerified: creatorData.isVerified,
      debugFanBooking: isFanBookingDebugEnabled(settings) ? 1 : null,
    });

    function sendBootstrap() {
      if (!iframe.contentWindow) return;

      logFanBookingDebug("host", "sendBootstrap", {
        creatorId: safePositiveNumber(settings.creatorId, null),
        fanId: safePositiveNumber(settings.fanId, null),
        eventId: settings.eventId == null || settings.eventId === "" ? null : String(settings.eventId),
        apiBaseUrl: settings.apiBaseUrl || "",
        jwtToken: settings.jwtToken || "",
        creatorData: creatorData,
        iframeSrc: iframe.src,
      }, settings);

      iframe.contentWindow.postMessage({
        type: FS_FAN_BOOKING_BOOTSTRAP,
        payload: {
          creatorId: safePositiveNumber(settings.creatorId, null),
          fanId: safePositiveNumber(settings.fanId, null),
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

    function clearLoadingFallbackTimer() {
      if (loadingFallbackTimer != null) {
        global.clearTimeout(loadingFallbackTimer);
        loadingFallbackTimer = null;
      }
    }

    function hideLoadingLayer(reason) {
      if (isLoadingLayerHidden) return;
      isLoadingLayerHidden = true;
      clearLoadingFallbackTimer();
      logFanBookingDebug("host", "hideLoadingLayer", { reason: reason }, settings);
      hideFanBookingLoadingLayer(loadingLayer);
    }

    function scheduleLoadingFallbackHide() {
      if (isChildReady || isLoadingLayerHidden || isDestroyed) return;
      clearLoadingFallbackTimer();
      loadingFallbackTimer = global.setTimeout(function () {
        if (isDestroyed || isChildReady || isLoadingLayerHidden) return;
        hideLoadingLayer("iframe-load-fallback");
      }, FAN_BOOKING_LOADING_FALLBACK_DELAY_MS);
    }

    function destroy(options) {
      var destroyOptions = Object.assign({ invokeOnClose: true }, options || {});
      if (isDestroyed) return;
      isDestroyed = true;
      clearLoadingFallbackTimer();
      window.removeEventListener("message", onMessage);
      window.removeEventListener("keydown", onKeyDown);
      iframe.removeEventListener("load", onIframeLoad);
      unlockBodyScroll();

      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }

      if (activeOneOnOnePopup && activeOneOnOnePopup.iframe === iframe) {
        activeOneOnOnePopup = null;
      }

      if (global.__FSFanBookingActivePopup && global.__FSFanBookingActivePopup.iframe === iframe) {
        global.__FSFanBookingActivePopup = null;
      }

      if (destroyOptions.invokeOnClose) {
        invokeOnClose();
      }
    }

    function close() {
      logFanBookingDebug("host", "close", {}, settings);
      destroy({ invokeOnClose: true });
    }

    function onIframeLoad() {
      logFanBookingDebug("host", "iframe-load", {
        iframeSrc: iframe.src,
        isChildReady: isChildReady,
      }, settings);
      sendBootstrap();
      scheduleLoadingFallbackHide();
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
        isChildReady = true;
        hideLoadingLayer("child-ready");
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

    modal.addEventListener("click", function (event) {
      event.stopPropagation();
    });

    modal.appendChild(iframe);
    modal.appendChild(loadingLayer);
    overlay.appendChild(modal);
    window.addEventListener("message", onMessage);
    window.addEventListener("keydown", onKeyDown);
    iframe.addEventListener("load", onIframeLoad);
    logFanBookingDebug("host", "popup-open", {
      iframeSrc: iframeSrc,
      creatorId: safePositiveNumber(settings.creatorId, null),
      fanId: safePositiveNumber(settings.fanId, null),
      eventId: settings.eventId == null || settings.eventId === "" ? null : String(settings.eventId),
      creatorData: creatorData,
    }, settings);
    document.body.appendChild(overlay);

    preloadFanBookingSkeletonTemplate().then(function (html) {
      applyFanBookingSkeletonTemplate(loadingLayer, html);
    });

    iframe.src = iframeSrc;

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

  preloadFanBookingSkeletonTemplate();
})(window);
