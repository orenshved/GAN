import { spawn } from "node:child_process";
import { access, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost"]);

export function parsePort(value, name) {
  if (!/^\d+$/.test(value ?? "")) {
    throw new Error(`${name} must be a decimal port`);
  }
  const port = Number(value);
  if (port < 1 || port > 65535) {
    throw new Error(`${name} must be between 1 and 65535`);
  }
  return port;
}

export function parsePositiveSeconds(value, name) {
  const seconds = Number(value);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    throw new Error(`${name} must be a positive number`);
  }
  return seconds;
}

export function loopbackConfiguration(environment) {
  const studioPort = parsePort(
    environment.GAMEAGENT_STUDIO_PORT,
    "GAMEAGENT_STUDIO_PORT",
  );
  const daemonPort = parsePort(
    environment.GAMEAGENT_DAEMON_PORT,
    "GAMEAGENT_DAEMON_PORT",
  );
  if (studioPort === daemonPort) {
    throw new Error("Studio and daemon ports must be different");
  }
  return {
    studioPort,
    daemonPort,
    studioOrigin: `http://127.0.0.1:${studioPort}`,
    daemonUrl: `http://127.0.0.1:${daemonPort}`,
  };
}

export function assertLoopbackUrl(value, name, expectedPort) {
  const url = new URL(value);
  if (
    url.protocol !== "http:" ||
    !LOOPBACK_HOSTS.has(url.hostname) ||
    url.port !== String(expectedPort)
  ) {
    throw new Error(`${name} must use its configured loopback port`);
  }
  return url;
}

export function projectArgument(argv, allowPositional = false) {
  const prefix = "--project=";
  const explicit = argv
    .find((item) => item.startsWith(prefix))
    ?.slice(prefix.length);
  if (explicit) return explicit;
  if (!allowPositional) return null;
  return argv.slice(1).find((item) => !item.startsWith("-")) || null;
}

export function projectFromRegistry(value) {
  if (!value) return null;
  const parsed = JSON.parse(value);
  if (
    parsed.schema_version !== 1 ||
    typeof parsed.active_project_id !== "string"
  ) {
    throw new Error("Unsupported project registry");
  }
  const selected = parsed.projects?.find(
    (item) => item.project_id === parsed.active_project_id,
  );
  return typeof selected?.root === "string" ? selected.root : null;
}

function encodeEnvironmentValue(value) {
  if (/[\r\n]/.test(value))
    throw new Error("Environment values cannot contain newlines");
  if (value === value.trim() && !value.includes("#")) return value;
  if (!value.includes("'")) return `'${value}'`;
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

export function updateEnvironmentText(source, updates) {
  const pending = new Map(Object.entries(updates));
  const lines = source ? source.replace(/\r\n/g, "\n").split("\n") : [];
  const rewritten = lines.map((line) => {
    const match = /^([A-Z][A-Z0-9_]*)=/.exec(line);
    if (!match || !pending.has(match[1])) return line;
    const value = pending.get(match[1]);
    pending.delete(match[1]);
    return `${match[1]}=${encodeEnvironmentValue(value)}`;
  });
  while (rewritten.at(-1) === "") rewritten.pop();
  for (const [name, value] of pending) {
    rewritten.push(`${name}=${encodeEnvironmentValue(value)}`);
  }
  return `${rewritten.join("\n")}\n`;
}

export function installationPaths({ packaged, resourcesPath, repositoryRoot }) {
  if (packaged) {
    return {
      daemonExecutable: join(
        resourcesPath,
        "daemon",
        process.platform === "win32"
          ? "gameagent-daemon.exe"
          : "gameagent-daemon",
      ),
      daemonCwd: join(resourcesPath, "daemon"),
      studioArchive: join(resourcesPath, "studio.asar"),
      studioDigest: join(resourcesPath, "studio.sha256"),
      studioServer: null,
      definitions: join(resourcesPath, "definitions"),
      defaults: join(resourcesPath, "desktop.env.example"),
      logo: join(resourcesPath, "desktop", "logo.png"),
    };
  }
  return {
    daemonExecutable: process.env.GAMEAGENT_PYTHON || "python",
    daemonCwd: join(repositoryRoot, "services", "daemon"),
    studioArchive: null,
    studioDigest: null,
    studioServer: join(
      repositoryRoot,
      "apps",
      "studio",
      ".next",
      "standalone",
      "apps",
      "studio",
      "server.js",
    ),
    definitions: repositoryRoot,
    defaults: join(repositoryRoot, ".env.example"),
    logo: join(repositoryRoot, "apps", "studio", "public", "logo.png"),
  };
}

export function daemonInvocation(paths, packaged, args) {
  return packaged
    ? { command: paths.daemonExecutable, args, cwd: paths.daemonCwd }
    : {
        command: paths.daemonExecutable,
        args: ["-m", "uv", "run", "--frozen", "gameagent", ...args],
        cwd: paths.daemonCwd,
      };
}

export function studioInvocation(paths) {
  return {
    command: process.execPath,
    args: [paths.studioServer],
    cwd: dirname(paths.studioServer),
  };
}

export async function pathExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

export async function readOptional(path) {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return "";
    throw error;
  }
}

export async function runCommand(invocation, environment, onOutput = () => {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(invocation.command, invocation.args, {
      cwd: invocation.cwd,
      env: environment,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout?.on("data", onOutput);
    child.stderr?.on("data", onOutput);
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`Process exited with code ${code ?? 1}`)),
    );
  });
}

export async function waitForHttp(url, timeoutMs, child, init = {}) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (child?.exitCode !== null) {
      throw new Error(`Service exited before becoming ready: ${url}`);
    }
    try {
      const response = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(1000),
      });
      if (response.ok) return;
    } catch {
      // The owned loopback process is still starting.
    }
    await new Promise((resolve) => globalThis.setTimeout(resolve, 200));
  }
  throw new Error(`Timed out waiting for ${url}`);
}
