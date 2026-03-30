#!/usr/bin/env node

/**
 * Demo: Running Aria (startup-ops-agent) with gitclaw
 * 
 * This shows how to use the gitclaw SDK to interact with Aria,
 * the AI employee for startup operations.
 */

import { query } from "gitclaw";

// Example 1: Lead Qualification
async function demoLeadQualification() {
  console.log("\n=== Demo 1: Lead Qualification ===\n");
  
  const prompt = `
    New visitor message: "Hey, I found you on Product Hunt. We're a 10-person 
    startup and we're drowning in inbound leads but have no one to qualify them. 
    What exactly does this do?"
  `;

  for await (const msg of query({
    prompt,
    dir: ".",
    model: "openrouter:anthropic/claude-sonnet-4",
  })) {
    if (msg.type === "delta") {
      process.stdout.write(msg.content);
    }
    if (msg.type === "assistant") {
      console.log("\n\n✓ Lead qualification complete");
      console.log(`Tokens used: ${msg.usage?.totalTokens || "N/A"}`);
    }
  }
}

// Example 2: User Onboarding
async function demoUserOnboarding() {
  console.log("\n=== Demo 2: User Onboarding ===\n");
  
  const prompt = `
    New user just signed up. Their name is Alex, they're a solo founder, 
    and they came from a Twitter thread about AI agents. Guide them to 
    their first activation moment.
  `;

  for await (const msg of query({
    prompt,
    dir: ".",
    model: "openrouter:anthropic/claude-sonnet-4",
  })) {
    if (msg.type === "delta") {
      process.stdout.write(msg.content);
    }
    if (msg.type === "assistant") {
      console.log("\n\n✓ Onboarding flow complete");
    }
  }
}

// Example 3: Objection Handling
async function demoObjectionHandling() {
  console.log("\n=== Demo 3: Objection Handling ===\n");
  
  const prompt = `
    Lead says: "This looks interesting but we already have Intercom for chat. 
    Why would we need this?"
  `;

  for await (const msg of query({
    prompt,
    dir: ".",
    model: "openrouter:anthropic/claude-sonnet-4",
  })) {
    if (msg.type === "delta") {
      process.stdout.write(msg.content);
    }
    if (msg.type === "assistant") {
      console.log("\n\n✓ Objection handled");
    }
  }
}

// Example 4: Meeting Booking
async function demoMeetingBooking() {
  console.log("\n=== Demo 4: Meeting Booking ===\n");
  
  const prompt = `
    Qualified lead (strong fit - founder, 15-person startup, active pain point).
    They said: "Yeah, I'd love to jump on a call. I'm free most afternoons this 
    week, Pacific time."
  `;

  for await (const msg of query({
    prompt,
    dir: ".",
    model: "openrouter:anthropic/claude-sonnet-4",
  })) {
    if (msg.type === "delta") {
      process.stdout.write(msg.content);
    }
    if (msg.type === "assistant") {
      console.log("\n\n✓ Meeting booking initiated");
    }
  }
}

// Run all demos
async function main() {
  console.log("🚀 Aria Demo - Startup Ops Agent\n");
  console.log("This demo shows Aria handling different startup ops scenarios.\n");
  
  try {
    await demoLeadQualification();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await demoUserOnboarding();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await demoObjectionHandling();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await demoMeetingBooking();
    
    console.log("\n\n✅ All demos complete!");
    console.log("\nTo run Aria interactively:");
    console.log("  gitclaw --dir . \"[Your message here]\"");
    
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.log("\nMake sure you have:");
    console.log("  1. Installed gitclaw: npm install gitclaw");
    console.log("  2. Set your OpenRouter API key: export OPENROUTER_API_KEY=sk-or-...");
  }
}

main();
