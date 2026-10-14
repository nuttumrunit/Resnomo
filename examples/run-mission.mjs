import { ResnomoEngine } from "../runtime/engine.mjs";
import { VolatileMemory } from "../runtime/memory.mjs";

const engine = new ResnomoEngine({ memory: new VolatileMemory() });
engine.on("stage", ({ phase, organ, status }) => {
  console.log(`${organ.padEnd(7)} ${phase.padEnd(10)} ${status}`);
});

const result = await engine.run({
  objective: "Return a verifiable message",
  tool: "echo",
  input: { message: "The execution route closed successfully." },
});

console.log(JSON.stringify(result, null, 2));
