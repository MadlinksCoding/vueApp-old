# Chat Embed WordPress Integration

This guide explains how to deploy and use the chat floating widget embed inside WordPress using the existing plugin paths:

- `https://your-site.com/wp-content/plugins/fansocial/bookings-embed/`
- `https://your-site.com/wp-content/plugins/fansocial/assets/booking/`

The chat widget is rendered inside a transparent, auto-sizing `iframe` fixed to the bottom-right corner of the page.

## What You Are Deploying

There are 2 deployed parts:

1. **The iframe app** — the Vue app page loaded inside the iframe (`chat.html`)
2. **The shared asset bundle** — built JS, CSS, and media files used by the iframe app

## Files To Build

From the app:

- [`./dist/bookings-embed`](./dist/bookings-embed)
- [`./dist/assets/booking`](./dist/assets/booking)

## 1. Build The Frontend

Run the build using `Node 24 or newer`:

```bash
npm run build:wordpress
```

After a successful build, confirm these exist:

- [`./dist/bookings-embed/chat.html`](./dist/bookings-embed/chat.html)
- [`./dist/bookings-embed/fs-chat-host.js`](./dist/bookings-embed/fs-chat-host.js)
- [`./dist/assets/booking`](./dist/assets/booking)

## 2. Copy Files Into The WordPress Plugin

Copy:

- [`./dist/bookings-embed`](./dist/bookings-embed)
  to
  `wp-content/plugins/fansocial/bookings-embed`

- [`./dist/assets/booking`](./dist/assets/booking)
  to
  `wp-content/plugins/fansocial/assets/booking`

Your deployed structure should include:

```text
wp-content/
  plugins/
    fansocial/
      bookings-embed/
        chat.html
        fs-chat-host.js
      assets/
        booking/
          *.js
          *.css
          *.webp
          *.png
          *.svg
```

## 3. Verify The iframe Page Directly

Before wiring WordPress, open the chat iframe directly:

```text
https://your-site.com/wp-content/plugins/fansocial/bookings-embed/chat.html?currentUserId=1407&userRole=creator&apiBaseUrl=https://bookings-backend-live.onrender.com
```

Expected behavior:

- The chat floating widget appears in the bottom-right corner
- The chat list shows existing conversations for the given user
- Unread counts appear on the trigger button if there are unread messages

## 4. WordPress Integration

### 4a. Enqueue The Host Script

In `/wp-content/plugins/fansocial/includes/class-templates.php`, function `write_configurations`, find the assets array for the relevant page template and add:

```
/wp-content/plugins/fansocial/bookings-embed/fs-chat-host.js
```

### 4b. Mount The Chat Embed

In the relevant WordPress page JavaScript file, call `mountChatEmbed` after the host script loads:

```js
window.FSChatEmbed.mountChatEmbed(document.body, {
  src:           '/wp-content/plugins/fansocial/bookings-embed/chat.html',
  currentUserId: userData.userID,
  userRole:      userSpecifiData?.currentUser?.isCreator ? 'creator' : 'fan',
  apiBaseUrl:    'https://bookings-backend-live.onrender.com',
});
```

## 5. Mount Options Reference

```ts
{
  src?:           string,   // path to chat.html; defaults to plugin path
  currentUserId:  number | string,  // required — logged-in user's ID
  userRole?:      'creator' | 'fan',  // default: 'fan'
  apiBaseUrl?:    string,   // API base URL override
  openChatId?:    number | string | null,  // open a specific chat on load
  iframeTitle?:   string,   // accessible title for the iframe; default: 'Chat'
  width?:         number,   // initial container width in px; default: 360
  height?:        number,   // initial container height in px; default: 600
}
```

`currentUserId` is required. If missing, `mountChatEmbed` throws.

## 6. Return Value

`mountChatEmbed(...)` returns a controller object:

```ts
{
  iframe:    HTMLIFrameElement,
  container: HTMLElement,
  destroy(): void,
}
```

Call `destroy()` to remove the widget and its event listeners from the page.

## 7. How The iframe Sizes Itself

The iframe starts at the configured `width` × `height`. It then auto-resizes based on what is open inside the widget:

| State | Behavior |
|---|---|
| Trigger button only | Sized to button + padding |
| Chat list open | Grows left to fit the 288px panel |
| Chat window(s) open | Grows to cover all open windows |
| NewChatPopup open | Expands to full page viewport |
| BookingDetailPopup / AdjustBookingPopup open | Expands to full page viewport |
| Popup closes | Shrinks back to widget dimensions |

Resizing is driven by `postMessage` from inside the iframe to the host page. The host receives two message types:

- `FS_CHAT_RESIZE` — widget resize with explicit `{ width, height }` payload
- `FS_CHAT_FULLSCREEN` — expand to full page viewport (host uses its own `window.innerWidth/innerHeight`)

You do not need to handle these messages manually — `fs-events-host.js` handles them automatically.

## 8. URL Parameters Passed To The iframe

`mountChatEmbed` passes these as query parameters to the `src` URL:

| Parameter | Source option | Description |
|---|---|---|
| `currentUserId` | `currentUserId` | Logged-in user ID |
| `userRole` | `userRole` | `'creator'` or `'fan'` |
| `apiBaseUrl` | `apiBaseUrl` | API base URL override |
| `openChatId` | `openChatId` | Open a specific chat on load |

## 9. Same-Origin Requirement

This setup assumes:

- The WordPress page and the iframe are on the same origin
- The browser already has the auth/session/localStorage context the chat app expects
- The chat APIs are reachable from the iframe

## 10. Smoke Test Checklist

After deployment, verify:

1. `fs-events-host.js` loads without errors on the WordPress page
2. `window.FSEventsEmbed.mountChatEmbed` is callable in DevTools
3. The chat trigger button appears in the bottom-right corner
4. Clicking the trigger opens the chat list
5. Conversations load for the given `currentUserId`
6. Unread counts display correctly on the trigger button
7. Opening a chat window works and messages load
8. Sending a message works
9. Closing a chat window works
10. For creator accounts: the New Message button appears in the chat list header
11. Opening the NewChatPopup expands the iframe to full viewport
12. Closing the NewChatPopup shrinks the iframe back to widget size
13. The BookingRequestDetailPopup opens full viewport and closes correctly

## 11. Troubleshooting

**Widget does not appear:**
- Confirm `fs-chat-host.js` is loaded on the page
- Confirm `window.FSChatEmbed` exists in DevTools
- Confirm `currentUserId` is being passed and is non-empty

**iframe loads but shows nothing:**
- Confirm `chat.html` exists in the plugin's `bookings-embed/` folder
- Confirm `assets/booking/` files were copied after the build
- Check browser DevTools Network tab for 404s on JS/CSS files

**Chat list shows "No conversations yet" despite having chats:**
- Confirm `currentUserId` matches the actual user in the database
- Confirm `apiBaseUrl` is pointing to the correct API environment
- Confirm the auth session/localStorage is available on the same origin

**Popup does not expand to full screen:**
- Confirm the iframe container has `pointer-events: none` and the iframe itself has `pointer-events: auto`
- Confirm the host page is handling `FS_CHAT_FULLSCREEN` messages (handled automatically by `fs-events-host.js`)

**Chat API calls fail:**
- Confirm same-origin auth/session is available
- Confirm the iframe can reach the expected API endpoints
- Pass `apiBaseUrl` explicitly if the default resolution is incorrect
