# Changelog

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
