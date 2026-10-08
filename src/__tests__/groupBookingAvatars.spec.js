import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import EventsWidget from '@/components/calendar/EventsWidget.vue';
import StickyBookingCard from '@/components/calendar/StickyBookingCard.vue';
import { clearBookingNoticeProfileCache } from '@/components/ui/card/event/bookingNoticeProfile.js';

const wrappers = [];
let fetchMock;

beforeEach(() => {
  clearBookingNoticeProfileCache();
  fetchMock = vi.fn(async url => {
    const id = new URL(String(url), 'http://localhost').searchParams.get('id');
    return { ok: true, json: async () => ({ user: { display_name: `Fan ${id}`, avatar: `/fan-${id}.png` } }) };
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount());
  clearBookingNoticeProfileCache();
  vi.unstubAllGlobals();
});

function mountCards(count) {
  const participants = Array.from({ length: count }, (_, index) => ({ userId: index + 1, name: `Fan ${index + 1}`, avatarUrl: null }));
  const event = { title: 'Group session', isGroup: true, participantCount: count, groupText: `Group event (${count})`,
    sourceEvent: { raw: { participants, participantCount: count }, status: 'confirmed' } };
  const desktop = mount(EventsWidget, { props: { userRole: 'creator', sections: [{ title: 'BOOKINGS', items: [event] }] } });
  const mobile = mount(StickyBookingCard, { props: { userRole: 'creator', event } });
  wrappers.push(desktop, mobile);
  return [desktop, mobile];
}

describe('group booking card fan avatars', () => {
  it.each([0, 1, 2, 3, 4, 50])('shows at most three real fan pictures and the remaining count only above three (%i fans)', async count => {
    const cards = mountCards(count);
    await flushPromises();
    for (const card of cards) {
      const avatars = card.findAll('[data-test="group-booking-fan-avatar"]');
      expect(avatars).toHaveLength(Math.min(count, 3));
      expect(avatars.map(avatar => new URL(avatar.attributes('src'), 'http://localhost').pathname)).toEqual(Array.from({ length: Math.min(count, 3) }, (_, index) => `/fan-${index + 1}.png`));
      expect(card.find('[data-test="group-booking-fan-count"]').exists()).toBe(count > 3);
      if (count > 3) expect(card.get('[data-test="group-booking-fan-count"]').text()).toBe(`+${count - 3}`);
      expect(card.text()).not.toContain('Group event');
    }
    // Desktop and mobile share requests, and fans beyond the three shown need no lookup.
    expect(fetchMock).toHaveBeenCalledTimes(Math.min(count, 3));
  });

  it.each(['missing', 'failed'])('uses the mango fallback when the profile avatar is %s', async state => {
    if (state === 'failed') fetchMock.mockRejectedValue(new Error('Profile unavailable'));
    else fetchMock.mockResolvedValue({ ok: true, json: async () => ({ user: { avatar: null } }) });
    const cards = mountCards(3);
    await flushPromises();
    for (const card of cards) {
      const avatars = card.findAll('[data-test="group-booking-fan-avatar"]');
      expect(avatars).toHaveLength(3);
      expect(avatars.every(avatar => avatar.attributes('src') === 'https://i.ibb.co/XZHymffZ/avatar-of-a-mango.png')).toBe(true);
      expect(card.find('[data-test="group-booking-fan-count"]').exists()).toBe(false);
    }
  });
});
