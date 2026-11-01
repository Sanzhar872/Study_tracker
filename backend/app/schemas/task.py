from datetime import date as date_type, datetime

from pydantic import BaseModel, ConfigDict, field_validator


def _clean_text(v: str) -> str:
    v = v.strip()
    if not v:
        raise ValueError("text must not be blank")
    return v


class TaskCreate(BaseModel):
    date: date_type
    text: str

    @field_validator("text")
    @classmethod
    def text_not_blank(cls, v: str) -> str:
        return _clean_text(v)


class TaskUpdate(BaseModel):
    date: date_type | None = None
    text: str | None = None
    done: bool | None = None

    @field_validator("text")
    @classmethod
    def text_not_blank(cls, v: str | None) -> str | None:
        return None if v is None else _clean_text(v)


class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    date: date_type
    text: str
    done: bool
    created_at: datetime
