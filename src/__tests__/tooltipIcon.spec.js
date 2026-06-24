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

    // By default, the bottom position classes should be present
    expect(tooltip.classes()).toContain("left-auto");
    expect(tooltip.classes()).toContain("right-0");
    expect(tooltip.classes()).toContain("translate-x-[0%]");
    expect(tooltip.classes()).toContain("md:left-1/2");
    expect(tooltip.classes()).toContain("md:right-auto");
    expect(tooltip.classes()).toContain("md:-translate-x-1/2");
    expect(tooltip.classes()).toContain("mt-2");
  });

  it("applies correct placement classes based on the side prop", async () => {
    const { default: TooltipIcon } = await import("@/components/ui/tooltip/TooltipIcon.vue");

    // Side left
    const wrapperLeft = mount(TooltipIcon, {
      props: { text: "Left tooltip", side: "left" }
    });
    const tooltipLeft = wrapperLeft.findAll("div")[1];
    expect(tooltipLeft.classes()).toContain("right-full");
    expect(tooltipLeft.classes()).toContain("top-1/2");
    expect(tooltipLeft.classes()).toContain("-translate-y-1/2");
    expect(tooltipLeft.classes()).toContain("mr-2");

    // Side right
    const wrapperRight = mount(TooltipIcon, {
      props: { text: "Right tooltip", side: "right" }
    });
    const tooltipRight = wrapperRight.findAll("div")[1];
    expect(tooltipRight.classes()).toContain("left-full");
    expect(tooltipRight.classes()).toContain("top-1/2");
    expect(tooltipRight.classes()).toContain("-translate-y-1/2");
    expect(tooltipRight.classes()).toContain("ml-2");

    // Side top
    const wrapperTop = mount(TooltipIcon, {
      props: { text: "Top tooltip", side: "top" }
    });
    const tooltipTop = wrapperTop.findAll("div")[1];
    expect(tooltipTop.classes()).toContain("left-auto");
    expect(tooltipTop.classes()).toContain("right-0");
    expect(tooltipTop.classes()).toContain("translate-x-[0%]");
    expect(tooltipTop.classes()).toContain("md:left-1/2");
    expect(tooltipTop.classes()).toContain("md:right-auto");
    expect(tooltipTop.classes()).toContain("md:-translate-x-1/2");
    expect(tooltipTop.classes()).toContain("mb-2");
    expect(tooltipTop.classes()).toContain("bottom-full");
  });
});
