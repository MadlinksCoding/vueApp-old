import { fail, ok } from "@/services/flow-system/flowTypes.js";
import { getHttpStatus } from "@/services/flow-system/runtime/httpMetaRuntime.js";
import { getChatApiBaseUrl, asFlowError } from "@/services/chat/chatApiUtils.js";

export async function createChatFlow({ payload, context, api }) {
  const baseUrl = getChatApiBaseUrl(context);
  const headers = context.requestHeaders || {};

  // Backwards compatibility for createdBy
  if (!payload.visibilitySettings && payload.createdBy) {
    payload.visibilitySettings = {
      chatOwner: String(payload.createdBy),
      chatVisibility: null,
      fullAccessUsers: []
    };
  }
  
  if (payload.visibilitySettings && payload.visibilitySettings.chatOwner) {
    if (!payload.visibilitySettings.fullAccessUsers) {
      payload.visibilitySettings.fullAccessUsers = [];
    }
    if (!payload.visibilitySettings.fullAccessUsers.includes(String(payload.visibilitySettings.chatOwner))) {
      payload.visibilitySettings.fullAccessUsers.push(String(payload.visibilitySettings.chatOwner));
    }
  }

  try {
    const response = await api.post(`${baseUrl}/chats`, payload);
    const status = getHttpStatus(response, 201);
    
    if (response?.ok === false) {
      return fail({ code: "CREATE_CHAT_FAILED", message: response?.error || "Failed to create chat" }, { flow: "chat.createChat", status });
    }
    
    return ok({ chatId: response?.chatId }, { flow: "chat.createChat", status });
  } catch (error) {
    return asFlowError(error, "CREATE_CHAT_UNEXPECTED");
  }
}
