from datetime import date as date_type, datetime

from pydantic import BaseModel, ConfigDict, field_validator

from app.schemas.subject import SubjectRead
from app.schemas.topic import TopicRead


class EntryBase(BaseModel):
    topic_id: int
    date: date_type
    hours: float
    description: str | None = None

    @field_validator("hours")
    @classmethod
    def hours_in_range(cls, v: float) -> float:
        if not (0 < v <= 24):
            raise ValueError("hours must be > 0 and <= 24")
        return v

    @field_validator("description")
    @classmethod
    def description_normalize(cls, v: str | None) -> str | None:
        if v is None:
            return None
        v = v.strip()
        return v or None


class EntryCreate(EntryBase):
    pass


class EntryUpdate(BaseModel):
    topic_id: int | None = None
    date: date_type | None = None
    hours: float | None = None
    description: str | None = None

    @field_validator("hours")
    @classmethod
    def hours_in_range(cls, v: float | None) -> float | None:
        if v is not None and not (0 < v <= 24):
            raise ValueError("hours must be > 0 and <= 24")
        return v

    @field_validator("description")
    @classmethod
    def description_normalize(cls, v: str | None) -> str | None:
        if v is None:
            return None
        v = v.strip()
        return v or None


class EntryRead(EntryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime


class TopicWithSubject(TopicRead):
    subject: SubjectRead


class EntryReadWithContext(EntryRead):
    topic: TopicWithSubject
