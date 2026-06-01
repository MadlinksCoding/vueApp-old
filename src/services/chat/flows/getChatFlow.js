import { fail, ok } from "@/services/flow-system/flowTypes.js";
import { getHttpStatus } from "@/services/flow-system/runtime/httpMetaRuntime.js";
import { getChatApiBaseUrl, asFlowError } from "@/services/chat/chatApiUtils.js";

export async function getChatFlow({ payload, context, api }) {
  const baseUrl = getChatApiBaseUrl(context);
  const { chatId, userId } = payload;

  if (!chatId) {
    return fail({ code: "GET_CHAT_MISSING_CHAT_ID", message: "chatId is required." });
  }

  try {
    const queryParam = userId ? `?userId=${encodeURIComponent(userId)}` : "";
    const response = await api.get(`${baseUrl}/chats/${encodeURIComponent(chatId)}${queryParam}`);
    const status = getHttpStatus(response, 200);

    if (response?.ok === false) {
      return fail({ code: "GET_CHAT_FAILED", message: response?.error || "Failed to fetch chat." }, { flow: "chat.getChat", status });
    }

    return ok({ item: response?.item }, { flow: "chat.getChat", status });
  } catch (error) {
    return asFlowError(error, "GET_CHAT_UNEXPECTED");
  }
}
