import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import EventDetailsFan from '@/components/ui/popup/EventDetailsFan.vue';
import defaultCoverImage from '@/assets/images/icons/background.webp';
import tokenIcon from '@/assets/images/icons/token-02.webp';
import priceArrowIcon from '@/assets/images/icons/arrow-right-orange.svg';
import profileIcon from '@/assets/images/icons/profile.webp';
import requestsIcon from '@/assets/images/icons/dotpoints.png';
import costIcon from '@/assets/images/icons/dollar.png';
import reminderIcon from '@/assets/images/icons/bell-1.webp';
import dotsIcon from '@/assets/images/icons/dots-vertical-white.svg';
import closeIcon from '@/assets/images/icons/x-close-white.svg';
import chatIcon from '@/assets/images/icons/message-text-square-blue.svg';
import chatArrowIcon from '@/assets/images/icons/arrow-up-right-blue.svg';
import adjustmentCheckIcon from '@/assets/images/icons/check-black.svg';
import adjustmentTokenIcon from '@/assets/images/icons/token-sm-calender.svg';
import adjustmentArrowIcon from '@/assets/images/icons/arrow-right-brown.svg';

const { flowRun } = vi.hoisted(() => ({ flowRun: vi.fn() }));

vi.mock('@/services/flow-system/FlowHandler.js', () => ({
  default: { run: flowRun },
}));

function booking(overrides = {}) {
  return {
    bookingId: 'booking_1',
    eventId: 'event_1',
    creatorId: 1407,
    creatorName: 'Miu Miu',
    eventTitle: 'Lantau cows meet up',
    eventType: 'private-event',
    eventCallType: 'video',
    eventColorSkin: '#22CCEE',
    status: 'pending',
    startAtIso: '2027-04-25T14:15:00Z',
    endAtIso: '2027-04-25T14:45:00Z',
    reminderMinutes: 5,
    payment: { total: 100, currency: 'TOKENS' },
    personalRequestText: 'Record the live call',
    meta: {
      chatId: 'chat_1',
      bookingMessageId: 'message_1',
      currentCounterOffer: 'adjust',
      negotiation: {
        type: 'adjust',
        status: 'sent',
        negotiationId: 'neg_1',
        original: { totalTokens: 100 },
        proposed: { totalTokens: 135, remarks: 'Demand increased.' },
      },
    },
    ...overrides,
  };
}

