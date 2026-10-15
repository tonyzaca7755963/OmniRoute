import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Setup global browser DOM environment via JSDOM
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "http://localhost:20128/dashboard/providers/antigravity",
});
global.window = dom.window as any;
global.document = dom.window.document;
global.location = dom.window.location;
Object.defineProperty(global, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});
global.HTMLElement = dom.window.HTMLElement;
global.MutationObserver = dom.window.MutationObserver;
const raf = (cb: FrameRequestCallback) => setTimeout(cb, 16) as any;
global.requestAnimationFrame = raf;
dom.window.requestAnimationFrame = raf;

import React, { act } from "react";
import { createRoot } from "react-dom/client";

import AntigravityQuotaHud, {
  sharedMemoryQuotaCache,
} from "../../src/app/(dashboard)/dashboard/providers/[id]/components/AntigravityQuotaHud.tsx";

test("AntigravityQuotaHud UI: renders 0%, 50%, and 100% with exact SVG strokeDasharray", () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  // Test 0% session quota
  const cache0 = {
    quotas: {
      claude_gpt_session: { remainingPercentage: 0, total: 100 },
    },
  };

  act(() => {
    root.render(<AntigravityQuotaHud connectionId="c0" initialCache={cache0} />);
  });

  const activeCircle0 = container.querySelectorAll("circle")[1];
  assert.equal(
    activeCircle0.getAttribute("stroke-dasharray"),
    "0 1000",
    "0% must have '0 1000' (0 lit ticks)"
  );

  // Test 50% session quota
  const cache50 = {
    quotas: {
      claude_gpt_session: { remainingPercentage: 50, total: 100 },
    },
  };

  act(() => {
    root.render(<AntigravityQuotaHud connectionId="c50" initialCache={cache50} />);
  });

  const activeCircle50 = container.querySelectorAll("circle")[1];
  const parts50 = activeCircle50.getAttribute("stroke-dasharray").split(" ");
  assert.equal(parts50.length, 20, "50% must have 10 ticks (9 pairs + 10th tick + 1000 gap)");
  assert.equal(parts50[parts50.length - 1], "1000");

  // Test 100% session quota
  const cache100 = {
    quotas: {
      claude_gpt_session: { remainingPercentage: 100, total: 100 },
    },
  };

  act(() => {
    root.render(<AntigravityQuotaHud connectionId="c100" initialCache={cache100} />);
  });

  const activeCircle100 = container.querySelectorAll("circle")[1];
  assert.equal(
    activeCircle100.getAttribute("stroke-dasharray"),
    "3.3 1.7265",
    "100% must have full continuous repeat"
  );

  act(() => {
    root.unmount();
  });
  container.remove();
});

test("AntigravityQuotaHud UI: connectionId switching without initialCache NEVER leaks previous account quota", async () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  // Seed shared cache for account A
  sharedMemoryQuotaCache.set("account-A", {
    entry: {
      quotas: {
        claude_gpt_session: { remainingPercentage: 37, total: 100 },
      },
    },
    fetchedAtMs: Date.now(),
  });

  // Render account A with no initialCache (uses polled cache -> 37%)
  act(() => {
    root.render(<AntigravityQuotaHud connectionId="account-A" initialCache={null} />);
  });

  assert.ok(container.textContent.includes("37%"), "Account A must render 37%");

  // Switch connectionId to account B which has NO initialCache and NO polled data yet
  act(() => {
    root.render(<AntigravityQuotaHud connectionId="account-B" initialCache={null} />);
  });

  // Critical regression assertion: B must NEVER show A's 37%
  assert.ok(
    !container.textContent.includes("37%"),
    "Account B must NOT display account A's 37% quota"
  );
  assert.equal(
    container.querySelector("[data-omni-native-hud]"),
    null,
    "Account B has no quota data and must render empty"
  );

  act(() => {
    root.unmount();
  });
  container.remove();
});

