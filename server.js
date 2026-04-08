#!/usr/bin/env node

import http from "http";
import { readFileSync } from "fs";
import { config } from "dotenv";
import axios from "axios";
import { runTool, getCompanyContext, getToolConnectionStatus } from "./tool-runtime.js";

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
const uiHtml = readFileSync("ui/index.html", "utf8");
const uiJs = readFileSync("ui/app.js", "utf8");
const uiCss = readFileSync("ui/styles.css", "utf8");

const sessions = new Map();
const sessionConnectorSelections = new Map();
const connectorCatalog = {
  "google-workspace": {
    id: "google-workspace",
    label: "Google Workspace",
    tools: ["lead-lookup", "calendar-check", "google-meet-create"],
    connect_instructions:
      "Set GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY, GOOGLE_SHEETS_SPREADSHEET_ID, and GOOGLE_CALENDAR_ID in .env, then share sheet/calendar with the service account."
  },
  slack: {
    id: "slack",
    label: "Slack",
    tools: ["send-notification"],
    connect_instructions: "Set SLACK_WEBHOOK_URL in .env from Slack Incoming Webhooks."
  }
};

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
  if (!text) return null;
  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (fenceMatch) cleaned = fenceMatch[1].trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try extracting first JSON object from text
    const objMatch = cleaned.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        return JSON.parse(objMatch[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

function getConnectorStatus() {
  const status = getToolConnectionStatus();
  return Object.values(connectorCatalog).map((connector) => {
    const connected = connector.tools.every(
      (toolName) => status.tools[toolName] && status.tools[toolName].connected
    );
    return {
      ...connector,
      connected
    };
  });
}

function suggestConnectorsForTools(toolCalls = [], toolResults = []) {
  const status = getToolConnectionStatus();
  const neededTools = new Set();

  for (const call of toolCalls) {
    if (call?.name) neededTools.add(call.name);
  }
  for (const result of toolResults) {
    if (result?.result?.error && result?.name) neededTools.add(result.name);
  }

  const recommendations = [];
  for (const connector of Object.values(connectorCatalog)) {
    const isRelevant = connector.tools.some((t) => neededTools.has(t));
    const isConnected = connector.tools.every(
      (t) => status.tools[t] && status.tools[t].connected
    );
    if (isRelevant && !isConnected) {
      recommendations.push({
        connector_id: connector.id,
        label: connector.label,
        missing_tools: connector.tools.filter(
          (t) => !status.tools[t] || !status.tools[t].connected
        ),
        connect_instructions: connector.connect_instructions
      });
    }
  }
  return recommendations;
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

  const asksForMeet =
    lower.includes("google meet") ||
    lower.includes("gmeet") ||
    lower.includes("meet link") ||
    lower.includes("create meet");
  const hasTimeSignal =
    /\d{1,2}(:\d{2})?\s?(am|pm)/i.test(text) ||
    /\d{4}-\d{2}-\d{2}t\d{2}:\d{2}/i.test(text) ||
    lower.includes("tomorrow") ||
    lower.includes("today") ||
    lower.includes("tuesday") ||
    lower.includes("wednesday") ||
    lower.includes("thursday") ||
    lower.includes("friday");

  if (asksForMeet && hasTimeSignal) {
    const now = new Date();
    const start = new Date(now.getTime() + 60 * 60 * 1000);
    const end = new Date(now.getTime() + 90 * 60 * 1000);
    inferred.push({
      name: "google-meet-create",
      arguments: {
        summary: "Discovery Call",
        description: "Scheduled by Aria via auto tool routing",
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        timezone: "UTC",
        attendees: emailMatch || []
      }
    });
  }

  return inferred;
}

const server = http.createServer(async (req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(uiHtml);
    return;
  }

  if (req.method === "GET" && req.url === "/app.js") {
    res.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8" });
    res.end(uiJs);
    return;
  }

  if (req.method === "GET" && req.url === "/styles.css") {
    res.writeHead(200, { "Content-Type": "text/css; charset=utf-8" });
    res.end(uiCss);
    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    return writeJson(res, 200, { ok: true, model: MODEL });
  }

  if (req.method === "GET" && req.url === "/tool-status") {
    return writeJson(res, 200, getToolConnectionStatus());
  }

  if (req.method === "GET" && req.url === "/connectors") {
    return writeJson(res, 200, {
      connectors: getConnectorStatus()
    });
  }

  if (req.method === "POST" && req.url === "/connect") {
    try {
      const body = await readJsonBody(req);
      const sessionId = String(body.sessionId || "default");
      const connectorId = String(body.connectorId || "");
      const connector = connectorCatalog[connectorId];
      if (!connector) return writeJson(res, 400, { error: "unknown connectorId" });

      const selected = sessionConnectorSelections.get(sessionId) || new Set();
      selected.add(connectorId);
      sessionConnectorSelections.set(sessionId, selected);

      return writeJson(res, 200, {
        ok: true,
        sessionId,
        connector: {
          id: connector.id,
          label: connector.label
        },
        message: `Connector selected: ${connector.label}. ${connector.connect_instructions}`
      });
    } catch (error) {
      return writeJson(res, 500, { error: error.message });
    }
  }

  if (req.method === "POST" && req.url === "/chat") {
    try {
      const body = await readJsonBody(req);
      const message = String(body.message || "").trim();
      const sessionId = String(body.sessionId || "default");
      if (!message) return writeJson(res, 400, { error: "message is required" });

      const lowerMessage = message.toLowerCase();
      if (lowerMessage.startsWith("connect ")) {
        const connectorId = lowerMessage.includes("slack")
          ? "slack"
          : lowerMessage.includes("google")
          ? "google-workspace"
          : "";
        if (connectorId && connectorCatalog[connectorId]) {
          const selected = sessionConnectorSelections.get(sessionId) || new Set();
          selected.add(connectorId);
          sessionConnectorSelections.set(sessionId, selected);
          const connector = connectorCatalog[connectorId];
          return writeJson(res, 200, {
            sessionId,
            model: MODEL,
            assistant_reply: `Great — I marked ${connector.label} for this startup workspace. ${connector.connect_instructions}`,
            tool_calls: [],
            tool_results: [],
            actions: {
              fit_score: "unknown",
              next_action: "continue",
              escalate: false,
              reason: "connector_selection"
            },
            connect_recommendations: suggestConnectorsForTools([], [])
          });
        }
      }

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
      const inferredCalls = inferToolCallsFromMessage(message);
      if (inferredCalls.length > 0) {
        // Merge inferred calls into model-provided calls to ensure required actions execute.
        const seen = new Set(toolCalls.map((c) => String(c?.name || "")));
        for (const call of inferredCalls) {
          const name = String(call?.name || "");
          if (!name) continue;
          if (seen.has(name)) continue;
          toolCalls.push(call);
          seen.add(name);
        }
      }
      const toolResults = [];
      for (const call of toolCalls) {
        const name = call?.name;
        const args = call?.arguments || {};
        if (!name) continue;
        const result = await runTool(name, args);
        toolResults.push({ name, arguments: args, result });
      }

      const failingTools = toolResults
        .filter((t) => t.result && t.result.error)
        .map((t) => t.name);
      const connectionHint =
        failingTools.length > 0
          ? `If tool execution failed, ask the user to connect/configure these tools: ${failingTools.join(
              ", "
            )}.`
          : "";

      const finalizePrompt = `${soul}

${rules}

Given:
1) Draft reply: ${parsed.assistant_reply_draft || ""}
2) Tool results: ${JSON.stringify(toolResults)}
3) Connection hint: ${connectionHint}

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
        actions: finalParsed.actions,
        connect_recommendations: suggestConnectorsForTools(toolCalls, toolResults)
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
  console.log("Open UI at http://localhost:" + PORT);
  console.log("POST /chat with JSON: { message, sessionId }");
});
