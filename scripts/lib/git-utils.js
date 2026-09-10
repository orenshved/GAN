"use strict";

const { execSync } = require("child_process");
const path = require("path");

function isGitRepo(dir) {
  try {
    execSync("git rev-parse --is-inside-work-tree", {
      cwd: dir,
      stdio: "pipe",
      timeout: 5000,
    });
    return true;
  } catch {
    return false;
  }
}

function getRecentCommits(dir, n = 20) {
  try {
    const out = execSync(`git log --oneline -${n} --no-merges`, {
      cwd: dir,
      stdio: "pipe",
      timeout: 5000,
    })
      .toString()
      .trim();
    return out ? out.split("\n") : [];
  } catch {
    return [];
  }
}

/**
 * Get the most frequently changed files (churn hotspots).
 * Returns [{file, changes}] sorted by change count descending.
 */
function getChurnHotspots(dir, limit = 20, since = "3 months ago") {
  try {
    const out = execSync(
      `git log --since="${since}" --name-only --pretty=format: --no-merges`,
      { cwd: dir, stdio: "pipe", timeout: 10000 },
    ).toString();

    const counts = {};
    for (const line of out.split("\n")) {
      const f = line.trim();
      if (!f) continue;
      counts[f] = (counts[f] || 0) + 1;
    }

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([file, changes]) => ({ file, changes }));
  } catch {
    return [];
  }
}

/**
 * Get files changed in the last N days.
 */
function getRecentlyChangedFiles(dir, days = 7) {
  try {
    const out = execSync(
      `git diff --name-only HEAD~1 HEAD 2>/dev/null || git diff --name-only HEAD`,
      { cwd: dir, stdio: "pipe", timeout: 5000 },
    )
      .toString()
      .trim();
    return out ? out.split("\n").filter(Boolean) : [];
  } catch {
    return [];
  }
}

/**
 * Get current branch name.
 */
function getCurrentBranch(dir) {
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", {
      cwd: dir,
      stdio: "pipe",
      timeout: 3000,
    })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
}

/**
 * Get git root for a directory.
 */
function getGitRoot(dir) {
  try {
    return execSync("git rev-parse --show-toplevel", {
      cwd: dir,
      stdio: "pipe",
      timeout: 3000,
    })
      .toString()
      .trim();
  } catch {
    return dir;
  }
}

/**
 * Get files with the most bug-fix commits (heuristic: commit message contains 'fix').
 */
function getBugHotspots(dir, limit = 10) {
  try {
    const out = execSync(
      `git log --all --grep="fix" --grep="bug" --grep="error" --grep="broken" -i --name-only --pretty=format: --no-merges`,
      { cwd: dir, stdio: "pipe", timeout: 10000 },
    ).toString();

    const counts = {};
    for (const line of out.split("\n")) {
      const f = line.trim();
      if (!f) continue;
      counts[f] = (counts[f] || 0) + 1;
    }

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([file, fixes]) => ({ file, fixes }));
  } catch {
    return [];
  }
}

/**
 * Get untracked / unstaged / staged file summary.
 */
function getWorkingTreeStatus(dir) {
  try {
    const out = execSync("git status --short", {
      cwd: dir,
      stdio: "pipe",
      timeout: 3000,
    })
      .toString()
      .trim();
    return out ? out.split("\n") : [];
  } catch {
    return [];
  }
}

module.exports = {
  isGitRepo,
  getRecentCommits,
  getChurnHotspots,
  getRecentlyChangedFiles,
  getCurrentBranch,
  getGitRoot,
  getBugHotspots,
  getWorkingTreeStatus,
};
