import { createHash, randomUUID } from "node:crypto";
import { EventEmitter } from "node:events";
import { createDefaultTools } from "./tools.mjs";
import { MemoryStore } from "./memory.mjs";

const organFor = {
  perceive: "eyes",
  plan: "brain",
  authorize: "immune",
  execute: "hands",
  verify: "heart",
  remember: "memory",
};

export class DellmodError extends Error {
  constructor(message, { code = "DELLMOD_ERROR", status = 400, details } = {}) {
    super(message);
    this.name = "DellmodError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export class DellmodEngine extends EventEmitter {
  constructor({ tools = createDefaultTools(), memory = new MemoryStore(), clock = () => new Date() } = {}) {
    super();
    this.tools = tools;
    this.memory = memory;
    this.clock = clock;
  }

  manifests() {
    return [...this.tools.entries()].map(([name, tool]) => ({
      name,
      description: tool.description,
      requiredScopes: tool.requiredScopes || [],
    }));
  }

  async run(request = {}) {
    const runId = randomUUID();
    const trace = [];
    const stage = async (phase, operation) => {
      const startedAt = this.clock().toISOString();
      const started = performance.now();
      this.emit("stage", { runId, phase, organ: organFor[phase], status: "running", startedAt });
      try {
        const output = await operation();
        const event = {
          phase,
          organ: organFor[phase],
          status: "completed",
          startedAt,
          durationMs: Number((performance.now() - started).toFixed(2)),
        };
        trace.push(event);
        this.emit("stage", { runId, ...event });
        return output;
      } catch (error) {
        const event = {
          phase,
          organ: organFor[phase],
          status: "failed",
          startedAt,
          durationMs: Number((performance.now() - started).toFixed(2)),
          error: error.message,
        };
        trace.push(event);
        this.emit("stage", { runId, ...event });
        error.runId = runId;
        error.trace = trace;
        throw error;
      }
    };

    const mission = await stage("perceive", async () => {
      if (typeof request.objective !== "string" || !request.objective.trim()) {
        throw new DellmodError("objective is required", { code: "INVALID_MISSION" });
      }
      if (typeof request.tool !== "string" || !this.tools.has(request.tool)) {
        throw new DellmodError("A registered tool is required", {
          code: "UNKNOWN_TOOL",
          details: { available: this.manifests().map((tool) => tool.name) },
        });
      }
      return {
        objective: request.objective.trim(),
        tool: request.tool,
        input: request.input ?? {},
        approvedScopes: [...new Set(request.approvedScopes || [])],
      };
    });

    const route = await stage("plan", async () => ({
      id: randomUUID(),
      steps: [{ tool: mission.tool, input: mission.input }],
    }));

    const tool = this.tools.get(mission.tool);
    await stage("authorize", async () => {
      const required = tool.requiredScopes || [];
      const missing = required.filter((scope) => !mission.approvedScopes.includes(scope));
      if (missing.length) {
        throw new DellmodError(`Missing required scope: ${missing.join(", ")}`, {
          code: "PERMISSION_DENIED",
          status: 403,
          details: { missing, required, approved: mission.approvedScopes },
        });
      }
      return { required, approved: mission.approvedScopes };
    });

    const evidence = await stage("execute", () => tool.execute(mission.input, { runId, route, mission }));
    await stage("verify", async () => {
      const verified = tool.verify ? await tool.verify(evidence, { runId, route, mission }) : evidence !== undefined;
      if (!verified) throw new DellmodError("Returned evidence failed verification", { code: "VERIFICATION_FAILED", status: 422 });
      return { verified: true };
    });

    const reflex = await stage("remember", async () => {
      const fingerprint = createHash("sha256").update(JSON.stringify({ tool: mission.tool, input: mission.input })).digest("hex");
      return this.memory.store({
        id: randomUUID(),
        fingerprint,
        objective: mission.objective,
        route: route.steps,
        verifiedAt: this.clock().toISOString(),
        runId,
      });
    });

    return { runId, status: "verified", route, evidence, reflex, trace };
  }
}
