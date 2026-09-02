export interface MasteryTier {
  label: string;
  color: string;
}

// Belt-style progression: red -> gold -> orange -> black (fully mastered).
export function masteryTier(value: number): MasteryTier {
  if (value < 25) return { label: "Начальный уровень", color: "#AA0003" };
  if (value < 50) return { label: "В процессе", color: "#C9A227" };
  if (value < 75) return { label: "Уверенно", color: "#FF9500" };
  return { label: "Закреплено", color: "#0A0A0A" };
}
