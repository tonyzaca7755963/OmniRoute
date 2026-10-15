"use client";

import React, { useEffect, useState } from "react";

interface QuotaItem {
  type: "claude" | "gemini";
  title: string;
  sessionPct: number;
  weeklyPct: number | null;
  sessionCountdown: string | null;
  weeklyCountdown: string | null;
}

interface AntigravityQuotaHudProps {
  connectionId: string;
  initialCache?: any;
}

function formatCountdown(value: string | number | null | undefined): string | null {
  if (!value) return null;
  const ms = new Date(value).getTime() - Date.now();
  if (!Number.isFinite(ms)) return null;
  if (ms <= 0) return "待刷新";
  const mins = Math.ceil(ms / 60000);
  const hours = Math.floor(mins / 60);
  return hours > 0 ? `${hours}h ${mins % 60}m` : `${mins}m`;
}

function extractQuotaItems(cache: any): QuotaItem[] {
  if (!cache || !cache.quotas) return [];
  const entries = Object.entries(cache.quotas).map(([name, data]: [string, any]) => ({
    ...data,
    name,
  }));

  const items: QuotaItem[] = [];

  for (const family of ["claude", "gemini"] as const) {
    const candidates = entries.filter((q) => q.name.toLowerCase().includes(family));
    const weekly = candidates.find((q) => /weekly|seven_day|7d/i.test(q.name));
    const current = candidates
      .filter((q) => !/weekly|seven_day|7d/i.test(q.name))
      .sort((a, b) => {
        const preferred = family === "claude" ? /sonnet/i : /pro-high/i;
        return Number(preferred.test(b.name)) - Number(preferred.test(a.name));
      })[0];

    if (!current && !weekly) continue;

    let percent = current?.remainingPercentage;
    if (typeof percent !== "number" && current?.total > 0) {
      percent = ((current.total - (current.used || 0)) / current.total) * 100;
    }

    if (!Number.isFinite(percent)) continue;

    const sessionPct = Math.max(0, Math.min(100, Math.round(percent)));
    const weeklyPct =
      typeof weekly?.remainingPercentage === "number"
        ? Math.max(0, Math.min(100, Math.round(weekly.remainingPercentage)))
        : null;

    items.push({
      type: family,
      title: family === "claude" ? "Claude Code" : "Gemini",
      sessionPct,
      weeklyPct,
      sessionCountdown: formatCountdown(current?.resetAt),
      weeklyCountdown: weekly ? formatCountdown(weekly.resetAt) : null,
    });
  }

  return items;
}

function AntigravityQuotaGauge({ item }: { item: QuotaItem }) {
  const isClaude = item.type === "claude";
  const weeklyText = item.weeklyPct === null ? "—" : `${item.weeklyPct}%`;
  const circumference = 2 * Math.PI * 16;
  const activeTicks = Math.round((item.sessionPct / 100) * 20);
  const strokeDashoffset = ((20 - activeTicks) / 20) * circumference;

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

  const tooltip = `${item.title} 全量额度\n━━━━━━━━━━━━━━━━━━━━\n• 当前额度 (HUD表盘): ${item.sessionPct}% ${
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
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke="currentColor"
            className="text-black/15 dark:text-white/20"
            strokeWidth="3.2"
            strokeDasharray="3.3 1.7"
          />
          <circle
            cx="20"
            cy="20"
            r="16"
            fill="none"
            stroke={theme.activeTickColor}
            strokeWidth="3.2"
            strokeDasharray="3.3 1.7"
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <span
          className={`absolute text-xs font-black font-mono tracking-tighter ${theme.centerText}`}
          style={{ color: theme.activeTickColor }}
        >
          {item.sessionPct}%
        </span>
      </div>

      <div className="flex flex-col min-w-[104px] justify-center leading-snug">
        <div className="flex items-center justify-between gap-2">
          <span className={`text-[12px] font-bold tracking-tight ${theme.titleText}`}>
            {item.title}
          </span>
          <span className="text-[10px] text-text-muted font-mono font-medium">
            周:{weeklyText}
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <span className="text-[10px] text-text-muted font-mono">
            当前: <span className={theme.highlightText}>{item.sessionPct}%</span>
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
  const [cache, setCache] = useState<any>(initialCache);

  useEffect(() => {
    let alive = true;
    const fetchQuota = async () => {
      try {
        const res = await fetch("/api/usage/provider-limits", {
          cache: "no-store",
          signal: AbortSignal.timeout(10000),
        });
        if (!res.ok) return;
        const data = await res.json();
        if (alive && data?.caches?.[connectionId]) {
          setCache(data.caches[connectionId]);
        }
      } catch {
        // Ignore fetch errors
      }
    };

    if (!cache || !cache.quotas) {
      fetchQuota();
    }

    const timer = setInterval(fetchQuota, 60000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, [connectionId, cache]);

  const items = extractQuotaItems(cache);
  if (!items.length) return null;

  return (
    <div
      data-agy-quota-hud="native"
      className="flex items-center gap-2.5 flex-wrap ms-auto me-3 my-0.5"
    >
      {items.map((item) => (
        <AntigravityQuotaGauge key={item.type} item={item} />
      ))}
    </div>
  );
}
