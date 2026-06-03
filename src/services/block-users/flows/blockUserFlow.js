import { fail, ok } from "../../flow-system/flowTypes.js";
import { getHttpStatus } from "../../flow-system/runtime/httpMetaRuntime.js";
import { getBlockApiBaseUrl, asBlockFlowError } from "../blockApiUtils.js";
import FlowHandler from "../../flow-system/FlowHandler.js";

export async function blockUserFlow({ payload, context, api }) {
  const baseUrl = getBlockApiBaseUrl(context);
  const { from, to, scope = 'global', reason = '', is_permanent = true } = payload;

  if (!from || !to) {
    return fail({ code: "BLOCK_USER_MISSING_FIELDS", message: "'from' and 'to' fields are required." });
  }

  try {
    const response = await api.post(`${baseUrl}/block-users/blockUser`, { 
      from: String(from), 
      to: String(to), 
      scope, 
      reason, 
      is_permanent 
    });
    const status = getHttpStatus(response, 201);

    if (response?.ok === false || status >= 400) {
      return fail({
        code: "BLOCK_USER_FAILED",
        message: response?.error?.message || "Failed to block user.",
        details: { status, response }
      });
    }

    try {
      await FlowHandler.run('chat.blockUser', { userId: String(from), blockedUserId: String(to) });
    } catch (e) {
      console.error("[blockUserFlow] Failed to sync chat.blockUser:", e);
    }

    return ok(response?.data || response || { success: true, result: true });
  } catch (error) {
    return asBlockFlowError(error, "BLOCK_USER_EXCEPTION", "Exception while blocking user.");
  }
}
