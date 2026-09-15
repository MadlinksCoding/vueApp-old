import { flushPromises, mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import BookingNoticeLab from "@/embeds/bookingNotices/BookingNoticeLab.vue";
import {
  BOOKING_NOTICE_PREVIEW_STORAGE_KEY,
  createAllBookingNoticeLabNotices,
  createBookingNoticeLabNotice,
  createBookingNoticePreviewPayload,
  isBookingNoticeLabHost,
} from "@/embeds/bookingNotices/noticeLabData";

describe("Booking Notice Test Lab", () => {
  let controller;
  let mountBookingNotices;

  beforeEach(() => {
	localStorage.clear();
    controller = {
      update: vi.fn(),
      setConfig: vi.fn(),
      destroy: vi.fn(),
    };
    mountBookingNotices = vi.fn(() => controller);
    window.FSEventsEmbed = { mountBookingNotices };
  });

  afterEach(() => {
    delete window.FSEventsEmbed;
    document.head.querySelectorAll("[data-notice-lab-host-css]").forEach((element) => element.remove());
  });

  it("is available only on the approved local hosts", () => {
    expect(isBookingNoticeLabHost("fansocial.local")).toBe(true);
    expect(isBookingNoticeLabHost("localhost")).toBe(true);
    expect(isBookingNoticeLabHost("127.0.0.1")).toBe(true);
    expect(isBookingNoticeLabHost("example.com")).toBe(false);
    expect(isBookingNoticeLabHost("staging.fansocial.app")).toBe(false);
  });

  it("creates every fake notice variation without using a backend", () => {
    const all = createAllBookingNoticeLabNotices({ sequence: 10, viewerRole: "fan", itemCount: 2 });
    expect(all).toHaveLength(9);
    expect(new Set(all.map((notice) => notice.type))).toEqual(new Set([
      "booking-request",
      "booking-confirmed",
      "booking-declined",
      "price-adjustment",
      "ready-to-join",
      "summary",
    ]));
    const expandableSummary = createBookingNoticeLabNotice("summary", { itemCount: 3 });
    expect(expandableSummary.sections).toHaveLength(8);
    expect(expandableSummary.sections.find((section) => section.type === "events-today")).toMatchObject({
      label: "Events today",
      totalCount: 3,
      priority: "events-today",
    });
    expect(expandableSummary.sections.find((section) => section.type === "booking-request").items.length).toBe(23);
    expect(expandableSummary.sections.find((section) => section.type === "booking-confirmed")).toMatchObject({
      label: "Confirmed bookings",
      totalCount: 3,
      priority: "general-information",
    });
    expect(expandableSummary.sections.filter((section) => section.type === "price-adjustment").map((section) => section.variant)).toEqual([
      "request-sent",
      "accepted",
      "declined",
    ]);
    const singleSummary = createBookingNoticeLabNotice("summary-single", { viewerRole: "fan" });
    expect(singleSummary).toMatchObject({ type: "summary", audience: "fan", viewer: { role: "fan" } });
    expect(singleSummary.sections[0]).toMatchObject({ totalCount: 1 });
	const labNow = Date.parse("2026-09-14T10:00:00.000Z");
	const readyNotice = createBookingNoticeLabNotice("ready-to-join", { nowMs: labNow, itemCount: 2 });
	expect(readyNotice.items.map((item) => item.eventAt)).toEqual([
	  "2026-09-14T10:05:00.000Z",
	  "2026-09-14T10:06:00.000Z",
	]);
	const summaryWithReady = createBookingNoticeLabNotice("summary", { nowMs: labNow });
	expect(summaryWithReady.sections.find((section) => section.type === "ready-to-join").items[0].eventAt)
	  .toBe("2026-09-14T10:05:00.000Z");
	expect(summaryWithReady.sections.find((section) => section.type === "events-today").items[0]).toMatchObject({
	  eventAt: "2026-09-14T10:30:00.000Z",
	  activityType: "events-today",
	});
	for (const variant of ["booking-confirmed", "booking-declined"]) {
	  const fanResult = createBookingNoticeLabNotice(variant, { viewerRole: "fan", itemCount: 1 });
	  expect(fanResult).toMatchObject({ type: variant, audience: "fan", totalCount: 1, showDetail: true });
	  expect(fanResult.action).toBeUndefined();
	}
	expect(all.flatMap((notice) => notice.items || []).every((item) => item.month === "APR")).toBe(true);
	const preview = createBookingNoticePreviewPayload(all.slice(0, 2), { attentionAnimation: "blink" }, "creator", 1000);
	expect(preview).toMatchObject({ schemaVersion: 1, createdAt: 1000, expiresAt: 3601000, viewerRole: "creator" });
	expect(preview.notices).toHaveLength(2);
  });

  it("drives the real host controller and records notice actions", async () => {
    const wrapper = mount(BookingNoticeLab, { attachTo: document.body });
    await flushPromises();
    expect(mountBookingNotices).toHaveBeenCalledOnce();
    expect(mountBookingNotices.mock.calls[0][0].config.summary).toMatchObject({
      desktopPosition: "top-right",
      mobilePosition: "bottom",
    });
    expect(wrapper.text()).toContain("This is a UI simulator, not an end-to-end booking test");

    await wrapper.get('[data-test="lab-variant"]').setValue("ready-to-join");
    await wrapper.get('[data-test="lab-show"]').trigger("click");
    expect(controller.update).toHaveBeenLastCalledWith(expect.objectContaining({
      notices: [expect.objectContaining({ type: "ready-to-join" })],
    }));
    expect(() => structuredClone(controller.update.mock.calls.at(-1)[0])).not.toThrow();

    await wrapper.get('[data-test="lab-attention"]').setValue("blink");
    expect(controller.setConfig).toHaveBeenLastCalledWith(expect.objectContaining({ attentionAnimation: "blink" }));

    await wrapper.get('[data-test="lab-summary-desktop-position"]').setValue("bottom-left");
    expect(controller.setConfig).toHaveBeenLastCalledWith(expect.objectContaining({
      summary: expect.objectContaining({ desktopPosition: "bottom-left", mobilePosition: "bottom" }),
    }));
    await wrapper.get('[data-test="lab-summary-mobile-position"]').setValue("");
    expect(controller.setConfig.mock.calls.at(-1)[0].summary).not.toHaveProperty("mobilePosition");

    const callbacks = mountBookingNotices.mock.calls[0][0];
    callbacks.onDetail({ noticeId: "lab-detail" });
    callbacks.onJoin({ noticeId: "lab-join" });
    await wrapper.vm.$nextTick();
    expect(wrapper.get(".notice-lab-log").text()).toContain("detail lab-detail");
    expect(wrapper.get(".notice-lab-log").text()).toContain("join lab-join");

    await wrapper.get('[data-test="lab-popup-open"]').trigger("click");
    expect(wrapper.find('[role="dialog"]').exists()).toBe(true);
    await wrapper.get('[data-test="lab-popup-close"]').trigger("click");
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false);

	await wrapper.get('[data-test="lab-open-preview"]').trigger("click");
	const savedPreview = JSON.parse(localStorage.getItem(BOOKING_NOTICE_PREVIEW_STORAGE_KEY));
	expect(savedPreview.notices).toHaveLength(1);
	expect(savedPreview.notices[0].type).toBe("ready-to-join");
	expect(wrapper.get('[data-test="lab-open-preview"]').attributes("href")).toContain("fs-notice-mode=preview");
	expect(wrapper.get('[data-test="lab-open-feed"]').attributes("href")).toContain("fs-notice-mode=feed");

    wrapper.unmount();
    expect(controller.destroy).toHaveBeenCalledOnce();
  });
});
