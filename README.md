<p align="center">
  <h1 align="center">Aria</h1>
  <p align="center">
    <strong>The AI employee your startup can't afford to not have.</strong>
  </p>
  <p align="center">
    Aria autonomously qualifies leads, onboards users, handles objections, and books meetings — so founders can focus on building.
  </p>
  <p align="center">
    <a href="https://github.com/open-gitagent/gitagent"><img src="https://img.shields.io/badge/gitagent-v0.1.0-7c3aed?style=for-the-badge" alt="gitagent"></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-22c55e?style=for-the-badge" alt="MIT License"></a>
    <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-18%2B-3b82f6?style=for-the-badge" alt="Node.js 18+"></a>
    <a href="https://openrouter.ai"><img src="https://img.shields.io/badge/LLM-OpenRouter-f59e0b?style=for-the-badge" alt="OpenRouter"></a>
  </p>
</p>

<br>

## Why Aria Exists

Early-stage startups need an SDR, an onboarding specialist, and an ops coordinator. They can afford zero of them.

Aria fills that gap. She's not a chatbot that collects form data — she's a structured, version-controlled AI agent that **acts**: qualifying leads against your ICP in real time, routing conversations to the right workflow, handling pricing objections with tested playbooks, and booking meetings directly on your calendar.

Every decision she makes is traceable through git history. Every behavior is defined in markdown. Every skill is composable and forkable.

