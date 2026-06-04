import { fail, ok } from "../../flow-system/flowTypes.js";
import { getHttpStatus } from "../../flow-system/runtime/httpMetaRuntime.js";
import { getChatApiBaseUrl, asFlowError } from "../chatApiUtils.js";

export async function chatUnblockUserFlow({ payload, context, api }) {
  const baseUrl = getChatApiBaseUrl(context);
  const { userId, blockedUserId } = payload;
  
  if (!userId || !blockedUserId) {
    return fail({ code: "MISSING_FIELDS", message: "userId and blockedUserId are required." });
  }

  try {
    const response = await api.post(`${baseUrl}/chats/users/unblock`, { 
      userId: String(userId), 
      blockedUserId: String(blockedUserId) 
    });
    
    const status = getHttpStatus(response, 200);
    
    if (response?.ok === false || status >= 400) {
      return fail({ 
        code: "CHAT_UNBLOCK_USER_FAILED", 
        message: response?.error || "Failed to unblock user in chat" 
      }, { flow: "chat.unblockUser", status });
    }
    
    return ok(response?.data || response, { flow: "chat.unblockUser", status });
  } catch (error) {
    return asFlowError(error, "CHAT_UNBLOCK_USER_EXCEPTION", "Exception while unblocking user in chat", "chat.unblockUser");
  }
}