test("AntigravityQuotaHud UI: manual refresh updates immediately and subsequent polled data also updates", () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  const initialPropsCache = {
    quotas: {
      claude_gpt_session: { remainingPercentage: 20, total: 100 },
    },
    fetchedAt: "2026-10-15T10:00:00.000Z",
  };

  act(() => {
    root.render(
      <AntigravityQuotaHud connectionId="conn-refresh" initialCache={initialPropsCache} />
    );
  });

  assert.ok(container.textContent.includes("20%"));

  // 1. Manual refresh passing newer props from parent
  const refreshedPropsCache = {
    quotas: {
      claude_gpt_session: { remainingPercentage: 55, total: 100 },
    },
    fetchedAt: "2026-10-15T10:05:00.000Z",
  };

  act(() => {
    root.render(
      <AntigravityQuotaHud connectionId="conn-refresh" initialCache={refreshedPropsCache} />
    );
  });

  assert.ok(container.textContent.includes("55%"), "Must update immediately when props refresh");

  // 2. Subsequent background polled update arrives with newer timestamp
  sharedMemoryQuotaCache.set("conn-refresh", {
    entry: {
      quotas: {
        claude_gpt_session: { remainingPercentage: 88, total: 100 },
      },
      fetchedAt: "2026-10-15T10:10:00.000Z",
    },
    fetchedAtMs: new Date("2026-10-15T10:10:00.000Z").getTime(),
  });

  // Re-render
  act(() => {
    root.render(
      <AntigravityQuotaHud connectionId="conn-refresh" initialCache={refreshedPropsCache} />
    );
  });

  assert.ok(container.textContent.includes("88%"), "Newer polled cache must supersede older props");

  act(() => {
    root.unmount();
  });
  container.remove();
});

test("AntigravityQuotaHud UI: delayed older responses do NOT clobber fresher initialCache", async () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  const nowMs = Date.now();
  // 1. Fresher initialCache: fetched 1 second ago, 90% quota
  const fresherInitialCache = {
    quotas: {
      claude_gpt_session: { remainingPercentage: 90, total: 100 },
    },
    fetchedAt: new Date(nowMs - 1000).toISOString(),
  };

  act(() => {
    root.render(<AntigravityQuotaHud connectionId="race-A" initialCache={fresherInitialCache} />);
  });
  assert.ok(container.textContent.includes("90%"), "Initially renders fresher 90%");

  // 2. Mock GET responds with older data (fetched 2 minutes ago, 10% quota)
  const origFetch = global.fetch;
  global.fetch = (async (url: string) => {
    if (url.includes("/api/usage/provider-limits")) {
      return {
        ok: true,
        json: async () => ({
          caches: {
            "race-A": {
              quotas: {
                claude_gpt_session: { remainingPercentage: 10, total: 100 },
              },
              fetchedAt: new Date(nowMs - 120000).toISOString(),
            },
          },
        }),
      };
    }
    return { ok: false };
  }) as any;

  // Trigger shared fetch (simulates delayed background arrival)
  const { triggerSharedFetch } =
    await import("../../src/app/(dashboard)/dashboard/providers/[id]/components/AntigravityQuotaHud.tsx");
  await triggerSharedFetch();

  // Re-render with fresher initialCache
  act(() => {
    root.render(<AntigravityQuotaHud connectionId="race-A" initialCache={fresherInitialCache} />);
  });

  // Assert regression is blocked: 90% remains visible, older 10% was rejected!
  assert.ok(
    container.textContent.includes("90%"),
    "Fresher initialCache (90%) must NOT be overwritten by delayed older poll (10%)"
  );
  assert.ok(!container.textContent.includes("10%"), "Delayed older response must be discarded");

  global.fetch = origFetch;
  act(() => {
    root.unmount();
  });
  container.remove();
});

