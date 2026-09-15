import { createApp, h } from "vue";
import BookingNoticeLab from "./BookingNoticeLab.vue";
import { isBookingNoticeLabHost } from "./noticeLabData";
import "@/assets/main.css";

const allowed = isBookingNoticeLabHost(window.location.hostname);
const root = allowed
  ? BookingNoticeLab
  : {
    render: () => h("main", { class: "notice-lab-blocked" }, [
      h("h1", "Booking Notice Test Lab is unavailable"),
      h("p", "This testing page can only run on the approved local development hosts."),
    ]),
  };

createApp(root).mount("#booking-notices-lab");
