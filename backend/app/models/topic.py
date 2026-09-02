from sqlalchemy import CheckConstraint, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Topic(Base):
    __tablename__ = "topics"
    __table_args__ = (
        CheckConstraint("mastery >= 0 AND mastery <= 100", name="ck_topic_mastery_range"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    subject_id: Mapped[int] = mapped_column(
        ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False
    )
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    mastery: Mapped[int] = mapped_column(Integer, nullable=False, server_default="0")

    subject: Mapped["Subject"] = relationship(back_populates="topics")
    entries: Mapped[list["Entry"]] = relationship(
        back_populates="topic", cascade="all, delete-orphan"
    )
