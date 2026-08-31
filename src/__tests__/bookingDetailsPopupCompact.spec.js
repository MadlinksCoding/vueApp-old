import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BookingDetailsPopup from '@/components/ui/popup/BookingDetailsPopup.vue';
import PopupHandler from '@/components/ui/popup/PopupHandler.vue';

const START = '2027-04-25T14:15:00Z';
const END = '2027-04-25T14:45:00Z';

function booking(overrides = {}) {
  return {
    bookingId: 'booking_compact_1',
    eventId: 'event_compact_1',
    creatorId: 1407,
    userId: 99,
    fanUsername: 'grapegatsby',
    fanAvatar: 'https://example.test/fan.webp',
    eventTitle: 'Lantau cows meet up',
    eventType: 'private-event',
    eventCallType: 'video',
    eventColorSkin: '#FDB022',
    status: 'pending',
    startAtIso: START,
    endAtIso: END,
    reminderMinutes: 5,
    requestedAddOns: ['Record live call', 'Roleplay'],
    personalRequestText: 'Can you try this wet food cat on Miu Miu?',
    payment: {
      total: 1335,
      allocations: { service: 1200, bookingFee: 35, cancellationFee: 100 },
    },
    meta: { chatId: 'chat_1', bookingMessageId: 'message_1' },
    ...overrides,
  };
}

function mountCompact(value, extraProps = {}) {
  return mount(BookingDetailsPopup, {
    props: {
      presentation: 'side-panel',
      layoutVariant: 'compact',
      userRole: 'creator',
      canReviewPending: true,
      booking: value,
      event: {
        bookingId: value.bookingId,
        eventId: value.eventId,
        title: value.eventTitle,
        start: value.startAtIso,
        end: value.endAtIso,
        status: value.status,
        color: value.eventColorSkin,
        raw: value,
      },
      ...extraProps,
    },
  });
}

