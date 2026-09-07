"""Initial disposable project projection."""

import sqlalchemy as sa
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "metadata",
        sa.Column("key", sa.String(), primary_key=True),
        sa.Column("value", sa.Text(), nullable=False),
    )
    op.create_table(
        "tasks",
        sa.Column("task_id", sa.String(), primary_key=True),
        sa.Column("document", sa.Text(), nullable=False),
    )
    op.create_table(
        "events",
        sa.Column("sequence", sa.Integer(), primary_key=True),
        sa.Column("event_id", sa.String(), unique=True, nullable=False),
        sa.Column("document", sa.Text(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("events")
    op.drop_table("tasks")
    op.drop_table("metadata")
