from __future__ import annotations

import json
from collections import defaultdict
from datetime import UTC, datetime, timedelta
from typing import Any

from app.database import (
    get_hook_daily_goal,
    get_hook_recent_events,
    get_hook_streak_stats,
    get_simulation_analytics_v2,
    list_simulations_v2,
)
from app.exams.service import get_recent_exam_attempts, get_user_exam_analytics


def is_pro_user(user: dict) -> bool:
    return str(user.get("plan", "")).lower() == "pro" and str(user.get("subscription_status", "")).lower() in {
        "active",
        "trialing",
        "past_due",
    }


def _avg(values: list[float]) -> float:
    return sum(values) / len(values) if values else 0.0


def _event_metadata(event: dict) -> dict[str, Any]:
    try:
        return json.loads(event.get("metadata_json") or "{}")
    except json.JSONDecodeError:
        return {}


def build_recommendation_insights(user: dict) -> dict:
    user_id = int(user["id"])
    events = get_hook_recent_events(user_id, days=30)
    exam_scores = [float(item["score_percentage"]) for item in events if item["event_type"] == "exam_completed" and item["score_percentage"] is not None]
    sim_scores = [float(item["score_percentage"]) for item in events if item["event_type"] == "simulation_completed" and item["score_percentage"] is not None]

    subject_scores: dict[str, list[float]] = defaultdict(list)
    minutes_studied = 0
    for event in events:
        metadata = _event_metadata(event)
        minutes_studied += int(metadata.get("minutes_studied", 0) or 0)
        subject = (event.get("subject") or "").strip()
        if subject and event.get("score_percentage") is not None:
            subject_scores[subject].append(float(event["score_percentage"]))

    ranked_subjects = sorted(
        ((subject, _avg(scores)) for subject, scores in subject_scores.items()),
        key=lambda item: item[1],
    )
    weakest_subject = ranked_subjects[0][0] if ranked_subjects else None
    strongest_subject = ranked_subjects[-1][0] if ranked_subjects else None

    simulations = list_simulations_v2()
    avg_time_seconds = 0.0
    if simulations:
        first_sim = int(simulations[0]["id"])
        analytics = get_simulation_analytics_v2(first_sim, period_days=30)
        if analytics:
            avg_time_seconds = float(analytics.get("average_time_seconds") or 0.0)

    exam_analytics = get_user_exam_analytics(user_id)
    recent_exam_attempts = get_recent_exam_attempts(user_id, limit=2)
    low_exam = next((item for item in recent_exam_attempts if float(item.get("score_percentage", 0)) < 60), None)

    return {
        "weakest_subject": weakest_subject,
        "strongest_subject": strongest_subject,
        "exam_average": round(_avg(exam_scores), 2),
        "simulation_average": round(_avg(sim_scores), 2),
        "avg_time_seconds": round(avg_time_seconds, 2),
        "minutes_last_30_days": minutes_studied,
        "recent_low_exam": {
            "exam_id": low_exam["exam_id"],
            "title": low_exam.get("title"),
            "score_percentage": float(low_exam["score_percentage"]),
            "wrong_questions_count": len(low_exam.get("wrong_questions") or []),
        } if low_exam else None,
        "exam_analytics": exam_analytics,
    }


