# Demo Video Script (2-3 minutes)

## Opening (15 seconds)

"Hi, I'm Raghav, and I built Aria for the gitagent hackathon.

Aria is an AI employee that lives in a git repo. She qualifies leads, onboards users, handles objections, and books meetings — autonomously."

[Screen: Show the GitHub repo]

## The Problem (20 seconds)

"Every early-stage startup faces the same problem: they can't afford a full-time SDR, onboarding specialist, and ops coordinator. But they need all three.

Most founders do this manually. It doesn't scale. Chatbots collect data but don't act on it."

[Screen: Show a typical startup website with a basic chatbot]

## The Solution (30 seconds)

"Aria is different. She's not a chatbot — she's a structured AI employee built using the gitagent standard.

Here's the structure: agent.yaml defines her model and skills. SOUL.md gives her personality. RULES.md sets hard boundaries. And she has four composable skills."

[Screen: Show the file tree, briefly highlight each file]

"The best part? You customize one file — product-context.md — and she's personalized for your product."

[Screen: Show product-context.md]

## Live Demo 1: Lead Qualification (30 seconds)

"Let me show you. Here's a visitor message: 'We're a 10-person startup drowning in leads.'"

[Screen: Run gitclaw command or demo.js]

"Watch how Aria qualifies them. She asks one question at a time, detects their use case, and scores them as strong, medium, or weak fit. No forms, no friction."

[Screen: Show Aria's response]

## Live Demo 2: Objection Handling (25 seconds)

"Here's another scenario. The lead says: 'We already use Intercom for chat.'"

[Screen: Run the objection handling demo]

"Aria doesn't trash the competitor. She acknowledges it, asks what's missing, and reframes based on the gap. If they say no twice, she stops pushing."

[Screen: Show Aria's response]

## Why It's Different (20 seconds)

"What makes Aria special?

One: She's git-native. Every change is version-controlled. You can fork her, branch her personality, and git diff her rules.

Two: She's composable. Each skill does one thing well, but they chain naturally.

Three: She's production-ready. Escalation triggers, audit trails, clear boundaries."

[Screen: Show git log, workflow file, RULES.md]

## How to Use It (15 seconds)

"To use Aria: clone the repo, set your OpenRouter API key, run npm install, and you're done.

Run the demo to see all four skills in action. Or go interactive with gitclaw."

[Screen: Show terminal with commands]

## Closing (10 seconds)

"This isn't just a hackathon demo. It's the foundation of a real product. Your first AI employee is ready to work.

Check out the repo, fork it, customize it. Thanks for watching!"

[Screen: Show GitHub repo URL and your contact info]

---

## Recording Tips

1. **Keep it tight**: 2-3 minutes max. Judges watch many submissions.
2. **Show, don't tell**: Live demos are more compelling than slides.
3. **Good audio**: Use a decent mic or quiet room.
4. **Screen recording**: Use OBS, Loom, or QuickTime. 1080p minimum.
5. **Pace**: Speak clearly but with energy. Edit out long pauses.
6. **Captions**: Add subtitles if possible (YouTube auto-generates them).

## Alternative: Loom Walkthrough

If you don't want to script it, just do a casual Loom walkthrough:
1. Show the repo structure
2. Explain the problem you're solving
3. Run `npm run demo` and talk through what's happening
4. Show one interactive example with gitclaw
5. Explain why it's different from a chatbot

Keep it conversational and authentic. Judges want to see you understand what you built.

## Thumbnail Ideas

If uploading to YouTube:
- Screenshot of the file tree with "AI Employee in a Git Repo"
- Terminal showing Aria's response with "Startup Ops Agent"
- Split screen: chatbot vs Aria comparison

---

**Good luck with your video! 🎥**
