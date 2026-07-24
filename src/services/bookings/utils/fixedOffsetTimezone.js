const MINUTE_MS = 60 * 1000;

export const CIVIL_TIME_OFFSET_MINUTES = Object.freeze([
  -720, -660, -600, -570, -540, -480, -420, -360, -300, -240,
  -210, -180, -150, -120, -60, 0, 60, 120, 180, 210, 240, 270, 300,
  330, 345, 360, 390, 420, 480, 525, 540, 570, 600, 630, 660,
  720, 765, 780, 825, 840,
]);

function pad2(value) {
  return String(value).padStart(2, '0');
}

export function getBrowserOffsetMinutes(date = new Date()) {
  const offset = -Number(date?.getTimezoneOffset?.());
  return Number.isFinite(offset) ? offset : 0;
}

export function formatGmtOffsetLabel(offsetMinutes) {
  const normalized = Number(offsetMinutes);
  const safeOffset = Number.isFinite(normalized) ? Math.trunc(normalized) : 0;
  const sign = safeOffset >= 0 ? '+' : '-';
  const absoluteMinutes = Math.abs(safeOffset);
  return `GMT${sign}${pad2(Math.floor(absoluteMinutes / 60))}:${pad2(absoluteMinutes % 60)}`;
}

export function getFixedOffsetDateTimeParts(timestamp, offsetMinutes) {
  const timestampMs = timestamp instanceof Date ? timestamp.getTime() : Number(timestamp);
  const normalizedOffset = Number(offsetMinutes);
  if (!Number.isFinite(timestampMs) || !Number.isFinite(normalizedOffset)) return null;

  const shifted = new Date(timestampMs + (normalizedOffset * MINUTE_MS));
  if (Number.isNaN(shifted.getTime())) return null;

  const year = shifted.getUTCFullYear();
  const month = pad2(shifted.getUTCMonth() + 1);
  const day = pad2(shifted.getUTCDate());
  const hour = pad2(shifted.getUTCHours());
  const minute = pad2(shifted.getUTCMinutes());

  return {
    dateIso: `${year}-${month}-${day}`,
    hm: `${hour}:${minute}`,
    year,
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
  };
}

export function formatTimestampInFixedOffset(timestamp, offsetMinutes, locale = 'en-US', options = {}) {
  const parts = getFixedOffsetDateTimeParts(timestamp, offsetMinutes);
  if (!parts) return '';

  const displayDate = new Date(Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
  ));

  return new Intl.DateTimeFormat(locale, {
    timeZone: 'UTC',
    ...options,
  }).format(displayDate);
}
