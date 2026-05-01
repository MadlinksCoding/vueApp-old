import { mount } from "@vue/test-utils";
import { reactive } from "vue";
import { beforeEach, describe, expect, it, vi } from "vitest";

const bootstrapState = reactive({
  creatorId: 1407,
  fanId: 25,
  eventId: null,
  apiBaseUrl: "",
  creatorData: {
    avatar: null,
    name: null,
    isVerified: null,
  },
  bootstrapped: true,
});

const applyBootstrap = vi.fn();
const readBootstrapFromUrl = vi.fn(() => null);
const requestClose = vi.fn();
const announceReady = vi.fn();
const notifyCreated = vi.fn();
const notifyFailed = vi.fn();
const removeBootstrapListener = vi.fn();
const installBootstrapListener = vi.fn(() => removeBootstrapListener);
const isEmbeddedIframe = vi.fn(() => true);

vi.mock("@/embeds/fanBooking/bootstrap.js", () => ({
  applyOneOnOneBookingBootstrap: applyBootstrap,
  readOneOnOneBookingBootstrapFromUrl: readBootstrapFromUrl,
  useOneOnOneBookingBootstrap: () => bootstrapState,
}));

vi.mock("@/embeds/fanBooking/bridge.js", () => ({
  announceOneOnOneBookingReady: announceReady,
  installOneOnOneBookingBootstrapListener: installBootstrapListener,
  isEmbeddedIframe,
  notifyOneOnOneBookingCreated: notifyCreated,
  notifyOneOnOneBookingFailed: notifyFailed,
  requestOneOnOneBookingClose: requestClose,
}));

vi.mock("@/embeds/fanBooking/debug.js", () => ({
  logFanBookingDebug: vi.fn(),
  markFanBookingDebugEnabled: vi.fn(),
}));

vi.mock("@/components/FanBookingFlow/OneOnOneBookingFlow/OneOnOneBookingFlowFeature.vue", () => ({
  default: {
    name: "OneOnOneBookingFlowFeature",
    emits: ["close-request", "booking-created", "booking-failed"],
    template: `
      <div>
        <button data-test="emit-close-request" @click="$emit('close-request')">close</button>
      </div>
    `,
  },
}));

describe("FanBookingEmbedApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bootstrapState.creatorId = 1407;
    bootstrapState.fanId = 25;
    bootstrapState.eventId = null;
    bootstrapState.apiBaseUrl = "";
    bootstrapState.creatorData = {
      avatar: null,
      name: null,
      isVerified: null,
    };
    bootstrapState.bootstrapped = true;
    isEmbeddedIframe.mockReturnValue(true);
  });

  it("sends a close request to the parent when the feature emits close-request", async () => {
    const { default: FanBookingEmbedApp } = await import("@/embeds/fanBooking/FanBookingEmbedApp.vue");
    const wrapper = mount(FanBookingEmbedApp);

    await wrapper.get("[data-test='emit-close-request']").trigger("click");

    expect(requestClose).toHaveBeenCalledTimes(1);
  });
});
