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

  it("hides the disabled color picker and emits only visibility filters", async () => {
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

    await wrapper.findAll("input[type='checkbox']")[0].setValue(false);

    expect(wrapper.emitted("update:modelValue")).toEqual([
      [{
        video: false,
        audio: true,
        groupCall: true,
        showSchedule: true,
      }],
    ]);
  });
});
