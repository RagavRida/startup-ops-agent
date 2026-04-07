#!/usr/bin/env node

/**
 * Real Use Case: Aria handling a complete sales cycle
 * 
 * Scenario: A SaaS startup called "DevMetrics" that helps engineering teams
 * track code quality metrics. They get 100+ inbound leads per week from
 * Product Hunt, Twitter, and their blog.
 * 
 * This demo shows a complete conversation from first contact to booked meeting.
 */

import axios from 'axios';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-opus-4';

if (!API_KEY) {
  console.error("❌ OPENROUTER_API_KEY not found");
  process.exit(1);
}

// Load Aria's core identity
const soul = readFileSync('SOUL.md', 'utf8');
const rules = readFileSync('RULES.md', 'utf8');

// Real product context for DevMetrics
const realProductContext = `
# Product Context: DevMetrics

## Product Name
DevMetrics

## One-Line Description
Automated code quality tracking for engineering teams — see what's slowing you down before it becomes a problem.

## Core Pain Points Solved
1. Engineering managers spend hours manually tracking code quality metrics across multiple tools
2. Teams don't know which parts of their codebase are slowing down velocity until it's too late
3. Code review bottlenecks are invisible until they cause missed deadlines
4. Technical debt accumulates silently with no early warning system

## Ideal Customer Profile (ICP)

### Who is a strong fit:
- **Role**: Engineering Manager, VP Engineering, CTO, Tech Lead
- **Company stage**: Series A to Series C, 10-200 engineers
- **Industry**: B2B SaaS, fintech, dev tools, any company with 5+ engineers
- **Signals**: Using GitHub/GitLab, has code review process, experiencing velocity issues, recently scaled team

### Who is NOT a fit:
- Solo developers or teams under 5 engineers
- Non-technical founders without engineering team
- Agencies doing client work (different workflow)
- Companies not using git-based version control

## Activation Milestone
User has connected their GitHub/GitLab repo and viewed their first code quality dashboard showing review bottlenecks and technical debt hotspots.

## Pricing Tiers
- **Free**: Up to 5 developers, basic metrics
- **Team ($49/dev/month)**: Unlimited repos, advanced analytics, Slack integration
- **Enterprise (Custom)**: SSO, custom metrics, dedicated support

## Top 3 Objections
1. "We already track this in GitHub/Jira" — Answer: Those show what happened. We show what's about to slow you down, with predictive alerts.
2. "Our team is too small for this" — Answer: If you have 5+ engineers and code reviews, you have bottlenecks. We just make them visible.
3. "This seems expensive per developer" — Answer: One prevented deadline miss pays for a year. Most teams see ROI in the first sprint.

## Competitor Landscape
1. LinearB — Great for metrics, but focused on DORA. We focus on code quality and bottleneck prediction.
2. Code Climate — Static analysis only. We combine code quality with team velocity patterns.
3. GitHub Insights — Basic metrics. We add predictive analytics and cross-repo intelligence.

## Founder Name & Calendar
- **Founder name**: Sarah Chen (CTO)
- **Calendar link**: https://cal.com/devmetrics/demo
- **Response SLA**: Within 2 hours during business hours PST
`;

// Conversation history
let conversationHistory = [];

async function chat(userMessage, activeSkill = null) {
  console.log(`\n${'─'.repeat(70)}`);
  console.log(`👤 Visitor: ${userMessage}`);
  console.log(`${'─'.repeat(70)}\n`);

  let systemPrompt = `${soul}\n\n${rules}\n\n# Product Knowledge\n${realProductContext}`;
  
  if (activeSkill) {
    const skillContent = readFileSync(`skills/${activeSkill}/SKILL.md`, 'utf8');
    systemPrompt += `\n\n# Active Skill\n${skillContent}`;
  }

  conversationHistory.push({ role: 'user', content: userMessage });

  try {
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversationHistory
        ],
        temperature: 0.4,
        max_tokens: 600
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/RagavRida/startup-ops-agent',
          'X-Title': 'Aria - DevMetrics Demo'
        },
        validateStatus: function (status) {
          return status < 500; // Resolve only if status < 500
        }
      }
    );

    if (response.status !== 200) {
      console.error('API Error:', response.status, response.data);
      process.exit(1);
    }

    if (!response.data.choices || response.data.choices.length === 0) {
      console.error('No choices in response:', response.data);
      process.exit(1);
    }

    const reply = response.data.choices[0].message.content;
    conversationHistory.push({ role: 'assistant', content: reply });
    
    console.log(`🤖 Aria: ${reply}\n`);
    
    return reply;
    
  } catch (error) {
    console.error(`❌ Error: ${error.response?.data?.error?.message || error.message}`);
    if (error.response?.data) {
      console.error('Full error:', JSON.stringify(error.response.data, null, 2));
    }
    process.exit(1);
  }
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('🎬 REAL USE CASE: Complete Sales Cycle with Aria');
  console.log('='.repeat(70));
  console.log('\nProduct: DevMetrics (Code Quality Tracking for Engineering Teams)');
  console.log('Visitor: Alex, Engineering Manager at a 50-person startup');
  console.log('Source: Found DevMetrics on Product Hunt');
  console.log('\n' + '='.repeat(70));

  // Turn 1: Initial contact - Lead Qualification
  await chat(
    "Hey, I saw you on Product Hunt. We're a 50-person startup with about 15 engineers, and our code reviews are taking forever. PRs sit for days. Is this something that could help?",
    'lead-qualify'
  );
  
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Turn 2: Visitor responds - Continue qualification
  await chat(
    "Yeah, I'm the engineering manager. I've been manually tracking this in spreadsheets but it's a mess. How does this actually work?",
    'lead-qualify'
  );
  
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Turn 3: Objection comes up
  await chat(
    "Interesting. But we already get some of this data from GitHub Insights. What's different here?",
    'objection-handle'
  );
  
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Turn 4: Objection resolved, ready to move forward
  await chat(
    "Ah, that makes sense. The predictive part is what we're missing. We only find out about bottlenecks when they've already caused delays.",
    'lead-qualify'
  );
  
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Turn 5: Meeting booking
  await chat(
    "Yeah, let's do a call. I'm free Tuesday or Wednesday afternoon, Pacific time. What works?",
    'meeting-book'
  );
  
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Turn 6: Confirm details
  await chat(
    "Tuesday at 2pm works great. My email is alex@startup.com. Anything I should prepare?",
    'meeting-book'
  );

  console.log('\n' + '='.repeat(70));
  console.log('✅ COMPLETE SALES CYCLE DEMONSTRATED');
  console.log('='.repeat(70));
  console.log('\nWhat just happened:');
  console.log('  1. ✓ Lead qualification - Identified strong fit (EM, 15 engineers, active pain)');
  console.log('  2. ✓ Objection handling - Addressed "we already have GitHub Insights"');
  console.log('  3. ✓ Value articulation - Explained predictive analytics differentiator');
  console.log('  4. ✓ Meeting booked - Tuesday 2pm PT with context collected');
  console.log('\nOutcome: Qualified lead → Booked demo → Zero human intervention');
  console.log('\nThis is what Aria does 24/7 for every inbound visitor.');
  console.log('='.repeat(70) + '\n');
}

main();
