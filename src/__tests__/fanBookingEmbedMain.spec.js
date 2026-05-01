import { beforeEach, describe, expect, it, vi } from "vitest";

const mountSpy = vi.fn();
const useSpy = vi.fn();
const createAppSpy = vi.fn(() => ({
  use: useSpy,
  mount: mountSpy,
}));
const createPiniaSpy = vi.fn(() => ({ __pinia: true }));

vi.mock("vue", () => ({
  createApp: createAppSpy,
}));

vi.mock("pinia", () => ({
  createPinia: createPiniaSpy,
}));

vi.mock("@/embeds/fanBooking/FanBookingEmbedApp.vue", () => ({
  default: { name: "FanBookingEmbedApp" },
}));

vi.mock("@/assets/main.css", () => ({}));

describe("fan booking embed main", () => {
  beforeEach(() => {
    vi.resetModules();
    createAppSpy.mockClear();
    createPiniaSpy.mockClear();
    useSpy.mockClear();
    mountSpy.mockClear();
  });

  it("installs Pinia and mounts the embed app", async () => {
    await import("@/embeds/fanBooking/main.js");

    expect(createAppSpy).toHaveBeenCalledTimes(1);
    expect(createPiniaSpy).toHaveBeenCalledTimes(1);
    expect(useSpy).toHaveBeenCalledWith(expect.objectContaining({ __pinia: true }));
    expect(mountSpy).toHaveBeenCalledWith("#fan-booking-embed-app");
  });
});
