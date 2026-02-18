import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import App from "./App.vue";
import './assets/main.css'
import router from "./router";
import { enterpriseI18n } from "./i18n/enterprise/i18n";
import { useEnterpriseI18nStore } from "./stores/enterpriseI18n";
import { useAuthStore } from "@/stores/useAuthStore";
import { authHandler } from "@/services/authHandler";
import { useSectionsStore } from "./stores/sectionStore";
import { createCacheJanitor } from "./plugins/cacheJanitor";
import { Splide, SplideSlide } from '@splidejs/vue-splide';
import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-zoom.css';
import 'lightgallery/css/lg-thumbnail.css';
import '@splidejs/splide/css';

async function initializeApp() {
  const app = createApp(App);

  const pinia = createPinia();
  pinia.use(piniaPluginPersistedstate);
  app.use(pinia);

// Initialize enterprise i18n system
  await enterpriseI18n.initialize();

  // Existing auth initialization
  const auth = useAuthStore();
  const sectionsStore = useSectionsStore();
    const i18nStore = useEnterpriseI18nStore();

  auth.refreshFromStorage();
  sectionsStore.hydrate();

  // Wait for router to be ready before restoring session
  router.isReady().then(() => {
    const publicRoutes = [
      "/log-in",
      "/sign-up",
      "/sign-up/onboarding",
      "/sign-up/onboarding/kyc",
      "/lost-password",
      "/reset-password",
      "/confirm-email",
      "/",
      "/dashboard",
      "/dashboard/overview",
      "/dev",
      "/dashboard/referralsContentFan",
      "/dashboard/analytics",
      "/dashboard/payout",
      "/dashboard/orders/order-received",
      "/dashboard/orders/item-purchased",
      "/dashboard/my-media",
      "/dashboard/subscriptions",
      "/dashboard/edit-profile",
      "/dashboard/referrals",
      "/dashboard/settings",
    ];

    const isPublic = publicRoutes.includes(router.currentRoute.value.path);
    const isSimulated = !!auth.simulate;

    if (!isPublic && !isSimulated) {
      authHandler
        .restoreSession()
        .then(({ idToken, accessToken, refreshToken }) => {
          console.log("[MAIN] Session restored, setting token");
          localStorage.setItem("idToken", idToken);
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken);
          auth.setTokenAndDecode(idToken);
          auth.startTokenRefreshLoop();
        })
        .catch((err) => {
          console.log("[MAIN] Session restoration failed:", err.message || err);
          auth.logout();
          if (!isPublic) {
            router.push("/log-in");
          }
        });
    } else {
      console.log(
        "[MAIN] Skipping session restoration because",
        isSimulated ? "simulate mode active" : "public route",
        router.currentRoute.value.path
      );
    }
  });

  app.use(router);
    app.use(enterpriseI18n.vueI18nInstance);

  // Setup Cache Janitor (cleanup every 30 seconds)
  app.use(createCacheJanitor(30_000))
  app.component('Splide', Splide);
app.component('SplideSlide', SplideSlide);
  app.mount("#app");

}

// Initialize the app
initializeApp().catch(console.error);