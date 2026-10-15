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

/**
 * Returns the ISO string corresponding to 00:00:00.000 in China Standard Time (UTC+8)
 * for a given date string "YYYY-MM-DD".
 */
export function getUsageAnalyticsCstMidnightIso(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00.000+08:00`).toISOString();
}

/**
 * Computes a consistent retention cutoff boundary aligned to China Standard Time (UTC+8).
 * Ensures that cleanup deletion, rollup aggregation, and analytics unified queries
 * share the exact same boundary at all hours (including Beijing early morning 00:00-08:00).
 *
 * @param retentionDays - Retention window in days (e.g. 30)
 * @param now - Reference timestamp (defaults to current time)
 * @returns { dateStr: string, cutoffIso: string }
 *   - dateStr: Calendar day in CST (YYYY-MM-DD)
 *   - cutoffIso: UTC ISO string corresponding to 00:00:00.000 CST of dateStr
 */
export function computeUsageAnalyticsRetentionCutoff(
  retentionDays: number,
  now: Date = new Date()
): { dateStr: string; cutoffIso: string } {
  const todayCst = formatUsageAnalyticsDate(now);
  const midnightTodayCst = new Date(`${todayCst}T00:00:00.000+08:00`);
  const cutoffDate = new Date(midnightTodayCst.getTime());
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  const dateStr = formatUsageAnalyticsDate(cutoffDate);
  const cutoffIso = getUsageAnalyticsCstMidnightIso(dateStr);
  return { dateStr, cutoffIso };
}
