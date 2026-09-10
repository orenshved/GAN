#!/usr/bin/env node
"use strict";

/**
 * ai-audit  —  Token waste analysis and context bloat detector.
 *
 * Usage:
 *   node scripts/ai-audit.js [--root <path>] [--out <path>] [--json] [--quiet]
 *
 * Writes:
 *   .ai/reports/token-audit-latest.md
 */

const fs = require("fs");
const path = require("path");

const {
  scanDirectory,
  summarizeByLanguage,
  IGNORED_DIRS,
} = require("./lib/scanner");
const {
  formatTokens,
  categorizeBudget,
  BUDGET_TIERS,
} = require("./lib/token-counter");
const git = require("./lib/git-utils");

// ── CLI args ────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const rootIndex = args.indexOf("--root");
const outIndex = args.indexOf("--out");
const quiet = args.includes("--quiet");
const jsonMode = args.includes("--json");

const TARGET_DIR =
  rootIndex !== -1 ? path.resolve(args[rootIndex + 1]) : process.cwd();
const AI_DIR = path.join(TARGET_DIR, ".ai");
const REPORTS_DIR = path.join(AI_DIR, "reports");
const OUT_FILE =
  outIndex !== -1
    ? path.resolve(args[outIndex + 1])
    : path.join(REPORTS_DIR, "token-audit-latest.md");

function log(...msg) {
  if (!quiet && !jsonMode) console.log(...msg);
}

