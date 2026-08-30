import { defineComponent, nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useBookingAdjustmentDecision } from '@/composables/useBookingAdjustmentDecision.js';

const mocks = vi.hoisted(() => ({
  tokenGet: vi.fn(),
  tokenWaitForBalance: vi.fn(),
  profileFetch: vi.fn(),
}));

vi.mock('@/utils/TokenHandler.js', () => ({
  default: { get: mocks.tokenGet, waitForBalance: mocks.tokenWaitForBalance },
}));

vi.mock('@/services/users/userProfileApi.js', () => ({
  fetchUserProfileData: mocks.profileFetch,
}));

function bookingFixture(overrides = {}) {
  return {
    bookingId: 'booking_123',
    eventId: 'event_123',
    creatorId: 6586,
    userId: 6074,
    status: 'pending',
    startAtIso: '2027-08-14T10:00:00Z',
    endAtIso: '2027-08-14T10:10:00Z',
    payment: {
      total: 10,
      paymentPolicyVersion: 2,
      allocations: { service: 7, bookingFee: 1, cancellationFee: 2 },
    },
    eventSnapshot: {
      enableCancellationFee: true,
      cancellationFeeTokens: 2,
    },
    eventCurrent: { status: 'published' },
    ...overrides,
  };
}

function mountDecisionState(initialBooking) {
  const booking = ref(initialBooking);
  let state;
  const wrapper = mount(defineComponent({
    setup() {
      state = useBookingAdjustmentDecision(booking, { viewerRole: () => 'fan' });
      return {};
    },
    template: '<div />',
  }));
  return { booking, state, wrapper };
}

describe('useBookingAdjustmentDecision cancellation settlement projection', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-25T12:00:00Z'));
    mocks.tokenGet.mockReset();
    mocks.tokenGet.mockResolvedValue(318);
    mocks.tokenWaitForBalance.mockReset();
    mocks.tokenWaitForBalance.mockResolvedValue({ ready: true, reason: 'ready', balance: 335, attempts: 2, elapsedMs: 250 });
    mocks.profileFetch.mockReset();
    mocks.profileFetch.mockResolvedValue({ username: 'creator' });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each(['pending', 'pending_hold'])('releases cancellation fee but retains booking fee for %s cancellation', async (status) => {
    const { state, wrapper } = mountDecisionState(bookingFixture({ status }));
    state.open('cancel');
    await nextTick();

    expect(state.popupProps.value).toEqual(expect.objectContaining({
      sessionRefundTokens: 10,
      bookingFeeTokens: 1,
      cancellationFeeTokens: 2,
      bookingFeeRefundable: false,
      cancellationFeeRefundable: true,
      netRefundTokens: 9,
    }));
    wrapper.unmount();
  });

  it('releases the cancellation fee for confirmed advance cancellation', async () => {
    const { state, wrapper } = mountDecisionState(bookingFixture({
      status: 'confirmed',
      eventSnapshot: {
        enableCancellationFee: true,
        cancellationFeeTokens: 2,
        allowAdvanceCancelToAvoidMinCharge: true,
        advanceCancelWindowQuantity: 1,
        advanceCancelWindowUnit: 'day',
      },
    }));
    state.open('cancel');
    await nextTick();

    expect(state.popupProps.value).toEqual(expect.objectContaining({
      bookingFeeRefundable: false,
      cancellationFeeRefundable: true,
      netRefundTokens: 9,
    }));
    wrapper.unmount();
  });

  it('retains both fees for confirmed late cancellation', async () => {
    const { state, wrapper } = mountDecisionState(bookingFixture({
      status: 'confirmed',
      startAtIso: '2026-08-25T12:30:00Z',
      endAtIso: '2026-08-25T12:40:00Z',
      eventSnapshot: {
        enableCancellationFee: true,
        cancellationFeeTokens: 2,
        allowAdvanceCancelToAvoidMinCharge: true,
        advanceCancelWindowQuantity: 1,
        advanceCancelWindowUnit: 'hour',
      },
    }));
    state.open('cancel');
    await nextTick();

    expect(state.popupProps.value).toEqual(expect.objectContaining({
      bookingFeeRefundable: false,
      cancellationFeeRefundable: false,
      netRefundTokens: 7,
    }));
    wrapper.unmount();
  });

  it('releases both fees when the fan declines a negotiation', async () => {
    const { state, wrapper } = mountDecisionState(bookingFixture({ status: 'pending' }));
    state.open('decline', { originalTokens: 10, proposedTokens: 12 });
    await nextTick();

    expect(state.popupProps.value).toEqual(expect.objectContaining({
      originalTokens: 10,
      proposedTokens: 12,
      sessionRefundTokens: 10,
      bookingFeeRefundable: true,
      cancellationFeeRefundable: true,
      netRefundTokens: 10,
    }));
    wrapper.unmount();
  });

  it('falls back to retaining fees when cancellation status is unknown', async () => {
    const { state, wrapper } = mountDecisionState(bookingFixture({ status: '' }));
    state.open('cancel');
    await nextTick();

    expect(state.popupProps.value).toEqual(expect.objectContaining({
      bookingFeeRefundable: false,
      cancellationFeeRefundable: false,
      netRefundTokens: 7,
    }));
    wrapper.unmount();
  });

  it('keeps balance lookup failures separate from booking action failures', async () => {
    const { state, wrapper } = mountDecisionState(bookingFixture());
    state.open('accept', { originalTokens: 10, proposedTokens: 345 });
    await nextTick();

    state.reportError('Could not update held payment');
    state.markTopupCompleted(true);

    expect(state.popupProps.value).toEqual(expect.objectContaining({
      balanceError: '',
      actionError: 'Could not update held payment',
      topupCompleted: true,
    }));

    state.reportBalanceError('Could not retrieve balance');
    expect(state.popupProps.value).toEqual(expect.objectContaining({
      balanceError: 'Could not retrieve balance',
      actionError: '',
      topupCompleted: true,
    }));
    wrapper.unmount();
  });

  it('waits for the required usable balance and publishes the latest balance', async () => {
    const { state, wrapper } = mountDecisionState(bookingFixture());
    state.open('accept', { originalTokens: 10, proposedTokens: 345 });
    await nextTick();

    const signal = new AbortController().signal;
    const result = await state.waitForRequiredBalance(335, { timeoutMs: 15000, signal });

    expect(mocks.tokenWaitForBalance).toHaveBeenCalledWith(expect.objectContaining({
      userId: 6074,
      receiverId: 6586,
      minimumBalance: 335,
      timeoutMs: 15000,
      signal,
    }));
    expect(result.ready).toBe(true);
    expect(state.popupProps.value).toEqual(expect.objectContaining({
      walletBalance: 335,
      balanceError: '',
    }));
    wrapper.unmount();
  });
});
