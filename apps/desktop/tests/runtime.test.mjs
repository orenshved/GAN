import assert from "node:assert/strict";
import test from "node:test";

import { parse } from "dotenv";

import {
  daemonInvocation,
  installationPaths,
  loopbackConfiguration,
  parsePositiveSeconds,
  projectArgument,
  projectFromRegistry,
  updateEnvironmentText,
} from "../runtime.mjs";

test("loopback configuration derives URLs only from configured ports", () => {
  assert.deepEqual(
    loopbackConfiguration({
      GAMEAGENT_STUDIO_PORT: "5100",
      GAMEAGENT_DAEMON_PORT: "5101",
    }),
    {
      studioPort: 5100,
      daemonPort: 5101,
      studioOrigin: "http://127.0.0.1:5100",
      daemonUrl: "http://127.0.0.1:5101",
    },
  );
  assert.throws(
    () =>
      loopbackConfiguration({
        GAMEAGENT_STUDIO_PORT: "5100",
        GAMEAGENT_DAEMON_PORT: "5100",
      }),
    /must be different/,
  );
});

test("positive startup seconds reject zero and invalid values", () => {
  assert.equal(parsePositiveSeconds("45", "timeout"), 45);
  assert.throws(() => parsePositiveSeconds("0", "timeout"), /positive/);
  assert.throws(() => parsePositiveSeconds("soon", "timeout"), /positive/);
});

test("project selection supports command line and active registry state", () => {
  assert.equal(
    projectArgument(["electron", ".", "--project=C:\\Games\\One"]),
    "C:\\Games\\One",
  );
  assert.equal(
    projectArgument(["Game Agent Network.exe", "C:\\Games\\One"], true),
    "C:\\Games\\One",
  );
  assert.equal(projectArgument(["electron", "."]), null);
  assert.equal(
    projectFromRegistry(
      JSON.stringify({
        schema_version: 1,
        active_project_id: "project-two",
        projects: [
          { project_id: "project-one", root: "C:/Games/One" },
          { project_id: "project-two", root: "C:/Games/Two" },
        ],
      }),
    ),
    "C:/Games/Two",
  );
});

test("environment updates preserve comments and do not duplicate keys", () => {
  const updated = updateEnvironmentText("# local config\nPORT=1\n", {
    PORT: "2",
    PROJECT_PATH: "C:\\Games\\Cosmic Meltdown",
  });
  assert.equal(
    updated,
    "# local config\nPORT=2\nPROJECT_PATH=C:\\Games\\Cosmic Meltdown\n",
  );
  assert.equal(parse(updated).PROJECT_PATH, "C:\\Games\\Cosmic Meltdown");
  const repeated = updateEnvironmentText(updated, {
    PROJECT_PATH: parse(updated).PROJECT_PATH,
  });
  assert.equal(parse(repeated).PROJECT_PATH, "C:\\Games\\Cosmic Meltdown");
  assert.equal(repeated, updated);
});

test("packaged paths and daemon command remain self contained", () => {
  const paths = installationPaths({
    packaged: true,
    resourcesPath: "C:\\Program Files\\GAN\\resources",
    repositoryRoot: "unused",
  });
  const invocation = daemonInvocation(paths, true, [
    "status",
    "C:\\Games\\One",
  ]);
  assert.match(
    invocation.command,
    /resources[\\/]daemon[\\/]gameagent-daemon\.exe$/,
  );
  assert.deepEqual(invocation.args, ["status", "C:\\Games\\One"]);
  assert.match(paths.studioArchive, /resources[\\/]studio\.asar$/);
  assert.equal(paths.studioServer, null);
});
