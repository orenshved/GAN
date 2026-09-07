"""Headless project protocol entry point."""

import argparse
import json
import os
import sys
from pathlib import Path

import uvicorn
import yaml
from dotenv import load_dotenv

from gameagent.constitution import ConstitutionError
from gameagent.intake import inspect
from gameagent.models.api import TaskProposal
from gameagent.models.contracts import Project
from gameagent.projects import ProjectStore, initialize


def main() -> None:
    load_dotenv()
    parser = argparse.ArgumentParser(prog="gameagent")
    commands = parser.add_subparsers(dest="command", required=True)
    init = commands.add_parser("init", help="Inspect and initialize an existing game repository")
    init.add_argument("path", nargs="?", default=Path("."), type=Path)
    init.add_argument(
        "--profile", type=Path, help="Optional Project YAML/JSON override matching the protocol"
    )
    for name in ("status", "rebuild", "propose", "serve"):
        sub = commands.add_parser(name)
        sub.add_argument("path", type=Path)
        if name == "propose":
            sub.add_argument("--file", required=True, type=Path)
    args = parser.parse_args()
    try:
        if args.command == "init":
            detected, report = inspect(args.path)
            profile = (
                Project.model_validate(yaml.safe_load(args.profile.read_text(encoding="utf-8")))
                if args.profile
                else detected
            )
            location = initialize(Path(report.repository_root), profile, report)
            print(
                json.dumps(
                    {
                        "initialized": str(location),
                        "project_id": profile.project.id,
                        "missing": [
                            item.field for item in report.findings if item.kind == "missing"
                        ],
                        "next": f"gameagent serve {report.repository_root}",
                    }
                )
            )
            return
        store = ProjectStore(args.path)
        if args.command == "serve":
            from gameagent.api import create_app

            token = os.environ["GAMEAGENT_DAEMON_TOKEN"]
            origin = os.environ["GAMEAGENT_STUDIO_ORIGIN"]
            port = int(os.environ["GAMEAGENT_DAEMON_PORT"])
            registry_setting = os.environ.get("GAMEAGENT_REGISTRY_PATH")
            registry_path = (
                Path(registry_setting)
                if registry_setting
                else Path.home() / ".gameagent" / "projects.json"
            )
            if not 1 <= port <= 65535:
                raise ValueError("Invalid GAMEAGENT_DAEMON_PORT")
            store.snapshot()  # Validate/recover before exposing a ready service.
            uvicorn.run(
                create_app(store, token, origin, registry_path),
                host="127.0.0.1",
                port=port,
                access_log=False,
            )
        elif args.command == "propose":
            proposal = TaskProposal.model_validate_json(args.file.read_text(encoding="utf-8"))
            print(store.propose(proposal).model_dump_json(indent=2))
        elif args.command == "rebuild":
            print(store.rebuild().model_dump_json(indent=2))
        else:
            print(store.snapshot().model_dump_json(indent=2))
    except (ConstitutionError, ValueError, OSError, KeyError) as exc:
        label = exc.error if isinstance(exc, ConstitutionError) else "command_failed"
        print(json.dumps({"error": label, "detail": str(exc)}), file=sys.stderr)
        raise SystemExit(1) from exc


if __name__ == "__main__":
    main()
