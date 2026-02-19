import type { FeedItem } from "@/types/feed";

/**
 * Selects the "desk pile" — high-priority items an executive assistant
 * would drop on your desk to start the day.
 *
 * Filters to high priority only, sorted by:
 * 1. Unread before read
 * 2. Newest timestamp first
 */
export function selectDeskPile(items: FeedItem[]): FeedItem[] {
  return items
    .filter((item) => item.priority === "high" && item.type === "agent-opportunity")
    .sort((a, b) => {
      if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
}
