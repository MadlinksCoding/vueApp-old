import { describe, expect, it } from "vitest";
import {
  createBookingTranslator,
  formatCreateEventFailureMessage,
  formatCreateEventValidationErrors,
  formatBookingValidationErrors,
  normalizeBookingLocale,
  normalizeBookingTranslations,
} from "@/i18n/bookingTranslations.js";

describe("bookingTranslations", () => {
  it("falls back to English when an override is missing", () => {
    const { t } = createBookingTranslator({
      translations: { common_submit: "Enviar" },
    });

    expect(t("common_submit")).toBe("Enviar");
    expect(t("booking_who_can_book")).toBe("Who can book");
  });

  it("interpolates translated and fallback messages", () => {
    const { t } = createBookingTranslator({
      translations: {
        fan_booking_message_creator: "Mensaje para {creator}",
      },
    });

    expect(t("fan_booking_message_creator", { creator: "Mina" })).toBe("Mensaje para Mina");
    expect(t("dashboard_context_missing", { role: "creator" })).toBe("The events embed will load once a valid creator id is provided.");
  });

  it("drops invalid translation values and normalizes locale", () => {
    expect(normalizeBookingTranslations({
      common_submit: "Enviar",
      common_back: null,
      nested: { value: "Nope" },
      count: 4,
    })).toEqual({ common_submit: "Enviar" });

    expect(normalizeBookingLocale("es-MX")).toBe("es-MX");
    expect(normalizeBookingLocale("")).toBe("en");
  });

  it("uses the key as the last-resort missing-key fallback", () => {
    const { t } = createBookingTranslator();
    expect(t("totally_missing_key")).toBe("totally_missing_key");
  });

  it("formats structured subscriber-only validation errors with tier names", () => {
    const { t } = createBookingTranslator();
    const messages = formatBookingValidationErrors([
      {
        code: "subscription_required",
        translationKey: "fan_booking_validation_subscription_required_tier",
        params: { tier_name: "Tier 1" },
      },
    ], t);

    expect(messages).toEqual(["An active subscription to Tier 1 is required."]);
  });

  it("includes friendly backend create-booking error translations", () => {
    const { t } = createBookingTranslator();
    expect(t("fan_booking_error_user_blocked")).toBe("You are blocked from booking this event.");
    expect(t("fan_booking_error_daily_booking_limit_reached")).toBe("This event has reached its booking limit for that day.");
    expect(t("fan_booking_error_temporary_hold_not_found_or_expired")).toBe("Your reserved slot expired. Please choose the time again.");
    expect(t("fan_booking_error_missing_bearer_token")).toBe("Please log in to complete your booking.");
    expect(t("fan_booking_error_internal_error")).toBe("Could not complete booking. Please try again.");
  });

  it("interpolates expanded booking validation translations", () => {
    const { t } = createBookingTranslator();

    expect(t("fan_booking_validation_booking_buffer_after_booked_required", { buffer_minutes: 10 }))
      .toBe("A 10-minute buffer is required before this booking can start.");
    expect(t("fan_booking_validation_booking_duration_exceeds_limit", { max_allowed_duration: 60 }))
      .toBe("Booking duration exceeds the maximum allowed duration of 60 minutes.");
    expect(t("fan_booking_validation_payment_txid_already_used", { existing_booking_id: "b_123" }))
      .toBe("This payment transaction has already been used by b_123.");
  });

  it("formats create-event backend buffer validation details with translated copy", () => {
    const { t } = createBookingTranslator();
    const flowResult = {
      ok: false,
      error: {
        code: "HTTP_400",
        message: "Validation failed",
        details: {
          ok: false,
          error: "Validation failed",
          details: [{
            field: "bookingBufferMinutes",
            errors: ['sanitizeValidate(): "bookingBufferMinutes" must be >= 5. Got: 2'],
          }],
        },
      },
    };

    expect(formatCreateEventValidationErrors(flowResult, t)).toEqual([
      "Buffer time must be at least 5 minutes.",
    ]);
    expect(formatCreateEventFailureMessage(flowResult, t))
      .toBe("Buffer time must be at least 5 minutes.");
  });

  it("uses translated generic create-event copy for unknown backend validation details", () => {
    const { t } = createBookingTranslator();

    expect(formatCreateEventFailureMessage({
      ok: false,
      error: {
        code: "HTTP_400",
        message: "Validation failed",
        details: {
          details: [{ field: "unknownBackendField", errors: ["Raw backend detail"] }],
        },
      },
    }, t)).toBe("Could not create event. Please try again.");
  });
});
