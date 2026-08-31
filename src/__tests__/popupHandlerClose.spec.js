import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PopupHandler from '@/components/ui/popup/PopupHandler.vue';

const CLOSE_DURATION_MS = 220;
const CLOSE_FALLBACK_MARGIN_MS = 100;

function popupConfig(name, from = 'right') {
  return {
    actionType: 'slidein',
    from,
    verticalAlign: from === 'bottom' ? 'bottom' : 'stretch',
    speed: '0ms',
    closeSpeed: `${CLOSE_DURATION_MS}ms`,
    closeEffect: 'ease-in',
    showOverlay: true,
    closeOnOutside: true,
    lockScroll: true,
    width: { default: '100%' },
    height: { default: '100%' },
    scrollable: false,
    containerAttrs: { 'data-test': name },
  };
}

function transitionEvent(type = 'transitionend', propertyName = 'transform') {
  const event = new Event(type);
  Object.defineProperty(event, 'propertyName', { value: propertyName });
  return event;
}

describe('PopupHandler close lifecycle', () => {
  const wrappers = [];

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('requestAnimationFrame', (callback) => {
      callback();
      return 1;
    });
  });

  afterEach(async () => {
    wrappers.splice(0).reverse().forEach((wrapper) => wrapper.unmount());
    vi.runOnlyPendingTimers();
    await nextTick();
    document.body.classList.remove('overflow-hidden');
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  async function openPopup(name, from = 'right') {
    const wrapper = mount(PopupHandler, {
      attachTo: document.body,
      props: {
        modelValue: false,
        config: popupConfig(name, from),
      },
      slots: { default: `<div data-test="${name}-content">Popup content</div>` },
    });
    wrappers.push(wrapper);

    await wrapper.setProps({ modelValue: true });
    await nextTick();
    await nextTick();

    return {
      wrapper,
      panel: document.body.querySelector(`[data-test="${name}"]`),
    };
  }

  it.each([
    ['right-side drawer', 'right', 'translateX(100%)'],
    ['bottom sheet', 'bottom', 'translateY(100%)'],
  ])('falls back to deterministic cleanup when %s misses transitionend', async (_label, from, closingTransform) => {
    const { wrapper, panel } = await openPopup(`fallback-${from}`, from);
    const overlay = document.body.querySelector('[data-popup-overlay]');

    expect(panel).not.toBeNull();
    expect(overlay.style.opacity).toBe('1');
    expect(document.body.classList.contains('overflow-hidden')).toBe(true);

    await wrapper.setProps({ modelValue: false });
    expect(panel.style.transform).toBe(closingTransform);
    expect(panel.style.transition).toContain(`transform ${CLOSE_DURATION_MS}ms ease-in`);

    vi.advanceTimersByTime(CLOSE_DURATION_MS + CLOSE_FALLBACK_MARGIN_MS - 1);
    await nextTick();
    expect(panel.style.display).not.toBe('none');

    vi.advanceTimersByTime(1);
    await nextTick();
    expect(panel.style.display).toBe('none');
    expect(wrapper.emitted('closed')).toHaveLength(1);
    expect(overlay.style.opacity).toBe('0');
    expect(document.body.classList.contains('overflow-hidden')).toBe(false);

    vi.advanceTimersByTime(250);
    expect(overlay.style.visibility).toBe('hidden');
    expect(overlay.style.pointerEvents).toBe('none');
  });

  it('does not let resize or orientation synchronization reopen a closing drawer', async () => {
    const { wrapper, panel } = await openPopup('closing-layout', 'right');

    await wrapper.setProps({ modelValue: false });
    expect(panel.style.transform).toBe('translateX(100%)');

    window.dispatchEvent(new Event('resize'));
    window.dispatchEvent(new Event('orientationchange'));
    vi.advanceTimersByTime(0);
    await nextTick();

    expect(panel.style.transform).toBe('translateX(100%)');
    vi.advanceTimersByTime(CLOSE_DURATION_MS + CLOSE_FALLBACK_MARGIN_MS);
    await nextTick();
    expect(panel.style.display).toBe('none');
  });

  it('finalizes once on a matching transition and cancels the fallback', async () => {
    const { wrapper, panel } = await openPopup('transition-close');

    await wrapper.setProps({ modelValue: false });
    panel.dispatchEvent(transitionEvent());
    await nextTick();

    expect(panel.style.display).toBe('none');
    expect(wrapper.emitted('closed')).toHaveLength(1);

    vi.advanceTimersByTime(CLOSE_DURATION_MS + CLOSE_FALLBACK_MARGIN_MS + 250);
    await nextTick();
    expect(wrapper.emitted('closed')).toHaveLength(1);
  });

  it('moves the shared overlay below the underlying popup before hiding it with the final popup', async () => {
    const lower = await openPopup('stack-lower');
    const upper = await openPopup('stack-upper');
    const overlay = document.body.querySelector('[data-popup-overlay]');

    expect(Number(overlay.style.zIndex)).toBeLessThan(Number(upper.panel.style.zIndex));
    expect(Number(overlay.style.zIndex)).toBeGreaterThan(Number(lower.panel.style.zIndex));

    await upper.wrapper.setProps({ modelValue: false });
    upper.panel.dispatchEvent(transitionEvent());
    await nextTick();

    expect(upper.panel.style.display).toBe('none');
    expect(lower.panel.style.display).not.toBe('none');
    expect(overlay.style.opacity).toBe('1');
    expect(Number(overlay.style.zIndex)).toBeLessThan(Number(lower.panel.style.zIndex));
    expect(document.body.classList.contains('overflow-hidden')).toBe(true);

    await lower.wrapper.setProps({ modelValue: false });
    lower.panel.dispatchEvent(transitionEvent());
    await nextTick();

    expect(lower.panel.style.display).toBe('none');
    expect(overlay.style.opacity).toBe('0');
    expect(document.body.classList.contains('overflow-hidden')).toBe(false);

    vi.advanceTimersByTime(250);
    expect(overlay.style.visibility).toBe('hidden');
    expect(overlay.style.pointerEvents).toBe('none');
  });

  it('cancels pending close completion when unmounted', async () => {
    const { wrapper } = await openPopup('unmount-close');

    await wrapper.setProps({ modelValue: false });
    wrapper.unmount();
    wrappers.splice(wrappers.indexOf(wrapper), 1);

    vi.advanceTimersByTime(CLOSE_DURATION_MS + CLOSE_FALLBACK_MARGIN_MS + 250);
    await nextTick();
    expect(wrapper.emitted('closed')).toBeUndefined();
  });
});
