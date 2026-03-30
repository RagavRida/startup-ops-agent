# Contributing to Aria

Thanks for your interest in contributing! Aria is designed to be forked, customized, and extended.

## Ways to Contribute

### 1. Add New Skills

Create a new skill in `skills/`:

```bash
mkdir -p skills/my-skill
```

Create `skills/my-skill/SKILL.md`:

```markdown
---
name: my-skill
description: "What this skill does"
allowed-tools: Read Write
metadata:
  author: your-name
  version: "1.0.0"
  category: sales
---

# My Skill

## Purpose
What problem this skill solves.

## Flow
Step-by-step instructions for the agent.

## Example Interaction
Show a sample conversation.
```

Update `agent.yaml`:
```yaml
skills:
  - lead-qualify
  - user-onboard
  - meeting-book
  - objection-handle
  - my-skill  # Add your skill
```

### 2. Improve Existing Skills

Found a better way to qualify leads? Improved objection handling? Submit a PR with:
- Clear description of the improvement
- Example showing the before/after behavior
- Updated tests if applicable

### 3. Add Industry-Specific Variants

Fork Aria and customize for specific verticals:
- **SaaS**: B2B qualification, enterprise deal routing
- **E-commerce**: Product recommendations, cart recovery
- **Consulting**: Discovery calls, proposal generation
- **Dev tools**: Technical qualification, integration support

### 4. Contribute to Documentation

- Fix typos or unclear instructions
- Add more examples to QUICKSTART.md
- Create video tutorials
- Write blog posts about your use case

### 5. Report Issues

Found a bug or edge case? Open an issue with:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Your agent.yaml and relevant skill files

## Development Setup

```bash
# Fork and clone
git clone https://github.com/yourusername/startup-ops-agent
cd startup-ops-agent

# Install dependencies
npm install

# Set up your API key
cp .env.example .env
# Edit .env with your OPENROUTER_API_KEY

# Run tests
npm run demo

# Make your changes
# ...

# Test your changes
gitclaw --dir . "Test prompt for your changes"
```

## Pull Request Guidelines

1. **One feature per PR** - Keep changes focused
2. **Update documentation** - If you change behavior, update the docs
3. **Test your changes** - Run the demo and test interactively
4. **Follow the style** - Match the existing tone in SOUL.md and RULES.md
5. **Explain why** - Describe the problem you're solving

## Skill Design Principles

When creating or modifying skills:

1. **One skill, one job** - Don't create mega-skills that do everything
2. **Clear instructions** - The agent should know exactly what to do
3. **Graceful degradation** - Handle edge cases without breaking
4. **Escalation triggers** - Know when to hand off to a human
5. **Tone consistency** - Match Aria's voice from SOUL.md

## Code of Conduct

- Be respectful and constructive
- Focus on the work, not the person
- Welcome newcomers and help them contribute
- No spam, self-promotion, or off-topic discussions

## Questions?

- Open a discussion on GitHub
- Join the gitagent Discord
- Tag @raghavrida on Twitter

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