function warn(...msg) {
  if (!jsonMode) console.warn(...msg);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function formatSize(bytes) {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(0)} KB`;
  return `${bytes} B`;
}

// ── Bloat detectors ─────────────────────────────────────────────────────────

/**
 * Detect directories that shouldn't be in the repo (or are ignored by agents)
 * but ARE present and might get accidentally indexed.
 */
function detectBloatDirs(rootDir) {
  const bloatCandidates = [
    { name: "node_modules", reason: "vendor dependencies — never index" },
    { name: "dist", reason: "build output — regenerable" },
    { name: "build", reason: "build output — regenerable" },
    { name: ".next", reason: "Next.js build cache — regenerable" },
    { name: "out", reason: "build output" },
    { name: "coverage", reason: "test coverage — regenerable" },
    { name: ".cache", reason: "cache — regenerable" },
    { name: ".turbo", reason: "Turborepo cache — regenerable" },
    { name: "venv", reason: "Python virtualenv — never index" },
    { name: ".venv", reason: "Python virtualenv — never index" },
    { name: "__pycache__", reason: "Python bytecache — never index" },
    { name: "target", reason: "Rust/Java build output — regenerable" },
    { name: "vendor", reason: "vendored dependencies" },
    { name: "Pods", reason: "CocoaPods dependencies" },
    { name: "DerivedData", reason: "Xcode build output" },
  ];

  return bloatCandidates.filter((c) =>
    fs.existsSync(path.join(rootDir, c.name)),
  );
}

/**
 * Find potentially stale or duplicate documentation.
 */
function detectStaleDocs(files) {
  const mdFiles = files.filter(
    (f) => (f.ext === ".md" || f.ext === ".mdx") && !f.generated,
  );
  const issues = [];

  // Large docs
  for (const f of mdFiles) {
    if (f.tokens > 10000) {
      issues.push({
        type: "large_doc",
        file: f.relPath,
        tokens: f.tokens,
        suggestion: "Split into focused sections or summarize into .ai/",
      });
    }
  }

  // Look for duplicate/similar filenames
  const names = mdFiles.map((f) => path.basename(f.name, ".md").toLowerCase());
  const seen = {};
  for (const [i, n] of names.entries()) {
    for (const [j, m] of names.entries()) {
      if (i >= j) continue;
      if (n === m || n.includes(m) || m.includes(n)) {
        issues.push({
          type: "potential_duplicate",
          files: [mdFiles[i].relPath, mdFiles[j].relPath],
          suggestion: "Verify these docs don't duplicate each other",
        });
      }
    }
  }

  return issues;
}

/**
 * Identify files that match common "AI context poison" patterns.
 */
function detectContextPoison(files) {
  const poison = [];

  for (const f of files) {
    // Minified files
    if (/\.min\.(js|css)$/.test(f.relPath)) {
      poison.push({
        file: f.relPath,
        reason: "minified — unreadable, large",
        tokens: f.tokens,
      });
    }
    // Very large source files
    if (f.tokens > 20000 && !f.generated) {
      poison.push({
        file: f.relPath,
        reason: "very large — splits context budget severely",
        tokens: f.tokens,
      });
    }
    // Type declaration files
    if (f.relPath.endsWith(".d.ts") && f.tokens > 1000) {
      poison.push({
        file: f.relPath,
        reason: "type declaration — rarely useful in context",
        tokens: f.tokens,
      });
    }
  }

  return poison.sort((a, b) => b.tokens - a.tokens);
}

/**
 * Suggest .repomixignore / .aiignore additions.
 */
function suggestIgnorePatterns(bloatDirs, poisonFiles) {
  const patterns = new Set();
  for (const d of bloatDirs) patterns.add(d.name + "/");
  for (const f of poisonFiles) {
    const ext = path.extname(f.file);
    if (ext === ".map") patterns.add("**/*.map");
    else if (f.file.endsWith(".min.js")) patterns.add("**/*.min.js");
    else if (f.file.endsWith(".min.css")) patterns.add("**/*.min.css");
    else if (f.file.endsWith(".d.ts")) patterns.add("**/*.d.ts");
  }
  return [...patterns];
}

/**
 * Calculate token cost for different naive vs. smart context strategies.
 */
function calculateStrategyCosts(files, entryTokens) {
  const allSource = files.filter((f) => f.lang && !f.generated);
  const allTokens = allSource.reduce((s, f) => s + f.tokens, 0);

  // Naive: read everything
  const naive = allTokens;

  // README-first: README + package.json + all .md files
  const readmeFirst = files
    .filter(
      (f) =>
        f.name === "README.md" || f.name === "package.json" || f.ext === ".md",
    )
    .reduce((s, f) => s + f.tokens, 0);

  // Smart: .ai/ files only
  const smart =
    files
      .filter((f) => f.relPath.startsWith(".ai/"))
      .reduce((s, f) => s + f.tokens, 0) + (entryTokens || 0);

  return { naive, readmeFirst, smart };
}

// ── Main ─────────────────────────────────────────────────────────────────────
function main() {
  log(`\n🔎  ai-audit  —  analyzing ${TARGET_DIR}\n`);

  ensureDir(AI_DIR);
  ensureDir(REPORTS_DIR);

  const isGit = git.isGitRepo(TARGET_DIR);
  const churn = isGit ? git.getChurnHotspots(TARGET_DIR, 15) : [];
  const bugs = isGit ? git.getBugHotspots(TARGET_DIR, 10) : [];

  log("  Scanning files...");
  const files = scanDirectory(TARGET_DIR);
  const sourceFiles = files.filter((f) => f.lang && !f.generated);
  const langSummary = summarizeByLanguage(files);

  const totalSourceTokens = sourceFiles.reduce((s, f) => s + f.tokens, 0);
  const totalSourceSize = sourceFiles.reduce((s, f) => s + f.size, 0);

  const largeFiles = sourceFiles
    .filter((f) => f.tokens > 5000)
    .sort((a, b) => b.tokens - a.tokens);
  const bloatDirs = detectBloatDirs(TARGET_DIR);
  const staleDocIssues = detectStaleDocs(files);
  const poisonFiles = detectContextPoison(files);
  const ignorePatterns = suggestIgnorePatterns(bloatDirs, poisonFiles);

  const entryPoints = files.filter((f) => f.entryPoint && !f.generated);
  const entryTokens = entryPoints.reduce((s, f) => s + f.tokens, 0);
  const strategies = calculateStrategyCosts(files, entryTokens);

  const budgetNaive = categorizeBudget(strategies.naive);
  const budgetSmart = categorizeBudget(strategies.smart);

  log(
    `  Source files: ${sourceFiles.length} (~${formatTokens(totalSourceTokens)} tokens)`,
  );
  log(`  Poison files: ${poisonFiles.length}`);
  log(`  Bloat dirs:   ${bloatDirs.length}`);

  const now = new Date().toISOString().split("T")[0];
  const lines = [];

  lines.push(`# Token Audit Report`);
  lines.push(`<!-- generated ${now} -->`);
  lines.push(``);
  lines.push(`## Summary`);
  lines.push(``);
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Source files | ${sourceFiles.length} |`);
  lines.push(`| Total source tokens | ~${formatTokens(totalSourceTokens)} |`);
  lines.push(
    `| Naive context cost | ~${formatTokens(strategies.naive)} (${budgetNaive.label}) |`,
  );
  lines.push(
    `| Smart context cost | ~${formatTokens(strategies.smart)} (${budgetSmart.label}) |`,
  );
  lines.push(
    `| Potential savings | ~${formatTokens(strategies.naive - strategies.smart)} (${Math.round((1 - strategies.smart / strategies.naive) * 100)}%) |`,
  );
  lines.push(``);

  lines.push(`## Context Strategy Comparison`);
  lines.push(``);
  lines.push(`| Strategy | Tokens | Assessment |`);
  lines.push(`|----------|--------|------------|`);
  lines.push(
    `| Naive (read everything) | ~${formatTokens(strategies.naive)} | ${budgetNaive.emoji} ${budgetNaive.label} |`,
  );
  lines.push(
    `| README-first | ~${formatTokens(strategies.readmeFirst)} | ${categorizeBudget(strategies.readmeFirst).emoji} ${categorizeBudget(strategies.readmeFirst).label} |`,
  );
  lines.push(
    `| Smart (.ai/ + entry points) | ~${formatTokens(strategies.smart)} | ${budgetSmart.emoji} ${budgetSmart.label} |`,
  );
  lines.push(``);

  if (largeFiles.length) {
    lines.push(`## Large Files (Top Token Consumers)`);
    lines.push(``);
    lines.push(`| File | Tokens | Size | Recommendation |`);
    lines.push(`|------|--------|------|----------------|`);
    for (const f of largeFiles.slice(0, 15)) {
      const cat = categorizeBudget(f.tokens);
      const rec =
        f.tokens > 20000
          ? "Never read in full — use targeted search"
          : f.tokens > 10000
            ? "Read only if directly relevant"
            : "Read section by section";
      lines.push(
        `| \`${f.relPath}\` | ~${formatTokens(f.tokens)} | ${formatSize(f.size)} | ${rec} |`,
      );
    }
    lines.push(``);
  }

  if (poisonFiles.length) {
    lines.push(`## Context Poison Files`);
    lines.push(``);
    lines.push(`> These files degrade context quality if included.`);
    lines.push(``);
    for (const p of poisonFiles.slice(0, 15)) {
      lines.push(
        `- \`${p.file}\` — ${p.reason} (~${formatTokens(p.tokens)} tokens)`,
      );
    }
    lines.push(``);
  }

  if (bloatDirs.length) {
    lines.push(`## Bloat Directories`);
    lines.push(``);
    lines.push(`> These exist on disk but agents should never index them.`);
    lines.push(``);
    for (const d of bloatDirs) {
      lines.push(`- \`${d.name}/\` — ${d.reason}`);
    }
    lines.push(``);
  }

  if (staleDocIssues.length) {
    lines.push(`## Documentation Issues`);
    lines.push(``);
    for (const issue of staleDocIssues) {
      if (issue.type === "large_doc") {
        lines.push(
          `- **Large doc:** \`${issue.file}\` (~${formatTokens(issue.tokens)} tokens) — ${issue.suggestion}`,
        );
      } else if (issue.type === "potential_duplicate") {
        lines.push(
          `- **Possible duplicate:** \`${issue.files.join("\` and \`")}\` — ${issue.suggestion}`,
        );
      }
    }
    lines.push(``);
  }

  if (churn.length) {
    lines.push(`## Churn Hotspots`);
    lines.push(``);
    lines.push(
      `> High-churn = frequently broken = agents should check known issues before editing.`,
    );
    lines.push(``);
    for (const h of churn.slice(0, 10)) {
      lines.push(`- \`${h.file}\` — ${h.changes} changes`);
    }
    lines.push(``);
  }

  if (ignorePatterns.length) {
    lines.push(`## Recommended .repomixignore / .aiignore Additions`);
    lines.push(``);
    lines.push("```");
    lines.push("# ai-audit suggestions");
    for (const p of ignorePatterns) lines.push(p);
    lines.push("```");
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

  lines.push(`---`);
  lines.push(`*Regenerate: \`node scripts/ai-audit.js\`*`);

  const report = lines.join("\n");
  fs.writeFileSync(OUT_FILE, report, "utf8");
  log(`\n  ✓  Report: ${OUT_FILE}`);

  if (jsonMode) {
    console.log(
      JSON.stringify(
        {
          totalSourceTokens,
          naive: strategies.naive,
          smart: strategies.smart,
          savings: strategies.naive - strategies.smart,
          largeFiles: largeFiles
            .slice(0, 10)
            .map((f) => ({ path: f.relPath, tokens: f.tokens })),
          poisonFiles: poisonFiles
            .slice(0, 10)
            .map((f) => ({ path: f.file, reason: f.reason })),
          bloatDirs: bloatDirs.map((d) => d.name),
          suggestedIgnorePatterns: ignorePatterns,
        },
        null,
        2,
      ),
    );
    return;
  }

  // ── Console summary ──────────────────────────────────────────────────────
  console.log(`\n${"─".repeat(60)}`);
  console.log(`  Token Audit — ${TARGET_DIR}`);
  console.log(`${"─".repeat(60)}`);
  console.log(`  Source total : ~${formatTokens(totalSourceTokens)}`);
  console.log(
    `  Naive cost   : ~${formatTokens(strategies.naive)}  (${budgetNaive.emoji} ${budgetNaive.label})`,
  );
  console.log(
    `  Smart cost   : ~${formatTokens(strategies.smart)}  (${budgetSmart.emoji} ${budgetSmart.label})`,
  );
  console.log(
    `  Savings      : ~${formatTokens(strategies.naive - strategies.smart)}`,
  );
  if (poisonFiles.length) console.log(`  Poison files : ${poisonFiles.length}`);
  if (bloatDirs.length)
    console.log(`  Bloat dirs   : ${bloatDirs.map((d) => d.name).join(", ")}`);
  console.log(`${"─".repeat(60)}\n`);
  console.log(`  Full report: ${OUT_FILE}\n`);
}

main();
