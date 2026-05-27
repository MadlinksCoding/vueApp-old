import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { fetchBannedWords, filterBannedWords, resetBannedWordsCache } from "../utils/bannedWordsFilter.js";

describe("Banned Words Filter & Cache", () => {
  let fetchMock;

  beforeEach(() => {
    resetBannedWordsCache();
    vi.useFakeTimers();

    fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            bannedWords: ["***e", "**pe", "*ape", "6teen"],
          }),
      })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("should fetch and cache banned words correctly", async () => {
    const list1 = await fetchBannedWords();
    expect(list1).toEqual(["***e", "**pe", "*ape", "6teen"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Second call immediately after should hit cache, not trigger another fetch
    const list2 = await fetchBannedWords();
    expect(list2).toEqual(["***e", "**pe", "*ape", "6teen"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("should handle concurrent requests gracefully and reuse the in-flight promise", async () => {
    const [list1, list2] = await Promise.all([
      fetchBannedWords(),
      fetchBannedWords(),
    ]);

    expect(list1).toEqual(["***e", "**pe", "*ape", "6teen"]);
    expect(list2).toEqual(["***e", "**pe", "*ape", "6teen"]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("should refresh the cache after 5 minutes", async () => {
    await fetchBannedWords();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Advance timer by 4 minutes and 59 seconds (cache remains valid)
    vi.advanceTimersByTime(4 * 60 * 1000 + 59 * 1000);
    await fetchBannedWords();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Advance timer by another 2 seconds (exceeding 5-minute cache lifespan)
    vi.advanceTimersByTime(2 * 1000);
    await fetchBannedWords();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("should mask exact and wildcard matching patterns case-insensitively", async () => {
    const text1 = "Let's meet at 6teen o'clock.";
    const filtered1 = await filterBannedWords(text1);
    // '6teen' matches exactly -> masked to '*****'
    expect(filtered1).toBe("Let's meet at ***** o'clock.");

    const text2 = "Do you want to watch the tape?";
    const filtered2 = await filterBannedWords(text2);
    // '*ape' matches 'tape' -> masked to '****'
    expect(filtered2).toBe("Do you want to watch the ****?");

    const text3 = "I hope this is clear.";
    const filtered3 = await filterBannedWords(text3);
    // '**pe' matches 'hope' -> masked to '****'
    expect(filtered3).toBe("I **** this is clear.");
  });

  it("should gracefully handle null/empty inputs", async () => {
    expect(await filterBannedWords(null)).toBeNull();
    expect(await filterBannedWords("")).toBe("");
    expect(await filterBannedWords(undefined)).toBeUndefined();
  });
});
