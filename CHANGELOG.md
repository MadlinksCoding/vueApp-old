# Changelog

## 2026-04-08 — Fan Counter-Offer Accept: Token Check, Topup Flow & Message Update

### Features

#### `src/components/ui/chat/ChatWindow.vue`
- **`onConfirmCounter`** (fan "Accept Changes" for booking counter-offer):
  - Computes `newTokens` (from cached booking or `message.content.meta.totalTokens`) and `prevTokens` (from `message.content.meta.prevTotalTokens`).
  - Calculates `diffTokens = Math.max(0, newTokens - prevTokens)` — only the incremental amount owed.
  - If `diffTokens === 0` (same or cheaper counter-offer), confirms directly without any balance check.
  - If `diffTokens > 0`, fetches fan's spendable balance via `TokenHandler.get`; confirms directly if balance is sufficient.
  - If insufficient, fires `FS_CHAT_TOPUP_REQUIRED` postMessage to parent (iframe mode) with `requiredTokens: diffTokens`; shows alert in non-iframe context.
  - DEV-only: `import.meta.env.DEV` guard allows overriding balance via `localStorage.setItem('mockTokenBalance', N)` for testing the topup flow without real tokens (stripped from production builds by Vite).
- **`_doConfirmCounter`**: after `reviewPendingBooking` approves, stores updated booking via `chatStore.setBooking`, then calls `chat.updateBookingRequestMessage` with `action: 'accepted'` and passes the result to `broadcastBookingUpdate` — mirrors the creator-side `performBookingDecision` flow so the bubble action updates to "accepted" immediately.
- **`_onTopupMessage`**: listens for `FS_CHAT_TOPUP_SUCCESS` / `FS_CHAT_TOPUP_FAILED` from parent window; on success resumes `_doConfirmCounter`, on failure shows error toast. Listener registered in `onMounted`, removed in `onUnmounted`.

#### `public/bookings-embed/fs-chat-host.js`
- Added `FS_CHAT_TOPUP_REQUIRED` handler in `onMessage` — calls `window.openTipPopup` with `creator_id`, `user_id`, `topup_amount: diffTokens`, `topupFor: 'booking_confirm'`.
- `successCallback` posts `FS_CHAT_TOPUP_SUCCESS` back to iframe; `failureCallback` posts `FS_CHAT_TOPUP_FAILED`.

#### `src/components/ui/chat/BookingRequestDetailPopup.vue`
- **`guestLabel`**: falls back to `chatStore.chatUsersData[userId].username / display_name` before showing `User #ID`, so the fan's username is shown when the booking API doesn't embed display name fields.

#### `src/composables/useChatSocket.js`
- On incoming `booking_request` or `requestJoinCallNotification` socket message: refetches booking via `bookings.fetchBooking` and event via `events.fetchEvent`, updating `chatStore` so all views reflect the latest data without a page refresh.
- For pinned `booking_request` messages, immediately calls `chatStore.setPinnedMessage` so `pinnedBookingMessage` in `ChatWindow` reflects the new action/tokens/time from the socket message.

#### `src/components/ui/chat/BookingRequestBubble.vue`
- `booking` changed from a module-level `Map` cache to a reactive `computed` reading `chatStore.getBookingById` — all bubble instances auto-update when the store is refreshed by the socket handler.
- `isRemarksClamped` watcher now uses `flush: 'post'` and watches `[counterRemarks, resolvedAction]` — fires after DOM update and when the remarks element becomes visible due to async booking status changes.

#### `src/components/ui/chat/EventSlotDateTimePicker.vue`
- Replaced custom slot-matching logic with `buildCandidateSlotsForEventDate` from `bookingSlotUtils.js` — correctly handles all repeat rules (`weekly`, `monthly`, `everyXWeeks`, `doesNotRepeat`, `daily`).
- `isValidDay` — `true` when the candidate slot list for the selected date is non-empty.
- `timeSlotOptions` — derived directly from `rebuildAvailabilityPreview` slot labels.
- `invalidDayWarning` — rule-specific messages: monthly shows ordinal day ("not the 15th of the month"), everyXWeeks shows interval info.
- `dateRangeLabel` — for monthly events, shows ordinal day-of-month ("the 15th of each month").
- `availableDayLabels` — for everyXWeeks, prefixes "every N weeks on …".

---

## 2026-04-08 — Booking Counter-Offer UX: Date/Time Picker, Meta Tracking & Error Toasts

### Features

#### `src/components/ui/chat/EventSlotDateTimePicker.vue` (new)
- New reusable component for picking a new event slot date and time within booking flows.
- **Date input**: native `<input type="date">` with underline style, `min`/`max` from event `dateFrom`/`dateTo`, available day hint, invalid-day amber warning.
- **Time input**: `CustomDropdown` (50% width) generating time options as session-duration intervals within the slot's `startTime`–`endTime` window; shows computed end time alongside selected start.
- Supports `dateReadonly` mode (date shown as text, only time is editable — used in MoreTimeRequestPopup).
- `isValidDay`: validates selected date's weekday against `event.slots[].day` for weekly/custom events; always valid for monthly/daily.
- `activeSlot`: for `monthly`/`daily` repeatRule, returns `slots[0]` directly (no weekday match needed); for `weekly`/`custom`, matches by day name with `slots[0]` fallback.
- `dateRangeLabel`: for monthly events, shows `"Available: April 8, 2026 – May 8, 2026"` or `"Available: From April 8, 2026"` when `dateTo` is absent.
- Props: `event`, `modelValue({date,startTime})`, `durationMs`, `originalEventDate`, `originalStartTime`, `dateReadonly`, `compact`, `optional`.

