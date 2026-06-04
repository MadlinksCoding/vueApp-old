import { buildWpApiUrl } from "./wpApiBaseUrl.js";

let cachedBannedWords = null;
let lastFetchedTime = 0;
let fetchingPromise = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Fetches the banned words list with a 5-minute cache duration and concurrent request locking.
 */
export async function fetchBannedWords() {
  const now = Date.now();
  
  // Return cached result if fresh
  if (cachedBannedWords && (now - lastFetchedTime < CACHE_DURATION)) {
    return cachedBannedWords;
  }
  
  // Return existing in-flight promise if fetching
  if (fetchingPromise) {
    return fetchingPromise;
  }
  
  fetchingPromise = (async () => {
    try {
      const url = buildWpApiUrl("chat/banned-lists");
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch banned words: ${response.status}`);
      }
      
      const data = await response.json();
      cachedBannedWords = Array.isArray(data?.bannedWords) ? data.bannedWords : [];
      lastFetchedTime = Date.now();
      return cachedBannedWords;
    } catch (error) {
      console.error("Error fetching banned words:", error);
      // Fall back to existing cached words or empty array on error
      return cachedBannedWords || [];
    } finally {
      fetchingPromise = null;
    }
  })();
  
  return fetchingPromise;
}

/**
 * Filters banned words inside a text message by replacing them case-insensitively with asterisks.
 * 
 * @param {string} text The input text to filter.
 * @returns {Promise<string>} The filtered text.
 */
export async function filterBannedWords(text) {
  if (typeof text !== "string" || !text) return text;
  
  const words = await fetchBannedWords();
  if (!words || words.length === 0) return text;
  
  let filteredText = text;
  
  // Sort descending by length so longer patterns take precedence
  const sortedWords = [...words]
    .filter(w => typeof w === "string" && w.trim() !== "")
    .sort((a, b) => b.length - a.length);
    
  for (const bannedWord of sortedWords) {
    const trimmed = bannedWord.trim();
    if (!trimmed) continue;
    
    // Treat '*' as a wildcard (matching a single alphanumeric/word character)
    const escaped = trimmed
      .replace(/[.+^${}()|[\]\\]/g, "\\$&") // Escape regex specials except *
      .replace(/\*/g, "[a-zA-Z0-9]");       // '*' matches single word char
      
    try {
      const regex = new RegExp(`\\b${escaped}\\b`, "gi");
      filteredText = filteredText.replace(regex, (match) => {
        return "*".repeat(match.length);
      });
    } catch (e) {
      // Fallback to safe literal matching if regex build fails
      let idx = filteredText.toLowerCase().indexOf(trimmed.toLowerCase());
      while (idx !== -1) {
        const matchLen = trimmed.length;
        const beforeChar = idx > 0 ? filteredText[idx - 1] : "";
        const afterChar = idx + matchLen < filteredText.length ? filteredText[idx + matchLen] : "";
        
        const isBeforeBoundary = !beforeChar || /\\W/.test(beforeChar);
        const isAfterBoundary = !afterChar || /\\W/.test(afterChar);
        
        if (isBeforeBoundary && isAfterBoundary) {
          filteredText = filteredText.substring(0, idx) + "*".repeat(matchLen) + filteredText.substring(idx + matchLen);
          idx = filteredText.toLowerCase().indexOf(trimmed.toLowerCase(), idx + matchLen);
        } else {
          idx = filteredText.toLowerCase().indexOf(trimmed.toLowerCase(), idx + 1);
        }
      }
    }
  }
  
  return filteredText;
}

/**
 * Resets the cache manually (primarily useful for testing).
 */
export function resetBannedWordsCache() {
  cachedBannedWords = null;
  lastFetchedTime = 0;
  fetchingPromise = null;
}
