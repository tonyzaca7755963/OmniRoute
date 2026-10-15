/**
 * Shared timezone configuration and formatters for usage analytics.
 * Adapts day-bucketing and range calculations to China Standard Time (UTC+8).
 */

export const USAGE_ANALYTICS_TIME_ZONE = "Asia/Shanghai";
export const USAGE_ANALYTICS_SQLITE_MODIFIER = "+8 hours";

export function formatUsageAnalyticsDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: USAGE_ANALYTICS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  let year = "";
  let month = "";
  let day = "";
  for (const part of parts) {
    if (part.type === "year") year = part.value;
    if (part.type === "month") month = part.value;
    if (part.type === "day") day = part.value;
  }
  return `${year}-${month}-${day}`;
}

export function formatUsageAnalyticsDateFromIso(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.split("T", 1)[0] || null;
  return formatUsageAnalyticsDate(date);
}
