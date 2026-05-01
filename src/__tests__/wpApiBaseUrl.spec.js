import { describe, expect, it } from "vitest";

import {
  buildWpApiUrl,
  normalizeWpSiteBaseUrl,
  resolveWpSiteBaseUrl,
} from "@/utils/wpApiBaseUrl.js";

describe("wpApiBaseUrl", () => {
  it("normalizes trailing slashes and invalid string values", () => {
    expect(normalizeWpSiteBaseUrl("https://fansocial.app///")).toBe("https://fansocial.app");
    expect(normalizeWpSiteBaseUrl(" undefined ")).toBe("");
    expect(normalizeWpSiteBaseUrl("null")).toBe("");
  });

  it("prefers the configured env value when present", () => {
    expect(resolveWpSiteBaseUrl({
      envValue: "https://fansocial.app/",
      origin: "https://site.com",
    })).toBe("https://fansocial.app");
  });

  it("falls back to browser origin when env is missing or invalid", () => {
    expect(resolveWpSiteBaseUrl({
      envValue: "",
      origin: "https://site.com/",
    })).toBe("https://site.com");

    expect(resolveWpSiteBaseUrl({
      envValue: "undefined",
      origin: "https://site.com/",
    })).toBe("https://site.com");
  });

  it("builds wp-json api URLs without undefined or null path segments", () => {
    expect(buildWpApiUrl("/subscriptions/plans/list", {
      envValue: "undefined",
      origin: "https://site.com/",
    })).toBe("https://site.com/wp-json/api/subscriptions/plans/list");

    expect(buildWpApiUrl("users/search", {
      envValue: "null",
      origin: "https://site.com/",
    })).toBe("https://site.com/wp-json/api/users/search");
  });
});
