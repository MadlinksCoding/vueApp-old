import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import { bookedScheduleRanges } from '@/components/ui/form/BookingForm/bookedScheduleRanges.js';
import BookingDateInput from '@/components/ui/form/BookingForm/HelperComponents/BookingDateInput.vue';

describe('confirmed booking schedule controls', () => {
  it('projects overnight bookings and paid extensions into the creator calendar', () => {
    const rows = [{ status: 'confirmed', startAtIso: '2030-01-01T15:30:00Z', endAtIso: '2030-01-01T16:00:00Z', extensions: [{ status: 'held', endAtIso: '2030-01-01T16:30:00Z' }] },
      { status: 'cancelled_creator', startAtIso: '2030-01-02T00:00:00Z', endAtIso: '2030-01-02T01:00:00Z' }];
    expect(bookedScheduleRanges(rows, 'Asia/Hong_Kong')).toEqual([
      { date: '2030-01-01', day: 2, start: 1410, end: 1440 },
      { date: '2030-01-02', day: 3, start: 0, end: 30 },
    ]);
    expect(bookedScheduleRanges(rows, 'Asia/Hong_Kong', { from: '2030-01-02', to: '2030-01-02' })).toHaveLength(1);
  });
  it('disables a booked date in the existing calendar picker', async () => {
    const wrapper = mount(BookingDateInput, { props: { modelValue: '2030-01-02', blockedDates: ['2030-01-03'] } });
    await wrapper.find('button').trigger('click');
    const day = wrapper.findAll('button').find(button => button.text() === '3');
    expect(day.attributes('disabled')).toBeDefined();
    wrapper.unmount();
  });
});
