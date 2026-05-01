import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  formatMediaDuration,
  getSpendingRequirementMediaBadge,
} from "@/utils/spendingRequirementMediaBadge.js";

describe("spending requirement media badges", () => {
  it("returns null for non-media popup items", () => {
    expect(getSpendingRequirementMediaBadge({
      id: 32799,
      type: "product",
      raw: { type: "product", title: "Merch" },
    })).toBeNull();

    expect(getSpendingRequirementMediaBadge({
      id: 14322,
      type: "subscription",
      raw: { type: "subscription", title: "Tier" },
    })).toBeNull();
  });

  it("returns an icon-only badge for image media", () => {
    expect(getSpendingRequirementMediaBadge({
      id: 3011,
      type: "media",
      raw: { type: "image", file_extension: "png" },
    })).toEqual({
      kind: "image",
      icon: "image",
      label: "",
    });
  });

  it("uses image-gallery count fields from the media API", () => {
    expect(getSpendingRequirementMediaBadge({
      id: 3647,
      type: "media",
      raw: {
        type: "image-gallery",
        gallery_count: 6,
        gallery_count_formatted: 6,
      },
    })).toEqual({
      kind: "image-gallery",
      icon: "gallery",
      label: "6",
    });
  });

  it("uses video duration fields from the media API", () => {
    expect(getSpendingRequirementMediaBadge({
      id: 2940,
      type: "media",
      raw: {
        type: "video",
        video_duration: "11.237052",
        video_duration_formatted: "0:11",
      },
    })).toEqual({
      kind: "video",
      icon: "video",
      label: "0:11",
    });
  });

  it("formats audio duration fields defensively", () => {
    expect(getSpendingRequirementMediaBadge({
      id: 9876,
      type: "media",
      raw: {
        type: "audio",
        audio_duration: "125.9",
      },
    })).toEqual({
      kind: "audio",
      icon: "audio",
      label: "2:05",
    });

    expect(formatMediaDuration("3671.2")).toBe("1:01:11");
  });

  it("prefers raw media API fields over mapped item fallback fields", () => {
    expect(getSpendingRequirementMediaBadge({
      id: 3647,
      type: "media",
      gallery_count_formatted: 4,
      raw: {
        type: "image-gallery",
        gallery_count_formatted: 6,
      },
    })).toEqual(expect.objectContaining({
      icon: "gallery",
      label: "6",
    }));
  });

  it("keeps the popup wired to media badge data instead of the old placeholder", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/components/ui/form/BookingForm/HelperComponents/SpendingRequirementProductPopup.vue"),
      "utf8"
    );

    expect(source).toContain("getSpendingRequirementMediaBadge");
    expect(source).toContain("mediaBadgeForItem(item)");
    expect(source).not.toContain(">Count<");
    expect(source).not.toContain('<img src=""');
  });
});
