# mean-openclaw-be

Backend for a **MEAN + OpenClaw AI Business Agent** built with Node.js, Express, MongoDB, OpenClaw, and Ollama.

The backend provides the API layer for the Angular frontend, exposes CRM operations as AI tools/functions, integrates with OpenClaw, and provides an Ollama-powered fallback for general AI questions.

---

# 🚀 Demos

## Demo #1 — OpenClaw WhatsApp Agent ✅

The backend supports an OpenClaw-powered WhatsApp business agent.

WhatsApp messages can be routed through OpenClaw and processed by the AI business agent.

### Example

**WhatsApp User**

> How many customers are in the CRM?

**Agent**

> There are 5 customers in the CRM.

### Flow

```text id="7zmy9w"
WhatsApp
   ↓
OpenClaw
   ↓
AI Business Agent
   ↓
Backend
   ↓
CRM Tools / Ollama
   ↓
Response
   ↓
WhatsApp
```

---

# 🤖 Demo #2 — OpenClaw AI Business Agent

The backend provides an AI business agent capable of executing CRM operations through structured **tools/functions**.

The agent can determine whether a request requires a CRM operation or should be handled as a general AI question.

### Supported CRM Operations

```text id="7r7b5q"
getCustomerCount
searchCustomers
getCustomer
createCustomer
updateCustomer
deleteCustomer
```

---

# 🔧 CRM Tool / Function Calling

CRM operations are exposed as structured tools that operate directly against MongoDB.

## Customer Count

**Request**

> How many customers are in the CRM?

**Tool**

```text id="5c3p4r"
getCustomerCount()
```

**Response**

```text id="9j4c1m"
There are 5 customers in the CRM.
```

---

## Customer Search

**Request**

> Which customers have Toyota vehicles?

**Tool**

```text id="6e0qyt"
searchCustomers({
  query: "toyota"
})
```

**Response**

```text id="5iz4wt"
Ahmed Khan — Toyota Corolla (2022)
Usman Ali — Toyota Yaris (2021)
```

The search can match:

* Customer name
* Phone number
* Email address
* Vehicle make
* Vehicle model

---

## Customer Details

**Request**

> Find Ahmed Khan and give me his phone, email, and vehicle details.

**Tool**

```text id="5l2y0r"
searchCustomers({
  query: "Ahmed Khan"
})
```

**Response**

```text id="d9u6ta"
Ahmed Khan

Phone: +923001111111
Email: ahmed@example.com
Vehicle: Toyota Corolla (2022)
```

---

# 🧠 Ollama Fallback

Requests that are not recognized as CRM operations are forwarded to the AI model through OpenClaw and Ollama.

### Example

**Request**

> What is the capital of France?

**AI Response**

> The capital of France is Paris.

This creates two paths:

```text id="u6y9c4"
                    User Request
                         │
                         ↓
                 AI Business Agent
                         │
                ┌────────┴────────┐
                │                 │
           CRM Request       General Request
                │                 │
                ↓                 ↓
          CRM Tool Layer        Ollama
                │                 │
                ↓                 ↓
             MongoDB          AI Response
                │                 │
                └────────┬────────┘
                         ↓
                    Final Response
```

---

# 🌐 API Endpoints

## AI Agent

### POST `/api/openclaw/agent/chat`

Send a message to the AI business agent.

Example:

```bash id="o4ts8j"
curl -X POST http://127.0.0.1:3000/api/openclaw/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"How many customers are in the CRM?"}'
```

Example response:

```json id="8my8p2"
{
  "success": true,
  "message": "There are 5 customers in the CRM.",
  "toolCalls": [
    {
      "name": "getCustomerCount",
      "arguments": {},
      "result": {
        "success": true,
        "count": 5
      }
    }
  ]
}
```

---

# 👥 CRM API

The backend exposes CRM operations for the OpenClaw integration.

### Customer Count

```text id="bq31u5"
GET /api/openclaw/crm/customers/count
```

Example:

```bash id="v3p3qf"
curl http://127.0.0.1:3000/api/openclaw/crm/customers/count
```

Response:

```json id="5l8a1m"
{
  "success": true,
  "count": 5
}
```

### Customer Search

```text id="2q1g0n"
GET /api/openclaw/crm/customers/search?q=toyota
```

Example:

```bash id="8t4b0y"
curl "http://127.0.0.1:3000/api/openclaw/crm/customers/search?q=toyota"
```

### Customer Details

```text id="n5w8p2"
GET /api/openclaw/crm/customers/:customerId
```

---

# 🧩 OpenClaw CRM Plugin

