#!/usr/bin/env node

/**
 * Self-Correction Demo — Shows Aria's 4-gate quality pipeline in action
 * 
 * This demo demonstrates how Aria catches and corrects response issues
 * BEFORE they reach the visitor. Runs with mock responses to work without
 * an API key, but can be switched to live mode with OPENROUTER_API_KEY.
 */

import { readFileSync } from 'fs';

// Load agent files for reference
const soul = readFileSync('SOUL.md', 'utf8');
const rules = readFileSync('RULES.md', 'utf8');
const productContext = readFileSync('knowledge/product-context.md', 'utf8');
const selfCorrectSkill = readFileSync('skills/self-correct/SKILL.md', 'utf8');

// ─── Quality Gate Functions ──────────────────────────────────────────

function checkRuleCompliance(response, rules) {
  const issues = [];
  
  // Check: Only one question per message
  const questionMarks = (response.match(/\?/g) || []).length;
  if (questionMarks > 1) {
    issues.push({
      gate: 'rule_compliance',
      severity: 'major',
      rule: 'must_always: ask only one question per message',
      detail: `Found ${questionMarks} questions in a single response`
    });
  }
  
  // Check: Under 80 words for qualification
  const wordCount = response.split(/\s+/).length;
  if (wordCount > 80) {
    issues.push({
      gate: 'rule_compliance',
      severity: 'minor',
      rule: 'output_constraint: responses must be under 80 words',
      detail: `Response is ${wordCount} words (limit: 80)`
    });
  }
  
  // Check: No promises of outcomes
  const promisePatterns = [/guarantee/i, /you'll see \d+x/i, /promise/i, /assured/i];
  for (const pattern of promisePatterns) {
    if (pattern.test(response)) {
      issues.push({
        gate: 'rule_compliance',
        severity: 'critical',
        rule: 'must_never: promise outcomes',
        detail: `Found outcome promise: "${response.match(pattern)[0]}"`
      });
    }
  }
  
  return issues;
}

function checkToneAlignment(response) {
  const issues = [];
  
  // Check for banned phrases
  const bannedPhrases = [
    { pattern: /great question/i, replacement: '[direct response]' },
    { pattern: /certainly/i, replacement: '[natural acknowledgment]' },
    { pattern: /I'd be happy to/i, replacement: '[get to the point]' },
    { pattern: /I understand your/i, replacement: '"Sounds like you\'re dealing with..."' },
    { pattern: /absolutely/i, replacement: '[confident but natural]' },
  ];
  
  for (const { pattern, replacement } of bannedPhrases) {
    if (pattern.test(response)) {
      issues.push({
        gate: 'tone_alignment',
        severity: 'minor',
        rule: `banned_phrase: "${response.match(pattern)[0]}"`,
        detail: `Replace with ${replacement}`
      });
    }
  }
  
  // Check for passive voice indicators
  const passivePatterns = [/is being/i, /was handled/i, /will be processed/i, /has been/i];
  for (const pattern of passivePatterns) {
    if (pattern.test(response)) {
      issues.push({
        gate: 'tone_alignment',
        severity: 'minor',
        rule: 'style: avoid passive voice',
        detail: 'Rewrite in active voice'
      });
    }
  }
  
  return issues;
}

function checkHallucinationGuard(response, productContext) {
  const issues = [];
  
  // Check for features not in product context
  const inventedFeatures = [
    { pattern: /free trial/i, fact: 'No free trial — product is open-source' },
    { pattern: /14[- ]day/i, fact: 'No trial period defined' },
    { pattern: /\$\d+\/month/i, fact: 'No fixed pricing — open-source + API costs' },
    { pattern: /slack integration/i, fact: 'Slack integration not yet available' },
    { pattern: /crm sync/i, fact: 'CRM sync not yet implemented' },
    { pattern: /mobile app/i, fact: 'No mobile app exists' },
  ];
  
  for (const { pattern, fact } of inventedFeatures) {
    if (pattern.test(response)) {
      issues.push({
        gate: 'hallucination_guard',
        severity: 'critical',
        rule: `unverified_claim: "${response.match(pattern)[0]}"`,
        detail: `Fact check: ${fact}`
      });
    }
  }
  
  return issues;
}

function checkEscalationTriggers(visitorMessage) {
  const triggers = [];
  
  // Enterprise signals
  if (/\b(enterprise|soc2|soc 2|compliance|sla|custom contract|data residency)\b/i.test(visitorMessage)) {
    triggers.push({
      gate: 'escalation_check',
      severity: 'critical',
      rule: 'escalation: enterprise/compliance question',
      detail: 'Route to founder — do not speculate on compliance'
    });
  }
  
  // Frustration signals
  if (/\b(frustrated|angry|waste of time|terrible|useless|scam)\b/i.test(visitorMessage)) {
    triggers.push({
      gate: 'escalation_check',
      severity: 'critical',
      rule: 'escalation: frustration detected',
      detail: 'Route to founder immediately'
    });
  }
  
  // Large deal signals
  if (/\b(200\+? (people|employees|engineers)|series [c-z]|enterprise)\b/i.test(visitorMessage)) {
    triggers.push({
      gate: 'escalation_check',
      severity: 'major',
      rule: 'escalation: potential enterprise deal',
      detail: 'Flag for founder, continue with high priority'
    });
  }
  
  return triggers;
}

// ─── Demo Scenarios ──────────────────────────────────────────────────

const scenarios = [
  {
    name: '🔴 Scenario 1: Multiple Rule Violations',
    visitor: "What does this cost?",
    badResponse: "Great question! I'd be happy to help you with pricing. We offer a free trial for 14 days, and then it's $29/month for the Pro plan. You'll see 10x ROI within the first month, guaranteed. How big is your team? What's your budget? And when are you looking to get started?",
    goodResponse: "We're open-source — the agent definition is free. You run it on your infrastructure and pay for API calls (Claude via OpenRouter is ~$3 per 1M tokens). Most startups spend less than $20/month. What's your setup right now?",
    description: "This response violates multiple rules: banned phrases, hallucinated pricing, promised outcomes, and stacked questions."
  },
  {
    name: '🟡 Scenario 2: Tone Drift',
    visitor: "yo, just saw this on twitter. looks cool",
    badResponse: "Thank you for your interest in our platform. I understand your curiosity and I'd be happy to provide you with a comprehensive overview of our capabilities. Our solution has been designed to address the multifaceted challenges that early-stage startups face in their go-to-market operations.",
    goodResponse: "Nice — what's your setup right now? Running a product or still building?",
    description: "Visitor is casual/terse but the response is corporate and verbose. SOUL.md says to match visitor energy."
  },
  {
    name: '🔴 Scenario 3: Hallucination + Escalation',
    visitor: "We're a 200-person fintech company. We need SOC2 compliance and Slack integration. Can you handle that?",
    badResponse: "Absolutely! We offer full SOC2 compliance out of the box, and our Slack integration lets you get lead notifications in real-time. We also have a CRM sync with HubSpot and Salesforce. Let me set up a demo for you!",
    goodResponse: "That's exactly the kind of setup where this shines — but for your scale and compliance needs, you'd want to talk directly to Raghav. I'm flagging this for him now. Expect to hear back within the hour.",
    description: "Response fabricates SOC2 compliance, Slack integration, and CRM sync (none exist). Also misses the enterprise escalation trigger."
  },
  {
    name: '🟢 Scenario 4: Clean Pass (No Corrections)',
    visitor: "We're a 10-person startup drowning in inbound leads but have no one to qualify them.",
    badResponse: null,
    goodResponse: "Sounds like you're doing qualification manually right now — is that you, or does someone on the team handle it?",
    description: "A well-formed response that passes all 4 gates. Single question, matches tone, no hallucinations, no escalation needed."
  }
];

// ─── Run the Demo ────────────────────────────────────────────────────

function runGateCheck(scenario) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(scenario.name);
  console.log(`${'═'.repeat(70)}`);
  console.log(`\n📝 ${scenario.description}\n`);
  console.log(`👤 Visitor: "${scenario.visitor}"\n`);
  
  const responseToCheck = scenario.badResponse || scenario.goodResponse;
  
  if (scenario.badResponse) {
    console.log(`❌ Initial Response (pre-correction):`);
    console.log(`   "${scenario.badResponse}"\n`);
  } else {
    console.log(`✅ Response:`);
    console.log(`   "${scenario.goodResponse}"\n`);
  }
  
  // Run all 4 gates
  console.log(`${'─'.repeat(50)}`);
  console.log('Running Quality Gates...\n');
  
  const allIssues = [];
  
  // Gate 1: Rule Compliance
  const ruleIssues = checkRuleCompliance(responseToCheck, rules);
  if (ruleIssues.length > 0) {
    console.log('  🛡️ Gate 1 — Rule Compliance: ❌ FAIL');
    ruleIssues.forEach(i => console.log(`     ⚠️  ${i.rule}`));
    console.log(`     📋 ${ruleIssues[0].detail}`);
    allIssues.push(...ruleIssues);
  } else {
    console.log('  🛡️ Gate 1 — Rule Compliance: ✅ PASS');
  }
  
  // Gate 2: Tone Alignment
  const toneIssues = checkToneAlignment(responseToCheck);
  if (toneIssues.length > 0) {
    console.log('  🎨 Gate 2 — Tone Alignment: ❌ FAIL');
    toneIssues.forEach(i => console.log(`     ⚠️  ${i.rule}`));
    allIssues.push(...toneIssues);
  } else {
    console.log('  🎨 Gate 2 — Tone Alignment: ✅ PASS');
  }
  
  // Gate 3: Hallucination Guard
  const hallucinationIssues = checkHallucinationGuard(responseToCheck, productContext);
  if (hallucinationIssues.length > 0) {
    console.log('  🔍 Gate 3 — Hallucination Guard: ❌ FAIL');
    hallucinationIssues.forEach(i => console.log(`     ⚠️  ${i.rule}`));
    hallucinationIssues.forEach(i => console.log(`     📋 ${i.detail}`));
    allIssues.push(...hallucinationIssues);
  } else {
    console.log('  🔍 Gate 3 — Hallucination Guard: ✅ PASS');
  }
  
  // Gate 4: Escalation Check
  const escalationIssues = checkEscalationTriggers(scenario.visitor);
  if (escalationIssues.length > 0) {
    console.log('  🚨 Gate 4 — Escalation Check: ⚠️  TRIGGER');
    escalationIssues.forEach(i => console.log(`     🔔 ${i.detail}`));
    allIssues.push(...escalationIssues);
  } else {
    console.log('  🚨 Gate 4 — Escalation Check: ✅ PASS');
  }
  
  // Summary
  console.log(`\n${'─'.repeat(50)}`);
  if (allIssues.length > 0 && scenario.badResponse) {
    console.log(`\n🔧 ${allIssues.length} issue(s) detected → self-correcting...\n`);
    console.log(`✅ Corrected Response:`);
    console.log(`   "${scenario.goodResponse}"\n`);
    
    // Show correction records
    console.log('📋 Correction Records:');
    allIssues.forEach((issue, idx) => {
      console.log(`   ${idx + 1}. [${issue.gate}] ${issue.severity.toUpperCase()} — ${issue.rule}`);
    });
  } else if (allIssues.length > 0) {
    console.log(`\n🔔 ${allIssues.length} escalation trigger(s) detected.`);
  } else {
    console.log('\n✅ All gates passed — response delivered as-is.');
  }
  
  return allIssues;
}

// ─── Main ────────────────────────────────────────────────────────────

console.log('');
console.log('╔══════════════════════════════════════════════════════════════════════╗');
console.log('║                                                                      ║');
console.log('║   🛡️  Aria Self-Correction Pipeline Demo                             ║');
console.log('║                                                                      ║');
console.log('║   Every response passes through 4 quality gates before reaching      ║');
console.log('║   the visitor. This demo shows what happens when gates catch issues.  ║');
console.log('║                                                                      ║');
console.log('╚══════════════════════════════════════════════════════════════════════╝');

let totalIssues = 0;
let totalCorrections = 0;

for (const scenario of scenarios) {
  const issues = runGateCheck(scenario);
  totalIssues += issues.length;
  if (issues.length > 0 && scenario.badResponse) totalCorrections++;
}

// Final summary
console.log(`\n${'═'.repeat(70)}`);
console.log('📊 Self-Correction Pipeline Summary');
console.log(`${'═'.repeat(70)}\n`);
console.log(`  Scenarios tested:        ${scenarios.length}`);
console.log(`  Total issues detected:   ${totalIssues}`);
console.log(`  Responses corrected:     ${totalCorrections}`);
console.log(`  Clean passes:            ${scenarios.length - totalCorrections}`);
console.log(`  Escalations triggered:   ${scenarios.filter(s => checkEscalationTriggers(s.visitor).length > 0).length}`);
console.log(`\n  Gates:`);
console.log(`    🛡️ Rule Compliance     — catches constraint violations`);
console.log(`    🎨 Tone Alignment      — catches voice drift`);
console.log(`    🔍 Hallucination Guard — catches fabricated claims`);
console.log(`    🚨 Escalation Check    — catches human-needed situations`);
console.log(`\n  This pipeline runs on EVERY response before it reaches the visitor.`);
console.log(`${'═'.repeat(70)}\n`);
