import { config } from "dotenv";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

config({
  path: fileURLToPath(new URL("../.env", import.meta.url)),
  quiet: true,
});
const port = process.env.GAMEAGENT_STUDIO_PORT;
if (!port || !/^\d+$/.test(port) || Number(port) < 1 || Number(port) > 65535) {
  throw new Error("Set GAMEAGENT_STUDIO_PORT in .env (see .env.example)");
}
const require = createRequire(
  new URL("../apps/studio/package.json", import.meta.url),
);
const child = spawn(
  process.execPath,
  [
    require.resolve("next/dist/bin/next"),
    process.argv[2] || "dev",
    "--hostname",
    "127.0.0.1",
    "--port",
    port,
  ],
  {
    cwd: fileURLToPath(new URL("../apps/studio", import.meta.url)),
    stdio: "inherit",
  },
);
child.on("exit", (code) => process.exit(code ?? 1));
child.on("error", (err) => {
  console.error({ error: "studio_start_failed", detail: err.message });
  process.exit(1);
});
