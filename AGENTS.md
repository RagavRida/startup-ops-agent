# Agents — Framework-Agnostic Instructions

> If your runtime doesn't support the gitagent standard natively, use these instructions to configure Aria manually in any LLM interface.

---

## System Prompt Assembly

To run Aria in any LLM (ChatGPT, Claude, Gemini, or a custom app), assemble the system prompt in this order:

```
1. SOUL.md         → Core identity, personality, values
2. RULES.md        → Hard behavioral constraints
3. DUTIES.md       → Role boundaries and escalation rules
4. [Active Skill]  → The relevant SKILL.md for the current task
5. product-context.md → Product-specific knowledge
```

### Minimal System Prompt

```
You are Aria — a startup operations agent. Read and embody the following files:

[Paste SOUL.md contents here]

[Paste RULES.md contents here]

[Paste the relevant skill's SKILL.md here]

[Paste knowledge/product-context.md here]

Respond to the visitor's message using the active skill's instructions.
```

---

## Runtime Compatibility

| Runtime | How to Use Aria |
|---------|----------------|
| **gitclaw CLI** | `gitclaw --dir . "visitor message"` — auto-discovers all files |
| **gitclaw SDK** | `import { query } from "gitclaw"` — programmatic access |
| **Claude Projects** | Upload SOUL.md, RULES.md, active SKILL.md, and product-context.md as project knowledge |
| **ChatGPT Custom GPT** | Paste assembled system prompt into Instructions field |
| **OpenAI API** | Use assembled prompt as `system` message |
| **Anthropic API** | Use assembled prompt as `system` parameter |
| **LangChain** | Use as `SystemMessage` in chat prompt template |
| **CrewAI** | Set as agent `backstory` + `goal` from SOUL.md |
| **Cursor / Windsurf** | Drop files into project, reference in `.cursorrules` |
| **GitHub Actions** | Use `gitagent export --format system-prompt` output |

---

## Skill Selection Guide

Choose the skill based on the visitor's intent:

| Visitor Intent | Skill to Load | Trigger |
|---------------|---------------|---------|
| First contact, exploring | `skills/lead-qualify/SKILL.md` | Default for new visitors |
| Just signed up | `skills/user-onboard/SKILL.md` | `is_new_signup == true` |
| Has an objection or concern | `skills/objection-handle/SKILL.md` | Objection keywords detected |
| Wants to book a call | `skills/meeting-book/SKILL.md` | Strong-fit lead requests call |
| Any response validation | `skills/self-correct/SKILL.md` | Applied to every response |

---

## Model Recommendations

Aria works best with models that handle multi-turn conversations well:

| Model | Quality | Speed | Cost | Notes |
|-------|---------|-------|------|-------|
| Claude Sonnet 4 | ⭐⭐⭐⭐⭐ | Fast | $$ | Best overall for Aria's tone |
| GPT-4o | ⭐⭐⭐⭐ | Fast | $$ | Great fallback, slightly more formal |
| Claude 3.5 Sonnet | ⭐⭐⭐⭐ | Fast | $ | Good budget option |
| Gemini 2.0 Flash | ⭐⭐⭐ | Very Fast | $ | Fast but less nuanced tone matching |
| Llama 3.3 70B | ⭐⭐⭐ | Medium | Free | Self-hosted option, decent quality |

---

## Multi-Agent Composition

Aria can be composed with other gitagent agents:

```
your-platform/
├── agents/
│   ├── aria/                    ← This agent (startup ops)
│   │   ├── agent.yaml
│   │   ├── SOUL.md
│   │   └── ...
│   ├── support-agent/           ← Post-sale support
│   │   ├── agent.yaml
│   │   └── SOUL.md
│   └── analytics-agent/         ← Usage insights
│       ├── agent.yaml
│       └── SOUL.md
├── shared/
│   ├── knowledge/               ← Shared product context
│   └── tools/                   ← Shared tool definitions
└── agent.yaml                   ← Root orchestrator
```

The root `agent.yaml` can define delegation rules:
- New visitor → Aria (lead-qualify)
- Existing customer with issue → support-agent
- Weekly metrics request → analytics-agent
