# Changelog

## 2026-06-26 — Calendar Event Details UI & Chat Integration

### Changed

#### `src/components/calendar/CalendarEventDetailsPopup.vue`
- **Loading State UI** — Added a `bookingLoading` state to show a skeleton loading animation while `bookingData` is being fetched. This hides the Accept/Decline/Adjust buttons and waiting statuses until data is fully loaded.
- **Conditional Fetching** — Added a condition to only execute `bookings.fetchBooking` if `canReviewPending` is true, preventing unnecessary API calls.
- **Dynamic Waiting UI** — Replaced Accept/Decline buttons with a "Waiting for response" indicator (with Hourglass icon) when a request is in `pending` or `counter_offer` state depending on the user role.
- **Open Chat Fallback** — Updated the "Open chat" button to emit an `@open-chat` event containing a payload. If `chatId` is missing, it dynamically falls back to the target `userId` (using `user_id` if the current user is a creator, or `creator_id` if the user is a fan).

#### `src/components/calendar/MainCalendar.vue`
- **Socket Messaging Fix** — Resolved `TypeError: Cannot read properties of undefined (reading 'value')` by destructuring `sendChatMessage` directly from `useChatSocket()` instead of accessing it through `socket.value`.
- **Real-time Counter Offer** — Updated `handleAdjustSubmitted` to broadcast the counter-offer socket message to both Creator and Fan to ensure optimistic UI updates across both clients.
- **Dynamic Open Chat Logic** — Added `handleOpenChat` listener to process `@open-chat` events from the details popup. In Embed Mode (`window.self !== window.top`), it securely triggers `window.parent.chatEmbed.openChat(payload)` to open the floating widget. In Normal Mode, it outputs a `console.log` pending further integration.

#### `src/components/ui/chat/BookingRequestBubble.vue`
- **Past Requests Interaction Prevention** — Disabled all actionable buttons (Accept, Decline, Adjust, Accept New Time, Reject, Accept Changes, Cancel Booking) and prevented emit events for booking requests that have already passed their scheduled time (`isPassCall`). Added an opacity-50 styling to visually indicate the disabled state.

#### `public/bookings-embed/event-chat-iframe.html`
- **New Host Demo Page** — Created a combined test bed HTML file demonstrating seamless integration of both `fs-events-host.js` and `fs-chat-host.js`. The events dashboard renders full-width, while the chat widget runs as a floating overlay.

## 2026-06-18 — Chat Popup UI & Iframe Resize Fixes

### Changed

#### `src/components/ui/chat/NewChatPopup.vue`
- **Loading UI Polish** — Replaced the static "Loading..." text with a dynamic SVG spinner matching the app's standard spinner design.

#### `src/embeds/chat/ChatEmbedApp.vue`
- **Iframe Resize Fix** — Updated `attachObserver` to correctly attach the `overlayObserver` even if the popup overlay (`data-popup-overlay`) is already present in the DOM. Also updated `checkPopupState` to check `opacity !== '0'` instead of waiting for `visibility === 'visible'`, ensuring the iframe resizes immediately when a teleported popup (like Members or New Message) closes. This resolves a bug where the chat iframe remained permanently stuck at full height.

#### `public/bookings-embed/fs-chat-host.js`
- **Mobile Outside Click** — Added a `document.addEventListener("click")` handler to automatically close the chat list on mobile devices (`window.innerWidth < 768`) if the user taps on the transparent background outside the active chat widget.

#### `src/components/ui/chat/ChatListPanel.vue`
- **Payload Enrichment** — Updated `getChatTargetPayload` to correctly evaluate and include `chatType` and `groupType` in the payload when a chat is opened. This ensures the receiver has explicit context on whether the chat is a 1-on-1 private chat or a group chat.

#### `src/components/ui/chat/ChatFloatingWidget.vue`
- **Duplicate Chat Window Fix** — Refined the `isDupe` logic in `openChatWindow` to only match by `targetUserId` if both the incoming chat and the existing open chat are strictly evaluated as `private` chats. This resolves a false-positive duplication bug where opening a creator's Free Subscription group chat and their private CosMania 1-on-1 chat simultaneously would incorrectly block one from opening because both shared the same `targetUserId` (the creator's ID).

#### `src/components/ui/chat/ChatWindow.vue` & `src/components/ui/chat/ChatMembersPopup.vue`
- **Pre-created Group Chat Members Fix** — Passed `targetUserIds` directly from `ChatWindow` into `ChatMembersPopup`. Updated the `participants` computed property in `ChatMembersPopup` to fallback to `targetUserIds` if the chat hasn't been created in the database yet. This ensures all selected users are properly displayed in the Members list during the preview state, rather than just showing the creator.

## 2026-06-15 — Chat Embed Mobile & Rendering Fixes

### Changed

#### `public/bookings-embed/fs-chat-host.js`
- **Resize Snapping Fix** — Extracted `snapToEdges` out of the drag initializer scope, allowing the widget to correctly recalculate and apply mobile vs desktop styling classes immediately upon `window.resize` events.
- **Mobile Tap-to-Click Fixes** — Removed `e.preventDefault()` from the `touchstart` listener and added a 3px movement threshold inside `onMove`. This completely resolves a critical bug where simple taps on touch screens were being swallowed or falsely flagged as drags, preventing the chat from opening.
- **Deferred Rendering** — Initialized the external chat button with `display: none` and added a message listener for `FS_CHAT_READY`. This guarantees the widget remains completely hidden until the underlying Vue application has finished mounting and loading its data.

#### `public/bookings-embed/fs-chat-button.css`
- **Stretch Prevention** — Enforced rigid sizing (`width` and `height`) rules to prevent a bizarre bug where the flex container would vertically stretch into a giant pill shape on some mobile layout environments.

#### `src/components/ui/chat/ChatFloatingWidget.vue`
- **Lifecycle Sync** — Dispatched `FS_CHAT_READY` via `postToParent` directly inside `onMounted` to orchestrate the deferred display of the host's external button.

## 2026-06-09 — Chat Embed Positioning & Mobile UI Polish

### Changed

#### `src/embeds/chat/ChatEmbedApp.vue`
- **Dynamic Resize Optimization** — Removed `!bottom-0` forcing logic in `notifyResize()` to prevent infinite resize loops where the iframe's calculated height constantly triggered observer callbacks.
- **Trigger Width Payload** — `notifyResize()` now reads the width of `.chat-panel-trigger` and includes it as `trigger_width` in the `FS_CHAT_RESIZE` payload so the host script can accurately track the chat button's dimensions.

