import { mount } from "@vue/test-utils";
import { describe, expect, it, vi } from "vitest";
import CustomDropdown from "@/components/ui/dropdown/CustomDropdown.vue";

describe("CustomDropdown", () => {
  const options = [
    { value: "09:00", label: "9:00 AM" },
    { value: "09:05", label: "9:05 AM" },
    { value: "09:10", label: "9:10 AM" },
    { value: "13:00", label: "1:00 PM" },
  ];

  it("filters searchable options by label and value", async () => {
    const wrapper = mount(CustomDropdown, {
      props: {
        modelValue: null,
        options,
        searchable: true,
        searchPlaceholder: "Search time",
      },
    });

    await wrapper.find(".cursor-pointer").trigger("click");

    const search = wrapper.find('input[type="search"]');
    expect(search.exists()).toBe(true);
    expect(search.attributes("placeholder")).toBe("Search time");

    await search.setValue("9:05");
    expect(wrapper.text()).toContain("9:05 AM");
    expect(wrapper.text()).not.toContain("9:10 AM");

    await search.setValue("13:00");
    expect(wrapper.text()).toContain("1:00 PM");
    expect(wrapper.text()).not.toContain("9:05 AM");

    await search.setValue("pm");
    expect(wrapper.text()).toContain("1:00 PM");
    expect(wrapper.text()).not.toContain("9:00 AM");

    await search.setValue("missing");
    expect(wrapper.text()).toContain("No options found");
  });

  it("does not select disabled options", async () => {
    const wrapper = mount(CustomDropdown, {
      props: {
        modelValue: "09:00",
        options: [
          options[0],
          { ...options[1], disabled: true, disabledReason: "Unavailable" },
          options[2],
        ],
      },
    });

    await wrapper.find(".cursor-pointer").trigger("click");

    const disabledOption = wrapper.find('[aria-disabled="true"]');
    expect(disabledOption.exists()).toBe(true);
    expect(disabledOption.classes()).toContain("cursor-not-allowed");

    await disabledOption.trigger("click");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("defers generated options until the dropdown opens", async () => {
    const optionFactory = vi.fn(() => [
      options[0],
      { ...options[1], disabled: true, disabledReason: "Unavailable" },
      options[2],
    ]);

    const wrapper = mount(CustomDropdown, {
      props: {
        modelValue: "09:00",
        options,
        optionFactory,
      },
    });

    expect(optionFactory).not.toHaveBeenCalled();

    await wrapper.find(".cursor-pointer").trigger("click");

    expect(optionFactory).toHaveBeenCalled();
    expect(wrapper.find('[aria-disabled="true"]').exists()).toBe(true);
  });
});
