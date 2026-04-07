#!/usr/bin/env node

import axios from "axios";
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

const skills = {
  "lead-qualify": readFileSync("skills/lead-qualify/SKILL.md", "utf8"),
  "user-onboard": readFileSync("skills/user-onboard/SKILL.md", "utf8"),
  "objection-handle": readFileSync("skills/objection-handle/SKILL.md", "utf8"),
  "meeting-book": readFileSync("skills/meeting-book/SKILL.md", "utf8"),
};

// Chosen startup for hackathon demo
const startupContext = `
# Startup Context: SprintOps

## What SprintOps Does
SprintOps is a workflow automation product for 10-150 person startups.
It helps founders and ops teams automate lead routing, onboarding nudges, and follow-ups.

## ICP
- Founder, Head of Ops, Growth Lead
- 10-150 employees
- Has inbound leads and manual follow-up pain

## Activation Milestone
User connects one lead source and runs first automated follow-up flow.

## Pricing
- Starter: $99/month
- Growth: $299/month
- Enterprise: Custom

## Founder
- Name: Raghav
- Calendar link placeholder: https://cal.com/sprintops/demo
`;

const timeline = [
  {
    skill: "lead-qualify",
    user:
      "Hey, we're a 25-person startup getting 80 inbound leads a week and missing follow-ups. Can this help?",
    label: "Lead Qualification",
  },
  {
    skill: "lead-qualify",
    user:
      "I'm the founder and I need something this month, not next quarter.",
    label: "Qualification Depth",
  },
  {
    skill: "objection-handle",
    user:
      "We already use HubSpot, so I'm not sure why we'd need another tool.",
    label: "Objection Handling",
  },
  {
    skill: "meeting-book",
    user:
      "Okay, makes sense. Let's do a call Tuesday or Wednesday afternoon IST.",
    label: "Meeting Booking",
  },
  {
    skill: "user-onboard",
    user:
      "Also, if we start, what's the fastest way to get value in day one?",
    label: "User Onboarding",
  },
];

let history = [];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ask(skill, userMessage) {
  const systemPrompt = `${soul}

${rules}

# Product Knowledge
${startupContext}

# Active Skill
${skills[skill]}

Return only the assistant reply.`;

  history.push({ role: "user", content: userMessage });

  const response = await axios.post(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      model: MODEL,
      messages: [{ role: "system", content: systemPrompt }, ...history],
      temperature: 0.4,
      max_tokens: 450,
    },
    {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://github.com/RagavRida/startup-ops-agent",
        "X-Title": "SprintOps Real-time Demo",
      },
    }
  );

  const reply = response.data.choices?.[0]?.message?.content || "";
  history.push({ role: "assistant", content: reply });
  return reply;
}

async function main() {
  console.log("\n==============================================================");
  console.log("LIVE REAL-TIME DEMO: SprintOps x Aria");
  console.log("==============================================================");
  console.log("Startup: SprintOps (workflow automation for startup ops)");
  console.log("Flow: Qualify -> Objection -> Meeting -> Onboarding\n");

  for (const [index, step] of timeline.entries()) {
    console.log(`[Step ${index + 1}] ${step.label}`);
    console.log(`Visitor: ${step.user}`);
    try {
      const reply = await ask(step.skill, step.user);
      console.log(`Aria: ${reply}\n`);
    } catch (error) {
      console.error(
        `Aria error: ${error.response?.data?.error?.message || error.message}\n`
      );
      process.exit(1);
    }
    await wait(1200);
  }

  console.log("==============================================================");
  console.log("Demo complete: all core skills shown in live responses.");
  console.log("==============================================================\n");
}

main();