#### `src/components/ui/chat/ChatFloatingWidget.vue`
- **Mobile Edge Spacing** — Added dynamic offset logic to `widgetStyle`. When embedded on mobile-sized viewports (`hostWidth < 768`), the widget now intelligently applies a `0.5rem` (8px) margin depending on the active alignment states (`isLeftAligned`, `isTopAligned`). This prevents the widget from sticking flush against the absolute edge of the screen on mobile devices.

#### `public/bookings-embed/fs-chat-host.js`
- **Snap Positioning Fixes** — Updated `onHostDragEnd` and initial mount states to snap the `chatContainer` exactly to `0px` on the left or right edges instead of forcing a 16px offset. The 16px offset caused the iframe to get cut off because the host page's viewport width didn't account for it.
- **Vertical Snapping Constraint** — Updated `onHostDragEnd` logic to enforce vertical snapping to the top (`0px`) or bottom (`window.innerHeight - height`) edges depending on `isTopAligned`. The widget can no longer be dropped floating in the middle of the screen vertically.
- **Drag Handle Alignment** — Adjusted the secondary drag handle's starting and snapping position using the dynamically passed `trigger_width` so that it stays anchored flush to the correct side of the chat button regardless of whether the widget is left-aligned or right-aligned.
- **Drag Handle UI Polish** — Reduced the size of the drag handle to 24px x 24px, removed the yellow background in favor of a clean transparent look with a `gray-600` icon, and perfectly centered it vertically relative to the chat button (`16px` from bottom/top).
- **Touch Device Drag Handle** — Added device capability detection (`ontouchstart`). The drag handle is now permanently visible on mobile/touch devices since `mouseenter` hover events aren't viable, guaranteeing the widget remains draggable on mobile without requiring obscure long-press actions.

#### `public/bookings-embed/chat.html`
- **Clean Embed View** — Injected a scoped `<style>` block to forcefully hide the `#\_\_vue-devtools-container\_\_` wrapper exclusively inside the embed iframe environment, ensuring the devtools UI never leaks into client-facing external pages.
## 2026-06-08 — Chat Pinned Messages & Call Notification Refinements

### Changed

#### `src/composables/useChatSocket.js`
- **Socket-Driven Unpinning** — Updated `_handleIncomingChatMessage` so that when a `requestJoinCallNotification` arrives via the websocket, the app instantly and silently unpins any existing `booking_request` for the same `booking_id` from the local UI state without making redundant API calls.

#### `src/components/ui/chat/ChatWindow.vue`
- **Strict Expiry Threshold** — Refined the `unpinInterval` by entirely removing the `startAtIso` fallback, ensuring that a pinned booking notification strictly remains pinned for the full duration of the call until `endAtIso` is officially reached.
- **Array Casting Safety** — Added a defensive `Array.isArray()` cast for the `currentPinned` variable inside both the `unpinInterval` and `pinnedBookingMessages` watcher to definitively prevent `TypeError: currentPinned.filter is not a function`.
- **Disable Single-Card Swiping** — Added logic to `onTouchStart()` to return early and disable swipe interactions if there is only one pinned message in the stack. Also conditionally removed `cursor-grab` utility classes so the UI no longer suggests the card is draggable.
- **Duplicate Notification Handling** — Added a watcher for `pinnedBookingMessages` to detect multiple `requestJoinCallNotification` messages for the same `booking_id`. It now automatically keeps the newest notification pinned while firing the unpin API to clean up older duplicates.
- **Previous Notification Linking** — Updated the `pinnedBookingMessages` computed property to scan `allMessages` and securely attach any older notification as `prev_notification` to the latest `requestJoinCallNotification` object.
- **Cancelled Booking Cleanup** — Extended the `unpinInterval` to immediately unpin any `booking_request` message if its `action` is marked as `'cancelled'`.

#### `src/components/ui/chat/LiveCallRequest.vue`
- **Dynamic Menu Visibility** — Introduced a `hasAcceptedPrevNotification` computed property that checks if the injected `prev_notification` was already accepted. If true, it dynamically hides the 3-dot options menu, reducing UI clutter and preventing conflicting actions.
## 2026-06-05 — Smart Calendar Navigation & Stacked Card UI Fixes

### Changed

#### `src/components/ui/chat/ChatFloatingWidget.vue`
- **Global Chat Closure Mechanism** — Introduced a global custom event listener (`fs-chat-close-all`) in `onMounted` (and cleaned up in `onBeforeUnmount`). When dispatched, it instantly clears `openChats` and sets `isListOpen` to false, hiding the entire chat interface without needing a page refresh.

#### `src/components/ui/chat/BookingRequestBubble.vue`
- **Smart Calendar Redirection** — Upgraded `goToCalendar()`. It now checks `window.top.location.pathname` inside a `try/catch` block. If the user is already on the `/dashboard/events` page, it dispatches `fs-chat-close-all` to reveal the events page behind the widget instead of triggering a full reload.
- **Accepted State Layout** — Fixed excessive bottom spacing when a booking is accepted. Consolidated button styling into a flex layout to eliminate trailing margins.
- **Card Stretching** — Conditioned the root element to apply `h-full` and `flex flex-col` when pinned. This allows the card to stretch dynamically and match the height of other taller cards in a stack.

#### `src/components/ui/chat/LiveCallRequest.vue`
- **Card Stretching** — Added `h-full` and `flex flex-col` to the root element to ensure consistent stretched heights when placed in the pinned message grid stack.

#### `src/components/ui/chat/ChatWindow.vue`
- **Uniform Stack Heights** — Removed the `items-end` utility class from the grid container holding pinned messages. By defaulting to `items-stretch`, all stacked cards now naturally expand to match the exact height of the tallest card in the stack, completely preventing shorter cards from awkwardly poking out from the front.
## 2026-06-03 — Chat Schema Modernization & Calendar Redirection

### Changed

#### `src/components/ui/chat/ChatWindow.vue`
- **Chat Creation Payload** — Updated the `chat.createChat` flow handler payload for 1-on-1 private chats to dynamically pass modern properties (`chatType`, `chatSubtype`, `contextFlags`, `metadata`, `visibilitySettings`) instead of the legacy hardcoded `type: 'private'`.

#### `src/components/FanBookingFlow/OneOnOneBookingFlow/BookingFlowStep3.vue`
- **Context Flags Fix** — Corrected a typo in the `fireAndForgetPostBookingChat` method where `contextFlags` were set to `['support']` instead of `['booking']`.

