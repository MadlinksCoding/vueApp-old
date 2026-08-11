function parseDateLike(value) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeBaseUrl(baseUrl = '') {
  if (typeof baseUrl !== 'string') return '';
  return baseUrl.trim().replace(/\/+$/, '');
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null);
}

function firstNonBlank(...values) {
  return values.find((value) => (
    value !== undefined
    && value !== null
    && (typeof value !== 'string' || value.trim() !== '')
  ));
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

const JOIN_WINDOW_MINUTES_BEFORE_START = 5;
const PENDING_APPROVAL_STATUSES = new Set(['pending', 'pending_hold']);

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

export function buildScheduledGroupMeetingUrl({ eventId, startIso } = {}, baseUrl = import.meta.env.VITE_WEB_BASE_URL) {
  const normalizedEventId = typeof eventId === 'string' || typeof eventId === 'number'
    ? String(eventId).trim()
    : '';
  const normalizedStartIso = typeof startIso === 'string' || typeof startIso === 'number'
    ? String(startIso).trim()
    : '';
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl);

  if (!normalizedEventId || !normalizedStartIso || !normalizedBaseUrl) return null;

  const params = new URLSearchParams({
    event_id: normalizedEventId,
    start_iso: normalizedStartIso,
  });
  return `${normalizedBaseUrl}/scheduled-meeting/?${params.toString()}`;
}

