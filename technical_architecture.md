# Unified Booking Form - Technical Architecture

This document outlines the technical implementation of the Unified Booking Form, focusing on State Management, Validation Logic ("Backend" Logic), and UI Dependencies.

## 1. Core Architecture: The State Engine

The "Backend" logic of the frontend is managed by a custom **State Engine** (`src/utils/stateEngine.js`). This engine acts as the single source of truth for the entire booking flow.

### Why use an Engine?

Instead of scattering data across multiple components, the Engine centralizes:

- **Data:** All form fields (`eventTitle`, `duration`, `price`, etc.) live in one place.
- **Navigation:** It controls moving between Step 1 and Step 2.
- **Validation:** It enforces rules before allowing navigation or submission.

### Initialization

The engine is initialized in the parent component (`UnifiedBookingForm.vue`) and passed down to children.

```javascript
// UnifiedBookingForm.vue
const bookingFlow = createStepStateEngine({
  flowId: "booking-flow",
  defaults: {
    eventTitle: "",
    basePrice: "",
    // ... all 40+ fields
  },
});
```

---

## 2. Setting Dependencies & Validations

We handle "dependencies" (rules that depend on the data) using a flexible **Validator System**.

### How we set Validation Rules

We use the `addValidator(step, callback)` method. This registers a function that runs automatically when the user tries to exit a specific step.

**Example Code:**

```javascript
// UnifiedBookingForm.vue

// RULE: Step 1 cannot be completed without a Title and Duration
bookingFlow.addValidator(1, (state) => {
  const errors = [];
  if (!state.eventTitle) errors.push("Event Title is required");
  if (!state.duration) errors.push("Duration is required");

  if (errors.length > 0) return { errors }; // Block navigation
  return true; // Allow navigation
});
```

### How Submission Works

When the user clicks "Publish Schedule" in Step 2:

1. The component calls `engine.validate(2)`.
2. The engine runs all validators associated with Step 2.
3. If valid, it returns the clean data payload. If invalid, it returns error messages.

---

## 3. UI Conditions (Frontend Logic)

"Conditions" usually refer to showing/hiding or enabling/disabling fields based on other fields. We handle this using **Reactive Bindings** in Vue.

### Input Disabling Implementation

We don't need complex backend logic for this. We simply bind the HTML `disabled` attribute to the state variable.

**Example: Disabling "Price" if "Paid Event" is unchecked**

```html
<!-- Checkbox controls the state -->
<CheckboxGroup v-model="formData.isPaidEvent" label="This is a paid event" />

<!-- Input listens to the state -->
<BaseInput
  v-model="formData.price"
  :disabled="!formData.isPaidEvent"  <!-- Logic: Disabled if NOT paid event -->
/>
```

### Data Synchronization

To ensure the Engine (Global) and the Inputs (Local) are always in sync, we use a watcher in every step component:

```javascript
// Step Component (e.g., GroupBookingStep1.vue)
watch(
  formData,
  (val) => {
    // Anytime the user types, push data to the Engine immediately
    Object.keys(val).forEach((k) => props.engine.setState(k, val[k]));
  },
  { deep: true },
);
```

## Summary for Client

- **Robustness:** The form preserves data even if you switch steps.
- **Integrity:** Users cannot "trick" the form by skipping required fields; the Engine blocks them.
- **UX:** Inputs automatically disable/enable based on your choices, preventing invalid data entry.
