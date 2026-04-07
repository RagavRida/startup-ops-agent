# Audit Policy — Compliance & Traceability

> This document defines what Aria logs, how long records are retained, and how the audit trail is maintained.

---

## Audit Scope

Every interaction is logged. No exceptions.

### What Gets Logged

| Event | Data Captured | Retention |
|-------|--------------|-----------|
| **Visitor interaction** | Message content, timestamp, intent classification, confidence score | 1 year |
| **Lead qualification** | Fit score, ICP signals detected, routing decision | 1 year |
| **Skill activation** | Which skill was triggered, why, context bundle used | 1 year |
| **Response generation** | Full response text, model used, token count | 1 year |
| **Self-correction** | Gate that failed, original snippet, corrected snippet, rule violated | 2 years |
| **Escalation** | Trigger reason, conversation context, recommended action | 2 years |
| **Meeting booking** | Lead details, preferred times, timezone, status | 2 years |
| **Configuration change** | File changed, diff, who changed it, validation result | Permanent |
| **Model fallback** | Primary model failure reason, fallback model used | 1 year |

### What Never Gets Logged

- Credit card numbers or payment information
- Social Security Numbers or government IDs
- Passwords or authentication tokens
- Private health information
- Any data the visitor explicitly asks to be deleted

---

## Audit Trail Implementation

### Git-Native Audit

Every agent configuration change is a git commit:
```bash
# View audit trail
git log --oneline --since="1 week ago"

# View what changed in a specific version
git diff v1.0.0..v1.1.0

# Trace who changed a specific rule
git blame RULES.md

# View the full history of a skill
git log --follow skills/lead-qualify/SKILL.md
```

### Interaction Logs

Runtime interaction data is appended to `memory/runtime/dailylog.md`:
- Session summaries with aggregate metrics
- Key decisions with reasoning
- Corrections applied with before/after snapshots
- Visitor patterns and trends

### Structured Records

Lead records, meeting requests, and correction records follow the data models defined in `ARCHITECTURE.md`:
- All records include ISO 8601 timestamps
- All records include a UUID for cross-referencing
- All records are append-only (no retroactive modification)

---

## Compliance Controls

### Data Minimization
- Aria collects only the data needed for the active skill
- No profile building beyond the current conversation
- No tracking across sessions unless the visitor provides identifying info

### Access Control
- Only the founder can access raw interaction logs
- Aria cannot view other visitors' conversations
- API keys are stored in `.env` (gitignored, never committed)

### Right to Deletion
- Visitors can request deletion of their interaction data
- Deletion requests are escalated to the founder
- Deleted data is removed from `memory/runtime/` but git history persists (git limitation)

### Incident Response
- If a data breach is detected → immediately notify founder
- If Aria generates harmful content → halt, log, escalate
- If model outputs PII from training data → strip from response, log the incident

---

## Validation

Run compliance checks:
```bash
# Validate agent configuration
npx gitagent validate --compliance

# Run all tests
npm run test

# Check for leaked secrets
git log --all -p | grep -i "sk-or-"
```

---

## Review Cadence

- **Weekly:** Review correction trends in `memory/runtime/context.md`
- **Monthly:** Audit `memory/runtime/dailylog.md` for pattern anomalies
- **Quarterly:** Full compliance review of all skills and rules
- **On change:** `gitagent validate` runs on every push via CI/CD
