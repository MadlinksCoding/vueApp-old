import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("WordPress event-card JWT resolution", () => {
  beforeEach(() => {
    delete window.FanSocialEventCards;
    delete window.__FSHeroRightButtonsSlotLogic;
    window.userData = { userID: "2615", jwtToken: "jwt_runtime_fresh" };
    window.siteData = {
      bookingsBackendLambdaEndpoint: "https://bookings.example",
      tokensLambdaEndpoint: "https://tokens.example",
    };
    window.translation_strings = {};
    window.FSEventsEmbed = { openFanBookingPopup: vi.fn() };

    const source = readFileSync(
      resolve(process.cwd(), "../wp/wp-content/plugins/fansocial/assets/shared/event-cards.js"),
      "utf8",
    );
    window.eval(source);
  });

  afterEach(() => {
    document.body.innerHTML = "";
    delete window.FanSocialEventCards;
    delete window.__FSHeroRightButtonsSlotLogic;
    delete window.FSEventsEmbed;
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("prefers the refreshed runtime JWT over the token captured at initialization", () => {
    window.FanSocialEventCards.openBookingPopupForEvent({
      eventId: "evt_123",
      creatorId: 1407,
    }, {
      creatorId: 1407,
      currentFanId: 2615,
      jwtToken: "jwt_initial_stale",
    });

    expect(window.FSEventsEmbed.openFanBookingPopup).toHaveBeenCalledWith(
      expect.objectContaining({
        creatorId: 1407,
        fanId: 2615,
        eventId: "evt_123",
        jwtToken: "jwt_runtime_fresh",
      }),
    );
  });

  it("preserves tolerant booked-slot fetches while strict refreshes reject failures", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: false, status: 503 })));

    await expect(window.FanSocialEventCards.fetchBookedSlots(1407)).resolves.toEqual([]);
    await expect(window.FanSocialEventCards.fetchBookedSlots(1407, {
      rejectOnError: true,
    })).rejects.toThrow("status 503");
  });

  it("shares only in-flight server-authoritative prerequisite requests", async () => {
    window.siteData.siteUrl = "https://fansocial.local";
    window.siteData.restNonce = "rest_nonce";
    const fetchMock = vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        must_own_products_ok: false,
        prerequisite: { eligible: false, action: "buy", product: { id: 99, title: "Photo Set" } },
        token_pricing: { base_price_per_token: 0.1099 },
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    const event = {
      eventId: "evt_required",
      requiredProducts: [{ id: 99, type: "product" }],
    };

    const [first, second] = await Promise.all([
      window.FanSocialEventCards.fetchBookingPrerequisiteDetails(event, { currentFanId: 2615 }),
      window.FanSocialEventCards.fetchBookingPrerequisiteDetails(event, { currentFanId: 2615 }),
    ]);

    expect(first.prerequisite.product.title).toBe("Photo Set");
    expect(second).toBe(first);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://fansocial.local/wp-json/api/bookings/validate",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "X-WP-Nonce": "rest_nonce" }),
        body: JSON.stringify({
          user_id: 2615,
          must_own_products: [{ id: 99, type: "product" }],
          include_checkout_details: true,
        }),
      }),
    );
  });

  it('loads live prerequisite presentation for guest cards without querying another fan', async () => {
    window.userData = { userID: 0 };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ prerequisite: { eligible: false, product: { title: 'Live merch', image_url: '/merch.jpg' } } }) });
    vi.stubGlobal('fetch', fetchMock);
    const result = await window.FanSocialEventCards.fetchBookingPrerequisiteDetails({ eventId: 'guest_event', requiredProducts: [{ id: 99, type: 'product' }] }, { currentFanId: 0 });
    expect(result.prerequisite.product.title).toBe('Live merch');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).user_id).toBe(0);
  });

  it.each([false, true])('checks Subscribers only tiers despite spendingRequirement=none (raw: %s)', async (raw) => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ prerequisite: { type: 'subscription', eligible: false, action: 'subscribe' } }) });
    vi.stubGlobal('fetch', fetchMock);
    const settings = { whoCanBook: 'subscribersOnly', subscriptionTiers: [13413, '13413'], spendingRequirement: 'none', requiredProducts: [{ id: 99, type: 'product' }] };
    const event = { eventId: 'evt_subscriber_group', ...(raw ? { raw: settings } : settings) };
    const result = await window.FanSocialEventCards.fetchBookingPrerequisiteDetails(event, { currentFanId: 2615 });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).must_own_products).toEqual([{ id: 13413, type: 'subscription' }]);
    expect(result.prerequisite.action).toBe('subscribe');
  });

  it("rechecks ownership after purchase and after access is removed without reloading", async () => {
    const fetchMock = vi.fn();
    for (const eligible of [false, true, false]) {
      fetchMock.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          must_own_products_ok: eligible,
          prerequisite: { eligible, action: eligible ? 'none' : 'buy', product: { id: 99, title: 'Merch' } },
        }),
      });
    }
    vi.stubGlobal('fetch', fetchMock);
    const event = { eventId: 'evt_required', requiredProducts: [{ id: 99, type: 'product' }] };
    const options = { currentFanId: 2615 };
    for (const eligible of [false, true, false]) {
      const result = await window.FanSocialEventCards.fetchBookingPrerequisiteDetails(event, options);
      expect(result.prerequisite.eligible).toBe(eligible);
    }
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("does not share an in-flight request with changed requirements or another fan", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });
    vi.stubGlobal('fetch', fetchMock);
    await Promise.all([
      window.FanSocialEventCards.fetchBookingPrerequisiteDetails({ eventId: 'evt_required', requiredProducts: [{ id: 99, type: 'product' }] }, { currentFanId: 2615 }),
      window.FanSocialEventCards.fetchBookingPrerequisiteDetails({ eventId: 'evt_required', requiredProducts: [{ id: 100, type: 'subscription' }] }, { currentFanId: 2615 }),
      window.FanSocialEventCards.fetchBookingPrerequisiteDetails({ eventId: 'evt_required', requiredProducts: [{ id: 99, type: 'product' }] }, { currentFanId: 2616 }),
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("ignores stale required products when the product ownership rule is disabled", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await window.FanSocialEventCards.fetchBookingPrerequisiteDetails({
      eventId: "evt_everyone",
      spendingRequirement: "none",
      requiredProducts: [{ id: 99, type: "product" }],
    }, { currentFanId: 2615 });

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("passes authoritative prerequisite details through the shared card render", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T00:00:00Z"));
    document.body.innerHTML = `
      <template data-id="event-1on1-card">
        <strong data-name="title"></strong>
        <div data-name="prerequisite-slot"></div>
        <button data-el="book-now"><span data-name="action-label">BOOK CALL</span></button>
      </template>
      <template data-id="event-prerequisite-card-fragment">
        <span data-name="prerequisite-required-badge"></span>
        <div data-name="prerequisite-owned"><strong data-name="prerequisite-owned-title"></strong><span data-name="prerequisite-owned-label"></span></div>
        <div data-name="prerequisite-required">
          <strong data-name="prerequisite-title"></strong>
          <span data-name="prerequisite-price"></span>
          <span data-name="prerequisite-shipping"></span>
          <img data-name="prerequisite-image" />
        </div>
      </template>
      <div data-creator-events-list></div>
    `;
    const event = {
      eventId: "evt_required_card",
      creatorId: 1407,
      title: "Prerequisite booking",
      type: "1on1-call",
      repeatRule: "daily",
      dateFrom: "2026-09-01",
      dateTo: "2026-09-03",
      sessionDurationMinutes: 10,
      basePriceTokens: 20,
      slots: [{ startTime: "08:30", endTime: "09:00" }],
      requiredProducts: [{ id: 99, type: "media" }],
    };
    const prerequisiteByEvent = {
      evt_required_card: {
        prerequisite: {
          eligible: false,
          action: "buy",
          type: "media",
          product: {
            id: 99,
            title: "Variable Subscription Product - Tier 3",
            variation_title: "Photo Set",
            is_subscription_variation: true,
            price: 12.5,
            image_url: "https://example.test/photo.jpg",
          },
          shipping: { required: true, country: "United Kingdom" },
        },
        token_pricing: { base_price_per_token: 0.1 },
      },
    };

    const result = window.FanSocialEventCards.renderProfileCreatorEvents({
      creatorId: 1407,
      currentFanId: 2615,
      prerequisiteByEvent,
    }, [event], []);

    expect(document.body.textContent).toContain("Photo Set");
    expect(document.body.textContent).not.toContain("Variable Subscription Product - Tier 3");
    expect(document.body.textContent).toContain("USD$12.50");
    expect(document.body.textContent).toContain("Ships from United Kingdom");
    expect(document.body.textContent).toContain("SUBSCRIBE & BOOK CALL");
    expect(result.prerequisiteByEvent).toBe(prerequisiteByEvent);
  });

  function installSharedCardTemplates() {
    const templateDir = resolve(process.cwd(), "../wp/wp-content/plugins/fansocial/templates/template-parts/shared");
    let source = readFileSync(resolve(templateDir, "template-part-event-card-templates.php"), "utf8");
    source = source.replace(/<\?php include FANSOCIAL_PLUGIN_DIR_PATH \. 'templates\/template-parts\/shared\/([^']+)'; \?>/g,
      (_, filename) => readFileSync(resolve(templateDir, filename), "utf8"));
    // Keep translated English labels while loading the real PHP-owned markup.
    source = source.replace(/<\?php echo esc_(?:html|attr)\( \\MadLinksCoding\\Translate::translate\( '([^']*)' \) \); \?>/g, "$1")
      .replace(/<\?php[\s\S]*?\?>/g, "");
    document.body.innerHTML = source + '<div data-creator-events-list></div>';
  }

  function renderCallCard(detail, extraEvent = {}) {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T00:00:00Z"));
    installSharedCardTemplates();
    const event = {
      eventId: "evt_card_layout", creatorId: 1407, title: "Test call", type: "1on1-call",
      repeatRule: "daily", dateFrom: "2026-09-01", dateTo: "2026-09-03",
      sessionDurationMinutes: 15, basePriceTokens: 500,
      slots: [{ startTime: "08:30", endTime: "12:00" }],
      allowLongerSessions: true, maxSessionMinutes: 4,
      description: "A real call description", addOns: [{ title: "Record our session", priceTokens: 50 }],
      requiredProducts: detail ? [{ id: 99, type: detail.type }] : [],
      ...extraEvent,
    };
    window.FanSocialEventCards.renderProfileCreatorEvents({
      creatorId: 1407, currentFanId: 2615,
      prerequisiteByEvent: detail ? { evt_card_layout: { prerequisite: detail, token_pricing: { base_price_per_token: 0.1 } } } : {},
    }, [event], []);
    return document.querySelector('[data-creator-events-list] .card-wrapper');
  }

  it.each([false, true])('renders the subscriber-only goal group prerequisite (eligible: %s)', (eligible) => {
    const card = renderCallCard({
      type: 'subscription', action: eligible ? 'none' : 'subscribe', eligible,
      product: { id: 13413, title: 'Crave – All Access', price: 25, image_url: '/tier.jpg' },
      shipping: { required: false },
    }, {
      type: 'group-event', whoCanBook: 'subscribersOnly', subscriptionTiers: [13413],
      spendingRequirement: 'none', requiredProducts: [], priceSetting: 'eventGoal',
      minContributionPerUser: 80, eventGoalTokens: 1000,
    });
    expect(card.querySelector('[data-name="prerequisite-required"]').hidden).toBe(eligible);
    expect(card.querySelector('[data-name="prerequisite-owned"]').hidden).toBe(!eligible);
    expect(card.textContent).toContain('Crave – All Access');
    expect(card.classList.contains('event-card--subscription')).toBe(true);
    if (!eligible) expect(card.querySelector('[data-name="action-label"]').textContent.replace(/\s+/g, ' ')).toContain('SUBSCRIBE & BOOK CALL');
    else expect(card.querySelector('[data-name="prerequisite-owned-label"]').textContent).toBe('SUBSCRIBED');
  });

  it.each([
    ["product", "buy", false, "BUY & BOOK CALL", "event-card--purchase-required"],
    ["media", "buy", false, "BUY & BOOK CALL", "event-card--purchase-required"],
    ["subscription", "subscribe", false, "SUBSCRIBE & BOOK CALL", "event-card--subscription-required"],
    ["subscription", "switch", false, "SUBSCRIBE & BOOK CALL", "event-card--subscription-required"],
    ["product", "none", true, "Book Call", null],
    ["media", "none", true, "Book Call", null],
    ["subscription", "none", true, "Book Call", "event-card--subscription"],
  ])("maps the real card template for %s / %s / owned %s", (type, action, eligible, label, stateClass) => {
    const card = renderCallCard({
      type, action, eligible,
      product: { id: 99, title: "Required item", price: 25, regular_price: 50, image_url: "https://example.test/product.jpg" },
      shipping: { required: type === "product", country: "Taiwan" },
    });
    expect(card).not.toBeNull();
    expect(card.querySelector('[data-name="action-label"]').textContent.replace(/\s+/g, " ").trim()).toBe(label);
    if (stateClass) expect(card.classList.contains(stateClass)).toBe(true);
    expect(card.querySelector('[data-name="prerequisite-owned"]').hidden).toBe(!eligible);
    expect(card.querySelector('[data-name="prerequisite-required"]').hidden).toBe(eligible);
    const ownedImage = card.querySelector('[data-name="prerequisite-owned"] > [data-name="prerequisite-image"]');
    expect(ownedImage.getAttribute("src")).toBe("https://example.test/product.jpg");
    expect(ownedImage.alt).toBe("Required item");
    expect(ownedImage.style.display).not.toBe("none");
    expect(card.querySelector('[data-name="prerequisite-owned-label"]').textContent).toBe(
      type === "subscription" ? "SUBSCRIBED" : type === "media" ? "MEDIA PURCHASED" : "PURCHASED",
    );
    expect(card.querySelector('.card-footer [data-name="price"]').textContent).toBe("500");
    // The profile hides empty decorative divs unless they carry its existing db marker.
    expect(card.querySelector('.event-card-call-footer__union').classList.contains("db")).toBe(true);
    expect(card.querySelector('[data-name="max-session-length"]').textContent).toBe("60 min.");
    expect(card.querySelector('.card-footer [data-name="approx-usd"]').textContent).toBe("≈ USD$50.00");
    expect(card.querySelector('[data-name="prerequisite-regular-price"]').textContent).toBe("USD$50.00");
    expect(card.querySelector('[data-name="prerequisite-discount"]').textContent).toBe("50% off");
    expect(card.querySelector('[data-name="addons"]').hidden).toBe(false);
    expect(card.querySelector('[data-name="addons"]').textContent).toContain("Record our session");
    expect(card.querySelector('[data-name="next-slot"]').textContent).not.toBe("");
    expect(card.querySelector('[data-name="description"]').textContent).toBe("A real call description");
    card.querySelector('[data-el="book-now"]').click();
    expect(window.FSEventsEmbed.openFanBookingPopup).toHaveBeenCalledWith(expect.objectContaining({ eventId: "evt_card_layout" }));
  });

  it("keeps the ordinary/free card clean without a prerequisite or add-ons", () => {
    const card = renderCallCard(null, { allowLongerSessions: false, basePriceTokens: 0, addOns: [] });
    expect(card.querySelector('[data-name="price"]').textContent).toBe("Free");
    expect(card.querySelector('[data-name="max-session-length"]').textContent).toBe("15 min.");
    expect(card.querySelector('[data-name="addons"]').hidden).toBe(true);
    expect(card.querySelector('[data-name="prerequisite-required"]')).toBeNull();
    expect(card.querySelector('[data-name="action-label"]').textContent).toBe("Book Call");
  });

  it("keeps the required item outside the scrolling event details", () => {
    const style = document.createElement("style");
    style.textContent = readFileSync(
      resolve(process.cwd(), "../wp/wp-content/plugins/fansocial/assets/shared/event-cards.css"),
      "utf8",
    );
    const card = renderCallCard({ type: "product", action: "buy", eligible: false,
      product: { title: "Required item", price: 25 },
    });
    document.body.appendChild(style);
    const body = card.querySelector(".event-card-body");
    const slot = card.querySelector('[data-name="prerequisite-slot"]');
    expect(body.tabIndex).toBe(0);
    expect(body.contains(slot)).toBe(false);
    expect(slot.parentElement).toBe(body.parentElement);
    expect(window.getComputedStyle(body).overflowY).toBe("auto");
    expect(window.getComputedStyle(body.parentElement).overflow).toBe("hidden");
    expect(window.getComputedStyle(slot).flexShrink).toBe("0");
    expect(window.getComputedStyle(body.querySelector(".content-bottom")).flexShrink).toBe("0");
    expect(window.getComputedStyle(body.querySelector(".content-top")).height).toBe("auto");
  });

  it("uses the supplied call-card text colours despite the global paragraph reset", () => {
    const card = renderCallCard({ type: "product", action: "buy", eligible: false,
      product: { title: "Required item", price: 25 }, shipping: { required: true, country: "Taiwan" },
    });
    const style = document.createElement("style");
    style.textContent = "p, span { color: #000; }" + readFileSync(
      resolve(process.cwd(), "../wp/wp-content/plugins/fansocial/assets/shared/event-cards.css"), "utf8",
    );
    document.body.appendChild(style);
    const addons = card.querySelector('[data-name="addons"]');
    expect(window.getComputedStyle(addons).backgroundColor).toBe("rgba(34, 204, 238, 0.5)");
    addons.querySelectorAll("p, span").forEach(el => {
      expect(window.getComputedStyle(el).color).toBe("rgb(103, 227, 249)");
    });
    [
      '[data-name="description"]', '[data-name="prerequisite-shipping"]',
      '.event-card-next-availability p', '.event-card-next-availability b',
      '.left-subtitle', '.left-subtitle b',
    ].forEach(selector => {
      expect(window.getComputedStyle(card.querySelector(selector)).color).toBe("rgb(234, 236, 240)");
    });
    expect(window.getComputedStyle(card.querySelector('[data-name="prerequisite-price"]')).color).toBe("rgb(252, 228, 13)");
  });

  it("treats an owned subscription variation selected through media as a subscription", () => {
    const card = renderCallCard({ type: "media", action: "none", eligible: true,
      product: { title: "Generic variation", variation_title: "Close Circle", is_subscription_variation: true, price: 25,
        image_url: "https://example.test/tier-background.jpg" },
    });
    expect(card.classList.contains("event-card--subscription")).toBe(true);
    expect(card.querySelector('[data-name="prerequisite-owned-title"]').textContent).toBe("Close Circle");
    expect(card.querySelector('[data-name="prerequisite-owned-label"]').textContent).toBe("SUBSCRIBED");
    const image = card.querySelector('[data-name="prerequisite-owned"] > [data-name="prerequisite-image"]');
    expect(image.getAttribute("src")).toBe("https://example.test/tier-background.jpg");
    expect(image.alt).toBe("Close Circle");
    expect(card.querySelector('[data-name="prerequisite-regular-price"]').hidden).toBe(true);
  });

  it("uses authoritative raw booked slots when WordPress display rows omit event identity", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T17:50:00+06:00"));
    const rawSlot = {
      bookingId: "booking_live_shape",
      eventId: "evt_live_shape",
      userId: 2615,
      status: "confirmed",
      startIso: "2026-09-01T19:50:00+08:00",
      endIso: "2026-09-01T20:00:00+08:00",
      extensions: [],
    };
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        slots: [{
          bookingId: rawSlot.bookingId,
          status: rawSlot.status,
          startIso: "2026-09-01T17:50:00+06:00",
          endIso: "2026-09-01T18:00:00+06:00",
        }],
        original_data_response: { slots: [rawSlot] },
      }),
    })));

    const bookedSlots = await window.FanSocialEventCards.fetchBookedSlots(6586, {
      rejectOnError: true,
    });
    const next = window.FanSocialEventCards.getNextCardSlot({
      eventId: rawSlot.eventId,
      type: "1on1-call",
      repeatRule: "weekly",
      dateFrom: "2026-09-01",
      sessionDurationMinutes: 10,
      enableBufferTime: true,
      bookingBufferMinutes: 5,
      slots: [{
        day: "tuesday",
        startTime: "02:00",
        endTime: "01:55",
        endDayOffset: 1,
      }],
    }, bookedSlots);

    expect(bookedSlots).toEqual([rawSlot]);
    expect(next.startMs).toBe(new Date("2026-09-01T20:05:00+08:00").getTime());
  });

  it("opens the booking flow before requesting the background card refresh", () => {
    const callOrder = [];
    window.FSEventsEmbed.openFanBookingPopup.mockImplementation(() => {
      callOrder.push("open");
      return { close: vi.fn() };
    });
    const onBookingFlowOpened = vi.fn(() => callOrder.push("refresh"));

    const popup = window.FanSocialEventCards.openBookingPopupForEvent({
      eventId: "evt_123",
      creatorId: 1407,
    }, {
      creatorId: 1407,
      currentFanId: 2615,
      onBookingFlowOpened,
    });

    expect(callOrder).toEqual(["open", "refresh"]);
    expect(onBookingFlowOpened).toHaveBeenCalledWith(expect.objectContaining({ eventId: "evt_123" }));
    expect(popup).toEqual(expect.objectContaining({ close: expect.any(Function) }));
  });

  it("forwards booking creation to the card refresh callback", () => {
    const event = { eventId: "evt_123", creatorId: 1407 };
    const payload = { bookingId: "booking_123" };
    const onBookingCreated = vi.fn();

    window.FanSocialEventCards.openBookingPopupForEvent(event, {
      creatorId: 1407,
      currentFanId: 2615,
      onBookingCreated,
    });
    const popupOptions = window.FSEventsEmbed.openFanBookingPopup.mock.calls[0][0];
    popupOptions.onBookingCreated(payload);

    expect(onBookingCreated).toHaveBeenCalledWith(event, payload);
  });

  it("keeps profile booking lifecycle callbacks when rendering through the profile wrapper", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T00:00:00Z"));
    document.body.innerHTML = `
      <template data-id="event-1on1-card"><button data-el="book-now">Book</button></template>
      <div data-creator-events-list></div>
    `;
    const onBookingFlowOpened = vi.fn();
    const onBookingCreated = vi.fn();
    const event = {
      eventId: "evt_private_profile",
      creatorId: 1407,
      type: "1on1-call",
      repeatRule: "daily",
      dateFrom: "2026-09-01",
      dateTo: "2026-09-03",
      sessionDurationMinutes: 10,
      slots: [{ startTime: "08:30", endTime: "09:00" }],
    };

    window.FanSocialEventCards.renderProfileCreatorEvents({
      creatorId: 1407,
      currentFanId: 2615,
      onBookingFlowOpened,
      onBookingCreated,
    }, [event], []);
    document.querySelector('[data-el="book-now"]').click();
    const popupOptions = window.FSEventsEmbed.openFanBookingPopup.mock.calls[0][0];
    popupOptions.onBookingCreated({ bookingId: "booking_profile" });

    expect(onBookingFlowOpened).toHaveBeenCalledWith(event);
    expect(onBookingCreated).toHaveBeenCalledWith(event, { bookingId: "booking_profile" });
  });

  it("applies the configured buffer after a booked private session", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T00:00:00Z"));
    const event = {
      eventId: "evt_buffered",
      type: "1on1-call",
      repeatRule: "daily",
      dateFrom: "2026-09-01",
      dateTo: "2026-09-01",
      sessionDurationMinutes: 10,
      enableBufferTime: true,
      bookingBufferMinutes: 5,
      slots: [{ startTime: "08:20", endTime: "09:00" }],
    };
    const next = window.FanSocialEventCards.getNextCardSlot(event, [{
      eventId: event.eventId,
      status: "confirmed",
      startIso: "2026-09-01T08:20:00+08:00",
      endIso: "2026-09-01T08:30:00+08:00",
    }]);

    expect(next.startMs).toBe(new Date("2026-09-01T08:35:00+08:00").getTime());
  });

  it("shows 4:50 after a buffered 4:35 to 4:45 booking", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T08:00:00+08:00"));
    const event = {
      eventId: "evt_435",
      type: "1on1-call",
      repeatRule: "daily",
      dateFrom: "2026-09-01",
      dateTo: "2026-09-01",
      sessionDurationMinutes: 10,
      enableBufferTime: true,
      bookingBufferMinutes: 5,
      slots: [{ startTime: "16:35", endTime: "17:15" }],
    };
    const next = window.FanSocialEventCards.getNextCardSlot(event, [{
      eventId: event.eventId,
      status: "confirmed",
      startIso: "2026-09-01T16:35:00+08:00",
      endIso: "2026-09-01T16:45:00+08:00",
    }]);

    expect(next.startMs).toBe(new Date("2026-09-01T16:50:00+08:00").getTime());
  });

  it("does not insert buffers between entirely free private sessions", () => {
    const event = {
      eventId: "evt_free",
      type: "1on1-call",
      repeatRule: "daily",
      dateFrom: "2026-09-01",
      dateTo: "2026-09-01",
      sessionDurationMinutes: 10,
      enableBufferTime: true,
      bookingBufferMinutes: 5,
      slots: [{ startTime: "16:35", endTime: "17:15" }],
    };
    const slots = window.__FSHeroRightButtonsSlotLogic.buildCandidateCardSlotsForLocalDate(
      event,
      "2026-09-01",
      [],
      event.eventId,
    );

    expect(slots.slice(0, 3).map((slot) => slot.startMs)).toEqual([
      new Date("2026-09-01T16:35:00+08:00").getTime(),
      new Date("2026-09-01T16:45:00+08:00").getTime(),
      new Date("2026-09-01T16:55:00+08:00").getTime(),
    ]);
  });

  it.each([
    {
      label: "1-to-1",
      event: {
        eventId: "evt_private",
        creatorId: 1407,
        type: "1on1-call",
        repeatRule: "daily",
        dateFrom: "2026-09-01",
        dateTo: "2026-09-03",
        sessionDurationMinutes: 15,
        slots: [{ startTime: "04:45", endTime: "05:15" }],
      },
    },
    {
      label: "group",
      event: {
        eventId: "evt_group",
        creatorId: 1407,
        type: "group-event",
        repeatRule: "doesNotRepeat",
        dateFrom: "2026-09-02",
        enableMaxAttendees: true,
        maxAttendees: 2,
        basePriceTokens: 100,
        slots: [{ date: "2026-09-02", times: [{ startTime: "04:45", endTime: "05:45" }] }],
      },
    },
  ])("refreshes after the enabled $label card action opens the flow", ({ event }) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T00:00:00Z"));
    document.body.innerHTML = `
      <template data-id="event-1on1-card"><button data-el="book-now">Book</button></template>
      <template data-id="event-group-fixedPrice-card"><button data-el="book-now">Join</button></template>
      <div data-cards></div>
    `;
    const onBookingFlowOpened = vi.fn();

    const rendered = window.FanSocialEventCards.renderEventSlides({
      container: document.querySelector("[data-cards]"),
      templateScope: document,
      events: [event],
      bookedSlots: [],
      creatorId: 1407,
      currentFanId: 2615,
      onBookingFlowOpened,
    });
    document.querySelector('[data-el="book-now"]').click();

    expect(rendered).toHaveLength(1);
    expect(window.FSEventsEmbed.openFanBookingPopup).toHaveBeenCalledTimes(1);
    expect(onBookingFlowOpened).toHaveBeenCalledTimes(1);
  });

  it("does not open or refresh from a disabled group-event action", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T00:00:00Z"));
    document.body.innerHTML = `
      <template data-id="event-1on1-card"><button data-el="book-now">Book</button></template>
      <template data-id="event-group-fixedPrice-card"><button data-el="book-now">Join</button></template>
      <div data-cards></div>
    `;
    const event = {
      eventId: "evt_group_booked",
      creatorId: 1407,
      type: "group-event",
      repeatRule: "doesNotRepeat",
      dateFrom: "2026-09-02",
      enableMaxAttendees: true,
      maxAttendees: 2,
      basePriceTokens: 100,
      slots: [{ date: "2026-09-02", times: [{ startTime: "04:45", endTime: "05:45" }] }],
    };
    const onBookingFlowOpened = vi.fn();

    const rendered = window.FanSocialEventCards.renderEventSlides({
      container: document.querySelector("[data-cards]"),
      templateScope: document,
      events: [event],
      bookedSlots: [{
        eventId: event.eventId,
        userId: 2615,
        status: "confirmed",
        startIso: "2026-09-02T04:45:00+08:00",
        endIso: "2026-09-02T05:45:00+08:00",
      }],
      creatorId: 1407,
      currentFanId: 2615,
      onBookingFlowOpened,
    });
    const button = document.querySelector('[data-el="book-now"]');
    button.click();

    expect(rendered).toHaveLength(1);
    expect(button.disabled).toBe(true);
    expect(window.FSEventsEmbed.openFanBookingPopup).not.toHaveBeenCalled();
    expect(onBookingFlowOpened).not.toHaveBeenCalled();
  });

  it.each([
    {
      label: "multiple dates",
      slots: [
        { date: "2026-09-02", times: [{ startTime: "04:45", endTime: "05:45" }] },
        { date: "2026-09-03", times: [{ startTime: "04:45", endTime: "05:45" }] },
      ],
      expected: [false, false],
    },
    {
      label: "open-ended recurring dates",
      repeatRule: "weekly",
      slots: [{ day: "wednesday", startTime: "04:45", endTime: "05:45" }],
      expected: [false, false],
    },
    {
      label: "one date with multiple sessions",
      slots: [{
        date: "2026-09-02",
        times: [
          { startTime: "04:45", endTime: "05:45" },
          { startTime: "06:45", endTime: "07:45" },
        ],
      }],
      expected: [true, false],
    },
    {
      label: "one date with one session",
      slots: [{ date: "2026-09-02", times: [{ startTime: "04:45", endTime: "05:45" }] }],
      expected: [true, true],
    },
  ])("applies group card date/time cardinality for $label", ({ slots, expected, repeatRule }) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T00:00:00Z"));
    const stats = window.FanSocialEventCards.getGroupCardStats({
      eventId: "evt_group_cardinality",
      type: "group-event",
      repeatRule: repeatRule || "doesNotRepeat",
      dateFrom: slots[0].date || "2026-09-02",
      dateTo: slots[slots.length - 1].date,
      maxAttendees: 10,
      slots,
    }, [], { currentFanId: 2615 });

    expect([stats.showDate, stats.showTime]).toEqual(expected);
  });
});
