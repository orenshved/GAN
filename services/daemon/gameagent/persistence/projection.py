"""SQLAlchemy is contained here. Public results are domain objects."""

from pathlib import Path
from sqlite3 import Connection
from threading import Lock

from alembic import command
from alembic.config import Config
from sqlalchemy import create_engine, event, text
from sqlalchemy.engine import URL
from sqlalchemy.pool import NullPool

from gameagent.models.api import ProjectSnapshot
from gameagent.models.contracts import Event

_ALEMBIC_LOCK = Lock()


class Projection:
    def __init__(self, path: Path) -> None:
        self.engine = create_engine(URL.create("sqlite", database=str(path)), poolclass=NullPool)

        @event.listens_for(self.engine, "connect")
        def configure(dbapi_connection: Connection, _: object) -> None:
            # SQLAlchemy's DBAPI connection is deliberately runtime-generic.
            cursor = dbapi_connection.cursor()
            cursor.execute("PRAGMA journal_mode=WAL")
            cursor.execute("PRAGMA synchronous=FULL")
            cursor.execute("PRAGMA busy_timeout=5000")
            cursor.close()

        # Alembic's EnvironmentContext proxy is process-global and not thread-safe.
        # Studio may read multiple project projections while the watcher is active.
        with _ALEMBIC_LOCK:
            cfg = Config()
            cfg.set_main_option("script_location", str(Path(__file__).parent / "migrations"))
            with self.engine.begin() as connection:
                cfg.attributes["connection"] = connection
                command.upgrade(cfg, "head")

    def replace(self, snapshot: ProjectSnapshot, events: list[Event]) -> None:
        with self.engine.begin() as connection:
            for table in ("events", "tasks", "metadata"):
                connection.execute(text(f"DELETE FROM {table}"))
            connection.execute(
                text("INSERT INTO metadata (key, value) VALUES (:key, :value)"),
                {"key": "snapshot", "value": snapshot.model_dump_json()},
            )
            if snapshot.tasks:
                connection.execute(
                    text("INSERT INTO tasks VALUES (:id, :document)"),
                    [
                        {"id": task.task_id, "document": task.model_dump_json()}
                        for task in snapshot.tasks
                    ],
                )
            if events:
                connection.execute(
                    text("INSERT INTO events VALUES (:seq, :id, :document)"),
                    [
                        {
                            "seq": item.sequence,
                            "id": item.event_id,
                            "document": item.model_dump_json(),
                        }
                        for item in events
                    ],
                )

    def snapshot(self) -> ProjectSnapshot | None:
        with self.engine.connect() as connection:
            value = connection.execute(text("SELECT value FROM metadata WHERE key='snapshot'"))
            document = value.scalar_one_or_none()
            return ProjectSnapshot.model_validate_json(document) if document else None

    def close(self) -> None:
        self.engine.dispose()
