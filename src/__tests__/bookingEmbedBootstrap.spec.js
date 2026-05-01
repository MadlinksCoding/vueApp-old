import { describe, expect, it } from "vitest";
import { normalizeEventsEmbedBootstrap } from "@/embeds/events/bootstrap.js";
import { normalizeOneOnOneBookingBootstrap } from "@/embeds/fanBooking/bootstrap.js";

describe("booking embed bootstrap translations", () => {
  it("normalizes events embed translations and locale", () => {
    const normalized = normalizeEventsEmbedBootstrap({
      creatorId: "42",
      userRole: "creator",
      translations: {
        dashboard_new_events: "Nuevos eventos",
        ignored: 12,
      },
      locale: "es-MX",
    });

    expect(normalized.translations).toEqual({ dashboard_new_events: "Nuevos eventos" });
    expect(normalized.locale).toBe("es-MX");
  });

  it("normalizes fan booking translations and locale", () => {
    const normalized = normalizeOneOnOneBookingBootstrap({
      creatorId: "42",
      fanId: "0",
      translations: {
        fan_booking_book_now: "Reservar",
        nested: { label: "Nope" },
      },
      locale: "fr-CA",
    });

    expect(normalized.translations).toEqual({ fan_booking_book_now: "Reservar" });
    expect(normalized.locale).toBe("fr-CA");
  });
});
