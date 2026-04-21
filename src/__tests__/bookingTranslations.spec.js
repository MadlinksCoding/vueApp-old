import { describe, expect, it } from "vitest";
import {
  createBookingTranslator,
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
});
