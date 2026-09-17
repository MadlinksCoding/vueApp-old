import { flushPromises, mount } from "@vue/test-utils";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import EventNotificationCard from "@/components/ui/card/event/EventNotificationCard.vue";
import EventNotificationStack from "@/components/ui/card/event/EventNotificationStack.vue";
import { BOOKING_NOTICE_PRIORITIES, BOOKING_NOTICE_TYPES } from "@/components/ui/card/event/bookingNoticeConfig";
import { clearBookingNoticeProfileCache } from "@/components/ui/card/event/bookingNoticeProfile";

const cardSource = readFileSync(resolve(process.cwd(), "src/components/ui/card/event/EventNotificationCard.vue"), "utf8");
const stackSource = readFileSync(resolve(process.cwd(), "src/components/ui/card/event/EventNotificationStack.vue"), "utf8");

const booking = (id, overrides = {}) => ({
  id,
  month: "APRIL",
  day: "25",
  title: "Lantau cows meet up",
  time: "2:15pm – 9:30pm",
  person: { name: "The grape gatsby", avatar: "avatar.png" },
  eventAt: "2026-04-25T14:15:00",
  occurredAt: "2026-04-20T09:00:00",
  status: "pending",
  ...overrides,
});

afterEach(() => {
  clearBookingNoticeProfileCache();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("EventNotificationCard", () => {
  it("loads the notice avatar from get-profile-data and shows a skeleton while waiting", async () => {
    let resolveProfile;
    const fetchMock = vi.fn(() => new Promise((resolveRequest) => {
      resolveProfile = resolveRequest;
    }));
    vi.stubGlobal("fetch", fetchMock);
    const wrapper = mount(EventNotificationCard, {
      props: {
        notice: {
          id: "profile-avatar",
          type: BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED,
          items: [booking("profile-item", {
            person: { userId: 2615, name: "Fan", avatar: "wrong-avatar.png" },
          })],
        },
      },
    });

    expect(wrapper.find('[data-test="notice-avatar-skeleton"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="notice-avatar"]').exists()).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toContain("/wp-json/api/users/get-profile-data?id=2615");

    resolveProfile({
      ok: true,
      json: async () => ({ user: {
        display_name: "Current Creator Name",
        avatar: "https://example.com/correct-avatar.webp",
      } }),
    });
    await flushPromises();

    expect(wrapper.find('[data-test="notice-avatar-skeleton"]').exists()).toBe(false);
    expect(wrapper.get('[data-test="notice-avatar"]').attributes("src")).toBe("https://example.com/correct-avatar.webp");
    expect(wrapper.get('[data-test="notice-person-name"]').text()).toBe("Current Creator Name");
    expect(wrapper.html()).not.toContain("wrong-avatar.png");
  });

  it("uses the fetched username and keeps the stored avatar when the profile has no avatar", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({ user: { username: "current-creator" } }),
    })));
    const wrapper = mount(EventNotificationCard, {
      props: {
        notice: {
          id: "profile-username",
          type: BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED,
          items: [booking("profile-username-item", {
            person: { userId: 1407, name: "Stored creator", avatar: "stored-avatar.png" },
          })],
        },
      },
    });
    await flushPromises();

    expect(wrapper.get('[data-test="notice-person-name"]').text()).toBe("current-creator");
    expect(wrapper.get('[data-test="notice-avatar"]').attributes("src")).toBe("stored-avatar.png");
  });

  it("keeps the stored notice identity when get-profile-data fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 503 })));
    const wrapper = mount(EventNotificationCard, {
      props: {
        notice: {
          id: "profile-fallback",
          type: BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED,
          items: [booking("profile-fallback-item", {
            person: { userId: 1407, name: "Stored creator", avatar: "stored-avatar.png" },
          })],
        },
      },
    });
    await flushPromises();

    expect(wrapper.get('[data-test="notice-person-name"]').text()).toBe("Stored creator");
    expect(wrapper.get('[data-test="notice-avatar"]').attributes("src")).toBe("stored-avatar.png");
  });

  it("falls back from a broken profile avatar to the stored avatar", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({ user: {
        display_name: "Current Creator",
        avatar: "broken-profile-avatar.png",
      } }),
    })));
    const wrapper = mount(EventNotificationCard, {
      props: {
        notice: {
          id: "profile-image-fallback",
          type: BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED,
          items: [booking("profile-image-fallback-item", {
            person: { userId: 1407, name: "Stored creator", avatar: "stored-avatar.png" },
          })],
        },
      },
    });
    await flushPromises();

    expect(wrapper.get('[data-test="notice-avatar"]').attributes("src")).toBe("broken-profile-avatar.png");
    await wrapper.get('[data-test="notice-avatar"]').trigger("error");
    expect(wrapper.get('[data-test="notice-avatar"]').attributes("src")).toBe("stored-avatar.png");
  });

  it("uses a neutral name when no participant identity can be recovered", () => {
    const wrapper = mount(EventNotificationCard, {
      props: {
        notice: {
          id: "anonymous-profile",
          type: BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED,
          items: [booking("anonymous-profile-item", { person: {} })],
        },
      },
    });

    expect(wrapper.get('[data-test="notice-person-name"]').text()).toBe("Someone");
    expect(wrapper.find('[data-test="notice-avatar"]').exists()).toBe(false);
  });

  it("shares one profile request when several notice items belong to the same user", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ user: { avatar: "https://example.com/shared-avatar.webp" } }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    const wrapper = mount(EventNotificationCard, {
      props: {
        notice: {
          id: "shared-profile-avatar",
          type: BOOKING_NOTICE_TYPES.BOOKING_REQUEST,
          items: [
            booking("shared-one", { person: { userId: 9001, name: "Fan one" } }),
            booking("shared-two", { person: { userId: 9001, name: "Fan one" } }),
          ],
        },
      },
    });
    await flushPromises();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(wrapper.findAll('[data-test="notice-avatar"]')).toHaveLength(2);
  });

  it("preserves the original card glow and keeps motion on a separate wrapper", () => {
    const wrapper = mount(EventNotificationCard, {
      props: {
        notice: {
          id: "visual-1",
          type: BOOKING_NOTICE_TYPES.BOOKING_REQUEST,
          items: [booking("booking-1")],
          action: { id: "review", label: "REVIEW" },
        },
        viewportMode: "desktop",
      },
    });

    expect(wrapper.get("article").classes()).toContain("booking-notice-attention-pulse");
    expect(wrapper.get(".booking-notice-motion-shell").classes()).toContain("booking-notice-enter-fade");
    expect(wrapper.get('[data-test="notice-primary-action"]').classes()).toContain("booking-notice-action--outline");
    expect(wrapper.find(".booking-notice-accent").exists()).toBe(true);
    expect(wrapper.get("article").classes()).toContain("booking-notice-card--embedded-desktop");
    expect(cardSource).toContain("animation: booking-notice-pulse 1.5s ease-in-out infinite");
    expect(cardSource).toContain("0 0 12px rgba(255, 0, 102, .25)");
    expect(cardSource).toContain("0 0 18px rgba(255, 0, 102, .4)");
    expect(cardSource).toContain("overflow: visible");
    expect(cardSource).toContain("var(--fs-booking-notices-max-height, 640px)");
    expect(cardSource).toContain("height: 1.5rem; width: 1.5rem");
    expect(cardSource).toContain("right: -.5rem; top: -.5rem; background: #eaecf0; box-shadow: 0 0 4px rgba(0, 0, 0, .25)");
  });

  it("keeps grouped requests and summaries free of an added outer accent bar", () => {
    const grouped = mount(EventNotificationCard, {
      props: {
        notice: {
          id: "grouped-visual",
          type: BOOKING_NOTICE_TYPES.BOOKING_REQUEST,
          items: [booking("booking-1"), booking("booking-2")],
        },
      },
    });
    const summary = mount(EventNotificationCard, {
      props: {
        notice: { id: "summary-visual", type: BOOKING_NOTICE_TYPES.SUMMARY, sections: [] },
      },
    });

    expect(grouped.find(".booking-notice-accent").exists()).toBe(false);
    expect(summary.find(".booking-notice-accent").exists()).toBe(false);
  });

  it("uses a full-width mobile stack with square regular cards and a rounded summary", () => {
    const regular = mount(EventNotificationCard, {
      props: {
        notice: {
          id: "mobile-regular",
          type: BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED,
          items: [booking("booking-mobile")],
        },
        viewportMode: "mobile",
      },
    });
    const summary = mount(EventNotificationCard, {
      props: {
        notice: { id: "mobile-summary", type: BOOKING_NOTICE_TYPES.SUMMARY, sections: [] },
        viewportMode: "mobile",
      },
    });

    expect(regular.get("article").classes()).toContain("booking-notice-card--embedded-mobile");
    expect(regular.get("article").classes()).not.toContain("booking-notice-card--summary");
    expect(summary.get("article").classes()).toEqual(expect.arrayContaining([
      "booking-notice-card--embedded-mobile",
      "booking-notice-card--summary",
    ]));
    expect(stackSource).toContain(".booking-notice-stack--mobile { width: 100vw; padding: 0; gap: .375rem; }");
    expect(cardSource).toContain(".booking-notice-card.booking-notice-card--embedded-mobile { max-width: none; border-radius: 0; }");
    expect(cardSource).toContain(".booking-notice-card.booking-notice-card--embedded-mobile.booking-notice-card--summary { border-radius: .625rem; }");
  });

  it("centers the optional summary greeting and hides the overall update total", () => {
    const notice = {
      id: "summary-header",
      type: BOOKING_NOTICE_TYPES.SUMMARY,
      viewer: { displayName: "Grape Gatsby" },
      sections: [{
        type: BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED,
        totalCount: 14,
        items: [booking("confirmed-summary")],
      }],
    };
    const wrapper = mount(EventNotificationCard, { props: { notice } });
    const greeting = wrapper.get('[data-test="summary-greeting"]');

    expect(greeting.text()).toBe("Welcome back, Grape Gatsby!");
    expect(greeting.classes()).toEqual(expect.arrayContaining(["px-6", "text-center"]));
    expect(wrapper.find('[data-test="summary-total"]').exists()).toBe(false);
    expect(wrapper.get('[data-summary-section-variant="booking-confirmed"]').text()).toBe("You have 14 confirmed bookings:");

    const greetingHidden = mount(EventNotificationCard, {
      props: { notice, config: { summary: { showGreeting: false } } },
    });
    expect(greetingHidden.find('[data-test="summary-greeting"]').exists()).toBe(false);
    expect(greetingHidden.find('[data-test="summary-total"]').exists()).toBe(false);
  });

  it("uses the original count-based heading text, color, and icon for every summary section", () => {
    const summaryItem = (id, activityType, status = "confirmed") => booking(id, { activityType, status });
    const wrapper = mount(EventNotificationCard, {
      props: {
        notice: {
          id: "summary-headings",
          type: BOOKING_NOTICE_TYPES.SUMMARY,
          sections: [
            { type: BOOKING_NOTICE_TYPES.BOOKING_REQUEST, totalCount: 3, items: [summaryItem("pending", "booking-request", "pending")] },
            { id: "price:sent", type: BOOKING_NOTICE_TYPES.PRICE_ADJUSTMENT, variant: "request-sent", totalCount: 4, items: [summaryItem("price-sent", "price-adjustment-sent", "pending")] },
            { id: "price:accepted", type: BOOKING_NOTICE_TYPES.PRICE_ADJUSTMENT, variant: "accepted", priority: "status-change", totalCount: 5, items: [summaryItem("price-accepted", "price-adjustment-accepted")] },
            { id: "price:declined", type: BOOKING_NOTICE_TYPES.PRICE_ADJUSTMENT, variant: "declined", priority: "status-change", totalCount: 6, items: [summaryItem("price-declined", "price-adjustment-declined", "declined")] },
            { type: BOOKING_NOTICE_TYPES.BOOKING_DECLINED, totalCount: 7, items: [summaryItem("declined", "booking-declined", "declined")] },
            { type: BOOKING_NOTICE_TYPES.EVENTS_TODAY, totalCount: 8, priority: BOOKING_NOTICE_PRIORITIES.TODAY, items: [summaryItem("today", "events-today")] },
          ],
        },
        config: { readyToJoinLeadMinutes: 5, summary: { totalLimit: 20 } },
      },
    });

    const heading = (variant) => wrapper.get(`[data-summary-section-variant="${variant}"]`);
    expect(wrapper.find('[data-summary-section-variant="ready-to-join"]').exists()).toBe(false);
    expect(heading("booking-request").text()).toBe("You have 3 new pending bookings:");
    expect(heading("booking-request").attributes("style")).toContain("rgb(255, 0, 102)");
    expect(heading("booking-request").get("img").attributes("src")).toContain("calendar-icon-pink");
    expect(heading("request-sent").text()).toBe("You have 4 new price adjustment requests:");
    expect(heading("request-sent").get("img").attributes("src")).toContain("file-search-pink");
    expect(heading("accepted").text()).toBe("You have 5 accepted price adjustments:");
    expect(heading("accepted").get("img").attributes("src")).toContain("calendar-check-green");
    expect(heading("declined").text()).toBe("You have 6 declined price adjustments:");
    expect(heading("declined").get("img").attributes("src")).toContain("calendar-cross");
    expect(heading("booking-declined").text()).toBe("You have 7 declined booking requests:");
    expect(heading("events-today").text()).toBe("You have 8 events today:");
    expect(heading("events-today").attributes("style")).toContain("rgb(16, 117, 105)");
    expect(heading("events-today").get("img").attributes("src")).toContain("calendar-check-green");
  });

  it("uses singular summary heading wording", () => {
    const wrapper = mount(EventNotificationCard, {
      props: {
        notice: {
          id: "singular-summary",
          type: BOOKING_NOTICE_TYPES.SUMMARY,
          sections: [
            { type: BOOKING_NOTICE_TYPES.EVENTS_TODAY, totalCount: 1, priority: BOOKING_NOTICE_PRIORITIES.TODAY, items: [booking("today-one")] },
          ],
        },
        config: { readyToJoinLeadMinutes: 1 },
      },
    });

    expect(wrapper.get('[data-summary-section-variant="events-today"]').text()).toBe("You have 1 event today:");
  });

  it("supports none and blink without losing the static shadow", () => {
    const notice = { id: "visual-2", type: BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED, items: [booking("booking-1")] };
    const none = mount(EventNotificationCard, { props: { notice, config: { attentionAnimation: "none" } } });
    const blink = mount(EventNotificationCard, { props: { notice, config: { attentionAnimation: "blink" } } });

    expect(none.get("article").classes()).toContain("booking-notice-attention-none");
    expect(blink.get("article").classes()).toContain("booking-notice-attention-blink");
    expect(cardSource).toMatch(/booking-notice-attention-none[^}]+box-shadow:\s*0 0 12px/);
    expect(cardSource).toContain("prefers-reduced-motion: reduce");
  });

  it("restores the ready-to-join icon and green attention ring", () => {
    const wrapper = mount(EventNotificationCard, {
      props: {
        notice: {
          id: "ready-visual",
          type: BOOKING_NOTICE_TYPES.READY_TO_JOIN,
          audience: "fan",
          items: [booking("booking-1", {
            status: "confirmed",
            timeOnly: true,
            eventAt: new Date(Date.now() + 5 * 60_000).toISOString(),
          })],
          action: { id: "join", label: "JOIN CALL" },
        },
      },
    });

    const action = wrapper.get('[data-test="notice-primary-action"]');
    expect(action.classes()).toEqual(expect.arrayContaining(["booking-notice-action--ready", "booking-notice-action--pulse"]));
    expect(action.find("img").exists()).toBe(true);
    expect(wrapper.text()).toContain("in 5 min");
    expect(cardSource).toContain("animation: booking-notice-green-pulse 1.5s ease-in-out infinite");
  });

  it("updates a standalone ready-to-join heading and item countdown through live now", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-14T10:00:00.000Z"));
    const wrapper = mount(EventNotificationCard, {
      props: {
        notice: {
          id: "ready-countdown",
          type: BOOKING_NOTICE_TYPES.READY_TO_JOIN,
          audience: "fan",
          items: [booking("ready-countdown-item", {
            status: "confirmed",
            timeOnly: true,
            eventAt: "2026-09-14T10:05:00.000Z",
          })],
          action: { id: "join-call", label: "JOIN CALL" },
        },
        config: { durationSeconds: 0 },
      },
    });
    const expectCountdown = (minutes) => {
      expect(wrapper.get("h3").text()).toBe(`Event starts in ${minutes} ${minutes === 1 ? "minute" : "minutes"}:`);
      expect(wrapper.get(".booking-notice-countdown").text()).toContain(`in ${minutes} min`);
    };

    expectCountdown(5);
    for (const minutes of [4, 3, 2, 1]) {
      await vi.advanceTimersByTimeAsync(60_000);
      await wrapper.vm.$nextTick();
      expectCountdown(minutes);
    }
    await vi.advanceTimersByTimeAsync(1_000);
    await wrapper.vm.$nextTick();
    expect(wrapper.get("h3").text()).toBe("Event is live now:");
    expect(wrapper.get(".booking-notice-countdown").text()).toContain("live now");
    expect(wrapper.emitted("close")).toBeUndefined();
  });

  it("falls back to the configured lead time and recalculates when a start time arrives or changes", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-14T10:00:00.000Z"));
    const notice = {
      id: "ready-rescheduled",
      type: BOOKING_NOTICE_TYPES.READY_TO_JOIN,
      items: [booking("ready-rescheduled-item", { status: "confirmed", eventAt: "" })],
      action: { id: "join-call", label: "JOIN CALL" },
    };
    const wrapper = mount(EventNotificationCard, {
      props: { notice, config: { readyToJoinLeadMinutes: 5 } },
    });

    expect(wrapper.get("h3").text()).toBe("Event starts in 5 minutes:");
    expect(wrapper.get(".booking-notice-countdown").text()).toContain("in 5 min");

    await wrapper.setProps({
      notice: {
        ...notice,
        items: [{ ...notice.items[0], eventAt: "2026-09-14T10:03:00.000Z" }],
      },
    });
    expect(wrapper.get("h3").text()).toBe("Event starts in 3 minutes:");
    expect(wrapper.get(".booking-notice-countdown").text()).toContain("in 3 min");
  });

  it("never renders ready-to-join rows inside a summary", () => {
    const wrapper = mount(EventNotificationCard, {
      props: {
        notice: {
          id: "ready-summary-filter",
          type: BOOKING_NOTICE_TYPES.SUMMARY,
          audience: "fan",
          sections: [
            {
              type: BOOKING_NOTICE_TYPES.READY_TO_JOIN,
              totalCount: 2,
              items: [booking("ready-five"), booking("ready-two")],
            },
            {
              type: BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED,
              totalCount: 2,
              items: [booking("confirmed-one"), booking("confirmed-two")],
            },
          ],
        },
      },
    });

    expect(wrapper.find('[data-summary-section-variant="ready-to-join"]').exists()).toBe(false);
    expect(wrapper.findAll(".booking-notice-countdown")).toHaveLength(0);
    expect(wrapper.findAll(".booking-notice-item")).toHaveLength(2);
  });

  it("uses one price-adjustment card for sent, accepted, and declined wording", async () => {
    const wrapper = mount(EventNotificationCard, {
      props: {
        notice: {
          id: "price-1",
          type: BOOKING_NOTICE_TYPES.PRICE_ADJUSTMENT,
          priceAdjustmentState: "accepted",
          actor: { displayName: "@grapegatsby" },
          items: [booking("booking-1")],
        },
      },
    });

    expect(wrapper.text()).toContain("@grapegatsby has accepted your price adjustment");
    await wrapper.setProps({ notice: { ...wrapper.props("notice"), priceAdjustmentState: "declined" } });
    expect(wrapper.text()).toContain("@grapegatsby has declined your price adjustment");
    await wrapper.setProps({ notice: { ...wrapper.props("notice"), priceAdjustmentState: "request-sent" } });
    expect(wrapper.text()).toContain("@grapegatsby sent you a price adjustment request");
  });

  it("does not dismiss when Detail is clicked", async () => {
    const wrapper = mount(EventNotificationCard, {
      props: {
        notice: {
          id: "declined-1",
          type: BOOKING_NOTICE_TYPES.BOOKING_DECLINED,
          actor: { displayName: "@creator" },
          items: [booking("booking-1", { status: "declined" })],
          showDetail: true,
        },
      },
    });

    await wrapper.get('[data-test="notice-detail"]').trigger("click");
    expect(wrapper.emitted("detail")).toHaveLength(1);
    expect(wrapper.emitted("close")).toBeUndefined();
    expect(wrapper.find("article").exists()).toBe(true);
  });

  it.each([
    [BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED, "confirmed"],
    [BOOKING_NOTICE_TYPES.BOOKING_DECLINED, "declined"],
    [BOOKING_NOTICE_TYPES.BOOKING_CANCELLED, "cancelled"],
  ])("shows Detail instead of Review for a standalone fan %s notice", async (type, status) => {
    const wrapper = mount(EventNotificationCard, {
      props: {
        notice: {
          id: `fan-${status}-1`,
          type,
          audience: "fan",
          items: [booking("booking-1", { bookingId: "booking-real-1", status })],
          showDetail: true,
        },
        config: { exitEffect: "none" },
      },
    });

    expect(wrapper.find('[data-test="notice-primary-action"]').exists()).toBe(false);
    expect(wrapper.get('[data-test="notice-detail"]').text()).toContain("Detail");
    await wrapper.get('[data-test="notice-detail"]').trigger("click");
    expect(wrapper.emitted("detail")[0][0]).toMatchObject({
      noticeId: `fan-${status}-1`,
      item: { bookingId: "booking-real-1" },
    });
    expect(wrapper.emitted("primary-action")).toBeUndefined();
    expect(wrapper.emitted("close")).toBeUndefined();
    expect(wrapper.find("article").exists()).toBe(true);
  });

  it.each([
    ["both_no_show_auto_cancel", "cancelled_system", "Your booking was cancelled because neither participant joined:"],
    ["creator_no_show_auto_cancel", "no_show_creator", "Your booking was cancelled because the creator did not join:"],
    ["creator_cancelled", "cancelled_creator", "Your booking was cancelled:"],
  ])("uses the correct standalone cancellation wording for %s", (reason, status, expected) => {
    const wrapper = mount(EventNotificationCard, {
      props: {
        notice: {
          id: `fan-cancelled-${reason}`,
          type: BOOKING_NOTICE_TYPES.BOOKING_CANCELLED,
          audience: "fan",
          cancellationReason: reason,
          cancellationStatus: status,
          items: [booking("booking-cancelled", {
            bookingId: "booking-cancelled-real",
            status,
            cancellationReason: reason,
            cancellationStatus: status,
          })],
          showDetail: true,
        },
      },
    });

    expect(wrapper.text()).toContain(expected);
    expect(wrapper.find('[data-test="notice-primary-action"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="notice-detail"]').exists()).toBe(true);
  });

  it.each([
    ["fan_cancelled", "cancelled_user", "Cosmania Fan", "@Cosmania Fan cancelled the booking:"],
    ["fan_no_show", "no_show_fan", "Cosmania Fan", "The booking was cancelled because the fan did not join:"],
  ])("uses the creator-facing cancellation wording for %s", (reason, status, fanName, expected) => {
    const wrapper = mount(EventNotificationCard, {
      props: {
        notice: {
          id: `creator-cancelled-${reason}`,
          type: BOOKING_NOTICE_TYPES.BOOKING_CANCELLED,
          audience: "creator",
          actor: { displayName: fanName },
          cancellationReason: reason,
          cancellationStatus: status,
          items: [booking("creator-cancellation", {
            status,
            cancellationReason: reason,
            cancellationStatus: status,
          })],
          showDetail: true,
        },
      },
    });

    expect(wrapper.text()).toContain(expected);
    expect(wrapper.find('[data-test="notice-primary-action"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="notice-detail"]').exists()).toBe(true);
  });

  it("uses the orange cancellation heading in summaries", () => {
    const wrapper = mount(EventNotificationCard, {
      props: {
        notice: {
          id: "cancelled-summary",
          type: BOOKING_NOTICE_TYPES.SUMMARY,
          audience: "fan",
          viewer: { role: "fan", displayName: "Fan" },
          sections: [{
            type: BOOKING_NOTICE_TYPES.BOOKING_CANCELLED,
            priority: BOOKING_NOTICE_PRIORITIES.STATUS,
            totalCount: 2,
            items: [booking("cancelled-one"), booking("cancelled-two")],
          }],
        },
      },
    });

    const heading = wrapper.get('[data-test="summary-section-heading"]');
    expect(heading.text()).toBe("You have 2 cancelled bookings:");
    expect(heading.attributes("style")).toContain("color: rgb(255, 68, 5)");
  });

  it("keeps the contextual Review Adjustment label for a single fan price request", () => {
    const wrapper = mount(EventNotificationCard, {
      props: {
        notice: {
          id: "fan-adjustment-1",
          type: BOOKING_NOTICE_TYPES.PRICE_ADJUSTMENT,
          audience: "fan",
          priceAdjustmentState: "request-sent",
          items: [booking("booking-1", { bookingId: "booking-adjustment-1", activityType: "price-adjustment-sent" })],
          action: { id: "review-adjustment", label: "REVIEW ADJUSTMENT" },
          showDetail: true,
        },
      },
    });

    expect(wrapper.get('[data-test="notice-primary-action"]').text()).toContain("REVIEW ADJUSTMENT");
    expect(wrapper.get('[data-test="notice-primary-action"]').classes()).toContain("booking-notice-action--pink");
    expect(cardSource).toContain(".booking-notice-action--pink .booking-notice-action-icon img { filter: brightness(0) invert(1); }");
    expect(wrapper.find('[data-test="notice-detail"]').exists()).toBe(false);
  });

  it("uses complete count to replace a fan Review action with per-item Detail links", async () => {
    const wrapper = mount(EventNotificationCard, {
      props: {
        notice: {
          id: "fan-multiple",
          type: BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED,
          audience: "fan",
          items: [booking("shown", { bookingId: "booking-shown" }), booking("limited", { bookingId: "booking-limited" })],
          totalCount: 4,
          itemLimit: 1,
          action: { id: "review-bookings", label: "REVIEW IN EVENT PAGE" },
        },
      },
    });

    expect(wrapper.find('[data-test="notice-primary-action"]').exists()).toBe(false);
    expect(wrapper.findAll('[data-test="notice-detail"]')).toHaveLength(1);
    await wrapper.get('[data-test="notice-detail"]').trigger("click");
    expect(wrapper.emitted("detail")[0][0].item.bookingId).toBe("booking-shown");
    expect(wrapper.emitted("close")).toBeUndefined();
  });

  it("keeps grouped and summary notices unchanged when an item Detail is clicked", async () => {
    const grouped = mount(EventNotificationCard, {
      props: {
        notice: {
          id: "grouped-detail",
          type: BOOKING_NOTICE_TYPES.BOOKING_REQUEST,
          audience: "creator",
          items: [booking("group-one"), booking("group-two")],
          totalCount: 2,
          action: { id: "review-bookings", label: "REVIEW" },
        },
      },
    });
    await grouped.findAll('[data-test="notice-detail"]')[1].trigger("click");
    expect(grouped.emitted("detail")[0][0].item.id).toBe("group-two");
    expect(grouped.emitted("close")).toBeUndefined();
    expect(grouped.emitted("primary-action")).toBeUndefined();
    expect(grouped.findAll('[data-test="notice-detail"]')).toHaveLength(2);

    const summary = mount(EventNotificationCard, {
      props: {
        notice: {
          id: "summary-detail",
          type: BOOKING_NOTICE_TYPES.SUMMARY,
          audience: "fan",
          viewer: { role: "fan", displayName: "Fan" },
          sections: [{
            type: BOOKING_NOTICE_TYPES.EVENTS_TODAY,
            totalCount: 12,
            items: Array.from({ length: 12 }, (_, index) => booking(`summary-${index + 1}`)),
          }],
        },
        config: { summary: { totalLimit: 2, perSectionLimit: 2 } },
        additionalVisibleItems: 10,
      },
    });
    const overflowBefore = summary.find('[data-test="summary-overflow"]').exists();
    const visibleBefore = summary.findAll('[data-test="notice-detail"]').length;
    await summary.findAll('[data-test="notice-detail"]')[5].trigger("click");
    expect(summary.emitted("detail")[0][0].item.id).toBe("summary-6");
    expect(summary.emitted("close")).toBeUndefined();
    expect(summary.emitted("primary-action")).toBeUndefined();
    expect(summary.find('[data-test="summary-overflow"]').exists()).toBe(overflowBefore);
    expect(summary.findAll('[data-test="notice-detail"]')).toHaveLength(visibleBefore);
  });

  it("uses a Review action for a one-item fan summary and Details for a multi-item fan summary", () => {
    const single = mount(EventNotificationCard, {
      props: {
        notice: {
          id: "fan-summary-single",
          type: BOOKING_NOTICE_TYPES.SUMMARY,
          audience: "fan",
          viewer: { role: "fan", displayName: "Fan" },
          sections: [{ type: BOOKING_NOTICE_TYPES.EVENTS_TODAY, label: "Events today", totalCount: 1, items: [booking("one", { bookingId: "booking-one" })] }],
          action: { id: "review-summary", label: "REVIEW IN EVENT PAGE", showArrow: true },
        },
      },
    });
    expect(single.get('[data-test="notice-primary-action"]').text()).toBe("REVIEW");
    expect(single.find('[data-test="notice-detail"]').exists()).toBe(false);

    const multiple = mount(EventNotificationCard, {
      props: {
        notice: {
          id: "fan-summary-multiple",
          type: BOOKING_NOTICE_TYPES.SUMMARY,
          audience: "fan",
          viewer: { role: "fan", displayName: "Fan" },
          sections: [{ type: BOOKING_NOTICE_TYPES.EVENTS_TODAY, label: "Events today", totalCount: 3, items: [booking("one"), booking("two")] }],
          action: { id: "review-summary", label: "REVIEW IN EVENT PAGE", showArrow: true },
        },
      },
    });
    expect(multiple.find('[data-test="notice-primary-action"]').exists()).toBe(false);
    expect(multiple.findAll('[data-test="notice-detail"]')).toHaveLength(2);
  });

  it("keeps each ready item as a separate Join Call card beside a summary", async () => {
    const ready = {
      id: "fan-ready",
      type: BOOKING_NOTICE_TYPES.READY_TO_JOIN,
      audience: "fan",
      items: [booking("ready-item", {
        bookingId: "booking-ready",
        joinUrl: "/scheduled-meeting/booking-ready",
        status: "confirmed",
        timeOnly: true,
      })],
      action: {
        id: "join-call",
        label: "JOIN CALL",
        bookingId: "booking-ready",
        url: "/scheduled-meeting/booking-ready",
      },
    };
    const wrapper = mount(EventNotificationStack, {
      props: {
        notices: [ready, {
          id: "fan-summary-ready",
          type: BOOKING_NOTICE_TYPES.SUMMARY,
          audience: "fan",
          viewer: { role: "fan", displayName: "Fan" },
          sections: [{
            type: BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED,
            label: "Confirmed",
            totalCount: 2,
            items: [booking("confirmed-one"), booking("confirmed-two")],
          }],
        }],
      },
    });

    expect(wrapper.findAllComponents(EventNotificationCard).map((card) => card.props("notice").id))
      .toEqual(["fan-ready", "fan-summary-ready"]);
    const join = wrapper.findAllComponents(EventNotificationCard)[0].get('[data-test="notice-primary-action"]');
    expect(join.text()).toBe("JOIN CALL");
    expect(join.classes()).toContain("booking-notice-action--ready");
    await join.trigger("click");
    expect(wrapper.emitted("primary-action")[0][0]).toMatchObject({
      noticeId: "fan-ready",
      action: {
        id: "join-call",
        bookingId: "booking-ready",
        url: "/scheduled-meeting/booking-ready",
      },
    });
    expect(wrapper.emitted("join")[0][0]).toMatchObject({ noticeId: "fan-ready" });
  });

  it("does not show Detail on a multi-item ready notice that has Join Call", () => {
    const wrapper = mount(EventNotificationCard, {
      props: {
        notice: {
          id: "ready-multiple",
          type: BOOKING_NOTICE_TYPES.READY_TO_JOIN,
          audience: "fan",
          items: [booking("ready-one"), booking("ready-two")],
          totalCount: 2,
          action: { id: "join-call", label: "JOIN CALL" },
          showDetail: true,
        },
      },
    });

    expect(wrapper.get('[data-test="notice-primary-action"]').text()).toBe("JOIN CALL");
    expect(wrapper.find('[data-test="notice-detail"]').exists()).toBe(false);
  });

  it("uses the original grouped request UI and dismisses every represented request", async () => {
    const dismissItemIds = ["activity-one", "activity-two", "activity-three"];
    const wrapper = mount(EventNotificationCard, {
      props: {
        notice: {
          id: "creator-multiple",
          type: BOOKING_NOTICE_TYPES.BOOKING_REQUEST,
          audience: "creator",
          items: [booking("one"), booking("two")],
          totalCount: 3,
          dismissItemIds,
          action: { id: "review-bookings", label: "REVIEW", showArrow: false },
        },
        config: { exitEffect: "none" },
      },
    });

    expect(wrapper.findAll('[data-test="notice-detail"]')).toHaveLength(2);
    expect(wrapper.findAll(".booking-notice-item-accent")).toHaveLength(2);
    expect(wrapper.find(".booking-notice-accent").exists()).toBe(false);
    expect(wrapper.get('[data-test="notice-primary-action"]').text()).toBe("REVIEW");
    expect(wrapper.get('[data-test="notice-primary-action"]').classes()).toContain("booking-notice-action--outline");
    expect(wrapper.find(".booking-notice-action-icon").exists()).toBe(true);
    expect(wrapper.find(".booking-notice-action-dot").exists()).toBe(true);

    await wrapper.get('[data-test="notice-close"]').trigger("click");
    expect(wrapper.emitted("close")[0][0]).toMatchObject({
      noticeId: "creator-multiple",
      dismissedItemIds: dismissItemIds,
    });
  });

  it("dismisses every summary item through close, timeout, or its main action", async () => {
    const summaryItems = Array.from({ length: 7 }, (_, index) => booking(`summary-${index + 1}`, {
      representedActivityIds: index === 0 ? ["represented-confirmation"] : [],
    }));
    const expectedDismissedIds = [
      "summary-1",
      "represented-confirmation",
      "summary-2",
      "summary-3",
      "summary-4",
      "summary-5",
      "summary-6",
      "summary-7",
    ];
    const notice = {
      id: "summary-1",
      type: BOOKING_NOTICE_TYPES.SUMMARY,
      viewer: { displayName: "Beaver Boy" },
      sections: [{
        type: BOOKING_NOTICE_TYPES.BOOKING_REQUEST,
        label: "Pending",
        totalCount: summaryItems.length,
        items: summaryItems,
      }],
      action: { id: "review", label: "REVIEW" },
    };
    const config = { exitEffect: "none", summary: { perSectionLimit: 3, totalLimit: 3 } };
    const closed = mount(EventNotificationCard, { props: { notice, config } });
    expect(closed.findAll(".booking-notice-item")).toHaveLength(3);
    expect(closed.get('[data-test="summary-overflow"]').text()).toBe("and 4 more");
    await closed.get('[data-test="notice-close"]').trigger("click");
    expect(closed.emitted("close")[0][0]).toMatchObject({
      noticeId: "summary-1",
      reason: "close",
      dismissedItemIds: expectedDismissedIds,
    });

    const acted = mount(EventNotificationCard, { props: { notice, config } });
    await acted.get('[data-test="notice-primary-action"]').trigger("click");
    expect(acted.emitted("primary-action")[0][0].dismissedItemIds).toEqual(expectedDismissedIds);
    expect(acted.find("article").exists()).toBe(false);

    const expanded = mount(EventNotificationCard, { props: { notice, config } });
    await expanded.get('[data-test="summary-overflow"]').trigger("click");
    await expanded.setProps({ additionalVisibleItems: 10 });
    expect(expanded.findAll(".booking-notice-item")).toHaveLength(7);
    await expanded.get('[data-test="notice-close"]').trigger("click");
    expect(expanded.emitted("close")[0][0].dismissedItemIds).toEqual(expectedDismissedIds);

    vi.useFakeTimers();
    const timed = mount(EventNotificationCard, {
      props: { notice, config: { ...config, durationSeconds: 1 } },
    });
    await vi.advanceTimersByTimeAsync(1_000);
    expect(timed.emitted("close")[0][0]).toMatchObject({
      reason: "automatic",
      dismissedItemIds: expectedDismissedIds,
    });
  });

  it("emits Join and primary-action for a ready-to-join notice", async () => {
    const wrapper = mount(EventNotificationCard, {
      props: {
        notice: {
          id: "ready-1",
          type: BOOKING_NOTICE_TYPES.READY_TO_JOIN,
          audience: "fan",
          items: [booking("booking-1", { timeOnly: true })],
          action: { id: "join", label: "JOIN CALL" },
        },
      },
    });

    await wrapper.get('[data-test="notice-primary-action"]').trigger("click");
    expect(wrapper.emitted("join")).toHaveLength(1);
    expect(wrapper.emitted("primary-action")).toHaveLength(1);
  });

  it("supports persistent and timed notices and pauses a timer during interaction", async () => {
    vi.useFakeTimers();
    const notice = { id: "timed-1", type: BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED, items: [booking("booking-1")] };
    const persistent = mount(EventNotificationCard, { props: { notice, config: { durationSeconds: 0 } } });
    await vi.advanceTimersByTimeAsync(20_000);
    expect(persistent.emitted("close")).toBeUndefined();

    const timed = mount(EventNotificationCard, { props: { notice, config: { durationSeconds: 2 } } });
    await vi.advanceTimersByTimeAsync(1_000);
    await timed.get("article").trigger("mouseenter");
    await vi.advanceTimersByTimeAsync(5_000);
    expect(timed.emitted("close")).toBeUndefined();
    await timed.get("article").trigger("mouseleave");
    await vi.advanceTimersByTimeAsync(1_000);
    expect(timed.emitted("close")[0][0].reason).toBe("automatic");
  });

  it("keeps Detail non-dismissing while preserving independent duration behavior", async () => {
    vi.useFakeTimers();
    const notice = {
      id: "detail-duration",
      type: BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED,
      audience: "fan",
      items: [booking("booking-detail-duration")],
      showDetail: true,
    };
    const persistent = mount(EventNotificationCard, {
      props: { notice, config: { durationSeconds: 0, exitEffect: "none" } },
    });
    await persistent.get('[data-test="notice-detail"]').trigger("click");
    await vi.advanceTimersByTimeAsync(20_000);
    expect(persistent.emitted("detail")).toHaveLength(1);
    expect(persistent.emitted("close")).toBeUndefined();
    expect(persistent.find("article").exists()).toBe(true);

    const timed = mount(EventNotificationCard, {
      props: { notice: { ...notice, id: "detail-duration-timed" }, config: { durationSeconds: 2, exitEffect: "none" } },
    });
    await vi.advanceTimersByTimeAsync(1_000);
    await timed.get('[data-test="notice-detail"]').trigger("click");
    expect(timed.emitted("close")).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1_000);
    expect(timed.emitted("detail")).toHaveLength(1);
    expect(timed.emitted("close")[0][0].reason).toBe("automatic");
  });

  it("waits for the configured initial delay before showing and starting its duration", async () => {
    vi.useFakeTimers();
    const notice = { id: "delayed", type: BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED, items: [booking("booking-1")] };
    const wrapper = mount(EventNotificationCard, { props: { notice, config: { initialDelaySeconds: 2, durationSeconds: 1, exitEffect: "none" } } });
    expect(wrapper.find("article").exists()).toBe(false);
    await vi.advanceTimersByTimeAsync(2_000);
    expect(wrapper.find("article").exists()).toBe(true);
    await vi.advanceTimersByTimeAsync(999);
    expect(wrapper.emitted("close")).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1);
    expect(wrapper.emitted("close")[0][0].reason).toBe("automatic");
  });
});