#### `wordpress/wp-content/plugins/fansocial/includes/class-chats.php`
- **Schema Modernization** — Updated the `create_chat` function to strip out the legacy `'type' => 'direct'` attribute in favor of the standardized `chatType => 'private'`, `chatSubtype => 'standard'`, and `contextFlags => ['booking']`.

#### `src/components/ui/chat/BookingRequestBubble.vue`
- **Calendar Redirection** — Separated the "View in Calendar" button logic from the generic "View Details" event emission. When clicked for accepted bookings, it now explicitly redirects the top-level window to `/dashboard/events` to ensure it properly breaks out of the iframe embed context.

## 2026-06-03 — Chat Block/Unblock Integration

### Added

#### `src/services/chat/flows/chatBlockUserFlow.js` _(new)_
- **Chat Block User** — Created a new flow `chatBlockUserFlow` to hit `POST /chats/users/block` to filter messages and unread counts for blocked users in the chat system.

#### `src/services/chat/flows/chatUnblockUserFlow.js` _(new)_
- **Chat Unblock User** — Created a new flow `chatUnblockUserFlow` to hit `POST /chats/users/unblock` to restore chat functionality for unblocked users.

### Changed

#### `src/services/flow-system/flowRegistry.js`
- **Flow Registration** — Registered `"chat.blockUser"` and `"chat.unblockUser"` to the centralized flow handler.

#### `src/services/block-users/flows/blockUserFlow.js`
- **Global Sync** — Injected a background hook using `FlowHandler.run('chat.blockUser', ...)` to silently sync global blocks to the chat API immediately upon success.

#### `src/services/block-users/flows/unblockUserFlow.js`
- **Global Sync** — Injected a background hook using `FlowHandler.run('chat.unblockUser', ...)` to silently sync global unblocks to the chat API immediately upon success.

## 2026-06-02 — Group Chat Blocking Logic & Socket Security

### Added

#### `src/services/block-users/flows/getBlocksForUserFlow.js` _(new)_
- **Fan Block Fetching** — Created a new flow `getBlocksForUserFlow` to hit `GET /block-users/getBlocksForUser` allowing fans to efficiently retrieve their block data across all scopes.

### Changed

#### `src/components/ui/chat/NewChatPopup.vue`
- **Group Payload Structuring** — Overhauled the schema for creating "Message All" broadcast groups. Instead of overloading the root `type` field, all broadcast chats are now strictly created with `type: "group"`.
- **Contextual Categorization** — Added native mapping for group specific contexts:
  - `"top_followers"` and `"unsubscribed"` now inject `chatSubtype: 'support_group'` and `contextFlags: ['support']`.
  - `"subscribers"` injects `chatSubtype: 'subscription'` and `contextFlags: ['subscription']`.
- **Metadata Identity** — Automatically preserved the original target identifier (e.g. `subscribers-25`) by appending it into `metadata.nativeType` for deep routing support.

#### `src/components/ui/chat/ChatFloatingWidget.vue`
- **Schema Propogation** — Updated `onStartChat` and the component template to accept and bridge the new payload fields (`chatType`, `chatSubtype`, `contextFlags`, `metadata`).
- **Visibility Settings** — Replaced the legacy `rulesJson` property with the more standard `visibilitySettings` field.

#### `src/components/ui/chat/ChatWindow.vue`
- **Group Creation Props** — Added explicit prop definitions for `chatType`, `chatSubtype`, `contextFlags`, and `metadata`.
- **API Payload Delivery** — Updated the `createGroupChat` flow invocation to bundle and submit the full structural schema (along with `visibilitySettings` and `coverImageUrl`) directly to the backend.
- **Group Chat UI Locking** — Updated `isChatBlocked` logic so that `userScoped` broadcast groups are treated like private 1-on-1 chats. If a block exists between the fan and the creator, the chat input is instantly disabled with the placeholder "You cannot send messages to this user."
- **Socket Broadcast Security** — Filtered the `getMessageRecipients` list to strictly exclude any user IDs present in `chatStore.blockedUserIds`. This guarantees that if a creator blocks a fan (or vice versa), the backend socket event for new messages will never be emitted to the blocked user.
- **Socket Real-Time Block Sync** — Wired up `handleBlockMember` and `handleUnblockMember` to emit `chat:block` events (via `sendBlockUpdate`) immediately after a successful database update, ensuring real-time UI lockdown on the recipient's device.

#### `src/composables/useChatSocket.js`
- **Socket Real-Time Block Emitter** — Added `sendBlockUpdate(recipientId, isBlocked)` helper to emit the `chat:block` event, strictly including the `from: userId` parameter in the payload to ensure accurate identification across the network.
- **Socket Real-Time Block Listener** — Implemented `_handleIncomingBlockUpdate` to intercept `'chat:block'` socket events. Instantly pushes or pulls the blocker's ID into `chatStore.blockedUserIds`, automatically syncing the UI without requiring a page refresh. Hooked this listener into all three socket contexts (standalone, parent window, and iframe bridge).

#### `src/stores/useChatStore.js`
- **Soft-Delete Block Filtering** — Updated `fetchBlockedUsers` to explicitly strip out any block records containing a `deleted_at` timestamp. This prevents soft-deleted (unblocked) records from persistently locking the chat UI.
- **Role-Based Block Fetching** — Routed `fetchBlockedUsers` dynamically: Creators continue using `listUserBlocks`, while Fans now route through the optimized `getBlocksForUser` flow, filtering strictly for the `private_chat` scope.

#### `src/services/flow-system/flowRegistry.js`
- **Flow Registration** — Registered `"blocks.getBlocksForUser"` to hook the new fan block-fetching pipeline into the centralized flow handler.

## 2026-06-01 — Banned Words Fix & Chat UI/Layout Adjustments

### Changed

#### `src/utils/bannedWordsFilter.js`
- **Profanity Filter Boundaries** — Wrapped the generated regular expression with `\b` word boundaries to ensure the filter only targets full words. This prevents legitimate words from being incorrectly censored when they happen to contain a banned substring (e.g. the word "message" is no longer masked for containing "sage").
- **Fallback Logic** — Updated the literal fallback `indexOf` loop with manual boundary checks (checking surrounding characters for non-word `\W` characteristics) to maintain parity with the regex fixes.

#### `src/__tests__/bannedWordsFilter.spec.js`
- **Unit Tests** — Added test cases to explicitly verify that substrings within innocent words do not trigger the masking function.