export function openScheduledMeetingOverlay(
  value,
  {
    source = 'frontend',
    browserWindow = typeof window !== 'undefined' ? window : null,
  } = {},
) {
  if (!browserWindow || typeof value !== 'string' || !value.trim()) return false;

  let url;
  try {
    url = new URL(value, browserWindow.location?.href);
  } catch (_error) {
    return false;
  }

  const pathname = String(url.pathname || '').replace(/\/+$/, '') || '/';
  const bookingId = String(url.searchParams.get('booking_id') || '').trim();
  const eventId = String(url.searchParams.get('event_id') || '').trim();
  const startIso = String(url.searchParams.get('start_iso') || '').trim();
  if (
    url.origin !== browserWindow.location?.origin
    || pathname !== '/scheduled-meeting'
    || (!bookingId && !(eventId && startIso))
  ) {
    return false;
  }

  const candidateWindows = [browserWindow];
  try {
    if (
      browserWindow.top
      && browserWindow.top !== browserWindow
      && browserWindow.top.location?.origin === browserWindow.location?.origin
    ) {
      candidateWindows.push(browserWindow.top);
    }
  } catch (_error) {
    // Cross-origin top windows cannot host the same-origin WordPress overlay.
  }

  for (const candidateWindow of candidateWindows) {
    try {
      const overlay = candidateWindow?.FSScheduledCallOverlay;
      if (overlay && typeof overlay.open === 'function') {
        overlay.open(url.toString(), { source });
        return true;
      }
    } catch (_error) {
      // Continue to the normal top-level navigation fallback.
    }
  }

  return false;
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
  const joinAvailableAtDate = startDate
    ? new Date(startDate.getTime() - (JOIN_WINDOW_MINUTES_BEFORE_START * 60 * 1000))
    : null;
  const joinAvailableAtIso = joinAvailableAtDate ? joinAvailableAtDate.toISOString() : null;

  if (!scheduledMeetingUrl || !startDate || !endDate) {
    return {
      canJoin: false,
      joinUrl: null,
      startDate,
      endDate,
      effectiveEndDate: endDate,
      joinAvailableAtDate,
      joinAvailableAtIso,
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
      joinAvailableAtDate,
      joinAvailableAtIso,
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
  const joinWindowStartMs = startDate.getTime() - (JOIN_WINDOW_MINUTES_BEFORE_START * 60 * 1000);
  const canJoin = nowMs >= joinWindowStartMs && nowMs < effectiveEndDate.getTime();

  return {
    canJoin,
    joinUrl: scheduledMeetingUrl,
    startDate,
    endDate,
    effectiveEndDate,
    joinAvailableAtDate,
    joinAvailableAtIso,
    reminderMinutes: effectiveReminderMinutes,
  };
}

export function getCalendarEventJoinState(
  event = {},
  {
    viewerRole = 'fan',
    now = new Date(),
    baseUrl = import.meta.env.VITE_WEB_BASE_URL,
  } = {},
) {
  const source = event && typeof event === 'object' ? event : {};
  const raw = source.raw && typeof source.raw === 'object' ? source.raw : {};
  const eventSnapshot = raw.eventSnapshot && typeof raw.eventSnapshot === 'object'
    ? raw.eventSnapshot
    : {};
  const eventCurrent = raw.eventCurrent && typeof raw.eventCurrent === 'object'
    ? raw.eventCurrent
    : {};

  const bookingId = firstNonBlank(
    source.bookingId,
    raw.bookingId,
    eventSnapshot.bookingId,
    eventCurrent.bookingId,
  ) ?? null;
  const eventId = firstNonBlank(
    source.eventId,
    raw.eventId,
    eventSnapshot.eventId,
    eventCurrent.eventId,
  ) ?? null;
  const startAt = firstNonBlank(
    source.start,
    source.startIso,
    source.startAtIso,
    raw.startIso,
    raw.startAtIso,
    raw.start,
    eventSnapshot.startIso,
    eventSnapshot.startAtIso,
    eventCurrent.startIso,
    eventCurrent.startAtIso,
  ) ?? null;
  const endAt = firstNonBlank(
    source.end,
    source.endIso,
    source.endAtIso,
    raw.endIso,
    raw.endAtIso,
    raw.end,
    eventSnapshot.endIso,
    eventSnapshot.endAtIso,
    eventCurrent.endIso,
    eventCurrent.endAtIso,
  ) ?? null;
  const status = String(firstNonBlank(
    source.status,
    source.bookingStatus,
    raw.status,
    raw.bookingStatus,
    eventSnapshot.status,
    eventCurrent.status,
  ) ?? '').trim().toLowerCase();
  const eventType = String(firstNonBlank(
    source.eventType,
    source.type,
    raw.eventType,
    raw.type,
    eventSnapshot.eventType,
    eventSnapshot.type,
    eventCurrent.eventType,
    eventCurrent.type,
  ) ?? '').trim().toLowerCase();
  const isGroup = eventType.includes('group');

  const joinState = getBookingJoinState({
    bookingId,
    startAt,
    endAt,
    status,
    enableCallReminderMinutesBefore: firstDefined(
      source.enableCallReminderMinutesBefore,
      raw.enableCallReminderMinutesBefore,
      eventSnapshot.enableCallReminderMinutesBefore,
      eventCurrent.enableCallReminderMinutesBefore,
      source.setReminders,
      raw.setReminders,
      eventSnapshot.setReminders,
      eventCurrent.setReminders,
    ),
    callReminderMinutesBefore: firstDefined(
      source.callReminderMinutesBefore,
      raw.callReminderMinutesBefore,
      raw.reminderMinutes,
      eventSnapshot.callReminderMinutesBefore,
      eventSnapshot.reminderMinutes,
      eventCurrent.callReminderMinutesBefore,
      eventCurrent.reminderMinutes,
    ),
    reminderMinutes: firstDefined(
      source.reminderMinutes,
      raw.reminderMinutes,
      eventSnapshot.reminderMinutes,
      eventCurrent.reminderMinutes,
    ),
    extensions: firstDefined(
      source.extensions,
      raw.extensions,
      eventSnapshot.extensions,
      eventCurrent.extensions,
      [],
    ),
    baseUrl,
    now,
  });

  const creatorGroupJoinUrl = isGroup && String(viewerRole || '').trim().toLowerCase() === 'creator'
    ? buildScheduledGroupMeetingUrl({ eventId, startIso: startAt }, baseUrl)
    : null;
  const explicitJoinUrl = firstNonBlank(
    source.joinUrl,
    source.callUrl,
    raw.joinUrl,
    raw.callUrl,
    eventSnapshot.joinUrl,
    eventSnapshot.callUrl,
    eventCurrent.joinUrl,
    eventCurrent.callUrl,
  ) ?? null;
  const joinUrl = creatorGroupJoinUrl || joinState.joinUrl || explicitJoinUrl;

  return {
    ...joinState,
    bookingId,
    eventId,
    startAt,
    endAt,
    status,
    eventType,
    isGroup,
    joinUrl,
    canJoin: joinState.canJoin && Boolean(joinUrl),
  };
}

export function getCalendarEventApprovalState(
  event = {},
  { now = new Date() } = {},
) {
  const wrappedSource = event && typeof event === 'object' ? event : {};
  const source = wrappedSource.sourceEvent && typeof wrappedSource.sourceEvent === 'object'
    ? wrappedSource.sourceEvent
    : wrappedSource.event && typeof wrappedSource.event === 'object'
      ? wrappedSource.event
      : wrappedSource;
  const raw = source.raw && typeof source.raw === 'object' ? source.raw : {};
  const eventSnapshot = raw.eventSnapshot && typeof raw.eventSnapshot === 'object'
    ? raw.eventSnapshot
    : {};
  const eventCurrent = raw.eventCurrent && typeof raw.eventCurrent === 'object'
    ? raw.eventCurrent
    : {};
  const status = String(firstNonBlank(
    source.status,
    source.bookingStatus,
    raw.status,
    raw.bookingStatus,
    eventSnapshot.status,
    eventCurrent.status,
  ) ?? '').trim().toLowerCase();
  const startAt = firstNonBlank(
    source.start,
    source.startIso,
    source.startAtIso,
    raw.startIso,
    raw.startAtIso,
    raw.start,
    eventSnapshot.startIso,
    eventSnapshot.startAtIso,
    eventCurrent.startIso,
    eventCurrent.startAtIso,
  ) ?? null;
  const startDate = startAt == null ? null : parseDateLike(startAt);
  const currentDate = parseDateLike(now) || new Date();
  const isPending = PENDING_APPROVAL_STATUSES.has(status);
  const approvalWindowClosed = Boolean(
    isPending
    && startDate
    && currentDate.getTime() >= startDate.getTime()
  );

  return {
    status,
    startAt,
    startDate,
    isPending,
    approvalWindowClosed,
    canReview: isPending && !approvalWindowClosed,
  };
}
