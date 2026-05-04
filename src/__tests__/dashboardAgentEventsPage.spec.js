import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";

const replace = vi.fn();

let routeQuery = {};
let authState = {};

vi.mock("vue-router", () => ({
  useRoute: () => ({
    path: "/dashboard/events",
    query: routeQuery,
  }),
  useRouter: () => ({
    push: vi.fn(),
    replace,
  }),
}));

vi.mock("@/stores/useAuthStore", () => ({
  useAuthStore: () => authState,
}));

vi.mock("@/components/dashboard/DashboardWrapperTwoColContainer.vue", () => ({
  default: {
    name: "DashboardWrapperTwoColContainer",
    template: "<div><slot /></div>",
  },
}));

vi.mock("@/features/events/DashboardEventsFeature.vue", () => ({
  default: {
    name: "DashboardEventsFeature",
    props: ["creatorId", "userRole", "fanId", "refreshSignal"],
    template: "<div />",
  },
}));

describe("agent dashboard events page", () => {
  it("uses authenticated creator id before the hardcoded dev fallback", async () => {
    routeQuery = {};
    authState = {
      simulate: { role: "creator" },
      currentUser: {
        role: "creator",
        raw: { user_id: 793 },
      },
    };

    const { default: DashboardEvents } = await import("@/templates/dashboard/page/agent/DashboardEvents.vue");
    const wrapper = mount(DashboardEvents);

    const feature = wrapper.getComponent({ name: "DashboardEventsFeature" });
    expect(feature.props("creatorId")).toBe(793);
    expect(feature.props("userRole")).toBe("creator");
  });

  it("keeps route creatorId as the explicit local/debug override", async () => {
    routeQuery = { creatorId: "55" };
    authState = {
      simulate: { role: "creator", userId: 793 },
      currentUser: {
        role: "creator",
        raw: { user_id: 793 },
      },
    };

    const { default: DashboardEvents } = await import("@/templates/dashboard/page/agent/DashboardEvents.vue");
    const wrapper = mount(DashboardEvents);

    const feature = wrapper.getComponent({ name: "DashboardEventsFeature" });
    expect(feature.props("creatorId")).toBe(55);
  });
});
