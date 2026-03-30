# Hackathon Submission: Aria - Startup Ops Agent

## Overview

Aria is an AI employee that lives in a git repo. She qualifies leads, onboards users, handles objections, and books meetings — autonomously, without human intervention.

## The Problem

Early-stage startups can't afford a full-time SDR, onboarding specialist, and ops coordinator. But they need all three to:
- Qualify inbound leads before they go cold
- Guide new users to their activation moment
- Handle objections in async channels
- Book meetings with qualified prospects

Most founders do this manually, which doesn't scale. Chatbots collect data but don't act on it.

## The Solution

Aria is a production-ready AI agent built using the gitagent standard. She's not a chatbot — she's a structured, version-controlled employee with:
- A defined personality (SOUL.md)
- Hard behavioral constraints (RULES.md)
- Four composable skills (lead-qualify, user-onboard, objection-handle, meeting-book)
- Product knowledge that's easy to customize
- Full git history for every decision

## Why This Wins

### 1. Agent Quality (30%)
- **Useful**: Solves a real $50k+/year hiring problem for every early-stage startup
- **Compelling SOUL**: Aria has a distinct voice that doesn't sound like a bot
- **Well-defined rules**: Clear boundaries on what she can/can't do, with escalation triggers

### 2. Skill Design (25%)
- **Focused**: Each skill does one thing well (BANT-lite qualification, activation flows, objection playbooks, meeting coordination)
- **Well-documented**: Every skill has YAML frontmatter + detailed instructions
- **Practical**: Based on real startup ops workflows, not theoretical examples
- **Composable**: Skills chain naturally through the workflow system

### 3. Working Demo (25%)
- **Runs immediately**: `npm install && npm run demo`
- **Multiple runtimes**: Works with gitclaw SDK, CLI, and can deploy with clawless
- **Real scenarios**: 4 complete demos showing each skill in action
- **Customizable**: One file to edit (product-context.md) and it's personalized

### 4. Creativity (20%)
- **Novel use case**: First "AI employee in a git repo" for startup ops
- **Production-ready**: Not a toy demo — this is the foundation of a real product
- **Git-native memory**: Every interaction can be version-controlled
- **Skill marketplace potential**: Other founders can fork, customize, and contribute skills

## Technical Architecture

```
startup-ops-agent/
├── agent.yaml              # Manifest: model, skills, config
├── SOUL.md                 # Aria's identity and personality
├── RULES.md                # Behavioral constraints
├── skills/
│   ├── lead-qualify/       # BANT-lite qualification
│   ├── user-onboard/       # Activation flow guidance
│   ├── meeting-book/       # Calendar coordination
│   └── objection-handle/   # 5 objection types + playbooks
├── knowledge/
│   └── product-context.md  # Customizable product info
├── workflows/
│   └── full-ops-cycle.yaml # End-to-end routing logic
└── demo.js                 # Working SDK examples
```

## Key Features

1. **Framework-agnostic**: Follows gitagent spec, works with any runtime
2. **Multi-model support**: Uses OpenRouter for access to Claude, GPT-4, Gemini, etc.
3. **Version-controlled**: Every change to the agent is a git commit
4. **Composable skills**: Each skill is independent but chains naturally
5. **Production-focused**: Escalation triggers, audit trails, clear boundaries

## Demo Instructions

```bash
# Clone and install
git clone https://github.com/yourusername/startup-ops-agent
cd startup-ops-agent
npm install

# Set API key
export OPENROUTER_API_KEY="sk-or-v1-..."

# Run demo
npm run demo

# Or interactive mode
gitclaw --dir . "I'm a founder with 50 inbound leads per day"
```

## What Makes This Different

| Feature | Traditional Chatbot | Aria |
|---------|-------------------|------|
| Data collection | ✓ | ✓ |
| Lead qualification | ✗ | ✓ |
| Onboarding flows | ✗ | ✓ |
| Objection handling | ✗ | ✓ |
| Meeting booking | ✗ | ✓ |
| Version control | ✗ | ✓ |
| Composable skills | ✗ | ✓ |
| Git-native | ✗ | ✓ |

## Business Model Potential

This isn't just a hackathon demo — it's a product foundation:

1. **Open-source core**: MIT licensed agent definitions
2. **Managed hosting**: SaaS version with analytics and integrations
3. **Skill marketplace**: Community-contributed skills for different verticals
4. **Enterprise**: Custom skills + compliance + audit trails

## Built With

- [gitagent](https://github.com/open-gitagent/gitagent) - Agent definition standard
- [gitclaw](https://github.com/open-gitagent/gitclaw) - Runtime SDK
- [OpenRouter](https://openrouter.ai) - Multi-model API access
- Claude Sonnet 4 - Primary model

## Team

Built by Raghav Rida for the gitagent hackathon.

## Links

- GitHub: [yourusername/startup-ops-agent]
- Demo Video: [TBD]
- Live Demo: [TBD]

---

**This is what AI agents should be**: version-controlled, composable, and solving real problems from day one.
