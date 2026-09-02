"""add mastery percentage to topics

Revision ID: 0004
Revises: 0003
Create Date: 2026-09-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0004"
down_revision: Union[str, None] = "0003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "topics",
        sa.Column("mastery", sa.Integer(), nullable=False, server_default="0"),
    )
    op.create_check_constraint(
        "ck_topic_mastery_range", "topics", "mastery >= 0 AND mastery <= 100"
    )


def downgrade() -> None:
    op.drop_constraint("ck_topic_mastery_range", "topics", type_="check")
    op.drop_column("topics", "mastery")
