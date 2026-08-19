import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import BookingAdjustmentDecisionPopup from '@/components/ui/popup/BookingAdjustmentDecisionPopup.vue';
import TokenIcon from '@/assets/images/icons/token-sm-calender.svg';
import ArrowBrownIcon from '@/assets/images/icons/arrow-right-brown.svg';

const PopupHandlerStub = {
  name: 'PopupHandler',
  props: ['modelValue', 'config'],
  emits: ['update:modelValue'],
  template: '<div data-test="popup-handler-stub"><slot /></div>',
};

function mountDecision(props = {}) {
  return mount(BookingAdjustmentDecisionPopup, {
    props: {
      modelValue: true,
      mode: 'accept',
      originalTokens: 1000,
      proposedTokens: 1335,
      walletBalance: 30000,
      creatorUsername: 'miu_creator',
      creatorName: 'Miu Miu',
      eventTitle: 'Cows of Lantau',
      ...props,
    },
    global: { stubs: { PopupHandler: PopupHandlerStub } },
  });
}

describe('BookingAdjustmentDecisionPopup', () => {
  it('renders creator rejection as a full-session refund confirmation', async () => {
    const wrapper = mountDecision({
      mode: 'reject',
      actorRole: 'creator',
      fanUsername: 'grapegatsby',
      sessionRefundTokens: 335,
      netRefundTokens: 335,
    });
    const primary = wrapper.get('[data-test="booking-adjustment-decision-primary"]');

    expect(wrapper.get('[data-test="booking-adjustment-decision-popup"]').attributes('data-mode')).toBe('reject');
    expect(wrapper.get('[data-test="booking-adjustment-decision-heading"]').text()).toContain('Cows of Lantau');
    expect(wrapper.get('[data-test="booking-adjustment-decision-heading"]').text()).toContain('@grapegatsby');
    expect(wrapper.get('[data-test="booking-adjustment-decision-heading"]').text()).toContain('Full Session Cost');
    expect(wrapper.find('[data-test="booking-adjustment-decision-prices"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="booking-adjustment-balance-card"]').exists()).toBe(false);
    expect(wrapper.get('[data-test="booking-adjustment-creator-session-refund"]').text()).toBe('335');
    expect(wrapper.get('[data-test="booking-adjustment-creator-total-refund"]').text()).toBe('335');
    expect(primary.classes()).toContain('bg-[#FF4405]');
    expect(primary.text()).toBe('Cancel & Refund @grapegatsby');

    await primary.trigger('click');
    expect(wrapper.emitted('confirm')?.[0]?.[0]).toEqual({ mode: 'reject', requiresTopup: false, shortfallTokens: 0 });
  });

  it('does not expose a generic User #ID as the fan username', () => {
    const wrapper = mountDecision({
      mode: 'reject',
      actorRole: 'creator',
      fanUsername: 'User #25',
      sessionRefundTokens: 335,
      netRefundTokens: 335,
    });

    expect(wrapper.text()).not.toContain('User #25');
    expect(wrapper.text()).toContain('@fan');
  });

  it('renders a price decrease with refund and projected balance', async () => {
    const wrapper = mountDecision({ originalTokens: 1335, proposedTokens: 1000 });

    expect(wrapper.get('[data-test="booking-adjustment-decision-heading"]').text()).toContain('335 Tokens');
    expect(wrapper.get('[data-test="booking-adjustment-original-price"]').text()).toBe('1,335');
    expect(wrapper.get('[data-test="booking-adjustment-new-price"]').text()).toBe('1,000');
    expect(wrapper.get('[data-test="booking-adjustment-transaction-amount"]').text()).toBe('335');
    expect(wrapper.get('[data-test="booking-adjustment-projected-balance"]').text()).toBe('30,335');
    expect(wrapper.get('[data-test="booking-adjustment-decision-primary"]').classes()).toContain('bg-[#07F468]');

    await wrapper.get('[data-test="booking-adjustment-decision-primary"]').trigger('click');
    expect(wrapper.emitted('confirm')?.[0]?.[0]).toEqual({ mode: 'accept', requiresTopup: false, shortfallTokens: 0 });
  });

  it('renders an affordable increase with the correct deduction', () => {
    const wrapper = mountDecision();

    expect(wrapper.get('[data-test="booking-adjustment-decision-heading"]').text()).toContain('price increase of 335 Tokens');
    expect(wrapper.get('[data-test="booking-adjustment-transaction-amount"]').text()).toBe('335');
    expect(wrapper.get('[data-test="booking-adjustment-projected-balance"]').text()).toBe('29,665');
    expect(wrapper.text()).toContain('Subtotal');
  });

  it('renders the yellow top-up state and emits the exact shortfall', async () => {
    const wrapper = mountDecision({ walletBalance: 50 });
    const primary = wrapper.get('[data-test="booking-adjustment-decision-primary"]');

    expect(wrapper.get('[data-test="booking-adjustment-topup-needed"]').text()).toContain('TOP UP NEEDED');
    expect(wrapper.get('[data-test="booking-adjustment-wallet-balance"]').text()).toBe('50');
    expect(wrapper.find('[data-test="booking-adjustment-projected-balance"]').exists()).toBe(false);
    expect(primary.classes()).toContain('bg-[#facc15]');
    expect(primary.text()).toBe('TOP UP & PAY');

    await primary.trigger('click');
    expect(wrapper.emitted('confirm')?.[0]?.[0]).toEqual({ mode: 'accept', requiresTopup: true, shortfallTokens: 285 });
  });

  it('renders the red decline flow with gross refund, booking and cancellation fees, and net projected balance', async () => {
    const wrapper = mountDecision({
      mode: 'decline',
      sessionRefundTokens: 1020,
      bookingFeeTokens: 20,
      cancellationFeeTokens: 100,
    });
    const primary = wrapper.get('[data-test="booking-adjustment-decision-primary"]');

    expect(wrapper.get('[data-test="booking-adjustment-decision-heading"]').text()).toContain('miu_creator');
    expect(wrapper.get('[data-test="booking-adjustment-decision-heading"]').text()).not.toContain('Cows of Lantau');
    expect(wrapper.find('[data-test="booking-adjustment-decision-prices"]').exists()).toBe(false);
    expect(wrapper.get('[data-test="booking-adjustment-transaction-amount"]').text()).toBe('1,020');
    expect(wrapper.get('[data-test="booking-adjustment-booking-fee"]').text()).toBe('20');
    expect(wrapper.get('[data-test="booking-adjustment-cancellation-fee"]').text()).toBe('100');
    expect(wrapper.get('[data-test="booking-adjustment-projected-balance"]').text()).toBe('30,900');
    expect(primary.classes()).toContain('bg-[#FF4405]');
    expect(primary.text()).toBe('PROCEED TO CANCEL BOOKING');

    await primary.trigger('click');
    expect(wrapper.emitted('confirm')?.[0]?.[0]).toEqual({ mode: 'decline', requiresTopup: false, shortfallTokens: 0 });
  });

  it('renders ordinary cancellation with the same fee-aware presentation and emits cancel mode', async () => {
    const wrapper = mountDecision({
      mode: 'cancel',
      sessionRefundTokens: 1020,
      bookingFeeTokens: 20,
      cancellationFeeTokens: 100,
    });
    const primary = wrapper.get('[data-test="booking-adjustment-decision-primary"]');

    expect(wrapper.get('[data-test="booking-adjustment-decision-popup"]').attributes('data-mode')).toBe('cancel');
    expect(wrapper.find('[data-test="booking-adjustment-decision-prices"]').exists()).toBe(false);
    expect(wrapper.get('[data-test="booking-adjustment-transaction-amount"]').text()).toBe('1,020');
    expect(wrapper.get('[data-test="booking-adjustment-booking-fee"]').text()).toBe('20');
    expect(wrapper.get('[data-test="booking-adjustment-cancellation-fee"]').text()).toBe('100');
    expect(wrapper.get('[data-test="booking-adjustment-projected-balance"]').text()).toBe('30,900');
    expect(primary.classes()).toContain('bg-[#FF4405]');
    expect(primary.text()).toBe('PROCEED TO CANCEL BOOKING');

    await primary.trigger('click');
    expect(wrapper.emitted('confirm')?.[0]?.[0]).toEqual({ mode: 'cancel', requiresTopup: false, shortfallTokens: 0 });
  });

  it('omits the cancellation fee row when the policy waives it', () => {
    const wrapper = mountDecision({ mode: 'decline', sessionRefundTokens: 1000, cancellationFeeTokens: 0 });

    expect(wrapper.find('[data-test="booking-adjustment-booking-fee-row"]').exists()).toBe(false);
    expect(wrapper.find('[data-test="booking-adjustment-cancellation-fee-row"]').exists()).toBe(false);
    expect(wrapper.get('[data-test="booking-adjustment-projected-balance"]').text()).toBe('31,000');
    expect(wrapper.get('[data-test="booking-adjustment-decision-heading"]').text()).not.toContain('charge will apply');
    expect(wrapper.get('[data-test="booking-adjustment-decision-heading"]').text()).toContain('miu_creator');
    expect(wrapper.get('[data-test="booking-adjustment-decision-heading"]').text()).not.toContain('Cows of Lantau');
  });

  it('falls back to the creator display name when a username is unavailable', () => {
    const wrapper = mountDecision({
      mode: 'cancel',
      creatorUsername: '',
      sessionRefundTokens: 1000,
      cancellationFeeTokens: 0,
    });

    expect(wrapper.get('[data-test="booking-adjustment-decision-heading"]').text()).toContain('Miu Miu');
    expect(wrapper.get('[data-test="booking-adjustment-decision-heading"]').text()).not.toContain('Cows of Lantau');
  });

  it('shows only the booking fee row and charge warning when it is the only applicable fee', () => {
    const wrapper = mountDecision({
      mode: 'decline',
      sessionRefundTokens: 920,
      bookingFeeTokens: 20,
      cancellationFeeTokens: 0,
    });

    expect(wrapper.get('[data-test="booking-adjustment-booking-fee"]').text()).toBe('20');
    expect(wrapper.find('[data-test="booking-adjustment-cancellation-fee-row"]').exists()).toBe(false);
    expect(wrapper.get('[data-test="booking-adjustment-projected-balance"]').text()).toBe('30,900');
    expect(wrapper.get('[data-test="booking-adjustment-decision-heading"]').text()).toContain('charge will apply');
  });

  it('shows only the cancellation fee row when no booking fee applies', () => {
    const wrapper = mountDecision({
      mode: 'decline',
      sessionRefundTokens: 1000,
      bookingFeeTokens: 0,
      cancellationFeeTokens: 100,
    });

    expect(wrapper.find('[data-test="booking-adjustment-booking-fee-row"]').exists()).toBe(false);
    expect(wrapper.get('[data-test="booking-adjustment-cancellation-fee"]').text()).toBe('100');
    expect(wrapper.get('[data-test="booking-adjustment-projected-balance"]').text()).toBe('30,900');
  });

  it('supports loading, retry, and duplicate-action guards', async () => {
    const loading = mountDecision({ balanceLoading: true, walletBalance: null });
    expect(loading.get('[data-test="booking-adjustment-balance-loading"]').exists()).toBe(true);
    expect(loading.get('[data-test="booking-adjustment-decision-primary"]').attributes('disabled')).toBeDefined();

    const failed = mountDecision({ balanceError: 'Balance unavailable', walletBalance: null });
    expect(failed.get('[data-test="booking-adjustment-balance-error"]').text()).toBe('Balance unavailable');
    await failed.get('[data-test="booking-adjustment-decision-primary"]').trigger('click');
    expect(failed.emitted('retry-balance')).toHaveLength(1);
    expect(failed.emitted('confirm')).toBeUndefined();

    const processing = mountDecision({ processing: true });
    await processing.get('[data-test="booking-adjustment-decision-close"]').trigger('click');
    expect(processing.emitted('close')).toBeUndefined();
  });

  it('renders the creator refund-only cancellation presentation', async () => {
    const wrapper = mountDecision({
      mode: 'cancel',
      actorRole: 'creator',
      fanUsername: 'grapegatsby',
      sessionRefundTokens: 335,
      netRefundTokens: 335,
      walletBalance: null,
    });

    expect(wrapper.get('[data-test="booking-adjustment-decision-heading"]').text()).toContain('Cows of Lantau');
    expect(wrapper.get('[data-test="booking-adjustment-decision-heading"]').text()).toContain('@grapegatsby');
    expect(wrapper.find('[data-test="booking-adjustment-balance-card"]').exists()).toBe(false);
    expect(wrapper.get('[data-test="booking-adjustment-creator-session-refund"]').text()).toBe('335');
    expect(wrapper.get('[data-test="booking-adjustment-creator-total-refund"]').text()).toBe('335');
    expect(wrapper.get('[data-test="booking-adjustment-decision-primary"]').text()).toBe('Cancel & Refund @grapegatsby');

    await wrapper.get('[data-test="booking-adjustment-decision-primary"]').trigger('click');
    expect(wrapper.emitted('confirm')?.[0]?.[0]).toEqual({ mode: 'cancel', requiresTopup: false, shortfallTokens: 0 });
  });

  it('preserves the reference popup structure, assets, and responsive configuration', () => {
    const wrapper = mountDecision();
    const root = wrapper.get('[data-test="booking-adjustment-decision-popup"]');
    const sources = wrapper.findAll('img').map((image) => image.attributes('src'));
    const config = wrapper.getComponent(PopupHandlerStub).props('config');

    expect(root.classes()).toEqual(expect.arrayContaining([
      'booking-adjustment-decision-card', 'w-96', 'max-md:w-full', 'p-4', 'bg-white/90', 'backdrop-blur-[50px]', 'gap-6',
    ]));
    expect(wrapper.findAll('[data-svg-wrapper]').length).toBeGreaterThanOrEqual(7);
    expect(sources).toEqual(expect.arrayContaining([TokenIcon, ArrowBrownIcon]));
    expect(config.width).toBe('auto');
    expect(config.containerClass).toBe('booking-adjustment-decision-container');
  });

  it('closes without affecting the surrounding details panel', async () => {
    const wrapper = mountDecision();
    await wrapper.get('[data-test="booking-adjustment-decision-close"]').trigger('click');

    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([false]);
    expect(wrapper.emitted('close')).toHaveLength(1);
  });
});
