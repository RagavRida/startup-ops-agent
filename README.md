# startup-ops-agent 🚀

**An AI employee for early-stage startups.**

Most startups can't afford a full-time SDR, onboarding specialist, and ops coordinator. This agent does all three — autonomously, from a git repo.

Aria (this agent) sits at the top of your funnel. She qualifies leads in real time, guides new users to their activation moment, handles objections, and books meetings — all without a human in the loop.

---

## What She Does

| Skill | What it handles |
|-------|----------------|
| `lead-qualify` | Detects visitor intent, scores fit (strong/medium/weak), routes to next action |
| `user-onboard` | Guides new signups to their activation milestone, prevents Day 1 drop-off |
| `meeting-book` | Converts qualified leads into confirmed calendar slots with structured context |
| `objection-handle` | Handles pricing, timing, competitor, and trust objections with empathy — not pressure |

---

## Setup (5 minutes)

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/startup-ops-agent
cd startup-ops-agent
```

### 2. Fill in your product context
Edit `knowledge/product-context.md` with:
- Your product name and description
- Your ICP (who's a fit, who's not)
- Your activation milestone
- Your top objections and how you'd answer them
- Your calendar link and founder name

This is the only file you need to customize. Everything else works out of the box.

### 3. Validate the agent
```bash
npx gitagent validate
npx gitagent info
```

### 4. Run with gitclaw

Install gitclaw globally (one-time setup):
```bash
bash <(curl -fsSL "https://raw.githubusercontent.com/open-gitagent/gitclaw/main/install.sh?$(date +%s)")
```

Or install locally:
```bash
npm install gitclaw
```

Set your OpenRouter API key:
```bash
export OPENROUTER_API_KEY="sk-or-..."
```

Run Aria interactively:
```bash
gitclaw --dir . "Hey, I'm trying to automate how we qualify leads"
```

Or use the SDK in your code:
```javascript
import { query } from "gitclaw";

for await (const msg of query({
  prompt: "New visitor: 'We need help with lead qualification'",
  dir: "./startup-ops-agent",
  model: "openrouter:anthropic/claude-sonnet-4",
})) {
  if (msg.type === "delta") process.stdout.write(msg.content);
}
```

Run the demo:
```bash
npm install
npm run demo
```

### 5. (Optional) Deploy serverlessly with clawless
```bash
npm install clawless
```

Embed Aria directly in your website or app via WebContainers — zero backend required.

---

## Example Conversation

```
Visitor: "I found you on Product Hunt. What exactly does this do?"

Aria: "Nice — what's the context for you? Are you trying to solve something
      specific on your funnel, or just exploring what's out there?"

Visitor: "We have decent traffic but leads go cold because no one follows up fast enough."

Aria: "That's the exact gap this was built for. Are you the one who'd set
      this up, or would you need to loop in someone else?"

Visitor: "Just me — I'm the founder."

Aria: "Want to jump on a quick call? It's 20 minutes, no pitch — you'll
      leave knowing if this is worth your time."

Visitor: "Sure, what does next week look like?"

Aria: "What timezone are you in, and are mornings or afternoons better for you?"
```

---

## Architecture

```
startup-ops-agent/
├── agent.yaml              ← manifest: name, model, skills
├── SOUL.md                 ← Aria's identity, tone, values
├── RULES.md                ← what she must/must never do
├── skills/
│   ├── lead-qualify/       ← BANT-lite qualification + routing
│   ├── user-onboard/       ← activation flow + drop-off detection
│   ├── meeting-book/       ← calendar intent → structured meeting request
│   └── objection-handle/   ← 5 objection types, playbook + escalation
├── knowledge/
│   └── product-context.md  ← the only file YOU need to fill in
├── workflows/
│   └── full-ops-cycle.yaml ← end-to-end routing logic
├── demo.js                 ← working SDK examples
├── package.json            ← npm scripts and dependencies
├── QUICKSTART.md           ← 5-minute setup guide
├── HACKATHON.md            ← submission details
└── CONTRIBUTING.md         ← how to extend Aria
```

---

## Why This Wins

1. **It's actually useful** — This solves a real, expensive problem for every early-stage startup.
2. **The SOUL is compelling** — Aria has a distinct voice that doesn't sound like a bot.
3. **Skills are focused and composable** — Each skill does one thing well. They chain naturally.
4. **It's immediately deployable** — Fill in one file. Run two commands. You have an AI employee.
5. **It's a product idea, not a demo** — This is the foundation of a real startup ops platform.

---

## Built With
- [gitagent](https://github.com/open-gitagent/gitagent) — agent definition standard
- [gitclaw](https://github.com/open-gitagent/gitclaw) — runtime SDK
- [clawless](https://github.com/open-gitagent/clawless) — serverless deployment
- [OpenRouter](https://openrouter.ai) — unified API for multiple LLMs
- Claude Sonnet 4 via OpenRouter — the model powering Aria

---

*Built for the gitagent hackathon by Raghav Rida.*
