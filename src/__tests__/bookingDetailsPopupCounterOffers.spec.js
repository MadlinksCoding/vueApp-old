import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BookingDetailsPopup from '@/components/ui/popup/BookingDetailsPopup.vue';

const FUTURE_START = '2027-04-25T14:15:00Z';
const FUTURE_END = '2027-04-25T14:45:00Z';
const PAST_START = '2020-04-25T14:15:00Z';
const PAST_END = '2020-04-25T14:45:00Z';

function booking(overrides = {}) {
  const { meta, ...rest } = overrides;
  return {
    bookingId: 'booking_1',
    eventId: 'event_1',
    creatorId: 1407,
    userId: 99,
    creatorName: 'Miu Miu',
    eventTitle: 'Lantau cows meet up',
    eventType: 'private-event',
    eventCallType: 'video',
    status: 'pending',
    startAtIso: FUTURE_START,
    endAtIso: FUTURE_END,
    payment: { total: 100, currency: 'TOKENS' },
    ...rest,
    meta: { chatId: 'chat_1', bookingMessageId: 'message_1', ...meta },
  };
}

function timeOffer(type, proposedSlotDate = '2027-04-25T16:15:00Z') {
  return {
    currentCounterOffer: type,
    [type]: { proposedSlotDate },
    negotiation: {
      type,
      status: 'sent',
      negotiationId: 'neg_time_1',
      proposed: { startAtIso: proposedSlotDate },
    },
  };
}

function mountPopup(value, extraProps = {}) {
  return mount(BookingDetailsPopup, {
    props: {
      presentation: 'side-panel',
      booking: value,
      event: {
        bookingId: value.bookingId,
        eventId: value.eventId,
        title: value.eventTitle,
        start: value.startAtIso,
        end: value.endAtIso,
        status: value.status,
        raw: value,
      },
      ...extraProps,
    },
  });
}

describe('BookingDetailsPopup counter offers', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each(['moretime', 'reschedule'])('lets a fan accept or reject a %s proposal', async (type) => {
    const wrapper = mountPopup(booking({ meta: timeOffer(type) }), { userRole: 'fan' });

    const banner = wrapper.get('[data-test="booking-details-time-offer"]');
    expect(banner.text()).toContain('Miu Miu');
    expect(wrapper.get('[data-test="booking-details-time-offer-original"]').text()).not.toBe('');
    expect(wrapper.get('[data-test="booking-details-time-offer-proposed"]').text()).not.toBe('');

    await wrapper.get('[data-test="booking-details-accept-counter"]').trigger('click');
    expect(wrapper.emitted('accept-counter')?.[0]?.[0]).toEqual(expect.objectContaining({
      bookingId: 'booking_1',
      offerType: type,
      negotiationId: 'neg_time_1',
      proposed: expect.objectContaining({ proposedSlotDate: '2027-04-25T16:15:00Z' }),
    }));

    await wrapper.get('[data-test="booking-details-reject-counter"]').trigger('click');
    expect(wrapper.emitted('reject-counter')?.[0]?.[0]?.offerType).toBe(type);

    wrapper.unmount();
  });

  it('rebuilds the linked chat message from booking meta when none is supplied', async () => {
    const wrapper = mountPopup(booking({ meta: timeOffer('moretime') }), { userRole: 'fan' });

    await wrapper.get('[data-test="booking-details-accept-counter"]').trigger('click');
    expect(wrapper.emitted('accept-counter')[0][0].message).toEqual(expect.objectContaining({
      message_id: 'message_1',
      chat_id: 'chat_1',
      content_type: 'booking_request',
    }));

    wrapper.unmount();
  });

  it('shows the creator a waiting notice instead of actions while an offer is outstanding', () => {
    const wrapper = mountPopup(booking({ meta: timeOffer('reschedule') }), {
      userRole: 'creator',
      canReviewPending: true,
    });

    expect(wrapper.find('[data-test="booking-details-adjustment-waiting-notice"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="booking-details-review-notice"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="booking-details-accept-counter"]').exists()).toBe(false);

    wrapper.unmount();
  });

  it('tells a fan the creator has not responded to a plain pending request', () => {
    const wrapper = mountPopup(booking(), { userRole: 'fan' });

    expect(wrapper.find('[data-test="booking-details-fan-waiting-notice"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="booking-details-expired-notice"]').exists()).toBe(false);

    wrapper.unmount();
  });

  it('replaces the actions with an expired notice once the slot has started', () => {
    const wrapper = mountPopup(
      booking({ startAtIso: PAST_START, endAtIso: PAST_END, meta: timeOffer('moretime', PAST_START) }),
      { userRole: 'fan' },
    );

    expect(wrapper.find('[data-test="booking-details-expired-notice"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="booking-details-accept-counter"]').exists()).toBe(false);

    wrapper.unmount();
  });

  it('offers the creator time-change actions only when opted in and the booking is confirmed', async () => {
    const confirmed = booking({ status: 'confirmed' });
    const withoutOptIn = mountPopup(confirmed, { userRole: 'creator' });
    await withoutOptIn.get('[data-test="event-details-fan-menu"]').trigger('click');
    expect(withoutOptIn.find('[data-test="booking-details-ask-more-time"]').exists()).toBe(false);
    expect(withoutOptIn.find('[data-test="event-details-fan-cancel"]').exists()).toBe(true);
    withoutOptIn.unmount();

    const wrapper = mountPopup(confirmed, { userRole: 'creator', canRequestTimeChange: true });
    await wrapper.get('[data-test="event-details-fan-menu"]').trigger('click');

    await wrapper.get('[data-test="booking-details-ask-more-time"]').trigger('click');
    expect(wrapper.emitted('ask-more-time')?.[0]?.[0]?.bookingId).toBe('booking_1');

    await wrapper.get('[data-test="event-details-fan-menu"]').trigger('click');
    await wrapper.get('[data-test="booking-details-ask-reschedule"]').trigger('click');
    expect(wrapper.emitted('ask-to-reschedule')?.[0]?.[0]?.bookingId).toBe('booking_1');

    wrapper.unmount();
  });

  it('hides the creator time-change actions for a pending booking', async () => {
    const wrapper = mountPopup(booking(), { userRole: 'creator', canRequestTimeChange: true });
    await wrapper.get('[data-test="event-details-fan-menu"]').trigger('click');

    expect(wrapper.find('[data-test="booking-details-ask-more-time"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="booking-details-ask-reschedule"]').exists()).toBe(false);

    wrapper.unmount();
  });

  it('lets the chat message action override the booking status', async () => {
    const wrapper = mountPopup(booking({ status: 'pending' }), {
      userRole: 'creator',
      canRequestTimeChange: true,
      messageAction: 'accepted',
    });
    await wrapper.get('[data-test="event-details-fan-menu"]').trigger('click');

    expect(wrapper.find('[data-test="booking-details-ask-more-time"]').exists()).toBe(true);

    wrapper.unmount();
  });

  it.each([
    ['fan', 'creator_no_show_auto_cancel', 'Fully refunded'],
    ['creator', 'fan_no_show_auto_cancel', 'Fan Forfeited'],
  ])('surfaces the %s no-show settlement', (role, reason, label) => {
    const wrapper = mountPopup(
      booking({ status: 'cancelled', cancellation: { reason }, meta: { cancelled: { reason } } }),
      { userRole: role },
    );

    expect(wrapper.get('[data-test="booking-details-no-show-notice"]').text()).toBe(label);

    wrapper.unmount();
  });
});
