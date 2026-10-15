import test from "node:test";
import assert from "node:assert/strict";
import Database from "better-sqlite3";

import {
  formatUsageAnalyticsDate,
  formatUsageAnalyticsDateFromIso,
} from "../../src/shared/utils/analyticsTime.ts";

import { buildUnifiedSource } from "../../src/lib/db/usageAnalytics/sources.ts";

test("CST Timezone: UTC 15:59:59Z vs 16:00:00Z date boundaries", () => {
  // 15:59:59Z on 2026-10-15 is 23:59:59 in Beijing (same calendar day)
  const t1 = new Date("2026-10-15T15:59:59.000Z");
  assert.equal(formatUsageAnalyticsDate(t1), "2026-10-15");
  assert.equal(formatUsageAnalyticsDateFromIso("2026-10-15T15:59:59.000Z"), "2026-10-15");

  // 16:00:00Z on 2026-10-15 is 00:00:00 on 2026-10-16 in Beijing (next calendar day)
  const t2 = new Date("2026-10-15T16:00:00.000Z");
  assert.equal(formatUsageAnalyticsDate(t2), "2026-10-16");
  assert.equal(formatUsageAnalyticsDateFromIso("2026-10-15T16:00:00.000Z"), "2026-10-16");
});

test("CST Timezone: SQLite DATE(+8 hours) and strftime(%w, +8 hours) end-to-end", () => {
  const db = new Database(":memory:");
  db.exec(`
    CREATE TABLE usage_history (
      id INTEGER PRIMARY KEY,
      timestamp TEXT NOT NULL,
      requests INTEGER NOT NULL,
      tokens_input INTEGER NOT NULL,
      tokens_output INTEGER NOT NULL
    );
  `);

  // Insert two rows: one right before CST midnight, one right after
  db.prepare(
    `
    INSERT INTO usage_history (timestamp, requests, tokens_input, tokens_output)
    VALUES (?, ?, ?, ?)
  `
  ).run("2026-10-15T15:59:59.000Z", 1, 100, 200);

  db.prepare(
    `
    INSERT INTO usage_history (timestamp, requests, tokens_input, tokens_output)
    VALUES (?, ?, ?, ?)
  `
  ).run("2026-10-15T16:00:01.000Z", 2, 300, 400);

  // Group by DATE(timestamp, '+8 hours')
  const rows = db
    .prepare(
      `
    SELECT
      DATE(timestamp, '+8 hours') as date,
      strftime('%w', timestamp, '+8 hours') as dayOfWeek,
      SUM(requests) as requests,
      SUM(tokens_input + tokens_output) as totalTokens
    FROM usage_history
    GROUP BY DATE(timestamp, '+8 hours')
    ORDER BY date ASC
  `
    )
    .all();

  assert.equal(rows.length, 2, "Rows must be partitioned into two distinct days under CST");
  assert.equal(rows[0].date, "2026-10-15");
  assert.equal(rows[0].requests, 1);
  assert.equal(rows[0].totalTokens, 300);

  assert.equal(rows[1].date, "2026-10-16");
  assert.equal(rows[1].requests, 2);
  assert.equal(rows[1].totalTokens, 700);

  db.close();
});

test("CST Timezone: sources.ts buildUnifiedSource aligns cutoff to Beijing midnight ISO", () => {
  const result = buildUnifiedSource({
    sinceIso: "2026-10-01T00:00:00.000Z",
    untilIso: "2026-10-15T16:30:00.000Z",
    rawCutoffDate: "2026-10-10",
  });

  // rawCutoff should be 2026-10-10T00:00:00.000+08:00 represented in ISO (which is 2026-10-09T16:00:00.000Z)
  const expectedIso = new Date("2026-10-10T00:00:00.000+08:00").toISOString();
  assert.equal(result.unifiedParams.rawCutoff, expectedIso);

  // untilDate should be formatted as CST date (16:30Z is next day in CST -> 2026-10-16)
  assert.equal(result.unifiedParams.untilDate, "2026-10-16");
});
