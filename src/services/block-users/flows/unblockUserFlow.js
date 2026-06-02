import { fail, ok } from "../../flow-system/flowTypes.js";
import { getHttpStatus } from "../../flow-system/runtime/httpMetaRuntime.js";
import { getBlockApiBaseUrl, asBlockFlowError } from "../blockApiUtils.js";

export async function unblockUserFlow({ payload, context, api }) {
  const baseUrl = getBlockApiBaseUrl(context);
  const { from, to, scope = 'global' } = payload;

  if (!from || !to) {
    return fail({ code: "UNBLOCK_USER_MISSING_FIELDS", message: "'from' and 'to' fields are required." });
  }

  try {
    const response = await api.post(`${baseUrl}/block-users/unblockUser`, { 
      from: String(from), 
      to: String(to), 
      scope 
    });
    const status = getHttpStatus(response, 200);

    if (response?.ok === false || status >= 400) {
      return fail({
        code: "UNBLOCK_USER_FAILED",
        message: response?.error?.message || "Failed to unblock user.",
        details: { status, response }
      });
    }

    return ok(response?.data || response || { success: true });
  } catch (error) {
    return asBlockFlowError(error, "UNBLOCK_USER_EXCEPTION", "Exception while unblocking user.");
  }
}
