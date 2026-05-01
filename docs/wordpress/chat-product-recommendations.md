# Chat Product Recommendations

Creators can add catalog items to chat from `ChatWindow.vue` with the same picker used by booking spending requirements.

## Product Shape

The canonical product shape follows event `requiredProducts` data:

```js
{
  id: 2940,
  type: "media",
  title: "The Allure of Black Lobelia",
  buyPrice: 25,
  subscribePrice: 1,
  tags: [],
  thumbnailUrl: "https://..."
}
```

`tags` may arrive as `null`; the chat UI normalizes it to `[]`.

For chat storage, the frontend also adds compatibility aliases:

```js
{
  name: title,
  productId: `${type}:${id}`,
  price: buyPrice || subscribePrice || 0,
  imageUrl: thumbnailUrl,
  currency: "USD"
}
```

If the live catalog response includes a usable audio/video/trailer preview URL, the message includes `preview`. Event-shaped products otherwise render with the thumbnail only.

## Message Storage

The frontend calls:

```http
POST /chats/:chatId/messages/product
```

with:

```js
{
  productData: {
    id,
    type,
    title,
    buyPrice,
    subscribePrice,
    thumbnailUrl,
    tags,
    name,
    productId,
    price,
    imageUrl,
    currency,
    preview,
    senderId
  }
}
```

The backend stores:

```js
{
  content_type: "product_recommendation",
  content: {
    product_recommendation: productData
  },
  sender_id,
  status: "sent"
}
```

## Chat UI

`ChatWindow.vue` renders `product_recommendation` as a structured card. The card shows the product title, type, buy/subscribe/free price, thumbnail, and preview media when available.

Fan viewers check live WordPress eligibility before showing a card action. Creator/sender views keep the static preview.

```js
media:        /wp-json/api/media/get?media_id={id}&uid={fanUid}
product:      /wp-json/api/products/get?merch_id={id}&uid={fanUid}
subscription: /wp-json/api/subscriptions/get-tier?tier_id={id}&uid={fanUid}
```

The normalized fan CTA is:

```js
media with access          -> "Watch"
media without access       -> "Buy now"
product can buy/preorder   -> "Buy now"
product unavailable        -> "Unavailable"
subscription subscribed    -> "Subscribed"
subscription not subscribed -> "Subscribe"
```

The booking form flow remains unchanged because `SpendingRequirementProductPopup.vue` defaults still use:

```js
confirmLabel: "Add to spending requirement"
markAsChatPopup: false
includeRawItemData: false
```

Chat opts into:

```js
confirmLabel: "Add to Chat"
markAsChatPopup: true
includeRawItemData: true
```

`markAsChatPopup` adds `data-fs-chat-popup`, which lets the chat iframe host expand to fullscreen while the popup is open.

## WordPress Embed UID

Production WordPress embeds must pass the encrypted fan UID through `mountChatEmbed`:

```js
const chat = window.FSChatEmbed.mountChatEmbed(document.body, {
  currentUserId: userData.userID,
  userRole: "fan",
  apiBaseUrl: "http://localhost:3001",
  fanUid: userData.encrypted_uid
});
```

The host script appends `fanUid` to the iframe URL. The Vue embed exposes it as `window.__fsChatFanUid`. Local Vue/dev mode may fall back to `VITE_TEST_FS_FAN_UID`.

## WordPress Click Event

Clicking `Watch`, `Subscribe`, or `Buy now` posts this message to the iframe parent:

```js
{
  type: "FS_CHAT_PRODUCT_SELECTED",
  payload: {
    chatId,
    messageId,
    senderId,
    product,
    productDetail,
    action: "buy" | "subscribe" | "watch",
    source: "chat_product_recommendation"
  }
}
```

`fs-chat-host.js` dispatches a browser event and supports an optional callback:

```js
window.FSChatEmbed.mountChatEmbed(document.body, {
  currentUserId: userData.userID,
  userRole: "creator",
  apiBaseUrl: "http://localhost:3001",
  fanUid: userData.encrypted_uid,
  onProductSelected(payload) {
    console.log("Product selected from chat", payload);
  }
});

window.addEventListener("FS_CHAT_PRODUCT_SELECTED", function (event) {
  console.log("Product selected from chat", event.detail);
});
```

After WordPress completes a purchase or subscription, call the returned helper so the iframe refetches matching card eligibility:

```js
chat.refreshProductRecommendation({
  type: "media",
  id: 2940,
  productId: "media:2940",
  chatId: "chat#...",
  messageId: "msg#..."
});
```

The helper posts `FS_CHAT_PRODUCT_REFRESH` into the iframe. `ChatWindow.vue` refetches matching media/merch/subscription status and updates the CTA, for example from `Buy now` to `Watch` or from `Subscribe` to `Subscribed`.