def build_advanced_next_action(user: dict) -> dict:
    user_id = int(user["id"])
    streak = get_hook_streak_stats(user_id)
    goal = get_hook_daily_goal(user_id)
    insights = build_recommendation_insights(user)
    events_72h = get_hook_recent_events(user_id, days=3)

    actions: list[dict] = []
    if streak.get("at_risk"):
        actions.append({
            "type": "streak_recovery",
            "priority": 1,
            "title": "Proteja sua streak agora",
            "description": "Sua sequência está em risco. Faça uma mini ação hoje para não quebrar o ritmo.",
            "cta_label": "Concluir mini ação",
            "cta_href": "/dashboard",
            "reason": "streak em risco",
        })

    if insights.get("recent_low_exam"):
        low_exam = insights["recent_low_exam"]
        actions.append({
            "type": "exam_review",
            "priority": 2,
            "title": "Revisar prova recente com baixo desempenho",
            "description": f"{low_exam['title']} ficou em {low_exam['score_percentage']:.1f}% com vários erros.",
            "cta_label": "Revisar prova",
            "cta_href": "/dashboard/provas/enem",
            "reason": "prova recente abaixo de 60%",
        })

    if insights.get("weakest_subject"):
        subject = insights["weakest_subject"]
        actions.append({
            "type": "weak_subject_review",
            "priority": 3,
            "title": "Reforçar sua disciplina mais fraca",
            "description": f"Seu pior desempenho recente está em {subject}. Priorize revisão temática.",
            "cta_label": "Fazer simulado temático",
            "cta_href": "/dashboard/simulados/resolver",
            "reason": "disciplina com menor média",
        })

    if goal["progress_questions"] < goal["target_questions"]:
        missing = goal["target_questions"] - goal["progress_questions"]
        actions.append({
            "type": "daily_goal",
            "priority": 5,
            "title": "Concluir missão diária de questões",
            "description": f"Faltam {missing} questões para fechar sua meta de hoje.",
            "cta_label": "Continuar agora",
            "cta_href": "/dashboard/simulados/resolver",
            "reason": "meta diária pendente",
        })

    if not events_72h:
        actions.append({
            "type": "return_flow",
            "priority": 6,
            "title": "Retome seu plano de estudos",
            "description": "Sem atividade recente. Uma sessão curta hoje já reativa seu progresso.",
            "cta_label": "Voltar a estudar",
            "cta_href": "/dashboard",
            "reason": "ausência de atividade recente",
        })

    selected = sorted(actions, key=lambda item: item["priority"])[0] if actions else {
        "type": "maintenance",
        "priority": 9,
        "title": "Mantenha consistência",
        "description": "Seu plano está em dia. Faça um mini simulado para acelerar evolução.",
        "cta_label": "Fazer mini simulado",
        "cta_href": "/dashboard/simulados",
        "reason": "manter progresso",
    }

    return selected


def build_guided_review(user: dict) -> dict:
    user_id = int(user["id"])
    is_pro = is_pro_user(user)
    attempts = get_recent_exam_attempts(user_id, limit=3)
    exam_items = []
    for attempt in attempts:
        wrong_items = (attempt.get("wrong_questions") or [])
        exam_items.append({
            "exam_id": attempt["exam_id"],
            "title": attempt.get("title"),
            "score_percentage": attempt.get("score_percentage"),
            "wrong_questions": wrong_items if is_pro else wrong_items[:2],
            "subject_breakdown": attempt.get("subject_breakdown") if is_pro else (attempt.get("subject_breakdown") or [])[:1],
        })

    sim_critical = []
    simulations = list_simulations_v2()
    if simulations:
        analytics = get_simulation_analytics_v2(int(simulations[0]["id"]), period_days=30)
        questions = (analytics or {}).get("questions") or []
        sim_critical = sorted(questions, key=lambda item: item["correct_rate"])[: (6 if is_pro else 2)]

    return {
        "premium_locked": not is_pro,
        "premium_message": "Desbloqueie Pro para revisão guiada completa." if not is_pro else None,
        "exam_reviews": exam_items,
        "critical_questions": sim_critical,
    }


