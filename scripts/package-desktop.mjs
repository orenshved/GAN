import {
  copyFileSync,
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readlinkSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

import "dotenv/config";
import { createPackageWithOptions } from "@electron/asar";

import { pythonCommand } from "./python-command.mjs";

if (process.platform !== "win32") {
  throw new Error("desktop_package_windows_only");
}

const root = fileURLToPath(new URL("..", import.meta.url));
const daemonRoot = join(root, "services", "daemon");
const outputRoot = join(root, "dist", "desktop");
const pnpmScript = process.env.npm_execpath;
if (!pnpmScript) throw new Error("pnpm_entrypoint_missing");

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || root,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    stdio: "inherit",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `${options.label || command} failed with exit code ${result.status ?? 1}`,
    );
  }
}

function materializePath(source, destination, ancestors = new Set()) {
  const metadata = lstatSync(source);
  const resolved = metadata.isSymbolicLink()
    ? resolve(dirname(source), readlinkSync(source))
    : source;
  const resolvedMetadata = metadata.isSymbolicLink()
    ? lstatSync(resolved)
    : metadata;
  if (resolvedMetadata.isDirectory()) {
    const identity = resolve(resolved).toLowerCase();
    if (ancestors.has(identity)) {
      throw new Error(`studio_dependency_cycle: ${source} -> ${identity}`);
    }
    const nextAncestors = new Set(ancestors).add(identity);
    mkdirSync(destination, { recursive: true });
    for (const entry of readdirSync(resolved, { withFileTypes: true })) {
      materializePath(
        join(resolved, entry.name),
        join(destination, entry.name),
        nextAncestors,
      );
    }
    return;
  }
  if (!resolvedMetadata.isFile()) {
    throw new Error(`studio_dependency_unsupported: ${source}`);
  }
  mkdirSync(dirname(destination), { recursive: true });
  copyFileSync(resolved, destination);
}

run(
  process.execPath,
  [pnpmScript, "--filter", "@gameagent/studio...", "build"],
  {
    label: "studio_build",
  },
);

const studioStandalone = join(root, "apps", "studio", ".next", "standalone");
const studioApp = join(studioStandalone, "apps", "studio");
cpSync(
  join(root, "apps", "studio", ".next", "static"),
  join(studioApp, ".next", "static"),
  {
    recursive: true,
  },
);
cpSync(join(root, "apps", "studio", "public"), join(studioApp, "public"), {
  recursive: true,
});
const studioStage = join(root, "dist", "desktop-stage");
const studioFiles = join(studioStage, "studio-files");
const studioArchive = join(studioStage, "studio.asar");
mkdirSync(studioStage, { recursive: true });
rmSync(studioFiles, { force: true, recursive: true });
rmSync(studioArchive, { force: true });
materializePath(studioStandalone, studioFiles);
materializePath(
  join(studioStandalone, "node_modules", ".pnpm", "node_modules"),
  join(studioFiles, "apps", "studio", "node_modules"),
);
await createPackageWithOptions(studioFiles, studioArchive, { dot: true });
writeFileSync(
  join(studioStage, "studio.sha256"),
  `${createHash("sha256").update(readFileSync(studioArchive)).digest("hex")}\n`,
);
rmSync(studioFiles, { force: true, recursive: true });

const python = pythonCommand();
run(
  python.executable,
  [
    ...python.prefix,
    "-m",
    "uv",
    "run",
    "--frozen",
    "pyinstaller",
    "--clean",
    "--noconfirm",
    "--onedir",
    "--name",
    "gameagent-daemon",
    "--distpath",
    "dist",
    "--workpath",
    ".pyinstaller/build",
    "--specpath",
    ".pyinstaller",
    "--collect-all",
    "gameagent",
    "--collect-all",
    "openai_codex",
    "--collect-all",
    "codex_cli_bin",
    "--copy-metadata",
    "openai-codex",
    "--copy-metadata",
    "openai-codex-cli-bin",
    "gameagent/cli.py",
  ],
  { cwd: daemonRoot, label: "daemon_package" },
);

const daemonExecutable = join(
  daemonRoot,
  "dist",
  "gameagent-daemon",
  "gameagent-daemon.exe",
);
if (!existsSync(daemonExecutable)) throw new Error("packaged_daemon_missing");

const builderArgs = [
  "--filter",
  "@gameagent/desktop",
  "exec",
  "electron-builder",
  "--win",
  "--x64",
  "--publish",
  "never",
];
if (process.argv.includes("--dir")) builderArgs.push("--dir");
run(process.execPath, [pnpmScript, ...builderArgs], {
  label: "desktop_package",
});

const headlessRoot = join(outputRoot, "headless");
mkdirSync(headlessRoot, { recursive: true });
cpSync(
  join(daemonRoot, "dist", "gameagent-daemon"),
  join(headlessRoot, "gameagent-daemon"),
  {
    recursive: true,
  },
);
cpSync(join(root, ".env.example"), join(headlessRoot, ".env.example"));
cpSync(
  join(root, "apps", "desktop", "HEADLESS.md"),
  join(headlessRoot, "README.md"),
);

console.log(
  JSON.stringify({
    desktop_output: outputRoot,
    headless_output: headlessRoot,
    installer: !process.argv.includes("--dir"),
  }),
);