#### `src/components/ui/chat/AdjustBookingPopup.vue`
- Integrated `EventSlotDateTimePicker` for new event date/time selection (optional).
- **`prevStartAtIso`**: captured from `booking.startIso/startAtIso` before renegotiation; stored in message `meta.prevStartAtIso` and booking `args`.
- **`prevTotalTokens`**: captured from `baseTokens` (booking's current `payment.total`) before renegotiation; stored in message `meta.prevTotalTokens`.
- Added-on section is now read-only — shows only selected add-ons matched by title from event catalog, no checkboxes.
- Session duration resolved via fallback chain: `durationMinutes` → `sessionDurationMinutes` → `meta.validation.paymentPayload.durationMinutes` → `endAtIso - startAtIso`.
- `isDateTimeValid`: skips weekday check for monthly events (filters empty strings from `allowed` set before checking).
- Submit disabled when: nothing to submit (no date/time change and adjustment = 0), date without time or vice versa, or invalid slot day.
- Shows error toast on `bookings.renegotiateBooking` failure.

#### `src/components/ui/chat/RescheduleRequestPopup.vue`
- Added `event` prop; replaced custom date/time inputs with `EventSlotDateTimePicker`.
- Captures `prevStartAtIso` from `content.start_at`; passes it in booking `args` (audit trail).
- Switched message update from `chat.updateMessage` → `chat.updateBookingRequestMessage` with `meta: { newSlotDate, prevStartAtIso }` — enables strikethrough date display in bubble.
- Shows error toast on `bookings.rescheduleBooking` failure.

#### `src/components/ui/chat/MoreTimeRequestPopup.vue`
- Added `event` prop; replaced time input with `EventSlotDateTimePicker` in `dateReadonly` mode.
- Captures `prevStartAtIso` from `content.start_at`; passes it in booking `args` (audit trail).
- Switched message update from `chat.updateMessage` → `chat.updateBookingRequestMessage` with `meta: { newSlotDate, prevStartAtIso }`.
- Shows error toast on `bookings.renegotiateBooking` failure.

#### `src/components/ui/chat/BookingRequestBubble.vue`
- **`prevSlotDateTime`**: computed from `content.meta.prevStartAtIso` — formats original start + derived end (using `booking.durationMinutes`) as the strikethrough date when a counter offer includes a date change. Replaces unreliable `resolvedDateTime` (which reflects the already-updated booking API value).
- **`prevTokens`**: computed from `content.meta.prevTotalTokens` — replaces `originalTokens` (which read from `booking.payment.total`, already overwritten after renegotiation) as the strikethrough price.
- Date change row: only rendered when both `counterSlotDate` (new date) and `prevSlotDateTime` (original date) are present.
- **"View detail" button**: hidden when remark text does not overflow 2 lines. Uses `remarksRef` template ref + `isRemarksClamped` (checked via `scrollHeight > clientHeight` after mount and on `counterRemarks` change). Button reappears when already expanded so user can collapse.

### Fixes

#### `src/components/ui/chat/ChatWindow.vue`
- Shows error toast on `bookings.cancelBooking` failure instead of silently no-oping.

---

## 2026-04-07 — Pinned Message Pre-loading, Booking/Event Caching & LiveCallRequest Fixes

### Features

#### `src/stores/useChatStore.js`
- Added `chatPinnedMessages: {}` state — stores the pinned message per chat, keyed by `chat_id`. Populated from `fetchUserChatsAction` (via `getChat` response) and updated by `broadcastBookingUpdate`.
- Added `chatBookings: {}` state — stores fetched booking data keyed by `booking_id`. Populated when a pinned booking message is detected; refreshed after accept/decline actions.
- Added `chatEvents: {}` state — stores fetched event data keyed by `event_id`. Populated once after booking is loaded (event id derived from booking).
- Added getters: `getPinnedMessageByChatId`, `getBookingById`, `getEventById`.
- Added actions: `setPinnedMessage(chatId, message)`, `setBooking(bookingId, data)`, `setEvent(eventId, data)`.
- `clearCache` clears all three new maps.

#### `src/services/flow-system/flowRegistry.js`
- Registered **`"events.fetchEvent"`** flow (`fetchEventFlow` was already imported but unregistered). Used for pre-loading event reminder settings.

### Changes

#### `src/components/ui/chat/ChatWindow.vue`
- **Pinned banner pre-loading** — watcher on `pinnedBookingMessage` now chains: (1) fetch booking → store via `chatStore.setBooking`, (2) derive `eventId` from booking → fetch event if not already cached → store via `chatStore.setEvent`. Both are non-blocking background fetches.
- Added `activeBookingData` computed — reads `chatStore.getBookingById` for the active popup message.
- Added `activeEventData` computed — reads `chatStore.getEventById` via `activeBookingData.eventId`.
- `openBookingDetail` — triggers a background refresh of booking data each time the popup opens.
- `onBookingActionComplete` — refreshes cached booking after accept/decline so next popup open shows correct status.
- Passes `:booking="activeBookingData"` and `:event="activeEventData"` to `BookingRequestDetailPopup`.
- `pinnedBookingMessage` computed — checks `chatStore.getPinnedMessageByChatId` first (instant, no wait for messages to load), falls back to scanning `allMessages`.
- `broadcastBookingUpdate` — syncs `chatPinnedMessages`: sets pinned message on `is_pinned = true`, clears it on `is_pinned = false`.

#### `src/components/ui/chat/BookingRequestDetailPopup.vue`
- Added `booking` prop (pre-fetched data) — when provided, shows details immediately with no spinner, then silently refreshes in background for latest status.
- Added `event` prop (pre-fetched event data).
- **`reminderLabel`** — now reads from `event.raw.eventCurrent / eventSnapshot` checking `callReminderMinutesBefore ?? remindBeforeMinutes ?? reminderMinutes ?? reminder_minutes`. Shows `'X minutes before'` only when value > 0; hidden when event is not loaded or reminder not configured. Removed `?? 5` default and stray `console.log`.
- All action buttons (Accept, Decline, counter-offer, accepted/declined badge) now gated behind `!loading` — never shown before booking data confirms the current state.

#### `src/components/ui/chat/LiveCallRequest.vue`
- Added **`isExpired`** computed — `true` when `now > startMs`.
- **`countdownText`** — returns `'Session expired'` when expired (was `'now'`).
- Countdown dot and text color — gray when expired, red when active.
- **Join Call button** — disabled (`bg-gray-300 opacity-60 pointer-events-none cursor-not-allowed`, `href`/`target` removed) when expired; normal indigo style when active.
- **3-dot menu** — hidden for creator when `action === 'accepted'` (added `isAccepted` computed).
- **"Other Options" button** — always `pointer-events-none` + gray for both creator and fan (removed conditional interactivity).

---

## 2026-04-06 — requestJoinCallNotification UI & Flows (Session 2)

### Features

#### `src/components/ui/chat/LiveCallRequest.vue`
- Redesigned to match spec: indigo left border, event title, date/time, red countdown dot, "Join Call" button, "Other Options" button.
- **Counter-offer state** (`content.action === 'counter_offer'`): shows original time struck-through in gray, proposed new time in indigo, "View detail ›" link, and Accept/Reject buttons for fan; creator sees "Waiting for fan to respond…".
- **Cancelled/declined state** (`content.action === 'cancelled'|'declined'`): shows red phone icon + "Canceled" label and "View Details ↗" link; 3-dot menu hidden.
- 3-dot menu and "Other Options" button visible to creator only; "Other Options" shown to fan but grayed out with `pointer-events-none`.
- Emits: `ask-more-time`, `reschedule`, `cancel`, `accept-counter`, `reject-counter`, `view-details`.

#### `src/components/ui/chat/MoreTimeRequestPopup.vue` (new)
- Clock icon header, event date (read-only), new start time input (pre-filled from `start_at`), auto-calculated end time from original duration, original start time hint.
- Submits `chat.updateMessage` with `action: 'counter_offer'`, `slot_date` (new ISO time combined with original date).
- Green "Send request to @username" button with send arrow icon.

#### `src/components/ui/chat/RescheduleRequestPopup.vue` (new)
- Calendar icon header, new date picker (pre-filled) with original event date hint, new start time (pre-filled) with auto end time and original start time hint.
- Submits `chat.updateMessage` with `action: 'counter_offer'`, `slot_date`.
- Green "Send request to @username" button.

#### `src/components/ui/chat/CancelCallConfirmPopup.vue` (new)
- Phone icon header, warning message ("Booking Fee will still be deducted from your wallet"), Back + Cancel Call buttons.
- Runs `bookings.cancelBooking` then `chat.updateMessage` with `action: 'cancelled'`.

#### `src/services/chat/flows/updateMessageFlow.js` (new)
- Generic `chat.updateMessage` flow — `PATCH /chats/:chatId/messages/:messageId` with arbitrary content updates.
- Registered in `flowRegistry.js`.

#### `src/components/ui/chat/ChatWindow.vue`
- Imported and wired `MoreTimeRequestPopup`, `RescheduleRequestPopup`, `CancelCallConfirmPopup`.
- Added `showMoreTimePopup`, `showReschedulePopup`, `showCancelCallPopup` refs.
- Added `onAcceptCounter` / `onRejectCounter` handlers — call `chat.updateMessage` and send activity log.
- `sendChatActivityLog` now calls `updateChatLastMessage` so activity log text appears in chat list preview immediately.
- `messages` filter: `booking_request` now excluded only while `is_pinned !== false`; once unpinned it appears in scroll list.

#### `src/components/ui/chat/ChatListPanel.vue`
- `getLastMessageText`: `activity_log` shows `content.text` directly; `requestJoinCallNotification` shows `"Session starting soon"`.

---

## 2026-04-06 — Chat Negotiation/Approval

### Features

#### `src/components/ui/chat/LiveCallRequest.vue` (new)
- New pinned-banner component for `requestJoinCallNotification` messages.
- Displays pulsing green dot, live countdown clock (1-second interval), event name, formatted start date/time, and a "Join Now" button linking to `session_link`.
- Props: `message` (Object, required), `isCreator` (Boolean, default false).
- Session label resolves `video` → "Video call", `voice` → "Audio call", else "Session".

#### `src/components/ui/chat/ChatWindow.vue`
- Imported and registered `LiveCallRequest` component.
- `messages` computed now excludes both `booking_request` and `requestJoinCallNotification` from the scrollable list (both shown only in pinned banner).
- `pinnedBookingMessage` computed: `requestJoinCallNotification` takes priority over `booking_request`; `booking_request` messages with `is_pinned === false` (explicitly unpinned by scheduler) are excluded.
- Pinned banner slot conditionally renders `LiveCallRequest` for `requestJoinCallNotification` or `BookingRequestBubble` for `booking_request`.

#### `src/stores/useChatStore.js`
- Added `sortedUserChats` getter — returns `userChats` sorted descending by `last_message.message_ts ?? last_message.time ?? last_activity ?? 0`.
- `updateChatLastMessage` now uses `splice`/`unshift` to physically move the updated chat to the top of the array, guaranteeing Vue reactivity re-render.

#### `src/components/ui/chat/ChatListPanel.vue`
- `v-for` switched from `chatStore.userChats` to `chatStore.sortedUserChats` so the list re-orders on new messages.

### Fixes

#### `src/components/ui/chat/ChatWindow.vue`
- `_onMessageVisible` batches visible messages via `queueMicrotask`; only calls `markMessageRead` once per tick for the message with the highest `message_ts`, preventing concurrent writes that could overwrite a newer timestamp with an older one.

---

## 2026-04-04 (Session 5)

### Features

#### Chat Embed — `vueApp/src/embeds/chat/`
- New embed entry: `vueApp/src/embeds/chat/main.js` — creates Vue app, registers Pinia, calls `FlowHandler.configure` before `app.mount` so stores are available when `ChatFloatingWidget.onMounted` fires.
- New embed root: `vueApp/src/embeds/chat/ChatEmbedApp.vue` — parses URL params (`currentUserId`, `userRole`, `apiBaseUrl`) synchronously in `setup()` before children mount; sets `window.userData.userID`, `window.userSpecifiData.currentUser.isCreator`, `window.__fsChatApiBaseUrl`, and `window.__fsChatEmbed = true`.
- New iframe HTML: `vueApp/bookings-embed/chat.html` — minimal page mounting `#chat-embed-app`.
- Registered new Vite entry `chatEmbed` in `vite.config.js`.

#### Chat Embed — Auto-Resizing (`ChatEmbedApp.vue`)
- `ResizeObserver` on `widgetEl` — debounced via shared `resizeTimer`; handles in-flow layout changes (chat windows opening).
- `MutationObserver` on `widgetEl` subtree — debounced; handles absolute-positioned children (chat list panel).
- `MutationObserver` on `document.body` childList — detects `data-fs-chat-popup` elements (BookingDetailPopup, AdjustPopup) added/removed via Teleport; sets `popupOpen` flag.
- `MutationObserver` on `[data-popup-overlay]` style — detects NewChatPopup open/close via `visibility: visible`; set up lazily when overlay element is first added to body.
- `FS_CHAT_RESIZE` postMessage — widget-sized dimensions sent to host.
- `FS_CHAT_FULLSCREEN` postMessage — sent when a popup opens; host uses its own `window.innerWidth/innerHeight` (not iframe's).
- While `popupOpen = true`, `notifyResize` is suppressed so mutation/resize events cannot race-override the full-viewport state.
- All resize/mutation timers share a single `resizeTimer` (debounce); `clearTimeout` on unmount.

#### Chat Embed — Host Script (`public/bookings-embed/fs-chat-host.js`)
- New standalone host script exposing `window.FSChatEmbed.mountChatEmbed(target, options)`.
- Chat embed code extracted out of `fs-events-host.js` (which now only handles events/booking).
- Handles `FS_CHAT_RESIZE` and `FS_CHAT_FULLSCREEN` messages from iframe; resizes container div accordingly.
- Options: `src`, `currentUserId` (required), `userRole`, `apiBaseUrl`, `openChatId`, `iframeTitle`, `width`, `height`.
- Returns `{ iframe, container, destroy() }`.

#### Demo Page (`public/bookings-embed/chat-iframe.html`)
- Demo page with header, hero section, and 4 content cards; loads `fs-chat-host.js` and calls `FSChatEmbed.mountChatEmbed`.
- Open at: `http://localhost:5173/bookings-embed/chat-iframe.html?currentUserId=4424&userRole=creator`

#### `ChatFloatingWidget.vue`
- Added optional `userId` prop; if provided, skips `resolveUserId()` entirely (avoids pulling `useAuthStore` → `authHandler` into embed bundle).
- `resolveUserId` is now loaded via dynamic `import()` inside `onMounted` only when `userId` prop is absent.
- Added `widgetEl` ref on root div + `defineExpose({ widgetEl })` so `ChatEmbedApp` can attach observers.
- Passes `:current-user-id="currentUserId"` down to `ChatWindow`.

#### `ChatWindow.vue`
- Added `currentUserId` prop; uses prop value directly when present, falls back to `resolveUserId()` otherwise (sync, no async setup).
- Removed top-level `await import` to avoid Vue Suspense requirement.

#### `ChatListPanel.vue`
- `newChatPopupConfig`: when `window.__fsChatEmbed`, uses fixed `position: 'center'`, `width: '675px'`, `height: '90vh'` (bypasses responsive breakpoints that resolve incorrectly inside a small iframe).

#### `BookingRequestDetailPopup.vue` / `AdjustBookingPopup.vue`
- Added `data-fs-chat-popup` attribute on root backdrop div so `ChatEmbedApp` bodyObserver can reliably detect these popups (not confused with PopupHandler's persistent overlay).

### Documentation
- New: `vueApp/docs/wordpress/chat-embed-wordpress-integration.md` — full integration guide (build, deploy, mount call, options reference, auto-resize behavior, URL params, smoke test checklist, troubleshooting).

---

## 2026-04-03 (Session 4)

### Features

#### `BookingRequestBubble.vue` — counter_offer UI
- **Price row**: when `counter_offer`, shows original tokens (strikethrough, gray) + new `meta.totalTokens` (blue).
- **Remarks expand/collapse**: "View detail ∨" button toggles `line-clamp-2` → full text; chevron rotates 180° when expanded. Shared `remarksExpanded` ref used by both creator and fan sides.
- **Creator side** (`isCreator + counter_offer`): shows "Your remarks" label + collapsed remarks + hourglass "waiting for response" + "View Details ↗".
- **Fan side** (`!isCreator + counter_offer`): removed "Counter offer received" header; shows `@senderName's remarks:` with inline expand toggle; "Accept" renamed to "Accept New Cost"; removed separate "View Details" link (replaced by inline "View detail ∨").

#### `AdjustBookingPopup.vue` — event add-ons fetch
- On mount, now fetches booking **and** event in parallel via `Promise.all([bookings.fetchBooking, events.fetchEvent])`.
- Add-on options sourced from `event.addOns` (shape: `{ title, description, priceTokens }`), falling back to `booking.addOnsCatalog`.
- Added missing imports: `BaseInput`, `CheckboxGroup`, `ButtonComponent`.

#### `ChatWindow.vue` — counter_offer activity log
- `onAdjustSubmitted` now calls `sendChatActivityLog('Counter offer sent', { is_booking_request: true, decision: 'counter_offer', bookingId })` after broadcasting the updated message.
- `ActivityLogTexts` extended with `counter_offer` entry:
  - creator: `"You sent a counter offer to @{audience}"`
  - audience: `"@{creator} sent you a counter offer"`
- `resolveActivityLogText` `decisionMap` updated to include `counter_offer → counter_offer`.
- Fixed duplicate `decision` key in `performBookingDecision` meta object.

#### New Flow — `events.fetchEvent`
- New file: `vueApp/src/services/events/flows/fetchEventFlow.js` — `GET /events/:eventId`, returns `{ item }`.
- Registered as `events.fetchEvent` in `flowRegistry.js`.

---

## 2026-04-03 (Session 3)

### Features

- **Booking request chat UI** — full end-to-end booking negotiation flow inside the chat widget.

#### Architecture
- Single `booking_request` message per booking; status changes are PATCH updates (no new messages for accept/decline/counter_offer).
- Booking card is **filtered out** of the scroll list and rendered as a **full-width sticky banner** at the top of the chat via a new `pinned-banner` slot in `FlexChat.vue`.
- Separate `activity_log` messages appear in the thread for key events (fan sent request, creator accepted/declined).

#### New Components
- **`BookingRequestBubble.vue`** — compact booking card with 6 states: creator-pending (Accept/Decline/Adjust), creator-counter_offer (waiting), fan-counter_offer (Accept/Cancel), accepted (✓ badge + View in Calendar), declined (✗ badge + View Details), fan-pending (waiting + View Details). `pinned` prop makes it full-width.
- **`BookingRequestDetailPopup.vue`** — full booking detail popup. On mount fetches live booking status and syncs `currentAction` so stale `content.action = 'pending'` is corrected when booking is already `confirmed`. Handles all action states including counter_offer fan buttons.
- **`AdjustBookingPopup.vue`** — creator counter-offer form (session duration, add-ons, remarks, adjustment tokens, total). Submits via `chat.updateBookingRequestMessage` with `action: 'counter_offer'` and structured `meta`.

#### New Flows (all registered in `flowRegistry.js`)
- `chat.sendBookingRequestMessage` — `POST /chats/:chatId/messages/booking`
- `chat.updateBookingRequestMessage` — `PATCH /chats/:chatId/messages/:messageId/booking`
- `chat.sendChatActivityLog` — `POST /chats/:chatId/messages` with `contentType: 'activity_log'`
- `bookings.fetchBooking` — `GET /bookings/:bookingId`

#### Backend Changes (`bookings/`)
- **`ChatManager.js`**: `sendBookingRequestMessage` — added `counter_offer` to valid actions, added `meta` object field to content. New `updateBookingRequestMessage(chatId, messageId, updates)` — resolves `message_ts` via `MessageIdIndex` GSI, merges content, calls `ScyllaDb.updateItem`.
- **`chats.js` routes**: `POST /:chatId/messages/booking` now accepts `counter_offer` + `meta`. New `PATCH /:chatId/messages/:messageId/booking` route.

#### `ChatWindow.vue` Changes
- `allMessages` / `messages` (booking_request filtered) / `pinnedBookingMessage` computed.
- `variantForMessage` returns `'system'` for both `booking_request` and `activity_log`.
- Pinned banner slot renders `BookingRequestBubble` with full action wiring.
- Accept/Decline buttons call `performBookingDecision` directly (no popup). Up-arrow opens detail popup.
- `performBookingDecision` → `bookings.reviewPendingBooking` + `chat.updateBookingRequestMessage` + `sendChatActivityLog`.
- `broadcastBookingUpdate` → `chatStore.addMessage` (in-place update) + socket broadcast.
- `onCancelBooking` → `bookings.cancelBooking` + update message to `declined`.
- Watch on `pinnedBookingMessage` marks it read immediately (banner is outside `IntersectionObserver` scope).
- `ActivityLogTexts` map + `resolveActivityLogText` with two-step resolution: template pick by role (`isCreatorAccount`) + generic token replacer (`@{creator}`, `@{audience}`, `@digits`).
- `sendChatActivityLog(text, meta)` helper — fire-and-forget, broadcasts via socket.
- Activity log messages rendered as centered italic text (no bubble).

#### `BookingFlowStep3.vue` Changes
- Before `sendBookingRequestMessage`: sends `sendChatActivityLog` with `"@{fanUsername} has just sent you a live call request:"`.

#### `ChatListPanel.vue` Changes
- `getChatDisplayName`: if `chat.metadata?.is_booking_request`, return `chat.name` directly (bypasses user data lookup that showed username instead of display name on reload).

#### `FlexChat.vue` Changes
- Added `pinned-banner` slot between header and scrollable body (`shrink-0 w-full`).

### Bug Fixes
- **Detail popup showing Accept/Decline on already-confirmed booking** — `currentAction` was initialized from stale `message.content.action = 'pending'`. Fixed by running `deriveAction(booking.status)` after fetch and overwriting `currentAction` if result is non-pending.
- **Bubble showing wrong action after PATCH** — `resolvedAction` was overridden by `deriveAction('pending')` from the bookings API, shadowing `content.action = 'counter_offer'`. Fixed by prioritizing any non-`pending` `content.action` over the API status.
- **Activity log showing `@4424` instead of username** — `resolveActivityLogText` now replaces all `@{digits}` tokens with usernames from `chatStore.chatUsersData`.
- **Booking chat showing username in chat list on reload** — fixed via `metadata.is_booking_request` guard in `getChatDisplayName`.

---

## 2026-04-02 (Session 2)

### Bug Fixes
- **`markMessageRead` called again on chat window reload** — on remount, `_markedReadIds` is a fresh empty `Set` and `observeNewRows()` checks `msg?.status === 'read'` to skip already-read messages. However, `fetchMessagesFlow` was not normalizing `status` from the API response, so fetched messages arrived without a `status` field and the guard never triggered. Fixed by deriving `status: 'read'` from `read_receipts[].user_id` in the flow.

### Changes (`fetchMessagesFlow.js`)
- Accepts optional `currentUserId` in payload
- Each fetched message: if `read_receipts` contains `currentUserId`, sets `status: 'read'`; otherwise uses `m.status` from API or defaults to `'sent'`

### Changes (`ChatWindow.vue`)
- `fetchMore()` passes `currentUserId` to `chat.fetchMessages` flow

---

## 2026-04-02

### Features

- **New Message popup** — creators can now start chats directly from the chat widget. Edit icon in `ChatListPanel` header opens a `PopupHandler`-based popup (`NewChatPopup.vue`) with four sections:
  - **Missed Call Users** — random audience users
  - **Subscribers** — grouped by subscription tier, with per-tier "Message All" button
  - **Top Followers** — paginated, sorted by follower count, with "Message All" button
  - **Unsubscribed Users** — followers without a paid subscription, paginated, with "Message All" button
  - **Search** — debounced (300ms) username/display name search across all fans

- **Pending chat pattern** — clicking "Message" opens a `ChatWindow` instantly with no API call. The chat (`createChat` or `createGroupChat`) is only created when the user sends their first message. Eliminates empty chat creation.

- **Group chat (Message All)** — "Message All" buttons fetch the complete user ID list for their section via a new `GET /wp-json/api/chat/new-message-users/group-ids` endpoint, then open a pending group chat window. On first message send, `createGroupChat` is called with `type` set to the group type string (`subscribers_<tier_id>`, `top_followers`, `unsubscribed`).

- **Group chat duplicate detection** — before creating a new group, `chatStore.userChats` is scanned for an existing chat where `c.type === groupType`. If found, new participants are added to the existing group (using the updated multi-user `addChatParticipant` endpoint) instead of creating a duplicate.

- **User data pre-population** — when a 1-on-1 chat is opened from the popup, the user's `{ display_name, username, avatar }` is written directly into `chatStore.chatUsersData` from the popup's existing response. No extra `GET /get-users-data` API call needed.

- **Multi-participant add** — `addChatParticipantFlow.js` updated to support `userIds: string[]` in payload. Backend already supported `POST /chats/:chatId/participants` with `{ userIds }` body.

### New Files
- `vueApp/src/components/ui/chat/NewChatPopup.vue` — full popup component
- `vueApp/src/utils/resolveParentUserData.js` — safely reads `window.parent.userData` for iframe context
- `vueApp/src/services/chat/flows/fetchGroupUserIdsFlow.js` — fetches all user IDs for a section (no pagination)

### New Flow Registrations (`flowRegistry.js`)
- `chat.createGroupChat`
- `chat.addChatParticipant`
- `chat.fetchGroupUserIds`

### New WordPress REST Endpoints (`includes/class-api-chat-users.php`)
- `GET /wp-json/api/chat/new-message-users` — default, search, and load-more modes
- `GET /wp-json/api/chat/new-message-users/group-ids` — returns all IDs for a section (subscribers, top_followers, unsubscribed)

### Changes (`ChatWindow.vue`)
- `chatId` prop changed from required to `default: null`
- New props: `targetUserId` (1-on-1 pending), `targetUserIds[]` (group pending), `groupType`
- Internal `activeChatId` ref replaces direct `props.chatId` usage throughout — updated in place when pending chat is created on first send
- `fetchMore` and `onMounted` skip when `activeChatId` is null (pending state)
- `sendMessage` handles both pending 1-on-1 (`createChat`) and pending group (`createGroupChat`) before sending
- Emits `chat-created` event with new chatId so parent can update `openChats` entry

### Changes (`ChatFloatingWidget.vue`)
- `openChats` entries have stable `uid: Date.now()` — prevents component remount when `chatId` updates from null to real ID
- `openChatWindow` deduplicates by `chatId`, `targetUserId`, and `groupType`
- `closeChatWindow(uid)` and `onChatCreated(uid, newChatId)` use `uid` instead of `chatId`
- `chatListRef` template ref on `<ChatListPanel>`; `chatListRef.value?.chatReady?.()` called in all `onStartChat` paths to close popup after window opens
- Group path checks for existing group by type before creating

### Changes (`ChatListPanel.vue`)
- Edit button (creator-only) opens `NewChatPopup` via `PopupHandler`
- `isCreator` and `creatorId` computed from `resolveParentUserData()` for iframe compatibility
- `onNewChatMessage` emits `start-chat` without closing popup; `onChatReady()` closes it
- `defineExpose({ chatReady: onChatReady })` for parent template ref access

### Changes (`addChatParticipantFlow.js`)
- Accepts `userIds: string[]` for multi-add; sends `{ userIds }` body to backend
- Returns `{ results: [...] }` for multi, existing single shape otherwise
## 2026-03-30

### Features

- **Guest session ID for temporary holds** — `resolveGuestSessionId.js` utility generates a unique per-tab guest ID (`12345` + 7 random digits) stored in `sessionStorage`. Used as `userId`/`fanId` fallback when fan is not logged in, replacing the shared static `userId = 1`.

### Bug Fixes

- **`BookingFlowStep3` — guest fan hold** — `ensureTemporaryHold` now passes `resolveFanId() || resolveGuestSessionId()` as `userId`/`fanId` in the flow context, preventing "Missing required fields: userId" for unauthenticated fans.

- **`BookingFlowStep3` — temporary hold userId mismatch** — `finalizeBooking` now calls `bookings.updateTemporaryHoldUser` before `createBooking` on all payment paths (topup and direct), replacing the guest placeholder userId with the real authenticated userId.

- **`createBookingMapper` — fanId `??` vs `||`** — changed nullish coalescing to `||` so a falsy `fanId = 0` correctly falls through to the context fallback instead of being used as-is.

- **`TopUpForm` — hardcoded `userId` and `creatorId`** — replaced `localStorage.getItem('userId') ?? 0` and hardcoded `creatorId = 1` with props received from `BookingFlowStep3`. `resolveFanUserId()` now returns `props.fanId || window.userData.userID || 0`; `resolveCreatorId()` returns `props.creatorId || 0`. Guest session ID is intentionally not forwarded to the payment form.

### New Files

- `src/utils/resolveGuestSessionId.js` — guest session ID generator

### New Flow Registrations (`flowRegistry.js`)

- `bookings.updateTemporaryHoldUser`

### New Flows

- `src/services/bookings/flows/updateTemporaryHoldUserFlow.js` — `PATCH /temporary-holds/:id/user`

---

## 2026-03-26

### Features
- **Message status indicators** — outgoing messages now show inline status icons inside the bubble:
  - Clock (gray) = `pending` (optimistic, before API responds)
  - Single checkmark (gray) = `sent` (API confirmed)
  - Double checkmark (gray) = `delivered` (recipient's socket received it)
  - Double checkmark (blue) = `read` (recipient viewed it)

- **Visibility-based read receipts** — uses `IntersectionObserver` (root = chat scroll container, threshold 0.5) instead of a blanket on-mount scan. Messages are marked as read only when they scroll into the visible area of the chat window. Works for both new incoming messages and historical messages scrolled into view.

- **Last message sync in chat list** — `ChatListPanel` now updates in real time:
  - Updates when a message arrives via socket
  - Updates when the current user sends a message
  - Format: `"You: text"` for own messages, `"Name: text"` for others (name resolved from `chatUsersData`)

- **Unread indicator from API on page load** — on mount, `ChatFloatingWidget` calls `GET /chats/:chatId/unread?userId=...` in parallel for all chats and sets the exact server count. Previously the count was lost on every reload.

- **Unread dot reactive updates** — dot appears when a message arrives via socket; clears when the user views the messages (IntersectionObserver fires).

### Bug Fixes
- **`api.get` query params silently dropped** — `api.get(url, obj)` spreads the second arg into `request()` options; only a key named `params` reaches `constructUrl` and gets appended to the URL. All affected flows were passing query params directly and they were being ignored. Fixed in:
  - `fetchMessagesFlow.js` — `limit` and `pagingState` were never sent; pagination was broken
  - `getUnreadCountFlow.js` — `userId` was never sent
  - `searchMessagesFlow.js`
  - `getChatParticipantsFlow.js`
  - `fetchMessagesByUserFlow.js`
  - `searchGroupsFlow.js`

- **`watch(messages)` not firing on socket push** — shallow watch does not detect array mutations (`.push`). Replaced with `watch(() => messages.value.length)` + `IntersectionObserver`.

- **Unread count lost on page reload** — `fetchUserChats` response `unread_count` was stale. Now re-fetched via dedicated unread endpoint on every mount.

### Refactoring
- **`sendSocket(flag, payload)` primitive** in `useChatSocket.js` — extracted common socket send logic. `sendChatMessage` and `sendStatusUpdate` both delegate to it instead of duplicating mode-switching code.

### New Flow Registrations (`flowRegistry.js`)
- `chat.markMessageDelivered`
- `chat.markMessageRead`
- `chat.getUnreadCount`

### Store Actions Added (`useChatStore.js`)
- `updateMessageStatusAction({ chatId, messageId, status })` — patches only the `status` field on a message
- `updateChatLastMessage(chatId, message)` — replaces `last_message` on a chat row
- `updateChatUnread(chatId, hasUnread)` — toggles unread indicator (increments / resets to 0)
- `setChatUnreadCount(chatId, count)` — sets exact count from API

### UI Changes
- `ChatListPanel` height set to `h-[480px]` to match chat window height
- `ChatListPanel` `z-[9999]` added
- `FlexChat` exposes `bodyEl` ref via `defineExpose` for use as `IntersectionObserver` root

---

## 2026-03-26 (Session 2)

### Features
- **Post-booking chat creation** — after a booking is confirmed in `BookingFlowStep3.vue`, a direct chat is automatically created between fan and creator under the following conditions:
  - `allowInstantBooking=true AND allowPersonalRequestRequired=true` → chat created
  - `allowInstantBooking=false` → chat created
  - Otherwise → no chat created
- **Booking request message** — after chat creation, a `booking_request` message (action: `pending`) is sent and pinned in the new chat
- **`slot_date` resolved from preflight payload** — reads `fanBooking.booking.lastPreflightPayload.startIso` (was incorrectly trying two state keys that are never set)
- **Chat list reloads without page refresh** — after `sendBookingRequestMessage` succeeds, the booking flow sends a `chat:message` socket event to all participants; each user's `_handleIncomingChatMessage` detects the unknown `chat_id` and calls `chat.fetchUserChats` before processing the message

### Bug Fixes
- **`createChat` missing required fields** — payload was missing `createdBy` and participants were not strings. Fixed: added `createdBy: String(fanUserId)`, converted `participants` to `[String(fanUserId), String(creatorId)]`
- **`chat.markMessageRead` called for already-read messages** — `observeNewRows()` was observing all rows including those with `status='read'`. Fixed by skipping messages where `msg?.status === 'read'`

### Changes (`useChatSocket.js`)
- `_handleIncomingChatMessage` is now `async` — awaits `chat.fetchUserChats` when an incoming message belongs to an unknown chat, ensuring the chat row exists in the store before `addMessage` and `updateChatLastMessage` run

### Changes (`BookingFlowStep3.vue`)
- `createChat` payload now includes `name` (event title) and `description` (`"Booking request for <eventTitle>"`)
- Imports `useChatSocket` to send `chat:message` socket event to participants after booking request message is created

### New Flow Registrations (`flowRegistry.js`)
- `chat.sendBookingRequestMessage`
- `chat.pinMessage`
