import { describe, expect, it } from "vitest";
import { createPipelineContext } from "@/services/flow-system/pipeline/pipelineContext.js";

function makeContext(options = {}) {
  return createPipelineContext({
    flowName: "test.flow",
    flowEntry: {},
    flow: async () => {},
    payload: {},
    mappedPayload: {},
    flowKind: "write",
    mapper: null,
    validators: {},
    options,
    rerunFlow: async () => {},
    executeFlow: async () => {},
  });
}

describe("createPipelineContext", () => {
  it("does not reattach backend auth when Authorization is explicitly null", () => {
    const context = makeContext({
      backendJwtToken: "jwt_test",
      requestHeaders: { Authorization: null },
    });

    expect(context.requestHeaders.Authorization).toBeNull();
  });

  it("attaches backend auth when no Authorization override exists", () => {
    const context = makeContext({
      backendJwtToken: "jwt_test",
      requestHeaders: { "X-Guest-Hold-Token": "guest_token" },
    });

    expect(context.requestHeaders.Authorization).toBe("Bearer jwt_test");
  });
});
