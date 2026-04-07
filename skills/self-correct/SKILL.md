---
name: self-correct
description: "Validate draft responses before sending by enforcing rules, tone, factual grounding, and escalation triggers."
allowed-tools: Read Write
metadata:
  author: startup-ops-agent
  version: "1.0.0"
  category: quality
---

# Self Correct

## Purpose
Run a final quality pass before a response reaches the visitor. If any gate fails, revise and re-check.

## 4-Gate Pipeline
1. **Rule Compliance**  
   Validate against `RULES.md`:
   - one question per message
   - no fabricated capabilities or guarantees
   - respect no-interest boundaries
   - include required meeting confirmation fields when applicable

2. **Soul/Tone Alignment**  
   Validate against `SOUL.md`:
   - concise, human, no robotic phrasing
   - direct and warm style
   - pace matches the user's energy

3. **Grounding/Hallucination Guard**  
   Validate against `knowledge/product-context.md`:
   - no invented features/pricing/proofs
   - uncertainty is stated honestly
   - only claim what is known in context

4. **Escalation Check**  
   If custom pricing, legal/security/compliance, enterprise signal, or frustration is present:
   - do not speculate
   - escalate to founder
   - produce a safe handoff response

## Output Contract
Return:
- `validated_response`: final response safe to send
- `corrections_applied`: list of fixes made
- `escalate_to_human`: true/false
- `escalation_reason`: short reason when true

## Execution Notes
- Keep correction cycles short (max 2 retries).
- If still failing after retries, return a safe escalation response.
