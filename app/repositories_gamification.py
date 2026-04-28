from __future__ import annotations

import json
from collections import defaultdict
from contextlib import closing
from datetime import UTC, date, datetime, timedelta
from statistics import mean
from typing import Any, Literal

from app.database import connect

LEVEL_XP_STEP = 800

ChallengeStatus = Literal["active", "ready_to_claim", "claimed", "completed", "locked"]


def _now_utc() -> datetime:
    return datetime.now(UTC)


def _today() -> date:
    return _now_utc().date()


def _now_iso() -> str:
    return _now_utc().isoformat()


def ensure_gamification_tables() -> None:
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS gamification_achievement_unlocks (
                    id BIGSERIAL PRIMARY KEY,
                    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    achievement_key TEXT NOT NULL,
                    xp_awarded INTEGER NOT NULL DEFAULT 0,
                    unlocked_at TEXT NOT NULL,
                    UNIQUE(user_id, achievement_key)
                )
                """
            )
            cursor.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_gamification_unlocks_user
                ON gamification_achievement_unlocks(user_id, unlocked_at DESC)
                """
            )

            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS gamification_challenge_tracking (
                    id BIGSERIAL PRIMARY KEY,
                    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    challenge_id TEXT NOT NULL,
                    is_tracked BOOLEAN NOT NULL DEFAULT FALSE,
                    claimed_at TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    UNIQUE(user_id, challenge_id)
                )
                """
            )
            cursor.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_gamification_tracking_user
                ON gamification_challenge_tracking(user_id, updated_at DESC)
                """
            )
        conn.commit()


def _safe_json(value: str | None) -> dict[str, Any]:
    if not value:
        return {}
    try:
        parsed = json.loads(value)
        return parsed if isinstance(parsed, dict) else {}
    except json.JSONDecodeError:
        return {}


def _parse_dt(value: str) -> datetime:
    parsed = datetime.fromisoformat(value)
    if parsed.tzinfo is None:
        return parsed.replace(tzinfo=UTC)
    return parsed.astimezone(UTC)


def _event_xp(event_type: str, metadata: dict[str, Any]) -> int:
    explicit = metadata.get("xp_reward")
    if isinstance(explicit, int):
        return max(0, explicit)

    if event_type == "exam_completed":
        return 220
    if event_type == "simulation_completed":
        return 140
    if event_type == "mini_action_completed":
        return 60
    if event_type == "review_completed":
        return 80
    if event_type == "study_plan_created":
        return 40

    questions_answered = metadata.get("questions_answered")
    if isinstance(questions_answered, int) and questions_answered > 0:
        return min(questions_answered * 2, 60)

    return 25


def _fetch_user_events(user_id: int, days: int | None = None) -> list[dict[str, Any]]:
    query = """
        SELECT id, user_id, event_type, subject, score_percentage, time_spent_seconds, metadata_json, created_at
        FROM hook_activity_events
        WHERE user_id = %s
    """
    params: list[Any] = [user_id]

    if days is not None:
        cutoff = (_now_utc() - timedelta(days=days)).isoformat()
        query += " AND created_at >= %s"
        params.append(cutoff)

    query += " ORDER BY created_at DESC"

    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(query, tuple(params))
            rows = cursor.fetchall()

    return [dict(row) for row in rows]


def _fetch_all_user_events(days: int | None = None) -> list[dict[str, Any]]:
    query = """
        SELECT
            hook_activity_events.user_id,
            hook_activity_events.event_type,
            hook_activity_events.subject,
            hook_activity_events.score_percentage,
            hook_activity_events.time_spent_seconds,
            hook_activity_events.metadata_json,
            hook_activity_events.created_at,
            users.name
        FROM hook_activity_events
        INNER JOIN users ON users.id = hook_activity_events.user_id
        WHERE users.is_active = 1
    """
    params: list[Any] = []

    if days is not None:
        cutoff = (_now_utc() - timedelta(days=days)).isoformat()
        query += " AND hook_activity_events.created_at >= %s"
        params.append(cutoff)

    query += " ORDER BY hook_activity_events.created_at DESC"

    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(query, tuple(params))
            rows = cursor.fetchall()

    return [dict(row) for row in rows]


