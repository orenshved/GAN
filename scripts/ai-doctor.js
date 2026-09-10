#!/usr/bin/env node
"use strict";

/**
 * ai-doctor  —  Generate a focused context plan for the next agent task.
 *
 * Usage:
 *   node scripts/ai-doctor.js --task "fix login redirect bug"
 *   node scripts/ai-doctor.js --task "add payment webhook" [--root <path>] [--out <file>]
 *   node scripts/ai-doctor.js --session                   # log session metadata
 *
 * Reads:  .ai/PROJECT_STATE.md, .ai/KNOWN_ISSUES.md, .ai/CONTEXT_INDEX.md,
 *         .ai/DECISIONS.md, .ai/DOMAIN_MAP.md
 * Writes: .ai/reports/doctor-latest.md (and optionally a custom --out path)
 */

const fs = require("fs");
const path = require("path");

const { scanDirectory } = require("./lib/scanner");
const {
  formatTokens,
  estimateFromFile,
  BUDGET_TIERS,
} = require("./lib/token-counter");
const git = require("./lib/git-utils");

// ── CLI args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);

function getArg(flag) {
  const i = args.indexOf(flag);
  return i !== -1 ? args[i + 1] : null;
}

const TASK = getArg("--task");
const TARGET_DIR = path.resolve(getArg("--root") || process.cwd());
const OUT_FILE = getArg("--out");
const SESSION_LOG = args.includes("--session");
const QUIET = args.includes("--quiet");
const JSON_MODE = args.includes("--json");

const AI_DIR = path.join(TARGET_DIR, ".ai");
const REPORTS_DIR = path.join(AI_DIR, "reports");

if (!TASK && !SESSION_LOG) {
  console.error(`
Usage: ai-doctor --task "<description>" [--root <path>] [--out <file>]
       ai-doctor --session [--root <path>]

Examples:
  node scripts/ai-doctor.js --task "fix login redirect bug"
  node scripts/ai-doctor.js --task "add Stripe payment webhook"
  node scripts/ai-doctor.js --session

`);
  process.exit(1);
}

function log(...msg) {
  if (!QUIET && !JSON_MODE) console.log(...msg);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// ── Task classifier ──────────────────────────────────────────────────────────

const TASK_PATTERNS = [
  {
    type: "bug-fix",
    keywords: [
      "fix",
      "bug",
      "broken",
      "error",
      "crash",
      "failing",
      "wrong",
      "incorrect",
      "issue",
      "problem",
      "doesn't work",
      "not working",
      "regression",
      "exception",
    ],
  },
  {
    type: "feature",
    keywords: [
      "add",
      "implement",
      "create",
      "build",
      "new feature",
      "support",
      "enable",
      "introduce",
      "develop",
      "write",
      "make",
    ],
  },
  {
    type: "refactor",
    keywords: [
      "refactor",
      "clean up",
      "cleanup",
      "simplify",
      "reorganize",
      "restructure",
      "extract",
      "rename",
      "move",
      "consolidate",
      "deduplicate",
    ],
  },
  {
    type: "performance",
    keywords: [
      "slow",
      "performance",
      "optimize",
      "speed up",
      "cache",
      "memory",
      "latency",
      "fast",
      "efficient",
      "bottleneck",
    ],
  },
  {
    type: "security",
    keywords: [
      "security",
      "auth",
      "authentication",
      "authorization",
      "permission",
      "access",
      "token",
      "session",
      "vulnerability",
      "xss",
      "injection",
      "csrf",
    ],
  },
  {
    type: "test",
    keywords: [
      "test",
      "spec",
      "coverage",
      "unit test",
      "integration test",
      "e2e",
      "jest",
      "vitest",
      "playwright",
      "cypress",
    ],
  },
  {
    type: "docs",
    keywords: [
      "document",
      "docs",
      "readme",
      "comment",
      "explain",
      "describe",
      "write docs",
    ],
  },
];

function classifyTask(taskText) {
  const lower = taskText.toLowerCase();
  for (const pattern of TASK_PATTERNS) {
    if (pattern.keywords.some((k) => lower.includes(k))) {
      return pattern.type;
    }
  }
  return "general";
}

// ── Domain keyword extractor ─────────────────────────────────────────────────

const DOMAIN_KEYWORDS = {
  auth: [
    "auth",
    "login",
    "logout",
    "session",
    "token",
    "jwt",
    "oauth",
    "credential",
    "password",
    "signup",
    "register",
    "permissions",
    "role",
    "access control",
  ],
  payment: [
    "payment",
    "stripe",
    "billing",
    "invoice",
    "subscription",
    "checkout",
    "webhook",
    "charge",
    "refund",
    "price",
    "plan",
  ],
  api: [
    "api",
    "endpoint",
    "route",
    "rest",
    "graphql",
    "grpc",
    "request",
    "response",
    "middleware",
    "handler",
    "controller",
  ],
  database: [
    "database",
    "db",
    "query",
    "sql",
    "migration",
    "schema",
    "model",
    "orm",
    "prisma",
    "drizzle",
    "supabase",
    "postgres",
    "mysql",
    "sqlite",
    "mongo",
  ],
  ui: [
    "ui",
    "component",
    "page",
    "view",
    "render",
    "layout",
    "style",
    "css",
    "design",
    "button",
    "form",
    "modal",
    "table",
    "list",
    "menu",
    "nav",
  ],
  state: [
    "state",
    "store",
    "redux",
    "zustand",
    "context",
    "reducer",
    "action",
    "signal",
    "observable",
    "reactive",
  ],
  testing: ["test", "spec", "mock", "stub", "fixture", "coverage"],
  config: [
    "config",
    "env",
    "environment",
    "settings",
    "options",
    ".env",
    "dotenv",
  ],
  ci: [
    "ci",
    "cd",
    "pipeline",
    "deploy",
    "github actions",
    "workflow",
    "docker",
    "build",
  ],
  ai: [
    "ai",
    "llm",
    "model",
    "prompt",
    "embedding",
    "vector",
    "openai",
    "anthropic",
    "claude",
  ],
};

function extractDomains(taskText) {
  const lower = taskText.toLowerCase();
  const matched = [];
  for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) {
      matched.push(domain);
    }
  }
  return matched;
}

