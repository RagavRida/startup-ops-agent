---
name: meeting-book
description: "Book discovery calls and demos with qualified leads. Confirm availability, collect context, and output a structured meeting request — ready for calendar integration."
allowed-tools: Read Write
metadata:
  author: startup-ops-agent
  version: "1.0.0"
  category: scheduling
---

# Meeting Booking

## Purpose
Convert a qualified lead into a confirmed calendar slot. Collect just enough context for the founder to run a high-quality call — without making the lead fill out a 10-field form before they've decided they want to talk.

## Pre-Conditions
Only trigger this skill when:
- Lead has been scored **strong** by the `lead-qualify` skill, OR
- Lead explicitly asks for a call/demo

Do NOT offer meetings to weak-fit leads.

## Booking Flow

### Step 1 — Confirm Interest
Don't assume. Ask directly:
> "Want to jump on a quick call with [Founder name]? It's usually 20 minutes — you'll leave with a clear picture of whether this makes sense for you."

If yes → proceed. If no → offer async alternative (short video, doc, written Q&A).

### Step 2 — Collect Time Preference
> "What does your calendar look like this week or next? Any times that definitely don't work?"

Accept natural language ("mornings work", "not Friday", "anytime after 2pm IST").

### Step 3 — Confirm Timezone
> "And you're in [detected timezone or ask]?"

Always confirm timezone explicitly. Missed timezone = no-show.

### Step 4 — Collect Meeting Context (Optional but valuable)
One question only:
> "Anything specific you want to make sure we cover on the call?"

This gives the founder prep context and makes the lead feel heard.

### Step 5 — Output Structured Meeting Request
Generate a meeting record in this format:
```
meeting_request:
  lead_name: [name]
  lead_email: [email if collected]
  company: [company if known]
  preferred_times: [list of stated preferences]
  timezone: [confirmed timezone]
  meeting_type: discovery | demo | follow-up
  context: [what they want to cover]
  fit_score: strong
  status: pending_confirmation
  created_at: [ISO 8601]
```

### Step 6 — Close with Confirmation
> "I've sent your details over to [Founder name] — you'll get a confirmed invite within [X hours]. Is [email] the best place to send it?"

Do NOT claim the meeting is confirmed until a calendar invite is actually sent.

## Calendar Integration Note
This skill outputs a structured meeting request. Actual calendar invite delivery requires a connected tool (Calendly API, Google Calendar, Cal.com). If no tool is connected, output the structured record and notify the founder to complete booking manually.

## Handling Edge Cases

**Lead is unavailable this week:**
> "No problem — what about the week after? Or I can send you a booking link and you can grab a slot whenever works."

**Lead wants async only:**
Respect it. Offer: a recorded demo link, a written walkthrough doc, or async video (Loom).

**Lead is enterprise / large deal signal:**
Flag for founder immediately:
> "This sounds like something [Founder name] would want to personally handle — I'm flagging this for them right now. Expect to hear back within the hour."

## Tone Notes
- Make it feel easy. Every friction point costs a booking.
- Don't oversell the meeting. "20 minutes, no pitch" is more compelling than "an exciting opportunity to learn more."
- Thank them for their time at close. One sentence, sincere.
