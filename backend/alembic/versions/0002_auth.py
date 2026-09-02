"""add users and scope subjects by owner

Revision ID: 0002
Revises: 0001
Create Date: 2026-09-02

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )

    # existing subjects/topics/entries have no owner - clear them out
    op.execute("TRUNCATE TABLE entries, topics, subjects RESTART IDENTITY CASCADE")

    op.drop_constraint("uq_subjects_name", "subjects", type_="unique")
    op.add_column("subjects", sa.Column("user_id", sa.Integer(), nullable=False))
    op.create_foreign_key(
        "fk_subjects_user_id", "subjects", "users", ["user_id"], ["id"], ondelete="CASCADE"
    )
    op.create_index("ix_subjects_user_id", "subjects", ["user_id"])
    op.create_unique_constraint(
        "uq_subjects_user_name", "subjects", ["user_id", "name"]
    )


def downgrade() -> None:
    op.drop_constraint("uq_subjects_user_name", "subjects", type_="unique")
    op.drop_index("ix_subjects_user_id", table_name="subjects")
    op.drop_constraint("fk_subjects_user_id", "subjects", type_="foreignkey")
    op.drop_column("subjects", "user_id")
    op.create_unique_constraint("uq_subjects_name", "subjects", ["name"])

    op.drop_table("users")
