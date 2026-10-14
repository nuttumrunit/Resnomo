import test from "node:test";
import assert from "node:assert/strict";
import { DellmodEngine } from "../runtime/engine.mjs";
import { VolatileMemory } from "../runtime/memory.mjs";

test("a verified mission crosses all six organs and becomes a reflex", async () => {
  const memory = new VolatileMemory();
  const engine = new DellmodEngine({ memory });
  const result = await engine.run({ objective: "Echo evidence", tool: "echo", input: { message: "alive" } });

  assert.equal(result.status, "verified");
  assert.deepEqual(result.trace.map((event) => event.phase), ["perceive", "plan", "authorize", "execute", "verify", "remember"]);
  assert.equal(result.evidence.message, "alive");
  assert.equal((await memory.list()).length, 1);
});

test("a protected tool stops at the immune system without execution", async () => {
  let executed = false;
  const tools = new Map([["protected", {
    description: "Test protected operation",
    requiredScopes: ["account:write"],
    async execute() { executed = true; return { ok: true }; },
    verify: () => true,
  }]]);
  const engine = new DellmodEngine({ tools, memory: new VolatileMemory() });

  await assert.rejects(
    engine.run({ objective: "Protected action", tool: "protected", input: {} }),
    (error) => error.code === "PERMISSION_DENIED" && error.trace.at(-1).phase === "authorize",
  );
  assert.equal(executed, false);
});

test("failed evidence never enters memory", async () => {
  const memory = new VolatileMemory();
  const tools = new Map([["bad-evidence", {
    description: "Return invalid evidence",
    requiredScopes: [],
    async execute() { return { ok: false }; },
    verify: () => false,
  }]]);
  const engine = new DellmodEngine({ tools, memory });

  await assert.rejects(
    engine.run({ objective: "Reject invalid evidence", tool: "bad-evidence" }),
    (error) => error.code === "VERIFICATION_FAILED",
  );
  assert.equal((await memory.list()).length, 0);
});
