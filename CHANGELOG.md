# Changelog

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
