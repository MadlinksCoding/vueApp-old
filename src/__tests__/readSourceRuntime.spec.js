import { describe, expect, it, vi } from "vitest";

import { buildPayloadHash } from "@/services/flow-system/runtime/cacheRuntime.js";
import { deepGet, deepSet } from "@/services/flow-system/runtime/destinationRuntime.js";
import {
  readFromStateEngineSource,
  writeFreshnessMetaToDestinations,
} from "@/services/flow-system/runtime/readSourceRuntime.js";
import { runReadPipeline } from "@/services/flow-system/pipeline/readPipeline.js";

const payloadAwareSource = {
  type: "stateEngine",
  key: "events.cachedResponse",
  etagKey: "events.meta.etag",
  updatedAtKey: "events.meta.updatedAt",
  varyByPayload: true,
  payloadHashKey: "events.meta.payloadHash",
};

function createStateEngine(initialState = {}) {
  const state = structuredClone(initialState);

  return {
    state,
    getState: vi.fn((path) => deepGet(state, path)),
    setState: vi.fn((path, value) => deepSet(state, path, value)),
  };
}

function dashboardPayload(overrides = {}) {
  return {
    creatorId: 1407,
    fanId: null,
    userRole: "creator",
    status: "active",
    fromIso: "2026-08-05",
    toIso: "2026-08-06",
    slotLimit: 1000,
    statusIn: "pending,confirmed",
    ...overrides,
  };
}

describe("payload-aware state-engine read sources", () => {
  it("returns a cached snapshot when its payload hash matches the request", () => {
    const payload = dashboardPayload();
    const cachedResponse = { bookedSlots: [{ bookingId: "booking_aug_6" }] };
    const stateEngine = createStateEngine({
      events: {
        cachedResponse,
        meta: {
          payloadHash: buildPayloadHash(payload),
          updatedAt: Date.now(),
          etag: '"dashboard-aug-6"',
        },
      },
    });

    expect(readFromStateEngineSource(payloadAwareSource, { payload, stateEngine })).toEqual(
      expect.objectContaining({
        hit: true,
        data: cachedResponse,
        etag: '"dashboard-aug-6"',
      }),
    );
  });

  it.each([
    ["date range", { fromIso: "2026-08-06", toIso: "2026-08-07" }],
    ["viewer role", { creatorId: null, fanId: 305928, userRole: "fan" }],
    ["viewer id", { creatorId: 1410 }],
  ])("rejects a cached snapshot for a different %s", (_label, overrides) => {
    const cachedPayload = dashboardPayload();
    const requestedPayload = dashboardPayload(overrides);
    const stateEngine = createStateEngine({
      events: {
        cachedResponse: { bookedSlots: [{ bookingId: "stale_booking" }] },
        meta: {
          payloadHash: buildPayloadHash(cachedPayload),
          updatedAt: Date.now(),
        },
      },
    });

    expect(readFromStateEngineSource(payloadAwareSource, {
      payload: requestedPayload,
      stateEngine,
    })).toEqual(expect.objectContaining({
      hit: false,
      reason: "payload_hash_mismatch",
    }));
  });

  it("treats legacy cached state without a payload hash as a miss", () => {
    const stateEngine = createStateEngine({
      events: {
        cachedResponse: { bookedSlots: [{ bookingId: "legacy_booking" }] },
        meta: { updatedAt: Date.now() },
      },
    });

    expect(readFromStateEngineSource(payloadAwareSource, {
      payload: dashboardPayload(),
      stateEngine,
    })).toEqual(expect.objectContaining({
      hit: false,
      reason: "payload_hash_not_found",
    }));
  });

  it("stores the successful request hash with state freshness metadata", () => {
    const payload = dashboardPayload({
      widgetFromIso: "2026-08-06",
      widgetToIso: "2027-02-06",
    });
    const stateEngine = createStateEngine({ events: { meta: {} } });
    const updatedAt = Date.now();
    const context = {
      payload,
      stateEngine,
      pipeline: {
        readFrom: {
          enabled: true,
          sources: [payloadAwareSource],
        },
      },
      runtimeOptions: {},
    };

    writeFreshnessMetaToDestinations(context, '"dashboard-current"', updatedAt);

    expect(stateEngine.state.events.meta).toEqual({
      updatedAt,
      etag: '"dashboard-current"',
      payloadHash: buildPayloadHash(payload),
    });
  });

  it("preserves the request hash when a matching cache hit rehydrates metadata", async () => {
    const payload = dashboardPayload();
    const payloadHash = buildPayloadHash(payload);
    const updatedAt = Date.now();
    const cachedResponse = {
      bookedSlots: [{ bookingId: "booking_aug_6" }],
      meta: { bookedSlotsCount: 1 },
    };
    const stateEngine = createStateEngine({
      events: {
        cachedResponse,
        meta: {
          payloadHash,
          updatedAt,
          etag: '"dashboard-aug-6"',
        },
      },
    });
    const executeFlow = vi.fn();

    const result = await runReadPipeline({
      flowName: "test.payloadAwareDashboardRead",
      runId: "run_payload_cache_hit",
      payload,
      pipeline: {
        readFrom: {
          enabled: true,
          ttlMs: 30000,
          mode: "staleWhileRevalidate",
          priority: ["stateEngine"],
          sources: [payloadAwareSource],
        },
        localCache: { enabled: false },
        etag: { enabled: false },
        concurrency: { policy: "latestWins", dedupe: true, keyByPayload: true },
        destinations: [
          {
            type: "stateEngine",
            key: "events.cachedResponse",
            mode: "set",
            hydrateOnReadHit: true,
          },
          {
            type: "stateEngine",
            key: "events.meta",
            mode: "set",
            select: "meta",
            hydrateOnReadHit: true,
          },
        ],
      },
      runtimeOptions: {},
      stateEngine,
      executeFlow,
    });

    expect(result).toEqual(expect.objectContaining({
      ok: true,
      data: expect.objectContaining({
        bookedSlots: cachedResponse.bookedSlots,
        meta: expect.objectContaining({ bookedSlotsCount: 1, payloadHash }),
      }),
      meta: expect.objectContaining({ source: "destination" }),
    }));
    expect(executeFlow).not.toHaveBeenCalled();
    expect(stateEngine.state.events.meta).toEqual({
      bookedSlotsCount: 1,
      payloadHash,
      updatedAt,
      etag: '"dashboard-aug-6"',
    });
  });
});
