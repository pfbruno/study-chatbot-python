"use client";

import { useEffect, useState } from "react";

export function useUserGoal() {
  const [goal, setGoal] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("MinhAprovação_goal");
    if (stored) setGoal(stored);
  }, []);

  const saveGoal = (value: string) => {
    localStorage.setItem("MinhAprovação_goal", value);
    setGoal(value);
  };

  return { goal, saveGoal };
}
