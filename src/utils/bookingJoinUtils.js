function parseDateLike(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeBaseUrl(baseUrl = '') {
  if (typeof baseUrl !== 'string') return '';
  return baseUrl.trim().replace(/\/+$/, '');
}

function toBoolean(value) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0' || normalized === '') return false;
  }
  return false;
}

function resolveReminderMinutes({ enableCallReminderMinutesBefore, callReminderMinutesBefore, reminderMinutes } = {}) {
  const enabled = toBoolean(enableCallReminderMinutesBefore);
  const configuredMinutes = Number(callReminderMinutesBefore ?? reminderMinutes ?? 0);

  if (enabled && Number.isFinite(configuredMinutes) && configuredMinutes > 0) {
    return configuredMinutes;
  }

  return 5;
}

function getEffectiveEndDate(endDate, extensions = []) {
  const allowedStatuses = new Set(['held', 'captured']);
  const dates = [endDate];

  (Array.isArray(extensions) ? extensions : []).forEach((extension) => {
    const status = String(extension?.status || '').trim().toLowerCase();
    if (!allowedStatuses.has(status)) return;

    const extensionEndDate = parseDateLike(extension?.endAtIso || extension?.endIso || extension?.endAt);
    if (extensionEndDate) dates.push(extensionEndDate);
  });

  return dates.reduce((latest, date) => (
    date.getTime() > latest.getTime() ? date : latest
  ), endDate);
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
  enableCallReminderMinutesBefore = false,
  callReminderMinutesBefore = null,
  reminderMinutes = null,
  extensions = [],
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
      effectiveEndDate: endDate,
      reminderMinutes: resolveReminderMinutes({ enableCallReminderMinutesBefore, callReminderMinutesBefore, reminderMinutes }),
    };
  }

  if (normalizedStatus !== 'confirmed') {
    return {
      canJoin: false,
      joinUrl: scheduledMeetingUrl,
      startDate,
      endDate,
      effectiveEndDate: endDate,
      reminderMinutes: resolveReminderMinutes({ enableCallReminderMinutesBefore, callReminderMinutesBefore, reminderMinutes }),
    };
  }

  const effectiveReminderMinutes = resolveReminderMinutes({
    enableCallReminderMinutesBefore,
    callReminderMinutesBefore,
    reminderMinutes,
  });
  const effectiveEndDate = getEffectiveEndDate(endDate, extensions);
  const nowMs = currentDate.getTime();
  const joinWindowStartMs = startDate.getTime() - (effectiveReminderMinutes * 60 * 1000);
  const canJoin = nowMs >= joinWindowStartMs && nowMs < effectiveEndDate.getTime();

  return {
    canJoin,
    joinUrl: scheduledMeetingUrl,
    startDate,
    endDate,
    effectiveEndDate,
    reminderMinutes: effectiveReminderMinutes,
  };
}
