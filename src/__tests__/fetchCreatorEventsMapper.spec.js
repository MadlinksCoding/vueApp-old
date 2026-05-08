import { describe, expect, it } from "vitest";
import { mapSingleEventFromResponse } from "@/services/events/mappers/fetchCreatorEventsMapper.js";

const baseEvent = {
  eventId: "evt_title",
  creatorId: 1407,
  type: "1on1-call",
  status: "active",
  description: "Event description",
  dateFrom: "2026-05-04",
  sessionDurationMinutes: 30,
};

function mappedTitle(fields = {}) {
  return mapSingleEventFromResponse({
    ...baseEvent,
    ...fields,
  }).title;
}

describe("fetchCreatorEventsMapper", () => {
  it.each([
    ["title", { title: "Title Field" }, "Title Field"],
    ["eventTitle", { eventTitle: "Event Title Field" }, "Event Title Field"],
    ["eventName", { eventName: "Event Name Field" }, "Event Name Field"],
    ["event_name", { event_name: "Snake Event Name Field" }, "Snake Event Name Field"],
    ["name", { name: "Name Field" }, "Name Field"],
  ])("maps fetched event display titles from %s", (_field, fields, expected) => {
    expect(mappedTitle(fields)).toBe(expected);
  });

  it("does not let generic title placeholders mask a real event name", () => {
    expect(mappedTitle({
      title: "Untitled Event",
      eventName: "Creator Strategy Call",
    })).toBe("Creator Strategy Call");
  });

  it("falls back to Untitled Event when no title field is available", () => {
    expect(mappedTitle()).toBe("Untitled Event");
  });
});
