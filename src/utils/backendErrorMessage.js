const DEFAULT_MESSAGE_KEYS = [
  "messages",
  "errors",
  "message",
  "errorMessage",
  "error_message",
  "detail",
  "reason",
  "description",
];

const ERROR_VALUE_KEYS = ["error"];
const CODE_VALUE_KEYS = ["code"];

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function normalizeText(value) {
  if (typeof value !== "string") return "";
  return value.trim();
}

function normalizeComparable(value) {
  return normalizeText(value).toLowerCase();
}

function collectMessageValues(value, options = {}, depth = 0) {
  if (depth > 6 || value == null) return [];

  if (typeof value === "string") return [value];

  if (Array.isArray(value)) {
    return value.flatMap((item) => collectMessageValues(item, options, depth + 1));
  }

  if (!isObject(value)) return [];

  const keys = [
    ...DEFAULT_MESSAGE_KEYS,
    ...(options.includeErrorValues ? ERROR_VALUE_KEYS : []),
    ...(options.includeCodeValues ? CODE_VALUE_KEYS : []),
  ];

  const messages = [];

  keys.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      messages.push(...collectMessageValues(value[key], options, depth + 1));
    }
  });

  if (Object.prototype.hasOwnProperty.call(value, "validation")) {
    messages.push(...collectMessageValues(value.validation, options, depth + 1));
  }

  if (Object.prototype.hasOwnProperty.call(value, "details")) {
    messages.push(...collectMessageValues(value.details, options, depth + 1));
  }

  if (Object.prototype.hasOwnProperty.call(value, "data")) {
    messages.push(...collectMessageValues(value.data, options, depth + 1));
  }

  if (Object.prototype.hasOwnProperty.call(value, "response")) {
    messages.push(...collectMessageValues(value.response, options, depth + 1));
  }

  if (Object.prototype.hasOwnProperty.call(value, "body")) {
    messages.push(...collectMessageValues(value.body, options, depth + 1));
  }

  return messages;
}

function getPathValue(source, path) {
  return path.reduce((current, key) => {
    if (!isObject(current) && !Array.isArray(current)) return undefined;
    return current?.[key];
  }, source);
}

export function extractBackendErrorMessage(source, options = {}) {
  const ignoredMessages = new Set((options.ignoredMessages || []).map(normalizeComparable).filter(Boolean));
  const messageOptions = {
    includeErrorValues: options.includeErrorValues !== false,
    includeCodeValues: options.includeCodeValues === true,
  };

  const paths = [
    ["error", "details", "validation"],
    ["error", "details", "details"],
    ["error", "details", "response", "data"],
    ["error", "details", "response", "body"],
    ["error", "details", "data"],
    ["error", "details", "body"],
    ["error", "details"],
    ["error"],
    ["details"],
    ["data"],
    [],
  ];

  const seen = new Set();

  for (const path of paths) {
    const value = path.length ? getPathValue(source, path) : source;
    const messages = collectMessageValues(value, messageOptions);

    for (const message of messages) {
      const text = normalizeText(message);
      const comparable = normalizeComparable(text);
      if (!text || seen.has(comparable) || ignoredMessages.has(comparable)) continue;
      seen.add(comparable);
      return text;
    }
  }

  return "";
}
