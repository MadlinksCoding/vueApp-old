import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildEventXPostSettingsPayload,
  fetchEventXPostSettings,
  mergeEventXPostSettingsIntoFormState,
  resolveWordPressUid,
  saveEventXPostSettings,
} from "@/services/events/eventsXPostSettingsApi.js";

function jsonResponse(body, { ok = true, status = 200 } = {}) {
  return {
    ok,
    status,
    json: vi.fn(() => Promise.resolve(body)),
  };
}

describe("event X post settings API", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("resolves the encrypted WordPress UID from the parent context", () => {
    const parentUserData = { UID: "encrypted-creator-uid" };
    const windowRef = {
      userData: {},
      parent: { userData: parentUserData },
    };

    expect(resolveWordPressUid(windowRef)).toBe("encrypted-creator-uid");
  });

  it("loads and normalizes event-specific settings with credentials", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse({
      success: true,
      eventId: "evt_123",
      settings: {
        on_schedule_live: {
          enabled: true,
          message: "Live now",
          mediaUrl: "https://cdn.example.com/live.jpg",
          source: "event",
        },
      },
    })));
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchEventXPostSettings({
      eventId: "evt_123",
      creatorId: 1407,
      uid: "creator-uid",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/wp-json/api/event/evt_123/x-post-settings?"),
      expect.objectContaining({
        method: "GET",
        credentials: "include",
      }),
    );
    expect(fetchMock.mock.calls[0][0]).toContain("creator_id=1407");
    expect(fetchMock.mock.calls[0][0]).toContain("uid=creator-uid");
    expect(result.settings.on_schedule_live).toEqual({
      enabled: true,
      message: "Live now",
      mediaUrl: "https://cdn.example.com/live.jpg",
      source: "event",
    });
    expect(result.settings.on_booking_received.source).toBe("missing");
  });

  it("lets WordPress rules override event fields while retaining missing booleans", () => {
    const merged = mergeEventXPostSettingsIntoFormState(
      {
        xPostLive: false,
        on_schedule_live: false,
        xPostBooked: true,
        on_booking_received: true,
        on_booking_received_message: "stale",
        on_booking_received_media_url: "https://cdn.example.com/stale.jpg",
      },
      {
        success: true,
        eventId: "evt_123",
        settings: {
          on_schedule_live: {
            enabled: true,
            message: "WordPress message",
            mediaUrl: "https://cdn.example.com/live.jpg",
            source: "event",
          },
        },
      },
    );

    expect(merged).toEqual(expect.objectContaining({
      xPostLive: true,
      on_schedule_live: true,
      on_schedule_live_message: "WordPress message",
      on_schedule_live_media_url: "https://cdn.example.com/live.jpg",
      xPostBooked: true,
      on_booking_received: true,
      on_booking_received_message: "",
      on_booking_received_media_url: "",
    }));
  });

  it("saves all five actions without invoking the create endpoint", async () => {
    const fetchMock = vi.fn(() => Promise.resolve(jsonResponse({
      success: true,
      eventId: "evt_edit",
      settings: {},
    })));
    vi.stubGlobal("fetch", fetchMock);

    await saveEventXPostSettings({
      eventId: "evt_edit",
      creatorId: 1407,
      uid: "creator-uid",
      state: {
        on_schedule_live: true,
        on_schedule_live_message: "Edited message",
        on_schedule_live_media_url: "https://cdn.example.com/edited.jpg",
      },
    });

    const [url, options] = fetchMock.mock.calls[0];
    const body = JSON.parse(options.body);
    expect(url).toContain("/wp-json/api/event/evt_edit/x-post-settings");
    expect(url).not.toContain("/event/create");
    expect(options).toEqual(expect.objectContaining({
      method: "PUT",
      credentials: "include",
      keepalive: true,
    }));
    expect(body.creator_id).toBe(1407);
    expect(body.uid).toBe("creator-uid");
    expect(body.settings).toEqual(buildEventXPostSettingsPayload({
      on_schedule_live: true,
      on_schedule_live_message: "Edited message",
      on_schedule_live_media_url: "https://cdn.example.com/edited.jpg",
    }));
    expect(Object.keys(body.settings)).toHaveLength(5);
  });

  it("surfaces WordPress persistence errors", async () => {
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(jsonResponse(
      { success: false, message: "Database write failed." },
      { ok: false, status: 500 },
    ))));

    await expect(saveEventXPostSettings({
      eventId: "evt_edit",
      creatorId: 1407,
      uid: "creator-uid",
      state: {},
    })).rejects.toMatchObject({
      message: "Database write failed.",
      status: 500,
    });
  });
});
