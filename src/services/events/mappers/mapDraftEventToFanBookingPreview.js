import { createEventMapper } from "@/services/events/mappers/createEventMapper.js";
import { mapSingleEventFromResponse } from "@/services/events/mappers/fetchCreatorEventsMapper.js";

function toNumber(value, fallback = null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function htmlToPreviewText(value) {
  if (typeof value !== "string") return "";
  const noTags = value.replace(/<[^>]*>/g, " ");
  const collapsed = noTags.replace(/\s+/g, " ").trim();
  return collapsed;
}

export function mapDraftEventToFanBookingPreview(draftState = {}, options = {}) {
  const creatorId = toNumber(options.creatorId ?? draftState?.creatorId, 1);
  const syntheticEventId = String(options.previewEventId || `preview_event_${creatorId}`);

  const rawEvent = createEventMapper(
    {
      ...(draftState || {}),
      creatorId,
    },
    { creatorId },
  );

  const eventRecord = {
    ...rawEvent,
    id: syntheticEventId,
    eventId: syntheticEventId,
    creatorId,
    status: "active",
    description: htmlToPreviewText(rawEvent?.description || draftState?.eventDescription || ""),
  };

  const mapped = mapSingleEventFromResponse(eventRecord);
  return {
    ...mapped,
    id: syntheticEventId,
    eventId: syntheticEventId,
    status: "active",
    raw: eventRecord,
  };
}
