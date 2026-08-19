import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getCalendarEventJoinState = vi.fn();

vi.mock("@/utils/bookingJoinUtils.js", async (importOriginal) => ({
  ...(await importOriginal()),
  getCalendarEventJoinState,
}));

describe("CalendarEventDetailsPopup", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T09:30:00Z"));
    getCalendarEventJoinState.mockReset();
    getCalendarEventJoinState.mockReturnValue({
      canJoin: false,
      joinUrl: "https://example.com/scheduled-meeting/?booking_id=booking_123",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("fills a side panel and exposes the close control on desktop without refetching supplied booking data", async () => {
    const { default: CalendarEventDetailsPopup } = await import("@/components/calendar/CalendarEventDetailsPopup.vue");
    const booking = {
      bookingId: "booking_123",
      status: "confirmed",
      startAtIso: "2026-05-01T10:00:00Z",
      endAtIso: "2026-05-01T10:30:00Z",
    };
    const wrapper = mount(CalendarEventDetailsPopup, {
      props: {
        presentation: "side-panel",
        booking,
        event: {
          bookingId: "booking_123",
          start: booking.startAtIso,
          end: booking.endAtIso,
          status: booking.status,
          raw: booking,
        },
      },
    });

    expect(wrapper.attributes("data-presentation")).toBe("side-panel");
    expect(wrapper.classes()).toContain("h-full");
    const close = wrapper.get("[data-popup-close]");
    expect(close.classes()).toContain("block");
    await close.trigger("click");
    expect(wrapper.emitted("close")).toHaveLength(1);
  });

  it("hides an open booking menu only while a changed-price Adjust negotiation is sent", async () => {
    const { default: CalendarEventDetailsPopup } = await import("@/components/calendar/CalendarEventDetailsPopup.vue");
    const makeBooking = (status, proposedTokens) => ({
      bookingId: "booking_123",
      status: "pending",
      startAtIso: "2026-05-01T10:00:00Z",
      endAtIso: "2026-05-01T10:30:00Z",
      meta: {
        currentCounterOffer: "adjust",
        negotiation: {
          type: "adjust",
          status,
          original: { totalTokens: 100 },
          proposed: { totalTokens: proposedTokens },
        },
      },
    });
    const unchangedBooking = makeBooking("sent", 100);
    const wrapper = mount(CalendarEventDetailsPopup, {
      props: {
        booking: unchangedBooking,
        event: {
          bookingId: "booking_123",
          start: unchangedBooking.startAtIso,
          end: unchangedBooking.endAtIso,
          raw: unchangedBooking,
        },
      },
    });

    const trigger = wrapper.get("[data-test='calendar-event-details-menu-trigger']");
    await trigger.trigger("click");
    expect(trigger.attributes("aria-expanded")).toBe("true");

    const pendingBooking = makeBooking("sent", 125);
    await wrapper.setProps({ booking: pendingBooking });
    await flushPromises();
    expect(wrapper.find("[data-test='calendar-event-details-menu-trigger']").exists()).toBe(false);

    await wrapper.setProps({ booking: makeBooking("accepted", 125) });
    await flushPromises();
    expect(wrapper.get("[data-test='calendar-event-details-menu-trigger']").attributes("aria-expanded"))
      .toBe("false");
  });

  it("passes reminder and extension data to the join state helper", async () => {
    const { default: CalendarEventDetailsPopup } = await import("@/components/calendar/CalendarEventDetailsPopup.vue");

    mount(CalendarEventDetailsPopup, {
      props: {
        event: {
          bookingId: "booking_123",
          start: "2026-05-01T10:00:00Z",
          end: "2026-05-01T10:30:00Z",
          status: "confirmed",
          raw: {
            bookingId: "booking_123",
            status: "confirmed",
            eventSnapshot: {
              enableCallReminderMinutesBefore: true,
              callReminderMinutesBefore: 15,
            },
            extensions: [
              { status: "captured", endAtIso: "2026-05-01T10:45:00Z" },
            ],
          },
        },
      },
    });

    expect(getCalendarEventJoinState).toHaveBeenCalledWith(
      expect.objectContaining({ bookingId: "booking_123" }),
      expect.objectContaining({ viewerRole: "creator", now: expect.any(Date) }),
    );
  });

  it("hides join buttons before the window, keeps the menu, and reveals Join reactively", async () => {
    vi.setSystemTime(new Date("2026-05-01T09:54:59Z"));
    getCalendarEventJoinState.mockImplementation((event, { now }) => ({
      canJoin: now.getTime() >= Date.parse("2026-05-01T09:55:00Z"),
      joinUrl: "https://example.com/scheduled-meeting/?booking_id=booking_123",
      bookingId: event.bookingId || event.raw?.bookingId,
      eventId: event.eventId || event.raw?.eventId,
    }));
    const { default: CalendarEventDetailsPopup } = await import("@/components/calendar/CalendarEventDetailsPopup.vue");

    const wrapper = mount(CalendarEventDetailsPopup, {
      props: {
        event: {
          bookingId: "booking_123",
          start: "2026-05-01T10:00:00Z",
          end: "2026-05-01T10:30:00Z",
          status: "confirmed",
          raw: {
            bookingId: "booking_123",
            status: "confirmed",
          },
        },
      },
    });

    expect(wrapper.find("[data-test='calendar-event-details-desktop-join-call']").exists()).toBe(false);
    expect(wrapper.find("[data-test='calendar-event-details-mobile-join-call']").exists()).toBe(false);
    expect(wrapper.get("[data-test='calendar-event-details-menu-trigger']").exists()).toBe(true);

    await vi.advanceTimersByTimeAsync(999);
    await flushPromises();
    expect(wrapper.find("[data-test='calendar-event-details-desktop-join-call']").exists()).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    await flushPromises();

    const desktopJoin = wrapper.get("[data-test='calendar-event-details-desktop-join-call']");
    const mobileJoin = wrapper.get("[data-test='calendar-event-details-mobile-join-call']");
    expect(desktopJoin.attributes("disabled")).toBeUndefined();
    expect(mobileJoin.attributes("disabled")).toBeUndefined();

    await desktopJoin.trigger("click");
    expect(wrapper.emitted("join-call")).toEqual([[
      expect.objectContaining({ bookingId: "booking_123" }),
    ]]);
  });

  it("uses an injected comparison time without starting an independent popup clock", async () => {
    vi.setSystemTime(new Date("2026-05-01T09:54:59Z"));
    getCalendarEventJoinState.mockImplementation((event, { now }) => ({
      canJoin: now.getTime() >= Date.parse("2026-05-01T09:55:00Z"),
      joinUrl: "https://example.com/scheduled-meeting/?booking_id=booking_123",
      bookingId: event.bookingId,
    }));
    const { default: CalendarEventDetailsPopup } = await import("@/components/calendar/CalendarEventDetailsPopup.vue");
    const wrapper = mount(CalendarEventDetailsPopup, {
      props: {
        comparisonTime: new Date("2026-05-01T09:54:59Z"),
        event: {
          bookingId: "booking_123",
          start: "2026-05-01T10:00:00Z",
          end: "2026-05-01T10:30:00Z",
          status: "confirmed",
        },
      },
    });

    expect(wrapper.find("[data-test='calendar-event-details-desktop-join-call']").exists()).toBe(false);

    vi.setSystemTime(new Date("2026-05-01T09:55:30Z"));
    await vi.advanceTimersByTimeAsync(60 * 1000);
    await flushPromises();
    expect(wrapper.find("[data-test='calendar-event-details-desktop-join-call']").exists()).toBe(false);

    await wrapper.setProps({ comparisonTime: new Date("2026-05-01T09:55:00Z") });
    await flushPromises();
    expect(wrapper.find("[data-test='calendar-event-details-desktop-join-call']").exists()).toBe(true);
  });

  it("emits join-call when joining is allowed", async () => {
    getCalendarEventJoinState.mockReturnValue({
      canJoin: true,
      joinUrl: "https://example.com/scheduled-meeting/?booking_id=booking_123",
      bookingId: "booking_123",
      eventId: "evt_123",
    });

    const { default: CalendarEventDetailsPopup } = await import("@/components/calendar/CalendarEventDetailsPopup.vue");

    const wrapper = mount(CalendarEventDetailsPopup, {
      props: {
        event: {
          bookingId: "booking_123",
          eventId: "evt_123",
          start: "2026-05-01T10:00:00Z",
          end: "2026-05-01T10:30:00Z",
          status: "confirmed",
          raw: {
            bookingId: "booking_123",
            eventId: "evt_123",
            status: "confirmed",
          },
        },
      },
    });

    const joinButton = wrapper.get("[data-test='calendar-event-details-desktop-join-call']");
    expect(joinButton.attributes("disabled")).toBeUndefined();

    await joinButton.trigger("click");

    expect(wrapper.emitted("join-call")).toEqual([[
      expect.objectContaining({
        bookingId: "booking_123",
        eventId: "evt_123",
        joinUrl: "https://example.com/scheduled-meeting/?booking_id=booking_123",
      }),
    ]]);
  });

  it("does not show Join when the booking has no valid join URL", async () => {
    getCalendarEventJoinState.mockReturnValue({
      canJoin: true,
      joinUrl: null,
      bookingId: "booking_without_url",
    });
    const { default: CalendarEventDetailsPopup } = await import("@/components/calendar/CalendarEventDetailsPopup.vue");

    const wrapper = mount(CalendarEventDetailsPopup, {
      props: {
        event: {
          bookingId: "booking_without_url",
          start: "2026-05-01T10:00:00Z",
          end: "2026-05-01T10:30:00Z",
          status: "confirmed",
          raw: {
            bookingId: "booking_without_url",
            status: "confirmed",
          },
        },
      },
    });

    expect(wrapper.find("[data-test='calendar-event-details-desktop-join-call']").exists()).toBe(false);
    expect(wrapper.find("[data-test='calendar-event-details-mobile-join-call']").exists()).toBe(false);
    expect(wrapper.get("[data-test='calendar-event-details-menu-trigger']").exists()).toBe(true);
  });

  it("hides the join button after the call end time has passed", async () => {
    const { default: CalendarEventDetailsPopup } = await import("@/components/calendar/CalendarEventDetailsPopup.vue");

    const wrapper = mount(CalendarEventDetailsPopup, {
      props: {
        event: {
          bookingId: "booking_ended",
          start: "2026-05-01T08:00:00Z",
          end: "2026-05-01T09:00:00Z",
          status: "confirmed",
          raw: {
            bookingId: "booking_ended",
            status: "confirmed",
          },
        },
      },
    });

    expect(wrapper.find("[data-test='calendar-event-details-desktop-join-call']").exists()).toBe(false);
    expect(wrapper.find("[data-test='calendar-event-details-mobile-join-call']").exists()).toBe(false);
    expect(wrapper.find("[data-test='calendar-event-details-menu-trigger']").exists()).toBe(false);
    expect(wrapper.get("[data-test='status-hint']").text()).toBe("Past booking");
    expect(wrapper.get("[data-test='status-dot']").element.style.backgroundColor)
      .toBe("rgb(107, 114, 128)");
  });

  it("shows past booking for past pending bookings", async () => {
    const { default: CalendarEventDetailsPopup } = await import("@/components/calendar/CalendarEventDetailsPopup.vue");

    const wrapper = mount(CalendarEventDetailsPopup, {
      props: {
        event: {
          bookingId: "booking_pending_past",
          start: "2026-05-01T08:00:00Z",
          end: "2026-05-01T09:00:00Z",
          status: "pending",
          raw: {
            bookingId: "booking_pending_past",
            status: "pending",
          },
        },
        canReviewPending: true,
      },
    });

    expect(wrapper.get("[data-test='status-hint']").text()).toBe("Past booking");
    expect(wrapper.get("[data-test='status-dot']").element.style.backgroundColor)
      .toBe("rgb(107, 114, 128)");
    expect(wrapper.findAll("button").some((button) => button.text().includes("ACCEPT"))).toBe(false);
    expect(wrapper.findAll("button").some((button) => button.text().includes("DECLINE"))).toBe(false);
  });

  it.each(["pending", "pending_hold"])(
    "expires %s approval controls at the exact booking start",
    async (status) => {
      vi.setSystemTime(new Date("2026-05-01T09:59:59Z"));
      const { default: CalendarEventDetailsPopup } = await import("@/components/calendar/CalendarEventDetailsPopup.vue");
      const wrapper = mount(CalendarEventDetailsPopup, {
        props: {
          comparisonTime: new Date("2026-05-01T09:59:59Z"),
          event: {
            bookingId: `booking_${status}`,
            start: "2026-05-01T10:00:00Z",
            end: "2026-05-01T10:30:00Z",
            status,
            eventType: status === "pending" ? "1on1-call" : "group-event",
            raw: { status },
          },
          canReviewPending: true,
        },
      });
      await flushPromises();

      expect(wrapper.find("[data-test='calendar-event-details-accept']").exists()).toBe(true);
      expect(wrapper.find("[data-test='calendar-event-details-decline']").exists()).toBe(true);
      expect(wrapper.get("[data-test='status-hint']").text()).not.toBe("Past booking");
      expect(wrapper.get("[data-test='status-hint']").text()).not.toBe("live now");

      await wrapper.get("[data-test='calendar-event-details-decline']").trigger("click");
      expect(wrapper.find("[data-test='calendar-event-details-reject-confirm']").exists()).toBe(true);

      await wrapper.setProps({ comparisonTime: new Date("2026-05-01T10:00:00Z") });
      await flushPromises();

      expect(wrapper.find("[data-test='calendar-event-details-accept']").exists()).toBe(false);
      expect(wrapper.find("[data-test='calendar-event-details-decline']").exists()).toBe(false);
      expect(wrapper.find("[data-test='calendar-event-details-adjust-request']").exists()).toBe(false);
      expect(wrapper.find("[data-test='calendar-event-details-reject-confirm']").exists()).toBe(false);
      expect(wrapper.get("[data-test='status-hint']").text()).toBe("Past booking");
      expect(wrapper.get("[data-test='status-dot']").element.style.backgroundColor)
        .toBe("rgb(107, 114, 128)");

      await wrapper.setProps({ comparisonTime: new Date("2026-05-01T10:15:00Z") });
      await flushPromises();
      expect(wrapper.get("[data-test='status-hint']").text()).toBe("Past booking");

      await wrapper.setProps({ comparisonTime: new Date("2026-05-01T10:30:01Z") });
      await flushPromises();
      expect(wrapper.get("[data-test='status-hint']").text()).toBe("Past booking");
    },
  );

  it("rejects an approval click when the wall clock has crossed the start boundary", async () => {
    vi.setSystemTime(new Date("2026-05-01T09:59:59Z"));
    const { default: CalendarEventDetailsPopup } = await import("@/components/calendar/CalendarEventDetailsPopup.vue");
    const wrapper = mount(CalendarEventDetailsPopup, {
      props: {
        comparisonTime: new Date("2026-05-01T09:59:59Z"),
        event: {
          bookingId: "booking_stale_approval",
          start: "2026-05-01T10:00:00Z",
          end: "2026-05-01T10:30:00Z",
          status: "pending",
          raw: { status: "pending" },
        },
        canReviewPending: true,
      },
    });
    await flushPromises();

    const acceptButton = wrapper.get("[data-test='calendar-event-details-accept']");
    vi.setSystemTime(new Date("2026-05-01T10:00:00Z"));
    await acceptButton.trigger("click");

    expect(wrapper.emitted("approve-booking")).toBeUndefined();
  });

  it("shows confirmed instead of a full date for future confirmed bookings more than 24 hours away", async () => {
    const { default: CalendarEventDetailsPopup } = await import("@/components/calendar/CalendarEventDetailsPopup.vue");

    const wrapper = mount(CalendarEventDetailsPopup, {
      props: {
        event: {
          bookingId: "booking_future_confirmed",
          start: "2026-05-03T10:00:00Z",
          end: "2026-05-03T10:30:00Z",
          status: "confirmed",
          raw: {
            bookingId: "booking_future_confirmed",
            status: "confirmed",
          },
        },
      },
    });

    expect(wrapper.get("[data-test='status-hint']").text()).toBe("Confirmed");
  });

  it("shows pending instead of a full date for future pending bookings more than 24 hours away", async () => {
    const { default: CalendarEventDetailsPopup } = await import("@/components/calendar/CalendarEventDetailsPopup.vue");

    const wrapper = mount(CalendarEventDetailsPopup, {
      props: {
        event: {
          bookingId: "booking_future_pending",
          start: "2026-05-03T10:00:00Z",
          end: "2026-05-03T10:30:00Z",
          status: "pending",
          raw: {
            bookingId: "booking_future_pending",
            status: "pending",
          },
        },
      },
    });

    expect(wrapper.get("[data-test='status-hint']").text()).toBe("Pending");
  });

  it("keeps live status and booking actions during an extension without showing an ineligible Join", async () => {
    getCalendarEventJoinState.mockReturnValue({
      canJoin: false,
      joinUrl: "https://example.com/scheduled-meeting/?booking_id=booking_extended",
      effectiveEndDate: new Date("2026-05-01T10:00:00Z"),
    });

    const { default: CalendarEventDetailsPopup } = await import("@/components/calendar/CalendarEventDetailsPopup.vue");

    const wrapper = mount(CalendarEventDetailsPopup, {
      props: {
        event: {
          bookingId: "booking_extended",
          start: "2026-05-01T08:00:00Z",
          end: "2026-05-01T09:00:00Z",
          status: "confirmed",
          raw: {
            bookingId: "booking_extended",
            status: "confirmed",
            extensions: [
              { status: "captured", endAtIso: "2026-05-01T10:00:00Z" },
            ],
          },
        },
      },
    });

    expect(wrapper.find("[data-test='calendar-event-details-desktop-join-call']").exists()).toBe(false);
    expect(wrapper.find("[data-test='calendar-event-details-mobile-join-call']").exists()).toBe(false);
    expect(wrapper.get("[data-test='calendar-event-details-menu-trigger']").exists()).toBe(true);
    expect(wrapper.get("[data-test='status-hint']").text()).toBe("live now");
    expect(wrapper.get("[data-test='status-dot']").element.style.backgroundColor)
      .toBe("rgb(34, 197, 94)");
  });

  it("uses the fan user id by default while loading and then renders the fetched guest profile", async () => {
    const { default: CalendarEventDetailsPopup } = await import("@/components/calendar/CalendarEventDetailsPopup.vue");
    let resolveFetch;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    const fetchMock = vi.fn(() => fetchPromise);
    vi.stubGlobal("fetch", fetchMock);

    const wrapper = mount(CalendarEventDetailsPopup, {
      props: {
        userRole: "creator",
        event: {
          bookingId: "booking_1407",
          start: "2026-05-01T10:00:00Z",
          end: "2026-05-01T10:30:00Z",
          status: "confirmed",
          raw: {
            bookingId: "booking_1407",
            status: "confirmed",
            userId: 1407,
          },
        },
      },
    });

    expect(wrapper.find('[data-testid="guest-profile-skeleton"]').exists()).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestedUrl = new URL(String(fetchMock.mock.calls[0][0]), "http://localhost");
    expect(requestedUrl.pathname).toBe("/wp-json/api/users/get-profile-data");
    expect(requestedUrl.searchParams.get("id")).toBe("1407");

    resolveFetch({
      ok: true,
      json: vi.fn().mockResolvedValue({
        status: "success",
        user: {
          id: "1407",
          username: "cosmaniacreator",
          display_name: "CosManiaa Creator",
          avatar: "https://example.com/avatar.jpg",
        },
      }),
    });
    await flushPromises();

    expect(wrapper.find('[data-testid="guest-profile-skeleton"]').exists()).toBe(false);
    expect(wrapper.text()).toContain("CosManiaa Creator");
    expect(wrapper.text()).toContain("cosmaniacreator");
    expect(wrapper.find('[data-testid="guest-profile"] img').attributes("src")).toBe("https://example.com/avatar.jpg");
  });

  it("uses the creator id for the profile request when the current user is a fan", async () => {
    const { default: CalendarEventDetailsPopup } = await import("@/components/calendar/CalendarEventDetailsPopup.vue");
    let resolveFetch;
    const fetchPromise = new Promise((resolve) => {
      resolveFetch = resolve;
    });
    const fetchMock = vi.fn(() => fetchPromise);
    vi.stubGlobal("fetch", fetchMock);

    const wrapper = mount(CalendarEventDetailsPopup, {
      props: {
        userRole: "fan",
        event: {
          bookingId: "booking_creator_profile",
          start: "2026-05-01T10:00:00Z",
          end: "2026-05-01T10:30:00Z",
          status: "confirmed",
          raw: {
            bookingId: "booking_creator_profile",
            status: "confirmed",
            userId: 1407,
            creatorId: 2615,
          },
        },
      },
    });

    expect(wrapper.find('[data-testid="guest-profile-skeleton"]').exists()).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const requestedUrl = new URL(String(fetchMock.mock.calls[0][0]), "http://localhost");
    expect(requestedUrl.pathname).toBe("/wp-json/api/users/get-profile-data");
    expect(requestedUrl.searchParams.get("id")).toBe("2615");

    resolveFetch({
      ok: true,
      json: vi.fn().mockResolvedValue({
        status: "success",
        user: {
          id: "2615",
          username: "creator_user",
          display_name: "Creator User",
          avatar: "https://example.com/creator.jpg",
        },
      }),
    });
    await flushPromises();

    expect(wrapper.find('[data-testid="guest-profile-skeleton"]').exists()).toBe(false);
    expect(wrapper.text()).toContain("Creator User");
    expect(wrapper.text()).toContain("creator_user");
    expect(wrapper.find('[data-testid="guest-profile"] img').attributes("src")).toBe("https://example.com/creator.jpg");
  });

  it("falls back to raw guest data when profile fetching fails", async () => {
    const { default: CalendarEventDetailsPopup } = await import("@/components/calendar/CalendarEventDetailsPopup.vue");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn(),
    });
    vi.stubGlobal("fetch", fetchMock);

    const wrapper = mount(CalendarEventDetailsPopup, {
      props: {
        event: {
          bookingId: "booking_fallback",
          start: "2026-05-01T10:00:00Z",
          end: "2026-05-01T10:30:00Z",
          status: "confirmed",
          raw: {
            bookingId: "booking_fallback",
            status: "confirmed",
            userId: 1407,
            userDisplayName: "Snapshot Name",
            userUsername: "snapshot_user",
            userAvatarUrl: "https://example.com/snapshot.jpg",
          },
        },
      },
    });

    expect(wrapper.find('[data-testid="guest-profile-skeleton"]').exists()).toBe(true);
    await flushPromises();

    expect(wrapper.find('[data-testid="guest-profile-skeleton"]').exists()).toBe(false);
    expect(wrapper.text()).toContain("Snapshot Name");
    expect(wrapper.text()).toContain("snapshot_user");
    expect(wrapper.find('[data-testid="guest-profile"] img').attributes("src")).toBe("https://example.com/snapshot.jpg");
  });

  it("falls back to raw creator data for fan viewers when profile fetching fails", async () => {
    const { default: CalendarEventDetailsPopup } = await import("@/components/calendar/CalendarEventDetailsPopup.vue");
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: vi.fn(),
    });
    vi.stubGlobal("fetch", fetchMock);

    const wrapper = mount(CalendarEventDetailsPopup, {
      props: {
        userRole: "fan",
        event: {
          bookingId: "booking_creator_fallback",
          start: "2026-05-01T10:00:00Z",
          end: "2026-05-01T10:30:00Z",
          status: "confirmed",
          raw: {
            bookingId: "booking_creator_fallback",
            status: "confirmed",
            userId: 1407,
            creatorId: 2615,
            creatorDisplayName: "Snapshot Creator",
            creatorUsername: "snapshot_creator",
            creatorAvatarUrl: "https://example.com/creator-snapshot.jpg",
          },
        },
      },
    });

    expect(wrapper.find('[data-testid="guest-profile-skeleton"]').exists()).toBe(true);
    await flushPromises();

    expect(wrapper.find('[data-testid="guest-profile-skeleton"]').exists()).toBe(false);
    expect(wrapper.text()).toContain("Snapshot Creator");
    expect(wrapper.text()).toContain("snapshot_creator");
    expect(wrapper.find('[data-testid="guest-profile"] img').attributes("src")).toBe("https://example.com/creator-snapshot.jpg");
  });
});
