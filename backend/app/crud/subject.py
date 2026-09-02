from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.subject import Subject
from app.schemas.subject import SubjectCreate, SubjectUpdate


def get_subjects(db: Session, user_id: int) -> list[Subject]:
    stmt = select(Subject).where(Subject.user_id == user_id).order_by(Subject.name)
    return list(db.scalars(stmt))


def get_subject(db: Session, subject_id: int, user_id: int) -> Subject | None:
    stmt = select(Subject).where(Subject.id == subject_id, Subject.user_id == user_id)
    return db.scalar(stmt)


def create_subject(db: Session, data: SubjectCreate, user_id: int) -> Subject:
    subject = Subject(**data.model_dump(), user_id=user_id)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    return subject


def update_subject(db: Session, subject: Subject, data: SubjectUpdate) -> Subject:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(subject, field, value)
    db.commit()
    db.refresh(subject)
    return subject


def delete_subject(db: Session, subject: Subject) -> None:
    db.delete(subject)
    db.commit()
