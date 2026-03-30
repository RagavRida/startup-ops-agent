#!/usr/bin/env node

/**
 * Complete demo showing all 4 of Aria's skills
 */

import axios from 'axios';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const API_KEY = process.env.OPENROUTER_API_KEY;

if (!API_KEY) {
  console.error("❌ OPENROUTER_API_KEY not found in .env file");
  process.exit(1);
}

// Load Aria's core identity
const soul = readFileSync('SOUL.md', 'utf8');
const rules = readFileSync('RULES.md', 'utf8');
const productContext = readFileSync('knowledge/product-context.md', 'utf8');

async function runDemo(skillName, skillContent, scenario, userMessage) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Demo: ${scenario}`);
  console.log(`Skill: ${skillName}`);
  console.log(`${'='.repeat(60)}\n`);
  
  const systemPrompt = `${soul}

${rules}

# Product Knowledge
${productContext}

# Active Skill
${skillContent}

You are Aria. ${scenario}`;

  console.log(`Visitor: ${userMessage}\n`);
  console.log("Aria's response:\n");

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'anthropic/claude-4-sonnet-20250522',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.4,
        max_tokens: 800
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
    console.log(`\n✓ Tokens: ${response.data.usage?.total_tokens || 'N/A'}`);
    
  } catch (error) {
    console.error(`\n❌ Error: ${error.response?.data?.error?.message || error.message}`);
  }
}

async function main() {
  console.log("🚀 Aria - Complete Skills Demo\n");
  console.log("This demo shows all 4 of Aria's skills in action:");
  console.log("  1. Lead Qualification");
  console.log("  2. User Onboarding");
  console.log("  3. Objection Handling");
  console.log("  4. Meeting Booking\n");
  
  // Demo 1: Lead Qualification
  await runDemo(
    'lead-qualify',
    readFileSync('skills/lead-qualify/SKILL.md', 'utf8'),
    'A new visitor has just messaged you. Qualify them.',
    "Hey, we're a 10-person startup and we're drowning in inbound leads but have no one to qualify them. What exactly does this do?"
  );
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Demo 2: User Onboarding
  await runDemo(
    'user-onboard',
    readFileSync('skills/user-onboard/SKILL.md', 'utf8'),
    'A new user just signed up. Guide them to activation.',
    "Hi! I just signed up. I'm Alex, a solo founder, and I came from a Twitter thread about AI agents. How do I get started?"
  );
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Demo 3: Objection Handling
  await runDemo(
    'objection-handle',
    readFileSync('skills/objection-handle/SKILL.md', 'utf8'),
    'A lead has an objection. Handle it with empathy.',
    "This looks interesting but we already have Intercom for chat. Why would we need this?"
  );
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Demo 4: Meeting Booking
  await runDemo(
    'meeting-book',
    readFileSync('skills/meeting-book/SKILL.md', 'utf8'),
    'A qualified lead wants to schedule a call. Book it.',
    "Yeah, I'd love to jump on a call. I'm free most afternoons this week, Pacific time."
  );
  
  console.log(`\n${'='.repeat(60)}`);
  console.log("✅ All demos complete!");
  console.log(`${'='.repeat(60)}\n`);
  console.log("What you just saw:");
  console.log("  ✓ Lead qualification with BANT-lite signals");
  console.log("  ✓ Personalized onboarding flow");
  console.log("  ✓ Objection handling without pressure");
  console.log("  ✓ Meeting coordination with context collection\n");
  console.log("Aria is ready for your hackathon submission! 🎉\n");
}

main();
