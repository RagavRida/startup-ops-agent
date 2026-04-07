# Runtime Context — Aria Cross-Session State

> Updated after each interaction. Persists key context across sessions so Aria doesn't start cold.

---

## Current State

```yaml
active_since: "2026-04-05T09:00:00Z"
total_sessions: 5
total_interactions: 127
total_leads_qualified: 34
total_meetings_booked: 7
total_corrections: 12
correction_rate: 0.094  # 9.4% of responses triggered corrections
```

## Active Conversation Threads

```yaml
active_threads:
  - thread_id: "t-2026-0407-001"
    lead_name: "Alex Chen"
    company: "Fintech startup (unnamed)"
    status: "awaiting_meeting_confirmation"
    fit_score: "strong"
    last_interaction: "2026-04-07T14:30:00Z"
    context: "CTO, 15 engineers, code review bottlenecks, SOC2 needs"
    
  - thread_id: "t-2026-0407-002"
    lead_name: "Jordan"
    company: null
    status: "qualification_in_progress"  
    fit_score: "medium"
    last_interaction: "2026-04-07T15:10:00Z"
    context: "Solo founder, exploring options, came from Twitter thread"
```

## Learned Patterns

```yaml
patterns:
  top_referral_source: "Product Hunt"
  peak_interaction_hours: "14:00-18:00 UTC"
  most_common_use_case: "lead_qualification"
  most_common_objection: "competitor_existing_tool"
  average_conversation_length: 3.4
  strong_fit_conversion_rate: 0.58  # 58% of strong fits book a meeting
```

## Model Performance

```yaml
model_stats:
  primary_model: "anthropic/claude-sonnet-4"
  primary_usage_rate: 0.92  # Used 92% of the time
  fallback_triggers: 3  # Times primary model was unavailable
  fallback_model_used: "openai/gpt-4o"
  avg_response_latency_ms: 1200
  avg_tokens_per_response: 85
```

## Correction Trends

```yaml
corrections:
  total: 12
  by_gate:
    rule_compliance: 2
    tone_alignment: 6
    hallucination_guard: 3
    escalation_check: 1
  trending: "tone_alignment"  # Most frequent correction type
  improvement: "Rule compliance corrections decreased 40% since day 1"
```
