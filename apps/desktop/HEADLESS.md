# Headless Game Agent Network

The packaged daemon remains a complete command-line application. On Windows run:

```powershell
.\gameagent-daemon\gameagent-daemon.exe status C:\path\to\project
.\gameagent-daemon\gameagent-daemon.exe serve C:\path\to\project
```

Copy `.env.example` to `.env`, set the local ports, origin, daemon token and project
path, then run commands from the directory containing `.env`. The daemon binds only
to loopback. Studio is optional; project initialization, status, rebuild, task,
reconciliation and serving commands remain available without Electron.
