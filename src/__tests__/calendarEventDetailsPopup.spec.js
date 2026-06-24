import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getBookingJoinState = vi.fn();

vi.mock("@/utils/bookingJoinUtils.js", () => ({
  getBookingJoinState,
}));

describe("CalendarEventDetailsPopup", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-01T09:30:00Z"));
    getBookingJoinState.mockReset();
    getBookingJoinState.mockReturnValue({
      canJoin: false,
      joinUrl: "https://example.com/scheduled-meeting/?booking_id=booking_123",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
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

    expect(getBookingJoinState).toHaveBeenCalledWith(expect.objectContaining({
      bookingId: "booking_123",
      status: "confirmed",
      enableCallReminderMinutesBefore: true,
      callReminderMinutesBefore: 15,
      extensions: [{ status: "captured", endAtIso: "2026-05-01T10:45:00Z" }],
    }));
  });

  it("keeps the join button visible but disabled until joining is allowed", async () => {
    const { default: CalendarEventDetailsPopup } = await import("@/components/calendar/CalendarEventDetailsPopup.vue");
    const joinAvailableLabel = new Date("2026-05-01T09:55:00.000Z").toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

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

    const joinButton = wrapper.findAll("button").find((button) => button.text().includes("Join call"));

    expect(joinButton).toBeTruthy();
    expect(joinButton.attributes("disabled")).toBeDefined();
    expect(joinButton.element.style.backgroundColor).toBe("rgb(208, 213, 221)");
    expect(joinButton.classes()).not.toContain("opacity-80");
    expect(wrapper.find("[data-test='disabled-join-tooltip']").exists()).toBe(false);

    await wrapper.get("[data-test='join-tooltip-trigger']").trigger("mouseenter");

    expect(wrapper.get("[data-test='disabled-join-tooltip']").text())
      .toBe(`This call can be joined at ${joinAvailableLabel}`);
    expect(wrapper.get("[data-test='disabled-join-tooltip']").classes().join(" "))
      .toContain("top-[calc(100%+0.375rem)]");

    await joinButton.trigger("click");

    expect(wrapper.emitted("join-call")).toBeUndefined();
  });

  it("emits join-call when joining is allowed", async () => {
    getBookingJoinState.mockReturnValue({
      canJoin: true,
      joinUrl: "https://example.com/scheduled-meeting/?booking_id=booking_123",
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

    const joinButton = wrapper.findAll("button").find((button) => button.text().includes("Join call"));

    expect(joinButton).toBeTruthy();
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

    const joinButton = wrapper.findAll("button").find((button) => button.text().includes("Join call"));
    expect(joinButton).toBeUndefined();
    expect(wrapper.find("[data-test='join-tooltip-trigger']").exists()).toBe(false);
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

  it("keeps the join button visible while an extension effective end time is still current", async () => {
    getBookingJoinState.mockReturnValue({
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

    const joinButton = wrapper.findAll("button").find((button) => button.text().includes("Join call"));
    expect(joinButton).toBeTruthy();
    expect(joinButton.attributes("disabled")).toBeDefined();
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
