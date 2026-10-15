(() => {
  if (window.__omniLocalQuota) return;
  window.__omniLocalQuota = { version: "1.0.1", status: "loading" };
  const state = { connections: [], caches: {}, pending: null, last: 0 };
  const style =
    document.getElementById("omni-local-quota-style") || document.createElement("style");
  style.id = "omni-local-quota-style";
  style.textContent = `
  /* Cached legacy React nodes remain React-owned; hide rather than remove them. Do not hide native React HUD. */
  [data-agy-quota-hud]:not([data-omni-native-hud]){display:none!important;visibility:hidden!important;pointer-events:none!important}
  [data-omni-local-hud]{display:flex;align-items:center;gap:12px;margin-left:auto;margin-right:16px;flex-shrink:0;flex-wrap:wrap}
  [data-omni-local-gauge]{display:flex;align-items:center;gap:12px;padding:8px 12px;border:1px solid var(--oq-border);background:var(--oq-bg);border-radius:12px;color:var(--oq-color);font:12px system-ui;flex-shrink:0;min-height:62px;box-sizing:border-box}
  .oq-ring{position:relative;width:40px;height:40px;border-radius:50%;background:conic-gradient(var(--oq-color) var(--oq-fill),#8882 0);display:flex;align-items:center;justify-content:center;flex-shrink:0}
  .oq-ring:before{content:'';position:absolute;inset:3px;border-radius:50%;background:var(--oq-center,#fff)}
  .dark .oq-ring{--oq-center:#18181b}.oq-ring span{position:relative;font:700 11px monospace}
  .oq-info{min-width:112px;display:flex;flex-direction:column;gap:4px}.oq-top,.oq-bottom{display:flex;align-items:center;justify-content:space-between;gap:8px}.oq-title{font-weight:700}.oq-small{font:10px monospace;color:#777}.oq-current{font-weight:700;color:var(--oq-color)}
  [data-omni-local-row]{background:transparent!important;transition:none!important}
  `;
  document.head.append(style);
  function countdown(reset) {
    const n = new Date(reset).getTime() - Date.now();
    if (!Number.isFinite(n)) return "—";
    if (n <= 0) return "待刷新";
    const m = Math.ceil(n / 60000),
      h = Math.floor(m / 60);
    return (h ? h + "h " : "") + (m % 60) + "m";
  }
  function quotaItems(cache) {
    const entries = Object.entries(cache?.quotas || {}).map(([name, q]) => ({ ...q, name }));
    return ["claude", "gemini"].flatMap((family) => {
      const qs = entries.filter((q) => q.name.includes(family));
      const week = qs.find((q) => /weekly|seven_day|7d/.test(q.name));
      const current = qs
        .filter((q) => !/weekly|seven_day|7d/.test(q.name))
        .sort(
          (a, b) =>
            Number((family === "claude" ? /sonnet/ : /pro-high/).test(b.name)) -
            Number((family === "claude" ? /sonnet/ : /pro-high/).test(a.name))
        )[0];
      const percent =
        current?.remainingPercentage ??
        (current?.total > 0 ? ((current.total - (current.used || 0)) / current.total) * 100 : null);
      if (!Number.isFinite(percent)) return [];
      return [
        {
          family,
          title: family === "claude" ? "Claude Code" : "Gemini",
          percent: Math.max(0, Math.min(100, Math.round(percent))),
          weekly: Number.isFinite(week?.remainingPercentage)
            ? Math.round(week.remainingPercentage)
            : null,
          reset: current.resetAt,
          weeklyReset: week?.resetAt,
        },
      ];
    });
  }
  function createGauge(item) {
    const box = document.createElement("div");
    box.dataset.omniLocalGauge = item.family;
    const color = item.family === "claude" ? "#f59e0b" : "#06b6d4";
    box.style.cssText = `--oq-color:${color};--oq-border:${color}66;--oq-bg:${color}09;--oq-fill:${item.percent}%`;
    box.innerHTML =
      '<div class="oq-ring"><span></span></div><div class="oq-info"><div class="oq-top"><span class="oq-title"></span><span class="oq-small oq-week"></span></div><div class="oq-bottom"><span class="oq-small">当前: <span class="oq-current"></span></span><span class="oq-small oq-reset"></span></div></div>';
    return box;
  }
  function updateGauge(box, item) {
    const values = {
      ".oq-ring span": item.percent + "%",
      ".oq-title": item.title,
      ".oq-week": "周:" + (item.weekly == null ? "—" : item.weekly + "%"),
      ".oq-current": item.percent + "%",
      ".oq-reset": "⏱" + countdown(item.reset),
    };
    box.style.setProperty("--oq-fill", item.percent + "%");
    for (const [sel, value] of Object.entries(values)) {
      const el = box.querySelector(sel);
      if (el.textContent !== value) el.textContent = value;
    }
  }
  function render() {
    if (!/\/dashboard\/providers\/(antigravity|agy)\/?$/.test(location.pathname)) {
      document.querySelectorAll("[data-omni-local-hud]").forEach((x) => x.remove());
      return;
    }
    let count = 0;
    const priorities = new Map();
    for (const conn of state.connections) {
      const p = String(conn.priority || 0);
      if (priorities.has(p)) priorities.set(p, null);
      else priorities.set(p, conn);
    }
    for (const checkbox of document.querySelectorAll("input[type=checkbox]")) {
      const row = checkbox.closest("div.group");
      if (!row || !row.querySelector("[role=switch]")) continue;
      if (row.querySelector("[data-omni-native-hud]")) {
        row.querySelectorAll("[data-omni-local-hud]").forEach((el) => el.remove());
        continue;
      }
      const marker = [...row.querySelectorAll("span")].find((el) =>
        /^#\d+$/.test(el.textContent.trim())
      );
      if (!marker) continue;
      const conn = priorities.get(marker.textContent.trim().slice(1));
      if (!conn) continue;
      const duplicates = [...row.querySelectorAll("[data-omni-local-hud]")];
      let hud = duplicates[0];
      for (const duplicate of duplicates.slice(1)) duplicate.remove();
      if (conn.quotaVisible === false) {
        hud?.remove();
        continue;
      }
      const items = quotaItems(state.caches[conn.id]);
      if (!items.length) continue;
      row.dataset.omniLocalRow = "";
      if (!hud) {
        hud = document.createElement("div");
        hud.dataset.omniLocalHud = conn.id;
        const actions = [...row.children].find((el) => el.querySelector("[role=switch]"));
        if (!actions) continue;
        row.insertBefore(hud, actions);
      }
      if (hud.dataset.omniLocalHud !== conn.id) {
        hud.replaceChildren();
        hud.dataset.omniLocalHud = conn.id;
      }
      for (const item of items) {
        let box = hud.querySelector(`[data-omni-local-gauge="${item.family}"]`);
        if (!box) {
          box = createGauge(item);
          hud.append(box);
        }
        updateGauge(box, item);
      }
      count++;
    }
    window.__omniLocalQuota.status = count ? "active" : "waiting-for-account-layout";
    window.__omniLocalQuota.accounts = count;
  }
  async function refresh() {
    if (state.pending) return state.pending;
    state.pending = (async () => {
      const responses = await Promise.all([
        fetch("/api/providers?provider=antigravity", { cache: "no-store" }),
        fetch("/api/usage/provider-limits", { cache: "no-store" }),
      ]);
      if (responses.some((r) => !r.ok)) return;
      const [accounts, data] = await Promise.all(responses.map((r) => r.json()));
      state.connections = (accounts.connections || []).filter((c) =>
        ["antigravity", "agy"].includes(c.provider)
      );
      for (const [id, cache] of Object.entries(data.caches || {}))
        if (cache?.quotas && Object.keys(cache.quotas).length) state.caches[id] = cache;
      state.last = Date.now();
      render();
    })()
      .catch((e) => {
        window.__omniLocalQuota.lastError = e.name;
      })
      .finally(() => {
        state.pending = null;
      });
    return state.pending;
  }
  let queued = false;
  const observer = new MutationObserver((records) => {
    if (
      records.every((r) => r.target.nodeType === 1 && r.target.closest?.("[data-omni-local-hud]"))
    )
      return;
    if (!queued) {
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        render();
      });
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  const pollTimer = setInterval(() => {
    if (document.visibilityState === "visible") {
      if (Date.now() - state.last >= 60000) refresh();
      else render();
    }
  }, 5000);
  if (typeof pollTimer === "object" && typeof pollTimer?.unref === "function") {
    pollTimer.unref();
  }

  // Store handles for clean test teardown & lifecycle management
  window.__omniLocalQuota.observer = observer;
  window.__omniLocalQuota.pollTimer = pollTimer;

  refresh();
})();
