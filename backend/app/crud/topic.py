from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.subject import Subject
from app.models.topic import Topic
from app.schemas.topic import TopicCreate, TopicUpdate


def get_topics(db: Session, user_id: int, subject_id: int | None = None) -> list[Topic]:
    stmt = select(Topic).join(Subject).where(Subject.user_id == user_id).order_by(Topic.name)
    if subject_id is not None:
        stmt = stmt.where(Topic.subject_id == subject_id)
    return list(db.scalars(stmt))


def get_topic(db: Session, topic_id: int, user_id: int) -> Topic | None:
    stmt = (
        select(Topic)
        .join(Subject)
        .where(Topic.id == topic_id, Subject.user_id == user_id)
    )
    return db.scalar(stmt)


def get_subject_owned(db: Session, subject_id: int, user_id: int) -> Subject | None:
    stmt = select(Subject).where(Subject.id == subject_id, Subject.user_id == user_id)
    return db.scalar(stmt)


def create_topic(db: Session, data: TopicCreate) -> Topic:
    topic = Topic(**data.model_dump())
    db.add(topic)
    db.commit()
    db.refresh(topic)
    return topic


def update_topic(db: Session, topic: Topic, data: TopicUpdate) -> Topic:
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(topic, field, value)
    db.commit()
    db.refresh(topic)
    return topic


def delete_topic(db: Session, topic: Topic) -> None:
    db.delete(topic)
    db.commit()
