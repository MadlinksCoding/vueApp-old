import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";

describe("TooltipIcon", () => {
  it("scopes hover visibility to its own named group", async () => {
    const { default: TooltipIcon } = await import("@/components/ui/tooltip/TooltipIcon.vue");

    const wrapper = mount(TooltipIcon, {
      props: {
        text: "Scoped tooltip",
        wrapperClass: "custom-wrapper",
        tooltipClass: "custom-tooltip",
      },
      slots: {
        default: "<button type='button'>Hover me</button>",
      },
    });

    const divs = wrapper.findAll("div");
    const root = divs[0];
    const tooltip = divs[1];

    expect(root.classes()).toContain("group/tooltip");
    expect(root.classes()).not.toContain("group");
    expect(root.classes()).toContain("custom-wrapper");
    expect(tooltip.classes()).toContain("group-hover/tooltip:opacity-100");
    expect(tooltip.classes()).not.toContain("group-hover:opacity-100");
    expect(tooltip.classes()).toContain("custom-tooltip");
    expect(tooltip.text()).toBe("Scoped tooltip");
  });
});
