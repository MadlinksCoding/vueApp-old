import { fail, ok } from "@/services/flow-system/flowTypes.js";
import { getHttpStatus } from "@/services/flow-system/runtime/httpMetaRuntime.js";
import { getChatApiBaseUrl, asFlowError } from "@/services/chat/chatApiUtils.js";

export async function sendProductRecommendationFlow({ payload, context, api }) {
  const baseUrl = getChatApiBaseUrl(context);
  const { chatId, productData } = payload;

  if (!chatId || !productData) {
    return fail({ code: "SEND_PRODUCT_RECOMMENDATION_MISSING_FIELDS", message: "chatId and productData are required." });
  }

  try {
    const response = await api.post(`${baseUrl}/chats/${encodeURIComponent(chatId)}/messages/product`, { productData });
    const status = getHttpStatus(response, 200);

    if (response?.ok === false) {
      return fail({ code: "SEND_PRODUCT_RECOMMENDATION_FAILED", message: response?.error || "Failed to send product recommendation." }, { flow: "chat.sendProductRecommendation", status });
    }

    return ok({ result: response?.result }, { flow: "chat.sendProductRecommendation", status });
  } catch (error) {
    return asFlowError(error, "SEND_PRODUCT_RECOMMENDATION_UNEXPECTED");
  }
}
