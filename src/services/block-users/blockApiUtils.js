import { fail } from "../flow-system/flowTypes.js";
import { normalizeUnknownError } from "../flow-system/flowErrors.js";

function getFallbackBaseUrl() {
  if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return "http://localhost:3001";
}

export function getBlockApiBaseUrl(context) {
  if (context?.baseUrl) {
    return context.baseUrl;
  }
  return getFallbackBaseUrl();
}

export function asBlockFlowError(error, defaultCode = "BLOCK_API_ERROR", defaultMessage = "A block API error occurred.") {
  const norm = normalizeUnknownError(error);
  return fail({
    code: norm.error?.code || defaultCode,
    message: norm.error?.message || defaultMessage,
    details: norm.error?.details || error,
  });
}
