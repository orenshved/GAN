import "dotenv/config";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const project = fileURLToPath(new URL("../services/daemon/", import.meta.url));
const commands = {
  lint: ["run", "--frozen", "ruff", "check", "."],
  format: ["run", "--frozen", "ruff", "format", "."],
  "format-check": ["run", "--frozen", "ruff", "format", "--check", "."],
  typecheck: ["run", "--frozen", "mypy"],
  test: ["run", "--frozen", "pytest", "-q"],
  build: ["build", "--no-sources"],
};
const command = commands[process.argv[2]];
if (!command) throw new Error("unknown_python_command");
const result = spawnSync(
  process.env.GAMEAGENT_PYTHON || "python",
  ["-m", "uv", ...command],
  {
    cwd: project,
    stdio: "inherit",
  },
);
if (result.error)
  console.error({
    error: "python_command_failed",
    detail: result.error.message,
  });
process.exit(result.status ?? 1);
