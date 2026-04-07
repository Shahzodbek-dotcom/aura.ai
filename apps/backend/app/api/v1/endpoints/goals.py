from fastapi import APIRouter, Depends, Response, status
from sqlalchemy.orm import Session

from apps.backend.app.api.deps import get_current_user
from apps.backend.app.db.session import get_db
from apps.backend.app.schemas.goal import GoalContribution, GoalCreate, GoalRead, GoalUpdate
from apps.backend.app.services.goals import (
    contribute_to_goal,
    create_goal,
    delete_goal,
    list_goals,
    update_goal,
)
from database.schema.models import User

router = APIRouter()


@router.post("", response_model=GoalRead, status_code=status.HTTP_201_CREATED)
def create_goal_endpoint(
    payload: GoalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GoalRead:
    goal = create_goal(db, current_user, payload)
    return GoalRead.model_validate(goal)


@router.get("", response_model=list[GoalRead])
def list_goals_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[GoalRead]:
    return [GoalRead.model_validate(goal) for goal in list_goals(db, current_user.id)]


@router.post("/{goal_id}/contribute", response_model=GoalRead)
def contribute_to_goal_endpoint(
    goal_id: int,
    payload: GoalContribution,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GoalRead:
    goal = contribute_to_goal(db, current_user, goal_id, payload)
    return GoalRead.model_validate(goal)


@router.put("/{goal_id}", response_model=GoalRead)
def update_goal_endpoint(
    goal_id: int,
    payload: GoalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> GoalRead:
    goal = update_goal(db, current_user, goal_id, payload)
    return GoalRead.model_validate(goal)


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_goal_endpoint(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    delete_goal(db, current_user, goal_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
