import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { extractAll } from "@electron/asar";
import { app, BrowserWindow, dialog, session } from "electron";
import { parse } from "dotenv";

import {
  assertLoopbackUrl,
  daemonInvocation,
  installationPaths,
  loopbackConfiguration,
  parsePositiveSeconds,
  pathExists,
  projectArgument,
  projectFromRegistry,
  readOptional,
  runCommand,
  studioInvocation,
  updateEnvironmentText,
  waitForHttp,
} from "./runtime.mjs";

const repositoryRoot = fileURLToPath(new URL("../..", import.meta.url));
const children = new Set();
let mainWindow = null;
let quitting = false;

function selectedEnvironment(source) {
  return Object.fromEntries(
    Object.entries(source).filter(
      ([name, value]) => name.startsWith("GAMEAGENT_") && value,
    ),
  );
}

async function directoryExists(path) {
  try {
    return (await stat(path)).isDirectory();
  } catch {
    return false;
  }
}

async function ensureStudioRuntime(paths, userData) {
  if (!app.isPackaged) return;
  const digest = (await readFile(paths.studioDigest, "utf8")).trim();
  if (!/^[a-f0-9]{64}$/.test(digest))
    throw new Error("Invalid Studio bundle digest");
  const runtime = join(userData, "runtime", `studio-${digest.slice(0, 16)}`);
  const server = join(runtime, "apps", "studio", "server.js");
  if (!(await pathExists(server))) {
    await mkdir(runtime, { recursive: true });
    extractAll(paths.studioArchive, runtime);
  }
  if (!(await pathExists(server)))
    throw new Error("Studio bundle extraction failed");
  paths.studioServer = server;
}

async function chooseProject(environment, registryPath) {
  for (const requested of [
    projectArgument(process.argv, app.isPackaged),
    environment.GAMEAGENT_PROJECT_PATH,
  ]) {
    if (requested && (await directoryExists(requested))) return requested;
  }
  const registryText = await readOptional(registryPath);
  const registered = projectFromRegistry(registryText);
  if (registered && (await directoryExists(registered))) return registered;
  const result = await dialog.showOpenDialog({
    title: "Choose an existing game project repository — not an install folder",
    properties: ["openDirectory"],
    buttonLabel: "Open project",
  });
  if (result.canceled || !result.filePaths[0]) return null;
  return result.filePaths[0];
}

function pipeLogs(child, log) {
  child.stdout?.pipe(log, { end: false });
  child.stderr?.pipe(log, { end: false });
}

function startChild(invocation, environment, log) {
  const child = spawn(invocation.command, invocation.args, {
    cwd: invocation.cwd,
    env: environment,
    windowsHide: true,
    stdio: ["ignore", "pipe", "pipe"],
  });
  pipeLogs(child, log);
  children.add(child);
  child.once("exit", () => {
    children.delete(child);
    if (!quitting) app.quit();
  });
  child.once("error", (error) => {
    log.write(
      `${JSON.stringify({ error: "desktop_child_failed", detail: error.message })}\n`,
    );
    if (!quitting) app.quit();
  });
  return child;
}

async function terminate(child) {
  if (!child.pid || child.exitCode !== null) return;
  if (process.platform === "win32") {
    await runCommand(
      { command: "taskkill", args: ["/pid", String(child.pid), "/T", "/F"] },
      process.env,
    ).catch(() => {});
    return;
  }
  child.kill("SIGTERM");
}

async function stopChildren() {
  await Promise.all([...children].map(terminate));
  children.clear();
}

