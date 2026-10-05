import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const assetRoot = resolve(process.cwd(), "../wp/wp-content/plugins/fansocial/assets");
const sharedSource = readFileSync(resolve(assetRoot, "shared/event-cards.js"), "utf8");
const heroSource = readFileSync(resolve(assetRoot, "new-profile/hero-right-buttons.js"), "utf8");
const bookingsSource = heroSource.slice(heroSource.indexOf("// Bookings"));
const cardTemplates = readFileSync(resolve(assetRoot,
  "../templates/template-parts/shared/template-part-event-card-templates.php"), "utf8")
  .replace(/<\?php[\s\S]*?\?>/g, "");

describe("group prerequisite purchase footer", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T00:00:00Z"));
    document.body.innerHTML = cardTemplates + '<ul data-test-cards></ul>';
    window.eval(sharedSource);
  });

  afterEach(() => {
    delete window.FanSocialEventCards;
    delete window.__FSHeroRightButtonsSlotLogic;
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  function render({ goal = false, eligible = false, subscription = false, required = true, booked = false } = {}) {
    const event = {
      eventId: "group", creatorId: 1407, title: "Group", type: "group-event",
      priceSetting: goal ? "eventGoal" : "fixedPrice", repeatRule: "doesNotRepeat",
      dateFrom: "2026-09-01", slots: [{ date: "2026-09-01", startTime: "08:30", endTime: "09:30" }],
      basePriceTokens: 120, minContributionPerUser: 50, eventGoalTokens: 1000,
      enableMaxAttendees: true, maxAttendees: 10,
      requiredProducts: required ? [{ id: 42, type: subscription ? "subscription" : "media" }] : [],
    };
    window.FanSocialEventCards.renderEventSlides({
      container: document.querySelector("[data-test-cards]"), events: [event], currentFanId: 2615,
      bookedSlots: booked ? [{ eventId: "group", userId: 2615,
        startIso: "2026-09-01T00:30:00Z", endIso: "2026-09-01T01:30:00Z" }] : [],
      prerequisiteByEvent: { group: { prerequisite: {
        eligible, type: subscription ? "subscription" : "media", action: subscription ? "switch" : "buy",
        product: { title: "Required item", price: 2 },
      } } },
    });
    return document.querySelector("[data-test-cards] .card-wrapper");
  }

  it.each([false, true])("uses the existing split purchase footer and keeps group details (goal=%s)", (goal) => {
    const card = render({ goal });
    const button = card.querySelector('[data-el="book-now"]');
    expect(card.classList.contains("event-card--group")).toBe(true);
    expect(card.querySelector('[data-name="type"]').parentElement.classList.contains("card-header")).toBe(true);
    expect(card.querySelector(".card-header").classList.contains("bg--col--red-rose")).toBe(true);
    if (!goal) expect(card.querySelector('[data-name="capacity-badge"]').textContent).toContain("Limited spots!");
    expect(button.classList.contains("event-card-call-footer")).toBe(true);
    expect(button.querySelector('[data-name="action-label"]').textContent).toBe("BUY &\nBOOK CALL");
    expect(button.querySelector('[data-name="price"]').textContent).toBe(goal ? "50" : "120");
    expect(button.querySelector('[data-name="sessionLength"]').parentElement.hidden).toBe(goal);
    if (!goal) expect(button.querySelector('[data-name="sessionLength"]').textContent).toBe("60");
    expect(button.querySelector(".left-subtitle").textContent).toBe(goal ? "minimum contribution" : "");
    expect(button.querySelector(".left-subtitle").hidden).toBe(!goal);
    expect(card.querySelector('.content-top .content-price').hidden).toBe(true);
    expect(card.querySelector('.content-bottom [data-name="progress-wrapper"]')).not.toBeNull();
    expect(card.querySelector('[data-name="joined-label"]').textContent).toBe("0 fans already joined");
    expect(card.querySelector(goal ? '[data-name="progress-primary"]' : '[data-name="spots-left"]').textContent)
      .toBe(goal ? "0/1,000 Tokens" : "10/10 spots left!");
  });

  it("uses Subscribe & Book Call for a required subscription switch", () => {
    const card = render({ subscription: true });
    expect(card.querySelector('[data-name="action-label"]').textContent).toBe("SUBSCRIBE &\nBOOK CALL");
    expect(card.classList.contains("event-card--subscription-required")).toBe(true);
  });

  it.each([{ eligible: true }, { required: false }])("keeps the normal group join footer when no purchase is needed (%j)", (options) => {
    const card = render(options);
    expect(card.querySelector('[data-el="book-now"]').classList.contains("event-card-call-footer")).toBe(false);
    expect(card.querySelector('[data-name="action-label"]').textContent).toBe("Join Event");
  });

  it("does not replace an already-booked disabled action with a purchase action", () => {
    const card = render({ booked: true });
    expect(card.querySelector('[data-el="book-now"]').disabled).toBe(true);
    expect(card.querySelector('[data-name="action-label"]').textContent).toBe("Already booked");
  });
});

