from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud
from app.auth import create_access_token, get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.user import Token, UserCreate, UserLogin, UserRead
from app.security import verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=Token, status_code=201)
def register(data: UserCreate, db: Session = Depends(get_db)):
    if crud.user.get_user_by_email(db, data.email) is not None:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = crud.user.create_user(db, data)
    token = create_access_token(user.id)
    return Token(access_token=token, user=UserRead.model_validate(user))


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = crud.user.get_user_by_email(db, data.email)
    if user is None or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user.id)
    return Token(access_token=token, user=UserRead.model_validate(user))


@router.get("/me", response_model=UserRead)
def me(current_user: User = Depends(get_current_user)):
    return current_user
