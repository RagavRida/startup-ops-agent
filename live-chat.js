#!/usr/bin/env node

import axios from "axios";
import readline from "readline";
import { readFileSync } from "fs";
import { config } from "dotenv";

config();

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
const meetingBook = readFileSync("skills/meeting-book/SKILL.md", "utf8");
const objectionHandle = readFileSync("skills/objection-handle/SKILL.md", "utf8");
const userOnboard = readFileSync("skills/user-onboard/SKILL.md", "utf8");

const systemPrompt = `${soul}

${rules}

# Product Knowledge
${productContext}

# Available Skills
${leadQualify}

${meetingBook}

${objectionHandle}

${userOnboard}

You are Aria in a live conversation. Use one question at a time and keep momentum.`;

const history = [{ role: "system", content: systemPrompt }];

async function askModel(message) {
  history.push({ role: "user", content: message });
  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: MODEL,
      messages: history,
      temperature: 0.4,
      max_tokens: 400,
    },
    {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/RagavRida/startup-ops-agent",
        "X-Title": "Aria Live Chat",
      },
    }
  );

  const reply = response.data.choices?.[0]?.message?.content || "";
  history.push({ role: "assistant", content: reply });
  return reply;
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});
let isClosed = false;
rl.on("close", () => {
  isClosed = true;
});

console.log("Aria live chat started. Type '/exit' to quit.\n");

function prompt() {
  if (isClosed) return;
  rl.question("You: ", async (input) => {
    const trimmed = input.trim();
    if (!trimmed) return prompt();
    if (trimmed === "/exit") {
      rl.close();
      return;
    }
    try {
      const reply = await askModel(trimmed);
      console.log(`Aria: ${reply}\n`);
    } catch (error) {
      console.error(
        `Aria error: ${error.response?.data?.error?.message || error.message}\n`
      );
    }
    if (!isClosed) prompt();
  });
}

prompt();
