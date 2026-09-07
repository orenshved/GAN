import type { NextRequest } from "next/server";

const allowed = new Set([
  "health",
  "project",
  "events",
  "tasks",
  "policy",
  "stream-ticket",
  "worker-account",
  "worker-login",
  "workers",
  "worker-interrupt",
]);

async function proxy(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;
  if (path.length !== 1 || !allowed.has(path[0] ?? "")) {
    return Response.json(
      { error: "route_not_found", detail: "Unknown daemon route" },
      { status: 404 },
    );
  }
  const daemonUrl = process.env.GAMEAGENT_DAEMON_URL;
  const token = process.env.GAMEAGENT_DAEMON_TOKEN;
  if (!daemonUrl || !token) {
    return Response.json(
      { error: "daemon_not_configured", detail: "Configure the local daemon" },
      { status: 503 },
    );
  }
  try {
    const base = new URL(daemonUrl);
    if (
      base.protocol !== "http:" ||
      !["127.0.0.1", "localhost"].includes(base.hostname)
    ) {
      return Response.json(
        {
          error: "invalid_daemon_url",
          detail: "The Studio daemon URL must use loopback HTTP",
        },
        { status: 503 },
      );
    }
    const target = new URL(
      path[0] ?? "",
      `${base.toString().replace(/\/?$/, "/")}`,
    );
    target.search = request.nextUrl.search;
    const body = request.method === "GET" ? {} : { body: await request.text() };
    const response = await fetch(target, {
      method: request.method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      ...body,
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    return new Response(response.body, {
      status: response.status,
      headers: {
        "Content-Type":
          response.headers.get("Content-Type") ?? "application/json",
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: "daemon_unavailable",
        detail:
          error instanceof Error ? error.message : "Daemon request failed",
      },
      { status: 503 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
