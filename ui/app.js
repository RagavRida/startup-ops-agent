const els = {
  tabButtons: Array.from(document.querySelectorAll(".nav-tab")),
  tabs: {
    overview: document.getElementById("tab-overview"),
    skills: document.getElementById("tab-skills"),
    connectors: document.getElementById("tab-connectors"),
    chat: document.getElementById("tab-chat"),
    workflows: document.getElementById("tab-workflows"),
  },
  overviewSkills: document.getElementById("overview-skills"),
  skillsCards: document.getElementById("skills-cards"),
  ariaConnectors: document.getElementById("aria-connectors"),
  claudeConnectors: document.getElementById("claude-connectors"),
  workflowFeed: document.getElementById("workflow-feed"),
  quickChips: document.getElementById("quick-chips"),
  chatMsgs: document.getElementById("chat-msgs"),
  chatInput: document.getElementById("chat-input"),
  chatSend: document.getElementById("chat-send"),
  chatSubtitle: document.getElementById("chat-subtitle"),
  stats: {
    leads: document.getElementById("stat-leads"),
    meetings: document.getElementById("stat-meetings"),
    objections: document.getElementById("stat-objections"),
    escalations: document.getElementById("stat-escalations"),
  },
};

function nowLabel() {
  return "just now";
}

function timeAgoLabel(ts) {
  const t = typeof ts === "number" ? ts : Date.now();
  const seconds = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function safeText(s) {
  return String(s ?? "");
}

function switchTab(tabName) {
  Object.entries(els.tabs).forEach(([name, el]) => {
    if (!el) return;
    el.classList.toggle("visible", name === tabName);
  });
  els.tabButtons.forEach((btn) => {
    const isActive = btn.dataset.tab === tabName;
    btn.classList.toggle("active", isActive);
  });
}

function addMessage({ role, text, kind = "normal", time = nowLabel() }) {
  const wrap = document.createElement("div");
  wrap.className = "msg";

  const avatar = document.createElement("div");
  avatar.className = "avatar";

  const bubble = document.createElement("div");
  bubble.className = `bubble${kind === "aria" ? " aria" : ""}`;
  bubble.textContent = text;

  const timeEl = document.createElement("div");
  timeEl.className = "msg-time";
  timeEl.textContent = time;

  if (role === "user") {
    avatar.style.background = "#E6F1FB";
    avatar.style.color = "#185FA5";
    avatar.textContent = "R";
    wrap.style.justifyContent = "flex-end";
    const rightWrap = document.createElement("div");
    const content = document.createElement("div");
    content.appendChild(bubble);
    content.appendChild(timeEl);
    rightWrap.appendChild(content);
    rightWrap.appendChild(avatar);
    wrap.appendChild(rightWrap);
  } else {
    avatar.style.background = "#E1F5EE";
    avatar.style.color = "#0F6E56";
    avatar.textContent = "A";
    wrap.appendChild(avatar);
    const content = document.createElement("div");
    content.appendChild(bubble);
    content.appendChild(timeEl);
    wrap.appendChild(content);
  }

  els.chatMsgs.appendChild(wrap);
  els.chatMsgs.scrollTop = els.chatMsgs.scrollHeight;
  return wrap;
}

function removeProcessingIfPresent() {
  const bubbles = Array.from(document.querySelectorAll(".bubble.aria"));
  const last = bubbles[bubbles.length - 1];
  if (last && /Processing/i.test(last.textContent)) {
    const msg = last.closest(".msg");
    if (msg) msg.remove();
    return true;
  }
  return false;
}

const session = {
  id: "ui-" + Math.random().toString(36).slice(2),
  stats: { leads: 0, meetings: 0, objections: 0, escalations: 0 },
};

function renderStats() {
  els.stats.leads.textContent = String(session.stats.leads);
  els.stats.meetings.textContent = String(session.stats.meetings);
  els.stats.objections.textContent = String(session.stats.objections);
  els.stats.escalations.textContent = String(session.stats.escalations);
}

function renderSkillsOverview(activeSkillNames = new Set()) {
  const skills = [
    {
      key: "lead-qualify",
      iconBg: "#E1F5EE",
      iconColor: "#0F6E56",
      desc: "ICP fit scoring and routing logic",
      tools: "tools/lead-lookup",
    },
    {
      key: "objection-handle",
      iconBg: "#E6F1FB",
      iconColor: "#185FA5",
      desc: "Playbooks with safe escalation",
      tools: "tools/send-notification",
    },
    {
      key: "user-onboard",
      iconBg: "#FBEAF0",
      iconColor: "#993556",
      desc: "Activation-first onboarding",
      tools: "tools/send-notification",
    },
    {
      key: "meeting-book",
      iconBg: "#FAEEDA",
      iconColor: "#854F0B",
      desc: "Conversion to meeting requests",
      tools: "tools/calendar-check · google-meet-create",
    },
    {
      key: "self-correct",
      iconBg: "#EEEDFE",
      iconColor: "#534AB7",
      desc: "Response quality validation",
      tools: "internal validator",
    },
  ];

  els.overviewSkills.innerHTML = "";
  skills.forEach((s) => {
    const active = activeSkillNames.has(s.key);
    const card = document.createElement("div");
    card.className = `skill-card${active ? " active" : ""}`;
    card.innerHTML = `
      <div class="skill-top">
        <div class="skill-icon" style="background:${s.iconBg}; color:${s.iconColor};">
          <span style="font-size:13px;font-weight:900;">${iconGlyphForSkill(s.key)}</span>
        </div>
        <div class="skill-badge ${active ? "active" : "idle"}">${active ? "active" : "idle"}</div>
      </div>
      <div class="skill-name">${s.key}</div>
      <div class="skill-desc">${s.desc}</div>
      <div class="skill-tools">${s.tools}</div>
    `;
    card.addEventListener("click", () => {
      sendPrompt(`Show me the ${s.key} skill spec for Aria startup ops agent.`);
    });
    els.overviewSkills.appendChild(card);
  });
}

function iconGlyphForSkill(skillKey) {
  switch (skillKey) {
    case "lead-qualify":
      return "L";
    case "objection-handle":
      return "!";
    case "user-onboard":
      return "U";
    case "meeting-book":
      return "M";
    case "self-correct":
      return "✓";
    default:
      return "·";
  }
}

function renderSkillsCards() {
  const cards = [
    {
      key: "lead-qualify",
      title: "lead-qualify",
      tools: ["tools/lead-lookup"],
      desc: "Scores inbound leads on ICP fit. Routes high-fit to meeting-book, low-fit to nurture queue. Escalates ambiguous signals to human via Slack.",
      iconBg: "#E1F5EE",
      iconColor: "#0F6E56",
    },
    {
      key: "objection-handle",
      title: "objection-handle",
      tools: ["tools/send-notification"],
      desc: "Runs objection playbooks for pricing, timing, and competitor questions. Hard boundaries prevent unsafe commitments. Escalates outside-scope requests.",
      iconBg: "#E6F1FB",
      iconColor: "#185FA5",
    },
    {
      key: "meeting-book",
      title: "meeting-book",
      tools: ["tools/calendar-check", "google-meet-create"],
      desc: "Checks calendar availability and creates structured meeting requests. Falls back to calendar event if Meet link generation is restricted.",
      iconBg: "#FAEEDA",
      iconColor: "#854F0B",
    },
    {
      key: "user-onboard",
      title: "user-onboard",
      tools: ["tools/send-notification"],
      desc: "Activation-first onboarding guidance. Walks new users through first value moment. Triggers milestone notifications via Slack.",
      iconBg: "#FBEAF0",
      iconColor: "#993556",
    },
    {
      key: "self-correct",
      title: "self-correct",
      tools: ["internal validator"],
      desc: "Validates response quality before delivery. Checks tone, boundary compliance, and factual grounding. Rewrites or flags for human review.",
      iconBg: "#EEEDFE",
      iconColor: "#534AB7",
    },
  ];

  els.skillsCards.innerHTML = "";
  cards.forEach((c) => {
    const wrapper = document.createElement("div");
    wrapper.className = "skill-card";
    wrapper.innerHTML = `
      <div class="skill-top">
        <div class="skill-icon" style="background:${c.iconBg}; color:${c.iconColor};">
          <span style="font-size:13px;font-weight:900;">${iconGlyphForSkill(c.key)}</span>
        </div>
        <div class="skill-badge active">active</div>
      </div>
      <div style="margin-top:10px;">
        <div class="skill-name">${c.title}</div>
        <div class="skill-desc">${c.desc}</div>
        <div class="skill-tools">${c.tools.join(" · ")}</div>
        <div class="cta-row" style="margin:12px 0 0; gap:8px;">
          <button class="cta" data-prompt="${escapeAttr(`Show me the ${c.key} skill YAML/spec for Aria startup ops agent.`)}">View skill ↗</button>
        </div>
      </div>
    `;
    wrapper.querySelector("[data-prompt]")?.addEventListener("click", (e) => {
      sendPrompt(e.currentTarget.dataset.prompt);
    });
    els.skillsCards.appendChild(wrapper);
  });
}

function escapeAttr(s) {
  return String(s).replaceAll('"', "&quot;");
}

function renderConnectorsPlaceholder() {
  // Aria (service-account integrations) are dynamic via /tool-status.
  els.ariaConnectors.innerHTML = "";

  const aria = [
    { key: "lead-lookup", name: "Google Sheets", logoBg: "#E1F5EE", dot: "live", statusEl: null, status: "Lead CRM tracker" },
    { key: "calendar-check", name: "Google Calendar", logoBg: "#E6F1FB", dot: "live", statusEl: null, status: "Availability + events" },
    { key: "send-notification", name: "Slack Webhook", logoBg: "#FAEEDA", dot: "live", statusEl: null, status: "Escalations" },
    { key: "google-meet-create", name: "Google Meet", logoBg: "#EEEDFE", dot: "warn", statusEl: null, status: "Meet link generation" },
  ];

  aria.forEach((c) => {
    const card = document.createElement("div");
    card.className = "connector-card";
    card.dataset.toolKey = c.key;
    card.innerHTML = `
      <div class="connector-top">
        <div class="connector-logo" style="background:${c.logoBg};">
          <span style="font-weight:900;color:rgba(0,0,0,.35);">${c.name.split(" ")[0].slice(0,1)}</span>
        </div>
        <div style="flex:1;">
          <div class="connector-name">${c.name}</div>
          <div class="connector-status">${c.status}</div>
        </div>
      </div>
      <div class="connector-dot ${c.dot}" aria-hidden="true"></div>
    `;
    els.ariaConnectors.appendChild(card);
  });

  // Claude (built-in) connectors are shown distinctly.
  els.claudeConnectors.innerHTML = "";
  const claude = [
    { name: "Gmail", status: "Connected · read/send", dot: "live", logoBg: "#E6F1FB", statusColor: "#185FA5" },
    { name: "Google Calendar", status: "Connected · gcal MCP", dot: "live", logoBg: "#E6F1FB", statusColor: "#185FA5" },
    { name: "Add connector", status: "Slack, Notion, Linear…", dot: "idle" },
  ];

  claude.forEach((c) => {
    const card = document.createElement("div");
    card.className = `connector-card connector-mcp`;
    card.innerHTML = `
      <div class="connector-top">
        <div class="connector-logo" style="background:${c.logoBg || 'rgba(255,255,255,.02)'};">
          <span style="font-weight:900;color:rgba(0,0,0,.35);">${c.name.split(" ")[0].slice(0,1)}</span>
        </div>
        <div style="flex:1;">
          <div class="connector-name">${c.name}</div>
          <div class="connector-status" style="color:${c.statusColor || undefined};">${c.status}</div>
        </div>
      </div>
      <div class="connector-dot ${c.dot === "idle" ? "idle" : "live"}" aria-hidden="true"></div>
    `;
    els.claudeConnectors.appendChild(card);
  });
}

async function refreshToolStatus() {
  try {
    const res = await fetch("/tool-status");
    const data = await res.json();
    const tools = data.tools || {};

    // Update Aria cards by tool connection.
    els.ariaConnectors.querySelectorAll(".connector-card").forEach((card) => {
      const toolKey = card.dataset.toolKey;
      const info = tools[toolKey];
      const connected = Boolean(info?.connected);
      const dot = card.querySelector(".connector-dot");
      if (!dot) return;

      dot.classList.remove("live", "warn", "idle");
      if (connected) dot.classList.add("live");
      else dot.classList.add("idle");

      const statusEl = card.querySelector(".connector-status");
      if (statusEl) {
        const base = statusEl.textContent;
        statusEl.textContent = connected ? base : `${base} · not connected`;
      }
    });
  } catch {
    // Ignore; UI still works with placeholders.
  }
}

function deriveActiveSkillsFromTools(toolCalls = [], toolResults = []) {
  const names = new Set();
  const lastCall = toolCalls.length ? toolCalls[toolCalls.length - 1]?.name : null;

  if (lastCall === "lead-lookup") names.add("lead-qualify");
  else if (lastCall === "send-notification") names.add("objection-handle");
  else if (lastCall === "calendar-check" || lastCall === "google-meet-create") names.add("meeting-book");
  else if (lastCall) names.add("self-correct"); // fallback
  else names.add("user-onboard");

  names.add("self-correct");
  return names;
}

function deriveWorkflowStatus(toolCalls = [], toolResults = [], actions = {}) {
  const escalated = Boolean(actions?.escalate);
  if (escalated) return { status: "escalated", pillClass: "pill-escalated", icon: "⬆" };

  const meet = toolResults.find((r) => r?.name === "google-meet-create");
  if (meet?.result?.created) return { status: "booked", pillClass: "pill-booked", icon: "↗" };

  const cal = toolResults.find((r) => r?.name === "calendar-check");
  if (cal) return { status: "in progress", pillClass: "pill-inprogress", icon: "✓" };

  const lead = toolResults.find((r) => r?.name === "lead-lookup");
  if (lead?.result?.existing_lead) return { status: "resolved", pillClass: "pill-resolved", icon: "⚡" };
  if (lead && !lead.result.existing_lead) return { status: "nurture", pillClass: "pill-nurture", icon: "↗" };

  if (toolCalls.length) return { status: "in progress", pillClass: "pill-inprogress", icon: "✓" };
  return { status: "nurture", pillClass: "pill-nurture", icon: "↗" };
}

function workflowLabelFromCall(toolCalls = [], toolResults = []) {
  const parts = toolCalls.map((c) => c?.name).filter(Boolean);
  if (parts.length === 0) return "—";

  // Add a tiny bit of context when present.
  const lead = toolResults.find((r) => r?.name === "lead-lookup");
  if (lead?.result?.existing_lead) {
    parts[0] = `${parts[0]} · ${lead.result.existing_lead.email || lead.result.existing_lead.name || "lead"}`;
  }

  const leadNo = toolResults.find((r) => r?.name === "lead-lookup");
  if (leadNo && leadNo?.result && leadNo.result.existing_lead == null) {
    parts.push("→ nurture");
  }

  return parts.join(" → ");
}

function addWorkflowItem({ toolCalls, toolResults, actions }) {
  const st = deriveWorkflowStatus(toolCalls, toolResults, actions);
  const label = workflowLabelFromCall(toolCalls, toolResults);
  const createdAt = Date.now();

  const item = document.createElement("div");
  item.className = "wf-item";
  item.innerHTML = `
    <div class="wf-icon">${st.icon}</div>
    <div class="wf-label">${safeText(label)}</div>
    <span class="wf-status-pill ${st.pillClass}">${st.status}</span>
    <div class="wf-time">${timeAgoLabel(createdAt)}</div>
  `;
  els.workflowFeed.prepend(item);
}

function updateSessionCounters({ toolCalls = [], toolResults = [], actions = {} }) {
  let leads = 0;
  let meetings = 0;
  let objections = 0;
  let escalations = 0;

  const lead = toolResults.find((t) => t?.name === "lead-lookup");
  if (lead?.result?.existing_lead) leads += 1;

  const meet = toolResults.find((t) => t?.name === "google-meet-create");
  if (meet?.result?.created) meetings += 1;

  // Meetings can be booked even if Meet link creation fails but meeting-book was planned.
  if (actions?.next_action === "meeting-book") meetings += 0; // keep conservative

  const hasSendNotification = toolCalls.some((c) => c?.name === "send-notification");
  if (hasSendNotification) {
    if (actions?.escalate) escalations += 1;
    else objections += 1;
  } else if (actions?.escalate) {
    escalations += 1;
  }

  session.stats.leads += leads;
  session.stats.meetings += meetings;
  session.stats.objections += objections;
  session.stats.escalations += escalations;

  renderStats();
  return { leads, meetings, objections, escalations };
}

function renderConnectRecommendations(parentEl, connect_recommendations = []) {
  if (!Array.isArray(connect_recommendations) || connect_recommendations.length === 0) return;

  const row = document.createElement("div");
  row.className = "chip-row";

  connect_recommendations.forEach((r) => {
    const missing = Array.isArray(r.missing_tools) ? r.missing_tools.join(", ") : "";
    const btn = document.createElement("button");
    btn.className = "chip";
    btn.textContent = `Connect ${r.label}${missing ? ` (${missing})` : ""}`;
    btn.addEventListener("click", async () => {
      try {
        const res = await fetch("/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: session.id, connectorId: r.connector_id }),
        });
        const data = await res.json();
        addMessage({
          role: "assistant",
          kind: "aria",
          text: data?.message || `Selected connector: ${r.label}.`,
          time: nowLabel(),
        });
      } catch {
        addMessage({
          role: "assistant",
          kind: "aria",
          text: `Could not call /connect for ${r.label}. Connect using the instructions shown in this chat.`,
          time: nowLabel(),
        });
      }
    });
    row.appendChild(btn);
  });

  const bubbleContent = parentEl?.querySelector?.(".bubble")?.parentElement;
  (bubbleContent || parentEl).appendChild(row);
}