def _fetch_active_users() -> list[dict[str, Any]]:
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT id, name
                FROM users
                WHERE is_active = 1
                ORDER BY id ASC
                """
            )
            rows = cursor.fetchall()

    return [dict(row) for row in rows]


def _fetch_unlocks(user_id: int) -> dict[str, dict[str, Any]]:
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT achievement_key, xp_awarded, unlocked_at
                FROM gamification_achievement_unlocks
                WHERE user_id = %s
                ORDER BY unlocked_at DESC
                """,
                (user_id,),
            )
            rows = cursor.fetchall()

    return {row["achievement_key"]: dict(row) for row in rows}


def _insert_unlock(user_id: int, achievement_key: str, xp_awarded: int) -> None:
    now = _now_iso()
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO gamification_achievement_unlocks (
                    user_id,
                    achievement_key,
                    xp_awarded,
                    unlocked_at
                )
                VALUES (%s, %s, %s, %s)
                ON CONFLICT(user_id, achievement_key) DO NOTHING
                """,
                (user_id, achievement_key, xp_awarded, now),
            )
        conn.commit()


def _fetch_recent_unlocks(user_id: int, limit: int = 5) -> list[dict[str, Any]]:
    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT achievement_key, xp_awarded, unlocked_at
                FROM gamification_achievement_unlocks
                WHERE user_id = %s
                ORDER BY unlocked_at DESC
                LIMIT %s
                """,
                (user_id, limit),
            )
            rows = cursor.fetchall()

    return [dict(row) for row in rows]


def _fetch_tracking_map(user_id: int) -> dict[str, dict[str, Any]]:
    ensure_gamification_tables()

    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                SELECT challenge_id, is_tracked, claimed_at, created_at, updated_at
                FROM gamification_challenge_tracking
                WHERE user_id = %s
                """,
                (user_id,),
            )
            rows = cursor.fetchall()

    return {row["challenge_id"]: dict(row) for row in rows}


def _upsert_tracked_challenge(user_id: int, challenge_id: str) -> None:
    ensure_gamification_tables()
    now = _now_iso()

    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO gamification_challenge_tracking (
                    user_id,
                    challenge_id,
                    is_tracked,
                    claimed_at,
                    created_at,
                    updated_at
                )
                VALUES (%s, %s, TRUE, NULL, %s, %s)
                ON CONFLICT (user_id, challenge_id)
                DO UPDATE SET
                    is_tracked = TRUE,
                    updated_at = EXCLUDED.updated_at
                """,
                (user_id, challenge_id, now, now),
            )
        conn.commit()


