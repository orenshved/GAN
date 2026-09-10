"use strict";

const fs = require("fs");

/**
 * Estimate token count from a string.
 * Approximation: 1 token ≈ 4 characters for English code/prose.
 * This matches OpenAI/Anthropic real-world averages within ~15%.
 */
function estimateFromString(text) {
  if (!text) return 0;
  // Code tends to tokenize more densely; we use 3.5 chars/token as a
  // slightly conservative estimate for mixed code+docs content.
  return Math.ceil(text.length / 3.5);
}

/**
 * Estimate tokens from a file on disk.
 * Reads file size only — does not read content — so it's fast.
 */
function estimateFromFile(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return Math.ceil(stat.size / 3.5);
  } catch {
    return 0;
  }
}

/**
 * Estimate tokens from file content (if already read).
 */
function estimateFromContent(content) {
  return estimateFromString(content);
}

/**
 * Format a token count as a human-readable string.
 * e.g. 1500 → "1.5k", 45000 → "45k"
 */
function formatTokens(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${n}`;
}

/**
 * Cost tiers for token budget planning.
 */
const BUDGET_TIERS = {
  MINIMAL: 8_000, // Initial context target
  PLANNING: 16_000, // Task planning
  EDITING: 32_000, // Active editing session
  DEEP: 64_000, // Deep exploration
  WARNING: 100_000, // Warning threshold
};

function categorizeBudget(tokens) {
  if (tokens <= BUDGET_TIERS.MINIMAL)
    return { tier: "MINIMAL", label: "excellent", emoji: "✓" };
  if (tokens <= BUDGET_TIERS.PLANNING)
    return { tier: "PLANNING", label: "good", emoji: "✓" };
  if (tokens <= BUDGET_TIERS.EDITING)
    return { tier: "EDITING", label: "acceptable", emoji: "~" };
  if (tokens <= BUDGET_TIERS.DEEP)
    return { tier: "DEEP", label: "high", emoji: "!" };
  if (tokens <= BUDGET_TIERS.WARNING)
    return { tier: "WARNING", label: "expensive", emoji: "!!" };
  return { tier: "DANGER", label: "critical waste", emoji: "!!!" };
}

module.exports = {
  estimateFromString,
  estimateFromFile,
  estimateFromContent,
  formatTokens,
  categorizeBudget,
  BUDGET_TIERS,
};
