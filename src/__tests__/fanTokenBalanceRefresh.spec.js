import { beforeEach, describe, expect, it, vi } from 'vitest'

const { postToParent } = vi.hoisted(() => ({ postToParent: vi.fn() }))

vi.mock('@/utils/postToParent.js', () => ({ postToParent }))

import {
  FS_FAN_BOOKING_BALANCE_REFRESH_REQUEST,
  getFanBookingBalanceTransition,
  requestFanTokenBalanceRefresh,
} from '@/utils/fanTokenBalanceRefresh.js'

describe('requestFanTokenBalanceRefresh', () => {
  beforeEach(() => {
    postToParent.mockReset()
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: { postMessage: vi.fn() },
    })
  })

  it('posts a normalized diagnostic payload to the WordPress parent', () => {
    expect(requestFanTokenBalanceRefresh({
      reason: ' booking-details-update ',
      action: ' accept_adjustment ',
      bookingId: ' booking-42 ',
    })).toBe(true)

    expect(postToParent).toHaveBeenCalledWith(
      FS_FAN_BOOKING_BALANCE_REFRESH_REQUEST,
      {
        reason: 'booking-details-update',
        action: 'accept_adjustment',
        bookingId: 'booking-42',
      },
    )
  })

  it('does nothing outside an iframe', () => {
    Object.defineProperty(window, 'parent', {
      configurable: true,
      value: window,
    })

    expect(requestFanTokenBalanceRefresh({ action: 'cancel' })).toBe(false)
    expect(postToParent).not.toHaveBeenCalled()
  })

  it.each([
    [{ status: 'cancelled_fan' }, 'cancelled_fan'],
    [{ paymentStatus: 'refunded' }, 'refunded'],
    [{ payment: { status: 'partial_refunded' } }, 'partial_refunded'],
    [{ settlement: { releasedTokens: 12 } }, 'refunded'],
  ])('projects authoritative terminal/refund state for remote refreshes', (booking, expectedAction) => {
    const transition = getFanBookingBalanceTransition(
      { content: { booking_id: 'booking-remote' } },
      booking,
    )

    expect(transition).toMatchObject({
      bookingId: 'booking-remote',
      action: expectedAction,
    })
    expect(transition.signature).toContain('booking-remote')
  })

  it('uses a chat cancellation action even before the cached booking is updated', () => {
    expect(getFanBookingBalanceTransition({
      content: { booking_id: 'booking-chat', action: 'cancelled_by_creator' },
    })).toMatchObject({
      bookingId: 'booking-chat',
      action: 'cancelled_by_creator',
    })
  })

  it('ignores ordinary non-terminal booking updates and missing booking identity', () => {
    expect(getFanBookingBalanceTransition(
      { content: { booking_id: 'booking-pending', action: 'updated' } },
      { status: 'confirmed', paymentStatus: 'held' },
    )).toBeNull()
    expect(getFanBookingBalanceTransition({}, { status: 'cancelled' })).toBeNull()
  })
})
