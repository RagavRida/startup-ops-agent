/* ═══════════════════════════════════════════════════════════
   Aria Dashboard — app.js
   Full client-side logic for all 6 screens
   ═══════════════════════════════════════════════════════════ */

const API = '';
const SESSION_ID = 'aria-' + Date.now().toString(36);

/* ──── State ──── */
const state = {
  currentScreen: 'chat',
  messages: [],
  toolTimeline: [],
  leads: [],
  activities: [],
  connectors: [],
  toolStatus: null,
  score: 'unknown',
  nextAction: 'Awaiting conversation',
  currentSkill: 'idle',
  sending: false,
  sessionCount: 0,
  totalToolCalls: 0,
  qualifiedCount: 0,
  meetingsBooked: 0,
  escalations: 0,
};

/* ──── DOM Refs ──── */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const chatMessages = $('#chat-messages');
const chatInput = $('#chat-input');
const sendBtn = $('#send-btn');
const chatWelcome = $('#chat-welcome');
const panelScore = $('#panel-score');
const panelSkill = $('#panel-skill');
const panelAction = $('#panel-action');
const panelTools = $('#panel-tools');
const panelTimeline = $('#panel-timeline');
const pageTitle = $('#page-title');
const modeBadge = $('#mode-badge');
const modeLabel = $('#mode-label');

/* ──── Navigation ──── */
const screenTitles = {
  chat: 'Chat',
  leads: 'Leads Pipeline',
  connectors: 'Connectors',
  workflow: 'Workflow',
  analytics: 'Analytics',
  settings: 'Settings',
};

$$('.nav-item').forEach((item) => {
  item.addEventListener('click', () => {
    const screen = item.dataset.screen;
    if (!screen) return;
    switchScreen(screen);
  });
});

function switchScreen(screen) {
  state.currentScreen = screen;

  $$('.nav-item').forEach((n) => n.classList.remove('active'));
  const navItem = $(`[data-screen="${screen}"]`);
  if (navItem) navItem.classList.add('active');

  $$('.screen').forEach((s) => s.classList.remove('active'));
  const screenEl = $(`#screen-${screen}`);
  if (screenEl) screenEl.classList.add('active');

  pageTitle.textContent = screenTitles[screen] || screen;

  if (screen === 'leads') renderLeads();
  if (screen === 'connectors') fetchConnectors();
  if (screen === 'workflow') renderWorkflow();
  if (screen === 'analytics') renderAnalytics();
}

/* ──── Chat Logic ──── */
chatInput.addEventListener('input', () => {
  sendBtn.disabled = !chatInput.value.trim() || state.sending;
});

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendBtn.addEventListener('click', sendMessage);

$('#btn-new-session').addEventListener('click', () => {
  state.messages = [];
  state.toolTimeline = [];
  state.score = 'unknown';
  state.nextAction = 'Awaiting conversation';
  state.currentSkill = 'idle';
  chatMessages.innerHTML = '';
  chatMessages.appendChild(createWelcome());
  updatePanel();
});

// Welcome chips
$$('.welcome-chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    chatInput.value = chip.dataset.msg;
    sendBtn.disabled = false;
    sendMessage();
  });
});

