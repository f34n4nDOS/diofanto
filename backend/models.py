from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, JSON, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import enum

class RoleEnum(str, enum.Enum):
    student = "student"
    teacher = "teacher"

class DifficultyEnum(str, enum.Enum):
    easy = "easy"
    medium = "medium"
    hard = "hard"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    email = Column(String(160), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.student, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    attempts = relationship("ExerciseAttempt", back_populates="user")
    favorites = relationship("Favorite", back_populates="user")


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    area = Column(String(60), nullable=False)
    topic = Column(String(100), nullable=False)
    level = Column(String(40), nullable=False)
    difficulty = Column(Enum(DifficultyEnum), nullable=False)
    statement = Column(Text, nullable=False)
    exercise_type = Column(String(40), nullable=False)
    answer_data = Column(JSON, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    attempts = relationship("ExerciseAttempt", back_populates="exercise")
    favorited_by = relationship("Favorite", back_populates="exercise")


class ExerciseAttempt(Base):
    __tablename__ = "exercise_attempts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    submitted_answer = Column(JSON, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    attempt_number = Column(Integer, nullable=False)
    time_spent_seconds = Column(Integer, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="attempts")
    exercise = relationship("Exercise", back_populates="attempts")


class Favorite(Base):
    __tablename__ = "favorites"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="favorites")
    exercise = relationship("Exercise", back_populates="favorited_by")