const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;

  // Within this week — show day name (e.g. "Tuesday")
  if (diffDays < 7) return DAYS[date.getDay()];

  // Within last 2 weeks — show "Last week"
  if (diffDays < 14) return "Last week";

  // Older — US format: month then day (e.g. "January 15")
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}
