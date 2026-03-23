function parseDateLike(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeBaseUrl(baseUrl = '') {
  if (typeof baseUrl !== 'string') return '';
  return baseUrl.trim().replace(/\/+$/, '');
}

export function buildScheduledMeetingUrl(bookingId, baseUrl = import.meta.env.VITE_WEB_BASE_URL) {
  const normalizedBookingId = typeof bookingId === 'string' || typeof bookingId === 'number'
    ? String(bookingId).trim()
    : '';
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  if (!normalizedBookingId || !normalizedBaseUrl) return null;
  return `${normalizedBaseUrl}/scheduled-meeting/?booking_id=${encodeURIComponent(normalizedBookingId)}`;
}

export function getBookingJoinState({
  bookingId,
  startAt,
  endAt,
  status,
  baseUrl = import.meta.env.VITE_WEB_BASE_URL,
  now = new Date(),
} = {}) {
  const startDate = parseDateLike(startAt);
  const endDate = parseDateLike(endAt);
  const currentDate = parseDateLike(now) || new Date();
  const normalizedStatus = String(status || '').trim().toLowerCase();
  const scheduledMeetingUrl = buildScheduledMeetingUrl(bookingId, baseUrl);

  if (!scheduledMeetingUrl || !startDate || !endDate) {
    return {
      canJoin: false,
      joinUrl: null,
      startDate,
      endDate,
    };
  }

  if (normalizedStatus.startsWith('cancelled')) {
    return {
      canJoin: false,
      joinUrl: scheduledMeetingUrl,
      startDate,
      endDate,
    };
  }

  const nowMs = currentDate.getTime();
  const startMs = startDate.getTime();
  const endMs = endDate.getTime();
  const joinWindowStartMs = startMs - (5 * 60 * 1000);
  const canJoin = nowMs >= joinWindowStartMs && nowMs < endMs;

  return {
    canJoin,
    joinUrl: scheduledMeetingUrl,
    startDate,
    endDate,
  };
}
