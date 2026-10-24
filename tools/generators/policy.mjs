export const compatibilityWeights = Object.freeze({ architecture: 30, conventions: 25, coverage: 25, workflow: 20 });

export function assessCompatibility(assessment, threshold = 80) {
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100)
    throw new Error("Compatibility threshold must be between 0 and 100.");
  if (
    !Array.isArray(assessment.disqualifiers) ||
    assessment.disqualifiers.some(value => typeof value !== "string" || !value.trim())
  ) {
    throw new Error("Assessment requires a disqualifiers array (empty when none apply).");
  }
  let score = 0;
  for (const [criterion, weight] of Object.entries(compatibilityWeights)) {
    const value = assessment[criterion];
    if (
      !value ||
      !Number.isFinite(value.score) ||
      value.score < 0 ||
      value.score > 100 ||
      typeof value.evidence !== "string" ||
      !value.evidence.trim()
    ) {
      throw new Error(`Assessment requires ${criterion}: { score: 0..100, evidence: nonempty string }.`);
    }
    score += (value.score * weight) / 100;
  }
  score = Math.round(score * 100) / 100;
  return {
    score,
    threshold,
    mandatory: assessment.disqualifiers.length === 0 && score >= threshold,
    disqualifiers: assessment.disqualifiers,
    criteria: Object.fromEntries(Object.keys(compatibilityWeights).map(key => [key, assessment[key]])),
  };
}