#### `src/components/ui/chat/ChatWindow.vue`
- **Creator-Only Member Popup** — Restricted the ability to click the group avatar header to open the Member Popup solely to creators. Removed `cursor-pointer` and hover opacity styling for non-creator accounts.
- **Group Name Truncation** — Added flex minimum widths (`min-w-0`, `flex-1`) and `truncate` classes to the group chat header to prevent long group names from breaking the UI layout.
- **Participant Parsing** — Enhanced `getMessageRecipients` to strictly map all participant IDs to Strings.
- **Background Sync** — Optimized background chat metadata sync using the updated `resolveAndSyncChat` helper.

#### `src/components/ui/chat/ChatFloatingWidget.vue`
- **Persistent Chat List** — Disabled the automatic closing of the Chat List when a user opens a Chat Window. The Chat List must now be closed manually via its toggle button.
- **Z-Index Layering Fix** — Increased the z-index of the open chat windows wrapper from `z-[1]` to `z-[10000]`. Since the Chat List has a z-index of `z-[9999]`, this ensures that any launched Chat Window correctly renders completely on top of the Chat List without visual overlap glitches.
- **Participant Background Sync** — Refactored to leverage `resolveAndSyncChat` for fetching the latest chat details when opening a chat window from external sources.

---

## 2026-05-27 — Message All Group Schema, Avatar Fallbacks, Banned Words Filter & rawText Metadata

### Added

#### `src/utils/bannedWordsFilter.js` _(new)_
- **Banned Words Filter** — Created a standalone utility module with a 5-minute in-memory cache and concurrent request locking.
  - `fetchBannedWords()` — fetches `/wp-json/api/chat/banned-lists` and caches the `bannedWords` array for 300,000ms. Deduplicates concurrent in-flight calls via a shared promise lock.
  - `filterBannedWords(text)` — applies case-insensitive wildcard masking. `*` in a pattern matches exactly one alphanumeric character (e.g. `*ape` masks `tape`, `rape`, `cape`). Patterns sorted by descending length to prevent sub-pattern conflicts. Falls back to literal index-based replacement if regex compilation fails.
  - `resetBannedWordsCache()` — test-facing helper to reset module-level cache state.

#### `src/__tests__/bannedWordsFilter.spec.js` _(new)_
- **Unit Tests** — Vitest suite covering:
  - Cache hit: second call within 5 min does not trigger a new fetch.
  - Concurrent lock: simultaneous calls share a single in-flight promise (1 HTTP request).
  - Cache expiry: fetch is re-triggered after the 5-minute window elapses.
  - Masking accuracy: `6teen` → `*****`, `tape` → `****`, `hope` → `****`.
  - Null/empty/undefined inputs are returned unchanged.

### Changed

#### `src/components/ui/chat/NewChatPopup.vue`
- **Message All Button Schema** — Updated click handlers to pass hyphenated group types and cover image URLs:
  - Subscribers: type `'subscribers-{tier_id}'`, name `tier.tier_title`, cover image `tier.cover_image`.
  - Top Followers: type `'top-followers'`, name `'Top Followers'`.
  - Unsubscribed: type `'unsubscribed'`.
- **API Section Resolver** — Added `apiSection` mapping inside `messageAll()` to translate hyphenated frontend types back to the underscore/singular keys expected by the REST API (`subscribers`, `top_followers`, `unsubscribed`).
- **Button Interactivity** — Removed hardcoded `pointer-events-none opacity-30` from active buttons; replaced with vibrant rose-pink styles (`bg-rose-600`, hover states). Disabled gray state only applied when subscriber count is strictly 0.
- **Card Layout** — Applied `md:items-stretch` and `flex-1` to cards; set `min-h-[32px]` on preview text; aligned all Message All buttons to a consistent horizontal baseline.
- **Pagination** — Set `perPage: 4` for Top Followers and Unsubscribed "View More" section loaders.

#### `src/components/ui/chat/ChatFloatingWidget.vue`
- **Prop Bridge** — Extended `onStartChat` to receive and forward `groupCategory` and `coverImageUrl` when adding a new pending chat window. Bound `:group-category` and `:cover-image-url` to child `<ChatWindow>` components.

#### `src/components/ui/chat/ChatWindow.vue`
- **Group Chat Creation Payload** — Added `groupCategory` and `coverImageUrl` props; forwarded to `FlowHandler.run('chat.createGroupChat', ...)` so category and cover image are stored when the first message is sent.
- **Participant Avatar Auto-Fetch** — Upgraded the `props.targetUserIds` watcher to also monitor `currentUserId`. Fetches any missing profile entries (name + avatar) for both the participant list and the current user on mount/swap via `FlowHandler.run('chat.fetchChatUsersData', ...)`.
- **Stacked Pending Avatars** — Updated `displayAvatars` computed to fall back to `[currentUserId, ...props.targetUserIds]` when `activeChatId` is null (pending chat), enabling real participant photos in the group header before the first message is sent.
- **Avatar Error Fallbacks** — Declared reactive `avatarErrors` map. Added `@error` listeners to all user `<img>` tags (stacked group header, 1-on-1 header, compose input, sent bubble, received bubble). Failed image loads are instantly replaced by styled initial-letter fallback circles.
- **Banned Words — Mount Pre-Fetch** — Calls `fetchBannedWords().catch(() => {})` in `onMounted` to warm the cache in the background, eliminating HTTP latency on the first send.
- **Banned Words — Send Intercept** — `sendMessage` now runs `const text = await filterBannedWords(rawText)` before optimistic store insertion and API submission. On `ensureActiveChat` failure, restores the original `rawText` to the compose input.
- **`chat.sendMessage` Metadata** — Added `metadata: { rawText }` to the `FlowHandler.run('chat.sendMessage', ...)` payload so the backend receives the original unfiltered message text for audit/moderation purposes, per the API spec (`POST /chats/:chatId/messages` → `metadata: object`).

#### `includes/class-api-chat-users.php`
- **Pagination Default** — Changed the fallback `$per_page` value from a conditional `( $section ? 10 : 4 )` to a strict `4` to align with the frontend "View More" page size.

---

## 2026-05-27 — Group Chat: Action Filter, Persistent Layouts, Socket Kick Sync, Read-Receipt Backfill, Post-Kick Prevention & Empty Tiers Fix


### Added

