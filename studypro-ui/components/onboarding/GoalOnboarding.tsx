"use client";

import { useUserGoal } from "@/hooks/useUserGoal";

const goals = ["ENEM", "Vestibular", "Concurso", "Faculdade"];

export default function GoalOnboarding() {
  const { saveGoal } = useUserGoal();

  return (
    <div className="flex flex-col items-center justify-center h-full gap-6">
      <h1 className="text-2xl font-bold">
        Qual é o seu objetivo principal?
      </h1>

      <div className="grid grid-cols-2 gap-4">
        {goals.map((g) => (
          <button
            key={g}
            onClick={() => saveGoal(g)}
            className="px-6 py-4 rounded-xl border hover:bg-black hover:text-white transition"
          >
            {g}
          </button>
        ))}
      </div>
    </div>
  );
}