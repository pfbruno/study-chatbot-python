from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException

from app.database import get_hook_recent_events, get_user_by_token
from app.exams.schemas import ExamSubmitRequest
from app.exams.service import (
    get_exam_answer_sheet,
    get_exam_details,
    get_exam_latest_attempt,
    get_user_exam_analytics,
    import_enem_year,
    list_exams,
    submit_exam_sheet,
)
from app.repositories_hook import record_hook_activity_event_repo

router = APIRouter(tags=["exams-v2"])


def _current_user_optional(authorization: str | None) -> dict | None:
    if not authorization or not authorization.lower().startswith("bearer "):
        return None

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        return None

    return get_user_by_token(token)


@router.post("/admin/import/enem/{year}")
def import_enem(year: int) -> dict:
    try:
        return {
            "message": "Importação ENEM concluída.",
            "exam": import_enem_year(year),
        }
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/exams")
def list_exams_endpoint(source: str | None = None) -> dict:
    return {"items": list_exams(source=source)}


@router.get("/exams/{exam_id}")
def get_exam_endpoint(exam_id: int) -> dict:
    try:
        return get_exam_details(exam_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/exams/{exam_id}/structure")
def get_exam_structure_endpoint(exam_id: int) -> dict:
    try:
        exam = get_exam_details(exam_id)
        return {
            "id": exam["id"],
            "source": exam["source"],
            "year": exam["year"],
            "title": exam["title"],
            "days": exam["days"],
            "official_page_url": exam.get("official_page_url"),
        }
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.get("/exams/{exam_id}/answer-sheet")
def get_answer_sheet(exam_id: int) -> dict:
    try:
        return get_exam_answer_sheet(exam_id)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc


@router.post("/exams/{exam_id}/submit")
def submit_exam(
    exam_id: int,
    payload: ExamSubmitRequest,
    authorization: str | None = Header(default=None),
) -> dict:
    try:
        user = _current_user_optional(authorization)

        result = submit_exam_sheet(
            exam_id,
            payload.answers,
            user_id=int(user["id"]) if user else None,
            time_spent_seconds=payload.time_spent_seconds,
        )

        if user:
            record_hook_activity_event_repo(
                user_id=int(user["id"]),
                event_type="exam_completed",
                subject=(result.get("subject_breakdown") or [{}])[0].get("subject"),
                score_percentage=float(result["score_percentage"]),
                time_spent_seconds=payload.time_spent_seconds,
                metadata={
                    "questions_answered": int(result["total_questions"]),
                    "minutes_studied": int((payload.time_spent_seconds or 0) / 60),
                    "exam_id": exam_id,
                    "wrong_questions_count": len(result.get("wrong_questions") or []),
                },
            )

        return result

    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@router.get("/exams/{exam_id}/attempts/latest")
def latest_exam_attempt(
    exam_id: int,
    authorization: str | None = Header(default=None),
) -> dict:
    user = _current_user_optional(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Autenticação obrigatória.")

    attempt = get_exam_latest_attempt(exam_id=exam_id, user_id=int(user["id"]))
    return {"item": attempt}


@router.get("/exams/analytics/overview")
def exams_analytics_overview(
    authorization: str | None = Header(default=None),
) -> dict:
    user = _current_user_optional(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Autenticação obrigatória.")

    analytics = get_user_exam_analytics(int(user["id"]))
    is_pro = str(user.get("plan", "")).lower() == "pro" and str(
        user.get("subscription_status", "")
    ).lower() in {"active", "trialing", "past_due"}

    events = get_hook_recent_events(int(user["id"]), days=30)

    exam_scores = [
        float(event["score_percentage"])
        for event in events
        if event["event_type"] == "exam_completed"
        and event["score_percentage"] is not None
    ]
    sim_scores = [
        float(event["score_percentage"])
        for event in events
        if event["event_type"] == "simulation_completed"
        and event["score_percentage"] is not None
    ]

    comparison = {
        "exam_average_score": round(sum(exam_scores) / len(exam_scores), 2)
        if exam_scores
        else 0.0,
        "simulation_average_score": round(sum(sim_scores) / len(sim_scores), 2)
        if sim_scores
        else 0.0,
    }

    if not is_pro:
        return {
            "premium_locked": True,
            "premium_message": "Disponível no Pro: analytics detalhado de provas.",
            "attempts_count": analytics["attempts_count"],
            "average_score": analytics["average_score"],
            "comparison": comparison,
        }

    return {
        "premium_locked": False,
        **analytics,
        "comparison": comparison,
    }