async function callChatBackend(message) {
  const res = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: session.id, message }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.error || `HTTP ${res.status}`);
  }
  return res.json();
}

async function sendPrompt(promptText, { addUserMessage = true } = {}) {
  const text = String(promptText || "").trim();
  if (!text) return;

  switchTab("chat");

  if (addUserMessage) {
    addMessage({ role: "user", text, time: nowLabel() });
  }

  // Placeholder while waiting for the backend.
  const placeholder = addMessage({
    role: "assistant",
    kind: "aria",
    text: "Processing with lead-qualify and self-correct… routing to best next action.",
    time: nowLabel(),
  });

  try {
    const data = await callChatBackend(text);
    // Replace placeholder content
    placeholder.querySelector(".bubble")?.classList.add("aria");
    placeholder.querySelector(".bubble").textContent = safeText(data.assistant_reply || "No response");
    const toolsUsed = Array.isArray(data.tool_calls) ? data.tool_calls.map((t) => t?.name).filter(Boolean).join(", ") : "";

    // Keep a small routing trace in message text.
    if (toolsUsed) {
      placeholder.querySelector(".bubble").textContent += `\n\n(Tools used: ${toolsUsed})`;
    }

    const toolCalls = Array.isArray(data.tool_calls) ? data.tool_calls : [];
    const toolResults = Array.isArray(data.tool_results) ? data.tool_results : [];
    updateSessionCounters({ toolCalls, toolResults, actions: data.actions || {} });
    addWorkflowItem({ toolCalls, toolResults, actions: data.actions || {} });

    const activeSkillNames = deriveActiveSkillsFromTools(toolCalls, toolResults);
    renderSkillsOverview(activeSkillNames);

    if (data.connect_recommendations && data.connect_recommendations.length > 0) {
      renderConnectRecommendations(placeholder, data.connect_recommendations);
    }

    if (els.chatSubtitle) {
      const subtitleTools = toolCalls.map((t) => t?.name).filter(Boolean).slice(0, 4);
      els.chatSubtitle.textContent = subtitleTools.length ? `Skills: ${subtitleTools.join(" · ")}` : "Skills: lead-qualify · objection-handle · meeting-book";
    }
  } catch (err) {
    placeholder.querySelector(".bubble").textContent = `Error: ${err?.message || "unknown error"}`;
  }
}