#### `src/components/ui/chat/ChatMembersPopup.vue` _(new)_
- **Group Members Management** — Created a new members list popup with strict creator-only controls.
  - Hides the actions trigger menu (⋮) for non-creators.
  - Disables row click actions and hover styling for non-creators.

### Changed

#### `src/components/ui/chat/NewChatPopup.vue`
- **Empty Subscriber Tiers Refinement** — Patched empty states (`0 subscribers`) to prevent grid container distortions and layout collapses.
  - Renders a fluid organic shape-matched user avatar placeholder (`rounded-[25%_75%_50%_51%/45%_65%_36%_55%]`) when the subscriber count is 0.
  - Renders a light-gray italicized placeholder (`"No active subscribers"`) to preserve grid vertical spacing.
  - Disables and style-neutralizes the `"Message All"` button with gray backgrounds (`bg-gray-100` / `border-gray-200`) and disabled cursors.

#### `src/services/chat/flows/fetchMessagesFlow.js`
- **Post-Kick Message Prevention (API)** — Updated flow to accept `userId` / `currentUserId` in the payload and forward it as the `userId` query parameter to the `GET /chats/:chatId/messages` API call. This enables native server-side message history filtering for kicked users when reloading the widget.

#### `src/composables/useChatSocket.js`
- **Post-Kick Message Prevention (Socket)** — Added a real-time message guard inside `_handleIncomingChatMessage` to immediately ignore and drop incoming socket messages if the user has already been kicked from the group chat, preventing real-time notifications or unread/preview updates.
- **Real-Time Kick updates** — Enhanced `_handleIncomingChatMessage` to intercept kick activity logs, filter out the kicked ID locally, dispatch the background `'chat.getChat'` metadata refetch, and run `chatStore.prependChat` to authoritatively synchronize active participants.

#### `src/components/ui/chat/ChatListPanel.vue`
- **Post-Kick Message Prevention (Sidebar)** — Implemented `getAllowedLastMessage` to check if the current user was kicked and lock the sidebar message preview text on the removal activity log (or the latest message prior to it), hiding any subsequent messages.
- **Persistent Group Row styling** — Updated `getChatDisplayName` and `getChatAvatar` to inspect `chat.is_group === true || chat.is_group === 1` instead of participant counts, preserving group styling in the sidebar even when the member list drops.

#### `src/components/ui/chat/ChatWindow.vue`
- **Persistent Group Layout** — Updated group checks to examine `is_group === true || chat.is_group === 1`, preventing group chats from morphing into a 1-on-1 layout when the participant list falls to 2.
- **Universal Input Disablement** — Implemented reactive compose locking: disables inputs and shows a centered status description ("You have been removed from this group." or "There are no other active participants in this chat.") when the participant count is <= 1 or if the user is kicked.
- **Member Kick Timing** — Adjusted the kick flow to broadcast the socket kick activity log *before* local removal of the participant, ensuring the kicked user's ID is included in socket recipients.
- **Read-Receipt Helper** — Updated the `allParticipantsRead` helper to recognize 1-on-1 direct chats and zero-participant fallbacks, allowing direct chats to correctly display blue checkmarks when `status === 'read'` without checking group-style individual read receipt arrays.

#### `src/stores/useChatStore.js`
- **Chronological Read-Receipt Backfill** — Updated `updateMessageStatusAction` (for 1-on-1 chats) and `updateMessageReadReceiptsAction` (for group chats) to backfill the read state. When a subsequent message is marked as `'read'`, all older messages in that chat's list inherit the `'read'` status and merge receipts.
- **Robust Key Parsing** — Added a `getReceiptUserId` helper supporting both `userId` and `user_id` structures inside `updateMessageReadReceiptsAction` to resolve deduplication discrepancy. Forces `'read'` status updates even if no new receipts were merged (`changed || prevMsg.status !== 'read'`), preventing older messages from getting stuck as "delivered".

#### `src/composables/useChatSocket.js`
- **Real-Time Kick updates** — Enhanced `_handleIncomingChatMessage` to intercept kick activity logs, filter out the kicked ID locally, dispatch the background `'chat.getChat'` metadata refetch, and run `chatStore.prependChat` to authoritatively synchronize active participants.

#### `src/components/ui/chat/ChatListPanel.vue`
- **Persistent Group Row styling** — Updated `getChatDisplayName` and `getChatAvatar` to inspect `chat.is_group === true || chat.is_group === 1` instead of participant counts, preserving group styling in the sidebar even when the member list drops.

#### `src/components/ui/chat/ChatFloatingWidget.vue`
- Excluded group chats from 1-on-1 direct chat resolution matches in `findExistingDirectChat`.

#### `src/services/flow-system/flowRegistry.js`
- Registered the missing `'chat.removeChatParticipant'` flow in the system's registry.

#### `public/bookings-embed/chat-iframe.html`
- Relocated the "Create Group Chat" button below the stats bar.
- Added dropdown selectors for Group Type and multiple pre-selected Users (`6064`, `6065`), enforcing creator-only validations on submission.

#### `public/bookings-embed/fs-chat-host.js` & `src/embeds/chat/ChatEmbedApp.vue` & `src/components/ui/chat/FlexChat.vue`
- Integrated host, embed app, and flex chat updates supporting creator role verification and iframe auto-resizing.

---

## 2026-05-21 — Refactor: `postToParent()` Helper for `window.parent.postMessage`

### Added

#### `src/utils/postToParent.js` _(new)_
- **`postToParent(type, payload?)`** — shared utility that wraps every `window.parent.postMessage` call in a single place.
  - Silently no-ops when `window.parent` is inaccessible (cross-origin, sandboxed iframe, same-window context).
  - Always targets `'*'` — consistent with existing behaviour.
  - Builds `{ type, payload }` message shape (payload omitted when not provided).
  - Centralises the `try/catch` so call-sites are a single line.

### Changed

#### `src/components/ui/chat/ChatWindow.vue`
- Imported `postToParent` and replaced all 5 raw `window.parent.postMessage` blocks:
  - `FS_CHAT_TOPUP_REQUIRED` (topup flow)
  - `FS_CHAT_EVENT { type: 'chat_created' }` (ensureActiveChat)
  - `FS_CHAT_PRODUCT_SELECTED` (product recommendation)
  - `FS_CHAT_EVENT { type: 'message_read' }` (_flushVisibleBatch — also removed a duplicate fire inside the `.then()` callback)
  - `FS_CHAT_EVENT { type: 'message_sent' }` (sendMessage)