test("AntigravityQuotaHud UI & Extension: real quota-hud.js execution, coexistence, and fallback", async () => {
  // Read real quota-hud.js source code from disk
  const extensionPath = path.resolve(
    __dirname,
    "../../local-extensions/quota-timezone/quota-hud.js"
  );
  const extensionScript = fs.readFileSync(extensionPath, "utf8");

  // Build real DOM structure required by quota-hud.js
  const row = document.createElement("div");
  row.className = "group";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  row.appendChild(checkbox);

  const marker = document.createElement("span");
  marker.textContent = "#1";
  row.appendChild(marker);

  const actions = document.createElement("div");
  const toggle = document.createElement("button");
  toggle.setAttribute("role", "switch");
  actions.appendChild(toggle);
  row.appendChild(actions);

  document.body.appendChild(row);

  // Mock window.fetch for extension script
  const origFetch = global.fetch;
  global.fetch = (async (url: string) => {
    if (url.includes("/api/providers")) {
      return {
        ok: true,
        json: async () => ({
          connections: [{ id: "acc-1", provider: "antigravity", priority: 1 }],
        }),
      };
    }
    if (url.includes("/api/usage/provider-limits")) {
      return {
        ok: true,
        json: async () => ({
          caches: {
            "acc-1": {
              quotas: {
                claude_gpt_session: { remainingPercentage: 37, total: 100 },
              },
            },
          },
        }),
      };
    }
    return { ok: false };
  }) as any;

  // Execute the real quota-hud.js in this window
  // Reset window.__omniLocalQuota so script initializes cleanly
  delete (global.window as any).__omniLocalQuota;
  vm.runInThisContext(extensionScript);

  // Wait for extension script's initial refresh() Promise to complete
  await new Promise((resolve) => setTimeout(resolve, 50));

  // 1. Verify extension initially injected its local HUD
  const localHud = row.querySelector("[data-omni-local-hud]");
  assert.ok(localHud, "Extension must inject local HUD when native is not yet present");

  // 2. Now mount native React HUD into the same row
  const nativeHudWrapper = document.createElement("div");
  row.insertBefore(nativeHudWrapper, actions);
  const root = createRoot(nativeHudWrapper);

  act(() => {
    root.render(
      <AntigravityQuotaHud
        connectionId="acc-1"
        initialCache={{
          quotas: {
            claude_gpt_session: { remainingPercentage: 37, total: 100 },
          },
        }}
      />
    );
  });

  // Verify native HUD mounted
  const nativeHud = row.querySelector("[data-omni-native-hud='antigravity']");
  assert.ok(nativeHud, "Native HUD must be mounted");

  // Trigger DOM mutation / render so extension observes native HUD
  await new Promise((resolve) => setTimeout(resolve, 60));

  // 3. Verify coexistence: local HUD must be removed once native HUD is present
  const localHudAfterNative = row.querySelector("[data-omni-local-hud]");
  assert.equal(
    localHudAfterNative,
    null,
    "Extension must remove local HUD when native HUD is present"
  );
  assert.ok(
    row.querySelector("[data-omni-native-hud]"),
    "Only native HUD should remain in the row"
  );

  // 4. Test fallback: unmount native HUD
  act(() => {
    root.unmount();
  });
  nativeHudWrapper.remove();

  // Trigger extension render again
  await new Promise((resolve) => setTimeout(resolve, 60));

  // Verify local HUD is reinjected gracefully when native is gone
  const localHudFallback = row.querySelector("[data-omni-local-hud]");
  assert.ok(localHudFallback, "Extension must re-inject local HUD when native HUD unmounts");

  // Cleanup
  global.fetch = origFetch;
  row.remove();

  if ((global.window as any)?.__omniLocalQuota?.pollTimer) {
    clearInterval((global.window as any).__omniLocalQuota.pollTimer);
  }
  if ((global.window as any)?.__omniLocalQuota?.observer) {
    (global.window as any).__omniLocalQuota.observer.disconnect();
  }
  dom.window.close();
});
