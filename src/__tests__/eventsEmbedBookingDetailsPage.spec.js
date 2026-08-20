import { flushPromises, mount } from "@vue/test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  flowRun: vi.fn(),
  notifyReady: vi.fn(),
  notifyUpdated: vi.fn(),
  notifyDecisionVisibility: vi.fn(),
  requestClose: vi.fn(),
  requestOpenUrl: vi.fn(),
  requestTopup: vi.fn(),
  installTopup: vi.fn(),
  requestChatSync: vi.fn(),
  topupHandler: null,
  tokenGet: vi.fn(),
  profileFetch: vi.fn(),
  bootstrap: {
    bookingId: "booking_123",
    creatorId: 1407,
    fanId: null,
    userRole: "creator",
    apiBaseUrl: "https://api.example.test",
    hostViewportWidth: null,
  },
}));

vi.mock("@/services/flow-system/FlowHandler.js", () => ({
  default: { run: mocks.flowRun },
}));

vi.mock("@/embeds/events/bootstrap.js", () => ({
  useEventsEmbedBootstrap: () => mocks.bootstrap,
}));

vi.mock("@/embeds/events/bridge.js", () => ({
  notifyBookingDetailsReady: mocks.notifyReady,
  notifyBookingDetailsUpdated: mocks.notifyUpdated,
  notifyBookingDetailsDecisionVisibility: mocks.notifyDecisionVisibility,
  requestBookingDetailsClose: mocks.requestClose,
  requestEventsEmbedOpenUrl: mocks.requestOpenUrl,
  requestBookingDetailsTopup: mocks.requestTopup,
  installBookingDetailsTopupListener: mocks.installTopup,
  requestBookingChatSync: mocks.requestChatSync,
}));

vi.mock("@/utils/TokenHandler.js", () => ({
  default: { get: mocks.tokenGet },
}));

vi.mock("@/services/users/userProfileApi.js", () => ({
  fetchUserProfileData: mocks.profileFetch,
}));

vi.mock("@/i18n/bookingTranslations.js", () => ({
  useBookingTranslations: () => ({ t: (key) => key }),
}));

vi.mock("@/utils/toastBus.js", () => ({ showToast: vi.fn() }));

const FanDetailsStub = {
  name: "BookingDetailsPopup",
  props: ["modelValue", "event", "booking", "presentation", "layoutVariant", "actionLoading", "userRole", "canReviewPending", "bookingMessage"],
  emits: ["cancel-booking", "close", "join-call", "open-chat", "accept-adjustment", "decline-adjustment", "approve-booking", "reject-booking", "adjust-booking", "decision-visibility"],
  template: "<div data-test='fan-details-stub' />",
};

const AdjustmentDecisionStub = {
  name: "BookingAdjustmentDecisionPopup",
  props: ["modelValue", "mode", "originalTokens", "proposedTokens", "walletBalance", "sessionRefundTokens", "bookingFeeTokens", "cancellationFeeTokens", "creatorUsername", "creatorName", "eventTitle", "actorRole", "fanUsername", "netRefundTokens", "balanceLoading", "balanceError", "processing"],
  emits: ["update:modelValue", "confirm", "retry-balance", "close"],
  template: "<div v-if='modelValue' data-test='adjustment-decision-stub' />",
};

const pageStubs = {
  BookingDetailsPopup: FanDetailsStub,
  BookingAdjustmentDecisionPopup: AdjustmentDecisionStub,
  ToastHost: true,
};

