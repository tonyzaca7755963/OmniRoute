import test from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

// Setup global browser DOM environment via JSDOM
const dom = new JSDOM("<!doctype html><html><body></body></html>");
global.window = dom.window as any;
global.document = dom.window.document;
Object.defineProperty(global, "navigator", {
  value: dom.window.navigator,
  configurable: true,
});
global.HTMLElement = dom.window.HTMLElement;

import React, { act } from "react";
import { createRoot } from "react-dom/client";

import AntigravityQuotaHud from "../../src/app/(dashboard)/dashboard/providers/[id]/components/AntigravityQuotaHud.tsx";

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

test("AntigravityQuotaHud UI: reacts immediately to prop updates and connectionId switching", () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);

  const conn1Cache = {
    quotas: {
      claude_gpt_session: { remainingPercentage: 25, total: 100 },
    },
  };

  act(() => {
    root.render(<AntigravityQuotaHud connectionId="conn-1" initialCache={conn1Cache} />);
  });

  assert.ok(container.textContent.includes("25%"));
  assert.ok(!container.textContent.includes("85%"));

  // Switch connectionId to conn-2 with different cache
  const conn2Cache = {
    quotas: {
      claude_gpt_session: { remainingPercentage: 85, total: 100 },
    },
  };

  act(() => {
    root.render(<AntigravityQuotaHud connectionId="conn-2" initialCache={conn2Cache} />);
  });

  assert.ok(container.textContent.includes("85%"), "Must switch to conn-2's 85%");
  assert.ok(!container.textContent.includes("25%"), "Must not display stale conn-1 data");

  // Simulate manual refresh: same connectionId, new cache passed from parent
  const refreshedConn2Cache = {
    quotas: {
      claude_gpt_session: { remainingPercentage: 92, total: 100 },
    },
  };

  act(() => {
    root.render(<AntigravityQuotaHud connectionId="conn-2" initialCache={refreshedConn2Cache} />);
  });

  assert.ok(container.textContent.includes("92%"), "Must update on manual refresh");

  act(() => {
    root.unmount();
  });
  container.remove();
});

test("AntigravityQuotaHud UI: coexistence with local-extensions quota-hud.js", () => {
  // Setup HTML structure simulating provider page connection row
  const row = document.createElement("div");
  row.className = "group";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  row.appendChild(checkbox);

  const toggle = document.createElement("button");
  toggle.setAttribute("role", "switch");
  row.appendChild(toggle);

  const marker = document.createElement("span");
  marker.textContent = "#1";
  row.appendChild(marker);

  // Mount native HUD inside the row
  const nativeHudWrapper = document.createElement("div");
  row.appendChild(nativeHudWrapper);
  const root = createRoot(nativeHudWrapper);

  act(() => {
    root.render(
      <AntigravityQuotaHud
        connectionId="test-id"
        initialCache={{
          quotas: {
            claude_gpt_session: { remainingPercentage: 60, total: 100 },
          },
        }}
      />
    );
  });

  document.body.appendChild(row);

  // Verify native HUD element is present with marker
  const nativeEl = row.querySelector("[data-omni-native-hud='antigravity']");
  assert.ok(nativeEl, "Native HUD element must be mounted");

  // Verify quota-hud.js CSS selector rule does NOT hide native HUD
  // Selector in quota-hud.js: [data-agy-quota-hud]:not([data-omni-native-hud])
  assert.equal(
    nativeEl.matches("[data-agy-quota-hud]:not([data-omni-native-hud])"),
    false,
    "Native HUD must not match legacy hide selector"
  );

  // Verify quota-hud.js condition skips injecting duplicate local HUD when native HUD is present
  const hasSwitch = Boolean(row.querySelector("[role=switch]"));
  const hasNative = Boolean(row.querySelector("[data-omni-native-hud]"));
  const shouldSkipExtensionInject = !row || !hasSwitch || hasNative;
  assert.equal(
    shouldSkipExtensionInject,
    true,
    "Extension script must skip row when native HUD is already present"
  );

  act(() => {
    root.unmount();
  });
  row.remove();
});
