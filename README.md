# Aria - Startup Ops Agent

A production-style, git-native AI agent for startup revenue operations.

Aria qualifies inbound leads, handles objections, guides onboarding, and drives meeting conversion using composable `gitagent` skills and real tools.

## Who should use this

Best-fit users:

- startup founders and founding GTM teams
- SDR/AE reps managing high inbound volume
- RevOps or sales ops at early-stage companies
- customer success teams handling onboarding + handoff

Ideal company profile:

- team size: 5-50
- inbound leads: 20-200/week
- no dedicated ops automation owner yet

Not a fit when:

- you need a fully custom enterprise CRM migration on day one
- your workflow is mostly outbound-only and manual by design
- strict internal policy blocks service-account or webhook integrations

## Why this project

Early-stage teams often run sales, onboarding, and support manually. Aria acts as a focused AI operator that:

- qualifies leads in real time
- routes conversations to the right workflow
- escalates high-risk requests to humans
- integrates with real systems (Google Sheets, Google Calendar, Slack)

## Built on the GitAgent standard

This repo follows the open `gitagent` format and validates with the official CLI.

- Standard: [gitagent](https://github.com/open-gitagent/gitagent)
- Spec: [SPECIFICATION.md](https://github.com/open-gitagent/gitagent/blob/main/spec/SPECIFICATION.md)
- Runtime ecosystem: [gitclaw](https://github.com/open-gitagent/gitclaw), [clawless](https://github.com/open-gitagent/clawless)

## Core capabilities

- `lead-qualify`: ICP fit scoring and routing
- `objection-handle`: objection playbooks with safe boundaries
- `user-onboard`: activation-first onboarding guidance
- `meeting-book`: conversion to structured meeting requests
- `self-correct`: response quality validation before delivery

## Tooling (MCP-ready + real integrations)

Tool definitions live in `tools/` and are exposed through both API and MCP server:

- `lead-lookup`
- `calendar-check`
- `send-notification`
- `google-meet-create`

Real integrations currently wired:

- Google Sheets (lead lookup)
- Google Calendar (availability + event creation)
- Slack Incoming Webhook (escalations)

MCP server:

- `npm run serve:mcp`
- exposes all tools via stdio using `@modelcontextprotocol/sdk`

## Repository structure

```text
startup-ops-agent/
├── agent.yaml
├── SOUL.md
├── RULES.md
├── skills/
├── tools/
├── workflows/
├── server.js
├── tool-runtime.js
├── mcp-server.js
└── demo-*.js
```

## Quick start

```bash
git clone https://github.com/RagavRida/startup-ops-agent
cd startup-ops-agent
npm install
cp .env.example .env
```

Set at minimum:

```bash
OPENROUTER_API_KEY=...
OPENROUTER_MODEL=anthropic/claude-opus-4
TOOL_MODE=mock
```

## Validate as GitAgent

```bash
npx @open-gitagent/gitagent@latest validate
npx @open-gitagent/gitagent@latest info
```

## Run modes

### 1) Skills demo

```bash
npm run demo
```

### 2) Startup-focused real-time demo

```bash
npm run demo:startup
```

### 3) Interactive CLI chat

```bash
npm run live
```

### 4) API server (tool-calling runtime)

```bash
npm run serve
```

Health:

```bash
curl -s http://localhost:8787/health
```

Chat:

```bash
curl -s http://localhost:8787/chat \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"demo","message":"Can you check alex@sprintleaf.ai and suggest next step?"}'
```

### 5) MCP tool server

```bash
npm run serve:mcp
```

## Real integrations setup

Use real tools by setting:

```bash
TOOL_MODE=real
```

Required for Google + Slack:

```bash
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_SHEETS_SPREADSHEET_ID=...
GOOGLE_SHEETS_LEADS_RANGE='CRM Tracker'!A2:H
GOOGLE_CALENDAR_ID=primary
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

Notes:

- Share your Google Sheet and Calendar with the service account email.
- Service accounts may not invite attendees in all setups without domain-wide delegation.
- `google-meet-create` falls back to creating a calendar event if Meet link generation is restricted.

## Security

- Never commit `.env` or secret JSON keys.
- Rotate leaked API keys immediately.
- Use separate dev/prod credentials.

## Hackathon positioning

This project demonstrates:

- a valid `gitagent` repository definition
- practical skill composition
- a working runtime with real tool execution
- MCP-ready tool exposure

See `HACKATHON.md` for submission framing.

## License

MIT