// ── File relevance scoring ────────────────────────────────────────────────────

function scoreFileRelevance(file, taskWords, domains) {
  let score = 0;
  const relLower = file.relPath.toLowerCase();

  // Exact word matches in path
  for (const word of taskWords) {
    if (relLower.includes(word)) score += 10;
  }

  // Domain matches
  for (const domain of domains) {
    const domainKeywords = DOMAIN_KEYWORDS[domain] || [];
    for (const kw of domainKeywords.slice(0, 3)) {
      if (relLower.includes(kw)) score += 5;
    }
  }

  // Prefer source files over config
  if (file.lang && file.lang !== "JSON" && file.lang !== "YAML") score += 2;

  // Prefer smaller files (won't blow context budget)
  if (file.tokens < 3000) score += 1;

  // Penalize generated files
  if (file.generated) score -= 20;

  // Prefer entry points
  if (file.entryPoint) score += 3;

  return score;
}

// ── .ai/ reader ─────────────────────────────────────────────────────────────

function readAiFile(filename) {
  const p = path.join(AI_DIR, filename);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, "utf8");
}

function extractSection(content, heading) {
  if (!content) return null;
  const re = new RegExp(`#+\\s+${heading}[\\s\\S]*?(?=\\n#+\\s|$)`, "i");
  const m = content.match(re);
  return m ? m[0].trim() : null;
}

function extractKnownIssuesForDomain(content, domains, taskWords) {
  if (!content) return [];
  const relevant = [];
  const lines = content.split("\n");
  let inRelevantSection = false;
  let buffer = [];

  for (const line of lines) {
    const lineLower = line.toLowerCase();
    const isHeader = /^#{1,3}\s/.test(line);

    if (isHeader) {
      if (buffer.length && inRelevantSection) {
        relevant.push(buffer.join("\n").trim());
      }
      buffer = [line];
      inRelevantSection = [...domains, ...taskWords].some((kw) =>
        lineLower.includes(kw),
      );
      continue;
    }

    if (inRelevantSection) {
      buffer.push(line);
    } else {
      // Check individual bullets/paragraphs
      const combined = [...domains, ...taskWords];
      if (combined.some((kw) => lineLower.includes(kw)) && line.trim()) {
        relevant.push(line.trim());
      }
    }
  }

  if (buffer.length && inRelevantSection) {
    relevant.push(buffer.join("\n").trim());
  }

  return relevant.slice(0, 5);
}

// ── Tool recommendations ─────────────────────────────────────────────────────

function recommendTools(taskType, domains) {
  const tools = [];

  if (["bug-fix", "feature", "refactor"].includes(taskType)) {
    tools.push({
      tool: "codebase-memory-mcp",
      why: "Trace dependencies and module relationships without reading full files",
    });
    tools.push({
      tool: "Serena",
      why: "Find symbol references, rename safely, edit only affected code",
    });
  }

  if (domains.includes("database")) {
    tools.push({
      tool: "codebase-memory-mcp",
      why: "Map database models and their relationships",
    });
  }

  if (taskType === "performance") {
    tools.push({
      tool: "ai-audit",
      why: "Check which files are largest and most expensive to load",
    });
  }

  if (domains.includes("auth") || domains.includes("security")) {
    tools.push({
      tool: "Serena",
      why: "Find all auth-related symbol references before making security changes",
    });
  }

  tools.push({
    tool: ".ai/ files",
    why: "Pre-summarized project state — read before anything else",
  });

  return tools;
}

