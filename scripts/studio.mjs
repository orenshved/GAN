import { config } from "dotenv";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { setTimeout } from "node:timers/promises";
import { fileURLToPath } from "node:url";

config({
  path: fileURLToPath(new URL("../.env", import.meta.url)),
  quiet: true,
});
const port = process.env.GAMEAGENT_STUDIO_PORT;
if (!port || !/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
  throw new Error("Set GAMEAGENT_STUDIO_PORT in .env (see .env.example)");
}
const withDaemon = process.argv.includes("--with-daemon");
const children = [];
if (withDaemon) {
  for (const name of [
    "GAMEAGENT_DAEMON_PORT",
    "GAMEAGENT_STUDIO_ORIGIN",
    "GAMEAGENT_DAEMON_URL",
    "GAMEAGENT_DAEMON_TOKEN",
    "GAMEAGENT_PROJECT_PATH",
  ]) {
    if (!process.env[name])
      throw new Error(`Set ${name} in .env (see .env.example)`);
  }
  const daemonUrl = new URL(process.env.GAMEAGENT_DAEMON_URL);
  const studioOrigin = new URL(process.env.GAMEAGENT_STUDIO_ORIGIN);
  if (
    daemonUrl.protocol !== "http:" ||
    !["127.0.0.1", "localhost"].includes(daemonUrl.hostname) ||
    daemonUrl.port !== process.env.GAMEAGENT_DAEMON_PORT ||
    studioOrigin.protocol !== "http:" ||
    !["127.0.0.1", "localhost"].includes(studioOrigin.hostname) ||
    studioOrigin.port !== port
  ) {
    throw new Error(
      "Studio and daemon URLs must match their configured loopback ports",
    );
  }
  const daemon = spawn(
    process.env.GAMEAGENT_PYTHON || "python",
    [
      "-m",
      "uv",
      "run",
      "--frozen",
      "gameagent",
      "serve",
      process.env.GAMEAGENT_PROJECT_PATH,
    ],
    {
      cwd: fileURLToPath(new URL("../services/daemon", import.meta.url)),
      stdio: "inherit",
      env: process.env,
    },
  );
  children.push(daemon);
}
const require = createRequire(
  new URL("../apps/studio/package.json", import.meta.url),
);
const child = spawn(
  process.execPath,
  [
    require.resolve("next/dist/bin/next"),
    process.argv[2] || "dev",
    "--hostname",
    "127.0.0.1",
    "--port",
    port,
  ],
  {
    cwd: fileURLToPath(new URL("../apps/studio", import.meta.url)),
    stdio: "inherit",
  },
);
children.push(child);
async function terminate(running) {
  if (running.exitCode !== null || !running.pid) return;
  if (process.platform === "win32") {
    const killer = spawn(
      "taskkill",
      ["/pid", String(running.pid), "/T", "/F"],
      { stdio: "ignore" },
    );
    await new Promise((resolve) => killer.on("exit", resolve));
    return;
  }
  running.kill("SIGTERM");
  async function exited() {
    await new Promise((resolve) => running.on("exit", resolve));
    return true;
  }
  async function timedOut() {
    await setTimeout(3000);
    return false;
  }
  const stopped = await Promise.race([exited(), timedOut()]);
  if (!stopped && running.exitCode === null) running.kill("SIGKILL");
}
let stopping = false;
async function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  await Promise.all(children.map(terminate));
  process.exit(code);
}
for (const running of children) {
  running.on("exit", (code) => void stop(code ?? 1));
  running.on("error", (err) => {
    console.error({ error: "local_service_start_failed", detail: err.message });
    void stop(1);
  });
}
process.on("SIGINT", () => void stop());
process.on("SIGTERM", () => void stop());
