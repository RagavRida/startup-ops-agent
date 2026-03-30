#!/usr/bin/env node

/**
 * Quick test to verify OpenRouter API key and Aria configuration
 */

import { query } from "gitclaw";
import { config } from 'dotenv';

// Load .env file
config();

console.log("🧪 Quick Test: Aria with OpenRouter\n");

// Check API key
if (!process.env.OPENROUTER_API_KEY) {
  console.error("❌ OPENROUTER_API_KEY not found in environment");
  console.log("\nSet it with:");
  console.log('  export OPENROUTER_API_KEY="sk-or-v1-..."');
  console.log("Or create a .env file with the key");
  process.exit(1);
}

console.log("✓ API key found");
console.log("✓ Testing Aria's lead qualification skill...\n");

const testPrompt = `
New visitor message: "Hey, we're a 5-person startup and we're struggling 
to qualify our inbound leads. What does this do?"
`;

try {
  let responseText = "";
  
  for await (const msg of query({
    prompt: testPrompt,
    dir: ".",
    model: "openrouter:anthropic/claude-sonnet-4",
  })) {
    if (msg.type === "delta") {
      process.stdout.write(msg.content);
      responseText += msg.content;
    }
    
    if (msg.type === "assistant") {
      console.log("\n\n" + "=".repeat(50));
      console.log("✅ Test successful!");
      console.log(`Tokens used: ${msg.usage?.totalTokens || "N/A"}`);
      console.log("=".repeat(50));
      
      if (responseText.length > 0) {
        console.log("\n✓ Aria is working correctly!");
        console.log("\nNext steps:");
        console.log("  1. Run full demo: npm run demo");
        console.log("  2. Interactive mode: gitclaw --dir . \"Your message\"");
      }
    }
    
    if (msg.type === "system" && msg.subtype === "error") {
      console.error("\n❌ Error:", msg.content);
    }
  }
} catch (error) {
  console.error("\n❌ Error:", error.message);
  
  if (error.message.includes("API key")) {
    console.log("\nCheck your OpenRouter API key:");
    console.log("  1. Visit https://openrouter.ai/keys");
    console.log("  2. Verify your key is active");
    console.log("  3. Check you have credits");
  } else if (error.message.includes("model")) {
    console.log("\nModel error - try a different model:");
    console.log('  gitclaw --dir . --model "openrouter:openai/gpt-4o" "Test"');
  } else {
    console.log("\nTroubleshooting:");
    console.log("  1. Check your internet connection");
    console.log("  2. Verify gitclaw is installed: npm list gitclaw");
    console.log("  3. Try: npm install gitclaw");
  }
  
  process.exit(1);
}
