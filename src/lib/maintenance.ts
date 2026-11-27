/**
 * Normalized maintenance flag parser across JSONB boolean (`true`/`false`),
 * stringified booleans (`"true"`/`"false"`), and object payloads (`{ enabled: true }`).
 */
export function isMaintenanceEnabled(value: unknown): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return value.trim().toLowerCase() === "true";
  }
  if (value && typeof value === "object" && "enabled" in value) {
    return Boolean((value as { enabled?: unknown }).enabled);
  }
  return false;
}
