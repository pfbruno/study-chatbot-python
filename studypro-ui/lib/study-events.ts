import { AUTH_TOKEN_KEY } from "@/lib/api"

type StudyEventType =
  | "study_goal_selected"
  | "study_session_started"
  | "study_session_completed"
  | "question_answered"
  | "question_correct"
  | "question_wrong"
  | "question_skipped"
  | "simulation_generated"
  | "simulation_started"
  | "simulation_completed"
  | "simulation_abandoned"
  | "exam_started"
  | "exam_completed"
  | "exam_corrected"
  | "flashcard_reviewed"
  | "flashcard_mastered"
  | "summary_opened"
  | "revision_session_completed"
  | "mindmap_opened"
  | "chat_question_sent"
  | "chat_study_doubt_resolved"
  | "chat_generated_simulation"
  | "chat_generated_review"
  | "study_plan_created"
  | "study_plan_completed"
  | "first_activity_of_day"
  | "streak_day_registered"
  | "streak_milestone_reached"
  | "daily_goal_completed"
  | "weekly_goal_completed"
  | "xp_earned"
  | "level_up"
  | "achievement_unlocked"
  | "challenge_completed"
  | "reward_claimed"
  | "ranking_position_improved"
  | "top10_reached"
  | "top3_reached"

type TrackStudyEventInput = {
  eventType: StudyEventType
  module: string
  subject?: string | null
  scorePercentage?: number | null
  timeSpentSeconds?: number | null
  metadata?: Record<string, unknown>
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ||
  "https://study-chatbot-python.onrender.com"

function getToken() {
  if (typeof window === "undefined") return null
  return localStorage.getItem(AUTH_TOKEN_KEY)
}

export async function trackStudyEvent(input: TrackStudyEventInput) {
  const token = getToken()
  if (!token) return

  try {
    await fetch(`${API_URL}/activity/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        event_type: input.eventType,
        module: input.module,
        subject: input.subject ?? null,
        score_percentage: input.scorePercentage ?? null,
        time_spent_seconds: input.timeSpentSeconds ?? null,
        metadata_json: input.metadata ?? {},
      }),
      cache: "no-store",
    })
  } catch {
    // evento de telemetria/gamificação não deve quebrar a UX principal
  }
}

export async function trackAttemptSaved(input: {
  module: "simulados" | "provas"
  title: string
  scorePercentage: number
  correctAnswers: number
  totalQuestions: number
  subjects?: Array<{
    subject: string
    accuracyPercentage: number
  }>
}) {
  const eventType =
    input.module === "simulados" ? "simulation_completed" : "exam_completed"

  await trackStudyEvent({
    eventType,
    module: input.module,
    subject: input.subjects?.[0]?.subject ?? null,
    scorePercentage: input.scorePercentage,
    metadata: {
      title: input.title,
      questions_answered: input.totalQuestions,
      correct_answers: input.correctAnswers,
      wrong_answers: Math.max(0, input.totalQuestions - input.correctAnswers),
      subject_breakdown: input.subjects ?? [],
    },
  })
}