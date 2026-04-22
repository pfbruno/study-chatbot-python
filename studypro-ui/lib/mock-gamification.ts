export type AchievementRarity = "common" | "rare" | "epic" | "legendary";
export type AchievementStatus = "unlocked" | "in_progress" | "locked";

export type AchievementItem = {
  id: string;
  title: string;
  description: string;
  rarity: AchievementRarity;
  category: "study" | "consistency" | "performance" | "social";
  xpReward: number;
  progress: number;
  target: number;
  status: AchievementStatus;
  unlockedAt?: string | null;
  icon: string;
};

export type GamificationProfile = {
  userName: string;
  level: number;
  currentXP: number;
  nextLevelXP: number;
  totalXP: number;
  streakDays: number;
  completedChallenges: number;
  unlockedAchievements: number;
  totalAchievements: number;
};

export type RecentUnlock = {
  id: string;
  title: string;
  rarity: AchievementRarity;
  unlockedAt: string;
  xpReward: number;
};

export type WeeklyEvolutionPoint = {
  label: string;
  xp: number;
};

export const gamificationProfile: GamificationProfile = {
  userName: "Bruno",
  level: 7,
  currentXP: 860,
  nextLevelXP: 1200,
  totalXP: 5480,
  streakDays: 9,
  completedChallenges: 18,
  unlockedAchievements: 14,
  totalAchievements: 36,
};

export const achievements: AchievementItem[] = [
  {
    id: "first-question",
    title: "Primeiro passo",
    description: "Responda sua primeira questão na plataforma.",
    rarity: "common",
    category: "study",
    xpReward: 40,
    progress: 1,
    target: 1,
    status: "unlocked",
    unlockedAt: "2026-04-10T18:30:00.000Z",
    icon: "sparkles",
  },
  {
    id: "five-simulations",
    title: "Ritmo de treino",
    description: "Conclua 5 simulados.",
    rarity: "rare",
    category: "performance",
    xpReward: 180,
    progress: 5,
    target: 5,
    status: "unlocked",
    unlockedAt: "2026-04-18T20:10:00.000Z",
    icon: "target",
  },
  {
    id: "streak-7",
    title: "Constância semanal",
    description: "Mantenha 7 dias seguidos de estudo.",
    rarity: "epic",
    category: "consistency",
    xpReward: 320,
    progress: 7,
    target: 7,
    status: "unlocked",
    unlockedAt: "2026-04-21T08:00:00.000Z",
    icon: "flame",
  },
  {
    id: "accuracy-80",
    title: "Precisão acadêmica",
    description: "Atinga 80% de aproveitamento em uma prova completa.",
    rarity: "epic",
    category: "performance",
    xpReward: 400,
    progress: 62,
    target: 80,
    status: "in_progress",
    unlockedAt: null,
    icon: "trophy",
  },
  {
    id: "subject-master-bio",
    title: "Mestre em Biologia",
    description: "Complete 3 revisões fortes em Biologia com bom desempenho.",
    rarity: "rare",
    category: "study",
    xpReward: 220,
    progress: 2,
    target: 3,
    status: "in_progress",
    unlockedAt: null,
    icon: "brain",
  },
  {
    id: "night-owl",
    title: "Coruja estratégica",
    description: "Estude 10 noites com atividade registrada.",
    rarity: "common",
    category: "consistency",
    xpReward: 100,
    progress: 10,
    target: 10,
    status: "unlocked",
    unlockedAt: "2026-04-19T23:10:00.000Z",
    icon: "moon",
  },
  {
    id: "perfect-review",
    title: "Revisão impecável",
    description: "Finalize uma revisão sem deixar pendências.",
    rarity: "legendary",
    category: "performance",
    xpReward: 600,
    progress: 0,
    target: 1,
    status: "locked",
    unlockedAt: null,
    icon: "crown",
  },
  {
    id: "community-rank",
    title: "Presença no ranking",
    description: "Entre no top 10 semanal da plataforma.",
    rarity: "legendary",
    category: "social",
    xpReward: 700,
    progress: 0,
    target: 1,
    status: "locked",
    unlockedAt: null,
    icon: "medal",
  },
  {
    id: "flashcards-50",
    title: "Memória em ação",
    description: "Revise 50 flashcards.",
    rarity: "rare",
    category: "study",
    xpReward: 160,
    progress: 36,
    target: 50,
    status: "in_progress",
    unlockedAt: null,
    icon: "layers",
  },
  {
    id: "planner-master",
    title: "Planejamento inteligente",
    description: "Monte 4 ciclos de estudo completos.",
    rarity: "common",
    category: "study",
    xpReward: 80,
    progress: 4,
    target: 4,
    status: "unlocked",
    unlockedAt: "2026-04-17T14:15:00.000Z",
    icon: "calendar",
  },
];

export const recentUnlocks: RecentUnlock[] = [
  {
    id: "streak-7",
    title: "Constância semanal",
    rarity: "epic",
    unlockedAt: "2026-04-21T08:00:00.000Z",
    xpReward: 320,
  },
  {
    id: "night-owl",
    title: "Coruja estratégica",
    rarity: "common",
    unlockedAt: "2026-04-19T23:10:00.000Z",
    xpReward: 100,
  },
  {
    id: "five-simulations",
    title: "Ritmo de treino",
    rarity: "rare",
    unlockedAt: "2026-04-18T20:10:00.000Z",
    xpReward: 180,
  },
];

export const weeklyEvolution: WeeklyEvolutionPoint[] = [
  { label: "Seg", xp: 120 },
  { label: "Ter", xp: 260 },
  { label: "Qua", xp: 180 },
  { label: "Qui", xp: 340 },
  { label: "Sex", xp: 420 },
  { label: "Sáb", xp: 280 },
  { label: "Dom", xp: 390 },
];