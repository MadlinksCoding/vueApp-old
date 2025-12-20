<script setup>
import { ref, onMounted,provide    } from "vue";
import routesConfig from "@/router/routeConfig.json";

const routes = ref([]);

// 🔽 GLOBAL THEME STATE
const theme = ref("light"); // "light" | "dark"


// 🔽 APPLY THEME TO <html>
const applyTheme = (value) => {
  const root = document.documentElement;

  if (value === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  localStorage.setItem("theme", value);
};

// 🔽 TOGGLE FUNCTION (SIDEBAR USE KAREGA)
const toggleTheme = () => {
  theme.value = theme.value === "dark" ? "light" : "dark";
  applyTheme(theme.value);
};

onMounted(() => {
  // Filter out redirect-only routes or undefined slugs
  routes.value = routesConfig.filter(
    (r) => r.slug && !r.redirect && r.enabled !== false
  );

    const savedTheme = localStorage.getItem("theme");
  theme.value = savedTheme === "dark" ? "dark" : "light";
  applyTheme(theme.value);
});

// 🔽 PROVIDE TO WHOLE APP
provide("theme", theme);
provide("toggleTheme", toggleTheme);
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Main content -->
    <main class="flex-1">
      <router-view />
    </main>

    <!-- Footer with routes -->
    <!-- <footer class="bg-gray-900 text-gray-300 text-sm py-8 mt-8 border-t border-gray-700">
      <div class="container mx-auto px-4">
        <h2 class="text-gray-100 text-lg font-semibold mb-4">📄 All Routes</h2>

        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          <div
            v-for="route in routes"
            :key="route.slug"
            class="truncate hover:text-white transition"
          >
            <router-link
              :to="route.slug"
              class="hover:underline"
            >
              {{ route.slug }}
            </router-link>
          </div>
        </div>
      </div>
    </footer> -->
  </div>
</template>

<style scoped>
footer {
  font-family: 'Inter', sans-serif;
}
</style>
