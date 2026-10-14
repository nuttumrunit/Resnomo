import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { DellmodEngine, DellmodError } from "./runtime/engine.mjs";
import { MemoryStore } from "./runtime/memory.mjs";

const PORT = Number(process.env.PORT || 4190);
const ROOT = path.resolve("public");
const engine = new DellmodEngine({ memory: new MemoryStore() });
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".woff2": "font/woff2",
  ".ico": "image/x-icon",
};

function pathnameToFile(pathname) {
  let clean = decodeURIComponent(pathname).replace(/\\/g, "/");
  if (clean === "/" || clean === "") clean = "/index.html";
  const parts = clean.split("/").filter(Boolean);
  const target = path.resolve(ROOT, ...parts);
  if (!target.startsWith(ROOT + path.sep)) throw new Error("Invalid path");
  return target;
}

async function fromDisk(pathname) {
  let target = pathnameToFile(pathname);
  try {
    if ((await stat(target)).isDirectory()) target = path.join(target, "index.html");
    return { body: await readFile(target), type: mime[path.extname(target).toLowerCase()] || "application/octet-stream" };
  } catch {
    return null;
  }
}

function json(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*",
  });
  res.end(JSON.stringify(body, null, 2));
}

async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 1_048_576) throw new DellmodError("Request body exceeds 1 MB", { code: "BODY_TOO_LARGE", status: 413 });
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
  } catch {
    throw new DellmodError("Request body must be valid JSON", { code: "INVALID_JSON" });
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host}`);
    if (req.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
      res.writeHead(204, {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET, POST, OPTIONS",
        "access-control-allow-headers": "content-type",
      });
      res.end();
      return;
    }
    if (req.method === "GET" && url.pathname === "/api/health") {
      json(res, 200, { ok: true, service: "dellmod", stages: 6 });
      return;
    }
    if (req.method === "GET" && url.pathname === "/api/tools") {
      json(res, 200, { tools: engine.manifests() });
      return;
    }
    if (req.method === "GET" && url.pathname === "/api/reflexes") {
      json(res, 200, { reflexes: await engine.memory.list({ limit: Number(url.searchParams.get("limit") || 50) }) });
      return;
    }
    if (req.method === "POST" && url.pathname === "/api/missions") {
      json(res, 201, await engine.run(await readJson(req)));
      return;
    }
    const disk = await fromDisk(url.pathname);
    if (disk) {
      res.writeHead(200, { "content-type": disk.type, "cache-control": "no-cache" });
      res.end(disk.body);
      return;
    }
    const fallback = await fromDisk("/");
    res.writeHead(200, { "content-type": fallback.type, "cache-control": "no-cache" });
    res.end(fallback.body);
  } catch (error) {
    if ((req.url || "").startsWith("/api/")) {
      json(res, error.status || 500, {
        error: error.code || "INTERNAL_ERROR",
        message: error.message,
        details: error.details,
        runId: error.runId,
        trace: error.trace,
      });
      return;
    }
    res.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    res.end(`Server error: ${error.message}`);
  }
});

server.listen(PORT, process.env.HOST || "127.0.0.1", () => {
  console.log(`Dellmod is running at http://127.0.0.1:${PORT}/`);
});
