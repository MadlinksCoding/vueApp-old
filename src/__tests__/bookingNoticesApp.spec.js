import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import BookingNoticesApp from "@/embeds/bookingNotices/BookingNoticesApp.vue";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("BookingNoticesApp iframe messaging", () => {
  it("reports the summary's visible item IDs to the host", async () => {
    const postMessage = vi.spyOn(window, "postMessage").mockImplementation(() => {});
    const wrapper = mount(BookingNoticesApp);
    window.dispatchEvent(new MessageEvent("message", {
      source: window,
      origin: window.location.origin,
      data: {
        type: "FS_BOOKING_NOTICES_BOOTSTRAP",
        payload: {
          position: "bottom",
          isMobile: true,
          notices: [{
            id: "summary",
            type: "summary",
            sections: [{
              type: "ready-to-join",
              items: [{ id: "ready-visible", title: "Ready" }],
              totalCount: 1,
            }],
          }],
        },
      },
    }));
    await nextTick();

    const visibilityCall = postMessage.mock.calls.find(([message]) => message?.type === "FS_BOOKING_NOTICES_SUMMARY_VISIBILITY");
    expect(visibilityCall?.[0]).toEqual(expect.objectContaining({
      payload: expect.objectContaining({
        noticeId: "summary",
        isOpen: true,
        allItemIds: ["ready-visible"],
        visibleItemIds: ["ready-visible"],
      }),
    }));
    wrapper.unmount();
  });

  it("sends Detail data as a plain cloneable payload", async () => {
    const postMessage = vi.spyOn(window, "postMessage").mockImplementation(() => {});
    const wrapper = mount(BookingNoticesApp);
    window.dispatchEvent(new MessageEvent("message", {
      source: window,
      origin: window.location.origin,
      data: {
        type: "FS_BOOKING_NOTICES_BOOTSTRAP",
        payload: {
          position: "top-right",
          isMobile: false,
          viewportHeight: 700,
          notices: [{
            id: "notice-1",
            type: "booking-confirmed",
            showDetail: true,
            items: [{
              id: "activity-1",
              bookingId: "booking-1",
              title: "Cloneable detail",
              month: "SEP",
              day: "17",
              time: "9:00pm – 10:00pm",
              person: { name: "Creator" },
            }],
          }],
        },
      },
    }));
    await nextTick();
    expect(wrapper.get("main").attributes("style")).toContain("--fs-booking-notices-max-height: 700px");
    expect(wrapper.get("main").classes()).toContain("booking-notices-embed--desktop");
    expect(wrapper.get("article").classes()).toContain("booking-notice-card--embedded-desktop");
    await wrapper.get('[data-test="notice-detail"]').trigger("click");

    const detailCall = postMessage.mock.calls.find(([message]) => message?.type === "FS_BOOKING_NOTICE_DETAIL");
    expect(detailCall?.[0]).toEqual(expect.objectContaining({
      payload: expect.objectContaining({
        noticeId: "notice-1",
        position: "top-right",
        item: expect.objectContaining({ id: "activity-1", bookingId: "booking-1" }),
      }),
    }));
    expect(() => structuredClone(detailCall[0])).not.toThrow();
    wrapper.unmount();
  });
});
