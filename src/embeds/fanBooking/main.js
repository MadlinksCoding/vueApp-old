import { createApp } from "vue";
import { createPinia } from "pinia";
import FanBookingEmbedApp from "@/embeds/fanBooking/FanBookingEmbedApp.vue";
import "@/assets/main.css";

const app = createApp(FanBookingEmbedApp);

app.use(createPinia());
app.mount("#fan-booking-embed-app");