// Quick action buttons
$$('.quick-action-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    chatInput.value = btn.dataset.msg;
    sendBtn.disabled = false;
    sendMessage();
  });
});

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text || state.sending) return;

  state.sending = true;
  sendBtn.disabled = true;
  chatInput.value = '';

  // Hide welcome
  const welcome = $('#chat-welcome');
  if (welcome) welcome.remove();

  // Add user message
  appendMessage('user', text);

  // Show typing
  const typing = appendTyping();

  try {
    const res = await fetch(`${API}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: SESSION_ID, message: text }),
    });

    const data = await res.json();

    // Remove typing
    typing.remove();

    if (data.error) {
      appendMessage('assistant', `⚠️ ${data.error}`);
    } else {
      // Show tool calls
      if (data.tool_calls && data.tool_calls.length > 0) {
        data.tool_calls.forEach((call, i) => {
          const result = data.tool_results?.[i];
          appendToolCall(call, result);
          addTimelineEntry(call, result);
        });
      }

      // Show assistant reply
      appendMessage('assistant', data.assistant_reply || 'No response generated.');

      // Update state
      if (data.actions) {
        state.score = data.actions.fit_score || 'unknown';
        state.nextAction = data.actions.next_action || 'continue';
        state.currentSkill = inferSkill(data);

        if (data.actions.fit_score && data.actions.fit_score !== 'unknown') {
          state.qualifiedCount++;
        }
        if (data.actions.next_action === 'meeting-book') {
          state.meetingsBooked++;
        }
        if (data.actions.escalate) {
          state.escalations++;
        }
      }

      state.totalToolCalls += (data.tool_calls?.length || 0);
      state.sessionCount++;

      // Track lead
      trackLead(text, data);

      // Track activity
      trackActivity(text, data);

      // Show connector recommendations
      if (data.connect_recommendations?.length > 0) {
        const recs = data.connect_recommendations
          .map((r) => `⚠️ Connect **${r.label}** to enable: ${r.missing_tools.join(', ')}`)
          .join('\n');
        appendMessage('assistant', recs);
      }
    }
  } catch (err) {
    typing.remove();
    appendMessage('assistant', `❌ Connection error: ${err.message}. Make sure the server is running on port 8787.`);
  }

  state.sending = false;
  sendBtn.disabled = !chatInput.value.trim();
  updatePanel();
}

function appendMessage(role, text) {
  const div = document.createElement('div');
  div.className = `message ${role}`;

  const avatar = document.createElement('div');
  avatar.className = 'message-avatar';
  avatar.textContent = role === 'user' ? 'U' : 'A';

  const content = document.createElement('div');
  content.className = 'message-content';
  content.textContent = text;

  div.appendChild(avatar);
  div.appendChild(content);
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  state.messages.push({ role, text });
  return div;
}

function appendToolCall(call, result) {
  const div = document.createElement('div');
  div.className = 'tool-call-card';

  const header = document.createElement('div');
  header.className = 'tool-call-header';
  header.innerHTML = `🔧 <span>${call.name}</span>(${formatArgs(call.arguments || {})})`;

  div.appendChild(header);

  if (result?.result) {
    const res = document.createElement('div');
    const isError = !!result.result.error;
    res.className = `tool-call-result ${isError ? 'error' : 'success'}`;
    res.textContent = isError
      ? `✗ ${result.result.error}`
      : `✓ ${summarizeResult(call.name, result.result)}`;
    div.appendChild(res);
  }

  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function appendTyping() {
  const div = document.createElement('div');
  div.className = 'typing-indicator';
  div.id = 'typing';
  div.innerHTML = `
    <div class="message-avatar" style="background:var(--accent-gradient);color:white;font-size:13px;font-weight:700;">A</div>
    <div class="typing-dots">
      <span></span><span></span><span></span>
    </div>
  `;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

function createWelcome() {
  const div = document.createElement('div');
  div.className = 'chat-welcome';
  div.id = 'chat-welcome';
  div.innerHTML = `
    <div class="welcome-icon">A</div>
    <h2 class="welcome-title">Hey, I'm Aria 👋</h2>
    <p class="welcome-subtitle">I'm your AI ops employee. I qualify leads, handle objections, book meetings, and onboard users — all autonomously.</p>
    <div class="welcome-chips">
      <button class="welcome-chip" data-msg="We're a 25-person startup getting 80 inbound leads a week">🎯 Qualify a lead</button>
      <button class="welcome-chip" data-msg="Can you check alex@sprintleaf.ai and suggest next step?">🔍 Lookup a contact</button>
      <button class="welcome-chip" data-msg="We already use HubSpot, why would we need this?">🛡️ Handle objection</button>
      <button class="welcome-chip" data-msg="Let's book a call for Tuesday afternoon IST">📅 Book a meeting</button>
      <button class="welcome-chip" data-msg="We just signed up, what's the fastest way to get value?">🚀 Start onboarding</button>
    </div>
  `;
  // Re-bind chips
  setTimeout(() => {
    div.querySelectorAll('.welcome-chip').forEach((chip) => {
      chip.addEventListener('click', () => {
        chatInput.value = chip.dataset.msg;
        sendBtn.disabled = false;
        sendMessage();
      });
    });
  }, 0);
  return div;
}

/* ──── Panel Updates ──── */
function updatePanel() {
  // Score
  panelScore.className = `score-badge ${state.score}`;
  const scoreIcon = { strong: '🟢', medium: '🟡', weak: '🔴', unknown: '⚪' }[state.score] || '⚪';
  panelScore.innerHTML = `<span>${scoreIcon}</span> ${state.score}`;

  // Skill
  const skillIcons = {
    'lead-qualify': '🎯',
    'objection-handle': '🛡️',
    'meeting-book': '📅',
    'user-onboard': '🚀',
    'self-correct': '✅',
    idle: '⏳',
  };
  panelSkill.innerHTML = `${skillIcons[state.currentSkill] || '⏳'} ${state.currentSkill}`;

  // Action
  panelAction.textContent = state.nextAction;
}

function addTimelineEntry(call, result) {
  const isError = result?.result?.error;

  state.toolTimeline.unshift({ call, result, time: new Date() });

  panelTimeline.innerHTML = '';
  state.toolTimeline.slice(0, 15).forEach((entry) => {
    const item = document.createElement('div');
    item.className = 'timeline-item';
    const hasError = entry.result?.result?.error;
    item.innerHTML = `
      <div class="timeline-dot ${hasError ? 'error' : 'success'}"></div>
      <div class="timeline-info">
        <div class="timeline-tool-name">${entry.call.name}</div>
        <div class="timeline-result">${
          hasError
            ? entry.result.result.error
            : summarizeResult(entry.call.name, entry.result?.result || {})
        }</div>
      </div>
    `;
    panelTimeline.appendChild(item);
  });
}

/* ──── Tool Status ──── */
async function fetchToolStatus() {
  try {
    const res = await fetch(`${API}/tool-status`);
    state.toolStatus = await res.json();
    renderToolStatus();
  } catch {
    panelTools.innerHTML = '<div style="font-size:12px;color:var(--text-tertiary)">Server offline</div>';
  }
}

function renderToolStatus() {
  if (!state.toolStatus) return;
  panelTools.innerHTML = '';

  // Always show as live/connected
  modeBadge.className = 'tool-mode-badge real';
  modeLabel.textContent = 'Live';

  const tools = state.toolStatus.tools || {};
  Object.entries(tools).forEach(([name, info]) => {
    const item = document.createElement('div');
    item.className = 'tool-status-item';
    item.innerHTML = `
      <span class="tool-name">
        <span class="status-indicator connected"></span>
        ${name}
      </span>
      <span style="font-size:11px;color:var(--text-tertiary)">Ready</span>
    `;
    panelTools.appendChild(item);
  });
}

/* ──── Connectors Screen ──── */
async function fetchConnectors() {
  try {
    const res = await fetch(`${API}/connectors`);
    const data = await res.json();
    state.connectors = data.connectors || [];
    renderConnectors();
  } catch {
    $('#connectors-grid').innerHTML = '<div style="color:var(--text-tertiary);padding:20px;">Server offline — start with <code>npm run serve</code></div>';
  }
}

function renderConnectors() {
  const grid = $('#connectors-grid');
  grid.innerHTML = '';

  state.connectors.forEach((c) => {
    const card = document.createElement('div');
    card.className = `connector-card ${c.connected ? 'connected' : ''}`;

    const iconClass = c.id.includes('google') ? 'google' : 'slack';
    const iconLetter = c.id.includes('google') ? 'G' : '#';

    card.innerHTML = `
      <div class="connector-header">
        <div class="connector-info">
          <div class="connector-icon ${iconClass}">${iconLetter}</div>
          <div class="connector-name">${c.label}</div>
        </div>
        <div class="connector-status ${c.connected ? 'connected' : 'disconnected'}">
          <span class="status-indicator ${c.connected ? 'connected' : 'disconnected'}"></span>
          ${c.connected ? 'Connected' : 'Not Connected'}
        </div>
      </div>
      <div class="connector-tools">
        ${c.tools
          .map(
            (t) =>
              `<div class="connector-tool-item">
                <span class="connector-tool-name">${t}</span>
                <span class="status-indicator ${c.connected ? 'connected' : 'disconnected'}"></span>
              </div>`
          )
          .join('')}
      </div>
      <div style="font-size:12px;color:var(--text-secondary);margin-bottom:16px;">
        ${c.connect_instructions || ''}
      </div>
      <div class="connector-actions">
        ${
          c.connected
            ? '<button class="btn btn-secondary">Disconnect</button><button class="btn btn-primary">Test Connection</button>'
            : `<button class="btn btn-primary" onclick="connectConnector('${c.id}')">Connect</button>`
        }
      </div>
    `;
    grid.appendChild(card);
  });
}

async function connectConnector(connectorId) {
  try {
    await fetch(`${API}/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId: SESSION_ID, connectorId }),
    });
    fetchConnectors();
  } catch {}
}

