import { mount } from "@vue/test-utils";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import EventDropdownContent from "@/components/calendar/EventDropdownContent.vue";

describe("EventDropdownContent", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it("hides the disabled color picker and preserves every visibility filter", async () => {
    window.localStorage.setItem("calendar:eventTypeColors", JSON.stringify({
      video: "#FF3B30",
      audio: "#28C76F",
      groupCall: "#E11D48",
    }));

    const wrapper = mount(EventDropdownContent, {
      props: {
        modelValue: {
          video: true,
          audio: true,
          groupCall: true,
          showSchedule: true,
          colorByType: {
            video: "#FF3B30",
            audio: "#28C76F",
            groupCall: "#E11D48",
          },
        },
      },
    });

    expect(wrapper.find("button").exists()).toBe(false);
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();

    expect(wrapper.get("[data-test='show-completed-filter']").text()).toContain("Show completed events");
    expect(wrapper.get("[data-test='show-analytics-filter']").text()).toContain("Show earning analytics");
    expect(wrapper.get("[data-test='show-completed-filter'] img").exists()).toBe(true);
    expect(wrapper.get("[data-test='show-analytics-filter'] img").exists()).toBe(true);
    expect(wrapper.get("[data-test='show-completed-filter'] input").element.checked).toBe(false);
    expect(wrapper.get("[data-test='show-analytics-filter'] input").element.checked).toBe(false);
    expect(wrapper.get("[data-test='show-analytics-filter'] input").element.disabled).toBe(true);

    await wrapper.findAll("input[type='checkbox']")[0].setValue(false);

    expect(wrapper.emitted("update:modelValue")).toEqual([
      [{
        video: false,
        audio: true,
        groupCall: true,
        showSchedule: true,
        showCompleted: false,
        showAnalytics: false,
      }],
    ]);

    await wrapper.get("[data-test='show-completed-filter'] input").setValue(true);

    expect(wrapper.emitted("update:modelValue").at(-1)).toEqual([{
      video: true,
      audio: true,
      groupCall: true,
      showSchedule: true,
      showCompleted: true,
      showAnalytics: false,
    }]);

    await wrapper.get("[data-test='show-analytics-filter'] input").setValue(true);
    expect(wrapper.emitted("update:modelValue")).toHaveLength(2);
  });
});
