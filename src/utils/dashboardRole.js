export function normalizeDashboardBookingRole(value, fallback = "creator") {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : "";

  if (normalized === "creator" || normalized === "agent") return "creator";
  if (normalized === "fan" || normalized === "audience") return "fan";

  return fallback;
}
