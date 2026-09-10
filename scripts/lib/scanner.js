"use strict";

const fs = require("fs");
const path = require("path");

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  ".nuxt",
  "out",
  "coverage",
  ".cache",
  ".turbo",
  ".vercel",
  ".netlify",
  "__pycache__",
  ".pytest_cache",
  "venv",
  ".venv",
  "env",
  ".env",
  "target",
  "vendor",
  ".gradle",
  ".idea",
  ".vscode",
  "Pods",
  "DerivedData",
  ".dart_tool",
  ".pub-cache",
  "elm-stuff",
  ".stack-work",
  "zig-cache",
  "zig-out",
]);

const IGNORED_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".svg",
  ".ico",
  ".webp",
  ".avif",
  ".mp4",
  ".mov",
  ".avi",
  ".webm",
  ".mp3",
  ".wav",
  ".ogg",
  ".woff",
  ".woff2",
  ".ttf",
  ".eot",
  ".otf",
  ".pdf",
  ".docx",
  ".xlsx",
  ".pptx",
  ".zip",
  ".tar",
  ".gz",
  ".bz2",
  ".7z",
  ".rar",
  ".exe",
  ".dll",
  ".so",
  ".dylib",
  ".bin",
  ".lock", // yarn.lock, package-lock.json handled separately
  ".map", // source maps
]);

const LANGUAGE_MAP = {
  ".js": "JavaScript",
  ".mjs": "JavaScript",
  ".cjs": "JavaScript",
  ".ts": "TypeScript",
  ".tsx": "TypeScript",
  ".jsx": "JavaScript",
  ".py": "Python",
  ".pyw": "Python",
  ".rs": "Rust",
  ".go": "Go",
  ".java": "Java",
  ".kt": "Kotlin",
  ".scala": "Scala",
  ".cs": "C#",
  ".cpp": "C++",
  ".cc": "C++",
  ".cxx": "C++",
  ".h": "C/C++",
  ".hpp": "C++",
  ".c": "C",
  ".rb": "Ruby",
  ".php": "PHP",
  ".swift": "Swift",
  ".dart": "Dart",
  ".ex": "Elixir",
  ".exs": "Elixir",
  ".hs": "Haskell",
  ".ml": "OCaml",
  ".mli": "OCaml",
  ".clj": "Clojure",
  ".cljs": "ClojureScript",
  ".lua": "Lua",
  ".r": "R",
  ".R": "R",
  ".jl": "Julia",
  ".zig": "Zig",
  ".vue": "Vue",
  ".svelte": "Svelte",
  ".css": "CSS",
  ".scss": "SCSS",
  ".sass": "Sass",
  ".less": "Less",
  ".html": "HTML",
  ".htm": "HTML",
  ".xml": "XML",
  ".json": "JSON",
  ".jsonc": "JSON",
  ".yaml": "YAML",
  ".yml": "YAML",
  ".toml": "TOML",
  ".sql": "SQL",
  ".sh": "Shell",
  ".bash": "Shell",
  ".zsh": "Shell",
  ".fish": "Shell",
  ".ps1": "PowerShell",
  ".md": "Markdown",
  ".mdx": "Markdown",
  ".graphql": "GraphQL",
  ".gql": "GraphQL",
  ".proto": "Protobuf",
  ".tf": "Terraform",
  ".tfvars": "Terraform",
  ".dockerfile": "Docker",
};

const GENERATED_PATTERNS = [
  /\.min\.(js|css)$/,
  /\.generated\./,
  /\.d\.ts$/,
  /\/generated\//,
  /\/gen\//,
  /\/auto-generated\//,
  /\/migrations\/\d+/,
  /package-lock\.json$/,
  /yarn\.lock$/,
  /pnpm-lock\.yaml$/,
  /composer\.lock$/,
  /Gemfile\.lock$/,
  /Cargo\.lock$/,
  /poetry\.lock$/,
];

