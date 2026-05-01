# Flow and Data Pipeline Architecture Guide

This document outlines the architecture of the Data Pipeline and Flow Handlers based on the Bookings module, designed to be replicated for the upcoming Chat module.

---

## Chat Embed Architecture

The chat widget can be embedded in any external page (e.g. WordPress) as an iframe. The embed reuses `ChatFloatingWidget` exactly as-is — no duplicate layout, no embed-specific props beyond userId.

### Entry Points

| File | Purpose |
|---|---|
| `vueApp/bookings-embed/chat.html` | iframe HTML page; mounts `#chat-embed-app` |
| `vueApp/src/embeds/chat/main.js` | Creates Vue app, Pinia, calls `FlowHandler.configure` before `app.mount` |
| `vueApp/src/embeds/chat/ChatEmbedApp.vue` | Embed root; parses URL params, mounts `ChatFloatingWidget` with userId prop |
| `vueApp/public/bookings-embed/fs-chat-host.js` | Standalone host script; exposes `window.FSChatEmbed.mountChatEmbed` |

### Bootstrap Flow

URL params are parsed **synchronously in `setup()`** (before children mount), not in `onMounted`. This is required because `ChatFloatingWidget.onMounted` fires during `app.mount()` and reads from `window.userData` and `window.userSpecifiData`.

```
URL params → setup() → window.userData.userID
                     → window.userSpecifiData.currentUser.isCreator
                     → window.__fsChatApiBaseUrl
                     → window.__fsChatEmbed = true
```

`FlowHandler.configure({ piniaStores: { chat: useChatStore() } })` must be called **between** `app.use(pinia)` and `app.mount()` so the store is available when `ChatFloatingWidget.onMounted` runs.

### userId Prop — Avoiding Auth Bundle

`ChatFloatingWidget` accepts an optional `userId` prop. When provided:
- `resolveUserId()` is **never called** — avoiding the `useAuthStore` → `authHandler` import chain
- `resolveUserId` is only loaded via **dynamic import inside `onMounted`** when the prop is absent (standalone app context)

`ChatWindow` follows the same pattern — accepts `currentUserId` prop from `ChatFloatingWidget`, falls back to `resolveUserId()` synchronously (static import) when absent.

> **Important:** Do not use top-level `await` in `ChatWindow` setup — it makes the component async and requires a `<Suspense>` boundary.

### Auto-Resizing

The iframe reports its required size to the host page via `postMessage`. Four observers cooperate:

| Observer | Target | Fires on |
|---|---|---|
| `ResizeObserver` | `widgetEl` | In-flow layout changes (chat windows open/close) |
| `MutationObserver` | `widgetEl` subtree | DOM mutations (chat list panel, absolute children) |
| `MutationObserver` (bodyObserver) | `document.body` childList | Teleported popup add/remove (`data-fs-chat-popup`) |
| `MutationObserver` (overlayObserver) | `[data-popup-overlay]` style | NewChatPopup open/close via PopupHandler overlay visibility |

All resize calls are debounced through a single shared `resizeTimer` (`clearTimeout` + `setTimeout 30ms`).