async function startDesktop() {
  const userData = app.getPath("userData");
  const paths = installationPaths({
    packaged: app.isPackaged,
    resourcesPath: process.resourcesPath,
    repositoryRoot,
  });
  await ensureStudioRuntime(paths, userData);
  const configPath =
    process.env.GAMEAGENT_DESKTOP_ENV ||
    (app.isPackaged ? join(userData, ".env") : join(repositoryRoot, ".env"));
  const defaults = parse(await readFile(paths.defaults));
  const saved = parse(await readOptional(configPath));
  const environment = {
    ...defaults,
    ...saved,
    ...selectedEnvironment(process.env),
  };
  const loopback = loopbackConfiguration(environment);
  environment.GAMEAGENT_STUDIO_ORIGIN = loopback.studioOrigin;
  environment.GAMEAGENT_DAEMON_URL = loopback.daemonUrl;
  environment.GAMEAGENT_DAEMON_TOKEN =
    environment.GAMEAGENT_DAEMON_TOKEN?.length >= 32 &&
    !environment.GAMEAGENT_DAEMON_TOKEN.startsWith("replace-with")
      ? environment.GAMEAGENT_DAEMON_TOKEN
      : randomBytes(32).toString("hex");
  environment.GAMEAGENT_REGISTRY_PATH = resolve(
    environment.GAMEAGENT_REGISTRY_PATH || join(userData, "projects.json"),
  );
  environment.GAMEAGENT_KNOWLEDGE_HOME = resolve(
    environment.GAMEAGENT_KNOWLEDGE_HOME || join(userData, "knowledge"),
  );
  environment.GAMEAGENT_AGENT_REGISTRY_PATH = resolve(
    environment.GAMEAGENT_AGENT_REGISTRY_PATH || join(userData, "agents.json"),
  );
  environment.GAMEAGENT_ROSTER_PATH = join(
    paths.definitions,
    "agents",
    "builtin",
    "roster.json",
  );
  environment.GAMEAGENT_CAPABILITY_PATH = join(
    paths.definitions,
    "capabilities",
    "ontology",
    "initial.json",
  );
  environment.GAMEAGENT_TOOL_REGISTRY_PATH = join(
    paths.definitions,
    "tools",
    "builtin",
    "registry.json",
  );
  environment.GAMEAGENT_BUILTIN_EXPERTISE_PATH = join(
    paths.definitions,
    "expertise",
    "builtin",
  );
  environment.GAMEAGENT_EXPERTISE_BENCHMARK_PATH = join(
    paths.definitions,
    "expertise",
    "benchmarks",
  );
  const selectedProjectPath = await chooseProject(
    environment,
    environment.GAMEAGENT_REGISTRY_PATH,
  );
  if (!selectedProjectPath) {
    app.quit();
    return;
  }
  const projectPath = resolve(selectedProjectPath);
  environment.GAMEAGENT_PROJECT_PATH = projectPath;
  const baseEnvironment = {
    ...process.env,
    ...environment,
    NODE_ENV: "production",
  };
  const logsPath = join(userData, "logs");
  await mkdir(logsPath, { recursive: true });
  const logPath = join(logsPath, "desktop.log");
  const log = createWriteStream(logPath, { flags: "a" });
  if (!(await pathExists(join(projectPath, ".gameagent")))) {
    const answer = await dialog.showMessageBox({
      type: "question",
      title: "Initialize project",
      message: "Initialize the selected game project repository?",
      detail:
        "GAN will add .gameagent and AGENTS.md to this folder. This does not install the application into it.",
      buttons: ["Initialize selected project", "Cancel"],
      defaultId: 0,
      cancelId: 1,
    });
    if (answer.response !== 0) {
      log.end();
      app.quit();
      return;
    }
    await runCommand(
      daemonInvocation(paths, app.isPackaged, ["init", projectPath]),
      baseEnvironment,
      (chunk) => log.write(chunk),
    );
  }
  await mkdir(dirname(configPath), { recursive: true });
  const originalConfig = await readOptional(configPath);
  await writeFile(
    configPath,
    updateEnvironmentText(originalConfig, {
      GAMEAGENT_STUDIO_PORT: String(loopback.studioPort),
      GAMEAGENT_DAEMON_PORT: String(loopback.daemonPort),
      GAMEAGENT_DAEMON_TOKEN: environment.GAMEAGENT_DAEMON_TOKEN,
      GAMEAGENT_PROJECT_PATH: projectPath,
      GAMEAGENT_REGISTRY_PATH: environment.GAMEAGENT_REGISTRY_PATH,
      GAMEAGENT_KNOWLEDGE_HOME: environment.GAMEAGENT_KNOWLEDGE_HOME,
    }),
    "utf8",
  );
  assertLoopbackUrl(
    environment.GAMEAGENT_STUDIO_ORIGIN,
    "GAMEAGENT_STUDIO_ORIGIN",
    loopback.studioPort,
  );
  assertLoopbackUrl(
    environment.GAMEAGENT_DAEMON_URL,
    "GAMEAGENT_DAEMON_URL",
    loopback.daemonPort,
  );
  const timeoutMs =
    parsePositiveSeconds(
      environment.GAMEAGENT_DESKTOP_START_TIMEOUT_SECONDS,
      "GAMEAGENT_DESKTOP_START_TIMEOUT_SECONDS",
    ) * 1000;
  const daemon = startChild(
    daemonInvocation(paths, app.isPackaged, ["serve", projectPath]),
    baseEnvironment,
    log,
  );
  await waitForHttp(`${loopback.daemonUrl}/health`, timeoutMs, daemon, {
    headers: { Authorization: `Bearer ${environment.GAMEAGENT_DAEMON_TOKEN}` },
  });
  const studio = startChild(
    studioInvocation(paths),
    {
      ...baseEnvironment,
      ELECTRON_RUN_AS_NODE: "1",
      HOSTNAME: "127.0.0.1",
      PORT: String(loopback.studioPort),
      NEXT_TELEMETRY_DISABLED: "1",
    },
    log,
  );
  await waitForHttp(loopback.studioOrigin, timeoutMs, studio);
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, _permission, callback) => {
      callback(false);
    },
  );
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1024,
    minHeight: 720,
    show: false,
    backgroundColor: "#07100d",
    icon: paths.logo,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  mainWindow.webContents.on("will-navigate", (event, target) => {
    if (new URL(target).origin !== loopback.studioOrigin)
      event.preventDefault();
  });
  mainWindow.once("ready-to-show", () => mainWindow?.show());
  await mainWindow.loadURL(loopback.studioOrigin);
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow?.isMinimized()) mainWindow.restore();
    mainWindow?.focus();
  });
  app
    .whenReady()
    .then(startDesktop)
    .catch(async (error) => {
      dialog.showErrorBox(
        "Game Agent Network could not start",
        `${error.message}\n\nSee the desktop log under the application data folder.`,
      );
      await stopChildren();
      app.exit(1);
    });
  app.on("window-all-closed", () => app.quit());
  app.on("before-quit", (event) => {
    if (quitting || children.size === 0) return;
    event.preventDefault();
    quitting = true;
    void stopChildren().finally(() => app.quit());
  });
}
