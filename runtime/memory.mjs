import { appendFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";

export class MemoryStore {
  constructor({ file = path.resolve(".dellmod/reflexes.jsonl") } = {}) {
    this.file = file;
  }

  async store(reflex) {
    await mkdir(path.dirname(this.file), { recursive: true });
    await appendFile(this.file, `${JSON.stringify(reflex)}\n`, "utf8");
    return reflex;
  }

  async list({ limit = 50 } = {}) {
    try {
      const rows = (await readFile(this.file, "utf8"))
        .split(/\r?\n/)
        .filter(Boolean)
        .map((line) => JSON.parse(line));
      return rows.slice(-Math.max(1, Math.min(limit, 500))).reverse();
    } catch (error) {
      if (error.code === "ENOENT") return [];
      throw error;
    }
  }
}

export class VolatileMemory {
  #rows = [];

  async store(reflex) {
    this.#rows.push(reflex);
    return reflex;
  }

  async list({ limit = 50 } = {}) {
    return this.#rows.slice(-limit).reverse();
  }
}