Two postMessage types:
- `FS_CHAT_RESIZE { width, height }` — normal widget sizing
- `FS_CHAT_FULLSCREEN` — tells host to expand to its own `window.innerWidth/innerHeight` (used when a popup opens; iframe's own `innerWidth` would be wrong)

While `popupOpen = true`, `notifyResize` is suppressed so mutation/resize events cannot race-override the full-viewport state.

### Popup Detection

PopupHandler uses a **singleton `[data-popup-overlay]` div** that stays in `document.body` permanently (just hidden when inactive). To avoid falsely detecting it as an open popup:

- `overlayObserver` watches its `style` attribute — `visibility: visible` means a popup (NewChatPopup) is open
- `BookingRequestDetailPopup` and `AdjustBookingPopup` have `data-fs-chat-popup` on their root backdrop div — `bodyObserver` checks for this attribute explicitly

### `newChatPopupConfig` in Embed

Inside the embed, the iframe is initially small (360px wide). PopupHandler's responsive breakpoints resolve at that width, choosing `top-center` / `100vh` which fills the iframe from the top — not centered.

Fix: when `window.__fsChatEmbed === true`, `newChatPopupConfig` uses fixed non-responsive values:
```js
position: 'center',
width:    '675px',
height:   '90vh',
```

### Host Script (`fs-chat-host.js`)

Separate from `fs-events-host.js` — chat has no dependency on events/booking host logic.

```js
window.FSChatEmbed.mountChatEmbed(document.body, {
  src:           '/wp-content/plugins/fansocial/bookings-embed/chat.html',
  currentUserId: userData.userID,
  userRole:      'creator' | 'fan',
  apiBaseUrl:    'https://...',
})
```

Returns `{ iframe, container, destroy() }`.

---

## 1. Data Pipeline Architecture (`flowDataPipeline.js`)

The `runFlowDataPipeline` function is the core execution engine for any flow. It orchestrates the lifecycle of a request through several well-defined stages:

- **Prepare:** Initializes timing and stage tracking (`markStage`, `recordTiming`).
- **Validate Payload:** Extracts original payload from context and runs it against `context.validators.payload`. If validation fails, it short-circuits with a `PAYLOAD_VALIDATION_FAILED` error.
- **Execute:** Determines if the flow is a "read" or "write" operation based on `context.flowKind` and delegates to `runReadPipeline` or `runWritePipeline`. This stage is wrapped in an `executeWithTimeout` to enforce `context.totalFlowTimeoutMs`.
- **Validate Response:** Validates the flow execution result using `context.validators.response`. If this fails, a `RESPONSE_VALIDATION_FAILED` error is finalized.
- **Finalize:** Constructs a normalized output via `finalizeSuccess`, `finalizeError`, or `finalizeCancelled`. These finalizers append execution metadata like `runId`, `flowName`, `stages`, and `timings`. They also handle mapping internal errors to UI-friendly error strings via `formatUiErrors` and `mapUiError`.

## 2. Flow Handlers Architecture

Flow handlers (e.g., `createBookingFlow.js`, `reviewPendingBookingFlow.js`) perform the actual business logic or API interactions. They plug into the execution stage of the Data Pipeline.

**Key responsibilities of a Flow Handler:**
- **Input:** They receive a single object containing `{ payload, context, api }`.
  - `payload`: The validated data specific to the request.
  - `context`: Contextual request data like `requestHeaders`, `signal` (for cancellation), and `requestTimeoutMs`.
  - `api`: The HTTP client injected to perform the requests.
- **Custom Validation:** While the pipeline handles global schema validation, flow handlers perform localized logical validation (e.g., ensuring a `decision` is specifically "approve" or "reject").
- **Execution:** Makes the asynchronous request using actions like `api.post`, `api.get`.
- **Return Value:** Must return standard flow objects using `ok(data, meta)` or `fail({ code, message, details })` imported from `@/services/flow-system/flowTypes.js`.
- **Error Handling:** They map unexpected errors to uniform flow errors using utilities like `asFlowError`.

## 3. Base Template for `ChatFlow.js`

Below is a boilerplate template reflecting the exact pattern used in the Bookings module, ready for use in the new Chat module.

```javascript
import { fail, ok } from "@/services/flow-system/flowTypes.js";
import { getHttpStatus } from "@/services/flow-system/runtime/httpMetaRuntime.js";
// Adjust this import to match the actual Chat API utilities equivalent to bookingsApiUtils
import { getChatApiBaseUrl, asFlowError } from "@/services/chat/chatApiUtils.js";

/**
 * Standard Flow Handler Template for the Chat module.
 *
 * @param {Object} args
 * @param {Object} args.payload - The validated payload from the Data Pipeline.
 * @param {Object} args.context - Includes standard meta like signal, requestHeaders, requestTimeoutMs.
 * @param {Object} args.api - The injected HTTP client.
 */
export async function sampleChatFlow({ payload, context, api }) {
  const baseUrl = getChatApiBaseUrl(context);
  const headers = context.requestHeaders || {};

  // 1. Localized payload processing and validation
  // e.g., verifying required fields that cannot be statically validated prior
  const requiredFields = ["chatId", "message"];
  const missingFields = requiredFields.filter((field) => !payload?.[field]);

  if (missingFields.length > 0) {
    return fail({
      code: "CHAT_FLOW_MISSING_REQUIRED_FIELDS",
      message: `Missing required fields: ${missingFields.join(", ")}.`,
      details: { missingFields, payload },
    });
  }

  try {
    // 2. Perform the async API request
    const response = await api.post(`${baseUrl}/chat`, payload, {
      headers,
      signal: context.signal,
      timeoutMs: context.requestTimeoutMs,
    });

    // Extract the HTTP status for meta logging
    const status = getHttpStatus(response, 201);

    // 3. Handle explicit API failures
    if (response?.ok === false) {
      return fail({
        code: "CHAT_REQUEST_FAILED",
        message: response?.error || "Failed to process chat flow.",
        details: response,
      });
    }

    // 4. Return success response with strictly typed `ok`
    return ok(
      {
        chatId: response?.chatId || payload.chatId,
        item: response?.item || null,
        validation: response?.validation || null,
      },
      {
        flow: "chat.sampleChatFlow",
        status,
      }
    );
  } catch (error) {
    // 5. Catch and normalize unexpected runtime errors
    return asFlowError(
      error,
      "CHAT_REQUEST_UNEXPECTED_ERROR",
      "An unexpected error occurred while processing the chat request."
    );
  }
}
```
