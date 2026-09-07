import { spawnSync } from "node:child_process";

export function pythonCommand(environment = process.env) {
  const configured = environment.GAMEAGENT_PYTHON;
  if (configured) {
    const probe = spawnSync(configured, ["--version"], {
      env: environment,
      stdio: "ignore",
    });
    if (probe.status === 0) return { executable: configured, prefix: [] };
  } else if (process.platform === "win32") {
    const located = spawnSync("where.exe", ["python.exe"], {
      encoding: "utf8",
      env: environment,
    });
    for (const executable of located.stdout?.split(/\r?\n/) ?? []) {
      if (!executable) continue;
      const probe = spawnSync(executable, ["--version"], {
        env: environment,
        stdio: "ignore",
      });
      if (probe.status === 0) return { executable, prefix: [] };
    }
  } else {
    for (const executable of ["python", "python3"]) {
      const probe = spawnSync(executable, ["--version"], {
        env: environment,
        stdio: "ignore",
      });
      if (probe.status === 0) return { executable, prefix: [] };
    }
  }
  throw new Error(
    "Python 3.12+ is required (set GAMEAGENT_PYTHON to override)",
  );
}
