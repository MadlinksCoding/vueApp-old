# Flow and Data Pipeline Architecture Guide

This document outlines the architecture of the Data Pipeline and Flow Handlers based on the Bookings module, designed to be replicated for the upcoming Chat module.

## 1. Data Pipeline Architecture (`flowDataPipeline.js`)

The `runFlowDataPipeline` function is the core execution engine for any flow. It orchestrates the lifecycle of a request through several well-defined stages:

- **Prepare:** Initializes timing and stage tracking (`markStage`, `recordTiming`).
- **Validate Payload:** Extracts original payload from context and runs it against `context.validators.payload`. If validation fails, it short-circuits with a `PAYLOAD_VALIDATION_FAILED` error.
- **Execute:** Determines if the flow is a "read" or "write" operation based on `context.flowKind` and delegates to `runReadPipeline` or `runWritePipeline`. This stage is wrapped in an `executeWithTimeout` to enforce `context.totalFlowTimeoutMs`.
- **Validate Response:** Validates the flow execution result using `context.validators.response`. If this fails, a `RESPONSE_VALIDATION_FAILED` error is finalized.
- **Finalize:** Constructs a normalized output via `finalizeSuccess`, `finalizeError`, or `finalizeCancelled`. These finalizers append execution metadata like `runId`, `flowName`, `stages`, and `timings`. They also handle mapping internal errors to UI-friendly error strings via `formatUiErrors` and `mapUiError`.

## 2. Flow Handlers Architecture

Flow handlers (e.g., `createBookingFlow.js`, `reviewPendingBookingFlow.js`) perform the actual business logic or API interactions. They plug into the execution stage of the Data Pipeline.

**Key responsibilities of a Flow Handler:**
- **Input:** They receive a single object containing `{ payload, context, api }`.
  - `payload`: The validated data specific to the request.
  - `context`: Contextual request data like `requestHeaders`, `signal` (for cancellation), and `requestTimeoutMs`.
  - `api`: The HTTP client injected to perform the requests.
- **Custom Validation:** While the pipeline handles global schema validation, flow handlers perform localized logical validation (e.g., ensuring a `decision` is specifically "approve" or "reject").
- **Execution:** Makes the asynchronous request using actions like `api.post`, `api.get`.
- **Return Value:** Must return standard flow objects using `ok(data, meta)` or `fail({ code, message, details })` imported from `@/services/flow-system/flowTypes.js`.
- **Error Handling:** They map unexpected errors to uniform flow errors using utilities like `asFlowError`.

## 3. Base Template for `ChatFlow.js`

Below is a boilerplate template reflecting the exact pattern used in the Bookings module, ready for use in the new Chat module.

```javascript
import { fail, ok } from "@/services/flow-system/flowTypes.js";
import { getHttpStatus } from "@/services/flow-system/runtime/httpMetaRuntime.js";
// Adjust this import to match the actual Chat API utilities equivalent to bookingsApiUtils
import { getChatApiBaseUrl, asFlowError } from "@/services/chat/chatApiUtils.js";

/**
 * Standard Flow Handler Template for the Chat module.
 *
 * @param {Object} args
 * @param {Object} args.payload - The validated payload from the Data Pipeline.
 * @param {Object} args.context - Includes standard meta like signal, requestHeaders, requestTimeoutMs.
 * @param {Object} args.api - The injected HTTP client.
 */
export async function sampleChatFlow({ payload, context, api }) {
  const baseUrl = getChatApiBaseUrl(context);
  const headers = context.requestHeaders || {};

  // 1. Localized payload processing and validation
  // e.g., verifying required fields that cannot be statically validated prior
  const requiredFields = ["chatId", "message"];
  const missingFields = requiredFields.filter((field) => !payload?.[field]);

  if (missingFields.length > 0) {
    return fail({
      code: "CHAT_FLOW_MISSING_REQUIRED_FIELDS",
      message: `Missing required fields: ${missingFields.join(", ")}.`,
      details: { missingFields, payload },
    });
  }

  try {
    // 2. Perform the async API request
    const response = await api.post(`${baseUrl}/chat`, payload, {
      headers,
      signal: context.signal,
      timeoutMs: context.requestTimeoutMs,
    });

    // Extract the HTTP status for meta logging
    const status = getHttpStatus(response, 201);

    // 3. Handle explicit API failures
    if (response?.ok === false) {
      return fail({
        code: "CHAT_REQUEST_FAILED",
        message: response?.error || "Failed to process chat flow.",
        details: response,
      });
    }

    // 4. Return success response with strictly typed `ok`
    return ok(
      {
        chatId: response?.chatId || payload.chatId,
        item: response?.item || null,
        validation: response?.validation || null,
      },
      {
        flow: "chat.sampleChatFlow",
        status,
      }
    );
  } catch (error) {
    // 5. Catch and normalize unexpected runtime errors
    return asFlowError(
      error,
      "CHAT_REQUEST_UNEXPECTED_ERROR",
      "An unexpected error occurred while processing the chat request."
    );
  }
}
```
