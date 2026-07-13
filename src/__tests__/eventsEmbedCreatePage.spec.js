import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  push: vi.fn(() => Promise.resolve()),
  route: { query: {} },
  requestEventsEmbedScrollToTop: vi.fn(),
  requestEventsEmbedOpenUrl: vi.fn(),
  isEmbeddedIframe: vi.fn(() => true),
}));

const mockBootstrap = {
  creatorId: 1407,
  userRole: "creator",
  apiBaseUrl: "https://api.example.com",
  initialRoute: "create-private",
  creatorData: {
    avatar: "https://example.com/avatar.webp",
    name: "Creator Name",
    isVerified: true,
  },
  bootstrapped: true,
};

vi.mock("vue-router", () => ({
  useRoute: () => mocks.route,
  useRouter: () => ({
    push: mocks.push,
  }),
}));

vi.mock("@/embeds/events/bootstrap.js", () => ({
  useEventsEmbedBootstrap: () => mockBootstrap,
}));

vi.mock("@/embeds/events/bridge.js", () => ({
  isEmbeddedIframe: mocks.isEmbeddedIframe,
  requestEventsEmbedOpenUrl: mocks.requestEventsEmbedOpenUrl,
  requestEventsEmbedScrollToTop: mocks.requestEventsEmbedScrollToTop,
}));

vi.mock("@/components/ui/form/BookingForm/UnifiedBookingForm.vue", () => ({
  default: {
    name: "UnifiedBookingForm",
    props: ["type", "creatorId", "apiBaseUrl", "creatorData", "embedded", "mode", "eventId"],
    template: "<div data-test='booking-form' />",
  },
}));

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

function setWindowWidth(width) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
}

describe("EventsEmbedCreatePage", () => {
  let originalScrollTo;

  beforeEach(() => {
    mocks.push.mockReset();
    mocks.push.mockResolvedValue();
    mocks.route.query = {};
    mocks.requestEventsEmbedScrollToTop.mockReset();
    mocks.requestEventsEmbedOpenUrl.mockReset();
    mocks.isEmbeddedIframe.mockReset();
    mocks.isEmbeddedIframe.mockReturnValue(true);
    originalScrollTo = window.scrollTo;
    window.scrollTo = vi.fn();
    setWindowWidth(500);
  });

  afterEach(() => {
    window.scrollTo = originalScrollTo;
    setWindowWidth(1024);
  });

  it("passes creatorData into UnifiedBookingForm", async () => {
    const { default: EventsEmbedCreatePage } = await import("@/embeds/events/pages/EventsEmbedCreatePage.vue");

    const wrapper = mount(EventsEmbedCreatePage, {
      props: {
        type: "private",
      },
    });

    const bookingForm = wrapper.getComponent({ name: "UnifiedBookingForm" });
    expect(bookingForm.props("creatorData")).toEqual(mockBootstrap.creatorData);
    expect(bookingForm.props("creatorId")).toBe(1407);
    expect(bookingForm.props("apiBaseUrl")).toBe("https://api.example.com");
    expect(bookingForm.props("embedded")).toBe(true);
  });

  it("posts a parent scroll request when the form asks to scroll on mobile", async () => {
    const { default: EventsEmbedCreatePage } = await import("@/embeds/events/pages/EventsEmbedCreatePage.vue");

    const wrapper = mount(EventsEmbedCreatePage, {
      props: {
        type: "private",
      },
    });
    const scrollRoot = wrapper.element;
    scrollRoot.scrollTo = vi.fn();

    wrapper.getComponent({ name: "UnifiedBookingForm" }).vm.$emit("scroll-top-request", {
      reason: "step-advanced",
      behavior: "auto",
    });
    await flushPromises();

    expect(scrollRoot.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" });
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" });
    expect(mocks.requestEventsEmbedScrollToTop).toHaveBeenCalledWith({
      reason: "step-advanced",
      behavior: "auto",
    });
  });

  it("routes back to events and posts a parent scroll request after creation on mobile", async () => {
    const { default: EventsEmbedCreatePage } = await import("@/embeds/events/pages/EventsEmbedCreatePage.vue");

    const wrapper = mount(EventsEmbedCreatePage, {
      props: {
        type: "group",
      },
    });

    wrapper.getComponent({ name: "UnifiedBookingForm" }).vm.$emit("created", { id: "evt_created" });
    await flushPromises();

    expect(mocks.push).toHaveBeenCalledWith({ name: "events-embed-events" });
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" });
    expect(mocks.requestEventsEmbedScrollToTop).toHaveBeenCalledWith({
      reason: "created",
      behavior: "auto",
    });
  });

  it("does not post parent scroll requests on desktop", async () => {
    setWindowWidth(1024);
    const { default: EventsEmbedCreatePage } = await import("@/embeds/events/pages/EventsEmbedCreatePage.vue");

    const wrapper = mount(EventsEmbedCreatePage, {
      props: {
        type: "private",
      },
    });

    wrapper.getComponent({ name: "UnifiedBookingForm" }).vm.$emit("scroll-top-request", {
      reason: "step-advanced",
    });
    await flushPromises();

    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(mocks.requestEventsEmbedScrollToTop).not.toHaveBeenCalled();
  });

  it("passes edit route state to a keyed form and routes schedule edits", async () => {
    mocks.route.query = { mode: "edit", eventId: "evt_current" };
    const { default: EventsEmbedCreatePage } = await import("@/embeds/events/pages/EventsEmbedCreatePage.vue");
    const wrapper = mount(EventsEmbedCreatePage, { props: { type: "private" } });
    const bookingForm = wrapper.getComponent({ name: "UnifiedBookingForm" });

    expect(bookingForm.props("mode")).toBe("edit");
    expect(bookingForm.props("eventId")).toBe("evt_current");

    bookingForm.vm.$emit("edit-event", { eventId: "evt_next", type: "group" });
    await flushPromises();

    expect(mocks.push).toHaveBeenCalledWith({
      name: "events-embed-create",
      params: { type: "group" },
      query: { mode: "edit", eventId: "evt_next" },
    });
  });

  it("forwards join URLs to the embedded host in a new tab", async () => {
    const { default: EventsEmbedCreatePage } = await import("@/embeds/events/pages/EventsEmbedCreatePage.vue");
    const wrapper = mount(EventsEmbedCreatePage, { props: { type: "private" } });

    wrapper.getComponent({ name: "UnifiedBookingForm" }).vm.$emit("open-url", {
      url: "https://example.com/scheduled-meeting",
      target: "_blank",
    });
    await flushPromises();

    expect(mocks.requestEventsEmbedOpenUrl).toHaveBeenCalledWith({
      url: "https://example.com/scheduled-meeting",
      target: "_blank",
    });
  });
});