The project includes a custom OpenClaw plugin:

```text id="f5e3u9"
openclaw-crm-plugin
```

Plugin ID:

```text id="8n6j2x"
crm-tools
```

The plugin exposes CRM functionality to OpenClaw through tools/functions including:

```text id="2p9d4v"
getCustomer
getCustomerCount
searchCustomers
```

The plugin communicates with the backend CRM API.

```text id="6x2f8k"
OpenClaw
    ↓
CRM Tools Plugin
    ↓
Backend CRM API
    ↓
MongoDB
```

---

# 🏗️ Architecture

```text id="v7j5r2"
                         ┌──────────────────┐
                         │      Angular     │
                         │     Frontend     │
                         └────────┬─────────┘
                                  │
                                  ↓
                         ┌──────────────────┐
                         │   Express API    │
                         └────────┬─────────┘
                                  │
                     ┌────────────┴────────────┐
                     │                         │
              Agent Endpoint              CRM API
                     │                         │
                     ↓                         ↓
              Business Agent             CRM Tools
                     │                         │
              ┌──────┴──────┐                  ↓
              │             │               MongoDB
         CRM Request   General Request
              │             │
              ↓             ↓
         CRM Tools        Ollama
              │             │
              ↓             ↓
           MongoDB       AI Response
```

---

# 🛠️ Tech Stack

* **Node.js** — Backend runtime
* **TypeScript** — Backend development
* **Express** — REST API
* **MongoDB** — CRM database
* **Mongoose** — MongoDB ODM
* **OpenClaw** — AI agent orchestration
* **Ollama** — Local AI inference
* **Qwen** — Local language model
* **WhatsApp** — Messaging channel
* **Axios** — HTTP communication

---

# 📁 Project Structure

```text id="j0g8v3"
mean-openclaw-be/
│
├── src/
│   ├── integrations/
│   │   └── openclaw/
│   │       ├── openclaw.client.ts
│   │       └── openclaw-agent.service.ts
│   │
│   ├── models/
│   │   └── customer.model.ts
│   │
│   ├── routes/
│   │   ├── agent.routes.ts
│   │   └── openclaw/
│   │       └── crm.routes.ts
│   │
│   ├── tools/
│   │   └── customer.tools.ts
│   │
│   └── app.ts
│
├── openclaw-crm-plugin/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── package.json
└── README.md
```

---

# ⚙️ Environment Configuration

Create a `.env` file in the backend project.

Example configuration:

```text id="c2y4vn"
OPENCLAW_BASE_URL=http://127.0.0.1:18789
OPENCLAW_MODEL=openclaw/crm
```

Do not commit `.env` or API keys/secrets to source control.

---

# 💻 Installation

Install dependencies:

```bash id="x2f7q8"
npm install
```

---

# ▶️ Development Server

Start the backend in development mode:

```bash id="q0t9m4"
npm run dev
```

The backend runs on:

```text id="1u6j5s"
http://localhost:3000
```

---

# 🔍 Testing the Backend

### Check Customer Count

```bash id="7y3q8w"
curl http://127.0.0.1:3000/api/openclaw/crm/customers/count
```

### Test AI Agent

```bash id="4f0c9k"
curl -X POST http://127.0.0.1:3000/api/openclaw/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"How many customers are in the CRM?"}'
```

### Test Vehicle Search

```bash id="8x5n2m"
curl -X POST http://127.0.0.1:3000/api/openclaw/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"Which customers have Toyota vehicles?"}'
```

### Test General AI

```bash id="6k3r1p"
curl -X POST http://127.0.0.1:3000/api/openclaw/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What is the capital of France?"}'
```

---

# 🏗️ Build

Create a production build:

```bash id="3c8m5q"
npm run build
```

---

# 🎯 Project Goal

This backend demonstrates how an AI agent can interact with real business data instead of only generating text.

The architecture combines:

```text id="0b4n7v"
OpenClaw
    +
Ollama
    +
Tool / Function Calling
    +
Express
    +
MongoDB
    +
CRM Data
    +
WhatsApp
```

The result is an AI business agent capable of:

1. Understanding user requests
2. Detecting CRM-related operations
3. Selecting the appropriate tool
4. Executing database operations
5. Returning structured business information
6. Handling general questions through Ollama
7. Supporting WhatsApp-based business conversations

---

# 🔐 Security

Keep sensitive configuration outside source control.

Do not commit:

```text id="5j8x3k"
.env
API keys
Access tokens
WhatsApp credentials
Database credentials
Private keys
```

Use environment variables or a secure secrets manager for production deployments.
