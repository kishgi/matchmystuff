export function formatAdminDate(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatScore(score: number) {
  return `${(score * 100).toFixed(1)}%`;
}