#### `src/composables/useChatSocket.js`
- Imported `postToParent` and replaced the 2 `FS_CHAT_EVENT` try/catch blocks (`message_received`, `message_read`).
- Socket-protocol messages (`PARENT_CHECK_MSG`, `PARENT_SEND_MSG`) intentionally left as raw `window.parent.postMessage` — they are low-level bridge internals.

#### `src/embeds/chat/ChatEmbedApp.vue`
- Imported `postToParent` and replaced all 3 raw calls: `FS_CHAT_STATE_RESPONSE`, `FS_CHAT_RESIZE`, `FS_CHAT_FULLSCREEN`.

> **Not changed**: `embeds/events/bridge.js`, `embeds/fanBooking/bridge.js` — each already has its own local `postToParent` with an `isEmbeddedIframe()` guard and embed-specific `source` field; they remain independent.

---

## 2026-05-21 — Chat Embed: Live Stats, Parent Window Events & `totalUnread` Sync


### Added

#### `public/bookings-embed/fs-chat-host.js`
- **`FS_CHAT_EVENT` handler** — intercepts `FS_CHAT_EVENT` postMessages from the iframe, stamps `window._fsChatLastTimestamp` with the event timestamp, and dispatches a single `CustomEvent('FS_CHAT_EVENT', { detail })` on the parent window. Listeners branch on `e.detail.type` (`message_received`, `message_sent`, `message_read`, `chat_created`).
- **`refreshStats()`** — new function that calls `getState({ only: ['total', 'totalUnread'] })` via the iframe bridge, then updates all matching DOM elements in the host page:
  - Elements with `[data-header-user-chats-unread-count]` — text content and attribute value set to current unread count.
  - Elements with `[data-header-chats-total]` — text content and attribute value set to current chat total.
  - Returns `Promise<{ total, totalUnread }>` so callers can `await chatEmbed.refreshStats()`.
  - Auto-called after every `FS_CHAT_EVENT` so DOM attributes stay live.
  - Exposed on the returned API object alongside `openChat`, `getState`, etc.

#### `public/bookings-embed/chat-iframe.html`
- **Live stats bar** — pill-shaped glassmorphism badge in the hero section showing 💬 Chats and 🔴 Unread counts. Populated 2 seconds after load and refreshed on every `FS_CHAT_EVENT`.
- **Event log panel** — appears below the stats bar on first event; shows the last 20 events color-coded by type (`message_received` blue, `message_sent` green, `message_read` purple, `chat_created` yellow) with chat ID, message ID, sender, and timestamp. Includes a **Clear** button.

#### `src/composables/useChatSocket.js`
- After `_handleIncomingChatMessage` stores the message, posts `FS_CHAT_EVENT { type: 'message_received', chatId, messageId, senderId, timestamp }` to the parent window.
- After `_handleIncomingStatusUpdate` processes a `read` status, posts `FS_CHAT_EVENT { type: 'message_read', chatId, messageId, timestamp }` to the parent window.

#### `src/components/ui/chat/ChatWindow.vue`
- `ensureActiveChat`: after a new chat is created, posts `FS_CHAT_EVENT { type: 'chat_created', chatId, timestamp }` to the parent window.
- `sendMessage`: after a message is sent successfully, posts `FS_CHAT_EVENT { type: 'message_sent', chatId, messageId, senderId, timestamp }` to the parent window.
- `_flushVisibleBatch`: after updating the store (marking messages read), posts `FS_CHAT_EVENT { type: 'message_read', chatId, messageId, timestamp }` to the parent window **before** the `chat.markMessageRead` API call — so `refreshStats()` reads the already-decremented store value.

#### `src/services/chat/flows/fetchUserChatsFlow.js`
- Added `includes: 'total,total_unread'` query parameter to the `GET /chats/user/:userId` request.
- Returns `total` and `totalUnread` in the `ok()` payload.

### Changed

#### `src/stores/useChatStore.js`
- Added `chatsTotal: null` and `chatsTotalUnread: null` state fields.
- `fetchUserChatsAction`: stores `total` and `totalUnread` from the API response. Guards with `!== null` so a missing API value never overwrites a live-computed value.
- `prependChat`: increments `chatsTotal` by 1 when a new chat is added (keeps total in sync without an API re-fetch).
- `updateChatUnread(chatId, hasUnread)`: now also mirrors the delta onto `chatsTotalUnread` — increments by 1 when `hasUnread = true`, decrements by `prev` when `hasUnread = false`. Bounded by `Math.max(0, ...)`.
- `setChatUnreadCount(chatId, count)`: now also adjusts `chatsTotalUnread` by `(next - prev)` so explicit count resets (e.g. user reads a chat) are reflected immediately. Bounded by `Math.max(0, ...)`.
- `clearCache`: resets `chatsTotal` and `chatsTotalUnread` to `null`.

#### `src/embeds/chat/ChatEmbedApp.vue`
- `getState()` bridge now includes `total` (→ `chatsTotal`) and `totalUnread` (→ `chatsTotalUnread`) in the serialized state response.

#### `public/bookings-embed/chat-iframe.html`
- `handleGetState()` summary now includes `total` and `totalUnread` fields.
- Local `refreshStats()` replaced with a thin wrapper delegating to `chatEmbed.refreshStats()` (canonical implementation moved to `fs-chat-host.js`); uses the returned `{ total, totalUnread }` to update the demo stats bar badges.

---

## 2026-04-29 — Booking Bubble 3-Dot Menu, Cancel Confirmation & Submit Flow Fixes


### Added

#### `src/components/ui/chat/BookingRequestBubble.vue`
- Added 3-dot action menu to the pinned booking banner (creator only, non-terminal states). Menu items: **Ask for More Time**, **Ask to Reschedule**, **Cancel Call**.
- Buttons are visually disabled (`opacity-30`, `pointer-events-none`, `cursor-not-allowed`) when the call has already passed, using a new `isPassCall` computed that checks booking start/end times.
- Added `ask-more-time` and `ask-to-reschedule` to emitted events; wired click-outside handler to auto-close the menu.

#### `src/components/ui/chat/ChatWindow.vue`
- Wired `@ask-more-time` and `@ask-to-reschedule` on the pinned booking bubble.
- Wired `@accept-counter`, `@reject-counter`, `@ask-more-time`, and `@ask-to-reschedule` on the in-message booking bubble (previously missing).
- Added `showBookingPopup = false` after submit actions (more time, reschedule, adjust, cancel) so the detail popup closes automatically on success.

