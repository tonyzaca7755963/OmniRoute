"use client";

import React, { useEffect, useState } from "react";
import type { ProviderQuotaCacheEntry } from "../hooks/useProviderQuota";

export interface QuotaItem {
  type: "claude" | "gemini";
  title: string;
  sessionPct: number | null;
  weeklyPct: number | null;
  sessionCountdown: string | null;
  weeklyCountdown: string | null;
}

export interface AntigravityQuotaHudProps {
  connectionId: string;
  initialCache?: ProviderQuotaCacheEntry | null;
}

// Module-level shared cache & request registry to prevent duplicate network calls
// across multiple account rows and strictly isolate caches by connectionId.
export const sharedMemoryQuotaCache = new Map<
  string,
  { entry: ProviderQuotaCacheEntry; fetchedAtMs: number }
>();
export const cacheSubscribers = new Set<(connId: string) => void>();
let inFlightFetch: Promise<void> | null = null;

export function triggerSharedFetch(): Promise<void> {
  if (inFlightFetch) return inFlightFetch;

  inFlightFetch = (async () => {
    try {
      const res = await fetch("/api/usage/provider-limits", {
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data?.caches && typeof data.caches === "object") {
        const now = Date.now();
        for (const [id, val] of Object.entries(data.caches)) {
          if (val && typeof val === "object") {
            sharedMemoryQuotaCache.set(id, {
              entry: val as ProviderQuotaCacheEntry,
              fetchedAtMs: now,
            });
            cacheSubscribers.forEach((cb) => cb(id));
          }
        }
      }
    } catch {
      // Ignore background fetch errors
    } finally {
      inFlightFetch = null;
    }
  })();

  return inFlightFetch;
}

export function formatCountdown(value: string | number | null | undefined): string | null {
  if (!value) return null;
  const ms = new Date(value).getTime() - Date.now();
  if (!Number.isFinite(ms)) return null;
  if (ms <= 0) return "待刷新";
  const mins = Math.ceil(ms / 60000);
  const hours = Math.floor(mins / 60);
  return hours > 0 ? `${hours}h ${mins % 60}m` : `${mins}m`;
}

/**
 * Computes SVG strokeDasharray to light up exactly `activeTicks` out of `totalTicks` (20).
 * Circumference C ≈ 100.531 (r=16).
 * Tick length = 3.3, Gap length ≈ 1.7265.
 *
 * For k=0: returns "0 1000" (no visible tick).
 * For k=20: returns "3.3 1.7265" (all 20 ticks lit).
 * For 0 < k < 20: repeats "3.3 1.7265" for k-1 ticks, then "3.3 1000", leaving the rest unlit.
 */
export function getTickDashArray(activeTicks: number, totalTicks = 20, tick = 3.3): string {
  const C = 2 * Math.PI * 16;
  const gap = Number(((C - totalTicks * tick) / totalTicks).toFixed(4));

  if (activeTicks <= 0) return "0 1000";
  if (activeTicks >= totalTicks) return `${tick} ${gap}`;

  const parts: (number | string)[] = [];
  for (let i = 0; i < activeTicks - 1; i++) {
    parts.push(tick, gap);
  }
  parts.push(tick, 1000);
  return parts.join(" ");
}

/**
 * Extracts quota items for Claude Code and Gemini families.
 * Priority:
 * 1. Dedicated family session keys (claude_gpt_session, gemini_session) win over single model keys.
 * 2. If no family session key exists, falls back to model quotas (sonnet / pro-high).
 * 3. Dedicated weekly keys (claude_gpt_weekly, gemini_weekly, or weekly patterns).
 * 4. If only weekly quota exists (session is absent), the family is still returned with sessionPct=null.
 */
export function extractQuotaItems(cache: any): QuotaItem[] {
  if (!cache || !cache.quotas || typeof cache.quotas !== "object") return [];
  const entries = Object.entries(cache.quotas).map(([name, data]: [string, any]) => ({
    ...(typeof data === "object" && data !== null ? data : {}),
    name,
  }));

  const items: QuotaItem[] = [];

  for (const family of ["claude", "gemini"] as const) {
    const candidates = entries.filter((q) =>
      (family === "claude" ? /claude/i : /gemini/i).test(q.name)
    );
    if (!candidates.length) continue;

    // 1. Identify weekly window
    const weekly = candidates.find((q) =>
      family === "claude"
        ? /claude.*weekly|claude_gpt_weekly/i.test(q.name) || /weekly|seven_day|7d/i.test(q.name)
        : /gemini.*weekly|gemini_weekly/i.test(q.name) || /weekly|seven_day|7d/i.test(q.name)
    );

    // 2. Identify session window — prioritize explicit family session keys first!
    const nonWeekly = candidates.filter(
      (q) => q !== weekly && !/weekly|seven_day|7d/i.test(q.name)
    );

    const explicitFamilySession = nonWeekly.find((q) =>
      family === "claude"
        ? /^claude_gpt_session$/i.test(q.name) || /^claude.*session$/i.test(q.name)
        : /^gemini_session$/i.test(q.name) || /^gemini.*session$/i.test(q.name)
    );

    // Fallback to model keys if explicit family session key is absent
    const fallbackModel = nonWeekly.slice().sort((a, b) => {
      const preferred = family === "claude" ? /sonnet/i : /pro-high/i;
      return Number(preferred.test(b.name)) - Number(preferred.test(a.name));
    })[0];

    const current = explicitFamilySession || fallbackModel;

    if (!current && !weekly) continue;

    let sessionPercent: number | null = null;
    if (current) {
      let rawPercent = current.remainingPercentage;
      if (typeof rawPercent !== "number" && current.total > 0) {
        rawPercent = ((current.total - (current.used || 0)) / current.total) * 100;
      }
      if (typeof rawPercent === "number" && Number.isFinite(rawPercent)) {
        sessionPercent = Math.max(0, Math.min(100, Math.round(rawPercent)));
      }
    }

    let weeklyPercent: number | null = null;
    if (weekly) {
      let rawWeekly = weekly.remainingPercentage;
      if (typeof rawWeekly !== "number" && weekly.total > 0) {
        rawWeekly = ((weekly.total - (weekly.used || 0)) / weekly.total) * 100;
      }
      if (typeof rawWeekly === "number" && Number.isFinite(rawWeekly)) {
        weeklyPercent = Math.max(0, Math.min(100, Math.round(rawWeekly)));
      }
    }

    // Keep item if either session or weekly is available
    if (sessionPercent === null && weeklyPercent === null) continue;

    items.push({
      type: family,
      title: family === "claude" ? "Claude Code" : "Gemini",
      sessionPct: sessionPercent,
      weeklyPct: weeklyPercent,
      sessionCountdown: current ? formatCountdown(current.resetAt) : null,
      weeklyCountdown: weekly ? formatCountdown(weekly.resetAt) : null,
    });
  }

  return items;
}

export function AntigravityQuotaGauge({ item }: { item: QuotaItem }) {
  const isClaude = item.type === "claude";
  const weeklyText = item.weeklyPct === null ? "—" : `${item.weeklyPct}%`;
  const sessionText = item.sessionPct === null ? "—" : `${item.sessionPct}%`;

  // Display percentage for circular HUD: session percent if present, else fallback to weekly
  const displayPct = item.sessionPct ?? item.weeklyPct ?? 0;
  const activeTicks = Math.round((displayPct / 100) * 20);
  const strokeDashArray = getTickDashArray(activeTicks, 20, 3.3);

  const theme = isClaude
    ? {
        border: "border-amber-500/30 dark:border-amber-400/40 hover:border-amber-500/60",
        bg: "bg-amber-500/[0.04] dark:bg-amber-950/25",
        activeTickColor: "#f59e0b",
        centerText: "text-amber-600 dark:text-amber-300",
        titleText: "text-amber-700 dark:text-amber-300",
        highlightText: "text-amber-600 dark:text-amber-400 font-bold",
      }
    : {
        border: "border-cyan-500/30 dark:border-cyan-400/40 hover:border-cyan-500/60",
        bg: "bg-cyan-500/[0.04] dark:bg-cyan-950/25",
        activeTickColor: "#06b6d4",
        centerText: "text-cyan-600 dark:text-cyan-300",
        titleText: "text-cyan-700 dark:text-cyan-300",
        highlightText: "text-cyan-600 dark:text-cyan-400 font-bold",
      };

  const tooltip = `${item.title} 全量额度\n━━━━━━━━━━━━━━━━━━━━\n• 当前额度 (HUD表盘): ${sessionText} ${
    item.sessionCountdown ? `(⏱ 重置: ${item.sessionCountdown})` : ""
  }\n• 每周总额度: ${weeklyText} ${
    item.weeklyCountdown ? `(⏱ 重置: ${item.weeklyCountdown})` : ""
  }`;

  return (
    <div
      className={`group/hud flex items-center gap-3 px-3 py-1.5 rounded-xl border ${theme.border} ${theme.bg} select-none cursor-pointer shrink-0 transition-all`}
      title={tooltip}
      style={{
        border: `1px solid ${theme.activeTickColor}66`,
        background: `${theme.activeTickColor}09`,
      }}
    >
      <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
        <svg className="w-11 h-11" viewBox="0 0 40 40" style={{ transform: "rotate(-90deg)" }}>
          {/* Background circle: all 20 tick markers in faint neutral color */}
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke="currentColor"
            className="text-black/15 dark:text-white/20"
            strokeWidth="3.2"
            strokeDasharray="3.3 1.7265"
          />
          {/* Active colored circle: strictly lights up `activeTicks` dashes */}
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke={theme.activeTickColor}
            strokeWidth="3.2"
            strokeDasharray={strokeDashArray}
            strokeLinecap="round"
          />
        </svg>
        <span
          className={`absolute text-xs font-black font-mono tracking-tighter ${theme.centerText}`}
          style={{ color: theme.activeTickColor }}
        >
          {item.sessionPct !== null ? `${item.sessionPct}%` : weeklyText}
        </span>
      </div>

      <div className="flex flex-col min-w-[104px] justify-center leading-snug">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[12px] font-bold tracking-tight ${theme.titleText}`}>
            {item.title}
          </span>
          <span className="text-[10px] text-text-muted font-mono font-medium">周:{weeklyText}</span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className="text-[10px] text-text-muted font-mono">
            当前: <span className={theme.highlightText}>{sessionText}</span>
          </span>
          {item.sessionCountdown ? (
            <span className="text-[10px] font-mono text-text-muted opacity-85 tracking-tight font-medium">
              ⏱{item.sessionCountdown}
            </span>
          ) : item.weeklyCountdown ? (
            <span className="text-[10px] font-mono text-text-muted opacity-85 tracking-tight font-medium">
              ⏱{item.weeklyCountdown}
            </span>
          ) : (
            <span className="text-[10px] opacity-35 font-mono">-</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AntigravityQuotaHud({
  connectionId,
  initialCache,
}: AntigravityQuotaHudProps) {
  const [, setVersion] = useState(0);

  useEffect(() => {
    const onCacheUpdate = (updatedConnId: string) => {
      if (updatedConnId === connectionId) {
        setVersion((v) => v + 1);
      }
    };
    cacheSubscribers.add(onCacheUpdate);

    // If neither initialCache nor sharedMemoryQuotaCache has quotas for this connectionId, trigger shared fetch
    if (!initialCache?.quotas && !sharedMemoryQuotaCache.has(connectionId)) {
      triggerSharedFetch();
    }

    const timer = setInterval(() => {
      triggerSharedFetch();
    }, 60000);

    return () => {
      cacheSubscribers.delete(onCacheUpdate);
      clearInterval(timer);
    };
  }, [connectionId, initialCache]);

  // Derived active cache: strictly isolates by connectionId
  const sharedEntry = sharedMemoryQuotaCache.get(connectionId);
  let activeCache: ProviderQuotaCacheEntry | null = null;

  if (initialCache && sharedEntry) {
    if (!initialCache.quotas && sharedEntry.entry.quotas) {
      activeCache = sharedEntry.entry;
    } else {
      const initialMs = initialCache.fetchedAt ? new Date(initialCache.fetchedAt).getTime() : 0;
      activeCache = sharedEntry.fetchedAtMs > initialMs ? sharedEntry.entry : initialCache;
    }
  } else if (sharedEntry) {
    activeCache = sharedEntry.entry;
  } else if (initialCache) {
    activeCache = initialCache;
  }

  const items = extractQuotaItems(activeCache);
  if (!items.length) return null;

  return (
    <div
      data-omni-native-hud="antigravity"
      className="flex items-center gap-2.5 flex-wrap ms-auto me-3 my-0.5"
    >
      {items.map((item) => (
        <AntigravityQuotaGauge key={item.type} item={item} />
      ))}
    </div>
  );
}
