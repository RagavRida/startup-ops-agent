#!/usr/bin/env node

import { config } from "dotenv";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { runTool } from "./tool-runtime.js";

config();

const server = new Server(
  {
    name: "startup-ops-agent-tools",
    version: "1.0.0"
  },
  {
    capabilities: {
      tools: {}
    }
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "lead-lookup",
        description: "Retrieve prior interaction context for a known lead.",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "Name, email, or company" }
          },
          required: ["query"]
        }
      },
      {
        name: "calendar-check",
        description: "Check available founder calendar windows.",
        inputSchema: {
          type: "object",
          properties: {
            timezone: { type: "string" },
            preferred_times: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      },
      {
        name: "send-notification",
        description: "Send escalation alert to founder/operator channel.",
        inputSchema: {
          type: "object",
          properties: {
            type: { type: "string" },
            priority: { type: "string" },
            context: { type: "object" }
          },
          required: ["type", "priority"]
        }
      },
      {
        name: "google-meet-create",
        description: "Create a Google Calendar event with a Meet link.",
        inputSchema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            description: { type: "string" },
            start_time: { type: "string" },
            end_time: { type: "string" },
            timezone: { type: "string" },
            attendees: { type: "array", items: { type: "string" } }
          },
          required: ["summary", "start_time", "end_time"]
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const result = await runTool(name, args || {});

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(result)
      }
    ]
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("MCP server ready: startup-ops-agent-tools");
