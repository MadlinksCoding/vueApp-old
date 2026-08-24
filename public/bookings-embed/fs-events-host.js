(function (global) {
  var FS_EVENTS_BOOTSTRAP = "FS_EVENTS_BOOTSTRAP";
  var FS_EVENTS_AUTH_UPDATE = "FS_EVENTS_AUTH_UPDATE";
  var FS_EVENTS_CHILD_READY = "FS_EVENTS_CHILD_READY";
  var FS_EVENTS_RESIZE = "FS_EVENTS_RESIZE";
  var FS_EVENTS_OPEN_URL = "FS_EVENTS_OPEN_URL";
  var FS_EVENTS_SCROLL_TO_TOP = "FS_EVENTS_SCROLL_TO_TOP";
  var FS_EVENTS_FORM_DIRTY_STATE = "FS_EVENTS_FORM_DIRTY_STATE";
  var FS_EVENTS_FORM_OPEN_STATE = "FS_EVENTS_FORM_OPEN_STATE";
  var FS_EVENTS_BOOKING_DETAILS_VISIBILITY = "FS_EVENTS_BOOKING_DETAILS_VISIBILITY";
  var FS_EVENTS_BOOKING_DETAILS_READY = "FS_EVENTS_BOOKING_DETAILS_READY";
  var FS_EVENTS_BOOKING_DETAILS_CLOSE_REQUEST = "FS_EVENTS_BOOKING_DETAILS_CLOSE_REQUEST";
  var FS_EVENTS_BOOKING_DETAILS_UPDATED = "FS_EVENTS_BOOKING_DETAILS_UPDATED";
  var FS_EVENTS_BOOKING_DETAILS_TOPUP_REQUIRED = "FS_EVENTS_BOOKING_DETAILS_TOPUP_REQUIRED";
  var FS_EVENTS_BOOKING_DETAILS_TOPUP_SUCCESS = "FS_EVENTS_BOOKING_DETAILS_TOPUP_SUCCESS";
  var FS_EVENTS_BOOKING_DETAILS_TOPUP_FAILED = "FS_EVENTS_BOOKING_DETAILS_TOPUP_FAILED";
  var FS_EVENTS_BOOKING_DETAILS_DECISION_VISIBILITY = "FS_EVENTS_BOOKING_DETAILS_DECISION_VISIBILITY";
  var FS_FAN_BOOKING_BOOTSTRAP = "FS_FAN_BOOKING_BOOTSTRAP";
  var FS_FAN_BOOKING_CHILD_READY = "FS_FAN_BOOKING_CHILD_READY";
  var FS_FAN_BOOKING_CLOSE_REQUEST = "FS_FAN_BOOKING_CLOSE_REQUEST";
  var FS_FAN_BOOKING_CREATED = "FS_FAN_BOOKING_CREATED";
  var FS_FAN_BOOKING_FAILED = "FS_FAN_BOOKING_FAILED";
  var FS_FAN_BOOKING_BALANCE_REFRESH_REQUEST = "FS_FAN_BOOKING_BALANCE_REFRESH_REQUEST";
  var FS_FAN_BOOKING_DEBUG = "FS_FAN_BOOKING_DEBUG";
  var FS_FAN_BOOKING_AUTH_UPDATE = "FS_FAN_BOOKING_AUTH_UPDATE";

  var activeOneOnOnePopup = null;
  var activeBookingDetailsPopup = null;
  var activeEventsEmbeds = [];
  var EVENTS_EMBED_ROOT_CLASS = "fs-events-embed";
  var EVENTS_EMBED_IFRAME_CLASS = "fs-events-embed__iframe";
  var EVENTS_EMBED_IFRAME_CONTENT_CLASS = "fs-events-embed__iframe--content";
  var EVENTS_EMBED_IFRAME_VIEWPORT_CLASS = "fs-events-embed__iframe--viewport";
  var EVENTS_EMBED_IFRAME_BOOKING_DETAILS_OPEN_CLASS = "fs-events-embed__iframe--booking-details-open";
  var FAN_BOOKING_POPUP_CLASS = "fs-fan-booking-popup";
  var FAN_BOOKING_POPUP_OVERLAY_CLASS = "fs-fan-booking-popup__overlay";
  var FAN_BOOKING_POPUP_MODAL_CLASS = "fs-fan-booking-popup__modal";
  var FAN_BOOKING_POPUP_IFRAME_CLASS = "fs-fan-booking-popup__iframe";
  var FAN_BOOKING_POPUP_CLOSE_CLASS = "fs-fan-booking-popup__close";
  var FAN_BOOKING_POPUP_LOADING_CLASS = "fs-fan-booking-popup__loading";
  var FAN_BOOKING_POPUP_LOADING_VISIBLE_CLASS = "fs-fan-booking-popup__loading--visible";
  var FAN_BOOKING_POPUP_LOADING_HIDDEN_CLASS = "fs-fan-booking-popup__loading--hidden";
  var BOOKING_DETAILS_POPUP_OVERLAY_CLASS = "fs-booking-details-popup__overlay";
  var BOOKING_DETAILS_POPUP_PANEL_CLASS = "fs-booking-details-popup__panel";
  var BOOKING_DETAILS_POPUP_DECISION_OPEN_CLASS = "fs-booking-details-popup__panel--decision-open";
  var BOOKING_DETAILS_POPUP_DECISION_DIRECT_CLASS = "fs-booking-details-popup__panel--decision-direct";
  var BOOKING_DETAILS_POPUP_CLOSING_CLASS = "fs-booking-details-popup__panel--closing";
  var BOOKING_DETAILS_POPUP_IFRAME_CLASS = "fs-booking-details-popup__iframe";
  var BOOKING_DETAILS_POPUP_LOADING_CLASS = "fs-booking-details-popup__loading";
  var BOOKING_DETAILS_POPUP_LOADING_HIDDEN_CLASS = "fs-booking-details-popup__loading--hidden";
  var FAN_BOOKING_SKELETON_TEMPLATE_PATH = "fan-booking-loading-skeleton.html";
  var FAN_BOOKING_LOADING_FALLBACK_DELAY_MS = 180;
  var EVENTS_FORM_UNSAVED_CHANGES_MESSAGE = "You will lose all your changes if you leave.";
  var fanBookingSkeletonTemplateCache = null;
  var fanBookingSkeletonTemplatePromise = null;
  var tokenBalanceRefreshQueue = Promise.resolve();

  function queueTokenBalanceUiRefresh(payload) {
    tokenBalanceRefreshQueue = tokenBalanceRefreshQueue
      .catch(function () {})
      .then(async function () {
        if (!global.tokenManager || typeof global.tokenManager.updateBalanceUIs !== "function") {
          if (global.console && typeof global.console.warn === "function") {
            global.console.warn("[FSEventsEmbed] tokenManager.updateBalanceUIs is unavailable", payload || {});
          }
          return;
        }

        try {
          await global.tokenManager.updateBalanceUIs();
        } catch (error) {
          if (global.console && typeof global.console.error === "function") {
            global.console.error("[FSEventsEmbed] Failed to refresh token balance UIs", error);
          }
        }
      });

    return tokenBalanceRefreshQueue;
  }

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

  function redactJwtFromDebugString(value) {
    if (typeof value !== "string") return value;
    return value
      .replace(/([?&]jwtToken=)[^&#]*/g, "$1[redacted]")
      .replace(/([?&]backendJwtToken=)[^&#]*/g, "$1[redacted]");
  }

  function isJwtDebugKey(key) {
    var normalized = String(key || "").toLowerCase().replace(/[_-]/g, "");
    return normalized === "jwttoken" || normalized === "backendjwttoken";
  }

  function redactJwtFromDebugPayload(value) {
    if (typeof value === "string") return redactJwtFromDebugString(value);
    if (!value || typeof value !== "object") return value;

    if (Array.isArray(value)) {
      return value.map(redactJwtFromDebugPayload);
    }

    var output = {};
    Object.keys(value).forEach(function (key) {
      var normalizedKey = String(key || "").toLowerCase().replace(/[_-]/g, "");
      if (isJwtDebugKey(key)) {
        output[normalizedKey === "backendjwttoken" ? "hasBackendJwtToken" : "hasJwtToken"] =
          typeof value[key] === "string" && value[key].trim() !== "";
        return;
      }
      output[key] = redactJwtFromDebugPayload(value[key]);
    });
    return output;
  }

  function logFanBookingDebug(scope, event, payload, options) {
    if (!isFanBookingDebugEnabled(options)) return;

    try {
      var safePayload = payload === undefined ? null : redactJwtFromDebugPayload(payload);

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
          payload: safePayload,
        });
      }

      console.log("[FSFanBooking][" + scope + "] " + event, payload === undefined ? "" : safePayload);
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

  function normalizeTranslations(value) {
    var input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
    var output = {};

    Object.keys(input).forEach(function (key) {
      var normalizedKey = typeof key === "string" ? key.trim() : "";
      var translation = input[key];
      if (!normalizedKey || typeof translation !== "string") return;
      output[normalizedKey] = translation;
    });

    return output;
  }

  function normalizeLocale(value) {
    return typeof value === "string" && value.trim() ? value.trim() : "en";
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

  function resolveViewportHeight() {
    var visualHeight = safeNumber(global.visualViewport && global.visualViewport.height, null);
    var fallbackHeight = safeNumber(global.innerHeight, null);
    var height = visualHeight || fallbackHeight || 320;
    return Math.max(320, Math.round(height));
  }

  function resolveVisibleMobileHeaderInset() {
    var mobileHeader = document.querySelector("[data-mobile-header]");
    if (!mobileHeader || typeof mobileHeader.getBoundingClientRect !== "function") return 0;

    var style = global.getComputedStyle ? global.getComputedStyle(mobileHeader) : null;
    if (style && (style.display === "none" || style.visibility === "hidden")) return 0;

    var headerRect = mobileHeader.getBoundingClientRect();
    if (!headerRect || headerRect.height <= 0 || headerRect.top > 0 || headerRect.bottom <= 0) return 0;
    return Math.max(0, headerRect.bottom);
  }

  function applyViewportIframeHeight(iframe, nextHeight) {
    if (!iframe) return;
    var requestedHeight = safeNumber(nextHeight, null) || resolveViewportHeight();
    var height = Math.max(320, requestedHeight - resolveVisibleMobileHeaderInset());
    iframe.style.setProperty("--fs-events-embed-height", String(Math.max(320, Math.round(height))) + "px");
  }

  function refreshViewportIframeHeight(iframe) {
    if (!iframe || !iframe.classList.contains(EVENTS_EMBED_IFRAME_VIEWPORT_CLASS)) return;
    applyViewportIframeHeight(iframe);
  }

  function setIframeHeightMode(iframe, mode, nextHeight) {
    if (!iframe) return;

    iframe.classList.remove(EVENTS_EMBED_IFRAME_CONTENT_CLASS, EVENTS_EMBED_IFRAME_VIEWPORT_CLASS);

    if (mode === "viewport") {
      iframe.classList.add(EVENTS_EMBED_IFRAME_VIEWPORT_CLASS);
      applyViewportIframeHeight(iframe, nextHeight);
      return;
    }

    iframe.classList.add(EVENTS_EMBED_IFRAME_CONTENT_CLASS);
    if (Number.isFinite(Number(nextHeight))) {
      iframe.style.setProperty("--fs-events-embed-height", String(Number(nextHeight)) + "px");
    } else {
      iframe.style.removeProperty("--fs-events-embed-height");
    }
  }

  function scrollEventsEmbedToTop(wrapper, payload) {
    if (!wrapper) return;

    var behavior = payload && payload.behavior === "smooth" ? "smooth" : "auto";

    try {
      var rect = wrapper.getBoundingClientRect ? wrapper.getBoundingClientRect() : null;
      if (!rect) return;

      var pageOffset = global.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      var top = Math.max(0, rect.top + pageOffset - resolveVisibleMobileHeaderInset());
      if (typeof global.scrollTo === "function") {
        global.scrollTo({ top: top, left: 0, behavior: behavior });
        return;
      }
    } catch (_error) {
      // Fall through to the element-based fallback below.
    }

    try {
      if (typeof wrapper.scrollIntoView === "function") {
        wrapper.scrollIntoView({ block: "start", inline: "nearest", behavior: behavior });
      }
    } catch (_error) {
      // The host page does not expose a usable scrolling surface.
    }
  }

  function lockBodyScroll() {
    var previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return function unlockBodyScroll() {
      document.body.style.overflow = previousOverflow;
    };
  }

  function isScheduledMeetingUrl(value) {
    if (typeof value !== "string" || !value.trim()) return false;

    try {
      var url = new URL(value, global.location.href);
      var pathname = String(url.pathname || "").replace(/\/+$/, "") || "/";
      var bookingId = String(url.searchParams.get("booking_id") || "").trim();
      var eventId = String(url.searchParams.get("event_id") || "").trim();
      var startIso = String(url.searchParams.get("start_iso") || "").trim();
      return url.origin === global.location.origin
        && pathname === "/scheduled-meeting"
        && Boolean(bookingId || (eventId && startIso));
    } catch (_error) {
      return false;
    }
  }

  function openUrl(payload, options) {
    if (!payload || !payload.url) return;

    if (
      isScheduledMeetingUrl(payload.url)
      && global.FSScheduledCallOverlay
      && typeof global.FSScheduledCallOverlay.open === "function"
    ) {
      global.FSScheduledCallOverlay.open(payload.url, {
        source: "events_embed",
      });
      return;
    }

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
      initialAction: "",
      bookingSnapshot: null,
      apiBaseUrl: "",
      tokenHandlerApiUrl: "",
      jwtToken: "",
      initialRoute: "events",
      creatorData: null,
      translations: {},
      locale: "en",
      targetOrigin: window.location.origin,
      iframeTitle: "Bookings Embed",
      minHeight: 720,
    }, options || {});

    var creatorData = normalizeCreatorData(settings.creatorData);
    var translations = normalizeTranslations(settings.translations);
    var locale = normalizeLocale(settings.locale);

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
      userRole: settings.userRole || "creator",
      initialRoute: settings.initialRoute || "events",
      apiBaseUrl: settings.apiBaseUrl || "",
      tokenHandlerApiUrl: settings.tokenHandlerApiUrl || "",
      jwtToken: settings.jwtToken || "",
      creatorAvatar: creatorData.avatar,
      creatorName: creatorData.name,
      creatorVerified: creatorData.isVerified,
    });
    iframe.title = settings.iframeTitle;
    iframe.loading = "lazy";
    iframe.setAttribute("scrolling", "no");
    if (String(settings.initialRoute || "").trim() === "events") {
      setIframeHeightMode(iframe, "viewport");
    } else {
      setIframeHeightMode(iframe, "content", settings.minHeight);
    }

    var targetOrigin = normalizeTargetOrigin(settings.targetOrigin);
    var hasUnsavedFormChanges = false;

    function syncViewportIframeHeight() {
      refreshViewportIframeHeight(iframe);
    }

    function onBeforeUnload(event) {
      if (!hasUnsavedFormChanges) return;

      event.preventDefault();
      event.returnValue = EVENTS_FORM_UNSAVED_CHANGES_MESSAGE;
      return EVENTS_FORM_UNSAVED_CHANGES_MESSAGE;
    }

    function sendBootstrap() {
      if (!iframe.contentWindow) return;

      iframe.contentWindow.postMessage({
        type: FS_EVENTS_BOOTSTRAP,
        payload: {
          creatorId: safePositiveNumber(settings.creatorId, null),
          fanId: safePositiveNumber(settings.fanId, null),
          userRole: settings.userRole || "creator",
          apiBaseUrl: settings.apiBaseUrl || "",
          tokenHandlerApiUrl: settings.tokenHandlerApiUrl || "",
          jwtToken: settings.jwtToken || "",
          initialRoute: settings.initialRoute || "events",
          creatorData: creatorData,
          translations: translations,
          locale: locale,
        },
      }, targetOrigin);
    }

    function updateAuth(authOptions) {
      var authSettings = authOptions || {};
      if (typeof authSettings.jwtToken === "string") {
        settings.jwtToken = authSettings.jwtToken;
      }
      if (!iframe.contentWindow) return;

      iframe.contentWindow.postMessage({
        type: FS_EVENTS_AUTH_UPDATE,
        payload: { jwtToken: settings.jwtToken || "" },
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
          // The child can only measure its current iframe viewport. Using that
          // value here creates a self-locking height loop when the iframe starts
          // at the content-mode minimum. The parent owns the real viewport.
          setIframeHeightMode(iframe, "viewport");
        } else {
          setIframeHeightMode(iframe, "content", nextHeight);
        }
        return;
      }

      if (data.type === FS_EVENTS_OPEN_URL) {
        openUrl(data.payload || {}, settings);
        return;
      }

      // The calendar surface can also need a token top-up, when a fan accepts a
      // price increase from the booking details panel it renders inline.
      if (data.type === FS_EVENTS_BOOKING_DETAILS_TOPUP_REQUIRED) {
        var dashboardTopup = data.payload || {};
        var dashboardTokens = Number(dashboardTopup.requiredTokens || 0);
        var replyTopup = function (type, reason) {
          if (!iframe.contentWindow) return;
          iframe.contentWindow.postMessage({
            type: type,
            payload: { bookingId: dashboardTopup.bookingId, reason: reason },
          }, settings.targetOrigin || "*");
        };

        if (typeof global.openTipPopup !== "function" || !Number.isFinite(dashboardTokens) || dashboardTokens <= 0) {
          replyTopup(FS_EVENTS_BOOKING_DETAILS_TOPUP_FAILED, "topup_unavailable");
          return;
        }

        global.openTipPopup({
          creator_id: dashboardTopup.creatorUserId || 0,
          user_id: dashboardTopup.currentUserId || 0,
          tip_type: "token",
          topup_amount: dashboardTokens,
          is_call_topup_and_tip: true,
          is_tip_from_php: true,
          topupFor: dashboardTopup.topupFor || "booking_confirm",
          successCallback: function () {
            replyTopup(FS_EVENTS_BOOKING_DETAILS_TOPUP_SUCCESS);
          },
          failureCallback: function () {
            replyTopup(FS_EVENTS_BOOKING_DETAILS_TOPUP_FAILED, "topup_failed");
          },
        });
        return;
      }

      if (data.type === FS_EVENTS_SCROLL_TO_TOP) {
        scrollEventsEmbedToTop(wrapper, data.payload || {});
        return;
      }

      if (data.type === FS_EVENTS_FORM_DIRTY_STATE) {
        hasUnsavedFormChanges = Boolean(data.payload && data.payload.dirty);
      }

      if (data.type === FS_EVENTS_FORM_OPEN_STATE) {
        if (data.payload && data.payload.isOpen) {
          document.body.classList.add("event-form-open");
        } else {
          document.body.classList.remove("event-form-open");
        }
      }

      if (data.type === FS_EVENTS_BOOKING_DETAILS_VISIBILITY) {
        iframe.classList.toggle(
          EVENTS_EMBED_IFRAME_BOOKING_DETAILS_OPEN_CLASS,
          Boolean(data.payload && data.payload.open),
        );
      }
    }

    window.addEventListener("message", onMessage);
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("resize", syncViewportIframeHeight);
    window.addEventListener("orientationchange", syncViewportIframeHeight);
    global.visualViewport && global.visualViewport.addEventListener && global.visualViewport.addEventListener("resize", syncViewportIframeHeight);
    container.innerHTML = "";
    wrapper.appendChild(iframe);
    container.appendChild(wrapper);

    var embedHandle = {
      root: wrapper,
      iframe: iframe,
      sendBootstrap: sendBootstrap,
      updateAuth: updateAuth,
      destroy: function () {
        iframe.classList.remove(EVENTS_EMBED_IFRAME_BOOKING_DETAILS_OPEN_CLASS);
        window.removeEventListener("message", onMessage);
        window.removeEventListener("beforeunload", onBeforeUnload);
        window.removeEventListener("resize", syncViewportIframeHeight);
        window.removeEventListener("orientationchange", syncViewportIframeHeight);
        global.visualViewport && global.visualViewport.removeEventListener && global.visualViewport.removeEventListener("resize", syncViewportIframeHeight);
        if (wrapper.parentNode === container) {
          container.removeChild(wrapper);
        }
        activeEventsEmbeds = activeEventsEmbeds.filter(function (embed) {
          return embed !== embedHandle;
        });
      },
    };
    activeEventsEmbeds.push(embedHandle);
    return embedHandle;
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
      inviteSecret: "",
      apiBaseUrl: "",
      tokenHandlerApiUrl: "",
      jwtToken: "",
      creatorData: null,
      translations: {},
      locale: "en",
      debug: false,
      targetOrigin: window.location.origin,
      iframeTitle: "One On One Booking Popup",
      closeOnOverlayClick: true,
      escToClose: true,
    }, options || {});

    if (safePositiveNumber(settings.creatorId, null) == null) {
      throw new Error("FSEventsEmbed.openFanBookingPopup requires a positive creatorId.");
    }

    var targetOrigin = normalizeTargetOrigin(settings.targetOrigin);
    var creatorData = normalizeCreatorData(settings.creatorData);
    var translations = normalizeTranslations(settings.translations);
    var locale = normalizeLocale(settings.locale);
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
      fanId: safeNumber(settings.fanId, null),
      eventId: settings.eventId == null || settings.eventId === "" ? null : String(settings.eventId),
      apiBaseUrl: settings.apiBaseUrl || "",
      tokenHandlerApiUrl: settings.tokenHandlerApiUrl || "",
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
        fanId: safeNumber(settings.fanId, null),
        eventId: settings.eventId == null || settings.eventId === "" ? null : String(settings.eventId),
        inviteSecret: typeof settings.inviteSecret === "string" ? settings.inviteSecret.trim() : "",
        apiBaseUrl: settings.apiBaseUrl || "",
        tokenHandlerApiUrl: settings.tokenHandlerApiUrl || "",
          hasJwtToken: !!settings.jwtToken,
          creatorData: creatorData,
          translations: translations,
          locale: locale,
          iframeSrc: iframe.src,
        }, settings);

      iframe.contentWindow.postMessage({
        type: FS_FAN_BOOKING_BOOTSTRAP,
        payload: {
          creatorId: safePositiveNumber(settings.creatorId, null),
          fanId: safeNumber(settings.fanId, null),
          eventId: settings.eventId == null || settings.eventId === "" ? null : String(settings.eventId),
          inviteSecret: typeof settings.inviteSecret === "string" ? settings.inviteSecret.trim() : "",
          apiBaseUrl: settings.apiBaseUrl || "",
          tokenHandlerApiUrl: settings.tokenHandlerApiUrl || "",
          jwtToken: settings.jwtToken || "",
          creatorData: creatorData,
          translations: translations,
          locale: locale,
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

    function updateAuth(authOptions) {
      var authSettings = authOptions || {};
      settings.fanId = safeNumber(authSettings.fanId, settings.fanId);
      settings.jwtToken = typeof authSettings.jwtToken === "string" ? authSettings.jwtToken : settings.jwtToken;

      if (!iframe.contentWindow || isDestroyed) return;

      logFanBookingDebug("host", "auth-update", {
        fanId: safeNumber(settings.fanId, null),
        hasJwtToken: !!settings.jwtToken,
      }, settings);

      iframe.contentWindow.postMessage({
        type: FS_FAN_BOOKING_AUTH_UPDATE,
        payload: {
          fanId: safeNumber(settings.fanId, null),
          jwtToken: settings.jwtToken || "",
        },
      }, targetOrigin);
    }

    function onIframeLoad() {
      logFanBookingDebug("host", "iframe-load", {
        iframeSrc: iframe.src,
        isChildReady: isChildReady,
      }, settings);
      sendBootstrap();
      scheduleLoadingFallbackHide();
    }

    async function onMessage(event) {
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

      if (data.type === FS_FAN_BOOKING_BALANCE_REFRESH_REQUEST) {
        await queueTokenBalanceUiRefresh(data.payload || {});
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
      fanId: safeNumber(settings.fanId, null),
      eventId: settings.eventId == null || settings.eventId === "" ? null : String(settings.eventId),
      inviteSecret: typeof settings.inviteSecret === "string" ? settings.inviteSecret.trim() : "",
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
      updateAuth: updateAuth,
    };
    global.__FSFanBookingActivePopup = activeOneOnOnePopup;

    return activeOneOnOnePopup;
  }

  function openBookingDetailsPopup(options) {
    if (activeBookingDetailsPopup) {
      activeBookingDetailsPopup.destroy({ invokeOnClose: false });
    }

    var settings = Object.assign({
      src: "/wp-content/plugins/fansocial/bookings-embed/dashboard.html",
      bookingId: "",
      creatorId: null,
      fanId: null,
      userRole: "creator",
      apiBaseUrl: "",
      tokenHandlerApiUrl: "",
      jwtToken: "",
      creatorData: null,
      translations: {},
      locale: "en",
      targetOrigin: window.location.origin,
      iframeTitle: "Booking details",
      loadingLabel: "Loading...",
      closeOnOverlayClick: true,
      escToClose: true,
      returnFocusElement: null,
    }, options || {});

    var bookingId = typeof settings.bookingId === "string" || typeof settings.bookingId === "number"
      ? String(settings.bookingId).trim()
      : "";
    if (!bookingId) {
      throw new Error("FSEventsEmbed.openBookingDetailsPopup requires a bookingId.");
    }

    var normalizedRole = String(settings.userRole || "creator").trim().toLowerCase() === "fan" ? "fan" : "creator";
    var initialAction = String(settings.initialAction || "").trim().toLowerCase() === "cancel"
      ? "cancel"
      : "";
    var isDirectCancelLaunch = initialAction === "cancel";
    if (normalizedRole === "fan" && safePositiveNumber(settings.fanId, null) == null) {
      throw new Error("FSEventsEmbed.openBookingDetailsPopup requires a positive fanId for fan views.");
    }
    if (normalizedRole === "creator" && safePositiveNumber(settings.creatorId, null) == null) {
      throw new Error("FSEventsEmbed.openBookingDetailsPopup requires a positive creatorId for creator views.");
    }

    var targetOrigin = normalizeTargetOrigin(settings.targetOrigin);
    var creatorData = normalizeCreatorData(settings.creatorData);
    var translations = normalizeTranslations(settings.translations);
    var locale = normalizeLocale(settings.locale);
    var focusTarget = resolveElement(settings.returnFocusElement) || document.activeElement;
    var unlockBodyScroll = lockBodyScroll();
    var isDestroyed = false;
    var closeInvoked = false;
    var bookingUpdateCloseTimer = null;
    var bookingUpdateTransitionHandler = null;
    var bookingUpdateCallbackInvoked = false;

    var overlay = createElement("div", BOOKING_DETAILS_POPUP_OVERLAY_CLASS, {
      role: "presentation",
      "data-fs-booking-details-popup": "",
    });
    var panel = createElement("div", BOOKING_DETAILS_POPUP_PANEL_CLASS, {
      role: "dialog",
      "aria-modal": "true",
      "aria-label": settings.iframeTitle,
    });
    var iframe = createElement("iframe", BOOKING_DETAILS_POPUP_IFRAME_CLASS);
    if (isDirectCancelLaunch) {
      panel.classList.add(BOOKING_DETAILS_POPUP_DECISION_OPEN_CLASS);
      panel.classList.add(BOOKING_DETAILS_POPUP_DECISION_DIRECT_CLASS);
      iframe.style.visibility = "hidden";
    }
    iframe.title = settings.iframeTitle;
    iframe.loading = "eager";
    iframe.setAttribute("scrolling", "no");

    var loadingLayer = createElement("div", BOOKING_DETAILS_POPUP_LOADING_CLASS, {
      "aria-label": settings.loadingLabel,
    });
    loadingLayer.innerHTML = '<span class="fs-booking-details-popup__spinner" aria-hidden="true"></span>';

    function sendBootstrap() {
      if (!iframe.contentWindow || isDestroyed) return;
      iframe.contentWindow.postMessage({
        type: FS_EVENTS_BOOTSTRAP,
        payload: {
          creatorId: safePositiveNumber(settings.creatorId, null),
          fanId: safePositiveNumber(settings.fanId, null),
          userRole: normalizedRole,
          apiBaseUrl: settings.apiBaseUrl || "",
          tokenHandlerApiUrl: settings.tokenHandlerApiUrl || "",
          jwtToken: settings.jwtToken || "",
          initialRoute: "booking-details",
          initialAction: initialAction,
          bookingId: bookingId,
          bookingSnapshot: settings.bookingSnapshot && typeof settings.bookingSnapshot === "object"
            ? settings.bookingSnapshot
            : null,
          hostViewportWidth: window.innerWidth,
          creatorData: creatorData,
          translations: translations,
          locale: locale,
        },
      }, targetOrigin);
    }

    function updatePopupAuth(authOptions) {
      var authSettings = authOptions || {};
      settings.jwtToken = typeof authSettings.jwtToken === "string" ? authSettings.jwtToken : settings.jwtToken;
      if (!iframe.contentWindow || isDestroyed) return;
      iframe.contentWindow.postMessage({
        type: FS_EVENTS_AUTH_UPDATE,
        payload: { jwtToken: settings.jwtToken || "" },
      }, targetOrigin);
    }

    function hideLoadingLayer() {
      if (!loadingLayer.parentNode) return;
      if (isDirectCancelLaunch) iframe.style.visibility = "visible";
      loadingLayer.classList.add(BOOKING_DETAILS_POPUP_LOADING_HIDDEN_CLASS);
      global.setTimeout(function () {
        if (loadingLayer.parentNode) loadingLayer.parentNode.removeChild(loadingLayer);
      }, 180);
    }

    function invokeOnClose() {
      if (closeInvoked) return;
      closeInvoked = true;
      if (typeof settings.onClose === "function") settings.onClose();
    }

    function restoreFocus() {
      if (!focusTarget || typeof focusTarget.focus !== "function" || !document.contains(focusTarget)) return;
      try {
        focusTarget.focus({ preventScroll: true });
      } catch (_error) {
        focusTarget.focus();
      }
    }

    function destroy(options) {
      var destroyOptions = Object.assign({ invokeOnClose: true }, options || {});
      if (isDestroyed) return;
      isDestroyed = true;
      window.removeEventListener("message", onMessage);
      window.removeEventListener("keydown", onKeyDown);
      iframe.removeEventListener("load", sendBootstrap);
      panel.classList.remove(BOOKING_DETAILS_POPUP_DECISION_OPEN_CLASS);
      panel.classList.remove(BOOKING_DETAILS_POPUP_DECISION_DIRECT_CLASS);
      panel.classList.remove(BOOKING_DETAILS_POPUP_CLOSING_CLASS);
      if (bookingUpdateTransitionHandler) {
        panel.removeEventListener("transitionend", bookingUpdateTransitionHandler);
        bookingUpdateTransitionHandler = null;
      }
      unlockBodyScroll();
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (activeBookingDetailsPopup && activeBookingDetailsPopup.iframe === iframe) {
        activeBookingDetailsPopup = null;
      }
      restoreFocus();
      if (destroyOptions.invokeOnClose) invokeOnClose();
    }

    function close() {
      destroy({ invokeOnClose: true });
    }

    function finishBookingUpdate(payload) {
      if (bookingUpdateCallbackInvoked) return;
      bookingUpdateCallbackInvoked = true;
      if (bookingUpdateCloseTimer !== null) {
        global.clearTimeout(bookingUpdateCloseTimer);
        bookingUpdateCloseTimer = null;
      }
      destroy({ invokeOnClose: false });
      if (typeof settings.onBookingUpdated === "function") {
        settings.onBookingUpdated(payload || {});
      }
    }

    function closeAfterBookingUpdate(payload) {
      if (!isDirectCancelLaunch) {
        panel.classList.remove(BOOKING_DETAILS_POPUP_DECISION_OPEN_CLASS);
        // Flush the restored drawer width before applying the slide-out transform.
        void panel.offsetWidth;
      }
      panel.classList.add(BOOKING_DETAILS_POPUP_CLOSING_CLASS);
      bookingUpdateTransitionHandler = function (event) {
        if (event.target !== panel || event.propertyName !== "transform") return;
        finishBookingUpdate(payload);
      };
      panel.addEventListener("transitionend", bookingUpdateTransitionHandler);
      bookingUpdateCloseTimer = global.setTimeout(function () {
        finishBookingUpdate(payload);
      }, 260);
    }

    function onMessage(event) {
      if (event.source !== iframe.contentWindow) return;
      var data = event.data || {};

      if (data.type === FS_EVENTS_CHILD_READY) {
        sendBootstrap();
        return;
      }
      if (data.type === FS_EVENTS_BOOKING_DETAILS_READY) {
        hideLoadingLayer();
        return;
      }
      if (data.type === FS_EVENTS_BOOKING_DETAILS_DECISION_VISIBILITY) {
        if (isDirectCancelLaunch) return;
        panel.classList.toggle(
          BOOKING_DETAILS_POPUP_DECISION_OPEN_CLASS,
          data.payload && data.payload.open === true
        );
        return;
      }
      if (data.type === FS_EVENTS_BOOKING_DETAILS_CLOSE_REQUEST) {
        close();
        return;
      }
      if (data.type === FS_EVENTS_BOOKING_DETAILS_TOPUP_REQUIRED) {
        var topupPayload = data.payload || {};
        var requiredTokens = Number(topupPayload.requiredTokens || 0);
        if (typeof global.openTipPopup !== "function" || !Number.isFinite(requiredTokens) || requiredTokens <= 0) {
          iframe.contentWindow.postMessage({
            type: FS_EVENTS_BOOKING_DETAILS_TOPUP_FAILED,
            payload: { bookingId: bookingId, reason: "topup_unavailable" },
          }, targetOrigin);
          return;
        }

        global.openTipPopup({
          creator_id: topupPayload.creatorUserId || 0,
          user_id: topupPayload.currentUserId || 0,
          tip_type: "token",
          topup_amount: requiredTokens,
          is_call_topup_and_tip: true,
          is_tip_from_php: true,
          topupFor: topupPayload.topupFor || "booking_confirm",
          successCallback: function () {
            if (!isDestroyed && iframe.contentWindow) {
              iframe.contentWindow.postMessage({
                type: FS_EVENTS_BOOKING_DETAILS_TOPUP_SUCCESS,
                payload: { bookingId: bookingId },
              }, targetOrigin);
            }
          },
          failureCallback: function () {
            if (!isDestroyed && iframe.contentWindow) {
              iframe.contentWindow.postMessage({
                type: FS_EVENTS_BOOKING_DETAILS_TOPUP_FAILED,
                payload: { bookingId: bookingId, reason: "topup_failed" },
              }, targetOrigin);
            }
          },
        });
        return;
      }
      if (data.type === FS_EVENTS_BOOKING_DETAILS_UPDATED) {
        var payload = data.payload || {};
        if (payload.retainOpen === true) {
          if (typeof settings.onBookingUpdated === "function") {
            settings.onBookingUpdated(payload);
          }
          return;
        }
        closeAfterBookingUpdate(payload);
        return;
      }
      if (data.type === FS_EVENTS_OPEN_URL) {
        openUrl(data.payload || {}, settings);
      }
    }

    function onKeyDown(event) {
      if (settings.escToClose && event.key === "Escape") close();
    }

    if (settings.closeOnOverlayClick) {
      overlay.addEventListener("click", function (event) {
        if (event.target === overlay) close();
      });
    }
    panel.addEventListener("click", function (event) {
      event.stopPropagation();
    });

    panel.appendChild(iframe);
    panel.appendChild(loadingLayer);
    overlay.appendChild(panel);
    window.addEventListener("message", onMessage);
    window.addEventListener("keydown", onKeyDown);
    iframe.addEventListener("load", sendBootstrap);
    document.body.appendChild(overlay);

    // Force the lightweight HTML shell to be revalidated so a deployment cannot
    // strand an already-open dashboard on stale hashed bundles. Booking IDs and
    // authentication remain exclusively in the postMessage bootstrap payload.
    iframe.src = buildIframeSrcWithQuery(settings.src, {
      fsDetailsVersion: Date.now(),
    });

    activeBookingDetailsPopup = {
      iframe: iframe,
      overlay: overlay,
      close: close,
      destroy: destroy,
      updateAuth: updatePopupAuth,
    };
    return activeBookingDetailsPopup;
  }

  function updateFanBookingAuth(options) {
    if (!activeOneOnOnePopup || typeof activeOneOnOnePopup.updateAuth !== "function") return false;
    activeOneOnOnePopup.updateAuth(options || {});
    return true;
  }

  function updateAuth(options) {
    activeEventsEmbeds.slice().forEach(function (embed) {
      embed.updateAuth(options || {});
    });
    if (activeBookingDetailsPopup && typeof activeBookingDetailsPopup.updateAuth === "function") {
      activeBookingDetailsPopup.updateAuth(options || {});
    }
    return activeEventsEmbeds.length;
  }

  global.FSEventsEmbed = {
    mount: mount,
    updateAuth: updateAuth,
    openFanBookingPopup: openFanBookingPopup,
    openBookingDetailsPopup: openBookingDetailsPopup,
    updateFanBookingAuth: updateFanBookingAuth,
  };

  preloadFanBookingSkeletonTemplate();
})(window);
