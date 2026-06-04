import { fail, ok } from "../../flow-system/flowTypes.js";
import { getHttpStatus } from "../../flow-system/runtime/httpMetaRuntime.js";
import { getBlockApiBaseUrl, asBlockFlowError } from "../blockApiUtils.js";

export async function listUserBlocksFlow({ payload, context, api }) {
  const baseUrl = getBlockApiBaseUrl(context);
  const { from, to, scope, limit = 100 } = payload;

  try {
    const params = new URLSearchParams();
    if (from) params.append("from", String(from));
    if (to) params.append("to", String(to));
    if (scope) params.append("scope", String(scope));
    params.append("limit", String(limit));

    const url = `${baseUrl}/block-users/listUserBlocks?${params.toString()}`;
    const response = await api.get(url);
    const status = getHttpStatus(response, 200);

    if (response?.ok === false || status >= 400) {
      return fail({
        code: "LIST_BLOCKS_FAILED",
        message: response?.error?.message || "Failed to fetch user blocks.",
        details: { status, response }
      });
    }

    return ok(response?.data || response || { items: [] });
  } catch (error) {
    return asBlockFlowError(error, "LIST_BLOCKS_EXCEPTION", "Exception while fetching user blocks.");
  }
}