### Changed

#### `src/components/ui/chat/ChatWindow.vue`
- `onCancelBooking()` now sets `showCancelCallPopup = true` instead of immediately cancelling — the `CancelCallConfirmPopup` handles the API call and confirmation.

#### `src/components/ui/chat/BookingRequestDetailPopup.vue`
- 3-dot menu buttons (Ask for More Time, Ask to Reschedule, Cancel Call) are now disabled with greyed-out styling when `statusHint === 'Confirmed'` (call is live).

#### `src/components/ui/chat/MoreTimeRequestPopup.vue`
- `bookings.updateMeta` is now called before `chat.updateMessage` in the submit flow (previously reversed).
- Added `bookingId` guard — shows a toast and returns early if booking ID is missing.
- Added error toast when `chat.updateMessage` fails.
- Introduced `startDateIso` computed to resolve booking start date from `booking.startIso / startAtIso` with fallback to message content fields.

#### `src/components/ui/chat/RescheduleRequestPopup.vue`
- Same submit flow fix as `MoreTimeRequestPopup`: `bookings.updateMeta` first, then `chat.updateMessage`, with error handling and `bookingId` guard.
- Introduced `startDateIso` computed with the same resolution chain.

#### `src/components/ui/chat/LiveCallRequest.vue`
- `parseStartMs()` now uses a `startDateIso` computed (`booking.startIso / startAtIso` → `content.start_at` → `content.slot_date`) instead of `content.start_at` only.

---

## 2026-04-24 — Chat Flow Improvements, Pagination & Read-Receipt Fix

### Added

#### `src/services/chat/flows/getChatFlow.js`
- Already existed but was unregistered. Now registered in `flowRegistry.js` as `"chat.getChat"` — fetches a single chat by `chatId` via `GET /chats/:chatId`.

#### `src/services/chat/chatResolverUtils.js` _(new)_
- **`resolveAndSyncChat(chatId)`** — shared helper used by both `useChatSocket` and `ChatWindow`. Calls `chat.getChat`, prepends the result to the store via `prependChat`, then fire-and-forgets `chat.fetchChatUsersData` for any participant IDs not yet in `chatUsersData`.
- **`isMessageReadByUser(msg, userId)`** — pure utility. Returns `true` if the user is the message sender or is present in `msg.read_receipts`. Used to gate `markMessageRead` calls.

#### `src/stores/useChatStore.js`
- **`prependChat(item)`** — adds a single chat to the front of `userChats` (no-op if already present), and seeds `chatParticipants` / `chatPinnedMessages` from the item.
- **`chatsNextCursor`** and **`chatsHasMore`** state fields for cursor-based pagination of the user chat list.

### Changed

#### `src/composables/useChatSocket.js`
- `_handleIncomingChatMessage`: replaced full `chat.fetchUserChats` reload (for unknown chats) with `resolveAndSyncChat(chatId)` — fetches only the one unknown chat and syncs participant user data.

#### `src/components/ui/chat/ChatWindow.vue`
- `ensureActiveChat`: replaced `chat.fetchUserChats` reload after chat creation with `resolveAndSyncChat(activeChatId)`.
- `observeNewRows`: replaced `msg.status === 'read'` skip with `isMessageReadByUser(msg, currentUserId)` — messages marked read by another user but not the current viewer are now correctly observed and marked.
- `watch(pinnedBookingMessage)`: same `isMessageReadByUser` fix applied — pinned messages with global `status: "read"` are now marked read for the current user if they are not in `read_receipts`.

#### `src/services/chat/flows/fetchUserChatsFlow.js`
- Accepts `limit` (default `15`) and `cursor` payload fields, forwarded as query params to `GET /chats/user/:userId`.
- Returns `nextCursor` from the response and `append: !!cursor` so the store knows whether to replace or merge the list.

#### `src/stores/useChatStore.js`
- `fetchUserChatsAction`: handles both initial load (replace) and load-more (merge). On merge, existing chats are updated with fresh server data; new chats are appended. `chatsNextCursor` and `chatsHasMore` are updated on every call.
- `clearCache`: resets `chatsNextCursor` and `chatsHasMore`.

#### `src/services/flow-system/flowRegistry.js`
- Registered `"chat.getChat"` flow entry.

#### `src/components/ui/chat/ChatListPanel.vue`
- Added scroll-based infinite loading: attaches a `scroll` listener to the chat list container; triggers `chat.fetchUserChats` with the stored cursor when the user scrolls within 40px of the bottom.
- Replaced "Load more" button with a centered SVG spinner shown while `isLoadingMore` is true.
- Guard prevents concurrent fetches (`isLoadingMore` flag + `chatsHasMore` check).

#### `src/components/ui/chat/ChatFloatingWidget.vue`
- Removed `Promise.all` loop that called `chat.getUnreadCount` for every chat on mount — `unread_count` is now trusted directly from the `fetchUserChats` response.

---

## 2026-04-09 — Booking Counter-Offer Meta, UI Polish & Bug Fixes

### Features

#### `src/components/ui/chat/AdjustBookingPopup.vue`
- After sending a counter offer, calls `bookings.updateMeta` with type-based keys: `meta.adjust = { proposedSlotDate, proposedTokens, proposedRemarks, prevTotalTokens }` and `meta.currentCounterOffer = 'adjust'`. Emits updated booking back to `ChatWindow`.
- Backdrop click blocked while `submitting` is true.

#### `src/components/ui/chat/MoreTimeRequestPopup.vue`
- After sending, calls `bookings.updateMeta` with `meta.moretime = { proposedSlotDate }` and `meta.currentCounterOffer = 'moretime'`. Emits `{ item, booking }`.

#### `src/components/ui/chat/RescheduleRequestPopup.vue`
- After sending, calls `bookings.updateMeta` with `meta.reschedule = { proposedSlotDate }` and `meta.currentCounterOffer = 'reschedule'`. Emits `{ item, booking }`.

