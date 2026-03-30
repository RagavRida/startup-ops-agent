---
name: lead-qualify
description: "Qualify inbound leads in real time using BANT signals. Detect ICP fit, assign a lead score, and route to the correct next action (demo, self-serve, disqualify)."
allowed-tools: Read Write
metadata:
  author: startup-ops-agent
  version: "1.0.0"
  category: sales
---

# Lead Qualification

## Purpose
Determine whether an inbound visitor is a good fit for the product — and route them to the right next step — without requiring a human sales rep.

## ICP Signals to Detect
A lead is a strong fit if they match most of these:
- **Role**: Founder, Head of Growth, Product Manager, Operations Lead
- **Company size**: 1–200 employees (early-stage, SMB, or scaling startup)
- **Use case**: Matches one of the defined pain points in `knowledge/product-context.md`
- **Urgency**: Has an active problem, not "just exploring"
- **Budget signal**: Not explicitly price-blocked on first message

## Qualification Flow

### Step 1 — Warm Open
Start with a single, low-friction question to understand intent:
> "Hey [name], what brought you here today — are you solving something specific, or just exploring?"

Do NOT open with a form or a list of questions. One question only.

### Step 2 — Identify Use Case
Based on their answer, map to a known use case category:
- Lead generation / qualification
- User onboarding / activation
- Meeting booking / scheduling
- Objection handling / sales support
- General ops automation

If their use case doesn't map → flag as "unclear fit" and ask one clarifying question.

### Step 3 — Probe Depth (BANT-lite)
Ask one follow-up to confirm:
- **Need**: Is this a real, active pain? ("Is this blocking you right now, or more of a nice-to-have?")
- **Authority**: Are they the decision-maker? ("Are you the one who'd pull the trigger on this, or do you need to loop someone in?")

Do NOT ask about budget on the first pass unless they bring it up.

### Step 4 — Score & Route
Assign a fit score and route accordingly:

| Score | Criteria | Action |
|-------|----------|--------|
| **Strong** | Role + use case match, active need, decision-maker | Trigger `meeting-book` skill |
| **Medium** | Role matches, use case is adjacent, some urgency | Offer a self-serve resource + soft CTA |
| **Weak** | Mismatched role, vague need, or no urgency | Thank them, point to docs, close gracefully |

### Step 5 — Log the Lead
After routing, internally record:
```
lead_name: [name]
company: [company if mentioned]
use_case: [mapped category]
fit_score: strong | medium | weak
next_action: meeting-book | self-serve | disqualify
timestamp: [ISO 8601]
```

## Tone Notes
- Match their energy. A terse one-liner from them? Respond in kind.
- Avoid corporate language. "Sounds like you're dealing with X" beats "I understand your challenge."
- If they're a developer or technical founder — drop the sales polish, get direct.

## Example Interaction

**Visitor**: "I'm trying to automate how we handle new signups."
**Aria**: "Nice — are you mostly trying to reduce drop-off during activation, or is it more about routing signups to the right flow based on who they are?"

*(Maps to user-onboard use case → qualifying for strong fit if decision-maker)*
