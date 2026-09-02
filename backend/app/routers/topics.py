from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import crud
from app.auth import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.topic import TopicCreate, TopicRead, TopicUpdate

router = APIRouter(prefix="/topics", tags=["topics"])


@router.get("", response_model=list[TopicRead])
def list_topics(
    subject_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return crud.topic.get_topics(db, current_user.id, subject_id=subject_id)


@router.post("", response_model=TopicRead, status_code=201)
def create_topic(
    data: TopicCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if crud.topic.get_subject_owned(db, data.subject_id, current_user.id) is None:
        raise HTTPException(status_code=404, detail="Subject not found")
    return crud.topic.create_topic(db, data)


@router.patch("/{topic_id}", response_model=TopicRead)
def update_topic(
    topic_id: int,
    data: TopicUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    topic = crud.topic.get_topic(db, topic_id, current_user.id)
    if topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    if data.subject_id is not None and crud.topic.get_subject_owned(
        db, data.subject_id, current_user.id
    ) is None:
        raise HTTPException(status_code=404, detail="Subject not found")
    return crud.topic.update_topic(db, topic, data)


@router.delete("/{topic_id}", status_code=204)
def delete_topic(
    topic_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    topic = crud.topic.get_topic(db, topic_id, current_user.id)
    if topic is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    crud.topic.delete_topic(db, topic)