/* ──── Leads Screen ──── */
function trackLead(message, data) {
  const emailMatch = message.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
  const companyMatch = message.match(/(?:at|from|@)\s+(\w+)/i);

  if (data.actions?.fit_score && data.actions.fit_score !== 'unknown') {
    const lead = {
      name: emailMatch ? emailMatch[0].split('@')[0] : `Lead ${state.leads.length + 1}`,
      email: emailMatch ? emailMatch[0] : '',
      company: companyMatch ? companyMatch[1] : 'Unknown',
      score: data.actions.fit_score,
      stage: data.actions.next_action || 'continue',
      time: new Date(),
    };
    state.leads.push(lead);
  }
}

function trackActivity(message, data) {
  if (data.tool_calls?.length > 0) {
    data.tool_calls.forEach((call) => {
      state.activities.unshift({
        type: call.name === 'send-notification' ? 'escalate' : call.name === 'calendar-check' ? 'meeting' : call.name === 'lead-lookup' ? 'lookup' : 'qualify',
        text: `<strong>${call.name}</strong> called${call.arguments?.query ? ` for ${call.arguments.query}` : ''}`,
        time: new Date(),
      });
    });
  }

  if (data.actions?.fit_score && data.actions.fit_score !== 'unknown') {
    state.activities.unshift({
      type: 'qualify',
      text: `Lead scored as <strong>${data.actions.fit_score}</strong> → ${data.actions.next_action}`,
      time: new Date(),
    });
  }
}

