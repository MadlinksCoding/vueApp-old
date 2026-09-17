import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import { afterEach, describe, expect, it, vi } from "vitest";
import BookingNoticesApp from "@/embeds/bookingNotices/BookingNoticesApp.vue";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("BookingNoticesApp iframe messaging", () => {
  it("reports zero bounds until a real notice card is visible", async () => {
    const postMessage = vi.spyOn(window, "postMessage").mockImplementation(() => {});
    const wrapper = mount(BookingNoticesApp);
    await nextTick();

    const initialResize = postMessage.mock.calls
      .map(([message]) => message)
      .filter((message) => message?.type === "FS_BOOKING_NOTICES_RESIZE")
      .at(-1);
    expect(initialResize?.payload).toMatchObject({
      width: 0,
      height: 0,
      hasVisibleNotices: false,
      visibleNoticeCount: 0,
    });

    window.dispatchEvent(new MessageEvent("message", {
      source: window,
      origin: window.location.origin,
      data: {
        type: "FS_BOOKING_NOTICES_BOOTSTRAP",
        payload: {
          position: "top-right",
          notices: [{
            id: "visible-notice",
            type: "booking-confirmed",
            items: [{
              id: "visible-item",
              title: "Visible booking",
              month: "SEP",
              day: "17",
              time: "9:00am – 10:00am",
              person: { name: "Creator" },
            }],
          }],
        },
      },
    }));
    await nextTick();
    await nextTick();

    const visibleResize = postMessage.mock.calls
      .map(([message]) => message)
      .filter((message) => message?.type === "FS_BOOKING_NOTICES_RESIZE")
      .at(-1);
    expect(visibleResize?.payload).toMatchObject({
      hasVisibleNotices: true,
      visibleNoticeCount: 1,
    });
    wrapper.unmount();
  });

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
              type: "booking-confirmed",
              items: [
                { id: "confirmed-visible", title: "Confirmed one" },
                { id: "confirmed-visible-2", title: "Confirmed two" },
              ],
              totalCount: 2,
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
        allItemIds: ["confirmed-visible", "confirmed-visible-2"],
        visibleItemIds: ["confirmed-visible", "confirmed-visible-2"],
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
