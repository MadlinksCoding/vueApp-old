import { fail, ok } from "@/services/flow-system/flowTypes.js";
import { getHttpStatus } from "@/services/flow-system/runtime/httpMetaRuntime.js";
import { getChatApiBaseUrl, asFlowError } from "@/services/chat/chatApiUtils.js";

export async function addParticipantsFlow({ payload, context, api }) {
  const baseUrl = getChatApiBaseUrl(context);
  const { chatId, userIds, role, invitedBy } = payload;

  if (!chatId || !Array.isArray(userIds) || userIds.length === 0) {
    return fail({ code: "ADD_PARTICIPANTS_MISSING_FIELDS", message: "chatId and userIds (array) are required." });
  }

  try {
    const response = await api.post(`${baseUrl}/chats/${encodeURIComponent(chatId)}/participants`, { 
      userIds, 
      role, 
      invitedBy 
    });
    const status = getHttpStatus(response, 200);

    if (response?.ok === false) {
      return fail({ code: "ADD_PARTICIPANTS_FAILED", message: response?.error || "Failed to add participants." }, { flow: "chat.addParticipants", status });
    }

    return ok({ result: response?.result }, { flow: "chat.addParticipants", status });
  } catch (error) {
    return asFlowError(error, "ADD_PARTICIPANTS_UNEXPECTED");
  }
}
