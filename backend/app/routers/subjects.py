from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app import crud
from app.auth import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.subject import SubjectCreate, SubjectRead, SubjectUpdate

router = APIRouter(prefix="/subjects", tags=["subjects"])


@router.get("", response_model=list[SubjectRead])
def list_subjects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return crud.subject.get_subjects(db, current_user.id)


@router.post("", response_model=SubjectRead, status_code=201)
def create_subject(
    data: SubjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return crud.subject.create_subject(db, data, current_user.id)


@router.patch("/{subject_id}", response_model=SubjectRead)
def update_subject(
    subject_id: int,
    data: SubjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = crud.subject.get_subject(db, subject_id, current_user.id)
    if subject is None:
        raise HTTPException(status_code=404, detail="Subject not found")
    return crud.subject.update_subject(db, subject, data)


@router.delete("/{subject_id}", status_code=204)
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    subject = crud.subject.get_subject(db, subject_id, current_user.id)
    if subject is None:
        raise HTTPException(status_code=404, detail="Subject not found")
    crud.subject.delete_subject(db, subject)
