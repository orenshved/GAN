import type { NextRequest } from "next/server";

const allowed = new Set([
  "health",
  "projects",
  "project",
  "project-select",
  "project-import",
  "project-remove",
  "project-intelligence",
  "project-intelligence-refresh",
  "task-context",
  "engine-inspection",
  "runtime-capture",
  "evidence-file",
  "events",
  "tasks",
  "task-start",
  "task-block",
  "task-complete",
  "workspace-scan",
  "reconcile",
  "policy",
  "stream-ticket",
  "worker-account",
  "worker-login",
  "workers",
  "worker-interrupt",
  "gm-objective",
  "agent-roster",
  "agent-registry",
  "agent-knowledge",
  "knowledge-catalog",
  "learning-run",
  "learning-status",
  "knowledge-maintenance-run",
  "lesson-review",
  "lesson-promote",
  "pack-candidate",
  "pack-build",
  "pack-audition",
  "pack-audition-run",
  "pack-review",
  "pack-lifecycle",
  "research-run",
  "recruitments",
  "recruit",
  "qa-gates",
  "qa-report",
  "qa-run",
  "qa-human-review",
  "qa-waive",
  "model-environment",
  "model-recommend",
  "model-benchmark",
  "model-route",
  "providers",
  "provider-configure",
  "provider-disable",
  "provider-credential",
  "provider-approve",
  "provider-invoke",
  "production-domains",
  "production-domain-run",
  "decision-resolve",
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
      signal: AbortSignal.timeout(
        path[0] === "pack-audition-run"
          ? 360000
          : path[0] === "runtime-capture" ||
              path[0] === "recruit" ||
              path[0] === "model-benchmark" ||
              path[0] === "model-recommend" ||
              path[0] === "production-domain-run"
            ? 120000
            : 10000,
      ),
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
