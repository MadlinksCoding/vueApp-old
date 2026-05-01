import { defineStore } from "pinia";

/**
 * useOrdersStore
 * Stores the global orders state with persistence and ETag metadata.
 */
export const useOrdersStore = defineStore("orders", {
  state: () => ({
    orders: [],
    meta: {
      etag: null,
      lastChecked: null,
      totalCount: 0,
      pagination: {
        currentPage: 1,
        perPage: 10,
        totalPages: 0,
      },
    },
    // View state
    loading: false,
    error: null,
  }),

  actions: {
    setOrders(orders, meta = {}) {
      // Robust handling: if 'orders' is an object containing 'items', use that.
      // This handles cases where hydration from cache might pass the whole object.
      if (orders && typeof orders === 'object' && Array.isArray(orders.items)) {
        this.orders = orders.items;
        meta = orders.meta || orders; 
      } else {
        this.orders = Array.isArray(orders) ? orders : [];
      }

      if (meta.etag) this.meta.etag = meta.etag;
      if (meta.totalCount !== undefined) this.meta.totalCount = meta.totalCount;
      if (meta.pagination) this.meta.pagination = { ...this.meta.pagination, ...meta.pagination };
      this.meta.lastChecked = Date.now();
      this.error = null;
    },

    setLoading(isLoading) {
      this.loading = isLoading;
    },

    setError(error) {
      this.error = error;
      this.loading = false;
    },

    updateOrderLocally(orderId, updates) {
      const index = this.orders.findIndex((o) => o.order_id === orderId || o.orderNum === orderId);
      if (index !== -1) {
        this.orders[index] = { ...this.orders[index], ...updates };
      }
    },
  },

  persist: {
    key: "dash_orders_store",
    storage: localStorage,
    paths: ["orders", "meta"],
  },
});
