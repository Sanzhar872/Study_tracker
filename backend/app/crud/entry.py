from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.entry import Entry
from app.models.subject import Subject
from app.models.topic import Topic
from app.schemas.entry import EntryCreate, EntryUpdate


def get_entries_in_range(db: Session, user_id: int, start: date, end: date) -> list[Entry]:
    stmt = (
        select(Entry)
        .join(Topic, Entry.topic_id == Topic.id)
        .join(Subject, Topic.subject_id == Subject.id)
        .options(joinedload(Entry.topic).joinedload(Topic.subject))
        .where(Subject.user_id == user_id, Entry.date >= start, Entry.date <= end)
        .order_by(Entry.date)
    )
    return list(db.scalars(stmt))


def get_entry(db: Session, entry_id: int, user_id: int) -> Entry | None:
    stmt = (
        select(Entry)
        .join(Topic, Entry.topic_id == Topic.id)
        .join(Subject, Topic.subject_id == Subject.id)
        .where(Entry.id == entry_id, Subject.user_id == user_id)
    )
    return db.scalar(stmt)


def get_topic_owned(db: Session, topic_id: int, user_id: int) -> Topic | None:
    stmt = (
        select(Topic)
        .join(Subject, Topic.subject_id == Subject.id)
        .where(Topic.id == topic_id, Subject.user_id == user_id)
    )
    return db.scalar(stmt)


def create_entry(db: Session, data: EntryCreate) -> Entry:
    entry = Entry(**data.model_dump())
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def update_entry(db: Session, entry: Entry, data: EntryUpdate) -> Entry:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(entry, field, value)
    db.commit()
    db.refresh(entry)
    return entry


def delete_entry(db: Session, entry: Entry) -> None:
    db.delete(entry)
    db.commit()
