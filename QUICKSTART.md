# Quickstart Guide

Get Aria running in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- An OpenRouter API key ([get one here](https://openrouter.ai/keys))
- Git installed

## Step 1: Clone & Install

```bash
git clone https://github.com/yourusername/startup-ops-agent
cd startup-ops-agent
npm install
```

## Step 2: Set Your API Key

```bash
export OPENROUTER_API_KEY="sk-or-v1-..."
```

Or create a `.env` file:
```bash
cp .env.example .env
# Edit .env and add your key
```

## Step 3: Customize Product Context

Edit `knowledge/product-context.md` with your product details:
- Your product name and description
- Your ideal customer profile (ICP)
- Common objections you hear
- Your calendar link

The file is pre-filled with Aria's own context as an example.

## Step 4: Run the Demo

```bash
npm run demo
```

This runs 4 scenarios:
1. Lead qualification
2. User onboarding
3. Objection handling
4. Meeting booking

## Step 5: Interactive Mode

Chat with Aria directly:

```bash
gitclaw --dir . "I'm a founder with 50 inbound leads per day"
```

Or use the SDK in your code:

```javascript
import { query } from "gitclaw";

for await (const msg of query({
  prompt: "New visitor: 'Tell me about your product'",
  dir: ".",
  model: "openrouter:anthropic/claude-sonnet-4",
})) {
  if (msg.type === "delta") {
    process.stdout.write(msg.content);
  }
}
```

## Available Models via OpenRouter

You can use any model from OpenRouter. Update `agent.yaml`:

```yaml
model:
  preferred: openrouter:anthropic/claude-sonnet-4
  fallback:
    - openrouter:openai/gpt-4o
    - openrouter:google/gemini-2.0-flash-exp
    - openrouter:meta-llama/llama-3.3-70b-instruct
```

## Testing Individual Skills

Test specific skills by mentioning them in your prompt:

```bash
# Test lead qualification
gitclaw --dir . "New visitor: 'We're a 10-person startup drowning in leads'"

# Test onboarding
gitclaw --dir . "New signup: Alex, solo founder, needs help getting started"

# Test objection handling
gitclaw --dir . "Lead says: 'We already use Intercom for this'"

# Test meeting booking
gitclaw --dir . "Qualified lead wants to schedule a call next week"
```

## Troubleshooting

### "Cannot find module 'gitclaw'"
```bash
npm install gitclaw
```

### "API key not found"
Make sure you've exported the key:
```bash
echo $OPENROUTER_API_KEY
```

### "Model not found"
Check available models at [OpenRouter Models](https://openrouter.ai/models)

### Agent not following SOUL.md
The agent discovers identity from files automatically. Check that:
- `SOUL.md` exists and has content
- `RULES.md` defines clear constraints
- `agent.yaml` is valid YAML

## Next Steps

1. **Customize for your product** - Edit `knowledge/product-context.md`
2. **Add your own skills** - Create new folders in `skills/`
3. **Deploy** - Use clawless for serverless deployment
4. **Integrate** - Embed in your website or app

## Learn More

- [gitagent Specification](https://github.com/open-gitagent/gitagent/blob/main/spec/SPECIFICATION.md)
- [gitclaw Documentation](https://github.com/open-gitagent/gitclaw)
- [OpenRouter API Docs](https://openrouter.ai/docs)

## Support

- Open an issue on GitHub
- Join the [gitagent Discord](https://discord.gg/gitagent)
- Check the examples in `examples/` folder
