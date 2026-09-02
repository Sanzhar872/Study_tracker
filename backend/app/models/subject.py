from sqlalchemy import ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Subject(Base):
    __tablename__ = "subjects"
    __table_args__ = (UniqueConstraint("user_id", "name", name="uq_subjects_user_name"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    color: Mapped[str] = mapped_column(String(7), nullable=False)

    user: Mapped["User"] = relationship(back_populates="subjects")
    topics: Mapped[list["Topic"]] = relationship(
        back_populates="subject", cascade="all, delete-orphan"
    )
