from datetime import date as date_type, datetime

from sqlalchemy import CheckConstraint, Date, DateTime, ForeignKey, Float, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Entry(Base):
    __tablename__ = "entries"
    __table_args__ = (
        CheckConstraint("hours > 0 AND hours <= 24", name="ck_entry_hours_range"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    topic_id: Mapped[int] = mapped_column(
        ForeignKey("topics.id", ondelete="CASCADE"), nullable=False
    )
    date: Mapped[date_type] = mapped_column(Date, nullable=False)
    hours: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    topic: Mapped["Topic"] = relationship(back_populates="entries")
