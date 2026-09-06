import "dotenv/config";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { setTimeout } from "node:timers/promises";
import { fileURLToPath } from "node:url";

// OS-selected ephemeral port avoids a fixed test port or user service collision.
const socket = createServer();
socket.listen(0, "127.0.0.1");
await once(socket, "listening");
const address = socket.address();
assert(address && typeof address !== "string");
const port = address.port;
await new Promise((resolve, reject) =>
  socket.close((error) => (error ? reject(error) : resolve())),
);
const require = createRequire(
  new URL("../apps/studio/package.json", import.meta.url),
);
const child = spawn(
  process.execPath,
  [
    require.resolve("next/dist/bin/next"),
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  {
    cwd: fileURLToPath(new URL("../apps/studio", import.meta.url)),
    stdio: ["ignore", "pipe", "pipe"],
  },
);
let logs = "";
child.stdout.on("data", (chunk) => {
  logs += chunk;
});
child.stderr.on("data", (chunk) => {
  logs += chunk;
});
const exited = once(child, "exit");
try {
  let response;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (child.exitCode !== null) throw new Error(`studio_exited: ${logs}`);
    try {
      response = await fetch(`http://127.0.0.1:${port}`, {
        signal: AbortSignal.timeout(1000),
      });
      break;
    } catch {
      await setTimeout(250);
    }
  }
  assert(response, `studio_timeout: ${logs}`);
  assert.equal(response.status, 200);
  const html = await response.text();
  for (const text of [
    "Game Agent Network",
    "Deterministic",
    "Measured",
    "Comparative",
    "Heuristic",
    "Human",
  ])
    assert(html.includes(text), `Missing rendered content: ${text}`);
  assert(html.includes('lang="en"'));
  console.log(
    "Studio production HTTP smoke passed (shared UI labels rendered).",
  );
} finally {
  child.kill();
  await exited;
}
