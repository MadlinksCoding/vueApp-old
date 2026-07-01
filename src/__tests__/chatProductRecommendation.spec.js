import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { sendProductRecommendationFlow } from "@/services/chat/flows/sendProductRecommendationFlow.js";
import { fetchProductRecommendationStatusFlow } from "@/services/chat/flows/fetchProductRecommendationStatusFlow.js";
import {
  buildProductSelectedPayload,
  extractProductRecommendation,
  formatSubscriptionScheduleDate,
  isScheduledSubscriptionCta,
  normalizeProductForChat,
  normalizeProductRecommendationStatus,
  productStatusCtaLabel,
  productPriceLabel,
  productRefreshMatchesMessage,
  resolveChatFanUid,
  scheduledSubscriptionTooltip,
  toCloneSafeProductPayload,
} from "@/utils/chatProductRecommendation.js";
import { formatMediaDuration, getSpendingRequirementMediaBadge } from "@/utils/spendingRequirementMediaBadge.js";

afterEach(() => {
  document.body.innerHTML = "";
  delete window.FSChatEmbed;
  delete window.__fsChatFanUid;
});

describe("chat product recommendations", () => {
  it("normalizes the confirmed event product shape and null tags", () => {
    const product = normalizeProductForChat({
      id: 2940,
      type: "media",
      title: "The Allure of Black Lobelia",
      buyPrice: 25,
      subscribePrice: 1,
      tags: null,
      thumbnailUrl: "https://cdn.example.com/thumb.jpg",
    }, { senderId: 1407 });

    expect(product).toEqual(expect.objectContaining({
      id: 2940,
      type: "media",
      title: "The Allure of Black Lobelia",
      name: "The Allure of Black Lobelia",
      productId: "media:2940",
      price: 25,
      imageUrl: "https://cdn.example.com/thumb.jpg",
      tags: [],
      senderId: "1407",
    }));
    expect(product.preview).toEqual({
      type: null,
      url: "",
      posterUrl: "https://cdn.example.com/thumb.jpg",
    });
    expect(productPriceLabel(product)).toBe("Subscribe $1 or Buy $25");
  });

  it("keeps media badge metadata for chat product cards", () => {
    const product = normalizeProductForChat({
      id: 2940,
      type: "media",
      title: "Gallery",
      raw: {
        type: "image-gallery",
        gallery_count: 6,
      },
    });

    expect(product).toEqual(expect.objectContaining({
      media_type: "image-gallery",
      gallery_count: 6,
    }));
    expect(getSpendingRequirementMediaBadge(product)).toEqual({
      kind: "image-gallery",
      icon: "gallery",
      label: "6",
    });
  });

  it("formats media durations as HH:MM:SS", () => {
    expect(formatMediaDuration(75)).toBe("00:01:15");
    expect(formatMediaDuration("1:02")).toBe("00:01:02");
    expect(formatMediaDuration("1:02:03")).toBe("01:02:03");
  });

  it("extracts stored product_recommendation messages with title fallback", () => {
    const product = extractProductRecommendation({
      content_type: "product_recommendation",
      content: {
        product_recommendation: {
          productId: "product:19351",
          title: "Anime Waifu Push-Up Graphic T-Shirt - Black",
          buyPrice: 14,
          imageUrl: "https://cdn.example.com/shirt.jpg",
        },
      },
    });

    expect(product).toEqual(expect.objectContaining({
      id: 19351,
      type: "product",
      title: "Anime Waifu Push-Up Graphic T-Shirt - Black",
      thumbnailUrl: "https://cdn.example.com/shirt.jpg",
    }));
  });

  it("keeps popup props backward-compatible for booking and opt-in for chat", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/ui/form/BookingForm/HelperComponents/SpendingRequirementProductPopup.vue"),
      "utf8"
    );

    expect(source).toContain('confirmLabel: { type: String, default: "Add to spending requirement" }');
    expect(source).toContain("markAsChatPopup: { type: Boolean, default: false }");
    expect(source).toContain("includeRawItemData: { type: Boolean, default: false }");
    expect(source).toContain('"data-fs-chat-popup"');
    expect(source).toContain("{{ confirmLabel }}");
  });

  it("maps sendProductRecommendationFlow response into chat message data", async () => {
    const apiPost = vi.fn().mockResolvedValue({
      ok: true,
      item: {
        chat_id: "chat#1",
        message_id: "msg#1",
        sender_id: "1407",
        content_type: "product_recommendation",
        content: {
          product_recommendation: {
            id: 2940,
            type: "media",
            title: "The Allure of Black Lobelia",
          },
        },
      },
    });

    const result = await sendProductRecommendationFlow({
      payload: {
        chatId: "chat#1",
        productData: { id: 2940, type: "media", title: "The Allure of Black Lobelia" },
      },
      context: { requestHeaders: {}, signal: null, requestTimeoutMs: 5000 },
      api: { post: apiPost },
    });

    expect(result.ok).toBe(true);
    expect(result.data.chatId).toBe("chat#1");
    expect(result.data.item).toEqual(expect.objectContaining({
      senderId: "1407",
      text: "",
      status: "sent",
      content_type: "product_recommendation",
    }));
    expect(apiPost).toHaveBeenCalledWith(
      expect.stringContaining("/chats/chat%231/messages/product"),
      { productData: { id: 2940, type: "media", title: "The Allure of Black Lobelia" } },
      expect.objectContaining({ timeoutMs: 5000 })
    );
  });

  it("normalizes fan eligibility status for media, subscription, and merch", () => {
    expect(normalizeProductRecommendationStatus({
      product: { id: 2940, type: "media", title: "Media" },
      response: {
        result: {
          stats: { has_access: true },
          media_url: "https://cdn.example.com/video.mp4",
          subscription: { action_text: "Upgrade" },
        },
      },
    })).toEqual(expect.objectContaining({
      type: "media",
      hasAccess: true,
      canBuy: false,
      cta: "watch",
      ctaLabel: "Upgrade",
    }));

    expect(normalizeProductRecommendationStatus({
      product: { id: 14322, type: "subscription", title: "Tier" },
      response: { result: { stats: { is_subscribed: true }, action_text: "Current plan" } },
    })).toEqual(expect.objectContaining({
      type: "subscription",
      hasAccess: true,
      cta: "subscribed",
      ctaLabel: "Current plan",
    }));

    expect(normalizeProductRecommendationStatus({
      product: { id: 32799, type: "product", title: "Merch" },
      response: { result: { can_buy: true } },
    })).toEqual(expect.objectContaining({
      type: "product",
      canBuy: true,
      cta: "buy",
    }));

    expect(normalizeProductRecommendationStatus({
      product: { id: 32799, type: "product", title: "Subscriber merch" },
      response: {
        result: {
          can_subscribe: true,
          can_buy: true,
          subscribe_data: {
            price: 9,
            action_text: "Upgrade",
            subscription_id: 501,
            item_line_number: 2,
            subscribed_tier_id: 14322,
          },
        },
      },
    })).toEqual(expect.objectContaining({
      type: "product",
      canSubscribe: true,
      canBuy: false,
      cta: "subscribe",
      ctaLabel: "Upgrade",
    }));

    expect(normalizeProductRecommendationStatus({
      product: { id: 32799, type: "product", title: "Merch" },
      response: { result: { can_buy: false, can_preorder: true, publish_date: "2999-01-01T00:00:00Z" } },
      now: Date.parse("2026-01-01T00:00:00Z"),
    })).toEqual(expect.objectContaining({
      canBuy: true,
      cta: "buy",
    }));
  });

  it("uses subscription action_text as the card CTA label with fallback labels", () => {
    const custom = normalizeProductRecommendationStatus({
      product: { id: 14322, type: "subscription", title: "Tier" },
      response: { result: { stats: { is_subscribed: false }, action_text: "Join this tier" } },
    });
    const subscribedFallback = normalizeProductRecommendationStatus({
      product: { id: 14322, type: "subscription", title: "Tier" },
      response: { result: { stats: { is_subscribed: true } } },
    });
    const subscribeFallback = normalizeProductRecommendationStatus({
      product: { id: 14322, type: "subscription", title: "Tier" },
      response: { result: { stats: { is_subscribed: false } } },
    });

    expect(custom.cta).toBe("subscribe");
    expect(productStatusCtaLabel(custom)).toBe("Join this tier");
    expect(productStatusCtaLabel(subscribedFallback)).toBe("Subscribed");
    expect(productStatusCtaLabel(subscribeFallback)).toBe("Subscribe");
  });

  it("disables scheduled subscription CTAs with downgrade date tooltips", () => {
    const scheduledSeconds = Math.floor(new Date(2026, 6, 1, 12).getTime() / 1000);
    const expiring = normalizeProductRecommendationStatus({
      product: { id: 14322, type: "subscription", title: "Tier" },
      response: {
        result: {
          stats: { is_subscribed: true },
          action_text: " Expiring ",
          times: { next_payment: scheduledSeconds },
        },
      },
    });
    const downgraded = normalizeProductRecommendationStatus({
      product: { id: 14322, type: "subscription", title: "Tier" },
      response: {
        result: {
          stats: { is_subscribed: true },
          action_text: "Downgraded",
          times: { end: scheduledSeconds },
        },
      },
    });
    const missingDate = normalizeProductRecommendationStatus({
      product: { id: 14322, type: "subscription", title: "Tier" },
      response: {
        result: {
          stats: { is_subscribed: true },
          action_text: "Expiring",
          times: {},
        },
      },
    });

    expect(formatSubscriptionScheduleDate(scheduledSeconds)).toBe("Wed 1 Jul 2026");
    expect(isScheduledSubscriptionCta(expiring)).toBe(true);
    expect(scheduledSubscriptionTooltip(expiring)).toBe("You will be downgraded from this plan on Wed 1 Jul 2026");
    expect(isScheduledSubscriptionCta(downgraded)).toBe(true);
    expect(scheduledSubscriptionTooltip(downgraded)).toBe("You will be downgraded to this plan on Wed 1 Jul 2026");
    expect(isScheduledSubscriptionCta(missingDate)).toBe(true);
    expect(scheduledSubscriptionTooltip(missingDate)).toBe("");
  });

  it("fetches product eligibility from the expected WordPress endpoints", async () => {
    const apiGet = vi.fn()
      .mockResolvedValueOnce({ result: { stats: { has_access: true } } })
      .mockResolvedValueOnce({ result: { can_buy: true } })
      .mockResolvedValueOnce({ result: { stats: { is_subscribed: true } } });
    const context = { requestHeaders: {}, signal: null, requestTimeoutMs: 5000 };

    const media = await fetchProductRecommendationStatusFlow({
      payload: { product: { id: 2940, type: "media", title: "Media" }, fanUid: "fan-token" },
      context,
      api: { get: apiGet },
    });
    const merch = await fetchProductRecommendationStatusFlow({
      payload: { product: { id: 32799, type: "product", title: "Merch" }, fanUid: "fan-token" },
      context,
      api: { get: apiGet },
    });
    const subscription = await fetchProductRecommendationStatusFlow({
      payload: { product: { id: 14322, type: "subscription", title: "Tier" }, fanUid: "fan-token" },
      context,
      api: { get: apiGet },
    });

    expect(media.data.cta).toBe("watch");
    expect(merch.data.cta).toBe("buy");
    expect(subscription.data.cta).toBe("subscribed");
    expect(apiGet).toHaveBeenNthCalledWith(1, expect.stringContaining("/wp-json/api/media/get"), expect.objectContaining({
      params: { media_id: 2940, uid: "fan-token" },
    }));
    expect(apiGet).toHaveBeenNthCalledWith(2, expect.stringContaining("/wp-json/api/products/get"), expect.objectContaining({
      params: { merch_id: 32799, uid: "fan-token" },
    }));
    expect(apiGet).toHaveBeenNthCalledWith(3, expect.stringContaining("/wp-json/api/subscriptions/get-tier"), expect.objectContaining({
      params: { tier_id: 14322, uid: "fan-token" },
    }));
  });

  it("passes fanUid through the host iframe URL and exposes it in the Vue embed source", () => {
    const hostSource = readFileSync(
      resolve(process.cwd(), "public/bookings-embed/fs-chat-host.js"),
      "utf8"
    );
    window.eval(hostSource);

    const handle = window.FSChatEmbed.mountChatEmbed(document.body, {
      src: "/bookings-embed/chat.html",
      currentUserId: "2615",
      userRole: "fan",
      apiBaseUrl: "http://localhost:3001",
      fanUid: "encrypted-fan-uid",
    });

    expect(handle.iframe.src).toContain("fanUid=encrypted-fan-uid");
    expect(typeof handle.refreshProductRecommendation).toBe("function");

    const embedSource = readFileSync(
      resolve(process.cwd(), "src/embeds/chat/ChatEmbedApp.vue"),
      "utf8"
    );
    expect(embedSource).toContain("params.get('fanUid')");
    expect(embedSource).toContain("window.__fsChatFanUid = fanUid");
  });

  it("passes tokenHandlerApiUrl through the chat host iframe URL and Vue embed source", () => {
    const hostSource = readFileSync(
      resolve(process.cwd(), "public/bookings-embed/fs-chat-host.js"),
      "utf8"
    );
    window.eval(hostSource);

    const handle = window.FSChatEmbed.mountChatEmbed(document.body, {
      src: "/bookings-embed/chat.html",
      currentUserId: "2615",
      userRole: "fan",
      apiBaseUrl: "http://localhost:3001",
      tokenHandlerApiUrl: "https://tokens.example.test/dev",
    });

    expect(new URL(handle.iframe.src).searchParams.get("tokenHandlerApiUrl")).toBe("https://tokens.example.test/dev");

    const embedSource = readFileSync(
      resolve(process.cwd(), "src/embeds/chat/ChatEmbedApp.vue"),
      "utf8"
    );
    expect(embedSource).toContain("params.get('tokenHandlerApiUrl')");
    expect(embedSource).toContain("setRuntimeTokenHandlerApiUrl(tokenHandlerApiUrl)");
  });

  it("resolves fan uid from iframe globals, query params, and host userData fallbacks", () => {
    expect(resolveChatFanUid({
      windowRef: { __fsChatFanUid: "global-fan-token" },
    })).toBe("global-fan-token");

    expect(resolveChatFanUid({
      windowRef: { location: { search: "?fanUid=query-fan-token" } },
    })).toBe("query-fan-token");

    expect(resolveChatFanUid({
      windowRef: { userData: { encrypted_uid: "wp-fan-token" } },
    })).toBe("wp-fan-token");

    const hostSource = readFileSync(
      resolve(process.cwd(), "public/bookings-embed/fs-chat-host.js"),
      "utf8"
    );
    window.userData = { encrypted_uid: "host-wp-token" };
    window.eval(hostSource);
    const handle = window.FSChatEmbed.mountChatEmbed(document.body, {
      src: "/bookings-embed/chat.html",
      currentUserId: "2615",
      userRole: "fan",
      apiBaseUrl: "http://localhost:3001",
    });

    expect(handle.iframe.src).toContain("fanUid=host-wp-token");
  });

  it("builds product selected payloads and matches refresh messages", () => {
    const message = {
      chat_id: "chat#1",
      message_id: "msg#1",
      sender_id: "1407",
      content_type: "product_recommendation",
      content: {
        product_recommendation: {
          id: 2940,
          type: "media",
          title: "Media",
        },
      },
    };
    const status = {
      cta: "watch",
      detail: { stats: { has_access: true }, media_url: "https://cdn.example.com/video.mp4" },
    };

    expect(buildProductSelectedPayload({ message, status })).toEqual(expect.objectContaining({
      chatId: "chat#1",
      messageId: "msg#1",
      senderId: "1407",
      action: "watch",
      productDetail: status.detail,
      source: "chat_product_recommendation",
    }));
    expect(productRefreshMatchesMessage(message, { productId: "media:2940" })).toBe(true);
    expect(productRefreshMatchesMessage(message, { type: "media", id: 2940 })).toBe(true);
    expect(productRefreshMatchesMessage(message, { type: "product", id: 32799 })).toBe(false);

    const chatWindowSource = readFileSync(
      resolve(process.cwd(), "src/components/ui/chat/ChatWindow.vue"),
      "utf8"
    );
    expect(chatWindowSource).toContain("FS_CHAT_PRODUCT_REFRESH");
    expect(chatWindowSource).toContain("refreshProductRecommendationMessages");
  });

  it("keeps watch as the only visible chat product CTA once media access is available", () => {
    const chatWindowSource = readFileSync(
      resolve(process.cwd(), "src/components/ui/chat/ChatWindow.vue"),
      "utf8"
    );

    expect(chatWindowSource).toContain("if (cta === 'watch') return false");
    expect(chatWindowSource).toContain("if (cta === 'watch') return true");
    expect(chatWindowSource).toContain("return productCardCta(message) === 'watch' ? 'watch' : 'buy'");
  });

  it("uses merch status to render either subscribe or buy, not both", () => {
    const chatWindowSource = readFileSync(
      resolve(process.cwd(), "src/components/ui/chat/ChatWindow.vue"),
      "utf8"
    );

    expect(chatWindowSource).toContain("if (product.type === 'product') {");
    expect(chatWindowSource).toContain("if (cta === 'subscribe') return true");
    expect(chatWindowSource).toContain("if (cta === 'subscribe') return false");
    expect(chatWindowSource).toContain("if (cta === 'buy') return true");
    expect(chatWindowSource).toContain("t('chat_action_to_buy'");
    expect(chatWindowSource).toContain("if (product?.type !== 'subscription') return productCardCtaLabel(message) || 'Subscribe'");
  });

  it("renders skeleton placeholders instead of chat product buttons while status is loading", () => {
    const chatWindowSource = readFileSync(
      resolve(process.cwd(), "src/components/ui/chat/ChatWindow.vue"),
      "utf8"
    );

    expect(chatWindowSource).toContain("function productCardButtonsLoading(message)");
    expect(chatWindowSource).toContain("return productCardCta(message) === 'loading' && !isAnyProductActionPending(message)");
    expect(chatWindowSource).toContain('v-if="productCardButtonsLoading(message)"');
    expect(chatWindowSource).toContain("animate-pulse");
    expect(chatWindowSource).not.toContain("productCardButtonOpacityClass");
  });

  it("renders a pending spinner for free subscription actions", () => {
    const chatWindowSource = readFileSync(
      resolve(process.cwd(), "src/components/ui/chat/ChatWindow.vue"),
      "utf8"
    );

    expect(chatWindowSource).toContain("function shouldShowFreeSubscribePending(message, action = '')");
    expect(chatWindowSource).toContain("setProductActionPending(message, action)");
    expect(chatWindowSource).toContain("FS_CHAT_PRODUCT_ACTION_FAILED");
    expect(chatWindowSource).toContain("border-white/40 border-t-white");
    expect(chatWindowSource).toContain("Processing subscription");
  });

  it("adds explicit subscription fields to selected payloads", () => {
    const message = {
      chat_id: "chat#1",
      message_id: "msg#sub",
      sender_id: "1407",
      content_type: "product_recommendation",
      content: {
        product_recommendation: {
          id: 14322,
          type: "subscription",
          title: "VIP",
        },
      },
    };
    const status = {
      cta: "subscribe",
      detail: {
        id: 14322,
        product_id: 14320,
        stats: { is_subscribed: false },
        subscription_id: 501,
        item_line_number: 2,
        subscribed_tier_id: 14322,
      },
    };

    expect(buildProductSelectedPayload({ message, status })).toEqual(expect.objectContaining({
      action: "subscribe",
      subscription_id: 501,
      item_line_number: 2,
      subscribed_tier_id: 14322,
    }));
    expect(buildProductSelectedPayload({ message, status }).productDetail).toEqual(expect.objectContaining({
      ...status.detail,
      subscription: {
        id: 501,
        subscription_id: 501,
        item_line_number: 2,
        subscribed_tier_id: 14322,
        product_id: 14320,
        variation_id: 14322,
      },
    }));
  });

  it("adds null subscription fields when WordPress omits them", () => {
    const message = {
      chat_id: "chat#1",
      message_id: "msg#sub-null",
      sender_id: "1407",
      content_type: "product_recommendation",
      content: {
        product_recommendation: {
          id: 14322,
          type: "subscription",
          title: "VIP",
        },
      },
    };

    const payload = buildProductSelectedPayload({
      message,
      status: { cta: "subscribe", detail: { stats: { is_subscribed: false } } },
    });

    expect(payload).toEqual(expect.objectContaining({
      subscription_id: null,
      item_line_number: null,
      subscribed_tier_id: null,
    }));
    expect(payload.productDetail.subscription).toEqual(expect.objectContaining({
      id: null,
      subscription_id: null,
      item_line_number: null,
      subscribed_tier_id: null,
      product_id: null,
      variation_id: 14322,
    }));
  });

  it("adds merch subscription fields when a product card asks the fan to subscribe first", () => {
    const message = {
      chat_id: "chat#1",
      message_id: "msg#merch-sub",
      sender_id: "1407",
      content_type: "product_recommendation",
      content: {
        product_recommendation: {
          id: 32799,
          type: "product",
          title: "Subscriber merch",
        },
      },
    };
    const status = {
      cta: "subscribe",
      detail: {
        id: 32799,
        tier_id: 14322,
        tier_product_id: 14320,
        can_subscribe: true,
        subscribe_data: {
          price: 9,
          action_text: "Upgrade",
          subscription_id: 501,
          item_line_number: 2,
          subscribed_tier_id: 14322,
        },
      },
    };

    const payload = buildProductSelectedPayload({ message, status });

    expect(payload).toEqual(expect.objectContaining({
      action: "subscribe",
      subscription_id: 501,
      item_line_number: 2,
      subscribed_tier_id: 14322,
    }));
    expect(payload.productDetail.subscription).toEqual(expect.objectContaining({
      id: 501,
      subscription_id: 501,
      item_line_number: 2,
      subscribed_tier_id: 14322,
      product_id: 14320,
      variation_id: 14322,
    }));
  });

  it("builds selected payloads that are safe for postMessage structured clone", () => {
    const circular = { stats: { has_access: true } };
    const windowLike = { [Symbol.toStringTag]: "Window", frameElement: null };
    circular.self = circular;
    circular.fn = () => "nope";
    circular.symbol = Symbol("nope");
    circular.window = windowLike;
    circular.items = [{ ok: true, skip: () => false }, windowLike];

    const message = {
      chat_id: "chat#1",
      message_id: "msg#safe",
      sender_id: "1407",
      content_type: "product_recommendation",
      content: {
        product_recommendation: {
          id: 2940,
          type: "media",
          title: "Media",
        },
      },
    };

    const payload = buildProductSelectedPayload({
      message,
      status: { cta: "watch", detail: circular },
    });

    expect(() => structuredClone({ type: "FS_CHAT_PRODUCT_SELECTED", payload })).not.toThrow();
    expect(payload.productDetail).toEqual({
      stats: { has_access: true },
      items: [{ ok: true }],
    });
  });

  it("sanitizes arbitrary nested values into clone-safe data", () => {
    const source = {
      date: new Date("2026-04-21T00:00:00.000Z"),
      big: 10n,
      keepNull: null,
      fn: () => {},
      sym: Symbol("drop"),
      window: { [Symbol.toStringTag]: "Window", name: "parent" },
      array: [1, () => {}, Symbol("drop"), { nested: true }, { [Symbol.toStringTag]: "Window", name: "child" }],
    };
    source.self = source;

    const safe = toCloneSafeProductPayload(source);

    expect(() => structuredClone(safe)).not.toThrow();
    expect(safe).toEqual({
      date: "2026-04-21T00:00:00.000Z",
      big: "10",
      keepNull: null,
      array: [1, { nested: true }],
    });
  });

  it("sanitizes proxied arrays from real-time payloads", () => {
    const proxiedArray = new Proxy([
      { id: 1, title: "Live item" },
      () => "skip",
      new Proxy([{ nested: true }], {}),
    ], {});

    const safe = toCloneSafeProductPayload({
      product_recommendation: {
        id: 2940,
        type: "media",
        tags: proxiedArray,
      },
    });

    expect(() => structuredClone(safe)).not.toThrow();
    expect(safe).toEqual({
      product_recommendation: {
        id: 2940,
        type: "media",
        tags: [{ id: 1, title: "Live item" }, [{ nested: true }]],
      },
    });
  });
});
