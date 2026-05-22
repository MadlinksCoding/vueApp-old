import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  requestEventsEmbedOpenUrl: vi.fn(),
  requestEventsEmbedScrollToTop: vi.fn(),
  resetDashboardScroll: vi.fn(),
}));

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push: mocks.push,
  }),
}));

vi.mock("@/embeds/events/bootstrap.js", () => ({
  useEventsEmbedBootstrap: () => ({
    creatorId: 1407,
    fanId: null,
    userRole: "creator",
    apiBaseUrl: "https://api.example.com",
  }),
}));

vi.mock("@/embeds/events/bridge.js", () => ({
  isEmbeddedIframe: () => false,
  requestEventsEmbedOpenUrl: mocks.requestEventsEmbedOpenUrl,
  requestEventsEmbedScrollToTop: mocks.requestEventsEmbedScrollToTop,
}));

vi.mock("@/features/events/DashboardEventsFeature.vue", () => ({
  default: {
    name: "DashboardEventsFeature",
    emits: ["create-event", "edit-event", "open-url"],
    methods: {
      resetEmbeddedMobileScrollToTop: mocks.resetDashboardScroll,
    },
    template: `
      <div>
        <button data-test="create-private" @click="$emit('create-event', { type: 'private' })">private</button>
        <button data-test="create-group" @click="$emit('create-event', { type: 'group' })">group</button>
        <button data-test="edit-group" @click="$emit('edit-event', { eventId: 'evt_edit', type: 'group' })">edit</button>
      </div>
    `,
  },
}));

function setWindowWidth(width) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: width,
  });
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

describe("EventsEmbedEventsPage", () => {
  let originalScrollTo;
  let originalRequestAnimationFrame;

  beforeEach(() => {
    mocks.push.mockReset();
    mocks.requestEventsEmbedOpenUrl.mockReset();
    mocks.requestEventsEmbedScrollToTop.mockReset();
    mocks.resetDashboardScroll.mockReset();
    originalScrollTo = window.scrollTo;
    originalRequestAnimationFrame = window.requestAnimationFrame;
    window.scrollTo = vi.fn();
    window.requestAnimationFrame = (callback) => {
      callback();
      return 1;
    };
    setWindowWidth(500);
  });

  afterEach(() => {
    window.scrollTo = originalScrollTo;
    window.requestAnimationFrame = originalRequestAnimationFrame;
    setWindowWidth(1024);
  });

  it("routes private create events to the embedded booking form", async () => {
    const { default: EventsEmbedEventsPage } = await import("@/embeds/events/pages/EventsEmbedEventsPage.vue");
    const wrapper = mount(EventsEmbedEventsPage);

    await wrapper.get("[data-test='create-private']").trigger("click");

    expect(mocks.push).toHaveBeenCalledWith({
      name: "events-embed-create",
      params: { type: "private" },
    });
  });

  it("routes group create events to the embedded booking form", async () => {
    const { default: EventsEmbedEventsPage } = await import("@/embeds/events/pages/EventsEmbedEventsPage.vue");
    const wrapper = mount(EventsEmbedEventsPage);

    await wrapper.get("[data-test='create-group']").trigger("click");

    expect(mocks.push).toHaveBeenCalledWith({
      name: "events-embed-create",
      params: { type: "group" },
    });
  });

  it("routes edit events to the embedded booking form in edit mode", async () => {
    const { default: EventsEmbedEventsPage } = await import("@/embeds/events/pages/EventsEmbedEventsPage.vue");
    const wrapper = mount(EventsEmbedEventsPage);

    await wrapper.get("[data-test='edit-group']").trigger("click");

    expect(mocks.push).toHaveBeenCalledWith({
      name: "events-embed-create",
      params: { type: "group" },
      query: {
        mode: "edit",
        eventId: "evt_edit",
      },
    });
  });

  it("resets the embedded dashboard scroll on mobile mount", async () => {
    const { default: EventsEmbedEventsPage } = await import("@/embeds/events/pages/EventsEmbedEventsPage.vue");
    const wrapper = mount(EventsEmbedEventsPage);
    wrapper.element.scrollTo = vi.fn();

    await flushPromises();

    expect(wrapper.element.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" });
    expect(mocks.resetDashboardScroll).toHaveBeenCalledTimes(1);
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "auto" });
    expect(mocks.requestEventsEmbedScrollToTop).toHaveBeenCalledWith({
      reason: "events-page-mounted",
      behavior: "auto",
    });
  });

  it("does not reset embedded dashboard scroll on desktop mount", async () => {
    setWindowWidth(1024);
    const { default: EventsEmbedEventsPage } = await import("@/embeds/events/pages/EventsEmbedEventsPage.vue");
    mount(EventsEmbedEventsPage);

    await flushPromises();

    expect(mocks.resetDashboardScroll).not.toHaveBeenCalled();
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(mocks.requestEventsEmbedScrollToTop).not.toHaveBeenCalled();
  });
});
