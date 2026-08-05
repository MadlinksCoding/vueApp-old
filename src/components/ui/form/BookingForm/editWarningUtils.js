export function normalizeEditWarningValue(value) {
  if (value === null || value === undefined) return "";

  if (Array.isArray(value)) {
    return value.map((item) => normalizeEditWarningValue(item));
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? "" : value.toISOString();
  }

  if (typeof value === "object") {
    return Object.keys(value)
      .sort()
      .reduce((normalized, key) => {
        normalized[key] = normalizeEditWarningValue(value[key]);
        return normalized;
      }, {});
  }

  return value;
}

export function getEditWarningValue(source, path) {
  if (!String(path || "").trim()) return undefined;
  return String(path || "")
    .split(".")
    .filter(Boolean)
    .reduce((value, key) => value?.[key], source);
}

export function editWarningValuesEqual(left, right) {
  return JSON.stringify(normalizeEditWarningValue(left))
    === JSON.stringify(normalizeEditWarningValue(right));
}

export function hasEditWarningChange(baseline, current, fields) {
  if (!baseline || typeof baseline !== "object" || Object.keys(baseline).length === 0) {
    return false;
  }
  const list = Array.isArray(fields) ? fields : [fields];
  return list
    .filter(Boolean)
    .some((field) => (
      !editWarningValuesEqual(
        getEditWarningValue(baseline, field),
        getEditWarningValue(current, field),
      )
    ));
}
