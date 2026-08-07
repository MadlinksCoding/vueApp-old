import { describe, expect, it, vi } from "vitest";

import { flowRegistry } from "@/services/flow-system/flowRegistry.js";
import {
  flushCacheEntry,
  readCacheEntry,
  writeCacheEntry,
} from "@/services/flow-system/runtime/cacheRuntime.js";
import { loadEtag, saveEtag } from "@/services/flow-system/runtime/etagRuntime.js";

describe("flow cache quota handling", () => {
  it("keeps successful flow data in memory when browser storage exceeds its quota", () => {
    const key = "quota-fallback";
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => {
        throw new DOMException("Storage quota exceeded", "QuotaExceededError");
      }),
      removeItem: vi.fn(),
    };

    expect(() => writeCacheEntry({
      storage,
      key,
      data: { events: [{ eventId: "evt-large" }] },
      ttlMs: 30000,
      version: 1,
    })).not.toThrow();

    expect(readCacheEntry({ storage, key, version: 1 })).toEqual(expect.objectContaining({
      hit: true,
      record: expect.objectContaining({
        data: { events: [{ eventId: "evt-large" }] },
      }),
    }));
  });

  it("treats cache removal as best-effort when browser storage is unavailable", () => {
    const key = "unavailable-storage-cleanup";
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => {
        throw new DOMException("Storage unavailable", "SecurityError");
      }),
      removeItem: vi.fn(() => {
        throw new DOMException("Storage unavailable", "SecurityError");
      }),
    };

    writeCacheEntry({ storage, key, data: { ok: true } });
    expect(() => flushCacheEntry({ storage, key })).not.toThrow();
    expect(readCacheEntry({ storage, key, version: 1 }).hit).toBe(false);
  });

  it("falls back to memory when an etag cannot be persisted", () => {
    const key = "quota-etag-fallback";
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => {
        throw new DOMException("Storage quota exceeded", "QuotaExceededError");
      }),
    };

    expect(() => saveEtag({ storage, key, etag: '"dashboard-v2"' })).not.toThrow();
    expect(loadEtag({ storage, key })).toBe('"dashboard-v2"');
  });

  it("keeps the dashboard context in state while clearing its legacy local entry", () => {
    const pipeline = flowRegistry["bookings.fetchDashboardBookingContext"].pipeline;

    expect(flowRegistry["events.fetchCreatorEvents"].pipeline.localCache.enabled).toBe(true);
    expect(pipeline.localCache.enabled).toBe(false);
    expect(pipeline.readFrom.priority).toEqual(["stateEngine"]);
    expect(pipeline.readFrom.sources).toContainEqual(expect.objectContaining({
      type: "stateEngine",
      key: "events.cachedResponse",
      varyByPayload: true,
      payloadHashKey: "events.meta.payloadHash",
    }));
    expect(pipeline.readFrom.sources).not.toContainEqual(
      expect.objectContaining({ type: "local" }),
    );
    expect(pipeline.destinations).toContainEqual({
      type: "localFlush",
      key: "dashboard-events:context",
    });
    expect(pipeline.destinations).not.toContainEqual(
      expect.objectContaining({ type: "local", key: "dashboard-events:context" }),
    );
    expect(pipeline.destinations).not.toContainEqual(
      expect.objectContaining({ type: "stateEngine", key: "events.widgetBookedSlotsRaw" }),
    );
  });
});
