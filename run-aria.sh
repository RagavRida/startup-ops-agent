#!/bin/bash

# Simple script to run Aria with gitclaw CLI

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if API key is set
if [ -z "$OPENROUTER_API_KEY" ]; then
    echo "❌ OPENROUTER_API_KEY not set"
    echo ""
    echo "Set it with:"
    echo '  export OPENROUTER_API_KEY="sk-or-v1-..."'
    echo ""
    echo "Or create a .env file with:"
    echo "  OPENROUTER_API_KEY=sk-or-v1-..."
    exit 1
fi

echo "🚀 Starting Aria - Startup Ops Agent"
echo ""
echo "Model: openrouter:anthropic/claude-sonnet-4"
echo "Directory: $(pwd)"
echo ""
echo "Type your message and press Enter."
echo "Type 'exit' or press Ctrl+C to quit."
echo ""
echo "Example prompts:"
echo "  - New visitor: 'We're a 10-person startup drowning in leads'"
echo "  - New signup: 'I just signed up, how do I get started?'"
echo "  - Objection: 'We already use Intercom for this'"
echo "  - Meeting: 'I'd like to schedule a call next week'"
echo ""
echo "---"
echo ""

# Run gitclaw with the current directory
npx gitclaw --dir . --model "openrouter:anthropic/claude-sonnet-4" "$@"