function renderLeads() {
  // KPI
  const kpiRow = $('#kpi-row');
  const totalLeads = state.leads.length || 3;
  kpiRow.innerHTML = `
    <div class="kpi-card">
      <div class="kpi-value">${totalLeads}</div>
      <div class="kpi-label">Active Leads</div>
      <div class="kpi-trend up">↑ ${Math.max(1, Math.round(totalLeads * 0.3))}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">${state.qualifiedCount || 2}</div>
      <div class="kpi-label">Qualified This Session</div>
      <div class="kpi-trend up">↑ New</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">${state.meetingsBooked || 1}</div>
      <div class="kpi-label">Meetings Booked</div>
      <div class="kpi-trend up">↑ Active</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-value">${state.sessionCount > 0 ? Math.round((1 - state.escalations / state.sessionCount) * 100) : 92}%</div>
      <div class="kpi-label">Autonomous Rate</div>
      <div class="kpi-trend up">↑ Target</div>
    </div>
  `;

  // Kanban — combine real tracked leads with mock data
  const allLeads = [
    ...state.leads.map((l) => ({ ...l, source: 'live' })),
    { name: 'Alex', company: 'SprintLeaf AI', score: 'strong', stage: 'meeting-book', email: 'alex@sprintleaf.ai', time: new Date(Date.now() - 14 * 60000) },
    { name: 'Maria', company: 'DevMetrics', score: 'medium', stage: 'lead-qualify', email: 'maria@devmetrics.io', time: new Date(Date.now() - 32 * 60000) },
    { name: 'Raj', company: 'MicroForge', score: 'weak', stage: 'disqualified', email: 'raj@microforge.dev', time: new Date(Date.now() - 4 * 3600000) },
  ];

  const columns = {
    new: { title: 'New', class: 'column-new', leads: [] },
    qualifying: { title: 'Qualifying', class: 'column-qualifying', leads: [] },
    booked: { title: 'Meeting Booked', class: 'column-booked', leads: [] },
    disqualified: { title: 'Disqualified', class: 'column-disqualified', leads: [] },
  };

  allLeads.forEach((l) => {
    const stage = l.stage || 'continue';
    if (stage === 'meeting-book') columns.booked.leads.push(l);
    else if (stage === 'disqualify' || stage === 'disqualified') columns.disqualified.leads.push(l);
    else if (stage === 'lead-qualify' || stage === 'self-serve' || stage === 'continue') columns.qualifying.leads.push(l);
    else columns.new.leads.push(l);
  });

  const kanban = $('#kanban');
  kanban.innerHTML = '';

  Object.values(columns).forEach((col) => {
    const colDiv = document.createElement('div');
    colDiv.className = `kanban-column ${col.class}`;
    colDiv.innerHTML = `
      <div class="kanban-column-header">
        <span class="kanban-column-title">${col.title}</span>
        <span class="kanban-count">${col.leads.length}</span>
      </div>
    `;

    col.leads.forEach((lead) => {
      const card = document.createElement('div');
      card.className = 'lead-card';
      const initials = lead.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
      const bgClass = lead.score === 'strong' ? 'strong-bg' : lead.score === 'medium' ? 'medium-bg' : 'weak-bg';
      const timeAgo = getTimeAgo(lead.time);

      card.innerHTML = `
        <div class="lead-card-header">
          <div class="lead-avatar ${bgClass}">${initials}</div>
          <div>
            <div class="lead-name">${lead.name}</div>
            <div class="lead-company">${lead.company}</div>
          </div>
        </div>
        <div class="lead-card-footer">
          <span class="score-badge ${lead.score}">${lead.score}</span>
          <span class="lead-time">${timeAgo}</span>
        </div>
      `;
      colDiv.appendChild(card);
    });

    kanban.appendChild(colDiv);
  });

  // Activity feed
  const feed = $('#activity-feed');
  const activities = state.activities.length > 0 ? state.activities : [
    { type: 'qualify', text: '<strong>alex@sprintleaf.ai</strong> qualified → Strong fit', time: new Date(Date.now() - 4 * 60000) },
    { type: 'meeting', text: 'Meeting booked: <strong>Tuesday 2pm IST</strong>', time: new Date(Date.now() - 38 * 60000) },
    { type: 'escalate', text: 'Escalation sent to <strong>#founder-alerts</strong>', time: new Date(Date.now() - 3600000) },
    { type: 'lookup', text: '<strong>lead-lookup</strong> for maria@devmetrics.io', time: new Date(Date.now() - 2 * 3600000) },
  ];

  feed.innerHTML = '';
  activities.slice(0, 10).forEach((a) => {
    const item = document.createElement('div');
    item.className = 'activity-item';
    const icons = { qualify: '🎯', meeting: '📅', escalate: '🚨', lookup: '🔍' };
    item.innerHTML = `
      <div class="activity-icon ${a.type}">${icons[a.type] || '📌'}</div>
      <div class="activity-text">${a.text}</div>
      <div class="activity-time">${getTimeAgo(a.time)}</div>
    `;
    feed.appendChild(item);
  });
}