function injectMsg(txt) {
  sendPrompt(txt, { addUserMessage: true });
}

function wireUiEvents() {
  els.tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  els.chatSend.addEventListener("click", () => {
    const msg = els.chatInput.value.trim();
    if (!msg) return;
    els.chatInput.value = "";
    sendPrompt(msg, { addUserMessage: true });
  });

  els.chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      els.chatSend.click();
    }
  });

  // Overview CTAs.
  document.querySelectorAll("[data-go='chat']").forEach((btn) => {
    btn.addEventListener("click", () => switchTab("chat"));
  });
  document.querySelectorAll("[data-prompt]").forEach((btn) => {
    btn.addEventListener("click", () => sendPrompt(btn.dataset.prompt, { addUserMessage: true }));
  });
}

function renderQuickChips() {
  if (!els.quickChips) return;
  const chips = [
    "Qualify alex@sprintleaf.ai and suggest next step",
    "Handle pricing objection for an enterprise buyer",
    "Book a meeting tomorrow 3pm",
    "Check availability for the next 7 days and propose 2 times",
  ];

  chips.forEach((t) => {
    const b = document.createElement("button");
    b.className = "chip";
    b.textContent = t;
    b.addEventListener("click", () => injectMsg(t));
    els.quickChips.appendChild(b);
  });
}

function initChat() {
  els.chatMsgs.innerHTML = "";
  addMessage({
    role: "assistant",
    kind: "aria",
    text: "Hi! I'm Aria, your startup ops agent. Share a lead email or describe what you need — I'll qualify, handle objections, or book a meeting.",
    time: nowLabel(),
  });
}

async function init() {
  // Initial state
  renderStats();
  renderSkillsCards();
  renderConnectorsPlaceholder();
  renderQuickChips();
  initChat();

  // Overview skills initial view
  renderSkillsOverview(new Set(["lead-qualify", "meeting-book", "objection-handle", "self-correct"]));

  wireUiEvents();
  switchTab("overview");

  await refreshToolStatus();
}

// Expose sendPrompt for any inline/onClick usage.
window.sendPrompt = (promptText) => sendPrompt(promptText, { addUserMessage: true });
window.switchTab = (tabName) => switchTab(tabName);
window.injectMsg = (txt) => injectMsg(txt);

init();

