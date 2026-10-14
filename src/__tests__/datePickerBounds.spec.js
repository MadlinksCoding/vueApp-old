import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import VueDatePicker from '@/components/ui/date-picker/VueDatePicker.vue';

describe('calendar date bounds', () => {
  it('allows the minimum day itself while preserving bounds and blocked dates', async () => {
    const wrapper = mount(VueDatePicker, { props: { modelValue: '2026-10-16', config: { minDate: '2026-10-14', maxDate: '2026-10-16', blockedDates: ['2026-10-15'] } } });
    const day = value => wrapper.findAll('button').find(button => button.text() === value);
    expect(day('13').element.disabled).toBe(true);
    expect(day('14').element.disabled).toBe(false);
    expect(day('15').element.disabled).toBe(true);
    expect(day('16').element.disabled).toBe(false);
    expect(day('17').element.disabled).toBe(true);
    await day('14').trigger('click');
    expect(wrapper.emitted('update:modelValue').at(-1)).toEqual(['2026-10-14']);
    wrapper.unmount();
  });
});
