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
});
