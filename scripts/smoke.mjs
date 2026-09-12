import "dotenv/config";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout } from "node:timers/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { pythonCommand } from "./python-command.mjs";

async function freePort() {
  const socket = createServer();
  socket.listen(0, "127.0.0.1");
  await once(socket, "listening");
  const address = socket.address();
  assert(address && typeof address !== "string");
  const port = address.port;
  await new Promise((resolve, reject) =>
    socket.close((error) => (error ? reject(error) : resolve())),
  );
  return port;
}

function processLogs(child) {
  let value = "";
  child.stdout.on("data", (chunk) => {
    value += chunk;
  });
  child.stderr.on("data", (chunk) => {
    value += chunk;
  });
  return () => value;
}

async function waitFor(url, options, children) {
  for (let attempt = 0; attempt < 80; attempt++) {
    const exited = children.find((child) => child.process.exitCode !== null);
    if (exited) throw new Error(`service_exited: ${exited.logs()}`);
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(1000),
      });
      if (response.ok) return response;
    } catch {
      // Service startup is expected to refuse connections briefly.
    }
    await setTimeout(250);
  }
  throw new Error(
    `service_timeout: ${children.map((child) => child.logs()).join("\n")}`,
  );
}

async function run(command, arguments_, options) {
  const child = spawn(command, arguments_, options);
  const logs = processLogs(child);
  const [code] = await once(child, "exit");
  if (code !== 0) throw new Error(`command_failed: ${logs()}`);
}

async function terminate(child) {
  if (child.exitCode !== null || !child.pid) return;
  if (process.platform === "win32") {
    const killer = spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
    });
    await once(killer, "exit");
    return;
  }
  child.kill("SIGTERM");
  async function exited() {
    await once(child, "exit");
    return true;
  }
  async function timedOut() {
    await setTimeout(3000);
    return false;
  }
  const stopped = await Promise.race([exited(), timedOut()]);
  if (!stopped && child.exitCode === null) {
    child.kill("SIGKILL");
    await once(child, "exit");
  }
}

