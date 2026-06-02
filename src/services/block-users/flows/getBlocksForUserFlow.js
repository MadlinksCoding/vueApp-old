import { fail, ok } from "../../flow-system/flowTypes.js";
import { getHttpStatus } from "../../flow-system/runtime/httpMetaRuntime.js";
import { getBlockApiBaseUrl, asBlockFlowError } from "../blockApiUtils.js";

export async function getBlocksForUserFlow({ payload, context, api }) {
  const baseUrl = getBlockApiBaseUrl(context);
  const { to } = payload;
  
  try {
    const url = `${baseUrl}/block-users/getBlocksForUser?to=${to}`;
    const response = await api.get(url);
    const status = getHttpStatus(response, 200);

    if (response?.ok === false || status >= 400) {
      return fail({
        code: "GET_BLOCKS_FAILED",
        message: response?.error?.message || "Failed to fetch blocks for user.",
        details: { status, response }
      });
    }

    return ok(response?.data || response || { blocks: { user_blocks: [] } });
  } catch (error) {
    return asBlockFlowError(error, "GET_BLOCKS_EXCEPTION", "Exception while fetching blocks for user.");
  }
}
