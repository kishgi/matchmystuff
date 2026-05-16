export function timeAgo(timestamp: number): string {
  const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24));
  if (days < 1) return "Today";
  return `${days} day${days === 1 ? "" : "s"} ago`;
}
