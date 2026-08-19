import fs from "node:fs";
import path from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const source = fs.readFileSync(path.resolve(
  process.cwd(),
  "../wp/wp-content/plugins/fansocial/assets/js/toasts.js",
), "utf8");

describe("WordPress toast compatibility", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    delete window.showToast;
    delete window.toasts;
    window.eval(source);
  });

  function finishOpening(toast) {
    toast.dispatchEvent(new Event("transitionend"));
    expect(toast.dataset.transitionState).toBe("complete");
  }

  it("supports a persistent avatar toast whose Detail callback does not dismiss it", () => {
    const onLinkClick = vi.fn();
    window.showToast("Confirmed", "success", -1, {
      new_dashboard: true,
      title: "Session confirmed",
      show_close: true,
      icon_url: "https://fansocial.local/avatar.jpg",
      icon_alt: "",
      small_icon_name: "check",
      link: "#booking-details-booking-1",
      linkText: "Detail",
      closeOnLinkClick: false,
      onLinkClick,
    });

    const toast = document.querySelector("[data-toast-notification]");
    finishOpening(toast);
    expect(toast.querySelector("[data-notification-avatar]").src).toBe("https://fansocial.local/avatar.jpg");

    toast.querySelector("[data-link]").click();
    expect(onLinkClick).toHaveBeenCalledTimes(1);
    expect(toast.dataset.transitionState).toBe("complete");

    toast.querySelector("[data-toast-notification-close]").click();
    expect(toast.dataset.transitionState).toBe("close");
  });

  it("preserves the existing dismiss-on-link behavior by default", () => {
    window.showToast("Existing toast", "success", -1, {
      new_dashboard: true,
      title: "Existing",
      link: "/dashboard/events",
    });

    const toast = document.querySelector("[data-toast-notification]");
    finishOpening(toast);
    toast.querySelector("[data-notification-text]").click();
    expect(toast.dataset.transitionState).toBe("close");
  });
});
