function toPlainCloneable(value, seen = new WeakSet()) {
  if (value === null || value === undefined) return value ?? null;
  const type = typeof value;

  if (type === "string" || type === "number" || type === "boolean") {
    return Number.isNaN(value) ? null : value;
  }

  if (type === "bigint") return value.toString();
  if (type === "function" || type === "symbol") return undefined;

  if (Object.prototype.toString.call(value) === "[object Date]") {
    const timestamp = value.getTime();
    return Number.isFinite(timestamp) ? value.toISOString() : null;
  }

  if (type !== "object") return undefined;
  if (seen.has(value)) return undefined;
  seen.add(value);

  if (Array.isArray(value)) {
    const output = [];
    for (const item of value) {
      const cloned = toPlainCloneable(item, seen);
      if (cloned !== undefined) output.push(cloned);
    }
    return output;
  }

  if (Object.prototype.toString.call(value) !== "[object Object]") {
    return undefined;
  }

  const output = {};
  let keys = [];
  try {
    keys = Object.keys(value);
  } catch {
    return undefined;
  }

  for (const key of keys) {
    if (key.startsWith("__v_")) continue;
    const cloned = toPlainCloneable(value[key], seen);
    if (cloned !== undefined) output[key] = cloned;
  }
  return output;
}

export function toCloneSafePayload(value) {
  return toPlainCloneable(value);
}
