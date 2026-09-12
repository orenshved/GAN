"""Headless project protocol entry point."""

import argparse
import json
import os
import sys
from pathlib import Path
from uuid import uuid4

import uvicorn
import yaml
from dotenv import load_dotenv
from pydantic import BaseModel

from gameagent.constitution import ConstitutionError
from gameagent.intake import inspect
from gameagent.models.api import (
    ReconcileCommand,
    TaskProgressCommand,
    TaskProposal,
    TaskStartCommand,
)
from gameagent.models.contracts import Project
from gameagent.projects import ProjectStore, initialize


def _json_output(value: object) -> str:
    """Return console-safe JSON even when a frozen Windows process inherits an ANSI code page."""
    return json.dumps(value, indent=2, ensure_ascii=True)


def _print_model(value: BaseModel) -> None:
    print(_json_output(value.model_dump(mode="json")))


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
    task = commands.add_parser("task", help="Register and report meaningful project work")
    task_commands = task.add_subparsers(dest="task_command", required=True)
    task_start = task_commands.add_parser("start")
    task_start.add_argument("path", type=Path)
    task_start.add_argument("--task-id")
    task_start.add_argument("--title")
    task_start.add_argument("--objective")
    task_start.add_argument("--capability", action="append", default=[])
    task_start.add_argument("--deliverable", action="append", default=[])
    task_status = task_commands.add_parser("status")
    task_status.add_argument("path", type=Path)
    task_status.add_argument("--task-id")
    for name in ("block", "complete"):
        sub = task_commands.add_parser(name)
        sub.add_argument("path", type=Path)
        sub.add_argument("--task-id", required=True)
        sub.add_argument("--detail", required=True)
    reconcile = commands.add_parser("reconcile", help="Attribute unregistered project changes")
    reconcile.add_argument("path", type=Path)
    reconcile.add_argument("--change-id")
    reconcile.add_argument("--task-id")
    reconcile.add_argument("--detail", required=True)
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
        if args.command == "task":
            if args.task_command == "start":
                started = store.start_task(
                    TaskStartCommand(
                        request_id=f"request-{uuid4()}",
                        task_id=args.task_id,
                        title=args.title,
                        objective=args.objective,
                        required_capabilities=args.capability or ["project_analysis"],
                        deliverables=args.deliverable or ["Reported project changes"],
                    )
                )
                _print_model(started)
            elif args.task_command == "status":
                snapshot = store.snapshot()
                if args.task_id:
                    selected_task = next(
                        (item for item in snapshot.tasks if item.task_id == args.task_id), None
                    )
                    if selected_task is None:
                        raise ConstitutionError("task_not_found", args.task_id)
                    _print_model(selected_task)
                else:
                    print(
                        json.dumps(
                            {
                                "tasks": [item.model_dump(mode="json") for item in snapshot.tasks],
                                "requires_reconciliation": snapshot.requires_reconciliation,
                                "reconciliations": [
                                    item.model_dump(mode="json")
                                    for item in snapshot.reconciliations
                                ],
                            },
                            indent=2,
                        )
                    )
            else:
                command = TaskProgressCommand(
                    request_id=f"request-{uuid4()}",
                    task_id=args.task_id,
                    detail=args.detail,
                )
                progressed = (
                    store.block_task(command)
                    if args.task_command == "block"
                    else store.complete_task(command)
                )
                _print_model(progressed)
        elif args.command == "reconcile":
            snapshot = store.detect_external_changes()
            unresolved = [item for item in snapshot.reconciliations if item.state == "unresolved"]
            change_id = args.change_id
            if change_id is None:
                if len(unresolved) != 1:
                    raise ConstitutionError(
                        "change_id_required",
                        "Specify --change-id unless exactly one change is unresolved",
                    )
                change_id = unresolved[0].change_id
            reconciled = store.reconcile(
                ReconcileCommand(
                    request_id=f"request-{uuid4()}",
                    change_id=change_id,
                    task_id=args.task_id,
                    detail=args.detail,
                )
            )
            _print_model(reconciled)
        elif args.command == "serve":
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
            _print_model(store.propose(proposal))
        elif args.command == "rebuild":
            _print_model(store.rebuild())
        else:
            _print_model(store.snapshot())
    except (ConstitutionError, ValueError, OSError, KeyError) as exc:
        label = exc.error if isinstance(exc, ConstitutionError) else "command_failed"
        print(json.dumps({"error": label, "detail": str(exc)}), file=sys.stderr)
        raise SystemExit(1) from exc


if __name__ == "__main__":
    main()