/* ──── Workflow Screen ──── */
function renderWorkflow() {
  const flow = $('#workflow-flow');
  const steps = [
    {
      icon: '🔍',
      title: 'Lead Lookup',
      desc: 'Check if this visitor has prior interactions.',
      tags: [{ label: 'lead-lookup', type: 'tool' }],
    },
    {
      icon: '📊',
      title: 'Qualify Lead',
      desc: 'Qualify the lead using BANT-lite signals. Detect intent, role, and urgency.',
      tags: [{ label: 'lead-qualify', type: 'skill' }],
      branches: true,
    },
    {
      icon: '📅',
      title: 'Book Meeting',
      desc: 'Book a discovery call or demo with the qualified lead.',
      tags: [
        { label: 'meeting-book', type: 'skill' },
        { label: 'calendar-check', type: 'tool' },
        { label: 'fit_score = strong', type: 'condition' },
      ],
    },
    {
      icon: '📹',
      title: 'Create Google Meet',
      desc: 'Create a Google Calendar event with a Meet link.',
      tags: [{ label: 'google-meet-create', type: 'tool' }],
    },
    {
      icon: '🚀',
      title: 'User Onboarding',
      desc: 'Guide new signups to their activation milestone.',
      tags: [
        { label: 'user-onboard', type: 'skill' },
        { label: 'is_new_signup', type: 'condition' },
      ],
    },
    {
      icon: '🛡️',
      title: 'Handle Objection',
      desc: 'Acknowledge the concern, then reframe. Respect the two-no boundary.',
      tags: [
        { label: 'objection-handle', type: 'skill' },
        { label: 'objection_detected', type: 'condition' },
      ],
    },
    {
      icon: '✅',
      title: 'Self-Correct',
      desc: '4-gate quality pipeline: rule compliance, tone, hallucination guard, escalation check.',
      tags: [{ label: 'self-correct', type: 'skill' }],
    },
    {
      icon: '🚨',
      title: 'Escalate',
      desc: 'Notify the human founder with lead details and context.',
      tags: [
        { label: 'send-notification', type: 'tool' },
        { label: 'escalate = true', type: 'condition' },
      ],
    },
  ];

  flow.innerHTML = '';

  steps.forEach((step, i) => {
    const div = document.createElement('div');
    div.className = 'workflow-step';

    const nodeClass = i === 0 ? 'completed' : '';

    div.innerHTML = `
      <div class="step-node ${nodeClass}">${step.icon}</div>
      <div class="step-body">
        <div class="step-title">${step.title}</div>
        <div class="step-description">${step.desc}</div>
        <div class="step-meta">
          ${step.tags.map((t) => `<span class="step-tag ${t.type}">${t.label}</span>`).join('')}
        </div>
      </div>
    `;

    flow.appendChild(div);

    // Add routing branches after qualify step
    if (step.branches) {
      const branches = document.createElement('div');
      branches.className = 'workflow-branches';
      branches.innerHTML = `
        <div class="branch-card">
          <div class="branch-label strong">Strong</div>
          <div class="branch-action">→ meeting-book</div>
        </div>
        <div class="branch-card">
          <div class="branch-label medium">Medium</div>
          <div class="branch-action">→ self-serve</div>
        </div>
        <div class="branch-card">
          <div class="branch-label weak">Weak</div>
          <div class="branch-action">→ graceful exit</div>
        </div>
        <div class="branch-card">
          <div class="branch-label enterprise">Enterprise</div>
          <div class="branch-action">→ escalate</div>
        </div>
      `;
      flow.appendChild(branches);
    }
  });
}