describe("EventsEmbedBookingDetailsPage", () => {
  beforeEach(() => {
    mocks.flowRun.mockReset();
    mocks.notifyReady.mockReset();
    mocks.notifyUpdated.mockReset();
    mocks.notifyDecisionVisibility.mockReset();
    mocks.requestClose.mockReset();
    mocks.requestTopup.mockReset();
    mocks.tokenGet.mockReset();
    mocks.tokenGet.mockResolvedValue(1000);
    mocks.profileFetch.mockReset();
    mocks.profileFetch.mockResolvedValue(null);
    mocks.topupHandler = null;
    mocks.installTopup.mockReset();
    mocks.installTopup.mockImplementation((handler) => {
      mocks.topupHandler = handler;
      return vi.fn();
    });
    mocks.bootstrap.userRole = "creator";
    mocks.bootstrap.initialAction = "";
    mocks.bootstrap.creatorId = 1407;
    mocks.bootstrap.fanId = null;
    mocks.bootstrap.hostViewportWidth = null;
    mocks.flowRun.mockResolvedValue({
      ok: true,
      data: {
        item: {
          bookingId: "booking_123",
          eventId: "event_123",
          creatorId: 1407,
          userId: 25,
          eventTitle: "Validation call",
          eventType: "private-event",
          eventCallType: "video",
          status: "pending",
          startAtIso: "2026-08-14T10:00:00Z",
          endAtIso: "2026-08-14T10:10:00Z",
          meta: { chatId: "chat_1", bookingMessageId: "message_1" },
        },
      },
    });
  });

  it("opens a fan direct cancellation decision without rendering the details drawer", async () => {
    mocks.bootstrap.userRole = "fan";
    mocks.bootstrap.initialAction = "cancel";
    mocks.bootstrap.creatorId = null;
    mocks.bootstrap.fanId = 25;

    const { default: Page } = await import("@/embeds/events/pages/EventsEmbedBookingDetailsPage.vue");
    const wrapper = mount(Page, { global: { stubs: pageStubs } });
    await flushPromises();

    expect(wrapper.findComponent(FanDetailsStub).exists()).toBe(false);
    const decision = wrapper.getComponent(AdjustmentDecisionStub);
    expect(decision.props("modelValue")).toBe(true);
    expect(decision.props("mode")).toBe("cancel");
    expect(mocks.flowRun).not.toHaveBeenCalledWith("bookings.cancelBooking", expect.anything(), expect.anything());

    decision.vm.$emit("close");
    await flushPromises();
    expect(mocks.requestClose).toHaveBeenCalledWith({ bookingId: "booking_123" });
  });

  it("fetches the exact booking and renders it in side-panel mode", async () => {
    const { default: Page } = await import("@/embeds/events/pages/EventsEmbedBookingDetailsPage.vue");
    const wrapper = mount(Page, {
      global: {
        stubs: pageStubs,
      },
    });
    await flushPromises();

    expect(mocks.flowRun).toHaveBeenCalledWith(
      "bookings.fetchBooking",
      { bookingId: "booking_123" },
      expect.objectContaining({ apiBaseUrl: "https://api.example.test" }),
    );
    const details = wrapper.getComponent(FanDetailsStub);
    expect(details.props("presentation")).toBe("side-panel");
    expect(details.props("event")).toEqual(expect.objectContaining({
      bookingId: "booking_123",
      eventId: "event_123",
      start: "2026-08-14T10:00:00Z",
    }));
    expect(mocks.notifyReady).toHaveBeenCalledWith({ bookingId: "booking_123", ok: true });
  });

  it("hands the detail popup the linked chat message", async () => {
    const { default: Page } = await import("@/embeds/events/pages/EventsEmbedBookingDetailsPage.vue");
    const wrapper = mount(Page, { global: { stubs: pageStubs } });
    await flushPromises();

    // No chat embed on the page, so this is the message rebuilt from booking meta.
    expect(wrapper.getComponent(FanDetailsStub).props("bookingMessage")).toEqual(expect.objectContaining({
      message_id: "message_1",
      chat_id: "chat_1",
      content_type: "booking_request",
    }));
  });

  it("prefers the real chat message when a chat embed is mounted", async () => {
    const real = { message_id: "message_1", chat_id: "chat_1", content: { booking_id: "booking_123", action: "counter_offer" } };
    Object.defineProperty(window, "parent", {
      configurable: true,
      value: { chatEmbed: { getMessage: vi.fn().mockResolvedValue({ item: real }) } },
    });

    const { default: Page } = await import("@/embeds/events/pages/EventsEmbedBookingDetailsPage.vue");
    const wrapper = mount(Page, { global: { stubs: pageStubs } });
    await flushPromises();

    // `content.action` is the field the synthetic message cannot carry.
    expect(wrapper.getComponent(FanDetailsStub).props("bookingMessage")).toEqual(real);
    Reflect.deleteProperty(window, "parent");
  });

  it("uses the compact bottom dialog for a creator review on a mobile WordPress viewport", async () => {
    mocks.bootstrap.hostViewportWidth = 390;
    mocks.flowRun.mockResolvedValueOnce({
      ok: true,
      data: {
        item: {
          bookingId: "booking_mobile_pending",
          eventId: "event_mobile_pending",
          creatorId: 1407,
          userId: 25,
          eventTitle: "Mobile review",
          status: "pending",
          startAtIso: "2027-08-14T10:00:00Z",
          endAtIso: "2027-08-14T10:10:00Z",
          meta: { chatId: "chat_1", bookingMessageId: "message_1" },
        },
      },
    });

    const { default: Page } = await import("@/embeds/events/pages/EventsEmbedBookingDetailsPage.vue");
    const wrapper = mount(Page, { global: { stubs: pageStubs } });
    await flushPromises();

    const details = wrapper.getComponent(FanDetailsStub);
    expect(details.props("layoutVariant")).toBe("compact");
    expect(details.props("presentation")).toBe("responsive-dialog");
    expect(details.props("modelValue")).toBe(true);
  });

  it("keeps a mobile creator compact review mounted after approval and retains the host iframe", async () => {
    mocks.bootstrap.hostViewportWidth = 390;
    mocks.flowRun.mockResolvedValueOnce({
      ok: true,
      data: {
        item: {
          bookingId: "booking_mobile_retained",
          eventId: "event_mobile_retained",
          creatorId: 1407,
          userId: 25,
          status: "pending",
          startAtIso: "2027-08-14T10:00:00Z",
          endAtIso: "2027-08-14T10:10:00Z",
          meta: { chatId: "chat_1", bookingMessageId: "message_1" },
        },
      },
    });

    const { default: Page } = await import("@/embeds/events/pages/EventsEmbedBookingDetailsPage.vue");
    const wrapper = mount(Page, { global: { stubs: pageStubs } });
    await flushPromises();

    mocks.flowRun.mockResolvedValueOnce({
      ok: true,
      data: {
        item: {
          bookingId: "booking_mobile_retained",
          eventId: "event_mobile_retained",
          creatorId: 1407,
          userId: 25,
          status: "confirmed",
          startAtIso: "2027-08-14T10:00:00Z",
          endAtIso: "2027-08-14T10:10:00Z",
        },
      },
    });

    wrapper.getComponent(FanDetailsStub).vm.$emit("approve-booking", {
      bookingId: "booking_mobile_retained",
      counterparty: { username: "grapegatsby", avatarUrl: "https://example.test/fan.jpg" },
    });
    await flushPromises();

    const retainedDetails = wrapper.getComponent(FanDetailsStub);
    expect(retainedDetails.props("layoutVariant")).toBe("compact");
    expect(retainedDetails.props("modelValue")).toBe(true);
    expect(retainedDetails.props("booking")).toEqual(expect.objectContaining({ status: "confirmed" }));
    expect(mocks.notifyUpdated).toHaveBeenCalledWith(expect.objectContaining({
      action: "approve",
      retainOpen: true,
      notification: expect.objectContaining({
        fanUsername: "grapegatsby",
        fanAvatarUrl: "https://example.test/fan.jpg",
      }),
    }));
    expect(mocks.requestClose).not.toHaveBeenCalled();
  });

  it("keeps mobile creator counteroffers in the hero drawer", async () => {
    mocks.bootstrap.hostViewportWidth = 390;
    mocks.flowRun.mockResolvedValueOnce({
      ok: true,
      data: {
        item: {
          bookingId: "booking_mobile_counteroffer",
          eventId: "event_mobile_counteroffer",
          creatorId: 1407,
          userId: 25,
          eventTitle: "Mobile counteroffer",
          status: "pending",
          startAtIso: "2027-08-14T10:00:00Z",
          endAtIso: "2027-08-14T10:10:00Z",
          meta: {
            currentCounterOffer: "adjust",
            negotiation: { type: "adjust", status: "sent", actor: "creator" },
          },
        },
      },
    });

    const { default: Page } = await import("@/embeds/events/pages/EventsEmbedBookingDetailsPage.vue");
    const wrapper = mount(Page, { global: { stubs: pageStubs } });
    await flushPromises();

    const details = wrapper.getComponent(FanDetailsStub);
    expect(details.props("layoutVariant")).toBeUndefined();
    expect(details.props("presentation")).toBe("side-panel");
  });

  it("runs creator approval and notifies the host only on success", async () => {
    const { default: Page } = await import("@/embeds/events/pages/EventsEmbedBookingDetailsPage.vue");
    const wrapper = mount(Page, {
      global: {
        stubs: pageStubs,
      },
    });
    await flushPromises();
    mocks.flowRun.mockResolvedValueOnce({ ok: true, data: { item: { status: "confirmed" } } });

    wrapper.getComponent(FanDetailsStub).vm.$emit("approve-booking", { bookingId: "booking_123" });
    await flushPromises();

    expect(mocks.flowRun).toHaveBeenCalledWith(
      "bookings.reviewPendingBooking",
      expect.objectContaining({ bookingId: "booking_123", decision: "approve", actor: "creator" }),
      expect.any(Object),
    );
    expect(mocks.notifyUpdated).toHaveBeenCalledWith(expect.objectContaining({
      bookingId: "booking_123",
      action: "approve",
    }));
    // The chat message is mirrored and handed to the chat embed to broadcast.
    expect(mocks.flowRun).toHaveBeenCalledWith(
      "chat.updateBookingRequestMessage",
      expect.objectContaining({ chatId: "chat_1", messageId: "message_1", action: "accepted" }),
      expect.any(Object),
    );
    expect(mocks.requestChatSync).toHaveBeenCalledWith(expect.objectContaining({
      chatId: "chat_1",
      bookingId: "booking_123",
      activityLog: expect.objectContaining({ text: "Booking accepted" }),
    }));
  });

  it("forwards the embedded reject decision visibility to the WordPress host", async () => {
    const { default: Page } = await import("@/embeds/events/pages/EventsEmbedBookingDetailsPage.vue");
    const wrapper = mount(Page, { global: { stubs: pageStubs } });
    await flushPromises();

    const details = wrapper.getComponent(FanDetailsStub);
    details.vm.$emit("decision-visibility", true);
    await flushPromises();
    expect(mocks.notifyDecisionVisibility).toHaveBeenLastCalledWith(true);

    details.vm.$emit("decision-visibility", false);
    await flushPromises();
    expect(mocks.notifyDecisionVisibility).toHaveBeenLastCalledWith(false);
  });

  it("renders an error state and leaves the panel open when fetch fails", async () => {
    mocks.flowRun.mockResolvedValueOnce({ ok: false, error: { message: "Not found" } });
    const { default: Page } = await import("@/embeds/events/pages/EventsEmbedBookingDetailsPage.vue");
    const wrapper = mount(Page, {
      global: {
        stubs: pageStubs,
      },
    });
    await flushPromises();

    expect(wrapper.get("[data-test='booking-details-error']").text()).toContain("Not found");
    expect(mocks.notifyReady).toHaveBeenCalledWith({ bookingId: "booking_123", ok: false });
    expect(mocks.requestClose).not.toHaveBeenCalled();
  });

  it("renders the fan details panel and accepts an adjusted price", async () => {
    mocks.bootstrap.userRole = "fan";
    mocks.bootstrap.creatorId = null;
    mocks.bootstrap.fanId = 25;
    const { default: Page } = await import("@/embeds/events/pages/EventsEmbedBookingDetailsPage.vue");
    const wrapper = mount(Page, {
      global: { stubs: pageStubs },
    });
    await flushPromises();

    const details = wrapper.getComponent(FanDetailsStub);
    expect(details.props("presentation")).toBe("side-panel");
    details.vm.$emit("accept-adjustment", {
      originalTokens: 100,
      proposedTokens: 120,
      negotiationId: "neg_1",
      proposedStartAtIso: "2026-08-14T11:00:00Z",
      proposedDurationMinutes: 20,
      remarks: "Updated",
    });
    await flushPromises();

    expect(mocks.flowRun).not.toHaveBeenCalledWith("bookings.renegotiateBooking", expect.anything(), expect.anything());
    const decision = wrapper.getComponent(AdjustmentDecisionStub);
    expect(decision.props("modelValue")).toBe(true);
    expect(decision.props("mode")).toBe("accept");
    expect(decision.props("walletBalance")).toBe(1000);
    expect(mocks.notifyDecisionVisibility).toHaveBeenLastCalledWith(true);
    expect(wrapper.get("[data-test='events-embed-booking-details-page']").classes()).toContain("bg-transparent");
    expect(wrapper.get("[data-test='booking-details-fan-surface']").classes()).toContain("booking-details-fan-surface");
    decision.vm.$emit("confirm", { mode: "accept", requiresTopup: false, shortfallTokens: 0 });
    await flushPromises();

    expect(mocks.flowRun).toHaveBeenCalledWith("bookings.renegotiateBooking", expect.objectContaining({
      bookingId: "booking_123",
      costTokens: 120,
      actor: "user",
    }), expect.any(Object));
    expect(mocks.flowRun).toHaveBeenCalledWith("bookings.reviewPendingBooking", expect.objectContaining({
      decision: "approve",
      actor: "fan",
    }), expect.any(Object));
    expect(mocks.flowRun).toHaveBeenCalledWith("chat.updateBookingRequestMessage", expect.objectContaining({ action: "accepted" }), expect.any(Object));
    expect(mocks.notifyUpdated).toHaveBeenCalledWith(expect.objectContaining({
      action: "accept_adjustment",
      notification: expect.objectContaining({
        startAtIso: "2026-08-14T10:00:00Z",
        endAtIso: "2026-08-14T10:10:00Z",
      }),
    }));
    expect(decision.props("modelValue")).toBe(false);
    expect(mocks.notifyDecisionVisibility).toHaveBeenLastCalledWith(false);
  });

  it("opens the fee-aware cancel decision before running an ordinary fan cancellation", async () => {
    mocks.bootstrap.userRole = "fan";
    mocks.bootstrap.creatorId = null;
    mocks.bootstrap.fanId = 25;
    mocks.flowRun.mockResolvedValueOnce({
      ok: true,
      data: {
        item: {
          bookingId: "booking_123",
          eventId: "event_123",
          creatorId: 1407,
          creatorUsername: "creator_direct",
          userId: 25,
          eventTitle: "Validation call",
          status: "confirmed",
          startAtIso: "2027-08-14T10:00:00Z",
          endAtIso: "2027-08-14T10:10:00Z",
          payment: {
            total: 1020,
            paymentPolicyVersion: 2,
            allocations: { service: 900, bookingFee: 20, cancellationFee: 100 },
          },
          eventSnapshot: { enableCancellationFee: true, cancellationFeeTokens: 100 },
          meta: {},
        },
      },
    });
    const { default: Page } = await import("@/embeds/events/pages/EventsEmbedBookingDetailsPage.vue");
    const wrapper = mount(Page, { global: { stubs: pageStubs } });
    await flushPromises();

    wrapper.getComponent(FanDetailsStub).vm.$emit("cancel-booking", { bookingId: "booking_123" });
    await flushPromises();
    const decision = wrapper.getComponent(AdjustmentDecisionStub);

    expect(decision.props("modelValue")).toBe(true);
    expect(decision.props("mode")).toBe("cancel");
    expect(decision.props("creatorUsername")).toBe("creator_direct");
    expect(decision.props("walletBalance")).toBe(1000);
    expect(decision.props("sessionRefundTokens")).toBe(1020);
    expect(decision.props("bookingFeeTokens")).toBe(20);
    expect(decision.props("cancellationFeeTokens")).toBe(100);
    expect(wrapper.find("[data-test='booking-details-cancel-confirm']").exists()).toBe(false);
    expect(mocks.profileFetch).not.toHaveBeenCalled();
    expect(mocks.flowRun).not.toHaveBeenCalledWith("bookings.cancelBooking", expect.anything(), expect.anything());

    mocks.flowRun.mockResolvedValueOnce({
      ok: true,
      data: { item: { status: "cancelled", paymentStatus: "partial_refunded" } },
    });
    decision.vm.$emit("confirm", { mode: "cancel", requiresTopup: false, shortfallTokens: 0 });
    await flushPromises();

    expect(mocks.flowRun).toHaveBeenCalledWith("bookings.cancelBooking", {
      bookingId: "booking_123",
      actor: "fan",
      intent: "normal",
      reason: "fan_cancelled_from_order_details",
    }, expect.any(Object));
    expect(mocks.notifyUpdated).toHaveBeenCalledWith(expect.objectContaining({
      bookingId: "booking_123",
      action: "cancel",
      notification: expect.objectContaining({
        creatorUsername: "creator_direct",
        startAtIso: "2027-08-14T10:00:00Z",
        endAtIso: "2027-08-14T10:10:00Z",
        refundState: "partial",
      }),
    }));
    expect(decision.props("modelValue")).toBe(false);
  });

  it("fetches a missing creator username for cancellation headings", async () => {
    mocks.bootstrap.userRole = "fan";
    mocks.bootstrap.creatorId = null;
    mocks.bootstrap.fanId = 25;
    mocks.profileFetch.mockResolvedValue({ username: "fetched_creator" });
    const { default: Page } = await import("@/embeds/events/pages/EventsEmbedBookingDetailsPage.vue");
    const wrapper = mount(Page, { global: { stubs: pageStubs } });
    await flushPromises();

    expect(mocks.profileFetch).toHaveBeenCalledWith(1407, expect.objectContaining({ signal: expect.any(AbortSignal) }));
    wrapper.getComponent(FanDetailsStub).vm.$emit("cancel-booking", { bookingId: "booking_123" });
    await flushPromises();

    expect(wrapper.getComponent(AdjustmentDecisionStub).props("creatorUsername")).toBe("fetched_creator");
  });

  it("replaces a generic User #ID fan label with the profile username", async () => {
    mocks.profileFetch.mockResolvedValue({ username: "fetched_fan" });
    mocks.flowRun.mockResolvedValueOnce({
      ok: true,
      data: {
        item: {
          bookingId: "booking_123",
          eventId: "event_123",
          creatorId: 1407,
          userId: 25,
          username: "User #25",
          eventTitle: "Validation call",
          status: "confirmed",
          startAtIso: "2027-08-14T10:00:00Z",
          endAtIso: "2027-08-14T10:10:00Z",
          payment: { total: 100 },
          meta: {},
        },
      },
    });
    const { default: Page } = await import("@/embeds/events/pages/EventsEmbedBookingDetailsPage.vue");
    const wrapper = mount(Page, { global: { stubs: pageStubs } });
    await flushPromises();

    expect(mocks.profileFetch).toHaveBeenCalledWith(25, expect.objectContaining({ signal: expect.any(AbortSignal) }));
    wrapper.getComponent(FanDetailsStub).vm.$emit("cancel-booking", { bookingId: "booking_123" });
    await flushPromises();

    expect(wrapper.getComponent(AdjustmentDecisionStub).props("fanUsername")).toBe("fetched_fan");
  });

  it("falls back to the stored creator display name when username lookup fails", async () => {
    mocks.bootstrap.userRole = "fan";
    mocks.bootstrap.creatorId = null;
    mocks.bootstrap.fanId = 25;
    mocks.profileFetch.mockRejectedValue(new Error("Profile unavailable"));
    mocks.flowRun.mockResolvedValueOnce({
      ok: true,
      data: {
        item: {
          bookingId: "booking_123",
          eventId: "event_123",
          creatorId: 1407,
          creatorDisplayName: "Fallback Creator",
          userId: 25,
          status: "confirmed",
          startAtIso: "2027-08-14T10:00:00Z",
          endAtIso: "2027-08-14T10:10:00Z",
          meta: {},
        },
      },
    });
    const { default: Page } = await import("@/embeds/events/pages/EventsEmbedBookingDetailsPage.vue");
    const wrapper = mount(Page, { global: { stubs: pageStubs } });
    await flushPromises();

    wrapper.getComponent(FanDetailsStub).vm.$emit("cancel-booking", { bookingId: "booking_123" });
    await flushPromises();

    const decision = wrapper.getComponent(AdjustmentDecisionStub);
    expect(decision.props("modelValue")).toBe(true);
    expect(decision.props("creatorUsername")).toBe("Fallback Creator");
    expect(mocks.flowRun).not.toHaveBeenCalledWith("bookings.cancelBooking", expect.anything(), expect.anything());
  });

  it("keeps the fan cancel decision open with feedback when ordinary cancellation fails", async () => {
    mocks.bootstrap.userRole = "fan";
    mocks.bootstrap.creatorId = null;
    mocks.bootstrap.fanId = 25;
    const { default: Page } = await import("@/embeds/events/pages/EventsEmbedBookingDetailsPage.vue");
    const wrapper = mount(Page, { global: { stubs: pageStubs } });
    await flushPromises();

    wrapper.getComponent(FanDetailsStub).vm.$emit("cancel-booking", { bookingId: "booking_123" });
    await flushPromises();
    const decision = wrapper.getComponent(AdjustmentDecisionStub);
    mocks.flowRun.mockResolvedValueOnce({ ok: false, error: { message: "Cancellation unavailable" } });
    decision.vm.$emit("confirm", { mode: "cancel", requiresTopup: false, shortfallTokens: 0 });
    await flushPromises();

    expect(decision.props("modelValue")).toBe(true);
    expect(decision.props("balanceError")).toBe("Cancellation unavailable");
    expect(mocks.notifyUpdated).not.toHaveBeenCalled();
  });

  it("opens the shared creator cancellation decision", async () => {
    const { default: Page } = await import("@/embeds/events/pages/EventsEmbedBookingDetailsPage.vue");
    const wrapper = mount(Page, { global: { stubs: pageStubs } });
    await flushPromises();

    wrapper.getComponent(FanDetailsStub).vm.$emit("cancel-booking", { bookingId: "booking_123" });
    await flushPromises();

    expect(wrapper.find("[data-test='booking-details-cancel-confirm']").exists()).toBe(false);
    expect(wrapper.getComponent(AdjustmentDecisionStub).props("modelValue")).toBe(true);
    expect(wrapper.getComponent(AdjustmentDecisionStub).props("mode")).toBe("cancel");
    expect(wrapper.getComponent(AdjustmentDecisionStub).props("actorRole")).toBe("creator");
    expect(wrapper.get("[data-test='events-embed-booking-details-page']").classes()).toContain("bg-transparent");
    expect(wrapper.get("[data-test='events-embed-booking-details-page']").classes()).not.toContain("bg-gray-50");
  });

  it("keeps the fan drawer constrained while the host processes decision popup closure", async () => {
    mocks.bootstrap.userRole = "fan";
    mocks.bootstrap.creatorId = null;
    mocks.bootstrap.fanId = 25;
    const { default: Page } = await import("@/embeds/events/pages/EventsEmbedBookingDetailsPage.vue");
    const wrapper = mount(Page, { global: { stubs: pageStubs } });
    await flushPromises();

    wrapper.getComponent(FanDetailsStub).vm.$emit("accept-adjustment", { originalTokens: 100, proposedTokens: 120, negotiationId: "neg_1" });
    await flushPromises();
    const fanSurface = wrapper.get("[data-test='booking-details-fan-surface']");
    expect(fanSurface.classes()).toContain("booking-details-fan-surface");
    expect(fanSurface.classes()).not.toContain("w-full");
    expect(wrapper.get("[data-test='events-embed-booking-details-page']").classes()).toContain("bg-transparent");

    const decision = wrapper.getComponent(AdjustmentDecisionStub);
    decision.vm.$emit("update:modelValue", false);
    decision.vm.$emit("close");
    await flushPromises();

    expect(mocks.notifyDecisionVisibility).toHaveBeenLastCalledWith(false);
    expect(wrapper.get("[data-test='events-embed-booking-details-page']").classes()).toContain("bg-transparent");
    expect(fanSurface.classes()).toContain("booking-details-fan-surface");
    expect(fanSurface.classes()).not.toContain("w-full");

    wrapper.unmount();
    expect(mocks.notifyDecisionVisibility).toHaveBeenLastCalledWith(false);
  });

  it("requests the token shortfall and resumes acceptance after top-up", async () => {
    mocks.bootstrap.userRole = "fan";
    mocks.bootstrap.creatorId = null;
    mocks.bootstrap.fanId = 25;
    mocks.tokenGet.mockResolvedValue(5);
    const { default: Page } = await import("@/embeds/events/pages/EventsEmbedBookingDetailsPage.vue");
    const wrapper = mount(Page, {
      global: { stubs: pageStubs },
    });
    await flushPromises();

    wrapper.getComponent(FanDetailsStub).vm.$emit("accept-adjustment", { originalTokens: 100, proposedTokens: 120, negotiationId: "neg_1" });
    await flushPromises();
    expect(mocks.requestTopup).not.toHaveBeenCalled();
    wrapper.getComponent(AdjustmentDecisionStub).vm.$emit("confirm", { mode: "accept", requiresTopup: true, shortfallTokens: 15 });
    await flushPromises();
    expect(mocks.requestTopup).toHaveBeenCalledWith(expect.objectContaining({ requiredTokens: 15 }));

    mocks.topupHandler({ ok: true, payload: { bookingId: "booking_123" } });
    await flushPromises();
    expect(mocks.notifyUpdated).toHaveBeenCalledWith(expect.objectContaining({ action: "accept_adjustment" }));
  });

  it("keeps the decision popup open with feedback when top-up fails", async () => {
    mocks.bootstrap.userRole = "fan";
    mocks.bootstrap.creatorId = null;
    mocks.bootstrap.fanId = 25;
    mocks.tokenGet.mockResolvedValue(5);
    const { default: Page } = await import("@/embeds/events/pages/EventsEmbedBookingDetailsPage.vue");
    const wrapper = mount(Page, { global: { stubs: pageStubs } });
    await flushPromises();

    wrapper.getComponent(FanDetailsStub).vm.$emit("accept-adjustment", { originalTokens: 100, proposedTokens: 120, negotiationId: "neg_1" });
    await flushPromises();
    wrapper.getComponent(AdjustmentDecisionStub).vm.$emit("confirm", { mode: "accept", requiresTopup: true, shortfallTokens: 15 });
    await flushPromises();
    mocks.topupHandler({ ok: false, payload: { bookingId: "booking_123" } });
    await flushPromises();

    const decision = wrapper.getComponent(AdjustmentDecisionStub);
    expect(decision.props("modelValue")).toBe(true);
    expect(decision.props("processing")).toBe(false);
    expect(decision.props("balanceError")).toBe("fan_event_details_topup_failed");
    expect(mocks.notifyUpdated).not.toHaveBeenCalled();
  });

  it("confirms before declining an adjustment and cancels with negotiation intent", async () => {
    mocks.bootstrap.userRole = "fan";
    mocks.bootstrap.creatorId = null;
    mocks.bootstrap.fanId = 25;
    const { default: Page } = await import("@/embeds/events/pages/EventsEmbedBookingDetailsPage.vue");
    const wrapper = mount(Page, {
      global: { stubs: pageStubs },
    });
    await flushPromises();

    wrapper.getComponent(FanDetailsStub).vm.$emit("decline-adjustment", { negotiationId: "neg_1" });
    await flushPromises();
    expect(mocks.flowRun).not.toHaveBeenCalledWith("bookings.cancelBooking", expect.anything(), expect.anything());
    const decision = wrapper.getComponent(AdjustmentDecisionStub);
    expect(decision.props("modelValue")).toBe(true);
    expect(decision.props("mode")).toBe("decline");
    decision.vm.$emit("confirm", { mode: "decline", requiresTopup: false, shortfallTokens: 0 });
    await flushPromises();

    expect(mocks.flowRun).toHaveBeenCalledWith("bookings.cancelBooking", expect.objectContaining({
      actor: "user",
      intent: "decline_renegotiation",
      args: { negotiation: expect.objectContaining({ status: "declined", type: "adjust", negotiationId: "neg_1" }) },
    }), expect.any(Object));
    expect(mocks.flowRun).toHaveBeenCalledWith("chat.updateBookingRequestMessage", expect.objectContaining({ action: "declined" }), expect.any(Object));
    expect(mocks.notifyUpdated).toHaveBeenCalledWith(expect.objectContaining({
      action: "decline_adjustment",
      notification: expect.objectContaining({ startAtIso: "2026-08-14T10:00:00Z" }),
    }));
    expect(decision.props("modelValue")).toBe(false);
  });

  it("projects the confirmed booking cancellation allocation in the decline popup", async () => {
    mocks.bootstrap.userRole = "fan";
    mocks.bootstrap.creatorId = null;
    mocks.bootstrap.fanId = 25;
    mocks.tokenGet.mockResolvedValue(30000);
    mocks.flowRun.mockResolvedValueOnce({
      ok: true,
      data: {
        item: {
          bookingId: "booking_123",
          eventId: "event_123",
          creatorId: 1407,
          userId: 25,
          creatorName: "Miu Miu",
          eventTitle: "Cows of Lantau",
          status: "confirmed",
          startAtIso: "2027-08-14T10:00:00Z",
          endAtIso: "2027-08-14T10:10:00Z",
          payment: {
            total: 1000,
            allocations: { service: 900, bookingFee: 0, cancellationFee: 100 },
          },
          eventSnapshot: { enableCancellationFee: true, cancellationFeeTokens: 100 },
          meta: {},
        },
      },
    });
    const { default: Page } = await import("@/embeds/events/pages/EventsEmbedBookingDetailsPage.vue");
    const wrapper = mount(Page, { global: { stubs: pageStubs } });
    await flushPromises();

    wrapper.getComponent(FanDetailsStub).vm.$emit("decline-adjustment", { originalTokens: 1000, proposedTokens: 1335, negotiationId: "neg_1" });
    await flushPromises();
    const decision = wrapper.getComponent(AdjustmentDecisionStub);

    expect(decision.props("walletBalance")).toBe(30000);
    expect(decision.props("sessionRefundTokens")).toBe(1000);
    expect(decision.props("bookingFeeTokens")).toBe(0);
    expect(decision.props("cancellationFeeTokens")).toBe(100);
    expect(decision.props("creatorName")).toBe("Miu Miu");
    expect(decision.props("eventTitle")).toBe("Cows of Lantau");
  });

  it("projects all pending Adjust allocations as gross refund with booking and cancellation fees separate", async () => {
    mocks.bootstrap.userRole = "fan";
    mocks.bootstrap.creatorId = null;
    mocks.bootstrap.fanId = 25;
    mocks.tokenGet.mockResolvedValue(30000);
    mocks.flowRun.mockResolvedValueOnce({
      ok: true,
      data: {
        item: {
          bookingId: "booking_123",
          eventId: "event_123",
          creatorId: 1407,
          userId: 25,
          status: "pending",
          startAtIso: "2027-08-14T10:00:00Z",
          endAtIso: "2027-08-14T10:10:00Z",
          payment: {
            total: 1020,
            paymentPolicyVersion: 2,
            allocations: { service: 900, bookingFee: 20, cancellationFee: 100 },
          },
          eventSnapshot: { enableCancellationFee: true, cancellationFeeTokens: 100 },
          meta: {},
        },
      },
    });
    const { default: Page } = await import("@/embeds/events/pages/EventsEmbedBookingDetailsPage.vue");
    const wrapper = mount(Page, { global: { stubs: pageStubs } });
    await flushPromises();

    wrapper.getComponent(FanDetailsStub).vm.$emit("decline-adjustment", { originalTokens: 900, proposedTokens: 1000, negotiationId: "neg_1" });
    await flushPromises();
    const decision = wrapper.getComponent(AdjustmentDecisionStub);

    expect(decision.props("sessionRefundTokens")).toBe(1020);
    expect(decision.props("bookingFeeTokens")).toBe(20);
    expect(decision.props("cancellationFeeTokens")).toBe(100);
  });

  it("falls back to configured cancellation fees when legacy allocations are missing", async () => {
    mocks.bootstrap.userRole = "fan";
    mocks.bootstrap.creatorId = null;
    mocks.bootstrap.fanId = 25;
    mocks.flowRun.mockResolvedValueOnce({
      ok: true,
      data: {
        item: {
          bookingId: "booking_123",
          eventId: "event_123",
          creatorId: 1407,
          userId: 25,
          status: "pending_hold",
          startAtIso: "2027-08-14T10:00:00Z",
          endAtIso: "2027-08-14T10:10:00Z",
          payment: { total: 1110, lines: [{ code: "booking_fee", amount: 10 }] },
          eventSnapshot: { enableCancellationFee: true, cancellationFeeTokens: 100 },
          meta: {},
        },
      },
    });
    const { default: Page } = await import("@/embeds/events/pages/EventsEmbedBookingDetailsPage.vue");
    const wrapper = mount(Page, { global: { stubs: pageStubs } });
    await flushPromises();

    wrapper.getComponent(FanDetailsStub).vm.$emit("decline-adjustment", { negotiationId: "neg_legacy" });
    await flushPromises();
    const decision = wrapper.getComponent(AdjustmentDecisionStub);

    expect(decision.props("sessionRefundTokens")).toBe(1110);
    expect(decision.props("bookingFeeTokens")).toBe(10);
    expect(decision.props("cancellationFeeTokens")).toBe(100);
  });

  it("uses enabled event booking-fee configuration only when payment data has no fee allocation or line", async () => {
    mocks.bootstrap.userRole = "fan";
    mocks.bootstrap.creatorId = null;
    mocks.bootstrap.fanId = 25;
    mocks.flowRun.mockResolvedValueOnce({
      ok: true,
      data: {
        item: {
          bookingId: "booking_123",
          eventId: "event_123",
          creatorId: 1407,
          userId: 25,
          status: "pending",
          startAtIso: "2027-08-14T10:00:00Z",
          endAtIso: "2027-08-14T10:10:00Z",
          payment: { total: 925 },
          eventSnapshot: { enableBookingFee: true, bookingFeeTokens: 25 },
          meta: {},
        },
      },
    });
    const { default: Page } = await import("@/embeds/events/pages/EventsEmbedBookingDetailsPage.vue");
    const wrapper = mount(Page, { global: { stubs: pageStubs } });
    await flushPromises();

    wrapper.getComponent(FanDetailsStub).vm.$emit("decline-adjustment", { negotiationId: "neg_configured_booking_fee" });
    await flushPromises();
    const decision = wrapper.getComponent(AdjustmentDecisionStub);

    expect(decision.props("sessionRefundTokens")).toBe(925);
    expect(decision.props("bookingFeeTokens")).toBe(25);
    expect(decision.props("cancellationFeeTokens")).toBe(0);
  });

  it("waives the cancellation deduction while retaining the gross refundable allocation", async () => {
    mocks.bootstrap.userRole = "fan";
    mocks.bootstrap.creatorId = null;
    mocks.bootstrap.fanId = 25;
    mocks.flowRun.mockResolvedValueOnce({
      ok: true,
      data: {
        item: {
          bookingId: "booking_123",
          eventId: "event_123",
          creatorId: 1407,
          userId: 25,
          status: "pending",
          startAtIso: "2027-08-14T10:00:00Z",
          endAtIso: "2027-08-14T10:10:00Z",
          payment: {
            total: 1000,
            paymentPolicyVersion: 2,
            allocations: { service: 900, bookingFee: 0, cancellationFee: 100 },
          },
          eventSnapshot: {
            enableCancellationFee: true,
            cancellationFeeTokens: 100,
            allowAdvanceCancelToAvoidMinCharge: true,
            advanceCancelWindowQuantity: 1,
            advanceCancelWindowUnit: "hour",
          },
          meta: {},
        },
      },
    });
    const { default: Page } = await import("@/embeds/events/pages/EventsEmbedBookingDetailsPage.vue");
    const wrapper = mount(Page, { global: { stubs: pageStubs } });
    await flushPromises();

    wrapper.getComponent(FanDetailsStub).vm.$emit("decline-adjustment", { negotiationId: "neg_waived" });
    await flushPromises();
    const decision = wrapper.getComponent(AdjustmentDecisionStub);

    expect(decision.props("sessionRefundTokens")).toBe(1000);
    expect(decision.props("bookingFeeTokens")).toBe(0);
    expect(decision.props("cancellationFeeTokens")).toBe(0);
  });
});
