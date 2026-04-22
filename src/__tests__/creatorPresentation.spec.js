import { describe, expect, it } from "vitest";
import {
  DEFAULT_CREATOR_NAME,
  normalizeCreatorPresentationInput,
  normalizeCreatorProfilePresentation,
  resolveCreatorPresentation,
} from "@/components/FanBookingFlow/OneOnOneBookingFlow/creatorPresentation.js";

describe("creatorPresentation", () => {
  it("normalizes explicit creator data and drops empty values", () => {
    expect(normalizeCreatorPresentationInput({
      avatar: "  ",
      name: "  Creator  ",
      isVerified: "true",
    })).toEqual({
      avatar: null,
      name: "Creator",
      isVerified: true,
    });
  });

  it("prefers explicit creator data field-by-field", () => {
    const resolved = resolveCreatorPresentation({
      explicitCreatorData: {
        name: "Provided Name",
      },
      selectedEvent: {
        creatorName: "Event Name",
        creatorAvatarUrl: "https://example.com/event.webp",
        creatorIsVerified: true,
      },
    });

    expect(resolved.name).toBe("Provided Name");
    expect(resolved.avatar).toBe("https://example.com/event.webp");
    expect(resolved.isVerified).toBe(true);
  });

  it("falls back to defaults when no creator data exists", () => {
    const resolved = resolveCreatorPresentation();

    expect(resolved.name).toBe(DEFAULT_CREATOR_NAME);
    expect(typeof resolved.avatar).toBe("string");
    expect(resolved.avatar.length).toBeGreaterThan(0);
    expect(resolved.isVerified).toBe(false);
  });

  it("normalizes profile API data into creator presentation fields", () => {
    expect(normalizeCreatorProfilePresentation({
      avatar: "https://example.com/api-avatar.webp",
      display_name: "API Creator",
      username: "api_creator",
      is_premium: true,
    })).toEqual({
      avatar: "https://example.com/api-avatar.webp",
      name: "API Creator",
      isVerified: true,
    });
  });

  it("falls back to existing creator data when profile fields are missing", () => {
    expect(normalizeCreatorProfilePresentation(
      {
        username: "",
        is_premium: null,
      },
      {
        avatar: "https://example.com/fallback.webp",
        name: "Fallback Creator",
        isVerified: false,
      },
    )).toEqual({
      avatar: "https://example.com/fallback.webp",
      name: "Fallback Creator",
      isVerified: false,
    });
  });
});
