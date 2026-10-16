import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Decision from '@/components/ui/popup/BookingAdjustmentDecisionPopup.vue';

const PopupHandler = { props: ['modelValue'], template: '<div v-if="modelValue"><slot /></div>' };
function render(extra = {}) {
  return mount(Decision, { props: { modelValue: true, mode: 'cancel', actorRole: 'fan', isGroupEvent: true,
    walletBalance: 1000, sessionRefundTokens: 115, bookingFeeTokens: 10, cancellationFeeTokens: 5, ...extra },
    global: { stubs: { PopupHandler } } });
}
describe('fan group withdrawal using the existing confirmation', () => {
  it('shows the existing breakdown and confirms withdrawal with applicable fees', async () => {
    const w = render();
    expect(w.get('[data-test=booking-adjustment-decision-heading]').text()).toBe('Are you sure you want to withdraw from this event? A cancellation fee will apply:');
    expect(w.get('[data-test=booking-adjustment-balance-card]').exists()).toBe(true);
    expect(w.get('[data-test=booking-adjustment-projected-balance]').text()).toBe('1,100');
    const button = w.get('[data-test=booking-adjustment-decision-primary]');
    expect(button.text()).toBe('Withdraw Event');
    await button.trigger('click');
    expect(w.emitted('confirm')[0][0].mode).toBe('cancel');
    w.unmount();
  });
  it('omits the cancellation warning when waived even if the booking fee remains', () => {
    const w = render({ cancellationFeeRefundable: true });
    expect(w.get('[data-test=booking-adjustment-decision-heading]').text()).toBe('Are you sure you want to withdraw from this event?');
    expect(w.find('[data-test=booking-adjustment-cancellation-fee-row]').exists()).toBe(false);
    expect(w.get('[data-test=booking-adjustment-booking-fee]').text()).toBe('10');
    expect(w.get('[data-test=booking-adjustment-projected-balance]').text()).toBe('1,105');
    w.unmount();
  });
  it('shows the full refund when no fees exist', () => {
    const w = render({ sessionRefundTokens: 100, bookingFeeTokens: 0, cancellationFeeTokens: 0 });
    expect(w.text()).not.toContain('A cancellation fee will apply');
    expect(w.get('[data-test=booking-adjustment-projected-balance]').text()).toBe('1,100');
    w.unmount();
  });
  it('keeps one-on-one cancellation wording', () => {
    const w = render({ isGroupEvent: false });
    expect(w.text()).not.toContain('Withdraw Event');
    expect(w.get('[data-test=booking-adjustment-decision-primary]').text()).toBe('PROCEED TO CANCEL BOOKING');
    w.unmount();
  });
  it('blocks repeat confirmation while processing', async () => {
    const w = render({ processing: true });
    await w.get('[data-test=booking-adjustment-decision-primary]').trigger('click');
    expect(w.emitted('confirm')).toBeUndefined();
    w.unmount();
  });
});
