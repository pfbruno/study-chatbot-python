from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.exams.schemas import ExamSubmitRequest
from app.exams.service import (
    get_exam_answer_sheet,
    get_exam_details,
    import_enem_year,
    list_exams,
    submit_exam_sheet,
)

router = APIRouter(tags=["exams-v2"])


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
def submit_exam(exam_id: int, payload: ExamSubmitRequest) -> dict:
    try:
        return submit_exam_sheet(exam_id, payload.answers)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