#### `src/components/ui/chat/ChatWindow.vue`
- `onAdjustSubmitted`, `onMoreTimeSubmitted`, `onRescheduleSubmitted` now destructure `{ item, booking }` and call `chatStore.setBooking` when an updated booking is returned.
- `_doConfirmCounter` reads `booking.meta.adjust` for renegotiation params instead of `message.content.meta`.
- `onConfirmCounter` reads `booking.meta.adjust.prevTotalTokens` for token diff calculation. `showBookingPopup` closed after each async path completes (removed early close).
- `onAcceptCounter` and `onRejectCounter` wrapped with `bookingActionLoading` guard; handle both `booking_request` and `requestJoinCallNotification` message types using the correct update endpoint each.
- `onAcceptCounter` reads `booking.meta.currentCounterOffer` + `booking.meta[type].proposedSlotDate` for the booking API call.
- `onRejectCounter` reads `booking.meta.currentCounterOffer` for the activity log decision key.
- `onCancelBooking` — `showBookingPopup` closed only on full success (not eagerly).
- Added `pinnedBookingData` computed for the pinned banner message booking.
- Added `onCallCancelled(updatedItem)` handler — broadcasts updated message, sends `call_cancelled` activity log.
- Added `call_cancelled` to `ActivityLogTexts` and `decisionMap`.
- `BookingRequestDetailPopup` wired with `@accept-counter` / `@reject-counter` events.

#### `src/components/ui/chat/BookingRequestDetailPopup.vue`
- `counterOfferMeta` replaced with `activeOfferType` + `proposedValues` — reads proposed slot/tokens from `booking.meta[currentCounterOffer]` instead of `message.content.meta`.
- `applyBookingData` skips API-derived status override when `message.content.action` is already a definitive non-pending value (fixes "Accepted" badge showing during `counter_offer`).
- Backdrop click blocked while `loading` prop is true.
- Counter-offer fan actions split by type: `adjust` shows "ACCEPT NEW Changes" + "CANCEL BOOKING"; `moretime`/`reschedule` shows "ACCEPT NEW TIME" + "REJECT".
- Added `accept-counter` and `reject-counter` emits.
- All action buttons show loading label while `loading` is true.

#### `src/components/ui/chat/LiveCallRequest.vue`
- Added `booking` prop. `isCancelled` now also checks `booking.status` from the store — hides 3-dot menu, disables Join Call, shows Canceled state when booking is cancelled externally.

#### `src/components/ui/chat/CancelCallConfirmPopup.vue`
- Captures `chat.updateMessage` response and emits updated item with `'cancelled'` event so `ChatWindow` can broadcast the correct updated message.

### Bug Fixes

#### `src/composables/useChatSocket.js`
- On every incoming message, fetches user data for any participant IDs not yet in `chatStore.chatUsersData` (fire-and-forget via `chat.fetchChatUsersData`). Includes the message `sender_id` as a fallback. Fixed duplicate `senderId` variable declaration.

---

## 2026-04-09 — `bookings.updateMeta` Flow

### Added

#### `src/services/bookings/mappers/updateBookingMetaMapper.js`
- **`mapUpdateBookingMetaToRequest`** — new mapper. Resolves `bookingId` from the standard input paths (`bookingId`, `event.bookingId`, `booking.bookingId`, etc.), sets `actionType: "update_meta"`, and forwards `meta`, `actor`, and `args`.

#### `src/services/flow-system/flowRegistry.js`
- **`bookings.updateMeta`** — new write flow entry. Reuses `updateBookingFlow` with `mapUpdateBookingMetaToRequest` as the `toRequest` mapper. `latestWins` concurrency, no retry, 10 s request / 15 s total timeout.

---

## 2026-04-09 — Booking Action Unification & Activity Log Improvements

### Refactor

#### `src/components/ui/chat/BookingRequestDetailPopup.vue`
- Removed `handleAccept`, `handleDecline`, `actionLoading` ref and the duplicate `bookings.reviewPendingBooking` calls — the popup no longer owns the decision logic.
- Accept and Decline buttons now emit `'accept'` / `'decline'` (same events as `BookingRequestBubble`), letting `ChatWindow` handle the full flow via the shared `performBookingDecision`.
- Added `loading` prop (Boolean) — passed from `ChatWindow.bookingActionLoading` to disable buttons while the API call is in flight.
- Renamed internal fetch spinner state from `loading` to `fetchLoading` to avoid conflict with the new `loading` prop.

#### `src/components/ui/chat/ChatWindow.vue`
- `performBookingDecision` now closes `showBookingPopup` after the API call completes — popup closes only on success/failure, not immediately on click.
- Removed `onBookingActionComplete` — no longer needed; popup uses `@accept` / `@decline` → `onDirectAccept` / `onDirectDecline`.
- `BookingRequestDetailPopup` binding updated: `@action-complete` replaced with `@accept` / `@decline`; `:loading="bookingActionLoading"` added.

### Features

#### `src/components/ui/chat/ChatWindow.vue`
- **`_doConfirmCounter`**: activity log `decision` field updated to `'counter_offer_accepted'`.
- **`onCancelBooking`**: added `sendChatActivityLog` with `decision: 'counter_offer_declined'` after the message update succeeds — fan-side counter-offer decline is now tracked in the activity log.

---

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

## Large Group Chat Optimizations (Current Session)

### Features & Performance
- **Massive Group Creation Support**: Group chats with thousands of members (e.g. 4000+) are now supported without timing out the UI.
  - Groups are initially created with **only the creator** in the `participants` array (so the backend correctly assigns them the `admin` role).
  - All target users are subsequently added using the `chat.addParticipants` flow, ensuring they receive the `member` role and the correct `invitedBy` tracking.
- **Participant Chunking Helper**: Introduced `addParticipantsInChunks` in `chatParticipantUtils.js` which:
  1. Filters out any users who are *already* in the group (`chatStore.chatParticipants`) to prevent redundant API calls.
  2. Slices the remaining users into batches of 500.
  3. Uses `Promise.all` to execute bulk updates concurrently.
- **Race Condition Fixed**: `ChatWindow.vue` now correctly `await`s the completion of all chunked participant additions *before* broadcasting the first socket message. This guarantees that all fans are fully registered in the database and nobody misses the first broadcast notification.

### Changes (`ChatWindow.vue`)
- Replaced monolithic `createGroupChat` payload with creator-only initialization followed by chunked additions.
- Imported and utilized `addParticipantsInChunks` helper.

### Changes (`ChatFloatingWidget.vue`)
- Replaced the single `chat.addChatParticipant` call in `onStartChat` (when opening an existing group) with the `addParticipantsInChunks` helper to leverage the new filtering and chunking logic.

### New Flows & Files
- `src/services/chat/flows/addParticipantsFlow.js` — handles `POST /chats/:chatId/participants` for bulk updates, taking `userIds`, `role`, and `invitedBy`.
- `src/services/chat/chatParticipantUtils.js` — houses the reusable chunking/filtering logic.

---
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
