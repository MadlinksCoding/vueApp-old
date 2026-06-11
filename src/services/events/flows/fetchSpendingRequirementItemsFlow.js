import { fail, ok } from "@/services/flow-system/flowTypes.js";
import { getHttpStatus } from "@/services/flow-system/runtime/httpMetaRuntime.js";
import { asFlowError, toNumberOr } from "@/services/events/eventsApiUtils.js";
import { buildWpApiUrl } from "@/utils/wpApiBaseUrl.js";
const COLLECTION_CONFIG = {
  media: {
    path: "/media/list",
    creatorParam: "creator_id",
  },
  product: {
    path: "/products/list",
    creatorParam: "creator_id",
  },
  subscription: {
    path: "/subscriptions/plans/list",
    creatorParam: "creator_id",
  },
};

function normalizeType(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "media" || normalized === "product" || normalized === "subscription") {
    return normalized;
  }
  return "";
}

function buildPrimaryParams(type, payload = {}) {
  const config = COLLECTION_CONFIG[type];
  return {
    [config.creatorParam]: payload.creatorId,
    nocache: 1,
    count: toNumberOr(payload.count, 20),
    offset: Math.max(0, toNumberOr(payload.offset, 0)),
  };
}

function mapPrimaryResponse(type, response = {}, payload = {}) {
  const results = Array.isArray(response?.results) ? response.results : [];
  const totalCount = toNumberOr(response?.total_count, null);
  return {
    type,
    source: type === "subscription" ? "subscriptions/plans/list" : `${type}/list`,
    results,
    totalCount,
    count: toNumberOr(payload?.count, 20),
    offset: Math.max(0, toNumberOr(payload?.offset, 0)),
  };
}

async function fetchPrimaryCollection({ type, payload, context, api }) {
  const config = COLLECTION_CONFIG[type];
  const response = await api.get(buildWpApiUrl(config.path), {
    params: buildPrimaryParams(type, payload),
    headers: context.requestHeaders || {},
    signal: context.signal,
    timeoutMs: context.requestTimeoutMs,
  });

  const status = getHttpStatus(response, 200);
  const isSuccess = String(response?.status || "").toLowerCase() === "success";
  if (!isSuccess && type !== "subscription") {
    return fail({
      code: "FETCH_SPENDING_REQUIREMENT_ITEMS_FAILED",
      message: `Failed to fetch ${type} items.`,
      details: response,
    }, { status, type });
  }

  return ok(mapPrimaryResponse(type, response, payload), { status, type });
}

export async function fetchSpendingRequirementItemsFlow({ payload, context, api }) {
  const type = normalizeType(payload?.type);
  if (!type) {
    return fail({
      code: "MISSING_SPENDING_REQUIREMENT_TYPE",
      message: "type is required. Use media, product, or subscription.",
    });
  }

  if (payload?.creatorId == null || payload?.creatorId === "") {
    return fail({
      code: "MISSING_CREATOR_ID",
      message: "creatorId is required to fetch spending requirement items.",
    });
  }

  try {
    const primaryResult = await fetchPrimaryCollection({ type, payload, context, api });
    return primaryResult;
  } catch (error) {
    return asFlowError(
      error,
      "FETCH_SPENDING_REQUIREMENT_ITEMS_UNEXPECTED",
      "Unexpected error while fetching spending requirement items."
    );
  }
}
