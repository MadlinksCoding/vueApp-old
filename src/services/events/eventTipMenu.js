import { buildWpApiUrl } from "@/utils/wpApiBaseUrl.js";
import { mapFetchSpendingRequirementItemsFromResponse } from "./mappers/fetchSpendingRequirementItemsMapper.js";

function prizeLibraryError(message, translationKey) {
  return Object.assign(new Error(message), { translationKey });
}

// Keep only the fields needed by the event and future call-menu integration.
export function normalizeEventTipMenu(value) {
  return (Array.isArray(value) ? value : []).map(({ itemId, title, tokens, prize }) => {
    let savedPrize = null;
    if (prize?.type === "subscription") savedPrize = { type: "subscription", planId: Number(prize.planId), planTitle: prize.planTitle, billingCycles: Number(prize.billingCycles ?? 1) };
    if (prize?.type === "p2v") savedPrize = { type: "p2v", mediaId: Number(prize.mediaId), mediaTitle: prize.mediaTitle, imageUrl: prize.imageUrl || "" };
    if (prize?.type === "merch") savedPrize = { type: "merch", productId: Number(prize.productId), productTitle: prize.productTitle, imageUrl: prize.imageUrl || "" };
    return { itemId, title: String(title || "").trim(), tokens: Number(tokens), prize: savedPrize };
  });
}

export async function fetchTipPrizePage({ type, creatorId, offset = 0, signal }) {
  const collection = type === "p2v" ? "media" : type === "merch" ? "product" : "subscription";
  const paths = { media: "/media/list", product: "/products/list", subscription: "/subscriptions/plans/list" };
  if (!creatorId) throw prizeLibraryError("Creator information is missing. Please reload the event form.", "booking_tip_menu_creator_missing");
  const url = new URL(buildWpApiUrl(paths[collection]), window.location.origin);
  url.search = new URLSearchParams({
    creator_id: creatorId, count: 6, offset, nocache: 1,
    ...(collection !== "subscription" ? { sort: "newest", sort_order: "DESC" } : {}),
    ...(collection === "media" ? { ppv: "yes" } : {}),
  });
  const response = await fetch(url, { credentials: "include", signal });
  if (!response.ok) throw prizeLibraryError("The prize library could not be loaded. Please try again.", "booking_tip_menu_library_load_failed_retry");
  const data = await response.json();
  if (data.status && data.status !== "success") {
    if (data.message) throw new Error(data.message);
    throw prizeLibraryError("The prize library could not be loaded.", "booking_tip_menu_library_load_failed");
  }
  const page = mapFetchSpendingRequirementItemsFromResponse({ type: collection, results: data.results, totalCount: data.total_count, count: 6, offset });
  page.items = page.items.filter(item => collection === "product" ? !item.subscriberExclusive : collection === "media" ? item.canBuy : true);
  // Tier endpoints return the complete list and do not support pagination.
  if (collection === "subscription") page.hasMore = false;
  return page;
}

// Prices are display data, so refresh them rather than saving a stale price in the event.
export async function fetchTipPrizeItem({ type, creatorId, id, signal }) {
  if (!creatorId) throw prizeLibraryError("Creator information is missing. Please reload the event form.", "booking_tip_menu_creator_missing");
  const collection = type === "p2v" ? "media" : "product";
  const url = new URL(buildWpApiUrl(`/${collection === "media" ? "media" : "products"}/get`), window.location.origin);
  url.search = new URLSearchParams({ uid: creatorId, [collection === "media" ? "media_id" : "merch_id"]: id, nocache: 1 });
  const response = await fetch(url, { credentials: "include", signal });
  if (!response.ok) throw prizeLibraryError("The prize library could not be loaded. Please try again.", "booking_tip_menu_library_load_failed_retry");
  const data = await response.json();
  if (data.ok === false || !data.result) throw prizeLibraryError("The prize library could not be loaded.", "booking_tip_menu_library_load_failed");
  return mapFetchSpendingRequirementItemsFromResponse({ type: collection, results: [{ ...data.result, id }], count: 1 }).items[0];
}
