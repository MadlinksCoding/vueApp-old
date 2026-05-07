import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  route: { name: "events-embed-events", fullPath: "/events" },
  router: { replace: vi.fn(() => Promise.resolve()) },
  bootstrap: {
    bootstrapped: true,
    creatorId: 1407,
    fanId: null,
    userRole: "creator",
    initialRoute: "events",
    translations: {},
    locale: "en",
  },
  notifyEventsEmbedResize: vi.fn(),
  announceEventsEmbedReady: vi.fn(),
  installEventsEmbedBootstrapListener: vi.fn(() => vi.fn()),
}));

vi.mock("vue-router", () => ({
  RouterView: { name: "RouterView", template: "<div data-test='router-view' />" },
  useRoute: () => mocks.route,
  useRouter: () => mocks.router,
}));

vi.mock("@/embeds/events/bridge.js", () => ({
  announceEventsEmbedReady: mocks.announceEventsEmbedReady,
  installEventsEmbedBootstrapListener: mocks.installEventsEmbedBootstrapListener,
  isEmbeddedIframe: () => false,
  notifyEventsEmbedResize: mocks.notifyEventsEmbedResize,
}));

vi.mock("@/embeds/events/bootstrap.js", () => ({
  applyEventsEmbedBootstrap: vi.fn((payload = {}) => payload),
  readEventsEmbedBootstrapFromUrl: vi.fn(() => null),
  useEventsEmbedBootstrap: () => mocks.bootstrap,
}));

vi.mock("@/embeds/events/router.js", () => ({
  routeLocationFromInitialRoute: vi.fn(() => ({ name: "events-embed-events" })),
}));

vi.mock("@/i18n/bookingTranslations.js", () => ({
  provideBookingTranslations: () => ({
    t: (key) => key,
  }),
}));

class ResizeObserverStub {
  observe = vi.fn();
  disconnect = vi.fn();
}

async function flushPromises() {
  await Promise.resolve();
  await Promise.resolve();
}

function installVisualViewport(height = 612) {
  const visualViewport = new EventTarget();
  Object.defineProperty(visualViewport, "height", {
    configurable: true,
    writable: true,
    value: height,
  });
  Object.defineProperty(window, "visualViewport", {
    configurable: true,
    value: visualViewport,
  });
  return visualViewport;
}

describe("EventsEmbedApp viewport height sync", () => {
  let originalResizeObserver;

  beforeEach(() => {
    vi.useFakeTimers();
    mocks.notifyEventsEmbedResize.mockReset();
    mocks.announceEventsEmbedReady.mockReset();
    mocks.installEventsEmbedBootstrapListener.mockClear();
    mocks.route.name = "events-embed-events";
    mocks.route.fullPath = "/events";
    mocks.bootstrap.bootstrapped = true;
    originalResizeObserver = global.ResizeObserver;
    global.ResizeObserver = ResizeObserverStub;
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      writable: true,
      value: 700,
    });
    installVisualViewport(612);
  });

  afterEach(() => {
    global.ResizeObserver = originalResizeObserver;
    vi.useRealTimers();
  });

  it("uses visualViewport height for embedded viewport mode", async () => {
    const { default: EventsEmbedApp } = await import("@/embeds/events/EventsEmbedApp.vue");

    const wrapper = mount(EventsEmbedApp);
    await flushPromises();

    expect(wrapper.element.style.getPropertyValue("--fs-events-embed-vh")).toBe("612px");
    expect(wrapper.element.style.height).toBe("var(--fs-events-embed-vh)");
    expect(mocks.notifyEventsEmbedResize).toHaveBeenLastCalledWith(612, { mode: "viewport" });
  });

  it("resyncs viewport height from visualViewport resize", async () => {
    const { default: EventsEmbedApp } = await import("@/embeds/events/EventsEmbedApp.vue");
    const wrapper = mount(EventsEmbedApp);
    await flushPromises();
    mocks.notifyEventsEmbedResize.mockClear();

    window.visualViewport.height = 544;
    window.visualViewport.dispatchEvent(new Event("resize"));
    await flushPromises();

    expect(wrapper.element.style.getPropertyValue("--fs-events-embed-vh")).toBe("544px");
    expect(mocks.notifyEventsEmbedResize).toHaveBeenCalledWith(544, { mode: "viewport" });
  });

  it("runs delayed viewport resyncs after keyboard focusout", async () => {
    const { default: EventsEmbedApp } = await import("@/embeds/events/EventsEmbedApp.vue");
    mount(EventsEmbedApp);
    await flushPromises();
    mocks.notifyEventsEmbedResize.mockClear();

    window.visualViewport.height = 620;
    window.dispatchEvent(new Event("focusout"));
    vi.advanceTimersByTime(150);
    await flushPromises();

    expect(mocks.notifyEventsEmbedResize).toHaveBeenCalledWith(620, { mode: "viewport" });

    window.visualViewport.height = 700;
    vi.advanceTimersByTime(550);
    await flushPromises();

    expect(mocks.notifyEventsEmbedResize).toHaveBeenLastCalledWith(700, { mode: "viewport" });
  });
});