describe.each(["shared", "fallback", "delayed shared"])("profile event-card position (%s)", (renderer) => {
  let items;
  let controller;
  let pendingResponse;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T00:00:00Z"));
    document.body.innerHTML = `
      <div data-pre-call-init-popup style="display: flex"></div>
      <div data-creator-events-slider>
        <div class="splide__track"><ul data-creator-events-list class="splide__list"></ul></div>
        <div class="splide__arrows"></div>
      </div>
      <template data-id="event-1on1-card"><strong data-name="title"></strong></template>
      <template data-id="event-group-fixedPrice-card"><strong data-name="title"></strong><div data-name="group-datetime"><span data-name="group-date"></span><span data-name="group-time"></span></div><button data-el="book-now">Join</button></template>
    `;
    window.siteData = { bookingsBackendLambdaEndpoint: "https://bookings.example" };
    window.userData = { userID: 2615 };
    window.userSpecifiData = { currentUser: { userId: 2615 }, targetUser: { userId: 1407 } };
    window.translation_strings = {};
    window._UPDATE_UI_ACCORDING_TO_CALL_AVAILABILITY = vi.fn();
    items = ["a", "b", "c", "d"].map((eventId) => ({
      eventId, title: eventId, type: "1on1-call", repeatRule: "daily",
      dateFrom: "2026-09-01", dateTo: "2026-09-03", sessionDurationMinutes: 10,
      slots: [{ startTime: "08:30", endTime: "12:00" }],
    }));
    vi.stubGlobal("fetch", vi.fn(async (url) => {
      if (String(url).includes("/events?")) {
        if (pendingResponse) await pendingResponse;
        return { ok: true, json: async () => ({ ok: true, items }) };
      }
      return { ok: true, json: async () => ({ ok: true, slots: [] }) };
    }));
    vi.stubGlobal("Splide", class {
      constructor(element, options) { this.index = options.start || 0; }
      mount() { return this; }
      destroy() {}
    });
    if (renderer === "delayed shared") {
      const sharedScript = document.createElement('script');
      sharedScript.src = '/wp-content/plugins/fansocial/assets/shared/event-cards.js';
      document.body.appendChild(sharedScript);
      window.eval(bookingsSource);
      expect(window._PROFILE_CREATOR_EVENTS_REFRESH_CONTROLLER).toBeUndefined();
      expect(fetch).not.toHaveBeenCalled();
      window.eval(sharedSource);
      sharedScript.dispatchEvent(new Event('load'));
    } else {
      if (renderer === "shared") window.eval(sharedSource);
      window.eval(bookingsSource);
    }
    controller = window._PROFILE_CREATOR_EVENTS_REFRESH_CONTROLLER;
    await controller.refresh("test-initial");
    await vi.advanceTimersByTimeAsync(0);
  });

  afterEach(() => {
    controller?.dispose();
    for (const key of ["FanSocialEventCards", "__FSHeroRightButtonsSlotLogic",
      "_PROFILE_CREATOR_EVENTS_REFRESH_CONTROLLER", "_PROFILE_CREATOR_EVENTS_DOM_READY_LISTENER",
      "_creatorEventsSplide", "_UPDATE_UI_ACCORDING_TO_CALL_AVAILABILITY",
      "siteData", "userData", "userSpecifiData", "translation_strings"]) delete window[key];
    document.body.innerHTML = "";
    pendingResponse = null;
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  const selectedEventId = () => document.querySelector("[data-creator-events-list]")
    .children[window._creatorEventsSplide.index].dataset.eventId;

  it.each([
    ["weekly", undefined, false],
    ["daily", "2026-09-03", false],
    ["doesNotRepeat", "2026-09-01", true],
  ])("only shows group date/time for a single scheduled date (%s)", async (repeatRule, dateTo, visible) => {
    items = [{ eventId: "group", title: "Group", type: "group-event", groupEventType: "fixedPrice", repeatRule,
      dateFrom: "2026-09-01", dateTo, slots: [{ date: "2026-09-01", day: "tuesday", startTime: "08:30", endTime: "09:30" }], basePriceTokens: 50 }];
    await controller.refresh("test-group-dates");
    const date = document.querySelector('[data-creator-events-list] [data-name="group-date"]');
    expect(date).not.toBeNull();
    expect(date.style.display !== "none").toBe(visible);
    const time = document.querySelector('[data-creator-events-list] [data-name="group-time"]');
    expect(time.style.display !== "none").toBe(visible);
  });

  it("keeps the selected card across polling while updating its details", async () => {
    window._creatorEventsSplide.index = 2;
    items[2] = { ...items[2], title: "Updated card" };
    await vi.advanceTimersByTimeAsync(10000);
    expect(selectedEventId()).toBe("c");
    expect(document.querySelectorAll('[data-name="title"]')[2].textContent).toBe("Updated card");
  });

  it('closes group card booking and refreshes at ten minutes before the end', () => {
    const logic = renderer === 'fallback' ? window.__FSHeroRightButtonsSlotLogic : window.FanSocialEventCards;
    const event = { eventId: 'group-cutoff', type: 'group-event', repeatRule: 'doesNotRepeat',
      slots: [{ date: '2026-09-01', times: [{ startTime: '16:00', endTime: '17:00' }] }] };
    vi.setSystemTime(new Date('2026-09-01T16:49:59+08:00'));
    const slot = logic.getNextCardSlot(event, [], 2615);
    expect(slot).not.toBeNull();
    expect(logic.getEventCardInvalidationAt(event, slot)).toBe(Date.parse('2026-09-01T16:50:00+08:00'));
    vi.setSystemTime(new Date('2026-09-01T16:50:00+08:00'));
    expect(logic.getNextCardSlot(event, [], 2615)).toBeNull();
  });

  it("follows the same event after earlier cards disappear or change order", async () => {
    window._creatorEventsSplide.index = 2;
    items = [items[3], items[2], items[0]];
    await controller.refresh("test-reorder");
    expect(selectedEventId()).toBe("c");
    expect(window._creatorEventsSplide.index).toBe(1);
  });

  it("uses the nearest remaining position when the selected event disappears", async () => {
    window._creatorEventsSplide.index = 3;
    items = items.slice(0, 2);
    await controller.refresh("test-remove");
    expect(selectedEventId()).toBe("b");
  });

  it("uses the latest navigation position when a slow response arrives", async () => {
    let releaseResponse;
    pendingResponse = new Promise((resolveResponse) => { releaseResponse = resolveResponse; });
    const refresh = controller.refresh("test-slow");
    await Promise.resolve();
    window._creatorEventsSplide.index = 2;
    releaseResponse();
    await refresh;
    expect(selectedEventId()).toBe("c");
  });

  it("clears the slider for an empty list and starts safely when cards return", async () => {
    const originalItems = items;
    window._creatorEventsSplide.index = 3;
    items = [];
    await controller.refresh("test-empty");
    expect(window._creatorEventsSplide).toBeNull();
    expect(document.querySelector("[data-creator-events-list]").children).toHaveLength(0);
    items = originalItems.slice(0, 1);
    await controller.refresh("test-return");
    expect(selectedEventId()).toBe("a");
  });
});
