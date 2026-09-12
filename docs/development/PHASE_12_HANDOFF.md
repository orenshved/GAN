# Phase 12 handoff

Phase 12 is implemented and ready for Director review.

## Delivered

- Windows x64 Electron shell that owns the packaged Studio and daemon lifecycle.
- Next.js standalone Studio archive with SHA-256 verification before extraction.
- PyInstaller daemon bundle with the same Pydantic contracts, canonical history,
  CLI commands, authenticated loopback API, and production authority as development.
- Local configuration generated under the application data directory; secrets and
  ports are not compiled into the package.
- Restricted browser surface: context isolation and Chromium sandbox enabled,
  Node integration disabled, permissions and new windows denied, and navigation
  limited to the owned local Studio origin.
- NSIS installer plus an unpacked application for smoke testing.
- Separate headless daemon distribution with `.env.example` and operating notes.
- Windows CI package-directory build to catch packaging drift.

## Authority boundary

Electron is a process and security shell only. It does not import core production
logic, admit commands, evaluate QA, route models, or mutate canonical history. Studio
continues to use its server-side authenticated bridge, and the daemon remains the
only production authority. The packaged daemon can also run independently without
Electron.

## Acceptance evidence

- `pnpm check` passes repository formatting, lint, generated-contract drift,
  TypeScript and Python checks, 190 daemon tests, 60 protocol tests, builds, and the
  Studio-to-daemon Playwright smoke.
- `pnpm desktop:package:dir` builds the real Next.js standalone archive, PyInstaller
  daemon, Electron resources, unpacked application, and headless distribution.
- The unpacked executable was launched with isolated loopback ports. Authenticated
  daemon health and Studio health both returned HTTP 200.
- Playwright loaded the packaged Studio, confirmed the `GAN` project, opened
  `02 Production`, found the `Agent network` workspace, and rendered all 12 agent
  nodes.
- The packaged headless executable can replay and print the current project status
  under UTF-8 Windows console mode.
- Director first-run testing reproduced and closed three Windows-only startup
  defects: positional project arguments were ignored, dotenv rewrites doubled path
  separators, and AppContainer path virtualization caused a false knowledge-leak
  rejection. The rebuilt executable now launches the real Studio window and both
  packaged services return HTTP 200.

## Running the portable application

Run `Game Agent Network.exe` directly. On first launch, select an existing game
repository; that folder is project data, not the installation destination. A project
can also be supplied explicitly:

```powershell
& ".\Game Agent Network.exe" "C:\path\to\game-repository"
```

## Outputs

- Installer: `dist/desktop/Game-Agent-Network-0.0.1-x64.exe`
- Unpacked application: `dist/desktop/win-unpacked/Game Agent Network.exe`
- Headless daemon: `dist/desktop/headless/gameagent-daemon/gameagent-daemon.exe`
- Live packaged Studio preview: [http://127.0.0.1:5952/](http://127.0.0.1:5952/)

## Known release limits

- Windows x64 is the only packaged target.
- Version remains `0.0.1` pending release naming.
- No trusted-publisher code-signing certificate is configured, so Windows may show
  an unknown-publisher warning.
- Professional Expertise Pack curation and benchmark qualification remain a
  separate Claude-owned workstream; they do not change the desktop authority model.
