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

  it("copies the hidden action value and reports success", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    const wrapper = mountToastHost();

    document.dispatchEvent(new CustomEvent(toastEventName, {
      detail: {
        type: "error",
        title: "Authentication Failed",
        message: "JWT is expired",
        autoClose: false,
        action: {
          type: "copy",
          label: "Copy",
          successLabel: "Copied",
          failureLabel: "Copy failed",
          value: "header.payload.signature",
        },
      },
    }));
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).not.toContain("header.payload.signature");
    const copyButton = wrapper.findAll("button").find((button) => button.text() === "Copy");
    await copyButton.trigger("click");
    await Promise.resolve();
    await wrapper.vm.$nextTick();

    expect(writeText).toHaveBeenCalledWith("header.payload.signature");
    expect(wrapper.text()).toContain("Copied");
  });

  it("reports clipboard failures accessibly", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    const wrapper = mountToastHost();

    document.dispatchEvent(new CustomEvent(toastEventName, {
      detail: {
        message: "JWT is invalid",
        autoClose: false,
        action: { type: "copy", label: "Copy", failureLabel: "Copy failed", value: "secret" },
      },
    }));
    await wrapper.vm.$nextTick();
    const copyButton = wrapper.findAll("button").find((button) => button.text() === "Copy");
    await copyButton.trigger("click");
    await Promise.resolve();
    await wrapper.vm.$nextTick();

    expect(wrapper.text()).toContain("Copy failed");
    expect(wrapper.get("[aria-live='polite']").text()).toBe("Copy failed");
  });

  it("does not render a Copy button without a copy action", async () => {
    const wrapper = mountToastHost();
    document.dispatchEvent(new CustomEvent(toastEventName, {
      detail: { message: "Authorization header must be a Bearer token.", autoClose: false },
    }));
    await wrapper.vm.$nextTick();

    expect(wrapper.findAll("button").some((button) => button.text() === "Copy")).toBe(false);
  });
});
