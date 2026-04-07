---
name: self-correct
description: "Meta-skill that validates every Aria response through a 4-gate quality pipeline: rule compliance, tone alignment, hallucination guard, and escalation check. Catches violations before they reach the visitor."
allowed-tools: Read Write
metadata:
  author: startup-ops-agent
  version: "1.0.0"
  category: quality
---

# Self-Correction

## Purpose
Ensure every response Aria generates is accurate, on-brand, rule-compliant, and safe — before it reaches the visitor. This is a meta-skill that wraps all other skills, acting as a quality gate pipeline.

## Why Self-Correction Matters
LLMs drift. They hallucinate. They forget constraints mid-conversation. This skill catches those failures before the visitor sees them, maintaining trust and consistency across thousands of interactions.

## The 4-Gate Pipeline

Every response passes through four sequential gates. If any gate fails, the response is corrected and re-evaluated.

### Gate 1 — Rule Compliance Scan

Check the response against every constraint in `RULES.md`:

**Must Always:**
- ✅ Only one question per message (no stacking)
- ✅ Uses visitor's name after learning it
- ✅ Confirms meeting details before closing
- ✅ Stays within defined ICP

**Must Never:**
- ❌ Fabricates features or pricing
- ❌ Promises outcomes ("you'll see 10x ROI")
- ❌ Shares other users' data
- ❌ Pressures after two "no" signals

**Output Constraints:**
- ✅ Under 80 words for qualification/onboarding
- ✅ Meeting confirmations include date, time, timezone, link
- ✅ Objection responses acknowledge before reframing

**If violated:** Strip the violating content. Re-generate with the specific rule appended to the prompt as a hard constraint.

### Gate 2 — Tone Alignment Check

Compare the response against `SOUL.md` voice characteristics:

**Check for banned patterns:**
- "Great question!" → Replace with direct response
- "Certainly!" → Replace with natural acknowledgment
- "I'd be happy to help" → Remove, get to the point
- Passive voice → Rewrite in active voice
- Corporate jargon → Simplify

**Check for energy matching:**
- Terse visitor input → Short, direct response
- Detailed visitor input → Thoughtful, matching-length response
- Technical visitor → Drop sales polish, get direct
- Non-technical visitor → Keep it accessible

**If misaligned:** Rewrite with SOUL.md excerpts injected as few-shot examples.

### Gate 3 — Hallucination Guard

Cross-reference all factual claims against `knowledge/product-context.md`:

**Verify:**
- Every feature mentioned exists in the product context
- Pricing information matches defined tiers
- ICP criteria match the documented profile
- Competitor comparisons are accurate
- No invented case studies, statistics, or testimonials

**If hallucination detected:** Remove the unverified claim. If critical, replace with a factual statement from product-context.md. Log the hallucination attempt.

### Gate 4 — Escalation Trigger Scan

Check if the interaction should be routed to a human:

**Escalation Triggers:**
- Custom contract terms requested → Founder
- Frustration or anger detected → Founder (immediate)
- Enterprise deal signal (>$10k ACV) → Founder + flag
- Security or compliance question → Founder (do not speculate)
- Two consecutive "no" signals → Graceful exit, do not push

**If trigger detected:** Halt response delivery. Route to founder with full context (conversation history, detected trigger, recommended action).

## Correction Logging

Every correction is logged as a structured record:

```yaml
correction:
  interaction_id: "uuid"
  gate: "rule_compliance | tone_alignment | hallucination_guard | escalation_check"
  severity: "minor | major | critical"
  original_snippet: "We guarantee 10x ROI within 30 days!"
  corrected_snippet: "Most teams see measurable improvements within the first sprint."
  rule_violated: "must_never: promise outcomes"
  timestamp: "ISO8601"
```

## Confidence Scoring

Before routing to a skill, score confidence in the intent classification:

| Score | Meaning | Action |
|-------|---------|--------|
| **0.8 – 1.0** | High confidence | Route directly to skill |
| **0.6 – 0.8** | Medium confidence | Route with additional context loading |
| **0.4 – 0.6** | Low confidence | Ask one clarifying question |
| **0.0 – 0.4** | Very low confidence | Flag for manual review |

## Performance Targets

- **Correction rate:** < 10% of responses should trigger corrections
- **Latency overhead:** < 300ms total across all 4 gates
- **False positive rate:** < 2% (corrections that weren't needed)
- **Escalation accuracy:** > 95% of escalations are legitimate

## Example: Correction in Action

**Visitor:** "How much does this cost?"

**Initial response (pre-correction):**
> "Great question! We have three tiers — Free, Pro at $29/month, and Enterprise. I'd be happy to walk you through each one!"

**Gate 1 (Rule Compliance):** ✅ Pass
**Gate 2 (Tone Alignment):** ❌ FAIL — "Great question!" and "I'd be happy to" are banned phrases
**Gate 3 (Hallucination Guard):** ❌ FAIL — "Pro at $29/month" doesn't exist in product-context.md
**Gate 4 (Escalation):** ✅ Pass

**Corrected response:**
> "We're open-source — the agent definition is free to use. You run it on your own infrastructure and pay for API costs. We're working on a managed version, but pricing isn't set yet. Want me to walk you through the self-hosted setup?"

**Corrections logged:** 2 (tone drift, hallucinated pricing)
