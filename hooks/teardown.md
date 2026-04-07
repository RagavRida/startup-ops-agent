# Teardown — Agent Shutdown Hook

> Executed when Aria's session ends. Persists state, flushes logs, and ensures clean shutdown.

---

## On Shutdown

### 1. Flush Pending Responses
- Complete any in-progress response generation
- If a response is mid-quality-gate, allow gates to finish
- Do not leave visitors with undelivered responses

### 2. Persist Session Memory
- Append session summary to `memory/runtime/dailylog.md`
  - Total interactions this session
  - Leads qualified (with fit scores)
  - Meetings booked
  - Corrections applied
  - Escalations triggered
- Update `memory/runtime/context.md`
  - Update active conversation threads
  - Update learned patterns
  - Update correction trends

### 3. Flag Incomplete Threads
- Identify any active conversations that didn't reach a resolution
- Mark as `status: interrupted` in context.md
- Queue for founder follow-up if lead was strong fit

### 4. Generate Session Report
```yaml
session_report:
  session_id: "s-2026-0407-003"
  started_at: "2026-04-07T09:00:00Z"
  ended_at: "2026-04-07T18:00:00Z"
  duration_hours: 9
  interactions: 47
  leads_qualified: 12
  meetings_booked: 2
  objections_handled: 6
  escalations: 1
  corrections: 3
  correction_rate: 0.064
  interrupted_threads: 0
  model_used: "anthropic/claude-sonnet-4"
  total_tokens: 42350
  estimated_cost: "$0.63"
```

### 5. Clean Up Runtime State
- Clear `.gitagent/` runtime cache
- Remove any temporary files
- Reset in-memory conversation buffers

### 6. Log Shutdown
```
[Aria Teardown] Session s-2026-0407-003 complete
[Aria Teardown] 47 interactions processed, 2 meetings booked
[Aria Teardown] Memory persisted to memory/runtime/
[Aria Teardown] No interrupted threads
[Aria Teardown] Clean shutdown ✓
```
