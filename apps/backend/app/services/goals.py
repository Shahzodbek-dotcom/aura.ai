from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from apps.backend.app.schemas.goal import GoalContribution, GoalCreate, GoalUpdate
from database.schema.models import Goal, User


def create_goal(db: Session, user: User, payload: GoalCreate) -> Goal:
    goal = Goal(
        user_id=user.id,
        title=payload.title.strip(),
        description=payload.description,
        target_amount=payload.target_amount,
        current_amount=payload.current_amount,
        deadline=payload.deadline,
    )
    db.add(goal)
    db.commit()
    db.refresh(goal)
    return goal


def list_goals(db: Session, user_id: int) -> list[Goal]:
    stmt = select(Goal).where(Goal.user_id == user_id).order_by(Goal.created_at.desc())
    return list(db.scalars(stmt))


def get_goal_for_user(db: Session, user_id: int, goal_id: int) -> Goal:
    goal = db.scalar(select(Goal).where(Goal.id == goal_id, Goal.user_id == user_id))
    if goal is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal topilmadi")
    return goal


def contribute_to_goal(db: Session, user: User, goal_id: int, payload: GoalContribution) -> Goal:
    goal = get_goal_for_user(db, user.id, goal_id)
    goal.current_amount = goal.current_amount + payload.amount
    db.commit()
    db.refresh(goal)
    return goal


def update_goal(db: Session, user: User, goal_id: int, payload: GoalUpdate) -> Goal:
    goal = get_goal_for_user(db, user.id, goal_id)
    goal.title = payload.title.strip()
    goal.description = payload.description
    goal.target_amount = payload.target_amount
    goal.current_amount = payload.current_amount
    goal.deadline = payload.deadline
    db.commit()
    db.refresh(goal)
    return goal


def delete_goal(db: Session, user: User, goal_id: int) -> None:
    goal = get_goal_for_user(db, user.id, goal_id)
    db.delete(goal)
    db.commit()
