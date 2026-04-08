<![CDATA[# 🚀 Aria — Startup Ops Agent

> **GitAgent Hackathon Submission** · Built by [Raghav Rida](https://github.com/RagavRida)

Aria is a **production-ready AI employee** that lives inside a git repo. She autonomously qualifies leads, onboards users, handles sales objections, and books meetings — replacing the 3 hires most early-stage startups can't afford.

Built on the [gitagent](https://github.com/open-gitagent/gitagent) standard. Version-controlled. Composable. Ready to deploy.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)](https://nodejs.org)
[![gitagent](https://img.shields.io/badge/gitagent-v0.1.0-purple.svg)](https://github.com/open-gitagent/gitagent)

---

## 📌 The Problem

Early-stage startups (5–50 people) need an SDR, onboarding specialist, and ops coordinator — but can't afford all three. Founders do it manually, leads go cold, and conversion suffers.

**Chatbots collect data. Aria acts on it.**

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │   Web Chat   │  │  CLI Chat    │  │   MCP-Compatible IDE   │ │
│  │   (Browser)  │  │  (Terminal)  │  │   (VS Code / Cursor)   │ │
│  └──────┬───────┘  └──────┬───────┘  └───────────┬────────────┘ │
└─────────┼─────────────────┼──────────────────────┼──────────────┘
          │ HTTP             │ stdin/out            │ MCP stdio
          ▼                  ▼                      ▼
┌──────────────────────────────────────────────────────────────────┐
│                      SERVER / RUNTIME                            │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │                    server.js (HTTP API)                     │  │
│  │  • /chat     — conversational endpoint                     │  │
│  │  • /health   — status check                                │  │
│  │  • /connectors — integration status                        │  │
│  │  • /connect  — activate connectors                         │  │
│  │  • /         — serves web UI                               │  │
│  └──────────────────────┬─────────────────────────────────────┘  │
│                         │                                        │
│  ┌──────────────────────▼─────────────────────────────────────┐  │
│  │                   AI REASONING CORE                         │  │
│  │                                                             │  │
│  │  ┌─────────┐ ┌─────────┐ ┌──────────────┐ ┌────────────┐  │  │
│  │  │ SOUL.md │ │RULES.md │ │ product-     │ │  Workflow   │  │  │
│  │  │ (Voice) │ │(Guards) │ │ context.md   │ │  Engine     │  │  │
│  │  └────┬────┘ └────┬────┘ └──────┬───────┘ └─────┬──────┘  │  │
│  │       └───────────┼─────────────┼────────────────┘         │  │
│  │                   ▼             ▼                           │  │
│  │        ┌─────────────────────────────────┐                 │  │
│  │        │     SKILL COMPOSITION ENGINE     │                 │  │
│  │        │  ┌──────────┐  ┌─────────────┐  │                 │  │
│  │        │  │  lead-   │  │   user-      │  │                 │  │
│  │        │  │  qualify  │  │   onboard    │  │                 │  │
│  │        │  ├──────────┤  ├─────────────┤  │                 │  │
│  │        │  │ objection│  │  meeting-    │  │                 │  │
│  │        │  │  handle  │  │   book       │  │                 │  │
│  │        │  ├──────────┤  └─────────────┘  │                 │  │
│  │        │  │  self-   │                    │                 │  │
│  │        │  │  correct │                    │                 │  │
│  │        │  └──────────┘                    │                 │  │
│  │        └─────────────────────────────────┘                 │  │
│  └────────────────────────────────────────────────────────────┘  │
│                         │                                        │
│  ┌──────────────────────▼─────────────────────────────────────┐  │
│  │                 tool-runtime.js                              │  │
│  │         (Mock ↔ Real tool execution layer)                  │  │
│  └──────────────────────┬─────────────────────────────────────┘  │
└─────────────────────────┼────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Google Sheets│ │Google Calendar│ │    Slack     │
│  (CRM /      │ │ (Scheduling + │ │  (Webhook    │
│   Leads DB)  │ │  Google Meet) │ │  Escalation) │
└──────────────┘ └──────────────┘ └──────────────┘
```

### How It Works (Request Flow)

```
User Message
     │
     ▼
┌─────────────────┐    ┌────────────────────┐
│  1. PLAN         │───▶│  OpenRouter API     │
│  (Tool Planning) │◀───│  (Claude / GPT-4)  │
└────────┬────────┘    └────────────────────┘
         │
         ▼
┌─────────────────┐    ┌────────────────────┐
│  2. EXECUTE      │───▶│  Tool Runtime       │
│  (Run Tools)     │◀───│  (Sheets/Cal/Slack) │
└────────┬────────┘    └────────────────────┘
         │
         ▼
┌─────────────────┐    ┌────────────────────┐
│  3. FINALIZE     │───▶│  OpenRouter API     │
│  (Compose Reply) │◀───│  + Self-Correct     │
└────────┬────────┘    └────────────────────┘
         │
         ▼
   Final Response
   (reply + actions + tool results)
```

---

## ✨ Core Capabilities

| Skill | What It Does | Key Feature |
|-------|-------------|-------------|
| **lead-qualify** | BANT-lite scoring & ICP matching | Real-time fit scoring (strong/medium/weak) |
| **user-onboard** | Activation-first onboarding flows | Milestone tracking & drop-off detection |
| **objection-handle** | 5 objection types with playbooks | Acknowledge-then-reframe pattern |
| **meeting-book** | Calendar coordination + booking | Google Calendar + Meet integration |
| **self-correct** | 4-gate quality validation pipeline | Rule compliance, tone, hallucination, escalation |

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| **LLM** | [OpenRouter](https://openrouter.ai) → Claude Opus / Sonnet, GPT-4o, Gemini |
| **Agent Standard** | [gitagent v0.1.0](https://github.com/open-gitagent/gitagent) |
| **Runtime** | Node.js 18+ (zero frameworks, pure `http` module) |
| **CRM** | Google Sheets API v4 |
| **Scheduling** | Google Calendar API v3 + Google Meet |
| **Notifications** | Slack Incoming Webhooks |
| **Tool Protocol** | MCP (Model Context Protocol) via `@modelcontextprotocol/sdk` |
| **UI** | Vanilla HTML/CSS/JS — 6-tab dashboard |

---

## 📁 Repository Structure

```
startup-ops-agent/
│
├── agent.yaml                  # Agent manifest (model, skills, tools, tags)
├── SOUL.md                     # Aria's personality & communication style
├── RULES.md                    # Behavioral constraints & escalation triggers
│
├── skills/                     # Composable skill definitions
│   ├── lead-qualify/SKILL.md   #   └─ BANT-lite lead scoring
│   ├── user-onboard/SKILL.md   #   └─ Activation-first onboarding
│   ├── objection-handle/SKILL.md#  └─ 5 objection playbooks
│   ├── meeting-book/SKILL.md   #   └─ Calendar coordination
│   └── self-correct/SKILL.md   #   └─ 4-gate response validation
│
├── tools/                      # MCP-ready tool definitions (YAML)
│   ├── lead-lookup.yaml        #   └─ CRM / Google Sheets lookup
│   ├── calendar-check.yaml     #   └─ Availability check
│   ├── send-notification.yaml  #   └─ Slack webhook escalation
│   └── google-meet-create.yaml #   └─ Calendar event + Meet link
│
├── workflows/
│   └── full-ops-cycle.yaml     # End-to-end ops workflow definition
│
├── knowledge/
│   ├── index.yaml              # Knowledge base index
│   └── product-context.md      # Customizable product info (edit this!)
│
├── server.js                   # HTTP API server + web UI host
├── tool-runtime.js             # Mock ↔ Real tool execution engine
├── mcp-server.js               # MCP stdio server for IDE integration
│
├── ui/                         # Web dashboard (6 tabs)
│   ├── index.html              #   └─ Main HTML shell
│   ├── app.js                  #   └─ Frontend logic
│   └── styles.css              #   └─ Styling
│
├── mock/
│   └── company-data.json       # Mock data for offline development
│
├── config/
│   └── default.yaml            # Default configuration
│
├── agents/
│   └── fact-checker.md         # Fact-checking sub-agent
│
├── demo-all-skills.js          # Run all 4 skills demo
├── demo-startup-realtime.js    # Startup-focused real-time demo
├── real-use-case.js            # Real integration use cases
├── live-chat.js                # Interactive CLI chat
├── simple-test.js              # Quick smoke test
├── test.js                     # Full test suite
│
├── .env.example                # Environment template (copy to .env)
├── package.json                # Dependencies & scripts
├── HACKATHON.md                # Hackathon submission details
├── QUICKSTART.md               # 5-minute setup guide
└── LICENSE                     # MIT
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 18+** ([download](https://nodejs.org))
- **OpenRouter API key** ([get one free](https://openrouter.ai/keys))

### 1. Clone & Install

```bash
git clone https://github.com/RagavRida/startup-ops-agent.git
cd startup-ops-agent
npm install
```

### 2. Configure

```bash
cp .env.example .env
```

Edit `.env` and set:

```bash
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_MODEL=anthropic/claude-opus-4
TOOL_MODE=mock          # Use 'real' for live integrations
```

### 3. Run

```bash
# Start the server + web UI
npm run serve

# Open in browser
open http://localhost:8787
```

---

## 🎮 Run Modes

| Mode | Command | Description |
|------|---------|-------------|
| **Web UI + API** | `npm run serve` | Full dashboard at `localhost:8787` |
| **Interactive CLI** | `npm run live` | Terminal chat with Aria |
| **Skills Demo** | `npm run demo` | Automated demo of all 4 skills |
| **Startup Demo** | `npm run demo:startup` | Real-time startup scenario |
| **MCP Server** | `npm run serve:mcp` | Expose tools via MCP for IDEs |
| **Quick Test** | `npm run quick` | Fast smoke test |
| **Full Test** | `npm run test` | Complete test suite |

### API Usage

```bash
# Health check
curl http://localhost:8787/health

# Chat
curl -X POST http://localhost:8787/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "demo", "message": "We are a 20-person SaaS startup getting 100 leads/week"}'

# Check tool/connector status
curl http://localhost:8787/connectors
```

### GitAgent Validation

```bash
npx @open-gitagent/gitagent@latest validate
npx @open-gitagent/gitagent@latest info
```

---

## 🔌 Real Integrations

Set `TOOL_MODE=real` in `.env` to connect live services:

### Google Workspace (Sheets + Calendar + Meet)

```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-sa@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID=your_sheet_id
GOOGLE_SHEETS_LEADS_RANGE='CRM Tracker'!A2:H
GOOGLE_CALENDAR_ID=primary
```

> **Note:** Share your Google Sheet and Calendar with the service account email.

### Slack (Escalation Notifications)

```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/XXX/YYY/ZZZ
```

---

## 🖥️ Web Dashboard

The UI has **6 tabs** accessible at `http://localhost:8787`:

| Tab | Function |
|-----|----------|
| **Chat** | Live conversation with Aria — real-time lead qualification |
| **Leads Pipeline** | Visual pipeline of qualified leads with fit scores |
| **Connectors** | Enable/disable Google Workspace & Slack integrations |
| **Workflows** | View the full-ops-cycle workflow DAG |
| **Analytics** | Conversion metrics, response times, skill usage |
| **Settings** | Model selection, tool mode, configuration |

---

## 🏆 Hackathon Positioning

### Why This Wins

| Criteria | How Aria Delivers |
|----------|------------------|
| **Agent Quality (30%)** | Real personality via SOUL.md, hard behavioral constraints via RULES.md, production-grade escalation triggers |
| **Skill Design (25%)** | 5 composable skills that chain through a defined workflow DAG — each focused, documented, and practical |
| **Working Demo (25%)** | `npm install && npm run serve` → full working dashboard with mock data. Zero config needed for demo. |
| **Creativity (20%)** | First "AI employee in a git repo" for startup ops — not a toy, but a product foundation |

### What Makes Aria Different

| | Traditional Chatbot | Aria |
|---|---|---|
| Collects data | ✅ | ✅ |
| Qualifies leads in real-time | ❌ | ✅ |
| Handles objections with playbooks | ❌ | ✅ |
| Books meetings autonomously | ❌ | ✅ |
| Self-corrects responses | ❌ | ✅ |
| Version-controlled behavior | ❌ | ✅ |
| Git-native & composable | ❌ | ✅ |
| MCP-ready for IDE integration | ❌ | ✅ |

### Business Model Potential

1. **Open-source core** — MIT-licensed agent definitions anyone can fork
2. **Managed hosting** — SaaS version with analytics dashboard
3. **Skill marketplace** — Community-contributed skills for different verticals
4. **Enterprise** — Custom skills + compliance + audit trails

---

## 🔒 Security

- **Never commit `.env`** — it's `.gitignore`'d by default
- **Rotate leaked API keys immediately** — if you accidentally expose credentials
- **Use separate dev/prod credentials** — keep production keys off local machines
- **Service account principle of least privilege** — only grant Sheets read + Calendar write

---

## 🛠️ Built With

| Tool | Purpose |
|------|---------|
| [gitagent](https://github.com/open-gitagent/gitagent) | Agent definition standard |
| [gitclaw](https://github.com/open-gitagent/gitclaw) | Runtime SDK |
| [OpenRouter](https://openrouter.ai) | Multi-model LLM access |
| [Google APIs](https://developers.google.com) | Sheets, Calendar, Meet |
| [MCP SDK](https://github.com/modelcontextprotocol/sdk) | Tool protocol for IDEs |

---

## 📄 License

MIT — see [LICENSE](LICENSE)

---

**Built for the [GitAgent Hackathon](https://github.com/open-gitagent/gitagent)** by Raghav Rida

> *This is what AI agents should be: version-controlled, composable, and solving real problems from day one.*
]]>
