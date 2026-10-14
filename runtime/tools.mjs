import { createHash } from "node:crypto";
import { isIP } from "node:net";

const sha256 = (value) => createHash("sha256").update(value).digest("hex");

function assertPublicUrl(value) {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("Only HTTP(S) URLs are supported");
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".local")) throw new Error("Local network targets are blocked");
  if (isIP(host)) {
    const blocked = /^(127\.|10\.|0\.|169\.254\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/.test(host)
      || host === "::1" || host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80:");
    if (blocked) throw new Error("Private network targets are blocked");
  }
  return url;
}

function htmlToText(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function createDefaultTools() {
  return new Map([
    ["echo", {
      description: "Return a supplied message as verifiable local evidence.",
      requiredScopes: [],
      async execute(input = {}) {
        if (typeof input.message !== "string" || !input.message.trim()) throw new Error("input.message is required");
        return { message: input.message, bytes: Buffer.byteLength(input.message), digest: sha256(input.message) };
      },
      verify(result) {
        return result.digest === sha256(result.message);
      },
    }],
    ["json.extract", {
      description: "Read a dotted property path from a JSON value.",
      requiredScopes: [],
      async execute(input = {}) {
        const path = String(input.path || "").split(".").filter(Boolean);
        let value = input.value;
        for (const key of path) value = value?.[key];
        return { path: path.join("."), value, found: value !== undefined };
      },
      verify(result) {
        return result.found;
      },
    }],
    ["web.read", {
      description: "Fetch a public HTTP(S) page and return bounded textual evidence.",
      requiredScopes: ["network:read"],
      async execute(input = {}) {
        const url = assertPublicUrl(input.url);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 8_000);
        try {
          const response = await fetch(url, {
            headers: { "user-agent": "Dellmod/0.1 (+observable-agent-kernel)" },
            redirect: "error",
            signal: controller.signal,
          });
          const raw = Buffer.from(await response.arrayBuffer()).subarray(0, 262_144);
          const body = raw.toString("utf8");
          const contentType = response.headers.get("content-type") || "application/octet-stream";
          const text = /html/i.test(contentType) ? htmlToText(body) : body;
          return {
            url: url.toString(),
            status: response.status,
            contentType,
            excerpt: text.slice(0, 4_000),
            bytesRead: raw.length,
            digest: sha256(raw),
          };
        } finally {
          clearTimeout(timeout);
        }
      },
      verify(result) {
        return result.status >= 200 && result.status < 300 && result.bytesRead > 0 && Boolean(result.digest);
      },
    }],
  ]);
}
