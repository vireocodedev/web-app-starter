export const defaultEstimate = {
  hourlyRate: 75,
  hours: 8,
} as const;

export type EstimatePersistenceStatus = "idle" | "saved" | "unavailable";
