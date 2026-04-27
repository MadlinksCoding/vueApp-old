import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import BookingSectionsWrapper from "@/components/ui/form/BookingForm/HelperComponents/BookingSectionsWrapper.vue";

describe("BookingSectionsWrapper", () => {
  it("is visible by default", () => {
    const wrapper = mount(BookingSectionsWrapper, {
      props: {
        title: "Booking Section",
      },
      slots: {
        default: "<div data-test='section-body'>Body content</div>",
      },
      global: {
        stubs: {
          TooltipIcon: true,
        },
      },
    });

    expect(wrapper.isVisible()).toBe(true);
    expect(wrapper.find("[data-test='section-body']").exists()).toBe(true);
  });

  it("appends classnames to the root wrapper", () => {
    const wrapper = mount(BookingSectionsWrapper, {
      props: {
        title: "Booking Section",
        classnames: "mt-4 border",
      },
      global: {
        stubs: {
          TooltipIcon: true,
        },
      },
    });

    expect(wrapper.classes()).toEqual(expect.arrayContaining([
      "flex",
      "gap-4",
      "relative",
      "mt-4",
      "border",
    ]));
  });

  it("hides the root wrapper when visible is false while preserving classnames", () => {
    const wrapper = mount(BookingSectionsWrapper, {
      props: {
        title: "Booking Section",
        classnames: "mt-4 border",
        visible: false,
      },
      slots: {
        default: "<div data-test='section-body'>Body content</div>",
      },
      global: {
        stubs: {
          TooltipIcon: true,
        },
      },
    });

    expect(wrapper.isVisible()).toBe(false);
    expect(wrapper.attributes("style") || "").toContain("display: none");
    expect(wrapper.find("[data-test='section-body']").exists()).toBe(true);
    expect(wrapper.classes()).toEqual(expect.arrayContaining([
      "flex",
      "gap-4",
      "relative",
      "mt-4",
      "border",
    ]));
  });
});
