# Orders Implementation Guide

Linden, this guide explains how we refactored the Orders page implementation using our standardized architecture. 

## Summary
The Orders page has been migrated to use the **API-Flow-Pinia** architecture, ensuring a clean separation between data fetching, state management, and UI rendering.

## Key Components

### 1. Pinia Store (`useOrdersStore.js`)
We use a centralized Pinia store to manage the list of orders, pagination state, and filters. This replaces ad-hoc local state and ensures that data is consistent across the application.

### 2. Flow System (`flowRegistry.js`)
All API calls are now routed through the **FlowHandler**. This allows us to implement Features like:
- **ETag Caching**: Reducing bandwidth by only downloading data if it has changed.
- **Simplified Error Handling**: Centralized management of API failures.
- **Request Metadata**: Tracking when and why a fetch was triggered.

### 3. Mock Backend (`mockOrdersBackend.js`)
To facilitate development without a live backend, we implemented a sophisticated mock API that simulates:
- Server-side filtering (by status, type, and search query).
- Pagination logic.
- ETag generation for cache testing.
- Persistence using `localStorage`.

## UI Integration
The `updatedTableDemo.vue` (Orders Dashboard) now binds directly to the Pinia store. When a filter is changed in the UI, it updates the store, which automatically triggers a new flow request if necessary.

---
*This implementation follows the pattern established in the Bookings and Cart flows, providing a unified developer experience across the dashboard.*
