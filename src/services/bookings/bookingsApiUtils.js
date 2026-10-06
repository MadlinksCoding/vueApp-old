import { fail } from "@/services/flow-system/flowTypes.js";

export function getBookingRequiredProducts(event = {}) {
  const whoCanBook = String(event?.whoCanBook ?? event?.raw?.whoCanBook ?? '').trim().toLowerCase();
  if (whoCanBook === 'subscribersonly') {
    // Audience-tier requirements use the same subscription presentation and checkout.
    const tiers = event?.subscriptionTiers ?? event?.raw?.subscriptionTiers ?? [];
    return [...new Set((Array.isArray(tiers) ? tiers : []).map(Number))]
      .filter(id => Number.isInteger(id) && id > 0)
      .map(id => ({ id, type: 'subscription' }));
  }
  const requirement = String(event?.spendingRequirement ?? event?.raw?.spendingRequirement ?? '').trim().toLowerCase();
  if (requirement && requirement !== 'mustownproducts') return [];
  const source = Array.isArray(event?.requiredProducts) ? event.requiredProducts : (event?.raw?.requiredProducts || []);
  return (Array.isArray(source) ? source : [])
    .map(item => ({ id: Number(item?.id || 0), type: String(item?.type || '').trim().toLowerCase() }))
    .filter(item => item.id > 0 && ['media', 'product', 'subscription'].includes(item.type));
}

export async function fetchBookingPrerequisiteEligibility(fanId, requirements) {
  // Inline login refreshes the checkout nonce before the parent page reloads.
  let nonce = window.custom_checkout_params?.wp_rest_nonce || window.siteData?.restNonce || '';
  try {
    nonce = nonce || window.parent?.custom_checkout_params?.wp_rest_nonce || window.parent?.siteData?.restNonce || '';
  } catch (_) { /* The standalone app cannot read a cross-origin parent. */ }
  const response = await fetch('/wp-json/api/bookings/validate', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(nonce ? { 'X-WP-Nonce': nonce } : {}) },
    body: JSON.stringify({ user_id: Math.max(0, Number(fanId) || 0), must_own_products: requirements, include_checkout_details: true }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.message || payload?.error || 'Could not check eligibility.');
  return payload;
}

// The full tier price describes renewals; a switch has a server-priced charge
// for today. Keep zero-dollar downgrades instead of falling back to full price.
export function getBookingPrerequisitePrice(prerequisite) {
  return Math.max(0, Number(prerequisite?.subscription?.amount_due_today
    ?? prerequisite?.product?.price ?? 0));
}

export function getBookingsApiBaseUrl(context) {
  return context.apiBaseUrl || import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";
}

export function toNumber(value, fallback = null) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function asFlowError(error, fallbackCode, fallbackMessage) {
  if (error?.ok === false && error?.error) {
    return error;
  }

  return fail({
    code: error?.code || fallbackCode,
    message: error?.message || fallbackMessage,
    details: error?.details || error,
  });
}
