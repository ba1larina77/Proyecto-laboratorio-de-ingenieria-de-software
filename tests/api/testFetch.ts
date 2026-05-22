/**
 * testFetch — cliente HTTP mínimo basado en node:http
 *
 * Evita el mock global de `fetch` definido en tests/setup.ts.
 * Funciona en el pool "forks" de Vitest (Node.js puro).
 */
import http from "node:http";
import https from "node:https";

export const API_BASE = "http://localhost:3001";

export interface TestResponse {
  status: number;
  body: unknown;
}

export function apiRequest(
  path: string,
  init: {
    method?: string;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): Promise<TestResponse> {
  return new Promise((resolve, reject) => {
    const url       = new URL(API_BASE + path);
    const rawBody   = init.body !== undefined ? JSON.stringify(init.body) : undefined;
    const module_   = url.protocol === "https:" ? https : http;

    const options: http.RequestOptions = {
      hostname: url.hostname,
      port:     Number(url.port) || (url.protocol === "https:" ? 443 : 80),
      path:     url.pathname + url.search,
      method:   init.method ?? (rawBody ? "POST" : "GET"),
      headers: {
        "Content-Type": "application/json",
        Accept:         "application/json",
        ...init.headers,
        ...(rawBody ? { "Content-Length": Buffer.byteLength(rawBody).toString() } : {}),
      },
    };

    const req = module_.request(options, (res) => {
      let data = "";
      res.on("data", (chunk: Buffer) => (data += chunk.toString()));
      res.on("end", () => {
        let body: unknown;
        try { body = JSON.parse(data); }
        catch { body = data; }
        resolve({ status: res.statusCode ?? 0, body });
      });
    });

    req.on("error", reject);
    if (rawBody) req.write(rawBody);
    req.end();
  });
}

/** Retorna `true` si el backend responde en /api/reviews/0 */
export async function backendIsUp(): Promise<boolean> {
  try {
    const r = await apiRequest("/api/reviews/0");
    return r.status < 500;
  } catch {
    return false;
  }
}
