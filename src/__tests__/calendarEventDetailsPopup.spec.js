import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const getBookingJoinState = vi.fn();

vi.mock("@/utils/bookingJoinUtils.js", () => ({
  getBookingJoinState,
}));

describe("CalendarEventDetailsPopup", () => {
  beforeEach(() => {
    getBookingJoinState.mockReset();
    getBookingJoinState.mockReturnValue({
      canJoin: false,
      joinUrl: "https://example.com/scheduled-meeting/?booking_id=booking_123",
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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
