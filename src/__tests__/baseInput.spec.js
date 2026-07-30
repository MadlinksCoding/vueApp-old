import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import BaseInput from "@/components/dev/input/BaseInput.vue";

describe("BaseInput", () => {
  it("forwards the numeric minimum and does not step below it", async () => {
    const wrapper = mount(BaseInput, {
      props: {
        type: "number",
        modelValue: 10,
        min: 10,
      },
    });

    expect(wrapper.get("input").attributes("min")).toBe("10");

    await wrapper.findAll("button")[1].trigger("click");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("raises an invalid value to the minimum before incrementing normally", async () => {
    const wrapper = mount(BaseInput, {
      props: {
        type: "number",
        modelValue: 2,
        min: 5,
      },
    });

    await wrapper.findAll("button")[0].trigger("click");
    expect(wrapper.emitted("update:modelValue")).toEqual([[5]]);
  });
});
