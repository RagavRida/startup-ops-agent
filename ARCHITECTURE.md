# 📐 System Architecture

> How Aria works under the hood — from visitor input to qualified lead output.

---

## Table of Contents

- [System Architecture Diagram](#-system-architecture-diagram)
- [Self-Correction Data Flow](#-self-correction-data-flow)
- [Tech Stack](#-tech-stack)
- [Data Model](#-data-model)
- [Deployment Topology](#-deployment-topology)

---

## 📐 System Architecture Diagram

Aria is a multi-layered AI agent that processes visitor interactions through a structured pipeline. Every layer is version-controlled, auditable, and composable.

```mermaid
graph TB
    subgraph INPUT["🌐 Input Layer"]
        WEB["Website Widget"]
        API["REST API"]
        CLI["gitclaw CLI"]
        SDK["gitclaw SDK"]
    end

    subgraph CORE["🧠 Aria Core Engine"]
        direction TB
        SOUL["SOUL.md<br/>Identity · Tone · Values"]
        RULES["RULES.md<br/>Constraints · Boundaries"]
        DUTIES["DUTIES.md<br/>Role Separation · SOD"]
        
        subgraph ROUTER["⚡ Skill Router"]
            direction LR
            INTENT["Intent<br/>Detector"]
            CONF["Confidence<br/>Scorer"]
            ROUTE["Routing<br/>Engine"]
        end
    end

    subgraph SKILLS["🧩 Composable Skills"]
        LQ["lead-qualify<br/>BANT-lite · ICP Match"]
        UO["user-onboard<br/>Activation Flow"]
        OH["objection-handle<br/>Empathy Playbook"]
        MB["meeting-book<br/>Calendar Coordination"]
        SC["self-correct<br/>Quality Gates"]
    end

    subgraph KNOWLEDGE["📚 Knowledge Layer"]
        PC["product-context.md<br/>ICP · Pain Points · Pricing"]
        MEM["memory/runtime/<br/>dailylog · context"]
        EX["examples/<br/>Few-shot Calibration"]
    end

    subgraph MODEL["🤖 Model Layer"]
        OR["OpenRouter API"]
        C4["Claude Sonnet 4<br/>(Primary)"]
        GPT["GPT-4o<br/>(Fallback 1)"]
        C35["Claude 3.5 Sonnet<br/>(Fallback 2)"]
    end

    subgraph OUTPUT["📤 Output Layer"]
        RESP["Visitor Response"]
        MEET["Meeting Request<br/>(Structured JSON)"]
        ESC["Escalation Alert<br/>→ Founder"]
        AUDIT["Audit Log<br/>(Git Commit)"]
    end

    subgraph GIT["🔒 Git Version Control"]
        COMMITS["Every Change = Commit"]
        BRANCHES["dev → staging → main"]
        DIFF["git diff Agent Versions"]
        BLAME["git blame Audit Trail"]
    end

    %% Flow connections
    WEB & API & CLI & SDK --> INTENT
    SOUL & RULES & DUTIES -.->|"shapes behavior"| ROUTER
    INTENT --> CONF
    CONF --> ROUTE
    
    ROUTE -->|"strong fit"| LQ
    ROUTE -->|"new signup"| UO
    ROUTE -->|"hesitation"| OH
    ROUTE -->|"ready to book"| MB
    
    LQ & UO & OH & MB -->|"every response"| SC
    
    SC -->|"✅ passes"| RESP
    SC -->|"❌ fails"| ROUTE
    SC -->|"meeting"| MEET
    SC -->|"escalate"| ESC
    
    PC & MEM & EX -.->|"context injection"| CORE
    CORE --> OR
    OR --> C4
    OR -.->|"on failure"| GPT
    OR -.->|"on failure"| C35
    
    RESP & MEET & ESC --> AUDIT
    AUDIT --> GIT

    %% Styling
    classDef input fill:#1a1a2e,stroke:#e94560,color:#fff,stroke-width:2px
    classDef core fill:#16213e,stroke:#0f3460,color:#fff,stroke-width:2px
    classDef skills fill:#0f3460,stroke:#533483,color:#fff,stroke-width:2px
    classDef knowledge fill:#533483,stroke:#e94560,color:#fff,stroke-width:2px
    classDef model fill:#1a1a2e,stroke:#e94560,color:#fff,stroke-width:2px
    classDef output fill:#16213e,stroke:#0f3460,color:#fff,stroke-width:2px
    classDef git fill:#0d1117,stroke:#58a6ff,color:#fff,stroke-width:2px

    class WEB,API,CLI,SDK input
    class SOUL,RULES,DUTIES,INTENT,CONF,ROUTE core
    class LQ,UO,OH,MB,SC skills
    class PC,MEM,EX knowledge
    class OR,C4,GPT,C35 model
    class RESP,MEET,ESC,AUDIT output
    class COMMITS,BRANCHES,DIFF,BLAME git
```

### Layer Breakdown

| Layer | Purpose | Key Files |
|-------|---------|-----------|
| **Input** | Accept visitor messages from any channel | SDK, CLI, API endpoints |
| **Core Engine** | Identity + constraints + routing logic | `SOUL.md`, `RULES.md`, `DUTIES.md` |
| **Skill Router** | Detect intent → score confidence → route to skill | `workflows/full-ops-cycle.yaml` |
| **Skills** | Execute focused, composable tasks | `skills/*/SKILL.md` |
| **Knowledge** | Product context + persistent memory | `knowledge/`, `memory/` |
| **Model** | LLM inference with automatic fallback | OpenRouter → Claude → GPT-4o |
| **Output** | Structured responses + audit trail | JSON records, git commits |
| **Git Layer** | Version control for everything | Commits, branches, diffs, blame |

---

## 🔁 Self-Correction Data Flow

Aria doesn't just respond — she **validates every response** through a multi-gate quality pipeline before delivering it to the visitor. If a gate fails, the response is corrected and re-evaluated.

```mermaid
sequenceDiagram
    autonumber
    participant V as 👤 Visitor
    participant I as 🔍 Intent Detector
    participant S as ⚡ Skill Router
    participant K as 📚 Knowledge Base
    participant M as 🤖 LLM (Claude/GPT)
    participant QG as 🛡️ Quality Gates
    participant A as 📋 Audit Log

    V->>I: "We're a 10-person startup drowning in leads"
    
    Note over I: Step 1: Intent Classification
    I->>I: Classify intent type
    I->>I: Score confidence (0.0 - 1.0)
    
    alt Confidence < 0.6
        I->>V: Ask clarifying question
        V->>I: Clarified response
        I->>I: Re-classify with broader context
    end

    I->>S: Intent: lead_qualification (confidence: 0.87)
    
    Note over S: Step 2: Skill Selection & Context Assembly
    S->>K: Load product-context.md
    S->>K: Load memory/runtime/context.md
    S->>K: Load examples/lead-qualification.md
    K-->>S: Assembled context bundle
    
    S->>M: System prompt + skill instructions + context + visitor message

    Note over M: Step 3: Response Generation
    M-->>QG: Raw response draft

    Note over QG: Step 4: Quality Gate Pipeline
    
    rect rgb(40, 40, 60)
        Note over QG: Gate 1: Rule Compliance
        QG->>QG: Scan against RULES.md constraints
        QG->>QG: ✅ No multi-question stacking
        QG->>QG: ✅ No fabricated features
        QG->>QG: ✅ Under 80-word limit
    end

    rect rgb(40, 50, 40)
        Note over QG: Gate 2: Tone Alignment
        QG->>QG: Compare against SOUL.md voice
        QG->>QG: ✅ No "Great question!" phrases
        QG->>QG: ✅ Active voice used
        QG->>QG: ✅ Energy matches visitor
    end

    rect rgb(50, 40, 40)
        Note over QG: Gate 3: Hallucination Guard
        QG->>QG: Cross-reference product-context.md
        QG->>QG: ✅ All features mentioned exist
        QG->>QG: ✅ No invented pricing tiers
        QG->>QG: ✅ No false promises
    end

    rect rgb(50, 50, 30)
        Note over QG: Gate 4: Escalation Check
        QG->>QG: Scan for escalation triggers
        QG->>QG: ✅ No enterprise signals
        QG->>QG: ✅ No frustration detected
        QG->>QG: ✅ No legal/compliance questions
    end

    alt Any gate fails
        QG->>M: Re-generate with correction context
        M-->>QG: Corrected response
        QG->>A: Log correction (gate, reason, before/after)
    end

    QG->>V: ✅ Validated response delivered
    QG->>A: Log interaction (intent, skill, confidence, gates_passed)
    A->>A: Append to memory/runtime/dailylog.md
    A->>A: Update memory/runtime/context.md
```

### Quality Gate Details

| Gate | What It Checks | Fail Action |
|------|---------------|-------------|
| **Rule Compliance** | Every `must always` / `must never` from `RULES.md` | Strip violation, regenerate with constraint reinforced |
| **Tone Alignment** | Banned phrases, voice consistency, energy matching | Rewrite with SOUL.md excerpts as few-shot examples |
| **Hallucination Guard** | All claims verified against `product-context.md` | Remove unverified claims, regenerate with facts only |
| **Escalation Check** | Enterprise signals, frustration, legal/compliance | Route to founder, do not respond autonomously |

### Self-Correction Metrics

```
Correction Rate:     ~8% of responses trigger at least one gate
Top Correction:      Tone drift (too formal for indie hackers)
Avg Latency Added:   <200ms per gate (parallel execution)
Escalation Rate:     ~3% of interactions route to human
```

---

## 🧩 Tech Stack

```mermaid
block-beta
    columns 3
    
    block:AGENT_STANDARD:3
        columns 3
        A["🏗️ Agent Standard<br/>GitAgent v0.1.0"]
        B["⚙️ Runtime SDK<br/>gitclaw v0.3.x"]
        C["☁️ Deployment<br/>clawless (serverless)"]
    end
    
    block:LLM_LAYER:3
        columns 3
        D["🔀 LLM Router<br/>OpenRouter API"]
        E["🧠 Primary Model<br/>Claude Sonnet 4"]
        F["🔄 Fallback Models<br/>GPT-4o · Claude 3.5"]
    end
    
    block:APP_LAYER:3
        columns 3
        G["📦 Runtime<br/>Node.js 18+ (ESM)"]
        H["📡 HTTP Client<br/>Axios"]
        I["🔐 Config<br/>dotenv"]
    end

    block:QUALITY_LAYER:3
        columns 3
        J["🛡️ Self-Correction<br/>4-Gate Pipeline"]
        K["📋 Compliance<br/>SOD · Audit Trail"]
        L["🧪 Testing<br/>26 Validation Tests"]
    end
    
    block:GIT_LAYER:3
        columns 3
        M["🔒 Version Control<br/>Git-native"]
        N["🚀 CI/CD<br/>GitHub Actions"]
        O["📊 Observability<br/>Audit Logs · Memory"]
    end

    style AGENT_STANDARD fill:#1a1a2e,color:#fff
    style LLM_LAYER fill:#16213e,color:#fff
    style APP_LAYER fill:#0f3460,color:#fff
    style QUALITY_LAYER fill:#533483,color:#fff
    style GIT_LAYER fill:#0d1117,color:#fff
```

### Stack Decision Rationale

| Choice | Why |
|--------|-----|
| **GitAgent** | Framework-agnostic standard — agent definition works across Claude Code, OpenAI, LangChain, CrewAI |
| **OpenRouter** | Unified API for 100+ models with automatic fallback — no vendor lock-in |
| **Claude Sonnet 4** | Best balance of quality, speed, and cost for conversational agents |
| **Node.js ESM** | Native async/await, streaming support, wide ecosystem |
| **Git-native** | Every change is a commit — full audit trail, rollback, branching, collaboration |
| **4-Gate Pipeline** | Catches rule violations, tone drift, hallucinations, and escalation needs before they reach the visitor |

### Dependency Graph

```mermaid
graph LR
    A[agent.yaml] -->|defines| B[Skills]
    A -->|configures| C[Model Preferences]
    A -->|enforces| D[Compliance Policy]
    
    E[SOUL.md] -->|shapes| F[Response Tone]
    G[RULES.md] -->|constrains| F
    H[DUTIES.md] -->|separates| I[Role Boundaries]
    
    J[product-context.md] -->|informs| K[Lead Qualification]
    J -->|informs| L[Objection Responses]
    J -->|informs| M[Onboarding Flows]
    
    N[memory/runtime/] -->|persists| O[Cross-session State]
    P[examples/] -->|calibrates| Q[Few-shot Behavior]
    
    R[workflows/] -->|orchestrates| B
    S[hooks/] -->|manages| T[Agent Lifecycle]
    
    U[compliance/] -->|documents| V[Audit Trail]
    
    style A fill:#e94560,color:#fff
    style E fill:#533483,color:#fff
    style G fill:#533483,color:#fff
    style J fill:#0f3460,color:#fff
```

---

## 📊 Data Model

### Lead Record

```yaml
lead:
  id: uuid
  name: string
  company: string | null
  role: string | null
  use_case: enum[lead_gen, onboarding, sales_support, ops_automation, other]
  fit_score: enum[strong, medium, weak]
  confidence: float  # 0.0 - 1.0
  signals:
    budget: boolean | null
    authority: boolean
    need: enum[active, passive, none]
    timeline: enum[urgent, near_term, exploring]
  next_action: enum[meeting-book, self-serve, disqualify, escalate]
  interaction_count: integer
  corrections_applied: integer
  escalated: boolean
  created_at: ISO8601
  updated_at: ISO8601
```

### Meeting Request

```yaml
meeting_request:
  lead_id: uuid
  lead_name: string
  lead_email: string | null
  company: string | null
  preferred_times: string[]
  timezone: string
  meeting_type: enum[discovery, demo, follow_up]
  context: string
  fit_score: strong
  status: enum[pending_confirmation, confirmed, cancelled]
  created_at: ISO8601
```

### Correction Record

```yaml
correction:
  interaction_id: uuid
  gate: enum[rule_compliance, tone_alignment, hallucination_guard, escalation_check]
  severity: enum[minor, major, critical]
  original_snippet: string
  corrected_snippet: string
  rule_violated: string | null
  timestamp: ISO8601
```

---

## 🚀 Deployment Topology

```mermaid
graph TB
    subgraph LOCAL["💻 Local Development"]
        DEV_CLI["gitclaw CLI"]
        DEV_SDK["Node.js + gitclaw SDK"]
        DEV_TEST["npm run demo"]
    end
    
    subgraph HOSTED["☁️ Hosted (clawless)"]
        CL["clawless Runtime"]
        WC["WebContainers"]
        EMBED["Embeddable Widget"]
    end
    
    subgraph CICD["🔄 CI/CD Pipeline"]
        GA["GitHub Actions"]
        VAL["gitagent validate"]
        TEST["npm test (26 tests)"]
    end
    
    subgraph PROD["🌍 Production"]
        WIDGET["Website Chat Widget"]
        SLACK["Slack Integration"]
        ZAPIER["Zapier / Make"]
        CAPI["Custom API"]
    end
    
    DEV_CLI --> LOCAL
    DEV_SDK --> LOCAL
    
    LOCAL -->|"git push"| CICD
    GA --> VAL
    GA --> TEST
    
    CICD -->|"deploy"| HOSTED
    CL --> WC
    WC --> EMBED
    
    HOSTED --> PROD
    EMBED --> WIDGET
    
    classDef local fill:#1a1a2e,stroke:#e94560,color:#fff
    classDef hosted fill:#16213e,stroke:#0f3460,color:#fff
    classDef cicd fill:#0f3460,stroke:#533483,color:#fff
    classDef prod fill:#533483,stroke:#e94560,color:#fff
    
    class DEV_CLI,DEV_SDK,DEV_TEST local
    class CL,WC,EMBED hosted
    class GA,VAL,TEST cicd
    class WIDGET,SLACK,ZAPIER,CAPI prod
```

---

*This architecture is designed to be forked, customized, and extended. Every component is version-controlled and auditable.*
