import "dotenv/config";
import { spawnSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { compile } from "json-schema-to-typescript";
import { pythonCommand } from "./python-command.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const python = pythonCommand();
const exported = spawnSync(
  python.executable,
  [
    ...python.prefix,
    "-m",
    "uv",
    "run",
    "--frozen",
    "--project",
    `${root}services/daemon`,
    "python",
    "-m",
    "gameagent.export_schema",
  ],
  { encoding: "utf8", cwd: root },
);
if (exported.status !== 0) {
  console.error({ error: "schema_export_failed", detail: exported.stderr });
  process.exit(1);
}
const schema = JSON.parse(exported.stdout);
// The generator targets definitions; AJV uses the untouched 2020-12 schema.
const generatorSchema = JSON.parse(
  JSON.stringify(schema).replaceAll("#/$defs/", "#/definitions/"),
);
generatorSchema.definitions = generatorSchema.$defs;
delete generatorSchema.$defs;
const types = await compile(generatorSchema, "ProtocolDocument", {
  bannerComment:
    "/* Generated from Pydantic. Run pnpm protocol:generate; do not edit. */",
  unreachableDefinitions: true,
});
for (const [path, content] of [
  [
    "packages/protocol/schema/protocol.schema.json",
    exported.stdout.replaceAll("\r\n", "\n"),
  ],
  ["packages/protocol/src/generated.ts", types],
]) {
  if (process.argv.includes("--check")) {
    if ((await readFile(root + path, "utf8")) !== content) {
      throw new Error(`protocol_drift: ${path}; run pnpm protocol:generate`);
    }
  } else {
    await mkdir(fileURLToPath(new URL("../" + path + "/..", import.meta.url)), {
      recursive: true,
    });
    await writeFile(root + path, content);
  }
}
console.log(
  process.argv.includes("--check")
    ? "Protocol artifacts match."
    : "Protocol artifacts generated.",
);
