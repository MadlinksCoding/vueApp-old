import { beforeEach, describe, expect, it, vi } from "vitest";

const { showToast } = vi.hoisted(() => ({ showToast: vi.fn() }));

vi.mock("@/utils/toastBus.js", () => ({ showToast }));

import { showFanBookingCancellationToast } from "@/utils/fanBookingCancellationToast.js";

const t = (key, params = {}) => `${key}:${JSON.stringify(params)}`;

describe("showFanBookingCancellationToast", () => {
  beforeEach(() => {
    showToast.mockReset();
  });

  it.each([
    ["refunded", "fan_booking_toast_cancelled_refunded_title", "fan_booking_toast_cancelled_refunded_message"],
    ["partial_refunded", "fan_booking_toast_cancelled_partially_refunded_title", "fan_booking_toast_cancelled_partially_refunded_message"],
    ["captured", "fan_booking_toast_cancelled_title", "fan_booking_toast_cancelled_message"],
  ])("shows a persistent %s cancellation toast", (paymentStatus, titleKey, messageKey) => {
    showFanBookingCancellationToast({
      booking: {
        bookingId: "booking_1",
        creatorUsername: "creator",
        paymentStatus,
      },
      event: {
        start: "2026-08-24T09:15:00.000Z",
        end: "2026-08-24T09:45:00.000Z",
      },
      t,
      locale: "en",
    });

    expect(showToast).toHaveBeenCalledWith(expect.objectContaining({
      title: expect.stringContaining(titleKey),
      message: expect.stringContaining(messageKey),
      persistent: true,
      dedupeKey: "fan-booking-cancelled-booking_1",
    }));
  });

  it("formats the cancellation schedule as DD-MM-YYYY", () => {
    showFanBookingCancellationToast({
      booking: { bookingId: "booking_2", creatorUsername: "creator" },
      event: {
        start: new Date(2026, 7, 24, 15, 5),
        end: new Date(2026, 7, 24, 15, 35),
      },
      t,
      locale: "en",
    });

    expect(showToast.mock.calls[0][0].message).toContain("24-08-2026");
  });

  it('reuses the existing avatar and Detail toast for a group withdrawal', () => {
    const onDetail = vi.fn();
    showFanBookingCancellationToast({ booking: { bookingId: 'group_1', creatorUsername: 'host', creatorAvatarUrl: '/avatar.png',
      eventSnapshot: { type: 'group-event' }, paymentStatus: 'partial_refunded', startAtIso: '2030-01-01T10:00:00Z', endAtIso: '2030-01-01T11:00:00Z' },
      onDetail, t });
    const toast = showToast.mock.calls[0][0];
    expect(toast.variant).toBe('booking-decision');
    expect(toast.title).toContain('cancelled_partially_refunded');
    expect(toast.avatarUrl).toBe('/avatar.png');
    toast.detailAction.run();
    expect(onDetail).toHaveBeenCalledOnce();
  });
});
