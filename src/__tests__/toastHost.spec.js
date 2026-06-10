import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ToastHost from "@/components/ui/toast/ToastHost.vue";
import { toastEventName } from "@/utils/toastBus.js";

describe("ToastHost", () => {
  const wrappers = [];

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    wrappers.splice(0).forEach((wrapper) => wrapper.unmount());
    vi.useRealTimers();
  });

  function mountToastHost() {
    const wrapper = mount(ToastHost);
    wrappers.push(wrapper);
    return wrapper;
  }

  it("keeps manual-close toasts visible until the close button is clicked", async () => {
    const wrapper = mountToastHost();

    document.dispatchEvent(new CustomEvent(toastEventName, {
      detail: {
        type: "error",
        title: "Validation Failed",
        message: "Please fill these fields",
        autoClose: false,
        duration: 10,
      },
    }));
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("Please fill these fields");

    vi.advanceTimersByTime(1000);
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain("Please fill these fields");

    await wrapper.get("button").trigger("click");
    expect(wrapper.text()).not.toContain("Please fill these fields");
  });

  it("renders one shared toast when multiple hosts are mounted", async () => {
    const firstHost = mountToastHost();
    const secondHost = mountToastHost();

    document.dispatchEvent(new CustomEvent(toastEventName, {
      detail: {
        type: "error",
        title: "Validation Failed",
        message: "Please fill these fields",
        autoClose: false,
      },
    }));
    await firstHost.vm.$nextTick();
    await secondHost.vm.$nextTick();

    expect(firstHost.text()).toContain("Please fill these fields");
    expect(secondHost.text()).not.toContain("Please fill these fields");

    await firstHost.get("button").trigger("click");
    expect(firstHost.text()).not.toContain("Please fill these fields");
    expect(secondHost.text()).not.toContain("Please fill these fields");
  });
});
