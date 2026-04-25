import { mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();

vi.mock("vue-router", () => ({
  useRouter: () => ({
    push,
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
  requestEventsEmbedOpenUrl: vi.fn(),
}));

vi.mock("@/features/events/DashboardEventsFeature.vue", () => ({
  default: {
    name: "DashboardEventsFeature",
    emits: ["create-event", "open-url"],
    template: `
      <div>
        <button data-test="create-private" @click="$emit('create-event', { type: 'private' })">private</button>
        <button data-test="create-group" @click="$emit('create-event', { type: 'group' })">group</button>
      </div>
    `,
  },
}));

describe("EventsEmbedEventsPage", () => {
  beforeEach(() => {
    push.mockReset();
  });

  it("routes private create events to the embedded booking form", async () => {
    const { default: EventsEmbedEventsPage } = await import("@/embeds/events/pages/EventsEmbedEventsPage.vue");
    const wrapper = mount(EventsEmbedEventsPage);

    await wrapper.get("[data-test='create-private']").trigger("click");

    expect(push).toHaveBeenCalledWith({
      name: "events-embed-create",
      params: { type: "private" },
    });
  });

  it("routes group create events to the embedded booking form", async () => {
    const { default: EventsEmbedEventsPage } = await import("@/embeds/events/pages/EventsEmbedEventsPage.vue");
    const wrapper = mount(EventsEmbedEventsPage);

    await wrapper.get("[data-test='create-group']").trigger("click");

    expect(push).toHaveBeenCalledWith({
      name: "events-embed-create",
      params: { type: "group" },
    });
  });
});
