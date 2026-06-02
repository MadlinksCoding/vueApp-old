import { fail, ok } from "@/services/flow-system/flowTypes.js";
import { getHttpStatus } from "@/services/flow-system/runtime/httpMetaRuntime.js";
import { getChatApiBaseUrl, asFlowError } from "@/services/chat/chatApiUtils.js";

export async function createGroupChatFlow({ payload, context, api }) {
  const baseUrl = getChatApiBaseUrl(context);

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

  if (!payload?.visibilitySettings?.chatOwner && !payload?.createdBy) {
    return fail({ code: "CREATE_GROUP_CHAT_MISSING_FIELDS", message: "createdBy or visibilitySettings.chatOwner is required." });
  }
  if (!payload?.participants) {
    return fail({ code: "CREATE_GROUP_CHAT_MISSING_FIELDS", message: "participants are required." });
  }

  try {
    const response = await api.post(`${baseUrl}/chats/group`, payload);
    const status = getHttpStatus(response, 201);

    if (response?.ok === false) {
      return fail({ code: "CREATE_GROUP_CHAT_FAILED", message: response?.error || "Failed to create group chat." }, { flow: "chat.createGroupChat", status });
    }

    return ok({ chatId: response?.chatId }, { flow: "chat.createGroupChat", status });
  } catch (error) {
    return asFlowError(error, "CREATE_GROUP_CHAT_UNEXPECTED");
  }
}
