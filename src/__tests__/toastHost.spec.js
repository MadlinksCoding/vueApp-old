import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ToastHost from "@/components/ui/toast/ToastHost.vue";
import { toastEventName } from "@/utils/toastBus.js";

describe("ToastHost", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps manual-close toasts visible until the close button is clicked", async () => {
    const wrapper = mount(ToastHost);

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
});