// ── Main ─────────────────────────────────────────────────────────────────────
function main() {
  ensureDir(AI_DIR);
  ensureDir(REPORTS_DIR);

  const isGit = git.isGitRepo(TARGET_DIR);
  const branch = isGit ? git.getCurrentBranch(TARGET_DIR) : "n/a";
  const recent = isGit ? git.getRecentlyChangedFiles(TARGET_DIR) : [];
  const status = isGit ? git.getWorkingTreeStatus(TARGET_DIR) : [];

  // ── Session log mode ──────────────────────────────────────────────────────
  if (SESSION_LOG) {
    const sessionData = {
      date: new Date().toISOString(),
      branch,
      recentlyChanged: recent,
      workingTreeStatus: status.slice(0, 20),
    };

    const logPath = path.join(REPORTS_DIR, "sessions.jsonl");
    fs.appendFileSync(logPath, JSON.stringify(sessionData) + "\n", "utf8");
    log(`Session logged to ${logPath}`);
    return;
  }

  // ── Doctor mode ───────────────────────────────────────────────────────────
  log(`\n🩺  ai-doctor  —  planning context for: "${TASK}"\n`);

  const taskType = classifyTask(TASK);
  const domains = extractDomains(TASK);
  const taskWords = TASK.toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3)
    .filter(
      (w) =>
        ![
          "with",
          "that",
          "this",
          "from",
          "into",
          "when",
          "after",
          "before",
          "about",
        ].includes(w),
    );

  log(`  Task type: ${taskType}`);
  log(`  Domains: ${domains.join(", ") || "general"}`);

  // Read .ai/ files
  const projectState = readAiFile("PROJECT_STATE.md");
  const knownIssues = readAiFile("KNOWN_ISSUES.md");
  const contextIndex = readAiFile("CONTEXT_INDEX.md");
  const decisions = readAiFile("DECISIONS.md");
  const domainMap = readAiFile("DOMAIN_MAP.md");
  const tokenStrat = readAiFile("TOKEN_STRATEGY.md");

  // Scan files for relevance
  log("  Scanning files for relevance...");
  const files = scanDirectory(TARGET_DIR);
  const sourceFiles = files.filter((f) => f.lang && !f.generated);

  // Score files
  const scored = sourceFiles
    .map((f) => ({ ...f, score: scoreFileRelevance(f, taskWords, domains) }))
    .filter((f) => f.score > 0)
    .sort((a, b) => b.score - a.score);

  const topFiles = scored.slice(0, 8);
  const avoidFiles = files
    .filter((f) => f.generated || f.tokens > 25000)
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, 10);

  // Known issues relevant to this task
  const relevantIssues = extractKnownIssuesForDomain(
    knownIssues,
    domains,
    taskWords,
  );

  // Token estimates
  const naiveTokens = sourceFiles.reduce((s, f) => s + f.tokens, 0);
  const recommendedTokens =
    topFiles.reduce((s, f) => s + f.tokens, 0) +
    (projectState ? Math.ceil(projectState.length / 3.5) : 0) +
    (knownIssues ? Math.ceil(knownIssues.length / 3.5) : 0);

  const tools = recommendTools(taskType, domains);

  // ── Build report ──────────────────────────────────────────────────────────
  const now = new Date().toISOString().split("T")[0];
  const lines = [];

  lines.push(`# Context Plan`);
  lines.push(`<!-- generated ${now} for task: "${TASK}" -->`);
  lines.push(``);
  lines.push(`## Task`);
  lines.push(``);
  lines.push(`> ${TASK}`);
  lines.push(``);
  lines.push(`**Type:** ${taskType}`);
  lines.push(`**Domains:** ${domains.join(", ") || "general"}`);
  if (isGit) lines.push(`**Branch:** ${branch}`);
  lines.push(``);

  if (relevantIssues.length) {
    lines.push(`## Known Related Issues`);
    lines.push(``);
    lines.push(
      `> Check these before you start. They may save you from repeating a failed approach.`,
    );
    lines.push(``);
    for (const issue of relevantIssues) {
      lines.push(issue.startsWith("-") ? issue : `- ${issue}`);
    }
    lines.push(``);
  }

  if (recent.length) {
    lines.push(`## Recently Changed Files`);
    lines.push(``);
    for (const f of recent.slice(0, 10)) {
      lines.push(`- \`${f}\``);
    }
    lines.push(``);
  }

  if (topFiles.length) {
    lines.push(`## Recommended Starting Files`);
    lines.push(``);
    lines.push(`> Read these first. Ranked by relevance to the task.`);
    lines.push(``);
    lines.push(`| File | Tokens | Relevance |`);
    lines.push(`|------|--------|-----------|`);
    for (const f of topFiles) {
      const rel = f.score >= 20 ? "high" : f.score >= 10 ? "medium" : "low";
      lines.push(`| \`${f.relPath}\` | ~${formatTokens(f.tokens)} | ${rel} |`);
    }
    lines.push(``);
  }

  if (tools.length) {
    lines.push(`## Recommended Tools`);
    lines.push(``);
    for (const t of tools) {
      lines.push(`- **${t.tool}** — ${t.why}`);
    }
    lines.push(``);
  }

  if (avoidFiles.length) {
    lines.push(`## Do NOT Read`);
    lines.push(``);
    for (const f of avoidFiles) {
      const reason = f.generated
        ? "generated"
        : `${formatTokens(f.tokens)} tokens — too large`;
      lines.push(`- \`${f.relPath}\` — ${reason}`);
    }
    lines.push(``);
  }

  lines.push(`## Token Budget`);
  lines.push(``);
  lines.push(`| Approach | Est. Tokens |`);
  lines.push(`|----------|-------------|`);
  lines.push(`| Naive (read all source) | ~${formatTokens(naiveTokens)} |`);
  lines.push(`| Recommended path | ~${formatTokens(recommendedTokens)} |`);
  lines.push(
    `| Savings | ~${formatTokens(naiveTokens - recommendedTokens)} (${Math.round((1 - recommendedTokens / naiveTokens) * 100)}%) |`,
  );
  lines.push(``);

  lines.push(`## Recommended Workflow`);
  lines.push(``);
  lines.push(`1. Read \`.ai/PROJECT_STATE.md\` — understand current state`);
  lines.push(
    `2. Read \`.ai/KNOWN_ISSUES.md\` — check for related prior failures`,
  );
  if (domains.includes("auth") || domains.includes("security")) {
    lines.push(
      `3. Read \`.ai/DECISIONS.md\` — auth/security decisions matter here`,
    );
  }
  lines.push(
    `${domains.includes("auth") ? "4" : "3"}. Use codebase-memory-mcp to trace module dependencies`,
  );
  lines.push(
    `${domains.includes("auth") ? "5" : "4"}. Use Serena to find exact symbol references`,
  );
  lines.push(
    `${domains.includes("auth") ? "6" : "5"}. Read only the recommended files above`,
  );
  lines.push(
    `${domains.includes("auth") ? "7" : "6"}. After task: update \`.ai/WORKING_HISTORY.md\` and \`.ai/KNOWN_ISSUES.md\``,
  );
  lines.push(``);

  lines.push(`---`);
  lines.push(`*Regenerate: \`node scripts/ai-doctor.js --task "${TASK}"\`*`);

  const report = lines.join("\n");

  const outPath = OUT_FILE || path.join(REPORTS_DIR, "doctor-latest.md");
  fs.writeFileSync(outPath, report, "utf8");

  if (JSON_MODE) {
    console.log(
      JSON.stringify(
        {
          task: TASK,
          taskType,
          domains,
          topFiles: topFiles.map((f) => ({
            path: f.relPath,
            tokens: f.tokens,
            score: f.score,
          })),
          avoidFiles: avoidFiles.map((f) => f.relPath),
          relevantIssues,
          tokenBudget: { naive: naiveTokens, recommended: recommendedTokens },
          tools: tools.map((t) => t.tool),
        },
        null,
        2,
      ),
    );
    return;
  }

  // Console output
  console.log(`\n${"═".repeat(62)}`);
  console.log(`  Context Plan: ${TASK}`);
  console.log(`${"═".repeat(62)}\n`);
  console.log(`  Task type : ${taskType}`);
  console.log(`  Domains   : ${domains.join(", ") || "general"}`);
  console.log(``);

  if (relevantIssues.length) {
    console.log(`  ⚠  Known related issues:`);
    for (const i of relevantIssues.slice(0, 3)) {
      console.log(`     ${i.substring(0, 80)}${i.length > 80 ? "..." : ""}`);
    }
    console.log(``);
  }

  if (topFiles.length) {
    console.log(`  Recommended files:`);
    for (const f of topFiles.slice(0, 5)) {
      console.log(`    ${f.relPath}  (~${formatTokens(f.tokens)} tokens)`);
    }
    console.log(``);
  }

  console.log(`  Token budget:`);
  console.log(`    Naive     : ~${formatTokens(naiveTokens)}`);
  console.log(`    Recommended: ~${formatTokens(recommendedTokens)}`);
  console.log(``);
  console.log(`  Full plan: ${outPath}\n`);
}

main();
