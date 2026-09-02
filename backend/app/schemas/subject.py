import re

from pydantic import BaseModel, ConfigDict, field_validator

HEX_COLOR_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")


class SubjectBase(BaseModel):
    name: str
    color: str

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("name must not be blank")
        return v

    @field_validator("color")
    @classmethod
    def color_is_hex(cls, v: str) -> str:
        if not HEX_COLOR_RE.match(v):
            raise ValueError("color must be a hex string like #4F46E5")
        return v


class SubjectCreate(SubjectBase):
    pass


class SubjectUpdate(BaseModel):
    name: str | None = None
    color: str | None = None

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("name must not be blank")
        return v

    @field_validator("color")
    @classmethod
    def color_is_hex(cls, v: str | None) -> str | None:
        if v is not None and not HEX_COLOR_RE.match(v):
            raise ValueError("color must be a hex string like #4F46E5")
        return v


class SubjectRead(SubjectBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
