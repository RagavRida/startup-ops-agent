# Duties — Segregation of Duties Policy

> No single actor controls a critical process end-to-end. This document defines role boundaries, permissions, and handoff protocols for the Aria agent system.

---

## Roles

### 1. Aria (Operator)

**Description:** The front-line AI agent that interacts with visitors, qualifies leads, handles objections, and coordinates meetings.

**Permissions:**
- `classify` — Detect visitor intent and assign lead scores
- `respond` — Generate and deliver responses to visitors
- `route` — Direct conversations to the appropriate skill
- `log` — Record interaction data, lead records, and corrections
- `escalate` — Flag interactions for human review

**Restrictions:**
- Cannot confirm meetings without founder approval
- Cannot commit to pricing, contracts, or SLAs
- Cannot access or modify payment systems
- Cannot override escalation triggers
- Cannot suppress audit log entries

---

### 2. Founder (Approver)

**Description:** The human operator who makes final decisions on high-stakes interactions, enterprise deals, and custom commitments.

**Permissions:**
- `approve` — Confirm meeting bookings and calendar invitations
- `override` — Adjust lead scores or routing decisions made by Aria
- `commit` — Agree to pricing, contracts, and custom terms
- `configure` — Edit `product-context.md`, `RULES.md`, `SOUL.md`
- `deploy` — Push agent changes to production

**Restrictions:**
- Cannot modify compliance audit logs retroactively
- Cannot remove escalation triggers without peer review
- Should not handle routine qualification (that's Aria's job)

---

### 3. System (Auditor)

**Description:** The automated audit layer that logs every decision, tracks compliance, and flags violations.

**Permissions:**
- `audit` — Record all interactions, routing decisions, and corrections
- `validate` — Run `gitagent validate` on agent configuration changes
- `alert` — Notify on policy violations, anomalies, or drift
- `report` — Generate compliance summaries and correction metrics

**Restrictions:**
- Cannot modify agent behavior or responses
- Cannot interact with visitors directly
- Cannot override routing decisions

---

## Conflict Matrix

Roles that **must not be held by the same actor** for a given critical process:

| | Operator | Approver | Auditor |
|----------|----------|----------|---------|
| **Operator** | — | ⛔ Conflict | ⛔ Conflict |
| **Approver** | ⛔ Conflict | — | ✅ Allowed |
| **Auditor** | ⛔ Conflict | ✅ Allowed | — |

- **Aria cannot approve her own meeting bookings** — the founder must confirm.
- **Aria cannot audit her own responses** — the system auditor handles logging.
- **The founder can review audit logs** — but cannot suppress or edit them.

---

## Handoff Workflows

### Lead → Meeting Booking

```
1. Aria qualifies lead (Operator: classify, respond)
2. Aria generates meeting_request record (Operator: log)
3. Meeting request sent to Founder (Operator: escalate)
4. Founder confirms and sends calendar invite (Approver: approve)
5. System logs the booking (Auditor: audit)
```

### Escalation — Enterprise Deal

```
1. Aria detects enterprise signal (>$10k ACV) (Operator: classify)
2. Aria flags and halts autonomous handling (Operator: escalate)
3. Founder takes over conversation (Approver: override)
4. System logs the handoff with full context (Auditor: audit)
```

### Escalation — Frustrated Visitor

```
1. Aria detects frustration or anger (Operator: classify)
2. Aria stops pushing, acknowledges, escalates (Operator: escalate)
3. Founder contacts visitor within SLA (Approver: commit)
4. System logs escalation with sentiment data (Auditor: audit)
```

### Agent Configuration Change

```
1. Founder edits SOUL.md or RULES.md (Approver: configure)
2. System runs gitagent validate (Auditor: validate)
3. System flags any compliance violations (Auditor: alert)
4. Founder reviews and pushes to main (Approver: deploy)
5. System logs the deployment (Auditor: audit)
```

---

## Enforcement

**Level:** `strict`

- All handoff workflows are enforced at the skill level via RULES.md constraints
- Violations are logged and flagged by the audit system
- Meeting bookings without founder confirmation are held in `pending_confirmation` status
- Enterprise leads are automatically routed to founder — Aria cannot override this
- Audit logs are append-only and committed to git history

---

## Compliance Notes

This SOD policy ensures:
- **Accountability** — Every decision has a responsible actor
- **Traceability** — Every action is logged with actor, timestamp, and context
- **Separation** — No single actor can execute a critical process without oversight
- **Auditability** — Full git history provides immutable record of all changes
