// Human-friendly accuracy formatting. Clamps unrealistic values and rounds
// to meaningful units so we never surface something like "±100000 m".
export function formatAccuracy(accuracy: number | null | undefined): string {
  if (accuracy == null || !isFinite(accuracy) || accuracy <= 0) return "…";
  // Clamp: anything above 5 km is effectively "no fix"; show as low precision.
  if (accuracy > 5000) return "low precision";
  if (accuracy >= 1000) return `±${(accuracy / 1000).toFixed(1)} km`;
  if (accuracy >= 100) return `±${Math.round(accuracy / 10) * 10} m`;
  if (accuracy >= 10) return `±${Math.round(accuracy)} m`;
  return `±${accuracy.toFixed(1)} m`;
}

export function accuracyQuality(accuracy: number | null | undefined): "excellent" | "good" | "fair" | "poor" | "none" {
  if (accuracy == null || !isFinite(accuracy) || accuracy <= 0) return "none";
  if (accuracy <= 20) return "excellent";
  if (accuracy <= 50) return "good";
  if (accuracy <= 200) return "fair";
  return "poor";
}