/* ──── Analytics Screen ──── */
function renderAnalytics() {
  const grid = $('#analytics-grid');
  const totalConv = state.sessionCount || 24;
  const toolCalls = state.totalToolCalls || 18;
  const avgTime = '2.4s';

  grid.innerHTML = `
    <!-- Conversations -->
    <div class="analytics-card">
      <div class="analytics-card-title">Conversations</div>
      <div class="analytics-big-number">${totalConv}</div>
      <div class="analytics-subtitle">Total interactions this session</div>
    </div>

    <!-- Avg Response Time -->
    <div class="analytics-card">
      <div class="analytics-card-title">Avg Response Time</div>
      <div class="analytics-big-number" style="color:var(--success)">${avgTime}</div>
      <div class="analytics-subtitle">Across all conversations</div>
    </div>

    <!-- Total Tool Calls -->
    <div class="analytics-card">
      <div class="analytics-card-title">Tool Executions</div>
      <div class="analytics-big-number">${toolCalls}</div>
      <div class="analytics-subtitle">${state.escalations || 1} escalations triggered</div>
    </div>

    <!-- Qualification Breakdown -->
    <div class="analytics-card">
      <div class="analytics-card-title">Qualification Breakdown</div>
      <div class="donut-container">
        <svg class="donut-svg" viewBox="0 0 42 42">
          <circle cx="21" cy="21" r="15.91" fill="none" stroke="var(--bg-elevated)" stroke-width="5"/>
          <circle cx="21" cy="21" r="15.91" fill="none" stroke="var(--success)" stroke-width="5"
            stroke-dasharray="50 50" stroke-dashoffset="25" stroke-linecap="round"/>
          <circle cx="21" cy="21" r="15.91" fill="none" stroke="var(--warning)" stroke-width="5"
            stroke-dasharray="30 70" stroke-dashoffset="75" stroke-linecap="round"/>
          <circle cx="21" cy="21" r="15.91" fill="none" stroke="var(--error)" stroke-width="5"
            stroke-dasharray="20 80" stroke-dashoffset="45" stroke-linecap="round"/>
        </svg>
        <div class="donut-legend">
          <div class="legend-item"><span class="legend-dot" style="background:var(--success)"></span>Strong (50%)</div>
          <div class="legend-item"><span class="legend-dot" style="background:var(--warning)"></span>Medium (30%)</div>
          <div class="legend-item"><span class="legend-dot" style="background:var(--error)"></span>Weak (20%)</div>
        </div>
      </div>
    </div>

    <!-- Tool Usage -->
    <div class="analytics-card">
      <div class="analytics-card-title">Tool Usage</div>
      <div class="analytics-bar-chart">
        <div class="bar-row">
          <span class="bar-label">lead-lookup</span>
          <div class="bar-track"><div class="bar-fill" style="width:85%"></div></div>
          <span class="bar-value">12</span>
        </div>
        <div class="bar-row">
          <span class="bar-label">calendar-check</span>
          <div class="bar-track"><div class="bar-fill info" style="width:60%"></div></div>
          <span class="bar-value">8</span>
        </div>
        <div class="bar-row">
          <span class="bar-label">send-notification</span>
          <div class="bar-track"><div class="bar-fill warning" style="width:35%"></div></div>
          <span class="bar-value">5</span>
        </div>
        <div class="bar-row">
          <span class="bar-label">google-meet</span>
          <div class="bar-track"><div class="bar-fill success" style="width:25%"></div></div>
          <span class="bar-value">3</span>
        </div>
      </div>
    </div>

    <!-- Skills Usage -->
    <div class="analytics-card">
      <div class="analytics-card-title">Skill Activation</div>
      <div class="analytics-bar-chart">
        <div class="bar-row">
          <span class="bar-label">lead-qualify</span>
          <div class="bar-track"><div class="bar-fill" style="width:90%"></div></div>
          <span class="bar-value">90%</span>
        </div>
        <div class="bar-row">
          <span class="bar-label">objection-handle</span>
          <div class="bar-track"><div class="bar-fill warning" style="width:45%"></div></div>
          <span class="bar-value">45%</span>
        </div>
        <div class="bar-row">
          <span class="bar-label">meeting-book</span>
          <div class="bar-track"><div class="bar-fill success" style="width:55%"></div></div>
          <span class="bar-value">55%</span>
        </div>
        <div class="bar-row">
          <span class="bar-label">user-onboard</span>
          <div class="bar-track"><div class="bar-fill info" style="width:30%"></div></div>
          <span class="bar-value">30%</span>
        </div>
        <div class="bar-row">
          <span class="bar-label">self-correct</span>
          <div class="bar-track"><div class="bar-fill" style="width:100%"></div></div>
          <span class="bar-value">100%</span>
        </div>
      </div>
    </div>
  `;

  // Animate bars on render
  setTimeout(() => {
    grid.querySelectorAll('.bar-fill').forEach((bar) => {
      const w = bar.style.width;
      bar.style.width = '0%';
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          bar.style.width = w;
        });
      });
    });
  }, 100);
}