const ENTRY_POINT_PATTERNS = [
  /^(src\/|app\/|lib\/)?index\.(ts|tsx|js|jsx)$/,
  /^(src\/|app\/)?main\.(ts|tsx|js|jsx|py|rs|go)$/,
  /^(src\/|app\/)?app\.(ts|tsx|js|jsx)$/,
  /^server\.(ts|js)$/,
  /^cmd\/main\.go$/,
  /^src\/lib\.rs$/,
  /^Program\.cs$/,
  /^manage\.py$/,
  /^wsgi\.py$/,
  /^asgi\.py$/,
];

function isIgnoredDir(name) {
  return IGNORED_DIRS.has(name) || name.startsWith(".");
}

function isGenerated(relPath) {
  return GENERATED_PATTERNS.some((p) => p.test(relPath));
}

function getLanguage(ext) {
  if (ext === ".lock" || path.basename(ext) === "Dockerfile") return "Docker";
  return LANGUAGE_MAP[ext] || null;
}

function estimateTokens(filePath) {
  try {
    const stat = fs.statSync(filePath);
    return Math.ceil(stat.size / 4);
  } catch {
    return 0;
  }
}

function isEntryPoint(relPath) {
  return ENTRY_POINT_PATTERNS.some((p) => p.test(relPath));
}

/**
 * Walk a directory tree and return FileInfo objects.
 * @param {string} rootDir - Absolute path to start from
 * @param {object} opts
 * @param {boolean} opts.skipIgnored - Whether to skip IGNORED_DIRS (default: true)
 * @param {number} opts.maxDepth - Max directory depth (default: 12)
 * @returns {FileInfo[]}
 */
function scanDirectory(rootDir, opts = {}) {
  const { skipIgnored = true, maxDepth = 12 } = opts;
  const results = [];

  function walk(dir, depth) {
    if (depth > maxDepth) return;

    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (entry.name.startsWith(".") && entry.name !== ".ai") continue;

      const fullPath = path.join(dir, entry.name);
      const relPath = path.relative(rootDir, fullPath).replace(/\\/g, "/");

      if (entry.isDirectory()) {
        if (skipIgnored && isIgnoredDir(entry.name)) continue;
        walk(fullPath, depth + 1);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (IGNORED_EXTENSIONS.has(ext)) continue;

        let stat;
        try {
          stat = fs.statSync(fullPath);
        } catch {
          continue;
        }

        const lang =
          getLanguage(ext) || (entry.name === "Dockerfile" ? "Docker" : null);
        const generated = isGenerated(relPath);
        const tokens = Math.ceil(stat.size / 4);
        const entryPoint = isEntryPoint(relPath);

        results.push({
          path: fullPath,
          relPath,
          name: entry.name,
          ext,
          lang,
          size: stat.size,
          tokens,
          generated,
          entryPoint,
          mtime: stat.mtimeMs,
        });
      }
    }
  }

  walk(rootDir, 0);
  return results;
}

/**
 * Summarize scan results by language.
 */
function summarizeByLanguage(files) {
  const langs = {};
  for (const f of files) {
    if (!f.lang || f.generated) continue;
    const l = langs[f.lang] || { count: 0, tokens: 0, size: 0 };
    l.count++;
    l.tokens += f.tokens;
    l.size += f.size;
    langs[f.lang] = l;
  }
  return Object.entries(langs)
    .sort((a, b) => b[1].tokens - a[1].tokens)
    .map(([lang, stats]) => ({ lang, ...stats }));
}

/**
 * Load .repomixignore or .gitignore globs as simple prefix patterns.
 * This is a lightweight implementation — not full glob support.
 */
function loadIgnorePatterns(rootDir) {
  const patterns = [];
  for (const fname of [".repomixignore", ".gitignore", ".aiignore"]) {
    const p = path.join(rootDir, fname);
    if (!fs.existsSync(p)) continue;
    const lines = fs.readFileSync(p, "utf8").split("\n");
    for (const line of lines) {
      const t = line.trim();
      if (t && !t.startsWith("#")) patterns.push(t);
    }
  }
  return patterns;
}

module.exports = {
  scanDirectory,
  summarizeByLanguage,
  loadIgnorePatterns,
  isGenerated,
  isEntryPoint,
  IGNORED_DIRS,
  LANGUAGE_MAP,
};
