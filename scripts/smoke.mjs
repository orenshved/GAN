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
const python = process.env.GAMEAGENT_PYTHON || "python";
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
  GAMEAGENT_REGISTRY_PATH: join(temporary, "projects.json"),
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
    '[node name="Main" type="Node2D"]\n',
  );
  await writeFile(
    join(secondTemporary, "project.godot"),
    '[application]\nconfig/name="Second Smoke Game"\nconfig/features=PackedStringArray("4.6")\n',
  );
  await run(
    python,
    ["-m", "uv", "run", "--frozen", "gameagent", "init", temporary],
    {
      cwd: daemonDirectory,
      env: environment,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  const daemon = spawn(
    python,
    ["-m", "uv", "run", "--frozen", "gameagent", "serve", temporary],
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

  browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(studioUrl);
  await page.getByRole("heading", { name: "Director Desk" }).waitFor();
  await page.getByRole("button", { name: "Switch or import project" }).click();
  await page.getByLabel("Add local repository").fill(secondTemporary);
  await page.getByRole("button", { name: "Import repository" }).click();
  await page.getByText("Second Smoke Game / Director Desk").waitFor();
  await page.getByRole("button", { name: "Switch or import project" }).click();
  await page.getByRole("button", { name: /Smoke Game.*Open project/ }).click();
  await page.getByText("Smoke Game / Director Desk").waitFor();
  await page.getByRole("button", { name: "+ Propose task" }).click();
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
  await page.getByRole("button", { name: /Activity/ }).click();
  await page.getByText("task / proposed").waitFor();
  await page.getByRole("button", { name: /Network/ }).click();
  const graph = page.locator('[aria-label="Task dependency graph"]');
  await graph.waitFor();
  assert.equal(await graph.locator(".react-flow__node").count(), 1);
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
  await rm(temporary, { recursive: true, force: true });
  await rm(secondTemporary, { recursive: true, force: true });
}
