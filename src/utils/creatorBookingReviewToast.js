import { showToast } from "@/utils/toastBus.js";
import { escapeToastHtml, wordpressToastHost } from "@/utils/wordpressToastHost.js";

function normalizedUsername(value, fallback = "fan") {
  return String(value || fallback).trim().replace(/^@+/, "") || fallback;
}

export function showCreatorBookingReviewToast({ decision, username, avatarUrl, t } = {}) {
  const status = decision === "reject" ? "declined" : "confirmed";
  const fan = normalizedUsername(username, typeof t === "function" ? t("common_fan") : "fan");
  const key = status === "confirmed"
    ? "creator_booking_review_confirmed_toast"
    : "creator_booking_review_declined_toast";
  const fallback = status === "confirmed"
    ? `Your event with @${fan} has been confirmed.`
    : `You have declined booking request from @${fan}.`;
  const title = typeof t === "function" ? t(key, { fan }) : fallback;
  const host = wordpressToastHost();

  if (host) {
    host.showToast("", status === "confirmed" ? "success" : "destructive", -1, {
      position: "top-center",
      offsetY: 8,
      width: 600,
      clear_all: false,
      new_dashboard: true,
      type: status === "confirmed" ? "success" : "destructive",
      wrapper_class: "bb br--col--athens-gray2",
      theme: "light",
      show_close: true,
      close_label: typeof t === "function" ? t("fan_booking_toast_close") : "Close notification",
      title: escapeToastHtml(title),
      title_class: "fs--16 fw6 lh--24",
      icon_url: String(avatarUrl || ""),
      icon_name: avatarUrl ? "" : "profile",
      icon_alt: fan,
      icon_class: "w--40 h--40 br--20 object-fit-cover",
      icon_wrapper_class: "flex justify-center items-center w--40 h--40 br--20 relative",
      small_icon_name: status === "confirmed" ? "tick-rounded-Icon" : "cross",
      small_icon_class: "w--16 h--16",
      small_icon_wrapper_class: "flex justify-center items-center w--22 h--22 br--11 absolute bottom-0 right-0",
      show_cta: false,
      link: "",
    });
    return;
  }

  showToast({
    variant: "booking-review",
    type: status === "confirmed" ? "success" : "error",
    status,
    title,
    message: "",
    avatarUrl: String(avatarUrl || ""),
    avatarAlt: fan,
    closeLabel: typeof t === "function" ? t("fan_booking_toast_close") : "Close notification",
    persistent: true,
    dedupeKey: `creator-booking-review-${status}`,
  });
}
