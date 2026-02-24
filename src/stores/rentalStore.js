import { defineStore } from "pinia";

export const useRentalStore = defineStore("rental", {
  state: () => ({
    catalog: [],
    catalogEnvelope: null,
    catalogMeta: {
      etag: null,
      updatedAt: null,
      checkedAt: null,
    },
    availabilityByDate: {},
    activeReservation: null,
    recentActions: [],
  }),

  actions: {
    setCatalog(items = []) {
      this.catalog = Array.isArray(items) ? items : [];
    },

    mergeCatalogMeta(meta = {}) {
      this.catalogMeta = {
        ...this.catalogMeta,
        ...(meta || {}),
      };
    },

    setAvailability(snapshot = {}) {
      const rentalId = snapshot?.rentalId || "unknown";
      const date = snapshot?.date || "unknown";
      const key = `${rentalId}:${date}`;
      this.availabilityByDate[key] = snapshot;
    },

    setActiveReservation(reservation = null) {
      this.activeReservation = reservation;
    },

    pushAction(action = {}) {
      this.recentActions.push({
        ...action,
        at: action?.at || Date.now(),
      });
    },

    resetRentalState() {
      this.$reset();
    },
  },
});
