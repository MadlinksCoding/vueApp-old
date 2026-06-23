import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it } from "vitest";
import EventsWidget from "@/components/calendar/EventsWidget.vue";

let wrapper;

afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
});

describe("EventsWidget", () => {
  it("opens event details when the reply button is clicked", async () => {
    const item = {
      title: "Pending booking",
      time: "10:00 AM",
      statusText: "Pending",
      showReply: true,
      avatars: [{ src: "/avatar.png", name: "Fan" }],
      titleColorClass: "text-gray-900",
      borderClass: "bg-gray-300",
      bgClass: "bg-white",
    };

    wrapper = mount(EventsWidget, {
      props: {
        sections: [{ title: "PENDING EVENTS", items: [item] }],
      },
    });

    const replyButton = wrapper
      .findAll("button")
      .find((button) => button.text() === "REPLY");

    expect(replyButton).toBeTruthy();

    await replyButton.trigger("click");

    expect(wrapper.emitted("event-click")).toEqual([[item]]);
    expect(wrapper.emitted("reply-click")).toBeUndefined();
  });

  it("shows disabled join calls until the join window opens", async () => {
    const joinAvailableLabel = new Date("2026-05-01T09:55:00.000Z").toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    const item = {
      title: "Upcoming booking",
      time: "10:00 AM",
      statusText: "confirmed",
      showJoin: true,
      canJoin: false,
      joinUrl: "https://example.com/join",
      joinAvailableAtIso: "2026-05-01T09:55:00.000Z",
      avatars: [{ src: "/avatar.png", name: "Fan" }],
      titleColorClass: "text-gray-900",
      borderClass: "bg-gray-300",
      bgClass: "bg-white",
    };

    wrapper = mount(EventsWidget, {
      props: {
        sections: [{ title: "TODAY", items: [item] }],
      },
    });

    const joinButton = wrapper
      .findAll("button")
      .find((button) => button.text().toLowerCase() === "join call");

    expect(joinButton).toBeTruthy();
    expect(joinButton.attributes("disabled")).toBeDefined();
    expect(joinButton.classes()).toContain("bg-[#D0D5DD]");
    expect(joinButton.classes()).not.toContain("opacity-80");
    expect(wrapper.find("[data-test='disabled-join-tooltip']").exists()).toBe(false);

    await wrapper.get("[data-test='join-tooltip-trigger']").trigger("mouseenter");

    expect(wrapper.get("[data-test='disabled-join-tooltip']").text())
      .toBe(`This call can be joined at ${joinAvailableLabel}`);

    await wrapper.get("[data-test='join-tooltip-trigger']").trigger("mouseleave");
    expect(wrapper.find("[data-test='disabled-join-tooltip']").exists()).toBe(false);

    await wrapper.get("[data-test='join-tooltip-trigger']").trigger("touchstart");
    expect(wrapper.get("[data-test='disabled-join-tooltip']").text())
      .toBe(`This call can be joined at ${joinAvailableLabel}`);

    await joinButton.trigger("click");

    expect(wrapper.emitted("join-click")).toBeUndefined();
  });

  it("emits join calls when the join window is open", async () => {
    const item = {
      title: "Live booking",
      time: "10:00 AM",
      statusText: "confirmed",
      showJoin: true,
      canJoin: true,
      joinUrl: "https://example.com/join",
      avatars: [{ src: "/avatar.png", name: "Fan" }],
      titleColorClass: "text-gray-900",
      borderClass: "bg-gray-300",
      bgClass: "bg-white",
    };

    wrapper = mount(EventsWidget, {
      props: {
        sections: [{ title: "TODAY", items: [item] }],
      },
    });

    const joinButton = wrapper
      .findAll("button")
      .find((button) => button.text().toLowerCase() === "join call");

    expect(joinButton).toBeTruthy();
    expect(joinButton.attributes("disabled")).toBeUndefined();

    await joinButton.trigger("click");

    expect(wrapper.emitted("join-click")).toEqual([[item]]);
  });

  it("uses the status color for the urgent join status dot and text", () => {
    const item = {
      title: "Starting soon",
      time: "10:00 AM",
      statusText: "in 4 mins",
      statusColor: "#28C76F",
      showJoin: true,
      canJoin: true,
      joinUrl: "https://example.com/join",
      avatars: [{ src: "/avatar.png", name: "Fan" }],
      titleColorClass: "text-gray-900",
      borderClass: "bg-gray-300",
      bgClass: "bg-white",
    };

    wrapper = mount(EventsWidget, {
      props: {
        sections: [{ title: "TODAY", items: [item] }],
      },
    });

    expect(wrapper.get("[data-test='join-status-dot']").element.style.backgroundColor)
      .toBe("rgb(40, 199, 111)");
    expect(wrapper.get("[data-test='join-status-text']").element.style.color)
      .toBe("rgb(40, 199, 111)");
    expect(wrapper.get("[data-test='join-status-text']").text()).toBe("in 4 mins");
  });

  it("uses popup green for confirmed and live status dots", () => {
    const items = [
      {
        title: "Confirmed booking",
        time: "10:00 AM",
        statusText: "confirmed",
        showJoin: true,
        canJoin: false,
        joinUrl: "https://example.com/join",
        avatars: [{ src: "/avatar.png", name: "Fan" }],
        titleColorClass: "text-gray-900",
        borderClass: "bg-gray-300",
        bgClass: "bg-white",
      },
      {
        title: "Live booking",
        time: "10:00 AM",
        statusText: "live now",
        showJoin: true,
        canJoin: true,
        joinUrl: "https://example.com/join",
        avatars: [{ src: "/avatar.png", name: "Fan" }],
        titleColorClass: "text-gray-900",
        borderClass: "bg-gray-300",
        bgClass: "bg-white",
      },
    ];

    wrapper = mount(EventsWidget, {
      props: {
        sections: [{ title: "TODAY", items }],
      },
    });

    const dotColors = wrapper
      .findAll("[data-test='join-status-dot']")
      .map((dot) => dot.element.style.backgroundColor);

    expect(dotColors).toEqual(["rgb(34, 197, 94)", "rgb(34, 197, 94)"]);
  });
});
