from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException

from app.database import get_user_by_token
from app.recommendations.service import (
    build_advanced_next_action,
    build_daily_missions,
    build_guided_review,
    build_recommendation_insights,
    build_smart_weekly_summary,
)

router = APIRouter(prefix="/v2/recommendations", tags=["recommendations-v2"])


def _get_current_user_or_401(authorization: str | None) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Token ausente.")
    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Token ausente.")
    user = get_user_by_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Token inválido ou expirado.")
    return user


@router.get("/next-action")
def get_next_action(authorization: str | None = Header(default=None)) -> dict:
    user = _get_current_user_or_401(authorization)
    return build_advanced_next_action(user)


@router.get("/guided-review")
def get_guided_review(authorization: str | None = Header(default=None)) -> dict:
    user = _get_current_user_or_401(authorization)
    return build_guided_review(user)


@router.get("/daily-missions")
def get_daily_missions(authorization: str | None = Header(default=None)) -> dict:
    user = _get_current_user_or_401(authorization)
    return build_daily_missions(user)


@router.get("/insights")
def get_insights(authorization: str | None = Header(default=None)) -> dict:
    user = _get_current_user_or_401(authorization)
    return build_recommendation_insights(user)


@router.get("/weekly-summary")
def get_weekly_summary(authorization: str | None = Header(default=None)) -> dict:
    user = _get_current_user_or_401(authorization)
    return build_smart_weekly_summary(user)
