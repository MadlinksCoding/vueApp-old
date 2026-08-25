import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import EventsWidget from "@/components/calendar/EventsWidget.vue";
import { bookingTranslationSymbol, createBookingTranslator } from "@/i18n/bookingTranslations.js";

let wrapper;

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("EventsWidget", () => {
  const menuItem = ({ status, start, end, pendingPriceAdjustment = false }) => ({
    title: `${status} booking`,
    sourceEvent: {
      bookingId: `booking_${status}`,
      status,
      start,
      end,
      raw: { pendingPriceAdjustment },
    },
  });

  it("shows the month and day on the left and the time below the title", () => {
    wrapper = mount(EventsWidget, {
      props: {
        sections: [{
          title: "TODAY",
          isPending: false,
          items: [{
            monthName: "AUGUST",
            dayName: "TUE",
            dayNumber: "25",
            time: "2:15pm-2:45pm",
            title: "Fan call",
            avatars: [],
          }],
        }],
      },
      global: { stubs: { TooltipIcon: true } },
    });

    expect(wrapper.get("[data-test='events-widget-month']").text()).toBe("AUGUST");
    expect(wrapper.get("[data-test='events-widget-day']").text()).toBe("25");
    expect(wrapper.get("[data-test='events-widget-time']").text()).toBe("2:15pm-2:45pm");
    expect(wrapper.get("[data-test='events-widget-time']").element.previousElementSibling?.textContent)
      .toContain("Fan call");
  });

  it("applies the role and lifecycle menu matrix", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-24T10:00:00Z"));
    const futureStart = "2026-08-24T11:00:00Z";
    const futureEnd = "2026-08-24T12:00:00Z";
    const pastEnd = "2026-08-24T09:59:59Z";
    const render = (item, userRole) => mount(EventsWidget, {
      props: { userRole, sections: [{ title: "BOOKINGS", items: [item] }] },
      global: { stubs: { TooltipIcon: true } },
    });

    wrapper = render(menuItem({ status: "pending", start: futureStart, end: futureEnd }), "creator");
    expect(wrapper.find("[data-test='events-widget-menu-trigger']").exists()).toBe(false);
    wrapper.unmount();

    wrapper = render(menuItem({ status: "confirmed", start: futureStart, end: futureEnd }), "creator");
    expect(wrapper.find("[data-test='events-widget-menu-trigger']").exists()).toBe(true);
    wrapper.unmount();

    wrapper = render(menuItem({ status: "confirmed", start: futureStart, end: pastEnd }), "creator");
    expect(wrapper.find("[data-test='events-widget-menu-trigger']").exists()).toBe(false);
    wrapper.unmount();

    wrapper = render(menuItem({ status: "pending_hold", start: futureStart, end: futureEnd }), "fan");
    expect(wrapper.find("[data-test='events-widget-menu-trigger']").exists()).toBe(true);
    wrapper.unmount();

    wrapper = render(menuItem({ status: "pending", start: "2026-08-24T10:00:00Z", end: futureEnd }), "fan");
    expect(wrapper.find("[data-test='events-widget-menu-trigger']").exists()).toBe(false);
    wrapper.unmount();

    wrapper = render(menuItem({ status: "pending", start: futureStart, end: futureEnd, pendingPriceAdjustment: true }), "fan");
    expect(wrapper.find("[data-test='events-widget-menu-trigger']").exists()).toBe(false);
    wrapper.unmount();

    wrapper = render(menuItem({ status: "cancelled_user", start: futureStart, end: futureEnd }), "fan");
    expect(wrapper.find("[data-test='events-widget-menu-trigger']").exists()).toBe(false);
  });

  it("closes and removes a fan pending menu at the exact start boundary", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-24T10:00:00Z"));
    const item = menuItem({
      status: "pending",
      start: "2026-08-24T10:00:01Z",
      end: "2026-08-24T10:30:00Z",
    });
    wrapper = mount(EventsWidget, {
      props: { userRole: "fan", sections: [{ title: "PENDING", items: [item] }] },
      global: { stubs: { TooltipIcon: true } },
    });

    await wrapper.get("[data-test='events-widget-menu-trigger']").trigger("click");
    expect(wrapper.find("[data-test='events-widget-menu']").exists()).toBe(true);
    await vi.advanceTimersByTimeAsync(1001);
    await flushPromises();
    expect(wrapper.find("[data-test='events-widget-menu-trigger']").exists()).toBe(false);
  });

  it("hides and closes the booking menu while its booked slot projects a pending price adjustment", async () => {
    const makeItem = (pendingPriceAdjustment) => ({
      title: "Adjusted booking",
      time: "10:00 AM",
      sourceEvent: {
        bookingId: "booking_adjust",
        raw: {
          pendingPriceAdjustment,
        },
      },
    });
    const sectionsFor = (item) => [{ title: "TODAY", items: [item], isPending: false }];

    wrapper = mount(EventsWidget, {
      props: { sections: sectionsFor(makeItem(false)) },
    });

    await wrapper.get("[data-test='events-widget-menu-trigger']").trigger("click");
    expect(wrapper.get("[data-test='events-widget-menu']").exists()).toBe(true);

    await wrapper.setProps({ sections: sectionsFor(makeItem(true)) });
    await flushPromises();
    expect(wrapper.find("[data-test='events-widget-menu-trigger']").exists()).toBe(false);

    await wrapper.setProps({ sections: sectionsFor(makeItem(false)) });
    await flushPromises();
    expect(wrapper.get("[data-test='events-widget-menu-trigger']").attributes("aria-expanded"))
      .toBe("false");
    expect(wrapper.find("[data-test='events-widget-menu']").exists()).toBe(false);
  });

  it("uses pending metadata independently of the translated section title", async () => {
    const item = {
      title: "Pending booking",
      time: "10:00 AM",
      statusText: "Pending",
      showReply: true,
      avatars: [{ src: "/avatar.png", name: "Fan" }],
      titleColorClass: "text-gray-900",
      borderClass: "bg-gray-300",
      bgClass: "bg-white",
    };

    wrapper = mount(EventsWidget, {
      props: {
        sections: [{ title: "SOLICITUDES PENDIENTES", items: [item], isPending: true }],
      },
      global: {
        stubs: { TooltipIcon: true },
      },
    });

    const pendingCard = wrapper.get("[data-test='events-widget-card']");
    expect(pendingCard.classes()).toContain("border-[1.5px]");
    await pendingCard.trigger("click");

    expect(wrapper.emitted("event-click")).toEqual([[item]]);
  });

  it.each(["pending", "pending_hold"])(
    "shows translated Review and Accept actions for creator %s items in any section",
    async (status) => {
      const sourceEvent = {
        bookingId: `booking_${status}`,
        eventId: `event_${status}`,
        status,
      };
      const item = {
        title: `${status} booking`,
        time: "10:00 AM",
        showReply: true,
        showJoin: true,
        canJoin: true,
        joinUrl: "https://example.com/join",
        avatars: [{ src: "/avatar.png", name: "Fan" }],
        sourceEvent,
      };

      wrapper = mount(EventsWidget, {
        props: {
          userRole: "creator",
          sections: [{ title: "PRÓXIMOS", items: [item], isPending: false }],
        },
        global: {
          provide: {
            [bookingTranslationSymbol]: createBookingTranslator({
              translations: {
                calendar_event_review: "REVISAR",
                calendar_event_accept: "ACEPTAR",
              },
            }),
          },
        },
      });

      expect(wrapper.get("[data-test='pending-booking-review']").text()).toBe("REVISAR");
      expect(wrapper.get("[data-test='pending-booking-accept']").text()).toBe("ACEPTAR");
      expect(wrapper.find("[data-test='join-tooltip-trigger']").exists()).toBe(false);

      await wrapper.get("[data-test='pending-booking-review']").trigger("click");
      expect(wrapper.emitted("event-click")).toEqual([[item]]);

      await wrapper.get("[data-test='pending-booking-accept']").trigger("click");
      expect(wrapper.emitted("accept-details")).toEqual([[
        {
          bookingId: `booking_${status}`,
          eventId: `event_${status}`,
          event: sourceEvent,
        },
      ]]);
      expect(wrapper.emitted("approve-booking")).toBeUndefined();
    },
  );

  it.each(["adjust", "reschedule", "more_time"])(
    "shows Review without Accept for a pending %s counteroffer",
    async (counterOfferType) => {
      const item = {
        title: "Counteroffer awaiting fan",
        time: "10:00 AM",
        showReply: true,
        avatars: [{ src: "/avatar.png", name: "Fan" }],
        sourceEvent: {
          bookingId: "b_evt_b8157ee2-084f-4b04-a3d4-a0927551974d_1787158789480_771492",
          eventId: "evt_b8157ee2-084f-4b04-a3d4-a0927551974d",
          status: "pending",
          raw: {
            pendingCounterOffer: true,
            pendingPriceAdjustment: counterOfferType === "adjust",
          },
        },
      };

      wrapper = mount(EventsWidget, {
        props: {
          userRole: "creator",
          sections: [{ title: "PENDING REQUESTS", items: [item], isPending: true }],
        },
        global: { stubs: { TooltipIcon: true } },
      });

      expect(wrapper.find("[data-test='pending-booking-review']").exists()).toBe(true);
      expect(wrapper.find("[data-test='pending-booking-accept']").exists()).toBe(false);

      await wrapper.get("[data-test='pending-booking-review']").trigger("click");
      expect(wrapper.emitted("event-click")).toEqual([[item]]);
      expect(wrapper.emitted("accept-details")).toBeUndefined();
    },
  );

  it("hides creator approval actions from fan viewers", () => {
    const item = {
      title: "Fan pending booking",
      showReply: true,
      sourceEvent: { bookingId: "booking_fan", status: "pending" },
    };

    wrapper = mount(EventsWidget, {
      props: {
        userRole: "fan",
        sections: [{ title: "PENDING", items: [item], isPending: true }],
      },
      global: {
        stubs: { TooltipIcon: true },
      },
    });

    expect(wrapper.find("[data-test='pending-booking-actions']").exists()).toBe(false);
  });

  it("hides join calls until the join window opens and reveals them reactively", async () => {
    const item = {
      title: "Upcoming booking",
      time: "10:00 AM",
      statusText: "confirmed",
      showJoin: true,
      canJoin: false,
      joinUrl: "https://example.com/join",
      avatars: [{ src: "/avatar.png", name: "Fan" }],
      titleColorClass: "text-gray-900",
      borderClass: "bg-gray-300",
      bgClass: "bg-white",
    };

    wrapper = mount(EventsWidget, {
      props: {
        sections: [{ title: "TODAY", items: [item] }],
      },
    });

    expect(wrapper.find("[data-test='events-widget-join-call']").exists()).toBe(false);
    expect(wrapper.get("[data-test='join-status-text']").text()).toBe("confirmed");

    const joinableItem = { ...item, canJoin: true, statusText: "in 5 mins" };
    await wrapper.setProps({
      sections: [{ title: "TODAY", items: [joinableItem] }],
    });

    const joinButton = wrapper.get("[data-test='events-widget-join-call']");
    expect(joinButton.attributes("disabled")).toBeUndefined();
    expect(wrapper.get("[data-test='join-status-text']").text()).toBe("in 5 mins");

    await joinButton.trigger("click");
    expect(wrapper.emitted("join-click")).toEqual([[joinableItem]]);
  });

  it("emits join calls when the join window is open", async () => {
    const item = {
      title: "Live booking",
      time: "10:00 AM",
      statusText: "confirmed",
      showJoin: true,
      canJoin: true,
      joinUrl: "https://example.com/join",
      avatars: [{ src: "/avatar.png", name: "Fan" }],
      titleColorClass: "text-gray-900",
      borderClass: "bg-gray-300",
      bgClass: "bg-white",
    };

    wrapper = mount(EventsWidget, {
      props: {
        sections: [{ title: "TODAY", items: [item] }],
      },
    });

    const joinButton = wrapper.get("[data-test='events-widget-join-call']");
    expect(joinButton.attributes("disabled")).toBeUndefined();
    expect(wrapper.find("[data-test='pending-booking-actions']").exists()).toBe(false);

    await joinButton.trigger("click");

    expect(wrapper.emitted("join-click")).toEqual([[item]]);
  });

  it("does not show Join without a valid join URL", () => {
    const item = {
      title: "Booking without a URL",
      statusText: "confirmed",
      showJoin: true,
      canJoin: true,
      joinUrl: "",
    };

    wrapper = mount(EventsWidget, {
      props: {
        sections: [{ title: "TODAY", items: [item] }],
      },
    });

    expect(wrapper.find("[data-test='events-widget-join-call']").exists()).toBe(false);
    expect(wrapper.get("[data-test='join-status-text']").text()).toBe("confirmed");
  });

  it("uses the status color for the urgent join status dot and text", () => {
    const item = {
      title: "Starting soon",
      time: "10:00 AM",
      statusText: "in 4 mins",
      statusColor: "#28C76F",
      showJoin: true,
      canJoin: true,
      joinUrl: "https://example.com/join",
      avatars: [{ src: "/avatar.png", name: "Fan" }],
      titleColorClass: "text-gray-900",
      borderClass: "bg-gray-300",
      bgClass: "bg-white",
    };

    wrapper = mount(EventsWidget, {
      props: {
        sections: [{ title: "TODAY", items: [item] }],
      },
    });

    expect(wrapper.get("[data-test='join-status-dot']").element.style.backgroundColor)
      .toBe("rgb(40, 199, 111)");
    expect(wrapper.get("[data-test='join-status-text']").element.style.color)
      .toBe("rgb(40, 199, 111)");
    expect(wrapper.get("[data-test='join-status-text']").text()).toBe("in 4 mins");
  });

  it("uses popup green for confirmed and live status dots", () => {
    const items = [
      {
        title: "Confirmed booking",
        time: "10:00 AM",
        statusText: "confirmed",
        showJoin: true,
        canJoin: false,
        joinUrl: "https://example.com/join",
        avatars: [{ src: "/avatar.png", name: "Fan" }],
        titleColorClass: "text-gray-900",
        borderClass: "bg-gray-300",
        bgClass: "bg-white",
      },
      {
        title: "Live booking",
        time: "10:00 AM",
        statusText: "live now",
        showJoin: true,
        canJoin: true,
        joinUrl: "https://example.com/join",
        avatars: [{ src: "/avatar.png", name: "Fan" }],
        titleColorClass: "text-gray-900",
        borderClass: "bg-gray-300",
        bgClass: "bg-white",
      },
    ];

    wrapper = mount(EventsWidget, {
      props: {
        sections: [{ title: "TODAY", items }],
      },
    });

    const dotColors = wrapper
      .findAll("[data-test='join-status-dot']")
      .map((dot) => dot.element.style.backgroundColor);

    expect(dotColors).toEqual(["rgb(7, 244, 104)", "rgb(7, 244, 104)"]);
  });

  it("fetches and displays fan profile data for creator viewers with a loading skeleton", async () => {
    let resolveFetch;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    const fetchMock = vi.fn(() => fetchPromise);
    vi.stubGlobal("fetch", fetchMock);

    const item = {
      title: "Creator view booking",
      time: "10:00 AM",
      statusText: "confirmed",
      avatars: [{ src: "/creator-avatar.png", name: "Creator Name" }],
      titleColorClass: "text-gray-900",
      borderClass: "bg-gray-300",
      bgClass: "bg-white",
      sourceEvent: {
        raw: {
          userId: 1407,
          userDisplayName: "Fallback Fan",
          userAvatarUrl: "/fallback-fan.png",
          creatorId: 2615,
          creatorDisplayName: "Creator Name",
        },
      },
    };

    wrapper = mount(EventsWidget, {
      props: {
        userRole: "creator",
        sections: [{ title: "TODAY", items: [item] }],
      },
    });

    expect(wrapper.find("[data-test='event-profile-skeleton']").exists()).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestedUrl = new URL(String(fetchMock.mock.calls[0][0]), "http://localhost");
    expect(requestedUrl.pathname).toBe("/wp-json/api/users/get-profile-data");
    expect(requestedUrl.searchParams.get("id")).toBe("1407");

    resolveFetch({
      ok: true,
      json: vi.fn().mockResolvedValue({
        user: {
          display_name: "Fetched Fan",
          username: "fan_user",
          avatar: "https://example.com/fan.png",
        },
      }),
    });
    await flushPromises();

    expect(wrapper.find("[data-test='event-profile-skeleton']").exists()).toBe(false);
    expect(wrapper.get("[data-test='event-profile-name']").text()).toBe("Fetched Fan");
    expect(wrapper.get("[data-test='event-profile-avatar']").attributes("src")).toBe("https://example.com/fan.png");
  });

  it("fetches and displays creator profile data for fan viewers", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        user: {
          display_name: "Fetched Creator",
          username: "creator_user",
          avatar: "https://example.com/creator.png",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const item = {
      title: "Fan view booking",
      time: "10:00 AM",
      statusText: "confirmed",
      avatars: [{ src: "/creator-avatar.png", name: "Creator Name" }],
      titleColorClass: "text-gray-900",
      borderClass: "bg-gray-300",
      bgClass: "bg-white",
      sourceEvent: {
        raw: {
          userId: 1407,
          userDisplayName: "Fan Name",
          creatorId: 2615,
          creatorDisplayName: "Fallback Creator",
          creatorAvatarUrl: "/fallback-creator.png",
        },
      },
    };

    wrapper = mount(EventsWidget, {
      props: {
        userRole: "fan",
        sections: [{ title: "TODAY", items: [item] }],
      },
    });
    await flushPromises();

    const requestedUrl = new URL(String(fetchMock.mock.calls[0][0]), "http://localhost");
    expect(requestedUrl.searchParams.get("id")).toBe("2615");
    expect(wrapper.get("[data-test='event-profile-name']").text()).toBe("Fetched Creator");
    expect(wrapper.get("[data-test='event-profile-avatar']").attributes("src")).toBe("https://example.com/creator.png");
  });
});
