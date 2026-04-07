import { readFileSync } from "fs";
import axios from "axios";
import { google } from "googleapis";
import { config } from "dotenv";

config();

const mockData = JSON.parse(
  readFileSync(new URL("./mock/company-data.json", import.meta.url), "utf8")
);

const TOOL_MODE = (process.env.TOOL_MODE || "mock").toLowerCase();
const LEAD_LOOKUP_API_URL = process.env.LEAD_LOOKUP_API_URL;
const CALENDAR_API_URL = process.env.CALENDAR_API_URL;
const NOTIFICATION_API_URL = process.env.NOTIFICATION_API_URL;
const TOOLS_API_TOKEN = process.env.TOOLS_API_TOKEN;
const GOOGLE_SERVICE_ACCOUNT_EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const GOOGLE_PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
const GOOGLE_SHEETS_SPREADSHEET_ID = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
const GOOGLE_SHEETS_LEADS_RANGE =
  process.env.GOOGLE_SHEETS_LEADS_RANGE || "Leads!A2:H";
const GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || "primary";
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

function normalize(text = "") {
  return text.toLowerCase().trim();
}

function requestConfig() {
  const headers = { "Content-Type": "application/json" };
  if (TOOLS_API_TOKEN) headers.Authorization = `Bearer ${TOOLS_API_TOKEN}`;
  return { headers, timeout: 10000 };
}

function getGoogleAuth() {
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) return null;
  return new google.auth.JWT({
    email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: GOOGLE_PRIVATE_KEY,
    scopes: [
      "https://www.googleapis.com/auth/spreadsheets.readonly",
      "https://www.googleapis.com/auth/calendar"
    ]
  });
}

async function leadLookupViaGoogleSheets(query) {
  if (!GOOGLE_SHEETS_SPREADSHEET_ID) {
    return {
      error: "GOOGLE_SHEETS_SPREADSHEET_ID is not configured",
      existing_lead: null
    };
  }

  const auth = getGoogleAuth();
  if (!auth) {
    return {
      error: "Google service account credentials are not configured",
      existing_lead: null
    };
  }

  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: GOOGLE_SHEETS_SPREADSHEET_ID,
    range: GOOGLE_SHEETS_LEADS_RANGE
  });

  const rows = res.data.values || [];
  const q = normalize(query || "");
  const found = rows.find((row) => {
    const [name = "", email = "", company = ""] = row;
    return (
      normalize(name).includes(q) ||
      normalize(email).includes(q) ||
      normalize(company).includes(q)
    );
  });

  if (!found) return { existing_lead: null, source: "real.google-sheets" };

  const [
    name = "",
    email = "",
    company = "",
    role = "",
    employees = "",
    fit_score = "",
    last_stage = "",
    notes = ""
  ] = found;

  return {
    existing_lead: {
      name,
      email,
      company,
      role,
      employees: Number(employees) || employees,
      fit_score,
      last_stage,
      notes
    },
    source: "real.google-sheets"
  };
}

async function calendarCheckViaGoogle(args = {}) {
  const auth = getGoogleAuth();
  if (!auth) {
    return {
      error: "Google service account credentials are not configured",
      available_slots: []
    };
  }

  const calendar = google.calendar({ version: "v3", auth });
  const now = new Date();
  const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const freebusy = await calendar.freebusy.query({
    requestBody: {
      timeMin: now.toISOString(),
      timeMax: end.toISOString(),
      items: [{ id: GOOGLE_CALENDAR_ID }]
    }
  });

  const busy = freebusy.data.calendars?.[GOOGLE_CALENDAR_ID]?.busy || [];
  return {
    timezone: args.timezone || process.env.COMPANY_TIMEZONE || "UTC",
    preferred_times: args.preferred_times || [],
    busy_slots: busy.slice(0, 10),
    available_slots_hint:
      "Use busy_slots to propose matching free times from preferred window.",
    booking_link: process.env.CALENDAR_BOOKING_LINK || "",
    source: "real.google-calendar"
  };
}

async function sendNotificationViaSlack(args = {}) {
  if (!SLACK_WEBHOOK_URL) {
    return { error: "SLACK_WEBHOOK_URL is not configured", sent: false };
  }

  const payload = {
    text: `Aria escalation (${args.priority || "high"})`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Type:* ${args.type || "escalation"}\n*Priority:* ${
            args.priority || "high"
          }`
        }
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Context:* \n\`\`\`${JSON.stringify(
            args.context || {},
            null,
            2
          )}\`\`\``
        }
      }
    ]
  };

  await axios.post(SLACK_WEBHOOK_URL, payload, { timeout: 10000 });
  return { sent: true, channel: "slack_webhook", source: "real.slack" };
}

