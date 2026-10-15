import test from "node:test";
import assert from "node:assert/strict";

import {
  extractQuotaItems,
  getTickDashArray,
  formatCountdown,
} from "../../src/app/(dashboard)/dashboard/providers/[id]/components/AntigravityQuotaHud.tsx";

test("extractQuotaItems: prioritizes family session keys over specific model quotas", () => {
  const cache = {
    quotas: {
      claude_gpt_session: { remainingPercentage: 10, total: 100, resetAt: "2026-10-15T15:00:00Z" },
      "claude-sonnet-4-6": { remainingPercentage: 90, total: 100, resetAt: "2026-10-15T15:00:00Z" },
      claude_gpt_weekly: { remainingPercentage: 75, total: 100, resetAt: "2026-10-22T00:00:00Z" },
      gemini_session: { remainingPercentage: 5, total: 100, resetAt: "2026-10-15T15:00:00Z" },
      "gemini-pro-high": { remainingPercentage: 95, total: 100, resetAt: "2026-10-15T15:00:00Z" },
      gemini_weekly: { remainingPercentage: 80, total: 100, resetAt: "2026-10-22T00:00:00Z" },
    },
  };

  const items = extractQuotaItems(cache);
  assert.equal(items.length, 2);

  const claude = items.find((i) => i.type === "claude");
  assert.ok(claude);
  assert.equal(
    claude.sessionPct,
    10,
    "claude session should be 10% from claude_gpt_session, not 90% from sonnet"
  );
  assert.equal(claude.weeklyPct, 75);

  const gemini = items.find((i) => i.type === "gemini");
  assert.ok(gemini);
  assert.equal(
    gemini.sessionPct,
    5,
    "gemini session should be 5% from gemini_session, not 95% from pro-high"
  );
  assert.equal(gemini.weeklyPct, 80);
});

test("extractQuotaItems: fallback to model quotas when explicit family session key is absent", () => {
  const cache = {
    quotas: {
      "claude-sonnet-4-6": { remainingPercentage: 85, total: 100, resetAt: "2026-10-15T15:00:00Z" },
      "gemini-pro-high": { remainingPercentage: 60, total: 100, resetAt: "2026-10-15T15:00:00Z" },
    },
  };

  const items = extractQuotaItems(cache);
  assert.equal(items.length, 2);
  const claude = items.find((i) => i.type === "claude");
  assert.equal(claude.sessionPct, 85);
  const gemini = items.find((i) => i.type === "gemini");
  assert.equal(gemini.sessionPct, 60);
});

test("extractQuotaItems: handles weekly-only quota cache gracefully without returning empty", () => {
  const cacheWeeklyOnly = {
    quotas: {
      claude_gpt_weekly: { remainingPercentage: 40, total: 100, resetAt: "2026-10-22T00:00:00Z" },
    },
  };

  const items = extractQuotaItems(cacheWeeklyOnly);
  assert.equal(items.length, 1);
  const claude = items[0];
  assert.equal(claude.type, "claude");
  assert.equal(claude.sessionPct, null, "sessionPct should be null when session quota is absent");
  assert.equal(claude.weeklyPct, 40, "weeklyPct should be 40%");
  assert.ok(claude.weeklyCountdown);
});

test("getTickDashArray: accurately lights up 0, 10, and 20 ticks", () => {
  const zeroTicks = getTickDashArray(0, 20, 3.3);
  assert.equal(zeroTicks, "0 1000", "0% must have zero lit ticks");

  const tenTicks = getTickDashArray(10, 20, 3.3);
  // 10 ticks should contain 9 gaps and end with 1000 gap
  const parts = tenTicks.split(" ");
  // 9 pairs of (3.3, gap) + final (3.3, 1000) = 9*2 + 2 = 20 numbers
  assert.equal(parts.length, 20);
  assert.equal(parts[parts.length - 1], "1000");

  const twentyTicks = getTickDashArray(20, 20, 3.3);
  assert.equal(twentyTicks, "3.3 1.7265", "100% must have full continuous tick/gap repetition");
});

test("formatCountdown: parses valid dates and labels negative or zero as '待刷新'", () => {
  const future = new Date(Date.now() + 125 * 60 * 1000).toISOString();
  const cd = formatCountdown(future);
  assert.ok(cd.includes("h") && cd.includes("m"));

  const past = new Date(Date.now() - 1000).toISOString();
  assert.equal(formatCountdown(past), "待刷新");
});
