import { fileURLToPath, URL } from "node:url";

import { defineConfig, loadEnv } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import fs from "fs-extra";
import { join } from "path";

const FAN_SOCIAL_PLUGIN_BASE = "/wp-content/plugins/fansocial/";
const FAN_SOCIAL_BOOKING_ASSETS_DIR = "assets/booking";

async function generateManifest() {
  const outputDir = join(__dirname, "dist", FAN_SOCIAL_BOOKING_ASSETS_DIR);
  const distDir = join(__dirname, "dist");
  const bundles = {};

  await fs.ensureDir(distDir);

  if (!(await fs.exists(outputDir))) {
    console.log(
      "[MANIFEST_SKIP] Assets directory not found, creating empty manifest."
    );
    await fs.writeJson(join(distDir, "section-bundles.json"), bundles);
    return;
  }

  const files = await fs.readdir(outputDir);
  files.forEach((file) => {
    if (!file.endsWith(".js")) return;
    const publicPath = `${FAN_SOCIAL_PLUGIN_BASE}${FAN_SOCIAL_BOOKING_ASSETS_DIR}/${file}`;
    if (file.startsWith("section-auth")) bundles["auth"] = publicPath;
    if (file.startsWith("section-dashboard"))
      bundles["dashboard"] = publicPath;
    if (file.startsWith("section-profile"))
      bundles["profile"] = publicPath;
    if (file.startsWith("section-discover"))
      bundles["discover"] = publicPath;
    if (file.startsWith("section-shop")) bundles["shop"] = publicPath;
    if (file.startsWith("section-misc")) bundles["misc"] = publicPath;
  });

  await fs.writeJson(join(distDir, "section-bundles.json"), bundles);
  console.log(
    "[MANIFEST_GENERATED] section-bundles.json created successfully."
  );
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const PROXY_TARGETS = {
    staging: 'https://new-stage.fansocial.app',
    local:   'https://localhost:8443',
  };
  const proxyTarget = PROXY_TARGETS[env.PROXY_MODE] ?? PROXY_TARGETS.staging;
  const explicitBase = typeof env.VITE_PUBLIC_BASE === "string" ? env.VITE_PUBLIC_BASE.trim() : "";
  const isVercelBuild = env.VERCEL === "1" || process.env.VERCEL === "1";
  const base = command === "serve"
    ? "/"
    : (explicitBase || (isVercelBuild ? "/" : FAN_SOCIAL_PLUGIN_BASE));
  return {
    base,
    plugins: [vue(), vueDevTools()],
    define: {
      global: "globalThis",
    },
    server: {
      proxy: {
        "/wp-admin": { target: proxyTarget, changeOrigin: true, secure: false },
        "/wp-json":  { target: proxyTarget, changeOrigin: true, secure: false },
      },
    },
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
        buffer: "buffer",
      },
    },
    publicDir: "public",
    test: {
      environment: "jsdom",
      globals: true,
    },
    build: {
      sourcemap: true,
      cssCodeSplit: true,
      assetsInlineLimit: 0,
      rollupOptions: {
        input: {
          main: join(__dirname, "index.html"),
          eventsEmbed: join(__dirname, "bookings-embed/dashboard.html"),
          bookingsEmbed: join(__dirname, "bookings-embed/fan-booking.html"),
          chatEmbed: join(__dirname, "bookings-embed/chat.html"),  // vueApp/bookings-embed/chat.html
        },
        external: (id) => id.includes('__tests__') || id.includes('.spec.'),
        output: {
          manualChunks(id) {
            if (
              id.includes("/src/embeds/fanBooking/") ||
              id.includes("/src/components/FanBookingFlow/OneOnOneBookingFlow/")
            ) {
              return "embed-fan-booking";
            }
            if (
              id.includes("/src/components/FanBookingFlow/HelperComponents/TopUpForm.vue") ||
              id.includes("/src/components/FanBookingFlow/HelperComponents/CardForm.vue") ||
              id.includes("/src/components/FanBookingFlow/HelperComponents/GuestCheckoutForm.vue") ||
              id.includes("/src/utils/axcessGatewayFormHandler.js") ||
              id.includes("/src/assets/css/axcessGatewayForm.css")
            ) {
              return "embed-fan-booking-payment";
            }
            if (
              id.includes("/src/services/bookings/") ||
              id.includes("/src/utils/flowStateEngine.js") ||
              id.includes("/src/utils/contextIds.js") ||
              id.includes("/src/utils/TokenHandler.js") ||
              id.includes("/src/utils/backendJwt.js") ||
              id.includes("/src/utils/bookingScheduleNotify.js") ||
              id.includes("/src/utils/resolveGuestSessionId") ||
              id.includes("/src/composables/useChatSocket")
            ) {
              return "embed-fan-booking-core";
            }
            // Bundle components by section
            if (
              id.includes("/components/auth/") ||
              id.includes("/components/layout/auth/") ||
              id.includes("/templates/auth/")
            ) {
              return "section-auth";
            }
            if (
              id.includes("/components/about/") ||
              id.includes("/components/layout/about/") ||
              id.includes("/templates/about/")
            ) {
              return "section-about";
            }
            if (
              id.includes("/components/contact/") ||
              id.includes("/components/layout/contact/") ||
              id.includes("/templates/contact/")
            ) {
              return "section-contact";
            }
            if (
              id.includes("/components/dashboard/") ||
              id.includes("/components/layout/dashboard/") ||
              id.includes("/templates/dashboard/")
            ) {
              return "section-dashboard";
            }
            if (
              id.includes("/components/profile/") ||
              id.includes("/components/layout/profile/") ||
              id.includes("/templates/profile/")
            ) {

              return "section-profile";
            }
            if (
              id.includes("/components/discover/") ||
              id.includes("/components/layout/discover/") ||
              id.includes("/templates/discover/")
            ) {
              return "section-discover";
            }
            if (
              id.includes("/components/shop/") ||            // legacy / flat shop comps
              id.includes("/components/layout/shop/") ||     // your current layout path
              id.includes("/templates/shop/")                // your ShopWrapper.vue, etc.
            ) {
              return "section-shop";
            }
            if (id.includes("/components/NotFound.vue") || id.includes("/templates/misc/")) return "section-misc";

            // Bundle i18n core (without locales) - much smaller now
            if (
              id.includes("/i18n/index.js") ||
              id.includes("/i18n/lazyLoader.js")
            ) {
              return "i18n-core";
            }

            // Force separate bundles for locale modules
            if (id.includes("/i18n/locales/en.js")) {
              return "locale-en";
            }
            if (id.includes("/i18n/locales/vi.js")) {
              return "locale-vi";
            }

            // Force separate bundles for locale JSON data
            if (id.includes("/i18n/locales/en.json")) {
              return "locale-en-data";
            }
            if (id.includes("/i18n/locales/vi.json")) {
              return "locale-vi-data";
            }

            // Bundle translation utils
            if (id.includes("/utils/translationUtils.js"))
              return "translation-utils";
          },
          chunkFileNames: `${FAN_SOCIAL_BOOKING_ASSETS_DIR}/[name]-[hash].js`,
          entryFileNames: `${FAN_SOCIAL_BOOKING_ASSETS_DIR}/[name]-[hash].js`,
          assetFileNames: `${FAN_SOCIAL_BOOKING_ASSETS_DIR}/[name]-[hash][extname]`,
        },
        plugins: [
          {
            name: "generate-manifest",
            async closeBundle() {
              await generateManifest();
            },
          },
        ],
      },
    },
  };
});