> **Built for the [GitAgent Hackathon](https://github.com/open-gitagent/gitagent)** by [Raghav Rida](https://github.com/RagavRida)

<br>

## System Architecture

```mermaid
graph TB
    subgraph Clients["Client Layer"]
        WEB["🌐 Web Dashboard<br><i>6-tab UI at localhost:8787</i>"]
        CLI["💻 Interactive CLI<br><i>Terminal chat</i>"]
        MCP["🔌 MCP Protocol<br><i>IDE integration</i>"]
    end

    subgraph Server["Runtime Layer"]
        API["server.js<br><i>HTTP API</i>"]
        
        subgraph Core["AI Reasoning Core"]
            SOUL["SOUL.md<br><i>Personality & voice</i>"]
            RULES["RULES.md<br><i>Behavioral guards</i>"]
            KB["product-context.md<br><i>Domain knowledge</i>"]
        end
        
        subgraph Skills["Skill Engine"]
            S1["lead-qualify"]
            S2["user-onboard"]
            S3["objection-handle"]
            S4["meeting-book"]
            S5["self-correct"]
        end
        
        RUNTIME["tool-runtime.js<br><i>Mock ↔ Real execution</i>"]
    end

    subgraph Integrations["Live Integrations"]
        GS["Google Sheets<br><i>CRM & lead data</i>"]
        GC["Google Calendar<br><i>Scheduling + Meet</i>"]
        SL["Slack<br><i>Escalation alerts</i>"]
    end

    WEB --> API
    CLI --> API
    MCP --> API
    API --> Core
    Core --> Skills
    Skills --> RUNTIME
    RUNTIME --> GS
    RUNTIME --> GC
    RUNTIME --> SL

    style Clients fill:#1e1b4b,stroke:#6366f1,color:#e0e7ff
    style Server fill:#0c1220,stroke:#3b82f6,color:#dbeafe
    style Core fill:#1a1a2e,stroke:#8b5cf6,color:#e0e7ff
    style Skills fill:#1a1a2e,stroke:#8b5cf6,color:#e0e7ff
    style Integrations fill:#0f1d15,stroke:#22c55e,color:#dcfce7
```

### Request Flow

Every user message goes through a **3-phase pipeline**:

```mermaid
sequenceDiagram
    participant U as User
    participant S as Server
    participant LLM as OpenRouter LLM
    participant T as Tool Runtime

    U->>S: POST /chat { message }
    
    Note over S,LLM: Phase 1 — Plan
    S->>LLM: System prompt + skills + message
    LLM-->>S: Draft reply + tool calls

    Note over S,T: Phase 2 — Execute
    S->>T: Run tools (Sheets / Calendar / Slack)
    T-->>S: Tool results

    Note over S,LLM: Phase 3 — Finalize
    S->>LLM: Draft + tool results → compose final reply
    LLM-->>S: Validated response + actions

    S-->>U: { reply, tool_results, actions, fit_score }
```

<br>

## Core Skills

| Skill | Purpose | How It Works |
|:------|:--------|:-------------|
| **lead-qualify** | ICP scoring & intent detection | Runs BANT-lite analysis → outputs `strong` / `medium` / `weak` fit score |
| **user-onboard** | Activation-first onboarding | Guides to milestone: clone → configure → validate → first conversation |
| **objection-handle** | Sales objection playbooks | Covers pricing, timing, competitor, trust, and authority objections |
| **meeting-book** | Calendar coordination | Checks availability via Google Calendar, confirms timezone + link |
| **self-correct** | Response quality gate | 4-gate pipeline: rule compliance → tone → hallucination → escalation |

<br>

## Connected Tools

| Tool | Mock Mode | Real Mode |
|:-----|:----------|:----------|
| `lead-lookup` | Returns sample leads from `mock/company-data.json` | Queries Google Sheets CRM |
| `calendar-check` | Returns preset available slots | Queries Google Calendar free/busy API |
| `send-notification` | Logs to console | Posts to Slack via webhook |
| `google-meet-create` | Returns mock event link | Creates Calendar event + Meet link |

All tools are **MCP-compatible** and exposed via `npm run serve:mcp` for IDE integration.

<br>

## Quick Start

**Prerequisites:** Node.js 18+ · [OpenRouter API key](https://openrouter.ai/keys)

```bash
# 1. Clone
git clone https://github.com/RagavRida/startup-ops-agent.git
cd startup-ops-agent

# 2. Install
npm install

# 3. Configure
cp .env.example .env
# Edit .env → add your OPENROUTER_API_KEY

# 4. Launch
npm run serve
# Open http://localhost:8787
```

That's it. The dashboard runs with mock data out of the box — zero external setup needed.

<br>

## Run Modes

| Command | What It Does |
|:--------|:-------------|
| `npm run serve` | Start HTTP server + web dashboard on port 8787 |
| `npm run live` | Interactive CLI chat with Aria |
| `npm run demo` | Automated walkthrough of all skills |
| `npm run demo:startup` | Real-time startup ops scenario |
| `npm run serve:mcp` | MCP tool server for IDE integration |
| `npm run test` | Full test suite |
| `npm run quick` | Quick smoke test |

### API Endpoints

```
GET  /              → Web dashboard
GET  /health        → { ok: true, model: "..." }
GET  /connectors    → Integration status
POST /chat          → { sessionId, message } → AI response
POST /connect       → { sessionId, connectorId } → Activate connector
```

<br>

## Project Structure

```
startup-ops-agent/
├── agent.yaml                   # Agent manifest — model, skills, tools
├── SOUL.md                      # Aria's identity and voice
├── RULES.md                     # Hard behavioral constraints
│
├── skills/
│   ├── lead-qualify/SKILL.md    # BANT-lite lead scoring
│   ├── user-onboard/SKILL.md   # Activation onboarding flow
│   ├── objection-handle/SKILL.md# Objection playbooks
│   ├── meeting-book/SKILL.md   # Calendar booking coordination
│   └── self-correct/SKILL.md   # 4-gate quality validation
│
├── tools/                       # Tool definitions (YAML, MCP-ready)
│   ├── lead-lookup.yaml
│   ├── calendar-check.yaml
│   ├── send-notification.yaml
│   └── google-meet-create.yaml
│
├── workflows/
│   └── full-ops-cycle.yaml     # End-to-end ops workflow DAG
│
├── knowledge/
│   └── product-context.md      # ← Edit this to customize Aria
│
├── server.js                    # HTTP API + UI server
├── tool-runtime.js              # Mock ↔ Real tool execution
├── mcp-server.js                # MCP stdio server
│
├── ui/                          # Web dashboard (HTML/CSS/JS)
│   ├── index.html
│   ├── app.js
│   └── styles.css
│
├── mock/company-data.json       # Offline sample data
├── .env.example                 # Environment variable template
└── package.json
```

<br>

## Real Integrations

Switch from mock to live by setting `TOOL_MODE=real` in `.env`:

<details>
<summary><strong>Google Workspace</strong> — Sheets (CRM) + Calendar + Meet</summary>

```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=sa@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID=your_sheet_id
GOOGLE_SHEETS_LEADS_RANGE='CRM Tracker'!A2:H
GOOGLE_CALENDAR_ID=primary
```

Share your Sheet and Calendar with the service account email address.

</details>

<details>
<summary><strong>Slack</strong> — Escalation notifications</summary>

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXX/YYY/ZZZ
```

Create an [Incoming Webhook](https://api.slack.com/messaging/webhooks) in your Slack workspace.

</details>

<br>

## Web Dashboard

The dashboard at `localhost:8787` provides six views:

| Tab | Description |
|:----|:------------|
| **Chat** | Live conversation interface with real-time tool execution indicators |
| **Leads** | Visual pipeline showing qualified leads, fit scores, and next actions |
| **Connectors** | One-click activation for Google Workspace and Slack integrations |
| **Workflows** | Interactive visualization of the full-ops-cycle workflow DAG |
| **Analytics** | Performance metrics — conversion rates, response times, skill usage |
| **Settings** | Model selection, tool mode toggle, and runtime configuration |

<br>

## GitAgent Compliance

This repository follows the [gitagent specification v0.1.0](https://github.com/open-gitagent/gitagent):

```bash
# Validate
npx @open-gitagent/gitagent@latest validate

# Inspect
npx @open-gitagent/gitagent@latest info
```

**Spec conformance:**
- ✅ `agent.yaml` manifest with model, skills, tools, and tags
- ✅ `SOUL.md` defining agent identity and communication style
- ✅ `RULES.md` with behavioral constraints and escalation triggers
- ✅ Composable skills in `skills/` with YAML frontmatter
- ✅ Tool definitions in `tools/` with MCP-compatible schemas
- ✅ Workflow in `workflows/` with triggers, steps, and error handling

<br>

## Hackathon Submission

### Judging Criteria Alignment

| Criteria (Weight) | Implementation |
|:-------------------|:---------------|
| **Agent Quality** (30%) | Production-grade personality via `SOUL.md`, hard behavioral guards via `RULES.md`, defined escalation triggers for enterprise/legal/frustration signals |
| **Skill Design** (25%) | 5 composable skills with clear boundaries — each independently useful but naturally chaining through the workflow DAG |
| **Working Demo** (25%) | `npm install && npm run serve` → fully functional dashboard with zero config. Mock mode works offline. Real mode connects to Google + Slack. |
| **Creativity** (20%) | First git-native AI employee for startup ops. Version-controlled decisions. MCP-ready for IDE adoption. Skill marketplace potential. |

### Aria vs. Traditional Chatbots

|  | Chatbot | Aria |
|:--|:--------|:-----|
| Collects visitor data | ✅ | ✅ |
| Qualifies leads in real-time | ❌ | ✅ |
| Runs objection playbooks | ❌ | ✅ |
| Books meetings autonomously | ❌ | ✅ |
| Self-validates response quality | ❌ | ✅ |
| Behavior is version-controlled | ❌ | ✅ |
| Skills are composable & forkable | ❌ | ✅ |
| Integrates via MCP into IDEs | ❌ | ✅ |

<br>

## Tech Stack

| Component | Technology |
|:----------|:-----------|
| Agent Standard | [gitagent v0.1.0](https://github.com/open-gitagent/gitagent) |
| Runtime | [gitclaw](https://github.com/open-gitagent/gitclaw) + Node.js 18 |
| LLM Access | [OpenRouter](https://openrouter.ai) — Claude, GPT-4o, Gemini |
| CRM | Google Sheets API v4 |
| Scheduling | Google Calendar API v3 + Meet |
| Notifications | Slack Incoming Webhooks |
| Tool Protocol | [MCP](https://modelcontextprotocol.io) via `@modelcontextprotocol/sdk` |
| Frontend | Vanilla HTML / CSS / JS |

<br>

## Security

| Practice | Details |
|:---------|:--------|
| Secrets management | `.env` is `.gitignore`'d — never committed |
| Key rotation | Rotate immediately if credentials are exposed |
| Least privilege | Service account gets only Sheets read + Calendar write |
| Data isolation | No cross-session data leakage — each session is independent |

<br>

## License

[MIT](LICENSE)

<br>

---

<p align="center">
  <sub>Built by <a href="https://github.com/RagavRida">Raghav Rida</a> for the <a href="https://github.com/open-gitagent/gitagent">GitAgent Hackathon</a></sub>
  <br>
  <sub><i>Version-controlled agents solving real problems — from day one.</i></sub>
</p>