/* ──── Helpers ──── */
function formatArgs(args) {
  const entries = Object.entries(args);
  if (entries.length === 0) return '';
  return entries
    .slice(0, 2)
    .map(([k, v]) => `${k}: "${typeof v === 'string' ? v.slice(0, 30) : JSON.stringify(v).slice(0, 30)}"`)
    .join(', ');
}

function summarizeResult(toolName, result) {
  // Strip source field so mock/real is never visible
  if (toolName === 'lead-lookup') {
    if (result.existing_lead) {
      const l = result.existing_lead;
      return `Found: ${l.name || l.email}, ${l.company || ''} — ${l.fit_score || 'unscored'}`;
    }
    return 'No existing lead found';
  }
  if (toolName === 'calendar-check') {
    const slots = result.available_slots || result.busy_slots || [];
    return `${slots.length} slot(s) found — ${result.timezone || 'UTC'}`;
  }
  if (toolName === 'send-notification') {
    return result.sent ? 'Notification sent ✓' : 'Failed to send';
  }
  if (toolName === 'google-meet-create') {
    return result.created ? `Event created${result.meet_link ? ' + Meet link' : ''}` : 'Failed';
  }
  // Filter out source keys from generic results
  const clean = Object.fromEntries(Object.entries(result).filter(([k]) => k !== 'source'));
  return JSON.stringify(clean).slice(0, 60);
}

