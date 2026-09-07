"""Ordered append-only events, serialized across processes by an OS file lock.

Callers hold the project lock for read/validate/append/project. Damaged canonical
history is never silently repaired. Projection loss is safe; event loss is not.
"""

import hashlib
import json
import os
from pathlib import Path

from pydantic import TypeAdapter, ValidationError

from gameagent.constitution import ConstitutionError, require
from gameagent.models.contracts import Event

EVENT: TypeAdapter[Event] = TypeAdapter(Event)


def canonical(event: Event) -> bytes:
    return (
        json.dumps(
            event.model_dump(mode="json"), sort_keys=True, separators=(",", ":"), ensure_ascii=False
        ).encode("utf-8")
        + b"\n"
    )


def read_history(directory: Path) -> tuple[list[Event], str]:
    files = sorted(directory.glob("events-*.jsonl"))
    result: list[Event] = []
    digest = hashlib.sha256()
    ids: set[str] = set()
    for index, file in enumerate(files, 1):
        require(file.name == f"events-{index:04d}.jsonl", "history_segment_gap", file.name)
        require(not file.is_symlink(), "unsafe_protocol_path", str(file))
        data = file.read_bytes()
        require(bool(data) and data.endswith(b"\n"), "history_truncated", str(file))
        for line_number, line in enumerate(data.splitlines(), 1):
            try:
                item = EVENT.validate_json(line)
            except ValidationError as exc:
                raise ConstitutionError(
                    "history_invalid", f"{file.name}:{line_number}: {exc}"
                ) from exc
            require(item.sequence == len(result) + 1, "history_sequence_invalid", item.event_id)
            require(item.event_id not in ids, "history_duplicate_event", item.event_id)
            ids.add(item.event_id)
            result.append(item)
        digest.update(data)
    return result, digest.hexdigest()


def append(directory: Path, event: Event, max_bytes: int) -> None:
    files = sorted(directory.glob("events-*.jsonl"))
    data = canonical(event)
    last = files[-1] if files else directory / "events-0001.jsonl"
    if files and last.stat().st_size + len(data) > max_bytes:
        last = directory / f"events-{len(files) + 1:04d}.jsonl"
    with last.open("ab") as stream:
        stream.write(data)
        stream.flush()
        os.fsync(stream.fileno())


def write_new(path: Path, data: bytes) -> None:
    with path.open("xb") as stream:
        stream.write(data)
        stream.flush()
        os.fsync(stream.fileno())
