from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from dependencies import get_current_user
from exercise_utils import check_answer
import models
import schemas

router = APIRouter(prefix="/api/exercises", tags=["exercises"])


@router.get("", response_model=schemas.ExerciseListResponse)
def list_exercises(
    area: str | None = None,
    topic: str | None = None,
    level: str | None = None,
    difficulty: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(models.Exercise)
    if area:
        query = query.filter(models.Exercise.area == area)
    if topic:
        query = query.filter(models.Exercise.topic == topic)
    if level:
        query = query.filter(models.Exercise.level == level)
    if difficulty:
        query = query.filter(models.Exercise.difficulty == difficulty)

    total = query.count()
    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return schemas.ExerciseListResponse(total=total, items=items)


@router.get("/favorites", response_model=list[schemas.ExerciseOut])
def list_favorites(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    favorites = (
        db.query(models.Exercise)
        .join(models.Favorite, models.Favorite.exercise_id == models.Exercise.id)
        .filter(models.Favorite.user_id == user.id)
        .all()
    )
    return favorites


@router.get("/{exercise_id}", response_model=schemas.ExerciseOut)
def get_exercise(exercise_id: int, db: Session = Depends(get_db)):
    exercise = db.query(models.Exercise).filter(models.Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Ejercicio no encontrado")
    return exercise


@router.post("/{exercise_id}/submit", response_model=schemas.ExerciseSubmitResponse)
def submit_answer(
    exercise_id: int,
    submission: schemas.ExerciseSubmit,
    db: Session = Depends(get_db),
    user: models.User = Depends(get_current_user),
):
    exercise = db.query(models.Exercise).filter(models.Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Ejercicio no encontrado")

    is_correct = check_answer(exercise.exercise_type, submission.answer, exercise.answer_data)

    previous_attempts = (
        db.query(func.count(models.ExerciseAttempt.id))
        .filter(
            models.ExerciseAttempt.user_id == user.id,
            models.ExerciseAttempt.exercise_id == exercise_id,
        )
        .scalar()
    )
    attempt_number = previous_attempts + 1

    attempt = models.ExerciseAttempt(
        user_id=user.id,
        exercise_id=exercise_id,
        submitted_answer=submission.answer,
        is_correct=is_correct,
        attempt_number=attempt_number,
    )
    db.add(attempt)
    db.commit()

    return schemas.ExerciseSubmitResponse(
        is_correct=is_correct,
        correct_answer=None if is_correct else exercise.answer_data.get("value"),
        explanation=exercise.answer_data.get("explanation"),
        attempt_number=attempt_number,
    )


@router.post("/{exercise_id}/favorite", status_code=201)
def add_favorite(exercise_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    exercise = db.query(models.Exercise).filter(models.Exercise.id == exercise_id).first()
    if not exercise:
        raise HTTPException(status_code=404, detail="Ejercicio no encontrado")

    existing = (
        db.query(models.Favorite)
        .filter(models.Favorite.user_id == user.id, models.Favorite.exercise_id == exercise_id)
        .first()
    )
    if existing:
        return {"detail": "Ya estaba en favoritos"}

    db.add(models.Favorite(user_id=user.id, exercise_id=exercise_id))
    db.commit()
    return {"detail": "Agregado a favoritos"}


@router.delete("/{exercise_id}/favorite", status_code=204)
def remove_favorite(exercise_id: int, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    fav = (
        db.query(models.Favorite)
        .filter(models.Favorite.user_id == user.id, models.Favorite.exercise_id == exercise_id)
        .first()
    )
    if fav:
        db.delete(fav)
        db.commit()
    return None