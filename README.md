---
title: Resnomo
emoji: ⚙️
colorFrom: gray
colorTo: green
sdk: static
app_file: public/index.html
pinned: false
license: mit
---

# Resnomo

**An observable six-stage execution kernel for tool-using agents.**

Resnomo treats an agent as a coordinated body instead of a hidden model call. Every mission crosses six explicit organs:

`perceive → plan → authorize → execute → verify → remember`

The repository contains both the interactive mechanical website and a runnable Node.js kernel. The kernel executes registered tools, enforces declared permission scopes, verifies returned evidence and stores successful routes as reusable Reflex records.

## What is real in this repository

- A working six-stage orchestration engine with stage events and execution traces.
- Permission boundaries that stop a route before a protected tool runs.
- Evidence verification that prevents failed work from entering memory.
- Persistent JSONL Reflex storage.
- Built-in `echo`, `json.extract` and public `web.read` tools.
- HTTP endpoints for missions, tools, health and Reflex records.
- Automated tests for success, authorization failure and verification failure.
- The complete interactive frontend and its mechanical figure source.

Resnomo does not ship a hosted model or pretend an external network is running. A model planner can be connected by registering another planner or tool adapter; the orchestration, permission, evidence and memory path already runs locally.

## Run locally

Requires Node.js 20 or newer. There are no npm dependencies.

```bash
npm test
npm run example
npm start
```

Open `http://127.0.0.1:4190/`.

## Execute a mission through the API

```bash
curl -X POST http://127.0.0.1:4190/api/missions \
  -H "content-type: application/json" \
  -d '{
    "objective": "Return verifiable evidence",
    "tool": "echo",
    "input": {"message": "Resnomo is running"}
  }'
```

Read a public webpage by explicitly granting the required scope:

```bash
curl -X POST http://127.0.0.1:4190/api/missions \
  -H "content-type: application/json" \
  -d '{
    "objective": "Inspect a public page",
    "tool": "web.read",
    "input": {"url": "https://example.com/"},
    "approvedScopes": ["network:read"]
  }'
```

Other endpoints:

- `GET /api/health`
- `GET /api/tools`
- `GET /api/reflexes`
- `POST /api/missions`

## Register a tool

Each tool declares its permission boundary and evidence check:

```js
const tools = new Map([
  ["account.update", {
    description: "Update an account record",
    requiredScopes: ["account:write"],
    async execute(input, context) {
      return performUpdate(input, context);
    },
    verify(evidence) {
      return evidence.status === "updated";
    },
  }],
]);
```

Pass the registry into `new ResnomoEngine({ tools })`. A request without `account:write` stops at the immune system and never reaches execution.

## Repository map

```text
runtime/        orchestration kernel, tools and Reflex memory
examples/       runnable mission example
tests/          Node test suite
public/         generated website served to users
build.mjs       generates the Agent Cognition Engine figure and page
serve.mjs       static server and Resnomo HTTP API
source/         Anatomy drawing kit, tracked as its upstream submodule
```

Clone the GitHub repository with its figure source:

```bash
git clone --recurse-submodules https://github.com/nuttumrunit/Resnomo.git
```

The Resnomo runtime and website are MIT licensed. The Anatomy drawing kit retains its own MIT license and upstream attribution.
