import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const overlaySource = readFileSync(
  path.resolve(process.cwd(), "../wp/wp-content/calls/scheduled-call-overlay.js"),
  "utf8",
);

function postFromFrame(handle, type, payload = {}) {
  window.dispatchEvent(new MessageEvent("message", {
    source: handle.iframe.contentWindow,
    origin: window.location.origin,
    data: { type, payload },
  }));
}

function finishTeardown(handle, reason = "test_teardown") {
  window.FSScheduledCallOverlay.close(reason);
  postFromFrame(handle, "FS_SCHEDULED_CALL_TEARDOWN_COMPLETE", { reason });
}

describe("FSScheduledCallOverlay", () => {
  beforeAll(() => {
    window.eval(overlaySource);
  });

  beforeEach(() => {
    vi.useFakeTimers();
    if (window.FSScheduledCallOverlay.isOpen()) {
      window.FSScheduledCallOverlay.close("test_reset");
      vi.advanceTimersByTime(1600);
    }
    document.body.innerHTML = "";
    document.body.className = "";
    document.body.style.overflow = "";
    window.showing_call_popup = false;
  });

  it("validates same-origin scheduled URLs, preserves their query, and inserts embed mode", () => {
    const resolved = window.FSScheduledCallOverlay.resolveUrl(
      "/scheduled-meeting/?booking_id=b_evt_123&source=calendar#details",
    );

    expect(resolved).not.toBeNull();
    expect(resolved.searchParams.get("booking_id")).toBe("b_evt_123");
    expect(resolved.searchParams.get("source")).toBe("calendar");
    expect(resolved.searchParams.get("embedded_call")).toBe("1");
    expect(resolved.hash).toBe("#details");
    expect(window.FSScheduledCallOverlay.resolveUrl("https://external.example/scheduled-meeting/?booking_id=b_1")).toBeNull();
    expect(window.FSScheduledCallOverlay.resolveUrl("/scheduled-meeting/?event_id=evt_1")).toBeNull();
    expect(window.FSScheduledCallOverlay.resolveUrl("/scheduled-meeting/?event_id=evt_1&start_iso=2026-07-28T12:00:00Z")).not.toBeNull();
    expect(window.FSScheduledCallOverlay.resolveUrl("/dashboard/?booking_id=b_1")).toBeNull();
  });

  it("keeps one overlay, rejects competing launches, and blocks launch during an instant call", () => {
    const first = window.FSScheduledCallOverlay.open("/scheduled-meeting/?booking_id=b_1");

    expect(window.FSScheduledCallOverlay.open("/scheduled-meeting/?booking_id=b_1")).toBe(first);
    expect(window.FSScheduledCallOverlay.open("/scheduled-meeting/?booking_id=b_2")).toBeNull();
    finishTeardown(first);

    window.showing_call_popup = true;
    expect(window.FSScheduledCallOverlay.open("/scheduled-meeting/?booking_id=b_3")).toBeNull();
    expect(window.FSScheduledCallOverlay.isOpen()).toBe(false);
  });

  it("locks and restores body scrolling and focus after acknowledged teardown", () => {
    const trigger = document.createElement("button");
    document.body.appendChild(trigger);
    document.body.style.overflow = "auto";
    trigger.focus();

    const handle = window.FSScheduledCallOverlay.open(
      "/scheduled-meeting/?booking_id=b_focus",
      { trigger },
    );

    expect(document.body.style.overflow).toBe("hidden");
    expect(document.body.classList.contains("fs-scheduled-call-overlay-open")).toBe(true);

    finishTeardown(handle);

    expect(document.body.style.overflow).toBe("auto");
    expect(document.body.classList.contains("fs-scheduled-call-overlay-open")).toBe(false);
    expect(document.activeElement).toBe(trigger);
  });

  it("only exposes host close before joining and removes ended calls on a frame request", () => {
    const handle = window.FSScheduledCallOverlay.open("/scheduled-meeting/?booking_id=b_state");
    const backButton = handle.overlay.querySelector(".fs-scheduled-call-overlay__back");
    const enteringCover = handle.overlay.querySelector(".fs-scheduled-call-overlay__loading");

    expect(enteringCover.textContent).toContain("Entering call");
    expect(enteringCover.textContent).toContain("Scheduled Meeting");
    expect(enteringCover.querySelector(".fs-scheduled-call-overlay__identity-loader").src)
      .toContain("/wp-content/plugins/fansocial/assets/img/green-loader1.svg");
    expect(enteringCover.querySelector(".fs-scheduled-call-overlay__avatar").src)
      .toContain("/wp-content/plugins/fansocial/assets/img/placeholder/placeholder-headshot-creator-trans-bg.png");
    expect(enteringCover.querySelector("svg")).toBeNull();
    expect(enteringCover.hidden).toBe(false);
    expect(handle.iframe.style.opacity).toBe("0");
    postFromFrame(handle, "FS_SCHEDULED_CALL_FRAME_READY");
    expect(backButton.hidden).toBe(false);
    expect(handle.getState()).toBe("loading");
    expect(enteringCover.hidden).toBe(false);

    postFromFrame(handle, "FS_SCHEDULED_CALL_STATE", { state: "joining" });
    expect(backButton.hidden).toBe(true);
    expect(enteringCover.hidden).toBe(true);
    expect(handle.iframe.style.opacity).toBe("1");
    expect(window.FSScheduledCallOverlay.close("not_allowed")).toBe(false);

    postFromFrame(handle, "FS_SCHEDULED_CALL_STATE", { state: "ended" });
    expect(window.FSScheduledCallOverlay.isOpen()).toBe(true);
    postFromFrame(handle, "FS_SCHEDULED_CALL_CLOSE_REQUEST", { reason: "call_ended" });
    expect(window.FSScheduledCallOverlay.isOpen()).toBe(false);
  });

  it("hydrates Entering metadata without accepting background imagery", () => {
    const handle = window.FSScheduledCallOverlay.open("/scheduled-meeting/?booking_id=b_presentation");
    const enteringCover = handle.overlay.querySelector(".fs-scheduled-call-overlay__loading");
    const avatar = enteringCover.querySelector(".fs-scheduled-call-overlay__avatar");
    const originalAvatar = avatar.src;

    expect(enteringCover.style.backgroundImage).toBe("");
    expect(enteringCover.style.backgroundColor).toBe("rgba(0, 0, 0, 0.75)");
    expect(enteringCover.style.backdropFilter).toBe("blur(12px)");

    postFromFrame(handle, "FS_SCHEDULED_CALL_PRESENTATION", {
      backgroundUrl: "https://media.example/event-background.jpg",
      avatarUrl: "/uploads/creator-avatar.jpg",
      eventTitle: "Creator Session",
      dateLabel: "Jul 29,",
      timeLabel: "9:50pm-10:00pm",
    });

    expect(enteringCover.style.backgroundImage).toBe("");
    expect(enteringCover.style.backgroundColor).toBe("rgba(0, 0, 0, 0.75)");
    expect(enteringCover.style.backdropFilter).toBe("blur(12px)");
    expect(avatar.src).toBe(`${window.location.origin}/uploads/creator-avatar.jpg`);
    expect(enteringCover.querySelector(".fs-scheduled-call-overlay__event-title").textContent).toBe("Creator Session");
    expect(enteringCover.querySelector(".fs-scheduled-call-overlay__event-date").textContent).toBe("Jul 29,");
    expect(enteringCover.querySelector(".fs-scheduled-call-overlay__event-time").textContent).toBe("9:50pm-10:00pm");

    postFromFrame(handle, "FS_SCHEDULED_CALL_PRESENTATION", {
      avatarUrl: "data:image/svg+xml,bad",
    });

    expect(enteringCover.style.backgroundImage).toBe("");
    expect(enteringCover.style.backgroundColor).toBe("rgba(0, 0, 0, 0.75)");
    expect(enteringCover.style.backdropFilter).toBe("blur(12px)");
    expect(avatar.src).not.toBe(originalAvatar);
    expect(avatar.src).toBe(`${window.location.origin}/uploads/creator-avatar.jpg`);

    avatar.dispatchEvent(new Event("error"));
    expect(avatar.src)
      .toContain("/wp-content/plugins/fansocial/assets/img/placeholder/placeholder-headshot-creator-trans-bg.png");
    finishTeardown(handle);
  });

  it("uses Back to dashboard to request acknowledged teardown", () => {
    const handle = window.FSScheduledCallOverlay.open("/scheduled-meeting/?booking_id=b_back");
    const backButton = handle.overlay.querySelector(".fs-scheduled-call-overlay__back");
    const postMessageSpy = vi.spyOn(handle.iframe.contentWindow, "postMessage");

    backButton.click();

    expect(handle.getState()).toBe("closing");
    expect(postMessageSpy).toHaveBeenCalledWith({
      type: "FS_SCHEDULED_CALL_TEARDOWN_REQUEST",
      payload: { reason: "back_to_dashboard" },
    }, window.location.origin);
    postFromFrame(handle, "FS_SCHEDULED_CALL_TEARDOWN_COMPLETE", {
      reason: "back_to_dashboard",
    });
    expect(window.FSScheduledCallOverlay.isOpen()).toBe(false);
  });

  it.each([
    ["normal click", "click", { button: 0 }],
    ["modified click", "click", { button: 0, ctrlKey: true, shiftKey: true }],
    ["keyboard activation", "click", { button: 0, detail: 0 }],
    ["middle click", "auxclick", { button: 1 }],
  ])("intercepts %s on dynamically inserted scheduled links", (_label, eventType, init) => {
    const anchor = document.createElement("a");
    anchor.href = "/scheduled-meeting/?booking_id=b_dynamic";
    document.body.appendChild(anchor);
    const event = new MouseEvent(eventType, {
      bubbles: true,
      cancelable: true,
      ...init,
    });

    anchor.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(window.FSScheduledCallOverlay.isOpen()).toBe(true);
    finishTeardown(window.FSScheduledCallOverlay.open(anchor.href));
  });

  it("leaves disabled reminder controls inactive", () => {
    const wrapper = document.createElement("div");
    wrapper.setAttribute("data-reminder-join-call", "");
    wrapper.setAttribute("data-join-call-enabled", "false");
    const anchor = document.createElement("a");
    anchor.href = "/scheduled-meeting/?booking_id=b_disabled";
    wrapper.appendChild(anchor);
    document.body.appendChild(wrapper);
    const event = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      button: 0,
    });

    anchor.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
    expect(window.FSScheduledCallOverlay.isOpen()).toBe(false);
  });
});
