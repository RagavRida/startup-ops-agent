#!/usr/bin/env node

import http from "http";
import { readFileSync } from "fs";
import { config } from "dotenv";
import axios from "axios";
import { runTool, getCompanyContext } from "./tool-runtime.js";

config();

const PORT = Number(process.env.PORT || 8787);
const API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.OPENROUTER_MODEL || "anthropic/claude-opus-4";

if (!API_KEY) {
  console.error("OPENROUTER_API_KEY not found in .env");
  process.exit(1);
}

const soul = readFileSync("SOUL.md", "utf8");
const rules = readFileSync("RULES.md", "utf8");
const productContext = readFileSync("knowledge/product-context.md", "utf8");
const leadQualify = readFileSync("skills/lead-qualify/SKILL.md", "utf8");
const userOnboard = readFileSync("skills/user-onboard/SKILL.md", "utf8");
const objectionHandle = readFileSync("skills/objection-handle/SKILL.md", "utf8");
const meetingBook = readFileSync("skills/meeting-book/SKILL.md", "utf8");

const sessions = new Map();

function writeJson(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body, null, 2));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (error) {
        reject(error);
      }
    });
    req.on("error", reject);
  });
}

function buildToolPlanningPrompt(message, company) {
  return `${soul}

${rules}

# Product Knowledge
${productContext}

# Skills
${leadQualify}
${userOnboard}
${objectionHandle}
${meetingBook}

# Connected Tools
- lead-lookup(query: string)
- calendar-check(timezone?: string, preferred_times?: string[])
- send-notification(type: string, priority: string, context: object)
- google-meet-create(summary: string, start_time: string, end_time: string, timezone?: string, attendees?: string[])

# Company Context
${JSON.stringify(company)}

Analyze the user message and return strict JSON only:
{
  "assistant_reply_draft": "string",
  "tool_calls": [
    { "name": "lead-lookup", "arguments": { "query": "alex@company.com" } }
  ]
}

Rules:
- If user asks about previous interactions or identity, use lead-lookup.
- If user asks about booking times/availability, use calendar-check.
- If user asks enterprise/legal/security/custom pricing/escalation, use send-notification.
- If user explicitly asks to create/send a Google Meet invite and provides date/time, use google-meet-create.
- Keep tool_calls empty if no tool is needed.

User message: ${message}`;
}

async function callOpenRouter(messages) {
  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 600
    },
    {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/RagavRida/startup-ops-agent",
        "X-Title": "Aria Connected Tools API"
      }
    }
  );

  return response.data.choices?.[0]?.message?.content || "";
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function inferToolCallsFromMessage(message) {
  const text = String(message || "");
  const lower = text.toLowerCase();
  const inferred = [];

  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi);
  if (
    emailMatch ||
    lower.includes("check") ||
    lower.includes("lookup") ||
    lower.includes("already spoke")
  ) {
    inferred.push({
      name: "lead-lookup",
      arguments: { query: (emailMatch && emailMatch[0]) || text }
    });
  }

  if (
    lower.includes("available") ||
    lower.includes("availability") ||
    lower.includes("book") ||
    lower.includes("schedule") ||
    lower.includes("time slot")
  ) {
    inferred.push({
      name: "calendar-check",
      arguments: {}
    });
  }

  if (
    lower.includes("enterprise") ||
    lower.includes("security") ||
    lower.includes("legal") ||
    lower.includes("custom pricing") ||
    lower.includes("escalate")
  ) {
    inferred.push({
      name: "send-notification",
      arguments: {
        type: "escalation",
        priority: "high",
        context: { trigger: "message_rule", message: text }
      }
    });
  }

  return inferred;
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/health") {
    return writeJson(res, 200, { ok: true, model: MODEL });
  }

  if (req.method === "POST" && req.url === "/chat") {
    try {
      const body = await readJsonBody(req);
      const message = String(body.message || "").trim();
      const sessionId = String(body.sessionId || "default");
      if (!message) return writeJson(res, 400, { error: "message is required" });

      const company = getCompanyContext();
      const history = sessions.get(sessionId) || [];

      const plannerPrompt = buildToolPlanningPrompt(message, company);
      const plannerOutput = await callOpenRouter([
        { role: "system", content: plannerPrompt },
        ...history,
        { role: "user", content: message }
      ]);

      const parsed = safeJsonParse(plannerOutput) || {
        assistant_reply_draft: plannerOutput,
        tool_calls: []
      };

      let toolCalls = Array.isArray(parsed.tool_calls) ? parsed.tool_calls : [];
      if (toolCalls.length === 0) {
        toolCalls = inferToolCallsFromMessage(message);
      }
      const toolResults = [];
      for (const call of toolCalls) {
        const name = call?.name;
        const args = call?.arguments || {};
        if (!name) continue;
        const result = await runTool(name, args);
        toolResults.push({ name, arguments: args, result });
      }

      const finalizePrompt = `${soul}

${rules}

Given:
1) Draft reply: ${parsed.assistant_reply_draft || ""}
2) Tool results: ${JSON.stringify(toolResults)}

Return strict JSON only:
{
  "assistant_reply": "string",
  "actions": {
    "fit_score": "strong|medium|weak|unknown",
    "next_action": "meeting-book|self-serve|disqualify|escalate|continue",
    "escalate": true,
    "reason": "string"
  }
}
`;

      const finalized = await callOpenRouter([
        { role: "system", content: finalizePrompt },
        ...history,
        { role: "user", content: message }
      ]);

      const finalParsed = safeJsonParse(finalized) || {
        assistant_reply: parsed.assistant_reply_draft || "Can you share a bit more context?",
        actions: {
          fit_score: "unknown",
          next_action: "continue",
          escalate: false,
          reason: "fallback parser path"
        }
      };

      history.push({ role: "user", content: message });
      history.push({ role: "assistant", content: finalParsed.assistant_reply });
      sessions.set(sessionId, history.slice(-20));

      return writeJson(res, 200, {
        sessionId,
        model: MODEL,
        assistant_reply: finalParsed.assistant_reply,
        tool_calls: toolCalls,
        tool_results: toolResults,
        actions: finalParsed.actions
      });
    } catch (error) {
      return writeJson(res, 500, {
        error: error.response?.data?.error?.message || error.message
      });
    }
  }

  return writeJson(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log(`Aria API listening on http://localhost:${PORT}`);
  console.log("POST /chat with JSON: { message, sessionId }");
});