const daemonDirectory = fileURLToPath(
  new URL("../services/daemon", import.meta.url),
);
const studioDirectory = fileURLToPath(
  new URL("../apps/studio", import.meta.url),
);
const python = pythonCommand();
const temporary = await mkdtemp(join(tmpdir(), "gameagent-smoke-"));
const secondTemporary = await mkdtemp(
  join(tmpdir(), "gameagent-smoke-second-"),
);
const token = `smoke-${randomUUID()}-${randomUUID()}`;
const studioPort = await freePort();
const daemonPort = await freePort();
const studioUrl = `http://127.0.0.1:${studioPort}`;
const daemonUrl = `http://127.0.0.1:${daemonPort}`;
const environment = {
  ...process.env,
  GAMEAGENT_DAEMON_PORT: String(daemonPort),
  GAMEAGENT_STUDIO_ORIGIN: studioUrl,
  GAMEAGENT_DAEMON_URL: daemonUrl,
  GAMEAGENT_DAEMON_TOKEN: token,
  GAMEAGENT_REGISTRY_PATH: join(temporary, ".gameagent", "projects.json"),
  GAMEAGENT_OLLAMA_URL: "",
  OLLAMA_HOST: "",
};
const children = [];
let browser;
try {
  await writeFile(
    join(temporary, "project.godot"),
    '[application]\nconfig/name="Smoke Game"\nconfig/features=PackedStringArray("4.6")\n',
  );
  await writeFile(join(temporary, "README.md"), "# Smoke Game\n");
  await writeFile(
    join(temporary, "main.tscn"),
    '[gd_scene format=3]\n\n[node name="Main" type="Node2D"]\n',
  );
  await writeFile(
    join(secondTemporary, "project.godot"),
    '[application]\nconfig/name="Second Smoke Game"\nconfig/features=PackedStringArray("4.6")\n',
  );
  await run(
    python.executable,
    [
      ...python.prefix,
      "-m",
      "uv",
      "run",
      "--frozen",
      "gameagent",
      "init",
      temporary,
    ],
    {
      cwd: daemonDirectory,
      env: environment,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  const daemon = spawn(
    python.executable,
    [
      ...python.prefix,
      "-m",
      "uv",
      "run",
      "--frozen",
      "gameagent",
      "serve",
      temporary,
    ],
    {
      cwd: daemonDirectory,
      env: environment,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  children.push({ process: daemon, logs: processLogs(daemon) });
  const require = createRequire(
    new URL("../apps/studio/package.json", import.meta.url),
  );
  const studio = spawn(
    process.execPath,
    [
      require.resolve("next/dist/bin/next"),
      "start",
      "--hostname",
      "127.0.0.1",
      "--port",
      String(studioPort),
    ],
    {
      cwd: studioDirectory,
      env: environment,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  children.push({ process: studio, logs: processLogs(studio) });
  await waitFor(
    `${daemonUrl}/health`,
    { headers: { Authorization: `Bearer ${token}` } },
    children,
  );
  await waitFor(studioUrl, {}, children);
  const daemonHeaders = { Authorization: `Bearer ${token}` };
  const roster = await (
    await fetch(`${daemonUrl}/agent-roster`, { headers: daemonHeaders })
  ).json();
  const agentKnowledge = await (
    await fetch(`${daemonUrl}/agent-knowledge`, { headers: daemonHeaders })
  ).json();
  const expectedAllAgentNodes = roster.length + 1;
  const expectedAvailableAgentNodes =
    agentKnowledge.profiles.filter(
      (profile) => profile.qualification_state === "expertise_available",
    ).length + 1;

  browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(studioUrl);
  await page.getByRole("heading", { name: "Director Desk" }).waitFor();
  assert.equal(await page.getByText(/^EVENT \d+$/).count(), 0);
  assert.equal(await page.locator(".inspector").count(), 0);
  await page.getByRole("heading", { name: "Needs your attention" }).waitFor();
  await page.getByRole("heading", { name: "Current work" }).waitFor();
  await page.getByRole("heading", { name: "What changed" }).waitFor();
  await page.getByRole("button", { name: "Switch or import project" }).click();
  await page.getByLabel("Add local repository").fill(secondTemporary);
  await page.getByRole("button", { name: "Import and inspect" }).click();
  await page.getByRole("heading", { name: "Project understanding" }).waitFor();
  await page.getByText("WE'RE GOOD TO START").waitFor();
  await page.getByText("engineering", { exact: true }).waitFor();
  await page.getByRole("button", { name: "Enter project" }).click();
  await page.locator(".project-dialog").waitFor({ state: "hidden" });
  await page.getByText("Second Smoke Game / Director Desk").waitFor();
  await page.getByRole("button", { name: "Switch or import project" }).click();
  await page.getByRole("button", { name: /Smoke Game.*Open project/ }).click();
  await page.locator(".project-dialog").waitFor({ state: "hidden" });
  await page.getByText("Smoke Game / Director Desk").waitFor();
  await page.getByRole("button", { name: "Switch or import project" }).click();
  await page
    .getByRole("button", { name: /Second Smoke Game.*Open project/ })
    .click();
  await page.locator(".project-dialog").waitFor({ state: "hidden" });
  await page.getByText("Second Smoke Game / Director Desk").waitFor();
  await page.getByRole("button", { name: "Switch or import project" }).click();
  await page
    .getByRole("button", { name: "Remove Second Smoke Game from GAN" })
    .click();
  await page
    .getByRole("heading", { name: "Remove Second Smoke Game from GAN?" })
    .waitFor();
  const removalResponse = page.waitForResponse((response) =>
    response.url().includes("/api/daemon/project-remove"),
  );
  await page.getByRole("button", { name: "Remove project" }).click();
  assert.equal((await removalResponse).status(), 200);
  await page.getByText("Smoke Game / Director Desk").waitFor();
  await page
    .locator("nav")
    .getByRole("button", { name: "Production", exact: true })
    .click();
  await page.getByRole("button", { name: "Add task manually" }).click();
  await page.getByLabel("Title").fill("Verify the opening turn");
  await page
    .getByLabel("Desired outcome")
    .fill("The player understands the first action");
  await page.getByLabel("Required capabilities").fill("usability_analysis");
  await page.getByLabel("Deliverables").fill("A finding linked to evidence");
  await page.getByRole("button", { name: "Record proposal" }).click();
  await page
    .getByRole("heading", { name: "Verify the opening turn" })
    .waitFor();
  const dividerAlignment = await page.evaluate(() => {
    const topbar = globalThis.document
      .querySelector(".topbar")
      ?.getBoundingClientRect();
    const inspectorHeader = globalThis.document
      .querySelector(".inspector > .section-heading")
      ?.getBoundingClientRect();
    return {
      topbarBottom: topbar?.bottom,
      inspectorBottom: inspectorHeader?.bottom,
    };
  });
  assert.equal(dividerAlignment.inspectorBottom, dividerAlignment.topbarBottom);
  await page
    .locator("nav")
    .getByRole("button", { name: "Discipline checks", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Production discipline audits" })
    .waitFor();
  assert.equal(await page.locator(".domain-card").count(), 5);
  const levelDomain = page.locator(".domain-card", {
    has: page.getByRole("heading", { name: "Level design" }),
  });
  const domainResponse = page.waitForResponse((response) =>
    response.url().includes("/api/daemon/production-domain-run"),
  );
  await levelDomain
    .getByRole("button", { name: "Run read-only audit" })
    .click();
  assert.equal((await domainResponse).status(), 200);
  await levelDomain.getByText("Passed", { exact: true }).waitFor();
  await levelDomain.getByText(/1 files/).waitFor();
  await page
    .locator("nav")
    .getByRole("button", { name: /Production/ })
    .click();
  const agentNetwork = page.locator('[aria-label="Agent network"]');
  await agentNetwork.getByRole("heading", { name: "Agent network" }).waitFor();
  await agentNetwork
    .locator('[aria-label="Agent filters"]')
    .getByRole("button", { name: /All agents/ })
    .click();
  await agentNetwork
    .locator(".agent-index")
    .getByRole("button", { name: "Engineering Lead" })
    .click();
  await agentNetwork
    .locator(".agent-knowledge-list")
    .getByText("game-engineering-core", { exact: true })
    .waitFor();
  await agentNetwork.getByText("TECHNICAL KNOWLEDGE DETAIL").click();
  await agentNetwork
    .locator(".agent-retrieval-list")
    .getByText("professional knowledge", { exact: true })
    .first()
    .waitFor();
  await agentNetwork.locator(".react-flow__node").first().waitFor();
  assert.equal(
    await agentNetwork.locator(".react-flow__node").count(),
    expectedAllAgentNodes,
  );
  assert.equal(
    await page.getByRole("heading", { name: "Direct the project" }).count(),
    0,
  );
  await agentNetwork.getByRole("button", { name: /Available to hire/ }).click();
  assert.equal(
    await agentNetwork.locator(".react-flow__node").count(),
    expectedAvailableAgentNodes,
  );
  await agentNetwork.getByRole("button", { name: /All agents/ }).click();
  await page
    .locator("nav")
    .getByRole("button", { name: "Project understanding", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "What GAN knows about this project" })
    .waitFor();
  await page.getByText("Specialist knowledge tools", { exact: true }).click();
  await page.getByRole("heading", { name: "Expertise library" }).waitFor();
  await page
    .getByRole("heading", { name: "Learning from production" })
    .waitFor();
  await page.getByRole("heading", { name: "Current research" }).waitFor();
  const learningResponse = page.waitForResponse((response) =>
    response.url().includes("/api/daemon/learning-run"),
  );
  await page.getByRole("button", { name: "Capture and distill" }).click();
  assert.equal((await learningResponse).status(), 200);
  const indexResponse = page.waitForResponse((response) =>
    response.url().includes("/api/daemon/project-intelligence-refresh"),
  );
  await page.getByRole("button", { name: "Index project" }).click();
  assert.equal((await indexResponse).status(), 200);
  await page.getByRole("button", { name: "Refresh index" }).waitFor();
  await page
    .locator("summary")
    .filter({ hasText: "Browse indexed project files" })
    .click();
  await page.getByText("README.md", { exact: true }).waitFor();
  const contextResponse = page.waitForResponse((response) =>
    response.url().includes("/api/daemon/task-context"),
  );
  await page.getByRole("button", { name: "Assemble context" }).click();
  assert.equal((await contextResponse).status(), 200);
  await page.getByText(/resources selected · event history excluded/).waitFor();
  await page
    .locator("nav")
    .getByRole("button", { name: /Agents/ })
    .click();
  await page.getByRole("heading", { name: "Capability registry" }).waitFor();
  await page.getByText("Recruitment changes evaluator availability").waitFor();
  await page.locator(".registry-table tbody tr").first().waitFor();
  assert.equal(
    await page.locator(".registry-table tbody tr").count(),
    roster.length,
  );
  await page
    .locator("nav")
    .getByRole("button", { name: /Models/ })
    .click();
  await page.getByRole("heading", { name: "Local Model Expert" }).waitFor();
  const localModelSelect = page.getByLabel("Local model");
  await localModelSelect.waitFor();
  assert.equal(await localModelSelect.inputValue(), "");
  const routeResponse = page.waitForResponse((response) =>
    response.url().includes("/api/daemon/model-route"),
  );
  await page.getByRole("button", { name: "Explain recommended route" }).click();
  const recordedRoute = await routeResponse;
  assert.equal(recordedRoute.status(), 200);
  const route = await recordedRoute.json();
  assert.ok(
    ["codex_authenticated", "wait_for_codex"].includes(route.selected_route),
  );
  await page
    .getByRole("heading", { name: "Latest routing decision" })
    .waitFor();
  await page
    .getByText(
      /Paid execution is admitted per invocation only after the provider gateway/,
    )
    .waitFor();
  await page
    .locator("nav")
    .getByRole("button", { name: /Providers/ })
    .click();
  await page
    .getByRole("heading", {
      name: "Paid work is admitted before it can execute",
    })
    .waitFor();
  await page
    .getByText("No paid provider is configured.", { exact: false })
    .waitFor();
  await page.locator("nav").getByRole("button", { name: /QA/ }).click();
  await page.getByRole("heading", { name: "Quality gates" }).waitFor();
  await page.getByText("Required evidence has not been recorded.").waitFor();
  const qaResponse = page.waitForResponse((response) =>
    response.url().includes("/api/daemon/qa-run"),
  );
  await page.getByRole("button", { name: "Run deterministic gates" }).click();
  assert.equal((await qaResponse).status(), 200);
  await page
    .getByText(
      "All contract, dependency, scope, gate-registry, and deliverable checks passed.",
    )
    .waitFor();
  await page.getByRole("button", { name: /Activity/ }).click();
  await page.getByText("New work was proposed").first().waitFor();
  await page
    .locator("nav")
    .getByRole("button", { name: "Dependencies", exact: true })
    .click();
  const graph = page.locator('[aria-label="Task dependency graph"]');
  await graph.waitFor();
  assert.equal(await graph.locator(".react-flow__node").count(), 1);
  await writeFile(
    join(temporary, "README.md"),
    "# Smoke Game\n\nExternally edited without registration.\n",
  );
  await page
    .getByRole("heading", {
      name: "Unregistered changes require reconciliation",
    })
    .waitFor({ timeout: 10000 });
  await page.getByText("README.md", { exact: true }).waitFor();
  await page
    .getByLabel("Reconciliation detail")
    .fill("Documented the external README edit and associated it with a task.");
  const reconciliationResponse = page.waitForResponse((response) =>
    response.url().includes("/api/daemon/reconcile"),
  );
  await page.getByRole("button", { name: "Reconcile changes" }).click();
  const reconciliation = await reconciliationResponse;
  assert.equal(
    reconciliation.status(),
    200,
    `reconciliation_failed: ${await reconciliation.text()}`,
  );
  await page
    .getByRole("heading", {
      name: "Unregistered changes require reconciliation",
    })
    .waitFor({ state: "hidden" });
  if (process.env.GAMEAGENT_SMOKE_SCREENSHOT) {
    await page.screenshot({
      path: process.env.GAMEAGENT_SMOKE_SCREENSHOT,
      fullPage: true,
    });
  }
  console.log("Studio ↔ daemon Playwright smoke passed.");
} finally {
  await browser?.close();
  await Promise.all(children.map((child) => terminate(child.process)));
  const cleanup = {
    recursive: true,
    force: true,
    maxRetries: 20,
    retryDelay: 100,
  };
  await rm(temporary, cleanup);
  await rm(secondTemporary, cleanup);
}