describe('BookingDetailsPopup compact variation', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024 });
  });

  it('renders the dynamic Figma header and shared booking information', () => {
    const wrapper = mountCompact(booking());

    expect(wrapper.get('[data-test="event-details-fan"]').attributes('data-layout-variant')).toBe('compact');
    expect(wrapper.find('[data-test="event-details-fan-hero"]').exists()).toBe(false);
    expect(wrapper.get('[data-test="booking-details-compact-title"]').text()).toBe('Lantau cows meet up');
    const status = wrapper.get('[data-test="booking-details-compact-status"]');
    expect(status.text()).toBe('Pending');
    expect(status.classes()).toContain('uppercase');
    expect(wrapper.get('[data-test="booking-details-compact-event-type"]').text()).toContain('1 on 1');
    expect(wrapper.get('[data-test="booking-details-compact-color-rail"]').element.style.backgroundColor).toBe('rgb(253, 176, 34)');
    expect(wrapper.get('[data-test="booking-details-compact-schedule"]').text()).toContain('2027');
    expect(wrapper.get('[data-test="booking-details-information"]').text()).toContain('grapegatsby');
    expect(wrapper.get('[data-test="booking-details-compact-requests"]').text()).toContain('Record live call');
    expect(wrapper.get('[data-test="event-details-fan-session-cost-value"]').text()).toBe('1,200');
    const costTiles = wrapper.get('[data-test="booking-details-cost-tiles"]');
    const sessionCost = wrapper.get('[data-test="booking-details-session-cost-tile"]');
    const cancellationFee = wrapper.get('[data-test="booking-details-active-cancellation-fee"]');
    const bookingFee = wrapper.get('[data-test="booking-details-active-booking-fee"]');
    expect(costTiles.classes()).toEqual(expect.arrayContaining(['flex-row', 'flex-wrap']));
    expect(sessionCost.element.parentElement).toBe(costTiles.element);
    expect(cancellationFee.element.parentElement).toBe(costTiles.element);
    expect(bookingFee.element.parentElement).toBe(costTiles.element);
    expect(cancellationFee.text()).toContain('100');
    expect(bookingFee.text()).toContain('35');
    expect(wrapper.text()).not.toContain('Session Deposit');
    expect(wrapper.text()).toContain('5 minutes before');

    wrapper.unmount();
  });

  it.each([
    ['zero session cost without fees', { total: 0 }, '0', false, false],
    ['missing session cost without fees', {}, 'Not set', false, false],
    ['cancellation fee only', { total: 12, allocations: { cancellationFee: 2 } }, '10', true, false],
    ['booking fee only', { total: 11, allocations: { bookingFee: 1 } }, '10', false, true],
    ['both fees', { total: 10, allocations: { cancellationFee: 2, bookingFee: 1 } }, '7', true, true],
    ['fees above the total', { total: 2, allocations: { cancellationFee: 2, bookingFee: 1 } }, '0', true, true],
    ['missing cost with a fee', { allocations: { bookingFee: 1 } }, 'Not set', false, true],
  ])('keeps the unified wrapping cost row for %s', (_label, payment, expectedCost, showsCancellationFee, showsBookingFee) => {
    const wrapper = mountCompact(booking({ status: 'confirmed', payment, meta: {} }));

    const costTiles = wrapper.get('[data-test="booking-details-cost-tiles"]');
    expect(costTiles.classes()).toEqual(expect.arrayContaining(['flex-row', 'flex-wrap']));
    expect(wrapper.get('[data-test="booking-details-session-cost-tile"]').element.parentElement).toBe(costTiles.element);
    expect(wrapper.get('[data-test="booking-details-session-cost-tile"]').text()).toContain(expectedCost);
    expect(wrapper.find('[data-test="booking-details-active-cancellation-fee"]').exists()).toBe(showsCancellationFee);
    expect(wrapper.find('[data-test="booking-details-active-booking-fee"]').exists()).toBe(showsBookingFee);
    expect(wrapper.text()).not.toContain('Session Deposit');

    wrapper.unmount();
  });

  it('keeps both active fees in the unified row during a pending price adjustment', () => {
    const wrapper = mountCompact(booking({
      meta: {
        currentCounterOffer: 'adjust',
        negotiation: {
          type: 'adjust',
          status: 'sent',
          original: { totalTokens: 1335 },
          proposed: { totalTokens: 1500 },
        },
      },
    }));

    const costTiles = wrapper.get('[data-test="booking-details-cost-tiles"]');
    expect(wrapper.get('[data-test="event-details-fan-session-cost-original"]').text()).toBe('1,200');
    expect(wrapper.get('[data-test="event-details-fan-session-cost-proposed"]').text()).toBe('1,365');
    expect(wrapper.get('[data-test="booking-details-active-cancellation-fee"]').element.parentElement).toBe(costTiles.element);
    expect(wrapper.get('[data-test="booking-details-active-booking-fee"]').element.parentElement).toBe(costTiles.element);

    wrapper.unmount();
  });

  it.each(['pending', 'pending_hold'])('reactively displays elapsed %s bookings as cancelled without mutating booking state', async (status) => {
    const value = booking({ status });
    const wrapper = mountCompact(value, { comparisonTime: '2027-04-25T14:14:59.999Z' });

    expect(wrapper.get('[data-test="booking-details-compact-status"]').text()).toContain('Pending');
    expect(wrapper.find('[data-test="booking-details-compact-pending-icon"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="booking-details-compact-review-notice"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="booking-details-compact-expired-notice"]').exists()).toBe(false);

    await wrapper.setProps({ comparisonTime: '2027-04-25T14:15:00.000Z' });

    expect(wrapper.get('[data-test="booking-details-compact-status"]').text()).toBe('Cancelled');
    expect(wrapper.find('[data-test="booking-details-compact-pending-icon"]').exists()).toBe(false);
    expect(wrapper.get('[data-test="booking-details-compact-status-dot"]').element.style.backgroundColor).toBe('rgb(240, 68, 56)');
    expect(wrapper.get('[data-test="booking-details-compact-expired-notice"]').text()).toContain('Request expired');
    expect(wrapper.find('[data-test="booking-details-compact-review-notice"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="booking-details-compact-accept"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="booking-details-compact-review-menu"]').exists()).toBe(false);
    expect(value.status).toBe(status);

    wrapper.unmount();
  });

  it.each(['cancelled_system', 'cancelled_by_fan', 'canceled'])('labels the compact %s status as Cancelled', (status) => {
    const wrapper = mountCompact(booking({ status, meta: {} }));

    expect(wrapper.get('[data-test="booking-details-compact-status"]').text()).toBe('Cancelled');
    expect(wrapper.find('[data-test="booking-details-compact-pending-icon"]').exists()).toBe(false);
    expect(wrapper.get('[data-test="booking-details-compact-status-dot"]').element.style.backgroundColor).toBe('rgb(240, 68, 56)');
    wrapper.unmount();
  });

  it('exposes the full creator review actions and keeps their existing payloads', async () => {
    const wrapper = mountCompact(booking());

    const surface = wrapper.get('[data-test="event-details-fan"]');
    const notice = wrapper.get('[data-test="booking-details-compact-review-notice"]');
    expect(notice.element.parentElement).toBe(surface.element);
    expect(notice.classes()).toContain('p-3');
    expect(notice.classes()).not.toContain('p-4');
    expect(wrapper.get('[data-test="booking-details-information"]').element.parentElement?.classList.contains('p-4')).toBe(true);
    expect(wrapper.find('[data-test="booking-details-compact-accept"]').exists()).toBe(true);
    expect(wrapper.get('[data-test="booking-details-compact-review-heading"]').text()).toContain('grapegatsby');
    expect(wrapper.get('[data-test="booking-details-compact-adjust"]').text()).toContain('Adjust Detail');
    expect(wrapper.find('[data-test="booking-details-compact-review-menu"]').exists()).toBe(true);

    await wrapper.get('[data-test="booking-details-compact-accept"]').trigger('click');
    expect(wrapper.emitted('approve-booking')?.[0]?.[0]).toEqual(expect.objectContaining({
      bookingId: 'booking_compact_1',
      eventId: 'event_compact_1',
      decision: 'approve',
      counterparty: expect.objectContaining({ username: 'grapegatsby' }),
    }));

    await wrapper.get('[data-test="booking-details-compact-adjust"]').trigger('click');
    expect(wrapper.emitted('adjust-booking')?.[0]?.[0]).toEqual(expect.objectContaining({
      bookingId: 'booking_compact_1',
      eventId: 'event_compact_1',
    }));

    await wrapper.get('[data-test="booking-details-compact-review-menu"]').trigger('click');
    expect(wrapper.get('[data-test="booking-details-compact-decline"]').text()).toContain('Decline');
    await wrapper.get('[data-test="booking-details-compact-decline"]').trigger('click');
    wrapper.getComponent({ name: 'BookingAdjustmentDecisionPopup' }).vm.$emit('confirm', { mode: 'reject' });
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('reject-booking')?.[0]?.[0]).toEqual(expect.objectContaining({
      bookingId: 'booking_compact_1',
      eventId: 'event_compact_1',
      decision: 'reject',
    }));

    const confirmedBooking = booking({ status: 'confirmed' });
    await wrapper.setProps({
      booking: confirmedBooking,
      event: {
        bookingId: confirmedBooking.bookingId,
        eventId: confirmedBooking.eventId,
        title: confirmedBooking.eventTitle,
        start: confirmedBooking.startAtIso,
        end: confirmedBooking.endAtIso,
        status: confirmedBooking.status,
        raw: confirmedBooking,
      },
    });
    expect(wrapper.find('[data-test="booking-details-compact-review-notice"]').exists()).toBe(false);
    expect(wrapper.get('[data-test="event-details-fan"]').attributes('data-layout-variant')).toBe('compact');

    wrapper.unmount();
  });

  it('keeps EventsWidget compact launches accept-only', () => {
    const wrapper = mountCompact(booking(), { compactReviewMode: 'accept-only' });

    expect(wrapper.find('[data-test="booking-details-compact-accept"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="booking-details-compact-review-notice"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="booking-details-compact-adjust"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="booking-details-compact-review-menu"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it.each([
    ['booked-slot avatar', { userAvatarUrl: 'https://example.test/fan-slot.webp' }, 'https://example.test/fan-slot.webp'],
    ['booking snapshot avatar', { userSnapshot: { avatarUrl: 'https://example.test/fan-snapshot.webp' } }, 'https://example.test/fan-snapshot.webp'],
  ])('uses the %s for creator review notices', (_label, avatarFields, expectedAvatar) => {
    const wrapper = mountCompact(booking({ fanAvatar: null, ...avatarFields }));

    const notice = wrapper.get('[data-test="booking-details-compact-review-notice"]');
    expect(notice.get('img[alt="grapegatsby"]').attributes('src')).toBe(expectedAvatar);
    wrapper.unmount();
  });

  it('keeps the decline trigger available when Adjust Detail is ineligible', () => {
    const wrapper = mountCompact(booking({ meta: {} }));

    expect(wrapper.find('[data-test="booking-details-compact-accept"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="booking-details-compact-adjust"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="booking-details-compact-review-menu"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('shows only a disabled spinner while compact approval is processing', () => {
    const wrapper = mountCompact(booking(), {
      actionLoading: true,
    });

    const accept = wrapper.get('[data-test="booking-details-compact-accept"]');
    expect(accept.attributes('disabled')).toBeDefined();
    expect(accept.text()).toBe('');
    expect(accept.find('[data-test="booking-details-compact-accept-spinner"]').exists()).toBe(true);
    wrapper.findAll('[data-test="booking-details-compact-close"]').forEach((button) => {
      expect(button.attributes('disabled')).toBeDefined();
    });
    wrapper.unmount();
  });

  it('shows the retained-details refresh spinner without replacing the compact surface', () => {
    const wrapper = mountCompact(booking({ status: 'confirmed' }), { refreshing: true });

    expect(wrapper.find('[data-test="event-details-fan"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="booking-details-refreshing"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="booking-details-refreshing-spinner"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('marks creator menu cancellation as a retained booking-details action', async () => {
    const wrapper = mountCompact(booking({ status: 'confirmed' }), { layoutVariant: 'hero' });

    await wrapper.get('[data-test="event-details-fan-menu"]').trigger('click');
    await wrapper.get('[data-test="event-details-fan-cancel"]').trigger('click');

    expect(wrapper.emitted('cancel-booking')?.[0]?.[0]).toEqual(expect.objectContaining({
      bookingId: 'booking_compact_1',
      origin: 'booking-details',
      retainDetailsOnSuccess: true,
    }));
    wrapper.unmount();
  });

  it('forwards the responsive dialog closed event after its exit animation', () => {
    const wrapper = mountCompact(booking(), { presentation: 'responsive-dialog', modelValue: true });

    wrapper.getComponent(PopupHandler).vm.$emit('closed');
    expect(wrapper.emitted('closed')).toEqual([[]]);

    wrapper.unmount();
  });

  it('keeps the unified cost row while omitting unavailable fees and the CTA for a non-reviewable booking', () => {
    const wrapper = mountCompact(booking({
      status: 'confirmed',
      payment: { total: 1335 },
      meta: {},
    }), { canReviewPending: true });

    expect(wrapper.find('[data-test="booking-details-compact-costs"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="booking-details-cost-tiles"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="booking-details-active-cancellation-fee"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="booking-details-active-booking-fee"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="booking-details-compact-accept"]').exists()).toBe(false);
    expect(wrapper.get('[data-test="event-details-fan-session-cost-value"]').text()).toBe('1,335');

    wrapper.unmount();
  });

  it('uses a centered popup configuration on desktop', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1200 });
    const wrapper = mountCompact(booking(), {
      presentation: 'responsive-dialog',
      modelValue: false,
      popupConfig: { closeOnOutside: false, escToClose: false },
    });
    const config = wrapper.getComponent(PopupHandler).props('config');

    expect(config).toEqual(expect.objectContaining({
      actionType: 'popup',
      position: 'center',
      width: '500px',
      height: 'auto',
      customClass: 'booking-details-compact-dialog',
      closeOnOutside: false,
      escToClose: false,
    }));

    wrapper.unmount();
  });

  it('uses a bottom slide-in configuration on mobile', () => {
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 375 });
    const wrapper = mountCompact(booking(), { presentation: 'responsive-dialog', modelValue: false });
    const config = wrapper.getComponent(PopupHandler).props('config');

    expect(config).toEqual(expect.objectContaining({
      actionType: 'slidein',
      from: 'bottom',
      width: '100%',
      height: 'auto',
      customClass: 'booking-details-compact-dialog',
    }));
    wrapper.unmount();
  });
});
