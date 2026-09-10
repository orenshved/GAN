#!/usr/bin/env node
"use strict";

/**
 * ai-index  —  Build the project context index.
 *
 * Usage:
 *   node scripts/ai-index.js [--root <path>] [--out <path>] [--quiet]
 *
 * Scans the repo and writes:
 *   .ai/CONTEXT_INDEX.md   — full structural index
 *   .ai/ARCHITECTURE.md    — summary (if not already customized)
 */

const fs = require("fs");
const path = require("path");

const { scanDirectory, summarizeByLanguage } = require("./lib/scanner");
const {
  formatTokens,
  estimateFromFile,
  BUDGET_TIERS,
} = require("./lib/token-counter");
const git = require("./lib/git-utils");

// ── CLI args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const rootIndex = args.indexOf("--root");
const outIndex = args.indexOf("--out");
const quiet = args.includes("--quiet");

const TARGET_DIR =
  rootIndex !== -1 ? path.resolve(args[rootIndex + 1]) : process.cwd();
const AI_DIR = path.join(TARGET_DIR, ".ai");
const OUT_INDEX =
  outIndex !== -1
    ? path.resolve(args[outIndex + 1])
    : path.join(AI_DIR, "CONTEXT_INDEX.md");
const ARCH_FILE = path.join(AI_DIR, "ARCHITECTURE.md");
const TOKEN_STRAT = path.join(AI_DIR, "TOKEN_STRATEGY.md");

