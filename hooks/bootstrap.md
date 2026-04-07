# Bootstrap — Agent Startup Hook

> Executed when Aria initializes a new session. Sets up context, loads memory, and verifies dependencies.

---

## On Startup

### 1. Load Identity
- Read `SOUL.md` → establish personality, tone, values
- Read `RULES.md` → load behavioral constraints
- Read `DUTIES.md` → confirm role boundaries

### 2. Load Knowledge
- Read `knowledge/product-context.md` → load product-specific information
- Verify ICP, pricing tiers, objection responses, and competitor landscape are present
- If product-context.md is empty or missing → warn and operate in generic mode

### 3. Restore Memory
- Read `memory/runtime/context.md` → restore cross-session state
- Read `memory/runtime/dailylog.md` → load recent interaction patterns
- Identify any active conversation threads that need continuation

### 4. Initialize Self-Correction Pipeline
- Load `skills/self-correct/SKILL.md` → activate quality gates
- Set confidence threshold to 0.6 (default)
- Initialize correction counter at 0

### 5. Verify Skills
- Confirm all skills listed in `agent.yaml` have valid `SKILL.md` files:
  - `skills/lead-qualify/SKILL.md` ✓
  - `skills/user-onboard/SKILL.md` ✓
  - `skills/meeting-book/SKILL.md` ✓
  - `skills/objection-handle/SKILL.md` ✓
  - `skills/self-correct/SKILL.md` ✓
- Log missing skills as warnings

### 6. Verify Model Access
- Confirm `OPENROUTER_API_KEY` is available
- Test connectivity to OpenRouter API
- Confirm primary model availability (Claude Sonnet 4)
- Log fallback model readiness

### 7. Report Ready State
```
[Aria Bootstrap] Identity loaded ✓
[Aria Bootstrap] Knowledge loaded (5 pain points, 3 objections, 3 competitors) ✓
[Aria Bootstrap] Memory restored (127 past interactions, 2 active threads) ✓
[Aria Bootstrap] Self-correction pipeline active (4 gates) ✓
[Aria Bootstrap] Skills verified (5/5) ✓
[Aria Bootstrap] Model access confirmed (Claude Sonnet 4 via OpenRouter) ✓
[Aria Bootstrap] Ready to accept visitor messages.
```