def _mark_claimed_challenge(user_id: int, challenge_id: str) -> None:
    ensure_gamification_tables()
    now = _now_iso()

    with closing(connect()) as conn:
        with conn.cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO gamification_challenge_tracking (
                    user_id,
                    challenge_id,
                    is_tracked,
                    claimed_at,
                    created_at,
                    updated_at
                )
                VALUES (%s, %s, TRUE, %s, %s, %s)
                ON CONFLICT (user_id, challenge_id)
                DO UPDATE SET
                    is_tracked = TRUE,
                    claimed_at = EXCLUDED.claimed_at,
                    updated_at = EXCLUDED.updated_at
                """,
                (user_id, challenge_id, now, now, now),
            )
        conn.commit()


def _compute_streak_from_dates(dates: set[date]) -> tuple[int, int]:
    if not dates:
        return 0, 0

    today = _today()

    current = 0
    cursor_date = today
    while cursor_date in dates:
        current += 1
        cursor_date -= timedelta(days=1)

    if current == 0:
        yesterday = today - timedelta(days=1)
        if yesterday in dates:
            current = 1

    best = 0
    run = 0
    previous: date | None = None

    for day in sorted(dates):
        if previous and (day - previous).days == 1:
            run += 1
        else:
            run = 1
        best = max(best, run)
        previous = day

    return current, best


def _level_from_xp(total_xp: int) -> tuple[int, int, int]:
    level = max(1, (total_xp // LEVEL_XP_STEP) + 1)
    xp_floor = (level - 1) * LEVEL_XP_STEP
    current_xp = total_xp - xp_floor
    next_level_xp = LEVEL_XP_STEP
    return level, current_xp, next_level_xp


def _summarize_user_events(events: list[dict[str, Any]]) -> dict[str, Any]:
    active_dates: set[date] = set()
    total_xp = 0
    scores: list[float] = []
    subject_counts: dict[str, int] = defaultdict(int)
    simulation_count = 0
    exam_count = 0
    flashcards_reviewed = 0
    plans_created = 0
    night_sessions = 0
    total_questions_answered = 0

    weekly_buckets: dict[str, int] = defaultdict(int)
    cutoff_7 = _today() - timedelta(days=6)

    for event in events:
        metadata = _safe_json(event.get("metadata_json"))
        event_type = str(event.get("event_type") or "")
        created_at_raw = event.get("created_at")
        if not created_at_raw:
            continue

        created_at = _parse_dt(created_at_raw)
        active_dates.add(created_at.date())

        xp = _event_xp(event_type, metadata)
        total_xp += xp

        if created_at.date() >= cutoff_7:
            weekly_buckets[created_at.date().isoformat()] += xp

        score = event.get("score_percentage")
        if isinstance(score, (int, float)):
            scores.append(float(score))

        subject = event.get("subject")
        if subject:
            subject_counts[str(subject)] += 1

        if event_type == "simulation_completed":
            simulation_count += 1
        if event_type == "exam_completed":
            exam_count += 1
        if event_type == "study_plan_created":
            plans_created += 1

        if created_at.hour >= 20:
            night_sessions += 1

        flashcards_value = metadata.get("flashcards_reviewed")
        if isinstance(flashcards_value, int):
            flashcards_reviewed += flashcards_value

        questions_value = metadata.get("questions_answered")
        if isinstance(questions_value, int):
            total_questions_answered += questions_value

    current_streak, best_streak = _compute_streak_from_dates(active_dates)
    level, current_xp, next_level_xp = _level_from_xp(total_xp)

    weekly_evolution = []
    for offset in range(6, -1, -1):
        day = _today() - timedelta(days=offset)
        label = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"][day.weekday()]
        weekly_evolution.append(
            {
                "label": label,
                "xp": weekly_buckets.get(day.isoformat(), 0),
                "date": day.isoformat(),
            }
        )

    return {
        "total_xp": total_xp,
        "level": level,
        "current_xp": current_xp,
        "next_level_xp": next_level_xp,
        "current_streak": current_streak,
        "best_streak": best_streak,
        "scores": scores,
        "average_accuracy": round(mean(scores), 1) if scores else 0.0,
        "best_score": round(max(scores), 1) if scores else 0.0,
        "subject_counts": dict(subject_counts),
        "simulation_count": simulation_count,
        "exam_count": exam_count,
        "flashcards_reviewed": flashcards_reviewed,
        "plans_created": plans_created,
        "night_sessions": night_sessions,
        "total_questions_answered": total_questions_answered,
        "weekly_evolution": weekly_evolution,
        "active_dates": active_dates,
    }


def _achievement_definitions(metrics: dict[str, Any], top10_reached: bool) -> list[dict[str, Any]]:
    biology_progress = metrics["subject_counts"].get("Biologia", 0)

    return [
        {
            "id": "first-question",
            "title": "Primeiro passo",
            "description": "Responda sua primeira questão na plataforma.",
            "rarity": "common",
            "category": "study",
            "xpReward": 40,
            "icon": "sparkles",
            "progress": min(metrics["total_questions_answered"], 1),
            "target": 1,
        },
        {
            "id": "five-simulations",
            "title": "Ritmo de treino",
            "description": "Conclua 5 simulados.",
            "rarity": "rare",
            "category": "performance",
            "xpReward": 180,
            "icon": "target",
            "progress": min(metrics["simulation_count"], 5),
            "target": 5,
        },
        {
            "id": "streak-7",
            "title": "Constância semanal",
            "description": "Mantenha 7 dias seguidos de estudo.",
            "rarity": "epic",
            "category": "consistency",
            "xpReward": 320,
            "icon": "flame",
            "progress": min(metrics["current_streak"], 7),
            "target": 7,
        },
        {
            "id": "accuracy-80",
            "title": "Precisão acadêmica",
            "description": "Atinga 80% de aproveitamento em uma prova completa.",
            "rarity": "epic",
            "category": "performance",
            "xpReward": 400,
            "icon": "trophy",
            "progress": min(int(metrics["best_score"]), 80),
            "target": 80,
        },
        {
            "id": "subject-master-bio",
            "title": "Mestre em Biologia",
            "description": "Complete 3 revisões fortes em Biologia com bom desempenho.",
            "rarity": "rare",
            "category": "study",
            "xpReward": 220,
            "icon": "brain",
            "progress": min(biology_progress, 3),
            "target": 3,
        },
        {
            "id": "night-owl",
            "title": "Coruja estratégica",
            "description": "Estude 10 noites com atividade registrada.",
            "rarity": "common",
            "category": "consistency",
            "xpReward": 100,
            "icon": "moon",
            "progress": min(metrics["night_sessions"], 10),
            "target": 10,
        },
        {
            "id": "perfect-review",
            "title": "Revisão impecável",
            "description": "Finalize uma revisão sem deixar pendências.",
            "rarity": "legendary",
            "category": "performance",
            "xpReward": 600,
            "icon": "crown",
            "progress": 1 if metrics["flashcards_reviewed"] >= 50 and metrics["best_score"] >= 80 else 0,
            "target": 1,
        },
        {
            "id": "community-rank",
            "title": "Presença no ranking",
            "description": "Entre no top 10 semanal da plataforma.",
            "rarity": "legendary",
            "category": "social",
            "xpReward": 700,
            "icon": "medal",
            "progress": 1 if top10_reached else 0,
            "target": 1,
        },
        {
            "id": "flashcards-50",
            "title": "Memória em ação",
            "description": "Revise 50 flashcards.",
            "rarity": "rare",
            "category": "study",
            "xpReward": 160,
            "icon": "layers",
            "progress": min(metrics["flashcards_reviewed"], 50),
            "target": 50,
        },
        {
            "id": "planner-master",
            "title": "Planejamento inteligente",
            "description": "Monte 4 ciclos de estudo completos.",
            "rarity": "common",
            "category": "study",
            "xpReward": 80,
            "icon": "calendar",
            "progress": min(metrics["plans_created"], 4),
            "target": 4,
        },
    ]


def _build_base_challenges(metrics: dict[str, Any], recent_events_7d: list[dict[str, Any]]) -> list[dict[str, Any]]:
    today_str = _today().isoformat()
    today_questions = 0
    today_flashcards = 0
    biology_sessions_week = 0
    xp_last_7 = 0
    exam_completed_recent = 0
    weekly_active_days = len(
        {_parse_dt(event["created_at"]).date().isoformat() for event in recent_events_7d if event.get("created_at")}
    )

    for event in recent_events_7d:
        metadata = _safe_json(event.get("metadata_json"))
        created_at = _parse_dt(event["created_at"])
        event_type = str(event.get("event_type") or "")
        xp_last_7 += _event_xp(event_type, metadata)

        if created_at.date().isoformat() == today_str:
            questions_answered = metadata.get("questions_answered")
            if isinstance(questions_answered, int):
                today_questions += questions_answered

            flashcards_reviewed = metadata.get("flashcards_reviewed")
            if isinstance(flashcards_reviewed, int):
                today_flashcards += flashcards_reviewed

        if str(event.get("subject") or "").lower() == "biologia":
            biology_sessions_week += 1

        if event_type == "exam_completed":
            exam_completed_recent += 1

    return [
        {
            "id": "daily-1",
            "title": "Sprint de 20 questões",
            "description": "Resolva 20 questões hoje para manter o ritmo e aumentar seu XP diário.",
            "type": "daily",
            "difficulty": "easy",
            "status": "completed" if today_questions >= 20 else "active",
            "progress": min(today_questions, 20),
            "target": 20,
            "xpReward": 90,
            "rewardLabel": "Bônus de consistência",
            "expiresIn": "Expira hoje",
            "icon": "target",
        },
        {
            "id": "daily-2",
            "title": "Revisão inteligente",
            "description": "Revise 10 flashcards hoje para consolidar memória de curto prazo.",
            "type": "daily",
            "difficulty": "easy",
            "status": "completed" if today_flashcards >= 10 else "active",
            "progress": min(today_flashcards, 10),
            "target": 10,
            "xpReward": 60,
            "rewardLabel": "Memória em ação",
            "expiresIn": "Expira hoje",
            "icon": "brain",
        },
        {
            "id": "weekly-1",
            "title": "Semana sem falhas",
            "description": "Estude por 7 dias seguidos e mantenha a sequência ativa até o final da semana.",
            "type": "weekly",
            "difficulty": "medium",
            "status": "completed" if weekly_active_days >= 7 else "active",
            "progress": min(weekly_active_days, 7),
            "target": 7,
            "xpReward": 280,
            "rewardLabel": "Selo de constância",
            "expiresIn": "Fecha no ciclo semanal",
            "icon": "flame",
        },
        {
            "id": "weekly-2",
            "title": "Domínio em Biologia",
            "description": "Complete 3 sessões fortes de Biologia com correção concluída.",
            "type": "weekly",
            "difficulty": "medium",
            "status": "completed" if biology_sessions_week >= 3 else "active",
            "progress": min(biology_sessions_week, 3),
            "target": 3,
            "xpReward": 220,
            "rewardLabel": "Boost temático",
            "expiresIn": "Fecha no ciclo semanal",
            "icon": "award",
        },
        {
            "id": "special-1",
            "title": "Maratona ENEM",
            "description": "Finalize uma prova oficial completa e gere materiais de revisão a partir do resultado.",
            "type": "special",
            "difficulty": "hard",
            "status": "completed" if exam_completed_recent >= 1 else "active",
            "progress": min(exam_completed_recent, 1),
            "target": 1,
            "xpReward": 420,
            "rewardLabel": "Baú premium",
            "expiresIn": "Evento ativo",
            "icon": "trophy",
        },
        {
            "id": "special-2",
            "title": "Ascensão no ranking",
            "description": "Ganhe 1500 XP na semana e entre na zona alta do ranking.",
            "type": "special",
            "difficulty": "hard",
            "status": "completed" if xp_last_7 >= 1500 else ("active" if xp_last_7 >= 500 else "locked"),
            "progress": min(xp_last_7, 1500),
            "target": 1500,
            "xpReward": 500,
            "rewardLabel": "Distintivo competitivo",
            "expiresIn": "Evento ativo",
            "icon": "rocket",
        },
    ]


def _apply_tracking_to_challenges(
    user_id: int,
    challenges: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    tracking_map = _fetch_tracking_map(user_id)
    normalized: list[dict[str, Any]] = []

    for challenge in challenges:
        item = dict(challenge)
        tracked = tracking_map.get(item["id"])
        item["isTracked"] = bool(tracked and tracked.get("is_tracked"))

        claimed_at = tracked.get("claimed_at") if tracked else None
        if claimed_at:
            item["status"] = "claimed"
        else:
            if item["status"] == "completed":
                item["status"] = "ready_to_claim"

        normalized.append(item)

    return normalized


def _build_challenges(
    user_id: int,
    metrics: dict[str, Any],
    recent_events_7d: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    base = _build_base_challenges(metrics, recent_events_7d)
    return _apply_tracking_to_challenges(user_id, base)


def get_gamification_summary(user_id: int, user_name: str) -> dict[str, Any]:
    ensure_gamification_tables()

    events = _fetch_user_events(user_id)
    recent_events_7d = _fetch_user_events(user_id, days=7)
    metrics = _summarize_user_events(events)

    weekly_ranking = get_gamification_ranking(scope="weekly", current_user_id=user_id)
    top10_reached = any(
        idx < 10 and item["id"] == f"user-{user_id}"
        for idx, item in enumerate(weekly_ranking["items"])
    )

    unlocks_before = _fetch_unlocks(user_id)
    achievement_defs = _achievement_definitions(metrics, top10_reached)

    for item in achievement_defs:
        if item["progress"] >= item["target"] and item["id"] not in unlocks_before:
            _insert_unlock(user_id, item["id"], item["xpReward"])

    unlocks = _fetch_unlocks(user_id)

    achievements = []
    for item in achievement_defs:
        unlocked = unlocks.get(item["id"])
        status: Literal["unlocked", "in_progress", "locked"]
        if unlocked:
            status = "unlocked"
        elif item["progress"] > 0:
            status = "in_progress"
        else:
            status = "locked"

        achievements.append(
            {
                **item,
                "status": status,
                "unlockedAt": unlocked["unlocked_at"] if unlocked else None,
            }
        )

    recent_unlock_rows = _fetch_recent_unlocks(user_id)
    recent_unlocks = []
    achievement_map = {item["id"]: item for item in achievement_defs}
    for row in recent_unlock_rows:
        source = achievement_map.get(row["achievement_key"])
        if not source:
            continue
        recent_unlocks.append(
            {
                "id": row["achievement_key"],
                "title": source["title"],
                "rarity": source["rarity"],
                "unlockedAt": row["unlocked_at"],
                "xpReward": row["xp_awarded"],
            }
        )

    challenges = _build_challenges(user_id, metrics, recent_events_7d)
    completed_challenges = sum(1 for item in challenges if item["status"] in {"ready_to_claim", "claimed"})
    unlocked_count = sum(1 for item in achievements if item["status"] == "unlocked")

    return {
        "profile": {
            "userName": user_name,
            "level": metrics["level"],
            "currentXP": metrics["current_xp"],
            "nextLevelXP": metrics["next_level_xp"],
            "totalXP": metrics["total_xp"],
            "streakDays": metrics["current_streak"],
            "completedChallenges": completed_challenges,
            "unlockedAchievements": unlocked_count,
            "totalAchievements": len(achievements),
        },
        "achievements": achievements,
        "recentUnlocks": recent_unlocks,
        "weeklyEvolution": [
            {"label": item["label"], "xp": item["xp"]}
            for item in metrics["weekly_evolution"]
        ],
        "challenges": challenges,
    }


def track_gamification_challenge(
    user_id: int,
    user_name: str,
    challenge_id: str,
) -> dict[str, Any]:
    summary_before = get_gamification_summary(user_id, user_name)
    challenge = next(
        (item for item in summary_before["challenges"] if item["id"] == challenge_id),
        None,
    )
    if not challenge:
        raise ValueError("Desafio não encontrado.")

    _upsert_tracked_challenge(user_id, challenge_id)

    summary_after = get_gamification_summary(user_id, user_name)
    updated_challenge = next(
        (item for item in summary_after["challenges"] if item["id"] == challenge_id),
        None,
    )

    return {
        "message": "Desafio marcado para acompanhamento.",
        "action": "track",
        "challenge": updated_challenge,
        "summary": summary_after,
    }


def claim_gamification_challenge(
    user_id: int,
    user_name: str,
    challenge_id: str,
) -> dict[str, Any]:
    summary_before = get_gamification_summary(user_id, user_name)
    challenge = next(
        (item for item in summary_before["challenges"] if item["id"] == challenge_id),
        None,
    )
    if not challenge:
        raise ValueError("Desafio não encontrado.")

    if challenge["status"] == "claimed":
        raise ValueError("Este desafio já foi resgatado.")

    if challenge["status"] != "ready_to_claim":
        raise ValueError("Este desafio ainda não está pronto para resgate.")

    _mark_claimed_challenge(user_id, challenge_id)

    summary_after = get_gamification_summary(user_id, user_name)
    updated_challenge = next(
        (item for item in summary_after["challenges"] if item["id"] == challenge_id),
        None,
    )

    return {
        "message": "Recompensa resgatada com sucesso.",
        "action": "claim",
        "challenge": updated_challenge,
        "summary": summary_after,
    }


def _scope_days(scope: Literal["weekly", "monthly", "global"]) -> int | None:
    if scope == "weekly":
        return 7
    if scope == "monthly":
        return 30
    return None


def _movement_from_xp(current_xp: int, previous_xp: int) -> Literal["up", "down", "same"]:
    if current_xp > previous_xp:
        return "up"
    if current_xp < previous_xp:
        return "down"
    return "same"


def get_gamification_ranking(
    scope: Literal["weekly", "monthly", "global"],
    current_user_id: int | None = None,
) -> dict[str, Any]:
    ensure_gamification_tables()

    current_days = _scope_days(scope)
    current_events = _fetch_all_user_events(current_days)

    previous_events: list[dict[str, Any]] = []
    if scope == "weekly":
        previous_events = [
            row
            for row in _fetch_all_user_events(days=14)
            if (_today() - timedelta(days=13))
            <= _parse_dt(row["created_at"]).date()
            <= (_today() - timedelta(days=7))
        ]
    elif scope == "monthly":
        previous_events = [
            row
            for row in _fetch_all_user_events(days=60)
            if (_today() - timedelta(days=59))
            <= _parse_dt(row["created_at"]).date()
            <= (_today() - timedelta(days=30))
        ]

    users = _fetch_active_users()
    current_by_user: dict[int, list[dict[str, Any]]] = defaultdict(list)
    previous_by_user: dict[int, list[dict[str, Any]]] = defaultdict(list)

    for row in current_events:
        current_by_user[int(row["user_id"])].append(row)

    for row in previous_events:
        previous_by_user[int(row["user_id"])].append(row)

    items = []
    for user in users:
        user_id = int(user["id"])
        events = current_by_user.get(user_id, [])
        metrics = _summarize_user_events(events)
        previous_metrics = _summarize_user_events(previous_by_user.get(user_id, []))

        if scope != "global" and metrics["total_xp"] == 0:
            continue

        items.append(
            {
                "id": f"user-{user_id}",
                "name": user["name"],
                "xp": metrics["total_xp"],
                "streak": metrics["current_streak"],
                "completedChallenges": sum(
                    1
                    for item in _build_base_challenges(metrics, events)
                    if item["status"] == "completed"
                ),
                "accuracy": round(metrics["average_accuracy"]),
                "level": metrics["level"],
                "movement": _movement_from_xp(
                    metrics["total_xp"], previous_metrics["total_xp"]
                ) if scope != "global" else "same",
                "avatar": "".join(part[0] for part in user["name"].split()[:2]).upper() or "ST",
                "highlight": current_user_id == user_id,
            }
        )

    items.sort(key=lambda item: (-item["xp"], -item["accuracy"], item["name"].lower()))

    return {
        "scope": scope,
        "items": items[:50],
    }