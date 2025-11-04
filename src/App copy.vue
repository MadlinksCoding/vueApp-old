<script setup>
// 🧩 Import necessary modules and functions
import { useAuthStore } from "@/stores/useAuthStore";
import LocaleSwitcher from "@/components/LocaleSwitcher.vue";
import routesConfig from "@/router/routeConfig.json";
import { onMounted, ref } from "vue";
import { 
  assetsConfigReady, 
  getAsset, 
  clearAssetCache,  
  debugAssets
} from "@/utils/assetLibraryHandler";

// 🧠 Initialize auth store and reactive test array
const auth = useAuthStore();
const assetTests = ref([]); // holds the result of each asset test

// 🚀 Runs when the component is mounted
onMounted(() => {
  console.log("=== ASSETS TEST START ===");

  // 🧹 Clear previous cache to force fresh asset load
  clearAssetCache();

  // ✅ Check if assets configuration is ready
  console.log("[TEST] assetsConfigReady:", assetsConfigReady());

  // 🧪 Define list of test assets
  const testCases = [
    { name: "logo", type: "icon" },
    { name: "test-image", type: "icon" },
    { name: "test-larger-image", type: "icon" },
    { name: "test-style", type: "link" }
  ];

  // 🔍 Loop through each test asset and get its resolved path
  testCases.forEach(test => {
    const result = getAsset(test.name, test.type); // resolve asset URL

    // Push result into the reactive array
    assetTests.value.push({
      name: test.name,
      type: test.type,
      result: result,
      success: !!result
    });

    // Log the result for debugging
    console.log(`[TEST] getAsset('${test.name}','${test.type}'):`, result);
  });

  // 🧩 Show detailed debug info for assets
  debugAssets();

  console.log("=== ASSETS TEST END ===");

  // ⚙️ Test DependencyGate (optional)
  if (window.createDependencyGate) {
    window.createDependencyGate({
      // Target container element
      el: document.getElementById("my-gate"),
      config: {
        // Wait for assets and API to be ready
        waitFor: ["assets", "apiLoaded"],

        // Asset dependencies to preload
        assets: {
          flag: "test",
          items: [
            { name: "test-style", url: "/css/test-style.css", type: "css", priority: "critical" },
            { name: "test-image", url: "/images/test-image.jpg", type: "image" },
            { name: "test-larger-size-image", url: "/images/larger-size-image.jpg", type: "image" },
          ],
        },

        // Simulate waiting for an API-ready event
        apiLoaded: { event: "api-ready", timeoutMs: 3000 },
      },

      // ✅ What to render when everything is ready
      renderWhenReady: () => window.Vue.h("div", "✅ All dependencies ready!"),
    });
  } else {
    // 🚨 If DependencyGate is missing, log a warning
    console.warn("❌ DependencyGate not found on window");
  }
});
</script>

<template>
  <!-- 🧭 Main app content rendered via router -->
  <router-view />

  <!-- 🔒 Container where DependencyGate mounts -->
  <!-- <div id="my-gate" style="margin-top: 1rem;"></div> -->
</template>

<style scoped>
/* 🎨 Simple navigation layout */
nav {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}

/* 💡 Hover effect for buttons */
button:hover {
  background-color: #0056b3;
}
</style>
