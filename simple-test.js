#!/usr/bin/env node

/**
 * Simple direct test with OpenRouter API
 * This bypasses gitclaw to verify the API key works
 */

import axios from 'axios';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const API_KEY = process.env.OPENROUTER_API_KEY;

if (!API_KEY) {
  console.error("❌ OPENROUTER_API_KEY not found");
  process.exit(1);
}

console.log("🧪 Testing OpenRouter API directly\n");

// Load Aria's identity
const soul = readFileSync('SOUL.md', 'utf8');
const rules = readFileSync('RULES.md', 'utf8');
const productContext = readFileSync('knowledge/product-context.md', 'utf8');
const leadQualifySkill = readFileSync('skills/lead-qualify/SKILL.md', 'utf8');

const systemPrompt = `${soul}

${rules}

# Product Knowledge
${productContext}

# Active Skill: Lead Qualification
${leadQualifySkill}

You are Aria, the startup ops agent. A new visitor has just messaged you. Use your lead-qualify skill to engage with them.`;

const userMessage = "Hey, we're a 10-person startup and we're drowning in inbound leads but have no one to qualify them. What exactly does this do?";

console.log("Visitor:", userMessage);
console.log("\nAria's response:\n");

async function testOpenRouter() {
  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'anthropic/claude-sonnet-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.4,
        max_tokens: 1024
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/RagavRida/startup-ops-agent',
          'X-Title': 'Aria - Startup Ops Agent'
        }
      }
    );

    const reply = response.data.choices[0].message.content;
    console.log(reply);
    
    console.log("\n" + "=".repeat(50));
    console.log("✅ Success!");
    console.log(`Model: ${response.data.model}`);
    console.log(`Tokens: ${response.data.usage?.total_tokens || 'N/A'}`);
    console.log("=".repeat(50));
    
    console.log("\n✓ Your OpenRouter API key works!");
    console.log("✓ Aria is responding correctly!");
    console.log("\nNow you can:");
    console.log("  1. Run the full demo (when gitclaw SDK is fixed)");
    console.log("  2. Use this simple-test.js as a template");
    console.log("  3. Build your own integration");
    
  } catch (error) {
    console.error("\n❌ Error:", error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log("\nAPI key issue:");
      console.log("  1. Check your key at https://openrouter.ai/keys");
      console.log("  2. Verify it's active and has credits");
    } else if (error.response?.status === 402) {
      console.log("\nInsufficient credits:");
      console.log("  1. Add credits at https://openrouter.ai/credits");
    } else if (error.response?.status === 404) {
      console.log("\nModel not found:");
      console.log("  1. Check available models at https://openrouter.ai/models");
      console.log("  2. Try: anthropic/claude-3.5-sonnet");
    }
    
    process.exit(1);
  }
}

testOpenRouter();
