#!/usr/bin/env node

/**
 * Test script to verify Aria is configured correctly
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const REQUIRED_FILES = [
  'agent.yaml',
  'SOUL.md',
  'RULES.md',
  'knowledge/product-context.md',
  'skills/lead-qualify/SKILL.md',
  'skills/user-onboard/SKILL.md',
  'skills/meeting-book/SKILL.md',
  'skills/objection-handle/SKILL.md',
  'workflows/full-ops-cycle.yaml',
];

const OPTIONAL_FILES = [
  'package.json',
  'demo.js',
  'README.md',
  'QUICKSTART.md',
  'CONTRIBUTING.md',
  'HACKATHON.md',
  '.gitignore',
  '.env.example',
];

console.log('🔍 Testing Aria Configuration\n');

let passed = 0;
let failed = 0;

// Test 1: Required files exist
console.log('Test 1: Required Files');
for (const file of REQUIRED_FILES) {
  if (existsSync(file)) {
    console.log(`  ✓ ${file}`);
    passed++;
  } else {
    console.log(`  ✗ ${file} - MISSING`);
    failed++;
  }
}

// Test 2: Optional files exist
console.log('\nTest 2: Optional Files');
for (const file of OPTIONAL_FILES) {
  if (existsSync(file)) {
    console.log(`  ✓ ${file}`);
    passed++;
  } else {
    console.log(`  ⚠ ${file} - missing (optional)`);
  }
}

// Test 3: agent.yaml is valid
console.log('\nTest 3: agent.yaml Validation');
try {
  const agentYaml = readFileSync('agent.yaml', 'utf8');
  
  if (agentYaml.includes('spec_version:')) {
    console.log('  ✓ Has spec_version');
    passed++;
  } else {
    console.log('  ✗ Missing spec_version');
    failed++;
  }
  
  if (agentYaml.includes('name:')) {
    console.log('  ✓ Has name');
    passed++;
  } else {
    console.log('  ✗ Missing name');
    failed++;
  }
  
  if (agentYaml.includes('model:')) {
    console.log('  ✓ Has model config');
    passed++;
  } else {
    console.log('  ✗ Missing model config');
    failed++;
  }
  
  if (agentYaml.includes('openrouter:')) {
    console.log('  ✓ Configured for OpenRouter');
    passed++;
  } else {
    console.log('  ⚠ Not using OpenRouter (may need different API key)');
  }
  
} catch (error) {
  console.log(`  ✗ Error reading agent.yaml: ${error.message}`);
  failed++;
}

// Test 4: Skills have proper frontmatter
console.log('\nTest 4: Skill Frontmatter');
const skills = ['lead-qualify', 'user-onboard', 'meeting-book', 'objection-handle'];
for (const skill of skills) {
  try {
    const skillContent = readFileSync(`skills/${skill}/SKILL.md`, 'utf8');
    if (skillContent.startsWith('---') && skillContent.includes('name:') && skillContent.includes('description:')) {
      console.log(`  ✓ ${skill} has valid frontmatter`);
      passed++;
    } else {
      console.log(`  ✗ ${skill} missing or invalid frontmatter`);
      failed++;
    }
  } catch (error) {
    console.log(`  ✗ ${skill} - ${error.message}`);
    failed++;
  }
}

// Test 5: Environment check
console.log('\nTest 5: Environment');
if (process.env.OPENROUTER_API_KEY) {
  console.log('  ✓ OPENROUTER_API_KEY is set');
  passed++;
} else {
  console.log('  ⚠ OPENROUTER_API_KEY not set (required to run)');
}

// Test 6: Dependencies
console.log('\nTest 6: Dependencies');
try {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
  if (pkg.dependencies && pkg.dependencies.gitclaw) {
    console.log('  ✓ gitclaw dependency present');
    passed++;
  } else {
    console.log('  ✗ gitclaw dependency missing');
    failed++;
  }
} catch (error) {
  console.log(`  ✗ Error reading package.json: ${error.message}`);
  failed++;
}

// Summary
console.log('\n' + '='.repeat(50));
console.log(`\n✓ Passed: ${passed}`);
if (failed > 0) {
  console.log(`✗ Failed: ${failed}`);
}
console.log('\n' + '='.repeat(50));

if (failed === 0) {
  console.log('\n🎉 All tests passed! Aria is ready to run.');
  console.log('\nNext steps:');
  console.log('  1. Set your API key: export OPENROUTER_API_KEY="sk-or-v1-..."');
  console.log('  2. Install dependencies: npm install');
  console.log('  3. Run the demo: npm run demo');
  console.log('  4. Or go interactive: gitclaw --dir . "Your message"');
} else {
  console.log('\n⚠️  Some tests failed. Fix the issues above before running.');
  process.exit(1);
}
