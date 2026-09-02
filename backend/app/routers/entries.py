from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import crud
from app.auth import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.entry import EntryCreate, EntryRead, EntryReadWithContext, EntryUpdate

router = APIRouter(prefix="/entries", tags=["entries"])


@router.get("", response_model=list[EntryReadWithContext])
def list_entries(
    start: date = Query(...),
    end: date = Query(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if start > end:
        raise HTTPException(status_code=400, detail="start must be <= end")
    return crud.entry.get_entries_in_range(db, current_user.id, start, end)


@router.post("", response_model=EntryRead, status_code=201)
def create_entry(
    data: EntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if crud.entry.get_topic_owned(db, data.topic_id, current_user.id) is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    return crud.entry.create_entry(db, data)


@router.patch("/{entry_id}", response_model=EntryRead)
def update_entry(
    entry_id: int,
    data: EntryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = crud.entry.get_entry(db, entry_id, current_user.id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")
    if data.topic_id is not None and crud.entry.get_topic_owned(
        db, data.topic_id, current_user.id
    ) is None:
        raise HTTPException(status_code=404, detail="Topic not found")
    return crud.entry.update_entry(db, entry, data)


@router.delete("/{entry_id}", status_code=204)
def delete_entry(
    entry_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    entry = crud.entry.get_entry(db, entry_id, current_user.id)
    if entry is None:
        raise HTTPException(status_code=404, detail="Entry not found")
    crud.entry.delete_entry(db, entry)
