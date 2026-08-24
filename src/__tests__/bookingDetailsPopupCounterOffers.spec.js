import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { flowRun } = vi.hoisted(() => ({ flowRun: vi.fn() }));

vi.mock('@/services/flow-system/FlowHandler.js', () => ({
  default: { run: flowRun },
}));

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
    fanUsername: 'grapegatsby',
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
    flowRun.mockReset();
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

  it('matches the sent-adjustment design with dynamic canonical price data', () => {
    const wrapper = mountPopup(booking({
      fanAvatar: 'https://example.com/fan-avatar.webp',
      meta: {
        currentCounterOffer: 'adjust',
        negotiation: {
          type: 'adjust',
          status: 'sent',
          negotiationId: 'neg_adjust_1',
          original: { totalTokens: 1000 },
          proposed: {
            totalTokens: 1335,
            remarks: 'Session price needs to be adjusted.',
          },
        },
      },
    }), { userRole: 'creator', canReviewPending: true });

    const notice = wrapper.get('[data-test="booking-details-adjustment-waiting-notice"]');
    expect(notice.attributes('data-counteroffer-type')).toBe('adjust');
    expect(notice.classes()).toContain('border-[#EAECF0]');
    expect(wrapper.get('[data-test="booking-details-counteroffer-rail"]').classes()).toContain('bg-[#98A2B3]');
    expect(wrapper.get('[data-test="booking-details-counteroffer-sent-icon"]').classes()).toContain('bg-[#FCE40D]');
    expect(wrapper.get('[data-test="booking-details-counteroffer-avatar"]').attributes()).toEqual(expect.objectContaining({
      src: 'https://example.com/fan-avatar.webp',
      alt: 'grapegatsby',
    }));
    expect(wrapper.get('[data-test="booking-details-adjustment-waiting-heading"]').text()).toContain('@grapegatsby');
    expect(wrapper.get('[data-test="booking-details-counteroffer-remarks"]').text()).toContain('“Session price needs to be adjusted.”');
    expect(wrapper.get('[data-test="booking-details-counteroffer-original-label"]').text()).toBe('ORIGINAL PRICE');
    expect(wrapper.get('[data-test="booking-details-counteroffer-proposed-label"]').text()).toBe('NEW PRICE');
    expect(wrapper.get('[data-test="booking-details-counteroffer-original-value"]').text()).toBe('1,000');
    expect(wrapper.get('[data-test="booking-details-counteroffer-proposed-value"]').text()).toBe('1,335');
    expect(wrapper.find('[data-test="booking-details-counteroffer-original-token"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="booking-details-counteroffer-proposed-token"]').exists()).toBe(true);

    wrapper.unmount();
  });

  it('supports legacy Adjust metadata in the creator notice', () => {
    const wrapper = mountPopup(booking({
      meta: {
        currentCounterOffer: 'adjust',
        adjust: {
          prevTotalTokens: 750,
          proposedTokens: 900,
          proposedRemarks: 'Legacy adjustment remarks',
        },
      },
    }), { userRole: 'creator' });

    expect(wrapper.get('[data-test="booking-details-counteroffer-original-value"]').text()).toBe('750');
    expect(wrapper.get('[data-test="booking-details-counteroffer-proposed-value"]').text()).toBe('900');
    expect(wrapper.get('[data-test="booking-details-counteroffer-remarks"]').text()).toContain('Legacy adjustment remarks');

    wrapper.unmount();
  });

  it('shows localized original and proposed schedules for Reschedule', () => {
    const wrapper = mountPopup(booking({
      meta: {
        currentCounterOffer: 'reschedule',
        negotiation: {
          type: 'reschedule',
          status: 'sent',
          original: { startAtIso: FUTURE_START, endAtIso: FUTURE_END },
          proposed: {
            startAtIso: '2027-04-26T16:15:00Z',
            endAtIso: '2027-04-26T16:45:00Z',
            remarks: 'Please move this to tomorrow.',
          },
        },
      },
    }), { userRole: 'creator' });

    expect(wrapper.get('[data-test="booking-details-counteroffer-original-label"]').text()).toBe('ORIGINAL DATE & TIME');
    expect(wrapper.get('[data-test="booking-details-counteroffer-proposed-label"]').text()).toBe('NEW DATE & TIME');
    expect(wrapper.get('[data-test="booking-details-counteroffer-original-value"]').text()).toContain('2027');
    expect(wrapper.get('[data-test="booking-details-counteroffer-proposed-value"]').text()).toContain('2027');
    expect(wrapper.get('[data-test="booking-details-counteroffer-remarks"]').text()).toContain('Please move this to tomorrow.');
    expect(wrapper.find('[data-test="booking-details-counteroffer-original-token"]').exists()).toBe(false);

    wrapper.unmount();
  });

  it('shows original and proposed durations for More Time', () => {
    const wrapper = mountPopup(booking({
      status: 'confirmed',
      meta: {
        currentCounterOffer: 'moretime',
        negotiation: {
          type: 'moretime',
          status: 'sent',
          original: { durationMinutes: 30 },
          proposed: { durationMinutes: 45 },
        },
      },
    }), { userRole: 'creator' });

    expect(wrapper.get('[data-test="booking-details-counteroffer-original-label"]').text()).toBe('ORIGINAL DURATION');
    expect(wrapper.get('[data-test="booking-details-counteroffer-proposed-label"]').text()).toBe('NEW DURATION');
    expect(wrapper.get('[data-test="booking-details-counteroffer-original-value"]').text()).toBe('30 minutes');
    expect(wrapper.get('[data-test="booking-details-counteroffer-proposed-value"]').text()).toBe('45 minutes');

    wrapper.unmount();
  });

  it('omits unresolved optional remarks and comparisons without demo fallbacks', () => {
    const wrapper = mountPopup(booking({
      startAtIso: '',
      endAtIso: '',
      meta: {
        currentCounterOffer: 'reschedule',
        negotiation: { type: 'reschedule', status: 'sent', proposed: {} },
      },
    }), { userRole: 'creator' });

    expect(wrapper.find('[data-test="booking-details-adjustment-waiting-notice"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="booking-details-counteroffer-remarks"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="booking-details-counteroffer-comparison"]').exists()).toBe(false);

    wrapper.unmount();
  });

  it.each([
    ['accepted Adjust', { currentCounterOffer: 'adjust', negotiation: { type: 'adjust', status: 'accepted', original: { totalTokens: 100 }, proposed: { totalTokens: 120 } } }],
    ['declined Reschedule', { currentCounterOffer: 'reschedule', negotiation: { type: 'reschedule', status: 'declined', proposed: { startAtIso: FUTURE_START } } }],
    ['mismatched negotiation', { currentCounterOffer: 'adjust', negotiation: { type: 'reschedule', status: 'sent', original: { totalTokens: 100 }, proposed: { totalTokens: 120 } } }],
    ['equal-price Adjust', { currentCounterOffer: 'adjust', negotiation: { type: 'adjust', status: 'sent', original: { totalTokens: 100 }, proposed: { totalTokens: 100 } } }],
  ])('does not show the creator notice for %s metadata', (_label, meta) => {
    const wrapper = mountPopup(booking({ meta }), { userRole: 'creator' });

    expect(wrapper.find('[data-test="booking-details-adjustment-waiting-notice"]').exists()).toBe(false);

    wrapper.unmount();
  });

  it('uses the fetched booking negotiation when the calendar event is lightweight', async () => {
    const fetchedBooking = booking({
      meta: {
        currentCounterOffer: 'adjust',
        negotiation: {
          negotiationId: 'neg_adjust_1',
          type: 'adjust',
          status: 'sent',
          actor: 'creator',
          original: { totalTokens: 150 },
          proposed: { totalTokens: 152 },
        },
      },
    });
    flowRun.mockResolvedValue({ ok: true, data: { item: fetchedBooking } });

    const wrapper = mount(BookingDetailsPopup, {
      props: {
        presentation: 'side-panel',
        userRole: 'creator',
        canReviewPending: true,
        event: {
          bookingId: fetchedBooking.bookingId,
          eventId: fetchedBooking.eventId,
          title: fetchedBooking.eventTitle,
          start: fetchedBooking.startAtIso,
          end: fetchedBooking.endAtIso,
          status: 'pending',
          raw: {
            bookingId: fetchedBooking.bookingId,
            status: 'pending',
            startIso: fetchedBooking.startAtIso,
            endIso: fetchedBooking.endAtIso,
          },
        },
      },
    });
    await flushPromises();

    expect(flowRun).toHaveBeenCalledWith('bookings.fetchBooking', {
      bookingId: 'booking_1',
    });
    expect(wrapper.find('[data-test="booking-details-adjustment-waiting-notice"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="booking-details-review-notice"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="booking-details-accept"]').exists()).toBe(false);

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

  it('gives the creator the options menu only once the booking is confirmed', async () => {
    const pending = mountPopup(booking(), { userRole: 'creator' });
    expect(pending.find('[data-test="event-details-fan-menu"]').exists()).toBe(false);
    pending.unmount();

    const wrapper = mountPopup(booking({ status: 'confirmed' }), { userRole: 'creator' });
    await wrapper.get('[data-test="event-details-fan-menu"]').trigger('click');

    const dropdown = wrapper.get('[data-test="event-details-fan-menu-dropdown"]');
    expect(dropdown.findAll('button')).toHaveLength(1);
    expect(wrapper.find('[data-test="event-details-fan-cancel"]').exists()).toBe(true);

    wrapper.unmount();
  });

  it('keeps the fan options menu while the request is still awaiting review', async () => {
    const wrapper = mountPopup(booking(), { userRole: 'fan' });
    await wrapper.get('[data-test="event-details-fan-menu"]').trigger('click');

    expect(wrapper.find('[data-test="event-details-fan-cancel"]').exists()).toBe(true);

    wrapper.unmount();
  });

  it('hides the options menu on a cancelled booking for both sides', () => {
    const cancelled = booking({ status: 'cancelled_user' });

    const creator = mountPopup(cancelled, { userRole: 'creator' });
    expect(creator.find('[data-test="event-details-fan-menu"]').exists()).toBe(false);
    creator.unmount();

    const fan = mountPopup(cancelled, { userRole: 'fan' });
    expect(fan.find('[data-test="event-details-fan-menu"]').exists()).toBe(false);
    fan.unmount();
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
