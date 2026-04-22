const MEDIA_TYPES = new Set(["image", "image-gallery", "video", "audio"]);
const VIDEO_EXTENSIONS = new Set(["mp4", "mov", "webm", "m4v", "avi"]);
const AUDIO_EXTENSIONS = new Set(["mp3", "m4a", "aac", "wav", "ogg", "flac"]);

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeText(value) {
  if (value === undefined || value === null) return "";
  return String(value).trim();
}

function readField(raw, item, keys) {
  for (const key of keys) {
    const rawValue = raw?.[key];
    if (rawValue !== undefined && rawValue !== null && rawValue !== "") return rawValue;

    const itemValue = item?.[key];
    if (itemValue !== undefined && itemValue !== null && itemValue !== "") return itemValue;
  }

  return null;
}

export function formatMediaDuration(value) {
  const formatted = normalizeText(value);
  if (!formatted) return "";
  if (formatted.includes(":")) return formatted;

  const seconds = Math.floor(Number(formatted));
  if (!Number.isFinite(seconds) || seconds < 0) return "";

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function resolveMediaKind(item = {}) {
  const raw = isObject(item?.raw) ? item.raw : {};
  const topLevelType = normalizeText(item?.type).toLowerCase();
  const rawType = normalizeText(readField(raw, item, ["type", "media_type", "mediaType"])).toLowerCase();

  if (MEDIA_TYPES.has(rawType)) return rawType;
  if (MEDIA_TYPES.has(topLevelType)) return topLevelType;
  if (topLevelType !== "media") return "";

  const extension = normalizeText(readField(raw, item, ["file_extension", "extension"])).toLowerCase();
  if (readField(raw, item, ["gallery_count", "gallery_count_formatted"]) !== null) return "image-gallery";
  if (readField(raw, item, ["video_duration", "video_duration_formatted", "trailer_url"]) !== null) return "video";
  if (readField(raw, item, ["audio_duration", "audio_duration_formatted"]) !== null) return "audio";
  if (VIDEO_EXTENSIONS.has(extension)) return "video";
  if (AUDIO_EXTENSIONS.has(extension)) return "audio";

  return "image";
}

export function getSpendingRequirementMediaBadge(item = {}) {
  const raw = isObject(item?.raw) ? item.raw : {};
  const topLevelType = normalizeText(item?.type).toLowerCase();
  const kind = resolveMediaKind(item);

  if (!kind) return null;
  if (topLevelType && topLevelType !== "media" && !MEDIA_TYPES.has(topLevelType)) return null;

  if (kind === "image-gallery") {
    const label = normalizeText(readField(raw, item, ["gallery_count_formatted", "gallery_count"]));
    return { kind, icon: "gallery", label };
  }

  if (kind === "video") {
    const formatted = readField(raw, item, ["video_duration_formatted"]);
    const duration = formatted || readField(raw, item, ["video_duration"]);
    return { kind, icon: "video", label: formatMediaDuration(duration) };
  }

  if (kind === "audio") {
    const formatted = readField(raw, item, ["audio_duration_formatted"]);
    const duration = formatted || readField(raw, item, ["audio_duration"]);
    return { kind, icon: "audio", label: formatMediaDuration(duration) };
  }

  return { kind: "image", icon: "image", label: "" };
}