def build_daily_missions(user: dict) -> dict:
    user_id = int(user["id"])
    goal = get_hook_daily_goal(user_id)
    insights = build_recommendation_insights(user)
    is_pro = is_pro_user(user)

    missions = [
        {
            "key": "questions",
            "title": "Responder 10 questões",
            "target": int(goal["target_questions"]),
            "progress": int(goal["progress_questions"]),
            "cta_href": "/dashboard/simulados/resolver",
        },
        {
            "key": "simulation",
            "title": "Concluir 1 simulado",
            "target": int(goal["target_simulations"]),
            "progress": int(goal["progress_simulations"]),
            "cta_href": "/dashboard/simulados",
        },
        {
            "key": "exam",
            "title": "Revisar prova recente",
            "target": 1,
            "progress": 1 if (insights.get("recent_low_exam") is None) else 0,
            "cta_href": "/dashboard/provas/enem",
        },
        {
            "key": "minutes",
            "title": "Estudar por minutos",
            "target": int(goal["target_minutes"]),
            "progress": int(goal["progress_minutes"]),
            "cta_href": "/dashboard",
        },
    ]

    if is_pro and insights.get("weakest_subject"):
        missions.append({
            "key": "weak_subject",
            "title": f"Revisar disciplina fraca: {insights['weakest_subject']}",
            "target": 1,
            "progress": 0,
            "cta_href": "/dashboard/simulados/resolver",
        })

    for mission in missions:
        mission["completed"] = mission["progress"] >= mission["target"]

    return {
        "premium_locked": False,
        "missions": missions,
    }


def build_smart_weekly_summary(user: dict) -> dict:
    user_id = int(user["id"])
    is_pro = is_pro_user(user)
    current_events = get_hook_recent_events(user_id, days=7)
    previous_events = [event for event in get_hook_recent_events(user_id, days=14) if event["created_at"] < (datetime.now(UTC) - timedelta(days=7)).isoformat()]

    def summarize(events: list[dict]) -> dict[str, Any]:
        questions = 0
        simulations = 0
        exams = 0
        scores = []
        minutes = 0
        subjects: dict[str, list[float]] = defaultdict(list)
        for event in events:
            metadata = _event_metadata(event)
            questions += int(metadata.get("questions_answered", 0) or 0)
            minutes += int(metadata.get("minutes_studied", 0) or 0)
            if event["event_type"] == "simulation_completed":
                simulations += 1
            if event["event_type"] == "exam_completed":
                exams += 1
            if event.get("score_percentage") is not None:
                score = float(event["score_percentage"])
                scores.append(score)
                subject = (event.get("subject") or "").strip()
                if subject:
                    subjects[subject].append(score)

        subject_rank = sorted(((k, _avg(v)) for k, v in subjects.items()), key=lambda item: item[1])
        return {
            "total_questions": questions,
            "simulations": simulations,
            "exams": exams,
            "avg_score": round(_avg(scores), 2),
            "minutes": minutes,
            "best_subject": subject_rank[-1][0] if subject_rank else None,
            "worst_subject": subject_rank[0][0] if subject_rank else None,
        }

    current = summarize(current_events)
    previous = summarize(previous_events)
    delta_score = round(current["avg_score"] - previous["avg_score"], 2)

    insight_message = (
        "Você melhorou em simulados, mas caiu em provas. Priorize revisão de prova."
        if current["simulations"] >= previous["simulations"] and current["exams"] <= previous["exams"]
        else "Seu gargalo principal foi tempo, não acerto."
        if current["minutes"] < 120 and current["avg_score"] < 65
        else "Boa semana. Mantenha consistência e foque na disciplina mais fraca."
    )

    if not is_pro:
        return {
            "premium_locked": True,
            "summary": {
                "total_questions": current["total_questions"],
                "simulations": current["simulations"],
                "exams": current["exams"],
                "avg_score": current["avg_score"],
            },
            "premium_message": "No Pro você vê evolução semanal inteligente e recomendações avançadas.",
        }

    return {
        "premium_locked": False,
        "summary": {
            **current,
            "delta_score_vs_previous_week": delta_score,
            "insight_message": insight_message,
            "next_week_recommendation": f"Priorize {current['worst_subject']} e revise provas com baixo desempenho." if current["worst_subject"] else "Mantenha rotina de simulados e revisão de erros.",
        },
    }