async function createGoogleMeetViaCalendar(args = {}) {
  const auth = getGoogleAuth();
  if (!auth) {
    return { error: "Google service account credentials are not configured", created: false };
  }

  if (!args.start_time || !args.end_time) {
    return {
      error: "start_time and end_time are required",
      created: false
    };
  }

  const calendar = google.calendar({ version: "v3", auth });
  const attendees = Array.isArray(args.attendees)
    ? args.attendees.filter(Boolean).map((email) => ({ email }))
    : [];

  const baseBody = {
    summary: args.summary || "Startup Ops Meeting",
    description: args.description || "Scheduled by Aria",
    start: {
      dateTime: args.start_time,
      timeZone: args.timezone || process.env.COMPANY_TIMEZONE || "UTC"
    },
    end: {
      dateTime: args.end_time,
      timeZone: args.timezone || process.env.COMPANY_TIMEZONE || "UTC"
    },
    conferenceData: {
      createRequest: {
        requestId: `aria-${Date.now()}`,
        conferenceSolutionKey: { type: "hangoutsMeet" }
      }
    }
  };

  const { conferenceData, ...noMeetBody } = baseBody;
  const attempts = [
    {
      conferenceDataVersion: 1,
      requestBody: { ...baseBody, attendees },
      attendeeInvitesSent: attendees.length > 0
    },
    {
      conferenceDataVersion: 1,
      requestBody: baseBody,
      attendeeInvitesSent: false
    },
    {
      requestBody: { ...noMeetBody, attendees },
      attendeeInvitesSent: attendees.length > 0
    },
    {
      requestBody: noMeetBody,
      attendeeInvitesSent: false
    }
  ];

  let event;
  let attendeeInvitesSent = false;
  let lastError;
  for (const attempt of attempts) {
    try {
      event = await calendar.events.insert({
        calendarId: GOOGLE_CALENDAR_ID,
        ...attempt
      });
      attendeeInvitesSent = attempt.attendeeInvitesSent;
      break;
    } catch (error) {
      lastError = error;
    }
  }

  if (!event) throw lastError;

  return {
    created: true,
    event_id: event.data.id,
    event_link: event.data.htmlLink || "",
    attendee_invites_sent: attendeeInvitesSent,
    meet_link:
      event.data.hangoutLink ||
      event.data.conferenceData?.entryPoints?.find((p) => p.entryPointType === "video")
        ?.uri ||
      "",
    source: "real.google-calendar-meet"
  };
}

async function runMockTool(name, args = {}) {
  if (name === "lead-lookup") {
    const q = normalize(args.query || "");
    const lead = mockData.leads.find((item) => {
      return (
        normalize(item.email).includes(q) ||
        normalize(item.name).includes(q) ||
        normalize(item.company).includes(q)
      );
    });
    return { existing_lead: lead || null, source: "mock.company-data.leads" };
  }
  if (name === "calendar-check") {
    const timezone = args.timezone || mockData.company.timezone;
    return {
      timezone,
      available_slots: mockData.calendar.available_slots,
      booking_link: mockData.company.calendar_link,
      source: "mock.company-data.calendar"
    };
  }
  if (name === "send-notification") {
    return {
      sent: true,
      destination: mockData.notification_targets,
      type: args.type || "escalation",
      priority: args.priority || "high",
      context: args.context || {},
      source: "mock.company-data.notification_targets"
    };
  }
  if (name === "google-meet-create") {
    return {
      created: true,
      event_id: `mock-event-${Date.now()}`,
      event_link: "https://calendar.google.com/calendar/event?eid=mock",
      meet_link: "https://meet.google.com/mock-link",
      source: "mock.google-meet"
    };
  }
  return { error: `Unknown tool: ${name}`, sent: false };
}

async function runRealTool(name, args = {}) {
  if (name === "lead-lookup") {
    if (LEAD_LOOKUP_API_URL) {
      const response = await axios.post(
        LEAD_LOOKUP_API_URL,
        { query: args.query || "" },
        requestConfig()
      );
      return { ...response.data, source: "real.lead-lookup-api" };
    }
    return leadLookupViaGoogleSheets(args.query || "");
  }

  if (name === "calendar-check") {
    if (CALENDAR_API_URL) {
      const response = await axios.post(
        CALENDAR_API_URL,
        {
          timezone: args.timezone,
          preferred_times: args.preferred_times || []
        },
        requestConfig()
      );
      return { ...response.data, source: "real.calendar-api" };
    }
    return calendarCheckViaGoogle(args);
  }

  if (name === "send-notification") {
    if (NOTIFICATION_API_URL) {
      const response = await axios.post(
        NOTIFICATION_API_URL,
        {
          type: args.type || "escalation",
          priority: args.priority || "high",
          context: args.context || {}
        },
        requestConfig()
      );
      return { ...response.data, source: "real.notification-api" };
    }
    return sendNotificationViaSlack(args);
  }

  if (name === "google-meet-create") {
    return createGoogleMeetViaCalendar(args);
  }

  return { error: `Unknown tool: ${name}`, sent: false };
}

export async function runTool(name, args = {}) {
  try {
    if (TOOL_MODE === "real") return await runRealTool(name, args);
    return await runMockTool(name, args);
  } catch (error) {
    return {
      error: error.response?.data?.error || error.message,
      sent: false
    };
  }
}

export function getCompanyContext() {
  if (TOOL_MODE === "real") {
    return {
      name: process.env.COMPANY_NAME || "Your Company",
      founder: process.env.FOUNDER_NAME || "Founder",
      calendar_link: process.env.CALENDAR_BOOKING_LINK || "Add CALENDAR_BOOKING_LINK",
      timezone: process.env.COMPANY_TIMEZONE || "UTC",
      source: "real.env"
    };
  }
  return mockData.company;
}