function mountDetails(value, presentation = 'side-panel', extraProps = {}) {
  return mount(EventDetailsFan, {
    props: {
      presentation,
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

describe('EventDetailsFan', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    flowRun.mockReset();
    flowRun.mockResolvedValue({ ok: false });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('renders booking data and an active changed-price adjustment', async () => {
    const wrapper = mountDetails(booking());

    expect(wrapper.text()).toContain('Lantau cows meet up');
    expect(wrapper.text()).toContain('Miu Miu');
    expect(wrapper.text()).toContain('Record the live call');
    expect(wrapper.text()).toContain('Demand increased.');
    expect(wrapper.get('[data-test="event-details-fan-session-cost-original"]').text()).toBe('100');
    expect(wrapper.get('[data-test="event-details-fan-session-cost-proposed"]').text()).toBe('135');
    expect(wrapper.find('[data-test="event-details-fan-price-adjustment"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="event-details-fan-menu"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="event-details-fan-close"]').exists()).toBe(true);
    expect(wrapper.get('[data-test="event-details-fan-session-cost-original-icon"]').attributes('src')).toBe(tokenIcon);
    expect(wrapper.get('[data-test="event-details-fan-session-cost-original-icon"]').element.closest('.grayscale')).not.toBeNull();
    expect(wrapper.get('[data-test="event-details-fan-session-cost-original"]').text()).toBe('100');
    expect(wrapper.get('[data-test="event-details-fan-session-cost-arrow"]').attributes('src')).toBe(priceArrowIcon);
    expect(wrapper.get('[data-test="event-details-fan-session-cost-proposed-icon"]').attributes('src')).toBe(tokenIcon);
    expect(wrapper.get('[data-test="event-details-fan-session-cost-proposed"]').text()).toBe('135');
    expect(wrapper.get('[data-test="booking-details-cost-tiles"]').classes()).toEqual(expect.arrayContaining(['flex-row', 'flex-wrap']));
    expect(wrapper.get('[data-test="booking-details-session-cost-tile"]').classes()).toContain('flex-col');
    expect(wrapper.get('[data-test="event-details-fan"]').element.style.getPropertyValue('--event-color')).toBe('#FACC15');
    expect(wrapper.get('[data-test="event-details-fan-event-type-badge"]').element.style.backgroundColor).toBe('rgb(250, 204, 21)');
    expect(wrapper.get('[data-test="event-details-fan-color-rail"]').element.style.backgroundColor).toBe('rgb(250, 204, 21)');

    await wrapper.get('[data-test="event-details-fan-accept-adjustment"]').trigger('click');
    expect(wrapper.emitted('accept-adjustment')?.[0]?.[0]).toEqual(expect.objectContaining({
      negotiationId: 'neg_1', originalTokens: 100, proposedTokens: 135,
    }));
    wrapper.unmount();
  });

  it('shows creators a read-only waiting notice without overriding the event color', async () => {
    const value = booking({
      userId: 25,
      fanUsername: 'grapegatsby',
      fanAvatar: 'https://example.test/fan.webp',
    });
    const wrapper = mountDetails(value, 'side-panel', { userRole: 'creator', canReviewPending: true });

    const notice = wrapper.get('[data-test="booking-details-adjustment-waiting-notice"]');
    expect(notice.get('[data-test="booking-details-adjustment-waiting-heading"]').text())
      .toBe('Adjusted event detail has been sent to @grapegatsby to review:');
    expect(notice.get('img').attributes('src')).toBe('https://example.test/fan.webp');
    expect(wrapper.find('[data-test="event-details-fan-price-adjustment"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="event-details-fan-accept-adjustment"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="event-details-fan-decline-adjustment"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="booking-details-review-notice"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="event-details-fan-menu"]').exists()).toBe(false);
    expect(wrapper.get('[data-test="event-details-fan"]').element.style.getPropertyValue('--event-color')).toBe('#22CCEE');

    await wrapper.setProps({ userRole: 'fan' });
    expect(wrapper.find('[data-test="booking-details-adjustment-waiting-notice"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="event-details-fan-price-adjustment"]').exists()).toBe(true);
    expect(wrapper.get('[data-test="event-details-fan"]').element.style.getPropertyValue('--event-color')).toBe('#FACC15');
    wrapper.unmount();
  });

  it('hides the adjustment for an unchanged or terminal offer and restores booking actions', () => {
    const value = booking({
      status: 'confirmed',
      meta: {
        currentCounterOffer: '',
        negotiation: {
          type: 'adjust',
          status: 'accepted',
          original: { totalTokens: 100 },
          proposed: { totalTokens: 135 },
        },
      },
    });
    const wrapper = mountDetails(value);

    expect(wrapper.find('[data-test="event-details-fan-price-adjustment"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="event-details-fan-menu"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="event-details-fan-close"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it.each([
    ['fan', {
      creatorUsername: 'miu_miu',
      creatorAvatar: 'https://example.test/creator.webp',
    }, 'miu_miu', 'https://example.test/creator.webp'],
    ['creator', {
      userId: 25,
      fanUsername: 'grapegatsby',
      fanAvatar: 'https://example.test/fan.webp',
    }, 'grapegatsby', 'https://example.test/fan.webp'],
  ])('shows the confirmed notice to the %s with the resolved counterparty', (userRole, overrides, username, avatar) => {
    const wrapper = mountDetails(booking({
      ...overrides,
      status: 'confirmed',
      meta: {},
    }), 'side-panel', { userRole });

    const notice = wrapper.get('[data-test="booking-details-confirmed-notice"]');
    expect(notice.get('[data-test="booking-details-confirmed-heading"]').text())
      .toBe(`Your event with @${username} has been confirmed.`);
    expect(notice.get('[data-test="booking-details-confirmed-avatar"]').attributes()).toEqual(expect.objectContaining({
      src: avatar,
      alt: username,
    }));
    expect(notice.get('[data-test="booking-details-confirmed-rail"]').classes()).toContain('bg-[#20C7B5]');
    expect(notice.get('[data-test="booking-details-confirmed-badge"]').classes()).toContain('bg-[#20C7B5]');
    wrapper.unmount();
  });

  it('uses a safe initial avatar and generic role label instead of a numeric user fallback', () => {
    const wrapper = mountDetails(booking({
      creatorName: '',
      creatorDisplayName: 'User #1407',
      status: 'confirmed',
      meta: {},
    }));

    expect(wrapper.get('[data-test="booking-details-confirmed-heading"]').text())
      .toBe('Your event with @Creator has been confirmed.');
    expect(wrapper.get('[data-test="booking-details-confirmed-avatar-fallback"]').text()).toBe('C');
    expect(wrapper.text()).not.toContain('User #1407');
    wrapper.unmount();
  });

  it('reactively shows and removes the confirmed notice as the booking status changes', async () => {
    const value = booking({ creatorUsername: 'miu_miu', status: 'pending', meta: {} });
    const wrapper = mountDetails(value);

    expect(wrapper.find('[data-test="booking-details-confirmed-notice"]').exists()).toBe(false);

    await wrapper.setProps({
      booking: { ...value, status: 'confirmed' },
      event: {
        bookingId: value.bookingId,
        eventId: value.eventId,
        title: value.eventTitle,
        start: value.startAtIso,
        end: value.endAtIso,
        status: 'confirmed',
        raw: { ...value, status: 'confirmed' },
      },
    });
    expect(wrapper.find('[data-test="booking-details-confirmed-notice"]').exists()).toBe(true);

    await wrapper.setProps({
      booking: { ...value, status: 'completed' },
      event: {
        bookingId: value.bookingId,
        eventId: value.eventId,
        title: value.eventTitle,
        start: value.startAtIso,
        end: value.endAtIso,
        status: 'completed',
        raw: { ...value, status: 'completed' },
      },
    });
    expect(wrapper.find('[data-test="booking-details-confirmed-notice"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('keeps an active confirmed counteroffer notice ahead of the generic confirmation', () => {
    const wrapper = mountDetails(booking({
      status: 'confirmed',
      meta: {
        currentCounterOffer: 'reschedule',
        negotiation: {
          type: 'reschedule',
          status: 'sent',
          original: { startAtIso: '2027-04-25T14:15:00Z', endAtIso: '2027-04-25T14:45:00Z' },
          proposed: { startAtIso: '2027-04-26T14:15:00Z', endAtIso: '2027-04-26T14:45:00Z' },
        },
      },
    }), 'side-panel', { userRole: 'creator' });

    expect(wrapper.find('[data-test="booking-details-adjustment-waiting-notice"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="booking-details-confirmed-notice"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('renders one colored token icon with the localized ordinary session cost', () => {
    const wrapper = mountDetails(booking({ payment: { total: 1234 }, meta: {}, status: 'confirmed' }));

    expect(wrapper.get('[data-test="event-details-fan-session-cost-icon"]').attributes('src')).toBe(tokenIcon);
    expect(wrapper.get('[data-test="event-details-fan-session-cost-icon"]').classes()).not.toContain('grayscale');
    expect(wrapper.get('[data-test="event-details-fan-session-cost-value"]').text()).toBe('1,234');
    expect(wrapper.find('[data-test="event-details-fan-session-cost-adjusted"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('renders the translated missing-cost fallback without a token icon', () => {
    const wrapper = mountDetails(booking({ payment: {}, meta: {}, status: 'confirmed' }));

    expect(wrapper.get('[data-test="event-details-fan-session-cost-missing"]').text()).toBe('Not set');
    expect(wrapper.find('[data-test="event-details-fan-session-cost-icon"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('renders legacy pending Adjust prices with the same token comparison', () => {
    const wrapper = mountDetails(booking({
      meta: {
        currentCounterOffer: 'adjust',
        adjust: { prevTotalTokens: '90', proposedTokens: '125' },
      },
    }));

    expect(wrapper.get('[data-test="event-details-fan-session-cost-original"]').text()).toBe('90');
    expect(wrapper.get('[data-test="event-details-fan-session-cost-proposed"]').text()).toBe('125');
    expect(wrapper.findAll('img[src="' + tokenIcon + '"]')).toHaveLength(2);
    expect(wrapper.get('[data-test="event-details-fan"]').element.style.getPropertyValue('--event-color')).toBe('#FACC15');
    wrapper.unmount();
  });

  it.each([
    ['equal price', { currentCounterOffer: 'adjust', negotiation: { type: 'adjust', status: 'sent', original: { totalTokens: 100 }, proposed: { totalTokens: 100 } } }],
    ['accepted adjustment', { currentCounterOffer: '', negotiation: { type: 'adjust', status: 'accepted', original: { totalTokens: 100 }, proposed: { totalTokens: 135 } } }],
    ['declined adjustment', { currentCounterOffer: '', negotiation: { type: 'adjust', status: 'declined', original: { totalTokens: 100 }, proposed: { totalTokens: 135 } } }],
    ['reschedule offer', { currentCounterOffer: 'reschedule', negotiation: { type: 'reschedule', status: 'sent', original: { totalTokens: 100 }, proposed: { totalTokens: 135 } } }],
    ['more-time offer', { currentCounterOffer: 'more_time', negotiation: { type: 'more_time', status: 'sent', original: { totalTokens: 100 }, proposed: { totalTokens: 135 } } }],
  ])('uses the ordinary cost display for a %s', (_label, meta) => {
    const wrapper = mountDetails(booking({ meta, status: 'confirmed' }));

    expect(wrapper.find('[data-test="event-details-fan-session-cost-adjusted"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="event-details-fan-session-cost-standard"]').exists()).toBe(true);
    expect(wrapper.get('[data-test="booking-details-session-cost-tile"]').classes()).toContain('flex-col');
    expect(wrapper.get('[data-test="event-details-fan"]').element.style.getPropertyValue('--event-color')).toBe('#22CCEE');
    wrapper.unmount();
  });

  it('reactively restores the stored event color after the adjustment becomes terminal', async () => {
    const value = booking();
    const wrapper = mountDetails(value);

    expect(wrapper.get('[data-test="event-details-fan"]').element.style.getPropertyValue('--event-color')).toBe('#FACC15');

    await wrapper.setProps({
      booking: {
        ...value,
        status: 'confirmed',
        meta: {
          currentCounterOffer: '',
          negotiation: {
            ...value.meta.negotiation,
            status: 'accepted',
          },
        },
      },
    });

    expect(wrapper.get('[data-test="event-details-fan"]').element.style.getPropertyValue('--event-color')).toBe('#22CCEE');
    expect(wrapper.get('[data-test="event-details-fan-event-type-badge"]').element.style.backgroundColor).toBe('rgb(34, 204, 238)');
    expect(wrapper.get('[data-test="event-details-fan-color-rail"]').element.style.backgroundColor).toBe('rgb(34, 204, 238)');
    wrapper.unmount();
  });

  it('restores the default event color when the stored color is invalid', async () => {
    const value = booking({ eventColorSkin: 'not-a-color' });
    const wrapper = mountDetails(value);

    expect(wrapper.get('[data-test="event-details-fan"]').element.style.getPropertyValue('--event-color')).toBe('#FACC15');

    await wrapper.setProps({
      booking: {
        ...value,
        status: 'confirmed',
        meta: {
          currentCounterOffer: '',
          negotiation: {
            ...value.meta.negotiation,
            status: 'declined',
          },
        },
      },
    });

    expect(wrapper.get('[data-test="event-details-fan"]').element.style.getPropertyValue('--event-color')).toBe('#5549FF');
    wrapper.unmount();
  });

  it('renders the calendar-style action menu at the top and closes it on outside click', async () => {
    const wrapper = mountDetails(booking({ meta: {}, status: 'confirmed' }));
    const trigger = wrapper.get('[data-test="event-details-fan-menu"]');

    expect(trigger.element.closest('[data-test="event-details-fan-hero"]')).not.toBeNull();
    expect(wrapper.findAll('[data-test="event-details-fan-menu"]')).toHaveLength(1);
    expect(wrapper.findAll('[data-test="event-details-fan-close"]')).toHaveLength(1);
    expect(trigger.attributes('aria-expanded')).toBe('false');

	await trigger.trigger('click');
	expect(trigger.attributes('aria-expanded')).toBe('true');
	expect(wrapper.find('[data-test="event-details-fan-more-time"]').exists()).toBe(false);
	expect(wrapper.find('[data-test="event-details-fan-reschedule"]').exists()).toBe(false);
	expect(wrapper.text()).toContain('Cancel booking');

    document.body.click();
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-test="event-details-fan-menu-dropdown"]').exists()).toBe(false);
    expect(trigger.attributes('aria-expanded')).toBe('false');
    wrapper.unmount();
  });

  it('closes an actionable booking from the X beside the top menu', async () => {
    const wrapper = mountDetails(booking({ meta: {}, status: 'confirmed' }));

    await wrapper.get('[data-test="event-details-fan-close"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
    expect(wrapper.emitted('close')).toHaveLength(1);
    wrapper.unmount();
  });

  it('closes the menu and emits the existing cancellation payload', async () => {
    const value = booking({ meta: {}, status: 'confirmed' });
    const wrapper = mountDetails(value);

    await wrapper.get('[data-test="event-details-fan-menu"]').trigger('click');
    await wrapper.get('[data-test="event-details-fan-cancel"]').trigger('click');

    expect(wrapper.emitted('cancel-booking')?.[0]?.[0]).toEqual(expect.objectContaining({
      bookingId: 'booking_1',
      eventId: 'event_1',
    }));
    expect(wrapper.find('[data-test="event-details-fan-menu-dropdown"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it.each([
    ['ended booking', { meta: {}, startAtIso: '2020-01-01T10:00:00Z', endAtIso: '2020-01-01T10:30:00Z' }],
    ['missing booking identity', { bookingId: '', meta: {} }],
  ])('uses the close action instead of dots for an %s', (_label, overrides) => {
    const wrapper = mountDetails(booking(overrides));

    expect(wrapper.find('[data-test="event-details-fan-menu"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="event-details-fan-close"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it.each(['side-panel', 'popup'])('emits close events from the fallback X in %s presentation', async (presentation) => {
    const wrapper = mountDetails(booking(), presentation);
    const closeButton = presentation === 'popup'
      ? document.querySelector('[data-test="event-details-fan-close"]')
      : wrapper.get('[data-test="event-details-fan-close"]').element;

    expect(closeButton).not.toBeNull();
    closeButton.click();
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
    expect(wrapper.emitted('close')).toHaveLength(1);
    wrapper.unmount();
  });

  it('adapts the event type label for group bookings', () => {
    const wrapper = mountDetails(booking({ eventType: 'group-event', status: 'confirmed', meta: {} }));
    expect(wrapper.text()).toContain('Group Video Call');
    wrapper.unmount();
  });

  it('uses the booking-flow background when the event has no cover image', () => {
    const wrapper = mountDetails(booking());

    expect(wrapper.get('[data-test="event-details-fan-cover"]').attributes('src')).toBe(defaultCoverImage);
    wrapper.unmount();
  });

  it('retains the committed layout anchors, icon assets, and SVG wrappers', () => {
    const wrapper = mountDetails(booking({
      status: 'confirmed',
      meta: {},
      creatorVerified: true,
    }));
    const imageSources = wrapper.findAll('img').map((image) => image.attributes('src'));

    expect(wrapper.get('[data-test="event-details-fan"]').classes()).toEqual(expect.arrayContaining([
      'w-full', 'h-full', 'overflow-auto', 'inline-flex', 'flex-col',
    ]));
    expect(wrapper.get('[data-test="event-details-fan-hero"]').classes()).toEqual(expect.arrayContaining([
      'px-4', 'pt-12', 'pb-2', 'min-h-[18.75rem]', 'bg-gradient-to-b',
    ]));
    expect(wrapper.findAll('[data-svg-wrapper]').length).toBeGreaterThanOrEqual(10);
    expect(imageSources).toEqual(expect.arrayContaining([
      profileIcon,
      requestsIcon,
      costIcon,
      reminderIcon,
      dotsIcon,
      chatIcon,
      chatArrowIcon,
    ]));
    expect(wrapper.findAll('[data-test="event-details-fan-menu"]')).toHaveLength(1);
    wrapper.unmount();
  });

  it('gives the iframe side-panel wrapper a full-height flex boundary', () => {
    const wrapper = mountDetails(booking({ status: 'confirmed', meta: {} }));
    const panelRoot = wrapper.get('[data-test="event-details-fan"]').element.parentElement;

    expect(panelRoot.classList).toContain('h-full');
    expect(panelRoot.classList).toContain('min-h-0');
    expect(panelRoot.classList).toContain('w-full');
    wrapper.unmount();
  });

  it('retains the committed adjustment gradient, buttons, and icon assets', () => {
    const wrapper = mountDetails(booking());
    const panel = wrapper.get('[data-test="event-details-fan-price-adjustment"]');
    const imageSources = panel.findAll('img').map((image) => image.attributes('src'));

    expect(panel.classes()).toEqual(expect.arrayContaining([
      'shadow-[0px_0px_8px_0px_rgba(0,0,0,0.25)]',
      'border-b-[0.50px]',
    ]));
    expect(panel.find('[class*="background:linear-gradient"]').exists()).toBe(true);
    expect(wrapper.get('[data-test="event-details-fan-accept-adjustment"]').classes()).toContain('bg-[#07F468]');
    expect(wrapper.get('[data-test="event-details-fan-decline-adjustment"]').classes()).toContain('bg-[#FF4405]');
    expect(imageSources).toEqual(expect.arrayContaining([
      adjustmentCheckIcon,
      closeIcon,
      adjustmentTokenIcon,
      adjustmentArrowIcon,
    ]));
    wrapper.unmount();
  });

  it('retains the original Join Call treatment inside its active window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2027-04-25T14:12:00Z'));
    const wrapper = mountDetails(booking({ status: 'confirmed', meta: {}, joinUrl: 'https://example.test/join' }));
    const joinButton = wrapper.get('[data-test="event-details-fan-join"]');

    expect(joinButton.classes()).toEqual(expect.arrayContaining(['bg-[#07F468]', 'rounded-sm', 'gap-3']));
    expect(joinButton.find('[data-svg-wrapper] svg').exists()).toBe(true);
    wrapper.unmount();
  });

  it('shows creator review actions in the pending-request notice and the fan as counterparty', async () => {
    const value = booking({
      status: 'pending',
      userId: 25,
      fanUsername: 'grapegatsby',
      fanAvatar: 'https://example.test/fan.webp',
      meta: { chatId: 'chat_1', bookingMessageId: 'message_1' },
    });
    const wrapper = mountDetails(value, 'side-panel', { userRole: 'creator', canReviewPending: true });

    const notice = wrapper.get('[data-test="booking-details-review-notice"]');
    const acceptButton = notice.get('[data-test="booking-details-accept"]');
    const adjustButton = notice.get('[data-test="booking-details-adjust"]');
    const menuButton = notice.get('[data-test="booking-details-review-menu"]');

    expect(notice.get('[data-test="booking-details-review-actions"]').exists()).toBe(true);
    expect(notice.get('[data-test="booking-details-review-actions"]').classes()).toContain('flex-nowrap');
    expect(notice.get('[data-test="booking-details-review-heading"]').text()).toContain('@grapegatsby');
    expect(notice.get('img').attributes('src')).toBe('https://example.test/fan.webp');
    expect(acceptButton.classes()).toEqual(expect.arrayContaining(['flex-1', 'min-w-0']));
    expect(adjustButton.classes()).toEqual(expect.arrayContaining(['flex-1', 'min-w-0']));
    expect(menuButton.classes()).toEqual(expect.arrayContaining(['h-10', 'w-10']));
    expect(wrapper.find('[data-test="event-details-fan-menu"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="event-details-fan-close"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="event-details-fan-join"]').exists()).toBe(false);

    await wrapper.get('[data-test="booking-details-accept"]').trigger('click');
    expect(wrapper.emitted('approve-booking')?.[0]?.[0]).toMatchObject({ bookingId: 'booking_1', decision: 'approve' });

    await wrapper.get('[data-test="booking-details-adjust"]').trigger('click');
    expect(wrapper.emitted('adjust-booking')?.[0]?.[0]).toMatchObject({ bookingId: 'booking_1', eventId: 'event_1' });
    wrapper.unmount();
  });

  it.each(['pending', 'pending_hold'])('expires a %s request at its exact start without fabricating cancellation data', async (status) => {
    const value = booking({
      status,
      userId: 25,
      fanUsername: 'grapegatsby',
      fanAvatar: 'https://example.test/fan.webp',
      meta: { chatId: 'chat_1', bookingMessageId: 'message_1' },
    });
    const wrapper = mountDetails(value, 'side-panel', {
      userRole: 'creator',
      canReviewPending: true,
      comparisonTime: '2027-04-25T14:14:59.999Z',
    });

    expect(wrapper.get('[data-test="event-details-fan-status"]').text()).toContain('Pending');
    expect(wrapper.find('[data-test="booking-details-review-notice"]').exists()).toBe(true);
    expect(wrapper.find('[data-test="booking-details-expired-notice"]').exists()).toBe(false);

    await wrapper.setProps({ comparisonTime: '2027-04-25T14:15:00.000Z' });

    const statusPill = wrapper.get('[data-test="event-details-fan-status"]');
    expect(statusPill.text()).toContain('Cancelled');
    expect(statusPill.get('img').attributes('src')).toBe(closeIcon);
    expect(wrapper.get('[data-test="booking-details-expired-notice"]').text()).toContain('Request expired');
    expect(wrapper.find('[data-test="booking-details-review-notice"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="event-details-fan-menu"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="booking-details-cancelled-notice"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="booking-details-cancelled-refund"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="booking-details-cancellation-fee"]').exists()).toBe(false);
    expect(value.status).toBe(status);

    wrapper.unmount();
  });

  it('keeps an in-progress confirmed booking confirmed', () => {
    const wrapper = mountDetails(booking({ status: 'confirmed', meta: {} }), 'side-panel', {
      comparisonTime: '2027-04-25T14:20:00.000Z',
    });

    expect(wrapper.get('[data-test="event-details-fan-status"]').text()).toContain('Confirmed');
    expect(wrapper.find('[data-test="booking-details-expired-notice"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it.each([
    ['confirmed', 'booking-details-confirmed-notice'],
    ['cancelled_creator', 'booking-details-cancelled-notice'],
  ])('lets a reactive authoritative booking override the internally fetched pending snapshot for %s', async (status, noticeHook) => {
    const pendingBooking = booking({
      status: 'pending',
      userId: 25,
      fanUsername: 'grapegatsby',
      fanAvatar: 'https://example.test/fan.webp',
      meta: { chatId: 'chat_1', bookingMessageId: 'message_1' },
    });
    flowRun.mockResolvedValueOnce({ ok: true, data: { item: pendingBooking } });
    const lightweightEvent = {
      bookingId: pendingBooking.bookingId,
      eventId: pendingBooking.eventId,
      title: pendingBooking.eventTitle,
      start: pendingBooking.startAtIso,
      end: pendingBooking.endAtIso,
      status: 'pending',
      raw: { bookingId: pendingBooking.bookingId, status: 'pending' },
    };
    const wrapper = mount(EventDetailsFan, {
      props: {
        presentation: 'side-panel',
        event: lightweightEvent,
        userRole: 'creator',
        canReviewPending: true,
      },
    });
    await flushPromises();

    expect(flowRun).toHaveBeenCalledWith('bookings.fetchBooking', { bookingId: pendingBooking.bookingId });
    expect(wrapper.get('[data-test="event-details-fan-status"]').text()).toContain('Pending');
    expect(wrapper.find('[data-test="booking-details-review-notice"]').exists()).toBe(true);

    const authoritativeBooking = {
      ...pendingBooking,
      status,
      meta: {},
      ...(status === 'cancelled_creator' ? {
        cancellation: { actor: 'creator', refundedTokens: 75 },
        payment: { allocations: { bookingFee: 5, cancellationFee: 10 } },
      } : {}),
    };
    await wrapper.setProps({
      booking: authoritativeBooking,
      event: { ...lightweightEvent, status, raw: authoritativeBooking },
    });

    expect(wrapper.get('[data-test="event-details-fan-status"]').text()).toContain(status === 'confirmed' ? 'Confirmed' : 'Cancelled');
    expect(wrapper.find('[data-test="booking-details-review-notice"]').exists()).toBe(false);
    expect(wrapper.find(`[data-test="${noticeHook}"]`).exists()).toBe(true);
    if (status === 'cancelled_creator') {
      expect(wrapper.get('[data-test="booking-details-cancelled-refund"]').text()).toContain('75');
      expect(wrapper.get('[data-test="booking-details-cancellation-fee"]').text()).toContain('10');
      expect(wrapper.get('[data-test="booking-details-booking-fee"]').text()).toContain('5');
    }
    wrapper.unmount();
  });

  it('updates an elapsed pending display from the component clock', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2027-04-25T14:14:59.000Z'));
    const wrapper = mountDetails(booking({
      status: 'pending',
      meta: { chatId: 'chat_1', bookingMessageId: 'message_1' },
    }), 'side-panel', { userRole: 'creator', canReviewPending: true });

    expect(wrapper.get('[data-test="event-details-fan-status"]').text()).toContain('Pending');

    await vi.advanceTimersByTimeAsync(15000);

    expect(wrapper.get('[data-test="event-details-fan-status"]').text()).toContain('Cancelled');
    expect(wrapper.find('[data-test="booking-details-expired-notice"]').exists()).toBe(true);
    wrapper.unmount();
  });

  it('lets Accept fill the review action row when adjustment is unavailable', () => {
    const value = booking({
      status: 'pending',
      userId: 25,
      fanUsername: 'grapegatsby',
      meta: {},
    });
    const wrapper = mountDetails(value, 'side-panel', { userRole: 'creator', canReviewPending: true });

    expect(wrapper.get('[data-test="booking-details-accept"]').classes()).toContain('flex-1');
    expect(wrapper.find('[data-test="booking-details-adjust"]').exists()).toBe(false);
    expect(wrapper.get('[data-test="booking-details-review-menu"]').classes()).toContain('w-10');
    wrapper.unmount();
  });

  it('keeps creator decline in the notice menu and confirms before rejecting', async () => {
    const value = booking({
      status: 'pending',
      userId: 25,
      fanUsername: 'grapegatsby',
      fanAvatar: 'https://example.test/fan.webp',
      meta: { chatId: 'chat_1', bookingMessageId: 'message_1' },
    });
    const wrapper = mountDetails(value, 'side-panel', { userRole: 'creator', canReviewPending: true });
    const menuTrigger = wrapper.get('[data-test="booking-details-review-menu"]');

    expect(menuTrigger.attributes('aria-expanded')).toBe('false');
    await menuTrigger.trigger('click');
    expect(menuTrigger.attributes('aria-expanded')).toBe('true');
    expect(wrapper.get('[data-test="booking-details-review-menu-dropdown"]').text()).toContain('Decline Booking');

    await wrapper.get('[data-test="booking-details-decline"]').trigger('click');
    expect(wrapper.emitted('reject-booking')).toBeUndefined();
    expect(wrapper.find('[data-test="booking-details-review-menu-dropdown"]').exists()).toBe(false);
    const decision = wrapper.getComponent({ name: 'BookingAdjustmentDecisionPopup' });
    expect(decision.props('modelValue')).toBe(true);
    expect(decision.props('mode')).toBe('reject');
    expect(decision.props('actorRole')).toBe('creator');
    expect(decision.props('eventTitle')).toBe('Lantau cows meet up');
    expect(decision.props('fanUsername')).toBe('grapegatsby');
    expect(decision.props('sessionRefundTokens')).toBe(100);
    expect(decision.props('netRefundTokens')).toBe(100);
    expect(wrapper.emitted('decision-visibility')?.at(-1)?.[0]).toBe(true);

    decision.vm.$emit('confirm', { mode: 'reject', requiresTopup: false, shortfallTokens: 0 });
    await wrapper.vm.$nextTick();
    expect(wrapper.emitted('reject-booking')?.[0]?.[0]).toMatchObject({ bookingId: 'booking_1', decision: 'reject' });
    expect(wrapper.emitted('decision-visibility')?.at(-1)?.[0]).toBe(false);
    wrapper.unmount();
  });

  it('uses the profile username instead of a generic User #ID in creator rejection', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ user: { username: 'profile_fan' } }),
    });
    const value = booking({
      status: 'pending',
      userId: 25,
      username: 'User #25',
      meta: { chatId: 'chat_1', bookingMessageId: 'message_1' },
    });
    const wrapper = mountDetails(value, 'side-panel', { userRole: 'creator', canReviewPending: true });
    await flushPromises();

    await wrapper.get('[data-test="booking-details-review-menu"]').trigger('click');
    await wrapper.get('[data-test="booking-details-decline"]').trigger('click');

    const decision = wrapper.getComponent({ name: 'BookingAdjustmentDecisionPopup' });
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/users/get-profile-data?id=25'), expect.objectContaining({ signal: expect.any(AbortSignal) }));
    expect(decision.props('fanUsername')).toBe('profile_fan');
    wrapper.unmount();
  });

  it('lifts the rejection confirmation above a panel the host raised', async () => {
    const value = booking({
      status: 'pending',
      userId: 25,
      fanUsername: 'grapegatsby',
      meta: { chatId: 'chat_1', bookingMessageId: 'message_1' },
    });

    // Chat lifts the panel over the conversation. A z-index above 5000 is taken
    // literally by the popup stack rather than stacked over, so the confirmation has
    // to be told to clear it or it opens underneath the chat window.
    const inChat = mountDetails(value, 'side-panel', {
      userRole: 'creator',
      canReviewPending: true,
      popupConfig: { zIndex: 10001 },
    });
    expect(inChat.getComponent({ name: 'BookingAdjustmentDecisionPopup' }).props('popupConfig'))
      .toEqual({ zIndex: 10002 });
    inChat.unmount();

    // Left at the default, normal stacking already puts the confirmation on top.
    const standalone = mountDetails(value, 'side-panel', { userRole: 'creator', canReviewPending: true });
    expect(standalone.getComponent({ name: 'BookingAdjustmentDecisionPopup' }).props('popupConfig'))
      .toBeNull();
    standalone.unmount();
  });

  it('dismisses the creator review menu on outside click and Escape', async () => {
    const value = booking({
      status: 'pending',
      userId: 25,
      fanUsername: 'grapegatsby',
      meta: { chatId: 'chat_1', bookingMessageId: 'message_1' },
    });
    const wrapper = mountDetails(value, 'side-panel', { userRole: 'creator', canReviewPending: true });
    const menuTrigger = wrapper.get('[data-test="booking-details-review-menu"]');

    await menuTrigger.trigger('click');
    document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-test="booking-details-review-menu-dropdown"]').exists()).toBe(false);

    await menuTrigger.trigger('click');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await wrapper.vm.$nextTick();
    expect(wrapper.find('[data-test="booking-details-review-menu-dropdown"]').exists()).toBe(false);
    expect(wrapper.emitted('close')).toBeUndefined();
    wrapper.unmount();
  });

  it('shows actor-aware creator cancellation details and nonzero fees', () => {
    const wrapper = mountDetails(booking({
      status: 'cancelled_creator',
      userId: 25,
      fanUsername: 'grapegatsby',
      meta: {},
      cancellation: { actor: 'creator', refundedTokens: 335, cancellationFeeTokens: 100 },
      payment: { allocations: { bookingFee: 20, cancellationFee: 100 } },
    }), 'side-panel', { userRole: 'creator' });

    expect(wrapper.get('[data-test="booking-details-cancelled-heading"]').text()).toContain('@grapegatsby');
    expect(wrapper.get('[data-test="booking-details-cancelled-refund"]').text()).toContain('335');
    expect(wrapper.get('[data-test="booking-details-cancellation-fee"]').text()).toContain('100');
    expect(wrapper.get('[data-test="booking-details-booking-fee"]').text()).toContain('20');
    expect(wrapper.get('[data-test="booking-details-cost-tiles"]').classes()).toEqual(expect.arrayContaining(['flex-row', 'flex-wrap']));
    expect(wrapper.get('[data-test="booking-details-cancellation-fee"]').classes()).toContain('flex-col');
    expect(wrapper.get('[data-test="booking-details-booking-fee"]').classes()).toContain('flex-col');
    expect(wrapper.find('[data-test="event-details-fan-session-cost-standard"]').exists()).toBe(false);
    wrapper.unmount();
  });

  it('shows the refund from the full booking payment settlement', () => {
    const wrapper = mountDetails(booking({
      status: 'cancelled_creator',
      userId: 25,
      fanUsername: 'grapegatsby',
      meta: {},
      cancellation: { actor: 'creator' },
      paymentSettlement: {
        status: 'completed',
        releasedTotal: 235,
        capturedTotal: 100,
      },
    }), 'side-panel', { userRole: 'creator' });

    expect(wrapper.get('[data-test="booking-details-cancelled-refund"]').text()).toContain('235');
    wrapper.unmount();
  });
});
