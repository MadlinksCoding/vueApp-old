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

export function isPendingPriceAdjustment(bookingLike) {
  const sources = Array.isArray(bookingLike) ? bookingLike : [bookingLike];

  for (const sourceValue of sources) {
    const candidates = bookingCandidates(sourceValue);
    const projectedState = candidates.find(
      (candidate) => typeof candidate.pendingPriceAdjustment === "boolean",
    );
    if (projectedState) return projectedState.pendingPriceAdjustment;

    const negotiationState = candidates
      .map((candidate) => asObject(candidate.meta))
      .find((meta) => meta && (
        Object.prototype.hasOwnProperty.call(meta, "currentCounterOffer")
        || Object.prototype.hasOwnProperty.call(meta, "negotiation")
        || Object.prototype.hasOwnProperty.call(meta, "adjust")
      ));
    if (negotiationState) return isPendingPriceAdjustmentMeta(negotiationState);
  }

  return false;
}
