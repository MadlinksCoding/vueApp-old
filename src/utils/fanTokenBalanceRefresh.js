import { postToParent } from '@/utils/postToParent.js'

export const FS_FAN_BOOKING_BALANCE_REFRESH_REQUEST = 'FS_FAN_BOOKING_BALANCE_REFRESH_REQUEST'

function cleanOptionalText(value) {
  if (value === null || value === undefined) return undefined
  const normalized = String(value).trim()
  return normalized || undefined
}

function normalizeState(value) {
  return cleanOptionalText(value)?.toLowerCase() || ''
}

/**
 * Projects an authoritative booking/chat state into a stable signature when it
 * can affect a fan's token balance. Returning null keeps ordinary message and
 * card refreshes from causing balance requests.
 */
export function getFanBookingBalanceTransition(message, bookingLike = {}) {
  const bookingId = cleanOptionalText(
    bookingLike?.bookingId
      ?? bookingLike?.id
      ?? message?.content?.booking_id
      ?? message?.bookingId,
  )
  if (!bookingId) return null

  const action = normalizeState(message?.content?.action ?? message?.action)
  const status = normalizeState(bookingLike?.status ?? bookingLike?.bookingStatus)
  const paymentStatus = normalizeState(
    bookingLike?.paymentStatus
      ?? bookingLike?.payment?.status
      ?? bookingLike?.settlement?.paymentStatus,
  )
  const refundedTokens = Number(
    bookingLike?.cancellation?.refundedTokens
      ?? bookingLike?.settlement?.releasedTokens
      ?? bookingLike?.payment?.refundedTokens
      ?? 0,
  )
  const normalizedRefund = Number.isFinite(refundedTokens) && refundedTokens > 0
    ? refundedTokens
    : 0
  const terminal = action.startsWith('cancel')
    || action.startsWith('declin')
    || action.startsWith('reject')
    || status.startsWith('cancel')
    || status.startsWith('declin')
    || status.startsWith('reject')
    || paymentStatus === 'refunded'
    || paymentStatus === 'partial_refunded'
    || normalizedRefund > 0
  if (!terminal) return null

  const resolvedAction = action || status || paymentStatus || 'refunded'
  return {
    bookingId,
    action: resolvedAction,
    signature: [bookingId, action, status, paymentStatus, normalizedRefund].join('|'),
  }
}

/**
 * Requests a refresh of the WordPress token balance widgets after an
 * authoritative fan booking action succeeds. The WordPress host validates the
 * sending iframe and authenticated role before honoring the request.
 */
export function requestFanTokenBalanceRefresh(payload = {}) {
  if (typeof window === 'undefined' || !window.parent || window.parent === window) return false

  const normalized = {
    reason: cleanOptionalText(payload.reason) || 'booking-update',
    action: cleanOptionalText(payload.action),
    bookingId: cleanOptionalText(payload.bookingId),
  }

  postToParent(FS_FAN_BOOKING_BALANCE_REFRESH_REQUEST, normalized)
  return true
}