describe("EventNotificationStack", () => {
  it("applies an individual notice configuration without leaking it to sibling notices", () => {
    const notices = [
      {
        id: "lab-notice",
        type: BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED,
        config: { attentionAnimation: "blink", durationSeconds: 9 },
        items: [booking("lab-booking")],
      },
      {
        id: "real-notice",
        type: BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED,
        items: [booking("real-booking")],
      },
    ];
    const wrapper = mount(EventNotificationStack, {
      props: { notices, config: { attentionAnimation: "pulse", durationSeconds: 0 } },
    });
    const cards = wrapper.findAllComponents(EventNotificationCard);

    expect(cards[0].props("config")).toMatchObject({ attentionAnimation: "blink", durationSeconds: 9 });
    expect(cards[1].props("config")).toMatchObject({ attentionAnimation: "pulse", durationSeconds: 0 });
    expect(cards[0].classes()).not.toContain("booking-notice-attention-pulse");
    expect(cards[1].props("notice").config).toBeUndefined();
  });

  it("expands summaries by ten, updates the remaining count, and dismisses every expanded item", async () => {
    const pending = Array.from({ length: 13 }, (_, index) => booking(`pending-${index + 1}`));
    const confirmed = Array.from({ length: 13 }, (_, index) => booking(`confirmed-${index + 1}`, { status: "confirmed" }));
    const notices = [{
      id: "expandable-summary",
      type: BOOKING_NOTICE_TYPES.SUMMARY,
      sections: [
        { type: BOOKING_NOTICE_TYPES.BOOKING_REQUEST, label: "Pending", items: pending, totalCount: pending.length },
        { type: BOOKING_NOTICE_TYPES.EVENTS_TODAY, label: "Events today", priority: BOOKING_NOTICE_PRIORITIES.TODAY, items: confirmed, totalCount: confirmed.length },
      ],
    }];
    const wrapper = mount(EventNotificationStack, { props: { notices, config: { summary: { perSectionLimit: 3, totalLimit: 6 } } } });

    expect(wrapper.findAll(".booking-notice-item")).toHaveLength(6);
    expect(wrapper.emitted("summary-visibility").at(-1)[0].visibleItemIds).toHaveLength(6);
    expect(wrapper.get('[data-summary-section-variant="booking-request"]').text()).toBe("You have 13 new pending bookings:");
    expect(wrapper.get('[data-test="summary-overflow"]').text()).toBe("and 20 more");
    await wrapper.get('[data-test="summary-overflow"]').trigger("click");
    expect(wrapper.findAll(".booking-notice-item")).toHaveLength(16);
    expect(wrapper.emitted("summary-visibility").at(-1)[0].visibleItemIds).toHaveLength(16);
    expect(wrapper.get('[data-summary-section-variant="booking-request"]').text()).toBe("You have 13 new pending bookings:");
    expect(wrapper.get('[data-test="summary-overflow"]').text()).toBe("and 10 more");
    await wrapper.get('[data-test="summary-overflow"]').trigger("click");
    expect(wrapper.findAll(".booking-notice-item")).toHaveLength(26);
    expect(wrapper.find('[data-test="summary-overflow"]').exists()).toBe(false);

    await wrapper.get('[data-test="notice-close"]').trigger("click");
    expect(wrapper.emitted("close")[0][0].dismissedItemIds).toHaveLength(26);
  });

  it("expands grouped notices by ten and resets when a new stack is mounted", async () => {
    const items = Array.from({ length: 25 }, (_, index) => booking(`grouped-${index + 1}`));
    const notice = {
      id: "expandable-group",
      type: BOOKING_NOTICE_TYPES.BOOKING_REQUEST,
      audience: "creator",
      items,
      totalCount: items.length,
      itemLimit: 3,
    };
    const wrapper = mount(EventNotificationStack, { props: { notices: [notice] } });

    expect(wrapper.findAll(".booking-notice-item")).toHaveLength(3);
    expect(wrapper.get('[data-test="notice-overflow"]').text()).toBe("and 22 more");
    await wrapper.get('[data-test="notice-overflow"]').trigger("click");
    expect(wrapper.findAll(".booking-notice-item")).toHaveLength(13);
    expect(wrapper.get('[data-test="notice-overflow"]').text()).toBe("and 12 more");
    await wrapper.get('[data-test="notice-overflow"]').trigger("click");
    expect(wrapper.findAll(".booking-notice-item")).toHaveLength(23);
    expect(wrapper.get('[data-test="notice-overflow"]').text()).toBe("and 2 more");
    await wrapper.get('[data-test="notice-overflow"]').trigger("click");
    expect(wrapper.findAll(".booking-notice-item")).toHaveLength(25);
    expect(wrapper.find('[data-test="notice-overflow"]').exists()).toBe(false);

    wrapper.unmount();
    const reloaded = mount(EventNotificationStack, { props: { notices: [notice] } });
    expect(reloaded.findAll(".booking-notice-item")).toHaveLength(3);
  });

  it("suppresses standalone notices hidden by summary section and overall limits", () => {
    const summaryItem = booking("confirmed-visible");
    const confirmedHidden = booking("confirmed-hidden");
    const infoHidden = booking("info-hidden");
    const notices = [
      {
        id: "summary",
        type: BOOKING_NOTICE_TYPES.SUMMARY,
        sections: [
          { type: BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED, label: "Confirmed", items: [summaryItem, confirmedHidden, infoHidden] },
        ],
      },
      { id: "confirmed-visible", type: BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED, items: [summaryItem] },
      { id: "confirmed-hidden", type: BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED, items: [confirmedHidden] },
      { id: "info-hidden", type: BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED, items: [infoHidden] },
      { id: "outside-summary", type: BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED, items: [booking("outside-summary")] },
    ];

    const wrapper = mount(EventNotificationStack, {
      props: { notices, config: { maxVisibleNotices: 3, summary: { perSectionLimit: 1, totalLimit: 1 } } },
    });
    const renderedIds = wrapper.findAllComponents(EventNotificationCard).map((card) => card.props("notice").id);
    expect(renderedIds).toEqual(["summary", "outside-summary"]);
  });

  it("keeps a hidden urgent summary item suppressed before and after Show more", async () => {
    const adjustmentItems = Array.from({ length: 12 }, (_, index) => booking(`adjustment-${index + 1}`, {
      activityType: "price-adjustment-sent",
    }));
    const notices = [
      {
        id: "summary-expand-suppression",
        type: BOOKING_NOTICE_TYPES.SUMMARY,
        sections: [{
          type: BOOKING_NOTICE_TYPES.PRICE_ADJUSTMENT,
          variant: "request-sent",
          label: "Adjustments",
          items: adjustmentItems,
        }],
      },
      {
        id: "adjustment-8",
        type: BOOKING_NOTICE_TYPES.PRICE_ADJUSTMENT,
        priceAdjustmentState: "request-sent",
        items: [adjustmentItems[7]],
      },
    ];
    const wrapper = mount(EventNotificationStack, {
      props: { notices, config: { maxVisibleNotices: 3, summary: { perSectionLimit: 3, totalLimit: 3 } } },
    });

    expect(wrapper.findAllComponents(EventNotificationCard).map((card) => card.props("notice").id))
      .toEqual(["summary-expand-suppression"]);
    await wrapper.get('[data-test="summary-overflow"]').trigger("click");
    expect(wrapper.findAllComponents(EventNotificationCard).map((card) => card.props("notice").id))
      .toEqual(["summary-expand-suppression"]);
  });

  it("removes a dismissed card from the local queue while browser state catches up", async () => {
    vi.useFakeTimers();
    const notices = [1, 2, 3, 4].map((number) => ({
      id: `notice-${number}`,
      type: BOOKING_NOTICE_TYPES.BOOKING_CONFIRMED,
      items: [booking(`booking-${number}`)],
    }));
    const wrapper = mount(EventNotificationStack, { props: { notices, config: { maxVisibleNotices: 3 } } });
    await wrapper.findComponent(EventNotificationCard).get('[data-test="notice-close"]').trigger("click");
    const renderedIds = wrapper.findAllComponents(EventNotificationCard).map((card) => card.props("notice").id);
    expect(renderedIds).toEqual(["notice-2", "notice-3", "notice-4"]);
    expect(wrapper.emitted("close")[0][0]).toMatchObject({ noticeId: "notice-1", reason: "close" });
    wrapper.unmount();
  });
});
