import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import PopupHandler from '@/components/ui/popup/PopupHandler.vue';

const popupConfig = {
  actionType: 'slidein',
  from: 'bottom',
  speed: '0ms',
  closeSpeed: '0ms',
  showOverlay: false,
  closeOnOutside: false,
  lockScroll: false,
  width: { default: '30rem', '<900': '100%' },
  height: { default: '70%', '<900': '80%' },
  forceHeight: true,
  containerAttrs: { 'data-test': 'orientation-popup-panel' },
};

function setViewport(width, height) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { configurable: true, value: height });
}

describe('PopupHandler orientation layout synchronization', () => {
  let wrapper;

  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', (callback) => {
      callback();
      return 1;
    });
  });

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
    setViewport(1024, 768);
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  async function openPopup() {
    wrapper = mount(PopupHandler, {
      attachTo: document.body,
      props: {
        modelValue: false,
        config: popupConfig,
      },
    });

    await wrapper.setProps({ modelValue: true });
    await nextTick();
    await nextTick();

    return document.body.querySelector('[data-test="orientation-popup-panel"]');
  }

  it('resynchronizes an open bottom slide-in in both orientation directions', async () => {
    vi.useFakeTimers();
    setViewport(820, 1180);
    const panel = await openPopup();

    expect(panel).not.toBeNull();
    expect(panel.style.width).toBe('100%');
    expect(panel.style.height).toBe('80%');
    expect(panel.style.getPropertyPriority('height')).toBe('important');
    expect(panel.style.maxHeight).toBe('1180px');

    setViewport(1180, 820);
    window.dispatchEvent(new Event('orientationchange'));
    vi.runAllTimers();
    await nextTick();

    expect(panel.style.width).toBe('30rem');
    expect(panel.style.height).toBe('70%');
    expect(panel.style.maxHeight).toBe('820px');
    expect(panel.style.transform).toBe('translate(0, 0)');

    setViewport(820, 1180);
    window.dispatchEvent(new Event('orientationchange'));
    vi.runAllTimers();
    await nextTick();

    expect(panel.style.width).toBe('100%');
    expect(panel.style.height).toBe('80%');
    expect(panel.style.maxHeight).toBe('1180px');
    expect(panel.style.transform).toBe('translate(0, 0)');
  });

  it('retains immediate resize synchronization for an open popup', async () => {
    setViewport(820, 1180);
    const panel = await openPopup();

    setViewport(1180, 820);
    window.dispatchEvent(new Event('resize'));
    await nextTick();

    expect(panel.style.width).toBe('30rem');
    expect(panel.style.height).toBe('70%');
    expect(panel.style.maxHeight).toBe('820px');
    expect(panel.style.transform).toBe('translate(0, 0)');
  });

  it('removes the orientation listener and cancels deferred resyncs on unmount', async () => {
    vi.useFakeTimers();
    const removeEventListener = vi.spyOn(window, 'removeEventListener');
    setViewport(820, 1180);
    await openPopup();

    const baselineTimerCount = vi.getTimerCount();
    window.dispatchEvent(new Event('orientationchange'));
    expect(vi.getTimerCount()).toBe(baselineTimerCount + 3);

    wrapper.unmount();
    wrapper = null;

    expect(vi.getTimerCount()).toBe(baselineTimerCount);
    expect(removeEventListener).toHaveBeenCalledWith('orientationchange', expect.any(Function));
  });
});
