import { createMemoryHistory, createRouter } from "vue-router";
import EventsEmbedEventsPage from "@/embeds/events/pages/EventsEmbedEventsPage.vue";
import EventsEmbedCreatePage from "@/embeds/events/pages/EventsEmbedCreatePage.vue";

export function routeLocationFromInitialRoute(initialRoute = "events") {
  if (initialRoute === "create-private") {
    return { name: "events-embed-create", params: { type: "private" } };
  }
  if (initialRoute === "create-group") {
    return { name: "events-embed-create", params: { type: "group" } };
  }
  return { name: "events-embed-events" };
}

const routes = [
  {
    path: "/events",
    name: "events-embed-events",
    component: EventsEmbedEventsPage,
  },
  {
    path: "/create/:type?",
    name: "events-embed-create",
    component: EventsEmbedCreatePage,
    props: (route) => ({
      type: route.params.type === "group" ? "group" : "private",
    }),
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/events",
  },
];

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

export default router;
