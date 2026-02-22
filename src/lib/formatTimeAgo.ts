const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatTime(date: Date): string {
  let hours = date.getHours();
  const mins = date.getMinutes();
  const ampm = hours >= 12 ? "pm" : "am";
  hours = hours % 12 || 12;
  const minStr = mins < 10 ? `0${mins}` : `${mins}`;
  return `${hours}:${minStr}${ampm}`;
}

export function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;

  // Today — show time (e.g. "10:12am")
  if (isSameDay(date, now)) return formatTime(date);

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) return "Yesterday";

  // Within this week — show day name (e.g. "Tuesday")
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 7) return DAYS[date.getDay()];

  // Within last 2 weeks — show "Last week"
  if (diffDays < 14) return "Last week";

  // Older — US format: month then day (e.g. "January 15")
  return `${MONTHS[date.getMonth()]} ${date.getDate()}`;
}
