# Risk Assessment — Aria (Startup Ops Agent)

> Justification for risk tier classification and mitigation strategy.

---

## Risk Tier: **Medium**

### Justification

Aria operates as a customer-facing AI agent that directly interacts with website visitors. While she does not execute irreversible actions (no payments, no contract signing, no data deletion), she does:

1. **Represent the startup's brand** — Every response is a brand touchpoint
2. **Qualify and route leads** — Misqualification can lose revenue or waste founder time
3. **Handle objections** — Poor handling can damage trust and relationships
4. **Coordinate meetings** — Incorrect bookings create operational friction

These capabilities place Aria above `low` risk (internal tool, no customer impact) but below `high` risk (financial transactions, regulatory filings, PII processing).

---

## Risk Factors

| Factor | Level | Rationale |
|--------|-------|-----------|
| **Customer impact** | Medium | Direct visitor interaction; bad responses damage brand |
| **Data sensitivity** | Low | No PII collection; no payment processing |
| **Reversibility** | High | All actions are reversible; no permanent commitments |
| **Autonomy level** | Medium | Operates autonomously but escalates high-stakes decisions |
| **Financial impact** | Low-Medium | Lost leads cost money; but no direct financial transactions |
| **Compliance exposure** | Low | No regulated industry requirements (startup context) |

---

## Mitigation Controls

### Automated Controls
1. **4-Gate Self-Correction Pipeline** — Every response validated before delivery
2. **Rule Compliance Enforcement** — Hard constraints from RULES.md enforced at runtime
3. **Hallucination Guard** — All claims cross-referenced against product-context.md
4. **Escalation Triggers** — Automatic routing to founder for high-stakes interactions

### Structural Controls
5. **Segregation of Duties** — Aria cannot approve her own meeting bookings (DUTIES.md)
6. **Audit Logging** — Every interaction, correction, and escalation is logged
7. **Git Audit Trail** — All agent changes tracked in version control
8. **CI/CD Validation** — `gitagent validate` runs on every push

### Human Controls
9. **Founder Oversight** — Enterprise deals, custom pricing, and frustrated visitors escalated
10. **Kill Switch** — Agent can be immediately halted if needed
11. **Weekly Review Cadence** — Correction logs reviewed for emerging patterns
12. **Quarterly SOD Audit** — Verify role separation is maintained

---

## Residual Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Tone drift over long conversations | Medium | Low | Gate 2 catches; weekly review |
| New hallucination patterns | Low | Medium | Gate 3 + product-context.md updates |
| Missed escalation trigger | Low | High | Gate 4 + conservative trigger thresholds |
| Visitor manipulation attempts | Low | Medium | RULES.md boundaries + escalation |
| API key exposure | Very Low | High | .gitignore + .env + monthly security review |

---

## Classification Decision

Based on the above analysis, **medium risk tier** is appropriate. This classification triggers:
- Self-correction on every response (not optional)
- SOD enforcement mode: `strict`
- Human-in-the-loop: `on_escalation`
- Audit logging: `enabled` with 1-year retention
- Validation: on every push via CI/CD

---

*Last reviewed: Initial assessment*
*Next review: Per quarterly schedule in validation-schedule.yaml*
