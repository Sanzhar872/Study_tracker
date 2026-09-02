import re

from pydantic import BaseModel, ConfigDict, field_validator

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class UserCreate(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def email_valid(cls, v: str) -> str:
        v = v.strip().lower()
        if not EMAIL_RE.match(v):
            raise ValueError("invalid email")
        return v

    @field_validator("password")
    @classmethod
    def password_min_length(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("password must be at least 6 characters")
        return v


class UserLogin(BaseModel):
    email: str
    password: str

    @field_validator("email")
    @classmethod
    def email_normalize(cls, v: str) -> str:
        return v.strip().lower()


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
