import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateDocument } from "../dist/src/index.js";

const read = async (name) =>
  JSON.parse(await readFile(new URL(name, import.meta.url), "utf8"));
for (const [definition, value] of Object.entries(
  await read("../fixtures/valid.json"),
)) {
  test(`accepts ${definition}`, () => {
    assert.deepEqual(validateDocument(definition, value), {
      valid: true,
      errors: [],
    });
  });
}
for (const item of await read("../fixtures/invalid.json")) {
  test(`rejects ${item.name}`, () =>
    assert.equal(validateDocument(item.definition, item.value).valid, false));
}
test("unknown definitions fail closed", () => {
  assert.equal(validateDocument("Unknown", {}).valid, false);
});
test("every ontology entry is a valid capability with a unique ID", async () => {
  const entries = await read("../../../capabilities/ontology/initial.json");
  assert.equal(
    new Set(entries.map((item) => item.capability_id)).size,
    entries.length,
  );
  for (const entry of entries)
    assert.equal(validateDocument("Capability", entry).valid, true);
});