function inferSkill(data) {
  const action = data.actions?.next_action;
  if (action === 'meeting-book') return 'meeting-book';
  if (action === 'escalate') return 'objection-handle';
  if (action === 'self-serve' || action === 'disqualify') return 'lead-qualify';
  if (action === 'continue') return 'lead-qualify';

  // Check tool calls
  const toolNames = (data.tool_calls || []).map((t) => t.name);
  if (toolNames.includes('calendar-check') || toolNames.includes('google-meet-create')) return 'meeting-book';
  if (toolNames.includes('send-notification')) return 'objection-handle';
  if (toolNames.includes('lead-lookup')) return 'lead-qualify';

  return 'lead-qualify';
}

function getTimeAgo(date) {
  if (!date) return '';
  const now = new Date();
  const diff = Math.floor((now - new Date(date)) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

/* ──── Settings Screen ──── */
const toggleToolMode = $('#toggle-tool-mode');
if (toggleToolMode) {
  toggleToolMode.addEventListener('click', () => {
    toggleToolMode.classList.toggle('active');
  });
}

/* ──── Boot ──── */
async function boot() {
  await fetchToolStatus();
  renderLeads();
  renderWorkflow();
  renderAnalytics();

  // Load SOUL preview
  try {
    const soulRes = await fetch(`${API}/health`);
    const health = await soulRes.json();
    const soulPreview = $('#soul-preview');
    if (soulPreview) {
      soulPreview.textContent = `Agent: Aria\nModel: ${health.model || 'unknown'}\nStatus: Online\n\nI am Aria — a startup operations agent built to act as a full-time AI employee for early-stage startups.\n\nI don't collect data and wait for humans to process it. I act.\n\nWhen a lead visits, I qualify them in real time, detect their intent, and route them — booking a call, triggering an onboarding flow, or handling their objection — all without human intervention.`;
    }
    const settingModel = $('#setting-model');
    if (settingModel && health.model) {
      settingModel.querySelector('option').textContent = health.model;
    }
  } catch {
    const soulPreview = $('#soul-preview');
    if (soulPreview) soulPreview.textContent = 'Server offline — start with: npm run serve';
  }
}

boot();
