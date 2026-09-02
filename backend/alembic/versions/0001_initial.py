"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-09-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "subjects",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("color", sa.String(length=7), nullable=False),
        sa.UniqueConstraint("name", name="uq_subjects_name"),
    )

    op.create_table(
        "topics",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("subject_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=200), nullable=False),
        sa.ForeignKeyConstraint(
            ["subject_id"], ["subjects.id"], ondelete="CASCADE"
        ),
    )
    op.create_index("ix_topics_subject_id", "topics", ["subject_id"])

    op.create_table(
        "entries",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("topic_id", sa.Integer(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("hours", sa.Float(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["topic_id"], ["topics.id"], ondelete="CASCADE"),
        sa.CheckConstraint("hours > 0 AND hours <= 24", name="ck_entry_hours_range"),
    )
    op.create_index("ix_entries_topic_id", "entries", ["topic_id"])
    op.create_index("ix_entries_date", "entries", ["date"])


def downgrade() -> None:
    op.drop_index("ix_entries_date", table_name="entries")
    op.drop_index("ix_entries_topic_id", table_name="entries")
    op.drop_table("entries")

    op.drop_index("ix_topics_subject_id", table_name="topics")
    op.drop_table("topics")

    op.drop_table("subjects")