function log(...msg) {
  if (!quiet) console.log(...msg);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatSize(bytes) {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(0)} KB`;
  return `${bytes} B`;
}

function detectEntryPoints(files) {
  return files.filter((f) => f.entryPoint && !f.generated);
}

function detectConfigFiles(rootDir) {
  const configs = [
    "package.json",
    "pyproject.toml",
    "Cargo.toml",
    "go.mod",
    "build.gradle",
    "pom.xml",
    "composer.json",
    "Gemfile",
    "requirements.txt",
    "setup.py",
    "tsconfig.json",
    "vite.config.ts",
    "vite.config.js",
    "webpack.config.js",
    "next.config.js",
    "next.config.ts",
    "nuxt.config.ts",
    "svelte.config.js",
    "tailwind.config.js",
    "tailwind.config.ts",
    ".eslintrc.js",
    ".eslintrc.json",
    "jest.config.js",
    "jest.config.ts",
    "vitest.config.ts",
    "Dockerfile",
    "docker-compose.yml",
    "docker-compose.yaml",
    ".env.example",
    "turbo.json",
    "nx.json",
    "lerna.json",
    "rush.json",
  ];
  return configs.filter((c) => fs.existsSync(path.join(rootDir, c)));
}

function detectFramework(rootDir, files) {
  const hints = [];

  const pkgPath = path.join(rootDir, "package.json");
  if (fs.existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (deps.next) hints.push("Next.js");
      if (deps.react && !deps.next) hints.push("React");
      if (deps.vue) hints.push("Vue");
      if (deps.svelte) hints.push("Svelte");
      if (deps.nuxt) hints.push("Nuxt");
      if (deps.angular || deps["@angular/core"]) hints.push("Angular");
      if (deps.express) hints.push("Express");
      if (deps.fastify) hints.push("Fastify");
      if (deps.hono) hints.push("Hono");
      if (deps.nest || deps["@nestjs/core"]) hints.push("NestJS");
      if (deps.electron) hints.push("Electron");
      if (deps.tauri || deps["@tauri-apps/api"]) hints.push("Tauri");
      if (deps.prisma || deps["@prisma/client"]) hints.push("Prisma");
      if (deps.drizzle || deps["drizzle-orm"]) hints.push("Drizzle");
      if (deps["@supabase/supabase-js"]) hints.push("Supabase");
      if (deps.trpc || deps["@trpc/server"]) hints.push("tRPC");
      if (deps["@tanstack/react-query"]) hints.push("React Query");
      if (deps.vite) hints.push("Vite");
      if (deps.webpack) hints.push("Webpack");
      if (deps.turbopack) hints.push("Turbopack");
    } catch {}
  }

  if (
    fs.existsSync(path.join(rootDir, "requirements.txt")) ||
    fs.existsSync(path.join(rootDir, "pyproject.toml"))
  ) {
    const reqPath = path.join(rootDir, "requirements.txt");
    if (fs.existsSync(reqPath)) {
      const req = fs.readFileSync(reqPath, "utf8").toLowerCase();
      if (req.includes("django")) hints.push("Django");
      if (req.includes("fastapi")) hints.push("FastAPI");
      if (req.includes("flask")) hints.push("Flask");
      if (req.includes("sqlalchemy")) hints.push("SQLAlchemy");
    }
  }

  if (fs.existsSync(path.join(rootDir, "go.mod"))) {
    const gomod = fs.readFileSync(path.join(rootDir, "go.mod"), "utf8");
    if (gomod.includes("gin-gonic")) hints.push("Gin");
    if (gomod.includes("gorilla")) hints.push("Gorilla");
    if (gomod.includes("fiber")) hints.push("Fiber");
    if (gomod.includes("echo")) hints.push("Echo");
  }

  if (fs.existsSync(path.join(rootDir, "Cargo.toml"))) {
    const cargo = fs.readFileSync(path.join(rootDir, "Cargo.toml"), "utf8");
    if (cargo.includes("actix")) hints.push("Actix");
    if (cargo.includes("axum")) hints.push("Axum");
    if (cargo.includes("rocket")) hints.push("Rocket");
    if (cargo.includes("tokio")) hints.push("Tokio");
  }

  return [...new Set(hints)];
}

function buildDirTree(files, rootDir, maxDepth = 3) {
  const tree = {};

  for (const f of files) {
    if (f.generated) continue;
    const parts = f.relPath.split("/");
    let node = tree;
    for (let i = 0; i < Math.min(parts.length - 1, maxDepth); i++) {
      node[parts[i]] = node[parts[i]] || {};
      node = node[parts[i]];
    }
  }

  function render(node, indent = "") {
    const lines = [];
    for (const key of Object.keys(node).sort()) {
      lines.push(`${indent}${key}/`);
      if (typeof node[key] === "object" && Object.keys(node[key]).length) {
        lines.push(...render(node[key], indent + "  "));
      }
    }
    return lines;
  }

  return render(tree);
}

// ── Main ─────────────────────────────────────────────────────────────────────
function main() {
  log(`\n🔍  ai-index  —  scanning ${TARGET_DIR}\n`);

  ensureDir(AI_DIR);
  ensureDir(path.join(AI_DIR, "reports"));

  const isGit = git.isGitRepo(TARGET_DIR);
  const branch = isGit ? git.getCurrentBranch(TARGET_DIR) : null;
  const recentCommits = isGit ? git.getRecentCommits(TARGET_DIR, 10) : [];
  const churnHotspots = isGit ? git.getChurnHotspots(TARGET_DIR, 15) : [];
  const bugHotspots = isGit ? git.getBugHotspots(TARGET_DIR, 10) : [];

  log("  Scanning files...");
  const files = scanDirectory(TARGET_DIR);

  const sourceFiles = files.filter((f) => f.lang && !f.generated);
  const generatedFiles = files.filter((f) => f.generated);
  const largeFiles = files
    .filter((f) => !f.generated && f.tokens > 5000)
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, 20);
  const entryPoints = detectEntryPoints(files);
  const configs = detectConfigFiles(TARGET_DIR);
  const frameworks = detectFramework(TARGET_DIR, files);
  const langSummary = summarizeByLanguage(files);

  const totalTokens = sourceFiles.reduce((s, f) => s + f.tokens, 0);
  const totalSize = sourceFiles.reduce((s, f) => s + f.size, 0);
  const mdFiles = files.filter((f) => f.ext === ".md" || f.ext === ".mdx");

  log(
    `  Found ${files.length} files (${sourceFiles.length} source, ${generatedFiles.length} generated)`,
  );
  log(`  Total source tokens: ~${formatTokens(totalTokens)}`);

  const now = new Date().toISOString().split("T")[0];

  // ── CONTEXT_INDEX.md ────────────────────────────────────────────────────
  const lines = [];
  lines.push(`# Context Index`);
  lines.push(`<!-- generated by ai-index on ${now} — do not edit manually -->`);
  lines.push(``);
  lines.push(`## Project Overview`);
  lines.push(``);
  if (frameworks.length) {
    lines.push(`**Stack:** ${frameworks.join(", ")}`);
  }
  lines.push(`**Languages:** ${langSummary.map((l) => l.lang).join(", ")}`);
  lines.push(
    `**Source files:** ${sourceFiles.length} (${formatSize(totalSize)})`,
  );
  lines.push(`**Est. total tokens (source):** ~${formatTokens(totalTokens)}`);
  if (isGit) {
    lines.push(`**Branch:** ${branch}`);
  }
  lines.push(``);

  if (configs.length) {
    lines.push(`## Config Files`);
    lines.push(``);
    for (const c of configs) lines.push(`- \`${c}\``);
    lines.push(``);
  }

  if (entryPoints.length) {
    lines.push(`## Entry Points`);
    lines.push(``);
    for (const ep of entryPoints) {
      lines.push(`- \`${ep.relPath}\` (~${formatTokens(ep.tokens)} tokens)`);
    }
    lines.push(``);
  }

  lines.push(`## Language Breakdown`);
  lines.push(``);
  lines.push(`| Language | Files | Tokens |`);
  lines.push(`|----------|-------|--------|`);
  for (const l of langSummary) {
    lines.push(`| ${l.lang} | ${l.count} | ~${formatTokens(l.tokens)} |`);
  }
  lines.push(``);

  const treeLines = buildDirTree(sourceFiles, TARGET_DIR, 3);
  if (treeLines.length) {
    lines.push(`## Directory Structure`);
    lines.push(``);
    lines.push("```");
    lines.push(...treeLines);
    lines.push("```");
    lines.push(``);
  }

  if (largeFiles.length) {
    lines.push(`## Large Files (>5k tokens)`);
    lines.push(``);
    lines.push(
      `> Agents should avoid reading these in full unless the task directly requires it.`,
    );
    lines.push(``);
    lines.push(`| File | Tokens | Size |`);
    lines.push(`|------|--------|------|`);
    for (const f of largeFiles) {
      lines.push(
        `| \`${f.relPath}\` | ~${formatTokens(f.tokens)} | ${formatSize(f.size)} |`,
      );
    }
    lines.push(``);
  }

  if (churnHotspots.length) {
    lines.push(`## Churn Hotspots (last 3 months)`);
    lines.push(``);
    lines.push(`> High-churn files are fragile — read carefully.`);
    lines.push(``);
    for (const h of churnHotspots.slice(0, 10)) {
      lines.push(`- \`${h.file}\` — ${h.changes} changes`);
    }
    lines.push(``);
  }

  if (bugHotspots.length) {
    lines.push(`## Bug Hotspots`);
    lines.push(``);
    lines.push(`> Files with the most fix commits.`);
    lines.push(``);
    for (const h of bugHotspots) {
      lines.push(`- \`${h.file}\` — ${h.fixes} fix commits`);
    }
    lines.push(``);
  }

  if (recentCommits.length) {
    lines.push(`## Recent Commits`);
    lines.push(``);
    lines.push("```");
    lines.push(...recentCommits);
    lines.push("```");
    lines.push(``);
  }

  if (mdFiles.length) {
    lines.push(`## Documentation Files`);
    lines.push(``);
    for (const f of mdFiles.sort((a, b) =>
      a.relPath.localeCompare(b.relPath),
    )) {
      lines.push(`- \`${f.relPath}\` (~${formatTokens(f.tokens)} tokens)`);
    }
    lines.push(``);
  }

  if (generatedFiles.length > 0) {
    lines.push(`## Generated / Auto-built Files`);
    lines.push(``);
    lines.push(
      `> Agents must never read these for architecture understanding.`,
    );
    lines.push(``);
    for (const f of generatedFiles.slice(0, 20)) {
      lines.push(`- \`${f.relPath}\``);
    }
    if (generatedFiles.length > 20) {
      lines.push(`- *(${generatedFiles.length - 20} more...)*`);
    }
    lines.push(``);
  }

  lines.push(`---`);
  lines.push(`*Regenerate with: \`node scripts/ai-index.js\`*`);

  fs.writeFileSync(OUT_INDEX, lines.join("\n"), "utf8");
  log(`  ✓  Wrote ${OUT_INDEX}`);

  // ── ARCHITECTURE.md (only if not already customized) ────────────────────
  const ARCH_MARKER = "<!-- generated by ai-index";
  const archExists = fs.existsSync(ARCH_FILE);
  const archIsCustom =
    archExists && !fs.readFileSync(ARCH_FILE, "utf8").includes(ARCH_MARKER);

  if (!archIsCustom) {
    const archLines = [];
    archLines.push(`# Architecture`);
    archLines.push(
      `<!-- generated by ai-index on ${now} — customize this file and remove this comment to prevent overwrites -->`,
    );
    archLines.push(``);
    archLines.push(`## Stack`);
    archLines.push(``);
    if (frameworks.length) {
      archLines.push(`${frameworks.join(", ")}`);
    } else {
      archLines.push(`*Fill this in — frameworks, runtime, database, etc.*`);
    }
    archLines.push(``);
    archLines.push(`## Entry Points`);
    archLines.push(``);
    if (entryPoints.length) {
      for (const ep of entryPoints) archLines.push(`- \`${ep.relPath}\``);
    } else {
      archLines.push(`*Fill this in.*`);
    }
    archLines.push(``);
    archLines.push(`## Module Map`);
    archLines.push(``);
    archLines.push(
      `*Describe the major modules, their responsibilities, and how data flows between them.*`,
    );
    archLines.push(``);
    if (treeLines.length) {
      archLines.push("```");
      archLines.push(...treeLines.slice(0, 30));
      archLines.push("```");
      archLines.push(``);
    }
    archLines.push(`## Data Flow`);
    archLines.push(``);
    archLines.push(`*Describe the main request/data flow.*`);
    archLines.push(``);
    archLines.push(`## External Dependencies`);
    archLines.push(``);
    archLines.push(`*APIs, databases, queues, third-party services.*`);

    fs.writeFileSync(ARCH_FILE, archLines.join("\n"), "utf8");
    log(`  ✓  Wrote ${ARCH_FILE}`);
  } else {
    log(`  ↷  Skipped ${ARCH_FILE} (already customized)`);
  }

  // ── TOKEN_STRATEGY.md (only if missing) ─────────────────────────────────
  if (!fs.existsSync(TOKEN_STRAT)) {
    const tsLines = [];
    tsLines.push(`# Token Strategy`);
    tsLines.push(``);
    tsLines.push(`## Budget Targets`);
    tsLines.push(``);
    tsLines.push(`| Phase | Target |`);
    tsLines.push(`|-------|--------|`);
    tsLines.push(`| Initial context | < 8k tokens |`);
    tsLines.push(`| Task planning | < 16k tokens |`);
    tsLines.push(`| Active editing | < 32k tokens |`);
    tsLines.push(``);
    tsLines.push(`## Retrieval Layer Priority`);
    tsLines.push(``);
    tsLines.push(`1. \`.ai/\` files (cheapest — pre-summarized)`);
    tsLines.push(`2. codebase-memory-mcp (structural queries)`);
    tsLines.push(`3. Serena (symbol-level, editing)`);
    tsLines.push(`4. Direct file reads (only when index is insufficient)`);
    tsLines.push(``);
    tsLines.push(`## Never Read (Without Explicit Reason)`);
    tsLines.push(``);
    if (generatedFiles.length) {
      tsLines.push(`- Generated files (see CONTEXT_INDEX.md)`);
    }
    tsLines.push(`- \`node_modules/\`, \`dist/\`, \`build/\`, \`.next/\``);
    tsLines.push(`- Lock files (\`package-lock.json\`, \`yarn.lock\`, etc.)`);
    tsLines.push(`- Source maps (\`*.map\`)`);
    tsLines.push(`- Binary assets (images, fonts, compiled binaries)`);
    if (largeFiles.length) {
      tsLines.push(
        `- Large files unless directly relevant (see CONTEXT_INDEX.md § Large Files)`,
      );
    }
    tsLines.push(``);
    tsLines.push(`## High-Value First Reads`);
    tsLines.push(``);
    tsLines.push(`For any task, start here:`);
    tsLines.push(``);
    tsLines.push(`1. \`.ai/PROJECT_STATE.md\``);
    tsLines.push(`2. \`.ai/AGENT_RULES.md\``);
    tsLines.push(`3. \`.ai/KNOWN_ISSUES.md\` (if bug-related)`);
    tsLines.push(`4. \`.ai/CONTEXT_INDEX.md\` (for structure)`);
    if (entryPoints.length) {
      tsLines.push(
        `5. Entry points: ${entryPoints
          .slice(0, 3)
          .map((e) => `\`${e.relPath}\``)
          .join(", ")}`,
      );
    }

    fs.writeFileSync(TOKEN_STRAT, tsLines.join("\n"), "utf8");
    log(`  ✓  Wrote ${TOKEN_STRAT}`);
  }

  log(`\n  Total source tokens: ~${formatTokens(totalTokens)}`);
  log(
    `  Largest file: ${largeFiles[0] ? largeFiles[0].relPath + " (~" + formatTokens(largeFiles[0].tokens) + ")" : "none"}`,
  );
  log(`\n✅  Index complete.\n`);
}

main();
