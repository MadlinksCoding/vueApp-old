function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function bookingCandidates(sourceValue) {
  const source = asObject(sourceValue);
  if (!source) return [];

  return [
    source,
    source.booking,
    source.raw,
    source.sourceEvent,
    source.sourceEvent?.raw,
    source.event,
    source.event?.raw,
  ].map(asObject).filter(Boolean);
}

function normalizeOfferType(value) {
  return String(value || "").trim().toLowerCase().replace(/[_-]/g, "");
}

function finiteTokenAmount(value) {
  if (value === null || value === undefined || value === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

function isPendingPriceAdjustmentMeta(meta) {
  if (normalizeOfferType(meta.currentCounterOffer) !== "adjust") return false;
  const negotiation = asObject(meta.negotiation);
  if (negotiation) {
    if (
      normalizeOfferType(negotiation.type) !== "adjust"
      || String(negotiation.status || "").trim().toLowerCase() !== "sent"
    ) {
      return false;
    }

    const proposedTokens = finiteTokenAmount(negotiation.proposed?.totalTokens);
    const originalTokens = finiteTokenAmount(negotiation.original?.totalTokens);
    return proposedTokens !== null
      && originalTokens !== null
      && proposedTokens !== originalTokens;
  }

  const legacyAdjust = asObject(meta.adjust);
  const proposedTokens = finiteTokenAmount(legacyAdjust?.proposedTokens);
  const originalTokens = finiteTokenAmount(legacyAdjust?.prevTotalTokens);
  return proposedTokens !== null
    && originalTokens !== null
    && proposedTokens !== originalTokens;
}

function isPendingCounterOfferMeta(meta) {
  const activeType = normalizeOfferType(meta.currentCounterOffer);
  if (!["adjust", "reschedule", "moretime"].includes(activeType)) return false;

  const negotiation = asObject(meta.negotiation);
  if (!negotiation) return true;

  const actor = String(negotiation.actor || "").trim().toLowerCase();
  const normalizedActor = actor === "user" ? "fan" : actor;
  return normalizeOfferType(negotiation.type) === activeType
    && String(negotiation.status || "").trim().toLowerCase() === "sent"
    && (!normalizedActor || normalizedActor === "creator");
}

function hasAnyKey(meta, keys) {
  return keys.some((key) => Object.prototype.hasOwnProperty.call(meta, key));
}

// Walks the booking-like sources and returns the first one that carries either a
// projected `pendingPriceAdjustment` flag or a negotiation-bearing `meta` object.
function resolveNegotiationState(bookingLike, metaKeys) {
  const sources = Array.isArray(bookingLike) ? bookingLike : [bookingLike];

  for (const sourceValue of sources) {
    const candidates = bookingCandidates(sourceValue);
    const projectedState = candidates.find(
      (candidate) => typeof candidate.pendingPriceAdjustment === "boolean",
    );
    const negotiationState = candidates
      .map((candidate) => asObject(candidate.meta))
      .find((meta) => meta && hasAnyKey(meta, metaKeys));

    if (projectedState || negotiationState) {
      return { projected: projectedState || null, meta: negotiationState || null };
    }
  }

  return { projected: null, meta: null };
}

export function isPendingPriceAdjustment(bookingLike) {
  const { projected, meta } = resolveNegotiationState(
    bookingLike,
    ["currentCounterOffer", "negotiation", "adjust"],
  );

  if (projected) return projected.pendingPriceAdjustment;
  if (meta) return isPendingPriceAdjustmentMeta(meta);
  return false;
}

export function isPendingCounterOffer(bookingLike) {
  const sources = Array.isArray(bookingLike) ? bookingLike : [bookingLike];

  for (const sourceValue of sources) {
    const candidates = bookingCandidates(sourceValue);
    const projectedState = candidates.find(
      (candidate) => typeof candidate.pendingCounterOffer === "boolean",
    );
    if (projectedState) return projectedState.pendingCounterOffer;

    const negotiationState = candidates
      .map((candidate) => asObject(candidate.meta))
      .find((meta) => meta && hasAnyKey(meta, [
        "currentCounterOffer",
        "negotiation",
        "adjust",
        "moretime",
        "reschedule",
      ]));
    if (negotiationState) return isPendingCounterOfferMeta(negotiationState);

    const legacyPriceProjection = candidates.find(
      (candidate) => typeof candidate.pendingPriceAdjustment === "boolean",
    );
    if (legacyPriceProjection) return legacyPriceProjection.pendingPriceAdjustment;
  }

  return false;
}

const EMPTY_COUNTER_OFFER = Object.freeze({
  type: null,
  rawType: "",
  negotiationId: null,
  proposed: Object.freeze({
    proposedSlotDate: "",
    proposedTokens: null,
    proposedRemarks: "",
    prevTotalTokens: null,
    adjustedDurationMinutes: null,
  }),
});

function firstText(...values) {
  return values.find((value) => typeof value === "string" && value.trim())?.trim() || "";
}

/**
 * Resolves the counter offer a booking is currently waiting on, for every offer
 * type (`adjust`, `moretime`, `reschedule`) — not just price adjustments.
 *
 * Returns `EMPTY_COUNTER_OFFER` (with `type: null`) when nothing is pending.
 */
export function getPendingCounterOffer(bookingLike) {
  const { projected, meta } = resolveNegotiationState(
    bookingLike,
    ["currentCounterOffer", "negotiation", "adjust", "moretime", "reschedule"],
  );
  if (!meta) return EMPTY_COUNTER_OFFER;

  const rawType = String(meta.currentCounterOffer || "").trim();
  const type = normalizeOfferType(rawType);
  if (!type) return EMPTY_COUNTER_OFFER;

  const negotiation = asObject(meta.negotiation);
  if (negotiation) {
    if (normalizeOfferType(negotiation.type) !== type) return EMPTY_COUNTER_OFFER;
    if (String(negotiation.status || "").trim().toLowerCase() !== "sent") return EMPTY_COUNTER_OFFER;
  }

  // The chat popups write the proposal under the raw `currentCounterOffer` key.
  const legacy = asObject(meta[rawType]) || asObject(meta[type]) || {};

  const offer = {
    type,
    rawType: rawType || type,
    negotiationId: negotiation?.negotiationId || null,
    proposed: {
      proposedSlotDate: firstText(negotiation?.proposed?.startAtIso, legacy.proposedSlotDate),
      proposedTokens: finiteTokenAmount(negotiation?.proposed?.totalTokens)
        ?? finiteTokenAmount(legacy.proposedTokens),
      proposedRemarks: firstText(negotiation?.proposed?.remarks, legacy.proposedRemarks),
      prevTotalTokens: finiteTokenAmount(negotiation?.original?.totalTokens)
        ?? finiteTokenAmount(legacy.prevTotalTokens),
      adjustedDurationMinutes: finiteTokenAmount(negotiation?.proposed?.durationMinutes)
        ?? finiteTokenAmount(legacy.adjustedDurationMinutes),
    },
  };

  // A price adjustment that proposes the same total is not actionable, and an
  // explicitly projected flag from the API wins over the raw meta.
  if (type === "adjust") {
    if (projected && !projected.pendingPriceAdjustment) return EMPTY_COUNTER_OFFER;
    if (!projected && !isPendingPriceAdjustmentMeta(meta)) return EMPTY_COUNTER_OFFER;
  }

  return offer;
}
