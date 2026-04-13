from pydantic import BaseModel, Field


class ExamBookletSchema(BaseModel):
    color: str
    pdf_url: str | None = None
    answer_key_url: str | None = None
    official_page_url: str | None = None


class ExamDaySchema(BaseModel):
    label: str
    order: int = Field(..., ge=1)
    booklets: list[ExamBookletSchema]


class ExamImportPayload(BaseModel):
    source: str
    year: int
    title: str
    total_questions: int
    has_answer_key: bool
    official_page_url: str | None = None
    days: list[ExamDaySchema]
    answer_key: list[str | None] | None = None


class ExamAnswerSheetResponse(BaseModel):
    exam_id: int
    total_questions: int
    options: list[str]


class ExamSubmitRequest(BaseModel):
    answers: list[str | None]
