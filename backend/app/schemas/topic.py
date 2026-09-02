from pydantic import BaseModel, ConfigDict, field_validator


class TopicBase(BaseModel):
    subject_id: int
    name: str
    mastery: int = 0

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("name must not be blank")
        return v

    @field_validator("mastery")
    @classmethod
    def mastery_in_range(cls, v: int) -> int:
        if not (0 <= v <= 100):
            raise ValueError("mastery must be between 0 and 100")
        return v


class TopicCreate(TopicBase):
    pass


class TopicUpdate(BaseModel):
    subject_id: int | None = None
    name: str | None = None
    mastery: int | None = None

    @field_validator("name")
    @classmethod
    def name_not_blank(cls, v: str | None) -> str | None:
        if v is not None:
            v = v.strip()
            if not v:
                raise ValueError("name must not be blank")
        return v

    @field_validator("mastery")
    @classmethod
    def mastery_in_range(cls, v: int | None) -> int | None:
        if v is not None and not (0 <= v <= 100):
            raise ValueError("mastery must be between 0 and 100")
        return v


class TopicRead(TopicBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
