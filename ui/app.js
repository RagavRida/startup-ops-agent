const messagesEl = document.getElementById("messages");
const toolStatusEl = document.getElementById("toolStatus");
const formEl = document.getElementById("chatForm");
const inputEl = document.getElementById("messageInput");
const refreshBtn = document.getElementById("refreshTools");
const sessionId = "ui-" + Math.random().toString(36).slice(2);

function addMessage(role, text, meta = "") {
  const node = document.createElement("div");
  node.className = `bubble ${role}`;
  node.textContent = text;
  if (meta) {
    const metaEl = document.createElement("div");
    metaEl.className = "meta";
    metaEl.textContent = meta;
    node.appendChild(metaEl);
  }
  messagesEl.appendChild(node);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

async function refreshToolStatus() {
  const res = await fetch("/tool-status");
  const data = await res.json();
  toolStatusEl.innerHTML = "";
  Object.entries(data.tools).forEach(([name, details]) => {
    const card = document.createElement("div");
    card.className = `tool ${details.connected ? "ok" : "bad"}`;
    card.innerHTML = `<strong>${name}</strong><br>${details.connected ? "Connected" : "Not connected"}<br><small>${details.message}</small>`;
    toolStatusEl.appendChild(card);
  });
}

formEl.addEventListener("submit", async (e) => {
  e.preventDefault();
  const message = inputEl.value.trim();
  if (!message) return;
  inputEl.value = "";
  addMessage("user", message);

  const res = await fetch("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, message })
  });
  const data = await res.json();
  const tools = (data.tool_calls || []).map((t) => t.name).join(", ") || "none";
  addMessage("assistant", data.assistant_reply || "No response", `Tools used: ${tools}`);
  if (Array.isArray(data.connect_recommendations) && data.connect_recommendations.length > 0) {
    const txt = data.connect_recommendations
      .map((r) => `${r.label}: missing ${r.missing_tools.join(", ")}`)
      .join("\n");
    addMessage("assistant", `To continue this task, connect:\n${txt}`);
  }
});

refreshBtn.addEventListener("click", refreshToolStatus);

addMessage(
  "assistant",
  "Hi, I am Aria. I can auto-select tools for lead lookup, availability, Google Meet creation, and Slack escalation."
);
refreshToolStatus();
